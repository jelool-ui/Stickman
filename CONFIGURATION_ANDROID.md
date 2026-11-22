# Piloter Stick Studio AI depuis un smartphone Android

Ce guide est écrit pour un **Samsung Galaxy S24** (ou tout Android récent), sans ordinateur. Vous n'avez **jamais
besoin de taper du code** : vous utilisez l'application GitHub (ou le site github.com dans Chrome) pour lancer les
productions et récupérer les vidéos, et Claude Code pour toute modification du projet.

---

## 1. Ce qu'il vous faut (une seule fois)

| Outil | Où le trouver | À quoi il sert |
|---|---|---|
| **Chrome** (déjà installé) | — | Ouvrir github.com et l'interface du studio |
| **GitHub** (application) | Play Store → « GitHub » (éditeur : GitHub) | Voir les productions, être notifié |
| **Claude** (application) ou claude.ai/code | Play Store ou Chrome | Demander des modifications du projet |
| Un **gestionnaire de fichiers** (« Mes fichiers » sur Samsung) | Déjà installé | Ouvrir les ZIP de vidéos |

> ⚠️ L'application GitHub ne permet pas toujours de lancer un workflow manuellement. Pour le bouton
> **Run workflow**, utilisez **github.com dans Chrome** (voir étape 3). Si la page s'affiche en version mobile
> réduite, touchez **⋮ → Version pour ordinateur**.

## 2. Activer les boutons de production (une seule fois)

Les boutons « Générer une vidéo » et « Production planifiée » n'apparaissent dans GitHub que lorsque le code du studio
se trouve dans la branche principale **`main`**. Demandez simplement à Claude Code :

> « Fusionne la branche de travail dans main. »

(Claude Code vous demandera confirmation avant de le faire.)

## 3. Lancer une vidéo à la main

1. Ouvrez **Chrome** → `github.com/jelool-ui/Stickman`.
2. Touchez l'onglet **Actions** (en haut ; faites défiler les onglets vers la gauche si besoin).
3. Dans la liste à gauche (ou le menu « All workflows »), touchez **Générer une vidéo**.
4. Touchez le bouton **Run workflow** (à droite).
5. Choisissez :
   - **Catégorie** : `auto` pour laisser le studio alterner, ou une catégorie précise ;
   - **Nombre de vidéos** : 1 à 3 ;
   - **Durée maximale**, **Style**, **Voix** (laissez `auto`).
6. Touchez le bouton vert **Run workflow**.
7. Une ligne jaune 🟡 apparaît : la production est en cours (environ 4 à 6 minutes pour une vidéo).
   Elle devient ✅ verte quand c'est terminé, ❌ rouge en cas de problème.

## 4. Télécharger les vidéos

1. Dans **Actions**, touchez l'exécution terminée (✅).
2. Faites défiler jusqu'à **Artifacts** (en bas de la page).
3. Touchez **videos-…** : un fichier ZIP se télécharge.
4. Ouvrez **Mes fichiers → Téléchargements**, touchez le ZIP → **Extraire**.
5. Dans le dossier extrait, pour chaque vidéo :
   - le fichier **.mp4** : la vidéo prête pour YouTube Shorts ;
   - le fichier **.srt** : les sous-titres (facultatif sur YouTube, la vidéo les contient déjà) ;
   - **…-miniature.png** : la miniature ;
   - **metadata.json** : titres proposés, description et hashtags (ouvrez-le avec un lecteur de texte et copiez-collez).

> Les vidéos restent disponibles **7 jours** dans GitHub. Téléchargez-les avant.

## 5. Publier sur YouTube (à la main)

1. Ouvrez l'application **YouTube** → **＋** → **Short** → **Importer** → choisissez le `.mp4`.
2. Copiez le **titre recommandé** et la **description** depuis `metadata.json`.
3. Vérifiez la vidéo avant de publier. La description contient déjà les crédits obligatoires (voix) et, selon le
   cas, les sources ou la mention « Histoire inventée » : gardez-les.

Le studio ne publie jamais rien tout seul dans cette version.

## 6. Programmer des productions automatiques

Demandez à Claude Code, par exemple :

> « Programme une vidéo par jour, catégories en mix automatique. »

Claude Code modifiera `config/settings.json` (`"schedule": "daily"`). Valeurs possibles : `manual` (aucune production
automatique, réglage par défaut), `daily`, `3-per-week` (lundi, mercredi, vendredi), `weekly` (lundi).
La production se lance vers 6 h 23 (heure de Paris en hiver, 7 h 23 en été).

Pour tout arrêter : « Remets la production sur manuel. »

## 7. Être prévenu

Dans l'application GitHub : **Profil → Paramètres → Notifications → Actions** : activez les notifications pour les
exécutions échouées (et réussies si vous le souhaitez).

## 8. En cas de problème

| Ce que vous voyez | Que faire |
|---|---|
| Pas de bouton **Run workflow** | Le code n'est pas encore dans `main` (étape 2), ou passez Chrome en « Version pour ordinateur ». |
| Exécution ❌ rouge | Touchez-la, puis l'étape en rouge. Copiez le message et collez-le à Claude Code : « Corrige cette erreur ». |
| Exécution ✅ mais résumé « ⚠️ une partie a échoué » | Une vidéo n'a pas passé le contrôle qualité. Le détail est dans `data/history.json` (dans le ZIP). |
| « Plus aucune idée nouvelle » | Une catégorie a épuisé ses histoires : choisissez `auto` ou demandez à Claude Code d'ajouter des histoires. |
| La production planifiée ne fait rien | Vérifiez que le calendrier n'est pas sur `manual` (étape 6). |
| Le ZIP ne s'ouvre pas | Utilisez « Mes fichiers » → appui long sur le ZIP → **Extraire**. |
