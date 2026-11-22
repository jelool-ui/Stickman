import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { PIPER_CANDIDATE_MODELS, VOICE_PROVIDERS } from '../../engine/voices.js';
import { Card, Field, Select, Button, Notice } from '../components/ui.jsx';

const SAMPLE = 'Bonjour ! Je suis prêt à raconter une nouvelle histoire.';

function speak(profile) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(SAMPLE);
  u.lang = 'fr-FR';
  u.rate = profile.speed;
  u.volume = profile.volume;
  u.pitch = profile.pitch;
  const fr = window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith('fr'));
  if (fr) u.voice = fr;
  window.speechSynthesis.speak(u);
  return true;
}

export default function Voices({ go }) {
  const { state, dispatch } = useStore();
  const [msg, setMsg] = useState(null);
  const save = (p, patch) => dispatch({ type: 'voice/save', profile: { ...p, ...patch } });

  return (
    <>
      <Card title="Moteur vocal">
        <p>Moteur actuel : <strong>{VOICE_PROVIDERS.find(([v]) => v === state.settings.voiceProvider)?.[1]}</strong></p>
        <Button onClick={() => go('settings')}>Changer dans les paramètres</Button>
        <Notice tone="warn">
          Piper sera installé et testé en Phase 5. Les licences des modèles vocaux y seront vérifiées une par une :
          un modèle non vérifié n'est jamais utilisé automatiquement.
        </Notice>
      </Card>

      {state.voiceProfiles.map((p) => (
        <Card key={p.id} title={p.label}>
          <Field label="Modèle Piper">
            <Select value={p.piperModel} onChange={(v) => save(p, { piperModel: v })}
              options={PIPER_CANDIDATE_MODELS.map((m) => [m.id, `${m.id} (${m.gender})${m.licenseVerified ? '' : ' — licence à vérifier'}`])} />
          </Field>
          <div className="grid-3">
            <Field label={`Vitesse ${p.speed.toFixed(2)}`}>
              <input type="range" min={0.7} max={1.4} step={0.05} value={p.speed} onChange={(e) => save(p, { speed: Number(e.target.value) })} />
            </Field>
            <Field label={`Volume ${Math.round(p.volume * 100)} %`}>
              <input type="range" min={0.3} max={1} step={0.05} value={p.volume} onChange={(e) => save(p, { volume: Number(e.target.value) })} />
            </Field>
            <Field label={`Hauteur ${p.pitch.toFixed(2)}`}>
              <input type="range" min={0.5} max={1.5} step={0.05} value={p.pitch} onChange={(e) => save(p, { pitch: Number(e.target.value) })} />
            </Field>
          </div>
          <Button onClick={() => setMsg(speak(p) ? null : "Votre navigateur ne propose pas la synthèse vocale.")}>
            🔊 Tester (aperçu avec la voix du téléphone)
          </Button>
        </Card>
      ))}
      {msg && <Notice tone="bad">{msg}</Notice>}
      <p className="muted small">
        Le bouton « Tester » utilise la voix intégrée à votre téléphone pour juger la vitesse et le volume.
        Les vidéos, elles, utiliseront Piper ou eSpeak NG.
      </p>
    </>
  );
}
