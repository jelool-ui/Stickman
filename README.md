# 🎬 Stick Studio AI

Studio de production automatique de **vidéos Stickman originales en français** pour YouTube Shorts
(vertical 9:16, 1080 × 1920, 30 FPS, MP4 H.264 + AAC, sous-titres incrustés + fichier SRT).

Le projet est **gratuit** : il n'utilise que des logiciels open source (React, Vite, resvg, FFmpeg, Piper, eSpeak NG).
Aucune API payante n'est obligatoire et aucun serveur permanent n'est nécessaire. Les vidéos sont produites par
**GitHub Actions** et se téléchargent depuis votre téléphone.

> **État actuel : Phase 1 sur 8 terminée** (initialisation). La liste à jour est dans la section « Avancement ».
> Une fonctionnalité n'est marquée ✅ que lorsqu'elle a été testée.

---

## Avancement

| Phase | Contenu | État |
|---|---|---|
| 1 | Audit, architecture, initialisation, diagnostic | ✅ testée |
| 2 | Interface : tableau de bord et 8 pages | ⏳ à faire |
| 3 | Personnages SVG, expressions, animations | ⏳ à faire |
| 4 | Idées, hooks, scénarios, storyboard JSON | ⏳ à faire |
| 5 | Voix (Piper / eSpeak NG) et sous-titres | ⏳ à faire |
| 6 | Rendu vidéo (resvg + FFmpeg) et contrôle qualité | ⏳ à faire |
| 7 | Workflows GitHub Actions | ⏳ à faire |
| 8 | Finalisation, test de chaque catégorie, docs Android | ⏳ à faire |

---

## Architecture

```
Stickman/
├── index.html, vite.config.js   Interface web (React + Vite)
├── src/                          Pages et composants de l'interface
├── engine/                       Moteur partagé navigateur + Node (sans dépendance système)
│   └── config.js                 Catégories, réglages par défaut, validation
├── render/                       Côté Node uniquement : rendu SVG→PNG, FFmpeg, voix, contrôle qualité
│   └── environment.js            Détection réelle des outils installés
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
npm test           # lance les tests
npm run dev        # démarre l'interface sur http://localhost:5173
```

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
