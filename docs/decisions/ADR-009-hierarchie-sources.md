# ADR-009 — En cas de désaccord entre sources, le code décompilé fait foi

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Les wikis et guides se contredisent sur plusieurs points : accès au niveau 8, prise en compte des « 1 », défaite au niveau 8, victoire au niveau 7, contraintes de génération (spec §0.1). La destinataire connaît très bien le jeu (Q3) : la fidélité doit être maximale.

## Options envisagées
1. **Suivre les wikis** (Bulbapedia, Poképédia) : ce que lisent les joueurs, mais résumés parfois approximatifs ou contradictoires.
2. **Suivre le code décompilé** (`pret/pokeheartgold`) : comportement réel de la cartouche (version américaine), parfois différent de ce que disent les wikis.

## Décision
Hiérarchie S1 (code décompilé) > S2 (Bulbapedia) > S3 (Poképédia) > S4/S5 (spec §0). On réécrit la logique en TypeScript à partir de la spec, sans copier de code ni de ressource du dépôt `pret`.

## Conséquences
- Comportements parfois différents des wikis (niveau 8, défaite au niveau 8), documentés et testés (vecteurs N1 à N17, CL-15, CL-16).
- À surveiller : la joueuse pourrait croire à un bug (R-F1 → page d'aide « Astuces », qui explique la lecture des indicateurs et la règle du niveau 8, spec UI-03) ; la version française de la cartouche n'a pas été vérifiée (R-F2, risque accepté).

## Références
`docs/specification.md` §0 et §6 ; `docs/risques.md` R-F1, R-F2, R-I3.
