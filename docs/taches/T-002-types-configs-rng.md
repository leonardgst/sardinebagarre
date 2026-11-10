# T-002 — Créer les types de base, la table des configurations et le hasard à graine

| Champ | Valeur |
|---|---|
| Statut | à relire |
| Étape du plan | 1.1 |
| Branche | `t-002-types-configs-rng` |
| Estimation | S (< 1 h) |
| Planifiée par | Opus — 2026-11-10 |
| Implémentée par | codeur (Sonnet) |

## Objectif
`src/logic/` contient la table exacte des 80 entrées de configuration de la spec §3, interrogeable par niveau, et un générateur pseudo-aléatoire déterministe `mulberry32(seed)`, le tout pur et testé.

## Règles concernées
- §3 — 8 niveaux × 5 configurations × 2 variantes (A, B) = 80 entrées ; tirage uniforme parmi les 10 entrées d'un niveau (le tirage lui-même est l'étape 1.4).
- `R-10` — gain max = 2^(nombre de 2) × 3^(nombre de 3), toujours ≤ 3 456.
- `R-11` — la table de la spec §3 est la **seule** source des configurations dans le code (`src/logic/configs.ts`) ; un test vérifie chaque ligne.
- `R-20` — le hasard est injecté (`rng: () => number` dans [0, 1)) pour rendre les tests déterministes.
- §1 — la carte-bombe s'écrit `'S'` dans le code : `CardValue = 1 | 2 | 3 | 'S'`.
- Architecture (ADR-006, CLAUDE.md) — `src/logic/` pur : pas de `Math.random`, `Date.now`, `window`, etc. ; objets en lecture seule.

## Périmètre
**Inclus**
- `src/logic/types.ts` :
  - `type CardValue = 1 | 2 | 3 | 'S'` ;
  - `type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8` ;
  - `type Variant = 'A' | 'B'` ;
  - `type Rng = () => number` (valeur dans [0, 1)) ;
  - `interface ConfigEntry` (toutes propriétés `readonly`) : `level: Level`, `variant: Variant`, `sardines: number` (colonne « Voltorbes »), `twos: number`, `threes: number`, `maxFreePerLine: number` (MaxLC, **exclu**), `maxFreeTotal: number` (MaxT, **exclu**). Commentaire en français qui rappelle que ces deux maxima sont **exclus** (acceptation si compte < max, §4).
- `src/logic/configs.ts` :
  - `export const CONFIGS: readonly ConfigEntry[]` : 80 entrées, dans l'ordre de la table §3 (niveau croissant, puis configuration dans l'ordre de la table), **variante A puis variante B** pour chaque configuration. Valeurs écrites en dur (pas de génération par calcul), tableau et objets gelés (`Object.freeze`) ;
  - `export function entriesForLevel(level: Level): readonly ConfigEntry[]` : les 10 entrées du niveau, dans l'ordre de `CONFIGS` ;
  - `export function maxPayout(entry: ConfigEntry): number` : `2 ** twos * 3 ** threes` (R-10).
- `src/logic/rng.ts` : `export function mulberry32(seed: number): Rng`, implémentation standard (graine normalisée en entier 32 bits non signé avec `>>> 0`, état propre à chaque générateur, `Math.imul`).
  ```ts
  // Référence (algorithme mulberry32 standard) :
  // a = (a + 0x6D2B79F5) | 0; t = Math.imul(a ^ (a >>> 15), 1 | a);
  // t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  ```
- Tests : `tests/logic/configs.test.ts`, `tests/logic/rng.test.ts`.

**Exclu** (ne pas faire dans cette tâche)
- `Board`, `Card`, `RoundState`, `GameState`, `Outcome` et tout autre type : ils arrivent avec les tâches qui les utilisent (1.2, 1.3, 1.5).
- `pickEntry` / tirage d'une entrée (étape 1.4), génération de plateau (1.2).
- `src/ui/seed.ts` (graine via `crypto.getRandomValues`) : étape de l'interface.
- Aucune modification de `src/ui/`, des configurations d'outils, de `.claude/`, `.github/` ni de la spec.

## Fichiers
| Fichier | Action |
|---|---|
| `src/logic/types.ts` | créer |
| `src/logic/configs.ts` | créer |
| `src/logic/rng.ts` | créer |
| `tests/logic/configs.test.ts` | créer |
| `tests/logic/rng.test.ts` | créer |
| `docs/taches/T-002-types-configs-rng.md` | compléter (Compte rendu) |
| `docs/journal.md` | mettre à jour (index + historique) |

## Tests à écrire
**Principe clé** : `tests/logic/configs.test.ts` contient sa **propre copie** de la table, recopiée **directement depuis `docs/specification.md` §3** (pas depuis `configs.ts`), sous forme de 40 lignes `[niveau, S, n2, n3, nb1, gainMax, aMaxLC, aMaxT, bMaxLC, bMaxT]`. Deux transcriptions indépendantes : une erreur de recopie dans l'une fait échouer le test.

**`tests/logic/configs.test.ts`**
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-11 la table contient 80 entrées (40 configurations × variantes A et B)` | `CONFIGS` | longueur 80 ; 40 entrées `A`, 40 entrées `B` |
| `R-11 chaque niveau de 1 à 8 a exactement 10 entrées` | `entriesForLevel(1..8)` | 10 chacune, toutes avec le bon `level` |
| `R-11 niveau <n>, configuration <k>, variante <v> conforme à la spec` (`it.each`, 80 cas) | entrée `CONFIGS[i]` et ligne attendue | `sardines`, `twos`, `threes`, `maxFreePerLine`, `maxFreeTotal`, `level`, `variant` égaux à la table de la spec |
| `R-10 niveau <n>, configuration <k> : gain max = 2^n2 × 3^n3 = <gainMax>` (`it.each`, 40 cas) | entrée A de chaque configuration | `maxPayout(entry)` égal à la colonne « Gain max » (ex. N1-C1 → 24, N8-C5 → 3456) |
| `§3 niveau <n>, configuration <k> : 25 − S − n2 − n3 = <nb1> cartes à 1` (`it.each`, 40 cas) | entrée A | égal à la colonne « 1 (déduit) » (ex. N1-C1 → 15, N7-C4 → 2) |
| `R-10 le gain max ne dépasse jamais 3 456` | toutes les entrées | max de `maxPayout` = 3456 exactement |
| `R-11 les variantes A et B d'une configuration ont les mêmes comptes` | paires consécutives | mêmes `level`, `sardines`, `twos`, `threes` |
| `R-11 la table est gelée` | `CONFIGS`, `CONFIGS[0]` | `Object.isFrozen` vrai pour les deux |

Points de contrôle de la spec à retrouver (pièges de recopie) : N3-C5 A = `4 / 3` et N4-C1 A = `4 / 3` (MaxLC > MaxT : **à recopier tel quel**) ; N2-C1 B = `2 / 2` ; N7-C3 et N7-C4 ont **13** Sardines ; N4 mélange 8 et 10 Sardines.

**`tests/logic/rng.test.ts`**
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-20 mulberry32 : vecteur de référence pour la graine 42` | `mulberry32(42)`, 5 tirages | `0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693, 0.17481389874592423` (égalité exacte) |
| `R-20 mulberry32 : vecteur de référence pour la graine 0` | `mulberry32(0)`, 3 tirages | `0.26642920868471265, 0.0003297457005828619, 0.2232720274478197` |
| `R-20 mulberry32 : même graine → même suite` | deux générateurs graine 123, 100 tirages | suites identiques |
| `R-20 mulberry32 : graines différentes → suites différentes` | graines 1 et 2, 10 tirages | suites différentes |
| `R-20 mulberry32 : deux générateurs ne partagent pas d'état` | `a = mulberry32(7)`, `b = mulberry32(7)` ; 3 tirages sur `a`, puis 1 sur `b` | le tirage de `b` = le 1er tirage de `a` |
| `R-20 mulberry32 : 10 000 tirages dans [0, 1) et bien répartis` | graine 2026, 10 000 tirages | tous `>= 0` et `< 1` ; chaque dixième [0 ; 0,1), …, [0,9 ; 1) contient entre 9 % et 11 % des tirages |

## Critères d'acceptation
- [x] `npm run check` → code 0 (dont le test d'architecture, qui parcourt maintenant de vrais fichiers de `src/logic/`, et Biome sans erreur).
- [x] `npm test -- configs rng` : tous les tests listés existent et passent (8 tests nommés dans `configs.test.ts`, dont 160 cas `it.each` ; 6 dans `rng.test.ts`).
- [x] Contre-épreuve de la double transcription : changer temporairement `threes` de la 1re entrée de `CONFIGS` (1 → 2) → `npm test -- configs` échoue sur au moins 3 tests ; remettre la valeur → vert.
- [x] `grep -rnE "Math\.random|Date\.now|window|document|localStorage" src/logic` → aucun résultat.
- [x] `git status` avant commit : uniquement les fichiers de la table « Fichiers ».

## Pièges connus
- **Ne pas « corriger » la spec** : les couples `4 / 3` (MaxLC > MaxT) de N3-C5 A et N4-C1 A sont voulus (port de S1). En cas de doute sur une valeur, s'arrêter et l'écrire dans « Questions ».
- La table du skill `regles-voltorbataille` résume la même table : en cas de différence, `docs/specification.md` §3 fait foi (et signaler la différence).
- Recopier la table du test **depuis la spec**, pas depuis `configs.ts` : sinon le test ne prouve rien.
- `maxPayout` : utiliser `**` sur des entiers ; résultat exact (≤ 3 456, aucun problème de flottant).
- `mulberry32` : la normalisation `seed >>> 0` doit se faire **à la création** ; l'état vit dans la fermeture du générateur, jamais dans une variable de module (sinon deux générateurs se perturbent).
- Le test d'architecture et Biome refusent `Math.random`, `Date`, `crypto`, `globalThis`… dans `src/logic/` : `Math.imul` est autorisé.
- Comparer les flottants du vecteur de référence avec `toBe` (égalité exacte) : l'algorithme est entièrement entier jusqu'à la division finale.
- Identifiants en anglais (`sardines`, `twos`, `threes`) ; commentaires et noms de tests en français.

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
Fait : types.ts, configs.ts (80 entrées gelées, entriesForLevel, maxPayout), rng.ts (mulberry32) et leurs tests. La table du test est générée par script depuis la spec §3, indépendamment de configs.ts. Contre-épreuve (threes 1 → 2) : 4 tests échouent. Écart : aucun.

## Relecture
_(verdict du relecteur, avec la date)_
