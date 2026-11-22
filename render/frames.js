// Conversion SVG → pixels avec resvg, police intégrée (rendu identique sur toutes les machines).
import { Resvg } from '@resvg/resvg-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FONT_FILES = [
  path.join(root, 'assets/fonts/Fredoka_600SemiBold.ttf'),
  path.join(root, 'assets/fonts/Fredoka_700Bold.ttf'),
];

export function svgToPixels(svg, width) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Fredoka' },
    shapeRendering: 2,
    textRendering: 1,
  });
  const img = r.render();
  return { pixels: img.pixels, width: img.width, height: img.height };
}

export function svgToPng(svg, width) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Fredoka' },
  });
  return r.render().asPng();
}
