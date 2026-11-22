// Bibliothèque de personnages originaux par défaut. Chacun a une identité graphique stable.
export const ROLES = [
  ['main', 'Personnage principal'], ['secondary', 'Secondaire'], ['narrator', 'Narrateur'],
  ['comic', 'Comique'], ['mystery', 'Mystérieux'],
];

export const HEAD_SHAPES = [['round', 'Ronde'], ['oval', 'Ovale'], ['square', 'Carrée']];

export const ACCESSORIES = [
  ['none', 'Aucun'], ['cap', 'Casquette'], ['glasses', 'Lunettes'], ['scarf', 'Écharpe'],
  ['hat', 'Chapeau'], ['bowtie', 'Nœud papillon'], ['hood', 'Capuche'], ['bow', 'Nœud dans les cheveux'],
];

export const DEFAULT_CHARACTERS = [
  { id: 'max', name: 'Max', role: 'main', voiceProfile: 'main',
    colors: { stroke: '#1b1b1f', head: '#ffffff', accent: '#ff5a36' },
    appearance: { headShape: 'round', height: 1, thickness: 10, accessory: 'cap' }, expression: 'happy' },
  { id: 'lea', name: 'Léa', role: 'secondary', voiceProfile: 'secondary_female',
    colors: { stroke: '#1b1b1f', head: '#ffffff', accent: '#2f80ed' },
    appearance: { headShape: 'oval', height: 0.96, thickness: 10, accessory: 'bow' }, expression: 'neutral' },
  { id: 'guide', name: 'Le Guide', role: 'narrator', voiceProfile: 'narrator',
    colors: { stroke: '#1b1b1f', head: '#fff6d8', accent: '#f2c94c' },
    appearance: { headShape: 'round', height: 1.04, thickness: 10, accessory: 'glasses' }, expression: 'thinking' },
  { id: 'bob', name: 'Bob', role: 'comic', voiceProfile: 'secondary_male',
    colors: { stroke: '#1b1b1f', head: '#ffffff', accent: '#27ae60' },
    appearance: { headShape: 'square', height: 0.9, thickness: 12, accessory: 'bowtie' }, expression: 'laughing' },
  { id: 'ombre', name: "L'Ombre", role: 'mystery', voiceProfile: 'secondary_male',
    colors: { stroke: '#2b2440', head: '#d9d4e8', accent: '#6c3fc4' },
    appearance: { headShape: 'oval', height: 1.08, thickness: 9, accessory: 'hood' }, expression: 'neutral' },
];

const HEX = /^#[0-9a-fA-F]{6}$/;
export function isHexColor(v) {
  return typeof v === 'string' && HEX.test(v);
}

export function validateCharacter(c) {
  const errors = [];
  if (!c.id || !/^[a-z0-9_-]+$/.test(c.id)) errors.push('identifiant invalide');
  if (!c.name || !String(c.name).trim()) errors.push('nom obligatoire');
  if (String(c.name || '').length > 30) errors.push('nom trop long (30 max)');
  for (const k of ['stroke', 'head', 'accent']) if (!isHexColor(c.colors?.[k])) errors.push(`couleur ${k} invalide`);
  const h = c.appearance?.height;
  if (!(h >= 0.8 && h <= 1.2)) errors.push('taille entre 0.8 et 1.2');
  const t = c.appearance?.thickness;
  if (!(t >= 6 && t <= 16)) errors.push('épaisseur entre 6 et 16');
  return { ok: errors.length === 0, errors };
}

export function slugify(name) {
  return String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'perso';
}
