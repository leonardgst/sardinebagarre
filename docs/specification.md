# Spécification du jeu « Sardinebagarre »

> Sardinebagarre reprend **exactement les règles** de la Voltorbataille (Pokémon HeartGold/SoulSilver). La carte-bombe est **Sardine**, la chienne de ma sœur, à la place du Voltorbe.
> Référence unique des règles. Chaque règle porte un identifiant (`R-…`, `CL-…`, `UI-…`) que les tests et les tâches citent.
> Quand un comportement n'est pas décrit ici, **on ne l'invente pas** : on ouvre une question dans `docs/journal.md`.

---

## 0. Sources et hiérarchie

| # | Source | Ce qu'elle apporte |
|---|---|---|
| S1 | **Code décompilé de HeartGold/SoulSilver**, projet `pret/pokeheartgold` : `src/voltorb_flip/voltorb_flip_game.c`, `src/voltorb_flip/voltorb_flip.c`, `include/voltorb_flip/voltorb_flip_game.h` — https://github.com/pret/pokeheartgold | Table exacte des 80 configurations, algorithme de génération, calcul exact des niveaux, déroulé des écrans |
| S2 | Bulbapedia, « Voltorb Flip » — https://bulbapedia.bulbagarden.net/wiki/Voltorb_Flip | Règles, table des 40 configurations (5 × 8 niveaux) |
| S3 | Poképédia, « Voltorbataille » — https://www.pokepedia.fr/Voltorbataille | Règles en français, terminologie |
| S4 | Pokébip, page Voltorbataille — https://www.pokebip.com/page/jeux-video/pokemon-heartgold-soulsilver/voltorbataille | Table de descente de niveau |
| S5 | The Dragonfly Cave, guide — https://www.dragonflycave.com/voltorbflip.aspx | Règles de déduction, le « 1 » compte pour la descente |

**Hiérarchie en cas de désaccord : S1 > S2 > S3 > S4/S5.** S1, c'est le code qui tourne réellement dans la cartouche (version américaine). Les wikis le résument, parfois approximativement.

> Lire S1 ne veut pas dire copier son code : on **réécrit** la logique en TypeScript à partir de cette spécification. On n'importe aucune ressource (image, son, texte) du dépôt `pret`.

### 0.1 Contradictions relevées

| Sujet | S2 Bulbapedia | S3 Poképédia | S4 Pokébip | **S1 code (retenu)** |
|---|---|---|---|---|
| Accès au niveau 8 | Gagner 5 parties d'affilée, à n'importe quel niveau, avec ≥ 8 cartes « multiplicateur » (×1 inclus) retournées dans chacune ; la 5ᵉ peut être abandonnée après ≥ 8 cartes | Gagner 5 parties d'affilée en retournant **au moins 8 cartes 2 ou 3** | — | Les **5 dernières parties** ne sont **pas perdues** (gagnées **ou abandonnées**, sans exception) **et** chacune compte **≥ 8 cartes chiffrées retournées, 1 compris**, **et** la dernière s'est jouée au **niveau ≥ 5** |
| Les « 1 » comptent-ils ? | Oui (« including ×1 cards ») | Ambigu (« cases chiffrées ») pour la descente ; non pour le niveau 8 | Oui (« chiffres ») | **Oui, partout** (`cardsFlipped` compte 1, 2 et 3) |
| Défaite ou abandon au niveau 8 avec ≥ 8 cartes | Reste au niveau 8 (déduit de la règle générale) | Idem | « 8 chiffres puis Voltorbe → niveau 8 » | **Descend au niveau 7** (sauf si la série des 5 parties est remplie, ce qui est impossible en cas de défaite) |
| Gagner au niveau 7 | Monte au 8 ? (non précisé) | Montée par victoire « jusqu'au niveau 7 » | — | **Reste au niveau 7.** Seule la série donne le niveau 8 |
| Contraintes de génération | Non mentionnées | Non mentionnées | — | **Limite de multiplicateurs « gratuits »** (voir §4) : deux variantes par configuration |
| Configurations par niveau | 5 par niveau | 5 par niveau | — | 10 entrées par niveau : les 5 configurations ×2 variantes de contraintes, **tirées uniformément** |

Les nombres de 2, de 3 et de Voltorbes et les gains maximum de S2 **concordent exactement** avec S1.

---

## 1. Vocabulaire

| Terme | Définition |
|---|---|
| **Carte** | Une des 25 cases du plateau. Valeur cachée : `1`, `2`, `3` ou `V` (Voltorbe). |
| **Carte chiffrée** | Carte de valeur 1, 2 ou 3. |
| **Multiplicateur** | Carte de valeur 2 ou 3. |
| **Partie** (ou manche) | Un plateau, du premier retournement à la fin (victoire, défaite, abandon). |
| **Gain de la partie** | Jetons accumulés pendant la partie en cours, pas encore encaissés. |
| **Jetons** (total) | Réserve du joueur, persistante, plafonnée à 50 000. |
| **Niveau** | 1 à 8. Détermine la configuration du plateau. |
| **Mémo** | Marques que le joueur pose sur une carte non retournée (S, 1, 2, 3). |
| **Multiplicateur gratuit** | Carte 2 ou 3 située dans une ligne **ou** une colonne sans aucun Voltorbe (on peut l'obtenir sans risque). |

> **Correspondance des noms** : dans les règles, « Voltorbe » (V) désigne la carte-bombe, comme dans le jeu d'origine. **À l'écran, elle s'appelle « Sardine » et sa lettre est « S »** : cases, indicateurs, marques du mémo, touche clavier. Dans le code, la valeur s'écrit `'S'` (type `CardValue = 1 | 2 | 3 | 'S'`).
> Les autres identifiants du code sont en anglais : `Card`, `Board`, `RoundState`, `GameState`, `Outcome`, `payout`, `coins`, `level`, `memo`. Pour les noms de types, `docs/architecture.md` §5 fait foi.

---

## 2. Le plateau

- **R-01** Grille de 5 × 5 cartes, identifiées de `0` à `24` ligne par ligne : `id = ligne × 5 + colonne` (ligne 0 en haut, colonne 0 à gauche).
- **R-02** Au bout de chaque **ligne** (à droite) et de chaque **colonne** (en bas), un indicateur affiche :
  - la **somme des valeurs** des cartes de la ligne ou de la colonne (un Voltorbe vaut 0, un 1 vaut 1, etc.) ;
  - le **nombre de Voltorbes** de la ligne ou de la colonne.
- **R-03** Les indicateurs sont calculés une fois, à la génération, et **ne changent pas** pendant la partie.
- **R-04** Au début d'une partie, toutes les cartes sont face cachée et sans mémo.

---

## 3. Configurations par niveau (S1, recoupé avec S2)

Chaque niveau a 5 configurations, et chacune existe en deux variantes de contraintes, A (plus permissive) et B (plus stricte). **Au lancement d'une partie, on tire uniformément une des 10 entrées du niveau** (probabilité 1/10 chacune, soit 1/5 par configuration).

`MaxLC` = nombre maximal **exclu** de multiplicateurs gratuits par ligne ou colonne. `MaxT` = nombre maximal **exclu** de multiplicateurs gratuits sur tout le plateau (voir §4 : un plateau est accepté si le compte est **strictement inférieur**).

| Niv. | Voltorbes | 2 | 3 | 1 (déduit) | Gain max | A : MaxLC / MaxT | B : MaxLC / MaxT |
|---|---|---|---|---|---|---|---|
| 1 | 6 | 3 | 1 | 15 | 24 | 3 / 3 | 3 / 3 |
| 1 | 6 | 0 | 3 | 16 | 27 | 2 / 2 | 2 / 2 |
| 1 | 6 | 5 | 0 | 14 | 32 | 3 / 4 | 3 / 4 |
| 1 | 6 | 2 | 2 | 15 | 36 | 3 / 3 | 3 / 3 |
| 1 | 6 | 4 | 1 | 14 | 48 | 3 / 4 | 3 / 4 |
| 2 | 7 | 1 | 3 | 14 | 54 | 2 / 3 | 2 / 2 |
| 2 | 7 | 6 | 0 | 12 | 64 | 3 / 4 | 3 / 3 |
| 2 | 7 | 3 | 2 | 13 | 72 | 2 / 3 | 2 / 2 |
| 2 | 7 | 0 | 4 | 14 | 81 | 2 / 3 | 2 / 2 |
| 2 | 7 | 5 | 1 | 12 | 96 | 3 / 4 | 3 / 3 |
| 3 | 8 | 2 | 3 | 12 | 108 | 2 / 3 | 2 / 2 |
| 3 | 8 | 7 | 0 | 10 | 128 | 3 / 4 | 3 / 3 |
| 3 | 8 | 4 | 2 | 11 | 144 | 3 / 4 | 3 / 3 |
| 3 | 8 | 1 | 4 | 12 | 162 | 2 / 3 | 2 / 2 |
| 3 | 8 | 6 | 1 | 10 | 192 | 4 / 3 | 3 / 3 |
| 4 | 8 | 3 | 3 | 11 | 216 | 4 / 3 | 3 / 3 |
| 4 | 8 | 0 | 5 | 12 | 243 | 2 / 3 | 2 / 2 |
| 4 | 10 | 8 | 0 | 7 | 256 | 4 / 5 | 4 / 4 |
| 4 | 10 | 5 | 2 | 8 | 288 | 3 / 4 | 3 / 3 |
| 4 | 10 | 2 | 4 | 9 | 324 | 3 / 4 | 3 / 3 |
| 5 | 10 | 7 | 1 | 7 | 384 | 4 / 5 | 4 / 4 |
| 5 | 10 | 4 | 3 | 8 | 432 | 3 / 4 | 3 / 3 |
| 5 | 10 | 1 | 5 | 9 | 486 | 3 / 4 | 3 / 3 |
| 5 | 10 | 9 | 0 | 6 | 512 | 4 / 5 | 4 / 4 |
| 5 | 10 | 6 | 2 | 7 | 576 | 4 / 5 | 4 / 4 |
| 6 | 10 | 3 | 4 | 8 | 648 | 3 / 4 | 3 / 3 |
| 6 | 10 | 0 | 6 | 9 | 729 | 3 / 4 | 3 / 3 |
| 6 | 10 | 8 | 1 | 6 | 768 | 4 / 5 | 4 / 4 |
| 6 | 10 | 5 | 3 | 7 | 864 | 4 / 5 | 4 / 4 |
| 6 | 10 | 2 | 5 | 8 | 972 | 3 / 4 | 3 / 3 |
| 7 | 10 | 7 | 2 | 6 | 1152 | 4 / 5 | 4 / 4 |
| 7 | 10 | 4 | 4 | 7 | 1296 | 4 / 5 | 4 / 4 |
| 7 | 13 | 1 | 6 | 5 | 1458 | 3 / 4 | 3 / 3 |
| 7 | 13 | 9 | 1 | 2 | 1536 | 5 / 6 | 5 / 5 |
| 7 | 10 | 6 | 3 | 6 | 1728 | 4 / 5 | 4 / 4 |
| 8 | 10 | 0 | 7 | 8 | 2187 | 3 / 4 | 3 / 3 |
| 8 | 10 | 8 | 2 | 5 | 2304 | 5 / 6 | 5 / 5 |
| 8 | 10 | 5 | 4 | 6 | 2592 | 4 / 5 | 4 / 4 |
| 8 | 10 | 2 | 6 | 7 | 2916 | 4 / 5 | 4 / 4 |
| 8 | 10 | 7 | 3 | 5 | 3456 | 5 / 6 | 5 / 5 |

- **R-10** Gain max = 2^(nombre de 2) × 3^(nombre de 3). Il est toujours ≤ 3 456.
- **R-11** La table ci-dessus est la **seule** source des configurations dans le code (`src/logic/configs.ts`). Un test vérifie chaque ligne (comptes et gain max).
- Remarque : au niveau 7, deux configurations ont 13 Voltorbes (S1 = S2).

---

## 4. Génération d'un plateau

- **R-20** Entrée : une configuration (V, n2, n3, MaxLC, MaxT) et un générateur pseudo-aléatoire **injectable** (`rng: () => number` dans [0, 1)), pour rendre les tests déterministes.
- **R-21** Algorithme (fidèle à S1), répété **jusqu'à 1 000 tentatives** :
  1. Mettre un `1` sur les 25 cartes.
  2. Placer V Voltorbes, puis n2 cartes `2`, puis n3 cartes `3`. Chaque carte va sur une case choisie **uniformément parmi celles qui valent encore 1**.
  3. Compter les Voltorbes par ligne et par colonne.
  4. Pour chaque carte 2 ou 3 : elle est **gratuite** si sa ligne **ou** sa colonne a 0 Voltorbe. Compter les gratuites par ligne, par colonne et au total.
  5. **Accepter** le plateau si total < MaxT **et** si, pour chaque ligne et chaque colonne, le compte < MaxLC. Sinon, recommencer.
  6. Si aucune des 1 000 tentatives n'est acceptée, garder le dernier plateau généré (cas jamais observé : voir R-23).
- **R-22** Écart volontaire avec S1 (ADR-010) : dans l'original, si une carte ne trouve pas de case libre en 100 tirages, elle est **sautée**, ce qui donne un plateau avec une carte en moins (extrêmement rare). Nous garantissons toujours les comptes exacts (placement par mélange de Fisher-Yates, même distribution).
- **R-23** Propriétés vérifiées par simulation (3 000 plateaux pour chacune des 80 entrées) : acceptation en **1 à 3 tentatives en moyenne, 21 au maximum**, jamais de repli. Les tests de propriété (§15) doivent retrouver : comptes exacts, contraintes respectées, indicateurs cohérents.
- **R-24** Un plateau généré est **immuable**. Les informations de partie (retournées, mémo) sont stockées à part.

---

## 5. Déroulement d'une partie

### 5.1 États

```
               ┌── retourner 1/2/3 (il reste des multiplicateurs) ───┐
               ▼                                                     │
  « Jouer » ─► [EN_COURS] ───────────────────────────────────────────┘
                 │
                 ├── retourner V ──────────────► [PERDUE] ──────┐
                 ├── retourner le dernier 2/3 ─► [GAGNÉE] ──────┤
                 └── quitter + confirmer ──────► [ABANDONNÉE] ──┤
                                                                ▼
                 finalisation (R-55) → révélation (R-52, UI-40) → (toucher) → partie suivante
```

- La partie est `EN_COURS` dès que le plateau s'affiche après « Jouer ». Il n'y a pas d'état intermédiaire : on peut quitter sans avoir retourné de carte (CL-01).

### 5.2 Retourner une carte
- **R-30** On ne peut retourner qu'une carte **face cachée**. Toucher une carte déjà retournée ne fait rien (petit son « refus »).
- **R-31** Retourner une carte efface son mémo.
- **R-32** **Carte chiffrée (1, 2, 3)** :
  - `cartesRetournées += 1` (le 1 compte) ; si c'est un 2 ou un 3, `multiplicateursRetournés += 1` ;
  - si `gain == 0` (aucune carte chiffrée retournée jusqu'ici), alors `gain = valeur` ;
  - sinon `gain = min(gain × valeur, 50 000)`.
- **R-33** Après une carte chiffrée, si `gain == gainMax` (donc tous les 2 et 3 sont retournés), la partie est **GAGNÉE**.
- **R-34** **Voltorbe** : `gain = 0`, partie **PERDUE**. La carte Voltorbe **ne compte pas** dans `cartesRetournées`.

> Conséquence : retourner un 1 en premier donne 1 jeton, puis chaque 1 multiplie par 1 (aucun effet sur le gain). Les 1 ne servent qu'à **protéger le niveau** (§6) et à remplir la condition du niveau 8.

### 5.3 Quitter (encaisser)
- **R-40** À tout moment pendant `EN_COURS`, le joueur peut quitter. Une confirmation Oui/Non est demandée :
  - si `gain == 0` : « Tu n'as encore trouvé aucun jeton. Quitter quand même ? » ;
  - sinon : « Si tu t'arrêtes maintenant, tu gagnes {gain} jeton(s). Tu t'arrêtes ? ».
- **R-41** « Non » revient au plateau, dans l'état précédent (mémo ouvert s'il l'était).
- **R-42** « Oui » : partie **ABANDONNÉE**, le gain est encaissé (ajouté au total).

### 5.4 Encaissement et fin
- **R-50** GAGNÉE ou ABANDONNÉE : `total = min(total + gain, 50 000)`. L'excédent au-delà de 50 000 est perdu. L'affichage fait ensuite défiler les jetons (animation `UI-40`, purement visuelle : voir R-55).
- **R-51** PERDUE : rien n'est ajouté.
- **R-52** Quelle que soit l'issue, on **révèle tout le plateau** (`UI-42`), puis le joueur touche l'écran pour continuer. La révélation est purement visuelle : tout a déjà été enregistré (R-55). Le message de changement de niveau (R-66, UI-43) s'affiche après ce toucher.
- **R-53** Au lancement d'une partie, si `total ≥ 50 000` : message « Ta boîte à jetons est pleine (50 000). Tu ne peux plus en gagner. », et pas de nouvelle partie. Deux actions possibles : **acheter une photo dans l'album** (R-112), s'il en reste une à débloquer, ou **« Vider la boîte à jetons »** (réglages, avec double confirmation). Voir ADR-012.
- **R-55 Finalisation** : la partie est **FINALISÉE** dès que son issue est connue (dernier multiplicateur retourné, Sardine retournée ou abandon confirmé). Au même moment, **avant toute animation** : encaissement du gain (R-50, R-51), ajout de la partie à l'historique (R-60), calcul du niveau suivant (§6), mise à jour des records (R-72), puis sauvegarde (R-100). La révélation (R-52, UI-42) et le défilement des jetons (UI-40) sont **purement visuels** : fermer l'app pendant ces animations ne fait rien perdre (CL-23).

---

## 6. Niveaux

### 6.1 Historique
- **R-60** On garde les **5 dernières parties terminées** (file circulaire), avec pour chacune : issue (`WON`, `QUIT`, `LOST`), `cartesRetournées`, niveau joué.
- **R-61** Au tout premier lancement, l'historique est vide et le niveau vaut 1.

### 6.2 Calcul du niveau suivant (port exact de S1, `CalcNextLevel`)

Soit `d` = la dernière partie terminée (issue `o`, cartes chiffrées retournées `k`, niveau `L`) :

```
fonction niveauSuivant(historique):
  d = dernière partie
  si d.o == WON et d.L == 8 : retourner 8
  si d.L >= 5 et historique contient 5 parties
     et pour chacune des 5 : k >= 8 et o != LOST : retourner 8
  pour n de 7 à 2 :
     si (d.L >= n et d.k >= n) ou (d.L >= n - 1 et d.o == WON) : retourner n
  retourner 1
```

Formulé simplement :
- **R-62 Victoire** au niveau L ≤ 7 → niveau **L + 1**, mais **plafonné à 7**. Victoire au niveau 8 → **8**.
- **R-63 Défaite ou abandon** au niveau L avec k cartes chiffrées retournées → niveau **max(1, min(L, k, 7))**.
- **R-64 Niveau 8 par la série** : si la dernière partie s'est jouée au niveau ≥ 5 et que **chacune des 5 dernières parties** (à n'importe quel niveau) n'est pas une défaite et compte ≥ 8 cartes chiffrées, le niveau suivant est 8, quel que soit le reste.
- **R-65** Le niveau 8 n'est **jamais** atteint par une simple victoire au niveau 7.
- **R-66** Message après le calcul : niveau supérieur → « Niveau {n} atteint ! » puis « Bravo ! Tu peux gagner encore plus de jetons. » (une seule fois par session) ; niveau inférieur → « Retour au niveau {n}. » ; niveau identique → aucun message.

### 6.3 Exemples (vecteurs de test obligatoires — `tests/logic/levels.test.ts`)

| # | Historique (ancien → récent) `(issue, k, L)` | Niveau suivant |
|---|---|---|
| N1 | (QUIT, 0, 1) | 1 |
| N2 | (QUIT, 0, 6) | 1 |
| N3 | (LOST, 1, 4) | 1 |
| N4 | (LOST, 2, 4) | 2 |
| N5 | (LOST, 3, 8) | 3 |
| N6 | (LOST, 9, 8) | **7** |
| N7 | (QUIT, 9, 8), sans série | **7** |
| N8 | (WON, 6, 7) | **7** |
| N9 | (WON, 5, 3) | 4 |
| N10 | (WON, 12, 8) | 8 |
| N11 | (WON,8,1) (WON,8,2) (WON,8,3) (WON,8,4) (WON,8,5) | **8** |
| N12 | (WON,8,1) (WON,8,2) (WON,8,3) (WON,8,4) (QUIT,8,5) | **8** |
| N13 | (WON,8,1) (WON,8,2) (WON,8,3) (WON,7,4) (WON,9,5) | 6 |
| N14 | 5 × (QUIT, 8, 2) | 2 (dernier niveau < 5) |
| N15 | (WON,8,4) (WON,8,5) (WON,8,6) (WON,8,7) (LOST,9,7) | 7 |
| N16 | (LOST, 5, 5) | 5 |
| N17 | (LOST, 0, 1) | 1 |

> N11 : ces cinq victoires sont possibles parce que **les 1 comptent**. Les niveaux 1, 2 et 3 ont au plus 5, 6 et 7 multiplicateurs, et la plupart des configurations du niveau 4 en ont moins de 8. Pour atteindre 8 cartes, il faut donc retourner des 1 **avant** le dernier multiplicateur, puisque la partie s'arrête dès qu'il est retourné.

### 6.4 Quitter la table
- **R-67** Fidélité DS (S1) : quitter la Voltorbataille remet le niveau à 1 et vide l'historique. Ici, **fermer l'app ne le fait pas** (décision Q9 : le niveau est sauvegardé). Le menu propose « Quitter la table », qui applique R-67 après confirmation.

### 6.5 Partie interrompue (décision Q9)
- **R-68** Si l'app est fermée (ou rechargée par iOS) pendant une partie `EN_COURS`, cette partie est **abandonnée sans trace** : son gain n'est pas encaissé, elle n'entre **pas** dans l'historique, et le niveau, l'historique et le total de jetons restent ceux d'avant la partie. Au retour, une **nouvelle partie** commence au même niveau.
- Conséquence acceptée : on peut « changer de plateau » sans pénalité en fermant l'app (dans l'original, abandonner pouvait faire descendre de niveau).

---

## 7. Jetons totaux

- **R-70** Valeur initiale : 0. Plafond : **50 000** (affichage sur 5 chiffres).
- **R-71** Le total n'est modifié **que** par :
  - l'encaissement d'une partie gagnée ou abandonnée (R-50) ;
  - l'achat d'une photo dans l'album (R-112) ;
  - « Vider la boîte à jetons » (R-53) ;
  - « Effacer toute la progression » (UI-04).
- **R-72** Records (absents de l'original ; voir ADR-012), inclus en v1, **priorité P2** : de simples compteurs affichés dans les Réglages (UI-04). Ils comprennent : meilleur gain en une partie, niveau maximal atteint, nombre de parties jouées, gagnées, perdues et abandonnées, nombre de fois où le niveau 8 a été atteint.

---

## 8. Mémo (inclus dès la v1)

- **R-80** Chaque carte non retournée porte 4 marques indépendantes : `S` (Sardine), `1`, `2`, `3` (bits, combinables, les 4 à la fois inclus).
- **R-81** Mode mémo (fidèle à S1) :
  - bouton « Mémo » → le mémo s'ouvre (panneau avec 4 boutons de marque + « Fermer ») ;
  - toucher une carte **sélectionne** cette carte (curseur) : **pas de retournement** en mode mémo ;
  - toucher un bouton de marque **inverse** cette marque sur la carte sélectionnée ;
  - sur une carte déjà retournée : refus (son « refus »), aucune modification ;
  - « Fermer » revient au mode normal ; « Quitter » reste accessible (R-40).
- **R-82** Les marques sont visibles en permanence sur les cartes (mode mémo ouvert ou fermé), en petit, dans les 4 coins.
- **R-83** Retourner une carte efface ses marques (R-31). Les marques sont effacées à chaque nouvelle partie.
- **R-84** Le mémo n'a **aucun effet** sur les règles (pas de blocage, pas d'aide automatique).

---

## 9. Cas limites (tests obligatoires)

| ID | Situation | Résultat attendu |
|---|---|---|
| CL-01 | Retourner 0 carte puis quitter | Confirmation « aucun jeton » ; issue QUIT ; +0 jeton ; niveau suivant **1** (même si on était au niveau 6) |
| CL-02 | Premier retournement = Voltorbe | Gain 0 ; issue LOST ; `k = 0` → niveau 1 |
| CL-03 | Un « 1 » retourné compte-t-il pour la descente ? | **Oui.** Niveau 4, on retourne 1, 1, puis un Voltorbe → `k = 2` → niveau 2 |
| CL-04 | Un seul « 1 » retourné puis défaite | `k = 1` → niveau 1 (même chose que 0 carte) |
| CL-05 | Premier retournement = 1 | Gain = 1 |
| CL-06 | 1 puis 3 puis 2 | Gain 1 → 3 → 6 |
| CL-07 | 2 puis 1 puis 1 | Gain 2 → 2 → 2, `k = 3` |
| CL-08 | Retourner le dernier 2/3 alors qu'il reste des 1 | Victoire immédiate ; les 1 restants ne sont pas retournés ; ils sont révélés en fin de partie |
| CL-09 | Toucher une carte déjà retournée | Rien ne change (son refus) |
| CL-10 | Marquer une carte retournée | Refus |
| CL-11 | Retourner une carte marquée | Marques effacées |
| CL-12 | Quitter → « Non » | Retour à l'état exact précédent |
| CL-13 | Total à 49 990, gain de 48 | Total = 50 000 (38 jetons perdus) |
| CL-14 | Total = 50 000 au lancement d'une partie | Message boîte pleine, pas de partie. Actions proposées : acheter la prochaine photo de l'album (s'il en reste une à débloquer) ou vider la boîte (R-53) |
| CL-15 | Victoire au niveau 7 | Reste au niveau 7 (R-65) |
| CL-16 | Défaite au niveau 8 après 10 cartes | Niveau 7 |
| CL-17 | 5 parties ≥ 8 cartes sans défaite, la dernière au niveau 5 | Niveau 8 |
| CL-18 | Fermer l'app en pleine partie (niveau 5, gain 72), la rouvrir | Nouveau plateau au **niveau 5** ; total de jetons inchangé (les 72 sont perdus) ; historique inchangé (R-68) |
| CL-19 | Double-toucher rapide sur une carte | Un seul retournement ; les entrées sont bloquées pendant l'animation de retournement |
| CL-20 | Toucher pendant une animation de fin (révélation, défilement des jetons) | Accélère ou termine l'animation (fidèle à S1), ne déclenche aucune autre action |
| CL-21 | Niveau 1 : les indicateurs d'une ligne sans Voltorbe | Toutes ses cartes sont sûres. Le jeu ne les retourne **pas** automatiquement |
| CL-22 | Sauvegarde corrompue ou d'une version inconnue | On démarre une partie neuve, sans planter ; on garde le total de jetons s'il est lisible |
| CL-23 | Victoire au niveau 3 avec un gain de 72 (total 100 avant la partie) ; on ferme l'app pendant la révélation de fin, puis on la rouvre | Total = 172 ; la partie figure dans l'historique ; niveau 4 ; records à jour (R-55) |

### 9.4 Message de suspense (clin d'œil S1)
- **R-90** Au moment de retourner une carte, si sa ligne **et** sa colonne contiennent chacune au moins un Voltorbe, et si, pour la ligne **ou** la colonne, `Voltorbes de la ligne × 100 / cartes non retournées de la ligne ≥ 75` (Voltorbes **au total** de la ligne, pas restants), alors afficher un message de suspense tiré au hasard dans une liste (par défaut « Tu es sûr(e) de toi ?! ») et jouer un petit jingle de suspense avant de révéler la carte. Purement cosmétique.

---

## 10. Interface

### 10.1 Écrans
| ID | Écran | Contenu |
|---|---|---|
| UI-01 | **Accueil / menu** | Titre « Sardinebagarre », niveau courant, total de jetons. Boutons : **Jouer** (« Jouer au niveau {n} ? »), **Album** (§12), **Infos** (sous-menu : Comment jouer / Astuces / Le mémo), **Réglages**, **Quitter la table** (R-67) |
| UI-02 | **Jeu** | Bandeau : « Niveau {n} », **Jetons de la partie** (5 chiffres), **Total** (5 chiffres). Plateau 5 × 5 + 5 indicateurs de ligne (à droite) + 5 indicateurs de colonne (en bas). Boutons : **Mémo**, **Quitter**. Zone de message (une ligne) |
| UI-03 | **Infos** | 3 pages de texte original, inspirées des écrans d'aide de la DS : **« Comment jouer »** (règles et jetons), **« Astuces »** (lecture des indicateurs et règle du niveau 8), **« Le mémo »**. Courtes : ma sœur connaît très bien le jeu |
| UI-04 | **Réglages** | Son (on/off) ; animations réduites (valeur par défaut : la préférence système `prefers-reduced-motion` ; dès que le joueur change ce réglage dans l'app, son choix la remplace) ; **code secret** (saisir ou changer, §13) ; records (R-72) ; vider la boîte à jetons ; effacer toute la progression ; version de l'app ; crédits |
| UI-05 | **Bienvenue** (1ᵉʳ lancement) | « Entre le code secret de ta carte cadeau » (champ + bouton, lien « plus tard »), puis le **message personnel** contenu dans le pack (§13) et le bouton « Commencer » |
| UI-06 | **Album** | Voir §12 |

### 10.2 Mise en page
- **UI-10 iPhone (portrait, cible principale)** : bandeau en haut, plateau carré occupant toute la largeur utile (marges ≥ 12 px), boutons en bas, à portée du pouce. Respect des zones sûres (`env(safe-area-inset-*)`, `viewport-fit=cover`). Pas de défilement sur iPhone SE (375 × 667) ni sur iPhone 15 Pro Max (430 × 932). Vérifié par captures sur 5 profils : `iphone-se`, `iphone-15`, `iphone-15-pro-max`, `iphone-15-paysage`, `mac` (§15).
- **UI-11 Mac (cible secondaire)** : **la même mise en page que sur iPhone**, centrée, largeur maximale 480 px, sur fond décoré. Pas de mise en page spécifique en v1 (décision Q11 : priorité à l'iPhone).
- **UI-12** Cartes : cibles ≥ 44 × 44 px. Indicateurs : chaque ligne et chaque colonne a sa couleur (palette de 5 couleurs, style « classique » inspiré de la disposition du jeu d'origine), avec la somme en grand et le nombre de Sardines à côté d'une petite **tête de chien**. Les couleurs ne sont jamais la seule information.
- **UI-13** Pas de zoom au double-toucher (`touch-action: manipulation`), pas de sélection de texte, pas de menu contextuel sur appui long.
- **UI-14 Carte Sardine** : quand elle est révélée, la carte affiche la **tête de Sardine** (photo détourée en rond, issue du pack personnel, §13). Tant que le code secret n'a pas été saisi, une **tête de chien dessinée** (SVG original) la remplace.
- **UI-15 Paysage** : pas de mise en page dédiée. Si le jeu s'affiche en paysage (iOS qui ignore le verrouillage d'orientation, fenêtre Mac basse), rien ne déborde et le plateau tient entièrement dans la hauteur disponible.

### 10.3 Entrées
- **UI-20** Tactile et souris : toucher une carte = retourner (ou sélectionner, en mode mémo).
- **UI-21** Clavier (Mac, priorité P3) : flèches = curseur ; Entrée ou Espace = retourner ; `M` = ouvrir/fermer le mémo ; `S`, `1`, `2`, `3` = marques (en mode mémo) ; `Q` = quitter ; Échap = fermer le dialogue ou le mémo.
- **UI-22** Pendant une animation bloquante (retournement, apparition de Sardine (UI-31)), les entrées sont ignorées (CL-19), sauf le « toucher pour accélérer » des animations de fin (CL-20).

### 10.4 Animations (durées indicatives, divisées par 4 en mode « animations réduites »)
| ID | Animation | Durée |
|---|---|---|
| UI-30 | Retournement d'une carte (rotation 3D sur l'axe Y) | 250 ms |
| UI-31 | Sardine : la tête de Sardine surgit en grand (zoom + rebond), secousse du plateau, **aboiement** | 800 ms |
| UI-32 | Gain qui augmente : compteur qui défile de l'ancienne à la nouvelle valeur (tic sonore tous les 4) | ≤ 1 s, accélérable |
| UI-33 | Message flottant « ×2 ! » / « ×3 ! » près de la carte | 700 ms |
| UI-40 | Encaissement : le gain de la partie descend pendant que le total monte | ≤ 1,5 s, toucher = immédiat |
| UI-41 | Victoire : jingle + bandeau « Gagné ! » | 1,5 s |
| UI-42 | Révélation de fin : toutes les cartes cachées se retournent en vague | 600 ms |
| UI-43 | Changement de niveau : bandeau « Niveau {n} » | 1,2 s |

### 10.5 Sons (synthétisés en Web Audio)
Retournement, refus, sélection (bouton), marque de mémo, tic de jeton, encaissement (dernier tic), **aboiement** (carte Sardine), jingle de victoire, jingle de défaite, montée de niveau, descente de niveau, suspense (R-90), déblocage d'une photo.
- **UI-50 Aboiement** : par défaut, un aboiement **synthétisé** (bruit filtré + enveloppe, deux « wouf » courts). Si le pack personnel contient `aboiement` (vrai enregistrement de Sardine, §13), c'est celui-ci qui est joué.
- Bouton muet mémorisé. Le premier son n'est joué qu'après une interaction (contrainte iOS).

### 10.6 Textes (originaux, `src/ui/texts.fr.ts`)
Exemples : « Jouer au niveau {n} ? », « {v} ! Tu gagnes {n} jeton(s) ! », « ×{v} ! Tu as maintenant {n} jetons ! », « Wouf ! Sardine t'a tout pris. 0 jeton. », « Gagné ! Tu as trouvé tous les 2 et les 3. », « Tu remportes {n} jeton(s) ! », « Niveau {n} atteint ! », « Retour au niveau {n}. ». Accord du pluriel géré (`jeton` / `jetons`).
- **UI-60 Messages personnalisables** : les messages d'ambiance (Sardine trouvée, victoire, suspense, montée et descente de niveau) sont des **listes** dans lesquelles le jeu tire au hasard. Les listes de base sont dans `texts.fr.ts` (public). Le pack personnel (§13) peut **ajouter** des messages privés (prénoms, blagues de famille) à chaque liste.

---

## 11. Persistance (décision Q9 : on garde le niveau, pas la partie)

- **R-100** Stockage `localStorage`, clé `sardinebagarre:save`, JSON avec `version` (entier). La sauvegarde est écrite à **chaque changement de l'état persistant**. Liste exhaustive :
  - fin de partie (finalisation, R-55) ;
  - achat dans l'album (R-112) ;
  - changement d'un réglage (UI-04) ;
  - saisie du code secret (R-124) ;
  - écran de bienvenue vu (`welcomeSeen`, UI-05) ;
  - « Quitter la table » (R-67) ;
  - « Vider la boîte à jetons » (R-53) ;
  - « Effacer toute la progression » (UI-04).
- **R-101** Contenu : `version`, `coins`, `level`, `history[≤5]`, `settings` (son ; animations réduites, non renseigné tant que le joueur n'a rien choisi, voir UI-04), `stats` (R-72), `album` (identifiants des photos débloquées), `welcomeSeen`, `packCode` (code secret saisi, §13). **La partie en cours n'est pas sauvegardée** (R-68).
- **R-102** Lecture tolérante : schéma validé, migration si `version` est ancienne, repli propre sinon (CL-22).
- **R-103** Les données restent **sur l'appareil**. iPhone et Mac sont indépendants (Q11). Sur iPhone, l'app de l'écran d'accueil a un stockage **séparé** de l'onglet Safari.
- **R-104 Mise à jour de l'app** : le service worker est enregistré en mode `registerType: 'prompt'` (vite-plugin-pwa). Une nouvelle version n'est **jamais** appliquée pendant une partie `EN_COURS`, puisque la partie en cours n'est pas sauvegardée (R-68). Elle est appliquée automatiquement, par un rechargement, quand le joueur est sur le menu (UI-01) : tout de suite s'il y est déjà, sinon dès qu'il y revient. Si l'app est fermée avant, la nouvelle version s'applique au lancement suivant.

---

## 12. Album photo (décision Q10 : les jetons servent à débloquer des photos)

- **R-110** L'album contient **N photos** (N et l'ordre sont fixés par le pack personnel, §13 ; une douzaine par défaut). Chaque photo a un **prix** en jetons et une **légende** optionnelle.
- **R-111** Les photos se débloquent **dans l'ordre** : seule la prochaine photo verrouillée peut être achetée. Les suivantes apparaissent comme des cadres verrouillés avec leur prix, sans aperçu. Ordre imposé confirmé par ADR-016.
- **R-112** Acheter : si `total ≥ prix`, confirmation (« Débloquer cette photo pour {prix} jetons ? »), puis `total -= prix`, la photo est ajoutée à `album`, avec une animation et un son de déblocage. Sinon, le bouton est grisé et affiche « Encore {manque} jetons ».
- **R-113** Une photo débloquée s'ouvre en plein écran (pincer pour zoomer non requis), avec sa légende. Débloquée = débloquée pour toujours sur cet appareil.
- **R-114** Sans code secret saisi, l'écran Album affiche seulement « Entre le code secret de ta carte cadeau » (lien vers les Réglages).
- **R-115** Prix par défaut (modifiables dans le pack), pensés pour qu'une première photo arrive dès la première session et que l'album complet demande quelques semaines de jeu : `100, 200, 300, 500, 700, 1 000, 1 500, 2 000, 3 000, 5 000, 7 500, 10 000` (total : 31 800).
- **R-116** Le plafond de 50 000 jetons (R-53) reste en vigueur. Acheter des photos fait redescendre le total.

---

## 13. Contenu personnel : le pack chiffré (décision Q6 + Q10)

Le dépôt GitHub est **public** et le site aussi. Les photos (Sardine, famille, chats), l'aboiement enregistré, le message de bienvenue et les messages privés **ne doivent jamais apparaître en clair** ni dans le dépôt, ni dans son historique Git, ni sur le site.

- **R-120 Source privée** : un dossier `prive/` à la racine, **ignoré par Git** (`.gitignore`), contient `pack.json` (message de bienvenue, liste des photos avec prix et légendes, messages privés, réglage du cadrage de la tête), `photos/*.jpg`, `sardine-tete.jpg` et, plus tard, `aboiement.m4a`. Ce dossier n'existe que sur ton ordinateur (pense à le sauvegarder ailleurs, sur une clé USB par exemple). **Toutes** les photos y passent, y compris celles où Sardine apparaît seule (ADR-015) : aucune photo réelle en clair dans le dépôt ni sur le site.
- **R-121 Fabrication du pack** : `npm run pack` (à lancer **par toi**, dans un terminal) demande le code secret (saisie masquée), redimensionne les photos (1 280 px max, qualité 80, ce qui donne environ 150 à 250 Ko par photo), puis chiffre l'ensemble en un seul fichier `public/pack/pack.bin`. Seul ce fichier chiffré est commité.
- **R-122 Chiffrement** : AES-GCM 256 bits ; clé dérivée du code secret par PBKDF2-SHA-256 (600 000 itérations, sel aléatoire de 16 octets) ; IV aléatoire de 12 octets ; en-tête `SBPACK1` + sel + IV + données chiffrées. Code normalisé avant dérivation (minuscules, sans accents ni espaces superflus).
- **R-123 Code secret** : 4 mots tirés au hasard (par exemple `croquette-tempete-violon-sardine`), imprimé sur la carte cadeau. Avec 4 mots aléatoires et PBKDF2, le pack ne peut pas être déchiffré par force brute en pratique. Un code faible (le nom du chien) le rendrait déchiffrable : à éviter.
- **R-124 Dans le jeu** : à la saisie du code, on dérive la clé et on déchiffre. En cas d'échec (authentification GCM) : « Ce code ne marche pas. Vérifie ta carte ! ». En cas de succès, le code est enregistré dans la sauvegarde (R-101), les photos, la tête de Sardine et l'aboiement sont chargés en mémoire (URL `blob:`), et les messages privés sont ajoutés aux listes (UI-60). Le déchiffrement est refait à chaque lancement (< 1 s attendu sur iPhone pour ~5 Mo) ⚠️ à mesurer.
- **R-125 Hors ligne** : `pack.bin` est préchargé par le service worker comme le reste du jeu.
- **R-126 Sans pack valide** : le jeu reste **entièrement jouable** (tête de chien dessinée, aboiement synthétisé, messages publics). Seuls l'album et le message de bienvenue attendent le code.
- **R-127 Contrôle automatique** : un script de la CI (`scripts/verifier-confidentialite.mjs`) **échoue** si un fichier image ou audio est suivi par Git en dehors de `public/icons/` et `src/ui/art/`, si un fichier de `prive/` est suivi, ou si `public/pack/pack.bin` ne commence pas par l'en-tête `SBPACK1`.
- **R-128** Web Crypto (`crypto.subtle`) n'est disponible qu'en **HTTPS** (ou sur `localhost`) : pour tester le pack sur iPhone, on passe par le site publié, ou par le serveur de développement en HTTPS (voir le plan, étape 3.2).
- **R-129 Non-indexation** : `index.html` contient `<meta name="robots" content="noindex">`, et `public/robots.txt` contient `User-agent: *` / `Disallow: /`. Ce n'est qu'une politesse envers les moteurs de recherche. L'URL GitHub Pages est **devinable** : la protection des photos et des messages repose **uniquement** sur le chiffrement du pack (R-120 à R-128), jamais sur le fait que l'URL reste inconnue.

---

## 14. Hors périmètre v1
Thèmes visuels (v2), synchronisation entre appareils, mise en page Mac spécifique, multijoueur, classement en ligne, solveur ou aide automatique, musique, autres langues.

---

## 15. Critères d'acceptation (vérifiables)

1. Tous les tests de `tests/logic/` passent : table §3, vecteurs N1 à N17, cas CL-01 à CL-23 pour la partie logique, règles R-110 à R-116 (album).
2. Test de propriété : 1 000 plateaux par entrée de configuration, avec graines fixes → comptes exacts, contraintes R-21.5 respectées, indicateurs = sommes recalculées.
3. Test de bout en bout (Playwright, WebKit, profil iPhone) : une partie gagnée avec une graine connue, une partie perdue, un abandon à 0 carte → niveau 1, le mémo pose et retire des marques, le niveau survit à un rechargement **mais pas la partie** (CL-18), déchiffrement d'un **pack de test** (fausses images générées, code connu) et refus d'un mauvais code.
4. Captures d'écran sur 5 profils, sans débordement : `iphone-se` (375 × 667), `iphone-15` (393 × 852), `iphone-15-pro-max` (430 × 932), `iphone-15-paysage` (852 × 393, UI-15), `mac` (1280 × 800).
5. Le jeu fonctionne en mode avion après une première visite (service worker), pack compris.
6. Installabilité : manifeste valide, icônes 180 px (Apple) et 512 px.
7. `scripts/verifier-confidentialite.mjs` passe en CI (R-127).
