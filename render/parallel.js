// Rendu parallèle : N workers calculent les images, envoyées à FFmpeg strictement dans l'ordre.
// Mémoire bornée : fenêtre glissante d'au plus `window` images (≈ 8 Mo chacune en 1080×1920).
import { Worker } from 'node:worker_threads';
import { spawn } from 'node:child_process';
import os from 'node:os';

export async function encodeStoryboardParallel({ storyboard, characters, width, height, fps, style = 'classic', outFile, workers = Math.max(1, Math.min(4, os.cpus().length)), onProgress, crf = 20, preset = 'veryfast' }) {
  const duration = storyboard.scenes.reduce((a, s) => a + s.duration, 0);
  const total = Math.round(duration * fps);
  const window = workers * 2;
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', String(fps), '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', outFile], { stdio: ['pipe', 'ignore', 'pipe'] });
  let stderr = '';
  ff.stderr.on('data', (d) => (stderr += d));
  const ffDone = new Promise((res, rej) => { ff.on('error', rej); ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg a échoué : ${stderr}`)))); });

  const url = new URL('./frame-worker.js', import.meta.url);
  const pool = Array.from({ length: workers }, () => new Worker(url, { workerData: { storyboard, characters, width, height, style } }));
  const idle = [...pool];
  const results = new Map();
  const waiters = new Map();
  let next = 0, written = 0, failure = null;
  const pump = () => {
    while (!failure && idle.length && next < total && next - written < window) {
      const w = idle.pop();
      w.postMessage({ i: next, t: next / fps });
      next++;
    }
  };
  for (const w of pool) {
    w.on('message', ({ i, buf }) => {
      idle.push(w);
      if (waiters.has(i)) { waiters.get(i).resolve(buf); waiters.delete(i); } else results.set(i, buf);
      pump();
    });
    w.on('error', (e) => { failure = e; for (const x of waiters.values()) x.reject(e); });
  }
  try {
    pump();
    while (written < total) {
      if (failure) throw failure;
      let buf;
      if (results.has(written)) { buf = results.get(written); results.delete(written); }
      else buf = await new Promise((resolve, reject) => waiters.set(written, { resolve, reject }));
      if (!ff.stdin.write(Buffer.from(buf))) await new Promise((r) => ff.stdin.once('drain', r));
      written++;
      onProgress?.(written, total);
      pump();
    }
  } finally {
    await Promise.all(pool.map((w) => w.terminate()));
    ff.stdin.end();
  }
  await ffDone;
  return { outFile, frames: total };
}
