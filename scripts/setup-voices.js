#!/usr/bin/env node
// Télécharge les modèles vocaux AUTORISÉS (licence vérifiée) et contrôle leur empreinte SHA-256.
// Usage : node scripts/setup-voices.js   (les fichiers vont dans assets/voices/, ignorés par Git)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main';
// Empreintes relevées le 2026-11-22 lors de la vérification des licences.
const MODELS = [
  { file: 'fr_FR-siwis-medium.onnx', url: `${BASE}/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx`, sha256: 'b1d946fd68d0347155fa59bce0a018924abbef3c1561181db45ca463d83963ef' },
  { file: 'fr_FR-siwis-medium.onnx.json', url: `${BASE}/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json`, sha256: '3b3efdbcdcae930c40d8255527170ec5c87bf05e510b67f53d75fd028df40f43' },
];
const dir = 'assets/voices';
mkdirSync(dir, { recursive: true });
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
let failed = false;
for (const m of MODELS) {
  const dest = path.join(dir, m.file);
  if (existsSync(dest) && sha(readFileSync(dest)) === m.sha256) { console.log(`✅ ${m.file} déjà présent`); continue; }
  process.stdout.write(`⬇️  ${m.file}… `);
  const res = await fetch(m.url);
  if (!res.ok) { console.log(`échec HTTP ${res.status}`); failed = true; continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  if (sha(buf) !== m.sha256) { console.log('empreinte incorrecte : fichier refusé'); failed = true; continue; }
  writeFileSync(dest, buf);
  console.log(`ok (${(buf.length / 1e6).toFixed(1)} Mo)`);
}
process.exit(failed ? 1 : 0);
