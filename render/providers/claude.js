// Fournisseur IA FACULTATIF : API Claude (Anthropic). PAYANT à l'usage, jamais obligatoire.
// - Activé uniquement si STICK_TEXT_PROVIDER=claude ET une clé ANTHROPIC_API_KEY est fournie (secret GitHub).
// - Utilisé seulement pour les catégories de fiction (comedy, mysteres, etsi, motivation).
//   Les catégories factuelles restent sur la base de faits sourcés : aucun fait généré par IA.
// - Toute réponse est validée strictement ; en cas de problème, le pipeline revient aux modèles intégrés.
// - La clé n'est jamais écrite dans le code ni dans les journaux.
import { CATEGORY_PROFILES, EMOTIONS } from '../../engine/story/categories.js';
import { listBackgrounds } from '../../engine/scenes/backgrounds.js';
import { listProps } from '../../engine/scenes/props.js';
import { findDuplicate } from '../../engine/story/ideas.js';
import { wordCount } from '../../engine/story/text.js';

export const CLAUDE_MODEL = 'claude-opus-5-5';
const FICTION = ['comedy', 'mysteres', 'etsi', 'motivation'];
const BEAT_TYPES = ['setup', 'development', 'escalation', 'reveal', 'conclusion'];
const ROLES = ['hero', 'friend'];

export function claudeEnabled(env = process.env) {
  return env.STICK_TEXT_PROVIDER === 'claude' && Boolean(env.ANTHROPIC_API_KEY);
}

function systemPrompt(category) {
  const p = CATEGORY_PROFILES[category];
  return [
    'Tu écris des scénarios originaux de vidéos courtes (YouTube Shorts) en français, avec des personnages Stickman.',
    `Catégorie : ${category}. Consignes : ${p.narration}`,
    'Règles absolues : histoires 100 % inventées, aucune personne réelle, aucune marque, aucun fait présenté comme réel ou scientifique, rien de choquant, rien de trompeur.',
    'La révélation finale doit être annoncée par les scènes précédentes et être cohérente.',
    'Réponds UNIQUEMENT avec du JSON valide, sans texte autour.',
  ].join('\n');
}

function userPrompt(category, count, avoidTitles) {
  return `Propose ${count} idées différentes. Format exact :
{"ideas":[{"title":"…","summary":"une phrase","themes":["…","…"],"audience":"tout public","potential":1-5,"ease":1-5,
"hook":{"situation":"phrase courte au présent, peut utiliser {hero}","subject":"groupe nominal avec article","question":"question courte","premise":"pour Et si : proposition sans « et si »","twist":true},
"reveal":["2 ou 3 mots-clés de la révélation"],
"bg":"un décor parmi : ${listBackgrounds().map(([id]) => id).join(', ')}",
"props":["objets optionnels parmi : ${listProps().map(([id]) => id).join(', ')}"],
"beats":[{"t":"setup|development|escalation|reveal|conclusion","n":"narration (peut être vide)","d":[["hero|friend","réplique courte"]],"e":"une émotion parmi : ${Object.keys(EMOTIONS).join(', ')}","who":["hero","friend"]}]}]}
Contraintes : 6 beats dans l'ordre setup, development, development, escalation, reveal, conclusion ; 75 à 110 mots au total ; phrases courtes ; utilise {hero} et {friend} pour les noms.
Évite ces titres déjà utilisés : ${avoidTitles.slice(0, 30).join(' | ') || 'aucun'}.`;
}

/** Vérifie et normalise une idée proposée par l'IA. Renvoie null si elle est inutilisable. */
export function sanitizeIdea(raw, category, index) {
  if (!raw || typeof raw !== 'object') return null;
  const str = (v, max = 200) => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : null);
  const title = str(raw.title, 90);
  const summary = str(raw.summary, 240);
  if (!title || !summary || !Array.isArray(raw.beats) || raw.beats.length < 5 || raw.beats.length > 8) return null;
  const bgs = new Set(listBackgrounds().map(([id]) => id));
  const props = new Set(listProps().map(([id]) => id));
  const beats = [];
  for (const b of raw.beats) {
    if (!BEAT_TYPES.includes(b?.t) || !EMOTIONS[b?.e]) return null;
    const n = b.n ? str(b.n, 220) : '';
    if (b.n && !n) return null;
    const d = Array.isArray(b.d) ? b.d.filter((x) => Array.isArray(x) && ROLES.includes(x[0]) && str(x[1], 160)).map(([r, t]) => [r, t.trim()]) : [];
    if (!n && !d.length) return null;
    const who = Array.isArray(b.who) ? b.who.filter((r) => ROLES.includes(r)) : [];
    beats.push({ t: b.t, n, ...(d.length ? { d } : {}), e: b.e, who: who.length ? who : ['hero'] });
  }
  if (!beats.some((b) => b.t === 'reveal')) return null;
  const words = beats.reduce((a, b) => a + wordCount(b.n) + (b.d || []).reduce((x, [, t]) => x + wordCount(t), 0), 0);
  if (words < 55 || words > 140) return null;
  const hook = {};
  for (const k of ['situation', 'subject', 'question', 'premise']) if (str(raw.hook?.[k], 140)) hook[k] = raw.hook[k].trim();
  hook.twist = raw.hook?.twist === true;
  const clamp5 = (v) => Math.min(5, Math.max(1, Math.round(Number(v) || 3)));
  return {
    id: `${category}:ia:${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${index}`,
    seed_id: `ia-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    category, title, summary,
    themes: (Array.isArray(raw.themes) ? raw.themes : []).filter((t) => str(t, 40)).slice(0, 5),
    audience: str(raw.audience, 40) || 'tout public',
    scores: { narrative: clamp5(raw.potential), ease: clamp5(raw.ease), total: clamp5(raw.potential) * 2 + clamp5(raw.ease) },
    content_type: CATEGORY_PROFILES[category].contentType,
    sources: [],
    hook,
    reveal: (Array.isArray(raw.reveal) ? raw.reveal : []).filter((t) => str(t, 30)).slice(0, 4),
    bg: bgs.has(raw.bg) ? raw.bg : CATEGORY_PROFILES[category].backgrounds[0],
    props: (Array.isArray(raw.props) ? raw.props : []).filter((p) => props.has(p)).slice(0, 2),
    cast: { hero: 'main', friend: 'secondary' },
    beats,
    provider: 'claude',
  };
}

/** Extrait le premier objet JSON d'un texte. */
export function parseJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('réponse sans JSON');
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * Crée le fournisseur. `client` peut être injecté (tests) ; sinon le SDK officiel est chargé
 * et lit la clé dans l'environnement (ANTHROPIC_API_KEY), sans jamais l'afficher.
 */
export async function createClaudeProvider({ client = null } = {}) {
  let api = client;
  let Anthropic = null;
  if (!api) {
    Anthropic = (await import('@anthropic-ai/sdk')).default;
    api = new Anthropic();
  }
  return {
    name: 'claude',
    label: `API Claude (${CLAUDE_MODEL}) — facultatif, payant`,
    paid: true,
    async generateIdeas({ count = 6, allowed = [], history = [] } = {}) {
      const category = allowed[0];
      if (!FICTION.includes(category)) throw new Error('catégorie factuelle : fournisseur IA non utilisé');
      let response;
      try {
        response = await api.beta.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 16000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: 'medium' },
          system: systemPrompt(category),
          messages: [{ role: 'user', content: userPrompt(category, Math.min(count, 6), history.map((h) => h.title).filter(Boolean)) }],
        });
      } catch (e) {
        // Messages d'erreur sans jamais inclure la clé.
        if (Anthropic && e instanceof Anthropic.AuthenticationError) throw new Error('clé API Claude invalide ou absente');
        if (Anthropic && e instanceof Anthropic.RateLimitError) throw new Error('quota de l’API Claude atteint, réessayez plus tard');
        if (Anthropic && e instanceof Anthropic.APIError) throw new Error(`erreur API Claude ${e.status ?? ''}`.trim());
        throw new Error(`appel API Claude impossible : ${e.message}`);
      }
      if (response.stop_reason === 'refusal') throw new Error('demande refusée par le modèle');
      if (response.stop_reason === 'max_tokens') throw new Error('réponse tronquée');
      const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      const data = parseJson(text);
      const ideas = [];
      (data.ideas || []).forEach((raw, i) => {
        const idea = sanitizeIdea(raw, category, i);
        if (idea && !findDuplicate(idea, [...history, ...ideas])) ideas.push(idea);
      });
      if (!ideas.length) throw new Error('aucune idée exploitable dans la réponse');
      return { ideas, rejected: [], exhausted: false };
    },
  };
}
