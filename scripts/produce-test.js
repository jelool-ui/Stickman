#!/usr/bin/env node
// Produit une vidéo de test complète (storyboard + voix + sous-titres) : node scripts/produce-test.js [catégorie] [largeur]
import { produceStoryboard } from '../engine/story/pipeline.js';
import { DEFAULT_SETTINGS } from '../engine/config.js';
import { DEFAULT_CHARACTERS } from '../engine/characters/library.js';
import { produceVideo } from '../render/produce.js';

const category = process.argv[2] || 'comedy';
const width = Number(process.argv[3]) || 1080;
const r = await produceStoryboard({ category, settings: DEFAULT_SETTINGS, characters: DEFAULT_CHARACTERS, seed: 'test' });
if (!r.ok) { console.error('Storyboard invalide', r.validation.errors); process.exit(1); }
console.log(`📝 ${r.storyboard.title} — hook : ${r.storyboard.hook.text}`);
await produceVideo(r.storyboard, { characters: DEFAULT_CHARACTERS, outDir: `output/test-${category}`, width, height: Math.round(width * 16 / 9) });
