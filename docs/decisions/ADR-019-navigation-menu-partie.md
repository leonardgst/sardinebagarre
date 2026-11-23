# ADR-019 — Navigation entre le menu et les parties

- **Statut** : acceptée
- **Date** : 2026-11-23
- **Décideur** : l'humain (proposé par Opus)

## Contexte
La spec décrit le menu d'accueil (UI-01) et l'écran de jeu (UI-02), mais ne dit pas :
- ce que l'app affiche au lancement ;
- comment on revient d'une partie au menu.

UI-02 n'a que deux boutons (Mémo, Quitter), et « Quitter » sert à encaisser (R-40). Jusqu'à T-010, l'app démarrait directement une partie et enchaînait les parties sans fin. Il faut trancher pour planifier T-011 (étape 2.3b).

## Options envisagées
**Après le toucher de fin de partie**
1. **Question « Jouer au niveau {n} ? » Oui/Non**, comme dans le jeu d'origine : Oui lance la partie suivante, Non ramène au menu. Fidèle, et la spec cite déjà ce texte (UI-01, §10.6). Un toucher de plus par partie.
2. **Bouton « Menu » dans le jeu**, actif seulement entre deux parties. Un troisième bouton dans la barre d'actions.
3. **Retour au menu seulement après un abandon** (Quitter). Pas de sortie après une victoire ou une défaite.

**Au lancement**
1. **Le menu d'accueil** : cohérent avec §5.1 (la partie commence après « Jouer ») et R-104 (les mises à jour s'appliquent sur le menu).
2. **Directement une partie**.

## Décision
- **Lancement** : l'app affiche le menu d'accueil (UI-01).
- **Menu → partie** : le bouton du menu s'intitule « Jouer au niveau {n} » et lance directement la partie (pas de seconde confirmation).
- **Fin de partie** : après la révélation (R-52), le toucher, puis le bandeau de niveau éventuel (R-66), le jeu demande « Jouer au niveau {n} ? » avec Oui et Non. Oui lance la partie suivante au niveau {n} ; Non ramène au menu.
- Si la boîte est pleine (R-53), la question n'est pas posée : le message « boîte pleine » s'affiche et on revient au menu.

## Conséquences
- La partie n'est `EN_COURS` que sur l'écran de jeu. Le menu (« Quitter la table », et plus tard Réglages) n'est jamais accessible pendant une partie : la contrainte de `finalizeRound` (historique au bon niveau) est respectée par construction.
- R-104 a un point d'application naturel : le menu, atteint au lancement et après chaque « Non ».
- Un toucher de plus entre deux parties. À réévaluer après la recette de l'étape 2.5 si c'est gênant.

## Références
`docs/specification.md` §5.1, R-40..R-42, R-52, R-53, R-66, R-67, R-104, UI-01, UI-02 ; T-011.
