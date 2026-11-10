---
name: regles-voltorbataille
description: Règles exactes du jeu Sardinebagarre, copie fidèle des règles de la Voltorbataille (Voltorb Flip, Pokémon HeartGold/SoulSilver) avec Sardine (S) à la place du Voltorbe (V) - plateau, indicateurs, calcul des jetons, fin de partie, abandon, niveaux 1 à 8, descente de niveau, série pour le niveau 8, génération des plateaux avec contraintes de multiplicateurs gratuits, mémo, plafond de 50 000 jetons, partie interrompue, album photo. À charger avant toute modification de src/logic/, de tests de règles, ou pour répondre à une question sur une règle du jeu.
---

# Règles de Sardinebagarre (= Voltorbataille) — aide-mémoire

**Nom de la bombe** : dans la spec et dans ce résumé, « V » = Voltorbe = la carte-bombe. **À l'écran et dans le code, c'est « Sardine », valeur `'S'`** (marques du mémo : S, 1, 2, 3).

La référence complète est `docs/specification.md`. Ce fichier résume les points où l'on se trompe le plus souvent. **En cas de doute, la spec fait foi, puis le code décompilé (spec §0), puis Bulbapedia.** Ne te fie jamais à ta mémoire du jeu ni aux wikis seuls : ils se trompent sur le niveau 8.

## Plateau (R-01..R-04)
- 5×5, id = ligne×5 + colonne. Valeurs : 1, 2, 3, V (Voltorbe).
- Indicateur par ligne et par colonne : **somme** des valeurs (V = 0) et **nombre de V**. Fixe pendant la partie.

## Jetons de la partie (R-30..R-34)
- Première carte chiffrée : gain = sa valeur. Ensuite : gain = min(gain × valeur, 50 000).
- Un 1 retourné **compte** dans `cardsFlipped` (mais ne change pas le gain, sauf s'il est retourné en premier : gain = 1).
- V : gain = 0, partie perdue ; V ne compte **pas** dans `cardsFlipped`.
- Victoire **automatique** dès que tous les 2 et 3 sont retournés (gain == gainMax = 2^n2 × 3^n3).
- Retourner une carte efface son mémo. Carte déjà retournée : aucun effet.

## Abandon (R-40..R-42)
- Toujours possible, avec confirmation (texte différent si gain = 0). Le gain est encaissé. Issue `QUIT`.

## Encaissement et finalisation (R-50..R-55, R-71)
- `total = min(total + gain, 50 000)`. Si total ≥ 50 000 au lancement d'une partie : pas de partie ; on peut acheter la prochaine photo de l'album (s'il en reste une) ou vider la boîte (R-53).
- **Finalisation (R-55)** : dès que l'issue est connue, on encaisse, on ajoute la partie à l'historique, on calcule le niveau suivant, on met à jour les records et on sauvegarde, **avant** toute animation. La révélation et le défilement des jetons sont purement visuels (CL-23).
- Le total ne change que par : encaissement (R-50), achat d'album (R-112), vider la boîte (R-53), effacer toute la progression (R-71).
- La partie est `EN_COURS` dès l'affichage du plateau : il n'y a pas d'état « prête ».

## Niveau suivant (R-60..R-67) — port exact
```
d = dernière partie (o = issue, k = cartes chiffrées retournées, L = niveau)
si o == WON et L == 8                                   → 8
si L >= 5 et les 5 dernières parties ont toutes k >= 8 et o != LOST → 8
pour n = 7..2 : si (L >= n et k >= n) ou (L >= n-1 et o == WON) → n
sinon                                                   → 1
```
Pièges :
- Victoire au niveau 7 → **7** (jamais 8 par simple victoire).
- Défaite ou abandon au niveau 8 → **au plus 7**, même avec 10 cartes.
- Abandon à 0 carte → **niveau 1**, quel que soit le niveau.
- Série du niveau 8 : les abandons comptent (seule une défaite casse la série) ; les 1 comptent dans les 8 cartes ; la dernière partie doit être au niveau ≥ 5.
- Historique = 5 dernières parties (file circulaire), à n'importe quel niveau.

## Génération (R-20..R-24)
- On tire uniformément 1 des 10 entrées du niveau (5 configurations × variantes A/B).
- Jusqu'à 1 000 tentatives : tout à 1 ; placer V, puis les 2, puis les 3 sur des cases à 1 choisies uniformément ; un multiplicateur est **gratuit** si sa ligne OU sa colonne a 0 V ; accepter si gratuits_total < MaxT ET, pour chaque ligne et chaque colonne, gratuits < MaxLC (**strictement inférieur**). Sinon, recommencer. Après 1 000 échecs, garder le dernier plateau.
- Comptes toujours exacts (ADR-010).

## Configurations (V, 2, 3, gainMax, A:MaxLC/MaxT, B:MaxLC/MaxT)
```
N1: (6,3,1,24,3/3,3/3) (6,0,3,27,2/2,2/2) (6,5,0,32,3/4,3/4) (6,2,2,36,3/3,3/3) (6,4,1,48,3/4,3/4)
N2: (7,1,3,54,2/3,2/2) (7,6,0,64,3/4,3/3) (7,3,2,72,2/3,2/2) (7,0,4,81,2/3,2/2) (7,5,1,96,3/4,3/3)
N3: (8,2,3,108,2/3,2/2) (8,7,0,128,3/4,3/3) (8,4,2,144,3/4,3/3) (8,1,4,162,2/3,2/2) (8,6,1,192,4/3,3/3)
N4: (8,3,3,216,4/3,3/3) (8,0,5,243,2/3,2/2) (10,8,0,256,4/5,4/4) (10,5,2,288,3/4,3/3) (10,2,4,324,3/4,3/3)
N5: (10,7,1,384,4/5,4/4) (10,4,3,432,3/4,3/3) (10,1,5,486,3/4,3/3) (10,9,0,512,4/5,4/4) (10,6,2,576,4/5,4/4)
N6: (10,3,4,648,3/4,3/3) (10,0,6,729,3/4,3/3) (10,8,1,768,4/5,4/4) (10,5,3,864,4/5,4/4) (10,2,5,972,3/4,3/3)
N7: (10,7,2,1152,4/5,4/4) (10,4,4,1296,4/5,4/4) (13,1,6,1458,3/4,3/3) (13,9,1,1536,5/6,5/5) (10,6,3,1728,4/5,4/4)
N8: (10,0,7,2187,3/4,3/3) (10,8,2,2304,5/6,5/5) (10,5,4,2592,4/5,4/4) (10,2,6,2916,4/5,4/4) (10,7,3,3456,5/6,5/5)
```

## Sauvegarde et partie interrompue (R-68, R-100..R-104)
- Sauvegardés : jetons, niveau, historique (5), album, réglages, stats, code du pack. **Pas la partie en cours.** Écriture à chaque changement de cet état (liste exhaustive en R-100).
- App fermée pendant une partie `EN_COURS` : partie oubliée (gain perdu, pas d'entrée d'historique, niveau inchangé) → nouvelle partie au même niveau. App fermée pendant les animations de fin : rien n'est perdu (R-55).
- Une mise à jour de l'app n'est jamais appliquée pendant une partie `EN_COURS` (R-104).

## Album (R-110..R-116)
- Photos débloquées **dans l'ordre**, prix fixés par le pack ; `total -= prix` ; plafond de 50 000 toujours en vigueur.

## Mémo (R-80..R-84)
- 4 marques indépendantes (S, 1, 2, 3) par carte non retournée, combinables.
- En mode mémo, toucher une carte la **sélectionne** (pas de retournement) ; les boutons inversent la marque sur la carte sélectionnée.

## Vecteurs de test de référence
Voir la spec §6.3 (N1..N17) et §9 (CL-01..CL-23). Ils doivent tous exister dans `tests/logic/`.
