import React, { useState } from 'react';
import { CATEGORIES } from '../engine/config.js';

// Phase 1 : squelette de navigation. Les pages complètes arrivent en Phase 2.
const PAGES = [
  ['dashboard', 'Dashboard', '📊'],
  ['generator', 'Vidéos', '🎬'],
  ['ideas', 'Idées', '💡'],
  ['characters', 'Personnages', '🧍'],
  ['storyboard', 'Storyboard', '🎞️'],
  ['voices', 'Voix', '🎙️'],
  ['history', 'Historique', '🗂️'],
  ['settings', 'Paramètres', '⚙️'],
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const current = PAGES.find((p) => p[0] === page);
  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">Stick Studio AI</span>
        <span className="badge">v0.1 · Phase 1</span>
      </header>
      <main className="content">
        <h1>
          {current[2]} {current[1]}
        </h1>
        {page === 'dashboard' ? (
          <section className="card">
            <p>Le studio est initialisé. Catégories disponibles :</p>
            <ul className="cats">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  {c.emoji} {c.label}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="card">
            <p>Cette page sera construite en Phase 2.</p>
          </section>
        )}
      </main>
      <nav className="tabbar">
        {PAGES.map(([id, label, icon]) => (
          <button key={id} className={id === page ? 'active' : ''} onClick={() => setPage(id)}>
            <span>{icon}</span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
