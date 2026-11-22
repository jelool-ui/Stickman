import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderSfx, SFX_IDS } from '../render/audio/sfx.js';
import { renderMusic, MOODS } from '../render/audio/music.js';
import { buffer, addTone, writeWav, SR } from '../render/audio/synth.js';
import { mixAudio, buildSfxTrack, measureLoudness } from '../render/audio/mix.js';
import { CATEGORY_PROFILES, BEAT_TYPES } from '../engine/story/categories.js';

const peakOf = (b) => { let m = 0; for (const v of b) m = Math.max(m, Math.abs(v)); return m; };
const rms = (b, a = 0, n = b.length) => Math.sqrt(b.subarray(a, a + n).reduce((s, v) => s + v * v, 0) / n);
const band = (file, freq, ss, t) => Number(/mean_volume: (-?[\d.]+)/.exec(spawnSync('ffmpeg', ['-hide_banner', '-ss', String(ss), '-t', String(t), '-i', file, '-af', `bandpass=f=${freq}:w=40,volumedetect`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr)?.[1]);

describe('effets sonores et musique originaux', () => {
  it('chaque effet utilisé par les catégories existe et est audible sans saturer', () => {
    for (const id of Object.values(CATEGORY_PROFILES).flatMap((p) => BEAT_TYPES.map((t) => p.sfx[t]))) expect(SFX_IDS, id).toContain(id);
    for (const id of SFX_IDS) {
      const b = renderSfx(id);
      expect(rms(b), id).toBeGreaterThan(0.01);
      expect(peakOf(b), id).toBeLessThanOrEqual(0.81);
    }
  });
  it('chaque ambiance musicale a la bonne durée, est audible, déterministe et sans saturation', () => {
    for (const mood of Object.keys(MOODS)) {
      const a = renderMusic(mood, 12, 's');
      expect(a.length).toBe(12 * SR);
      expect(rms(a, 2 * SR, 8 * SR), mood).toBeGreaterThan(0.02);
      expect(peakOf(a)).toBeLessThanOrEqual(0.71);
      expect(renderMusic(mood, 12, 's')).toEqual(a);
    }
    expect(renderMusic('joyeux', 12, 'a')).not.toEqual(renderMusic('joyeux', 12, 'b'));
  }, 60000);
  it('les catégories utilisent des ambiances existantes', () => {
    for (const p of Object.values(CATEGORY_PROFILES)) expect(MOODS[p.music], p.music).toBeDefined();
  });
});

describe('mixage', () => {
  it('baisse la musique pendant la voix, normalise le volume et respecte la durée', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'mix-'));
    try {
      const D = 8;
      const voice = buffer(D); addTone(voice, 3, { wave: 'sine', freq: 1000, dur: 2, gain: 0.6, adsr: { a: 0.01, d: 0.01, s: 1, r: 0.01 } });
      const music = buffer(D); addTone(music, 0, { wave: 'sine', freq: 220, dur: D, gain: 0.6, adsr: { a: 0.01, d: 0.01, s: 1, r: 0.01 } });
      const sil = buffer(D);
      const f = (n) => path.join(dir, n);
      writeWav(f('v.wav'), voice); writeWav(f('m.wav'), music); writeWav(f('s.wav'), sil);
      mixAudio({ voice: f('v.wav'), music: f('m.wav'), sfx: f('s.wav'), out: f('out.wav'), duration: D });
      const during = band(f('out.wav'), 220, 3.6, 1.0), before = band(f('out.wav'), 220, 1.0, 1.0);
      expect(before - during).toBeGreaterThan(6); // musique atténuée d'au moins 6 dB pendant la voix
      const probe = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', f('out.wav')], { encoding: 'utf8' }).stdout);
      expect(Number(probe.format.duration)).toBeCloseTo(D, 1);
      expect(probe.streams[0].channels).toBe(2);
      expect(measureLoudness(f('out.wav')).truePeak).toBeLessThanOrEqual(-1);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 60000);
  it('place les effets au début des scènes', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'sfx-'));
    try {
      const placed = buildSfxTrack({ scenes: [{ scene_id: 1, duration: 2, sound_effects: ['pop'] }, { scene_id: 2, duration: 3, sound_effects: ['ding', 'inconnu'] }] }, path.join(dir, 's.wav'));
      expect(placed).toEqual([{ id: 'pop', at: 0.03, scene: 1 }, { id: 'ding', at: 2.03, scene: 2 }]);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
