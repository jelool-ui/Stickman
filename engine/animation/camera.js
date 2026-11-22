// Mouvements de caméra appliqués à toute la scène (zoom, panoramique, tremblement, mise au point).
import { ease, clamp, noise1 } from '../math.js';

/** Renvoie { zoom, x, y, rot } pour une progression p ∈ [0,1] de la scène et un temps t en secondes. */
export function cameraAt(type, p, t, { focusX = 0, focusY = 0 } = {}) {
  const e = ease.inOut(clamp(p, 0, 1));
  switch (type) {
    case 'zoom-in': return { zoom: 1 + 0.15 * e, x: 0, y: 0, rot: 0 };
    case 'zoom-out': return { zoom: 1.15 - 0.15 * e, x: 0, y: 0, rot: 0 };
    case 'pan-left': return { zoom: 1.15, x: 60 - 120 * e, y: 0, rot: 0 }; // |x| ≤ (zoom-1)·w/2 : jamais de bord noir
    case 'pan-right': return { zoom: 1.15, x: -60 + 120 * e, y: 0, rot: 0 };
    case 'shake': {
      const k = Math.max(0, 1 - p * 1.5);
      return { zoom: 1.05 + 0.006 * Math.sin(t * 0.9), x: noise1(t * 18, 1) * 22 * k, y: noise1(t * 18, 2) * 22 * k, rot: noise1(t * 12, 3) * 1.5 * k };
    }
    case 'focus': {
      const z = 1 + 0.3 * ease.out(clamp(p * 2.5, 0, 1));
      return { zoom: z, x: -focusX * (z - 1), y: -focusY * (z - 1), rot: 0 };
    }
    default: {
      // « static » garde une très légère respiration pour que l'image ne soit jamais figée.
      return { zoom: 1.02 + 0.01 * Math.sin(t * 0.8), x: 0, y: 0, rot: 0 };
    }
  }
}

/** Transformation SVG d'une caméra autour du centre (cx, cy). */
export function cameraTransform(cam, cx, cy) {
  const r = (v) => Math.round(v * 100) / 100;
  return `translate(${r(cx + cam.x)} ${r(cy + cam.y)}) rotate(${r(cam.rot)}) scale(${r(cam.zoom)}) translate(${r(-cx)} ${r(-cy)})`;
}
