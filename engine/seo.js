// Métadonnées YouTube : 3 titres, un titre recommandé, description, hashtags, mots-clés, nom de fichier, miniature.
// Règles : titres naturels et précis, pas de majuscules criardes, pas de bourrage de mots-clés,
// aucune promesse de vues. La fiction est signalée, les faits sont sourcés, les crédits sont présents.
import { slug, keywords as kw, normalize } from './story/text.js';
import { VOICE_MODELS } from './voices.js';

const CAT = {
  explainer: { tags: ['#LeSaviezVous', '#Science'], words: ['explication', 'science', 'comprendre'], format: (t) => `${t.replace(/\s*\?$/, '')} : l’explication simple` },
  comedy: { tags: ['#Humour', '#Comédie'], words: ['humour', 'comédie', 'sketch'], format: (t) => `${t} | Stick Comedy` },
  mysteres: { tags: ['#Énigme', '#Mystère'], words: ['énigme', 'mystère', 'histoire'], format: (t) => `Énigme : ${t.charAt(0).toLowerCase()}${t.slice(1)}` },
  etsi: { tags: ['#EtSi', '#Imagination'], words: ['et si', 'imagination', 'scénario'], format: (t) => (t.startsWith('Et si') ? `${t} (scénario imaginaire)` : `Et si… ${t.charAt(0).toLowerCase()}${t.slice(1)}`) },
  facts: { tags: ['#LeSaviezVous', '#Culture'], words: ['faits', 'culture générale', 'le saviez-vous'], format: (t) => `${t} (sources en description)` },
  motivation: { tags: ['#Motivation', '#Persévérance'], words: ['motivation', 'persévérance', 'histoire inspirante'], format: (t) => `${t} | Histoire inspirante` },
};

const clean = (s) => String(s).replace(/\s+/g, ' ').replace(/\s+([?!:;])/g, ' $1').trim();

function hookTitle(hook) {
  const h = String(hook || '').replace(/ /g, ' ');
  if (h.length <= 70) return h;
  const first = h.split(/(?<=[.?!…])\s/)[0];
  return first.length <= 70 ? first : `${first.slice(0, 66).replace(/\s+\S*$/, '')}…`;
}

function hashtagify(word) {
  const w = word.split(/[\s-]+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return /^[\p{L}\p{N}]+$/u.test(w) ? `#${w}` : null;
}

/** Génère les métadonnées d'une vidéo à partir de son storyboard final. */
export function generateMetadata(sb, { date = new Date().toISOString().slice(0, 10) } = {}) {
  const c = CAT[sb.category] || CAT.comedy;
  const candidates = [sb.title, hookTitle(sb.hook?.text), c.format(sb.title)].map(clean).filter((t, i, a) => t && a.indexOf(t) === i);
  while (candidates.length < 3) candidates.push(clean(`${sb.title} — Stick Studio`));
  const titles = candidates.slice(0, 3);
  // Titre recommandé : le plus court sous 60 caractères qui contient un mot-clé du sujet, sinon le premier sous 70.
  const subject = new Set(kw([sb.title, ...(sb.themes || [])].join(' ')));
  const score = (t) => (t.length <= 60 ? 2 : t.length <= 70 ? 1 : -5) + (kw(t).some((w) => subject.has(w)) ? 2 : 0) - t.length / 100;
  const recommended = [...titles].sort((a, b) => score(b) - score(a))[0];

  const themes = (sb.themes || []).slice(0, 3);
  const hashtags = ['#Shorts', ...c.tags, ...themes.map(hashtagify).filter(Boolean)].filter((h, i, a) => a.findIndex((x) => normalize(x) === normalize(h)) === i).slice(0, 5);
  const keywords = [...new Set([...themes, ...c.words, 'stickman', 'animation', 'court métrage'])].slice(0, 10);

  const lines = [clean(sb.hook?.text || sb.summary || sb.title), '', clean(sb.summary || '')];
  if (sb.content_type === 'fact') {
    lines.push('', '📚 Sources :', ...(sb.sources || []).map((s) => `• ${s.title} — ${s.url}`));
  } else if (sb.label) {
    lines.push('', sb.content_type === 'hypothetical' ? '🌀 Scénario imaginaire : une hypothèse pour s’amuser, pas une prédiction.' : '🏷️ Histoire inventée : personnages et situations fictifs.');
  }
  const voiceCredit = sb.voice?.provider === 'piper' ? VOICE_MODELS['fr_FR-siwis-medium'].credit.replace('Voix :', 'Voix de synthèse :') : sb.voice?.provider === 'espeak' ? 'Voix de synthèse : eSpeak NG.' : null;
  lines.push('', '🎬 Animation, musique et effets sonores originaux créés avec Stick Studio AI.');
  if (voiceCredit) lines.push(`🎙️ ${voiceCredit}`);
  lines.push('', hashtags.join(' '));

  const reveal = sb.scenes.find((s) => s.scene_type === 'reveal') || sb.scenes[Math.floor(sb.scenes.length / 2)];
  const thumbText = sb.title.replace(/[?!.…]+$/, '').split(' ').slice(0, 6).join(' ');
  return {
    titles,
    recommended_title: recommended,
    description: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    hashtags,
    keywords,
    filename: `${date}-${sb.category}-${slug(sb.title)}.mp4`,
    thumbnail: { text: thumbText, scene_id: reveal.scene_id, background_id: reveal.background_id, description: `Image de la scène ${reveal.scene_id} (${reveal.scene_type || 'scène'}) avec le texte « ${thumbText} » en grand.` },
    note: 'Ces métadonnées aident à décrire la vidéo ; elles ne garantissent aucun nombre de vues.',
    language: 'fr',
    made_for_kids: false,
    category_id: sb.category === 'explainer' || sb.category === 'facts' ? '27' : '24',
  };
}
