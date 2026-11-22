// Calcul des statistiques de production à partir de l'historique.
// Format d'une entrée : { id, date (ISO), title, category, status: 'success'|'failed'|'running',
//                         productionTimeSec, error, files }

export function sortByDateDesc(history) {
  return [...history].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function computeStats(history = []) {
  const sorted = sortByDateDesc(history);
  const success = sorted.filter((h) => h.status === 'success');
  const failed = sorted.filter((h) => h.status === 'failed');
  const running = sorted.filter((h) => h.status === 'running');
  const timed = success.filter((h) => Number.isFinite(h.productionTimeSec));
  const avg = timed.length ? timed.reduce((s, h) => s + h.productionTimeSec, 0) / timed.length : null;
  return {
    total: sorted.length,
    success: success.length,
    failed: failed.length,
    running: running.length,
    avgProductionTimeSec: avg === null ? null : Math.round(avg),
    recent: sorted.slice(0, 5),
    recentErrors: failed.slice(0, 5),
  };
}

export function formatDuration(sec) {
  if (sec === null || sec === undefined || !Number.isFinite(sec)) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
}
