// Miniature originale : image de la scène de révélation + titre en grand (format vertical 1080×1920 pour les Shorts).
import { writeFileSync } from 'node:fs';
import { renderFrame, computeTimeline, layoutFor } from '../engine/scenes/compose.js';
import { renderAnimatedText } from '../engine/animation/text.js';
import { svgToPng } from './frames.js';

export function renderThumbnail(storyboard, characters, meta, file, { width = 1080, height = 1920 } = {}) {
  const { scenes } = computeTimeline(storyboard);
  const target = scenes.find((s) => s.scene.scene_id === meta.thumbnail.scene_id) || scenes[0];
  const t = target.start + Math.min(1.2, (target.end - target.start) * 0.5);
  const sb = { ...storyboard, label: null };
  let svg = renderFrame(sb, characters, t, { width, height, style: storyboard.style || 'classic', showSubtitles: false });
  const layout = layoutFor(width, height);
  const text = renderAnimatedText(meta.thumbnail.text, { x: width / 2, y: layout.titleY + width * 0.12, t: 5, style: 'none', size: Math.round(width * 0.105), maxChars: 14, box: true, boxColor: 'rgba(0,0,0,0.6)', highlight: storyboard.scenes.flatMap((s) => s.highlight || []).slice(0, 2) });
  const frame = `<rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="36" fill="none" stroke="#ffcc33" stroke-width="20"/>`;
  svg = svg.replace(/<\/svg>$/, `${text}${frame}</svg>`);
  writeFileSync(file, svgToPng(svg, width));
  return file;
}
