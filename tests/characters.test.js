import { describe, it, expect } from 'vitest';
import { Resvg } from '@resvg/resvg-js';
import { DEFAULT_CHARACTERS, validateCharacter, slugify } from '../engine/characters/library.js';
import { renderCharacterSVG } from '../engine/characters/render.js';
import { EXPRESSIONS } from '../engine/catalog.js';

describe('personnages', () => {
  it('les personnages par défaut sont valides et couvrent les 5 rôles', () => {
    for (const c of DEFAULT_CHARACTERS) expect(validateCharacter(c).errors).toEqual([]);
    expect(new Set(DEFAULT_CHARACTERS.map((c) => c.role))).toEqual(
      new Set(['main', 'secondary', 'narrator', 'comic', 'mystery']),
    );
  });
  it('chaque personnage et chaque expression produit un SVG valide rendu par resvg', () => {
    for (const c of DEFAULT_CHARACTERS)
      for (const e of EXPRESSIONS) {
        const svg = renderCharacterSVG(c, { expression: e });
        const png = new Resvg(svg).render();
        expect(png.width).toBe(200);
      }
  });
  it("une couleur malveillante n'est jamais injectée dans le SVG", () => {
    const c = { ...DEFAULT_CHARACTERS[0], colors: { stroke: '"/><script>alert(1)</script>', head: '#fff', accent: 'x' } };
    const svg = renderCharacterSVG(c);
    expect(svg).not.toMatch(/script/);
  });
  it('crée des identifiants propres', () => {
    expect(slugify("L'Écharpe Rouge !")).toBe('l-echarpe-rouge');
  });
});
