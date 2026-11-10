# ADR-003 — TypeScript strict + Vite, sans framework d'UI

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
L'interface est petite (un plateau de 25 cartes et quelques écrans). Priorités : simplicité, légèreté du mode hors ligne, peu de dépendances à maintenir, code écrit par Claude.

## Options envisagées
1. **TypeScript « vanilla » (DOM natif)** : aucune dépendance d'UI, adapté aux animations CSS de retournement (éléments créés une fois puis mis à jour par classes CSS). Plus de code d'affichage manuel.
2. **Preact (3 ko)** : composants, alternative crédible si l'UI se complique. Une dépendance de plus.
3. **React** : non justifié pour 25 cartes.

## Décision
TypeScript en mode `strict`, Vite pour le build et le serveur de développement, DOM natif : les éléments sont créés une fois puis mis à jour.

## Conséquences
- Plus facile : aucune dépendance d'UI à maintenir, mode hors ligne léger, `vite --host` pour tester sur iPhone en Wi-Fi.
- Plus difficile : un peu plus de code d'affichage manuel.
- À réévaluer : passer à Preact si `src/ui/render` dépasse environ 800 lignes.

## Références
`docs/architecture.md` §4 ; `CLAUDE.md` (Pile).
