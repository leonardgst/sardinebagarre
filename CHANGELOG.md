# Journal des versions

## v0.6.1 — 2026-11-24
- Diagnostic provisoire dans Réglages : état du hors ligne (service worker, adresse lancée, portée, fichiers en réserve, erreur d'enregistrement éventuelle), pour comprendre pourquoi l'app installée ne démarre pas en mode avion sur iPhone.

## v0.6.0 — 2026-11-24
- Application installable : icône (tête de chien originale), plein écran, balises pour l'écran d'accueil de l'iPhone.
- Jouable hors ligne après une première visite (service worker, précache de tout le jeu).
- Mise à jour appliquée seulement sur le menu, jamais pendant une partie (R-104).
- Version affichée dans Réglages.

## v0.5.0 — 2026-11-24
- Sauvegarde sur l'appareil : jetons, niveau, historique et records survivent à la fermeture de l'app.
- La partie en cours n'est pas sauvegardée : au retour, menu au même niveau, gain en cours perdu (R-68).
- Fin de partie enregistrée avant les animations : fermer pendant la révélation ne fait rien perdre.
- Sauvegarde abîmée ou stockage indisponible : le jeu démarre quand même ; boîte pleine signalée dès le menu.

## v0.4.0 — 2026-11-24
- Mode mémo : bouton « Mémo », sélection d'une carte sans la retourner, 4 marques (S, 1, 2, 3) combinables.
- Marques visibles en permanence dans les coins des cartes, effacées quand la carte est retournée.
- Refus visuel sur une carte déjà retournée ; « Quitter » reste accessible mémo ouvert.
- Protection contre les doubles touchers à l'ouverture et à la fermeture du mémo (330 tests de navigateur).

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
