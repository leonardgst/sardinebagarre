# ADR-006 — Cœur logique pur, hasard injecté

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Les règles (gains, niveaux, génération des plateaux) doivent être testées de façon reproductible, vite et sans navigateur. Principe retenu : « cœur fonctionnel, coquille impérative ».

## Options envisagées
1. **Logique pure + PRNG à graine injecté** (`mulberry32`, graine tirée dans l'UI) : tests déterministes, sans écran. Demande de la discipline d'architecture.
2. **Logique mêlée à l'interface, `Math.random` direct** : moins de code au départ, mais tests non reproductibles et dépendants du navigateur.

## Décision
`src/logic/` n'a aucun accès au navigateur et n'importe jamais `src/ui/`. Ses fonctions sont de la forme `(état, action) → nouvel état`, sans mutation. Le hasard est passé en paramètre (`rng: () => number`).

## Conséquences
- Plus facile : environ 90 % des règles sont testées en millisecondes par Vitest ; un paramètre de développement `?seed=` permet de rejouer un plateau précis.
- Plus difficile : tout aléa ou accès au temps doit franchir la frontière logique/interface.
- À surveiller : Biome (et éventuellement un test d'architecture) vérifie l'interdiction d'import.

## Références
`docs/architecture.md` §4 (Hasard) et §5 ; `docs/specification.md` R-20, R-24 ; `CLAUDE.md` (Architecture).
