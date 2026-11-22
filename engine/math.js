// Outils mathématiques déterministes (aucun Math.random : un même scénario donne toujours la même vidéo).
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const DEG = Math.PI / 180;

export const ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - (1 - t) * (1 - t),
  in: (t) => t * t,
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

/** Hachage entier stable d'une chaîne. */
export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Générateur pseudo-aléatoire initialisé par une graine (mulberry32). */
export function seededRandom(seed) {
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bruit 1D lisse et déterministe dans [-1, 1]. */
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const r = (n) => { const v = Math.sin((n + seed * 101.3) * 127.1) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
  const u = f * f * (3 - 2 * f);
  return lerp(r(i), r(i + 1), u);
}

export const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
