// Storyboard d'EXEMPLE pour tester l'éditeur avant que le générateur (Phase 4) existe.
// Il ne s'agit pas d'une production réelle.
export const DEMO_STORYBOARD = {
  id: 'demo-exemple',
  isExample: true,
  title: 'Exemple — Max et la porte qui ne voulait pas s’ouvrir',
  category: 'comedy',
  scenes: [
    { scene_id: 1, duration: 3.5, narration: 'Max est en retard. Très en retard.', dialogue: [], character_ids: ['max'],
      background_id: 'house', animation: 'run', camera: 'pan-right', props: ['door'], sound_effects: ['whoosh'],
      subtitles: 'Max est en retard. Très en retard.', transition: 'cut' },
    { scene_id: 2, duration: 4, narration: '', dialogue: [{ character_id: 'max', text: 'Allez, ouvre-toi !' }],
      character_ids: ['max'], background_id: 'house', animation: 'angry', camera: 'zoom-in', props: ['door'],
      sound_effects: ['knock'], subtitles: 'Allez, ouvre-toi !', transition: 'cut' },
    { scene_id: 3, duration: 4, narration: 'Il pousse. Il tire. Rien ne bouge.', dialogue: [], character_ids: ['max'],
      background_id: 'house', animation: 'think', camera: 'static', props: ['door'], sound_effects: [],
      subtitles: 'Il pousse. Il tire. Rien ne bouge.', transition: 'fade' },
    { scene_id: 4, duration: 4, narration: '', dialogue: [{ character_id: 'lea', text: 'Max… c’est écrit « coulissante ».' }],
      character_ids: ['max', 'lea'], background_id: 'house', animation: 'point', camera: 'focus', props: ['door'],
      sound_effects: ['pop'], subtitles: 'Max… c’est écrit « coulissante ».', transition: 'cut' },
  ],
};
