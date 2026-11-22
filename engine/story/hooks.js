// Moteur de hook : 3 propositions par scénario, notées sur 6 critères, la meilleure est choisie automatiquement.
// Règle : aucune accroche trompeuse. Une accroche doit annoncer ce que la vidéo révèle vraiment.
import { CATEGORY_PROFILES } from './categories.js';
import { keywords, wordCount, fill, capitalize, normalize } from './text.js';
import { seededRandom } from '../math.js';

/** Familles de formulations. needs = données obligatoires ; twist = réservé aux histoires avec une vraie chute. */
export const HOOK_FAMILIES = {
  question: { needs: ['question'], forms: ['{question}'] },
  everyday: { needs: ['everyday', 'topic'], forms: ['On voit {everyday} si souvent qu’on oublie de se demander {topicIndirect}.', 'Tout le monde connaît {everyday}. Presque personne ne sait {topicIndirect}.'] },
  'promise-seconds': { needs: ['topic'], forms: ['En moins d’une minute, tu vas comprendre {topic}.', 'Donne-moi moins d’une minute pour t’expliquer {topic}.'] },
  'secret-word': { needs: ['secret', 'Topic'], forms: ['{Topic} ? Tout tient dans un seul mot : {secret}.'] },
  situation: { needs: ['situation'], forms: ['{Situation}. Ça ne pouvait que mal tourner.', '{Situation}. Rien ne va se passer comme prévu.'] },
  pov: { needs: ['situation'], forms: ['POV : {situation}.'] },
  'no-believe': { needs: ['subject'], twist: true, forms: ['Tu ne vas pas croire ce qui est arrivé à {hero} avec {subject}…', 'Ce que {hero} va vivre avec {subject} est complètement absurde.'] },
  'thought-understood': { needs: [], generic: true, forms: ['{hero} pensait avoir tout compris… jusqu’à ce détail.', '{hero} était sûr de lui. Il avait oublié un détail.'] },
  'mystery-situation': { needs: ['situation'], forms: ['{Situation}. Et personne ne comprend pourquoi.', '{Situation}. La réponse était sous ses yeux.'] },
  riddle: { needs: ['riddle'], forms: ['Petite énigme : {riddle}. Tu as une idée ?', 'Énigme : {riddle}. Trouveras-tu avant {hero} ?'] },
  clue: { needs: [], generic: true, forms: ['Tout se joue sur un seul indice. Le verras-tu avant {hero} ?'] },
  imagine: { needs: ['premise'], forms: ['Imagine que demain, {premise}.', 'Imagine un instant que {premise}.'] },
  'what-if': { needs: ['premise'], forms: ['Et si {premise} ?'] },
  'everyone-said': { needs: [], generic: true, forms: ['Tout le monde lui disait d’abandonner. {hero} a continué.', 'On lui a dit que c’était inutile. {hero} a quand même essayé.'] },
  number: { needs: ['number', 'numberThing'], forms: ['{number} {numberThing}. Voilà ce qu’il a fallu à {hero}.', '{number} {numberThing}. Et ce n’est pas la fin de l’histoire.'] },
  'motiv-question': { needs: [], generic: true, forms: ['Et si ce qui te semble un échec préparait la suite ?', 'Tu as déjà eu envie d’abandonner ? Écoute l’histoire de {hero}.'] },
  'facts-count': { needs: ['theme'], forms: ['Trois faits sur {theme} que presque personne ne connaît.', 'Trois faits vrais sur {theme}. Le deuxième va te surprendre.'] },
  'facts-last': { needs: ['theme'], forms: ['Trois faits sur {theme}. Garde bien le dernier en tête.'] },
  'facts-think-know': { needs: ['theme'], forms: ['Tu crois tout savoir sur {theme} ? Vérifions avec trois faits.'] },
};

// Formulations trompeuses ou racoleuses interdites.
const BANNED = ['choquant', 'vous n allez jamais', 'personne ne veut que vous', 'on vous cache', '100 %', 'garanti', 'incroyable mais vrai', 'interdit', 'scandale', 'urgent'];
const CURIOSITY = ['pourquoi', 'comment', 'personne', 'detail', 'secret', 'vraiment', 'imagine', 'et si', 'enigme', 'indice', 'surprendre', 'croire', 'jusqu', '?', '…'];
const PROMISE = ['tu vas', 'comprendre', 'voila', 'reponse', 'secret', 'trois faits', 'trouveras', 'pas la fin', 'ecoute', 'verifions', 'garde', 'detail'];

function indirect(topic) {
  return topic.replace(/^pourquoi /i, 'pourquoi ').replace(/^comment /i, 'comment ');
}

/** Données disponibles pour remplir les familles. */
export function hookVars(idea, names) {
  const h = idea.hook || {};
  const vars = { ...h, hero: names.hero || 'Max', seconds: idea.targetDuration || 40 };
  if (h.situation) { vars.situation = fill(h.situation, names); vars.Situation = capitalize(vars.situation); }
  if (h.riddle) vars.riddle = fill(h.riddle, names);
  if (h.topic) { vars.topicIndirect = indirect(h.topic); vars.Topic = capitalize(h.topic); }
  return vars;
}

export function applicableFamilies(idea) {
  const profile = CATEGORY_PROFILES[idea.category];
  const vars = { ...(idea.hook || {}) };
  if (vars.topic) vars.Topic = vars.topic;
  return profile.hookFamilies.filter((f) => {
    const fam = HOOK_FAMILIES[f];
    if (!fam) return false;
    if (fam.twist && !idea.hook?.twist) return false;
    return fam.needs.every((k) => vars[k]);
  });
}

/** Note un hook sur 6 critères (0 à 5 chacun, total sur 30). */
export function scoreHook(text, idea, { recentFamilies = [], family } = {}) {
  const n = normalize(text);
  const words = wordCount(text);
  const has = (list) => list.filter((w) => n.includes(w)).length;
  const revealKw = new Set((idea.reveal || []).map((w) => normalize(w).replace(/(s|x)$/, '')));
  const hookKw = keywords(text);
  const overlap = hookKw.filter((w) => revealKw.has(w) || [...revealKw].some((r) => w.startsWith(r) || r.startsWith(w))).length;
  const topicKw = keywords([idea.title, idea.summary, ...(idea.themes || [])].join(' '));
  const topicOverlap = hookKw.filter((w) => topicKw.includes(w)).length;

  const curiosity = Math.min(5, 1 + has(CURIOSITY) * 1.5);
  const clarity = words >= 5 && words <= 14 ? 5 : words <= 18 ? 4 : words <= 24 ? 2 : 1;
  const avgLen = text.replace(/[^\p{L}]/gu, '').length / Math.max(1, words);
  const immediate = Math.max(1, Math.min(5, 6 - Math.max(0, avgLen - 4.5) - (text.includes(';') ? 1 : 0)));
  const originality = Math.max(0, 5 - recentFamilies.filter((f) => f === family).length * 2 - (HOOK_FAMILIES[family]?.generic ? 2 : 0));
  const promise = Math.min(5, 1 + has(PROMISE) * 1.5 + (/\?|…/.test(text) ? 1 : 0));
  const coherence = Math.min(5, (overlap ? 3 : 0) + Math.min(2, topicOverlap) + (overlap > 1 ? 1 : 0));
  // Trompeur = formulation racoleuse interdite. (Chaque idée possède une vraie révélation ; une faible cohérence baisse seulement la note.)
  const misleading = BANNED.some((b) => n.includes(b));
  const criteria = { curiosite: round1(curiosity), clarte: clarity, originalite: originality, comprehension: round1(immediate), promesse: round1(promise), coherence };
  const total = Object.values(criteria).reduce((a, b) => a + b, 0);
  return { criteria, total: round1(total), misleading };
}
const round1 = (v) => Math.round(v * 10) / 10;

/**
 * Génère 3 propositions de hook issues de familles différentes et choisit la meilleure.
 * recentFamilies : familles utilisées récemment (pour varier les formulations).
 */
export function generateHooks(idea, names, { recentFamilies = [], seed = idea.id } = {}) {
  const rnd = seededRandom(`${seed}:hooks`);
  const fams = applicableFamilies(idea);
  const vars = hookVars(idea, names);
  // Les familles peu utilisées récemment passent en premier.
  const ordered = [...fams].sort((a, b) => recentFamilies.filter((f) => f === a).length - recentFamilies.filter((f) => f === b).length || rnd() - 0.5);
  const proposals = [];
  for (const family of ordered) {
    if (proposals.length === 3) break;
    const forms = HOOK_FAMILIES[family].forms;
    const text = fill(forms[Math.floor(rnd() * forms.length)], vars).replace(/\s+/g, ' ').trim();
    if (/\{\w+\}/.test(text)) continue;
    proposals.push({ family, text, ...scoreHook(text, idea, { recentFamilies, family }) });
  }
  // Toujours trois propositions : on complète avec d'autres formulations des mêmes familles.
  for (const family of fams) {
    if (proposals.length >= 3) break;
    for (const form of HOOK_FAMILIES[family].forms) {
      const text = fill(form, vars).replace(/\s+/g, ' ').trim();
      if (proposals.length < 3 && !proposals.some((p) => p.text === text) && !/\{\w+\}/.test(text))
        proposals.push({ family, text, ...scoreHook(text, idea, { recentFamilies, family }) });
    }
  }
  const valid = proposals.filter((p) => !p.misleading);
  const pool = valid.length ? valid : proposals;
  const best = [...pool].sort((a, b) => b.total - a.total || a.text.length - b.text.length)[0];
  return { proposals: proposals.map((p) => ({ ...p, best: p === best })), best };
}
