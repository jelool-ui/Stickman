// Sous-titres : découpage en blocs lisibles (2 lignes maximum), synchronisation sur l'audio réel, format SRT.
import { wrapText } from '../animation/text.js';

/** Découpe un texte en blocs d'au plus maxChars caractères, en coupant de préférence après la ponctuation. */
export function chunkText(text, maxChars = 42) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const chunks = [];
  let cur = [];
  const len = (arr) => arr.join(' ').length;
  for (const w of words) {
    if (cur.length && len([...cur, w]) > maxChars) { chunks.push(cur.join(' ')); cur = []; }
    cur.push(w);
    // Coupe naturelle après une fin de phrase quand le bloc est déjà bien rempli.
    if (/[.!?…]$/.test(w) && len(cur) > maxChars * 0.45) { chunks.push(cur.join(' ')); cur = []; }
  }
  if (cur.length) {
    // Évite un dernier bloc d'un seul petit mot.
    if (chunks.length && cur.length === 1 && len([chunks.at(-1), ...cur]) <= maxChars + 8) chunks[chunks.length - 1] += ' ' + cur[0];
    else chunks.push(cur.join(' '));
  }
  return chunks;
}

/** Répartit les blocs d'un segment audio [start, start+duration] proportionnellement au nombre de caractères. */
export function timeChunks(text, start, duration, maxChars = 42) {
  const chunks = chunkText(text, maxChars);
  const total = chunks.reduce((a, c) => a + c.length, 0) || 1;
  let t = start;
  return chunks.map((c) => {
    const d = (duration * c.length) / total;
    const item = { start: round3(t), end: round3(t + d), text: c };
    t += d;
    return item;
  });
}

const round3 = (v) => Math.round(v * 1000) / 1000;

export function srtTime(sec) {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  const p = (v, n = 2) => String(v).padStart(n, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
}

/** Fichier SRT à partir de blocs { start, end, text } en temps absolu. */
export function toSrt(cues, maxLineChars = 22) {
  return cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${wrapText(c.text, maxLineChars).join('\n')}\n`).join('\n');
}

/** Rassemble les blocs de toutes les scènes en temps absolu. */
export function collectCues(storyboard) {
  let t = 0;
  const cues = [];
  for (const s of storyboard.scenes) {
    for (const c of s.subtitle_chunks || []) cues.push({ start: round3(t + c.start), end: round3(t + c.end), text: c.text, scene_id: s.scene_id });
    t += Number(s.duration) || 0;
  }
  return cues;
}
