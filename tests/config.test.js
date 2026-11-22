import { describe, it, expect } from 'vitest';
import { CATEGORIES, DEFAULT_SETTINGS, validateSettings } from '../engine/config.js';

describe('configuration', () => {
  it('définit les six catégories', () => {
    expect(CATEGORIES.map((c) => c.id)).toEqual(['explainer', 'comedy', 'mysteres', 'etsi', 'facts', 'motivation']);
  });
  it('les réglages par défaut respectent le cahier des charges Shorts', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ width: 1080, height: 1920, fps: 30, minDuration: 30, maxDuration: 60 });
    expect(validateSettings(DEFAULT_SETTINGS)).toEqual({ ok: true, errors: [] });
  });
  it('refuse des réglages invalides', () => {
    const r = validateSettings({ ...DEFAULT_SETTINGS, fps: 13, videosPerRun: 50, allowedCategories: ['xyz'] });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBe(3);
  });
});
