// Détection réelle des outils disponibles (FFmpeg, Piper, eSpeak NG, resvg).
// Rien n'est supposé : chaque outil est exécuté pour vérifier qu'il répond.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

function run(cmd, args) {
  try {
    const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 15000 });
    if (r.error || r.status !== 0) return null;
    return (r.stdout || r.stderr || '').trim();
  } catch {
    return null;
  }
}

export function checkFfmpeg() {
  const out = run('ffmpeg', ['-hide_banner', '-version']);
  if (!out) return { ok: false, detail: 'ffmpeg introuvable' };
  const enc = run('ffmpeg', ['-hide_banner', '-encoders']) || '';
  const h264 = /libx264/.test(enc);
  const aac = /\baac\b/.test(enc);
  return {
    ok: h264 && aac,
    version: out.split('\n')[0],
    h264,
    aac,
    detail: h264 && aac ? 'H.264 + AAC disponibles' : 'encodeur H.264 ou AAC manquant',
  };
}

export function checkFfprobe() {
  const out = run('ffprobe', ['-hide_banner', '-version']);
  return { ok: !!out, version: out?.split('\n')[0] ?? null };
}

export function checkPiper(voicesDir = 'assets/voices') {
  const bin = run('piper', ['--help']) !== null || run('python3', ['-m', 'piper', '--help']) !== null;
  const models = existsSync(voicesDir) ? readdirSync(voicesDir).filter((f) => f.endsWith('.onnx')) : [];
  return {
    ok: bin && models.length > 0,
    installed: bin,
    models: models.map((m) => path.join(voicesDir, m)),
    detail: !bin ? 'Piper non installé' : models.length ? `${models.length} modèle(s)` : 'aucun modèle vocal .onnx',
  };
}

export function checkEspeak() {
  for (const cmd of ['espeak-ng', 'espeak']) {
    const out = run(cmd, ['--version']);
    if (out) return { ok: true, command: cmd, version: out.split('\n')[0] };
  }
  return { ok: false, detail: 'eSpeak NG non installé' };
}

export async function checkResvg() {
  try {
    const { Resvg } = await import('@resvg/resvg-js');
    const png = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>').render().asPng();
    return { ok: png.length > 0, detail: 'rendu SVG → PNG fonctionnel' };
  } catch (e) {
    return { ok: false, detail: String(e.message || e) };
  }
}

export async function diagnose() {
  return {
    node: { ok: Number(process.versions.node.split('.')[0]) >= 20, version: process.versions.node },
    ffmpeg: checkFfmpeg(),
    ffprobe: checkFfprobe(),
    resvg: await checkResvg(),
    piper: checkPiper(),
    espeak: checkEspeak(),
  };
}
