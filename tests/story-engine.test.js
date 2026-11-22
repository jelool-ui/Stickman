import { describe, it, expect } from 'vitest';
import { generateIdeas, similarity, findDuplicate, pickAutoCategory, ideaFromSeed } from '../engine/story/ideas.js';
import { generateHooks, scoreHook } from '../engine/story/hooks.js';
import { buildStoryboard } from '../engine/story/scenario.js';
import { validateStoryboard } from '../engine/story/validate.js';
import { produceStoryboard, storyboardForIdea, historyEntry, MAX_ATTEMPTS } from '../engine/story/pipeline.js';
import { SEEDS } from '../engine/story/library/index.js';
import { DEFAULT_SETTINGS, CATEGORIES } from '../engine/config.js';
import { DEFAULT_CHARACTERS as C } from '../engine/characters/library.js';
import { renderFrame } from '../engine/scenes/compose.js';
import { wordCount } from '../engine/story/text.js';

const names = { hero: 'Max', friend: 'Léa' };

describe("générateur d'idées", () => {
  it('génère 20 idées originales, sans doublon, en alternant les catégories', () => {
    const { ideas } = generateIdeas({ count: 20, seed: 't1' });
    expect(ideas).toHaveLength(20);
    for (let i = 0; i < ideas.length; i++) for (let j = i + 1; j < ideas.length; j++) expect(similarity(ideas[i], ideas[j]), `${ideas[i].id} ~ ${ideas[j].id}`).toBeLessThan(0.5);
    expect(new Set(ideas.slice(0, 6).map((i) => i.category)).size).toBe(6);
    for (const i of ideas) {
      expect(i.title && i.summary && i.audience).toBeTruthy();
      expect(i.scores.narrative).toBeGreaterThanOrEqual(1);
      expect(i.scores.ease).toBeLessThanOrEqual(5);
    }
  });
  it('respecte les catégories autorisées et évite l’historique', () => {
    const first = generateIdeas({ count: 5, allowed: ['comedy'], seed: 'a' }).ideas;
    expect(first.every((i) => i.category === 'comedy')).toBe(true);
    const next = generateIdeas({ count: 5, allowed: ['comedy'], seed: 'b', history: first }).ideas;
    for (const n of next) expect(findDuplicate(n, first)).toBeNull();
  });
  it('détecte les doublons par titre, résumé et thèmes', () => {
    const a = { title: 'La porte qui refusait de s’ouvrir', summary: 'Un homme pressé contre une porte', themes: ['porte'] };
    const b = { title: 'La porte qui refuse de s’ouvrir !', summary: 'Une femme pressée contre une porte', themes: ['porte'] };
    const c = { title: 'Pourquoi le ciel est bleu', summary: 'Diffusion de la lumière', themes: ['ciel'] };
    expect(similarity(a, b)).toBeGreaterThanOrEqual(0.5);
    expect(similarity(a, c)).toBeLessThan(0.2);
  });
  it("signale l'épuisement au lieu de boucler", () => {
    const all = generateIdeas({ count: 100, allowed: ['comedy'], seed: 'x' });
    expect(all.exhausted).toBe(true);
    expect(all.ideas.length).toBe(SEEDS.comedy.length);
  });
  it('le mix automatique choisit la catégorie la moins récemment produite', () => {
    const allowed = ['comedy', 'facts', 'etsi'];
    expect(pickAutoCategory(allowed, [])).toBe('comedy');
    expect(pickAutoCategory(allowed, [{ category: 'comedy' }, { category: 'etsi' }])).toBe('facts');
    expect(pickAutoCategory(allowed, [{ category: 'facts' }, { category: 'comedy' }, { category: 'etsi' }])).toBe('etsi');
  });
});

describe('moteur de hook', () => {
  const idea = ideaFromSeed(SEEDS.comedy[0], 'comedy', 0, names);
  it('propose 3 hooks de familles différentes et choisit le meilleur', () => {
    const h = generateHooks(idea, names);
    expect(h.proposals).toHaveLength(3);
    expect(new Set(h.proposals.map((p) => p.family)).size).toBe(3);
    expect(h.proposals.filter((p) => p.best)).toHaveLength(1);
    expect(h.best.total).toBe(Math.max(...h.proposals.map((p) => p.total)));
    for (const p of h.proposals) {
      expect(Object.keys(p.criteria)).toEqual(['curiosite', 'clarte', 'originalite', 'comprehension', 'promesse', 'coherence']);
      for (const v of Object.values(p.criteria)) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(5); }
      expect(p.text).not.toMatch(/\{\w+\}/);
    }
  });
  it('chaque idée de chaque catégorie obtient 3 hooks', () => {
    for (const [cat, list] of Object.entries(SEEDS)) for (const s of list) expect(generateHooks(ideaFromSeed(s, cat, 0, names), names).proposals.length, s.id).toBe(3);
  });
  it('marque les formulations racoleuses comme trompeuses', () => {
    expect(scoreHook('Le secret choquant que personne ne veut que vous sachiez', idea).misleading).toBe(true);
    expect(scoreHook('Max contre une porte coulissante', idea).misleading).toBe(false);
  });
  it('varie les formulations : une famille utilisée récemment perd des points', () => {
    const fresh = scoreHook('Pourquoi cette porte ne s’ouvre pas ?', idea, { family: 'question', recentFamilies: [] });
    const used = scoreHook('Pourquoi cette porte ne s’ouvre pas ?', idea, { family: 'question', recentFamilies: ['question', 'question'] });
    expect(used.criteria.originalite).toBeLessThan(fresh.criteria.originalite);
  });
  it("une promesse de durée n'annonce jamais un nombre exact de secondes", () => {
    const ex = ideaFromSeed(SEEDS.explainer[0], 'explainer', 0, names);
    for (let k = 0; k < 10; k++) for (const p of generateHooks(ex, names, { seed: `s${k}` }).proposals) expect(p.text).not.toMatch(/\d+ secondes/);
  });
});

describe('générateur de scénarios et validation', () => {
  it('toutes les histoires × 3 durées donnent un storyboard valide', () => {
    for (const [cat, list] of Object.entries(SEEDS))
      for (const s of list)
        for (const target of [30, 45, 60]) {
          const r = storyboardForIdea(ideaFromSeed(s, cat, 0, names), { characters: C, targetDuration: target });
          expect(r.validation.errors, `${s.id} @${target}`).toEqual([]);
          const sb = r.storyboard;
          expect(sb.duration).toBeGreaterThanOrEqual(30);
          // La parole n'est jamais coupée : au-delà de la cible, un avertissement est émis.
          if (sb.duration > Math.max(target, 30) + 1) expect(r.validation.warnings.join(), `${s.id} @${target}`).toMatch(/au-delà de la cible/);
          if (target >= 45) expect(sb.duration).toBeLessThanOrEqual(target + 0.5);
          if (target >= 45) expect(sb.word_count).toBeGreaterThanOrEqual(80);
        }
  });
  it('chaque scène contient les champs exigés et le hook ouvre la vidéo', () => {
    const r = storyboardForIdea(ideaFromSeed(SEEDS.mysteres[0], 'mysteres', 0, names), { characters: C });
    const sb = r.storyboard;
    expect(sb.scenes[0].subtitle_style).toBe('hook');
    expect(sb.scenes[0].narration).toBe(sb.hook.text);
    for (const s of sb.scenes) for (const f of ['scene_id', 'duration', 'narration', 'dialogue', 'character_ids', 'background_id', 'animation', 'camera', 'props', 'sound_effects', 'subtitles', 'transition']) expect(s, f).toHaveProperty(f);
    expect(sb.label).toBe('Histoire inventée');
    expect(sb.scenes.at(-1).transition).toBe('cut');
  });
  it('les faits gardent leurs sources et ne sont pas étiquetés fiction', async () => {
    const r = await produceStoryboard({ category: 'facts', settings: DEFAULT_SETTINGS, characters: C });
    expect(r.ok).toBe(true);
    expect(r.storyboard.content_type).toBe('fact');
    expect(r.storyboard.label).toBeNull();
    expect(r.storyboard.sources.length).toBeGreaterThanOrEqual(3);
  });
  it('la validation refuse un storyboard cassé', () => {
    const sb = storyboardForIdea(ideaFromSeed(SEEDS.comedy[1], 'comedy', 0, names), { characters: C }).storyboard;
    const broken = structuredClone(sb);
    broken.scenes[2].background_id = 'nulle-part';
    broken.scenes[3].animation = 'voler';
    broken.scenes[4].duration = 0.5;
    broken.scenes = broken.scenes.slice(0, 5);
    broken.label = null;
    const v = validateStoryboard(broken, { characters: C });
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/décor inconnu/);
    expect(v.errors.join(' ')).toMatch(/animation inconnue/);
    expect(v.errors.join(' ')).toMatch(/scènes/);
    expect(v.errors.join(' ')).toMatch(/étiquette/);
    const noSource = { ...structuredClone(sb), content_type: 'fact', sources: [] };
    expect(validateStoryboard(noSource, { characters: C }).errors.join(' ')).toMatch(/sans source/);
  });
  it('affiche le hook en grand et l’étiquette de fiction à l’image', () => {
    const sb = storyboardForIdea(ideaFromSeed(SEEDS.etsi[0], 'etsi', 0, names), { characters: C }).storyboard;
    const svg = renderFrame(sb, C, 1);
    expect(svg).toContain('Scénario imaginaire');
    expect(svg).toContain('Et si');
  });
});

describe('production (pipeline)', () => {
  it('6 productions successives en mix automatique couvrent les 6 catégories', async () => {
    const history = [];
    for (let i = 0; i < 6; i++) {
      const r = await produceStoryboard({ category: 'auto', settings: DEFAULT_SETTINGS, characters: C, history });
      expect(r.ok, r.validation.errors.join()).toBe(true);
      history.unshift(historyEntry(r));
    }
    expect(new Set(history.map((h) => h.category))).toEqual(new Set(CATEGORIES.map((c) => c.id)));
  });
  it('ne répète pas une histoire récente', async () => {
    const history = [];
    for (let i = 0; i < SEEDS.comedy.length; i++) {
      const r = await produceStoryboard({ category: 'comedy', settings: DEFAULT_SETTINGS, characters: C, history });
      expect(r.ok).toBe(true);
      history.unshift(historyEntry(r));
    }
    expect(new Set(history.map((h) => h.seed_id)).size).toBe(SEEDS.comedy.length);
    const after = await produceStoryboard({ category: 'comedy', settings: DEFAULT_SETTINGS, characters: C, history });
    expect(after.ok).toBe(false);
    expect(after.validation.errors[0]).toMatch(/Plus aucune idée nouvelle/);
  });
  it('un fournisseur défaillant bascule sur les modèles intégrés', async () => {
    const broken = { name: 'cassé', generateIdeas: async () => { throw new Error('hors service'); } };
    const r = await produceStoryboard({ category: 'comedy', settings: DEFAULT_SETTINGS, characters: C, provider: broken });
    expect(r.ok).toBe(true);
    expect(r.provider).toBe('template');
    expect(r.warnings.join()).toMatch(/hors service/);
  });
  it('les catégories factuelles ignorent le fournisseur IA', async () => {
    let called = false;
    const ai = { name: 'ia', generateIdeas: async () => { called = true; return { ideas: [] }; } };
    const r = await produceStoryboard({ category: 'explainer', settings: DEFAULT_SETTINGS, characters: C, provider: ai });
    expect(called).toBe(false);
    expect(r.ok).toBe(true);
  });
  it(`limite les essais à ${MAX_ATTEMPTS} (jamais de boucle infinie)`, async () => {
    const r = await produceStoryboard({ category: 'comedy', settings: { ...DEFAULT_SETTINGS }, characters: [{ ...C[0] }], history: [] });
    expect(r.attempts).toBeLessThanOrEqual(MAX_ATTEMPTS);
  });
  it('les textes restent dans la fourchette de mots pour toutes les catégories', async () => {
    for (const { id } of CATEGORIES) {
      const r = await produceStoryboard({ category: id, settings: DEFAULT_SETTINGS, characters: C });
      const w = r.storyboard.scenes.reduce((a, s) => a + wordCount(s.subtitles), 0);
      expect(w, id).toBeGreaterThanOrEqual(80);
      expect(w, id).toBeLessThanOrEqual(140);
    }
  });
});
