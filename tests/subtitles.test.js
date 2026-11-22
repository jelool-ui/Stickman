import { describe, it, expect } from 'vitest';
import { chunkText, timeChunks, srtTime, toSrt, collectCues } from '../engine/audio/subtitles.js';
import { prepareSpeechText } from '../engine/audio/tts-text.js';
import { VOICE_MODELS, APPROVED_PIPER_MODELS, DEFAULT_VOICE_PROFILES, validateVoiceProfile } from '../engine/voices.js';

describe('sous-titres', () => {
  const text = 'Silence total. Sur l’écran, huit visages le regardent fixement. Même le chat de sa collègue.';
  it('découpe en blocs lisibles sans perdre ni déplacer de mot', () => {
    const chunks = chunkText(text, 42);
    expect(chunks.join(' ')).toBe(text);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(42 + 10);
    expect(chunks.length).toBeGreaterThan(1);
  });
  it('répartit les blocs sur toute la durée de la réplique, sans trou', () => {
    const t = timeChunks(text, 1.5, 6, 42);
    expect(t[0].start).toBe(1.5);
    expect(t.at(-1).end).toBeCloseTo(7.5, 2);
    for (let i = 1; i < t.length; i++) expect(t[i].start).toBeCloseTo(t[i - 1].end, 3);
  });
  it('formate le SRT correctement', () => {
    expect(srtTime(0)).toBe('00:00:00,000');
    expect(srtTime(3723.456)).toBe('01:02:03,456');
    const srt = toSrt([{ start: 0.2, end: 2.5, text: 'Bonjour à toutes et à tous, voici la suite' }]);
    expect(srt).toMatch(/^1\n00:00:00,200 --> 00:00:02,500\n.+\n.+\n$/);
  });
  it('convertit les blocs de chaque scène en temps absolu', () => {
    const cues = collectCues({ scenes: [
      { scene_id: 1, duration: 4, subtitle_chunks: [{ start: 0.2, end: 3, text: 'a' }] },
      { scene_id: 2, duration: 5, subtitle_chunks: [{ start: 0.2, end: 2, text: 'b' }] },
    ] });
    expect(cues.map((c) => [c.start, c.end])).toEqual([[0.2, 3], [4.2, 6]]);
  });
  it('prépare le texte pour la voix sans changer le sens', () => {
    expect(prepareSpeechText('« Debout ! » POV : il est 2 h 00')).toBe('Debout ! Point de vue : il est 2 heures');
    expect(prepareSpeechText('Je disais…que')).toBe('Je disais… que');
  });
});

describe('modèles vocaux et licences', () => {
  it('seuls les modèles à licence vérifiée et compatible sont autorisés', () => {
    expect(APPROVED_PIPER_MODELS).toEqual(['fr_FR-siwis-medium']);
    for (const [id, m] of Object.entries(VOICE_MODELS)) {
      if (m.approved) expect(m.datasetLicense, id).toBeTruthy();
      else expect(m.reason, id).toBeTruthy();
    }
  });
  it('les profils par défaut sont valides et un modèle exclu est refusé', () => {
    expect(DEFAULT_VOICE_PROFILES.map((p) => p.id)).toEqual(['narrator', 'main', 'secondary_male', 'secondary_female']);
    for (const p of DEFAULT_VOICE_PROFILES) expect(validateVoiceProfile(p).errors).toEqual([]);
    expect(validateVoiceProfile({ ...DEFAULT_VOICE_PROFILES[0], model: 'fr_FR-tom-medium' }).ok).toBe(false);
  });
});
