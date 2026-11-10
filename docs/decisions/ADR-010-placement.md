# ADR-010 — Placement des cartes par mélange plutôt que par tirage avec abandon

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Dans le code d'origine (S1), chaque carte est placée par tirages aléatoires. Si une carte ne trouve pas de case libre en 100 tirages, elle est **sautée** : le plateau a alors une carte en moins (cas rarissime).

## Options envisagées
1. **Reproduire le tirage avec abandon** : fidélité exacte, mais plateaux rarissimes aux comptes faux et invariants plus difficiles à tester.
2. **Placement par mélange (Fisher-Yates) parmi les cases qui valent encore 1** : même distribution, comptes toujours exacts.

## Décision
Option 2 : on garantit toujours les comptes exacts de la configuration.

## Conséquences
- Plus facile : les tests de propriété peuvent exiger des comptes exacts sur chaque plateau.
- Écart volontaire et invisible avec un cas rarissime de l'original.

## Références
`docs/specification.md` R-21, R-22, R-23 ; `docs/plan.md` étape 1.2.
