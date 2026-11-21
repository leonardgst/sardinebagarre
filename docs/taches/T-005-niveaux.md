# T-005 — Calculer le niveau suivant et tirer la configuration d'un niveau

| Champ | Valeur |
|---|---|
| Statut | terminée (en relecture) |
| Étape du plan | 1.4 |
| Branche | `t-005-niveaux` (créée depuis `main` **après la fusion de T-004**, qui ajoute le type `Outcome`) |
| Estimation | S (< 1 h) |
| Planifiée par | Opus — 2026-11-21 |
| Implémentée par | codeur (Sonnet) |

## Objectif
`src/logic/levels.ts` fournit `pickEntry` (tirage uniforme d'une des 10 entrées d'un niveau), `appendHistory` (file des 5 dernières parties) et `nextLevel` (port exact de `CalcNextLevel`, spec §6.2), et les 17 vecteurs N1..N17 passent.

## Règles concernées
- §3 — au lancement d'une partie, on tire **uniformément** une des 10 entrées du niveau (1/10 chacune).
- `R-60` — historique = 5 dernières parties terminées (file circulaire) : issue, `cardsFlipped`, niveau joué.
- `R-61` — historique vide → niveau 1.
- §6.2 — pseudo-code de `niveauSuivant` (**fait foi**, port exact).
- `R-62` — victoire au niveau L ≤ 7 → min(L + 1, 7) ; victoire au niveau 8 → 8.
- `R-63` — défaite ou abandon → max(1, min(L, k, 7)).
- `R-64` — série : dernière partie au niveau ≥ 5 et 5 parties dans l'historique, toutes avec k ≥ 8 et issue ≠ LOST → 8.
- `R-65` — le niveau 8 n'est jamais atteint par une simple victoire au niveau 7.
- §6.3 — vecteurs N1..N17 (obligatoires, dans `tests/logic/levels.test.ts`).
- `CL-01`, `CL-02`, `CL-03`, `CL-04`, `CL-15`, `CL-16`, `CL-17` (colonne « niveau suivant »).
- ADR-006 — `src/logic/` pur ; le hasard est injecté.

## Périmètre
**Inclus**
- `src/logic/types.ts` (modifier) : ajouter
  ```ts
  /** Une partie terminée, telle que gardée dans l'historique (R-60). */
  interface RoundRecord {
    readonly outcome: Outcome;
    readonly cardsFlipped: number; // k : cartes chiffrées retournées (1 compris)
    readonly level: Level;
  }
  ```
- `src/logic/levels.ts` (créer) :
  - `export const HISTORY_SIZE = 5;`
  - `pickEntry(level: Level, rng: Rng): ConfigEntry` — `entriesForLevel(level)[Math.floor(rng() * 10)]` (utiliser la longueur de la liste, pas `10` en dur) ; un seul appel à `rng()`.
  - `appendHistory(history: readonly RoundRecord[], record: RoundRecord): readonly RoundRecord[]` — ajoute à la fin (ordre **ancien → récent**), garde les `HISTORY_SIZE` dernières, renvoie un tableau neuf **gelé** (le record aussi), ne modifie pas l'entrée.
  - `nextLevel(history: readonly RoundRecord[]): Level` — port **littéral** du pseudo-code §6.2, dans le même ordre (règle du 8 par victoire, puis série, puis boucle `n = 7 … 2`, puis 1). Historique vide → 1 (R-61). Si l'historique contient plus de 5 parties, ne considérer que les 5 dernières.
- `tests/logic/levels.test.ts` (créer) : voir « Tests à écrire ». Un petit helper local `r(outcome, k, level)` qui construit un `RoundRecord` est bienvenu.

**Exclu** (ne pas faire dans cette tâche)
- Message de changement de niveau R-66 (texte et « une seule fois par session ») : interface, phase 2.
- Enchaînement des parties, encaissement, « Quitter la table » R-67, partie interrompue R-68 : étape 1.5 (`game.ts`).
- Validation d'un historique lu dans une sauvegarde (k hors bornes, niveau invalide) : `save.ts`, étape 1.5.
- Aucune modification de `round.ts`, `board.ts`, `configs.ts`, `rng.ts`, de la spec, de `.claude/`, `.github/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/logic/types.ts` | modifier (`RoundRecord`) |
| `src/logic/levels.ts` | créer |
| `tests/logic/levels.test.ts` | créer |
| `docs/taches/T-005-niveaux.md` | compléter (Compte rendu) |
| `docs/journal.md` | mettre à jour (index + historique) |

## Tests à écrire
Notation : `(issue, k, L)`, historique de l'**ancien** au **récent**.

**Vecteurs de la spec §6.3** — un test par ligne, nommé `N<i> …` (par exemple `it('N6 défaite au niveau 8 après 9 cartes → 7')`), ou un `it.each` dont le titre contient l'identifiant `N<i>` :

| # | Historique | Attendu |
|---|---|---|
| N1 | (QUIT, 0, 1) | 1 |
| N2 | (QUIT, 0, 6) | 1 |
| N3 | (LOST, 1, 4) | 1 |
| N4 | (LOST, 2, 4) | 2 |
| N5 | (LOST, 3, 8) | 3 |
| N6 | (LOST, 9, 8) | 7 |
| N7 | (QUIT, 9, 8) | 7 |
| N8 | (WON, 6, 7) | 7 |
| N9 | (WON, 5, 3) | 4 |
| N10 | (WON, 12, 8) | 8 |
| N11 | (WON,8,1) (WON,8,2) (WON,8,3) (WON,8,4) (WON,8,5) | 8 |
| N12 | (WON,8,1) (WON,8,2) (WON,8,3) (WON,8,4) (QUIT,8,5) | 8 |
| N13 | (WON,8,1) (WON,8,2) (WON,8,3) (WON,7,4) (WON,9,5) | 6 |
| N14 | 5 × (QUIT, 8, 2) | 2 |
| N15 | (WON,8,4) (WON,8,5) (WON,8,6) (WON,8,7) (LOST,9,7) | 7 |
| N16 | (LOST, 5, 5) | 5 |
| N17 | (LOST, 0, 1) | 1 |

**Autres tests de `nextLevel`**
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-61 historique vide → niveau 1` | `[]` | `1` |
| `CL-01 abandon sans carte au niveau 6 → 1` | `[(QUIT,0,6)]` | `1` |
| `CL-02 Sardine au premier retournement → 1` | `[(LOST,0,5)]` | `1` |
| `CL-03 niveau 4, deux 1 puis Sardine → 2` | `[(LOST,2,4)]` | `2` |
| `CL-04 un seul 1 puis Sardine → 1` | `[(LOST,1,6)]` | `1` |
| `CL-15 R-65 victoire au niveau 7 → 7, jamais 8` | `[(WON,k,7)]` pour k = 5, 8, 12 | `7` dans les 3 cas |
| `CL-16 défaite au niveau 8 après 10 cartes → 7` | `[(LOST,10,8)]` | `7` |
| `CL-17 R-64 série de 5 parties ≥ 8 cartes sans défaite, la dernière au niveau 5 → 8` | `(QUIT,8,3) (WON,9,4) (QUIT,10,2) (WON,8,4) (QUIT,8,5)` | `8` |
| `R-64 série incomplète : 4 parties seulement → pas de 8` | `(WON,8,5) (WON,8,5) (WON,8,5) (WON,8,5)` | `6` |
| `R-64 une défaite dans la série la casse, même ancienne` | `(LOST,8,5) (WON,8,5) (WON,8,5) (WON,8,5) (QUIT,8,6)` | `6` |
| `R-64 une partie à 7 cartes dans la série la casse` | `(WON,7,5) (WON,8,5) (WON,8,5) (WON,8,5) (QUIT,9,6)` | `6` |
| `R-64 série valide mais dernière partie au niveau 4 → pas de 8` | `(WON,8,5) (WON,8,6) (WON,8,7) (WON,8,5) (QUIT,9,4)` | `4` |
| `R-60 au-delà de 5 parties, seules les 5 dernières comptent` | `(LOST,0,1)` suivi des 5 parties de N11 (6 parties) | `8` |
| `R-62 R-63 accord du pseudo-code avec les formules simples (une seule partie)` | pour chaque L de 1 à 8, k de 0 à 24, issue WON/LOST/QUIT : `[(o,k,L)]` | WON : `L === 8 ? 8 : min(L + 1, 7)` ; LOST/QUIT : `max(1, min(L, k, 7))`. Formules recalculées **dans le test**, pas avec `nextLevel`. 600 cas. |

Vérification des vecteurs ajoutés (faite par Opus avec le pseudo-code) :
- série incomplète : pas de série (4 parties) ; d = (WON,8,5) → n = 6 par « L ≥ n − 1 et WON » → 6.
- défaite ancienne : série cassée ; d = (QUIT,8,6) → n = 6 par « L ≥ 6 et k ≥ 6 » → 6.
- 7 cartes : série cassée ; d = (QUIT,9,6) → 6.
- dernier niveau 4 : pas de série (L < 5) ; d = (QUIT,9,4) → n = 4 → 4.
- CL-17 : la série s'applique (toutes k ≥ 8, aucune défaite, d.L = 5) → 8.

**`appendHistory`**
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-60 ajouter à un historique vide` | `[]` + `(WON,3,1)` | `[(WON,3,1)]` |
| `R-60 l'historique garde les 5 parties les plus récentes, de l'ancienne à la récente` | 7 ajouts successifs avec k = 0 à 6 | k = `[2, 3, 4, 5, 6]` |
| `R-60 appendHistory ne modifie pas l'historique reçu et renvoie un tableau gelé` | historique gelé de 5 + un ajout | l'entrée est inchangée (`toEqual` copie) ; résultat `Object.isFrozen`, ses éléments aussi |

**`pickEntry`**
| Nom du test | Entrée | Attendu |
|---|---|---|
| `§3 pickEntry renvoie une entrée du niveau demandé` | niveaux 1 à 8, `mulberry32(42)`, 100 tirages chacun | `entry.level === level` à chaque fois |
| `§3 pickEntry : bornes du hasard` | `rng = () => 0` puis `rng = () => 0.999999` | 1ʳᵉ puis 10ᵉ entrée de `entriesForLevel(level)` (`toBe`) |
| `§3 pickEntry consomme un seul nombre aléatoire` | rng espion qui compte ses appels | 1 appel |
| `§3 pickEntry est déterministe pour une graine donnée` | deux `mulberry32(7)`, 20 tirages au niveau 4 | mêmes suites |
| `§3 pickEntry tire les 10 entrées uniformément` | pour chaque niveau, `mulberry32(1000 + level)`, 10 000 tirages | chaque entrée tirée entre 8 % et 12 % des fois (800 à 1 200) |

## Critères d'acceptation
- [x] `npm run check` → code 0 ; tous les tests précédents passent toujours.
- [x] `npx vitest run tests/logic/levels.test.ts` → tous verts, en moins de 2 s.
- [x] Les 17 vecteurs N1..N17 existent, chacun avec son identifiant dans le titre (`grep -c "N1[0-7]\|N[1-9]"` ou lecture du rapport Vitest).
- [x] Contre-épreuves (notées dans le compte rendu) : (a) supprimer la condition `d.L >= 5` de la série → `R-64 … niveau 4` rouge ; (b) remplacer `k >= 8` par `k > 8` → N11, N12 ou CL-17 rouge ; (c) faire monter une victoire au niveau 7 vers 8 → CL-15 et N8 rouges ; (d) prendre la **première** partie de l'historique au lieu de la dernière → N13 ou N15 rouge.
- [x] `git status` avant commit : uniquement les fichiers du tableau « Fichiers ».

## Pièges connus
- **Ordre de l'historique** : ancien → récent ; la « dernière partie » `d` est `history[history.length - 1]`.
- Le pseudo-code fait foi : le **porter tel quel** (même ordre des tests), ne pas le « simplifier » en R-62/R-63 ; le test d'accord vérifie que les deux formulations coïncident.
- La série exige **exactement 5 parties** dans l'historique (`history.length >= 5`, en ne regardant que les 5 dernières) ; les abandons comptent, seule une défaite casse la série ; les niveaux des 4 premières parties n'ont pas d'importance.
- Une victoire au niveau 7 donne 7 (la boucle commence à `n = 7`).
- `nextLevel` renvoie le type `Level` : la boucle produit un `number`, le convertir proprement (`n as Level` après la garantie 2 ≤ n ≤ 7) sans `any`.
- `pickEntry` : `Math.floor(rng() * entries.length)` ; `rng()` est dans [0, 1), donc l'indice est toujours valide. Pas de `Math.random`.
- Le test d'uniformité doit utiliser une graine fixe (déterministe), jamais un hasard non injecté.
- Identifiants en anglais ; commentaires et noms de tests en français.

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
Fait : `RoundRecord` dans `types.ts` ; `levels.ts` (`HISTORY_SIZE`, `pickEntry`, `appendHistory`, `nextLevel` en port littéral de §6.2) ; 41 tests dans `tests/logic/levels.test.ts` (N1..N17, CL-01..04, CL-15..17, R-60..R-65, pickEntry). `npm run check` OK (292 tests).
Contre-épreuves : (a) sans `L >= 5` → N14 et « série valide mais niveau 4 » rouges ; (b) `k > 8` → N11, N12, CL-17 rouges ; (c) victoire au niveau 7 → 8 : N8, CL-15, test d'accord rouges ; (d) première partie au lieu de la dernière → N11, N12, N13, N15, CL-17 rouges.
Écarts : aucun (code et tests écrits ensemble, contre-épreuves faites après). Aucune question.

## Relecture
_(verdict du relecteur, avec la date)_
