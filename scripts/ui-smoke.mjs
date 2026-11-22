#!/usr/bin/env node
// Test de l'interface dans un vrai navigateur, à la largeur d'un smartphone.
// Démarre `vite preview` sur le build, visite chaque page, vérifie : aucune erreur JS, pas de défilement horizontal,
// titres corrects, et quelques interactions (paramètres, personnage, storyboard).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const shotsDir = process.argv[2];
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' });
const base = 'http://localhost:4173/';
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(base)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 250));
}

const pages = {
  dashboard: 'Tableau de bord', generator: 'Générateur de vidéos', ideas: "Générateur d'idées", storyboard: 'Storyboard',
  characters: 'Personnages', voices: 'Voix', history: 'Historique', settings: 'Paramètres',
};
const failures = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 384, height: 832 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => failures.push(`erreur JS : ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && failures.push(`console : ${m.text()}`));

  for (const [id, title] of Object.entries(pages)) {
    await page.goto(`${base}#${id}`);
    await page.waitForSelector('h1');
    const h1 = await page.textContent('h1');
    if (!h1.includes(title)) failures.push(`${id} : titre « ${h1} »`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 0) failures.push(`${id} : défilement horizontal de ${overflow}px`);
    if (shotsDir) await page.screenshot({ path: `${shotsDir}/${id}.png`, fullPage: true });
  }

  // Menu « Plus »
  await page.goto(`${base}#dashboard`);
  await page.click('.tabbar button:last-child');
  await page.click('.sheet button:has-text("Voix")');
  await page.waitForFunction(() => document.querySelector('h1')?.textContent.includes('Voix'), null, { timeout: 3000 })
    .catch(() => failures.push('menu Plus : navigation vers Voix'));

  // Paramètres : enregistrement persistant
  await page.goto(`${base}#settings`);
  await page.locator('input[type=range]').first().fill('50');
  await page.click('button:has-text("Enregistrer")');
  await page.reload();
  await page.waitForSelector('h1');
  if (!(await page.textContent('.content')).includes('Durée cible : 50 s')) failures.push('paramètres non persistés');

  // Personnage : renommer + enregistrer
  await page.goto(`${base}#characters`);
  await page.fill('input[maxlength="30"]', 'Maxou');
  await page.click('button:has-text("Enregistrer")');
  await page.waitForFunction(() => document.querySelector('.char-strip').textContent.includes('Maxou'), null, { timeout: 3000 })
    .catch(() => failures.push('renommage personnage'));

  // Storyboard : modifier une durée
  await page.goto(`${base}#storyboard`);
  await page.locator('input[type=number]').first().fill('5');
  // 3.5 + 4 + 4 + 4 = 15.5 s ; la première scène passe à 5 s → 5 + 4 + 4 + 4 = 17.0 s
  await page.waitForFunction(() => document.querySelector('.content').textContent.includes('17.0 s'), null, { timeout: 3000 })
    .catch(() => failures.push('durée totale du storyboard non recalculée'));
} finally {
  await browser.close();
  server.kill();
}

if (failures.length) {
  console.error('❌ Test interface :\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log(`✅ Test interface : ${Object.keys(pages).length} pages + 4 interactions OK (largeur 384 px)`);
