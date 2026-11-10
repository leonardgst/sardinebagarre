# ADR-012 — Les jetons débloquent un album photo

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Dans l'original, les jetons s'échangent contre des lots et la boîte est plafonnée à 50 000. Il faut donner un but aux jetons. Réponse Q10 : les jetons débloquent des photos (Sardine surtout, mais aussi la famille et les chats).

## Options envisagées
1. **Fidèle** : plafond + message, bouton « Vider la boîte à jetons », records (choix par défaut initial).
2. **Boutique de récompenses originales** (thèmes, dos de cartes).
3. **Pas de plafond.**
4. **Album photo personnel** débloqué avec les jetons.

## Décision
Album ordonné à prix croissants (spec §12). Les thèmes visuels sont reportés en v2. Le plafond de 50 000 reste en vigueur.

## Conséquences
- La boucle de jeu a un but personnel.
- Les prix sont réglables dans le pack, sans toucher au code.
- L'album dépend du pack chiffré : sans code, il affiche seulement une invitation à le saisir (R-114).
- À réévaluer : l'ordre imposé reste une question ouverte (`docs/questions-cadrage.md`, « Questions encore ouvertes ») ; c'est le choix par défaut.

## Références
`docs/specification.md` §12 (R-110 à R-116) et R-53 ; `docs/questions-cadrage.md` Q10 ; ADR-011.
