// Générateur de musique de fond originale (aucun échantillon, aucune mélodie existante) : progression d'accords,
// basse, nappe, arpèges et batterie simples, selon l'ambiance de la catégorie. Déterministe (graine).
import { buffer, addTone, addNoise, addKick, normalize, fade, midiToHz } from './synth.js';
import { seededRandom } from '../../engine/math.js';

const MAJ = { I: [0, 'M'], ii: [2, 'm'], iii: [4, 'm'], IV: [5, 'M'], V: [7, 'M'], vi: [9, 'm'] };
const MIN = { i: [0, 'm'], iv: [5, 'm'], v: [7, 'm'], V: [7, 'M'], VI: [8, 'M'], VII: [10, 'M'], III: [3, 'M'] };

export const MOODS = {
  curieux: { bpm: 104, key: 60, map: MAJ, prog: ['I', 'vi', 'IV', 'V'], arp: 'eighths', drums: 'soft', bassStyle: 'roots' },
  joyeux: { bpm: 118, key: 65, map: MAJ, prog: ['I', 'V', 'vi', 'IV'], arp: 'staccato', drums: 'claps', bassStyle: 'bounce' },
  mysterieux: { bpm: 76, key: 57, map: MIN, prog: ['i', 'VI', 'iv', 'V'], arp: 'bells', drums: 'none', bassStyle: 'drone' },
  reveur: { bpm: 88, key: 62, map: MAJ, prog: ['IV', 'I', 'V', 'vi'], arp: 'slow', drums: 'none', bassStyle: 'roots' },
  dynamique: { bpm: 124, key: 64, map: MIN, prog: ['i', 'VI', 'III', 'VII'], arp: 'eighths', drums: 'four', bassStyle: 'drive' },
  inspirant: { bpm: 96, key: 60, map: MAJ, prog: ['vi', 'IV', 'I', 'V'], arp: 'eighths', drums: 'build', bassStyle: 'roots' },
};

function chordNotes(root, quality) {
  return quality === 'm' ? [root, root + 3, root + 7] : [root, root + 4, root + 7];
}

/** Génère `seconds` de musique. Renvoie un Float32Array (mono, 44,1 kHz). */
export function renderMusic(mood, seconds, seed = 'music') {
  const m = MOODS[mood] || MOODS.curieux;
  const rnd = seededRandom(`${seed}:${mood}`);
  const beat = 60 / m.bpm;
  const bar = beat * 4;
  const b = buffer(seconds + 1);
  const bars = Math.ceil(seconds / bar);
  for (let i = 0; i < bars; i++) {
    const t0 = i * bar;
    const [deg, q] = m.map[m.prog[i % m.prog.length]];
    const root = m.key + deg;
    const notes = chordNotes(root, q);
    const intensity = m.drums === 'build' ? Math.min(1, 0.3 + i / Math.max(1, bars * 0.6)) : 1;

    // Nappe (accord tenu, voix légèrement désaccordées, filtrée).
    for (const n of notes) addTone(b, t0, { wave: 'saw', freq: midiToHz(n - 12), dur: bar * 0.95, gain: 0.05, detune: 9, lp: 900, adsr: { a: 0.35, d: 0.3, s: 0.8, r: 0.5 } });

    // Basse.
    const bassNote = midiToHz(root - 24);
    if (m.bassStyle === 'drone') addTone(b, t0, { wave: 'triangle', freq: bassNote, dur: bar, gain: 0.22, adsr: { a: 0.2, d: 0.2, s: 0.9, r: 0.3 } });
    else if (m.bassStyle === 'drive') for (let k = 0; k < 8; k++) addTone(b, t0 + k * beat / 2, { wave: 'saw', freq: bassNote, dur: beat * 0.35, gain: 0.14, lp: 500, adsr: { a: 0.005, d: 0.1, s: 0.5, r: 0.05 } });
    else if (m.bassStyle === 'bounce') for (const [k, o] of [[0, 0], [1.5, 7], [2, 0], [3, 12]]) addTone(b, t0 + k * beat, { wave: 'triangle', freq: midiToHz(root - 24 + o), dur: beat * 0.4, gain: 0.25, adsr: { a: 0.005, d: 0.15, s: 0.4, r: 0.08 } });
    else for (const k of [0, 2]) addTone(b, t0 + k * beat, { wave: 'triangle', freq: bassNote, dur: beat * 1.6, gain: 0.25, adsr: { a: 0.01, d: 0.3, s: 0.6, r: 0.2 } });

    // Arpèges / accompagnement.
    const pattern = [0, 1, 2, 1, 0, 2, 1, 2];
    if (m.arp === 'eighths') pattern.forEach((p, k) => addTone(b, t0 + k * beat / 2, { wave: 'triangle', freq: midiToHz(notes[p] + 12), dur: beat * 0.3, gain: 0.08 * (0.6 + 0.4 * intensity), lp: 3500, adsr: { a: 0.004, d: 0.15, s: 0.2, r: 0.15 } }));
    if (m.arp === 'staccato') for (const k of [0.5, 1.5, 2.5, 3.5]) for (const n of notes) addTone(b, t0 + k * beat, { wave: 'square', freq: midiToHz(n + 12), dur: beat * 0.15, gain: 0.03, lp: 2500, adsr: { a: 0.003, d: 0.08, s: 0.2, r: 0.06 } });
    if (m.arp === 'slow') notes.forEach((n, k) => addTone(b, t0 + k * beat * 1.3, { wave: 'sine', freq: midiToHz(n + 12), dur: beat, gain: 0.09, adsr: { a: 0.05, d: 0.3, s: 0.5, r: 0.8 } }));
    if (m.arp === 'bells' && i % 2 === 0) [2, 1, 0].forEach((p, k) => addTone(b, t0 + (k * 1.5 + rnd() * 0.2) * beat, { wave: 'sine', freq: midiToHz(notes[p] + 24), dur: 0.05, gain: 0.08, adsr: { a: 0.002, d: 0.05, s: 0.8, r: 1.5 } }));

    // Petite mélodie, une mesure sur deux, à partir des notes de l'accord (originale, tirée au sort).
    if (i % 2 === 1 && m.arp !== 'bells') {
      for (let k = 0; k < 4; k++) if (rnd() < 0.75) addTone(b, t0 + k * beat, { wave: 'sine', freq: midiToHz(notes[Math.floor(rnd() * 3)] + 24), dur: beat * 0.5, gain: 0.05, vibrato: 0.004, adsr: { a: 0.02, d: 0.2, s: 0.5, r: 0.3 } });
    }

    // Batterie.
    if (m.drums !== 'none' && !(m.drums === 'build' && intensity < 0.5)) {
      for (let k = 0; k < 4; k++) {
        const t = t0 + k * beat;
        if (m.drums === 'four' || k % 2 === 0) addKick(b, t, 0.35 * intensity);
        if ((m.drums === 'claps' || m.drums === 'four' || m.drums === 'build') && k % 2 === 1) addNoise(b, t, { dur: 0.08, gain: 0.14 * intensity, hp: 1200, lp: 7000, adsr: { a: 0.002, d: 0.07, s: 0, r: 0.04 }, seed: i * 10 + k });
        addNoise(b, t + beat / 2, { dur: 0.03, gain: 0.05 * intensity, hp: 7000, adsr: { a: 0.001, d: 0.03, s: 0, r: 0.02 }, seed: i * 31 + k });
      }
    }
  }
  const out = b.subarray(0, Math.ceil(seconds * 44100));
  return fade(normalize(out, 0.7), 1.0, 2.0);
}
