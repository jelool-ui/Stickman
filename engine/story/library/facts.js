// Stick Facts — base de faits RÉELS, chacun avec sa source. Le générateur n'invente jamais de fait :
// il sélectionne et met en scène ces fiches. Sources vérifiées le 2026-11-22.
const W = (page) => ({ title: `Wikipédia — ${decodeURIComponent(page).replace(/_/g, ' ')}`, url: `https://fr.wikipedia.org/wiki/${page}`, checked: '2026-11-22' });

export const FACT_THEMES = {
  animaux: { label: 'les animaux', bg: 'landscape', rotation: ['forest', 'abstract', 'landscape'] },
  espace: { label: 'l’espace et la nature', bg: 'space', rotation: ['abstract', 'landscape', 'space'] },
  monde: { label: 'notre monde', bg: 'city', rotation: ['street', 'abstract', 'house'] },
};

export const FACTS = [
  { id: 'pieuvre-coeurs', theme: 'animaux', fact: 'La pieuvre possède trois cœurs.', detail: 'Et son sang est bleu, à cause d’une molécule riche en cuivre : l’hémocyanine.', keyword: 'pieuvre', source: W('Pieuvre') },
  { id: 'flamant-rose', theme: 'animaux', fact: 'Les flamants roses ne naissent pas roses.', detail: 'Leur couleur vient des pigments présents dans les algues et les petits crustacés qu’ils mangent.', keyword: 'flamant', source: W('Flamant_rose') },
  { id: 'koala-sommeil', theme: 'animaux', fact: 'Un koala peut dormir jusqu’à vingt heures par jour.', detail: 'Ses feuilles d’eucalyptus lui apportent très peu d’énergie, alors il l’économise.', keyword: 'koala', source: W('Koala') },
  { id: 'etoile-de-mer', theme: 'animaux', fact: 'Les étoiles de mer n’ont pas de cerveau.', detail: 'À la place, un réseau de nerfs parcourt tout leur corps.', keyword: 'etoile', source: W('Asteroidea') },
  { id: 'dauphin-sommeil', theme: 'animaux', fact: 'Les dauphins dorment avec une moitié du cerveau à la fois.', detail: 'L’autre moitié reste éveillée, ce qui leur permet de continuer à nager et à respirer.', keyword: 'dauphin', source: W('Sommeil_unih%C3%A9misph%C3%A9rique') },
  { id: 'abeille-danse', theme: 'animaux', fact: 'Les abeilles indiquent le chemin des fleurs en dansant.', detail: 'Leur « danse frétillante » indique la direction et la distance de la nourriture.', keyword: 'abeille', source: W('Danse_des_abeilles') },
  { id: 'venus-jour', theme: 'espace', fact: 'Sur Vénus, un jour dure plus longtemps qu’une année.', detail: 'Vénus met environ 243 jours terrestres à tourner sur elle-même, mais environ 225 jours à faire le tour du Soleil.', keyword: 'venus', source: W('V%C3%A9nus_(plan%C3%A8te)') },
  { id: 'foudre-chaleur', theme: 'espace', fact: 'La foudre est plus chaude que la surface du Soleil.', detail: 'Un éclair peut atteindre environ 30 000 degrés, soit à peu près cinq fois la température de la surface du Soleil.', keyword: 'foudre', source: W('Foudre') },
  { id: 'lumiere-soleil', theme: 'espace', fact: 'La lumière du Soleil met environ huit minutes pour nous parvenir.', detail: 'Quand tu regardes le Soleil, tu le vois donc tel qu’il était il y a huit minutes.', keyword: 'lumiere', source: W('Soleil') },
  { id: 'banane-radioactive', theme: 'monde', fact: 'Les bananes sont très légèrement radioactives.', detail: 'Elles contiennent du potassium, dont une infime partie est naturellement radioactive. Aucun danger.', keyword: 'banane', source: W('Potassium_40'), source2: { title: 'Wikipedia (EN) — Banana equivalent dose', url: 'https://en.wikipedia.org/wiki/Banana_equivalent_dose', checked: '2026-11-22' } },
  { id: 'tour-eiffel-ete', theme: 'monde', fact: 'La tour Eiffel change de taille avec la température.', detail: 'Avec la chaleur, son métal se dilate : sa hauteur peut varier de plusieurs centimètres.', keyword: 'eiffel', source: W('Tour_Eiffel') },
  { id: 'grande-muraille-lune', theme: 'monde', fact: 'La Grande Muraille de Chine n’est pas visible à l’œil nu depuis la Lune.', detail: 'C’est une idée reçue : elle est bien trop étroite pour être vue d’aussi loin.', keyword: 'muraille', source: W('Grande_Muraille') },
  { id: 'mer-morte', theme: 'monde', fact: 'On flotte très facilement dans la mer Morte.', detail: 'Son eau est presque dix fois plus salée que celle de l’océan, ce qui la rend très porteuse.', keyword: 'morte', source: W('Mer_Morte') },
];
