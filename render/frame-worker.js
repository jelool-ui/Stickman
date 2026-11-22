// Worker de rendu : calcule des images (SVG → pixels) en parallèle sur plusieurs cœurs.
import { parentPort, workerData } from 'node:worker_threads';
import { renderFrame } from '../engine/scenes/compose.js';
import { svgToPixels } from './frames.js';

const { storyboard, characters, width, height, style } = workerData;
parentPort.on('message', ({ i, t }) => {
  const { pixels } = svgToPixels(renderFrame(storyboard, characters, t, { width, height, style }), width);
  const buf = pixels.buffer.slice(pixels.byteOffset, pixels.byteOffset + pixels.byteLength);
  parentPort.postMessage({ i, buf }, [buf]);
});
