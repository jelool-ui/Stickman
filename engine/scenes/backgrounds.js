// Bibliothèque de décors SVG originaux.
// Ajouter un décor : registerBackground('id', { label, render: ({ w, h, g, pal, t }) => '<svg…>' }) — aucun changement du moteur.
// w, h : taille de l'image ; g : hauteur du sol (y) ; pal : palette ; t : temps (pour les petites animations d'ambiance).
import { seededRandom } from '../math.js';

const REGISTRY = new Map();
export function registerBackground(id, def) { REGISTRY.set(id, def); }
export function getBackground(id) { return REGISTRY.get(id) || REGISTRY.get('abstract'); }
export function listBackgrounds() { return [...REGISTRY.entries()].map(([id, d]) => [id, d.label]); }

const r1 = (v) => Math.round(v * 10) / 10;
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}" ${extra}/>`;
const line = (pal, sw = 6) => `stroke="${pal.line}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
const sky = ({ w, h, pal }) => `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.sky2}"/><stop offset="1" stop-color="${pal.sky}"/></linearGradient></defs>${rect(0, 0, w, h, 'url(#sky)')}`;
const floor = ({ w, h, g, pal }) => rect(0, g, w, h - g, pal.ground) + `<line x1="0" y1="${g}" x2="${w}" y2="${g}" ${line(pal, 6)}/>`;
const cloud = (x, y, s, pal) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})" fill="#ffffff" fill-opacity="0.9" ${line(pal, 4)}><path d="M-60 20 Q-70 -10 -35 -12 Q-25 -40 5 -30 Q30 -45 45 -15 Q75 -12 65 20 Z"/></g>`;
const windowFrame = (x, y, w, h, pal, t = 0) =>
  rect(x, y, w, h, pal.window, line(pal, 6)) + `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" ${line(pal, 5)}/><line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" ${line(pal, 5)}/>`;

registerBackground('bedroom', { label: 'Chambre', render: (c) => {
  const { w, g, pal } = c;
  return sky(c) + rect(0, 0, w, g, pal.sky) + floor(c) +
    windowFrame(w * 0.62, g * 0.28, w * 0.26, g * 0.24, pal) +
    rect(w * 0.6, g * 0.26, w * 0.05, g * 0.3, pal.a1, line(pal, 4)) + rect(w * 0.85, g * 0.26, w * 0.05, g * 0.3, pal.a1, line(pal, 4)) +
    rect(w * 0.1, g * 0.3, w * 0.16, g * 0.18, pal.a2, line(pal, 5)) + `<circle cx="${w * 0.18}" cy="${g * 0.39}" r="${w * 0.04}" fill="${pal.a4}" ${line(pal, 4)}/>` +
    `<path d="M${w * 0.02} ${g} v-${g * 0.16} h${w * 0.36} v${g * 0.16}" fill="${pal.a2}" ${line(pal, 6)}/>` + rect(w * 0.02, g - g * 0.2, w * 0.1, g * 0.06, '#ffffff', line(pal, 5)) +
    rect(w * 0.0, g - g * 0.24, w * 0.02, g * 0.24, pal.soft, line(pal, 5));
} });

registerBackground('school', { label: 'École', render: (c) => {
  const { w, g, pal } = c;
  const desks = [0.08, 0.72].map((x) => rect(w * x, g - g * 0.12, w * 0.2, g * 0.025, pal.a1, line(pal, 5)) + `<line x1="${w * (x + 0.02)}" y1="${g - g * 0.1}" x2="${w * (x + 0.02)}" y2="${g}" ${line(pal, 6)}/><line x1="${w * (x + 0.18)}" y1="${g - g * 0.1}" x2="${w * (x + 0.18)}" y2="${g}" ${line(pal, 6)}/>`).join('');
  return sky(c) + rect(0, 0, w, g, pal.sky) + floor(c) +
    rect(w * 0.1, g * 0.2, w * 0.8, g * 0.3, '#2f5d50', line(pal, 8)) +
    `<g stroke="#e8f1e4" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.85"><path d="M${w * 0.18} ${g * 0.3} q40 -30 80 0 t80 0"/><path d="M${w * 0.18} ${g * 0.4} h${w * 0.3}"/><text x="${w * 0.62}" y="${g * 0.38}" font-family="Fredoka" font-size="${w * 0.07}" fill="#e8f1e4" stroke="none">2+2</text></g>` +
    rect(w * 0.1, g * 0.5, w * 0.8, g * 0.02, pal.soft, line(pal, 5)) + `<circle cx="${w * 0.5}" cy="${g * 0.1}" r="${w * 0.05}" fill="#ffffff" ${line(pal, 5)}/><line x1="${w * 0.5}" y1="${g * 0.1}" x2="${w * 0.5}" y2="${g * 0.075}" ${line(pal, 4)}/><line x1="${w * 0.5}" y1="${g * 0.1}" x2="${w * 0.52}" y2="${g * 0.1}" ${line(pal, 4)}/>` + desks;
} });

registerBackground('office', { label: 'Bureau', render: (c) => {
  const { w, g, pal } = c;
  const blinds = Array.from({ length: 7 }, (_, i) => `<line x1="${w * 0.08}" y1="${g * 0.24 + i * g * 0.035}" x2="${w * 0.38}" y2="${g * 0.24 + i * g * 0.035}" ${line(pal, 3)} opacity="0.6"/>`).join('');
  return sky(c) + rect(0, 0, w, g, pal.sky) + floor(c) + windowFrame(w * 0.08, g * 0.22, w * 0.3, g * 0.26, pal) + blinds +
    rect(w * 0.6, g - g * 0.14, w * 0.36, g * 0.025, pal.soft, line(pal, 5)) + `<line x1="${w * 0.63}" y1="${g - g * 0.12}" x2="${w * 0.63}" y2="${g}" ${line(pal, 6)}/><line x1="${w * 0.93}" y1="${g - g * 0.12}" x2="${w * 0.93}" y2="${g}" ${line(pal, 6)}/>` +
    rect(w * 0.7, g - g * 0.27, w * 0.18, g * 0.11, pal.a2, line(pal, 6)) + `<line x1="${w * 0.79}" y1="${g - g * 0.16}" x2="${w * 0.79}" y2="${g - g * 0.14}" ${line(pal, 6)}/>` +
    `<path d="M${w * 0.07} ${g} l-${w * 0.03} -${g * 0.08} h${w * 0.06} Z" fill="${pal.a1}" ${line(pal, 5)}/><path d="M${w * 0.07} ${g - g * 0.08} q-${w * 0.06} -${g * 0.08} 0 -${g * 0.14} q${w * 0.06} ${g * 0.06} 0 ${g * 0.14}" fill="${pal.a3}" ${line(pal, 4)}/>`;
} });

registerBackground('street', { label: 'Rue', render: (c) => {
  const { w, h, g, pal, t } = c;
  const rnd = seededRandom('street');
  const bld = Array.from({ length: 6 }, (_, i) => { const bw = w * 0.2, bh = g * (0.35 + rnd() * 0.3), x = i * w * 0.19 - w * 0.05; return rect(x, g - bh, bw, bh, i % 2 ? pal.soft : pal.sky2, line(pal, 5)) + rect(x + bw * 0.2, g - bh + 30, bw * 0.25, bh * 0.12, pal.window, line(pal, 3)) + rect(x + bw * 0.55, g - bh + 30, bw * 0.25, bh * 0.12, pal.window, line(pal, 3)); }).join('');
  return sky(c) + cloud(((t * 15) % (w + 300)) - 150, g * 0.18, 1.4, pal) + bld + rect(0, g, w, h - g, '#8a8f99') + rect(0, g, w, 40, pal.soft, line(pal, 5)) +
    Array.from({ length: 5 }, (_, i) => rect(i * w * 0.25 + 20, g + (h - g) * 0.45, w * 0.12, 12, '#ffffff', 'rx="6"')).join('') +
    `<line x1="${w * 0.88}" y1="${g}" x2="${w * 0.88}" y2="${g * 0.55}" ${line(pal, 8)}/><path d="M${w * 0.88} ${g * 0.55} q0 -30 -50 -30" fill="none" ${line(pal, 8)}/><circle cx="${w * 0.88 - 52}" cy="${g * 0.55 - 18}" r="18" fill="${pal.a4}" ${line(pal, 5)}/>`;
} });

registerBackground('house', { label: 'Maison', render: (c) => {
  const { w, g, pal, t } = c;
  return sky(c) + cloud(((t * 12) % (w + 300)) - 150, g * 0.12, 1.2, pal) + cloud(((t * 8 + w * 0.6) % (w + 300)) - 150, g * 0.25, 0.9, pal) +
    rect(w * 0.12, g * 0.42, w * 0.76, g * 0.58, '#fff7e8', line(pal, 7)) + `<path d="M${w * 0.06} ${g * 0.44} L${w * 0.5} ${g * 0.16} L${w * 0.94} ${g * 0.44} Z" fill="${pal.a1}" ${line(pal, 7)}/>` +
    windowFrame(w * 0.2, g * 0.52, w * 0.18, g * 0.13, pal) + windowFrame(w * 0.62, g * 0.52, w * 0.18, g * 0.13, pal) +
    rect(w * 0.42, g * 0.7, w * 0.16, g * 0.3, pal.a2, line(pal, 6)) + `<circle cx="${w * 0.55}" cy="${g * 0.86}" r="7" fill="${pal.line}"/>` +
    `<rect x="0" y="${g}" width="${w}" height="${c.h - g}" fill="${pal.a3}"/><line x1="0" y1="${g}" x2="${w}" y2="${g}" ${line(pal, 6)}/>`;
} });

registerBackground('city', { label: 'Ville', render: (c) => {
  const { w, g, pal, t } = c;
  const rnd = seededRandom('city');
  let s = sky(c) + `<circle cx="${w * 0.8}" cy="${g * 0.15}" r="${w * 0.08}" fill="${pal.a4}" ${line(pal, 5)}/>`;
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < 7; i++) {
      const bw = w * (0.12 + rnd() * 0.08), bh = g * (0.25 + rnd() * (layer ? 0.3 : 0.45)), x = i * w * 0.15 - (layer ? 20 : 60);
      s += rect(x, g - bh, bw, bh, layer ? pal.sky2 : pal.soft, line(pal, 4) + (layer ? '' : ' opacity="0.6"'));
      if (layer) for (let k = 0; k < 4; k++) s += rect(x + 12 + (k % 2) * bw * 0.45, g - bh + 24 + Math.floor(k / 2) * 50, bw * 0.3, 26, (Math.floor(t * 0.5 + i + k) % 5) ? pal.window : pal.a4, line(pal, 2));
    }
  }
  return s + floor(c);
} });

registerBackground('space', { label: 'Espace', dark: true, render: (c) => {
  const { w, h, g, t } = c;
  const rnd = seededRandom('space');
  const stars = Array.from({ length: 70 }, (_, i) => { const x = rnd() * w, y = rnd() * g, rr = 1.5 + rnd() * 3; const o = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)); return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(rr)}" fill="#ffffff" opacity="${o.toFixed(2)}"/>`; }).join('');
  return rect(0, 0, w, h, '#0b0f24') + stars + `<circle cx="${w * 0.75}" cy="${g * 0.25}" r="${w * 0.14}" fill="#e07a5f" stroke="#f4f1de" stroke-width="6"/><ellipse cx="${w * 0.75}" cy="${g * 0.25}" rx="${w * 0.24}" ry="${w * 0.04}" fill="none" stroke="#f2cc8f" stroke-width="8" transform="rotate(-15 ${w * 0.75} ${g * 0.25})"/>` +
    rect(0, g, w, h - g, '#9a9db0') + `<line x1="0" y1="${g}" x2="${w}" y2="${g}" stroke="#f4f1de" stroke-width="6"/>` +
    [[0.2, 0.1], [0.55, 0.3], [0.85, 0.15]].map(([x, y]) => `<ellipse cx="${w * x}" cy="${g + (h - g) * y}" rx="${w * 0.07}" ry="${w * 0.02}" fill="#7d8096"/>`).join('');
} });

registerBackground('forest', { label: 'Forêt', render: (c) => {
  const { w, g, pal, t } = c;
  const tree = (x, s, col) => `<g transform="translate(${r1(x)} ${g}) scale(${s})"><rect x="-14" y="-120" width="28" height="120" fill="#8d5a3b" ${line(pal, 5)}/><path d="M0 -380 L-110 -150 H110 Z M0 -300 L-130 -90 H130 Z" fill="${col}" ${line(pal, 5)}/></g>`;
  const sway = Math.sin(t * 0.8) * 2;
  return sky(c) + `<g transform="rotate(${sway.toFixed(2)} ${w / 2} ${g})">` + tree(w * 0.12, 1.3, pal.a3) + tree(w * 0.42, 0.9, '#5fa874') + tree(w * 0.9, 1.4, pal.a3) + tree(w * 0.68, 1.0, '#5fa874') + '</g>' +
    `<rect x="0" y="${g}" width="${w}" height="${c.h - g}" fill="#6dbf8b"/><line x1="0" y1="${g}" x2="${w}" y2="${g}" ${line(pal, 6)}/>`;
} });

registerBackground('landscape', { label: 'Paysage', render: (c) => {
  const { w, h, g, pal, t } = c;
  return sky(c) + `<circle cx="${w * 0.2}" cy="${g * 0.22}" r="${w * 0.09}" fill="${pal.a4}" ${line(pal, 5)}/>` + cloud(((t * 14) % (w + 300)) - 150, g * 0.15, 1.3, pal) +
    `<path d="M0 ${g * 0.75} Q${w * 0.25} ${g * 0.5} ${w * 0.55} ${g * 0.72} T${w} ${g * 0.62} V${g} H0 Z" fill="#9fd3a8" ${line(pal, 5)}/>` +
    `<path d="M0 ${g * 0.88} Q${w * 0.4} ${g * 0.72} ${w} ${g * 0.86} V${g} H0 Z" fill="#7cc68d" ${line(pal, 5)}/>` +
    rect(0, g, w, h - g, '#6aaa75') + `<line x1="0" y1="${g}" x2="${w}" y2="${g}" ${line(pal, 6)}/><path d="M${w * 0.45} ${h} Q${w * 0.5} ${g + (h - g) * 0.4} ${w * 0.58} ${g}" stroke="#d9c79c" stroke-width="60" fill="none" opacity="0.8"/>`;
} });

registerBackground('abstract', { label: 'Abstrait', render: (c) => {
  const { w, h, g, pal, t } = c;
  const blobs = [[0.2, 0.2, 0.25, pal.a1], [0.8, 0.35, 0.3, pal.a2], [0.5, 0.6, 0.22, pal.a4], [0.15, 0.75, 0.18, pal.a3]]
    .map(([x, y, rr, col], i) => `<circle cx="${r1(w * x + Math.sin(t * 0.5 + i) * 30)}" cy="${r1(h * y + Math.cos(t * 0.4 + i) * 30)}" r="${r1(w * rr)}" fill="${col}" opacity="0.35"/>`).join('');
  return rect(0, 0, w, h, pal.sky) + blobs + `<line x1="0" y1="${g}" x2="${w}" y2="${g}" ${line(pal, 6)} opacity="0.7"/>`;
} });

registerBackground('mystery', { label: 'Mystérieux', dark: true, render: (c) => {
  const { w, h, g, t } = c;
  const fog = [0, 1, 2].map((i) => `<ellipse cx="${r1(((t * (20 + i * 8) + i * 400) % (w + 800)) - 400)}" cy="${r1(g - 60 + i * 50)}" rx="${w * 0.5}" ry="70" fill="#c9b8ff" opacity="0.10"/>`).join('');
  const qs = [[0.15, 0.3], [0.82, 0.2], [0.6, 0.45]].map(([x, y], i) => `<text x="${w * x}" y="${g * y}" font-family="Fredoka" font-size="${w * 0.12}" fill="#b9a6ff" opacity="${(0.12 + 0.08 * Math.sin(t + i)).toFixed(2)}">?</text>`).join('');
  return `<defs><radialGradient id="myst" cx="0.5" cy="0.3" r="0.8"><stop offset="0" stop-color="#3b2a63"/><stop offset="1" stop-color="#120c22"/></radialGradient></defs>` +
    rect(0, 0, w, h, 'url(#myst)') + `<circle cx="${w * 0.72}" cy="${g * 0.16}" r="${w * 0.08}" fill="#efe9ff" opacity="0.9"/>` + qs +
    `<path d="M0 ${g} L${w * 0.1} ${g * 0.7} L${w * 0.18} ${g} M${w * 0.82} ${g} L${w * 0.9} ${g * 0.65} L${w} ${g}" fill="#0b0716"/>` +
    rect(0, g, w, h - g, '#1b1330') + `<line x1="0" y1="${g}" x2="${w}" y2="${g}" stroke="#8a77c9" stroke-width="5"/>` + fog;
} });
