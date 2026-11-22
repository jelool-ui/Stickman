// Animations de texte (titres, accroches, sous-titres) : apparition « pop », machine à écrire, glissement.
import { ease, clamp } from '../math.js';

export function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Coupe un texte en lignes d'au plus maxChars caractères. */
export function wrapText(text, maxChars = 22) {
  // Typographie française : « ! ? : ; » restent collés au mot précédent (espace insécable).
  const words = [];
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    if (/^[!?:;»%…]+$/.test(w) && words.length) words[words.length - 1] += '\u00a0' + w;
    else if (words.length && words[words.length - 1] === '«') words[words.length - 1] += '\u00a0' + w;
    else words.push(w);
  }
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Texte animé centré en (x, y).
 * style : 'pop' | 'type' | 'slide' | 'none' ; t = secondes depuis l'apparition.
 * highlight : liste de mots mis en évidence (couleur d'accent).
 */
export function renderAnimatedText(text, { x, y, t = 1, style = 'pop', size = 64, color = '#ffffff', stroke = '#111111',
  accent = '#ffcc33', highlight = [], maxChars = 22, box = false, boxColor = 'rgba(0,0,0,0.55)', font = 'Fredoka', weight = 700 } = {}) {
  let shown = String(text);
  if (style === 'type') shown = shown.slice(0, Math.floor(clamp(t / 0.03, 0, shown.length)));
  const lines = wrapText(shown, maxChars);
  if (!lines.length) return '';
  const lh = size * 1.18;
  const p = clamp(t / 0.3, 0, 1);
  let transform = '';
  let opacity = 1;
  if (style === 'pop') { const s = 0.6 + 0.4 * ease.outBack(p); transform = `translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})`; opacity = clamp(p * 2, 0, 1); }
  if (style === 'slide') { transform = `translate(0 ${((1 - ease.out(p)) * 60).toFixed(1)})`; opacity = p; }
  const hl = new Set(highlight.map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')));
  const top = y - ((lines.length - 1) * lh) / 2;
  const tspans = lines.map((line, i) => {
    const words = line.split(' ').map((w) => {
      const key = w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      return hl.has(key) ? `<tspan fill="${accent}">${escapeXml(w)}</tspan>` : escapeXml(w);
    });
    return `<text x="${x}" y="${(top + i * lh).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-weight="${weight}" font-size="${size}" fill="${color}" stroke="${stroke}" stroke-width="${(size * 0.14).toFixed(1)}" stroke-linejoin="round" paint-order="stroke">${words.join(' ')}</text>`;
  });
  let bg = '';
  if (box) {
    const longest = Math.max(...lines.map((l) => l.length));
    const bw = longest * size * 0.56 + size, bh = lines.length * lh + size * 0.5;
    bg = `<rect x="${(x - bw / 2).toFixed(1)}" y="${(top - lh / 2 - size * 0.25).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${size * 0.35}" fill="${boxColor}"/>`;
  }
  return `<g${transform ? ` transform="${transform}"` : ''} opacity="${opacity.toFixed(2)}">${bg}${tspans.join('')}</g>`;
}
