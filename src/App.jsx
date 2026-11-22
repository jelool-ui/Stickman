import React, { useEffect, useState } from 'react';
import { StoreProvider } from './state/store.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Generator from './pages/Generator.jsx';
import Ideas from './pages/Ideas.jsx';
import Characters from './pages/Characters.jsx';
import Storyboard from './pages/Storyboard.jsx';
import Voices from './pages/Voices.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';

export const PAGES = {
  dashboard: { label: 'Accueil', title: 'Tableau de bord', icon: '📊', C: Dashboard },
  generator: { label: 'Vidéos', title: 'Générateur de vidéos', icon: '🎬', C: Generator },
  ideas: { label: 'Idées', title: "Générateur d'idées", icon: '💡', C: Ideas },
  storyboard: { label: 'Storyboard', title: 'Storyboard', icon: '🎞️', C: Storyboard },
  characters: { label: 'Personnages', title: 'Personnages', icon: '🧍', C: Characters },
  voices: { label: 'Voix', title: 'Voix', icon: '🎙️', C: Voices },
  history: { label: 'Historique', title: 'Historique', icon: '🗂️', C: History },
  settings: { label: 'Paramètres', title: 'Paramètres', icon: '⚙️', C: Settings },
};
const MAIN_TABS = ['dashboard', 'generator', 'ideas', 'storyboard'];
const MORE_TABS = ['characters', 'voices', 'history', 'settings'];

// Navigation par ancre (#page) : le bouton « retour » d'Android fonctionne naturellement.
function usePage() {
  const read = () => (PAGES[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard');
  const [page, setPage] = useState(read);
  useEffect(() => {
    const on = () => setPage(read());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return [page, (p) => { location.hash = p; }];
}

export default function App() {
  const [page, go] = usePage();
  const [moreOpen, setMoreOpen] = useState(false);
  const { C, title, icon } = PAGES[page];
  useEffect(() => { setMoreOpen(false); scrollTo(0, 0); }, [page]);

  return (
    <StoreProvider>
      <div className="app">
        <header className="topbar">
          <span className="logo">Stick Studio <em>AI</em></span>
          <span className="badge">v0.4</span>
        </header>
        <main className="content">
          <h1>{icon} {title}</h1>
          <C go={go} />
        </main>
        {moreOpen && (
          <div className="sheet-backdrop" onClick={() => setMoreOpen(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              {MORE_TABS.map((id) => (
                <button key={id} className={id === page ? 'active' : ''} onClick={() => go(id)}>
                  <span>{PAGES[id].icon}</span>{PAGES[id].label}
                </button>
              ))}
            </div>
          </div>
        )}
        <nav className="tabbar">
          {MAIN_TABS.map((id) => (
            <button key={id} className={id === page ? 'active' : ''} onClick={() => go(id)}>
              <span>{PAGES[id].icon}</span><small>{PAGES[id].label}</small>
            </button>
          ))}
          <button className={MORE_TABS.includes(page) || moreOpen ? 'active' : ''} onClick={() => setMoreOpen((o) => !o)}>
            <span>☰</span><small>Plus</small>
          </button>
        </nav>
      </div>
    </StoreProvider>
  );
}
