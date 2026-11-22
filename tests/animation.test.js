import { describe, it, expect } from 'vitest';
import { CLIPS } from '../engine/animation/clips.js';
import { samplePose, actorStateAt } from '../engine/animation/engine.js';
import { cameraAt } from '../engine/animation/camera.js';
import { applyTransition, TRANSITION_DURATION } from '../engine/animation/transitions.js';
import { wrapText, renderAnimatedText, escapeXml } from '../engine/animation/text.js';
import { ANIMATIONS, CAMERAS, TRANSITIONS } from '../engine/catalog.js';
import { POSE_KEYS } from '../engine/characters/skeleton.js';

const maxDiff = (a, b) => Math.max(...POSE_KEYS.filter((k) => k !== 'squash').map((k) => Math.abs(a[k] - b[k])));

describe("moteur d'animation", () => {
  it('les 17 animations obligatoires existent', () => {
    expect(ANIMATIONS).toHaveLength(17);
    for (const a of ANIMATIONS) expect(CLIPS[a], a).toBeDefined();
  });
  it('chaque animation produit des poses valides et déterministes', () => {
    for (const a of ANIMATIONS)
      for (let t = 0; t < 3; t += 0.1) {
        const p = samplePose(a, t, 42);
        for (const k of POSE_KEYS) expect(Number.isFinite(p[k]), `${a} ${k} @${t}`).toBe(true);
        expect(samplePose(a, t, 42)).toEqual(p);
      }
  });
  it('les animations en boucle reviennent à leur pose de départ (pas de saut)', () => {
    for (const [id, c] of Object.entries(CLIPS)) if (c.loop && !c.life) expect(maxDiff(samplePose(id, 0), samplePose(id, c.period - 1e-6)), id).toBeLessThan(0.5);
  });
  it('les mouvements sont fluides (pas de saut brutal entre deux images à 30 FPS)', () => {
    for (const a of ANIMATIONS) for (let t = 0; t < 2.5; t += 1 / 30) expect(maxDiff(samplePose(a, t), samplePose(a, t + 1 / 30)), `${a} @${t.toFixed(2)}`).toBeLessThan(40);
  });
  it('un personnage au repos n’est jamais figé', () => {
    const a = samplePose('idle', 0.5), b = samplePose('idle', 1.5);
    expect(maxDiff(a, b)).toBeGreaterThan(0.5);
  });
  it('gestes synchronisés avec le dialogue : parler au repos déclenche « talk » et la bouche bouge', () => {
    const actor = { character_id: 'max', x: 0, track: [{ animation: 'idle', start: 0, duration: 4 }], speaking: [{ start: 1, end: 2 }] };
    expect(actorStateAt(actor, 0.5)).toMatchObject({ animation: 'idle', mouthOpen: 0 });
    const s = actorStateAt(actor, 1.5);
    expect(s.animation).toBe('talk');
    expect(s.mouthOpen).toBeGreaterThan(0);
  });
  it('enchaîne deux clips sans saut grâce au fondu de pose', () => {
    const actor = { character_id: 'max', x: 0, track: [{ animation: 'wave', start: 0, duration: 1 }, { animation: 'sit', start: 1, duration: 2 }] };
    expect(maxDiff(actorStateAt(actor, 0.999).pose, actorStateAt(actor, 1.0).pose)).toBeLessThan(5);
  });
  it('marche, entrée, sortie et demi-tour déplacent ou retournent le personnage', () => {
    const walk = { character_id: 'a', x: 0, facing: 1, track: [{ animation: 'walk', start: 0, duration: 2 }] };
    expect(actorStateAt(walk, 2).x).toBeCloseTo(150, 0);
    const enter = { character_id: 'a', x: 0, facing: 1, track: [{ animation: 'enter', start: 0, duration: 1, travel: 500 }] };
    expect(actorStateAt(enter, 0).x).toBeCloseTo(-500, 0);
    expect(actorStateAt(enter, 0.999).x).toBeGreaterThan(-5);
    const turn = { character_id: 'a', x: 0, facing: 1, track: [{ animation: 'turn', start: 0, duration: 0.5 }, { animation: 'idle', start: 0.5, duration: 1 }] };
    expect(actorStateAt(turn, 0).facing).toBeCloseTo(1);
    expect(actorStateAt(turn, 1).facing).toBeCloseTo(-1);
  });
  it('les yeux clignent de temps en temps', () => {
    const blinks = Array.from({ length: 300 }, (_, i) => actorStateAt({ character_id: 'max', x: 0 }, i / 30).blink);
    expect(blinks.some((b) => b > 0.5)).toBe(true);
    expect(blinks.filter((b) => b > 0).length).toBeLessThan(40);
  });
});

describe('caméra, transitions et texte', () => {
  it("la caméra ne laisse jamais apparaître de bord noir", () => {
    const w = 1080, h = 1920;
    for (const c of CAMERAS) for (let p = 0; p <= 1; p += 0.02) {
      const cam = cameraAt(c, p, p * 4, { focusX: 300, focusY: -400 });
      expect(Math.abs(cam.x), c).toBeLessThanOrEqual(((cam.zoom - 1) * w) / 2 + 1e-6);
      expect(Math.abs(cam.y), c).toBeLessThanOrEqual(((cam.zoom - 1) * h) / 2 + 1e-6);
    }
  });
  it('chaque transition combine les deux scènes', () => {
    for (const tr of TRANSITIONS) {
      expect(TRANSITION_DURATION[tr], tr).toBeDefined();
      const out = applyTransition(tr, '<g id="A"/>', '<g id="B"/>', tr === 'flash' ? 0.7 : 0.5, 100, 200);
      expect(out).toContain('id="B"');
      if (!['cut', 'flash'].includes(tr)) expect(out).toContain('id="A"');
    }
  });
  it('coupe le texte en lignes et respecte la ponctuation française', () => {
    expect(wrapText('Salut Léa, regarde ça !', 18)).toEqual(['Salut Léa, regarde', 'ça !']);
    expect(wrapText('Il pense : voilà', 40)).toEqual(['Il pense : voilà']);
  });
  it('échappe le texte et met des mots en évidence', () => {
    expect(escapeXml('<a & "b">')).toBe('&lt;a &amp; &quot;b&quot;&gt;');
    const svg = renderAnimatedText('Une porte magique', { x: 0, y: 0, highlight: ['magique'], accent: '#ff0' });
    expect(svg).toContain('<tspan fill="#ff0">magique</tspan>');
    expect(renderAnimatedText('<script>', { x: 0, y: 0 })).not.toContain('<script>');
  });
});
