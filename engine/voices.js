// Profils vocaux par défaut. Les modèles Piper et leurs licences seront vérifiés en Phase 5 :
// tant qu'un modèle n'est pas vérifié, il est marqué licenseVerified: false et n'est pas utilisé automatiquement.
export const VOICE_PROVIDERS = [
  ['auto', 'Automatique (Piper → externe → eSpeak NG)'],
  ['piper', 'Piper TTS (local, gratuit)'],
  ['espeak', 'eSpeak NG (secours, voix robotique)'],
  ['none', 'Sans voix (sous-titres seulement)'],
];

export const PIPER_CANDIDATE_MODELS = [
  { id: 'fr_FR-tom-medium', gender: 'masculin', licenseVerified: false },
  { id: 'fr_FR-siwis-medium', gender: 'féminin', licenseVerified: false },
  { id: 'fr_FR-upmc-medium', gender: 'masculin/féminin', licenseVerified: false },
  { id: 'fr_FR-gilles-low', gender: 'masculin', licenseVerified: false },
];

export const DEFAULT_VOICE_PROFILES = [
  { id: 'narrator', label: 'Narrateur', piperModel: 'fr_FR-tom-medium', speed: 1.0, volume: 1.0, pitch: 1.0 },
  { id: 'main', label: 'Personnage principal', piperModel: 'fr_FR-upmc-medium', speed: 1.05, volume: 1.0, pitch: 1.1 },
  { id: 'secondary_male', label: 'Secondaire masculin', piperModel: 'fr_FR-gilles-low', speed: 1.0, volume: 1.0, pitch: 0.9 },
  { id: 'secondary_female', label: 'Secondaire féminin', piperModel: 'fr_FR-siwis-medium', speed: 1.0, volume: 1.0, pitch: 1.2 },
];
