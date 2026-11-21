# T-006 — Enchaîner les parties, encaisser et débloquer l'album

| Champ | Valeur |
|---|---|
| Statut | implémentée (relecture en attente) |
| Étape du plan | 1.5 (1ʳᵉ partie : `game.ts` et `album.ts` ; la sauvegarde `save.ts` sera T-007) |
| Branche | `t-006-enchainement-album` |
| Estimation | M (1–3 h) |
| Planifiée par | Opus — 2026-11-21 |
| Implémentée par | codeur (Sonnet) |

## Objectif
`src/logic/game.ts` et `src/logic/album.ts` gèrent, en fonctions pures, l'état durable du joueur (jetons, niveau, historique, records, album) : lancement d'une partie, finalisation (R-55), plafond de 50 000, quitter la table, vider la boîte, effacer la progression, et achat des photos dans l'ordre.

## Règles concernées
- `R-50` / `R-51` — WON ou QUIT : `coins = min(coins + payout, 50 000)` ; LOST : rien n'est ajouté.
- `R-53` / `CL-14` — au lancement, si `coins ≥ 50 000` : pas de partie.
- `R-55` / `CL-23` — finalisation dès que l'issue est connue : encaissement, ajout à l'historique, niveau suivant, records (la sauvegarde viendra avec T-007 ; l'interface l'appellera juste après).
- `R-60` / `R-61` — historique de 5 parties ; au premier lancement, niveau 1 et historique vide.
- `R-67` — « Quitter la table » : niveau 1, historique vidé.
- `R-68` / `CL-18` — une partie interrompue ne laisse aucune trace : l'état du joueur n'est modifié **que** par la finalisation.
- `R-70` / `R-71` — total initial 0 ; modifié uniquement par encaissement, achat d'album, « vider la boîte », « effacer toute la progression ».
- `R-72` + **ADR-017** — records : meilleur gain, niveau maximal **obtenu** (initial 1), parties jouées / gagnées / perdues / abandonnées, nombre de **montées** au niveau 8.
- **ADR-017** — « Effacer toute la progression » : jetons 0, niveau 1, historique vide, records à zéro, album vide (code secret, réglages et `welcomeSeen` ne sont pas dans `GameState` : T-007 les conservera).
- `R-110` / `R-111` / `R-112` / `R-116` — photos achetées dans l'ordre du pack ; `coins -= prix` si `coins ≥ prix` ; sinon refus et « Encore {manque} jetons » ; le plafond reste en vigueur.
- `CL-13` — total 49 990 + gain 48 → 50 000.
- ADR-006 — `src/logic/` pur, sans mutation, hasard injecté.

## Périmètre
**Inclus**
- `src/logic/types.ts` (modifier), ajouter :
  ```ts
  /** Records (R-72, ADR-017). */
  interface Stats {
    readonly bestPayout: number;    // plus grand payout d'une partie WON ou QUIT (0 au départ)
    readonly maxLevel: Level;       // plus haut niveau obtenu (1 au départ)
    readonly played: number;
    readonly won: number;
    readonly lost: number;
    readonly quit: number;
    readonly level8Reached: number; // passages d'un niveau < 8 au niveau 8
  }
  /** État durable du joueur (hors réglages, code secret et welcomeSeen : voir T-007). */
  interface GameState {
    readonly coins: number;
    readonly level: Level;
    readonly history: readonly RoundRecord[];
    readonly stats: Stats;
    readonly album: readonly string[]; // identifiants des photos débloquées, dans l'ordre d'achat
  }
  /** Une photo de l'album telle que décrite par le pack (R-110) ; la légende reste côté interface. */
  interface AlbumPhoto {
    readonly id: string;
    readonly price: number;
  }
  ```
- `src/logic/game.ts` (créer) :
  - `initialGame(): GameState` — `coins 0`, `level 1`, `history []`, `album []`, stats à zéro sauf `maxLevel: 1` (R-61, R-70). Gelé en profondeur (objet, `history`, `stats`, `album`).
  - `canStartRound(game): boolean` — `game.coins < COIN_CAP` (R-53).
  - `startRound(game, rng): { readonly entry: ConfigEntry; readonly round: RoundState } | null` — `null` si la boîte est pleine ; sinon `entry = pickEntry(game.level, rng)`, `round = newRound(generateBoard(entry, rng))` (dans cet ordre, avec le **même** `rng`). Ne modifie pas `game`.
  - `finalizeRound(game, round): GameState` — lève une `Error` (message en français) si `round.status === 'PLAYING'`. Sinon, dans l'ordre de R-55 :
    1. `coins` : WON/QUIT → `min(coins + round.payout, COIN_CAP)` ; LOST → inchangé ;
    2. `history = appendHistory(game.history, { outcome: round.status, cardsFlipped: round.cardsFlipped, level: game.level })` ;
    3. `level = nextLevel(history)` ;
    4. `stats` : `played + 1`, `won`/`lost`/`quit + 1` selon l'issue, `bestPayout = max(bestPayout, round.payout)` pour WON/QUIT, `maxLevel = max(maxLevel, level)`, `level8Reached + 1` si `game.level < 8 && level === 8`.
    Le niveau joué est `game.level` : entre `startRound` et `finalizeRound`, `game` ne change pas (R-68).
  - `leaveTable(game): GameState` — R-67 : `level 1`, `history []`, le reste inchangé.
  - `emptyBox(game): GameState` — R-53 : `coins 0`, le reste inchangé.
  - `resetProgress(game): GameState` — ADR-017 : équivaut à `initialGame()` (le paramètre est gardé pour la symétrie des appels ; le documenter).
  - Chaque état renvoyé est gelé (objet, `history`, `stats`, `album`) ; l'état reçu n'est jamais modifié.
- `src/logic/album.ts` (créer) :
  - `nextPhoto(photos: readonly AlbumPhoto[], album: readonly string[]): AlbumPhoto | null` — première photo de `photos` (ordre du pack) dont l'`id` n'est pas dans `album` (R-111). Les identifiants inconnus de `album` sont ignorés.
  - `missingCoins(game, photos): number` — `max(0, prix − coins)` pour la prochaine photo ; `0` s'il n'en reste aucune (R-112, texte « Encore {manque} jetons »).
  - `buyNextPhoto(game, photos): GameState` — si une prochaine photo existe et `coins ≥ prix` : `coins − prix`, `album` + id ; **sinon renvoie le même objet** (convention de refus de T-004).
- `tests/logic/game.test.ts` et `tests/logic/album.test.ts` (créer) : voir « Tests à écrire ».

**Exclu** (ne pas faire dans cette tâche)
- `save.ts` (sérialisation, validation, migration, réglages, `packCode`, `welcomeSeen`, CL-22) : **T-007**.
- Textes et messages (R-53, R-66, R-112) : interface, phase 2.
- Chargement du pack, légendes, prix par défaut R-115 : étape 3.3.
- Aucune modification de `round.ts`, `levels.ts`, `board.ts`, `configs.ts`, `rng.ts`, de la spec, des ADR, de `.claude/`, `.github/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/logic/types.ts` | modifier (`Stats`, `GameState`, `AlbumPhoto`) |
| `src/logic/game.ts` | créer |
| `src/logic/album.ts` | créer |
| `tests/logic/game.test.ts` | créer |
| `tests/logic/album.test.ts` | créer |
| `docs/taches/T-006-enchainement-album.md` | compléter (Compte rendu) |
| `docs/journal.md` | mettre à jour (historique) |

## Tests à écrire
**Helpers locaux** (dans les fichiers de test) :
- `game(overrides)` : `{ ...initialGame(), ...overrides }` (pas besoin de geler).
- `ended(status, payout, cardsFlipped)` : `{ ...newRound(boardFromRows(PLATEAU_MAIN)), status, payout, cardsFlipped }`. `finalizeRound` ne lit que `status`, `payout` et `cardsFlipped` ; ce raccourci évite de rejouer des parties.
- `r(outcome, k, level)` : un `RoundRecord`.

**`tests/logic/game.test.ts`**
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-61 R-70 état initial` | `initialGame()` | `coins 0`, `level 1`, `history []`, `album []`, stats `{ bestPayout 0, maxLevel 1, played 0, won 0, lost 0, quit 0, level8Reached 0 }` ; gelé (objet, `history`, `stats`, `album`) |
| `CL-23 R-55 victoire au niveau 3, gain 72, total 100 → 172, historique, niveau 4, records` | `game({ coins: 100, level: 3 })`, `ended('WON', 72, 5)` | `coins 172`, `history [(WON,5,3)]`, `level 4`, stats `played 1, won 1, bestPayout 72, maxLevel 4` |
| `R-51 défaite : rien n'est encaissé` | `game({ coins: 500, level: 4 })`, `ended('LOST', 0, 2)` | `coins 500`, `history [(LOST,2,4)]`, `level 2`, `lost 1`, `bestPayout 0` |
| `R-42 R-50 abandon : le gain est encaissé` | `game({ coins: 10, level: 2 })`, `ended('QUIT', 6, 3)` | `coins 16`, `history [(QUIT,3,2)]`, `level 2`, `quit 1`, `bestPayout 6` |
| `CL-01 abandon sans carte au niveau 6 → niveau 1, +0` | `game({ coins: 300, level: 6 })`, `ended('QUIT', 0, 0)` | `coins 300`, `level 1` |
| `CL-13 R-50 total 49 990 + gain 48 → 50 000` | `game({ coins: 49_990 })`, `ended('QUIT', 48, 3)` | `coins 50 000` |
| `R-55 finaliser une partie en cours est une erreur` | `ended('PLAYING', 6, 2)` | `toThrow(Error)` |
| `CL-17 R-55 le niveau suivant est calculé sur l'historique complété` | `game({ level: 5, history: [(WON,8,1),(WON,8,2),(WON,8,3),(WON,8,4)] })`, `ended('QUIT', 50, 8)` | `level 8`, `history.length 5`, `maxLevel 8`, `level8Reached 1` |
| `R-60 l'historique ne garde que 5 parties` | 6 finalisations successives de `ended('QUIT', 1, 1)` depuis `initialGame()` | `history.length 5` ; `played 6` |
| `ADR-017 niveau 8 atteint : seules les montées comptent` | suite de finalisations décrite ci-dessous | voir détail ci-dessous |
| `ADR-017 niveau maximal = plus haut niveau obtenu` | depuis `game({ level: 3 })` : `WON` (→ 4), puis `LOST` k = 0 (→ 1) | `maxLevel 4` après les deux, `level 1` |
| `R-72 meilleur gain : maximum des parties gagnées ou abandonnées` | `QUIT 30`, puis `WON 12`, puis `LOST 0` | `bestPayout 30` |
| `R-72 compteurs par issue` | une WON, deux LOST, une QUIT | `played 4, won 1, lost 2, quit 1` |
| `R-55 finalizeRound ne modifie pas l'état reçu et renvoie un état gelé` | `structuredClone` de l'entrée avant l'appel | entrée `toEqual` sa copie ; sortie gelée (objet, `history`, `stats`, `album`) |
| `R-53 CL-14 boîte pleine : pas de nouvelle partie` | `game({ coins: 50_000 })` | `canStartRound` faux ; `startRound(…, mulberry32(1))` → `null` |
| `R-53 à 49 999 jetons on peut encore jouer` | `game({ coins: 49_999 })` | `canStartRound` vrai ; `startRound` non nul |
| `§3 startRound tire une entrée du niveau courant et une partie neuve` | `game({ level: 6 })`, `mulberry32(3)` | `entry.level === 6` ; `round.status 'PLAYING'`, `payout 0`, aucune carte retournée |
| `§3 startRound est déterministe et suit pickEntry puis generateBoard` | `startRound(g, mulberry32(9))` comparé à `rng = mulberry32(9)` ; `e = pickEntry(6, rng)` ; `b = generateBoard(e, rng)` | même `entry` (`toBe`) et `round.board.cells` égal à `b.cells` |
| `CL-18 R-68 une partie interrompue ne laisse aucune trace` | `g = game({ coins: 1000, level: 5 })` ; `startRound`, plusieurs `flip` (gain > 0) ; on abandonne l'objet partie ; nouveau `startRound(g, …)` | `g` inchangé (`toEqual` sa copie) ; la nouvelle partie a `entry.level === 5` |
| `R-67 quitter la table : niveau 1 et historique vide` | `game({ coins: 700, level: 6, history: [(WON,6,5)], album: ['p1'] })` | `level 1`, `history []`, `coins 700`, `album ['p1']`, `stats` inchangés |
| `R-53 vider la boîte : jetons à 0, le reste inchangé` | `game({ coins: 50_000, level: 4, history: [(WON,5,3)], album: ['p1'] })` | `coins 0` ; `level`, `history`, `album`, `stats` inchangés |
| `ADR-017 effacer toute la progression` | état quelconque non initial | `toEqual(initialGame())` et gelé |

**Détail du test `ADR-017 niveau 8 atteint : seules les montées comptent`** (valeurs vérifiées par Opus avec le pseudo-code §6.2) :
1. `g1 = game({ level: 5, history: [(WON,8,1),(WON,8,2),(WON,8,3),(WON,8,4)] })` ; `finalizeRound(g1, ended('QUIT', 50, 8))` → `level 8`, `level8Reached 1`.
2. Sur ce résultat, `finalizeRound(…, ended('WON', 100, 9))` → reste `8` (victoire au niveau 8), `level8Reached` reste **1**.
3. Puis `finalizeRound(…, ended('LOST', 0, 9))` → `7` (N6), `level8Reached` reste 1.
4. Puis, au niveau 7, `finalizeRound(…, ended('QUIT', 10, 8))` → historique `(WON,8,4) (QUIT,8,5) (WON,9,8) (LOST,9,8) (QUIT,8,7)` : la défaite casse la série, `d = (QUIT,8,7)` → `7` ; `level8Reached` reste 1 ; `maxLevel` reste 8.
5. Remontée réelle, cas séparé : `game({ level: 7, history: [(WON,8,5),(WON,8,6),(WON,8,7),(QUIT,8,7)], stats: { ...initialGame().stats, level8Reached: 1, maxLevel: 8 } })` + `ended('QUIT', 20, 8)` → série valide (dernière partie au niveau 7 ≥ 5) → `8` ; `level8Reached` passe à **2**.

**`tests/logic/album.test.ts`** — `PHOTOS = [{ id: 'p1', price: 100 }, { id: 'p2', price: 200 }, { id: 'p3', price: 300 }]`
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-111 la prochaine photo suit l'ordre du pack` | album `[]`, `['p1']`, `['p1','p2']`, `['p1','p2','p3']` | `p1`, `p2`, `p3`, `null` |
| `R-111 les identifiants inconnus de l'album sont ignorés` | album `['zz']` | `p1` |
| `R-112 acheter débite le prix et ajoute la photo` | `coins 250`, album `[]` | `coins 150`, album `['p1']` |
| `R-112 acheter au prix exact` | `coins 100` | `coins 0`, album `['p1']` |
| `R-112 solde insuffisant : refus (même objet) et jetons manquants` | `coins 150`, album `['p1']` | `buyNextPhoto` renvoie l'objet reçu (`toBe`) ; `missingCoins === 50` |
| `R-112 missingCoins vaut 0 si on peut acheter ou s'il ne reste rien` | `coins 500` album `[]` ; album complet | `0` ; `0` |
| `R-111 album complet : plus rien à acheter` | album `['p1','p2','p3']`, `coins 10 000` | `buyNextPhoto` renvoie le même objet |
| `R-116 CL-14 acheter une photo débloque une boîte pleine` | `coins 50 000` | après achat : `coins 49 900`, `canStartRound` vrai |
| `R-112 trois achats successifs suivent l'ordre` | `coins 600`, 3 achats | album `['p1','p2','p3']`, `coins 0` |
| `R-112 buyNextPhoto ne modifie pas l'état reçu et renvoie un état gelé` | `structuredClone` avant | entrée inchangée ; sortie et `album` gelés |

## Critères d'acceptation
- [x] **TDD réel** (rappel de la relecture de T-005) : écrire d'abord les deux fichiers de tests, lancer `npx vitest run tests/logic/game.test.ts tests/logic/album.test.ts` et constater l'échec (rouge), **le noter dans le compte rendu**, puis écrire le code.
- [x] `npm run check` → code 0 ; tous les tests précédents (292) passent toujours.
- [x] Les tests listés existent avec ces noms (identifiant de règle en tête).
- [x] Contre-épreuves (notées dans le compte rendu) : (a) encaisser aussi les défaites → R-51 rouge ; (b) oublier le plafond → CL-13 rouge ; (c) calculer le niveau avant d'ajouter la partie à l'historique → CL-23 ou CL-17 rouge ; (d) compter `level8Reached` à chaque partie finie au niveau 8 → test ADR-017 niveau 8 rouge ; (e) `buyNextPhoto` qui renvoie une copie en cas de refus → R-112 solde insuffisant rouge.
- [x] `git status` avant commit : uniquement les fichiers du tableau « Fichiers » ; fichiers ajoutés un par un.

## Pièges connus
- L'ordre de R-55 compte : historique **puis** `nextLevel(history)` (sinon la série du niveau 8 et CL-23 sont faux).
- Le niveau joué enregistré dans l'historique est `game.level` (celui **avant** finalisation).
- `bestPayout` : uniquement WON/QUIT (une partie perdue a de toute façon `payout 0`). C'est le gain de la partie, **avant** le plafond du total.
- `level8Reached` : `game.level < 8 && level === 8`, pas `level === 8`.
- `maxLevel` : niveau **obtenu** (`level` après finalisation), pas le niveau joué.
- `appendHistory` gèle seulement le nouvel enregistrement (relecture T-005) : ici l'historique vient toujours de `initialGame()` ou de `appendHistory`, c'est suffisant. Geler l'historique relu d'une sauvegarde sera le rôle de T-007.
- `startRound` : un **seul** `rng`, `pickEntry` d'abord, `generateBoard` ensuite (le test de déterminisme en dépend).
- Refus de `buyNextPhoto` = **même référence** (`toBe`).
- `Level` : `Math.max` renvoie un `number` ; convertir proprement sans `any`.
- Identifiants en anglais ; commentaires et noms de tests en français. Pas de `Math.random`.

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
**Fait** : `Stats`, `GameState`, `AlbumPhoto` (types.ts) ; `game.ts` (initialGame, canStartRound, startRound, finalizeRound, leaveTable, emptyBox, resetProgress) ; `album.ts` (nextPhoto, missingCoins, buyNextPhoto). 32 tests ajoutés ; `npm run check` OK (324 tests).

**TDD réel** : les deux fichiers de tests écrits d'abord ; `npx vitest run` des deux fichiers -> rouge (modules `game`/`album` introuvables, 2 fichiers en échec, 0 test exécuté) ; puis code ; vert (32/32).

**Contre-épreuves** : (a) retrait du cas LOST : le test R-51 de la fiche (`ended('LOST', 0, 2)`) restait VERT car la défaite a payout 0 ; test renforcé avec `ended('LOST', 40, 2)` (écart assumé, nom inchangé), puis rouge confirmé. (b) sans plafond : CL-13 rouge. (c) `nextLevel(game.history)` : 6 tests rouges (CL-23, CL-17, ADR-017...). (d) `level === 8` : test ADR-017 niveau 8 rouge. (e) copie au refus : 2 tests rouges (solde insuffisant, album complet). Code restauré après chaque essai.

**Écart** : R-51 testé avec payout 40 au lieu de 0 (voir (a)). `buyNextPhoto` gèle le résultat et l'album mais réutilise `history`/`stats` de l'entrée (gelés quand ils viennent de `game.ts`, cf. piège de la fiche).

## Relecture
_(verdict du relecteur, avec la date)_

**2026-11-21 — relecteur — 🟡 approuvé avec réserves.** `npm run check` OK (324 tests) ; e2e et captures non concernés.
Code conforme à R-50..R-55, R-60, R-61, R-67, R-68, R-70..R-72, R-110..R-116, CL-13, CL-14, CL-17, CL-18, CL-23, ADR-017 et ADR-006 : ordre de R-55 respecté (encaissement → historique avec `game.level` → `nextLevel` sur l'historique complété → records) ; `level8Reached` seulement sur une montée ; `maxLevel` = niveau obtenu ; état gelé en profondeur, entrée jamais modifiée ; refus de `buyNextPhoto` = même objet. Calculs refaits à la main : CL-23, R-51, R-42, CL-13, CL-17, séquence ADR-017 du niveau 8, `maxLevel`, R-116.
Écart R-51 (`ended('LOST', 40, 2)`) : accepté (avec un gain de 0, la contre-épreuve (a) ne peut pas échouer ; le test fixe une garantie propre à `finalizeRound`), à commenter.
Contre-épreuves du relecteur : 29 erreurs introduites sur une copie ; 25 rouges, 4 vertes (réserves 1 à 4).
Réserves (tests seulement) : (1) `bestPayout` calculé sur le gain plafonné non détecté (CL-13) ; (2) remise à zéro des records par `leaveTable` / `emptyBox` non détectée ; (3) finalisation qui vide l'album non détectée ; (4) `nextPhoto` « la moins chère » non détecté (prix croissants dans les tests). Mineur : (5) `buyNextPhoto` n'utilise pas `freezeGame` ; (6) commenter l'état impossible du test R-51.

## Corrections après relecture
_Planifiées par Opus le 2026-11-21. Même branche, un nouveau commit `test(logic): corrections après relecture de T-006`. Seule modification de code autorisée : C5._

### C1 — Meilleur gain avant plafond (R-72)
- Test `CL-13 …` : ajouter `expect(g.stats.bestPayout).toBe(48)`.
- **Contre-épreuve** : `bestPayout` calculé avec `coins − game.coins` → CL-13 rouge.

### C2 — Quitter la table et vider la boîte conservent les records (R-67, R-53)
- Dans les tests `R-67 quitter la table …` et `R-53 vider la boîte …`, partir de `stats: { ...initialGame().stats, played: 3, won: 1, bestPayout: 72, maxLevel: 6 }` et vérifier `after.stats` `toEqual` ces records.
- **Contre-épreuve** : `leaveTable` puis `emptyBox` qui remettent `stats` à `initialGame().stats` → chaque test rouge.

### C3 — La finalisation conserve l'album (R-113)
- Test `CL-23 …` : partir aussi de `album: ['p1']` et vérifier `g.album` `toEqual(['p1'])`.
- **Contre-épreuve** : `finalizeRound` qui renvoie `album: []` → CL-23 rouge.

### C4 — L'ordre du pack prime sur le prix (R-111, ADR-016)
- Nouveau test `R-111 l'ordre du pack prime sur le prix` dans `album.test.ts` : `photos = [{ id: 'a', price: 300 }, { id: 'b', price: 100 }]`, album `[]`, `coins 150` → `nextPhoto` = `a` ; `buyNextPhoto` renvoie le même objet (`toBe`) ; `missingCoins === 150`.
- **Contre-épreuve** : `nextPhoto` qui choisit la photo non débloquée la moins chère → ce test rouge.

### C5 — `buyNextPhoto` gèle en profondeur (ADR-006)
- Exporter `freezeGame` depuis `src/logic/game.ts` (avec un commentaire de documentation) et l'utiliser dans `buyNextPhoto`.
- Dans `R-112 buyNextPhoto ne modifie pas l'état reçu et renvoie un état gelé`, partir d'un état **non gelé** (`game({...})`) et vérifier que `history` et `stats` du résultat sont gelés.
- **Contre-épreuve** : revenir au gel partiel → ce test rouge.

### C6 — Commentaire du test R-51
- Au-dessus de `ended('LOST', 40, 2)` : `// État impossible en jeu (R-34 met le gain à 0) : on vérifie que finalizeRound ignore le gain d'une défaite.`

### Critère global
- `npm run check` → code 0, **325** tests (324 + C4).
- `git status` avant commit : uniquement `src/logic/game.ts`, `src/logic/album.ts`, `tests/logic/game.test.ts`, `tests/logic/album.test.ts`, la fiche et `docs/journal.md` ; fichiers ajoutés un par un.

### Compte rendu — Corrections après relecture
Tests renforcés d'abord, contre-épreuves faites une par une (code restauré ensuite) ; `npm run check` OK, 325 tests.
- C1 : `bestPayout` calculé sur `coins - game.coins` -> CL-13 rouge.
- C2 : `leaveTable` / `emptyBox` qui remettent les stats à zéro -> les deux tests rouges.
- C3 : `finalizeRound` qui vide l'album -> CL-23 rouge.
- C4 : `nextPhoto` « la moins chère » -> nouveau test « l'ordre du pack prime sur le prix » rouge.
- C5 : test à partir d'un état non gelé, rouge avec le gel partiel ; puis `freezeGame` exporté (documenté) et utilisé dans `buyNextPhoto` -> vert.
- C6 : commentaire ajouté au test R-51.
