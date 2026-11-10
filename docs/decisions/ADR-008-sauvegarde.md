# ADR-008 — Sauvegarde locale du niveau, sans la partie en cours

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Sur DS, quitter la Voltorbataille remet le niveau à 1 et vide l'historique. Sur iPhone, le système peut fermer l'app à tout moment : appliquer cette règle à la lettre serait frustrant. Réponse Q9.

## Options envisagées
1. **Fidèle** : chaque ouverture repart au niveau 1, seuls les jetons sont gardés.
2. **Tout sauvegarder**, partie en cours comprise (plateau, cartes retournées, mémo) : choix par défaut initial.
3. **Mixte** : jetons, niveau et historique sauvegardés, mais pas la partie en cours.

## Décision
Option 3. `localStorage`, une seule clé, JSON versionné contenant jetons, niveau, historique, album, réglages, stats et code. La partie en cours n'est pas sauvegardée : une partie interrompue est oubliée sans pénalité (R-68).

## Conséquences
- Plus facile : code plus simple (pas de sérialisation du plateau).
- Accepté : on peut changer de plateau en fermant l'app.
- Plus difficile : si iOS ferme l'app en arrière-plan, la partie en cours est perdue (pas le niveau). Chaque appareil a sa propre sauvegarde (pas de synchronisation).
- À surveiller : test de durée de 8 jours sans ouvrir l'app (R-T3).

## Références
`docs/specification.md` R-67, R-68, R-100 à R-103, CL-18, CL-22 ; `docs/questions-cadrage.md` Q9, Q11 ; `docs/risques.md` R-T3.
