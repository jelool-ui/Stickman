import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { decide } from '../scripts/should-run.js';

const wf = (f) => readFileSync(`.github/workflows/${f}`, 'utf8');

describe('workflows GitHub Actions', () => {
  it('lancement manuel : catégorie, nombre (max 3), durée, une production à la fois', () => {
    const y = wf('generate-video.yml');
    expect(y).toMatch(/workflow_dispatch:/);
    expect(y).toMatch(/options: \[auto, explainer, comedy, mysteres, etsi, facts, motivation\]/);
    expect(y).toMatch(/options: \['1', '2', '3'\]/);
    expect(y).toMatch(/group: stick-studio-production/);
    expect(y).toMatch(/cancel-in-progress: false/);
  });
  it('production planifiée : calendrier, lancement manuel possible, même verrou', () => {
    const y = wf('scheduled-production.yml');
    expect(y).toMatch(/schedule:\s*\n\s*- cron:/);
    expect(y).toMatch(/workflow_dispatch:/);
    expect(y).toMatch(/group: stick-studio-production/);
  });
  it('limites : délais, conservation des artefacts, permissions minimales, pas de secret affiché', () => {
    for (const f of ['generate-video.yml', 'scheduled-production.yml', '_production.yml', 'ci.yml']) {
      const y = wf(f);
      expect(y, f).toMatch(/permissions:\s*\n\s*contents: read/);
      expect(y, f).not.toMatch(/contents: write|actions: write|id-token/);
      expect(y, f).not.toMatch(/echo .*secrets\./);
    }
    const p = wf('_production.yml');
    expect(p).toMatch(/timeout-minutes: 45/);
    expect(p).toMatch(/retention-days: \$\{\{ inputs.retention_days \}\}/);
    expect(p).toMatch(/actions\/cache\/restore@v5/);
    expect(wf('ci.yml')).toMatch(/retention-days: 3/);
  });
});

describe('calendrier de production', () => {
  const s = (schedule) => ({ schedule, videosPerRun: 1, maxVideosPerRun: 3, category: 'auto' });
  const monday = new Date('2026-11-23T05:23:00Z'), tuesday = new Date('2026-11-24T05:23:00Z');
  it('respecte chaque fréquence', () => {
    expect(decide(s('manual'), monday).run).toBe(false);
    expect(decide(s('daily'), tuesday).run).toBe(true);
    expect(decide(s('3-per-week'), monday).run).toBe(true);
    expect(decide(s('3-per-week'), tuesday).run).toBe(false);
    expect(decide(s('weekly'), monday).run).toBe(true);
    expect(decide(s('weekly'), tuesday).run).toBe(false);
  });
  it('ne dépasse jamais le maximum de vidéos par exécution', () => {
    expect(decide({ ...s('daily'), videosPerRun: 50 }, monday).count).toBe(3);
  });
});
