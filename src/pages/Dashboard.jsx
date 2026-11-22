import React from 'react';
import { useStore } from '../state/store.jsx';
import { computeStats, formatDuration } from '../../engine/history.js';
import { Card, Stat, StatusPill, CategoryTag, Empty, Button, formatDate } from '../components/ui.jsx';

const REPO = 'https://github.com/jelool-ui/Stickman';

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

      <Card title="Production sur GitHub">
        <p className="small">Les vidéos MP4 (voix, musique, sous-titres) sont fabriquées par GitHub Actions. Lancez une production ou téléchargez les vidéos terminées :</p>
        <div className="actions-row">
          <a className="btn primary" href={`${REPO}/actions/workflows/generate-video.yml`} target="_blank" rel="noreferrer">▶️ Lancer une production</a>
          <a className="btn" href={`${REPO}/actions`} target="_blank" rel="noreferrer">📥 Vidéos terminées</a>
        </div>
        <p className="muted small">Mode d'emploi pas à pas : CONFIGURATION_ANDROID.md</p>
      </Card>

      <div className="actions-row">
        <Button variant="primary" onClick={() => go('generator')}>🎬 Nouvelle vidéo</Button>
        <Button onClick={() => go('ideas')}>💡 Trouver des idées</Button>
      </div>
    </>
  );
}
