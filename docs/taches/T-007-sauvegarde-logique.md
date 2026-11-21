# T-007 — Sérialiser, valider et relire la sauvegarde (logique pure)

| Champ | Valeur |
|---|---|
| Statut | planifiée |
| Étape du plan | 1.5 (2ᵉ partie : `save.ts` ; la 1ʳᵉ partie était T-006) |
| Branche | `t-007-sauvegarde-logique` |
| Estimation | M (1–3 h) |
| Planifiée par | Opus — 2026-11-21 |
| Implémentée par | codeur (Sonnet) |

## Objectif
`src/logic/save.ts` transforme l'état durable du joueur en texte JSON versionné et le relit de façon tolérante : une sauvegarde absente, corrompue ou d'une version inconnue ne fait jamais planter le jeu, garde ce qui est lisible, et la partie en cours n'est jamais sauvegardée.

## Règles concernées
- `R-68` / `CL-18` — la partie en cours n'est pas sauvegardée.
- `R-100` — JSON avec `version` (entier). La clé `localStorage` et l'écriture relèvent de `src/ui/storage.ts` (étape 3.1).
- `R-101` — contenu : `version`, `coins`, `level`, `history[≤5]`, `settings` (son ; animations réduites, **non renseigné** tant que le joueur n'a rien choisi), `stats`, `album`, `welcomeSeen`, `packCode`.
- `R-102` / `CL-22` — lecture tolérante : schéma validé, migration si la version est ancienne, repli propre sinon ; sauvegarde corrompue ou de version inconnue → partie neuve sans planter, **en gardant le total de jetons s'il est lisible**.
- §10.5 — « bouton muet mémorisé » : le son est **actif** par défaut.
- UI-04 — animations réduites : par défaut la préférence système (`null` = non renseigné).
- `R-71` / **ADR-017** — « Effacer toute la progression » conserve `packCode`, `settings` et `welcomeSeen`.
- Relecture T-005 / T-006 — un état relu doit être **gelé en profondeur**, enregistrements de l'historique compris.
- ADR-006 / ADR-008 — `src/logic/` pur : pas de `localStorage`, pas de `Date`.

## Périmètre
**Inclus**
- `src/logic/types.ts` (modifier), ajouter :
  ```ts
  /** Réglages persistants (UI-04). */
  interface Settings {
    readonly sound: boolean;                 // true par défaut (§10.5 : bouton muet)
    readonly reducedMotion: boolean | null;  // null = non renseigné → préférence système (UI-04)
  }
  /** Tout ce qui est sauvegardé (R-101), sans la partie en cours (R-68). */
  interface SaveData {
    readonly game: GameState;
    readonly settings: Settings;
    readonly welcomeSeen: boolean;
    readonly packCode: string | null;
  }
  type LoadStatus = 'new' | 'ok' | 'recovered';
  ```
- `src/logic/save.ts` (créer) :
  - `export const SAVE_VERSION = 1;`
  - `initialSave(): SaveData` — `initialGame()`, `settings { sound: true, reducedMotion: null }`, `welcomeSeen false`, `packCode null` ; gelé en profondeur.
  - `serialize(save: SaveData): string` — `JSON.stringify` d'un objet **plat**, dans cet ordre de clés : `version`, `coins`, `level`, `history` (tableau de `{ outcome, cardsFlipped, level }`), `settings` (`{ sound, reducedMotion }`), `stats` (les 7 compteurs), `album`, `welcomeSeen`, `packCode`. Aucune autre clé.
  - `deserialize(text: string | null): { readonly save: SaveData; readonly status: LoadStatus }` :
    - `text === null` (rien de sauvegardé) → `initialSave()`, `'new'` ;
    - JSON illisible, ou pas un objet (tableau, nombre, `null`…) → `initialSave()`, `'recovered'` ;
    - `version` absente, non entière, ou différente de `SAVE_VERSION` (inconnue) → `initialSave()` **avec `coins` repris s'il est valide**, `'recovered'` (CL-22). *Il n'existe pas encore de version ancienne : prévoir une fonction `migrate(raw, version)` qui, pour l'instant, ne gère que `SAVE_VERSION` ; la documenter comme le point d'entrée des migrations futures.*
    - `version === SAVE_VERSION` → validation **champ par champ** (tableau ci-dessous) : un champ invalide prend sa valeur par défaut, les autres sont gardés ; statut `'ok'` si tout est valide, `'recovered'` si au moins un champ a été remplacé.
    - Ne lève **jamais** d'exception.
  - `resetProgressInSave(save): SaveData` — ADR-017 : `game = resetProgress(save.game)`, `settings`, `welcomeSeen` et `packCode` conservés.
  - Toute `SaveData` renvoyée est gelée en profondeur : objet, `game` (via `freezeGame`), **chaque enregistrement** de `history`, `settings`.

**Validation champ par champ (version 1)**
| Champ | Valide si | Sinon |
|---|---|---|
| `coins` | entier, `0 ≤ coins ≤ 50 000` | `0` |
| `level` | entier de 1 à 8 | `1` |
| `history` | tableau de ≤ 5 éléments, chacun `{ outcome ∈ {WON, LOST, QUIT}, cardsFlipped entier 0..25, level entier 1..8 }` | `[]` (tout l'historique, pas élément par élément) |
| `stats` | objet ; `bestPayout`, `played`, `won`, `lost`, `quit`, `level8Reached` entiers ≥ 0 ; `maxLevel` entier 1..8 | stats initiales (tout le bloc) |
| `album` | tableau de chaînes non vides, sans doublon | `[]` |
| `settings.sound` | booléen | `true` |
| `settings.reducedMotion` | booléen ou `null` | `null` |
| `welcomeSeen` | booléen | `false` |
| `packCode` | chaîne non vide ou `null` | `null` |
Les clés inconnues sont ignorées (sans changer le statut).

- `tests/logic/save.test.ts` (créer) : voir « Tests à écrire ».

**Exclu** (ne pas faire dans cette tâche)
- `src/ui/storage.ts`, la clé `sardinebagarre:save`, les écritures à chaque changement (R-100) et les tests e2e de rechargement : **étape 3.1**.
- Normalisation du code secret (R-122) et vérification qu'il déchiffre le pack : étape 3.3.
- Cohérence croisée entre champs (par exemple `level` et `history`) : hors périmètre, chaque champ est validé seul.
- Aucune modification de `game.ts`, `album.ts`, `round.ts`, `levels.ts`, de la spec, des ADR, de `.claude/`, `.github/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/logic/types.ts` | modifier (`Settings`, `SaveData`, `LoadStatus`) |
| `src/logic/save.ts` | créer |
| `tests/logic/save.test.ts` | créer |
| `docs/taches/T-007-sauvegarde-logique.md` | compléter (Compte rendu) |
| `docs/journal.md` | mettre à jour (historique) |

## Tests à écrire
**Fixture** `SAVE_PLEINE` (construite dans le test, sans appeler `serialize`) : `coins 1234`, `level 5`, `history [(WON,6,4),(QUIT,8,5)]`, `stats { bestPayout 432, maxLevel 6, played 12, won 5, lost 4, quit 3, level8Reached 0 }`, `album ['p1','p2']`, `settings { sound: false, reducedMotion: true }`, `welcomeSeen true`, `packCode 'test-test-test-test'`.
Helper `raw(overrides)` : l'objet JSON plat **valide** correspondant à `SAVE_PLEINE` (écrit à la main dans le test, `version: 1`), fusionné avec `overrides`, puis `JSON.stringify`.

| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-101 sauvegarde initiale` | `initialSave()` | `game` = `initialGame()` ; `settings { sound: true, reducedMotion: null }` ; `welcomeSeen false` ; `packCode null` ; gelée en profondeur |
| `R-101 serialize écrit exactement les clés prévues, dans l'ordre` | `serialize(SAVE_PLEINE)` | `Object.keys(JSON.parse(…))` = `['version','coins','level','history','settings','stats','album','welcomeSeen','packCode']` ; `version 1` |
| `R-68 CL-18 la partie en cours n'est jamais sauvegardée` | `serialize(SAVE_PLEINE)` | le texte ne contient ni `board`, ni `flipped`, ni `memos`, ni `payout` |
| `R-102 aller-retour serialize → deserialize identique` | `deserialize(serialize(SAVE_PLEINE))` | `save` `toEqual(SAVE_PLEINE)` ; `status 'ok'` |
| `R-102 aller-retour de la sauvegarde initiale` | `deserialize(serialize(initialSave()))` | `toEqual(initialSave())`, `'ok'` |
| `R-102 la sauvegarde écrite à la main est relue telle quelle` | `deserialize(raw({}))` | `toEqual(SAVE_PLEINE)`, `'ok'` (protège le format contre un changement silencieux) |
| `R-61 rien de sauvegardé → nouvelle sauvegarde` | `deserialize(null)` | `toEqual(initialSave())`, `'new'` |
| `CL-22 JSON illisible → repli sans planter` | `'{pas du json'`, `''`, `'null'`, `'42'`, `'[]'` | chaque fois `toEqual(initialSave())`, `'recovered'`, aucune exception |
| `CL-22 version inconnue : on garde le total de jetons` | `raw({ version: 99 })` | `game.coins 1234`, tout le reste = `initialSave()`, `'recovered'` |
| `CL-22 version absente ou invalide : on garde le total de jetons` | `raw({ version: undefined })`, `raw({ version: '1' })`, `raw({ version: 1.5 })` | `coins 1234`, le reste initial, `'recovered'` |
| `CL-22 version inconnue et jetons illisibles → 0` | `raw({ version: 99, coins: 'beaucoup' })` | `toEqual(initialSave())`, `'recovered'` |
| `R-102 un champ invalide est remplacé, les autres sont gardés` | `it.each` sur : `coins` (`-1`, `50_001`, `12.5`, `'10'`), `level` (`0`, `9`, `'3'`), `history` (6 éléments ; un élément `outcome 'GAGNE'` ; `cardsFlipped -1`), `stats` (`played -1` ; `maxLevel 0` ; absent), `album` (`[1]`, `['']`, `['p1','p1']`), `settings.sound` (`'oui'`), `settings.reducedMotion` (`'auto'`), `welcomeSeen` (`1`), `packCode` (`''`, `42`) | le champ prend sa valeur par défaut (tableau de validation) ; **tous les autres** champs égaux à `SAVE_PLEINE` ; `'recovered'` |
| `R-101 reducedMotion null est valide (non renseigné)` | `raw({ settings: { sound: false, reducedMotion: null } })` | `reducedMotion null`, `'ok'` |
| `R-102 les clés inconnues sont ignorées` | `raw({ partieEnCours: { x: 1 } })` | `toEqual(SAVE_PLEINE)`, `'ok'` |
| `R-102 limites valides acceptées` | `coins 0` et `50 000`, `level 1` et `8`, `history []`, `album []`, `packCode null` | `'ok'`, valeurs gardées |
| `R-102 l'état relu est gelé en profondeur, historique compris` | `deserialize(raw({})).save` | gelés : l'objet, `game`, `game.history`, **chaque élément** de `history`, `game.stats`, `game.album`, `settings` |
| `ADR-017 effacer la progression garde code, réglages et bienvenue` | `resetProgressInSave(SAVE_PLEINE)` | `game` `toEqual(initialGame())` ; `settings`, `welcomeSeen`, `packCode` égaux à ceux de `SAVE_PLEINE` ; gelé |
| `R-102 deserialize ne lève jamais d'exception` | 200 textes produits par `mulberry32(1)` : JSON valides de formes aléatoires (objets avec des clés de R-101 et des valeurs de types variés) et chaînes tronquées de `serialize(SAVE_PLEINE)` | aucune exception ; le résultat a toujours un `status` et une `save` dont `game.coins` est un entier dans [0, 50 000] |

## Critères d'acceptation
- [ ] **TDD réel** : tests écrits d'abord, échec constaté et noté dans le compte rendu.
- [ ] `npm run check` → code 0 ; les 325 tests précédents passent toujours.
- [ ] Les tests listés existent avec ces noms.
- [ ] `grep` : aucun `localStorage`, `Date`, `window` dans `src/logic/save.ts` (le test d'architecture le vérifie).
- [ ] Contre-épreuves (notées dans le compte rendu) : (a) ne pas reprendre `coins` sur une version inconnue → CL-22 rouge ; (b) accepter `coins 50 001` → test du champ invalide rouge ; (c) rejeter toute la sauvegarde dès qu'un champ est invalide → test « les autres sont gardés » rouge ; (d) ne pas geler les éléments de `history` → test du gel rouge ; (e) `resetProgressInSave` qui efface `packCode` → test ADR-017 rouge ; (f) laisser `JSON.parse` lever une exception → CL-22 JSON illisible rouge.
- [ ] `git status` avant commit : uniquement les fichiers du tableau « Fichiers » ; ajoutés un par un.

## Pièges connus
- `typeof null === 'object'` et `Array.isArray` : un objet JSON valide est `typeof x === 'object' && x !== null && !Array.isArray(x)`.
- Entiers : `Number.isInteger` (refuse `12.5`, `'10'`, `NaN`, `Infinity`).
- `JSON.stringify` supprime les clés `undefined` : dans le test `version: undefined`, la clé disparaît, c'est voulu (« version absente »).
- `reducedMotion: null` est **valide** ; ne pas le confondre avec un champ absent (absent → `null` aussi, mais statut `'recovered'`). Pour `settings` absent en entier : `sound true`, `reducedMotion null`, `'recovered'`.
- Ne pas réutiliser `serialize` pour fabriquer la fixture `raw` : écrire l'objet plat à la main, sinon le test du format ne prouve rien.
- Geler : `freezeGame` ne gèle pas les éléments de `history` ; les geler soi-même (`history.map((r) => Object.freeze({ ...r }))`) avant `freezeGame`.
- `deserialize` doit construire des objets **neufs** (ne jamais renvoyer des morceaux du JSON parsé avec des clés en trop).
- Le test de robustesse utilise une graine fixe ; pas de `Math.random`.
- Identifiants en anglais ; commentaires et noms de tests en français.

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
_(rempli par le codeur à la fin : ce qui a été fait, commits, écarts)_

## Relecture
_(verdict du relecteur, avec la date)_
