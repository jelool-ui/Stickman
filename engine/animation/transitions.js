// Transitions entre scènes. Chaque transition combine l'image de la scène précédente et de la nouvelle.
import { ease, clamp } from '../math.js';

export const TRANSITION_DURATION = { cut: 0, fade: 0.4, 'slide-left': 0.45, 'slide-up': 0.45, zoom: 0.4, flash: 0.3 };

/**
 * prevSvg / nextSvg : contenu SVG des deux scènes ; p ∈ [0,1] progression de la transition.
 * Renvoie le contenu SVG combiné.
 */
export function applyTransition(type, prevSvg, nextSvg, p, w, h) {
  const e = ease.inOut(clamp(p, 0, 1));
  const r = (v) => Math.round(v * 100) / 100;
  switch (type) {
    case 'fade':
      return `${prevSvg}<g opacity="${r(e)}">${nextSvg}</g>`;
    case 'slide-left':
      return `<g transform="translate(${r(-w * e)} 0)">${prevSvg}</g><g transform="translate(${r(w * (1 - e))} 0)">${nextSvg}</g>`;
    case 'slide-up':
      return `<g transform="translate(0 ${r(-h * e)})">${prevSvg}</g><g transform="translate(0 ${r(h * (1 - e))})">${nextSvg}</g>`;
    case 'zoom': {
      const s = 1 + e * 0.6;
      return `<g opacity="${r(1 - e)}" transform="translate(${r(w / 2)} ${r(h / 2)}) scale(${r(s)}) translate(${r(-w / 2)} ${r(-h / 2)})">${prevSvg}</g><g opacity="${r(e)}">${nextSvg}</g>`;
    }
    case 'flash': {
      const a = 1 - Math.abs(p - 0.5) * 2;
      return `${p < 0.5 ? prevSvg : nextSvg}<rect width="${w}" height="${h}" fill="#ffffff" opacity="${r(clamp(a, 0, 1))}"/>`;
    }
    default:
      return nextSvg;
  }
}
