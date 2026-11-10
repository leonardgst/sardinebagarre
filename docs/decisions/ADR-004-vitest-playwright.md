# ADR-004 — Vitest pour la logique, Playwright WebKit pour le bout en bout et le visuel

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Les règles sont nombreuses et subtiles (niveaux, gains, génération). Claude doit pouvoir vérifier son propre travail, y compris l'aspect visuel. Il n'y a pas de Safari sous Windows (ADR-014).

## Options envisagées
1. **Vitest + Playwright (WebKit)** : Vitest est intégré à Vite et rapide ; WebKit est le moteur de Safari ; Claude peut lancer les tests et regarder les captures. WebKit reste différent du vrai Safari iOS.
2. **Jest pour les tests unitaires** : même syntaxe que Vitest, mais pas intégré à Vite.
3. **Seulement des tests manuels sur iPhone pour l'UI** : aucun outillage, mais aucune vérification automatique ni capture lisible par Claude.

## Décision
Chaque règle de la spec a au moins un test Vitest. Les parcours clés et les captures d'écran passent par Playwright (WebKit, profils iPhone SE, iPhone 15 et Mac 1280 × 800).

## Conséquences
- Plus facile : Claude vérifie seul son travail, y compris visuellement (skill `controle-visuel`) ; la logique se teste en millisecondes.
- Plus difficile : `npx playwright install webkit` à installer ; un écart Playwright WebKit / Safari iOS reste possible.
- À surveiller : test sur un vrai iPhone à chaque fin de phase (R-T6).

## Références
`docs/architecture.md` §4 ; `docs/specification.md` §15 ; `docs/risques.md` R-T6 ; skills `ajouter-fonctionnalite` et `controle-visuel`.
