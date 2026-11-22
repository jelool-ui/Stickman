import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { generateMetadata } from '../engine/seo.js';
import { storyboardForIdea } from '../engine/story/pipeline.js';
import { ideaFromSeed, factsIdea } from '../engine/story/ideas.js';
import { SEEDS } from '../engine/story/library/index.js';
import { DEFAULT_CHARACTERS as C } from '../engine/characters/library.js';
import { runQualityChecks, voiceDropouts } from '../render/qc.js';
import { buffer, addTone, writeWav } from '../render/audio/synth.js';
import { canUpload, uploadVideo } from '../render/youtube/upload.js';
import { encodeStoryboardParallel } from '../render/parallel.js';
import { encodeFrames } from '../render/encode.js';
import { renderFrame } from '../engine/scenes/compose.js';

const sbOf = (cat, i = 0) => storyboardForIdea(ideaFromSeed(SEEDS[cat][i], cat, 0, {}), { characters: C }).storyboard;

describe('SEO YouTube', () => {
  it('produit 3 titres, un recommandé, une description, des hashtags, des mots-clés et un nom de fichier propre', () => {
    for (const cat of Object.keys(SEEDS)) for (const seed of SEEDS[cat]) {
      const m = generateMetadata(storyboardForIdea(ideaFromSeed(seed, cat, 0, {}), { characters: C }).storyboard, { date: '2026-01-01' });
      expect(m.titles).toHaveLength(3);
      expect(new Set(m.titles).size, seed.id).toBe(3);
      expect(m.titles).toContain(m.recommended_title);
      expect(m.recommended_title.length).toBeLessThanOrEqual(70);
      for (const t of m.titles) expect(t, t).not.toMatch(/[A-ZÉÈ]{6,}/); // pas de majuscules criardes
      expect(m.hashtags[0]).toBe('#Shorts');
      expect(m.hashtags.length).toBeLessThanOrEqual(5);
      expect(m.keywords.length).toBeLessThanOrEqual(10);
      expect(m.filename).toMatch(/^2026-01-01-[a-z]+-[a-z0-9-]+\.mp4$/);
      expect(m.description).toMatch(/originaux créés avec Stick Studio AI/);
    }
  });
  it('signale la fiction et cite les sources des faits', () => {
    expect(generateMetadata(sbOf('comedy')).description).not.toMatch(/Histoire inventée/); // désactivé par défaut
    expect(generateMetadata({ ...sbOf('etsi'), label: 'Scénario imaginaire' }).description).toMatch(/Scénario imaginaire/);
    const facts = storyboardForIdea(factsIdea('animaux', ['koala-sommeil', 'pieuvre-coeurs', 'flamant-rose']), { characters: C }).storyboard;
    const d = generateMetadata(facts).description;
    expect(d).toMatch(/Sources/);
    expect(d.match(/https:\/\/fr\.wikipedia\.org/g).length).toBeGreaterThanOrEqual(3);
  });
  it('ajoute le crédit obligatoire de la voix Piper', () => {
    expect(generateMetadata({ ...sbOf('comedy'), voice: { provider: 'piper' } }).description).toMatch(/siwis.*CC BY 4\.0/);
  });
  it('ne promet jamais de vues', () => {
    const m = generateMetadata(sbOf('motivation'));
    expect(JSON.stringify({ t: m.titles, d: m.description, h: m.hashtags })).not.toMatch(/garanti|viral assuré|millions de vues/i);
    expect(m.note).toMatch(/ne garantissent aucun nombre de vues/);
  });
});

describe('publication YouTube', () => {
  it('est désactivée en version 1', async () => {
    expect(canUpload({ STICK_YOUTUBE_UPLOAD: 'enabled', YOUTUBE_CLIENT_ID: 'a', YOUTUBE_CLIENT_SECRET: 'b', YOUTUBE_REFRESH_TOKEN: 'c' })).toBe(false);
    await expect(uploadVideo()).rejects.toThrow(/désactivée/);
  });
});

describe('contrôle qualité', () => {
  it('détecte une coupure de voix mais tolère les pauses naturelles', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'qc-'));
    try {
      const sb = { scenes: [{ duration: 6, timings: { dialogue: [], narration: { start: 0.2, duration: 5 } } }] };
      const ok = buffer(6);
      addTone(ok, 0.2, { freq: 300, dur: 2.2, gain: 0.5, adsr: { a: 0.01, d: 0.01, s: 1, r: 0.01 } });
      addTone(ok, 2.9, { freq: 300, dur: 2.3, gain: 0.5, adsr: { a: 0.01, d: 0.01, s: 1, r: 0.01 } }); // pause de 0,5 s
      writeWav(path.join(dir, 'ok.wav'), ok);
      expect(voiceDropouts(path.join(dir, 'ok.wav'), sb)).toEqual([]);
      const bad = buffer(6);
      addTone(bad, 0.2, { freq: 300, dur: 1.5, gain: 0.5, adsr: { a: 0.01, d: 0.01, s: 1, r: 0.01 } }); // puis 3,5 s de silence
      writeWav(path.join(dir, 'bad.wav'), bad);
      expect(voiceDropouts(path.join(dir, 'bad.wav'), sb).length).toBeGreaterThan(0);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('refuse une vidéo sans audio, de mauvaise taille et trop courte', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'qcv-'));
    try {
      const sb = sbOf('comedy');
      const video = path.join(dir, 'v.mp4');
      await encodeFrames({ width: 320, height: 240, fps: 30, totalFrames: 60, outFile: video, frameSvg: (i, t) => renderFrame(sb, C, t, { width: 320, height: 240 }) });
      const srt = path.join(dir, 'v.srt');
      writeFileSync(srt, '1\n00:00:00,000 --> 00:00:01,000\nBonjour\n');
      const r = runQualityChecks({ files: { video, srt }, storyboard: { ...sb, duration: 2 } });
      expect(r.status).toBe('failed');
      for (const id of ['resolution', 'vertical', 'duration', 'audio_present']) expect(r.failed, id).toContain(id);
      const missing = runQualityChecks({ files: { video: path.join(dir, 'absent.mp4') }, storyboard: sb });
      expect(missing.failed).toContain('file_exists');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 60000);
});

describe('rendu parallèle', () => {
  it('produit exactement les mêmes images que le rendu séquentiel, dans l’ordre', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'par-'));
    try {
      const sb = { ...sbOf('comedy'), scenes: sbOf('comedy').scenes.slice(0, 2).map((s) => ({ ...s, duration: 1 })) };
      const a = path.join(dir, 'a.mp4'), b = path.join(dir, 'b.mp4');
      await encodeStoryboardParallel({ storyboard: sb, characters: C, width: 108, height: 192, fps: 10, outFile: a, workers: 3, crf: 0, preset: 'ultrafast' });
      await encodeFrames({ width: 108, height: 192, fps: 10, totalFrames: 20, outFile: b, crf: 0, preset: 'ultrafast', frameSvg: (i, t) => renderFrame(sb, C, t, { width: 108, height: 192 }) });
      const hash = (f) => spawnSync('ffmpeg', ['-v', 'error', '-i', f, '-f', 'framemd5', '-'], { encoding: 'utf8' }).stdout.split('\n').filter((l) => !l.startsWith('#')).map((l) => l.split(',').pop()).join();
      expect(hash(a)).toBe(hash(b));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 60000);
});
