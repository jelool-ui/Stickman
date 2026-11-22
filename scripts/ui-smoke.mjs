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

  // Personnages : l'aperçu animé bouge réellement
  await page.goto(`${base}#characters`);
  await page.click('.chip:has-text("Courir")');
  const a = await page.innerHTML('.preview-stage');
  await page.waitForTimeout(250);
  if (a === (await page.innerHTML('.preview-stage'))) failures.push("aperçu animé du personnage figé");

  // Storyboard : le lecteur avance
  await page.goto(`${base}#storyboard`);
  await page.click('.player-controls button');
  await page.waitForTimeout(800);
  const pos = Number(await page.inputValue('.player-controls input'));
  if (!(pos > 0.3)) failures.push(`lecteur du storyboard bloqué (${pos})`);
  if (shotsDir) await page.screenshot({ path: `${shotsDir}/storyboard-player.png` });

  // Idées : générer 20 idées, en choisir une, voir 3 hooks, créer le storyboard
  await page.goto(`${base}#ideas`);
  await page.click('button:has-text("Générer 20 idées")');
  const n = await page.locator('.list li').count();
  if (n !== 20) failures.push(`idées générées : ${n} au lieu de 20`);
  await page.locator('.list li').nth(2).click();
  const hooks = await page.locator('.hook').count();
  if (hooks !== 3) failures.push(`hooks proposés : ${hooks} au lieu de 3`);
  if (shotsDir) await page.screenshot({ path: `${shotsDir}/ideas-hooks.png`, fullPage: true });
  const ovIdeas = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ovIdeas > 0) failures.push(`idées : défilement horizontal de ${ovIdeas}px`);
  await page.click('button:has-text("Créer le storyboard")');
  await page.waitForFunction(() => location.hash === '#storyboard', null, { timeout: 4000 }).catch(() => failures.push('pas de navigation vers le storyboard'));
  await page.waitForFunction(() => document.querySelector('.content').textContent.includes('Storyboard valide'), null, { timeout: 4000 })
    .catch(() => failures.push('storyboard issu d’une idée non valide'));

  // Générateur : mode automatique
  await page.goto(`${base}#generator`);
  await page.click('button:has-text("Générer le storyboard")');
  await page.waitForFunction(() => location.hash === '#storyboard', null, { timeout: 4000 }).catch(() => failures.push('génération automatique sans résultat'));
  await page.waitForFunction(() => document.querySelector('.content').textContent.includes('Les 3 hooks proposés'), null, { timeout: 4000 }).catch(() => {});
  const txt = await page.textContent('.content');
  if (!txt.includes('Storyboard valide')) failures.push('storyboard automatique non valide');
  if (!txt.includes('Les 3 hooks proposés')) failures.push('hooks absents du storyboard');
  if (shotsDir) await page.screenshot({ path: `${shotsDir}/storyboard-generated.png`, fullPage: true });

  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ov > 0) failures.push(`storyboard généré : défilement horizontal de ${ov}px`);

  // Historique : les storyboards sont enregistrés
  await page.goto(`${base}#history`);
  const items = await page.locator('.list li').count();
  if (items < 2) failures.push(`historique : ${items} entrée(s)`);
} finally {
  await browser.close();
  server.kill();
}

if (failures.length) {
  console.error('❌ Test interface :\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log(`✅ Test interface : ${Object.keys(pages).length} pages + 10 interactions OK (largeur 384 px)`);
