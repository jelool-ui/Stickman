// Outils de texte en français : normalisation, mots-clés, similarité, comptage de mots.

const STOP = new Set(('a à au aux avec ce ces cet cette dans de des du elle en et eux il ils je la le les leur leurs lui ma mais me même mes moi mon ne nos notre nous on ou où par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous y est sont été être fait faire plus très tout tous toute toutes comme si quand alors donc puis encore aussi bien peu ça cela c ' +
  "d l j m n s t qu jusqu lorsqu puisqu quoi pourquoi comment chez ceux celle celui sans sous entre vers après avant depuis pendant").split(/\s+/));

export function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');
}

/** Mots significatifs (sans mots vides, racine grossière pour regrouper singulier/pluriel). */
export function keywords(s) {
  return normalize(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(s|x)$/, ''));
}

export function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

export function wordCount(s) {
  return String(s || '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Remplace {role} par le nom du personnage. */
export function fill(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

export function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function slug(s) {
  return normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'video';
}
