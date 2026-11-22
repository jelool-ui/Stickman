// Module de synthèse vocale, indépendant du moteur vidéo.
// Ordre de priorité : Piper → fournisseur externe facultatif (aucun configuré par défaut) → eSpeak NG → sans voix (signalé).
// Chaque fichier audio est mis en cache (même texte + même voix + mêmes réglages = même fichier).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOICE_MODELS } from '../../engine/voices.js';
import { prepareSpeechText } from '../../engine/audio/tts-text.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const VOICES_DIR = path.join(ROOT, 'assets/voices');
export const CACHE_DIR = path.join(ROOT, '.cache/tts');
export const SAMPLE_RATE = 44100;
const CACHE_VERSION = 2;

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: opts.input !== undefined ? 'buffer' : 'utf8', timeout: 120000, ...opts });
}

/** Durée d'un WAV PCM (lecture de l'en-tête). */
export function wavDuration(file) {
  const b = readFileSync(file);
  let off = 12;
  let byteRate = 0;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === 'fmt ') byteRate = b.readUInt32LE(off + 16);
    if (id === 'data') return byteRate ? size / byteRate : 0;
    off += 8 + size + (size % 2);
  }
  return 0;
}

export function piperModelPath(model) {
  return path.join(VOICES_DIR, `${model}.onnx`);
}

/** Disponibilité réelle de chaque moteur (exécution testée, pas seulement la présence du programme). */
export function detectTtsProviders() {
  const piperBin = run('piper', ['--help']).status === 0;
  const models = Object.entries(VOICE_MODELS).filter(([id, m]) => m.provider === 'piper' && m.approved && existsSync(piperModelPath(id)) && existsSync(piperModelPath(id) + '.json')).map(([id]) => id);
  const espeak = run('espeak-ng', ['--version']).status === 0;
  return {
    piper: { ok: piperBin && models.length > 0, installed: piperBin, models },
    external: { ok: false, detail: 'aucun fournisseur externe configuré (facultatif)' },
    espeak: { ok: espeak },
  };
}

export function chooseProvider(preference, detected) {
  const order = preference === 'piper' ? ['piper', 'espeak'] : preference === 'espeak' ? ['espeak'] : preference === 'none' ? [] : ['piper', 'external', 'espeak'];
  return order.find((p) => detected[p]?.ok) || 'none';
}

function cacheKey(parts) {
  return createHash('sha1').update(JSON.stringify({ v: CACHE_VERSION, ...parts })).digest('hex').slice(0, 20);
}

/** Post-traitement commun : hauteur, débit, volume, petite marge de silence, format 44,1 kHz mono. */
function postProcess(src, dst, { pitch = 1, volume = 1, inputRate }) {
  const filters = [];
  if (Math.abs(pitch - 1) > 0.001) filters.push(`asetrate=${inputRate}*${pitch}`, `aresample=${inputRate}`, `atempo=${(1 / pitch).toFixed(4)}`);
  filters.push(`volume=${volume}`, 'silenceremove=start_periods=1:start_threshold=-50dB', 'areverse', 'silenceremove=start_periods=1:start_threshold=-50dB', 'areverse', 'adelay=40|40', 'apad=pad_dur=0.06');
  const r = run('ffmpeg', ['-v', 'error', '-y', '-i', src, '-af', filters.join(','), '-ar', String(SAMPLE_RATE), '-ac', '1', '-c:a', 'pcm_s16le', dst]);
  if (r.status !== 0) throw new Error(`ffmpeg (post-traitement voix) : ${r.stderr}`);
}

/**
 * Synthétise une réplique. Renvoie { file, duration, provider, cached }.
 * profile : { model, pitch, speed, volume, espeakVoice, espeakPitch }
 */
export function synthesize(text, profile, { provider, cacheDir = CACHE_DIR } = {}) {
  const speech = prepareSpeechText(text);
  if (!speech) throw new Error('texte vide');
  mkdirSync(cacheDir, { recursive: true });
  const key = cacheKey({ provider, speech, model: profile.model, pitch: profile.pitch, speed: profile.speed, volume: profile.volume, ev: profile.espeakVoice, ep: profile.espeakPitch });
  const file = path.join(cacheDir, `${key}.wav`);
  if (existsSync(file) && statSync(file).size > 1000) return { file, duration: wavDuration(file), provider, cached: true };
  const raw = path.join(cacheDir, `${key}.raw.wav`);
  if (provider === 'piper') {
    const model = piperModelPath(profile.model);
    if (!VOICE_MODELS[profile.model]?.approved) throw new Error(`modèle vocal non autorisé : ${profile.model}`);
    const cfg = JSON.parse(readFileSync(model + '.json', 'utf8'));
    const r = run('piper', ['-m', model, '-f', raw, '--length-scale', (1 / (profile.speed || 1)).toFixed(3), '--sentence-silence', '0.25'], { input: Buffer.from(speech) });
    if (r.status !== 0 || !existsSync(raw)) throw new Error(`piper a échoué : ${String(r.stderr).slice(0, 300)}`);
    postProcess(raw, file, { pitch: profile.pitch, volume: profile.volume, inputRate: cfg.audio.sample_rate });
  } else if (provider === 'espeak') {
    const wpm = Math.round(165 * (profile.speed || 1));
    const r = run('espeak-ng', ['-v', profile.espeakVoice || 'fr', '-s', String(wpm), '-p', String(profile.espeakPitch ?? 50), '-w', raw, speech]);
    if (r.status !== 0 || !existsSync(raw)) throw new Error(`espeak-ng a échoué : ${r.stderr}`);
    postProcess(raw, file, { pitch: 1, volume: profile.volume, inputRate: 22050 });
  } else {
    throw new Error(`aucun moteur vocal disponible (${provider})`);
  }
  try { unlinkSync(raw); } catch { /* fichier brut déjà absent */ }
  return { file, duration: wavDuration(file), provider, cached: false };
}
