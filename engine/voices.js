// Modèles vocaux et profils de voix.
// Un modèle n'est utilisé que si sa licence a été vérifiée et autorise l'usage prévu (vidéos YouTube, y compris monétisées).
// Détails et sources : assets/voices/VOICES.md

export const VOICE_PROVIDERS = [
  ['auto', 'Automatique (Piper → externe → eSpeak NG → sans voix)'],
  ['piper', 'Piper TTS (local, gratuit)'],
  ['espeak', 'eSpeak NG (secours, voix robotique)'],
  ['none', 'Sans voix (sous-titres seulement)'],
];

export const VOICE_MODELS = {
  'fr_FR-siwis-medium': {
    provider: 'piper', language: 'fr_FR', approved: true,
    files: ['fr_FR-siwis-medium.onnx', 'fr_FR-siwis-medium.onnx.json'],
    url: 'https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium',
    dataset: 'SIWIS French Speech Synthesis Database', datasetLicense: 'CC BY 4.0',
    base: 'Hi-Fi TTS (lecteur 92), CC BY 4.0', credit: 'Voix : Piper fr_FR-siwis-medium (base SIWIS, CC BY 4.0)',
    quality: "3 % d'erreurs en transcription automatique sur 12 répliques de test",
  },
  'fr_FR-mls-medium': {
    provider: 'piper', language: 'fr_FR', approved: false,
    reason: "Licence compatible (CC BY 4.0) mais qualité insuffisante : 66 à 122 % d'erreurs en transcription automatique, phrases courtes incompréhensibles.",
  },
  'fr_FR-gilles-low': { provider: 'piper', approved: false, reason: 'Affiné depuis la voix anglaise « ryan » (données CC BY-NC-SA 4.0, usage non commercial).' },
  'fr_FR-mls_1840-low': { provider: 'piper', approved: false, reason: 'Affiné depuis la voix anglaise « ryan » (données CC BY-NC-SA 4.0, usage non commercial).' },
  'fr_FR-upmc-medium': { provider: 'piper', approved: false, reason: 'Affiné depuis « lessac » (licence Blizzard 2013 restrictive), données CC BY-SA 4.0.' },
  'fr_FR-tom-medium': { provider: 'piper', approved: false, reason: 'Licence AGPLv3 : statut incertain pour un audio diffusé.' },
  'espeak-ng-fr': {
    provider: 'espeak', language: 'fr', approved: true,
    url: 'https://github.com/espeak-ng/espeak-ng', datasetLicense: 'Logiciel GPL-3.0 ; voix de synthèse par règles (aucune donnée enregistrée)',
    credit: null, quality: "Voix robotique : 50 % d'erreurs en transcription automatique. Secours uniquement.",
  },
};

export const APPROVED_PIPER_MODELS = Object.entries(VOICE_MODELS).filter(([, m]) => m.provider === 'piper' && m.approved).map(([id]) => id);

// Les personnages se distinguent par la hauteur (pitch) et le débit de la même voix de base, de bonne qualité.
export const DEFAULT_VOICE_PROFILES = [
  { id: 'narrator', label: 'Narrateur', model: 'fr_FR-siwis-medium', pitch: 0.92, speed: 1.0, volume: 1.0, espeakVoice: 'fr', espeakPitch: 45 },
  { id: 'main', label: 'Personnage principal', model: 'fr_FR-siwis-medium', pitch: 0.8, speed: 1.05, volume: 1.0, espeakVoice: 'fr', espeakPitch: 35 },
  { id: 'secondary_male', label: 'Secondaire masculin', model: 'fr_FR-siwis-medium', pitch: 0.72, speed: 0.98, volume: 1.0, espeakVoice: 'fr', espeakPitch: 25 },
  { id: 'secondary_female', label: 'Secondaire féminin', model: 'fr_FR-siwis-medium', pitch: 1.08, speed: 1.02, volume: 1.0, espeakVoice: 'fr+f3', espeakPitch: 60 },
];

export function validateVoiceProfile(p) {
  const errors = [];
  if (!(p.pitch >= 0.6 && p.pitch <= 1.4)) errors.push('hauteur entre 0,6 et 1,4');
  if (!(p.speed >= 0.7 && p.speed <= 1.4)) errors.push('vitesse entre 0,7 et 1,4');
  if (!(p.volume >= 0.2 && p.volume <= 1.5)) errors.push('volume entre 0,2 et 1,5');
  if (p.model && VOICE_MODELS[p.model] && !VOICE_MODELS[p.model].approved) errors.push(`modèle non autorisé : ${p.model}`);
  return { ok: errors.length === 0, errors };
}
