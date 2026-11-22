import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { CATEGORIES, DEFAULT_SETTINGS, validateSettings } from '../../engine/config.js';
import { RESOLUTIONS, SCHEDULES } from '../../engine/catalog.js';
import { VOICE_PROVIDERS } from '../../engine/voices.js';
import { Card, Field, Select, Button, Notice, Toggle } from '../components/ui.jsx';

export default function Settings() {
  const { state, dispatch } = useStore();
  const [d, setD] = useState(state.settings);
  const [flash, setFlash] = useState(null);
  const set = (k, v) => { setFlash(null); setD((x) => ({ ...x, [k]: v })); };
  const v = validateSettings(d);
  const resId = `${d.width}x${d.height}`;

  const toggleCat = (id) =>
    set('allowedCategories', d.allowedCategories.includes(id)
      ? d.allowedCategories.filter((c) => c !== id)
      : [...d.allowedCategories, id]);

  const exportJson = async () => {
    const text = JSON.stringify(d, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setFlash('Paramètres copiés. Collez-les dans Claude Code pour les enregistrer dans le dépôt.');
    } catch {
      setFlash('Copie impossible : sélectionnez le texte ci-dessous manuellement.');
    }
  };

  return (
    <>
      <Card title="Vidéo">
        <Field label={`Durée cible : ${d.targetDuration} s`}>
          <input type="range" min={30} max={60} step={5} value={d.targetDuration} onChange={(e) => set('targetDuration', Number(e.target.value))} />
        </Field>
        <Field label="Résolution">
          <Select value={resId} onChange={(id) => { const r = RESOLUTIONS.find((x) => x.id === id); setFlash(null); setD((x) => ({ ...x, width: r.width, height: r.height })); }}
            options={RESOLUTIONS.map((r) => [r.id, r.label])} />
        </Field>
        <Field label="Images par seconde">
          <Select value={String(d.fps)} onChange={(x) => set('fps', Number(x))} options={[['24', '24 FPS'], ['30', '30 FPS (recommandé)'], ['60', '60 FPS (rendu 2× plus long)']]} />
        </Field>
      </Card>

      <Card title="Contenu">
        <Toggle checked={Boolean(d.showFictionLabel)} onChange={(x) => set('showFictionLabel', x)}
          label="Afficher « Histoire inventée » / « Scénario imaginaire » sur les vidéos fictives" />
        <p className="muted small">Désactivé par défaut. Les vidéos de faits gardent toujours leurs sources dans la description.</p>
      </Card>

      <Card title="Voix">
        <Field label="Moteur vocal">
          <Select value={d.voiceProvider} onChange={(x) => set('voiceProvider', x)} options={VOICE_PROVIDERS} />
        </Field>
      </Card>

      <Card title="Production automatique">
        <Field label="Fréquence" hint="Appliquée au calendrier GitHub Actions (Phase 7).">
          <Select value={d.schedule} onChange={(x) => set('schedule', x)} options={SCHEDULES} />
        </Field>
        <Field label={`Vidéos par lancement : ${d.videosPerRun}`} hint={`Maximum ${d.maxVideosPerRun} pour rester dans les quotas gratuits.`}>
          <input type="range" min={1} max={d.maxVideosPerRun} step={1} value={d.videosPerRun} onChange={(e) => set('videosPerRun', Number(e.target.value))} />
        </Field>
        <span className="field-label">Catégories autorisées</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`chip ${d.allowedCategories.includes(c.id) ? 'active' : ''}`} onClick={() => toggleCat(c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </Card>

      {!v.ok && <Notice tone="bad">{v.errors.join(', ')}</Notice>}
      {flash && <Notice tone="ok">{flash}</Notice>}
      <div className="actions-row">
        <Button variant="primary" disabled={!v.ok} onClick={() => { dispatch({ type: 'settings/save', settings: d }); setFlash('Paramètres enregistrés sur cet appareil.'); }}>💾 Enregistrer</Button>
        <Button onClick={exportJson}>📋 Copier en JSON</Button>
        <Button variant="danger" onClick={() => { dispatch({ type: 'settings/reset' }); setD({ ...DEFAULT_SETTINGS }); setFlash('Paramètres par défaut restaurés.'); }}>Réinitialiser</Button>
      </div>
    </>
  );
}
