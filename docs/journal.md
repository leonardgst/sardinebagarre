# Journal de bord

> Mémoire du projet entre les sessions. Claude lit ce fichier au début d'une session et y ajoute 2 ou 3 lignes à la fin de chaque tâche.
> Format des entrées : `- AAAA-MM-JJ — <qui> — <quoi>`. Rien de personnel ici (dépôt public) : pas de prénoms, pas de code secret.

## Index des tâches
| Tâche | Titre | Statut |
|---|---|---|
| T-001 | Initialiser le projet (Vite, TypeScript, Vitest, Biome, Playwright, contrôle de confidentialité) | terminée |
| T-002 | Créer les types de base, la table des configurations et le hasard à graine | terminée |
| T-003 | Générer les plateaux et calculer les indicateurs (+ 2 corrections de relecture T-002) | terminée |

## Questions ouvertes
_(aucune)_

## Contenus à fournir par l'humain (dans prive/, jamais commités)
- [ ] Tête de Sardine — avant le 29/11
- [ ] Photos de l'album, légendes, prix, messages — avant le 6/12
- [ ] Aboiement enregistré (facultatif) — avant le 11/12

## Prochaines étapes
- Étape 1.3 du plan : une partie (retourner, gagner, perdre, quitter, mémo).

## Historique
- 2026-11-10 — Opus (cadrage) — Spécification, architecture, plan et fichiers de pilotage de Claude Code rédigés.
- 2026-11-10 — Opus (cadrage) — Réponses de cadrage intégrées : thème Sardine, dépôt public + GitHub Pages, pack chiffré, album, Windows, sauvegarde sans partie en cours.
- 2026-11-10 — codeur — T-001 : projet initialisé (Vite, TS strict, Vitest, Biome, Playwright WebKit, contrôle de confidentialité R-127). check, build, e2e et screens passent.
- 2026-11-10 — codeur — Reste : relecture de T-001, puis étape 1 (logique). Biome 2.6 : noRestrictedImports/Globals dans le groupe style.
- 2026-11-10 — codeur — T-001 : corrections après relecture (C1 à C4) appliquées ; check OK (32 tests), e2e 3 passed.
- 2026-11-10 — Opus — T-001 fusionnée dans main et publiée sur GitHub Pages (CI verte) ; page vérifiée sur iPhone par l’humain.
- 2026-11-10 — Opus — Étape 0.6 : ADR-015 (photos de Sardine seule privées) et ADR-016 (album dans un ordre imposé) ; spec R-111 et R-120 annotées.
- 2026-11-10 — codeur — T-002 : types, table des 80 configurations (spec §3) et mulberry32 ajoutés avec tests (check OK, 203 tests). Reste : relecture, puis étape 1.2 (génération de plateau).
- 2026-11-10 — codeur — T-003 : génération de plateaux et indicateurs (R-01..R-03, R-20..R-24), 80 000 plateaux testés (tentatives : moyenne 1,47, max 24). Reste : relecture, puis étape 1.3 (état de partie).
- 2026-11-10 — codeur — T-003 : corrections après relecture (C1 à C3) : repli sur le dernier plateau vérifié, cas croisée ligne+colonne, recalcul indépendant des contraintes, sortie allégée ; check OK (221 tests). Reste : nouvelle relecture, puis étape 1.3.
