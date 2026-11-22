// État global de l'interface. Fonctions pures : testables sans navigateur.
import { DEFAULT_SETTINGS, validateSettings } from '../../engine/config.js';
import { DEFAULT_CHARACTERS, validateCharacter } from '../../engine/characters/library.js';
import { DEFAULT_VOICE_PROFILES } from '../../engine/voices.js';
import { DEMO_STORYBOARD } from '../../engine/samples/demo-storyboard.js';

export const STATE_VERSION = 1;

export function initialState() {
  return {
    version: STATE_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    characters: structuredClone(DEFAULT_CHARACTERS),
    voiceProfiles: structuredClone(DEFAULT_VOICE_PROFILES),
    ideas: [],
    selectedIdeaId: null,
    storyboard: structuredClone(DEMO_STORYBOARD),
    history: [],
    lastError: null,
  };
}

/** Fusionne un état sauvegardé avec les valeurs par défaut (tolère un état ancien ou corrompu). */
export function hydrate(saved) {
  const base = initialState();
  if (!saved || typeof saved !== 'object' || saved.version !== STATE_VERSION) return base;
  const merged = { ...base, ...saved, settings: { ...base.settings, ...(saved.settings || {}) } };
  if (!validateSettings(merged.settings).ok) merged.settings = base.settings;
  if (!Array.isArray(merged.characters) || !merged.characters.every((c) => validateCharacter(c).ok))
    merged.characters = base.characters;
  for (const k of ['ideas', 'history', 'voiceProfiles']) if (!Array.isArray(merged[k])) merged[k] = base[k];
  return merged;
}

export function reducer(state, action) {
  switch (action.type) {
    case 'settings/save': {
      const v = validateSettings(action.settings);
      if (!v.ok) return { ...state, lastError: v.errors.join(', ') };
      return { ...state, settings: { ...action.settings }, lastError: null };
    }
    case 'settings/reset':
      return { ...state, settings: { ...DEFAULT_SETTINGS }, lastError: null };

    case 'character/save': {
      const v = validateCharacter(action.character);
      if (!v.ok) return { ...state, lastError: v.errors.join(', ') };
      const exists = state.characters.some((c) => c.id === action.character.id);
      const characters = exists
        ? state.characters.map((c) => (c.id === action.character.id ? action.character : c))
        : [...state.characters, action.character];
      return { ...state, characters, lastError: null };
    }
    case 'character/delete':
      if (state.characters.length <= 1) return { ...state, lastError: 'Il faut garder au moins un personnage' };
      return { ...state, characters: state.characters.filter((c) => c.id !== action.id), lastError: null };

    case 'voice/save':
      return {
        ...state,
        voiceProfiles: state.voiceProfiles.map((p) => (p.id === action.profile.id ? { ...action.profile } : p)),
      };

    case 'ideas/set':
      return { ...state, ideas: action.ideas, selectedIdeaId: null };
    case 'ideas/select':
      return { ...state, selectedIdeaId: action.id };

    case 'storyboard/set':
      return { ...state, storyboard: action.storyboard };
    case 'production/storyboard':
      // Un storyboard généré est enregistré dans l'historique (sert aussi à éviter les doublons).
      return { ...state, storyboard: action.storyboard, history: [action.entry, ...state.history].slice(0, 500) };
    case 'storyboard/updateScene': {
      if (!state.storyboard) return state;
      const scenes = state.storyboard.scenes.map((s) =>
        s.scene_id === action.scene_id ? { ...s, ...action.patch } : s,
      );
      return { ...state, storyboard: { ...state.storyboard, scenes } };
    }

    case 'history/add':
      return { ...state, history: [action.entry, ...state.history].slice(0, 500) };
    case 'history/merge': {
      const ids = new Set(state.history.map((h) => h.id));
      return { ...state, history: [...state.history, ...action.entries.filter((e) => !ids.has(e.id))] };
    }
    case 'error/clear':
      return { ...state, lastError: null };
    default:
      return state;
  }
}
