# T-013 — Brancher la sauvegarde (localStorage) sur le jeu

| Champ | Valeur |
|---|---|
| Statut | implémentée (relecture à faire) |
| Étape du plan | 3.1 |
| Branche | `t-013-sauvegarde` |
| Estimation | M (1 à 2 h) |
| Planifiée par | Opus — 2026-11-24 |
| Implémentée par | codeur (Sonnet) |

## Objectif
Le total de jetons, le niveau, l'historique, les records et le reste de la sauvegarde survivent à un rechargement ou à une fermeture de l'app. La partie en cours, elle, est oubliée (R-68). Une sauvegarde absente, corrompue ou illisible ne fait jamais planter l'app.

## Règles concernées
- `R-100` : `localStorage`, clé `sardinebagarre:save`, JSON versionné, écrit à chaque changement de l'état persistant. Dans cette tâche, seuls existent la fin de partie (R-55) et « Quitter la table » (R-67). Les autres déclencheurs (album, réglages, code, bienvenue, vider la boîte, effacer) viendront avec leurs écrans.
- `R-101` : contenu (déjà défini par `serialize` dans `src/logic/save.ts`).
- `R-102` / `CL-22` : lecture tolérante (déjà dans `deserialize`).
- `R-55` / `CL-23` : sauvegarde écrite au moment de la finalisation, avant toute animation.
- `R-68` / `CL-18` : la partie en cours n'est pas sauvegardée. Au retour : menu, même niveau, même total, même historique.
- `R-53` : boîte pleine au lancement (total ≥ 50 000).
- `R-103` : données sur l'appareil seulement.

## Décisions prises pour cette tâche
1. **`src/ui/storage.ts`** (seul fichier qui touche `localStorage`) exporte :
   - `export const SAVE_KEY = 'sardinebagarre:save';`
   - `loadSave(): { save: SaveData; status: LoadStatus }` : lit la clé et appelle `deserialize`. Si `localStorage` lève une exception (navigation privée, stockage bloqué), le résultat est `deserialize(null)`.
   - `writeSave(save: SaveData): boolean` : `setItem(SAVE_KEY, serialize(save))` dans un `try/catch`. Renvoie `false` en cas d'échec (quota, stockage bloqué), sans lever d'exception.
2. **`src/ui/main.ts`** charge la sauvegarde au démarrage et garde le `SaveData` courant. Il passe `save.game` au contrôleur. À chaque `onGameChange(game)`, il remplace `game` dans le `SaveData` courant **en conservant** `settings`, `welcomeSeen` et `packCode`, puis appelle `writeSave`.
3. **Pas d'écriture au chargement**, même si le statut est `recovered`. La sauvegarde corrigée sera écrite au prochain changement. Un message au joueur pour `recovered` n'est pas prévu (CL-22 demande seulement de ne pas planter).
4. **Contrôleur** : `ControllerOptions` gagne `initialGame?: GameState` (par défaut `initialGame()`), gelé avec `freezeGame`. Le bandeau (`shown`) part de ces valeurs.
5. **Boîte pleine au lancement** (contrainte C4 de la relecture de T-010) : si `canStartRound(game)` est faux au démarrage, le menu affiche `messages.boxFull` dès le lancement, avec le bon niveau et le bon total. `createController` ne lève pas d'exception.
6. **Crochet de debug** : `setGame` reste un raccourci de test et **n'écrit pas** la sauvegarde. Les tests de sauvegarde préparent `localStorage` eux-mêmes (avec `serialize` de `src/logic/save.ts` et `SAVE_KEY`), puis rechargent la page.

## Périmètre
**Inclus** : `storage.ts`, branchement dans `main.ts` et `controller.ts`, menu « boîte pleine » au lancement, tests e2e ci-dessous, test unitaire de `storage.ts` si l'environnement de Vitest le permet sans dépendance nouvelle (sinon, e2e seulement, à indiquer dans le compte rendu).

**Exclu** : écrans Album, Réglages, Bienvenue, code du pack (étapes 3.3 et 4.x), « Vider la boîte », « Effacer la progression », service worker et R-104 (étape 3.2), toute modification de `src/logic/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/ui/storage.ts` | créer |
| `src/ui/main.ts` | modifier |
| `src/ui/controller.ts` | modifier (`initialGame`, boîte pleine au lancement) |
| `tests/e2e/sauvegarde.spec.ts` | créer |
| `tests/e2e/aide.ts` | modifier (aide pour écrire une sauvegarde avant le chargement, par exemple via `page.addInitScript`, et pour la relire) |

## Tests à écrire (e2e, `tests/e2e/sauvegarde.spec.ts`)
Chaque test écoute `pageerror` et vérifie qu'aucune erreur n'a été levée. Pour lire la sauvegarde : `JSON.parse(localStorage.getItem(SAVE_KEY))` dans la page.

| Nom du test | Scénario | Attendu |
|---|---|---|
| `R-100 premier lancement : aucune sauvegarde, menu niveau 1, total 0` | Contexte neuf | menu « niveau 1 », total 0 ; `localStorage` sans la clé tant qu'aucune partie n'est finie |
| `R-55 R-100 une défaite est sauvegardée avant l'animation` | Graine 42, retourner une Sardine, puis lire la sauvegarde **pendant** la phase `ending` | `history.length === 1`, `outcome === 'LOST'`, `stats` mis à jour, niveau calculé |
| `R-55 CL-23 recharger pendant la révélation ne perd rien` | Gagner ou abandonner avec un gain > 0 ; recharger pendant `ending` (avant `waitingTap`) | menu avec le total crédité et le niveau suivant |
| `R-42 R-100 un abandon est sauvegardé` | Retourner un « 1 » et un multiplicateur sûrs, Quitter, Oui | `coins` = gain, `history[0].outcome === 'QUIT'` |
| `CL-18 R-68 recharger en pleine partie : partie oubliée` | Sauvegarde préparée : niveau 5, total 100, 2 parties d'historique. Jouer, retourner des cartes sûres (gain > 0), recharger | menu « niveau 5 », total 100 ; sauvegarde identique à celle préparée (historique inchangé) ; « Jouer » lance une partie au niveau 5 |
| `R-67 R-100 Quitter la table est sauvegardé` | Sauvegarde au niveau 4 ; menu, Quitter la table, Oui ; recharger | menu niveau 1, total inchangé |
| `R-101 les champs hors jeu sont conservés` | Sauvegarde préparée avec `settings.sound = false`, `welcomeSeen = true`, `packCode = 'abc'` ; finir une partie | la sauvegarde écrite garde `sound: false`, `welcomeSeen: true`, `packCode: 'abc'` |
| `CL-22 sauvegarde corrompue : pas de plantage` | `localStorage` = `"{pas du json"` | menu niveau 1, total 0, une partie se lance |
| `CL-22 version inconnue : on garde le total` | `{"version":99,"coins":1234}` | menu niveau 1, total 1234 |
| `CL-22 R-102 champ invalide isolé` | Sauvegarde valide mais `level: 12` et `coins: 300` | menu niveau 1, total 300 |
| `CL-22 stockage indisponible : le jeu tourne` | `addInitScript` qui remplace `Storage.prototype.getItem` et `setItem` par des fonctions qui lèvent | menu niveau 1 ; une partie se joue jusqu'à la défaite et la question « Jouer au niveau n ? » s'ouvre ; aucune `pageerror` |
| `R-53 boîte pleine au lancement` | Sauvegarde `coins: 50000`, niveau 3 | le menu affiche le message de boîte pleine, niveau 3, total 50 000 ; « Jouer » ne lance pas de partie |
| `R-51 C3 total plafonné : 49 990 + gain ≥ 10 → « Tu remportes 10 jetons ! »` | Sauvegarde `coins: 49990` ; gagner la partie de la graine 42 (toutes les cartes 2 et 3 de `roundForSeed(42, game)`) | message « Tu remportes 10 jetons ! », total affiché 50 000, sauvegarde `coins === 50000` |

## Critères d'acceptation
- [x] `npm run check` passe.
- [x] `npm run e2e` (avec `E2E_PORT=5199` si besoin) : tous les tests ci-dessus et tous les tests existants passent sur les 5 profils. Les tests qui rechargent pendant une animation passent avec `--repeat-each 5`.
- [x] Contre-épreuves faites puis annulées (`git diff src/` vide ensuite) et rapportées :
  - a. Si `main.ts` n'appelle pas `writeSave` dans `onGameChange`, `CL-18` ou `R-55` échoue.
  - b. Si `main.ts` écrit `initialSave()` au lieu de garder `settings`/`welcomeSeen`/`packCode`, `R-101` échoue.
  - c. Si `loadSave` n'attrape pas l'exception de `getItem`, `CL-22 stockage indisponible` échoue.
  - d. Si le contrôleur ignore `initialGame`, `CL-18` échoue.
- [x] `grep -rn "localStorage" src` ne trouve que `src/ui/storage.ts` (et la règle Biome de `src/logic`).
- [x] `git diff main --stat -- src/logic` est vide.
- [x] `npm run build` passe et `__sb` est absent de `dist/`.
- [x] `npm run screens` : les captures existantes sont inchangées (aucune modification d'interface attendue, sauf le menu boîte pleine qui n'a pas de capture).

## Pièges connus
- **Isolation des tests** : Playwright crée un contexte neuf par test, donc un `localStorage` vide. Les tests existants ne doivent pas dépendre d'une sauvegarde laissée par un autre.
- **`addInitScript`** s'exécute à **chaque** chargement, rechargements compris. Pour préparer une sauvegarde une seule fois puis recharger, écrire dans `localStorage` via `page.evaluate` après un premier `goto`, puis `page.reload()`. Sinon le rechargement réécrit la sauvegarde préparée et le test ne prouve rien.
- **Graine** : la graine vient de l'URL (`?seed=`). Après `reload()`, l'URL est conservée, donc le générateur repart de zéro : le premier plateau après rechargement est de nouveau `roundForSeed(seed, game)` (avec le `game` chargé).
- **Gel** : l'état venu de la sauvegarde est déjà gelé par `deserialize`. Le repasser dans `freezeGame` est sans danger.
- **Plafond R-51** : le message utilise le montant réellement crédité (`game.coins - previousCoins`), déjà calculé ainsi dans `ending()`.
- **Fins de ligne LF.**

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
- `src/ui/storage.ts` (SAVE_KEY, loadSave, writeSave), branchement dans `main.ts` (écriture à chaque `onGameChange`, aucune écriture au chargement, settings/welcomeSeen/packCode conservés), `initialGame` dans le contrôleur et menu « boîte pleine » dès le lancement.
- Tests : 13 e2e dans `tests/e2e/sauvegarde.spec.ts`, aides dans `aide.ts`. Rouge avant le code (iphone-15, `storage.ts` réduit à la constante) : 10 échecs et 3 réussites triviales (premier lancement, sauvegarde corrompue, stockage indisponible : l'ancien code ne lisait ni n'écrivait rien).
- Vert : `npm run check` OK (419 tests) ; `npm run e2e` 395 réussis, 10 ignorés (déjà ignorés) ; `sauvegarde.spec.ts --repeat-each 5` sur les 5 profils : 325 réussis. `npm run build` OK, `__sb` absent de `dist/`. `localStorage` seulement dans `storage.ts` ; `git diff main --stat -- src/logic` vide.
- Contre-épreuves (iphone-15, annulées ensuite) : a. sans `writeSave` : 6 échecs (R-55, R-42, R-67, R-101, R-51, CL-23) ; b. `initialSave()` au lieu de conserver : R-101 échoue ; c. `getItem` non protégé : « stockage indisponible » échoue ; d. `initialGame` ignoré : 7 échecs dont CL-18.
- M1 (relecture) : le test CL-23 vérifie la phase `ending` avant le rechargement, puis l'historique (une entrée WON, niveau 1) et `stats.won === 1` ; 25 réussis avec `--repeat-each 5`, check OK.
- Écarts : pas de test unitaire de `storage.ts` (Vitest sans `localStorage`, couvert par l'e2e). `npm run screens` passe ; aucune modification d'interface, captures non rouvertes.

## Relecture
### Relecture du 2026-11-24 (relecteur) — 🟢 APPROUVÉ
Vérifications : `npm run check` OK (419) · e2e OK (5 profils, 440 réussis, 10 ignorés) · tests de rechargement CL-23/CL-18/R-55 en --repeat-each 3 sur 5 profils : 45 réussis · build OK, `__sb` absent de dist/.
Conformité : R-100 (aucune écriture au chargement, écriture à la finalisation et à « Quitter la table »), R-101 (settings/welcomeSeen/packCode conservés d'une écriture à l'autre), R-102/CL-22 (corrompue, version inconnue, champ isolé, stockage indisponible), R-55/CL-23 (sauvegarde avant `phase = 'ending'`), R-68/CL-18 (sauvegarde inchangée octet pour octet), R-53 (boîte pleine au lancement, « Jouer » inerte), R-51/C3. `localStorage` seulement dans storage.ts ; src/logic inchangé.
Piège addInitScript évité : préparation par evaluate + reload ; R-67 et CL-23 rechargent après une écriture de l'app.
Contre-épreuves du relecteur (annulées) : e. sauvegarde après l'animation de fin → R-55, CL-23, R-101 échouent ; f. écriture au chargement → « premier lancement » échoue ; g. gain en cours sauvegardé → CL-18 échoue.
Mineurs (non bloquants) :
- M1. Test CL-23 : vérifier `phase() === 'ending'` juste avant reload, puis vérifier historique (WON, niveau 1) et `stats.won === 1` après rechargement.
- M2. journal.md : statut de T-013 et « Prochaines étapes » à mettre à jour.
- M3. spec R-68 et CL-18 : préciser « retour au menu (ADR-019) ».

2026-11-24 — Opus — M2 et M3 faits (journal, spec annotée). M1 confié au codeur.
