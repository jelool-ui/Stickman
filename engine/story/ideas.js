// Générateur d'idées : 20 idées originales, notées, sans doublon avec l'historique récent.
// Mode de secours sans API : combine la bibliothèque de structures narratives (engine/story/library).
// Aucune prétention de « tendance » : les idées ne reposent sur aucune donnée de popularité en temps réel.
import { SEEDS, FACTS, FACT_THEMES } from './library/index.js';
import { CATEGORY_PROFILES } from './categories.js';
import { keywords, jaccard, normalize, fill } from './text.js';
import { seededRandom } from '../math.js';
import { CATEGORIES } from '../config.js';

export const DUPLICATE_THRESHOLD = 0.5;

/** Similarité entre deux idées (titre, résumé, thèmes, même structure). 1 = identique. */
export function similarity(a, b) {
  if (a.seed_id && a.seed_id === b.seed_id && JSON.stringify(a.fact_ids || []) === JSON.stringify(b.fact_ids || [])) return 1;
  const t = jaccard(keywords(a.title), keywords(b.title));
  const s = jaccard(keywords(a.summary), keywords(b.summary));
  const th = jaccard((a.themes || []).map(normalize), (b.themes || []).map(normalize));
  const factOverlap = a.fact_ids && b.fact_ids ? jaccard(a.fact_ids, b.fact_ids) : 0;
  return Math.max(t, 0.5 * t + 0.3 * s + 0.2 * th, factOverlap * 0.9);
}

export function findDuplicate(idea, others, threshold = DUPLICATE_THRESHOLD) {
  let best = null;
  for (const o of others) {
    const sim = similarity(idea, o);
    if (sim >= threshold && (!best || sim > best.similarity)) best = { idea: o, similarity: Math.round(sim * 100) / 100 };
  }
  return best;
}

function makeId(category, seedId, variant) {
  return `${category}:${seedId}:${variant}`;
}

/** Transforme une fiche de la bibliothèque en idée. */
export function ideaFromSeed(seed, category, variant, names) {
  const title = fill(seed.titles[variant % seed.titles.length], names);
  return {
    id: makeId(category, seed.id, variant % seed.titles.length),
    seed_id: seed.id,
    category,
    title,
    summary: seed.summary,
    themes: seed.themes,
    audience: seed.audience,
    scores: { narrative: seed.potential, ease: seed.ease, total: seed.potential * 2 + seed.ease },
    content_type: CATEGORY_PROFILES[category].contentType,
    sources: seed.sources || [],
    hook: seed.hook,
    reveal: seed.reveal,
  };
}

/** Idée « 3 faits » : un thème + trois fiches de faits sourcées. */
export function factsIdea(theme, factIds, variant = 0) {
  const facts = factIds.map((id) => FACTS.find((f) => f.id === id));
  const label = FACT_THEMES[theme].label;
  const titles = [`3 faits étonnants sur ${label}`, `Trois choses vraies sur ${label}`, `Ce que tu ne savais pas sur ${label}`];
  return {
    id: `facts:${theme}:${factIds.join('+')}`,
    seed_id: `facts-${theme}`,
    fact_ids: factIds,
    category: 'facts',
    title: titles[variant % titles.length],
    summary: facts.map((f) => f.fact).join(' '),
    themes: [theme, ...facts.map((f) => f.keyword)],
    audience: 'tout public',
    scores: { narrative: 4, ease: 5, total: 13 },
    content_type: 'fact',
    sources: facts.flatMap((f) => [f.source, f.source2].filter(Boolean)),
    hook: { theme: label },
    reveal: facts.map((f) => f.keyword),
  };
}

function factCombos(rnd) {
  const out = [];
  for (const theme of Object.keys(FACT_THEMES)) {
    const ids = FACTS.filter((f) => f.theme === theme).map((f) => f.id);
    for (let k = 0; k < 4; k++) {
      const shuffled = [...ids].sort(() => rnd() - 0.5);
      if (shuffled.length >= 3) out.push({ theme, ids: shuffled.slice(0, 3).sort() });
    }
  }
  return out;
}

/**
 * Génère `count` idées originales.
 * history : idées déjà produites (évitées) ; allowed : catégories autorisées ; seed : graine (déterminisme).
 */
export function generateIdeas({ count = 20, allowed = CATEGORIES.map((c) => c.id), history = [], seed = 'ideas', names = { hero: 'Max', friend: 'Léa' } } = {}) {
  const rnd = seededRandom(seed);
  const pools = {};
  for (const cat of allowed) {
    if (cat === 'facts') pools.facts = factCombos(rnd).map((c, i) => factsIdea(c.theme, c.ids, i));
    else pools[cat] = (SEEDS[cat] || []).flatMap((s) => s.titles.map((_, v) => ideaFromSeed(s, cat, v, names))).sort(() => rnd() - 0.5);
  }
  const ideas = [];
  const rejected = [];
  // Alternance des catégories (round-robin) pour un mélange équilibré.
  let guard = 0;
  while (ideas.length < count && guard++ < 500) {
    let added = false;
    for (const cat of allowed) {
      if (ideas.length >= count) break;
      const pool = pools[cat];
      while (pool?.length) {
        const cand = pool.shift();
        const dup = findDuplicate(cand, [...history, ...ideas]);
        if (dup) { rejected.push({ idea: cand, duplicateOf: dup.idea.id, similarity: dup.similarity }); continue; }
        ideas.push(cand);
        added = true;
        break;
      }
    }
    if (!added) break;
  }
  return { ideas, rejected, exhausted: ideas.length < count };
}

/** Mode MIX AUTOMATIQUE : catégorie la moins récemment produite parmi les catégories autorisées. */
export function pickAutoCategory(allowed, history = []) {
  const lastIndex = (cat) => {
    const i = history.findIndex((h) => h.category === cat);
    return i < 0 ? Infinity : i;
  };
  // history est trié du plus récent au plus ancien.
  return [...allowed].sort((a, b) => lastIndex(b) - lastIndex(a) || allowed.indexOf(a) - allowed.indexOf(b))[0];
}
