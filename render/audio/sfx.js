// Bibliothèque d'effets sonores originaux, générés par calcul (licence : ceux du projet).
import { buffer, addTone, addNoise, addKick, normalize, fade, midiToHz } from './synth.js';

const S = {
  pop: () => { const b = buffer(0.18); addTone(b, 0, { wave: 'sine', freqFn: (t) => 300 + 900 * Math.exp(-t * 40), dur: 0.08, gain: 0.8, adsr: { a: 0.001, d: 0.07, s: 0, r: 0.03 } }); return b; },
  click: () => { const b = buffer(0.08); addNoise(b, 0, { dur: 0.02, gain: 0.7, hp: 2000, adsr: { a: 0.0005, d: 0.02, s: 0, r: 0.01 }, seed: 3 }); addTone(b, 0, { wave: 'triangle', freq: 1800, dur: 0.02, gain: 0.3, adsr: { a: 0.001, d: 0.02, s: 0, r: 0.01 } }); return b; },
  whoosh: () => { const b = buffer(0.55); addNoise(b, 0, { dur: 0.45, gain: 0.8, lpFn: (t) => 300 + 5000 * Math.sin(Math.PI * Math.min(1, t / 0.45)), adsr: { a: 0.15, d: 0.2, s: 0.4, r: 0.1 }, seed: 7 }); return b; },
  ding: () => { const b = buffer(1.2); for (const [m, g] of [[88, 0.5], [95, 0.25], [100, 0.12]]) addTone(b, 0, { wave: 'sine', freq: midiToHz(m), dur: 0.02, gain: g, adsr: { a: 0.002, d: 0.02, s: 1, r: 1.1 } }); return b; },
  boing: () => { const b = buffer(0.6); addTone(b, 0, { wave: 'triangle', freqFn: (t) => 140 + 260 * t + 60 * Math.sin(2 * Math.PI * 14 * t) * Math.exp(-t * 4), dur: 0.45, gain: 0.7, adsr: { a: 0.005, d: 0.3, s: 0.3, r: 0.1 } }); return b; },
  drumroll: () => { const b = buffer(1.1); for (let i = 0; i < 26; i++) addNoise(b, i * 0.035, { dur: 0.03, gain: 0.25 + 0.5 * (i / 26), hp: 900, lp: 6000, adsr: { a: 0.001, d: 0.03, s: 0, r: 0.02 }, seed: i + 11 }); addKick(b, 0.92, 0.7); addNoise(b, 0.92, { dur: 0.15, gain: 0.5, hp: 3000, seed: 99 }); return b; },
  rimshot: () => { const b = buffer(0.9); addKick(b, 0, 0.5); addNoise(b, 0.12, { dur: 0.06, gain: 0.5, hp: 1500, seed: 5 }); addNoise(b, 0.3, { dur: 0.5, gain: 0.35, hp: 5000, adsr: { a: 0.002, d: 0.1, s: 0.3, r: 0.3 }, seed: 6 }); return b; },
  laugh: () => { const b = buffer(0.8); [72, 76, 79, 84].forEach((m, i) => addTone(b, i * 0.09, { wave: 'square', freq: midiToHz(m), dur: 0.08, gain: 0.18, lp: 3000, adsr: { a: 0.003, d: 0.05, s: 0.5, r: 0.08 } })); return b; },
  suspense: () => { const b = buffer(1.6); addTone(b, 0, { wave: 'saw', freq: midiToHz(38), dur: 1.2, gain: 0.35, lp: 400, detune: 12, adsr: { a: 0.4, d: 0.3, s: 0.8, r: 0.4 } }); addTone(b, 0.1, { wave: 'sine', freq: midiToHz(62), dur: 1.0, gain: 0.15, vibrato: 0.01, adsr: { a: 0.5, d: 0.2, s: 0.7, r: 0.4 } }); return b; },
  tick: () => { const b = buffer(0.7); for (let i = 0; i < 2; i++) addNoise(b, i * 0.33, { dur: 0.012, gain: 0.6, hp: 3000, lp: 9000, adsr: { a: 0.0005, d: 0.01, s: 0, r: 0.01 }, seed: 20 + i }); return b; },
  heartbeat: () => { const b = buffer(0.9); addTone(b, 0, { wave: 'sine', freqFn: (t) => 60 + 30 * Math.exp(-t * 20), dur: 0.1, gain: 0.8, adsr: { a: 0.002, d: 0.1, s: 0, r: 0.05 } }); addTone(b, 0.22, { wave: 'sine', freqFn: (t) => 55 + 25 * Math.exp(-t * 20), dur: 0.1, gain: 0.6, adsr: { a: 0.002, d: 0.1, s: 0, r: 0.05 } }); return b; },
  reveal: () => { const b = buffer(1.6); [60, 64, 67, 72].forEach((m, i) => addTone(b, i * 0.05, { wave: 'triangle', freq: midiToHz(m), dur: 0.6, gain: 0.22, lp: 4000, adsr: { a: 0.01, d: 0.3, s: 0.5, r: 0.7 } })); addNoise(b, 0, { dur: 0.6, gain: 0.15, hp: 6000, adsr: { a: 0.2, d: 0.2, s: 0.3, r: 0.4 }, seed: 41 }); return b; },
  soft: () => { const b = buffer(1.2); addTone(b, 0, { wave: 'sine', freq: midiToHz(76), dur: 0.05, gain: 0.3, adsr: { a: 0.01, d: 0.05, s: 0.8, r: 1.0 } }); addTone(b, 0.12, { wave: 'sine', freq: midiToHz(83), dur: 0.05, gain: 0.2, adsr: { a: 0.01, d: 0.05, s: 0.8, r: 0.9 } }); return b; },
  magic: () => { const b = buffer(1.3); for (let i = 0; i < 10; i++) addTone(b, i * 0.06, { wave: 'sine', freq: midiToHz(84 + ((i * 5) % 12)), dur: 0.05, gain: 0.18, adsr: { a: 0.002, d: 0.05, s: 0.5, r: 0.4 } }); return b; },
  rise: () => { const b = buffer(1.3); addTone(b, 0, { wave: 'saw', freqFn: (t) => 200 * Math.pow(2, t * 1.6), dur: 1.0, gain: 0.25, lp: 2500, detune: 10, adsr: { a: 0.3, d: 0.5, s: 0.7, r: 0.2 } }); return b; },
  success: () => { const b = buffer(1.6); [67, 72, 76, 79].forEach((m, i) => addTone(b, i * 0.1, { wave: 'triangle', freq: midiToHz(m), dur: 0.25, gain: 0.25, adsr: { a: 0.005, d: 0.1, s: 0.6, r: 0.6 } })); return b; },
};

export const SFX_IDS = Object.keys(S);

export function renderSfx(id) {
  const make = S[id];
  if (!make) return null;
  return fade(normalize(make(), 0.8), 0.002, 0.03);
}
