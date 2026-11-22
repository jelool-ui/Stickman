// Contrôle qualité automatique d'une vidéo produite. Chaque contrôle donne { id, label, ok, value, expected }.
// Une vidéo qui échoue à un contrôle bloquant est marquée « échouée ».
import { spawnSync } from 'node:child_process';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { measureLoudness } from './audio/mix.js';

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', '-count_packets', file], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout);
}

function parseSrt(text) {
  const toSec = (s) => { const [h, m, rest] = s.split(':'); const [sec, ms] = rest.split(','); return +h * 3600 + +m * 60 + +sec + +ms / 1000; };
  return text.trim().split(/\n\s*\n/).map((block) => {
    const lines = block.split('\n');
    const [a, b] = (lines[1] || '').split(' --> ');
    return { index: Number(lines[0]), start: toSec(a || '0:0:0,0'), end: toSec(b || '0:0:0,0'), text: lines.slice(2).join(' ') };
  });
}

/**
 * Coupures audio involontaires dans la piste voix. Les pauses naturelles entre deux phrases (≈ 0,3 à 0,7 s) sont
 * normales. Est une coupure : un silence d'au moins 0,9 s au milieu d'une réplique, ou une réplique muette à plus de 50 %.
 */
export function voiceDropouts(voiceFile, storyboard) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', voiceFile, '-af', 'silencedetect=noise=-45dB:d=0.3', '-f', 'null', '-'], { encoding: 'utf8' });
  const silences = [];
  const re = /silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g;
  let m;
  while ((m = re.exec(r.stderr))) silences.push([Number(m[1]), Number(m[2])]);
  const problems = [];
  let t = 0;
  for (const s of storyboard.scenes) {
    for (const d of [...(s.timings?.dialogue || []), s.timings?.narration].filter(Boolean)) {
      const a = t + d.start + 0.1, b = t + d.start + d.duration - 0.1;
      const inside = silences.map(([x, y]) => [Math.max(x, a), Math.min(y, b)]).filter(([x, y]) => y > x);
      const silentPart = inside.reduce((acc, [x, y]) => acc + (y - x), 0) / Math.max(0.1, b - a);
      for (const [x, y] of inside) if (y - x >= 0.9) problems.push([x, y]);
      if (silentPart > 0.5) problems.push([a, b]);
    }
    t += s.duration;
  }
  return problems;
}

function blackFrames(video) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', video, '-vf', 'blackdetect=d=0.4:pix_th=0.08', '-an', '-f', 'null', '-'], { encoding: 'utf8' });
  return [...r.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

/**
 * files : { video, srt, voice } ; expected : { width, height, fps, minDuration, maxDuration } ; storyboard : storyboard final.
 */
export function runQualityChecks({ files, storyboard, expected = {} }) {
  const exp = { width: 1080, height: 1920, fps: 30, minDuration: 30, maxDuration: 60, requireVoice: true, ...expected };
  const checks = [];
  const add = (id, label, ok, value, expectedValue, blocking = true) => checks.push({ id, label, ok: Boolean(ok), value, expected: expectedValue, blocking });

  const exists = files.video && existsSync(files.video);
  const size = exists ? statSync(files.video).size : 0;
  add('file_exists', 'Fichier MP4 présent', exists, files.video, 'fichier existant');
  add('file_not_empty', 'Fichier non vide', size > 10_000, `${Math.round(size / 1024)} Ko`, '> 10 Ko');
  if (!exists || size <= 10_000) return finish(checks);

  const p = probe(files.video);
  const v = p.streams.find((s) => s.codec_type === 'video');
  const a = p.streams.find((s) => s.codec_type === 'audio');
  const dur = Number(p.format.duration);
  const [fn, fd] = (v?.r_frame_rate || '0/1').split('/').map(Number);
  const fps = fd ? fn / fd : 0;
  add('video_codec', 'Codec vidéo H.264', v?.codec_name === 'h264', v?.codec_name, 'h264');
  add('resolution', 'Résolution', v?.width === exp.width && v?.height === exp.height, `${v?.width}×${v?.height}`, `${exp.width}×${exp.height}`);
  add('vertical', 'Format vertical 9:16', v && v.height > v.width && Math.abs(v.width / v.height - 9 / 16) < 0.01, v ? (v.width / v.height).toFixed(4) : null, (9 / 16).toFixed(4));
  add('fps', 'Images par seconde', Math.abs(fps - exp.fps) < 0.01, fps, exp.fps);
  add('pix_fmt', 'Pixels compatibles (yuv420p)', v?.pix_fmt === 'yuv420p', v?.pix_fmt, 'yuv420p');
  add('duration', 'Durée', dur >= exp.minDuration - 0.2 && dur <= exp.maxDuration + 0.2, Math.round(dur * 100) / 100, `${exp.minDuration}–${exp.maxDuration} s`);
  add('duration_matches', 'Durée conforme au storyboard', Math.abs(dur - storyboard.duration) < 0.25, Math.round(dur * 100) / 100, storyboard.duration);
  const frames = Number(v?.nb_read_packets || 0);
  const expectedFrames = Math.round(storyboard.duration * exp.fps);
  add('frames', 'Aucune image manquante', Math.abs(frames - expectedFrames) <= 2, frames, expectedFrames);
  add('audio_present', 'Piste audio présente (AAC)', a?.codec_name === 'aac', a?.codec_name || 'absente', 'aac');
  const vDur = Number(v?.duration || dur), aDur = Number(a?.duration || 0);
  // Tolérance : une image (arrondi de la vidéo) + un paquet AAC (≈ 23 ms), au moins 0,1 s.
  const avTol = Math.max(0.1, 1 / (fps || 30) + 0.03);
  add('av_sync', 'Pistes audio et vidéo de même durée', a && Math.abs(vDur - aDur) < avTol, `${vDur.toFixed(3)} / ${aDur.toFixed(3)} s`, `écart < ${avTol.toFixed(2)} s`);

  const loud = measureLoudness(files.video);
  add('loudness', 'Volume normalisé (−14 LUFS ± 2)', Math.abs(loud.lufs + 14) <= 2, `${loud.lufs} LUFS`, '−16 à −12 LUFS', false);
  add('no_clipping', 'Pas de saturation (crête ≤ −1 dB)', loud.truePeak <= -0.9, `${loud.truePeak} dBFS`, '≤ −1 dBFS');

  // Scènes : chacune a une durée, et le total correspond.
  const sceneSum = storyboard.scenes.reduce((s, x) => s + x.duration, 0);
  const missing = storyboard.scenes.filter((s) => !(s.duration > 0) || !s.subtitles);
  add('scenes', 'Aucune scène manquante', missing.length === 0 && Math.abs(sceneSum - dur) < 0.25, `${storyboard.scenes.length} scènes`, 'toutes présentes');
  const black = blackFrames(files.video);
  add('no_black', 'Aucun écran noir', black.length === 0, black.length ? black.map(([s, e]) => `${s}-${e}s`).join(', ') : 'aucun', 'aucun');

  // Sous-titres.
  const srtOk = files.srt && existsSync(files.srt);
  const cues = srtOk ? parseSrt(readFileSync(files.srt, 'utf8')) : [];
  add('subtitles_file', 'Fichier SRT présent', srtOk && cues.length > 0, `${cues.length} sous-titres`, '≥ 1');
  const ordered = cues.every((c, i) => c.end > c.start && (i === 0 || c.start >= cues[i - 1].end - 1e-3));
  add('subtitles_sync', 'Sous-titres ordonnés et dans la vidéo', cues.length > 0 && ordered && cues.at(-1).end <= dur + 0.05, cues.length ? `fin ${cues.at(-1).end.toFixed(2)} s` : '—', `≤ ${dur.toFixed(2)} s`);

  // Voix.
  if (storyboard.voice?.provider === 'none') add('voice', 'Voix présente', !exp.requireVoice, 'aucun moteur vocal', 'voix générée', exp.requireVoice);
  else if (files.voice && existsSync(files.voice)) {
    const drops = voiceDropouts(files.voice, storyboard);
    add('no_audio_dropout', 'Aucune coupure audio involontaire', drops.length === 0, drops.length ? drops.map(([s, e]) => `${s.toFixed(1)}-${e.toFixed(1)}s`).join(', ') : 'aucune', 'aucune');
  }
  return finish(checks, { probe: { duration: dur, fps, width: v?.width, height: v?.height, audio: a?.codec_name, loudness: loud } });
}

function finish(checks, extra = {}) {
  const failed = checks.filter((c) => !c.ok && c.blocking);
  const warnings = checks.filter((c) => !c.ok && !c.blocking);
  return { status: failed.length ? 'failed' : 'passed', passed: checks.filter((c) => c.ok).length, total: checks.length, failed: failed.map((c) => c.id), warnings: warnings.map((c) => c.id), checks, ...extra };
}
