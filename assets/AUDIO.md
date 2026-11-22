# Musique et effets sonores — origine et licence

**Aucun fichier audio externe n'est utilisé.** La musique de fond et les effets sonores sont **générés par calcul**
à chaque production (`render/audio/`) : oscillateurs, enveloppes, filtres et bruit, avec des progressions d'accords
courantes (non protégeables) et des mélodies tirées au sort à partir des notes de l'accord. Ils appartiennent au projet
et peuvent être utilisés dans des vidéos YouTube, y compris monétisées.

| Élément | Fichier source | Variantes |
|---|---|---|
| Musique | `render/audio/music.js` | 6 ambiances : curieux, joyeux, mystérieux, rêveur, dynamique, inspirant |
| Effets | `render/audio/sfx.js` | 16 effets : pop, click, whoosh, ding, boing, drumroll, rimshot, laugh (petit arpège), suspense, tick, heartbeat, reveal, soft, magic, rise, success |

La génération est **déterministe** : une même vidéo reçoit toujours la même musique (graine = identifiant du storyboard),
deux vidéos différentes reçoivent des variations différentes.

## Mixage (`render/audio/mix.js`)

- Musique à environ −10 dB sous la voix, **baissée automatiquement pendant la parole** (compression déclenchée par la voix).
- Effets joués au début de chaque scène selon le profil de la catégorie.
- Fondu d'entrée et de sortie, normalisation à **−14 LUFS** (niveau recommandé pour YouTube), crête ≤ −1,5 dB.

Mesures sur une vidéo de 30 s : −14,6 LUFS, crête −4,4 dB ; voix ≈ −18 dB, musique seule entre les phrases ≈ −31 dB.
