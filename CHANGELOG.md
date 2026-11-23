# Journal des versions

## v0.3.0 — 2026-11-23
- Menu d'accueil au lancement (Jouer, Album, Infos, Réglages).
- Bouton Quitter pendant la partie : dialogue de confirmation, abandon avec encaissement des jetons gagnés.
- Après chaque partie, question « Jouer au niveau n ? » : Oui relance, Non ramène au menu.
- Protection contre les doubles touchers après un dialogue ou un changement d'écran (240 tests de navigateur sur 5 profils).

## v0.2.0 — 2026-11-23
- Le jeu est jouable : retourner une carte, gains multipliés, victoire, défaite sur une Sardine avec aboiement.
- Révélation du plateau en fin de partie, accélérée par un toucher ; partie suivante au bon niveau avec bandeau de niveau.
- Entrées bloquées pendant les animations (CL-19) ; jetons encaissés avant toute animation (R-55).
- Tests de navigateur en vrais clics pour la fin de partie (110 tests sur 5 profils).

## v0.1.0 — 2026-11-22
- Logique du jeu complète et testée : plateaux, indicateurs, jetons, niveaux 1 à 8, mémo, album, sauvegarde (sans interface).
- Direction artistique « Salon » retenue (ADR-018) ; maquettes dans `docs/maquettes/`.
- Premier écran de jeu : bandeau, plateau 5 × 5 et indicateurs d'une partie neuve du niveau 1 (pas encore interactif).
- Captures et tests de navigateur sur 5 profils (iPhone SE, iPhone 15, iPhone 15 Pro Max, paysage, Mac).
