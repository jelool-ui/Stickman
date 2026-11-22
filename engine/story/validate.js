// Validation d'un storyboard avant le rendu. errors = bloquant ; warnings = à surveiller.
import { SCENE_FIELDS } from './scenario.js';
import { ANIMATIONS, CAMERAS, TRANSITIONS } from '../catalog.js';
import { listBackgrounds } from '../scenes/backgrounds.js';
import { getProp } from '../scenes/props.js';
import { wordCount } from './text.js';

export const LIMITS = { minScenes: 6, maxScenes: 12, minDuration: 30, maxDuration: 60, minWords: 90, maxWords: 140, maxSceneSeconds: 15, maxSubtitleChars: 140 };

export function validateStoryboard(sb, { characters = [], limits = LIMITS } = {}) {
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(m);
  const W = (m) => warnings.push(m);
  if (!sb || typeof sb !== 'object') return { ok: false, errors: ['storyboard absent'], warnings };
  for (const k of ['id', 'title', 'category', 'scenes', 'hook']) if (!sb[k]) E(`champ manquant : ${k}`);
  if (!Array.isArray(sb.scenes)) return { ok: false, errors: [...errors, 'scenes doit être une liste'], warnings };

  const n = sb.scenes.length;
  if (n < limits.minScenes || n > limits.maxScenes) E(`${n} scènes (attendu ${limits.minScenes} à ${limits.maxScenes})`);
  const bgs = new Set(listBackgrounds().map(([id]) => id));
  const charIds = new Set(characters.map((c) => c.id));
  let total = 0;
  sb.scenes.forEach((s, i) => {
    const p = `scène ${i + 1}`;
    for (const f of SCENE_FIELDS) if (s[f] === undefined) E(`${p} : champ manquant « ${f} »`);
    if (s.scene_id !== i + 1) E(`${p} : scene_id doit valoir ${i + 1}`);
    if (!(s.duration > 0) || s.duration > limits.maxSceneSeconds) E(`${p} : durée invalide (${s.duration})`);
    total += Number(s.duration) || 0;
    if (!Array.isArray(s.dialogue)) E(`${p} : dialogue doit être une liste`);
    if (!Array.isArray(s.character_ids) || !s.character_ids.length) E(`${p} : aucun personnage`);
    if (characters.length) for (const c of s.character_ids || []) if (!charIds.has(c)) E(`${p} : personnage inconnu « ${c} »`);
    for (const d of s.dialogue || []) {
      if (!d.text?.trim()) E(`${p} : réplique vide`);
      if (!(s.character_ids || []).includes(d.character_id)) E(`${p} : « ${d.character_id} » parle sans être dans la scène`);
    }
    if (!bgs.has(s.background_id)) E(`${p} : décor inconnu « ${s.background_id} »`);
    if (!ANIMATIONS.includes(s.animation)) E(`${p} : animation inconnue « ${s.animation} »`);
    if (!CAMERAS.includes(s.camera)) E(`${p} : caméra inconnue « ${s.camera} »`);
    if (!TRANSITIONS.includes(s.transition)) E(`${p} : transition inconnue « ${s.transition} »`);
    for (const pr of s.props || []) if (!getProp(pr)) E(`${p} : objet inconnu « ${pr} »`);
    if (!s.subtitles?.trim()) E(`${p} : sous-titres vides`);
    if ((s.subtitles || '').length > limits.maxSubtitleChars) W(`${p} : sous-titre long (${s.subtitles.length} caractères)`);
    if (s.speech_estimate && s.duration < s.speech_estimate) E(`${p} : durée (${s.duration}s) plus courte que la parole estimée (${s.speech_estimate}s)`);
  });
  total = Math.round(total * 10) / 10;
  if (total < limits.minDuration || total > limits.maxDuration) E(`durée totale ${total}s (attendu ${limits.minDuration} à ${limits.maxDuration}s)`);
  const words = sb.scenes.reduce((a, s) => a + wordCount(s.subtitles), 0);
  if (words < limits.minWords || words > limits.maxWords) W(`${words} mots (objectif indicatif ${limits.minWords} à ${limits.maxWords})`);
  if (sb.target_duration && total > Math.max(30, sb.target_duration) + 1) W(`durée ${total}s au-delà de la cible (${sb.target_duration}s) : le texte ne peut pas être dit plus vite sans être coupé`);
  if (sb.scenes[0]?.subtitle_style !== 'hook') E('la première scène doit être le hook (aucune introduction)');
  if (sb.content_type === 'fact' && !(sb.sources || []).length) E('contenu factuel sans source');
  if (sb.hook?.proposals && sb.hook.proposals.length !== 3) W(`${sb.hook.proposals.length} propositions de hook au lieu de 3`);
  const types = sb.scenes.map((s) => s.scene_type);
  if (types.length && !types.includes('reveal')) E('aucune scène de révélation');
  return { ok: errors.length === 0, errors, warnings, stats: { scenes: n, duration: total, words } };
}
