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
| T-008 | Compléter la couverture de la logique (revue 1.6) | terminée |
| T-009 | Afficher le plateau et le bandeau (rendu statique, style Salon) | terminée |
| T-010 | Jouer : retourner une carte, gagner, perdre, enchaîner les parties | terminée |
| T-011 | Menu d'accueil, dialogue Quitter, question « Jouer au niveau {n} ? » | à reprendre (C1 à C5) |

## Questions ouvertes
_(aucune)_

## Contenus à fournir par l'humain (dans prive/, jamais commités)
- [x] Tête de Sardine — fournie le 21/11
- [ ] Photos de l'album, légendes, prix, messages — avant le 6/12
- [ ] Aboiement enregistré (facultatif) — avant le 11/12

## Prochaines étapes
- Phase 2 (interface) : relecture de T-011 (étape 2.3b), puis étape 2.4 (mémo).
- Avant l'étape 3.3 : rendre le HTTPS de développement utilisable sur iPhone (le certificat de `plugin-basic-ssl` est refusé par Safari sur une adresse IP ; piste : certificat mkcert installé sur l'iPhone).

## Contraintes pour la phase 2 (revue de la logique du 2026-11-21)
- `finalizeRound` historise `game.level` : interdire « Effacer la progression », « Vider la boîte » et « Quitter la table » pendant une partie `PLAYING` (sinon la partie est historisée au mauvais niveau).
- Deux générateurs distincts dans `seed.ts` : un pour les plateaux, un pour le décor (messages UI-60, suspense R-90), sinon les tests e2e à graine fixe deviennent fragiles.
- R-55 : appeler `finalizeRound` puis sauvegarder dès que `flip`/`quit` renvoie un statut ≠ `PLAYING`, avant toute animation ; test e2e de rechargement pendant la révélation.
- Après la fin de partie, les touchers vont à l'accélération des animations (CL-20), jamais à `flip` (qui renverrait un « refus »).
- Identifiants de carte toujours 0..24 (`RangeError` sinon) ; `missingCoins` vaut 0 aussi quand l'album est complet : tester `nextPhoto(...) === null` d'abord.
- Exporter la clé `sardinebagarre:save` en constante dans `storage.ts` (étape 3.1) ; prix par défaut R-115 et validation des prix dans le modèle du pack (étape 3.3).
- Étape 3.3 : refuser un pack dont un prix n'est pas un entier ≥ 0 (un prix invalide bloque toutes les photos suivantes).
- Étape 3.1 (relecture T-010, C4) : au chargement d'une sauvegarde dont le total est ≥ 50 000, `createController` ne doit pas lever d'exception. Depuis T-011 (ADR-019), l'app démarre sur le menu et la phase `full` n'existe plus : la boîte pleine affiche `messages.boxFull` sur le menu (R-53). Vérifier que le menu affiche alors le bon niveau et le bon total. Ajouter le test de C3 (relecture T-010) : avec un total de 49 990, une victoire avec un gain de 36 affiche « Tu remportes 10 jetons ! ».
- T-011 (relecture T-010) : tout élément ajouté à `body` hors de `#app` (dialogue, bandeau de mise à jour R-104) déclencherait `onElsewhere`. Le placer dans `#app` ou l'exclure explicitement.
- Anti-rebond (relecture T-011, C1) : après la fermeture de tout dialogue ou bandeau qui recouvre le plateau, et après l'affichage d'un nouveau plateau, les touchers de carte sont ignorés pendant un court délai. Un double toucher ne doit jamais retourner une carte que le joueur n'a pas visée (même esprit que CL-19).
- Hors `playing`, tout bouton de l'écran de jeu se comporte comme un toucher d'écran : il accélère en `ending` et continue en `waitingTap` (relecture T-011, C2). Valable aussi pour Mémo à l'étape 2.4.

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
- 2026-11-21 — relecteur — Revue complète de la logique (1.6) : 🟡, code juste ; manquent R-03, R-64 (série au niveau 8), CL-21, R-90 (non implémentée), garde des prix d'album. 40 lignes de la table §3 identiques à la spec.
- 2026-11-21 — Opus — Script `scripts/partie-console.ts` ; architecture.md et spec (R-90, R-102, `CardValue`) mis en cohérence ; T-008 planifiée ; contraintes pour la phase 2 consignées.
- 2026-11-21 — codeur — T-008 : `isSuspense` (R-90), garde des prix d'album (R-110/R-116), `performance` interdit dans src/logic, tests R-03, R-64, CL-21, CL-23 ; contre-épreuves a à f faites ; check OK (406 tests). Reste : relecture.
- 2026-11-21 — codeur — T-008 : les plateaux R-90 de la fiche déclenchaient une victoire automatique (aucun 2 caché) ; un « 2 » a été ajouté hors ligne/colonne visées dans les trois plateaux.
- 2026-11-21 — codeur — T-008 : corrections après relecture (C1 statut testé, C2 ligne sans Sardine, C3 documentation) ; contre-épreuves faites ; check OK (407 tests).
- 2026-11-22 — humain — Parties en console (`scripts/partie-console.ts`) jouées : le jeu fonctionne. Phase 1 (logique) terminée.
- 2026-11-22 — Opus — Étape 2.1 : 3 maquettes (Salon, Conserverie, Cahier) dans docs/maquettes/ ; l'humain retient « Salon » (ADR-018). Vues sur iPhone via `npx vite docs/maquettes --host` (http, port 5173 ouvert sur le profil Privé).
- 2026-11-22 — Opus — Branche maquettes fusionnée ; T-009 planifiée (étape 2.2 : rendu statique, seed.ts à deux générateurs, 5 profils Playwright, crochet de debug).
- 2026-11-22 — codeur — T-009 : rendu statique du plateau et du bandeau (style Salon), seed.ts à deux générateurs, crochet `?debug=1` (dev seulement), 5 profils Playwright ; check OK (414 tests), e2e 50 passés, captures vérifiées. Reste : relecture, puis T-010 (interactions).
- 2026-11-22 — codeur — Le port 5173 était occupé par le serveur des maquettes : `playwright.config.ts` accepte `E2E_PORT` (défaut 5173).
- 2026-11-22 — codeur — T-009 : corrections de relecture C1 (police des chiffres Palatino), C2 (rôles ARIA), C3 (test géométrique R-01/R-02) ; check OK, e2e 55 passés.
- 2026-11-22 — Opus — T-009 terminée après 2e relecture (🟢) et fusionnée dans main (non poussée). Prochaine étape : T-010 (étape 2.3a).
- 2026-11-22 — Opus — v0.1.0 publiée (main poussée, tag v0.1.0). T-010 planifiée (étape 2.3a : contrôleur, animations, aboiement, R-55 avant animation, CL-19/CL-20).
- 2026-11-22 — codeur — T-010 : jeu jouable (retournement, Sardine + aboiement synthétisé, victoire, révélation, niveau suivant, R-55 avant animations, CL-19/20/21) ; check OK (419), e2e 90 passés, captures vérifiées. Reste : relecture et test manuel de l'aboiement.

- 2026-11-22 — T-010 : corrections de relecture C1, C2, C3, C5, C6 appliquées ; C4 reste pour l'étape 3.1.
- 2026-11-23 — codeur — T-010 : corrections de la 2e relecture C7 (clic traité deux fois), C8, C9 appliquées ; tests e2e C7 rouges avant, verts après.
- 2026-11-23 — relecteur — 3e relecture de T-010 : 🟡, fusion possible. C7, C8 et C9 conformes (contre-épreuve C7 faite, `force: true` justifié). C10 : borner l'attente du test CL-20 pour prouver l'accélération.
- 2026-11-23 — codeur — T-010 : C10 appliquée (accélération de fin CL-20 prouvée dans 2 tests e2e ; rouge sans `skip()`, vert avec, 5 répétitions stables).
- 2026-11-23 — humain — Recette T-010 sur iPhone et PC (`npm run dev -- --host`, en http) : aboiement, bandeau de niveau, accélération et passage à la partie suivante OK. Le HTTPS de dev est refusé par Safari (certificat auto-signé sur IP).
- 2026-11-23 — Opus — T-010 terminée (3e relecture 🟡, C10 corrigé, recette OK) et fusionnée dans main (non poussée). Prochaine étape : T-011 (étape 2.3b).
- 2026-11-23 — Opus — v0.2.0 publiée (main poussée, tag v0.2.0).
- 2026-11-23 — Opus — ADR-019 (menu au lancement, question « Jouer au niveau {n} ? » après chaque partie, Non → menu), spec §5.1 et UI-01 annotées ; T-011 planifiée (étape 2.3b).
- 2026-11-23 — codeur — T-011 : menu d'accueil, dialogue Quitter, question « Jouer au niveau n ? », Quitter la table ; `onFinalized` renommé `onGameChange` ; 20 tests e2e ajoutés, contre-épreuves a à d faites ; check OK (419 tests unitaires), e2e 210 passés.
- 2026-11-23 — codeur — Reste : relecture de T-011, puis étape 2.4 (mémo). Le bouton Mémo est toujours inerte.
- 2026-11-23 — relecteur — T-011 : 🔴 à reprendre. Bloquant C1 : un double toucher sur « Non » (Quitter) ou « Oui » (Jouer au niveau n ?) retourne la carte située sous le bouton. Importants : C2 (Quitter et Mémo continuent en waitingTap), C3 (test CL-20 Quitter sans preuve d'accélération), C4 (test boîte pleine en fin de partie). Mineur : C5. Choix 2 du codeur accepté.
- 2026-11-23 : corrections de relecture T-011 (C1 à C5) appliquées : verrou anti-rebond 350 ms (`#app[data-verrou]`), boutons = toucher d'écran hors `playing`, 4 tests e2e ajoutés.
