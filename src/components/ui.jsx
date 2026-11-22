import React from 'react';
import { CATEGORIES } from '../../engine/config.js';

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, ...rest }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function Button({ variant = 'default', children, ...rest }) {
  return (
    <button className={`btn ${variant}`} {...rest}>
      {children}
    </button>
  );
}

const STATUS = { success: ['Réussie', 'ok'], failed: ['Échouée', 'bad'], running: ['En cours', 'warn'] };
export function StatusPill({ status }) {
  const [label, tone] = STATUS[status] || [status, ''];
  return <span className={`pill ${tone}`}>{label}</span>;
}

export function CategoryTag({ id }) {
  const c = CATEGORIES.find((x) => x.id === id);
  return <span className="tag">{c ? `${c.emoji} ${c.label}` : id}</span>;
}

export function Empty({ icon = '📭', title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Notice({ tone = 'info', children }) {
  return <div className={`notice ${tone}`}>{children}</div>;
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
