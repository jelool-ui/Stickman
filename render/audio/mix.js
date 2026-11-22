// Mixage final : voix + musique (baissée automatiquement pendant la voix) + effets sonores,
// fondus d'entrée et de sortie, normalisation du volume pour YouTube (-14 LUFS, crête -1,5 dB).
import { spawnSync } from 'node:child_process';
import { buffer, writeWav, SR } from './synth.js';
import { renderSfx } from './sfx.js';
import { renderMusic } from './music.js';

export const MIX = { musicGain: 0.32, sfxGain: 0.55, targetLufs: -14, truePeak: -1.5 };

/** Piste d'effets : chaque effet de scène est joué au début de sa scène. Renvoie la liste des effets placés. */
export function buildSfxTrack(storyboard, file) {
  const total = storyboard.scenes.reduce((a, s) => a + s.duration, 0);
  const b = buffer(total);
  const placed = [];
  let t = 0;
  for (const s of storyboard.scenes) {
    for (const id of s.sound_effects || []) {
      const fx = renderSfx(id);
      if (!fx) continue;
      const i0 = Math.floor((t + 0.03) * SR);
      for (let k = 0; k < fx.length && i0 + k < b.length; k++) b[i0 + k] += fx[k];
      placed.push({ id, at: Math.round((t + 0.03) * 100) / 100, scene: s.scene_id });
    }
    t += s.duration;
  }
  writeWav(file, b);
  return placed;
}

export function buildMusicTrack(mood, duration, seed, file) {
  writeWav(file, renderMusic(mood, duration, seed));
  return file;
}

/** Mixe les trois pistes en un fichier audio stéréo de la durée exacte de la vidéo. */
export function mixAudio({ voice, music, sfx, out, duration }) {
  const f = [
    '[0:a]aformat=sample_rates=44100:channel_layouts=mono,asplit=2[v][vsc]',
    `[1:a]aformat=sample_rates=44100:channel_layouts=mono,volume=${MIX.musicGain}[m]`,
    // Ducking : la musique baisse dès que la voix parle.
    '[m][vsc]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=400:makeup=1[md]',
    `[2:a]aformat=sample_rates=44100:channel_layouts=mono,volume=${MIX.sfxGain}[s]`,
    `[v][md][s]amix=inputs=3:normalize=0:dropout_transition=0,afade=t=in:d=0.05,afade=t=out:st=${Math.max(0, duration - 0.6).toFixed(2)}:d=0.6,` +
      `loudnorm=I=${MIX.targetLufs}:TP=${MIX.truePeak}:LRA=11,aresample=44100,apad,atrim=0:${duration.toFixed(3)},aformat=channel_layouts=stereo[out]`,
  ].join(';');
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', voice, '-i', music, '-i', sfx, '-filter_complex', f, '-map', '[out]', '-c:a', 'pcm_s16le', out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg (mixage) : ${r.stderr}`);
  return out;
}

/** Mesures du mixage : volume intégré (LUFS), crête vraie. */
export function measureLoudness(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8' });
  const txt = r.stderr || '';
  const I = Number(/I:\s+(-?[\d.]+) LUFS/.exec(txt.split('Summary:').pop())?.[1]);
  const peak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(txt.split('Summary:').pop())?.[1]);
  return { lufs: I, truePeak: peak };
}
