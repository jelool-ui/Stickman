import React from 'react';
import { useStore } from '../state/store.jsx';
import { Card, Button, Empty, CategoryTag, Notice } from '../components/ui.jsx';

export default function Ideas({ go }) {
  const { state, dispatch } = useStore();
  const selected = state.ideas.find((i) => i.id === state.selectedIdeaId);
  return (
    <>
      <Card title="Générateur d'idées">
        <Button variant="primary" disabled title="Disponible après la Phase 4">✨ Générer 20 idées</Button>
        <Notice tone="warn">Le moteur d'idées (avec détection des doublons) arrive en Phase 4.</Notice>
      </Card>

      {state.ideas.length === 0 ? (
        <Card><Empty icon="💡" title="Aucune idée générée" /></Card>
      ) : (
        <Card title={`${state.ideas.length} idées`}>
          <ul className="list">
            {state.ideas.map((idea) => (
              <li key={idea.id} className={idea.id === state.selectedIdeaId ? 'selected' : ''}
                onClick={() => dispatch({ type: 'ideas/select', id: idea.id })}>
                <div className="list-main">
                  <strong>{idea.title}</strong>
                  <span className="muted"><CategoryTag id={idea.category} /> · {idea.audience}</span>
                </div>
                <span className="score">{idea.score ?? '—'}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {selected && (
        <Card title="Hooks proposés">
          <ol className="hooks">
            {(selected.hooks || []).map((h, i) => (
              <li key={i} className={h.best ? 'best' : ''}>
                {h.text} <span className="muted">({h.score}/30)</span>
              </li>
            ))}
          </ol>
          <Button variant="primary" onClick={() => go('generator')}>Utiliser cette idée</Button>
        </Card>
      )}
    </>
  );
}
