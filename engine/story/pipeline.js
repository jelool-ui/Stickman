// Chaîne complète : catégorie → idées → hooks → scénario → validation. Fonctionne dans le navigateur et dans Node.
import { pickAutoCategory } from './ideas.js';
import { generateHooks } from './hooks.js';
import { buildStoryboard, castRoles, beatsForIdea } from './scenario.js';
import { validateStoryboard } from './validate.js';
import { templateProvider } from './providers/template.js';
import { CATEGORY_PROFILES } from './categories.js';

export const MAX_ATTEMPTS = 3; // jamais de boucle infinie
export const RECENT_WINDOW = 40; // nombre de productions récentes à ne pas répéter

/** Prépare un storyboard pour une idée donnée (hooks + scénario + validation). */
export function storyboardForIdea(idea, { characters, history = [], targetDuration = 40, format = {}, createdAt = null }) {
  const { cast } = beatsForIdea(idea);
  const roles = castRoles(cast, characters);
  const names = Object.fromEntries(Object.entries(roles).map(([k, c]) => [k, c.name]));
  const recentFamilies = history.slice(0, 10).map((h) => h.hook_family).filter(Boolean);
  const hooks = generateHooks({ ...idea, targetDuration }, names, { recentFamilies });
  const storyboard = buildStoryboard(idea, {
    characters, targetDuration, createdAt, ...format,
    hook: { text: hooks.best.text, family: hooks.best.family, proposals: hooks.proposals },
  });
  const validation = validateStoryboard(storyboard, { characters });
  return { idea, hooks, storyboard, validation };
}

/**
 * Production d'un storyboard.
 * category : id de catégorie ou 'auto' (MIX AUTOMATIQUE). idea : idée imposée (mode manuel).
 * history : productions passées, de la plus récente à la plus ancienne.
 * Renvoie { ok, category, idea, hooks, storyboard, validation, attempts, provider, warnings }.
 */
export async function produceStoryboard({ category = 'auto', idea = null, settings, characters, history = [], provider = templateProvider, seed = 'run', createdAt = null }) {
  const allowed = settings.allowedCategories;
  const warnings = [];
  const cat = idea?.category || (category === 'auto' ? pickAutoCategory(allowed, history) : category);
  if (!CATEGORY_PROFILES[cat]) throw new Error(`Catégorie inconnue : ${cat}`);
  const recent = history.slice(0, RECENT_WINDOW);
  const format = { width: settings.width, height: settings.height, fps: settings.fps };
  const opts = { characters, history, targetDuration: settings.targetDuration, format, createdAt };

  if (idea) {
    const r = storyboardForIdea(idea, opts);
    return { ok: r.validation.ok, category: cat, ...r, attempts: 1, provider: idea.provider || provider.name, warnings };
  }

  let candidates;
  let usedProvider = provider;
  // Les catégories factuelles n'utilisent jamais de fournisseur IA : seulement la base de faits sourcés.
  if (CATEGORY_PROFILES[cat].contentType === 'fact' && provider !== templateProvider) {
    usedProvider = templateProvider;
    warnings.push('Catégorie factuelle : contenu issu de la base de faits sourcés (pas de texte généré par IA).');
  }
  try {
    candidates = (await usedProvider.generateIdeas({ count: 20, allowed: [cat], history: recent, seed: `${seed}:${cat}` })).ideas;
  } catch (e) {
    warnings.push(`Fournisseur « ${usedProvider.name} » indisponible (${e.message}) : utilisation des modèles intégrés.`);
    usedProvider = templateProvider;
    candidates = (await templateProvider.generateIdeas({ count: 20, allowed: [cat], history: recent, seed: `${seed}:${cat}` })).ideas;
  }
  if (!candidates.length) {
    return { ok: false, category: cat, attempts: 0, provider: usedProvider.name, warnings,
      validation: { ok: false, errors: [`Plus aucune idée nouvelle en « ${cat} » : toutes ont été produites récemment. Ajoutez des histoires à la bibliothèque ou attendez.`], warnings: [] } };
  }
  candidates.sort((a, b) => b.scores.total - a.scores.total);
  const failures = [];
  for (let i = 0; i < Math.min(MAX_ATTEMPTS, candidates.length); i++) {
    const r = storyboardForIdea(candidates[i], opts);
    if (r.validation.ok) return { ok: true, category: cat, ...r, attempts: i + 1, provider: usedProvider.name, warnings, failures };
    failures.push({ idea: candidates[i].id, errors: r.validation.errors });
  }
  const last = storyboardForIdea(candidates[0], opts);
  return { ok: false, category: cat, ...last, attempts: Math.min(MAX_ATTEMPTS, candidates.length), provider: usedProvider.name, warnings, failures };
}

/** Entrée d'historique à enregistrer après une production. */
export function historyEntry(result, { status = 'storyboard', date = new Date().toISOString(), error = null } = {}) {
  const sb = result.storyboard;
  return {
    id: sb?.id || `echec-${Date.now()}`,
    date,
    title: sb?.title || result.idea?.title || '(sans titre)',
    category: result.category,
    status,
    idea_id: result.idea?.id,
    seed_id: result.idea?.seed_id,
    fact_ids: result.idea?.fact_ids,
    summary: result.idea?.summary,
    themes: result.idea?.themes,
    hook_family: sb?.hook?.family,
    template: sb?.template,
    provider: result.provider,
    error: error || (result.ok ? null : (result.validation?.errors || []).join(' ; ')),
  };
}
