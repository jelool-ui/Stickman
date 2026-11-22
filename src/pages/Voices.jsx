import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { VOICE_MODELS, VOICE_PROVIDERS, validateVoiceProfile } from '../../engine/voices.js';
import { Card, Button, Notice } from '../components/ui.jsx';

const SAMPLE = 'Bonjour ! Je suis prêt à raconter une nouvelle histoire.';

function speak(profile) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(SAMPLE);
  u.lang = 'fr-FR';
  u.rate = profile.speed;
  u.volume = Math.min(1, profile.volume);
  u.pitch = Math.max(0, Math.min(2, profile.pitch));
  const fr = window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith('fr'));
  if (fr) u.voice = fr;
  window.speechSynthesis.speak(u);
  return true;
}

export default function Voices({ go }) {
  const { state, dispatch } = useStore();
  const [msg, setMsg] = useState(null);
  const save = (p, patch) => {
    const next = { ...p, ...patch };
    if (validateVoiceProfile(next).ok) dispatch({ type: 'voice/save', profile: next });
  };
  const models = Object.entries(VOICE_MODELS);
  const usedBy = (id) => state.characters.filter((c) => c.voiceProfile === id).map((c) => c.name).join(', ');

  return (
    <>
      <Card title="Moteur vocal">
        <p>Choix actuel : <strong>{VOICE_PROVIDERS.find(([v]) => v === state.settings.voiceProvider)?.[1]}</strong></p>
        <Button onClick={() => go('settings')}>Changer dans les paramètres</Button>
        <p className="muted small">Ordre automatique : Piper (voix naturelle) → fournisseur externe (aucun configuré) → eSpeak NG (voix robotique) → vidéo sans voix, signalée dans le rapport.</p>
      </Card>

      <Card title="Profils de voix">
        <p className="muted small">Tous les personnages utilisent la voix Piper « siwis », avec une hauteur et un débit différents.</p>
        {state.voiceProfiles.map((p) => (
          <div key={p.id} className="voice-profile">
            <strong>{p.label}</strong> <span className="muted small">{usedBy(p.id) ? `· ${usedBy(p.id)}` : ''}</span>
            <div className="grid-3">
              <label className="field"><span className="field-label">Hauteur {p.pitch.toFixed(2)}</span>
                <input type="range" min={0.6} max={1.4} step={0.02} value={p.pitch} onChange={(e) => save(p, { pitch: Number(e.target.value) })} /></label>
              <label className="field"><span className="field-label">Vitesse {p.speed.toFixed(2)}</span>
                <input type="range" min={0.7} max={1.4} step={0.02} value={p.speed} onChange={(e) => save(p, { speed: Number(e.target.value) })} /></label>
              <label className="field"><span className="field-label">Volume {Math.round(p.volume * 100)} %</span>
                <input type="range" min={0.2} max={1.5} step={0.05} value={p.volume} onChange={(e) => save(p, { volume: Number(e.target.value) })} /></label>
            </div>
            <Button onClick={() => setMsg(speak(p) ? null : 'Votre navigateur ne propose pas la synthèse vocale.')}>🔊 Aperçu (voix du téléphone)</Button>
          </div>
        ))}
        {msg && <Notice tone="bad">{msg}</Notice>}
        <p className="muted small">L'aperçu utilise la voix intégrée à votre téléphone pour juger le débit. Les vidéos utilisent Piper, générées sur GitHub Actions.</p>
      </Card>

      <Card title="Modèles et licences">
        <ul className="list">
          {models.map(([id, m]) => (
            <li key={id}>
              <div className="list-main">
                <strong>{id}</strong>
                <span className="muted small">{m.approved ? `${m.datasetLicense}${m.quality ? ' · ' + m.quality : ''}` : m.reason}</span>
              </div>
              <span className={`pill ${m.approved ? 'ok' : 'bad'}`}>{m.approved ? 'Autorisé' : 'Exclu'}</span>
            </li>
          ))}
        </ul>
        <Notice tone="info">Attribution ajoutée aux descriptions : « Voix de synthèse : Piper, modèle fr_FR-siwis-medium (données SIWIS, CC BY 4.0). »</Notice>
      </Card>

      <Card title="Configurer Piper">
        <p className="small">Rien à faire depuis le téléphone : GitHub Actions installe Piper et télécharge le modèle autorisé à chaque production (avec cache). Pour l'environnement Claude Code :</p>
        <pre className="code">pip install piper-tts{'\n'}node scripts/setup-voices.js{'\n'}npm run doctor</pre>
      </Card>
    </>
  );
}
