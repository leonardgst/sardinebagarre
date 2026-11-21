# T-004 — Jouer une partie : retourner, gagner, perdre, quitter, mémo

| Champ | Valeur |
|---|---|
| Statut | terminée |
| Étape du plan | 1.3 |
| Branche | `t-004-partie` |
| Estimation | M (1–3 h) |
| Planifiée par | Opus — 2026-11-21 |
| Implémentée par | codeur (Sonnet) |

## Objectif
`src/logic/round.ts` fournit des fonctions pures `newRound`, `flip`, `toggleMemo` et `quit` qui font avancer l'état d'une partie (gain, cartes retournées, mémo, issue) exactement selon R-04, R-30..R-34, R-40..R-42 et R-80..R-84, sans interface.

## Règles concernées
- `R-04` — au début : 25 cartes face cachée, aucun mémo.
- `R-30` — on ne retourne qu'une carte face cachée ; carte déjà retournée → aucun effet (refus).
- `R-31` / `R-83` — retourner une carte efface ses marques.
- `R-32` — carte chiffrée : `cardsFlipped += 1` (le 1 compte) ; 2 ou 3 → `multipliersFlipped += 1` ; si `payout == 0` alors `payout = valeur`, sinon `payout = min(payout × valeur, 50 000)`.
- `R-33` — après une carte chiffrée, si tous les 2 et 3 sont retournés (`gain == gainMax`) → **WON**.
- `R-34` — Sardine : `payout = 0`, **LOST** ; la Sardine ne compte **pas** dans `cardsFlipped`.
- `R-40` / `R-42` — quitter est possible à tout moment pendant `PLAYING` → **QUIT**, le gain est conservé (l'encaissement, lui, relève de l'étape 1.5).
- `R-41` / `CL-12` — « Non » : on n'appelle pas `quit`, l'état précédent reste intact (immuabilité).
- `R-80` — 4 marques indépendantes (S, 1, 2, 3), combinables, sur une carte non retournée.
- `R-81` (partie logique seulement) — un bouton de marque **inverse** la marque ; refus sur une carte retournée.
- `R-84` — le mémo n'a aucun effet sur les règles.
- `CL-01` à `CL-11` (partie logique : issue, gain, `cardsFlipped` ; le niveau suivant relève de l'étape 1.4).
- ADR-006 — `src/logic/` pur, sans mutation.

## Périmètre
**Inclus**
- `src/logic/constants.ts` (créer) : `export const COIN_CAP = 50_000;` avec un commentaire (R-32, R-50). Il sera réutilisé par `game.ts` (étape 1.5).
- `src/logic/types.ts` (modifier), ajouter :
  - `type Outcome = 'WON' | 'LOST' | 'QUIT'` (mêmes valeurs que R-60) ;
  - `type RoundStatus = 'PLAYING' | Outcome` ;
  - `type MemoMark = 'S' | 1 | 2 | 3` ;
  - ```ts
    interface RoundState {
      readonly board: Board;
      readonly flipped: readonly boolean[];   // 25 valeurs, index = id R-01
      readonly memos: readonly number[];      // 25 masques de bits (voir MEMO_BITS)
      readonly payout: number;                // gain de la partie
      readonly cardsFlipped: number;          // k : cartes chiffrées retournées (1 compris)
      readonly multipliersFlipped: number;
      readonly multipliersTotal: number;      // nombre de 2 et de 3 du plateau
      readonly maxPayout: number;             // min(produit des 2 et 3 du plateau, COIN_CAP)
      readonly status: RoundStatus;
    }
    ```
- `src/logic/round.ts` (créer) :
  - `export const MEMO_BITS: Readonly<Record<MemoMark, number>>` = `{ S: 1, 1: 2, 2: 4, 3: 8 }` (gelé) ;
  - `hasMark(state: RoundState, id: number, mark: MemoMark): boolean` ;
  - `newRound(board: Board): RoundState` (R-04) : `maxPayout` et `multipliersTotal` sont **calculés à partir du plateau** (pas de l'entrée de configuration), pour que les plateaux construits à la main fonctionnent ;
  - `flip(state, id): RoundState` (R-30..R-34, R-31) ;
  - `toggleMemo(state, id, mark): RoundState` (R-80, R-81) ;
  - `quit(state): RoundState` (R-40, R-42).
  - **Convention de refus** : quand une action n'a aucun effet (carte déjà retournée, marque sur une carte retournée, action sur une partie terminée), la fonction renvoie **le même objet** (`===`). L'interface s'en servira pour jouer le son « refus ». Le documenter en tête de fichier.
  - Identifiant invalide (pas un entier de 0 à 24) → `RangeError` avec un message en français (c'est une erreur de programmation, pas un geste du joueur).
  - Chaque état renvoyé est gelé (`Object.freeze` sur l'objet, `flipped` et `memos`) ; l'état reçu n'est jamais modifié.
- `tests/logic/round.test.ts` (créer) : voir « Tests à écrire ».

**Exclu** (ne pas faire dans cette tâche)
- Mode mémo ouvert ou fermé, carte sélectionnée, retour « au mémo ouvert » après « Non » (R-41, R-81) : c'est de l'état d'interface (étape 2.4).
- Textes de confirmation (R-40) : `src/ui/texts.fr.ts`, phase 2.
- Encaissement, plafond du total, historique, finalisation R-55 : étape 1.5. Niveau suivant (dernière colonne de CL-01..CL-04) : étape 1.4.
- Message de suspense R-90 (cosmétique) : phase 2 ou 4.
- Aucune modification de `board.ts`, `configs.ts`, `rng.ts`, de la spec, de `.claude/`, `.github/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/logic/constants.ts` | créer |
| `src/logic/types.ts` | modifier (4 types ajoutés) |
| `src/logic/round.ts` | créer |
| `tests/logic/round.test.ts` | créer |
| `docs/taches/T-004-partie.md` | compléter (Compte rendu) |
| `docs/journal.md` | mettre à jour (index + historique) |

## Tests à écrire
**Plateau de référence** `PLATEAU_MAIN` (le même que dans T-003, via `boardFromRows` de `tests/logic/helpers.ts`) :
```
S 1 2 1 1        ids  0  1  2  3  4
1 3 1 1 S             5  6  7  8  9
2 1 1 1 1            10 11 12 13 14
1 1 S 1 3            15 16 17 18 19
1 2 1 S 1            20 21 22 23 24
```
- Sardines : ids `0, 9, 17, 23`. Multiplicateurs : `2`=2, `6`=3, `10`=2, `19`=3, `21`=2 → `multipliersTotal = 5`, `maxPayout = 2×3×2×3×2 = 72`. Quelques 1 : ids `1, 3, 4, 5`.

**Plateau plafond** `PLATEAU_PLAFOND` (11 cartes à 3, ids 0 à 10 ; Sardine en 24) :
```
3 3 3 3 3
3 3 3 3 3
3 1 1 1 1
1 1 1 1 1
1 1 1 1 S
```
3^10 = 59 049 > 50 000 ; `maxPayout = 50 000`.

**`tests/logic/round.test.ts`**
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-04 nouvelle partie : tout face cachée, sans mémo, gain 0` | `newRound(PLATEAU_MAIN)` | 25 × `false`, 25 × `0`, `payout 0`, `cardsFlipped 0`, `multipliersFlipped 0`, `multipliersTotal 5`, `maxPayout 72`, `status 'PLAYING'` |
| `R-24 l'état d'une partie est gelé` | `newRound`, puis `flip(…, 1)` | `Object.isFrozen` vrai pour l'état, `flipped` et `memos`, dans les deux cas |
| `CL-05 premier retournement = 1 → gain 1` | flip `1` | `payout 1`, `cardsFlipped 1`, `multipliersFlipped 0`, `PLAYING` |
| `R-32 premier retournement = 2 → gain 2` | flip `2` | `payout 2`, `cardsFlipped 1`, `multipliersFlipped 1` |
| `CL-06 1 puis 3 puis 2 → 1, 3, 6` | flips `1, 6, 2` | gains successifs `1, 3, 6` ; `cardsFlipped 3` ; `multipliersFlipped 2` |
| `CL-07 2 puis 1 puis 1 → 2, 2, 2 et k = 3` | flips `2, 1, 3` | gains `2, 2, 2` ; `cardsFlipped 3` |
| `CL-02 premier retournement = Sardine → perdue, k = 0` | flip `0` | `status 'LOST'`, `payout 0`, `cardsFlipped 0`, `flipped[0] === true` |
| `CL-03 1, 1 puis Sardine → perdue, k = 2` | flips `1, 3, 0` | `LOST`, `payout 0`, `cardsFlipped 2` |
| `CL-04 un seul 1 puis Sardine → k = 1` | flips `1, 0` | `LOST`, `cardsFlipped 1` |
| `R-34 Sardine après des multiplicateurs → gain remis à 0` | flips `2, 6, 9` | avant la Sardine `payout 6` ; après : `LOST`, `payout 0`, `cardsFlipped 2`, `multipliersFlipped 2` |
| `R-33 victoire dès le dernier multiplicateur` | flips `2, 6, 10, 19, 21` | gains `2, 6, 12, 36, 72` ; `PLAYING` jusqu'au 4ᵉ, `WON` après le 5ᵉ ; `payout === maxPayout` |
| `CL-08 victoire alors qu'il reste des 1 : ils restent face cachée` | même suite | `cardsFlipped 5` ; exactement 5 `true` dans `flipped` ; `flipped[1] === false` |
| `R-33 les 1 retournés avant la victoire comptent dans k` | flips `1, 3, 2, 6, 10, 19, 21` | `WON`, `payout 72`, `cardsFlipped 7` |
| `CL-09 retourner une carte déjà retournée ne change rien` | `s1 = flip(s0, 1)` ; `flip(s1, 1)` | renvoie `s1` (`toBe`) |
| `R-30 aucun retournement après la fin de partie` | après `LOST` (flip 0), après `WON`, après `QUIT` : flip `1` | renvoie le même objet dans les 3 cas |
| `R-30 identifiant invalide → RangeError` | flip `-1`, `25`, `2.5` | `toThrow(RangeError)` |
| `R-32 le gain est plafonné à 50 000` | `PLATEAU_PLAFOND`, flips `0` à `8`, puis `9`, puis `10` | après les 9 premiers (ids 0–8) `payout 19 683` ; après id `9` `payout 50 000`, `PLAYING` ; après id `10` `payout 50 000`, `WON` |
| `R-80 les 4 marques sont indépendantes et combinables` | sur id `1` : toggle `S`, `1`, `2`, `3` | `hasMark` vrai pour les 4 ; `memos[1] === 15` ; puis toggle `2` → seules S, 1, 3 restent (`memos[1] === 11`) |
| `R-81 inverser deux fois une marque revient à l'état initial` | toggle `3` deux fois sur id `4` | `memos[4] === 0` ; aucune autre carte touchée |
| `CL-10 marquer une carte retournée est refusé` | flip `1`, puis toggle `S` sur `1` | renvoie le même objet |
| `R-81 aucune marque après la fin de partie` | après `LOST`, toggle `S` sur `5` | renvoie le même objet |
| `CL-11 retourner une carte marquée efface ses marques` | toggle `S` et `3` sur `1`, puis flip `1` | `memos[1] === 0` ; les marques d'une autre carte (toggle `2` sur `4` avant) sont conservées |
| `R-84 le mémo n'a aucun effet sur les règles` | toggle `S` sur `1` (un 1), puis flip `1` ; et toggle `1` sur `0` (une Sardine), puis flip `0` | gain `1`, `PLAYING` ; puis `LOST` comme sans mémo |
| `R-84 marquer ne change ni le gain ni les compteurs` | flips `2, 6`, puis toggles divers | `payout`, `cardsFlipped`, `multipliersFlipped`, `status`, `flipped` inchangés (`toEqual`) |
| `CL-01 quitter sans avoir retourné de carte → QUIT, gain 0, k = 0` | `quit(newRound(…))` | `status 'QUIT'`, `payout 0`, `cardsFlipped 0` |
| `R-42 quitter conserve le gain` | flips `1, 2, 6`, puis `quit` | `QUIT`, `payout 6`, `cardsFlipped 3` |
| `R-40 quitter une partie terminée ne change rien` | `quit` après `LOST`, après `WON`, après `QUIT` | renvoie le même objet |
| `CL-12 l'état précédent reste intact (« Non » = aucun appel)` | copie profonde (`structuredClone`) de `s` avant `flip`, `toggleMemo`, `quit` | `s` toujours égal (`toEqual`) à sa copie après chacun des trois appels |
| `R-33 maxPayout de newRound = maxPayout(entrée) pour les 80 configurations` | pour chaque entrée de `CONFIGS`, `generateBoard(entry, mulberry32(i))` | `newRound(board).maxPayout === maxPayout(entry)` et `multipliersTotal === twos + threes` |
| `R-30..R-34 propriété : parties aléatoires sur les 80 configurations` | pour chaque entrée, 20 graines : plateau généré, puis retourner les 25 ids dans un ordre mélangé (Fisher-Yates avec le même `rng`) jusqu'à la fin | voir ci-dessous |

**Propriété (recalcul indépendant dans le test, sans réutiliser `round.ts` pour l'attendu)** : à chaque étape, tenir à côté un modèle simple (gain attendu, k attendu, multiplicateurs restants) et vérifier :
- après une carte chiffrée : `payout` = gain du modèle, `cardsFlipped` = k du modèle ;
- la partie se termine **au plus tard** quand tous les multiplicateurs ou une Sardine sont retournés, et **jamais avant** ;
- si `WON` : aucune Sardine retournée, tous les 2 et 3 retournés, `payout === maxPayout(entry)` ;
- si `LOST` : exactement une Sardine retournée, c'est la dernière carte jouée, `payout === 0` ;
- après la fin, `flip` sur une carte restante renvoie le même objet.
N'afficher que les 20 premiers écarts en cas d'échec (comme T-003).

**Contre-épreuves à faire (et à noter dans le compte rendu)** :
1. Faire compter la Sardine dans `cardsFlipped` → CL-02/CL-03 rouges.
2. Ne pas effacer le mémo au retournement → CL-11 rouge.
3. Muter `state.flipped` au lieu de copier → CL-12 ou R-24 rouge.
4. Victoire testée par `payout === maxPayout` → le test du plafond R-32 reste vert (`maxPayout` est plafonné) mais le noter ; victoire testée par `payout === produit non plafonné` → R-32 plafond rouge.

## Critères d'acceptation
- [x] `npm run check` → code 0 ; nombre de tests = 221 + ceux de `round.test.ts`.
- [x] `npx vitest run tests/logic/round.test.ts` → tous verts, en moins de 3 s.
- [x] Chaque test du tableau ci-dessus existe avec ce nom (au caractère près pour l'identifiant de règle en tête).
- [x] `grep` : aucun `Math.random`, `Date`, `window`, `document` dans `src/logic/round.ts` et `src/logic/constants.ts` (le test d'architecture le vérifie déjà).
- [x] Les contre-épreuves 1, 2 et 3 font échouer au moins un test ; résultat noté dans le compte rendu.
- [x] `git status` avant commit : uniquement les fichiers du tableau « Fichiers ».

## Pièges connus
- **Le 1 compte dans `cardsFlipped`** ; la Sardine **non**.
- Premier gain : `payout == 0` → `payout = valeur` (et non `0 × valeur`). Après une Sardine la partie est finie : ce cas ne se présente donc jamais en cours de partie.
- **Condition de victoire** : coder `multipliersFlipped === multipliersTotal`, pas `payout === maxPayout`. Les deux sont équivalentes sur les 80 configurations (gain max ≤ 3 456, très loin du plafond), mais la comparaison des gains donnerait une victoire anticipée sur un plateau dont le produit dépasse 50 000 (cf. `PLATEAU_PLAFOND`). Le test des 80 configurations vérifie que `payout === maxPayout(entry)` à la victoire, ce qui respecte R-33 à la lettre.
- `maxPayout` de l'état = `min(produit, COIN_CAP)`, calculé depuis `board.cells`.
- La carte Sardine retournée passe à `flipped = true` (l'interface l'affiche) et son mémo est effacé, comme toute carte.
- Refus = **même référence** (`toBe`), pas un objet égal. Ne pas créer de nouvel état quand rien ne change.
- Ne jamais muter : copier `flipped` / `memos` (`slice()` ou `map`), puis geler.
- `MEMO_BITS` : la clé `1` d'un objet devient la chaîne `'1'` ; typer avec `Record<MemoMark, number>` et accéder par `MEMO_BITS[mark]` fonctionne en TypeScript, mais vérifier que `hasMark(s, id, 1)` marche bien (c'est testé par R-80).
- `structuredClone` existe dans Node ≥ 17 et dans Vitest ; pas besoin de bibliothèque.
- Identifiants en anglais ; commentaires et noms de tests en français.

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
Ajout de `constants.ts`, des types de partie et de `round.ts` (`newRound`, `flip`, `toggleMemo`, `quit`, `hasMark`, `MEMO_BITS`), refus = même référence, états gelés. 30 tests (`round.test.ts`) ; `npm run check` : 251 tests, OK.
Contre-épreuves : (1) Sardine comptée dans k -> CL-02, CL-03, CL-04, R-34 rouges ; (2) mémo non effacé -> CL-11 rouge ; (3) mutation de `flipped` -> 24 tests rouges ; (4) victoire par `payout === maxPayout` -> le test du plafond R-32 est rouge (victoire anticipée à l'id 9), donc il protège bien contre ce piège. Écart : aucun.

## Relecture
_(verdict du relecteur, avec la date)_

**2026-11-21 — relecteur — 🟡 approuvé avec réserves.** `npm run check` OK (251 tests). Code conforme à R-04, R-30..R-34, R-40..R-42, R-80..R-84, CL-01..CL-12 et ADR-006 (états gelés, refus = même objet, aucune mutation). Les 30 noms de tests correspondent à la fiche ; `round.test.ts` tourne en 0,3 s. Contre-épreuves rejouées : premier gain 0 × valeur → 11 rouges ; refus renvoyant une copie (flip / toggleMemo / quit) → CL-09, R-30, CL-10, R-81, R-40 rouges ; mémo après fin → R-81 rouge. Réserves : (1, important) le mémo non effacé sur une Sardine retournée n'est détecté par aucun test ; (2, mineur) identifiant invalide non testé pour `toggleMemo` et `hasMark` (une borne `> 25` passerait) ; (3, mineur) le journal annonce T-005 alors que sa fiche n'est pas commitée.

## Corrections après relecture
_Planifiées par Opus le 2026-11-21. Même branche, un nouveau commit `test(logic): corrections après relecture de T-004`. Ne pas modifier `src/logic/` (sauf si un nouveau test révèle un vrai défaut : le signaler alors dans le compte rendu)._

### C1 — Le mémo d'une Sardine retournée est effacé (R-31, R-83)
- Dans le test `R-84 le mémo n'a aucun effet sur les règles`, après le retournement de la Sardine marquée (id `0`), ajouter `expect(<état>.memos[0]).toBe(0)`.
- **Contre-épreuve** : dans `round.ts`, branche Sardine de `flip`, ne pas effacer `memos` → ce test échoue ; restaurer → vert.

### C2 — Identifiant invalide pour toutes les fonctions (R-30)
- Dans `R-30 identifiant invalide → RangeError`, vérifier `-1`, `25` et `2.5` aussi pour `toggleMemo(…, id, 'S')` et `hasMark(…, id, 'S')`.
- **Contre-épreuve** : borne de `checkId` passée de `>= 25` à `> 25` → ce test échoue ; restaurer → vert.

### C3 — Fiche T-005 commitée
- Ajouter `docs/taches/T-005-niveaux.md` **tel quel** (écrit par Opus, ne pas le modifier) au même commit, pour que l'index du journal ne renvoie pas à un fichier absent.

### Critère global
- `npm run check` → code 0, **251** tests (aucun ajouté : on renforce deux tests existants).
- `git status` avant commit : uniquement `tests/logic/round.test.ts`, `docs/taches/T-004-partie.md`, `docs/taches/T-005-niveaux.md` et `docs/journal.md` (ligne d'historique).

### Compte rendu — Corrections après relecture
C1 : assertion `memos[0] === 0` ajoutée dans le test R-84 ; contre-épreuve (Sardine sans effacement du mémo) -> ce test rouge, restauré -> vert. C2 : `toggleMemo` et `hasMark` vérifiés pour -1, 25 et 2.5 dans le test R-30 ; contre-épreuve (`> 25` au lieu de `>= 25`) -> rouge, restauré -> vert. C3 : fiche T-005 commitée telle quelle. `src/logic/` non modifié. `npm run check` : 251 tests, OK.
