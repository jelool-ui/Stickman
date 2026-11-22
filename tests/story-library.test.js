import { describe, it, expect } from 'vitest';
import { SEEDS, FACTS, FACT_THEMES } from '../engine/story/library/index.js';
import { CATEGORY_PROFILES, EMOTIONS, BEAT_TYPES } from '../engine/story/categories.js';
import { HOOK_FAMILIES } from '../engine/story/hooks.js';
import { listBackgrounds } from '../engine/scenes/backgrounds.js';
import { getProp } from '../engine/scenes/props.js';
import { CATEGORIES } from '../engine/config.js';

const bgs = new Set(listBackgrounds().map(([id]) => id));

describe('bibliothèque narrative', () => {
  it('chaque catégorie a un profil complet (narration, hooks, décors, sons, rythme, modèle)', () => {
    for (const { id } of CATEGORIES) {
      const p = CATEGORY_PROFILES[id];
      expect(p.narration.length, id).toBeGreaterThan(40);
      expect(p.hookFamilies.length).toBeGreaterThanOrEqual(3);
      for (const f of p.hookFamilies) expect(HOOK_FAMILIES[f], f).toBeDefined();
      for (const b of p.backgrounds) expect(bgs.has(b), b).toBe(true);
      for (const t of BEAT_TYPES) expect(p.sfx[t], `${id} sfx ${t}`).toBeTruthy();
      expect(p.rhythm.wordsPerSecond).toBeGreaterThan(2);
      expect(p.template).toBeTruthy();
    }
  });
  it('chaque histoire est complète et cohérente', () => {
    const ids = new Set();
    for (const [cat, list] of Object.entries(SEEDS)) {
      expect(list.length, cat).toBeGreaterThanOrEqual(6);
      for (const s of list) {
        expect(ids.has(s.id), `doublon ${s.id}`).toBe(false);
        ids.add(s.id);
        expect(s.titles.length).toBe(3);
        expect(s.reveal.length).toBeGreaterThan(0);
        expect(bgs.has(s.bg), `${s.id} bg`).toBe(true);
        const types = s.beats.map((b) => b.t);
        expect(types[0], s.id).toBe('setup');
        expect(types).toContain('reveal');
        expect(types.at(-1)).toBe('conclusion');
        for (const b of s.beats) {
          expect(EMOTIONS[b.e], `${s.id} émotion ${b.e}`).toBeDefined();
          if (b.bg) expect(bgs.has(b.bg), `${s.id} ${b.bg}`).toBe(true);
          for (const p of [...(b.p || []), ...(s.props || [])]) expect(getProp(p), `${s.id} objet ${p}`).toBeTruthy();
          const roles = [...(b.who || []), ...(b.d || []).map(([r]) => r)];
          for (const r of roles) expect(r === 'hero' || s.cast[r], `${s.id} rôle ${r}`).toBeTruthy();
          expect(b.n || b.d?.length, s.id).toBeTruthy();
        }
      }
    }
  });
  it('les contenus factuels ont tous une source vérifiée', () => {
    for (const s of SEEDS.explainer) {
      expect(s.sources.length, s.id).toBeGreaterThan(0);
      for (const src of s.sources) expect(src.url).toMatch(/^https:\/\/(fr|en)\.wikipedia\.org\/wiki\//);
    }
    expect(FACTS.length).toBeGreaterThanOrEqual(12);
    for (const f of FACTS) {
      expect(FACT_THEMES[f.theme], f.id).toBeDefined();
      expect(f.source.url, f.id).toMatch(/^https:\/\/(fr|en)\.wikipedia\.org\/wiki\//);
      expect(f.source.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    for (const theme of Object.keys(FACT_THEMES)) expect(FACTS.filter((f) => f.theme === theme).length, theme).toBeGreaterThanOrEqual(3);
  });
});
