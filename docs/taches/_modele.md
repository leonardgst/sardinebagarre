# T-XXX — <Titre court à l'infinitif>

| Champ | Valeur |
|---|---|
| Statut | planifiée / en cours / en relecture / terminée |
| Étape du plan | ex. 1.3 |
| Branche | `t-xxx-slug` |
| Estimation | S (< 1 h) / M (1–3 h) / L (> 3 h : à découper) |
| Planifiée par | Opus — AAAA-MM-JJ |
| Implémentée par | codeur (Sonnet) |

## Objectif
Une phrase : ce qui sera vrai quand la tâche sera finie, du point de vue du joueur ou du code.

## Règles concernées
- `R-xx` — rappel en une ligne
- `CL-xx` — …

## Périmètre
**Inclus**
- …

**Exclu** (ne pas faire dans cette tâche)
- …

## Fichiers
| Fichier | Action |
|---|---|
| `src/logic/…` | créer / modifier |
| `tests/logic/…` | créer |

## Tests à écrire
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-63 défaite niveau 8 après 9 cartes → 7` | `[(LOST,9,8)]` | `7` |

## Critères d'acceptation
- [ ] `npm run check` passe
- [ ] Les tests listés ci-dessus existent et passent
- [ ] (UI) `npm run screens` : captures `…` conformes à la checklist de `controle-visuel`
- [ ] …

## Pièges connus
- …

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
_(rempli par le codeur à la fin : ce qui a été fait, commits, écarts)_

## Relecture
_(verdict du relecteur, avec la date)_
