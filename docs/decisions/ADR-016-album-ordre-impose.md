# ADR-016 — L'album se débloque dans un ordre imposé

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
ADR-012 a retenu un album photo débloqué avec les jetons, dans l'ordre (R-111), mais laissait ce point « à réévaluer » selon la réponse à une question ouverte (`docs/journal.md`). Cet ADR tranche la question et lève cette réserve, sans changer ADR-012.

## Options envisagées
1. **Ordre imposé** : seule la prochaine photo verrouillée peut être achetée, à prix croissants. Permet de raconter une histoire et de garder les plus belles photos pour la fin. Logique simple (une seule photo achetable) et peu d'états à tester.
2. **Ordre libre** : la joueuse choisit la photo à débloquer parmi toutes celles qu'elle peut payer. Plus de liberté, mais la surprise et la progression sont perdues (elle prendrait les moins chères d'abord). Il faudrait aussi des aperçus ou des légendes pour choisir, et davantage de cas à tester.

## Décision
Option 1 : ordre imposé, fixé par l'ordre des photos dans le pack (R-110, R-111). Prix par défaut croissants (R-115).

## Conséquences
- L'humain choisit l'ordre des photos dans `prive/pack.json` : c'est lui qui écrit l'histoire de l'album.
- `src/logic/album.ts` reste simple : la photo achetable est la première verrouillée.
- Les photos verrouillées s'affichent sans aperçu (R-111), ce qui préserve la surprise.
- Plus de réévaluation prévue. Un changement d'avis demanderait un nouvel ADR.

## Références
`docs/specification.md` §12 (R-110 à R-116) ; ADR-012 ; plan, étape 1.5.
