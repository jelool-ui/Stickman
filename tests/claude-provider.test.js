import { describe, it, expect } from 'vitest';
import { createClaudeProvider, sanitizeIdea, claudeEnabled, CLAUDE_MODEL } from '../render/providers/claude.js';
import { produceStoryboard } from '../engine/story/pipeline.js';
import { DEFAULT_SETTINGS } from '../engine/config.js';
import { DEFAULT_CHARACTERS as C } from '../engine/characters/library.js';

// Aucun appel réseau : le client de l'API est simulé. (Le vrai fournisseur est facultatif et payant.)
const goodIdea = {
  title: 'Le robot aspirateur rebelle', summary: 'Un robot aspirateur décide de faire grève.', themes: ['robot', 'maison'], audience: 'tout public', potential: 4, ease: 4,
  hook: { situation: '{hero} achète un robot aspirateur', subject: 'un robot aspirateur', twist: true }, reveal: ['robot', 'greve'], bg: 'house', props: ['lamp'],
  beats: [
    { t: 'setup', n: '{hero} achète un robot aspirateur tout neuf. Il le pose fièrement dans le salon.', e: 'happy', who: ['hero'] },
    { t: 'development', n: 'Le robot fait trois tours, puis s’arrête net devant le canapé et clignote en rouge.', e: 'surprise', who: ['hero'] },
    { t: 'development', d: [['hero', 'Allez, au travail ! Il y a des miettes partout.']], e: 'angry', who: ['hero'] },
    { t: 'escalation', n: 'Le robot recule lentement, puis il va se cacher sous le lit pour bouder.', e: 'think', who: ['hero', 'friend'] },
    { t: 'reveal', d: [['friend', 'Regarde l’écran : il réclame un jour de repos par semaine, comme tout le monde.']], e: 'point', who: ['friend', 'hero'] },
    { t: 'conclusion', n: 'Depuis, le robot a son dimanche. Et {hero} passe le balai.', e: 'laugh', who: ['hero', 'friend'] },
  ],
};
const fakeClient = (response, capture = {}) => ({ beta: { messages: { create: async (req) => { capture.req = req; return response; } } } });
const ok = (ideas) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ ideas }) }] });

describe('fournisseur IA facultatif (Claude)', () => {
  it("n'est activé qu'avec une configuration explicite et une clé", () => {
    expect(claudeEnabled({})).toBe(false);
    expect(claudeEnabled({ ANTHROPIC_API_KEY: 'x' })).toBe(false);
    expect(claudeEnabled({ STICK_TEXT_PROVIDER: 'claude', ANTHROPIC_API_KEY: 'x' })).toBe(true);
  });
  it('envoie une requête conforme (modèle, repli serveur, JSON demandé)', async () => {
    const cap = {};
    const p = await createClaudeProvider({ client: fakeClient(ok([goodIdea]), cap) });
    const r = await p.generateIdeas({ allowed: ['comedy'], history: [] });
    expect(cap.req.model).toBe(CLAUDE_MODEL);
    expect(cap.req.fallbacks).toBe('default');
    expect(cap.req.betas).toContain('server-side-fallback-2026-07-01');
    expect(r.ideas).toHaveLength(1);
    expect(r.ideas[0].provider).toBe('claude');
  });
  it('produit un storyboard valide à partir d’une idée IA validée', async () => {
    const p = await createClaudeProvider({ client: fakeClient(ok([goodIdea])) });
    const r = await produceStoryboard({ category: 'comedy', settings: DEFAULT_SETTINGS, characters: C, provider: p });
    expect(r.validation.errors).toEqual([]);
    expect(r.provider).toBe('claude');
    expect(r.storyboard.title).toBe('Le robot aspirateur rebelle');
  });
  it('rejette les idées mal formées', () => {
    expect(sanitizeIdea({ title: 'x' }, 'comedy', 0)).toBeNull();
    expect(sanitizeIdea({ ...goodIdea, beats: goodIdea.beats.map((b) => ({ ...b, e: 'voler' })) }, 'comedy', 0)).toBeNull();
    expect(sanitizeIdea({ ...goodIdea, beats: goodIdea.beats.filter((b) => b.t !== 'reveal') }, 'comedy', 0)).toBeNull();
  });
  it('un refus, une réponse illisible ou une catégorie factuelle déclenchent le repli', async () => {
    const refusal = await createClaudeProvider({ client: fakeClient({ stop_reason: 'refusal', content: [] }) });
    await expect(refusal.generateIdeas({ allowed: ['comedy'] })).rejects.toThrow(/refusée/);
    const garbage = await createClaudeProvider({ client: fakeClient({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'pas du json' }] }) });
    await expect(garbage.generateIdeas({ allowed: ['comedy'] })).rejects.toThrow();
    await expect(garbage.generateIdeas({ allowed: ['facts'] })).rejects.toThrow(/factuelle/);
    const r = await produceStoryboard({ category: 'comedy', settings: DEFAULT_SETTINGS, characters: C, provider: garbage });
    expect(r.ok).toBe(true);
    expect(r.provider).toBe('template');
  });
});
