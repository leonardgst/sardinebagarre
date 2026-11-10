# T-003 — Générer les plateaux et calculer les indicateurs

| Champ | Valeur |
|---|---|
| Statut | implémentée |
| Étape du plan | 1.2 (+ 2 corrections issues de la relecture de T-002) |
| Branche | `t-003-generation-plateaux` |
| Estimation | M (1–3 h) |
| Planifiée par | Opus — 2026-11-10 |
| Implémentée par | codeur (Sonnet) |

## Objectif
`generateBoard(entry, rng)` produit, pour n'importe laquelle des 80 entrées de configuration, un plateau 5 × 5 immuable aux comptes exacts, qui respecte les contraintes de multiplicateurs gratuits, avec ses indicateurs de ligne et de colonne, de façon déterministe pour une graine donnée.

## Règles concernées
- `R-01` — 25 cartes, `id = ligne × 5 + colonne` (ligne 0 en haut, colonne 0 à gauche).
- `R-02` — indicateur par ligne et par colonne : **somme** des valeurs (Sardine = 0) et **nombre de Sardines**.
- `R-03` — indicateurs calculés une fois, à la génération.
- `R-20` — entrée : une configuration et un `rng: () => number` injecté.
- `R-21` — algorithme : tout à 1 ; placer S, puis les 2, puis les 3 sur des cases à 1 choisies uniformément ; multiplicateur **gratuit** si sa ligne **ou** sa colonne a 0 Sardine ; accepter si total gratuits `<` MaxT **et** chaque ligne et chaque colonne `<` MaxLC (strictement) ; sinon recommencer, jusqu'à 1 000 tentatives ; après 1 000 échecs, garder le dernier plateau.
- `R-22` / ADR-010 — placement par mélange de Fisher-Yates : comptes toujours exacts.
- `R-23` — acceptation en 1 à 3 tentatives en moyenne, jamais de repli (propriété à retrouver).
- `R-24` — plateau immuable ; l'état de partie (retournées, mémo) est stocké ailleurs (étape 1.3).
- §15.2 — test de propriété : **1 000 plateaux par entrée**, graines fixes → comptes exacts, contraintes R-21.5, indicateurs = sommes recalculées. (Le plan disait 200 ; la spec fait foi, §0.)
- ADR-006 — `src/logic/` pur.

## Périmètre
**Inclus**
- `src/logic/types.ts` : ajouter
  - `interface LineHint { readonly sum: number; readonly sardines: number }` ;
  - `interface Board { readonly cells: readonly CardValue[]; readonly rowHints: readonly LineHint[]; readonly colHints: readonly LineHint[] }` (`cells` : 25 valeurs, index = id R-01 ; 5 indicateurs de ligne, 5 de colonne) ;
  - `interface FreeMultipliers { readonly total: number; readonly perRow: readonly number[]; readonly perCol: readonly number[] }`.
- `src/logic/board.ts` :
  - `export const MAX_ATTEMPTS = 1000` ;
  - `createBoard(cells: readonly CardValue[]): Board` — calcule les indicateurs (R-02), gèle le plateau, `cells`, `rowHints`, `colHints` et chaque `LineHint` (R-24) ; lève une `Error` (message en français) si `cells.length !== 25` ;
  - `countFreeMultipliers(cells: readonly CardValue[]): FreeMultipliers` (R-21.3–4) ;
  - `isAccepted(free: FreeMultipliers, entry: ConfigEntry): boolean` (R-21.5, comparaisons **strictes**) ;
  - `placeCards(entry: ConfigEntry, rng: Rng): CardValue[]` — **une** tentative, sans filtre : mélange de Fisher-Yates des 25 positions (`j = Math.floor(rng() * (i + 1))`), puis les `sardines` premières positions reçoivent `'S'`, les `twos` suivantes `2`, les `threes` suivantes `3`, le reste `1` (R-21.1–2, R-22) ;
  - `generateBoardDetailed(entry, rng): { board: Board; attempts: number; accepted: boolean }` — boucle R-21 (au plus `MAX_ATTEMPTS`), repli R-21.6 ;
  - `generateBoard(entry, rng): Board` — `generateBoardDetailed(entry, rng).board`.
- `tests/logic/helpers.ts` : `boardFromRows(rows: readonly string[]): Board` — 5 chaînes de 5 symboles séparés par des espaces (`'S 1 2 1 1'`), via `createBoard` ; lève une erreur sur une entrée mal formée. Réutilisé à l'étape 1.3.
- `tests/logic/board.test.ts` : voir « Tests à écrire ».
- **Correction relecture T-002 n° 1** — `tests/logic/configs.test.ts`, test `R-11 la table est gelée` : vérifier `Object.isFrozen` sur **les 80 entrées** (`CONFIGS.every(...)`), plus le tableau.
- **Correction relecture T-002 n° 2** — `tests/architecture.test.ts` : le test `ADR-006 aucun fichier de src/logic/ n'utilise d'API interdite` doit d'abord exiger que la liste des fichiers `.ts` de `src/logic/` **ne soit pas vide** (`expect(fichiers.length).toBeGreaterThan(0)`), pour ne jamais passer sans rien vérifier.

**Exclu** (ne pas faire dans cette tâche)
- État de partie (retourner, mémo, gains) : étape 1.3. Choix de l'entrée selon le niveau (`pickEntry`) : étape 1.4.
- Toute interface (`src/ui/`), paramètres `?seed=`/`debug`.
- Aucune modification de `configs.ts`, `rng.ts`, de la spec, de `.claude/`, `.github/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/logic/types.ts` | modifier (3 types ajoutés) |
| `src/logic/board.ts` | créer |
| `tests/logic/helpers.ts` | créer |
| `tests/logic/board.test.ts` | créer |
| `tests/logic/configs.test.ts` | modifier (correction n° 1) |
| `tests/architecture.test.ts` | modifier (correction n° 2) |
| `docs/taches/T-003-generation-plateaux.md` | compléter (Compte rendu) |
| `docs/journal.md` | mettre à jour (index + historique) |

## Tests à écrire
**Plateau construit à la main** (utilisé par plusieurs tests ci-dessous), noté `PLATEAU_MAIN` :
```
S 1 2 1 1
1 3 1 1 S
2 1 1 1 1
1 1 S 1 3
1 2 1 S 1
```
Valeurs attendues (calculées à la main par Opus) :
- indicateurs de ligne (somme / Sardines) : `5/1, 6/1, 6/0, 6/1, 5/1` ;
- indicateurs de colonne : `5/1, 8/0, 5/1, 4/1, 6/1` ;
- multiplicateurs : (0,2)=2 pas gratuit (ligne 0 et colonne 2 ont une S) ; (1,1)=3 gratuit (colonne 1 sans S) ; (2,0)=2 gratuit (ligne 2 sans S) ; (3,4)=3 pas gratuit ; (4,1)=2 gratuit (colonne 1) ;
- gratuits : `total = 3`, `perRow = [0, 1, 1, 0, 1]`, `perCol = [1, 2, 0, 0, 0]`.

**`tests/logic/board.test.ts`**
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-01 R-02 indicateurs de ligne d'un plateau construit à la main` | `PLATEAU_MAIN` | `rowHints` = `[{5,1},{6,1},{6,0},{6,1},{5,1}]` (`sum`, `sardines`) |
| `R-02 indicateurs de colonne d'un plateau construit à la main` | `PLATEAU_MAIN` | `colHints` = `[{5,1},{8,0},{5,1},{4,1},{6,1}]` |
| `R-01 id = ligne × 5 + colonne` | `PLATEAU_MAIN` | `cells[0] = 'S'`, `cells[6] = 3`, `cells[10] = 2`, `cells[17] = 'S'`, `cells[24] = 1` |
| `R-21 multiplicateur gratuit si sa ligne OU sa colonne est sans Sardine` | `PLATEAU_MAIN` | `countFreeMultipliers` = `{ total: 3, perRow: [0,1,1,0,1], perCol: [1,2,0,0,0] }` |
| `R-21 accepté si strictement sous les deux maxima` | gratuits de `PLATEAU_MAIN`, MaxLC 3 / MaxT 4 | `true` |
| `R-21 refusé si une ligne ou colonne atteint MaxLC` | idem, MaxLC 2 / MaxT 4 | `false` (colonne 1 = 2, pas `< 2`) |
| `R-21 refusé si le total atteint MaxT` | idem, MaxLC 3 / MaxT 3 | `false` (total 3, pas `< 3`) |
| `R-24 un plateau est gelé` | `PLATEAU_MAIN` | `Object.isFrozen` vrai pour le plateau, `cells`, `rowHints`, `colHints` et chaque `LineHint` |
| `R-01 createBoard refuse un plateau qui n'a pas 25 cartes` | 24 cartes | lève une erreur |
| `R-22 placeCards place exactement S, 2, 3 et 1 selon l'entrée` | `CONFIGS[0]` (6 S, 3 « 2 », 1 « 3 »), `mulberry32(1)` | 6 `'S'`, 3 `2`, 1 `3`, 15 `1` |
| `R-21 R-22 placeCards : chaque case reçoit une Sardine avec la même probabilité` | `CONFIGS[0]`, `mulberry32(99)`, 10 000 appels | pour chacune des 25 cases, fréquence de `'S'` entre 21 % et 27 % (attendu 6/25 = 24 %) |
| `R-20 même graine → même plateau` | `CONFIGS[40]`, deux `mulberry32(2026)` | plateaux égaux (`toEqual`) |
| `R-20 graines différentes → plateaux différents` | `CONFIGS[40]`, graines 1 et 2 | `cells` différents |
| `R-21 accepté dès la 1re tentative quand aucune contrainte ne gêne` | entrée de test `{ level: 1, variant: 'A', sardines: 6, twos: 0, threes: 0, maxFreePerLine: 1, maxFreeTotal: 1 }` | `attempts = 1`, `accepted = true` |
| `R-21 repli après 1 000 tentatives : on garde le dernier plateau` | entrée impossible `{ level: 1, variant: 'A', sardines: 0, twos: 1, threes: 0, maxFreePerLine: 1, maxFreeTotal: 0 }`, `mulberry32(5)` | `attempts = 1000`, `accepted = false`, plateau avec exactement un `2` et 24 `1` |
| `§15.2 propriété : 1 000 plateaux par entrée, comptes exacts, contraintes et indicateurs` | pour chacune des 80 entrées `CONFIGS[i]`, graines `i × 1000 + k` (`k` = 0..999), `mulberry32` neuf par plateau | pour chaque plateau : `accepted = true` ; nombres de `'S'`, `2`, `3`, `1` = entrée (`1` = 25 − S − n2 − n3) ; `isAccepted(countFreeMultipliers(cells), entry)` vrai ; `rowHints`/`colHints` = sommes et comptes **recalculés dans le test** (code indépendant de `board.ts`) |
| `R-23 propriété : 1 à 3 tentatives en moyenne, jamais de repli` | les mêmes 80 000 plateaux | moyenne globale de `attempts` entre 1 et 3 ; aucun `accepted = false` ; le maximum observé est écrit dans le compte rendu (R-23 : 21 sur 240 000) |

(Les deux tests de propriété peuvent partager une seule boucle de génération, par exemple dans un `beforeAll`.)

**`tests/logic/configs.test.ts`** (correction n° 1)
| Nom du test | Attendu |
|---|---|
| `R-11 la table est gelée` | `Object.isFrozen(CONFIGS)` et `CONFIGS.every((e) => Object.isFrozen(e))` vrais |

**`tests/architecture.test.ts`** (correction n° 2)
| Nom du test | Attendu |
|---|---|
| `ADR-006 aucun fichier de src/logic/ n'utilise d'API interdite` | au moins 1 fichier `.ts` trouvé (aujourd'hui 4 : `types`, `configs`, `rng`, `board`), puis aucune violation |

## Critères d'acceptation
- [x] `npm run check` → code 0.
- [x] `npx vitest run tests/logic/board.test.ts` : les 17 tests ci-dessus passent, et la durée affichée pour ce fichier est **< 5 s**.
- [x] Contre-épreuve « strictement inférieur » : remplacer temporairement `<` par `<=` dans `isAccepted` → au moins les tests `R-21 refusé si …` échouent ; restaurer → vert.
- [x] Contre-épreuve « ligne OU colonne » : remplacer temporairement la condition de gratuité par « ligne ET colonne sans Sardine » → le test `R-21 multiplicateur gratuit …` échoue ; restaurer → vert.
- [x] Contre-épreuve correction n° 2 : renommer temporairement la constante du dossier de `tests/architecture.test.ts` vers un dossier inexistant → le test échoue ; restaurer → vert.
- [x] Le compte rendu indique le nombre moyen et maximal de tentatives observés sur les 80 000 plateaux.
- [x] `git status` avant commit : uniquement les fichiers de la table « Fichiers ».

## Pièges connus
- **Gratuit = ligne OU colonne sans Sardine** (pas « et »). Un multiplicateur gratuit compte à la fois dans `perRow` de sa ligne et dans `perCol` de sa colonne.
- **Comparaisons strictes** : `total < maxFreeTotal` et chaque compte `< maxFreePerLine`. MaxLC peut être > MaxT (N3-C5 A, N4-C1 A : 4 / 3) : ne rien « corriger ».
- Ordre de placement : **S d'abord, puis 2, puis 3** (R-21.2). Avec le mélange, c'est l'ordre d'attribution des positions mélangées.
- Fisher-Yates : `for (let i = 24; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); … }` ; `rng()` est dans [0, 1), donc `j ≤ i`. Ne pas utiliser `sort(() => rng() - 0.5)` (biaisé).
- Le repli R-21.6 garde le **dernier** plateau généré, pas le premier.
- `placeCards` renvoie un tableau neuf modifiable ; seul `createBoard` gèle. Ne jamais muter un plateau existant.
- Recalcul des indicateurs dans le test de propriété : écrire un calcul **indépendant** dans le test (ne pas rappeler `createBoard`), sinon il ne prouve rien.
- Performance : 80 000 plateaux × ~2 tentatives restent rapides si la boucle n'alloue pas inutilement (pas de `createBoard` pour les tentatives refusées : compter les gratuits sur le tableau brut, ne créer le `Board` qu'à la fin). Si le fichier dépasse 5 s, le signaler plutôt que de réduire le nombre de plateaux.
- `tests/logic/helpers.ts` n'est pas un fichier `*.test.ts` : Biome autorise l'export, Vitest ne l'exécute pas.
- Identifiants en anglais, commentaires et noms de tests en français ; aucun `Math.random` (le test d'architecture le refuserait).

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
Plateaux (createBoard, countFreeMultipliers, isAccepted, placeCards, generateBoardDetailed, generateBoard) dans src/logic/board.ts, types ajoutés, helper boardFromRows, 17 tests de board, corrections n°1 et n°2 de la relecture de T-002. check OK (220 tests). Tentatives sur 80 000 plateaux : moyenne 1,472, maximum 24, aucun repli. Contre-épreuves faites (<=, ET, dossier inexistant). Écart : la boucle de propriété accumule les écarts dans une liste au lieu d un expect par plateau, pour tenir sous 5 s (fichier ~1,6 s).

## Relecture
_(verdict du relecteur, avec la date)_

**2026-11-10 — relecteur — 🟡 approuvé avec réserves** (aucun point bloquant).
Vérifié : `npm run check` (220 tests), `board.test.ts` 17/17 en 1,55 s ; algorithme R-21 et immuabilité R-24 conformes ; contre-épreuves `<=`, indicateurs faussés et mélange biaisé détectées.
Réserves importantes (trous dans les tests, prouvés par contre-épreuve : 17/17 restent verts) :
1. Le test du repli R-21.6 ne vérifie pas que c'est le **dernier** plateau qui est gardé.
2. Aucun test ne couvre un multiplicateur à la croisée d'une ligne **et** d'une colonne sans Sardine (doit compter une seule fois) ; la vérification des contraintes du test de propriété rappelle le code testé.
Mineures : liste d'écarts potentiellement énorme en cas d'échec ; `console.info` à chaque `npm run check`.
Maximum de 24 tentatives : cohérent statistiquement (p ≈ 5,9 % sur 80 000 plateaux ; entrée la plus contrainte N2 (7,3,2) B, p ≈ 0,35 par tentative) ; le « 21 » de R-23 est un maximum d'échantillon, pas une règle.

## Corrections après relecture
_Validées par l'humain le 2026-11-10. Même branche, un nouveau commit `fix(logic): corrections après relecture de T-003`. Ne rien changer d'autre (pas de modification de `src/logic/board.ts`, sauf si un nouveau test révèle un vrai défaut : le signaler alors dans le compte rendu)._

### C1 — Le repli garde bien le **dernier** plateau (R-21.6)
- Test `R-21 repli après 1 000 tentatives : on garde le dernier plateau` : en plus des vérifications actuelles, rejouer la même graine et comparer :
  `const rng = mulberry32(5); let dernier: CardValue[] = []; for (let k = 0; k < MAX_ATTEMPTS; k++) dernier = placeCards(entree, rng);` puis `expect(r.board.cells).toEqual(dernier)`.
- **Contre-épreuve** : faire garder temporairement le **premier** plateau dans `generateBoardDetailed` → ce test échoue ; restaurer → vert.

### C2 — Un multiplicateur gratuit par sa ligne **et** sa colonne compte une seule fois (R-21.4)
- Nouveau test `R-21 un multiplicateur à la croisée d'une ligne et d'une colonne sans Sardine compte une seule fois` : `PLATEAU_MAIN` avec la case (2,1) (id 11) mise à `2`, soit la ligne 2 = `2 2 1 1 1`. Attendu (recalculé par Opus) : `countFreeMultipliers` = `{ total: 4, perRow: [0, 1, 2, 0, 1], perCol: [1, 3, 0, 0, 0] }`.
- Test de propriété §15.2 : remplacer l'appel à `isAccepted(countFreeMultipliers(...))` par un **recalcul indépendant** dans le test (Sardines par ligne/colonne, gratuité « ligne OU colonne sans S », comptes par ligne, colonne et total, comparaisons strictes avec `maxFreePerLine` / `maxFreeTotal`), sans appeler `board.ts`.
- **Contre-épreuve** : dans `countFreeMultipliers`, remplacer temporairement `total++` par un double comptage (`total += (ligneSansS ? 1 : 0) + (colonneSansS ? 1 : 0)`) → le nouveau test **et** le test de propriété échouent ; restaurer → vert.

### C3 — Sortie des tests de propriété
- Si des écarts sont trouvés, n'afficher que les **20 premiers** (`problemes.slice(0, 20)`) en plus de leur nombre ; le test échoue si `problemes.length > 0`.
- Supprimer le `console.info` des statistiques de tentatives (les valeurs sont dans le compte rendu et dans R-23).

### C4 — Reformulation de R-23 (faite par Opus dans `docs/specification.md`)
- Rien à faire pour le codeur : inclure la modification de la spec dans le commit.

### Critère global
- `npm run check` → code 0, **221** tests (220 + 1) ; `npx vitest run tests/logic/board.test.ts` < 5 s ; `npm run check` n'affiche plus de statistiques de tentatives.
- `git status` avant commit : uniquement `tests/logic/board.test.ts`, `docs/specification.md`, la fiche et `docs/journal.md`.

### Compte rendu — Corrections après relecture
C1 (assertion sur le dernier plateau rejoué), C2 (nouveau test de la croisée ligne+colonne ; contraintes du test de propriété recalculées indépendamment), C3 (20 premiers écarts + nombre ; `console.info` supprimé), C4 (spec, par Opus). `src/logic/board.ts` inchangé. check OK, 221 tests, board.test.ts ~1,6 s. Tentatives sur 80 000 plateaux inchangées : moyenne 1,472, maximum 24.
Contre-épreuves : C1 (garder le premier plateau) → le test de repli échoue (et la propriété aussi, effet de bord de ma mutation) ; C2 (double comptage) → le nouveau test échoue. Écart : le test de propriété ne échoue PAS avec le double comptage, car celui-ci rend le code plus strict que le recalcul indépendant (les plateaux acceptés respectent encore les vraies contraintes, aucun repli n'apparaît). Le nouveau test ciblé suffit à détecter ce défaut.
