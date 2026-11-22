// Composition d'une image complète à un instant donné du storyboard.
// Même code pour l'aperçu navigateur et le rendu vidéo → rendu déterministe.
//
// Convention : scene.transition est la transition utilisée pour PASSER à la scène suivante ;
// elle se joue pendant les premières fractions de seconde de la scène suivante.
import { getBackground } from './backgrounds.js';
import { getProp } from './props.js';
import { getPalette } from './palettes.js';
import { actorStateAt } from '../animation/engine.js';
import { cameraAt, cameraTransform } from '../animation/camera.js';
import { applyTransition, TRANSITION_DURATION } from '../animation/transitions.js';
import { renderAnimatedText, escapeXml } from '../animation/text.js';
import { renderCharacterGroup } from '../characters/render.js';
import { BASE_HEIGHT } from '../characters/skeleton.js';
import { CLIPS } from '../animation/clips.js';

export function layoutFor(width, height) {
  const vertical = height >= width;
  return {
    width, height, vertical,
    groundY: Math.round(height * (vertical ? 0.70 : 0.82)),
    charScale: (height * (vertical ? 0.27 : 0.45)) / BASE_HEIGHT,
    subtitleY: Math.round(height * (vertical ? 0.80 : 0.9)),
    titleY: Math.round(height * (vertical ? 0.14 : 0.12)),
  };
}

/** Début et fin de chaque scène. */
export function computeTimeline(storyboard) {
  let t = 0;
  const scenes = storyboard.scenes.map((s) => {
    const start = t;
    t += Number(s.duration) || 0;
    return { scene: s, start, end: t };
  });
  return { scenes, duration: t };
}

/** Estimation de la durée de parole d'un texte (remplacée par la durée audio réelle quand elle existe). */
export function estimateSpeechSeconds(text, wordsPerSecond = 3.2) {
  const words = String(text || '').split(/\s+/).filter(Boolean).length;
  return words ? words / wordsPerSecond + 0.2 : 0;
}

/** Construit les acteurs d'une scène (positions, pistes d'animation, fenêtres de parole). */
export function planScene(scene, layout) {
  if (scene.actors?.length) return scene.actors;
  const ids = scene.character_ids || [];
  const n = ids.length;
  const W = layout.width;
  const dur = Number(scene.duration) || 1;
  // Fenêtres de parole : chaque réplique occupe sa durée réelle (timings) ou estimée.
  const speaking = {};
  let cursor = 0.25;
  for (const [i, d] of (scene.dialogue || []).entries()) {
    const len = scene.timings?.dialogue?.[i]?.duration ?? estimateSpeechSeconds(d.text);
    const start = scene.timings?.dialogue?.[i]?.start ?? cursor;
    (speaking[d.character_id] ||= []).push({ start, end: Math.min(dur, start + len) });
    cursor = start + len + 0.15;
  }
  // Narration dite par un personnage présent (le Guide) : sa bouche bouge aussi.
  const nt = scene.timings?.narration;
  if (nt?.speaker) (speaking[nt.speaker] ||= []).push({ start: nt.start, end: Math.min(dur, nt.start + nt.duration) });
  return ids.map((id, i) => {
    const x = n === 1 ? W * 0.5 : W * (0.27 + (0.46 * i) / (n - 1));
    const facing = n === 1 ? 1 : x < W / 2 ? 1 : -1;
    const anim = i === 0 ? scene.animation || 'idle' : 'idle';
    const clip = CLIPS[anim] || CLIPS.idle;
    let startX = x;
    let track = [{ animation: anim, start: 0, duration: dur }];
    if (clip.enter || clip.exit) {
      // Entrée/sortie rapide depuis/vers le bord de l'écran, puis repos.
      const dist = x - (facing > 0 ? -layout.width * 0.15 : layout.width * 1.15);
      const travel = Math.abs(clip.exit ? (facing > 0 ? layout.width * 1.15 - x : x + layout.width * 0.15) : dist) / layout.charScale;
      const moveDur = Math.min(dur * 0.7, Math.max(0.9, travel / clip.speed));
      track = clip.enter
        ? [{ animation: anim, start: 0, duration: moveDur, travel }, { animation: 'idle', start: moveDur, duration: dur - moveDur }]
        : [{ animation: 'idle', start: 0, duration: dur - moveDur }, { animation: anim, start: dur - moveDur, duration: moveDur, travel }];
    } else if (clip.speed) {
      // Une marche ou une course traverse le centre de l'écran.
      startX = x - facing * Math.min(clip.speed * layout.charScale * dur * 0.5, layout.width * 0.3);
    }
    return { character_id: id, x: startX, facing, track, speaking: speaking[id] || [], expression: i === 0 ? scene.expression : undefined };  });
}

function propSlots(scene, actors, layout) {
  const W = layout.width;
  const out = [];
  const used = new Set(actors.map((a) => a.x));
  let groundIndex = 0;
  for (const id of scene.props || []) {
    const p = getProp(id);
    if (!p) continue;
    if (p.kind === 'held') out.push({ id, kind: 'held', prop: p });
    else if (p.kind === 'float') out.push({ id, kind: 'float', prop: p, x: W * (0.75 - 0.5 * (out.length % 2)), y: layout.groundY * 0.42 });
    else {
      const xs = [W * 0.86, W * 0.14, W * 0.5];
      out.push({ id, kind: 'ground', prop: p, x: xs[groundIndex++ % xs.length] });
    }
  }
  // Une chaise apparaît automatiquement sous un personnage assis.
  for (const a of actors) if (a.track.some((c) => c.animation === 'sit') && !(scene.props || []).includes('chair'))
    out.push({ id: 'chair', kind: 'ground', prop: getProp('chair'), x: a.x - a.facing * 10, behind: true });
  void used;
  return out;
}

/** Contenu SVG d'une scène au temps local t (secondes depuis le début de la scène). */
export function renderSceneContent(scene, characters, t, layout, { style = 'classic' } = {}) {
  const pal = getPalette(style);
  const { width: w, height: h, groundY: g, charScale } = layout;
  const bg = getBackground(scene.background_id);
  const actors = planScene(scene, layout);
  const props = propSlots(scene, actors, layout);
  const byId = Object.fromEntries(characters.map((c) => [c.id, c]));
  const P = charScale * 0.9;
  const halo = bg.dark || pal.dark ? '#e9e4ff' : null;

  let world = bg.render({ w, h, g, pal, t });
  for (const p of props.filter((x) => x.kind === 'ground'))
    world += `<g transform="translate(${Math.round(p.x)} ${g}) scale(${P.toFixed(3)})">${p.prop.render(pal, t)}</g>`;

  let focus = { x: 0, y: 0 };
  actors.forEach((a, i) => {
    const c = byId[a.character_id];
    if (!c) return;
    const st = actorStateAt({ ...a, x: 0 }, t);
    const x = a.x + st.x * charScale;
    const held = i === 0 ? props.filter((p) => p.kind === 'held').map((p) => p.prop.render(pal, t)).join('') : '';
    world += renderCharacterGroup(c, { x, y: g, scale: charScale, pose: st.pose, expression: st.expression || c.expression,
      mouthOpen: st.mouthOpen, blink: st.blink, facing: st.facing, held, halo });
    if (i === 0) focus = { x: x - w / 2, y: g - charScale * BASE_HEIGHT * 0.85 - h / 2 };
  });
  for (const p of props.filter((x) => x.kind === 'float'))
    world += `<g transform="translate(${Math.round(p.x)} ${Math.round(p.y)}) scale(${P.toFixed(3)})">${p.prop.render(pal, t)}</g>`;

  const dur = Number(scene.duration) || 1;
  const cam = cameraAt(scene.camera, t / dur, t, { focusX: focus.x, focusY: focus.y });
  return `<g transform="${cameraTransform(cam, w / 2, h / 2)}">${world}</g>`;
}

/** Sous-titre de la scène (affiché au-dessus des transitions, jamais doublé). */
export function renderSceneSubtitle(scene, t, layout) {
  if (!scene.subtitles) return '';
  const w = layout.width;
  if (scene.subtitle_style === 'hook') {
    // Le hook s'affiche en grand, en haut, dès la première image (aucune introduction).
    return renderAnimatedText(scene.subtitles, { x: w / 2, y: layout.titleY + w * 0.08, t: t + 0.15, style: 'pop', size: Math.round(w * 0.075),
      highlight: scene.highlight || [], maxChars: layout.vertical ? 18 : 36, box: true });
  }
  // Sous-titres synchronisés sur la voix : un bloc (2 lignes max) à la fois.
  if (scene.subtitle_chunks?.length) {
    const c = scene.subtitle_chunks.find((x) => t >= x.start && t < x.end + 0.15) || null;
    if (!c) return '';
    return renderAnimatedText(c.text, { x: w / 2, y: layout.subtitleY, t: t - c.start, style: 'pop', size: Math.round(w * 0.066),
      highlight: scene.highlight || [], maxChars: layout.vertical ? 22 : 40 });
  }
  return renderAnimatedText(scene.subtitles, { x: w / 2, y: layout.subtitleY, t, style: 'pop', size: Math.round(w * 0.062),
    highlight: scene.highlight || [], maxChars: layout.vertical ? 22 : 40 });
}

/** Étiquette discrète « Histoire inventée » / « Scénario imaginaire » pour distinguer fiction et faits. */
export function renderLabel(label, layout) {
  if (!label) return '';
  const w = layout.width;
  const size = Math.round(w * 0.03);
  const pw = label.length * size * 0.56 + size * 1.4;
  const x = Math.round(w * 0.04), y = Math.round(layout.height * 0.035);
  return `<g opacity="0.85"><rect x="${x}" y="${y}" width="${pw.toFixed(0)}" height="${Math.round(size * 1.7)}" rx="${Math.round(size * 0.85)}" fill="rgba(0,0,0,0.55)"/><text x="${(x + pw / 2).toFixed(0)}" y="${(y + size * 0.88).toFixed(0)}" text-anchor="middle" dominant-baseline="middle" font-family="Fredoka" font-weight="600" font-size="${size}" fill="#ffffff">${escapeXml(label)}</text></g>`;
}

/** Image SVG complète du storyboard au temps global `time`. */
export function renderFrame(storyboard, characters, time, { width = 1080, height = 1920, style = 'classic', showSubtitles = true } = {}) {
  const layout = layoutFor(width, height);
  const { scenes, duration } = computeTimeline(storyboard);
  const tt = Math.min(Math.max(0, time), Math.max(0, duration - 1e-6));
  let idx = scenes.findIndex((s) => tt >= s.start && tt < s.end);
  if (idx < 0) idx = scenes.length - 1;
  const cur = scenes[idx];
  const local = tt - cur.start;
  const opts = { style };
  let content = renderSceneContent(cur.scene, characters, local, layout, opts);

  if (idx > 0) {
    const prev = scenes[idx - 1];
    const type = prev.scene.transition || 'cut';
    const td = TRANSITION_DURATION[type] || 0;
    if (td && local < td) {
      const prevContent = renderSceneContent(prev.scene, characters, prev.end - prev.start + local, layout, opts);
      content = applyTransition(type, prevContent, content, local / td, width, height);
    }
  }
  if (showSubtitles) content += renderSceneSubtitle(cur.scene, local, layout);
  content += renderLabel(storyboard.label, layout);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#000"/>${content}</svg>`;
}
