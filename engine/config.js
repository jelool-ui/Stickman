// Configuration par défaut partagée entre l'interface (navigateur) et le moteur de rendu (Node).
// Aucun secret ne doit jamais être placé ici.

export const CATEGORIES = [
  { id: 'explainer', label: 'Stick Explainer', emoji: '💡' },
  { id: 'comedy', label: 'Stick Comedy', emoji: '😂' },
  { id: 'mysteres', label: 'Stick Mystères', emoji: '🕵️' },
  { id: 'etsi', label: 'Et si… ?', emoji: '🌀' },
  { id: 'facts', label: 'Stick Facts', emoji: '📚' },
  { id: 'motivation', label: 'Stick Motivation', emoji: '🔥' },
];

export const AUTO_MIX = 'auto';

export const DEFAULT_SETTINGS = {
  language: 'fr',
  format: 'vertical',
  width: 1080,
  height: 1920,
  fps: 30,
  minDuration: 30,
  maxDuration: 60,
  targetDuration: 40,
  videoCodec: 'libx264',
  audioCodec: 'aac',
  voiceProvider: 'auto', // auto = Piper > fournisseur externe facultatif > eSpeak NG > silence signalé
  videosPerRun: 1,
  maxVideosPerRun: 3, // garde-fou : jamais de génération infinie
  schedule: 'manual',
  allowedCategories: CATEGORIES.map((c) => c.id),
  category: AUTO_MIX,
};

export function validateSettings(s) {
  const errors = [];
  if (!Number.isInteger(s.width) || s.width <= 0) errors.push('width invalide');
  if (!Number.isInteger(s.height) || s.height <= 0) errors.push('height invalide');
  if (![24, 25, 30, 60].includes(s.fps)) errors.push('fps doit valoir 24, 25, 30 ou 60');
  if (s.minDuration > s.maxDuration) errors.push('minDuration > maxDuration');
  if (s.targetDuration < s.minDuration || s.targetDuration > s.maxDuration)
    errors.push('targetDuration hors limites');
  if (s.videosPerRun < 1 || s.videosPerRun > s.maxVideosPerRun)
    errors.push(`videosPerRun doit être entre 1 et ${s.maxVideosPerRun}`);
  const known = new Set(CATEGORIES.map((c) => c.id));
  if (!s.allowedCategories?.length) errors.push('au moins une catégorie autorisée');
  for (const c of s.allowedCategories || []) if (!known.has(c)) errors.push(`catégorie inconnue: ${c}`);
  return { ok: errors.length === 0, errors };
}
