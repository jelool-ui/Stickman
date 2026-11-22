// Catalogues partagés : listes des animations, décors, caméras, transitions, styles.
// Les implémentations graphiques arrivent en Phase 3 ; ces listes servent déjà à l'interface et à la validation.

export const ANIMATIONS = [
  'idle', 'walk', 'run', 'jump', 'talk', 'think', 'point', 'laugh', 'surprise',
  'sad', 'angry', 'fall', 'wave', 'sit', 'turn', 'enter', 'exit',
];

export const ANIMATION_LABELS = {
  idle: 'Repos', walk: 'Marcher', run: 'Courir', jump: 'Sauter', talk: 'Parler', think: 'Réfléchir',
  point: 'Montrer', laugh: 'Rire', surprise: 'Surprise', sad: 'Triste', angry: 'Colère', fall: 'Tomber',
  wave: 'Saluer', sit: "S'asseoir", turn: 'Se retourner', enter: 'Entrer en scène', exit: 'Sortir de scène',
};

export const EXPRESSIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'thinking', 'laughing', 'scared'];

export const EXPRESSION_LABELS = {
  neutral: 'Neutre', happy: 'Content', sad: 'Triste', angry: 'En colère', surprised: 'Surpris',
  thinking: 'Pensif', laughing: 'Mort de rire', scared: 'Effrayé',
};

export const BACKGROUNDS = [
  ['bedroom', 'Chambre'], ['school', 'École'], ['office', 'Bureau'], ['street', 'Rue'], ['house', 'Maison'],
  ['city', 'Ville'], ['space', 'Espace'], ['forest', 'Forêt'], ['landscape', 'Paysage'],
  ['abstract', 'Abstrait'], ['mystery', 'Mystérieux'],
];

export const CAMERAS = ['static', 'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'shake', 'focus'];
export const TRANSITIONS = ['cut', 'fade', 'slide-left', 'slide-up', 'zoom', 'flash'];

export const STYLES = [
  ['classic', 'Classique (fond clair, traits noirs)'],
  ['night', 'Nuit (fond sombre, traits clairs)'],
  ['comic', 'BD (couleurs vives)'],
];

export const RESOLUTIONS = [
  { id: '1080x1920', label: '1080 × 1920 (Shorts, recommandé)', width: 1080, height: 1920 },
  { id: '720x1280', label: '720 × 1280 (brouillon rapide)', width: 720, height: 1280 },
];

export const SCHEDULES = [
  ['manual', 'Manuel uniquement'],
  ['daily', 'Une fois par jour'],
  ['3-per-week', '3 fois par semaine'],
  ['weekly', 'Une fois par semaine'],
];
