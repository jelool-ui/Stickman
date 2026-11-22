// Scène de test de la Phase 3 : couvre plusieurs animations, caméras, transitions, décors et objets.
export const TEST_SCENE = {
  id: 'test-phase3',
  title: 'Scène de test — moteur d’animation',
  category: 'comedy',
  scenes: [
    { scene_id: 1, duration: 3, narration: '', dialogue: [], character_ids: ['max'], background_id: 'street', animation: 'enter',
      camera: 'pan-right', props: [], sound_effects: [], subtitles: 'Max arrive en ville…', highlight: ['Max'], transition: 'fade' },
    { scene_id: 2, duration: 3, narration: '', dialogue: [{ character_id: 'max', text: 'Salut Léa, regarde ça !' }],
      character_ids: ['max', 'lea'], background_id: 'house', animation: 'wave', camera: 'static', props: ['phone'],
      sound_effects: [], subtitles: 'Salut Léa, regarde ça !', transition: 'slide-left' },
    { scene_id: 3, duration: 2.5, narration: '', dialogue: [{ character_id: 'lea', text: 'Quoi ? Une porte magique ?' }],
      character_ids: ['lea', 'max'], background_id: 'mystery', animation: 'surprise', camera: 'zoom-in', props: ['door', 'question'],
      sound_effects: [], subtitles: 'Quoi ? Une porte magique ?', highlight: ['magique'], transition: 'flash' },
    { scene_id: 4, duration: 2.5, narration: '', dialogue: [], character_ids: ['bob'], background_id: 'office', animation: 'fall',
      camera: 'shake', props: ['computer'], sound_effects: [], subtitles: 'Pendant ce temps, Bob…', transition: 'zoom' },
    { scene_id: 5, duration: 3, narration: '', dialogue: [{ character_id: 'guide', text: 'Et voilà comment tout a commencé.' }],
      character_ids: ['guide'], background_id: 'space', animation: 'think', camera: 'focus', props: ['lightbulb'],
      sound_effects: [], subtitles: 'Et voilà comment tout a commencé.', transition: 'cut' },
  ],
};
