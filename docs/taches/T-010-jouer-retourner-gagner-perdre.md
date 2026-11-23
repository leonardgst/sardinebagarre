# T-010 — Jouer : retourner une carte, gagner, perdre, enchaîner les parties

| Champ | Valeur |
|---|---|
| Statut | à relire |
| Étape du plan | 2.3a |
| Branche | `t-010-jouer` |
| Estimation | L (> 3 h), à la limite : voir le découpage dans « Périmètre » |
| Planifiée par | Opus — 2026-11-22 |
| Implémentée par | codeur (Sonnet) |

## Objectif
On peut jouer de bout en bout au doigt ou à la souris :
- toucher une carte la retourne, avec une animation ;
- le gain se met à jour ;
- la Sardine fait perdre (tête qui surgit, aboiement synthétisé) ;
- trouver tous les 2 et 3 fait gagner (encaissement) ;
- dans tous les cas, le plateau se révèle, puis un toucher lance la partie suivante au bon niveau, avec le message de niveau.

L'état durable (`GameState`) est finalisé **avant** toute animation (R-55), prêt pour la sauvegarde de l'étape 3.1.

## Règles concernées
- `R-30` — seule une carte face cachée se retourne ; toucher une carte retournée ne fait rien
- `R-31` — retourner efface le mémo (déjà dans `flip`)
- `R-32`, `R-33`, `R-34` — gain, victoire quand tous les 2 et 3 sont retournés, défaite sur la Sardine (déjà dans `flip`)
- `R-50`, `R-51` — encaissement plafonné à 50 000 si gagné, rien si perdu (déjà dans `finalizeRound`)
- `R-52` — quelle que soit l'issue : révélation de tout le plateau, puis **toucher pour continuer** ; le message de niveau vient après ce toucher
- `R-53` — au lancement d'une partie, si `total ≥ 50 000` : message « boîte pleine » et pas de partie
- `R-55` — `finalizeRound` appelé **dès** que `flip` renvoie un statut ≠ `PLAYING`, avant toute animation
- `R-62..R-66` — niveau suivant (déjà dans `finalizeRound`) et messages R-66 :
  - montée : « Niveau {n} atteint ! » puis « Bravo ! Tu peux gagner encore plus de jetons. » (**une seule fois par session**) ;
  - descente : « Retour au niveau {n}. » ;
  - niveau identique : aucun message
- `CL-19` — double toucher rapide : un seul retournement ; entrées bloquées pendant l'animation de retournement
- `CL-20` — toucher pendant une animation de fin : accélère ou termine l'animation, **ne déclenche aucune autre action** (jamais `flip`)
- `CL-21` — le jeu ne retourne jamais de carte automatiquement
- `UI-20`, `UI-22` — toucher une carte pour la retourner ; entrées ignorées pendant les animations bloquantes, sauf le toucher pour accélérer
- `UI-30` — retournement (rotation 3D sur l'axe Y), 250 ms
- `UI-31` — Sardine : la tête surgit (zoom + rebond), le plateau tremble, aboiement, 800 ms
- `UI-40` — encaissement : le gain de la partie descend pendant que le total monte, ≤ 1,5 s, un toucher le termine
- `UI-41` — victoire : bandeau « Gagné ! », 1,5 s (le **jingle** est exclu, voir plus bas)
- `UI-42` — révélation de fin : les cartes encore cachées se retournent en vague, 600 ms
- `UI-43` — changement de niveau : bandeau « Niveau {n} », 1,2 s
- `UI-50` — aboiement **synthétisé** (bruit filtré + enveloppe, deux « wouf » courts). Le premier son n'est joué qu'après une interaction (iOS).
- `UI-60` — messages d'ambiance tirés au hasard dans des listes (générateur **`decor`**, jamais `board`)
- `UI-04` (partiel) — animations réduites : durées divisées par 4 si `prefers-reduced-motion: reduce` (le réglage dans l'app viendra plus tard)

## Périmètre
**Inclus**
- `src/ui/controller.ts`. Il garde `game`, `round`, les deux générateurs et une **phase** :
  - `playing` : partie en cours, entrées acceptées ;
  - `flipping` : retournement en cours, entrées ignorées (CL-19) ;
  - `ending` : animations de fin, un toucher accélère ;
  - `waitingTap` : plateau révélé, un toucher continue ;
  - `full` : boîte pleine, R-53.

  Déroulement :
  1. **Toucher une carte en `playing`** : `flip`.
     - Si la carte est déjà retournée : rien (R-30). Le son « refus » est exclu.
     - Sinon :
       - passer en `flipping` ;
       - si le statut n'est plus `PLAYING` : **appeler `finalizeRound` tout de suite** et ranger le nouveau `game` (R-55). Appeler ensuite un point d'extension `onFinalized(game)`, vide pour l'instant : c'est là que l'étape 3.1 branchera la sauvegarde ;
       - jouer UI-30 (ou UI-31 si c'est une Sardine), mettre à jour le gain du bandeau et le message, puis revenir en `playing` si la partie continue.
  2. **Fin de partie**, en phase `ending` :
     - victoire : UI-41, puis UI-40 ;
     - défaite : UI-31, déjà joué au retournement ;
     - dans les deux cas : UI-42, révélation des cartes encore cachées.

     Pendant `ending`, un toucher termine l'animation en cours, voire tout l'enchaînement de fin (CL-20).
  3. **`waitingTap`** : un toucher affiche le bandeau UI-43 et le message R-66 si le niveau a changé, puis lance `startRound(game, rngs.board)` et réaffiche. Si `startRound` renvoie `null` : phase `full` et message R-53.
- **Messages de la zone de message** (tous dans `texts.fr.ts`, avec accord du pluriel : 0 ou 1 → « jeton », 2 et plus → « jetons ») :
  - **première** carte chiffrée : « {v} ! Tu gagnes {n} jeton(s) ! » ;
  - 2 ou 3 retourné ensuite : « ×{v} ! Tu as maintenant {n} jetons ! » ;
  - 1 retourné ensuite : le message ne change pas (décision d'Opus, voir Questions) ;
  - Sardine : un message tiré dans la liste `sardine`. Liste de base :
    - « Wouf ! Sardine t'a tout pris. 0 jeton. »
    - « Ouaf ! Sardine a trouvé ta cachette… 0 jeton. »
    - « Sardine est passée par là : 0 jeton ! » ;
  - victoire : « Gagné ! Tu as trouvé tous les 2 et les 3. », puis après UI-40 : « Tu remportes {n} jeton(s) ! » ;
  - attente du toucher (après la révélation) : « Touche l'écran pour continuer. » ;
  - R-66 et R-53 : textes exacts de la spec.
- `src/ui/input.ts` : un seul écouteur (`pointerup` ou `click`, délégué sur `#app`), qui transmet au contrôleur « carte {id} touchée » ou « toucher ailleurs ». Pas de clavier (UI-21, P3).
- `src/ui/anim.ts` : petites fonctions à base de promesses.
  - `play(el, classe, durée)` et `wait(durée)` peuvent être **interrompues** par un `skip()` (CL-20).
  - Les durées passent par un `scale()` : ÷ 4 si `prefers-reduced-motion: reduce`.
  - Les animations sont en CSS (`@keyframes` dans `main.css`) : rotation Y, rebond et secousse, vague de révélation avec un délai par carte, bandeaux.
- `src/ui/audio.ts` :
  - `bark()` synthétise l'aboiement UI-50 en Web Audio : bruit filtré passe-bande et enveloppe, deux impulsions d'environ 120 ms séparées d'environ 90 ms ;
  - `AudioContext` est créé paresseusement, au premier geste de l'utilisateur ;
  - aucun son si `AudioContext` est indisponible, sans erreur.
- Mise à jour du rendu **en place** : le retournement modifie l'élément de la carte et ne reconstruit pas le plateau, pour que les animations soient visibles. Le bandeau a une fonction `updateHud(level, payout, total)`.
- `src/ui/debug.ts`, en développement seulement :
  - garder `flip`, `mark` et `state` (utilisés par les captures) ;
  - ajouter `game()` (lit le `GameState` du contrôleur) et `phase()` (lit la phase courante) ;
  - `__sb.flip` reste un raccourci de capture qui ne passe **pas** par le contrôleur.
- Les tests et les captures listés plus bas.

**Exclu** (ne pas faire dans cette tâche)
- Bouton Quitter et son dialogue, menu d'accueil UI-01 (T-011, étape 2.3b). Les boutons Mémo et Quitter restent inertes.
- Mode mémo (étape 2.4).
- Sauvegarde `storage.ts` (étape 3.1) : seulement le point d'extension `onFinalized`.
- Autres sons que l'aboiement : refus, tic, jingles, niveau (étape 4). Bouton muet.
- Message de suspense R-90 (étape 4).
- Animations UI-32 (compteur du gain) et UI-33 (« ×2 ! » flottant) : le gain s'affiche directement.
- Clavier UI-21.
- Toute modification de `src/logic/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/ui/controller.ts` | créer |
| `src/ui/input.ts` | créer |
| `src/ui/anim.ts` | créer |
| `src/ui/audio.ts` | créer |
| `src/ui/main.ts` | modifier (création du contrôleur) |
| `src/ui/render/board.ts`, `src/ui/render/hud.ts` | modifier (mise à jour en place, bandeaux) |
| `src/ui/texts.fr.ts` | modifier (messages, listes UI-60, pluriels) |
| `src/ui/styles/main.css` | modifier (animations, bandeaux) |
| `src/ui/debug.ts` | modifier (`game()`, `phase()`) |
| `tests/ui/texts.test.ts` | créer |
| `tests/e2e/partie.spec.ts` | créer |
| `tests/e2e/screens.spec.ts` | modifier (nouvelles captures) |

## Tests à écrire
Vitest (`tests/ui/texts.test.ts`, fonctions pures de `texts.fr.ts`) :

| Nom du test | Entrée | Attendu |
|---|---|---|
| `UI-60 pluriel de jeton` | 0, 1, 2, 50000 | « 0 jeton », « 1 jeton », « 2 jetons », « 50000 jetons » |
| `R-66 montée de niveau, avec et sans Bravo` | de 1 à 2, `bravoDéjàVu` faux puis vrai | `["Niveau 2 atteint !", "Bravo ! Tu peux gagner encore plus de jetons."]`, puis `["Niveau 2 atteint !"]` |
| `R-66 descente de niveau` | de 4 à 2 | `["Retour au niveau 2."]` |
| `R-66 niveau identique : aucun message` | de 3 à 3 | `[]` |
| `UI-60 tirage dans la liste sardine` | `rng` qui renvoie 0, puis 0,99 | 1er puis dernier élément de la liste |

E2E (`tests/e2e/partie.spec.ts`, projets `iphone-15` et `mac` au minimum). Utiliser `page.emulateMedia({ reducedMotion: 'reduce' })` pour accélérer. Les ids des cartes se calculent depuis la logique (`tests/e2e/aide.ts`, même graine), sans valeur codée en dur.

| Nom du test | Scénario | Attendu |
|---|---|---|
| `R-32 R-33 R-50 partie gagnée` | `?seed=42` ; toucher tous les 2 et 3 (aucune Sardine) | bandeau « Gagné ! » ; total final = produit des multiplicateurs ; après révélation, 25 cartes face visible ; toucher → « Niveau 2 atteint ! » et « Bravo !… » ; nouvelle partie au niveau 2 avec 25 cartes cachées |
| `R-34 R-51 R-63 partie perdue` | `?seed=42` ; toucher 2 cartes « 1 », puis une Sardine | jetons de la partie `00000`, total inchangé ; message de la liste sardine ; révélation complète ; toucher → nouvelle partie au niveau `min(1, k, 7)` = 1, sans message de niveau |
| `R-55 état finalisé avant les animations` | `?seed=42&debug=1` ; toucher une Sardine, puis lire `__sb.game()` **aussitôt** (sans attendre) | `history.length === 1`, `stats.lost === 1` |
| `R-30 toucher une carte retournée ne fait rien` | retourner un 1, attendre `playing`, le retoucher | `__sb.state().cardsFlipped === 1`, gain inchangé |
| `CL-19 double toucher rapide` | deux `click` sans attente sur la même carte, puis sur deux cartes différentes | 1 seul retournement dans les deux cas (`cardsFlipped === 1`) |
| `CL-20 toucher pendant la fin` | après la Sardine, toucher une carte cachée pendant la phase `ending` | aucune exception ; on n'est pas passé à la partie suivante ; la phase devient `waitingTap` (révélation terminée) ; un toucher de plus est nécessaire pour lancer la partie suivante |
| `CL-21 aucun retournement automatique` | `?seed=42` ; attendre 1 s sans toucher | 25 cartes cachées |

Captures `@screens` (5 profils), nouvelles :
- `04-gain.png` : quelques cartes chiffrées retournées, message du gain ;
- `06-victoire.png` : bandeau « Gagné ! » ou plateau révélé après victoire ;
- `07-defaite-revelation.png` : refaite par le vrai parcours, Sardine touchée puis révélation complète ;
- `08-niveau.png` : bandeau UI-43 « Niveau 2 ».

## Critères d'acceptation
- [x] `npm run check` passe
- [x] `npm run e2e` passe sur les 5 projets (les tests de partie sur au moins `iphone-15` et `mac`)
- [x] `npm run screens` produit les captures listées. Elles sont vérifiées avec la checklist `controle-visuel`, et le compte rendu cite les problèmes vus et corrigés.
- [x] `grep -rn "finalizeRound" src/ui` : un seul appel, dans `controller.ts`, placé **avant** tout `await` d'animation (le relecteur le vérifie dans le code)
- [ ] Aucun texte affiché en dur hors de `texts.fr.ts` ; tous les tirages de messages utilisent `rngs.decor`
- [x] `npm run build` passe et `__sb` est absent du build
- [ ] Test manuel par l'humain, `npm run dev`, PC à la souris : une partie gagnée et une partie perdue, l'aboiement s'entend

## Pièges connus
- **R-55 avant tout** : finaliser, puis seulement animer. Ne jamais recalculer le niveau à la fin de l'animation.
- **CL-20** : en `ending` et `waitingTap`, un toucher sur une carte ne doit **jamais** atteindre `flip`. Sinon on obtient une erreur ou un « refus », et une partie déjà finie serait rejouée.
- Les promesses d'animation doivent pouvoir être interrompues : un `skip()` résout l'attente en cours, et la suite de l'enchaînement de fin passe à sa durée minimale.
- `animationend` ne se déclenche pas toujours (onglet caché, `display: none`) : prévoir aussi un `setTimeout` de secours.
- iOS : `AudioContext` doit être créé (ou repris avec `resume()`) **dans** le gestionnaire du geste. Pas de `navigator.vibrate`.
- `touch-action: manipulation` est déjà posé (UI-13). Ne pas ajouter d'écouteur `touchstart` qui bloque le défilement : `pointerup` ou `click` suffit.
- Message « Bravo ! » : un drapeau gardé en mémoire dans le contrôleur, pas dans la sauvegarde (« une seule fois par session »).
- Les ids sont toujours entre 0 et 24 : sinon `flip` lève une `RangeError`. Ne transmettre que des ids lus sur `data-id`.

## Questions
- Décision d'Opus, que l'humain peut changer : quand on retourne un **1 après la première carte**, le message ne change pas. Les exemples de §10.6 ne prévoient rien pour ce cas. → **Validée par l'humain le 2026-11-22.**

## Compte rendu
Fait : contrôleur à phases (`controller.ts`), entrées déléguées (`input.ts`), animations interruptibles (`anim.ts`), aboiement synthétisé (`audio.ts`), mise à jour en place du plateau et du bandeau, messages et pluriels dans `texts.fr.ts`, CSS des animations et bandeaux, crochets `game()` et `phase()`. `finalizeRound` est appelé une seule fois (`controller.ts`), avant tout `await`, puis `onFinalized`.
Tests : 5 Vitest (`tests/ui/texts.test.ts`), 7 e2e (`tests/e2e/partie.spec.ts`) ; check OK (419), e2e 90 passés, build OK sans `__sb`.
Captures vérifiées (iphone-15, paysage, se) : 04, 05 (tête qui surgit), 06, 06b, 07, 08. Réglé : captures prises trop tôt (tête et bandeau pas encore visibles).
Choix : le message de la Sardine est posé au toucher (avant l'animation) ; le bandeau UI-43 affiche les messages R-66 (titre + « Bravo ») ; cartes révélées légèrement assombries pour les distinguer de celles retournées par le joueur ; durées de l'ouverture du bandeau ÷ 4 via CSS en mouvement réduit.
Reste pour l'humain : test manuel (aboiement audible), non faisable ici.

## Relecture
2026-11-22 — relecteur — 🟡 Approuvé avec réserves. check OK (419), e2e 115 passés (captures comprises), build OK sans `__sb`, captures vues.
- R-55 conforme : un seul `finalizeRound`, appelé de façon synchrone avant tout `await`.
- CL-19 et CL-20 conformes : aucun chemin vers `flip` hors de `playing`, `play()` a un `setTimeout` de secours, `ending()` est dans un `try/finally`.
- L'écouteur délégué sur `#app` est compatible avec iOS : **ne pas le déplacer vers `document` ou `body`**.
- Écarts du codeur acceptés.

Test de l'humain sur un vrai iPhone (2026-11-22, `npm run dev -- --host`) : on joue au toucher, et toucher le fond lance la partie suivante. L'aboiement s'entend sur PC.

Corrections demandées (décidées par Opus) :
- **C1** (important, avant fusion) `src/ui/anim.ts:18`, `src/ui/controller.ts:181, 215, 219` : le mode accéléré (`fast`) reste actif après un toucher pendant la fin ou pendant le bandeau de niveau. La partie suivante perd alors l'animation UI-30.
  - Correction : appeler `setFast(false)` au début de `doFlip`, pour chaque retournement, et aussi dans `nextRound` avant le passage en `playing`.
  - Test e2e de non-régression, **sans** `reducedMotion` : Sardine, toucher pendant `ending`, `waitingTap`, toucher, `playing`. Ensuite, dans un seul `evaluate` : clic sur `[data-state=hidden]` puis `!!document.querySelector('.flip-out')`, qui doit valoir `true`.
- **C2** (important, iOS) `src/ui/audio.ts:15` : iOS met l'`AudioContext` à l'état `interrupted` (arrière-plan, appel, Siri). Remplacer la condition par `if (ctx.state !== 'running') void ctx.resume();`.
- **C3** `src/ui/controller.ts:156` : le message de victoire doit annoncer les jetons **réellement encaissés** (`credited`, R-50), pas le gain brut. Exemple : 49 990 + 36 → « Tu remportes 10 jetons ! ».
- **C5** `tests/e2e/partie.spec.ts` :
  - ajouter un parcours en `locator.tap()` sur les projets tactiles (`hasTouch`) : Sardine, toucher sur `.message`, nouvelle partie ;
  - déplacer `attendre` et `toucher` (présents en double dans `partie.spec.ts` et `screens.spec.ts`) dans `tests/e2e/aide.ts`.
- **C6** `src/ui/input.ts:10` (Mac) : en `waitingTap` et en `ending`, un clic sur le fond décoré, hors de la colonne de 480 px, doit aussi compter comme « toucher ailleurs ». Ajouter un second écouteur sur `body` qui ne gère **que** ce cas. L'écouteur principal reste sur `#app`.
- **C4** : non traité ici. Démarrer avec un total ≥ 50 000 lèverait une exception, et la branche `full` ne met pas à jour le niveau affiché. Reporté à l'étape 3.1 et consigné dans le journal (« Contraintes pour la phase 2 »).

## Corrections de la relecture (appliquées)
2026-11-22 — codeur : C1 (setFast(false) dans doFlip et nextRound + test e2e), C2 (resume si état ≠ running), C3 (message de victoire = jetons encaissés), C5 (test tactile via tap ; attendre et toucher déplacés dans aide.ts), C6 (écouteur sur body hors racine + test Mac). C4 reporté. check OK (419), e2e 100 passés / 10 ignorés (tests propres au Mac ou au tactile).

2026-11-22 — relecteur (2e relecture, commit d0c2927) — 🔴 À reprendre. check OK (419), e2e 100 passés / 10 ignorés.
- C1 conforme. Contre-épreuve faite : sans les `setFast(false)` ajoutés, le test C1 échoue sur les 5 projets.
- C2 conforme (`state !== 'running'` → `resume`).
- C3 conforme (le message utilise `credited`). Le test est reporté à l'étape 3.1 (49 990 + 36 → « 10 jetons »).
- C5 conforme : parcours en `tap()` sur les projets tactiles, `attendre` et `toucher` dans `aide.ts`.
- C6 : contre-épreuve faite (sans l'écouteur sur `body`, le test Mac échoue), et l'écouteur principal est toujours sur `#app`. **Mais** un même vrai clic est traité deux fois.
  - Entre les deux écouteurs, les microtâches retirent la carte touchée du DOM (`revealAll`, `drawBoard`). Quand le clic arrive sur `body`, `root.contains(target)` est donc faux, et `onElsewhere` est rappelé.
  - Effets reproduits (mac, iphone-15) :
    - toucher une carte cachée pendant la fin saute la révélation et lance la partie suivante (R-52, CL-20) ;
    - toucher une carte en `waitingTap` après une victoire saute le bandeau de niveau (UI-43, R-66).

Corrections demandées :
- **C7** (bloquant) `src/ui/input.ts:22-23` : remplacer le test par `if (event.composedPath().includes(root)) return;`.
  - Ajouter deux tests e2e en **vrais clics Playwright** (`locator(...).click()`, pas `el.click()` dans un `evaluate`), sans `reducedMotion` :
    - « CL-20 vrai toucher sur une carte cachée pendant la fin → waitingTap » : toucher la Sardine, puis `locator('[data-id=<carte non Sardine>]').click()`, attendre environ 300 ms, et attendre la phase `waitingTap` ;
    - « R-66 toucher une carte en waitingTap → bandeau de niveau affiché » : gagner, puis `locator('[data-id="0"]').click()` ; la phase est alors `ending` et `.bandeau-niveau` est présent.
  - Le relecteur a validé la correction et les tests dans un worktree temporaire : les deux tests échouent sur d0c2927 et passent avec la correction.
- **C8** (mineur) `src/ui/audio.ts:12` : `ctx.resume().catch(() => {})` au lieu de `void ctx.resume()`, pour ne pas laisser de rejet non géré si le contexte est `closed`.
- **C9** (mineur) `src/ui/controller.ts:182, 210` : supprimer les `setFast(false)`, devenus redondants avec ceux des lignes 173 et 221.

2026-11-23 — codeur — C7 (`composedPath().includes(root)` dans `input.ts` ; 2 tests e2e en vrais clics, sans reducedMotion : les 10 exécutions échouaient avant la correction, passent après), C8 (`resume().catch`), C9 (deux `setFast(false)` redondants supprimés).
