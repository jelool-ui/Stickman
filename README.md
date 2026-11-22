# 🎬 Stick Studio AI

Studio de production automatique de **vidéos Stickman originales en français** pour YouTube Shorts
(vertical 9:16, 1080 × 1920, 30 FPS, MP4 H.264 + AAC, sous-titres incrustés + fichier SRT).

Le projet est **gratuit** : il n'utilise que des logiciels open source (React, Vite, resvg, FFmpeg, Piper, eSpeak NG).
Aucune API payante n'est obligatoire et aucun serveur permanent n'est nécessaire. Les vidéos sont produites par
**GitHub Actions** et se téléchargent depuis votre téléphone.

> **État actuel : Phase 4 sur 8 terminée** (idées, hooks, scénarios, storyboard). La liste à jour est dans la section « Avancement ».
> Une fonctionnalité n'est marquée ✅ que lorsqu'elle a été testée.

---

## Avancement

| Phase | Contenu | État |
|---|---|---|
| 1 | Audit, architecture, initialisation, diagnostic | ✅ testée |
| 2 | Interface : tableau de bord et 8 pages | ✅ testée (mobile 384 px) |
| 3 | Personnages SVG, expressions, animations | ✅ testée (vidéo de test 1080×1920 rendue) |
| 4 | Idées, hooks, scénarios, storyboard JSON | ✅ testée (34 histoires, 6 catégories) |
| 5 | Voix (Piper / eSpeak NG) et sous-titres | ⏳ à faire |
| 6 | Rendu vidéo (resvg + FFmpeg) et contrôle qualité | ⏳ à faire |
| 7 | Workflows GitHub Actions | ⏳ à faire |
| 8 | Finalisation, test de chaque catégorie, docs Android | ⏳ à faire |

---

## Architecture

```
Stickman/
├── index.html, vite.config.js   Interface web (React + Vite)
├── src/
│   ├── pages/                    Les 8 pages (Dashboard, Vidéos, Idées, Storyboard, Personnages, Voix, Historique, Paramètres)
│   ├── components/ui.jsx         Composants réutilisables (cartes, champs, boutons…)
│   └── state/                    État global (fonctions pures) + sauvegarde dans le navigateur
├── engine/                       Moteur partagé navigateur + Node (sans dépendance système)
│   ├── config.js                 Catégories, réglages par défaut, validation
│   ├── catalog.js                Animations, expressions, décors, caméras, transitions, styles
│   ├── characters/               Personnages : bibliothèque, squelette articulé, dessin SVG
│   ├── animation/                17 animations, moteur (interpolation, fondus), caméra, transitions, texte animé
│   ├── scenes/                   11 décors, 15 objets, 3 styles, composition d'une image complète
│   └── story/                    Idées, hooks, scénarios, validation, pipeline
│       ├── categories.js         Profils des 6 catégories (narration, hooks, décors, sons, rythme)
│       ├── library/              Histoires originales + base de faits sourcés
│       └── providers/            Fournisseurs de texte interchangeables
│   ├── voices.js                 Profils vocaux
│   ├── history.js                Statistiques de production
│   └── samples/                  Exemples (storyboard de démonstration)
├── render/                       Côté Node uniquement : rendu SVG→PNG, FFmpeg, voix, contrôle qualité
│   ├── environment.js            Détection réelle des outils installés
│   ├── frames.js                 SVG → pixels (resvg, police intégrée)
│   ├── encode.js                 Pixels → MP4 H.264 (FFmpeg, sans fichiers temporaires)
│   └── providers/claude.js       Fournisseur IA facultatif (API Claude, payant)
├── scripts/                      Commandes en ligne (doctor, production…)
├── data/                         Historique des idées et des productions (JSON)
├── assets/                       Musiques, effets sonores, modèles vocaux (licences documentées)
├── tests/                        Tests automatiques (Vitest)
└── output/                       Vidéos produites (ignoré par Git, livré en artefact GitHub)
```

Principe : **le même moteur** (`engine/`) dessine les scènes dans l'aperçu du navigateur et dans le rendu vidéo.
Le rendu est **déterministe** : un même scénario JSON produit toujours la même vidéo.

Chaîne de production prévue :

```
idée → hook (3 propositions notées) → scénario JSON validé → voix + sous-titres
     → images SVG animées (resvg) → assemblage FFmpeg → contrôle qualité → MP4 + SRT + métadonnées SEO
```

---

## Installation (environnement Claude Code ou ordinateur)

Prérequis : Node.js 20 ou plus, FFmpeg avec libx264.

```bash
npm install        # installe les dépendances
npm run doctor     # vérifie FFmpeg, resvg, Piper, eSpeak NG
npm test           # tests unitaires
npm run test:ui    # test de l'interface dans un vrai navigateur, largeur smartphone
npm run dev        # démarre l'interface sur http://localhost:5173
npm run render:test  # rend une scène de test de 14 s dans output/test-scene.mp4
npm run storyboard -- --category auto --record   # génère un storyboard validé dans output/<id>/
```

## Idées, hooks et scénarios (résumé)

- **20 idées à la demande**, chacune avec un titre, une catégorie, un résumé, un public visé, une note de potentiel
  narratif et une note de facilité. Les doublons (titres, résumés, thèmes) avec l'historique récent sont écartés.
- **Hooks** : 3 propositions par vidéo, notées sur 6 critères (curiosité, clarté, originalité, compréhension
  immédiate, promesse, cohérence avec la révélation). La meilleure est choisie automatiquement. Les formulations
  racoleuses sont exclues et une formulation utilisée récemment perd des points.
- **Scénarios** : hook → présentation → développement → escalade → révélation → conclusion, 6 à 12 scènes, 30 à 60 s.
  La durée suit le texte : aucun silence n'est ajouté pour « remplir », et la parole n'est jamais coupée.
- **Mix automatique** : la catégorie la moins récemment produite passe en premier.
- **Faits et fiction** : les catégories *Explainer* et *Facts* n'utilisent **que** des faits vérifiés, chacun avec sa
  source (page consultée et date). Les histoires inventées affichent l'étiquette « Histoire inventée » ou
  « Scénario imaginaire » à l'image.
- **Validation** avant rendu : champs obligatoires, décors/animations/objets connus, durées, hook en première scène,
  sources pour les faits, étiquette pour la fiction.

### Fournisseurs de texte

| Fournisseur | Coût | Utilisation |
|---|---|---|
| Modèles intégrés (par défaut) | Gratuit, hors ligne | Toutes les catégories. 34 histoires originales + 13 faits sourcés. |
| API Claude (facultatif) | **Payant à l'usage** (facturé par Anthropic) | Seulement pour la fiction (Comedy, Mystères, Et si, Motivation). Activé avec le secret `ANTHROPIC_API_KEY` et la variable `STICK_TEXT_PROVIDER=claude`. En cas d'erreur, retour automatique aux modèles intégrés. |

La bibliothèque intégrée est finie : après avoir produit toutes ses histoires d'une catégorie, le studio le signale
au lieu de répéter. Il suffit alors d'ajouter des histoires dans `engine/story/library/` (Claude Code peut le faire)
ou d'activer le fournisseur facultatif.

## Moteur d'animation (résumé)

- **Squelette articulé** : buste, tête, épaules, coudes, hanches, genoux. Chaque membre bouge indépendamment.
- **17 animations** : repos, marcher, courir, sauter, parler, réfléchir, montrer, rire, surprise, triste, colère,
  tomber, saluer, s'asseoir, se retourner, entrer et sortir de scène.
- **Jamais figé** : respiration, micro-mouvements, clignements des yeux ; la caméra respire légèrement.
- **Dialogues** : un personnage qui parle bouge la bouche et fait des gestes.
- **Caméra** : fixe, zoom avant/arrière, panoramique, tremblement, mise au point sur le personnage.
- **Transitions** : coupe, fondu, glissement gauche/haut, zoom, flash.
- **Ajouter un décor ou un objet** : `registerBackground()` / `registerProp()` dans `engine/scenes/`, sans toucher au moteur.
- **Déterministe** : aucun hasard non contrôlé, un même storyboard donne toujours la même vidéo.
- **Vitesse mesurée** : environ 17 à 25 images/s en 1080 × 1920, soit 1 à 2 minutes de calcul pour 60 s de vidéo.

Vous travaillez depuis un smartphone : vous n'avez pas besoin de taper ces commandes vous-même.
Demandez simplement à Claude Code de les lancer.

## Configuration GitHub, secrets, lancement manuel et automatique

Ces sections seront complétées en Phase 7, une fois les workflows créés et testés.
Aucun secret n'est nécessaire pour le fonctionnement de base.

## Dépannage

| Problème | Solution |
|---|---|
| `npm run doctor` affiche ❌ ffmpeg | Installer FFmpeg (`sudo apt-get install ffmpeg`). Sur GitHub Actions il est installé automatiquement. |
| ⚠️ piper / espeak | Facultatif à ce stade. Sans moteur vocal, la vidéo est produite sans voix et le rapport le signale. |
| Page blanche dans le navigateur | Lancer `npm run build` et lire l'erreur affichée. |

## Licence et contenus

Personnages, décors et sons sont créés pour ce projet. Tout modèle vocal ou son externe ajouté sera
documenté avec sa source, sa langue et sa licence dans `assets/`.
