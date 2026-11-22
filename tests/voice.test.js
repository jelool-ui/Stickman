import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { detectTtsProviders, synthesize, chooseProvider } from '../render/tts/index.js';
import { applyVoices, buildVoiceTrack } from '../render/voice.js';
import { produceVideo } from '../render/produce.js';
import { storyboardForIdea } from '../engine/story/pipeline.js';
import { ideaFromSeed } from '../engine/story/ideas.js';
import { SEEDS } from '../engine/story/library/index.js';
import { DEFAULT_CHARACTERS as C } from '../engine/characters/library.js';
import { DEFAULT_VOICE_PROFILES as P } from '../engine/voices.js';
import { planScene, layoutFor } from '../engine/scenes/compose.js';

const detected = detectTtsProviders();
const hasPiper = detected.piper.ok;
const hasEspeak = detected.espeak.ok;
if (!hasPiper) console.warn('⚠️  Piper indisponible : tests Piper ignorés (installer : pip install piper-tts && node scripts/setup-voices.js)');
if (!hasEspeak) console.warn('⚠️  eSpeak NG indisponible : tests eSpeak ignorés');

const probe = (f) => JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', f], { encoding: 'utf8' }).stdout);
const meanVolume = (f, ss, t) => Number(/mean_volume: (-?[\d.]+)/.exec(spawnSync('ffmpeg', ['-hide_banner', '-ss', String(ss), '-t', String(t), '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr)?.[1] ?? -99);
const sb = () => storyboardForIdea(ideaFromSeed(SEEDS.comedy[2], 'comedy', 0, {}), { characters: C, targetDuration: 45 }).storyboard;

describe('choix du moteur vocal', () => {
  it('respecte l’ordre Piper → externe → eSpeak → aucun', () => {
    const all = { piper: { ok: true }, external: { ok: false }, espeak: { ok: true } };
    expect(chooseProvider('auto', all)).toBe('piper');
    expect(chooseProvider('auto', { ...all, piper: { ok: false } })).toBe('espeak');
    expect(chooseProvider('auto', { piper: { ok: false }, external: { ok: false }, espeak: { ok: false } })).toBe('none');
    expect(chooseProvider('none', all)).toBe('none');
  });
});

describe.skipIf(!hasPiper)('Piper', () => {
  it('génère une réplique, mesure sa durée et la met en cache', () => {
    const a = synthesize('Allez, ouvre-toi !', P[1], { provider: 'piper' });
    expect(existsSync(a.file)).toBe(true);
    expect(a.duration).toBeGreaterThan(0.5);
    expect(a.duration).toBeLessThan(4);
    const b = synthesize('Allez, ouvre-toi !', P[1], { provider: 'piper' });
    expect(b.cached).toBe(true);
    expect(b.file).toBe(a.file);
  });
  it('la vitesse change réellement la durée', () => {
    const t = 'Le micro était allumé depuis le début de la réunion.';
    const slow = synthesize(t, { ...P[0], speed: 0.8 }, { provider: 'piper' });
    const fast = synthesize(t, { ...P[0], speed: 1.3 }, { provider: 'piper' });
    // Piper n'est pas proportionnel (longueur des phonèmes ×2 → durée ×1,68 mesurée) : on vérifie un effet net.
    expect(fast.duration).toBeLessThan(slow.duration * 0.88);
  });
  it('refuse un modèle dont la licence est exclue', () => {
    expect(() => synthesize('Bonjour', { ...P[0], model: 'fr_FR-tom-medium' }, { provider: 'piper' })).toThrow(/non autorisé/);
  });
});

describe.skipIf(!hasEspeak)('eSpeak NG (secours)', () => {
  it('génère une réplique', () => {
    const a = synthesize('Bonjour, je suis la voix de secours.', P[0], { provider: 'espeak' });
    expect(a.duration).toBeGreaterThan(0.8);
  });
});

describe('voix d’un storyboard', () => {
  it.skipIf(!hasPiper && !hasEspeak)('synchronise durées, bouches et sous-titres sur l’audio réel', () => {
    const { storyboard: s, segments, report } = applyVoices(sb(), { characters: C });
    expect(report.failures).toEqual([]);
    expect(segments.length).toBe(s.scenes.reduce((a, x) => a + x.dialogue.length + (x.narration ? 1 : 0), 0));
    let t = 0;
    for (const scene of s.scenes) {
      expect(scene.duration).toBeGreaterThanOrEqual(scene.audio_end);
      const parts = [...scene.timings.dialogue, scene.timings.narration].filter(Boolean).sort((a, b) => a.start - b.start);
      for (let i = 1; i < parts.length; i++) expect(parts[i].start).toBeGreaterThanOrEqual(parts[i - 1].start + parts[i - 1].duration);
      for (const c of scene.subtitle_chunks) { expect(c.start).toBeGreaterThanOrEqual(0); expect(c.end).toBeLessThanOrEqual(scene.duration + 1e-6); }
      // Le personnage qui parle a une fenêtre de parole calée sur sa réplique.
      scene.dialogue.forEach((d, i) => {
        const actor = planScene(scene, layoutFor(1080, 1920)).find((a) => a.character_id === d.character_id);
        expect(actor.speaking.some((w) => Math.abs(w.start - scene.timings.dialogue[i].start) < 1e-6)).toBe(true);
      });
      t += scene.duration;
    }
    expect(s.duration).toBeCloseTo(t, 1);
    expect(s.duration).toBeGreaterThanOrEqual(30);
  });
  it('sans moteur vocal, la production continue et le signale', () => {
    const { storyboard: s, segments, report } = applyVoices(sb(), { characters: C, preference: 'none' });
    expect(segments).toEqual([]);
    expect(report.provider).toBe('none');
    expect(report.warnings.join()).toMatch(/sans voix/);
    expect(s.scenes.every((x) => x.subtitle_chunks.length > 0)).toBe(true);
    expect(s.duration).toBeGreaterThanOrEqual(30);
  });
  it.skipIf(!hasPiper && !hasEspeak)('assemble une piste voix de la bonne durée, audible là où l’on parle', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'voice-'));
    try {
      const { storyboard: s, segments } = applyVoices(sb(), { characters: C });
      const f = buildVoiceTrack(segments, s.duration, path.join(dir, 'v.wav'));
      expect(Number(probe(f).format.duration)).toBeCloseTo(s.duration, 1);
      const seg = segments[2];
      expect(meanVolume(f, seg.start + 0.2, Math.min(1, seg.duration - 0.3))).toBeGreaterThan(-35);
      expect(meanVolume(f, segments[0].start + segments[0].duration + 0.05, 0.15)).toBeLessThan(-50);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 60000);
});

describe.skipIf(!hasPiper && !hasEspeak)('production complète', () => {
  it('produit un MP4 avec image, voix et fichier SRT synchronisés', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'prod-'));
    try {
      const r = await produceVideo(sb(), { characters: C, outDir: dir, width: 216, height: 384, fps: 15, log: () => {} });
      const p = probe(r.video);
      const v = p.streams.find((x) => x.codec_type === 'video'), a = p.streams.find((x) => x.codec_type === 'audio');
      expect(v).toMatchObject({ codec_name: 'h264', width: 216, height: 384 });
      expect(a.codec_name).toBe('aac');
      expect(Number(p.format.duration)).toBeCloseTo(r.storyboard.duration, 0);
      expect(spawnSync('cat', [r.srt], { encoding: 'utf8' }).stdout).toMatch(/^1\n00:00:00,200 --> /);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 120000);
});
