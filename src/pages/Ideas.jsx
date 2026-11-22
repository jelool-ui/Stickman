import React, { useMemo, useState } from 'react';
import { useStore } from '../state/store.jsx';
import { generateIdeas } from '../../engine/story/ideas.js';
import { storyboardForIdea } from '../../engine/story/pipeline.js';
import { generateStoryboard } from '../state/production.js';
import { Card, Button, Empty, CategoryTag, Notice, ScoreBar } from '../components/ui.jsx';

const CRITERIA = { curiosite: 'Curiosité', clarte: 'Clarté', originalite: 'Originalité', comprehension: 'Compréhension', promesse: 'Promesse', coherence: 'Cohérence' };

export default function Ideas({ go }) {
  const { state, dispatch } = useStore();
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const selected = state.ideas.find((i) => i.id === state.selectedIdeaId);
  const preview = useMemo(
    () => (selected ? storyboardForIdea(selected, { characters: state.characters, history: state.history, targetDuration: state.settings.targetDuration }) : null),
    [selected, state.characters, state.history, state.settings.targetDuration],
  );

  const generate = () => {
    const r = generateIdeas({ count: 20, allowed: state.settings.allowedCategories, history: state.history.slice(0, 40), seed: String(Date.now()),
      names: { hero: state.characters[0]?.name || 'Max', friend: state.characters[1]?.name || 'Léa' } });
    dispatch({ type: 'ideas/set', ideas: r.ideas });
    setInfo(`${r.ideas.length} idées générées${r.rejected.length ? `, ${r.rejected.length} doublons écartés` : ''}.${r.exhausted ? ' La bibliothèque est presque épuisée pour ces catégories.' : ''}`);
  };

  const use = async () => {
    setBusy(true);
    await generateStoryboard({ state, dispatch, idea: selected, targetDuration: state.settings.targetDuration, style: 'classic' });
    setBusy(false);
    go('storyboard');
  };

  return (
    <>
      <Card title="Générateur d'idées">
        <Button variant="primary" onClick={generate}>✨ Générer 20 idées</Button>
        {info && <Notice tone="ok">{info}</Notice>}
        <p className="muted small">Mode gratuit : idées construites à partir de la bibliothèque d'histoires originales du studio, sans doublon avec l'historique récent. Aucune donnée de « tendance » n'est utilisée.</p>
      </Card>

      {state.ideas.length === 0 ? (
        <Card><Empty icon="💡" title="Aucune idée générée" /></Card>
      ) : (
        <Card title={`${state.ideas.length} idées`}>
          <ul className="list">
            {state.ideas.map((idea) => (
              <li key={idea.id} className={idea.id === state.selectedIdeaId ? 'selected' : ''} onClick={() => dispatch({ type: 'ideas/select', id: idea.id })}>
                <div className="list-main">
                  <strong>{idea.title}</strong>
                  <span className="muted small">{idea.summary}</span>
                  <span className="muted small"><CategoryTag id={idea.category} /> · {idea.audience} · potentiel {idea.scores.narrative}/5 · facilité {idea.scores.ease}/5</span>
                </div>
                <span className="score" title="Note globale">{idea.scores.total}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {selected && preview && (
        <Card title="Hooks proposés">
          {preview.hooks.proposals.map((h, i) => (
            <div key={i} className={`hook ${h.best ? 'best' : ''}`}>
              <p><strong>{h.best ? '★ ' : ''}{h.text}</strong> <span className="muted">({h.total}/30)</span></p>
              <div className="scores">
                {Object.entries(h.criteria).map(([k, v]) => <ScoreBar key={k} label={CRITERIA[k]} value={v} />)}
              </div>
            </div>
          ))}
          <p className="muted small">Le meilleur hook est choisi automatiquement. Les formulations racoleuses ou trompeuses sont exclues.</p>
          <Button variant="primary" disabled={busy} onClick={use}>🎞️ Créer le storyboard avec cette idée</Button>
        </Card>
      )}
    </>
  );
}
