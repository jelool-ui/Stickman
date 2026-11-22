import { COMEDY } from './comedy.js';
import { MYSTERES } from './mysteres.js';
import { ETSI } from './etsi.js';
import { MOTIVATION } from './motivation.js';
import { EXPLAINER } from './explainer.js';
import { FACTS, FACT_THEMES } from './facts.js';

export { FACTS, FACT_THEMES };
export const SEEDS = { comedy: COMEDY, mysteres: MYSTERES, etsi: ETSI, motivation: MOTIVATION, explainer: EXPLAINER };

export function findSeed(id) {
  for (const [category, list] of Object.entries(SEEDS)) {
    const s = list.find((x) => x.id === id);
    if (s) return { ...s, category };
  }
  return null;
}
