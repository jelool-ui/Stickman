import { describe, it, expect } from 'vitest';
import { computeStats, formatDuration } from '../engine/history.js';

describe('statistiques de production', () => {
  const h = [
    { id: 1, date: '2026-01-01T10:00', status: 'success', productionTimeSec: 100 },
    { id: 2, date: '2026-01-03T10:00', status: 'failed', error: 'ffmpeg' },
    { id: 3, date: '2026-01-02T10:00', status: 'success', productionTimeSec: 200 },
    { id: 4, date: '2026-01-04T10:00', status: 'running' },
  ];
  it('compte, fait la moyenne et trie', () => {
    const s = computeStats(h);
    expect(s).toMatchObject({ total: 4, success: 2, failed: 1, running: 1, avgProductionTimeSec: 150 });
    expect(s.recent.map((x) => x.id)).toEqual([4, 2, 3, 1]);
    expect(s.recentErrors.map((x) => x.id)).toEqual([2]);
  });
  it('gère un historique vide', () => {
    expect(computeStats([])).toMatchObject({ total: 0, avgProductionTimeSec: null });
  });
  it('formate les durées', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(42)).toBe('42 s');
    expect(formatDuration(125)).toBe('2 min 05 s');
  });
});
