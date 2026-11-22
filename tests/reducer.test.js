import { describe, it, expect } from 'vitest';
import { reducer, initialState, hydrate } from '../src/state/reducer.js';

describe("état de l'interface", () => {
  it('enregistre des paramètres valides et refuse les invalides', () => {
    let s = initialState();
    s = reducer(s, { type: 'settings/save', settings: { ...s.settings, targetDuration: 55 } });
    expect(s.settings.targetDuration).toBe(55);
    const bad = reducer(s, { type: 'settings/save', settings: { ...s.settings, fps: 7 } });
    expect(bad.settings.fps).toBe(30);
    expect(bad.lastError).toMatch(/fps/);
  });

  it('crée, modifie et supprime un personnage, sans jamais tout supprimer', () => {
    let s = initialState();
    const n = s.characters.length;
    const c = { ...structuredClone(s.characters[0]), id: 'zoe', name: 'Zoé' };
    s = reducer(s, { type: 'character/save', character: c });
    expect(s.characters).toHaveLength(n + 1);
    s = reducer(s, { type: 'character/save', character: { ...c, name: 'Zoé 2' } });
    expect(s.characters.find((x) => x.id === 'zoe').name).toBe('Zoé 2');
    s = reducer(s, { type: 'character/save', character: { ...c, colors: { ...c.colors, head: 'red"/><script>' } } });
    expect(s.lastError).toMatch(/couleur/);
    for (const x of [...s.characters]) s = reducer(s, { type: 'character/delete', id: x.id });
    expect(s.characters).toHaveLength(1);
  });

  it('modifie une scène du storyboard', () => {
    let s = initialState();
    s = reducer(s, { type: 'storyboard/updateScene', scene_id: 2, patch: { duration: 6, animation: 'jump' } });
    expect(s.storyboard.scenes[1]).toMatchObject({ duration: 6, animation: 'jump' });
    expect(s.storyboard.scenes[0].duration).toBe(3.5);
  });

  it("fusionne l'historique sans doublon", () => {
    let s = initialState();
    s = reducer(s, { type: 'history/add', entry: { id: 'a', date: '2026-01-01' } });
    s = reducer(s, { type: 'history/merge', entries: [{ id: 'a' }, { id: 'b' }] });
    expect(s.history.map((h) => h.id)).toEqual(['a', 'b']);
  });

  it('récupère un état sauvegardé corrompu ou ancien', () => {
    expect(hydrate(null)).toEqual(initialState());
    expect(hydrate({ version: 0 })).toEqual(initialState());
    const h = hydrate({ version: 1, settings: { fps: 999 }, characters: 'oops', history: null });
    expect(h.settings.fps).toBe(30);
    expect(Array.isArray(h.characters)).toBe(true);
    expect(h.history).toEqual([]);
  });
});
