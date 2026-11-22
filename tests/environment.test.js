import { describe, it, expect } from 'vitest';
import { checkResvg, checkFfmpeg, diagnose } from '../render/environment.js';

describe('environnement', () => {
  it('resvg convertit un SVG en PNG', async () => {
    expect((await checkResvg()).ok).toBe(true);
  });
  it('ffmpeg dispose de H.264 et AAC', () => {
    const r = checkFfmpeg();
    expect(r.ok, r.detail).toBe(true);
  });
  it('le diagnostic renvoie tous les outils', async () => {
    const r = await diagnose();
    expect(Object.keys(r)).toEqual(['node', 'ffmpeg', 'ffprobe', 'resvg', 'piper', 'espeak']);
  });
});
