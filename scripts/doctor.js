#!/usr/bin/env node
// Diagnostic de l'environnement : `npm run doctor`
import { diagnose } from '../render/environment.js';

const report = await diagnose();
const required = ['node', 'ffmpeg', 'ffprobe', 'resvg'];
let fatal = false;
console.log('Stick Studio AI — diagnostic\n');
for (const [name, r] of Object.entries(report)) {
  const req = required.includes(name);
  if (req && !r.ok) fatal = true;
  const mark = r.ok ? '✅' : req ? '❌' : '⚠️ ';
  console.log(`${mark} ${name.padEnd(8)} ${r.version || r.detail || ''}`);
}
if (!report.piper.ok && !report.espeak.ok) {
  console.log('\n⚠️  Aucun moteur vocal : les vidéos seront produites sans voix (signalé dans le rapport).');
}
console.log(fatal ? '\n❌ Des outils obligatoires manquent.' : '\n✅ Outils obligatoires présents.');
process.exit(fatal ? 1 : 0);
