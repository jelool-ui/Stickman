import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { sortByDateDesc, formatDuration } from '../../engine/history.js';
import { Card, Empty, StatusPill, CategoryTag, formatDate } from '../components/ui.jsx';

const FILTERS = [['all', 'Toutes'], ['success', 'Réussies'], ['failed', 'Échouées'], ['running', 'En cours']];

export default function History() {
  const { state } = useStore();
  const [filter, setFilter] = useState('all');
  const items = sortByDateDesc(state.history).filter((h) => filter === 'all' || h.status === filter);
  return (
    <>
      <div className="chips">
        {FILTERS.map(([v, l]) => (
          <button key={v} className={`chip ${v === filter ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <Card>
        {items.length === 0 ? (
          <Empty icon="🗂️" title="Historique vide">
            Chaque production (réussie ou échouée) sera enregistrée ici avec sa date, sa catégorie et ses erreurs.
          </Empty>
        ) : (
          <ul className="list">
            {items.map((h) => (
              <li key={h.id}>
                <div className="list-main">
                  <strong>{h.title}</strong>
                  <span className="muted">
                    {formatDate(h.date)} · <CategoryTag id={h.category} /> · {formatDuration(h.productionTimeSec)}
                  </span>
                  {h.error && <code>{h.error}</code>}
                </div>
                <StatusPill status={h.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
