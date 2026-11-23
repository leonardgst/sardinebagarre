# T-011 — Ajouter le menu d'accueil, le dialogue Quitter et la question « Jouer au niveau {n} ? »

| Champ | Valeur |
|---|---|
| Statut | implémentée (relecture à faire) |
| Étape du plan | 2.3b |
| Branche | `t-011-menu-quitter` |
| Estimation | M (2 à 3 h), à la limite haute : une bonne part du diff est l'adaptation des tests e2e existants |
| Planifiée par | Opus — 2026-11-23 |
| Implémentée par | codeur (Sonnet) |

## Objectif
L'app s'ouvre sur un **menu d'accueil**. « Jouer au niveau {n} » lance une partie. Pendant la partie, **Quitter** demande une confirmation et encaisse le gain. Après chaque partie, le jeu demande **« Jouer au niveau {n} ? »** : Oui lance la partie suivante, Non ramène au menu. Le menu propose aussi **Quitter la table** (retour au niveau 1, après confirmation). Album, Infos et Réglages ouvrent pour l'instant un écran minimal avec un bouton Retour.

## Règles concernées
- `ADR-019` — navigation : menu au lancement ; « Jouer au niveau {n} » lance directement ; après la fin de partie, question Oui/Non ; boîte pleine → message puis menu. **À lire en entier.**
- `UI-01` — menu : titre « Sardinebagarre », niveau courant, total de jetons ; boutons Jouer, Album, Infos, Réglages, Quitter la table
- `R-40` — Quitter, seulement pendant `EN_COURS` (phase `playing`), avec confirmation Oui/Non :
  - gain = 0 : « Tu n'as encore trouvé aucun jeton. Quitter quand même ? »
  - sinon : « Si tu t'arrêtes maintenant, tu gagnes {gain} jeton(s). Tu t'arrêtes ? » (accord avec `coinsLabel`, ex. « tu gagnes 1 jeton », « tu gagnes 6 jetons »)
- `R-41` / `CL-12` — « Non » : retour au plateau dans l'**état exact** précédent (même `RoundState`, même message affiché, phase `playing`)
- `R-42` — « Oui » : `quit(round)`, partie `QUIT`, gain encaissé
- `R-50` / `UI-40` — encaissement visuel : le gain descend pendant que le total monte (comme pour une victoire) ; s'il vaut 0, pas d'animation de jetons
- `R-52` — révélation de tout le plateau, puis toucher pour continuer (déjà fait pour la victoire et la défaite ; à faire aussi pour l'abandon)
- `R-53` / `CL-14` — boîte pleine (`!canStartRound(game)`) : « Jouer » depuis le menu affiche le message `messages.boxFull` sur le menu et ne lance pas de partie ; en fin de partie, pas de question, retour au menu avec ce message
- `R-55` — `finalizeRound` juste après `quit`, avant toute animation, puis le point d'extension de sauvegarde
- `R-66` — le bandeau de niveau s'affiche après le toucher de fin, **puis** vient la question « Jouer au niveau {n} ? »
- `R-67` — Quitter la table : confirmation Oui/Non, puis `leaveTable(game)` (niveau 1, historique vidé)
- `CL-01` — 0 carte retournée puis Quitter : confirmation « aucun jeton », +0, niveau suivant 1 même depuis le niveau 6
- `CL-19` / `UI-22` — pendant `flipping`, Quitter est ignoré, comme tout autre toucher
- `CL-20` — pendant `ending`, un toucher (même sur Quitter) ne fait qu'accélérer
- Contrainte de la relecture de T-010 (journal) : tout dialogue ou bandeau est ajouté **dans `#app`**, jamais directement dans `body`. Sinon le second écouteur de `input.ts` le prend pour un toucher « ailleurs ».
- Contrainte de la revue de la logique : « Quitter la table » n'est possible que depuis le menu, donc jamais pendant une partie `PLAYING`.

## Périmètre
**Inclus**
1. **Menu (UI-01)** : nouveau `src/ui/render/menu.ts`. Il affiche :
   - le titre « Sardinebagarre » et la tête de chien dessinée (`dogHead`) ;
   - « Niveau {n} » et le total (`formatCoins`) ;
   - les boutons, avec un `data-action` propre à chacun : « Jouer au niveau {n} » (`play`), « Album » (`album`), « Infos » (`infos`), « Réglages » (`settings`), « Quitter la table » (`leave-table`) ;
   - une zone de message d'une ligne, pour la boîte pleine.
   Style Salon (ADR-018, `docs/maquettes/variante-1.html`) : boutons crème liserés d'or sur le tapis bordeaux, cibles ≥ 44 px, sans défilement sur iPhone SE.
2. **Écrans provisoires** Album, Infos et Réglages : un titre, une phrase (« Bientôt ici. ») et un bouton « Retour » (`data-action="back"`) qui ramène au menu. Pas de sous-menu Infos pour l'instant.
3. **Dialogue Oui/Non** générique : nouveau `src/ui/render/dialog.ts`.
   - Il comporte `role="dialog"`, `aria-modal="true"`, un texte (`aria-labelledby`) et deux boutons « Oui » (`data-action="yes"`) et « Non » (`data-action="no"`).
   - Il est ajouté dans `root` (`#app`), par-dessus l'écran, avec un voile.
   - Le focus est donné au bouton « Non » à l'ouverture.
   - Pendant qu'il est ouvert, seuls Oui et Non réagissent. Un toucher sur le voile, sur une carte, sur un bouton de l'écran ou hors de `#app` ne fait rien.
4. **Trois usages du dialogue** :
   - **Quitter (R-40..R-42)** :
     - Non → état exact précédent ;
     - Oui → `quit` → `finalizeRound` → sauvegarde → fin d'abandon, c'est-à-dire l'encaissement UI-40 si le gain est > 0 avec le message `wonPayoutMessage(crédité)`, puis la révélation, puis `waitingTap`.
   - **« Jouer au niveau {n} ? »** : posée après le toucher de fin et le bandeau R-66 éventuel.
     - Oui → nouvelle partie (`startRound`) ;
     - Non → menu.
     - Le plateau de la partie terminée reste affiché derrière le dialogue. La nouvelle partie n'est tirée qu'au « Oui ».
   - **Quitter la table (R-67)** : texte « Quitter la table ? Tu repartiras du niveau 1. ».
     - Oui → `leaveTable` → sauvegarde → menu mis à jour ;
     - Non → menu.
5. **Contrôleur** (`src/ui/controller.ts`) :
   - Le contrôleur démarre sur le menu, sans tirer de plateau. Le tirage se fait au « Jouer », pour qu'une graine donne le même premier plateau qu'aujourd'hui.
   - `Phase` reçoit les valeurs `menu`, `screen` (Album, Infos, Réglages) et `dialog`. Le type de dialogue ouvert est exposé par `dialog(): 'quit' | 'play' | 'leave' | null`.
   - La phase `full` disparaît : la boîte pleine se traite sur le menu.
   - Le point d'extension `onFinalized` est renommé **`onGameChange(game)`**. Il est appelé après `finalizeRound` **et** après `leaveTable` : c'est là que l'étape 3.1 branchera la sauvegarde (R-100).
   - Si le contrôleur dépasse ~350 lignes, extraire la navigation entre écrans dans un module séparé (`src/ui/screens.ts` par exemple), sans toucher à `src/logic/`.
6. **Entrées** (`src/ui/input.ts`) : un clic sur un élément `[data-action]` appelle `onAction(name)`, au lieu d'être ignoré. Le contrôleur décide selon la phase :
   - `quit` n'agit qu'en `playing` ; en `ending`, il accélère (CL-20) ; ailleurs, il ne fait rien ;
   - `memo` reste inerte (étape 2.4).
7. **Textes** dans `src/ui/texts.fr.ts` :
   - les deux phrases R-40 (avec `coinsLabel`) ;
   - « Jouer au niveau {n} ? » (question) et « Jouer au niveau {n} » (bouton) ;
   - « Oui », « Non », « Album », « Infos », « Réglages », « Quitter la table », « Bientôt ici. », « Retour » ;
   - le texte de confirmation de R-67.
8. **Crochet de debug** (`src/ui/debug.ts`, développement seulement) :
   - `setGame(game: GameState)` : accepté seulement en phase `menu`, gèle l'état (`freezeGame`) et met le menu à jour. Il sert aux tests (niveau 6, boîte pleine).
   - `dialog()` : renvoie le type de dialogue ouvert.
9. **Adaptation des tests e2e existants** : `ouvrir()` (`tests/e2e/aide.ts`) touche « Jouer » puis attend `.board`. Les tests qui enchaînent sur la partie suivante répondent « Oui » à la question. Ajouter à `roundForSeed(seed, game = initialGame())` un paramètre `game` facultatif.
10. **Captures** (`tests/e2e/screens.spec.ts`) :
    - `01-menu.png` ;
    - `08-dialogue-quitter.png` (gain > 0) ;
    - `09-jouer-niveau.png` (question après une partie).
    Les captures existantes restent valables.

**Exclu** (ne pas faire dans cette tâche)
- Contenu réel d'Album (§12), d'Infos (UI-03) et de Réglages (UI-04) ; « Vider la boîte » et l'achat de photo de R-53 (le message suffit ici).
- Sauvegarde (étape 3.1) : on renomme le point d'extension, rien de plus.
- Mode mémo (étape 2.4) : le bouton Mémo reste inerte.
- Clavier (UI-21, priorité P3) : Échap, `Q`, etc. Seul le focus initial sur « Non » est demandé.
- Sons de sélection (§10.5) et écran de bienvenue (UI-05).
- Aucune modification de `src/logic/` : `quit`, `leaveTable`, `canStartRound`, `startRound` et `finalizeRound` existent et sont testés.

## Fichiers
| Fichier | Action |
|---|---|
| `src/ui/render/menu.ts` | créer : menu UI-01 et écrans provisoires |
| `src/ui/render/dialog.ts` | créer : dialogue Oui/Non |
| `src/ui/controller.ts` | modifier : phases, navigation, Quitter, question de fin, Quitter la table, `onGameChange` |
| `src/ui/input.ts` | modifier : `onAction(name)` ; dialogue modal |
| `src/ui/render/hud.ts` | modifier si nécessaire (commentaire « inertes ») |
| `src/ui/texts.fr.ts` | modifier : nouveaux textes |
| `src/ui/debug.ts` | modifier : `setGame`, `dialog` |
| `src/ui/styles/main.css` | modifier : menu, écrans provisoires, dialogue et voile, style Salon, zones sûres |
| `tests/e2e/aide.ts` | modifier : `ouvrir` passe par le menu ; `roundForSeed(seed, game?)` ; aide `repondre(page, 'yes' \| 'no')` |
| `tests/e2e/menu.spec.ts` | créer |
| `tests/e2e/quitter.spec.ts` | créer |
| `tests/e2e/accueil.spec.ts`, `partie.spec.ts`, `plateau.spec.ts`, `screens.spec.ts` | modifier : passage par le menu, réponse à la question |

## Tests à écrire
Tests e2e Playwright, sur les 5 profils, en vrais clics (`locator().click()`), avec la graine fixe 42 et `?debug=1` quand il faut lire l'état. Chaque nom cite la règle.

| Nom du test | Entrée | Attendu |
|---|---|---|
| `ADR-019 au lancement, le menu s'affiche` | `./?seed=42` | titre « Sardinebagarre », « Niveau 1 », total `00000`, 5 boutons ; aucun `.board` ; phase `menu` |
| `UI-01 Jouer au niveau 1 lance la partie de la graine` | toucher « Jouer au niveau 1 » | `.board` visible ; `__sb.state().board` identique à `roundForSeed(42).board` ; phase `playing` |
| `UI-01 Album, Infos, Réglages puis Retour` | chaque bouton puis « Retour » | écran provisoire avec son titre, puis retour au menu (phase `menu`) |
| `R-40 Quitter à 0 jeton : message « aucun jeton »` | Jouer, Quitter | dialogue ouvert, texte exact « Tu n'as encore trouvé aucun jeton. Quitter quand même ? », `dialog() === 'quit'` |
| `R-40 Quitter avec un gain : message avec le gain` | Jouer, retourner le premier 2 ou 3 (valeur v), Quitter | texte exact « Si tu t'arrêtes maintenant, tu gagnes {v} jetons. Tu t'arrêtes ? » |
| `R-40 accord : tu gagnes 1 jeton` | Jouer, retourner un 1, Quitter | texte contenant « tu gagnes 1 jeton. » |
| `CL-12 Quitter puis Non : état exact` | Jouer, retourner un 1, noter `state()` et le message, Quitter, Non | `state()` profondément égal à l'état noté ; même message ; phase `playing` ; plus de `[role=dialog]` |
| `R-42 R-50 Quitter puis Oui : gain encaissé et plateau révélé` | Jouer, retourner un 2 (gain 2), Quitter, Oui | `game().coins === 2` dès la fermeture du dialogue (R-55, avant l'animation) ; puis phase `waitingTap` ; les 25 cartes sont faces visibles ; total affiché `00002` |
| `CL-01 abandon à 0 carte depuis le niveau 6 → niveau 1` | `setGame` niveau 6 (depuis le menu), Jouer, Quitter, Oui, toucher | `game().level === 1`, `coins` inchangé ; bandeau « Retour au niveau 1. » ; puis question « Jouer au niveau 1 ? » |
| `ADR-019 R-66 après le bandeau, question Jouer au niveau n` | gagner une partie au niveau 1, toucher | `.bandeau-niveau` « Niveau 2 atteint ! », puis dialogue « Jouer au niveau 2 ? » (`dialog() === 'play'`) |
| `ADR-019 Oui lance la partie suivante` | après la question, Oui | phase `playing`, « Niveau 2 » dans le bandeau, nouveau plateau |
| `ADR-019 Non ramène au menu avec le nouveau niveau et le total` | après la question, Non | phase `menu` ; « Niveau 2 » ; total = `game().coins` formaté ; bouton « Jouer au niveau 2 » |
| `ADR-019 sans changement de niveau, la question vient directement` | défaite au niveau 1 avec 1 carte retournée (niveau reste 1), toucher | pas de `.bandeau-niveau` ; dialogue « Jouer au niveau 1 ? » |
| `CL-19 Quitter pendant un retournement est ignoré` | Jouer, toucher une carte non Sardine, cliquer aussitôt Quitter (`force: true`) | aucun dialogue ; la phase revient à `playing` |
| `CL-20 Quitter pendant la fin n'ouvre rien` | Jouer, toucher la Sardine, cliquer Quitter (`force: true`) pendant `ending` | aucun dialogue ; la phase atteint `waitingTap` |
| `dialogue modal : toucher une carte ou le voile ne fait rien` | Quitter ouvert, clic sur le voile puis sur une carte (`force: true`) | dialogue toujours ouvert ; `state()` inchangé |
| `R-67 Quitter la table : Non garde le niveau, Oui remet au niveau 1` | `setGame` niveau 4 avec historique, « Quitter la table », Non, puis de nouveau Oui | après Non : niveau 4 ; après Oui : menu « Niveau 1 », `game().history` vide, `coins` inchangé |
| `R-53 CL-14 boîte pleine : Jouer affiche le message et reste au menu` | `setGame` avec `coins: 50000`, Jouer | message exact `messages.boxFull` sur le menu ; phase `menu` ; aucun `.board` |
| `T-011 un dialogue est dans #app` | Quitter ouvert | `#app [role=dialog]` existe ; `body > [role=dialog]` n'existe pas |

Pour les tests qui ont besoin d'un plateau à un niveau donné, calculer le plateau attendu avec `roundForSeed(42, game)`, où `game` est le même état que celui passé à `setGame`.

## Critères d'acceptation
- [x] `npm run check` passe (typecheck, lint, tests unitaires, contrôle de confidentialité)
- [x] `npm run e2e` (avec `E2E_PORT=5199` si le port 5173 est pris) : tous les tests listés ci-dessus existent et passent sur les 5 profils, ainsi que tous les tests existants adaptés. Pour les tests nouveaux qui utilisent un clic forcé ou une attente, `--repeat-each 5` est vert.
- [x] Contre-épreuves, faites puis annulées (`git diff src/` vide ensuite), et rapportées dans le compte rendu :
  - a. Si « Non » ne restaure pas le message précédent, `CL-12` échoue.
  - b. Si Quitter est accepté en phase `flipping`, `CL-19 Quitter…` échoue.
  - c. Si le dialogue est ajouté à `body` au lieu de `#app`, le test « dans #app » échoue.
  - d. Si `finalizeRound` est appelé après l'animation d'encaissement, `R-42 R-50` échoue (vérification de `coins` avant l'animation).
- [x] `npm run screens` : `01-menu.png`, `08-dialogue-quitter.png` et `09-jouer-niveau.png` sont produites sur les 5 profils et conformes à la checklist de la skill `controle-visuel` : aucun débordement ni défilement (iPhone SE compris), zones sûres respectées, boutons ≥ 44 px, dialogue lisible et centré, paysage sans débordement.
- [x] `grep -rn "document.body.append\|body.appendChild" src/ui` ne renvoie rien.
- [x] `src/logic/` n'est pas modifié (`git diff main --stat -- src/logic` vide).
- [x] `npm run build` passe et `__sb` est absent de `dist/`.

## Pièges connus
- **Graine** : le plateau ne doit être tiré qu'au « Jouer » (et au « Oui »), jamais au lancement ni au « Non ». Sinon `roundForSeed(42)` ne correspond plus au premier plateau, et les tests existants cassent.
- **CL-12, état exact** : le message de la zone de texte doit être restauré à l'identique. Ne pas réafficher le plateau (`drawBoard`) au « Non » : il suffit de retirer le dialogue.
- **R-55** : en cas d'abandon, `finalizeRound` et `onGameChange` sont appelés **au clic sur Oui**, avant l'encaissement visuel. Si l'app est fermée pendant l'animation, l'abandon est enregistré.
- **Partie vide (R-40)** : on peut quitter avant d'avoir retourné une carte (§5.1). La phase `playing` est active dès l'affichage du plateau.
- **Écouteur hors de `#app`** (Mac) : pendant `dialog`, `menu` et `screen`, `onElsewhere` ne doit rien faire.
- **Bandeau puis question** : `nextRound` ouvre aujourd'hui directement une nouvelle partie. Il faut le scinder : après le toucher, afficher le bandeau R-66 éventuel, puis ouvrir la question. La nouvelle partie n'est tirée qu'au « Oui ».
- **`setFast`** : remettre `setFast(false)` avant l'encaissement d'un abandon (le motif de C1 et C9 de T-010), sinon un toucher accélérateur antérieur couperait l'animation.
- **Le « Bravo » de R-66** (une fois par session) ne doit pas réapparaître quand on revient du menu.
- **iOS** : un dialogue positionné avec `position: fixed` doit rester dans les zones sûres (`env(safe-area-inset-*)`). Le voile ne doit pas empêcher l'écouteur délégué de `#app` de recevoir les clics sur Oui et Non.
- **Fins de ligne LF** pour tous les fichiers écrits (Biome refuse le CRLF).

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
Commit : `c426845` (feat(ui)) sur `t-011-menu-quitter`.

- Menu UI-01 (`render/menu.ts`), écrans provisoires Album/Infos/Réglages, dialogue Oui/Non modal dans `#app` (`render/dialog.ts`, focus sur Non).
- Contrôleur : phases `menu`, `screen`, `dialog` ; la phase `full` disparaît ; `onFinalized` devient `onGameChange` (aussi appelé après `leaveTable`) ; Quitter (R-40..R-42), question « Jouer au niveau {n} ? » après le bandeau R-66, Quitter la table (R-67), boîte pleine sur le menu (R-53). Le plateau n'est tiré qu'au « Jouer » / « Oui ».
- `Controller.round()` renvoie `RoundState | null` (aucune partie avant « Jouer ») ; le crochet debug `state()` lève une erreur sans partie. `setGame` et `dialog()` ajoutés au debug.
- `input.ts` : `onAction(name)`. Textes dans `texts.fr.ts`.
- Tests : 2 fichiers e2e créés (menu : 6 tests, quitter : 14 tests) ; tests existants adaptés (menu puis réponse à la question). `--repeat-each 5` sur menu + quitter : 500 passés. e2e complet : 210 passés, 10 ignorés (projets tactiles ou Mac).
- Contre-épreuves a à d faites (chacune fait échouer le test attendu : CL-12, CL-19 Quitter, « dans #app », R-42 R-50), puis annulées (`git diff src` vide).
- Captures : 01-menu, 08-dialogue-quitter, 09-jouer-niveau sur les 5 profils, vérifiées (iPhone SE, paysage, Mac).
- Écarts : aucun. Choix : en phase `waitingTap`, un clic sur Quitter ne fait rien (comme avant) ; le niveau du bandeau passe au nouveau niveau au début du bandeau R-66.

## Relecture
2026-11-23 — relecteur — 🔴 À reprendre.

Vérifications : `npm run check` OK (419 tests, confidentialité OK) ; `npm run e2e` 210 passés, 10 ignorés ; build OK, `__sb` absent de `dist/` ; `src/logic` inchangé ; aucun `body.append` ; captures 01, 08 et 09 regardées. Contre-épreuves sur une copie hors dépôt.

Règles recalculées : CL-01 (QUIT, 0 carte, niveau 6) → 1 ; R-66 victoire au niveau 1 → 2 ; défaite au niveau 1 avec 1 carte → 1, sans bandeau ; R-50 49 999 + 2 → 50 000 ; R-40 accord 1 jeton / 3 jetons.

Corrections :
- **C1** (bloquant) `src/ui/controller.ts` (`closeDialog`, `startNewRound`) : double toucher après un dialogue, le second toucher retourne la carte située sous le bouton.
  - Reproduit : `dblclick` sur « Non » de Quitter → Sardine retournée, partie perdue (4 profils sur 5, graine 42) ; `dblclick` sur « Oui » de « Jouer au niveau n ? » → une carte du nouveau plateau retournée (mac, iphone-se). R-41 et CL-12 sont violés.
  - À faire : ignorer les touchers de carte pendant environ 350 ms après la fermeture d'un dialogue et après l'affichage d'un nouveau plateau (par ex. horodatage `cardsLockedUntil` vérifié au début de `onCard`).
  - Piège : un verrou sans repère fait tomber ~20 tests e2e qui touchent une carte juste après `.board`. Poser un repère observable (par ex. `#app[data-verrou]`, retiré à la fin du délai) et faire attendre `#app:not([data-verrou])` à `ouvrir()` et `repondre()` dans `tests/e2e/aide.ts`.
  - Tests : « R-41 CL-12 double toucher sur Non : état exact » et « ADR-019 double toucher sur Oui : aucune carte retournée », rouges sans le verrou.
- **C2** (important) `controller.ts` (`onAction`) : hors `dialog`/`menu`/`screen`, tout bouton de l'écran de jeu se comporte comme un toucher d'écran : `ending` → `skip()` ; `waitingTap` → continuer (`afterRound`) ; Quitter n'ouvre le dialogue qu'en `playing`. Test : « R-52 toucher Quitter en waitingTap → question Jouer au niveau n » (rouge aujourd'hui).
- **C3** (important) `tests/e2e/quitter.spec.ts:177-186` « CL-20 Quitter pendant la fin n'ouvre rien » reste vert si l'on supprime `skip()` sur Quitter : exiger `waitingTap` en moins de 500 ms juste après le clic forcé, sans `reducedMotion`, comme le test C10 de `partie.spec.ts`.
- **C4** (important) Ajouter « ADR-019 R-53 boîte pleine en fin de partie : pas de question, menu avec le message » (`setGame({coins: 49999})`, multiplicateur, Quitter, Oui, toucher → phase `menu`, `messages.boxFull`, aucun dialogue). Comportement vérifié correct, mais sans test.
- **C5** (mineur) `controller.ts` (`afterRound`) : effacer « Touche l'écran pour continuer. » (`setMessage('')`) quand la question « Jouer au niveau n ? » s'ouvre.

Choix du codeur :
1. Quitter inerte en `waitingTap` : rejeté (C2). R-52 dit « toucher l'écran », et ce même bouton accélère déjà pendant `ending`.
2. Niveau du bandeau mis à jour au début du bandeau R-66 : accepté. Il reste à l'ancien niveau avant le toucher, puis passe au nouveau en même temps que l'annonce, ce qui est cohérent avec « Jouer au niveau n ? » et avec le menu.

2026-11-23 — relecteur — 2e relecture — 🟡 Approuvé avec réserves.

Vérifications : `npm run check` OK (419 tests, confidentialité OK) ; `npm run e2e` 230 passés, 10 ignorés (48 tests × 5 profils ; le « 270 » du compte rendu incluait les 40 captures @screens) ; capture 09 regardée (iphone-se, paysage) : zone de message vide. Contre-épreuves sur une copie hors dépôt : sans verrou → les 2 tests de double toucher rouges (9 échecs ; Non vert en paysage, faute de carte sous le bouton) ; sans `skip()` sur bouton en ending → CL-20 rouge ×5 ; sans `setMessage('')` → R-52 rouge ×5 ; question toujours posée → R-53 fin de partie rouge ×5.

C1 à C5 : conformes. Verrou en temps réel accepté (un double toucher humain ne dépend pas de la vitesse des animations) ; un seul timer, pas de timer orphelin ; Oui, Non et Quitter ne sont pas bloqués.

Corrections :
- **C6** (important) `controller.ts` (`openDialog`, `onAction` en phase dialog) : un double toucher sur une carte en `waitingTap` répond à « Jouer au niveau n ? ». Le dialogue s'ouvre sous le doigt et le second toucher atteint Oui ou Non (graine 42, défaite au niveau 1 : carte 16 → nouvelle partie sur 4 profils, carte 19 → menu sur 4 profils et nouvelle partie en paysage). Conséquence : la question est contournée et la seule sortie, Quitter à 0 carte, renvoie au niveau 1 (R-63). À faire : poser le verrou à l'ouverture d'un dialogue et ignorer `yes`/`no` tant qu'il est posé. Faire attendre `#app:not([data-verrou])` à `repondre()` AVANT le clic, ainsi qu'avant chaque clic ou dblclick direct sur Oui/Non dans les specs, sinon les tests de double toucher deviennent verts sans rien prouver. Test : « ADR-019 double toucher sur une carte en waitingTap : la question reste ouverte » (cartes 16 et 19 → phase dialog, `dialog() === 'play'`), rouge aujourd'hui.
- **C7** (mineur) `controller.ts` (`answer` play/Non, `onAction` menu) : un double toucher sur Oui ou Non au-dessus du menu ouvre « Album » (« Réglages » en paysage quand on répond Non). Poser le verrou avant `showMenu()` dans le cas play/Non et ignorer les actions du menu pendant le verrou. Test : « UI-01 double toucher sur Non : le menu reste affiché ».
- **C8** (mineur) Compte rendu : corriger le compte e2e (230 passés, 10 ignorés avec `npm run e2e`).

## Compte rendu des corrections de relecture
- C1 : verrou `LOCK_MS = 350` ms sur `onCard` (`lockCards()` à `closeDialog` et `startNewRound`), repère `#app[data-verrou]`, attendu par `ouvrir()` et `repondre()`. Durée réelle (`setTimeout`), volontairement non divisée par l'échelle « animations réduites » : le double toucher d'un humain dure ~100-300 ms quelle que soit l'animation, un verrou raccourci ne protégerait plus. Les tests attendent le repère, donc pas de ralentissement notable.
- C2 : hors `dialog`/`menu`/`screen`, tout bouton est un toucher d'écran (`ending` → `skip()`, `waitingTap` → `afterRound()`) ; Quitter n'ouvre le dialogue qu'en `playing`.
- C3 : CL-20 exige `waitingTap` en moins de 500 ms. C4 : test boîte pleine en fin de partie. C5 : `setMessage('')` à l'ouverture de la question ; capture 09 (iPhone SE) vérifiée.
- Tests ajoutés : 4 (double toucher Non, double toucher Oui, R-52 Quitter en waitingTap, R-53 boîte pleine) + CL-20 durci. `--repeat-each 5` : 125 passés. e2e complet : 270 passés, 10 ignorés.
- Contre-épreuves faites puis annulées : sans verrou, les 2 tests de double toucher échouent ; sans `skip()` sur le bouton en `ending`, CL-20 échoue.
