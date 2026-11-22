// Fournisseur par défaut : gratuit, hors ligne, déterministe. Combine la bibliothèque de structures narratives.
import { generateIdeas } from '../ideas.js';

export const templateProvider = {
  name: 'template',
  label: 'Modèles intégrés (gratuit, sans API)',
  paid: false,
  async generateIdeas(opts) {
    return generateIdeas(opts);
  },
};
