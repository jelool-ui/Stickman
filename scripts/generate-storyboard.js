#!/usr/bin/env node
// Génère un storyboard validé : node scripts/generate-storyboard.js [--category auto|comedy|…] [--duration 45] [--record]
// Fournisseur : modèles intégrés (gratuit). Avec STICK_TEXT_PROVIDER=claude + ANTHROPIC_API_KEY : API Claude (payante, facultative).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { produceStoryboard, historyEntry } from '../engine/story/pipeline.js';
import { DEFAULT_SETTINGS } from '../engine/config.js';
import { DEFAULT_CHARACTERS } from '../engine/characters/library.js';
import { templateProvider } from '../engine/story/providers/template.js';
import { claudeEnabled, createClaudeProvider } from '../render/providers/claude.js';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : null).filter(Boolean));
const readJson = (f, d) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return d; } };

const settings = { ...DEFAULT_SETTINGS, ...readJson('config/settings.json', {}) };
if (args.duration) settings.targetDuration = Number(args.duration);
const characters = readJson('data/characters.json', DEFAULT_CHARACTERS);
const historyFile = 'data/ideas-history.json';
const history = readJson(historyFile, []);
const provider = claudeEnabled() ? await createClaudeProvider() : templateProvider;

const result = await produceStoryboard({
  category: args.category || settings.category || 'auto', settings, characters, history, provider,
  seed: args.seed || new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString(),
});
for (const w of result.warnings || []) console.log(`⚠️  ${w}`);
const out = args.out || path.join('output', result.storyboard?.id || 'echec');
mkdirSync(out, { recursive: true });
if (result.storyboard) writeFileSync(path.join(out, 'storyboard.json'), JSON.stringify(result.storyboard, null, 2));
writeFileSync(path.join(out, 'validation.json'), JSON.stringify({ ok: result.ok, provider: result.provider, attempts: result.attempts, ...result.validation, hooks: result.hooks?.proposals, failures: result.failures }, null, 2));
if (args.record) {
  const entry = historyEntry(result, { status: result.ok ? 'storyboard' : 'failed' });
  writeFileSync(historyFile, JSON.stringify([entry, ...history].slice(0, 500), null, 2));
}
const sb = result.storyboard;
console.log(`${result.ok ? '✅' : '❌'} [${result.category}] ${sb?.title} — ${sb?.scenes.length} scènes, ${sb?.duration}s, ${sb?.word_count} mots (fournisseur : ${result.provider}, essais : ${result.attempts})`);
console.log(`   Hook : ${sb?.hook.text}`);
for (const e of result.validation.errors) console.log(`   ❌ ${e}`);
for (const w of result.validation.warnings) console.log(`   ⚠️  ${w}`);
console.log(`   → ${out}/storyboard.json`);
process.exit(result.ok ? 0 : 1);
