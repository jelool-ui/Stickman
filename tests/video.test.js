import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { encodeFrames } from '../render/encode.js';
import { renderFrame } from '../engine/scenes/compose.js';
import { DEFAULT_CHARACTERS } from '../engine/characters/library.js';
import { TEST_SCENE } from '../engine/samples/test-scene.js';

describe('rendu vidéo', () => {
  it('encode une scène animée en MP4 H.264 lisible', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'stick-'));
    const out = path.join(dir, 'clip.mp4');
    try {
      let progress = 0;
      await encodeFrames({ width: 270, height: 480, fps: 30, totalFrames: 45, outFile: out,
        frameSvg: (i, t) => renderFrame(TEST_SCENE, DEFAULT_CHARACTERS, 2.5 + t, { width: 270, height: 480 }),
        onProgress: (d) => (progress = d) });
      expect(progress).toBe(45);
      expect(statSync(out).size).toBeGreaterThan(5000);
      const probe = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', out], { encoding: 'utf8' }).stdout);
      const v = probe.streams[0];
      expect(v).toMatchObject({ codec_name: 'h264', width: 270, height: 480, r_frame_rate: '30/1', pix_fmt: 'yuv420p' });
      expect(Number(probe.format.duration)).toBeCloseTo(1.5, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60000);
});
