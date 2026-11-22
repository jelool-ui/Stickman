#!/usr/bin/env node
// Commande unique de production : node scripts/produce.js [--category auto|comedy|…] [--count 1] [--duration 40] [--style classic] [--voice auto]
// Chaque vidéo : storyboard validé → voix → sous-titres → musique → effets → images → mixage → miniature → SEO → contrôle qualité.
// Une vidéo qui échoue est enregistrée avec son erreur ; on passe à la suivante (jamais de boucle infinie).
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { produceStoryboard, historyEntry } from '../engine/story/pipeline.js';
import { DEFAULT_SETTINGS, validateSettings, CATEGORIES } from '../engine/config.js';
import { DEFAULT_CHARACTERS } from '../engine/characters/library.js';
import { DEFAULT_VOICE_PROFILES } from '../engine/voices.js';
import { templateProvider } from '../engine/story/providers/template.js';
import { claudeEnabled, createClaudeProvider } from '../render/providers/claude.js';
import { produceVideo } from '../render/produce.js';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : null)).filter(Boolean));
const readJson = (f, d) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return d; } };

const settings = { ...DEFAULT_SETTINGS, ...readJson('config/settings.json', {}) };
if (args.duration) settings.targetDuration = Number(args.duration);
if (args.width) { settings.width = Number(args.width); settings.height = Math.round((settings.width * 16) / 9); }
const v = validateSettings(settings);
if (!v.ok) { console.error('❌ Paramètres invalides :', v.errors.join(', ')); process.exit(2); }
const count = Math.min(Number(args.count) || settings.videosPerRun, settings.maxVideosPerRun);
const category = args.category || settings.category || 'auto';
if (category !== 'auto' && !CATEGORIES.some((c) => c.id === category)) { console.error(`❌ Catégorie inconnue : ${category}`); process.exit(2); }
const characters = readJson('data/characters.json', DEFAULT_CHARACTERS);
const profiles = readJson('data/voice-profiles.json', DEFAULT_VOICE_PROFILES);
const provider = claudeEnabled() ? await createClaudeProvider() : templateProvider;
const date = new Date().toISOString().slice(0, 10);

const results = [];
for (let n = 0; n < count; n++) {
  const ideasHistory = readJson('data/ideas-history.json', []);
  const history = readJson('data/history.json', []);
  const started = Date.now();
  console.log(`\n━━━ Vidéo ${n + 1}/${count} ━━━`);
  let sbResult = null;
  let entry;
  try {
    sbResult = await produceStoryboard({ category, settings, characters, history: ideasHistory, provider, seed: `${date}-${n}-${Date.now()}`, createdAt: new Date().toISOString() });
    for (const w of sbResult.warnings || []) console.log(`⚠️  ${w}`);
    if (!sbResult.ok) throw new Error(`storyboard invalide : ${sbResult.validation.errors.join(' ; ')}`);
    console.log(`📝 [${sbResult.category}] ${sbResult.storyboard.title}\n   Hook : ${sbResult.storyboard.hook.text}`);
    const outDir = path.join('output', `${date}-${sbResult.category}-${sbResult.storyboard.id}`);
    const prod = await produceVideo(sbResult.storyboard, { characters, profiles, outDir, voicePreference: args.voice || settings.voiceProvider, style: args.style, date, workers: args.workers ? Number(args.workers) : undefined });
    entry = { ...historyEntry(sbResult, { status: prod.status }), title: prod.title, productionTimeSec: prod.productionSeconds, duration: prod.duration, outDir, files: prod.files, qc: prod.qc, error: prod.status === 'success' ? null : `contrôle qualité : ${prod.qc.failed.join(', ')}` };
    results.push(entry);
  } catch (e) {
    console.error(`❌ Échec : ${e.message}`);
    entry = { ...(sbResult ? historyEntry(sbResult, { status: 'failed' }) : { id: `echec-${Date.now()}`, date: new Date().toISOString(), title: '(échec avant le storyboard)', category }), status: 'failed', productionTimeSec: Math.round((Date.now() - started) / 1000), error: e.message.slice(0, 500) };
    results.push(entry);
  }
  writeFileSync('data/history.json', JSON.stringify([entry, ...history].slice(0, 500), null, 2));
  if (sbResult?.storyboard) writeFileSync('data/ideas-history.json', JSON.stringify([historyEntry(sbResult, { status: entry.status }), ...ideasHistory].slice(0, 500), null, 2));
}

// Résumé de production (affiché aussi dans GitHub Actions).
const ok = results.filter((r) => r.status === 'success');
const lines = [`## 🎬 Stick Studio AI — résumé de production`, '', `${ok.length}/${results.length} vidéo(s) réussie(s).`, '', '| Statut | Catégorie | Titre | Durée | Production | Détail |', '|---|---|---|---|---|---|',
  ...results.map((r) => `| ${r.status === 'success' ? '✅' : '❌'} | ${r.category} | ${r.title} | ${r.duration ? `${r.duration} s` : '—'} | ${r.productionTimeSec ?? '—'} s | ${r.error || 'contrôle qualité réussi'} |`)];
mkdirSync('output', { recursive: true });
writeFileSync('output/summary.md', lines.join('\n') + '\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
console.log('\n' + lines.join('\n'));
process.exit(ok.length === results.length ? 0 : ok.length ? 3 : 1);
