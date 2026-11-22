#!/usr/bin/env node
// Décide si la production planifiée doit tourner aujourd'hui, selon config/settings.json (« schedule »).
// manual → jamais ; daily → tous les jours ; 3-per-week → lundi, mercredi, vendredi ; weekly → lundi.
// Écrit run, count, category dans $GITHUB_OUTPUT. Ne lance jamais plus de maxVideosPerRun vidéos.
import { readFileSync, appendFileSync } from 'node:fs';
import { DEFAULT_SETTINGS, validateSettings } from '../engine/config.js';

export function decide(settings, date = new Date()) {
  const day = date.getUTCDay(); // 0 = dimanche
  const rules = { manual: () => false, daily: () => true, '3-per-week': () => [1, 3, 5].includes(day), weekly: () => day === 1 };
  const rule = rules[settings.schedule] || rules.manual;
  const count = Math.max(1, Math.min(settings.videosPerRun || 1, settings.maxVideosPerRun || 3));
  const run = rule();
  const reason = settings.schedule === 'manual' ? 'calendrier sur « manuel » : aucune production planifiée' : run ? `calendrier « ${settings.schedule} » : production prévue aujourd'hui` : `calendrier « ${settings.schedule} » : pas de production aujourd'hui`;
  return { run, count, category: settings.category || 'auto', reason };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let settings = { ...DEFAULT_SETTINGS };
  try { settings = { ...settings, ...JSON.parse(readFileSync('config/settings.json', 'utf8')) }; } catch { /* valeurs par défaut */ }
  const v = validateSettings(settings);
  const d = v.ok ? decide(settings) : { run: false, count: 0, category: 'auto', reason: `paramètres invalides : ${v.errors.join(', ')}` };
  if (process.argv.includes('--force')) { d.run = true; d.reason = 'lancement manuel forcé'; }
  console.log(`${d.run ? '▶️' : '⏸️'} ${d.reason} (vidéos : ${d.count}, catégorie : ${d.category})`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `run=${d.run}\ncount=${d.count}\ncategory=${d.category}\nreason=${d.reason}\n`);
}
