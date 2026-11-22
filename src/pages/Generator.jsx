import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { CATEGORIES, AUTO_MIX } from '../../engine/config.js';
import { STYLES } from '../../engine/catalog.js';
import { pickAutoCategory } from '../../engine/story/ideas.js';
import { generateStoryboard } from '../state/production.js';
import { Card, Field, Select, Toggle, Button, Notice } from '../components/ui.jsx';

export default function Generator({ go }) {
  const { state, dispatch } = useStore();
  const st = state.settings;
  const allowed = CATEGORIES.filter((c) => st.allowedCategories.includes(c.id));
  const [category, setCategory] = useState(st.category);
  const [duration, setDuration] = useState(st.targetDuration);
  const [style, setStyle] = useState('classic');
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const selectedIdea = state.ideas.find((i) => i.id === state.selectedIdeaId);
  const nextAuto = CATEGORIES.find((c) => c.id === pickAutoCategory(st.allowedCategories, state.history));

  const run = async () => {
    setBusy(true);
    const r = await generateStoryboard({ state, dispatch, category, idea: auto ? null : selectedIdea, targetDuration: duration, style });
    setBusy(false);
    setResult(r);
    if (r.ok) go('storyboard');
  };

  return (
    <>
      <Card title="Paramètres de la vidéo">
        <Field label="Catégorie" hint={category === AUTO_MIX ? `Prochaine catégorie du mix : ${nextAuto?.emoji} ${nextAuto?.label}` : null}>
          <Select value={category} onChange={setCategory}
            options={[[AUTO_MIX, '🔀 Mix automatique'], ...allowed.map((c) => [c.id, `${c.emoji} ${c.label}`])]} />
        </Field>
        <Field label={`Durée maximale : ${duration} s`} hint="La durée réelle suit le texte (minimum 30 s) : aucun silence n'est ajouté pour remplir.">
          <input type="range" min={30} max={60} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </Field>
        <Field label="Style visuel">
          <Select value={style} onChange={setStyle} options={STYLES} />
        </Field>
        <Toggle checked={auto} onChange={setAuto} label={auto ? 'Mode automatique : le studio choisit l’idée' : 'Mode manuel : j’utilise l’idée sélectionnée'} />
        {!auto && (
          <Notice tone={selectedIdea ? 'info' : 'warn'}>
            {selectedIdea ? <>Idée sélectionnée : <strong>{selectedIdea.title}</strong></> : (
              <>Aucune idée sélectionnée. <button className="link" onClick={() => go('ideas')}>Choisir une idée</button></>
            )}
          </Notice>
        )}
      </Card>

      <Card title="Lancer la production">
        <Button variant="primary" disabled={busy || (!auto && !selectedIdea)} onClick={run}>🎞️ Générer le storyboard</Button>
        {result && !result.ok && (
          <Notice tone="bad">Échec : {(result.validation?.errors || []).join(' ; ')}</Notice>
        )}
        <Notice tone="info">
          Le storyboard (idée, hook, scènes, dialogues) est créé ici, dans votre navigateur. Le rendu MP4 avec voix et musique se fera sur GitHub Actions (Phases 5 à 7).
        </Notice>
      </Card>
    </>
  );
}
