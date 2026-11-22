import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store.jsx';
import { ROLES, HEAD_SHAPES, ACCESSORIES, slugify, validateCharacter } from '../../engine/characters/library.js';
import { EXPRESSIONS, EXPRESSION_LABELS } from '../../engine/catalog.js';
import { renderCharacterSVG } from '../../engine/characters/render.js';
import { Card, Field, Select, Button, Notice } from '../components/ui.jsx';

function CharacterSVG({ character, expression, size = 120 }) {
  const svg = useMemo(
    () => renderCharacterSVG(character, { width: size, height: size * 1.5, expression }),
    [character, expression, size],
  );
  return <div className="char-svg" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function Characters() {
  const { state, dispatch } = useStore();
  const [currentId, setCurrentId] = useState(state.characters[0]?.id);
  const current = state.characters.find((c) => c.id === currentId) || state.characters[0];
  const [draft, setDraft] = useState(current);
  const [previewExpr, setPreviewExpr] = useState(current.expression);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(current);
    setPreviewExpr(current.expression);
  }, [current]);

  const set = (path, value) => {
    setSaved(false);
    setDraft((d) => {
      const n = structuredClone(d);
      const keys = path.split('.');
      let o = n;
      for (const k of keys.slice(0, -1)) o = o[k];
      o[keys.at(-1)] = value;
      return n;
    });
  };
  const validation = validateCharacter(draft);

  const create = () => {
    let id = slugify('nouveau');
    let i = 2;
    while (state.characters.some((c) => c.id === id)) id = `nouveau-${i++}`;
    const c = { ...structuredClone(state.characters[0]), id, name: 'Nouveau', role: 'secondary' };
    dispatch({ type: 'character/save', character: c });
    setCurrentId(id);
  };

  return (
    <>
      <div className="char-strip">
        {state.characters.map((c) => (
          <button key={c.id} className={`char-chip ${c.id === current.id ? 'active' : ''}`} onClick={() => setCurrentId(c.id)}>
            <CharacterSVG character={c} size={56} />
            <span>{c.name}</span>
          </button>
        ))}
        <button className="char-chip add" onClick={create}>
          <span className="plus">＋</span>
          <span>Créer</span>
        </button>
      </div>

      <Card title="Aperçu">
        <div className="preview-stage">
          <CharacterSVG character={draft} expression={previewExpr} size={160} />
        </div>
        <div className="chips">
          {EXPRESSIONS.map((e) => (
            <button key={e} className={`chip ${e === previewExpr ? 'active' : ''}`} onClick={() => setPreviewExpr(e)}>
              {EXPRESSION_LABELS[e]}
            </button>
          ))}
        </div>
        <p className="muted small">L'aperçu des animations (marche, saut…) sera ajouté en Phase 3.</p>
      </Card>

      <Card title="Identité">
        <Field label="Nom">
          <input value={draft.name} maxLength={30} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Rôle">
          <Select value={draft.role} onChange={(v) => set('role', v)} options={ROLES} />
        </Field>
        <Field label="Expression par défaut">
          <Select value={draft.expression} onChange={(v) => set('expression', v)}
            options={EXPRESSIONS.map((e) => [e, EXPRESSION_LABELS[e]])} />
        </Field>
      </Card>

      <Card title="Apparence">
        <div className="grid-3">
          {[['stroke', 'Traits'], ['head', 'Tête'], ['accent', 'Accent']].map(([k, l]) => (
            <Field key={k} label={l}>
              <input type="color" value={draft.colors[k]} onChange={(e) => set(`colors.${k}`, e.target.value)} />
            </Field>
          ))}
        </div>
        <Field label="Forme de la tête">
          <Select value={draft.appearance.headShape} onChange={(v) => set('appearance.headShape', v)} options={HEAD_SHAPES} />
        </Field>
        <Field label="Accessoire">
          <Select value={draft.appearance.accessory} onChange={(v) => set('appearance.accessory', v)} options={ACCESSORIES} />
        </Field>
        <Field label={`Taille : ${Math.round(draft.appearance.height * 100)} %`}>
          <input type="range" min={0.8} max={1.2} step={0.02} value={draft.appearance.height}
            onChange={(e) => set('appearance.height', Number(e.target.value))} />
        </Field>
        <Field label={`Épaisseur des traits : ${draft.appearance.thickness}`}>
          <input type="range" min={6} max={16} step={1} value={draft.appearance.thickness}
            onChange={(e) => set('appearance.thickness', Number(e.target.value))} />
        </Field>
      </Card>

      {!validation.ok && <Notice tone="bad">{validation.errors.join(', ')}</Notice>}
      {saved && <Notice tone="ok">Personnage enregistré.</Notice>}
      <div className="actions-row">
        <Button variant="primary" disabled={!validation.ok}
          onClick={() => { dispatch({ type: 'character/save', character: draft }); setSaved(true); }}>
          💾 Enregistrer
        </Button>
        <Button variant="danger" disabled={state.characters.length <= 1}
          onClick={() => { if (confirm(`Supprimer ${current.name} ?`)) dispatch({ type: 'character/delete', id: current.id }); }}>
          Supprimer
        </Button>
      </div>
    </>
  );
}
