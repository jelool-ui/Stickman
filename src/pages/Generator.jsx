import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { CATEGORIES, AUTO_MIX } from '../../engine/config.js';
import { STYLES } from '../../engine/catalog.js';
import { Card, Field, Select, Toggle, Button, Notice } from '../components/ui.jsx';

export default function Generator({ go }) {
  const { state } = useStore();
  const st = state.settings;
  const allowed = CATEGORIES.filter((c) => st.allowedCategories.includes(c.id));
  const [category, setCategory] = useState(st.category);
  const [duration, setDuration] = useState(st.targetDuration);
  const [style, setStyle] = useState('classic');
  const [auto, setAuto] = useState(true);
  const selectedIdea = state.ideas.find((i) => i.id === state.selectedIdeaId);

  const request = { category, duration, style, mode: auto ? 'auto' : 'manuel', idea: selectedIdea?.title ?? null };

  return (
    <>
      <Card title="Paramètres de la vidéo">
        <Field label="Catégorie">
          <Select
            value={category}
            onChange={setCategory}
            options={[[AUTO_MIX, '🔀 Mix automatique'], ...allowed.map((c) => [c.id, `${c.emoji} ${c.label}`])]}
          />
        </Field>
        <Field label={`Durée cible : ${duration} s`} hint="Entre 30 et 60 secondes (YouTube Shorts)">
          <input type="range" min={st.minDuration} max={st.maxDuration} step={5} value={duration}
            onChange={(e) => setDuration(Number(e.target.value))} />
        </Field>
        <Field label="Style visuel">
          <Select value={style} onChange={setStyle} options={STYLES} />
        </Field>
        <Toggle checked={auto} onChange={setAuto}
          label={auto ? 'Mode automatique : le studio choisit l’idée' : 'Mode manuel : j’utilise l’idée sélectionnée'} />
        {!auto && (
          <Notice tone={selectedIdea ? 'info' : 'warn'}>
            {selectedIdea ? <>Idée sélectionnée : <strong>{selectedIdea.title}</strong></> : (
              <>Aucune idée sélectionnée. <button className="link" onClick={() => go('ideas')}>Choisir une idée</button></>
            )}
          </Notice>
        )}
      </Card>

      <Card title="Lancer la production">
        <pre className="code">{JSON.stringify(request, null, 2)}</pre>
        <Button variant="primary" disabled title="Disponible après la Phase 4">🎬 Générer la vidéo</Button>
        <Notice tone="warn">
          Le moteur de scénarios arrive en Phase 4 et le rendu vidéo en Phase 6. Ce bouton sera activé à ce moment-là.
        </Notice>
      </Card>
    </>
  );
}
