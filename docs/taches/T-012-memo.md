# T-012 — Ajouter le mode mémo (sélection, 4 marques, Fermer)

| Champ | Valeur |
|---|---|
| Statut | implémentée (relecture à faire) |
| Étape du plan | 2.4 |
| Branche | `t-012-memo` |
| Estimation | M (1 à 2 h) |
| Planifiée par | Opus — 2026-11-23 |
| Implémentée par | codeur (Sonnet) |

## Objectif
Pendant une partie, le bouton « Mémo » ouvre un panneau de 4 marques (S, 1, 2, 3) et « Fermer ». Dans ce mode, toucher une carte cachée la sélectionne sans la retourner, et chaque bouton de marque inverse cette marque sur la carte sélectionnée.

## Règles concernées
- `R-80` : 4 marques indépendantes et combinables par carte non retournée (déjà dans `src/logic/round.ts` : `toggleMemo`).
- `R-81` : mode mémo. Toucher une carte la sélectionne, sans retournement. Un bouton de marque inverse la marque. Une carte déjà retournée est refusée, sans modification. « Fermer » revient au mode normal. « Quitter » reste accessible.
- `R-82` : marques visibles en permanence, dans les 4 coins (déjà rendues par `renderCard`).
- `R-83` / `R-31` : retourner une carte efface ses marques. Une nouvelle partie part sans marques (déjà dans la logique).
- `R-84` : aucun effet sur les règles.
- `R-41` : « Non » au dialogue Quitter revient au plateau **avec le mémo ouvert s'il l'était**.
- `CL-19` : pas d'entrée pendant l'animation de retournement. `CL-20` : hors `playing`, le bouton Mémo est un toucher d'écran (déjà en place, à garder).
- `UI-20` : toucher une carte = retourner, ou sélectionner en mode mémo.

## Décisions d'interface prises pour cette tâche (pas de nouvelle règle de jeu)
1. **Disposition** : quand le mémo est ouvert, le pied de page `.actions` montre une rangée de 4 boutons de marque (S, 1, 2, 3) **au-dessus** de la rangée « Fermer » et « Quitter ». « Fermer » prend la place de « Mémo ». Les boutons de marque reprennent les pastilles bordeaux du style Salon (ADR-018). Le plateau peut rétrécir (rangée `1fr`), mais rien ne doit déborder ni défiler. En paysage, le panneau est dans la colonne de droite.
2. **Sélection** : aucune carte n'est sélectionnée au début d'une partie. La sélection est conservée si l'on ferme puis rouvre le mémo pendant la même partie. Elle disparaît si la carte sélectionnée est retournée (en mode normal) et à chaque nouvelle partie. La carte sélectionnée porte `aria-current="true"` et un liseré doré (curseur), **visible seulement mémo ouvert** ; la sélection reste mémorisée mémo fermé.
3. **Sans sélection**, les boutons de marque portent `aria-disabled="true"` (pas l'attribut `disabled`, qui empêche le clic d'atteindre l'écouteur délégué) et un toucher sur eux ne fait rien.
4. **État des boutons** : chaque bouton de marque porte `aria-pressed="true"` ou `"false"` selon que la carte sélectionnée a cette marque.
5. **Refus (R-81)** : toucher une carte retournée en mode mémo ne change ni la sélection ni les marques. La carte joue une courte animation de refus (classe `refus`, environ 200 ms, sans durée réduite qui bloque). **Le son « refus » est reporté à l'étape 4.5** (sons Web Audio), comme les autres sons hors aboiement.
6. **Toucher ailleurs** en mode mémo (hors carte et hors bouton) : rien.
7. **Fin de partie** : en mode mémo, la partie ne peut finir que par Quitter. Au « Oui », le mémo se ferme (le pied de page redevient « Mémo » et « Quitter ») avant l'encaissement. Une nouvelle partie démarre toujours mémo fermé.
8. **Anti-rebond** : ouvrir ou fermer le mémo change la mise en page sous le doigt. Appeler `lockInput()` à l'ouverture et à la fermeture. Pendant le verrou, les touchers de carte, de marque et de Mémo/Fermer sont ignorés (voir les contraintes de phase 2 dans le journal).

## Périmètre
**Inclus**
- État `memo: { open: boolean; selected: number | null }` dans le contrôleur. La phase reste `playing` : pas de nouvelle phase.
- `onCard` en `playing` : si le mémo est ouvert, sélection ou refus, sinon `doFlip` comme aujourd'hui.
- Actions `memo` (ouvrir/fermer, même bouton), `mark-S`, `mark-1`, `mark-2`, `mark-3`. Seule `toggleMemo` (logique existante) modifie les marques. Après une marque, ne redessiner **que** la carte concernée (`renderCard`), en gardant le curseur.
- Rendu : `renderActions` gagne le panneau (ou une fonction `renderMemoPanel`). `renderCard` accepte une option `selected`.
- Textes dans `src/ui/texts.fr.ts` : `close: 'Fermer'`, libellés accessibles des boutons de marque (« Marque Sardine », « Marque 1 », etc.). Le libellé accessible de la carte cachée mentionne ses marques s'il y en a (ex. « Carte cachée, marques : Sardine, 2 »).
- CSS du panneau, du curseur et de l'animation de refus.
- Crochet de debug : `memo(): { open: boolean; selected: number | null }` ajouté à `window.__sb` et au `Controller`.
- Capture `10-memo.png` sur les 5 profils : mémo ouvert, une carte sélectionnée portant 2 marques, une autre carte portant les 4 marques.

**Exclu**
- Clavier (UI-21, priorité P3, étape ultérieure).
- Son « refus » et son de marque (étape 4.5).
- Page d'aide « Le mémo » (UI-03, étape 4).
- Toute modification de `src/logic/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/ui/controller.ts` | modifier (état mémo, actions, sélection, refus, R-41, fermeture à l'abandon) |
| `src/ui/render/hud.ts` | modifier (panneau de marques, bouton Mémo/Fermer) |
| `src/ui/render/board.ts` | modifier (option `selected`, libellé accessible avec marques) |
| `src/ui/texts.fr.ts` | modifier |
| `src/ui/styles/main.css` | modifier |
| `src/ui/debug.ts` | modifier (`memo()`) |
| `tests/e2e/memo.spec.ts` | créer |
| `tests/e2e/screens.spec.ts` | modifier (`10-memo.png`) |

## Tests à écrire (e2e, `tests/e2e/memo.spec.ts`, en vrais clics sauf mention)
Graine 42 et `roundForSeed(42)` pour connaître le plateau. Attendre `#app:not([data-verrou])` après chaque ouverture ou fermeture du mémo (fonction d'aide dans `aide.ts`).

| Nom du test | Scénario | Attendu |
|---|---|---|
| `R-81 Mémo ouvre le panneau, Fermer le referme` | Jouer, toucher Mémo, puis Fermer | 4 boutons `mark-*` visibles, bouton `memo` libellé « Fermer » ; après Fermer : panneau absent, libellé « Mémo », `__sb.memo().open === false` |
| `R-81 en mode mémo, toucher une carte la sélectionne sans la retourner` | Mémo ouvert, toucher la carte 0 | `state().flipped[0] === false`, `cardsFlipped === 0`, carte 0 avec `aria-current="true"`, `memo().selected === 0`, phase `playing` |
| `R-80 R-82 poser puis retirer une marque` | Sélectionner une carte cachée, toucher `mark-2`, puis `mark-2` | après le 1er : pastille `.m-2.on` visible sur la carte, `aria-pressed="true"` ; après le 2e : plus de `.on`, `aria-pressed="false"` |
| `R-80 les 4 marques se combinent` | Sur une carte : `mark-S`, `mark-1`, `mark-2`, `mark-3` | 4 pastilles `.on` ; `state().memos[id] === 15` |
| `R-81 sans sélection, une marque ne fait rien` | Ouvrir le mémo sans toucher de carte, toucher `mark-1` | boutons `aria-disabled="true"`, `memos` tout à 0 |
| `R-81 refus sur une carte retournée` | Retourner une carte « 1 » (mode normal), ouvrir le mémo, sélectionner une carte cachée, puis toucher la carte retournée et `mark-3` | la sélection reste sur la carte cachée ; la carte retournée prend la classe `refus` ; `mark-3` marque la carte cachée et rien d'autre |
| `R-82 les marques restent visibles mémo fermé` | Marquer une carte, Fermer | la pastille reste visible |
| `R-83 R-31 retourner une carte efface ses marques` | Marquer une carte « 1 » sûre, Fermer, la retourner | `memos[id] === 0`, carte face visible sans pastille |
| `R-83 une nouvelle partie part sans marques et mémo fermé` | Marquer une carte, Fermer, perdre sur une Sardine, toucher, Oui à « Jouer au niveau n ? » | `memos` tout à 0, `memo().open === false`, `memo().selected === null`, aucune `.m.on` |
| `R-81 R-41 Quitter accessible en mode mémo, Non garde le mémo ouvert` | Mémo ouvert, une carte sélectionnée et marquée, Quitter, Non | dialogue fermé, panneau toujours ouvert, même sélection, même marque |
| `R-81 R-42 Quitter puis Oui en mode mémo ferme le mémo` | Mémo ouvert, Quitter, Oui | `memo().open === false` dès l'encaissement, pied de page « Mémo » et « Quitter » |
| `R-84 le mémo ne change rien aux règles` | Marquer `S` sur une carte « 1 », Fermer, la retourner | gain = 1, `cardsFlipped === 1`, statut `PLAYING` |
| `CL-20 Mémo en waitingTap continue` (absent des tests de T-011) | Perdre, attendre `waitingTap`, toucher Mémo | la question « Jouer au niveau n ? » s'ouvre, le mémo ne s'ouvre pas |
| `Anti-rebond double toucher sur Mémo` | Double clic rapide sur Mémo (`dblclick` ou deux clics sans attente) | mémo ouvert (pas refermé), aucune carte retournée, aucune marque posée |
| `UI-20 libellé accessible des marques` | Marquer S et 2 sur une carte | `aria-label` contient « Sardine » et « 2 » |

## Critères d'acceptation
- [x] `npm run check` passe (typecheck, lint, tests unitaires, contrôle de confidentialité).
- [x] `npm run e2e` (avec `E2E_PORT=5199` si le port 5173 est pris) : tous les tests ci-dessus existent et passent sur les 5 profils, ainsi que tous les tests existants. Les nouveaux tests qui utilisent un clic forcé, un double clic ou une attente passent avec `--repeat-each 5`.
- [x] Contre-épreuves faites puis annulées (`git diff src/` vide ensuite) et rapportées dans le compte rendu :
  - a. Si `onCard` appelle `doFlip` même mémo ouvert, le test « sélectionne sans la retourner » échoue.
  - b. Si « Non » au dialogue Quitter ferme le mémo, le test `R-41` échoue.
  - c. Si la fermeture ou l'ouverture du mémo n'appelle pas `lockInput()`, le test anti-rebond échoue.
  - d. Si une marque est posée sans sélection valide (carte retournée), le test de refus échoue.
- [x] `npm run screens` : `10-memo.png` produite sur les 5 profils et conforme à la checklist de la skill `controle-visuel`. Aucun débordement ni défilement (iPhone SE et paysage compris), boutons de marque ≥ 44 px, curseur et pastilles lisibles. Les captures existantes (`02` à `09`) restent conformes.
- [x] `git diff main --stat -- src/logic` est vide.
- [x] `grep -rn "document.body.append\|body.appendChild" src/ui` ne renvoie rien.
- [x] `npm run build` passe et `__sb` est absent de `dist/`.

## Pièges connus
- **Écouteur délégué** : les boutons de marque doivent porter `data-action`. Ne pas utiliser l'attribut `disabled` (le clic n'arrive pas à `#app` sur WebKit, puis un toucher passerait pour « ailleurs »).
- **Redessin** : `drawBoard()` reconstruit tout le plateau. Pour une marque, remplacer uniquement la carte (`cardEl(id).replaceWith(renderCard(...))`), sinon on perd le curseur et on fait clignoter le plateau.
- **R-41** : `closeDialog()` rend la phase d'avant ; l'état du mémo, lui, ne doit pas être touché par le dialogue.
- **Abandon** : fermer le mémo dans `confirmQuit()` **avant** `ending()`. Le Quitter du mémo ouvert passe par `openDialog('quit', …)` comme en mode normal.
- **`startNewRound()`** : remettre `memo = { open: false, selected: null }` et redessiner le pied de page en mode normal.
- **Sélection retournée** : si la carte sélectionnée est retournée en mode normal, `selected` repasse à `null`.
- **Disposition iPhone SE** : le panneau ajoute une rangée au pied de page. Vérifier la capture SE en premier. Si le plateau devient trop petit, réduire la hauteur des boutons de marque (44 px minimum), pas celle des cartes en dessous de ce qui est lisible.
- **Fins de ligne LF** pour tous les fichiers écrits.

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
Branche `t-012-memo`. Commit : `feat(ui): mode mémo, sélection, 4 marques, Fermer (R-80..R-84, R-41)`, puis un commit de documentation.

Fait :
- Contrôleur : état `memo { open, selected }`, `onCard` (sélection ou refus en mode mémo, sinon retournement), actions `memo` et `mark-*`, verrou `lockInput()` à l'ouverture et à la fermeture, fermeture du mémo dans `confirmQuit()` avant l'encaissement, remise à zéro dans `startNewRound()`, `memo()` exposé (contrôleur et `window.__sb`).
- Rendu : `renderActions(open, marks)` avec rangée de 4 boutons (`aria-pressed`, `aria-disabled`, jamais `disabled`), `updateMemoPanel`, `renderCard` avec option `selected` (`aria-current`) et libellé « Carte cachée, marques : … ». Une marque ne redessine que la carte concernée.
- Textes dans `texts.fr.ts` (`close`, `markNames`, `markButtonLabel`, `hiddenCardLabel`) ; CSS du panneau, du curseur doré et de l'animation `refus` (200 ms, durée fixe).
- Le curseur n'est affiché que mémo ouvert ; la sélection est conservée mémo fermé (choix d'interface, non précisé par la fiche).
- Tests : 15 tests e2e dans `tests/e2e/memo.spec.ts` (75 exécutions sur 5 profils, 375 avec `--repeat-each 5`, tous verts) ; `10-memo.png` ajoutée aux captures.

Vérifications : `npm run check` OK (419 tests unitaires) ; `npm run e2e` : 315 réussis, 10 ignorés (déjà ignorés avant) ; build OK, `__sb` absent de `dist/` ; `git diff main --stat -- src/logic` vide ; aucun ajout à `body`.

Contre-épreuves (faites puis annulées par `git checkout src`) : a. `onCard` qui retourne même mémo ouvert : « sélectionne sans la retourner » échoue. b. « Non » qui ferme le mémo : `R-41` échoue (panneau absent). c. sans `lockInput()` dans l'ouverture/fermeture : « Anti-rebond » échoue. d. marque posée sur une carte retournée (refus supprimé) : le test de refus échoue (classe `refus` absente).

Captures : `test-results/screens/<profil>/10-memo.png`, relues sur iPhone SE, iPhone 15, paysage et Mac : pas de débordement, boutons de marque de 44 px ou plus, curseur et pastilles lisibles ; `03-en-cours.png` inchangée.

Écarts : (1) les tests ont été écrits avant le code, mais la première exécution « rouge » a été interrompue (serveur mêlé) ; le rouge est établi par les contre-épreuves. (2) Un clic Playwright sur un bouton `aria-disabled` est refusé par l'actionnabilité : le test « sans sélection » utilise `click({ force: true })`. Aucune question ouverte.

Corrections de relecture (C1 à C5), commit `fix(ui): corrections de relecture T-012 (C1 à C5)` :
- C1 : test « Anti-rebond double toucher sur Fermer » ; contre-épreuve : sans `lockInput()` à la fermeture, il échoue.
- C2 : deux tests de la décision 2 (sélection et curseur conservés après Fermer puis Mémo ; sélection effacée après retournement, boutons `aria-disabled`) ; contre-épreuve : sans la remise à `null` au retournement, le second échoue.
- C3 : bouton de marque pressé = fond bordeaux, chiffre crème ; non pressé = fond crème, chiffre bordeaux (captures SE et paysage relues).
- C4 : `MEMO_BITS` importé de `src/logic/round.ts` dans `hud.ts` et `board.ts` (aucune modification de `src/logic`).
- C5 : décision 2 complétée dans la fiche.
- Vérifications : check OK, e2e 330 réussis / 10 ignorés, `--repeat-each 5` des nouveaux tests : 100 réussis.

## Relecture
### Relecture du 2026-11-23 (relecteur) : 🟡 approuvée avec réserves
check OK (419), e2e 315 réussis / 10 ignorés, captures 45 (10-memo vue sur SE, 15 Pro Max et paysage : conformes), build OK, `__sb` absent de dist, src/logic intact. Contre-épreuves du relecteur : e (marque sans sélection → carte 0) rouge, donc le clic forcé atteint bien l'écouteur ; c' (pas de verrou à la fermeture) et f (sélection gardée après retournement) restent vertes, d'où C1 et C2.
- C1 (important) : ajouter le test « Anti-rebond double toucher sur Fermer ».
- C2 (important) : tester la décision 2 : sélection et curseur conservés après Fermer puis Mémo ; sélection effacée après retournement en mode normal (`selected === null`, boutons en `aria-disabled`).
- C3 (mineur) : l'état pressé des boutons de marque a le code couleur inverse des pastilles des cartes ; le rendre cohérent.
- C4 (mineur) : réutiliser `MEMO_BITS` de src/logic/round.ts au lieu des tables de hud.ts:48 et board.ts:18.
- C5 (mineur) : compléter la décision 2 : curseur visible seulement mémo ouvert (choix accepté).

Décision d'Opus pour C3 : bouton pressé = aspect d'une pastille allumée (fond bordeaux, chiffre crème) ; bouton non pressé = fond crème, chiffre bordeaux, liseré doré.
