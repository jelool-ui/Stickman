// Production complète d'une vidéo à partir d'un storyboard validé :
// voix → sous-titres → musique → effets → images (parallèle) → mixage → miniature → métadonnées → contrôle qualité.
import { mkdirSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { applyVoices, buildVoiceTrack, storyboardSrt } from './voice.js';
import { buildSfxTrack, buildMusicTrack, mixAudio } from './audio/mix.js';
import { encodeStoryboardParallel } from './parallel.js';
import { renderThumbnail } from './thumbnail.js';
import { runQualityChecks } from './qc.js';
import { generateMetadata } from '../engine/seo.js';

export const STEPS = ['voix', 'sous-titres', 'musique', 'effets', 'images', 'mixage', 'miniature', 'métadonnées', 'contrôle qualité'];

export async function produceVideo(storyboard, { characters, profiles, outDir, voicePreference = 'auto', width, height, fps, style, workers, keepIntermediate = false, date, log = console.log, onProgress } = {}) {
  mkdirSync(outDir, { recursive: true });
  const W = width || storyboard.format?.width || 1080;
  const H = height || storyboard.format?.height || 1920;
  const FPS = fps || storyboard.format?.fps || 30;
  const t0 = Date.now();
  const timings = {};
  let stepStart = Date.now();
  const step = (name, pct = 0) => { onProgress?.({ step: name, index: STEPS.indexOf(name), total: STEPS.length, percent: pct }); };
  const done = (name) => { timings[name] = Math.round((Date.now() - stepStart) / 100) / 10; stepStart = Date.now(); };
  const tmp = (f) => path.join(outDir, f);

  step('voix'); log('🎙️  Voix…');
  const { storyboard: sb0, segments, report: voiceReport } = applyVoices(storyboard, { characters, profiles, preference: voicePreference });
  const sb = { ...sb0, style: style || storyboard.style || 'classic' };
  for (const w of voiceReport.warnings) log(`   ⚠️  ${w}`);
  log(`   ${voiceReport.provider} : ${voiceReport.generated} générée(s), ${voiceReport.cached} en cache, durée ${sb.duration} s`);
  buildVoiceTrack(segments, sb.duration, tmp('voice.wav'));
  done('voix');

  step('sous-titres');
  const meta = generateMetadata(sb, { date });
  const base = meta.filename.replace(/\.mp4$/, '');
  const files = { video: tmp(`${base}.mp4`), srt: tmp(`${base}.srt`), thumbnail: tmp(`${base}-miniature.png`), voice: tmp('voice.wav') };
  writeFileSync(files.srt, storyboardSrt(sb));
  done('sous-titres');

  step('musique'); log(`🎵 Musique originale (${sb.music})…`);
  buildMusicTrack(sb.music, sb.duration, sb.id, tmp('music.wav'));
  done('musique');

  step('effets');
  const sfxPlaced = buildSfxTrack(sb, tmp('sfx.wav'));
  log(`🔔 ${sfxPlaced.length} effet(s) sonore(s)`);
  done('effets');

  step('images'); log(`🎬 Images ${W}×${H} à ${FPS} i/s…`);
  let lastPct = -1;
  const silent = tmp('video.silent.mp4');
  await encodeStoryboardParallel({ storyboard: sb, characters, width: W, height: H, fps: FPS, style: sb.style, outFile: silent, workers,
    onProgress: (d, n) => { const p = Math.floor((d / n) * 100); if (p !== lastPct && p % 10 === 0) { lastPct = p; log(`   ${p} %`); step('images', p); } } });
  done('images');

  step('mixage'); log('🔊 Mixage et assemblage…');
  mixAudio({ voice: tmp('voice.wav'), music: tmp('music.wav'), sfx: tmp('sfx.wav'), out: tmp('mix.wav'), duration: sb.duration });
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', tmp('mix.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', files.video], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg (assemblage) : ${r.stderr}`);
  done('mixage');

  step('miniature');
  renderThumbnail(sb, characters, meta, files.thumbnail, { width: W, height: H });
  done('miniature');

  step('métadonnées');
  writeFileSync(tmp('metadata.json'), JSON.stringify(meta, null, 2));
  writeFileSync(tmp('storyboard.json'), JSON.stringify(sb, null, 2));
  done('métadonnées');

  step('contrôle qualité'); log('🔍 Contrôle qualité…');
  const qc = runQualityChecks({ files, storyboard: sb, expected: { width: W, height: H, fps: FPS, requireVoice: voicePreference !== 'none' } });
  writeFileSync(tmp('qc-report.json'), JSON.stringify(qc, null, 2));
  done('contrôle qualité');
  log(qc.status === 'passed' ? `✅ Contrôle qualité réussi (${qc.passed}/${qc.total})` : `❌ Contrôle qualité échoué : ${qc.failed.join(', ')}`);

  if (!keepIntermediate) for (const f of ['video.silent.mp4', 'music.wav', 'sfx.wav', 'mix.wav', 'voice.wav']) rmSync(tmp(f), { force: true });
  const productionSeconds = Math.round((Date.now() - t0) / 100) / 10;
  const report = {
    id: sb.id, title: meta.recommended_title, category: sb.category, status: qc.status === 'passed' ? 'success' : 'failed',
    duration: sb.duration, productionSeconds, timings, voice: { provider: voiceReport.provider, warnings: voiceReport.warnings, failures: voiceReport.failures },
    sfx: sfxPlaced, files: Object.fromEntries(Object.entries(files).filter(([k]) => k !== 'voice').map(([k, v]) => [k, path.basename(v)])), qc: { status: qc.status, failed: qc.failed, warnings: qc.warnings },
  };
  writeFileSync(tmp('production-report.json'), JSON.stringify(report, null, 2));
  log(`⏱️  ${productionSeconds} s au total`);
  return { ...report, outDir, storyboard: sb, metadata: meta, qcReport: qc, paths: files };
}
