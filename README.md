# 🎬 Stick Studio AI

Studio de production automatique de **vidéos Stickman originales en français** pour YouTube Shorts
(vertical 9:16, 1080 × 1920, 30 FPS, MP4 H.264 + AAC, sous-titres incrustés + fichier SRT).

Le projet est **gratuit** : il n'utilise que des logiciels open source (React, Vite, resvg, FFmpeg, Piper, eSpeak NG).
Aucune API payante n'est obligatoire et aucun serveur permanent n'est nécessaire. Les vidéos sont produites par
**GitHub Actions** et se téléchargent depuis votre téléphone.

> **État actuel : les 8 phases sont terminées et testées.** Une fonctionnalité n'est marquée ✅ que lorsqu'elle a été testée.

## Démarrage rapide (depuis un smartphone)

1. Ouvrez `github.com/jelool-ui/Stickman` dans **Chrome** → onglet **Actions** → **Générer une vidéo** → **Run workflow**.
2. Attendez environ 2 minutes (✅ vert), ouvrez l'exécution, téléchargez le ZIP dans **Artifacts**.
3. Publiez le `.mp4` sur YouTube Shorts avec le titre et la description de `metadata.json`.

Mode d'emploi détaillé pour Android : [`CONFIGURATION_ANDROID.md`](CONFIGURATION_ANDROID.md).

---

## Avancement

| Phase | Contenu | État |
|---|---|---|
| 1 | Audit, architecture, initialisation, diagnostic | ✅ testée |
| 2 | Interface : tableau de bord et 8 pages | ✅ testée (mobile 384 px) |
| 3 | Personnages SVG, expressions, animations | ✅ testée (vidéo de test 1080×1920 rendue) |
| 4 | Idées, hooks, scénarios, storyboard JSON | ✅ testée (34 histoires, 6 catégories) |
| 5 | Voix (Piper / eSpeak NG) et sous-titres | ✅ testée (synchronisation mesurée à 100 %) |
| 6 | Rendu vidéo (resvg + FFmpeg) et contrôle qualité | ✅ testée (vidéo de 30 s, contrôle 19/19) |
| 7 | Workflows GitHub Actions | ✅ testée sur GitHub (lancement manuel, calendrier, artefacts) |
| 8 | Finalisation, test de chaque catégorie, docs Android | ✅ testée (6 catégories, contrôle 19/19) |

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
│   ├── audio/                    Sous-titres (découpage, SRT) et préparation du texte pour la voix
│   ├── seo.js                    Titres, description, hashtags, mots-clés, nom de fichier, miniature
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
│   ├── tts/                      Synthèse vocale : Piper → eSpeak NG → sans voix, avec cache
│   ├── voice.js                  Voix d'un storyboard, timings réels, piste voix
│   ├── audio/                    Synthétiseur, musique originale, effets sonores, mixage
│   ├── parallel.js               Rendu des images sur plusieurs cœurs (mémoire bornée)
│   ├── qc.js                     Contrôle qualité automatique + rapport JSON
│   ├── thumbnail.js              Miniature
│   ├── youtube/                  Publication YouTube (préparée, désactivée en v1)
│   ├── produce.js                Production complète d'une vidéo
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

Prérequis : Node.js 20 ou plus, FFmpeg avec libx264, Python 3 (pour Piper).

```bash
npm install        # installe les dépendances
pip install piper-tts && node scripts/setup-voices.js   # voix (facultatif mais recommandé)
sudo apt-get install espeak-ng                         # voix de secours (facultatif)
npm run doctor     # vérifie FFmpeg, resvg, Piper, eSpeak NG
npm test           # tests unitaires
npm run test:ui    # test de l'interface dans un vrai navigateur, largeur smartphone
npm run dev        # démarre l'interface sur http://localhost:5173
npm run render:test  # rend une scène de test de 14 s dans output/test-scene.mp4
npm run storyboard -- --category auto --record   # génère un storyboard validé dans output/<id>/
npm run produce -- --category auto --count 1   # PRODUCTION COMPLÈTE (commande principale)
```

## Production complète (résumé)

`npm run produce` enchaîne, pour chaque vidéo : storyboard validé → voix → sous-titres → musique originale → effets
sonores → images (en parallèle) → mixage → miniature → métadonnées YouTube → contrôle qualité.

Options : `--category auto|explainer|comedy|mysteres|etsi|facts|motivation`, `--count N` (3 au maximum),
`--duration 30..60`, `--style classic|night|comic`, `--voice auto|piper|espeak|none`.

Chaque vidéo produit un dossier `output/<date>-<catégorie>-<id>/` :

| Fichier | Contenu |
|---|---|
| `<nom>.mp4` | Vidéo finale 1080×1920, 30 i/s, H.264 + AAC, sous-titres incrustés |
| `<nom>.srt` | Sous-titres séparés |
| `<nom>-miniature.png` | Miniature verticale |
| `metadata.json` | 3 titres, titre recommandé, description (sources ou mention fiction, crédits), hashtags, mots-clés |
| `qc-report.json` | Rapport du contrôle qualité (19 contrôles) |
| `storyboard.json` | Scénario final avec les timings réels |
| `production-report.json` | Durée de chaque étape, moteur vocal utilisé, effets placés |

Une vidéo qui échoue au contrôle qualité est marquée **échouée** dans `data/history.json`, avec la raison. Le studio
passe à la suivante sans réessayer en boucle. Un résumé est écrit dans `output/summary.md`.

**Temps mesuré** (4 cœurs, une vidéo de chaque catégorie, 30 à 39 s) : **29 à 37 s de calcul** par vidéo, dont images
17 à 22 s (rendu parallèle) et voix 5 à 6 s (synthèse parallèle, 0,5 s quand les répliques sont en cache).

**Résultats de la vérification finale** (une vidéo par catégorie) : contrôle qualité 19/19 pour les 6 catégories,
synchronisation voix ↔ sous-titres 100 %, volume −14,5 à −15,1 LUFS, voix transcrite automatiquement avec 6 à 21 %
d'erreurs malgré la musique (les erreurs viennent surtout du petit modèle de reconnaissance sur des liaisons comme
« regarde en haut »).

Musique et effets : 100 % générés par calcul, sans fichier externe ; voir [`assets/AUDIO.md`](assets/AUDIO.md).

## Voix et sous-titres (résumé)

- **Piper** avec la voix française `fr_FR-siwis-medium` (licence vérifiée : CC BY 4.0, attribution ajoutée).
  Cinq autres voix françaises ont été examinées et écartées (licence non commerciale, licence incertaine ou qualité
  insuffisante) : détails et mesures dans [`assets/voices/VOICES.md`](assets/voices/VOICES.md).
- Chaque personnage a son profil (hauteur, vitesse, volume) : narrateur, principal, secondaire masculin et féminin.
- Secours automatique : eSpeak NG (voix robotique), puis vidéo sans voix **signalée** dans le rapport.
- Les durées des scènes, les mouvements de bouche et les sous-titres sont calés sur la **durée réelle** de chaque réplique.
- Sous-titres incrustés par blocs de 2 lignes, mots-clés en couleur, et fichier `subtitles.srt` séparé.
- Cache : une réplique déjà générée n'est jamais recalculée (`.cache/tts/`).

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
  source (page consultée et date), indiquée dans la description. Les histoires inventées n'affichent pas de mention
  « Histoire inventée » (réglage `showFictionLabel`, désactivé par défaut, activable dans **Paramètres**).
- **Validation** avant rendu : champs obligatoires, décors/animations/objets connus, durées, hook en première scène,
  sources pour les faits.

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

## Configuration GitHub

Les vidéos sont produites par **GitHub Actions**, sur des machines prêtées par GitHub le temps d'une production
(ce n'est pas un serveur permanent). Trois workflows sont fournis dans `.github/workflows/` :

| Workflow | Déclenchement | Rôle |
|---|---|---|
| **Générer une vidéo** (`generate-video.yml`) | Bouton manuel | Produit 1 à 3 vidéos avec les options choisies |
| **Production planifiée** (`scheduled-production.yml`) | Chaque jour vers 6 h 23 (heure de Paris en hiver) + bouton manuel | Produit seulement si le calendrier de `config/settings.json` le prévoit |
| **Tests** (`ci.yml`) | À chaque envoi de code | Tests automatiques + petite vidéo de contrôle en 540×960 |

Garde-fous intégrés :

- **Une seule production à la fois** : une production lancée pendant une autre attend son tour.
- **Délais maximum** : 45 minutes par production, 35 minutes pour l'étape de rendu.
- **Jamais de génération infinie** : 3 vidéos au maximum par exécution, aucune nouvelle tentative automatique.
- **Permissions minimales** : lecture seule du dépôt. L'historique anti-doublons est conservé dans le cache GitHub.
- **Artefacts conservés 7 jours** (3 jours pour les vidéos de contrôle), puis supprimés automatiquement.
- **Caches** : dépendances npm et pip, modèle vocal (vérifié par empreinte SHA-256).

**Important : les workflows manuels et planifiés n'apparaissent qu'une fois le code dans la branche principale `main`**
(règle de GitHub). C'est le cas depuis le 22 novembre 2026.

Mesuré sur GitHub (machine gratuite `ubuntu-latest`) : une production d'une vidéo 1080×1920 prend **environ 1 min 40**
au total, dont 38 s de production ; l'installation profite des caches (moins d'une minute).

### Coût

Sur un dépôt **public**, les minutes GitHub Actions sont gratuites. Sur un dépôt **privé**, le compte gratuit inclut
un quota mensuel (2 000 minutes à ce jour, selon les conditions de GitHub) : une production d'une vidéo prend
environ 2 minutes, installation comprise (mesuré : 1 min 40). Le studio ne consomme rien quand le calendrier est sur « manuel ».

## Configuration des secrets

**Aucun secret n'est nécessaire** pour le fonctionnement de base (voix Piper, musique et histoires intégrées).

Seul le fournisseur de texte facultatif et **payant** (API Claude) en utilise un :

1. GitHub → dépôt → **Settings** → **Secrets and variables** → **Actions**.
2. Onglet **Secrets** → *New repository secret* → nom `ANTHROPIC_API_KEY`, valeur : votre clé.
3. Onglet **Variables** → *New repository variable* → nom `STICK_TEXT_PROVIDER`, valeur `claude`.

Pour revenir au mode gratuit, supprimez la variable `STICK_TEXT_PROVIDER`. Les secrets sont masqués dans les
journaux par GitHub et ne sont jamais écrits dans le code.

## Lancement manuel

1. GitHub → dépôt → onglet **Actions** → **Générer une vidéo** → bouton **Run workflow**.
2. Choisir la catégorie (ou `auto`), le nombre de vidéos, la durée, le style et la voix.
3. Cliquer sur **Run workflow**. La production dure quelques minutes ; un résumé s'affiche à la fin.

## Lancement automatique

Modifier `config/settings.json` (Claude Code peut le faire pour vous), par exemple :

```json
"schedule": "3-per-week",
"videosPerRun": 1,
"category": "auto"
```

Valeurs de `schedule` : `manual` (aucune production automatique, par défaut), `daily`, `3-per-week`
(lundi, mercredi, vendredi), `weekly` (lundi). La page **Paramètres** de l'interface permet de choisir ces valeurs
puis de les copier en JSON.

GitHub met les tâches planifiées en pause après 60 jours sans activité sur le dépôt : relancez-les depuis l'onglet
Actions si nécessaire.

## Téléchargement des vidéos

1. Onglet **Actions** → cliquer sur l'exécution terminée.
2. En bas de la page, section **Artifacts** → `videos-<numéro>` → téléchargement d'un fichier ZIP.
3. Le ZIP contient, pour chaque vidéo : le MP4, le fichier SRT, la miniature, `metadata.json` (titres, description,
   hashtags) et le rapport du contrôle qualité.

Les artefacts sont supprimés après 7 jours : pensez à télécharger les vidéos avant.

## Dépannage

| Problème | Solution |
|---|---|
| `npm run doctor` affiche ❌ ffmpeg | Installer FFmpeg (`sudo apt-get install ffmpeg`). Sur GitHub Actions il est installé automatiquement. |
| ⚠️ piper | `pip install piper-tts` puis `node scripts/setup-voices.js`. Sans Piper, eSpeak NG prend le relais. |
| ⚠️ espeak | `sudo apt-get install espeak-ng` (facultatif). Sans aucun moteur, la vidéo est produite sans voix et le rapport le signale. |
| Page blanche dans le navigateur | Lancer `npm run build` et lire l'erreur affichée. |
| Le bouton « Run workflow » n'apparaît pas | Les workflows doivent être dans la branche `main`. |
| La production planifiée ne produit rien | Vérifier `schedule` dans `config/settings.json` (« manual » = aucune production). |
| Exécution en échec | Ouvrir l'exécution → résumé et étape en rouge. Le détail de chaque vidéo est dans `data/history.json` (artefact). |
| « Plus aucune idée nouvelle » | La bibliothèque d'une catégorie est épuisée : ajouter des histoires ou passer en `auto`. |

## Licence et contenus

Personnages, décors et sons sont créés pour ce projet. Tout modèle vocal ou son externe ajouté sera
documenté avec sa source, sa langue et sa licence dans `assets/`.
