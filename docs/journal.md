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
| T-011 | Menu d'accueil, dialogue Quitter, question « Jouer au niveau {n} ? » | terminée |
| T-012 | Mode mémo (sélection, 4 marques, Fermer) | terminée |
| T-013 | Brancher la sauvegarde (localStorage) sur le jeu | terminée |
| T-014 | Rendre le jeu installable et jouable hors ligne (PWA) | terminée |
| T-015 | Afficher un diagnostic hors ligne dans Réglages | terminée (provisoire, à retirer avant le gel) |
| T-016 | Fabriquer et lire le pack chiffré (sans interface) | terminée |
| T-017 | Brancher le pack chiffré dans le jeu | fusionnée, publiée en v0.7.0 ; recette avec le vrai pack à faire |

## Questions ouvertes
_(aucune)_

## Contenus à fournir par l'humain (dans prive/, jamais commités)
- [x] Tête de Sardine — fournie le 21/11
- [ ] Photos de l'album, légendes, prix, messages — avant le 6/12
- [ ] Aboiement enregistré (facultatif) — avant le 11/12

## Prochaines étapes
- Phase 3 : étape 3.3 (pack chiffré). À la publication suivante, vérifier sur iPhone que la mise à jour s'applique sur le menu (R-104).
- Avant le gel (13/12) : retirer ou réduire le diagnostic hors ligne de Réglages (T-015).
- Recette sur iPhone : toujours installer l'app depuis https://leonardgst.github.io/sardinebagarre/, jamais depuis l'adresse du serveur de développement (192.168.x.x) : en http, pas de service worker, donc pas de hors ligne.
- Étape 3.3 découpée : T-016 (format, script, déchiffrement, sans interface) puis T-017 (intégration : saisie du code, tête sur la carte, messages privés, préchargement). Le HTTPS de développement sur iPhone n'est plus un prérequis : le pack se teste sur ordinateur (`localhost` est un contexte sécurisé) et sur le site publié.

## Contraintes pour la phase 2 (revue de la logique du 2026-11-21)
- `finalizeRound` historise `game.level` : interdire « Effacer la progression », « Vider la boîte » et « Quitter la table » pendant une partie `PLAYING` (sinon la partie est historisée au mauvais niveau).
- Deux générateurs distincts dans `seed.ts` : un pour les plateaux, un pour le décor (messages UI-60, suspense R-90), sinon les tests e2e à graine fixe deviennent fragiles.
- R-55 : appeler `finalizeRound` puis sauvegarder dès que `flip`/`quit` renvoie un statut ≠ `PLAYING`, avant toute animation ; test e2e de rechargement pendant la révélation.
- Après la fin de partie, les touchers vont à l'accélération des animations (CL-20), jamais à `flip` (qui renverrait un « refus »).
- Identifiants de carte toujours 0..24 (`RangeError` sinon) ; `missingCoins` vaut 0 aussi quand l'album est complet : tester `nextPhoto(...) === null` d'abord.
- Exporter la clé `sardinebagarre:save` en constante dans `storage.ts` (étape 3.1) ; prix par défaut R-115 et validation des prix dans le modèle du pack (étape 3.3).
- Étape 3.3 (relecture T-014, C6) : test e2e qui vérifie que `pack/pack.bin` est dans le précache du service worker et se charge hors ligne (au-delà de `maximumFileSizeToCacheInBytes`, 10 Mo, Workbox l'exclurait sans erreur).
- Étape 3.3 : refuser un pack dont un prix n'est pas un entier ≥ 0 (un prix invalide bloque toutes les photos suivantes).
- Étape 3.1 (relecture T-010, C4) : au chargement d'une sauvegarde dont le total est ≥ 50 000, `createController` ne doit pas lever d'exception. Depuis T-011 (ADR-019), l'app démarre sur le menu et la phase `full` n'existe plus : la boîte pleine affiche `messages.boxFull` sur le menu (R-53). Vérifier que le menu affiche alors le bon niveau et le bon total. Ajouter le test de C3 (relecture T-010) : avec un total de 49 990, une victoire avec un gain de 36 affiche « Tu remportes 10 jetons ! ».
- T-011 (relecture T-010) : tout élément ajouté à `body` hors de `#app` (dialogue, bandeau de mise à jour R-104) déclencherait `onElsewhere`. Le placer dans `#app` ou l'exclure explicitement.
- Anti-rebond (relecture T-011, C1) : après la fermeture de tout dialogue ou bandeau qui recouvre le plateau, et après l'affichage d'un nouveau plateau, les touchers de carte sont ignorés pendant un court délai. Un double toucher ne doit jamais retourner une carte que le joueur n'a pas visée (même esprit que CL-19).
- Hors `playing`, tout bouton de l'écran de jeu se comporte comme un toucher d'écran : il accélère en `ending` et continue en `waitingTap` (relecture T-011, C2). Valable aussi pour Mémo à l'étape 2.4.
- Tout changement d'écran ou ouverture de dialogue sous le doigt passe par le même verrou anti-rebond (relecture T-011, C6 et C7).

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
- 2026-11-23 — relecteur — T-011, 2e relecture : 🟡. C1 à C5 conformes (contre-épreuves faites, verrou de 350 ms en temps réel accepté). C6 (important) : un double toucher sur une carte en waitingTap répond à « Jouer au niveau n ? » (dialogue ouvert sous le doigt). C7 (mineur) : un double toucher sur Oui/Non au-dessus du menu ouvre Album. C8 : compte e2e réel 230 passés / 10 ignorés.

- 2026-11-23 — T-011 : corrections de 2e relecture C6 (verrou à l'ouverture d'un dialogue, Oui/Non ignorés pendant le verrou), C7 (verrou avant le menu), C8 (compte e2e). e2e : 240 passés, 10 ignorés.
- 2026-11-23 — Opus — T-011 : C6 à C8 vérifiés (check OK, e2e 240 passés / 10 ignorés). Reste : recette humaine, puis fusion.
- 2026-11-23 — humain — Recette T-011 sur iPhone OK ; v0.2.0 jouée aussi hors de chez soi depuis GitHub Pages, sans souci.
- 2026-11-23 — Opus — T-011 terminée et fusionnée dans main (non poussée). Prochaine étape : étape 2.4 (mémo).
- 2026-11-23 — Opus — v0.3.0 publiée (main poussée, tag v0.3.0). T-012 planifiée (étape 2.4 : mémo ; son « refus » reporté à l'étape 4.5).
- 2026-11-23 — codeur — T-012 : mode mémo (sélection, 4 marques, Fermer, refus, R-41, anti-rebond), 15 tests e2e, contre-épreuves a à d faites, `10-memo.png` ; check OK. Reste : relecture, puis étape 2.5.
- 2026-11-23 — relecteur — T-012 : 🟡, fusion possible après C1 et C2 (tests manquants : anti-rebond sur Fermer, conservation et effacement de la sélection). Mineurs : C3 (couleur des boutons pressés), C4 (bits recopiés), C5 (décision 2 à compléter). Clic forcé validé par contre-épreuve ; captures SE, Pro Max et paysage conformes.
- 2026-11-23 — codeur — T-012 : corrections de relecture C1 à C5 (tests anti-rebond Fermer et sélection, style des boutons pressés, MEMO_BITS partagé) ; check et e2e OK.
- 2026-11-23 — Opus — T-012 : C1 à C5 vérifiés (contre-épreuve C1 refaite, capture SE vue, check OK). Reste : recette humaine, puis fusion.
- 2026-11-24 — humain — Recette T-012 (mémo) sur iPhone OK.
- 2026-11-24 — Opus — T-012 terminée et fusionnée dans main (non poussée).
- 2026-11-24 — Opus — v0.4.0 publiée (main poussée, tag v0.4.0). Étape 2.5 couverte par les recettes iPhone : phase 2 terminée. Prochaine étape : 3.1 (sauvegarde).
- 2026-11-24 — Opus — T-013 planifiée (étape 3.1 : storage.ts, branchement, boîte pleine au lancement, tests CL-18, CL-22, C3 de T-010).
- 2026-11-24 — codeur — T-013 : sauvegarde branchée (storage.ts, main.ts, initialGame, boîte pleine au lancement), 13 tests e2e, contre-épreuves a à d faites ; check OK (419 tests), e2e OK. Reste : relecture.
- 2026-11-24 — relecteur — T-013 : 🟢, fusion possible. Persistance prouvée (pas d'addInitScript au rechargement), sauvegarde avant animation (contre-épreuve CL-23 rouge), R-68 respectée, boîte pleine au lancement OK. Mineurs : M1 (test CL-23 : phase et historique), M2 (journal), M3 (spec R-68/CL-18 → menu, ADR-019).
- 2026-11-24 — Opus — T-013 : M2 et M3 faits ; M1 confié au codeur.
- 2026-11-24 — humain — Recette T-013 (sauvegarde) sur iPhone OK.
- 2026-11-24 — Opus — T-013 terminée et fusionnée dans main (non poussée).
- 2026-11-24 — Opus — v0.5.0 publiée (main poussée, tag v0.5.0).
- 2026-11-24 — Opus — T-014 planifiée (étape 3.2 : PWA ; `registerType: 'prompt'` selon R-104, le plan disait `autoUpdate` à tort ; icônes produites par Playwright).
- 2026-11-24 — codeur — T-014 : PWA (vite-plugin-pwa 2.0.0, `registerType: 'prompt'`, porte de mise à jour R-104, icônes produites par `npm run icones`, version dans Réglages, projet Playwright `pwa` en production) ; contre-épreuves a à c faites ; check OK (423 tests), e2e OK.
- 2026-11-24 — codeur — Reste : relecture de T-014, puis recette iPhone (installation sur l'écran d'accueil, mode avion) ; la mise à jour automatique ne pourra être vue qu'après la publication suivante.
- 2026-11-24 — relecteur — T-014 relue : 🟡 approuvée avec réserves (check, e2e complet 5 profils + `pwa` et captures OK ; à corriger : test du branchement R-104 dans le contrôleur, `reuseExistingServer: false` pour la preview ; mineurs : rechargement conditionnel au menu, §14-6 → §15-6, plan.md `autoUpdate`).
- 2026-11-24 — Opus — T-014 : C5 fait (plan.md), C6 reporté dans les contraintes (étape 3.3), C1 à C4 confiés au codeur.
- 2026-11-24 — codeur — T-014 : corrections de relecture C1 à C4 (porte R-104 testée dans le contrôleur via `__sb`, rechargement conditionné au menu, preview sans réutilisation, §15-6) ; check et e2e OK.
- 2026-11-24 — Opus — T-014 : C1 à C4 vérifiés (check OK, build sans `__sb`). Recette sur le site publié (HTTPS nécessaire).
- 2026-11-24 — Opus — T-014 fusionnée (e2e 432 passés) ; v0.6.0 publiée (main poussée, tag v0.6.0) pour la recette en HTTPS.
- 2026-11-24 — humain — Recette T-014 (v0.6.0) : icône OK, plein écran et sauvegarde séparée OK, version OK ; **hors ligne KO** : app relancée en mode avion → ne démarre pas (en ligne, niveau 2 conservé).
- 2026-11-24 — Opus — Diagnostic : site publié conforme (précache 9 fichiers, tous 200 sans redirection ; sw.js, portée et start_url `/sardinebagarre/`) ; le test e2e hors ligne passe sur WebKit bureau. Cause propre à l'iPhone, à préciser.
- 2026-11-24 — humain — Précisions : alerte iOS « Désactivez le mode avion… » puis « Safari ne peut pas ouvrir la page » ; même résultat après plusieurs lancements en ligne ; dans un onglet Safari en mode avion, le jeu se lance et se joue.
- 2026-11-24 — Opus — T-015 planifiée : diagnostic provisoire dans Réglages (page contrôlée ?, URL lancée, portée, réserve) pour comprendre l'écart app installée / onglet Safari.
- 2026-11-24 — codeur — T-015 : diagnostic hors ligne dans Réglages (diagnostic.ts, 4 tests unitaires, 1 e2e) ; check OK (429 tests), e2e 433 passés / 10 ignorés. Reste : publier pour lire le diagnostic sur l'iPhone.
- 2026-11-24 — codeur — T-015 : corrections de relecture D1 (lectures protégées, .catch), D2 (valeurs internes anglaises, libellés dans texts.fr.ts), D4 (erreur d'enregistrement du service worker, register-error.ts, 3e ligne du diagnostic) ; check et e2e pwa OK.
- 2026-11-24 — Opus — T-015 : D1, D2, D4 vérifiés (check OK, build sans `__sb`) ; prête à fusionner, publication v0.6.1 sur demande.
- 2026-11-24 — Opus — T-015 fusionnée (e2e 433 passés) ; v0.6.1 publiée (déploiement OK). Relevé du diagnostic à faire sur iPhone, dans Safari et dans l'app installée.
- 2026-11-24 — humain — Relevé v0.6.1 : l'icône de l'écran d'accueil avait été installée depuis le serveur de développement (http://192.168.1.14), d'où l'échec hors ligne de la recette T-014 (http : pas de service worker). App réinstallée depuis le site publié : « Hors ligne : actif · app » ; niveau 1 en ligne, mode avion, app fermée puis relancée, niveau 2 joué hors ligne. ✔
- 2026-11-24 — Opus — T-014 terminée (recette complète OK). T-015 terminée ; diagnostic provisoire conservé jusqu'au gel.
- 2026-11-24 — Opus — T-016 planifiée (étape 3.3, 1ʳᵉ moitié) : normalisation du code (espaces, tirets, accents et majuscules indifférents), format clair `SBDATA1` + index JSON + fichiers, tête recadrée en carré de 512 px par le script.
- 2026-11-24 — codeur — T-016 : pack-lib, pack.mjs, pack-de-test.mjs, pack.ts, prive-exemple, contrôle de la fixture écrits ; tests sans sharp verts (27). **Bloqué** : `npm i -D sharp` refusé par les permissions, donc ni fixture, ni tests d'image, ni `npm run check` complet. À autoriser par l'humain.
- 2026-11-24 — codeur — T-016 terminée : fixture (9 355 o), dérivation ~86 ms et déchiffrement ~0,5 ms en Node, check vert (444 tests).
- 2026-11-24 — relecteur — T-016 relue : 🟡 (aucune fuite ; à corriger : validation de `decodePack` et de `pack.json`, refus des codes publiés, code ASCII imposé, LISEZMOI pour non-développeur).
- 2026-11-24 — Opus — T-016 : E1 à E11 confiés au codeur ; décisions : prix obligatoire au-delà de la 12ᵉ photo, code ASCII imposé (tirets typographiques acceptés comme séparateurs).
- 2026-11-24 — codeur — T-016 : corrections de relecture E1 à E11 (decodePack validé, codes publiés refusés, forme ASCII du code, tirets typographiques, validation de pack.json, prix obligatoire dès la 13e photo, saisie masquée durcie, LISEZMOI réécrit) ; check vert (492 tests).
- 2026-11-24 — Opus — T-016 : E1 à E11 vérifiés (check 492 tests ; contre-épreuves sur les codes publics, la validation de `photos` et la forme ASCII du code) ; LISEZMOI complété.
- 2026-11-24 — Opus — T-016 fusionnée dans main (locale, non poussée). T-017 planifiée : code dans Réglages, tête de Sardine sur la carte, messages Sardine privés, rechargement au lancement, code oublié si le pack a changé.
- 2026-11-24 — codeur — T-017 : pack-store.ts, code secret dans Réglages, tête de Sardine en photo sur la carte révélée, messages Sardine du pack, rechargement au lancement (code faux oublié), ligne « pack » du diagnostic, Réglages défilables en paysage ; tests écrits avant le code. Reste : relecture ; vérifier `pack/pack.bin` dans le `sw.js` publié après la première publication du vrai pack (R-125).
- 2026-11-24 — relecteur — T-017 relue : 🟡 (e2e complet 493 OK ; à corriger : « Changer le code » avec un code faux réaffiche « Code accepté » ; mineurs : alignement, test de conservation des jetons, mesure du déchiffrement seul, zone aria-live).
- 2026-11-24 — codeur — T-017 : corrections de relecture F1 (Changer le code : message et pack conservés, drapeau changingCode), F2 (centré), F3 (progression conservée), F4 (durée = déchiffrement seul), F5 (zone aria-live gardée) ; check OK (505 tests), e2e 508 passés / 10 ignorés.
- 2026-11-24 — Opus — T-017 : F1 à F5 vérifiés (check 505 tests, build sans `__sb`, capture 11d centrée) ; prête à fusionner.
- 2026-11-24 — Opus — T-017 fusionnée (e2e 508 passés) ; v0.7.0 publiée (T-016 + T-017). Reste : l'humain fabrique le vrai pack ; Opus vérifie ensuite `pack/pack.bin` dans le `sw.js` publié (R-125, C6) ; mesure du déchiffrement sur iPhone (R-T8).
