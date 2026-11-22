import { describe, it, expect } from 'vitest';
import { listBackgrounds } from '../engine/scenes/backgrounds.js';
import { listProps } from '../engine/scenes/props.js';
import { PALETTES } from '../engine/scenes/palettes.js';
import { renderFrame, computeTimeline } from '../engine/scenes/compose.js';
import { DEFAULT_CHARACTERS } from '../engine/characters/library.js';
import { TEST_SCENE } from '../engine/samples/test-scene.js';
import { BACKGROUNDS } from '../engine/catalog.js';
import { svgToPixels } from '../render/frames.js';

describe('décors, objets et composition', () => {
  it('les 11 décors du catalogue existent', () => {
    const ids = listBackgrounds().map(([id]) => id);
    for (const [id] of BACKGROUNDS) expect(ids).toContain(id);
  });
  it('chaque décor × style × objet se rend sans erreur', () => {
    const props = listProps().map(([id]) => id);
    expect(props.length).toBeGreaterThanOrEqual(8);
    for (const [bg] of listBackgrounds())
      for (const style of Object.keys(PALETTES)) {
        const sb = { scenes: [{ scene_id: 1, duration: 2, background_id: bg, character_ids: ['max', 'lea'], animation: 'talk', camera: 'static', props: [props[bg.length % props.length]], subtitles: 'Test é à ç', transition: 'cut' }] };
        const { pixels } = svgToPixels(renderFrame(sb, DEFAULT_CHARACTERS, 1, { width: 216, height: 384, style }), 216);
        expect(pixels.length).toBe(216 * 384 * 4);
      }
  });
  it('le rendu est déterministe', () => {
    expect(renderFrame(TEST_SCENE, DEFAULT_CHARACTERS, 5.3)).toBe(renderFrame(TEST_SCENE, DEFAULT_CHARACTERS, 5.3));
  });
  it("aucune scène n'est figée : l'image change en permanence", () => {
    const { scenes } = computeTimeline(TEST_SCENE);
    for (const s of scenes)
      for (let t = s.start + 0.5; t < s.end - 0.3; t += 0.5)
        expect(renderFrame(TEST_SCENE, DEFAULT_CHARACTERS, t)).not.toBe(renderFrame(TEST_SCENE, DEFAULT_CHARACTERS, t + 1 / 30));
  });
  it('les transitions affichent un seul sous-titre à la fois', () => {
    const svg = renderFrame(TEST_SCENE, DEFAULT_CHARACTERS, 3.1); // milieu du fondu entre scène 1 et 2
    expect(svg.match(/arrive en ville/g)).toBeNull();
    expect(svg).toContain('regarde');
  });
});
