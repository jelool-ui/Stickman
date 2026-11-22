// Dessin SVG d'un personnage Stickman (pose de face, statique).
// Phase 3 ajoutera le squelette articulé et les poses animées ; cette fonction reste le point d'entrée unique
// utilisé à la fois par l'aperçu navigateur et par le rendu vidéo.
import { isHexColor } from './library.js';

const safe = (c, fallback) => (isHexColor(c) ? c : fallback);

export function renderFace(expression, cx, cy, r, stroke) {
  const ex = r * 0.36, ey = cy - r * 0.12, er = r * 0.09;
  const L = cx - ex, R = cx + ex;
  const parts = [];
  const eye = (x, sy = 1) => `<ellipse cx="${x}" cy="${ey}" rx="${er}" ry="${er * sy}" fill="${stroke}"/>`;
  const brow = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${r * 0.08}" stroke-linecap="round"/>`;
  const by = ey - r * 0.28, bw = r * 0.2;
  const my = cy + r * 0.38, mw = r * 0.34;
  const path = (d, fill = 'none') =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${r * 0.08}" stroke-linecap="round" stroke-linejoin="round"/>`;

  switch (expression) {
    case 'happy':
      parts.push(eye(L), eye(R), brow(L - bw, by, L + bw, by - 2), brow(R - bw, by - 2, R + bw, by));
      parts.push(path(`M${cx - mw} ${my - 4} Q${cx} ${my + r * 0.3} ${cx + mw} ${my - 4}`));
      break;
    case 'laughing':
      parts.push(path(`M${L - er * 1.5} ${ey} Q${L} ${ey - er * 2} ${L + er * 1.5} ${ey}`));
      parts.push(path(`M${R - er * 1.5} ${ey} Q${R} ${ey - er * 2} ${R + er * 1.5} ${ey}`));
      parts.push(path(`M${cx - mw} ${my - 6} Q${cx} ${my + r * 0.45} ${cx + mw} ${my - 6} Z`, stroke));
      break;
    case 'sad':
      parts.push(eye(L), eye(R), brow(L - bw, by - 4, L + bw, by + 2), brow(R - bw, by + 2, R + bw, by - 4));
      parts.push(path(`M${cx - mw * 0.8} ${my + 6} Q${cx} ${my - r * 0.2} ${cx + mw * 0.8} ${my + 6}`));
      break;
    case 'angry':
      parts.push(eye(L, 0.7), eye(R, 0.7), brow(L - bw, by - 4, L + bw, by + 6), brow(R - bw, by + 6, R + bw, by - 4));
      parts.push(path(`M${cx - mw * 0.7} ${my + 4} L${cx + mw * 0.7} ${my + 4}`));
      break;
    case 'surprised':
      parts.push(eye(L, 1.4), eye(R, 1.4), brow(L - bw, by - 8, L + bw, by - 10), brow(R - bw, by - 10, R + bw, by - 8));
      parts.push(`<ellipse cx="${cx}" cy="${my + 2}" rx="${r * 0.12}" ry="${r * 0.17}" fill="none" stroke="${stroke}" stroke-width="${r * 0.08}"/>`);
      break;
    case 'thinking':
      parts.push(eye(L), eye(R, 0.6), brow(L - bw, by - 6, L + bw, by - 8), brow(R - bw, by, R + bw, by));
      parts.push(path(`M${cx - mw * 0.5} ${my + 2} Q${cx + mw * 0.2} ${my - 3} ${cx + mw * 0.7} ${my + 4}`));
      break;
    case 'scared':
      parts.push(eye(L, 1.3), eye(R, 1.3), brow(L - bw, by - 2, L + bw, by - 8), brow(R - bw, by - 8, R + bw, by - 2));
      parts.push(path(`M${cx - mw * 0.7} ${my + 4} l${mw * 0.35} -6 l${mw * 0.35} 6 l${mw * 0.35} -6 l${mw * 0.35} 6`));
      break;
    default:
      parts.push(eye(L), eye(R), brow(L - bw, by, L + bw, by), brow(R - bw, by, R + bw, by));
      parts.push(path(`M${cx - mw * 0.6} ${my} L${cx + mw * 0.6} ${my}`));
  }
  return parts.join('');
}

function head(shape, cx, cy, r, fill, stroke, sw) {
  if (shape === 'square')
    return `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.3}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  if (shape === 'oval')
    return `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.88}" ry="${r * 1.08}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function accessory(kind, cx, cy, r, accent, stroke, sw, neckY) {
  switch (kind) {
    case 'cap':
      return `<path d="M${cx - r} ${cy - r * 0.25} A${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.25} Z" fill="${accent}" stroke="${stroke}" stroke-width="${sw * 0.6}"/>` +
        `<rect x="${cx}" y="${cy - r * 0.35}" width="${r * 1.2}" height="${r * 0.18}" rx="${r * 0.08}" fill="${accent}" stroke="${stroke}" stroke-width="${sw * 0.5}"/>`;
    case 'hat':
      return `<rect x="${cx - r * 1.3}" y="${cy - r * 0.95}" width="${r * 2.6}" height="${r * 0.2}" rx="4" fill="${accent}" stroke="${stroke}" stroke-width="${sw * 0.5}"/>` +
        `<rect x="${cx - r * 0.7}" y="${cy - r * 1.75}" width="${r * 1.4}" height="${r * 0.85}" rx="6" fill="${accent}" stroke="${stroke}" stroke-width="${sw * 0.5}"/>`;
    case 'glasses': {
      const y = cy - r * 0.12, gx = r * 0.36, gr = r * 0.22;
      return `<g fill="none" stroke="${accent}" stroke-width="${sw * 0.5}"><circle cx="${cx - gx}" cy="${y}" r="${gr}"/><circle cx="${cx + gx}" cy="${y}" r="${gr}"/><line x1="${cx - gx + gr}" y1="${y}" x2="${cx + gx - gr}" y2="${y}"/></g>`;
    }
    case 'bow':
      return `<path d="M${cx + r * 0.5} ${cy - r * 0.95} l${r * 0.45} -${r * 0.3} v${r * 0.6} Z M${cx + r * 0.5} ${cy - r * 0.95} l-${r * 0.45} -${r * 0.3} v${r * 0.6} Z" fill="${accent}" stroke="${stroke}" stroke-width="${sw * 0.4}" stroke-linejoin="round"/>`;
    case 'bowtie':
      return `<path d="M${cx} ${neckY} l-${r * 0.4} -${r * 0.22} v${r * 0.44} Z M${cx} ${neckY} l${r * 0.4} -${r * 0.22} v${r * 0.44} Z" fill="${accent}" stroke="${stroke}" stroke-width="${sw * 0.4}" stroke-linejoin="round"/>`;
    case 'scarf':
      return `<path d="M${cx - r * 0.6} ${neckY - 4} Q${cx} ${neckY + 10} ${cx + r * 0.6} ${neckY - 4} M${cx + r * 0.2} ${neckY + 2} l${r * 0.15} ${r * 0.7}" fill="none" stroke="${accent}" stroke-width="${sw * 1.2}" stroke-linecap="round"/>`;
    case 'hood':
      return `<path d="M${cx - r * 1.2} ${cy + r * 0.9} Q${cx - r * 1.35} ${cy - r * 1.4} ${cx} ${cy - r * 1.35} Q${cx + r * 1.35} ${cy - r * 1.4} ${cx + r * 1.2} ${cy + r * 0.9} Q${cx} ${cy + r * 0.2} ${cx - r * 1.2} ${cy + r * 0.9} Z" fill="${accent}" fill-opacity="0.85" stroke="${stroke}" stroke-width="${sw * 0.5}"/>`;
    default:
      return '';
  }
}

/** Renvoie le contenu SVG (sans balise <svg>) d'un personnage debout, pieds en (x, y). */
export function renderCharacterGroup(character, { x = 100, y = 280, scale = 1, expression } = {}) {
  const stroke = safe(character.colors?.stroke, '#1b1b1f');
  const headFill = safe(character.colors?.head, '#ffffff');
  const accent = safe(character.colors?.accent, '#ff5a36');
  const a = character.appearance || {};
  const sw = Math.min(16, Math.max(6, Number(a.thickness) || 10));
  const h = Math.min(1.2, Math.max(0.8, Number(a.height) || 1)) * 230;
  const r = 34;
  const hipY = -h * 0.42, neckY = -h * 0.78, headY = neckY - r - 4, shoulderY = neckY + 10;
  const limb = (x1, y1, x2, y2, x3, y3) =>
    `<polyline points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const body = [
    limb(0, hipY, -20, hipY * 0.5, -30, 0),
    limb(0, hipY, 20, hipY * 0.5, 30, 0),
    `<line x1="0" y1="${neckY}" x2="0" y2="${hipY}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`,
    limb(0, shoulderY, -30, shoulderY + 35, -42, shoulderY + 72),
    limb(0, shoulderY, 30, shoulderY + 35, 42, shoulderY + 72),
    a.accessory === 'hood' ? accessory('hood', 0, headY, r, accent, stroke, sw, neckY) : '',
    head(a.headShape, 0, headY, r, headFill, stroke, sw * 0.7),
    renderFace(expression || character.expression || 'neutral', 0, headY, r, stroke),
    a.accessory !== 'hood' ? accessory(a.accessory, 0, headY, r, accent, stroke, sw, neckY) : '',
  ];
  return `<g transform="translate(${x} ${y}) scale(${scale})">${body.join('')}</g>`;
}

export function renderCharacterSVG(character, { width = 200, height = 300, expression } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="${width}" height="${height}">${renderCharacterGroup(character, { x: 100, y: 285, expression })}</svg>`;
}
