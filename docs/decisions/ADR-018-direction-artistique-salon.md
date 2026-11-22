# ADR-018 — Direction artistique « Salon »

- **Statut** : acceptée
- **Date** : 2026-11-22
- **Décideur** : l'humain (proposé par Opus)

## Contexte
L'étape 2.1 du plan demande de choisir un style « classique » : même disposition que le jeu d'origine (grille 5 × 5, indicateurs colorés à droite et en bas), mais palette, cartes et typographie originales, sans élément Pokémon (ADR-007, UI-12). Le jeu doit marcher hors ligne (ADR-001) : pas de police téléchargée. Il est d'abord prévu pour iPhone (ADR-013).

## Options envisagées
1. **Salon** (`docs/maquettes/variante-1.html`) : tapis bordeaux à motif losangé, cartes crème liserées d'or, chiffres à empattements (Georgia), indicateurs pastel à chiffres foncés. Ambiance chaleureuse de table de jeu, bonne lisibilité. Les cartes sont un peu plus petites que dans les autres variantes, à cause du cadre du plateau.
2. **Conserverie** (`variante-2.html`) : bleu marine, cartes cachées en couvercles de boîte de sardines, bandeau rouge et jaune. Clin d'œil au nom, mais style plus chargé.
3. **Cahier** (`variante-3.html`) : papier quadrillé, traits au crayon, post-it. Charmant, mais il repose sur la police Chalkboard SE (Apple seulement) et lit moins bien les chiffres.

## Décision
On retient **Salon**. La maquette `docs/maquettes/variante-1.html` sert de référence visuelle pour l'étape 2.2 (couleurs, ombres, formes et disposition).

Repères à reprendre dans `src/ui/` :
- **Fond** `#6b2a2d` avec un motif losangé ; plateau `#4a1b1e` avec un liseré or `#b8924f`. Sur Mac (UI-11), fond `#220b0c`→`#5a2326`.
- **Carte cachée** : crème `#ead7b2`/`#f3e5c6` à rayures, double liseré or `#c9a45c`, médaillon rond au centre.
- **Carte retournée** : `#fffaf0`, chiffre encre `#3b2417`.
- **Carte Sardine** : fond vert `#2f5d50`, halo doré `#f2c14e`, tête dans un médaillon rond (UI-14).
- **Indicateurs** (ligne i et colonne i de même couleur) : `#f29b84`, `#a9d596`, `#f5c46a`, `#97bfe8`, `#c8abe2`, avec un texte `#2a1810`. Somme sur 2 chiffres, filet, puis petite tête de chien et nombre de Sardines.
- **Marques de mémo** : pastilles bordeaux dans les 4 coins (S en haut à gauche, 1 en haut à droite, 2 en bas à gauche, 3 en bas à droite).
- **Typographie** : polices système à empattements (`"Iowan Old Style", Palatino, Georgia, serif`), avec chiffres alignés (`font-variant-numeric: lining-nums tabular-nums`).
- **Boutons** : pilules crème et or.
- **Paysage** (UI-15) : quand la hauteur est faible (`orientation: landscape` et hauteur ≤ 540 px), le plateau passe à gauche, et le bandeau, le message et les boutons à droite, comme dans la maquette.
- **Chiffres** : Georgia n'a pas de chiffres alignés. Pour les chiffres, utiliser une pile à chiffres alignés par défaut : `Palatino, "Palatino Linotype", "Book Antiqua", "Times New Roman", serif` (relecture T-009, C1).
- **Tête de chien de secours** : le SVG `#chien` de la maquette, à déplacer dans `src/ui/art/`.

## Conséquences
- Pas de police à embarquer : rendu identique hors ligne sur iPhone et Mac. Sur Windows (développement seulement), Georgia remplace Iowan Old Style.
- Le cadre du plateau réduit un peu la taille des cartes. À 320 px de large, elles font 42 px. À vérifier à l'étape 2.2 sur le profil `iphone-se` (375 × 667) : 44 px au minimum (UI-12). Sinon, amincir le cadre.
- Les maquettes restent dans `docs/maquettes/` comme archive. Le code de l'interface ne les importe pas.

## Références
UI-10 à UI-15, UI-12 (indicateurs), UI-14 (carte Sardine), R-82 (marques du mémo) ; ADR-007, ADR-013 ; plan, étapes 2.1 et 2.2.
