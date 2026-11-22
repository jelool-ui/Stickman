// Encodage vidéo : les images sont envoyées directement à FFmpeg (aucun fichier image temporaire → peu de disque).
import { spawn } from 'node:child_process';
import { svgToPixels } from './frames.js';

/**
 * Rend une suite d'images en MP4 H.264 (sans audio ; l'audio est ajouté au montage final).
 * frameSvg(i, timeSec) → chaîne SVG. onProgress(done, total).
 */
export async function encodeFrames({ frameSvg, totalFrames, fps = 30, width, height, outFile, onProgress, crf = 20, preset = 'veryfast' }) {
  const args = ['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', String(fps), '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', outFile];
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
  let stderr = '';
  ff.stderr.on('data', (d) => (stderr += d));
  const done = new Promise((resolve, reject) => {
    ff.on('error', reject);
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg a échoué (code ${code}) : ${stderr.trim()}`))));
  });
  const write = (buf) => new Promise((res, rej) => (ff.stdin.write(buf, (e) => (e ? rej(e) : res())) ));
  try {
    for (let i = 0; i < totalFrames; i++) {
      const { pixels, width: pw, height: ph } = svgToPixels(frameSvg(i, i / fps), width);
      if (pw !== width || ph !== height) throw new Error(`taille d'image inattendue ${pw}x${ph}`);
      await write(pixels);
      onProgress?.(i + 1, totalFrames);
    }
  } finally {
    ff.stdin.end();
  }
  await done;
  return outFile;
}
