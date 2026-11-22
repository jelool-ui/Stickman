# Modèles vocaux — licences et décisions

Vérification faite le **22 novembre 2026** à partir des fiches officielles (`MODEL_CARD`) du dépôt
[rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) et des pages des jeux de données.
Usage prévu : vidéos publiées sur YouTube, **y compris monétisées**. Un modèle n'est autorisé que si
toutes les licences de sa chaîne (jeu de données + modèle de base) le permettent.

| Modèle | Langue | Données | Modèle de base | Décision |
|---|---|---|---|---|
| **fr_FR-siwis-medium** | Français (France), 1 voix | [SIWIS](https://datashare.is.ed.ac.uk/handle/10283/2353) — CC BY 4.0 | Hi-Fi TTS lecteur 92 — CC BY 4.0 ([OpenSLR 109](https://www.openslr.org/109/)) | ✅ **Autorisé** (attribution) |
| fr_FR-mls-medium | Français, 125 voix | [MLS](https://www.openslr.org/94/) — CC BY 4.0 | aucun (entraîné de zéro) | ⛔ Licence compatible mais **qualité insuffisante** (voir ci-dessous) |
| fr_FR-gilles-low | Français | CC0 | en_US ryan — **CC BY-NC-SA 4.0** | ❌ Non commercial |
| fr_FR-mls_1840-low | Français | CC BY 4.0 | en_US ryan — **CC BY-NC-SA 4.0** | ❌ Non commercial |
| fr_FR-upmc-medium | Français | CC BY-SA 4.0 | en_US lessac — licence Blizzard 2013 restrictive | ❌ Exclu |
| fr_FR-tom-medium | Français | — | — | ❌ AGPLv3, statut incertain pour un audio diffusé |

## Attribution obligatoire (CC BY 4.0)

À placer dans la description des vidéos (fait automatiquement par le module SEO en Phase 6) :

> Voix de synthèse : Piper, modèle fr_FR-siwis-medium (données SIWIS, CC BY 4.0).

## Qualité mesurée

Test : 12 répliques réelles des scénarios, synthétisées puis retranscrites par une reconnaissance vocale
automatique (Vosk, modèle français léger). Le taux d'erreur mesure l'intelligibilité.

| Voix | Taux d'erreur |
|---|---|
| fr_FR-siwis-medium | **3 %** |
| siwis, hauteur ×0,80 (personnage principal) | 3 % |
| siwis, hauteur ×0,72 (secondaire masculin) | 5 % |
| siwis, hauteur ×1,12 | 5 % |
| fr_FR-mls-medium (4 locuteurs testés) | 66 à 122 % (phrases courtes incompréhensibles) |
| eSpeak NG (secours) | 50 % (voix robotique) |

Vidéo complète de test (37 s, 99 mots) : 10 % d'erreurs, dont 3 dues à « POV » lu « point de vue », et
**100 % des mots entendus pendant leur créneau prévu** (synchronisation voix ↔ sous-titres).

## Profils

Tous les personnages utilisent la même voix de base, de bonne qualité, avec une hauteur et un débit différents :

| Profil | Hauteur | Vitesse |
|---|---|---|
| Narrateur | 0,92 | 1,00 |
| Personnage principal | 0,80 | 1,05 |
| Secondaire masculin | 0,72 | 0,98 |
| Secondaire féminin | 1,08 | 1,02 |

## Voix déterministe

Par défaut, Piper ajoute une petite variation aléatoire : deux synthèses d'une même phrase donnent des fichiers
différents. Le studio désactive cette variation (`--noise-scale 0 --noise-w-scale 0`) pour que **la même vidéo ait
toujours exactement la même voix**. Intelligibilité mesurée identique dans les trois réglages testés (2 % d'erreurs).

## Logiciels

- **Piper** 1.8 (`pip install piper-tts`), licence GPL-3.0 : le logiciel est exécuté, il n'est pas redistribué ; l'audio produit n'est pas soumis à la GPL.
- **eSpeak NG** 1.51 (`apt-get install espeak-ng`), GPL-3.0, même remarque. Voix par règles, sans données enregistrées.
- Fournisseur externe facultatif : **aucun configuré**. Les services gratuits connus imposent une clé et un quota ; ils ne sont pas nécessaires.

## Installation

```bash
pip install piper-tts
node scripts/setup-voices.js   # télécharge les modèles autorisés et vérifie leur empreinte SHA-256
```
