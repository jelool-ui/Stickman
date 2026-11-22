// Mini-synthétiseur déterministe (aucun échantillon externe) : tous les sons sont originaux, générés par calcul.
import { writeFileSync } from 'node:fs';
import { seededRandom } from '../../engine/math.js';

export const SR = 44100;
const TAU = Math.PI * 2;

export function buffer(seconds) {
  return new Float32Array(Math.max(1, Math.ceil(seconds * SR)));
}

export const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export const osc = {
  sine: (ph) => Math.sin(TAU * ph),
  triangle: (ph) => 1 - 4 * Math.abs(Math.round(ph - 0.25) - (ph - 0.25)),
  saw: (ph) => 2 * (ph - Math.floor(ph + 0.5)),
  square: (ph) => (ph % 1 < 0.5 ? 1 : -1),
};

/** Enveloppe ADSR simplifiée (temps en secondes). */
export function env(t, dur, { a = 0.005, d = 0.1, s = 0.6, r = 0.1 } = {}) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur) return s;
  if (t < dur + r) return s * (1 - (t - dur) / r);
  return 0;
}

/**
 * Ajoute une note dans buf.
 * opts : wave, freq (Hz) ou freqFn(t), dur, gain, adsr, detune (cents, voix doublée), lp (coupure passe-bas Hz), vibrato
 */
export function addTone(buf, start, { wave = 'sine', freq = 440, freqFn = null, dur = 0.3, gain = 0.3, adsr = {}, detune = 0, lp = null, vibrato = 0 }) {
  const fn = osc[wave];
  const r = adsr.r ?? 0.1;
  const i0 = Math.floor(start * SR);
  const n = Math.ceil((dur + r) * SR);
  const voices = detune ? [-detune, detune] : [0];
  const phases = voices.map(() => 0);
  let y = 0;
  const alpha = lp ? 1 - Math.exp((-TAU * lp) / SR) : 1;
  for (let k = 0; k < n && i0 + k < buf.length; k++) {
    const t = k / SR;
    let f = freqFn ? freqFn(t) : freq;
    if (vibrato) f *= 1 + vibrato * Math.sin(TAU * 5.5 * t);
    let v = 0;
    voices.forEach((c, j) => {
      phases[j] += (f * Math.pow(2, c / 1200)) / SR;
      v += fn(phases[j] % 1);
    });
    v /= voices.length;
    y += alpha * (v - y);
    if (i0 + k >= 0) buf[i0 + k] += y * gain * env(t, dur, adsr);
  }
}

/** Bruit filtré (souffle, caisse claire, charleston). */
export function addNoise(buf, start, { dur = 0.2, gain = 0.2, adsr = { a: 0.002, d: 0.05, s: 0.3, r: 0.05 }, lp = null, hp = null, seed = 1, lpFn = null }) {
  const rnd = seededRandom(seed);
  const i0 = Math.floor(start * SR);
  const n = Math.ceil((dur + (adsr.r ?? 0.05)) * SR);
  let low = 0, prev = 0, high = 0;
  for (let k = 0; k < n && i0 + k < buf.length; k++) {
    const t = k / SR;
    const x = rnd() * 2 - 1;
    const cut = lpFn ? lpFn(t) : lp;
    const a = cut ? 1 - Math.exp((-TAU * cut) / SR) : 1;
    low += a * (x - low);
    let v = low;
    if (hp) { const b = Math.exp((-TAU * hp) / SR); high = b * (high + v - prev); prev = v; v = high; }
    if (i0 + k >= 0) buf[i0 + k] += v * gain * env(t, dur, adsr);
  }
}

/** Grosse caisse : sinus dont la fréquence chute rapidement. */
export function addKick(buf, start, gain = 0.6) {
  addTone(buf, start, { wave: 'sine', freqFn: (t) => 45 + 110 * Math.exp(-t * 30), dur: 0.18, gain, adsr: { a: 0.001, d: 0.15, s: 0, r: 0.05 } });
}

export function normalize(buf, peak = 0.89) {
  let m = 0;
  for (const v of buf) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < buf.length; i++) buf[i] *= peak / m;
  return buf;
}

export function fade(buf, inSec = 0.01, outSec = 0.05) {
  const a = Math.floor(inSec * SR), b = Math.floor(outSec * SR);
  for (let i = 0; i < a && i < buf.length; i++) buf[i] *= i / a;
  for (let i = 0; i < b && i < buf.length; i++) buf[buf.length - 1 - i] *= i / b;
  return buf;
}

/** Écrit un WAV PCM 16 bits mono. */
export function writeWav(file, buf, sr = SR) {
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(buf[i] * 32767))), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
  return file;
}
