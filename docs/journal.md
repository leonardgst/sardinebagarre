# Journal de bord

> Mémoire du projet entre les sessions. Claude lit ce fichier au début d'une session et y ajoute 2 ou 3 lignes à la fin de chaque tâche.
> Format des entrées : `- AAAA-MM-JJ — <qui> — <quoi>`. Rien de personnel ici (dépôt public) : pas de prénoms, pas de code secret.

## Index des tâches
| Tâche | Titre | Statut |
|---|---|---|
| T-001 | Initialiser le projet (Vite, TypeScript, Vitest, Biome, Playwright, contrôle de confidentialité) | terminée |
| T-002 | Créer les types de base, la table des configurations et le hasard à graine | terminée |
| T-003 | Générer les plateaux et calculer les indicateurs (+ 2 corrections de relecture T-002) | terminée |
| T-004 | Jouer une partie : retourner, gagner, perdre, quitter, mémo | terminée |
| T-005 | Calculer le niveau suivant et tirer la configuration d'un niveau | terminée |
| T-006 | Enchaîner les parties, encaisser et débloquer l'album | terminée |
| T-007 | Sérialiser, valider et relire la sauvegarde (logique pure) | terminée |

## Questions ouvertes
_(aucune)_

## Contenus à fournir par l'humain (dans prive/, jamais commités)
- [x] Tête de Sardine — fournie le 21/11
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
- 2026-11-21 — codeur — T-004 : état de partie pur (`round.ts` : newRound, flip, toggleMemo, quit), 30 tests, check OK (251). Reste : relecture, puis étape 1.4 (niveau suivant).
- 2026-11-21 — codeur — T-004 : corrections après relecture (C1 mémo de la Sardine, C2 identifiants invalides, C3 fiche T-005) ; check OK (251 tests). Reste : nouvelle relecture, puis étape 1.4.
- 2026-11-21 — codeur — T-005 : `levels.ts` (pickEntry, appendHistory, nextLevel) et vecteurs N1..N17, 41 tests, contre-épreuves a à d faites ; check OK (292 tests). Reste : relecture, puis étape 1.5 (déroulement des parties enchaînées).
- 2026-11-21 — Opus — ADR-017 (effacer la progression garde code, réglages et bienvenue ; records : niveau obtenu, montées au niveau 8), spec R-71 et R-72 annotées ; T-006 planifiée (étape 1.5, 1re partie), la sauvegarde sera T-007.
- 2026-11-21 — codeur — T-006 : `game.ts` (finalisation R-55, plafond, records ADR-017, quitter la table, vider la boîte, effacer) et `album.ts` (achat dans l'ordre), 32 tests, contre-épreuves a à e faites ; check OK (324 tests). Reste : relecture, puis T-007 (sauvegarde).
- 2026-11-21 — codeur — T-006 : corrections après relecture (C1 à C6 : tests renforcés, `freezeGame` exporté et utilisé par `buyNextPhoto`) ; check OK (325 tests). Reste : nouvelle relecture, puis T-007.
- 2026-11-21 — Opus — T-006 fusionnée ; T-007 planifiée (save.ts : sérialisation, validation champ par champ, CL-22 ; son actif par défaut d'après §10.5).
- 2026-11-21 — codeur — T-007 : `save.ts` (sérialisation versionnée, lecture tolérante champ par champ, CL-22, gel profond, effacer la progression ADR-017), 45 tests, contre-épreuves a à f faites ; check OK (370 tests). Reste : relecture, puis étape 2.
- 2026-11-21 — codeur — T-007 : corrections après relecture (C1 à C6 : historique de 5, 7 compteurs, robustesse variée, bornes, clés imbriquées, `new Date` interdit), tests seulement ; check OK (390 tests). Reste : nouvelle relecture.
