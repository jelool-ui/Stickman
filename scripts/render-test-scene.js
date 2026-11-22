#!/usr/bin/env node
// Rend la scène de test en MP4 : `node scripts/render-test-scene.js [sortie.mp4] [largeur]`
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { renderFrame, computeTimeline } from '../engine/scenes/compose.js';
import { DEFAULT_CHARACTERS } from '../engine/characters/library.js';
import { TEST_SCENE } from '../engine/samples/test-scene.js';
import { encodeFrames } from '../render/encode.js';

const out = process.argv[2] || 'output/test-scene.mp4';
const width = Number(process.argv[3]) || 1080;
const height = Math.round((width * 16) / 9);
const fps = 30;
mkdirSync(path.dirname(out), { recursive: true });
const { duration } = computeTimeline(TEST_SCENE);
const totalFrames = Math.round(duration * fps);
const t0 = Date.now();
let last = 0;
await encodeFrames({
  width, height, fps, totalFrames, outFile: out,
  frameSvg: (i, t) => renderFrame(TEST_SCENE, DEFAULT_CHARACTERS, t, { width, height }),
  onProgress: (d, n) => { const p = Math.floor((d / n) * 10); if (p > last) { last = p; process.stdout.write(`${p * 10}% `); } },
});
const sec = (Date.now() - t0) / 1000;
console.log(`\n✅ ${out} : ${totalFrames} images (${duration}s) en ${sec.toFixed(1)}s → ${(totalFrames / sec).toFixed(1)} images/s`);
