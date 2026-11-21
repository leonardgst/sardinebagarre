# T-008 — Compléter la couverture de la logique (revue 1.6)

| Champ | Valeur |
|---|---|
| Statut | à relire |
| Étape du plan | 1.6 (suite de la revue complète du 2026-11-21) |
| Branche | `t-008-couverture-logique` |
| Estimation | S (< 1 h) |
| Planifiée par | Opus — 2026-11-21 |
| Implémentée par | codeur (Sonnet) |

## Objectif
Chaque règle de la spec qui relève de la logique a au moins un test (jalon de l'étape 1.6), le message de suspense R-90 dispose d'une fonction pure testée, et un prix d'album invalide ne peut plus corrompre le total de jetons.

## Contexte : revue complète du 2026-11-21 (verdict 🟡)
Tout le code existant est juste ; trois mutants survivent et trois règles n'ont aucun test : R-03, R-64 (série terminée au niveau 8), CL-21, R-90 (non implémentée), R-110/R-116 (prix invalides acceptés : prix −100 → total 50 100 ; prix 12,5 → total décimal, puis 0 jeton au rechargement).

## Règles concernées
- `R-03` — indicateurs fixes pendant la partie.
- `R-64` — la série vaut aussi quand la dernière partie est au niveau 8 sans victoire.
- `CL-21` — une ligne sans Sardine n'est **pas** retournée automatiquement.
- `R-90` — suspense : ligne **et** colonne avec ≥ 1 Sardine, et pour la ligne **ou** la colonne `Sardines totales × 100 / cartes non retournées ≥ 75` ; la carte touchée, encore cachée, compte parmi les non retournées (spec annotée le 2026-11-21).
- `R-110` / `R-116` — un prix doit être un entier ≥ 0 ; sinon l'achat est refusé.
- `CL-23` / `R-55` — chaîne finalisation → sauvegarde → relecture.
- ADR-006 — pas de source de temps non injectée (`performance`).

## Périmètre
**Inclus**
- `src/logic/round.ts` : `isSuspense(state: RoundState, id: number): boolean` (R-90).
  - `RangeError` si `id` invalide (même contrôle que `flip`) ; `false` si la carte est déjà retournée ou si la partie est finie.
  - Ligne `r`, colonne `c` de la carte : `sr = rowHints[r].sardines`, `sc = colHints[c].sardines` ; si `sr === 0 || sc === 0` → `false`.
  - `hr` = cartes non retournées de la ligne (la carte touchée comprise), `hc` de même pour la colonne ; `true` si `sr * 100 / hr >= 75 || sc * 100 / hc >= 75`.
- `src/logic/album.ts` : `buyNextPhoto` refuse (même objet) si le prix de la prochaine photo n'est pas un entier ≥ 0 (`Number.isInteger(price) && price >= 0`). `missingCoins` renvoie `0` dans ce cas (rien d'achetable). Un prix de 0 est permis (photo offerte).
- `biome.json` : ajouter `performance` aux `deniedGlobals` de `src/logic/**` (message « Interdit dans src/logic (pur) : l'heure est injectée. »).
- `tests/architecture.test.ts` : ajouter `performance` (`/\bperformance\b/`) aux API interdites, avec son témoin.
- Tests : voir ci-dessous.

**Exclu**
- Choix du message de suspense et jingle (interface, phase 2).
- Validation du pack (étape 3.3).
- Niveau porté par la partie (`RoundState.level`) : **pas** dans cette tâche (consigné comme contrainte pour la phase 2 dans le journal).
- Aucune modification de la spec, des ADR, de `.claude/`, `.github/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/logic/round.ts` | modifier (`isSuspense`) |
| `src/logic/album.ts` | modifier (garde sur le prix) |
| `biome.json` | modifier (`performance`) |
| `tests/logic/round.test.ts` | modifier |
| `tests/logic/levels.test.ts` | modifier |
| `tests/logic/album.test.ts` | modifier |
| `tests/logic/save.test.ts` | modifier |
| `tests/architecture.test.ts` | modifier |
| `docs/taches/T-008-couverture-logique.md` | compléter (Compte rendu) |
| `docs/journal.md` | mettre à jour (historique) |

## Tests à écrire
| Fichier | Nom du test | Entrée | Attendu |
|---|---|---|---|
| levels | `R-64 série complète terminée par un abandon au niveau 8 → 8 (contrairement à N7)` | `(WON,8,5) (WON,8,6) (WON,8,7) (WON,9,8) (QUIT,9,8)` | `8` |
| round | `R-03 les indicateurs ne changent pas pendant la partie` | `newRound(PLATEAU_MAIN)`, flips `1, 2, 6`, puis `quit` | `board` identique (`toBe`) au plateau de départ ; `rowHints` = `5/1, 6/1, 6/0, 6/1, 5/1` ; `colHints` = `5/1, 8/0, 5/1, 4/1, 6/1` |
| round | `CL-21 ligne sans Sardine : retourner une carte ne retourne pas les autres` | `PLATEAU_MAIN` (ligne 2 sans Sardine), flip `11` | une seule carte retournée ; `flipped[10]`, `[12]`, `[13]`, `[14]` faux ; `cardsFlipped 1` ; `PLAYING` |
| round | `R-90 pas de suspense à 3 Sardines sur 5 cartes cachées (60 %)` | plateau `SUSPENSE` (ci-dessous), `isSuspense(newRound(b), 3)` | `false` |
| round | `R-90 suspense à 75 % : 3 Sardines sur 4 cartes cachées, colonne avec une Sardine` | `isSuspense(flip(newRound(b), 4), 3)` | `true` |
| round | `R-90 pas de suspense si la colonne de la carte n'a aucune Sardine` | plateau `SUSPENSE_SANS_COLONNE`, `isSuspense(flip(newRound(b2), 4), 3)` | `false` |
| round | `R-90 suspense par la colonne seule` | plateau `COLONNE` (ci-dessous), carte id `20` : `isSuspense(newRound(b3), 20)`, puis `isSuspense(flip(newRound(b3), 0), 20)` | d'abord `false` (colonne 0 : 3 Sardines sur 5 cachées = 60 % ; ligne 4 : 1 sur 5 = 20 %) ; après le retournement de l'id 0 : `true` (colonne : 3 sur 4 = 75 % ; la ligne reste à 20 %) |
| round | `R-90 aucun suspense sur une carte retournée ou une partie finie` | flip `3` puis `isSuspense(…, 3)` ; partie quittée puis `isSuspense(…, 5)` | `false` ; `false` |
| round | `R-90 identifiant invalide → RangeError` | `-1`, `25`, `2.5` | `toThrow(RangeError)` |
| album | `R-116 un prix négatif, non entier ou NaN est refusé` | `buyNextPhoto(game({ coins: 50_000 }), [{ id: 'p', price }])` pour `price` ∈ `-100, 12.5, NaN, Infinity` | même objet (`toBe`) ; `missingCoins === 0` |
| album | `R-110 une photo à 0 jeton peut être débloquée` | `coins 0`, `[{ id: 'p', price: 0 }]` | album `['p']`, `coins 0` |
| save | `CL-23 R-55 finalisation puis sauvegarde : rien n'est perdu pendant la révélation` | `finalizeRound(game({ coins: 100, level: 3 }), ended('WON', 72, 5))`, puis `serialize`, puis `deserialize` (dans une `SaveData` construite avec `initialSave()`) | `coins 172`, `level 4`, `history [(WON,5,3)]`, `stats.won 1`, statut `'ok'` |
| architecture | témoin `performance.now()` | — | détecté comme interdit |

**Plateaux R-90** (tels que dans les tests ; un 2 caché évite la victoire automatique) :
```
SUSPENSE                SUSPENSE_SANS_COLONNE
S S S 1 2               S S S 1 2
1 2 1 1 1               1 2 1 1 1
1 1 1 1 1               1 1 1 1 1
1 1 1 1 1               1 1 1 1 1
1 1 1 S S               1 1 1 1 S
```
`COLONNE` (carte visée : id `20`, ligne 4, colonne 0) :
```
1 1 1 1 1
S 1 2 1 1
S 1 1 1 1
S 1 1 1 1
1 1 1 1 S
```
Carte visée : id `3` (ligne 0, colonne 3). `SUSPENSE` : ligne 0 = 3 Sardines, colonne 3 = 1 Sardine (id 23). `SUSPENSE_SANS_COLONNE` : colonne 3 sans Sardine.

## Critères d'acceptation
- [x] TDD réel : tests écrits d'abord, échec constaté (pour les tests de R-90 et des prix) et noté dans le compte rendu. Les tests de R-03, R-64, CL-21 et CL-23 passent déjà sur le code actuel : c'est attendu, leur valeur est prouvée par les contre-épreuves.
- [x] `npm run check` → code 0 ; 390 tests précédents toujours verts.
- [x] Contre-épreuves (notées) : (a) série ignorée quand la dernière partie est au niveau 8 → test R-64 rouge ; (b) `flip` qui recalcule les indicateurs → test R-03 rouge ; (c) retournement automatique d'une ligne sans Sardine → CL-21 rouge ; (d) `isSuspense` sans la carte touchée dans le compte (`hr − 1`) → un test R-90 rouge ; (e) `isSuspense` avec « et » au lieu de « ou » → test « par la colonne seule » ou « 75 % » rouge ; (f) garde de prix supprimée → test R-116 rouge.
- [x] `git status` avant commit : uniquement les fichiers du tableau ; ajoutés un par un.

## Pièges connus
- R-90 : Sardines **au total** de la ligne (indicateur), pas les Sardines restantes ; cartes **non retournées** (dont la carte touchée).
- `>= 75`, pas `> 75`.
- Contre-épreuve (b) : réaliste seulement si `flip` reconstruit un `Board` ; il suffit de faire renvoyer à `flip` un plateau neuf avec un indicateur modifié.
- `buyNextPhoto` : garder la convention « refus = même objet ».
- `Infinity` n'est pas un entier (`Number.isInteger(Infinity) === false`).
- Identifiants en anglais ; commentaires et noms de tests en français.

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
- TDD réel : avant le code, 11 tests rouges (6 R-90, 4 prix R-116 invalides, témoin `performance`) ; R-03, R-64, CL-21, CL-23 et R-110 (prix 0) passaient déjà, comme prévu.
- Fait : `isSuspense` dans `round.ts`, `validPrice` dans `album.ts` (refus = même objet, `missingCoins` 0), `performance` dans `biome.json` et `architecture.test.ts`. 406 tests, `npm run check` OK.
- Contre-épreuves : (a) `L < 8` dans la série -> test R-64 rouge ; (b) indicateurs recalculés dans `flip` -> R-03 rouge ; (c) retournement automatique de ligne -> CL-21 rouge ; (d) `hr - 1` -> 2 tests R-90 rouges ; (e) « et » -> 2 tests R-90 rouges ; (f) garde supprimée -> 3 tests R-116 rouges. Code restauré après chaque essai.
- Écart : les plateaux R-90 de la fiche ne contiennent aucun 2/3 caché, donc le premier retournement gagne la partie (`flip` -> WON, `isSuspense` -> false). J'ai remplacé un « 1 » par un « 2 » hors de la ligne et de la colonne visées (id 6 pour SUSPENSE et SUSPENSE_SANS_COLONNE, id 7 pour COLONNE). Les pourcentages de la fiche restent valables.

## Relecture
_(verdict du relecteur, avec la date)_

**2026-11-21 — relecteur — 🟡 approuvé avec réserves.** `npm run check` OK (406 tests). `isSuspense` conforme à R-90 (Sardines totales, carte touchée comptée, `>= 75`, ligne ET colonne ≥ 1, ligne OU colonne). Garde des prix (entier ≥ 0, refus = même objet) conforme. `performance` refusé par Biome et par le test d'architecture. Écart des plateaux (un 2 en id 6/7) justifié, pourcentages exacts. Contre-épreuves rejouées : `> 75`, `hr-1`, « et », dénominateur fixe, `hr`/`hc` échangés, `checkId` retiré, gardes de prix : toutes rouges. « Sardines restantes » est un mutant équivalent (une Sardine retournée termine la partie). Mutants R-03, R-64 et CL-21 de la revue 1.6 tués. **Jalon 1.6 atteint.**
Réserves (non bloquantes) : (1) le cas « partie finie » du test R-90 ne vérifie rien (id 5 sur une ligne sans Sardine) ; (2) aucun test « ligne sans Sardine, colonne ≥ 75 % » ; (3) mineur : JSDoc de `missingCoins`, validation des prix du pack à l'étape 3.3, schémas des plateaux R-90 de la fiche à aligner.

## Corrections après relecture
_Planifiées par Opus le 2026-11-21. Même branche, un nouveau commit `test(logic): corrections après relecture de T-008`._

### C1 — Partie finie : le contrôle du statut est vraiment testé (R-90)
- Dans `R-90 aucun suspense sur une carte retournée ou une partie finie`, remplacer le cas « partie quittée, carte 5 » par `expect(isSuspense(flip(newRound(SUSPENSE), 0), 3)).toBe(false)` (Sardine id 0 → partie perdue ; sans le contrôle du statut, ligne 0 = 3 × 100 / 4 = 75 % et colonne 3 avec une Sardine → `true`). Garder aussi un cas « partie quittée » sur la carte 3 : `isSuspense(quit(flip(newRound(SUSPENSE), 4)), 3)` → `false`.
- **Contre-épreuve** : retirer `state.status !== 'PLAYING'` → ce test rouge.

### C2 — Ligne sans Sardine (R-90)
- Nouveau test `R-90 pas de suspense si la ligne de la carte n'a aucune Sardine` : plateau `COLONNE` des tests avec la case 24 mise à `1` (ligne 4 sans Sardine) ; `isSuspense(flip(newRound(b), 0), 20)` → `false` (colonne 0 à 75 %).
- **Contre-épreuve** : garde réduite à `sc === 0` → ce test rouge.

### C3 — Documentation
- `src/logic/album.ts` : JSDoc de `missingCoins` : « 0 si la photo est achetable, s'il n'en reste aucune ou si son prix est invalide ; l'interface se fie au refus de `buyNextPhoto` ».
- Fiche : aligner les schémas des plateaux R-90 (section « Tests à écrire ») sur ceux des tests (2 en id 6 ou 7).
- `docs/journal.md`, section « Contraintes pour la phase 2 » : ajouter « Étape 3.3 : refuser un pack dont un prix n'est pas un entier ≥ 0 (un prix invalide bloque toutes les photos suivantes). »

### Critère global
- `npm run check` → code 0, 407 tests (406 + C2).
- `git status` avant commit : uniquement `tests/logic/round.test.ts`, `src/logic/album.ts`, la fiche et `docs/journal.md` ; ajoutés un par un.

### Compte rendu — Corrections après relecture
- C1 : cas « partie finie » remplacé par `flip(..., 0)` (Sardine) et `quit(flip(..., 4))` sur la carte 3. Contre-épreuve : sans le contrôle du statut, ce test est rouge.
- C2 : test « ligne sans Sardine » ajouté (case 24 à 1). Contre-épreuve : garde réduite à `sc === 0` -> ce test est rouge.
- C3 : JSDoc de `missingCoins`, schémas de la fiche alignés, contrainte « étape 3.3 » ajoutée au journal.
- `npm run check` OK, 407 tests ; code restauré après chaque contre-épreuve.
