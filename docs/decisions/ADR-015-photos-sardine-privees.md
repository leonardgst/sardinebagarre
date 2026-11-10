# ADR-015 — Les photos de Sardine seule restent privées

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Le dépôt et le site sont publics (ADR-002). Les photos de famille passent par le pack chiffré (ADR-011). Restait un cas limite : une photo où Sardine apparaît **seule** ne montre aucune personne, et pourrait donc sembler publiable. La question était suivie dans `docs/journal.md` (« Questions ouvertes »).

## Options envisagées
1. **Publiables en clair** (par exemple dans `public/`) : permettrait de les afficher sans code secret, sur l'écran d'accueil ou les cartes. En revanche, ces photos personnelles seraient visibles par quiconque trouve l'URL, et resteraient pour toujours dans l'historique Git public. Il faudrait aussi assouplir `verifier-confidentialite.mjs` (R-127).
2. **Privées, dans le pack chiffré uniquement** : même traitement que les autres photos. Sans code secret, le jeu utilise la tête de chien dessinée (UI-14, R-126).

## Décision
Option 2 : **toutes** les photos, y compris celles de Sardine seule (tête de Sardine comprise), passent uniquement par `prive/` et le pack chiffré. Aucune photo en clair dans le dépôt ni sur le site.

## Conséquences
- Une seule règle simple, sans exception : aucune photo réelle n'est publique. Le contrôle R-127 reste strict.
- Sans code secret, aucune photo de Sardine n'apparaît : l'identité visuelle publique repose sur les dessins originaux (`src/ui/art/`).
- L'icône de l'application (`public/icons/`) doit être un **dessin**, pas une photo de Sardine.

## Références
`docs/specification.md` R-120, R-126, R-127, UI-14 ; ADR-002, ADR-007, ADR-011.
