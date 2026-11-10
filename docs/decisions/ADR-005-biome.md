# ADR-005 — Biome pour le lint et le formatage

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Le lint et le formatage doivent être automatiques (hook après chaque modification, CI), fonctionner sous Windows, et imposer la règle « `src/logic` n'importe jamais `src/ui` ».

## Options envisagées
1. **Biome** : un seul outil pour le lint et le formatage, configuration minimale, règle d'imports interdits. Moins de plugins qu'ESLint.
2. **ESLint + Prettier** : écosystème très riche. Deux outils et davantage de configuration.

## Décision
Biome : `biome check` dans `npm run check` (donc en CI) et formatage du fichier modifié par le hook `PostToolUse` après chaque `Edit`/`Write`.

## Conséquences
- Plus facile : un seul outil ; la règle d'architecture logique/interface est vérifiée automatiquement.
- Plus difficile : moins de plugins qu'ESLint (acceptable ici). Sous Windows, le hook appelle Biome via `node` (les raccourcis `.cmd` ne se lancent pas sans shell).

## Références
`docs/architecture.md` §4 et §5 ; `docs/guide-claude-code.md` §6 ; `.claude/hooks/format-fichier.mjs`.
