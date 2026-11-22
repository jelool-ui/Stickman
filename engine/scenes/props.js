// Bibliothèque d'objets. Chaque objet est dessiné autour de son point d'ancrage :
//   kind 'ground' : bas-centre posé au sol ; 'held' : tenu dans la main ; 'float' : flotte au-dessus de la scène.
// Ajouter un objet : registerProp('id', { label, kind, render: (pal, t) => '...' }).
const REGISTRY = new Map();
export function registerProp(id, def) { REGISTRY.set(id, def); }
export function getProp(id) { return REGISTRY.get(id) || null; }
export function listProps() { return [...REGISTRY.entries()].map(([id, d]) => [id, d.label, d.kind]); }

const L = (pal, sw = 5) => `stroke="${pal.line}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;

registerProp('phone', { label: 'Téléphone', kind: 'held', render: (pal, t) =>
  `<rect x="-12" y="-36" width="26" height="46" rx="5" fill="#2d2d38" ${L(pal, 3)}/><rect x="-8" y="-31" width="18" height="34" rx="2" fill="${Math.floor(t * 2) % 2 ? '#8fd3ff' : '#bfe6ff'}"/>` });
registerProp('book', { label: 'Livre', kind: 'held', render: (pal) =>
  `<path d="M-30 -30 L0 -24 L30 -30 L30 6 L0 12 L-30 6 Z" fill="${pal.a2}" ${L(pal, 3)}/><line x1="0" y1="-24" x2="0" y2="12" ${L(pal, 3)}/>` });
registerProp('cup', { label: 'Tasse', kind: 'held', render: (pal, t) =>
  `<path d="M-14 -24 h28 l-3 28 h-22 Z" fill="#ffffff" ${L(pal, 3)}/><path d="M14 -18 q12 2 0 14" fill="none" ${L(pal, 3)}/><path d="M-4 -30 q${(4 * Math.sin(t * 3)).toFixed(1)} -8 0 -16" fill="none" stroke="${pal.soft}" stroke-width="3" stroke-linecap="round"/>` });
registerProp('computer', { label: 'Ordinateur', kind: 'ground', render: (pal, t) =>
  `<rect x="-70" y="-150" width="140" height="10" fill="${pal.soft}" ${L(pal)}/><line x1="-60" y1="-140" x2="-60" y2="0" ${L(pal, 6)}/><line x1="60" y1="-140" x2="60" y2="0" ${L(pal, 6)}/>` +
  `<rect x="-50" y="-235" width="100" height="70" rx="6" fill="#2d2d38" ${L(pal)}/><rect x="-42" y="-228" width="84" height="56" fill="${Math.floor(t * 3) % 2 ? '#9be7ff' : '#7fd6f5'}"/><line x1="0" y1="-165" x2="0" y2="-150" ${L(pal, 6)}/>` });
registerProp('table', { label: 'Table', kind: 'ground', render: (pal) =>
  `<rect x="-110" y="-120" width="220" height="16" rx="4" fill="${pal.a1}" ${L(pal)}/><line x1="-95" y1="-104" x2="-95" y2="0" ${L(pal, 7)}/><line x1="95" y1="-104" x2="95" y2="0" ${L(pal, 7)}/>` });
registerProp('chair', { label: 'Chaise', kind: 'ground', render: (pal) =>
  `<rect x="-40" y="-52" width="80" height="12" rx="3" fill="${pal.a2}" ${L(pal)}/><line x1="-34" y1="-40" x2="-34" y2="0" ${L(pal, 6)}/><line x1="34" y1="-40" x2="34" y2="0" ${L(pal, 6)}/><line x1="-36" y1="-52" x2="-40" y2="-140" ${L(pal, 6)}/>` });
registerProp('door', { label: 'Porte', kind: 'ground', render: (pal) =>
  `<rect x="-60" y="-260" width="120" height="260" fill="#b5835a" ${L(pal, 6)}/><rect x="-44" y="-240" width="88" height="90" fill="none" ${L(pal, 4)}/><rect x="-44" y="-130" width="88" height="110" fill="none" ${L(pal, 4)}/><circle cx="40" cy="-130" r="8" fill="${pal.a4}" ${L(pal, 3)}/>` });
registerProp('car', { label: 'Voiture', kind: 'ground', render: (pal, t) => {
  const spin = (t * 360) % 360;
  const wheel = (x) => `<g transform="translate(${x} -28) rotate(${spin.toFixed(0)})"><circle r="28" fill="#2d2d38" ${L(pal)}/><line x1="-16" y1="0" x2="16" y2="0" stroke="#aaa" stroke-width="4"/></g>`;
  return `<path d="M-150 -40 V-90 Q-140 -110 -100 -112 L-60 -165 H60 L100 -112 Q150 -108 155 -80 V-40 Z" fill="${pal.a1}" ${L(pal, 6)}/><path d="M-50 -150 H-5 V-112 H-80 Z M5 -150 H50 L80 -112 H5 Z" fill="${pal.window}" ${L(pal, 4)}/>` + wheel(-90) + wheel(95);
} });
registerProp('lamp', { label: 'Lampe', kind: 'ground', render: (pal) =>
  `<line x1="0" y1="0" x2="0" y2="-200" ${L(pal, 6)}/><path d="M-40 -200 L-25 -250 H25 L40 -200 Z" fill="${pal.a4}" ${L(pal)}/><ellipse cx="0" cy="0" rx="30" ry="8" fill="${pal.soft}" ${L(pal, 4)}/>` });
registerProp('clock', { label: 'Horloge', kind: 'float', render: (pal, t) => {
  const a = (t * 60) % 360;
  return `<circle r="45" fill="#ffffff" ${L(pal, 6)}/><line x1="0" y1="0" x2="0" y2="-30" ${L(pal, 5)} transform="rotate(${a.toFixed(0)})"/><line x1="0" y1="0" x2="20" y2="0" ${L(pal, 5)}/>`;
} });
registerProp('bag', { label: 'Sac', kind: 'ground', render: (pal) =>
  `<path d="M-35 0 V-60 Q-35 -70 -25 -70 H25 Q35 -70 35 -60 V0 Z" fill="${pal.a3}" ${L(pal)}/><path d="M-18 -70 Q0 -100 18 -70" fill="none" ${L(pal, 5)}/>` });
registerProp('lightbulb', { label: 'Ampoule (idée)', kind: 'float', render: (pal, t) => {
  const glow = 0.5 + 0.5 * Math.abs(Math.sin(t * 4));
  return `<circle r="70" fill="${pal.a4}" opacity="${(0.25 * glow).toFixed(2)}"/><circle cy="-6" r="32" fill="${pal.a4}" ${L(pal)}/><rect x="-14" y="22" width="28" height="18" rx="3" fill="${pal.soft}" ${L(pal, 4)}/>`;
} });
registerProp('question', { label: "Point d'interrogation", kind: 'float', render: (pal, t) =>
  `<text y="${(Math.sin(t * 3) * 8).toFixed(1)}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="120" fill="${pal.a1}" stroke="${pal.line}" stroke-width="6" paint-order="stroke">?</text>` });
registerProp('exclamation', { label: "Point d'exclamation", kind: 'float', render: (pal, t) =>
  `<text y="${(Math.sin(t * 6) * 6).toFixed(1)}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="120" fill="${pal.a4}" stroke="${pal.line}" stroke-width="6" paint-order="stroke">!</text>` });
registerProp('tree', { label: 'Arbre', kind: 'ground', render: (pal) =>
  `<rect x="-15" y="-140" width="30" height="140" fill="#8d5a3b" ${L(pal)}/><circle cy="-200" r="90" fill="${pal.a3}" ${L(pal)}/>` });
