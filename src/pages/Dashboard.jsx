import React from 'react';
import { useStore } from '../state/store.jsx';
import { computeStats, formatDuration } from '../../engine/history.js';
import { Card, Stat, StatusPill, CategoryTag, Empty, Button, formatDate } from '../components/ui.jsx';

export default function Dashboard({ go }) {
  const { state } = useStore();
  const s = computeStats(state.history);
  return (
    <>
      <div className="stats">
        <Stat label="Vidéos produites" value={s.success} tone="ok" />
        <Stat label="En cours" value={s.running} tone="warn" />
        <Stat label="Échecs" value={s.failed} tone={s.failed ? 'bad' : ''} />
        <Stat label="Temps moyen" value={formatDuration(s.avgProductionTimeSec)} />
      </div>

      <Card title="Dernières productions" actions={<Button onClick={() => go('history')}>Tout voir</Button>}>
        {s.recent.length === 0 ? (
          <Empty icon="🎬" title="Aucune vidéo pour l'instant">
            Les productions lancées depuis GitHub Actions apparaîtront ici.
          </Empty>
        ) : (
          <ul className="list">
            {s.recent.map((h) => (
              <li key={h.id}>
                <div className="list-main">
                  <strong>{h.title}</strong>
                  <span className="muted">
                    {formatDate(h.date)} · <CategoryTag id={h.category} />
                  </span>
                </div>
                <StatusPill status={h.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Erreurs récentes">
        {s.recentErrors.length === 0 ? (
          <p className="muted">Aucune erreur enregistrée. 👍</p>
        ) : (
          <ul className="list">
            {s.recentErrors.map((h) => (
              <li key={h.id} className="error-row">
                <div className="list-main">
                  <strong>{h.title}</strong>
                  <code>{h.error || 'Erreur inconnue'}</code>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="actions-row">
        <Button variant="primary" onClick={() => go('generator')}>🎬 Nouvelle vidéo</Button>
        <Button onClick={() => go('ideas')}>💡 Trouver des idées</Button>
      </div>
    </>
  );
}
