// Dessin SVG d'un personnage Stickman articulé. Point d'entrée unique pour l'aperçu navigateur et le rendu vidéo.
import { isHexColor } from './library.js';
import { solveSkeleton, BASE_HEIGHT, STAND } from './skeleton.js';
import { round } from '../math.js';

const safe = (c, fallback) => (isHexColor(c) ? c : fallback);
const n = (v) => round(v, 1);

/**
 * Visage centré en (cx, cy) de rayon r.
 * mouthOpen (0..1) remplace la bouche par une bouche qui parle ; blink (0..1) ferme les yeux.
 */
export function renderFace(expression, cx, cy, r, stroke, { mouthOpen = 0, blink = 0, look = 0 } = {}) {
  const ex = r * 0.36, ey = cy - r * 0.12, er = r * 0.09;
  const L = cx - ex + look * r * 0.12, R = cx + ex + look * r * 0.12;
  const sw = n(r * 0.08);
  const parts = [];
  const eye = (x, sy = 1) => {
    const ry = er * sy * (1 - blink);
    return ry < er * 0.25
      ? `<line x1="${n(x - er)}" y1="${n(ey)}" x2="${n(x + er)}" y2="${n(ey)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`
      : `<ellipse cx="${n(x)}" cy="${n(ey)}" rx="${n(er)}" ry="${n(ry)}" fill="${stroke}"/>`;
  };
  const brow = (x1, y1, x2, y2) =>
    `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const path = (d, fill = 'none') =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const by = ey - r * 0.28, bw = r * 0.2;
  const mx = cx + look * r * 0.1, my = cy + r * 0.38, mw = r * 0.34;
  let mouth;

  switch (expression) {
    case 'happy':
      parts.push(eye(L), eye(R), brow(L - bw, by, L + bw, by - 2), brow(R - bw, by - 2, R + bw, by));
      mouth = path(`M${n(mx - mw)} ${n(my - 4)} Q${n(mx)} ${n(my + r * 0.3)} ${n(mx + mw)} ${n(my - 4)}`);
      break;
    case 'laughing':
      parts.push(path(`M${n(L - er * 1.5)} ${n(ey)} Q${n(L)} ${n(ey - er * 2)} ${n(L + er * 1.5)} ${n(ey)}`));
      parts.push(path(`M${n(R - er * 1.5)} ${n(ey)} Q${n(R)} ${n(ey - er * 2)} ${n(R + er * 1.5)} ${n(ey)}`));
      mouth = path(`M${n(mx - mw)} ${n(my - 6)} Q${n(mx)} ${n(my + r * 0.45)} ${n(mx + mw)} ${n(my - 6)} Z`, stroke);
      break;
    case 'sad':
      parts.push(eye(L), eye(R), brow(L - bw, by - 4, L + bw, by + 2), brow(R - bw, by + 2, R + bw, by - 4));
      mouth = path(`M${n(mx - mw * 0.8)} ${n(my + 6)} Q${n(mx)} ${n(my - r * 0.2)} ${n(mx + mw * 0.8)} ${n(my + 6)}`);
      break;
    case 'angry':
      parts.push(eye(L, 0.7), eye(R, 0.7), brow(L - bw, by - 4, L + bw, by + 6), brow(R - bw, by + 6, R + bw, by - 4));
      mouth = path(`M${n(mx - mw * 0.7)} ${n(my + 4)} L${n(mx + mw * 0.7)} ${n(my + 4)}`);
      break;
    case 'surprised':
      parts.push(eye(L, 1.4), eye(R, 1.4), brow(L - bw, by - 8, L + bw, by - 10), brow(R - bw, by - 10, R + bw, by - 8));
      mouth = `<ellipse cx="${n(mx)}" cy="${n(my + 2)}" rx="${n(r * 0.12)}" ry="${n(r * 0.17)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
      break;
    case 'thinking':
      parts.push(eye(L), eye(R, 0.6), brow(L - bw, by - 6, L + bw, by - 8), brow(R - bw, by, R + bw, by));
      mouth = path(`M${n(mx - mw * 0.5)} ${n(my + 2)} Q${n(mx + mw * 0.2)} ${n(my - 3)} ${n(mx + mw * 0.7)} ${n(my + 4)}`);
      break;
    case 'scared':
      parts.push(eye(L, 1.3), eye(R, 1.3), brow(L - bw, by - 2, L + bw, by - 8), brow(R - bw, by - 8, R + bw, by - 2));
      mouth = path(`M${n(mx - mw * 0.7)} ${n(my + 4)} l${n(mw * 0.35)} -6 l${n(mw * 0.35)} 6 l${n(mw * 0.35)} -6 l${n(mw * 0.35)} 6`);
      break;
    default:
      parts.push(eye(L), eye(R), brow(L - bw, by, L + bw, by), brow(R - bw, by, R + bw, by));
      mouth = path(`M${n(mx - mw * 0.6)} ${n(my)} L${n(mx + mw * 0.6)} ${n(my)}`);
  }
  if (mouthOpen > 0.05 && expression !== 'laughing') {
    const h = r * (0.05 + 0.2 * mouthOpen);
    mouth = `<ellipse cx="${n(mx)}" cy="${n(my + 2)}" rx="${n(r * 0.18)}" ry="${n(h)}" fill="${stroke}"/>`;
  }
  parts.push(mouth);
  return parts.join('');
}

function head(shape, cx, cy, r, fill, stroke, sw) {
  if (shape === 'square')
    return `<rect x="${n(cx - r)}" y="${n(cy - r)}" width="${n(2 * r)}" height="${n(2 * r)}" rx="${n(r * 0.3)}" fill="${fill}" stroke="${stroke}" stroke-width="${n(sw)}"/>`;
  if (shape === 'oval')
    return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r * 0.88)}" ry="${n(r * 1.08)}" fill="${fill}" stroke="${stroke}" stroke-width="${n(sw)}"/>`;
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${n(sw)}"/>`;
}

function headAccessory(kind, cx, cy, r, accent, stroke, sw) {
  const s = (k) => n(sw * k);
  switch (kind) {
    case 'cap':
      return `<path d="M${n(cx - r * 0.98)} ${n(cy - r * 0.5)} A${n(r)} ${n(r)} 0 0 1 ${n(cx + r * 0.98)} ${n(cy - r * 0.5)} Z" fill="${accent}" stroke="${stroke}" stroke-width="${s(0.6)}"/>` +
        `<rect x="${n(cx + r * 0.1)}" y="${n(cy - r * 0.62)}" width="${n(r * 1.15)}" height="${n(r * 0.16)}" rx="${n(r * 0.08)}" fill="${accent}" stroke="${stroke}" stroke-width="${s(0.5)}"/>`;
    case 'hat':
      return `<rect x="${n(cx - r * 1.3)}" y="${n(cy - r * 0.95)}" width="${n(r * 2.6)}" height="${n(r * 0.2)}" rx="4" fill="${accent}" stroke="${stroke}" stroke-width="${s(0.5)}"/>` +
        `<rect x="${n(cx - r * 0.7)}" y="${n(cy - r * 1.75)}" width="${n(r * 1.4)}" height="${n(r * 0.85)}" rx="6" fill="${accent}" stroke="${stroke}" stroke-width="${s(0.5)}"/>`;
    case 'glasses': {
      const y = cy - r * 0.12, gx = r * 0.36, gr = r * 0.22;
      return `<g fill="none" stroke="${accent}" stroke-width="${s(0.5)}"><circle cx="${n(cx - gx)}" cy="${n(y)}" r="${n(gr)}"/><circle cx="${n(cx + gx)}" cy="${n(y)}" r="${n(gr)}"/><line x1="${n(cx - gx + gr)}" y1="${n(y)}" x2="${n(cx + gx - gr)}" y2="${n(y)}"/></g>`;
    }
    case 'bow':
      return `<path d="M${n(cx + r * 0.5)} ${n(cy - r * 0.95)} l${n(r * 0.45)} -${n(r * 0.3)} v${n(r * 0.6)} Z M${n(cx + r * 0.5)} ${n(cy - r * 0.95)} l-${n(r * 0.45)} -${n(r * 0.3)} v${n(r * 0.6)} Z" fill="${accent}" stroke="${stroke}" stroke-width="${s(0.4)}" stroke-linejoin="round"/>`;
    default:
      return '';
  }
}

function hood(cx, cy, r, accent, stroke, sw) {
  return `<path d="M${n(cx - r * 1.2)} ${n(cy + r * 0.9)} Q${n(cx - r * 1.35)} ${n(cy - r * 1.4)} ${n(cx)} ${n(cy - r * 1.35)} Q${n(cx + r * 1.35)} ${n(cy - r * 1.4)} ${n(cx + r * 1.2)} ${n(cy + r * 0.9)} Q${n(cx)} ${n(cy + r * 0.2)} ${n(cx - r * 1.2)} ${n(cy + r * 0.9)} Z" fill="${accent}" fill-opacity="0.85" stroke="${stroke}" stroke-width="${n(sw * 0.5)}"/>`;
}

function neckAccessory(kind, neck, shoulder, r, accent, stroke, sw) {
  const [x, y] = [n((neck[0] + shoulder[0]) / 2), n((neck[1] + shoulder[1]) / 2)];
  if (kind === 'bowtie')
    return `<path d="M${x} ${y} l-${n(r * 0.4)} -${n(r * 0.22)} v${n(r * 0.44)} Z M${x} ${y} l${n(r * 0.4)} -${n(r * 0.22)} v${n(r * 0.44)} Z" fill="${accent}" stroke="${stroke}" stroke-width="${n(sw * 0.4)}" stroke-linejoin="round"/>`;
  if (kind === 'scarf')
    return `<path d="M${n(x - r * 0.6)} ${n(y - 4)} Q${x} ${n(y + 10)} ${n(x + r * 0.6)} ${n(y - 4)} M${n(x - r * 0.2)} ${n(y + 2)} l-${n(r * 0.3)} ${n(r * 0.7)}" fill="none" stroke="${accent}" stroke-width="${n(sw * 1.2)}" stroke-linecap="round"/>`;
  return '';
}

/**
 * Renvoie un groupe SVG du personnage, ancré au sol en (x, y).
 * options : pose, expression, mouthOpen, blink, facing (1 = vers la droite, -1 = vers la gauche, valeurs intermédiaires = demi-tour),
 *           scale, opacity, held (objet tenu en main, SVG centré sur la main droite)
 */
export function renderCharacterGroup(character, opts = {}) {
  const { x = 100, y = 280, scale = 1, expression, pose = STAND, mouthOpen = 0, blink = 0, facing = 1, opacity = 1, held = '', halo = null } = opts;
  const stroke = safe(character.colors?.stroke, '#1b1b1f');
  const headFill = safe(character.colors?.head, '#ffffff');
  const accent = safe(character.colors?.accent, '#ff5a36');
  const a = character.appearance || {};
  const sw = Math.min(16, Math.max(6, Number(a.thickness) || 10));
  const height = Math.min(1.2, Math.max(0.8, Number(a.height) || 1)) * BASE_HEIGHT;
  const { joints: j, headR, headRotation } = solveSkeleton(pose, height);
  const r = headR;
  const P = (p) => `${n(p[0])},${n(p[1])}`;
  const limb = (...pts) =>
    `<polyline points="${pts.map(P).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const [hx, hy] = j.headCenter;
  const expr = expression || character.expression || 'neutral';
  // Halo clair sur les décors sombres : le personnage reste lisible.
  const haloParts = halo && isHexColor(halo)
    ? [[j.shoulder, j.elbowL, j.handL], [j.hip, j.kneeL, j.footL], [j.neck, j.hip], [j.hip, j.kneeR, j.footR], [j.shoulder, j.elbowR, j.handR]]
      .map((pts) => `<polyline points="${pts.map(P).join(' ')}" fill="none" stroke="${halo}" stroke-opacity="0.85" stroke-width="${sw + 8}" stroke-linecap="round" stroke-linejoin="round"/>`)
      .concat(`<circle cx="${n(hx)}" cy="${n(hy)}" r="${n(r * 1.12 + sw * 0.4)}" fill="${halo}" fill-opacity="0.85"/>`)
    : [];
  // Les membres « arrière » sont dessinés d'abord pour donner de la profondeur.
  const parts = [
    ...haloParts,
    limb(j.shoulder, j.elbowL, j.handL),
    limb(j.hip, j.kneeL, j.footL),
    `<line x1="${n(j.neck[0])}" y1="${n(j.neck[1])}" x2="${n(j.hip[0])}" y2="${n(j.hip[1])}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`,
    limb(j.hip, j.kneeR, j.footR),
    `<g transform="rotate(${n(headRotation)} ${n(hx)} ${n(hy)})">`,
    a.accessory === 'hood' ? hood(hx, hy, r, accent, stroke, sw) : '',
    head(a.headShape, hx, hy, r, headFill, stroke, sw * 0.7),
    renderFace(expr, hx, hy, r, stroke, { mouthOpen, blink, look: 0.6 }),
    headAccessory(a.accessory, hx, hy, r, accent, stroke, sw),
    '</g>',
    limb(j.shoulder, j.elbowR, j.handR),
    neckAccessory(a.accessory, j.neck, j.shoulder, r, accent, stroke, sw),
    held ? `<g transform="translate(${P(j.handR)})">${held}</g>` : '',
  ];
  const sx = Math.abs(facing) < 0.05 ? 0.05 * Math.sign(facing || 1) : facing;
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(scale * sx)} ${n(scale)})"${opacity < 1 ? ` opacity="${n(opacity)}"` : ''}>${parts.join('')}</g>`;
}

export function renderCharacterSVG(character, { width = 200, height = 300, expression, pose, mouthOpen, blink, facing } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="${width}" height="${height}">${renderCharacterGroup(character, { x: 100, y: 290, expression, pose, mouthOpen, blink, facing })}</svg>`;
}
