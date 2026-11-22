// Préparation du texte pour la synthèse vocale française (aucune modification du sens).
export function prepareSpeechText(text) {
  let s = String(text || '');
  s = s.replace(/[«»“”"]/g, '').replace(/[‘’]/g, "'");
  s = s.replace(/\bPOV\b\s*:?/g, 'Point de vue :');
  s = s.replace(/(\d+)\s*h\s*(\d{2})\b/g, (m, h, mn) => `${h} heures ${mn === '00' ? '' : mn}`.trim());
  s = s.replace(/(\d+)\s*h\b/g, '$1 heures');
  s = s.replace(/\s*…\s*/g, '… ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
