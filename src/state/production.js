// Production côté navigateur : storyboard uniquement (le rendu vidéo se fait sur GitHub Actions).
import { produceStoryboard, storyboardForIdea, historyEntry } from '../../engine/story/pipeline.js';

export async function generateStoryboard({ state, dispatch, category, idea, targetDuration, style }) {
  const settings = { ...state.settings, targetDuration };
  const result = idea
    ? { ok: true, category: idea.category, ...storyboardForIdea(idea, { characters: state.characters, history: state.history, targetDuration, format: settings }), provider: 'template', attempts: 1, warnings: [] }
    : await produceStoryboard({ category, settings, characters: state.characters, history: state.history, seed: String(Date.now()), createdAt: new Date().toISOString() });
  if (result.storyboard) {
    result.ok = result.validation.ok;
    const storyboard = { ...result.storyboard, style, created_at: new Date().toISOString() };
    dispatch({ type: 'production/storyboard', storyboard, entry: historyEntry(result, { status: result.ok ? 'storyboard' : 'failed' }) });
  }
  return result;
}
