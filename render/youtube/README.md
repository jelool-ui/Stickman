# Publication YouTube — architecture préparée, DÉSACTIVÉE en version 1

La version 1 **ne publie rien automatiquement**. Les vidéos sont téléchargées depuis GitHub Actions puis publiées
à la main par vous. Ce dossier décrit comment l'intégration pourra être ajoutée plus tard, avec votre accord explicite.

## Principe (version future)

1. Créer un projet Google Cloud, activer **YouTube Data API v3** (quota gratuit limité : environ 10 000 unités/jour,
   un envoi de vidéo en consomme environ 1 600 — le quota n'est pas illimité).
2. Créer un identifiant **OAuth 2.0** (type « application de bureau ») et donner votre **consentement** une fois,
   depuis votre navigateur, pour obtenir un *refresh token*.
3. Stocker `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` et `YOUTUBE_REFRESH_TOKEN` dans les **secrets GitHub**
   (jamais dans le code).
4. `upload.js` enverrait `video.mp4` avec `metadata.json` (titre recommandé, description, mots-clés, catégorie),
   en statut **privé** par défaut pour relecture humaine avant publication.

## Garde-fous prévus

- Désactivé tant que `STICK_YOUTUBE_UPLOAD=enabled` n'est pas défini **et** que les trois secrets n'existent pas.
- Envoi uniquement des vidéos dont le contrôle qualité est `passed`.
- Statut privé par défaut ; une seule vidéo par exécution ; aucune nouvelle tentative automatique en boucle.
