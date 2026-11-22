// Bibliothèque des 17 animations. Chaque animation est une liste d'images clés (poses partielles),
// interpolées en douceur. Les personnages sont décrits « tournés vers la droite ».
//
//   period   : durée d'un cycle en secondes
//   loop     : l'animation boucle (sinon elle reste sur la dernière image clé)
//   speed    : déplacement horizontal en unités/seconde (marche, course)
//   travel   : déplacement total pour entrer/sortir de scène
//   expression : expression suggérée
//   speaking : la bouche bouge
//   life     : ajoute respiration et micro-mouvements (évite les personnages figés)
import { STAND } from '../characters/skeleton.js';

const S = STAND;
const k = (t, pose, easing = 'inOut') => ({ t, pose, easing });

// Cycle de marche : jambes et bras en opposition.
const walkKeys = (amp = 1, lean = 3, bob = 5) => [
  k(0, { torso: lean, legL: 24 * amp, kneeL: -4, legR: -20 * amp, kneeR: -26 * amp, armL: -22 * amp, elbowL: 18, armR: 20 * amp, elbowR: 22, y: 0 }),
  k(0.25, { torso: lean, legL: 2, kneeL: -2, legR: 6 * amp, kneeR: -45 * amp, armL: -2, elbowL: 16, armR: 2, elbowR: 18, y: -bob }),
  k(0.5, { torso: lean, legL: -20 * amp, kneeL: -26 * amp, legR: 24 * amp, kneeR: -4, armL: 20 * amp, elbowL: 22, armR: -22 * amp, elbowR: 18, y: 0 }),
  k(0.75, { torso: lean, legL: 6 * amp, kneeL: -45 * amp, legR: 2, kneeR: -2, armL: 2, elbowL: 18, armR: -2, elbowR: 16, y: -bob }),
  k(1, { torso: lean, legL: 24 * amp, kneeL: -4, legR: -20 * amp, kneeR: -26 * amp, armL: -22 * amp, elbowL: 18, armR: 20 * amp, elbowR: 22, y: 0 }),
];

const runKeys = [
  k(0, { torso: 12, legL: 45, kneeL: -12, legR: -38, kneeR: -70, armL: -45, elbowL: 80, armR: 40, elbowR: 85, y: -6 }),
  k(0.25, { torso: 12, legL: 5, kneeL: -10, legR: 15, kneeR: -100, armL: -5, elbowL: 85, armR: 5, elbowR: 85, y: -18 }),
  k(0.5, { torso: 12, legL: -38, kneeL: -70, legR: 45, kneeR: -12, armL: 40, elbowL: 85, armR: -45, elbowR: 80, y: -6 }),
  k(0.75, { torso: 12, legL: 15, kneeL: -100, legR: 5, kneeR: -10, armL: 5, elbowL: 85, armR: -5, elbowR: 85, y: -18 }),
  k(1, { torso: 12, legL: 45, kneeL: -12, legR: -38, kneeR: -70, armL: -45, elbowL: 80, armR: 40, elbowR: 85, y: -6 }),
];

export const CLIPS = {
  idle: { period: 3, loop: true, life: true, keys: [k(0, {}), k(0.5, { armL: -30, armR: 30, head: 3 }), k(1, {})] },

  walk: { period: 0.9, loop: true, speed: 75, keys: walkKeys() },

  run: { period: 0.55, loop: true, speed: 190, expression: 'surprised', keys: runKeys },

  jump: {
    period: 1.1, loop: true, expression: 'happy',
    keys: [
      k(0, {}),
      k(0.2, { legL: 35, kneeL: -75, legR: 45, kneeR: -85, armL: 20, armR: 30, elbowL: 20, elbowR: 10, torso: 15 }),
      k(0.45, { y: -90, legL: -5, kneeL: 0, legR: 5, kneeR: 0, armL: -165, elbowL: 0, armR: 165, elbowR: 0 }, 'out'),
      k(0.7, { y: -20, legL: 10, kneeL: -20, legR: 20, kneeR: -25, armL: -120, armR: 120 }, 'in'),
      k(0.8, { legL: 30, kneeL: -60, legR: 40, kneeR: -70, armL: -40, armR: 40, torso: 10 }),
      k(1, {}),
    ],
  },

  talk: {
    period: 1.8, loop: true, speaking: true, life: true,
    keys: [
      k(0, { armR: 30, elbowR: 80, head: 2 }),
      k(0.3, { armR: 45, elbowR: 105, head: -3 }),
      k(0.55, { armR: 25, elbowR: 70, armL: -35, elbowL: -30, head: 3 }),
      k(0.8, { armR: 50, elbowR: 110, head: 0 }),
      k(1, { armR: 30, elbowR: 80, head: 2 }),
    ],
  },

  think: {
    period: 2.4, loop: true, expression: 'thinking', life: true,
    keys: [
      k(0, { armR: 18, elbowR: 170, armL: -25, elbowL: 70, head: 8 }),
      k(0.5, { armR: 20, elbowR: 165, armL: -25, elbowL: 72, head: 12 }),
      k(1, { armR: 18, elbowR: 170, armL: -25, elbowL: 70, head: 8 }),
    ],
  },

  point: {
    period: 1.2, loop: true, life: true,
    keys: [
      k(0, { armR: 88, elbowR: 0, torso: 5, head: -4 }),
      k(0.5, { armR: 95, elbowR: -6, torso: 7, head: -6 }),
      k(1, { armR: 88, elbowR: 0, torso: 5, head: -4 }),
    ],
  },

  laugh: {
    period: 0.5, loop: true, expression: 'laughing', speaking: true,
    keys: [
      k(0, { torso: -10, head: -10, armL: -20, elbowL: 85, armR: 20, elbowR: -85, y: 0 }),
      k(0.5, { torso: 6, head: 8, armL: -18, elbowL: 80, armR: 18, elbowR: -80, y: -6 }),
      k(1, { torso: -10, head: -10, armL: -20, elbowL: 85, armR: 20, elbowR: -85, y: 0 }),
    ],
  },

  surprise: {
    period: 1.2, loop: false, expression: 'surprised', life: true,
    keys: [
      k(0, {}),
      k(0.15, { y: -25, torso: -12, armL: -140, elbowL: -30, armR: 140, elbowR: 30, legL: -18, legR: 18 }, 'out'),
      k(0.35, { y: 0, torso: -8, armL: -125, elbowL: -40, armR: 125, elbowR: 40, legL: -16, legR: 16 }, 'outBounce'),
      k(1, { torso: -6, armL: -120, elbowL: -45, armR: 120, elbowR: 45, legL: -16, legR: 16 }),
    ],
  },

  sad: {
    period: 3, loop: true, expression: 'sad', life: true,
    keys: [
      k(0, { head: 22, torso: 6, armL: -8, elbowL: 4, armR: 8, elbowR: -4, kneeL: 10, kneeR: -10 }),
      k(0.5, { head: 26, torso: 8, armL: -6, elbowL: 4, armR: 6, elbowR: -4, kneeL: 12, kneeR: -12 }),
      k(1, { head: 22, torso: 6, armL: -8, elbowL: 4, armR: 8, elbowR: -4, kneeL: 10, kneeR: -10 }),
    ],
  },

  angry: {
    period: 0.6, loop: true, expression: 'angry', speaking: true,
    keys: [
      k(0, { armL: -45, elbowL: 95, armR: 45, elbowR: -95, legL: -20, legR: 20, torso: 4, head: -3 }),
      k(0.25, { armL: -48, elbowL: 98, armR: 42, elbowR: -92, legL: -20, legR: 32, kneeR: -40, torso: 6, y: 0 }),
      k(0.5, { armL: -45, elbowL: 95, armR: 45, elbowR: -95, legL: -20, legR: 20, torso: 4, head: 3 }),
      k(1, { armL: -45, elbowL: 95, armR: 45, elbowR: -95, legL: -20, legR: 20, torso: 4, head: -3 }),
    ],
  },

  fall: {
    period: 1.4, loop: false, expression: 'scared',
    keys: [
      k(0, {}),
      k(0.2, { torso: 25, armL: -130, armR: 150, elbowL: -20, elbowR: 30, legR: 35, kneeR: -40 }),
      k(0.55, { rot: -80, torso: 5, armL: -150, armR: 170, legL: 0, legR: 20, kneeR: -20 }, 'in'),
      k(0.7, { rot: -90, torso: 0, armL: -170, armR: 175, legL: -5, legR: 10, kneeR: 0, y: -12 }, 'out'),
      k(0.85, { rot: -90, torso: 0, armL: -175, armR: 178, legL: -8, legR: 8, y: 0 }, 'outBounce'),
      k(1, { rot: -90, torso: 0, armL: -175, armR: 178, legL: -8, legR: 8, y: 0 }),
    ],
  },

  wave: {
    period: 0.7, loop: true, expression: 'happy', life: true,
    keys: [
      k(0, { armR: 140, elbowR: 25, head: -4 }),
      k(0.5, { armR: 145, elbowR: -25, head: -2 }),
      k(1, { armR: 140, elbowR: 25, head: -4 }),
    ],
  },

  sit: {
    period: 3, loop: true, life: true,
    keys: [
      k(0, { legL: 84, kneeL: -84, legR: 92, kneeR: -92, armL: 25, elbowL: 40, armR: 35, elbowR: 30, torso: -4 }),
      k(0.5, { legL: 84, kneeL: -84, legR: 92, kneeR: -92, armL: 25, elbowL: 42, armR: 35, elbowR: 32, torso: -2, head: 3 }),
      k(1, { legL: 84, kneeL: -84, legR: 92, kneeR: -92, armL: 25, elbowL: 40, armR: 35, elbowR: 30, torso: -4 }),
    ],
  },

  // Le demi-tour est géré par l'inversion progressive de « facing » (voir engine.js).
  turn: { period: 0.5, loop: false, turn: true, keys: [k(0, {}), k(0.5, { y: -6, armL: -40, armR: 40 }), k(1, {})] },

  enter: { period: 0.9, loop: true, speed: 75, enter: true, travel: 700, keys: walkKeys() },
  exit: { period: 0.9, loop: true, speed: 75, exit: true, travel: 700, keys: walkKeys() },
};

export const CLIP_IDS = Object.keys(CLIPS);
export const ANIMATION_DEFAULTS = { ...S };
