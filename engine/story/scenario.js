// Générateur de scénarios : idée + hook → storyboard JSON complet (6 à 12 scènes, 30 à 60 s).
// Structure : hook → présentation → développement → escalade/découverte → révélation → conclusion.
import { CATEGORY_PROFILES, EMOTIONS, OUTROS } from './categories.js';
import { findSeed, FACTS, FACT_THEMES } from './library/index.js';
import { fill, wordCount, normalize, slug, keywords } from './text.js';
import { hashString } from '../math.js';

export const SCENE_FIELDS = ['scene_id', 'duration', 'narration', 'dialogue', 'character_ids', 'background_id', 'animation', 'camera', 'props', 'sound_effects', 'subtitles', 'transition'];

const HOOK_EMOTION = { explainer: 'think', comedy: 'surprise', mysteres: 'think', etsi: 'surprise', facts: 'point', motivation: 'sad' };

/** Associe les rôles d'une histoire (hero, friend, guide…) aux personnages disponibles. */
export function castRoles(cast = {}, characters = []) {
  const used = new Set();
  const out = {};
  const pick = (role) => {
    const c = characters.find((x) => x.role === role && !used.has(x.id)) || characters.find((x) => !used.has(x.id)) || characters[0];
    used.add(c.id);
    return c;
  };
  for (const [key, role] of Object.entries({ hero: 'main', ...cast })) if (!out[key]) out[key] = pick(role);
  return out;
}

/** Fiches narratives (beats) d'une idée : fournies par un fournisseur IA, la bibliothèque, ou construites (faits). */
export function beatsForIdea(idea) {
  if (Array.isArray(idea.beats) && idea.beats.length) return { beats: idea.beats, cast: idea.cast || { hero: 'main', friend: 'secondary' }, bg: idea.bg, props: idea.props || [] };
  if (idea.category === 'facts') {
    const facts = idea.fact_ids.map((id) => FACTS.find((f) => f.id === id));
    const beats = [];
    const rotation = FACT_THEMES[facts[0]?.theme || 'monde'].rotation || [];
    facts.forEach((f, i) => {
      const last = i === facts.length - 1;
      const bgFact = rotation[i % rotation.length];
      beats.push({ t: i === 0 ? 'setup' : last ? 'escalation' : 'development', n: `${['Un', 'Deux', 'Trois'][i]} : ${f.fact[0].toLowerCase()}${f.fact.slice(1)}`, e: 'surprise', who: ['hero', 'guide'], bg: bgFact });
      beats.push({ t: last ? 'reveal' : 'development', n: f.detail, e: 'talk', who: ['guide', 'hero'], bg: bgFact });
    });
    beats.push({ t: 'conclusion', n: 'Lequel de ces trois faits t’a le plus surpris ? Les sources sont dans la description.', e: 'wave', who: ['guide', 'hero'] });
    const theme = idea.fact_ids.length ? facts[0].theme : 'monde';
    return { beats, cast: { hero: 'main', guide: 'narrator' }, bg: FACT_THEMES[theme].bg, props: [] };
  }
  const seed = findSeed(idea.seed_id);
  if (!seed) throw new Error(`Histoire introuvable : ${idea.seed_id}`);
  return { beats: seed.beats, cast: seed.cast, bg: seed.bg, props: seed.props || [] };
}

function estimate(text, wps) {
  const w = wordCount(text);
  return w / wps;
}

function highlightFor(text, reveal) {
  const rk = (reveal || []).map((r) => normalize(r).replace(/(s|x)$/, ''));
  return text.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}-]/gu, '')).filter((w) => {
    const k = normalize(w).replace(/(s|x)$/, '');
    return k.length > 2 && rk.some((r) => k === r || k.startsWith(r));
  }).slice(0, 3);
}

/**
 * Construit le storyboard.
 * options : characters, hook ({ text, family, proposals }), targetDuration, width, height, fps, createdAt
 */
export function buildStoryboard(idea, { characters, hook, targetDuration = 40, width = 1080, height = 1920, fps = 30, createdAt = null, showFictionLabel = false } = {}) {
  const profile = CATEGORY_PROFILES[idea.category];
  const { beats, cast, bg, props: seedProps } = beatsForIdea(idea);
  const roles = castRoles(cast, characters);
  const names = Object.fromEntries(Object.entries(roles).map(([k, c]) => [k, c.name]));
  const id = (k) => (roles[k] || roles.hero).id;
  const R = profile.rhythm;

  const outros = OUTROS[idea.category] || [];
  const outro = outros.length ? [{ t: 'conclusion', n: outros[hashString(idea.id) % outros.length], e: 'wave', who: [beats.at(-1)?.who?.[0] || 'hero'], outro: true }] : [];
  const R0 = profile.rhythm;
  const base = [{ t: 'hook', n: hook.text, e: HOOK_EMOTION[idea.category], who: idea.category === 'facts' ? ['guide', 'hero'] : ['hero'], hook: true }, ...beats, ...outro];
  // Cible courte : on retire d'abord la question de fin (facultative) si le texte ne tient pas.
  const minSpeech = (list) => list.reduce((a, b) => a + (wordCount([b.n, ...(b.d || []).map((x) => x[1])].join(' ')) / R0.wordsPerSecond) + 0.35, 0);
  let trimmed = base;
  if (outro.length && minSpeech(base) > Math.max(30, targetDuration)) trimmed = base.filter((b) => !b.outro);
  const allBeats = splitLongBeats(trimmed, R0, 12);
  let prevCamera = null;
  const scenes = allBeats.map((b, i) => {
    const who = [...new Set([...(b.who || ['hero']), ...(b.d || []).map(([r]) => r)])].filter((r) => roles[r]);
    const character_ids = [...new Set(who.map(id))];
    const narration = b.n ? fill(b.n, names) : '';
    const dialogue = (b.d || []).map(([r, text]) => ({ character_id: id(r), text: fill(text, names) }));
    const [animation, expression] = EMOTIONS[b.e] || EMOTIONS.neutral;
    const background_id = b.bg || bg || profile.backgrounds[0];
    let camera = profile.cameras[b.t] || 'static';
    if (b.split) camera = camera === 'static' ? 'pan-left' : 'static';
    if (camera === prevCamera && camera !== 'static') camera = 'static';
    prevCamera = camera;
    // La réplique précède la narration qui la suit (« Allez, ouvre-toi ! » puis « Il pousse la porte »).
    const subtitles = [...dialogue.map((d) => d.text), narration].filter(Boolean).join(' ');
    const speech = estimate(subtitles, R.wordsPerSecond);
    // La parole n'est jamais coupée : maxScene ne limite que les pauses.
    const duration = Math.round(Math.max(b.hook ? 2.5 : R.minScene, Math.min(R.maxScene, speech + R.pad), speech + 0.35) * 10) / 10;
    return {
      scene_id: i + 1,
      scene_type: b.t,
      duration,
      narration,
      dialogue,
      character_ids,
      background_id,
      animation,
      expression,
      camera,
      props: b.p || (background_id === bg ? seedProps : []),
      sound_effects: [profile.sfx[b.t]].filter(Boolean),
      subtitles,
      subtitle_style: b.hook ? 'hook' : 'normal',
      highlight: highlightFor(subtitles, idea.reveal),
      transition: 'cut',
      speech_estimate: Math.round(speech * 10) / 10,
    };
  });
  // Transition vers la scène suivante (la révélation a sa propre transition).
  scenes.forEach((s, i) => {
    const next = scenes[i + 1];
    s.transition = !next ? 'cut' : next.scene_type === 'reveal' ? profile.transitions.reveal : profile.transitions.default;
  });

  const goal = effectiveTarget(scenes, targetDuration);
  fitDuration(scenes, goal, R);
  // Correction finale des arrondis : la dernière scène absorbe l'écart (jamais en dessous de sa parole).
  const sum = scenes.reduce((a, x) => a + x.duration, 0);
  const last = scenes[scenes.length - 1];
  if (sum < 30) last.duration = Math.round((last.duration + (30 - sum) + 0.01) * 100) / 100;

  const total = Math.round(scenes.reduce((a, s) => a + s.duration, 0) * 10) / 10;
  const words = scenes.reduce((a, s) => a + wordCount(s.subtitles), 0);
  return {
    format_version: 1,
    id: `${slug(idea.title)}-${(hashString(idea.id + hook.text) % 100000).toString(36)}`,
    title: idea.title,
    category: idea.category,
    content_type: profile.contentType,
    label: showFictionLabel ? profile.label : null,
    idea_id: idea.id,
    seed_id: idea.seed_id,
    summary: idea.summary,
    themes: idea.themes,
    audience: idea.audience,
    hook: { text: hook.text, family: hook.family, proposals: hook.proposals || [] },
    sources: idea.sources || [],
    cast: Object.fromEntries(Object.entries(roles).map(([k, c]) => [k, c.id])),
    music: profile.music,
    template: profile.template,
    target_duration: targetDuration,
    duration: total,
    word_count: words,
    format: { width, height, fps },
    created_at: createdAt,
    scenes,
  };
}

/** Coupe en deux (à la fin d'une phrase) les scènes trop longues pour rester dynamique, sans dépasser maxScenes. */
export function splitLongBeats(beats, R, maxScenes) {
  const out = [];
  let budget = maxScenes - beats.length;
  for (const b of beats) {
    const text = b.n || '';
    const speech = wordCount(text) / R.wordsPerSecond;
    const sentences = text.match(/[^.!?…]+[.!?…]+[»"]?\s*/g) || [text];
    if (budget > 0 && !b.d && !b.hook && speech + R.pad > R.maxScene && sentences.length >= 2) {
      const half = Math.ceil(sentences.length / 2);
      out.push({ ...b, n: sentences.slice(0, half).join('').trim() });
      out.push({ ...b, n: sentences.slice(half).join('').trim(), split: true });
      budget--;
    } else out.push(b);
  }
  return out;
}

/** Ajuste les durées vers la durée cible sans couper la parole (on n'allonge/raccourcit que les pauses). */
export function fitDuration(scenes, target, R) {
  const t = Math.min(60, Math.max(30, target));
  for (let iter = 0; iter < 3; iter++) {
    const total = scenes.reduce((a, s) => a + s.duration, 0);
    const diff = t - total;
    if (Math.abs(diff) < 0.3) break;
    const flex = scenes.map((s) => (diff > 0 ? R.maxScene * 1.4 - s.duration : s.duration - Math.max(s.speech_estimate + 0.35, 2)));
    const room = flex.reduce((a, f) => a + Math.max(0, f), 0);
    if (room <= 0) break;
    scenes.forEach((s, i) => {
      const share = Math.max(0, flex[i]) / room;
      s.duration = Math.round((s.duration + diff * Math.min(1, room / Math.abs(diff)) * share) * 10) / 10;
    });
  }
}

/**
 * Durée effective : la parole décide. On n'ajoute pas de silence pour atteindre la cible,
 * sauf pour respecter le minimum de 30 s ; on raccourcit les pauses si le texte dépasse la cible.
 */
export function effectiveTarget(scenes, target) {
  const natural = scenes.reduce((a, s) => a + s.duration, 0);
  return Math.max(30, Math.min(Math.min(60, target), natural));
}

export { keywords };
