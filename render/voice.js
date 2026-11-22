// Voix d'un storyboard : génère chaque réplique, mesure sa vraie durée, recalcule les scènes,
// synchronise bouches et sous-titres, puis assemble une piste voix unique.
import { spawnSync } from 'node:child_process';
import { synthesize, detectTtsProviders, chooseProvider, SAMPLE_RATE } from './tts/index.js';
import { timeChunks, collectCues, toSrt } from '../engine/audio/subtitles.js';
import { DEFAULT_VOICE_PROFILES } from '../engine/voices.js';
import { estimateSpeechSeconds } from '../engine/scenes/compose.js';

export const TIMING = { lead: 0.2, gap: 0.25, tail: 0.45, minScene: 2.0, minTotal: 30, maxTotal: 60 };

function profileFor(characterId, characters, profiles, fallback = 'narrator') {
  const c = characters.find((x) => x.id === characterId);
  const id = c?.voiceProfile || fallback;
  return profiles.find((p) => p.id === id) || profiles.find((p) => p.id === fallback) || DEFAULT_VOICE_PROFILES[0];
}

/** Personnage qui dit la narration à l'écran (le Guide dans Explainer/Facts), sinon voix off. */
function narratorOnScreen(scene, characters) {
  return scene.character_ids.find((id) => characters.find((c) => c.id === id)?.role === 'narrator') || null;
}

/**
 * Applique les voix. Ne lève pas d'erreur si aucun moteur ne marche : la vidéo est produite sans voix et c'est signalé.
 * Renvoie { storyboard, segments, report }.
 */
export function applyVoices(storyboardIn, { characters, profiles = DEFAULT_VOICE_PROFILES, preference = 'auto', maxChars = 42, onProgress } = {}) {
  const sb = structuredClone(storyboardIn);
  const detected = detectTtsProviders();
  let provider = chooseProvider(preference, detected);
  const report = { provider, detected, generated: 0, cached: 0, failures: [], warnings: [] };
  if (provider === 'none') report.warnings.push('Aucun moteur vocal disponible : vidéo produite sans voix (sous-titres seulement).');
  if (provider === 'espeak') report.warnings.push('Piper indisponible : voix de secours eSpeak NG (robotique).');

  const segments = [];
  let sceneStart = 0;
  const total = sb.scenes.reduce((a, s) => a + s.dialogue.length + (s.narration ? 1 : 0), 0);
  let done = 0;
  for (const scene of sb.scenes) {
    const lines = [
      ...scene.dialogue.map((d, i) => ({ kind: 'dialogue', index: i, text: d.text, speaker: d.character_id })),
      ...(scene.narration ? [{ kind: 'narration', text: scene.narration, speaker: narratorOnScreen(scene, characters) }] : []),
    ];
    let t = TIMING.lead;
    const timings = { dialogue: [], narration: null };
    const chunks = [];
    for (const line of lines) {
      const profile = line.kind === 'narration' && !line.speaker ? profiles.find((p) => p.id === 'narrator') || profiles[0] : profileFor(line.speaker, characters, profiles);
      let audio = null;
      if (provider !== 'none') {
        try {
          audio = synthesize(line.text, profile, { provider });
        } catch (e) {
          report.failures.push({ scene: scene.scene_id, text: line.text, error: e.message });
          // Repli immédiat sur eSpeak pour cette réplique si Piper échoue.
          if (provider === 'piper' && detected.espeak.ok) {
            try { audio = synthesize(line.text, profile, { provider: 'espeak' }); report.warnings.push(`Scène ${scene.scene_id} : réplique générée avec eSpeak NG après un échec de Piper.`); } catch { /* reste sans voix */ }
          }
        }
      }
      const duration = audio ? audio.duration : estimateSpeechSeconds(line.text);
      if (audio) { audio.cached ? report.cached++ : report.generated++; }
      const timing = { start: Math.round(t * 1000) / 1000, duration: Math.round(duration * 1000) / 1000, speaker: line.speaker, profile: profile.id };
      if (line.kind === 'dialogue') timings.dialogue[line.index] = timing; else timings.narration = timing;
      chunks.push(...timeChunks(line.text, t, duration, maxChars));
      if (audio) segments.push({ file: audio.file, start: sceneStart + t, duration, scene: scene.scene_id, kind: line.kind, text: line.text });
      t += duration + TIMING.gap;
      onProgress?.(++done, total);
    }
    const audioEnd = t - TIMING.gap;
    scene.timings = timings;
    scene.subtitle_chunks = chunks;
    scene.audio_end = Math.round(audioEnd * 1000) / 1000;
    scene.duration = Math.round(Math.max(TIMING.minScene, audioEnd + TIMING.tail) * 100) / 100;
    sceneStart += scene.duration;
  }

  // Durée totale : minimum 30 s (on allonge les fins de scène, jamais la parole).
  let totalDur = sb.scenes.reduce((a, s) => a + s.duration, 0);
  if (totalDur < TIMING.minTotal) {
    const extra = (TIMING.minTotal - totalDur) / sb.scenes.length;
    for (const s of sb.scenes) s.duration = Math.round((s.duration + extra) * 100) / 100;
    report.warnings.push(`Texte court : pauses allongées pour atteindre ${TIMING.minTotal} s.`);
  }
  // Recalcule les instants absolus des segments après d'éventuels ajustements.
  let acc = 0;
  const startOf = {};
  for (const s of sb.scenes) { startOf[s.scene_id] = acc; acc += s.duration; }
  for (const seg of segments) {
    const s = sb.scenes.find((x) => x.scene_id === seg.scene);
    const local = seg.kind === 'narration' ? s.timings.narration.start : s.timings.dialogue[s.dialogue.findIndex((d) => d.text === seg.text)].start;
    seg.start = Math.round((startOf[seg.scene] + local) * 1000) / 1000;
  }
  totalDur = Math.round(acc * 100) / 100;
  sb.duration = totalDur;
  if (totalDur > TIMING.maxTotal) report.warnings.push(`Durée ${totalDur} s supérieure à ${TIMING.maxTotal} s.`);
  sb.voice = { provider, profiles: [...new Set(segments.length ? Object.values(sb.scenes).flatMap((s) => [s.timings.narration?.profile, ...s.timings.dialogue.map((d) => d?.profile)]).filter(Boolean) : [])] };
  report.duration = totalDur;
  report.segments = segments.length;
  return { storyboard: sb, segments, report };
}

/** Assemble les répliques en une piste voix WAV de la durée exacte de la vidéo. */
export function buildVoiceTrack(segments, totalDuration, outFile) {
  if (!segments.length) {
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `anullsrc=r=${SAMPLE_RATE}:cl=mono`, '-t', String(totalDuration), '-c:a', 'pcm_s16le', outFile], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr);
    return outFile;
  }
  const inputs = segments.flatMap((s) => ['-i', s.file]);
  const delayed = segments.map((s, i) => `[${i}:a]adelay=${Math.round(s.start * 1000)}:all=1[a${i}]`).join(';');
  const mix = `${segments.map((_, i) => `[a${i}]`).join('')}amix=inputs=${segments.length}:normalize=0:dropout_transition=0,apad,atrim=0:${totalDuration}[out]`;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${delayed};${mix}`, '-map', '[out]', '-ar', String(SAMPLE_RATE), '-ac', '1', '-c:a', 'pcm_s16le', outFile], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`ffmpeg (piste voix) : ${r.stderr}`);
  return outFile;
}

export function storyboardSrt(storyboard) {
  return toSrt(collectCues(storyboard));
}
