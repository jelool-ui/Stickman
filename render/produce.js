// Production d'une vidéo à partir d'un storyboard : voix → sous-titres → images → MP4.
// (La musique, les effets sonores et le contrôle qualité complet sont ajoutés en Phase 6.)
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { applyVoices, buildVoiceTrack, storyboardSrt } from './voice.js';
import { renderFrame, computeTimeline } from '../engine/scenes/compose.js';
import { encodeFrames } from './encode.js';

export async function produceVideo(storyboard, { characters, profiles, outDir, voicePreference = 'auto', width, height, fps, style = 'classic', log = console.log } = {}) {
  mkdirSync(outDir, { recursive: true });
  const W = width || storyboard.format?.width || 1080;
  const H = height || storyboard.format?.height || 1920;
  const FPS = fps || storyboard.format?.fps || 30;
  const t0 = Date.now();

  log('🎙️  Voix…');
  const { storyboard: sb, segments, report } = applyVoices(storyboard, { characters, profiles, preference: voicePreference });
  for (const w of report.warnings) log(`   ⚠️  ${w}`);
  log(`   ${report.provider} : ${report.generated} générée(s), ${report.cached} en cache, durée ${sb.duration} s`);
  writeFileSync(path.join(outDir, 'storyboard.final.json'), JSON.stringify(sb, null, 2));
  const voiceFile = path.join(outDir, 'voice.wav');
  buildVoiceTrack(segments, sb.duration, voiceFile);
  const srtFile = path.join(outDir, 'subtitles.srt');
  writeFileSync(srtFile, storyboardSrt(sb));

  log('🎬 Images…');
  const { duration } = computeTimeline(sb);
  const totalFrames = Math.round(duration * FPS);
  const silent = path.join(outDir, 'video.silent.mp4');
  let last = -1;
  await encodeFrames({ width: W, height: H, fps: FPS, totalFrames, outFile: silent,
    frameSvg: (i, t) => renderFrame(sb, characters, t, { width: W, height: H, style: sb.style || style }),
    onProgress: (d, n) => { const p = Math.floor((d / n) * 10); if (p !== last) { last = p; log(`   ${p * 10} %`); } } });

  log('🔊 Assemblage…');
  const out = path.join(outDir, 'video.mp4');
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', voiceFile, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg (assemblage) : ${r.stderr}`);
  rmSync(silent, { force: true });
  const seconds = Math.round((Date.now() - t0) / 100) / 10;
  log(`✅ ${out} (${seconds} s de production)`);
  return { video: out, srt: srtFile, voice: voiceFile, storyboard: sb, voiceReport: report, productionSeconds: seconds };
}
