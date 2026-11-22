import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { reducer, hydrate } from './reducer.js';

const KEY = 'stick-studio-ai:v1';
const Ctx = createContext(null);

function load() {
  try {
    return hydrate(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return hydrate(null);
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* stockage indisponible (navigation privée) : l'application continue sans sauvegarde */
    }
  }, [state]);

  // Charge l'historique produit par GitHub Actions s'il est publié avec l'interface (data/history.json).
  useEffect(() => {
    fetch('data/history.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((entries) => Array.isArray(entries) && entries.length && dispatch({ type: 'history/merge', entries }))
      .catch(() => {});
  }, []);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  return useContext(Ctx);
}
