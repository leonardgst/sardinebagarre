# ADR-017 — Portée de « Effacer toute la progression » et définition de deux records

- **Statut** : acceptée
- **Date** : 2026-11-21
- **Décideur** : l'humain (proposé par Opus)

## Contexte
La spec cite « Effacer toute la progression » (UI-04, R-71, R-100) sans dire ce qui est effacé. R-72 liste les records sans définir précisément « niveau maximal atteint » ni « nombre de fois où le niveau 8 a été atteint ». Ces deux points sont nécessaires pour coder `src/logic/game.ts` (T-006).

## Options envisagées
**Effacer toute la progression**
1. **Progression seulement** : jetons, niveau, historique, records, album remis à zéro ; code secret, réglages et `welcomeSeen` conservés. La destinataire n'a pas à ressaisir le code de la carte cadeau.
2. **Tout** : l'app redevient comme au premier lancement (code secret compris).
3. **Progression sans l'album** : les photos débloquées restent.

**Records**
1. **Niveau obtenu, montée vers 8** : niveau maximal = plus haut niveau obtenu après une partie ; « niveau 8 atteint » = +1 à chaque passage d'un niveau inférieur au niveau 8.
2. **Niveau joué, parties au niveau 8** : niveau maximal = plus haut niveau joué ; « niveau 8 atteint » = nombre de parties jouées au niveau 8.

## Décision
- « Effacer toute la progression » : option 1. Remet `coins = 0`, `level = 1`, `history = []`, records à zéro et `album = []` ; **conserve** `packCode`, `settings` et `welcomeSeen`.
- Records : option 1. `maxLevel` = maximum des niveaux **obtenus** (valeur initiale 1) ; `level8Reached` = +1 quand le niveau passe d'un niveau < 8 à 8 (rester au niveau 8 ne compte pas).

## Conséquences
- Effacer la progression ne nécessite jamais de ressaisir le code secret.
- Les records ne comptent que des montées réelles au niveau 8.
- Spec annotée : R-71 (renvoi ici), R-72 (définitions).

## Références
`docs/specification.md` R-71, R-72, R-100, UI-04 ; T-006.
