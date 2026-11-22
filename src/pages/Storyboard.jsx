import React, { useMemo } from 'react';
import { useStore } from '../state/store.jsx';
import { ANIMATIONS, ANIMATION_LABELS, BACKGROUNDS, CAMERAS, TRANSITIONS } from '../../engine/catalog.js';
import { Card, Field, Select, Empty, Notice, CategoryTag } from '../components/ui.jsx';
import Player from '../components/Player.jsx';
import { validateStoryboard } from '../../engine/story/validate.js';

const SCENE_TYPES = { hook: 'Hook', setup: 'Présentation', development: 'Développement', escalation: 'Escalade', reveal: 'Révélation', conclusion: 'Conclusion' };

export default function Storyboard() {
  const { state, dispatch } = useStore();
  const sb = state.storyboard;
  const v = useMemo(() => (!sb || sb.isExample ? null : validateStoryboard(sb, { characters: state.characters })), [sb, state.characters]);
  if (!sb) return <Card><Empty icon="🎞️" title="Aucun storyboard" /></Card>;
  const total = sb.scenes.reduce((s, x) => s + Number(x.duration || 0), 0);
  const charName = (id) => state.characters.find((c) => c.id === id)?.name || id;
  const update = (scene_id, patch) => dispatch({ type: 'storyboard/updateScene', scene_id, patch });

  return (
    <>
      {sb.isExample && <Notice tone="warn">Storyboard d'exemple. Générez-en un vrai depuis « Vidéos » ou « Idées ».</Notice>}
      {v && (v.ok
        ? <Notice tone="ok">✅ Storyboard valide : {v.stats.scenes} scènes, {v.stats.duration} s, {v.stats.words} mots.{v.warnings.length ? ` ⚠️ ${v.warnings.join(' ; ')}` : ''}</Notice>
        : <Notice tone="bad">❌ À corriger : {v.errors.join(' ; ')}</Notice>)}
      <Card title={sb.title}>
        <p className="muted"><CategoryTag id={sb.category} /> · {sb.scenes.length} scènes · {total.toFixed(1)} s{sb.label ? ` · 🏷️ ${sb.label}` : ' · ✔️ faits sourcés'}</p>
        {sb.hook?.text && <p>🎣 <strong>Hook :</strong> {sb.hook.text}</p>}
        <div className="timeline">
          {sb.scenes.map((s) => (
            <div key={s.scene_id} style={{ flexGrow: s.duration }} title={`Scène ${s.scene_id}`}>{s.scene_id}</div>
          ))}
        </div>
      </Card>

      <Card title="Aperçu animé">
        <Player storyboard={sb} characters={state.characters} width={240} style={sb.style || 'classic'} />
        <p className="muted small">Aperçu calculé par le même moteur que la vidéo finale (sans voix ni musique pour l'instant).</p>
      </Card>

      {sb.hook?.proposals?.length > 0 && (
        <Card title="Les 3 hooks proposés">
          <ol className="hooks">
            {sb.hook.proposals.map((h, i) => <li key={i} className={h.best ? 'best' : ''}>{h.text} <span className="muted">({h.total}/30)</span></li>)}
          </ol>
        </Card>
      )}

      {sb.sources?.length > 0 && (
        <Card title="Sources">
          <ul className="sources">
            {sb.sources.map((src) => <li key={src.url}><a href={src.url} target="_blank" rel="noreferrer">{src.title}</a> <span className="muted small">(vérifiée le {src.checked})</span></li>)}
          </ul>
        </Card>
      )}

      {sb.scenes.map((s) => (
        <Card key={s.scene_id} title={`Scène ${s.scene_id}${s.scene_type ? ` · ${SCENE_TYPES[s.scene_type] || s.scene_type}` : ''}`} className="scene">
          {s.narration && <p className="narration">🎙️ {s.narration}</p>}
          {s.dialogue.map((d, i) => (
            <p key={i} className="dialogue"><strong>{charName(d.character_id)} :</strong> « {d.text} »</p>
          ))}
          <p className="muted small">
            Personnages : {s.character_ids.map(charName).join(', ') || '—'} · Sons : {s.sound_effects.join(', ') || '—'}
          </p>
          <div className="grid-2">
            <Field label="Durée (s)">
              <input type="number" min={1} max={15} step={0.5} value={s.duration}
                onChange={(e) => update(s.scene_id, { duration: Math.min(15, Math.max(1, Number(e.target.value) || 1)) })} />
            </Field>
            <Field label="Animation">
              <Select value={s.animation} onChange={(v) => update(s.scene_id, { animation: v })}
                options={ANIMATIONS.map((a) => [a, ANIMATION_LABELS[a]])} />
            </Field>
            <Field label="Décor">
              <Select value={s.background_id} onChange={(v) => update(s.scene_id, { background_id: v })} options={BACKGROUNDS} />
            </Field>
            <Field label="Caméra">
              <Select value={s.camera} onChange={(v) => update(s.scene_id, { camera: v })} options={CAMERAS.map((c) => [c, c])} />
            </Field>
            <Field label="Transition">
              <Select value={s.transition} onChange={(v) => update(s.scene_id, { transition: v })}
                options={TRANSITIONS.map((t) => [t, t])} />
            </Field>
          </div>
        </Card>
      ))}
    </>
  );
}
