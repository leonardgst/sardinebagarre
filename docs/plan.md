# 04 — Plan pas à pas

> ✅ Mis à jour le 10/11 avec tes réponses : **Sardinebagarre**, dépôt **public** + **GitHub Pages**, **pack chiffré** pour les photos, **album**, **Windows**, sauvegarde du niveau sans la partie en cours, iPhone d'abord.
>
> Étape D. Du 10 novembre au 24 décembre 2026, avec une **marge de sécurité d'une semaine** : gel des fonctionnalités le **dimanche 13/12**, version finale le **dimanche 20/12**.
> Légende des rôles : 🧑 **toi** · 🟣 **Opus** (session principale, effort high) · 🟢 **Sonnet** (sous-agent `codeur`, effort medium) · 🔍 **relecteur** (sous-agent Opus).
> Les temps indiqués sont **ton** temps (lecture, tests sur appareil, décisions), pas celui de Claude.

## Calendrier

| Phase | Dates | Résultat | Ton temps |
|---|---|---|---|
| 0 — Mise en place et apprentissage | mar. 10 → dim. 15/11 | Dépôt prêt, outils installés, première tâche faite avec le circuit Opus → Sonnet → relecteur | ~10 h |
| 1 — Logique du jeu | lun. 16 → dim. 22/11 | 100 % des règles codées et testées (album compris), sans interface | ~12 h |
| 2 — Interface jouable | lun. 23 → dim. 29/11 | Jeu complet jouable dans un navigateur (PC et iPhone en Wi-Fi). 📸 **Photo de la tête de Sardine fournie** | ~15 h |
| 3 — Sauvegarde, PWA, pack, publication | lun. 30/11 → dim. 6/12 | En ligne sur GitHub Pages, installé sur ton iPhone, pack chiffré fonctionnel. 📸 **Photos + messages fournis**. 1ᵉʳ test sur le Mac de ton ami | ~14 h |
| 4 — Finitions | lun. 7 → **dim. 13/12 (gel)** | Album, bienvenue, aboiement, animations, sons, aide. Version candidate | ~15 h |
| 5 — Stabilisation | lun. 14 → **dim. 20/12** | Corrections uniquement, vrai aboiement intégré, 2ᵉ test sur le Mac de ton ami. **v1.0.0** | ~10 h |
| 6 — Cadeau | lun. 21 → jeu. 24/12 | Carte cadeau imprimée (QR code + code secret), plan B prêt. Marge | ~3 h |

**Règle d'or du calendrier** : si une phase déborde de plus de 2 jours, on **retire** dans cet ordre : clavier Mac → message de suspense → sons autres que l'aboiement → animations secondaires. On ne déplace pas le gel.

**À réserver dès maintenant** : deux créneaux d'environ 1 h avec ton ami qui a un Mac : **samedi 5 ou dimanche 6/12** et **samedi 19/12**.

## Rythme type d'une tâche (à partir de la phase 1)
```
🟣  /planifier-tache 1.3          → docs/taches/T-004-….md   (tu relis la fiche : 5 min)
🟢  /implementer-tache T-004      → code + tests sur la branche t-004-…
🔍  « Utilise le sous-agent relecteur pour relire T-004 »   → verdict
🟣  corrections éventuelles : /implementer-tache T-004 (avec le verdict dans la fiche)
🧑  fusion dans main + push (ou demande-le à Opus : il demandera ton autorisation)
```
Avec un dépôt public et GitHub Pages, on travaille avec **deux sortes de branches seulement** : `main` (publiée automatiquement) et une branche par tâche `t-XXX-…`. Pas de `dev` : jusqu'au 20/12, le site publié sert de terrain de test (ta sœur n'en connaît pas l'adresse).

---

## Phase 0 — Mise en place (10 → 15/11)

### 0.1 Installer et vérifier les outils (Windows) — 🧑 — 1 h 30
- Ouvre **Windows Terminal** (ou PowerShell) et vérifie :
  ```powershell
  git --version
  node -v          # attendu : v22 ou plus. Sinon :
  winget install OpenJS.NodeJS.LTS     # puis fermer et rouvrir le terminal
  npm -v
  claude --version ; claude update
  ```
- **Confidentialité des commits** (dépôt public) : sur github.com › *Settings › Emails*, coche **« Keep my email addresses private »** et note l'adresse `12345678+pseudo@users.noreply.github.com`. Puis :
  ```powershell
  git config --global user.name "Ton pseudo"
  git config --global user.email "12345678+pseudo@users.noreply.github.com"
  git config --global core.autocrlf false
  ```
- Conseillé : **VS Code** (`winget install Microsoft.VisualStudioCode`) et **GitHub CLI** (`winget install GitHub.cli`, puis `gh auth login`).
- **Vérifier** : chaque commande affiche une version, sans erreur.
- 📚 **Apprendre** : la page *Quickstart* de Claude Code (code.claude.com/docs), en particulier la partie Windows.

### 0.2 Créer le dépôt GitHub public — 🧑 — 30 min
- Sur github.com › *New repository* › nom **`sardinebagarre`** › **Public** › sans README. Puis :
  ```powershell
  mkdir C:\dev ; cd C:\dev          # hors de OneDrive : la synchro OneDrive et node_modules ne font pas bon ménage
  git clone https://github.com/<ton-pseudo>/sardinebagarre.git
  cd sardinebagarre
  ```
- *Settings › Pages › Build and deployment › Source* : **GitHub Actions**.
- **Vérifier** : `git remote -v` affiche ton dépôt.
- 📚 **Apprendre** : Git, les bases (git-scm.com/book/fr/v2, chapitres 1 à 3) : commit, branche, fusion, push.

### 0.3 Déposer les fichiers de cadrage — 🧑 — 1 h
- Décompresse l'archive, puis copie le **contenu** de `repo-init/` à la racine du dépôt : `CLAUDE.md`, `.claude\`, `.github\`, `.gitignore`… doivent se retrouver **directement** dans `C:\dev\sardinebagarre\`, pas dans un sous-dossier `repo-init\`. Sinon, Claude Code ne charge rien (ni CLAUDE.md, ni skills, ni sous-agents, ni hooks), et `prive/` n'est pas ignoré par Git. Méthode sûre en PowerShell :
  ```powershell
  robocopy C:\chemin\vers\archive\repo-init C:\dev\sardinebagarre /E
  ```
- Dans l'Explorateur : *Affichage › Afficher › Éléments masqués*, pour voir `.claude/` et `.github/`. Copie les documents de cadrage dans `docs/` (correspondance dans `03-structure-du-depot.md` §3).
- Crée le dossier privé et vérifie qu'il est bien ignoré :
  ```powershell
  mkdir prive ; New-Item prive\LISEZMOI.txt -Value "Dossier privé : jamais commité"
  git status        # prive/ ne doit PAS apparaître
  git add -A ; git commit -m "docs: cadrage initial et configuration de Claude Code"
  git push -u origin main
  ```
- Ouvre Claude Code **à la racine** du dossier : `claude`. Vérifie (Claude Code ne charge ces fichiers qu'au démarrage : après toute copie, quitter puis relancer) :
  - `/skills` : les 7 skills du projet (`planifier-tache`, `implementer-tache`, `deployer`…) apparaissent en plus de ceux synchronisés depuis claude.ai ;
  - `/hooks` : « 2 with hooks » (PostToolUse et Stop) ;
  - `/permissions` : les règles `deny` sur `prive/` sont présentes ;
  - demande : « Quels sous-agents de projet sont disponibles, et que dit le CLAUDE.md du projet sur la confidentialité ? ». Réponse attendue : `codeur` et `relecteur`, plus les règles sur `prive/`.
  - Note : la commande `/agents` a été retirée des versions récentes de Claude Code. Les sous-agents se gèrent directement dans `.claude/agents/`. De même, `/memory` ouvre le fichier mémoire pour l'éditer ; ce n'est pas un test de chargement.
- **Prompt à Opus** :
  > Lis CLAUDE.md, docs/specification.md, docs/architecture.md et docs/questions-cadrage.md (section « Décisions retenues »). Découpe la section 8 de docs/architecture.md en fichiers docs/decisions/ADR-001…ADR-014 selon docs/decisions/_modele.md (pour les ADR remplacés, garde seulement la version à jour), et remplace la section 8 par un lien vers docs/decisions/. Puis liste-moi les incohérences que tu vois entre les documents, sans rien corriger d'autre.
- **Vérifier** : 14 fichiers ADR, aucune incohérence bloquante (sinon, on tranche ensemble).
- 📚 **Apprendre** : la mémoire (CLAUDE.md) et les réglages (settings, permissions) : pages *Memory* et *Settings* de la doc.

### 0.4 Réglages du modèle et premier test du circuit — 🧑 + 🟣 — 1 h
- Dans Claude Code : `/model` → Opus, puis `/effort high` (enregistré pour Opus). `/effort status` pour vérifier. Détails dans `05-guide-claude-code.md`.
- **Prompt (test du sous-agent)** :
  > Utilise le sous-agent codeur pour répondre à cette question sans rien modifier : quels fichiers existent dans .claude/ et quelles commandes npm sont prévues dans CLAUDE.md ?
- **Test du garde-fou** :
  > Lis le fichier prive/LISEZMOI.txt.
  → Claude doit être **bloqué** (règle `deny`). S'il y arrive, signale-le à Opus pour corriger `.claude/settings.json`.
- **Vérifier** : le transcript (Ctrl+O) montre l'appel au `codeur` ; voir `05` §4.5 pour confirmer qu'il tourne sur Sonnet.
- 📚 **Apprendre** : page *Subagents* de la doc.

### 0.5 Initialiser le projet (première vraie tâche) — 🟣 → 🟢 → 🔍 — ton temps : 2 h
- **Prompt** :
  > /planifier-tache Initialiser le projet : Vite + TypeScript strict (sans framework) avec base '/sardinebagarre/', Vitest, Biome (règle qui interdit à src/logic d'importer src/ui), Playwright (WebKit, profils iPhone SE, iPhone 15, Mac 1280x800), @vitejs/plugin-basic-ssl pour un script dev:https. Scripts npm : dev, dev:https, build, preview, test, check (tsc --noEmit + biome check + vitest run + node scripts/verifier-confidentialite.mjs), e2e, screens. Créer scripts/verifier-confidentialite.mjs (spec R-127). Une page index.html minimale « Sardinebagarre » en français avec meta viewport-fit=cover et noindex, un test Vitest trivial et un test Playwright qui vérifie le titre. Pas encore de PWA. Tout doit fonctionner sous Windows.
- Puis `/implementer-tache T-001`, puis : « Utilise le sous-agent relecteur pour relire T-001 ».
- **Vérifier (toi)** : `npm install`, `npm run check` vert, `npm run dev` affiche la page, `npx playwright install webkit` puis `npm run e2e` vert. Fusionne dans `main` et pousse : l'onglet *Actions* montre la CI verte **et** le déploiement ; `https://<ton-pseudo>.github.io/sardinebagarre/` affiche « Sardinebagarre ».
- **Test du garde-fou de confidentialité** : copie une image quelconque dans `src/`, lance `npm run check` → échec attendu. Supprime l'image.
- 📚 **Apprendre** : skills (relis `planifier-tache` et `implementer-tache`), hooks (page *Hooks*), GitHub Actions et Pages (onglet *Actions*).

### 0.6 Relire les décisions — 🧑 — 30 min
- Relis la section « Décisions retenues » de `docs/questions-cadrage.md`, en particulier les **2 questions encore ouvertes** (photos de Sardine seule privées ou non ; ordre de l'album). Réponds à Opus pour qu'il crée les ADR correspondants (`/consigner-decision`).

---

## Phase 1 — Logique du jeu (16 → 22/11)

> Toutes ces tâches suivent le rythme type. Chaque prompt est à passer à `/planifier-tache`.

### 1.1 Types, configurations, hasard — S — ton temps 45 min
> Étape 1.1 : créer src/logic/types.ts (CardValue = 1|2|3|'S'), configs.ts (les 80 entrées de la spec §3, avec variantes A/B) et rng.ts (mulberry32). Tests : chaque ligne de la table (comptes, gain max = 2^n2×3^n3, 25 − V − n2 − n3 cartes à 1), 10 entrées par niveau, rng déterministe pour une graine donnée.
- **Vérifier** : compare toi-même 3 lignes de `configs.ts` avec la spec.

### 1.2 Génération des plateaux — M — 1 h
> Étape 1.2 : generateBoard(entry, rng) selon R-20..R-24 (contraintes de multiplicateurs gratuits strictement inférieures, 1 000 tentatives, placement par mélange, ADR-010), indicateurs ligne/colonne (R-02). Tests de propriété : pour chaque entrée, 200 graines → comptes exacts, contraintes respectées, indicateurs = recalcul. Plus un test qui fabrique un plateau à la main (helper boardFromRows) et vérifie les indicateurs.
- **Vérifier** : `npm test -- board` ; durée des tests < 5 s.

### 1.3 Une partie : retourner, gagner, perdre, quitter, mémo — M — 1 h 30
> Étape 1.3 : src/logic/round.ts : flip, toggleMemo (marques S/1/2/3), quit selon R-30..R-42 et R-80..R-84. Tests : CL-01 à CL-12 (partie logique), R-32 à R-34 avec des plateaux construits à la main.
- **Vérifier** : lis les noms des tests : chaque CL de la liste y figure.

### 1.4 Niveaux — S — 45 min
> Étape 1.4 : src/logic/levels.ts : pickEntry(level, rng) (uniforme sur les 10 entrées) et nextLevel(history) selon le pseudo-code de la spec §6.2. Tests : les 17 vecteurs N1..N17, plus un test statistique de pickEntry (10 000 tirages, chaque entrée entre 8 % et 12 %).

### 1.5 Enchaînement, album, sauvegarde (logique) — M — 1 h 30
> Étape 1.5 : src/logic/game.ts (nouvelle partie, encaissement avec plafond 50 000 R-50..R-53, historique de 5, partie interrompue R-68, quitter la table R-67, stats R-72), src/logic/album.ts (R-110..R-116) et src/logic/save.ts (serialize/deserialize/validate/migrate R-100..R-102 : la partie en cours n'est PAS sauvegardée, CL-22). Tests : CL-13, CL-14, CL-17, CL-18 (logique), CL-22, achats d'album (ordre, solde insuffisant, débit exact), aller-retour serialize → deserialize identique.

### 1.6 Revue de la logique — 🔍 + 🧑 — 2 h
- **Prompt** :
  > Utilise le sous-agent relecteur pour faire une revue complète de src/logic et tests/logic contre docs/specification.md (toutes les règles R-, CL- et N-). Je veux la liste des règles non testées ou mal testées.
- Puis 🧑 : demande à Opus « écris un script scripts/partie-console.ts qui me fait jouer une partie dans le terminal (npx tsx) », et joue 3 parties pour sentir les règles.
- **Jalon** : toutes les règles ont au moins un test ; le relecteur rend ✅.

---

## Phase 2 — Interface jouable (23 → 29/11)

### 2.1 Direction artistique « classique » — 🟣 + 🧑 — 2 h
- **Prompt** (session Opus, sans tâche) :
  > Propose 3 variantes de style « classique » pour Sardinebagarre : même disposition générale que la Voltorbataille (grille 5×5, indicateurs colorés par ligne et par colonne, cartes ×1/×2/×3), mais palette, cartes et typographie originales, sans aucun élément Pokémon. Prévois l'emplacement de la tête de Sardine (photo ronde) sur la carte-bombe et dessine une tête de chien de secours en SVG. Pour chaque variante, crée une maquette statique docs/maquettes/variante-N.html (plateau à mi-partie, une Sardine révélée avec la tête de secours, taille iPhone). Ne touche pas à src/.
- 🧑 Ouvre les maquettes sur ton iPhone (`npx vite docs/maquettes --host`, voir 2.5 pour le pare-feu) et choisis. → `/consigner-decision Direction artistique`.

### 2.2 Affichage du plateau et du bandeau — M — 1 h
> Étape 2.2 : rendu statique du jeu (src/ui/render/board.ts, hud.ts, styles) selon UI-02, UI-10..UI-14 et la direction artistique ADR-0XX : plateau 5×5, indicateurs (somme + nombre de Sardines avec une petite tête de chien), bandeau niveau/gain/total, boutons Mémo/Quitter ; sur Mac, la même mise en page centrée (UI-11). Paramètres de développement ?seed=&debug=1. Créer tests/e2e/screens.spec.ts et le script npm screens.
- **Vérifier** : skill `controle-visuel` exécuté par le codeur ; toi, tu regardes les captures `02-plateau-neuf.png`.

### 2.3 Jouer : retourner, gagner, perdre — L, découpée en deux — 2 h
> Étape 2.3a : controller.ts + input.ts : retourner une carte (animation simple), gain affiché, victoire, défaite (Sardine révélée + aboiement synthétisé simple UI-50), révélation de fin (R-52), partie suivante avec le bon niveau et les messages R-66. Verrou d'entrée CL-19. Test e2e : partie gagnée et partie perdue avec graine fixe.

> Étape 2.3b : dialogue Quitter (R-40..R-42, CL-12), menu d'accueil UI-01 (Jouer/Album/Infos/Réglages, contenu minimal pour l'instant). Test e2e : abandon à 0 carte → niveau 1 (CL-01).

### 2.4 Mémo — M — 1 h
> Étape 2.4 : mode mémo R-80..R-84 (sélection de carte, 4 boutons de marque S/1/2/3, marques visibles dans les coins). Tests e2e : poser et retirer des marques, refus sur carte retournée, effacement au retournement.

### 2.5 Premier test sur ton iPhone — 🧑 — 1 h 30
- `npm run dev -- --host`. **Windows** affiche une alerte du pare-feu pour Node.js : coche **« Réseaux privés »** et autorise. (Ton Wi-Fi doit être déclaré comme réseau *privé* dans les paramètres Windows.)
- Sur l'iPhone (même Wi-Fi), ouvre dans Safari l'adresse `http://192.168.x.x:5173/sardinebagarre/` affichée dans le terminal. Joue 15 min et note ce qui gêne dans `docs/journal.md` › Questions ouvertes.
- **Prompt** : « Voici mes retours de test iPhone : … Planifie les corrections en une ou deux tâches. »
- 📸 **À fournir avant dim. 29/11** : la **photo de la tête de Sardine**, déposée dans `prive/sardine-tete.jpg`. Ne l'envoie pas à Claude : il n'en a pas besoin.
- **Jalon** : on peut jouer de bout en bout, sur PC comme sur iPhone.

---

## Phase 3 — Sauvegarde, PWA, pack, publication (30/11 → 6/12)

### 3.1 Sauvegarde — S — 45 min
> Étape 3.1 : src/ui/storage.ts + branchement du contrôleur : sauvegarde à chaque fin de partie, achat ou réglage, restauration au lancement (R-100..R-103). Tests e2e : recharger la page en pleine partie → nouvelle partie au même niveau, total inchangé (CL-18) ; une sauvegarde corrompue ne plante pas (CL-22).

### 3.2 PWA + test HTTPS — M — 1 h 30
> Étape 3.2 : vite-plugin-pwa (registerType autoUpdate, précache de tout le jeu y compris public/pack/pack.bin, scope et start_url sous /sardinebagarre/), manifeste (name et short_name « Sardinebagarre », display standalone, orientation portrait, couleurs), icônes dessinées (192, 512, maskable, apple-touch-icon 180) à partir d'un SVG du projet, balises Apple (apple-mobile-web-app-capable, status-bar-style, title), robots.txt Disallow et meta noindex. Afficher la version de l'app dans Réglages. Test e2e : le service worker est enregistré en mode preview et la page fonctionne hors ligne (context.setOffline).
- 🧑 Test HTTPS local : `npm run dev:https -- --host`, puis sur l'iPhone `https://192.168.x.x:5173/sardinebagarre/` › « Afficher les détails » › « consulter ce site web » (certificat de test). C'est la méthode pour tester le pack sur iPhone **sans publier**.
- 📚 **Apprendre** : MDN, « Progressive web apps » (developer.mozilla.org/fr/docs/Web/Progressive_web_apps) et la doc de vite-plugin-pwa (vite-pwa-org.netlify.app).

### 3.3 Pack personnel chiffré — M — ton temps 2 h
> Étape 3.3 : spec §13 (R-120..R-128). scripts/pack.mjs (lit prive/pack.json et les fichiers référencés, redimensionne avec sharp, chiffre AES-GCM avec une clé PBKDF2 dérivée d'un code saisi en masqué ou passé par la variable PACK_CODE, écrit public/pack/pack.bin avec l'en-tête SBPACK1), scripts/pack-de-test.mjs (faux pack avec des images générées et le code « test-test-test-test » → tests/fixtures/pack-test.bin), src/ui/pack.ts (déchiffrement Web Crypto, URL blob:, messages privés ajoutés aux listes UI-60), écran de saisie du code (UI-05, Réglages). Fournir un exemple prive-exemple/pack.json (sans photos) qui documente le format. Tests : chiffrement → déchiffrement aller-retour (Node), mauvais code refusé, e2e avec le pack de test. Ne jamais lire le dossier prive/.
- 🧑 Ensuite, toi seul :
  1. Choisis le **code secret** : 4 mots au hasard (pas le nom du chien). Note-le sur papier.
  2. Remplis `prive/pack.json` d'après `prive-exemple/pack.json` (pour l'instant : la tête de Sardine, et une ou deux photos de test).
  3. `npm run pack` → saisir le code → `public/pack/pack.bin` est créé.
  4. `git status` : seul `public/pack/pack.bin` doit apparaître (jamais `prive/`). Commit et push.
- **Vérifier** : en HTTPS local ou sur le site publié, saisis le code : la tête de Sardine apparaît sur les cartes-bombes.

### 3.4 Installation réelle + Mac de ton ami (créneau 1) — 🧑 — 2 h
- Sur ton iPhone, Safari › `https://<ton-pseudo>.github.io/sardinebagarre/` › Partager › **Sur l'écran d'accueil**. Saisis le code. Joue, ferme, rouvre : niveau et jetons conservés, partie en cours oubliée (normal). Mode avion › relancer : ça marche, photos comprises.
- **Chez ton ami** : Safari › Fichier › **Ajouter au Dock**, code, une partie, mode hors ligne (désactiver le Wi-Fi). Note tout problème. Pense à **supprimer l'app de son Dock** ensuite (clic droit › Options › Supprimer du Dock, puis la retirer du dossier Applications de l'utilisateur), sauf s'il veut jouer !
- **Test de durée** : laisse l'app installée sans l'ouvrir du 6 au 14/12, puis vérifie la sauvegarde (voir `06-risques`, R-T3).
- 📸 **À fournir avant dim. 6/12** : photos de l'album (une douzaine), ordre, légendes, prix (sinon, les prix par défaut de R-115), message de bienvenue, messages drôles publics (à donner à Claude) et privés (dans `prive/pack.json`). Puis `npm run pack` et commit.
- **Jalon** : app installée, hors ligne, avec ses vraies photos, sur ton iPhone et sur un Mac.

---

## Phase 4 — Finitions (7 → 13/12, gel le 13)

Ordre de priorité. On s'arrête où l'on en est le 13 au soir.

| # | Tâche (prompt pour `/planifier-tache`) | Priorité | Ton temps |
|---|---|---|---|
| 4.1 | Écran Album (UI-06, R-110..R-116) avec animation et son de déblocage, plein écran avec légende | P1 | 1 h |
| 4.2 | Bienvenue (UI-05 : code puis message du pack), Infos (3 pages courtes), Réglages UI-04, stats R-72, gestion du plafond R-53 | P1 | 1 h 30 |
| 4.3 | Aboiement soigné (UI-50) + messages en listes aléatoires (UI-60) avec mes messages publics : « … » | P1 | 45 min |
| 4.4 | Animations UI-30..UI-43 (dont la Sardine qui surgit, UI-31), mode « animations réduites », accélération au toucher (CL-20) | P1 | 1 h |
| 4.5 | Autres sons Web Audio (§10.5), bouton muet, déblocage audio au premier toucher | P2 | 45 min |
| 4.6 | Message de suspense R-90, passe d'accessibilité (contrastes, tailles, aria-label des cartes) | P2 | 45 min |
| 4.7 | Clavier sur Mac (UI-21) | P3 | 30 min |

### 4.8 Revue générale et version candidate — 🔍 + 🧑 — 3 h
- **Prompt** :
  > Utilise le sous-agent relecteur pour une revue complète du projet (npm run check, npm run e2e, contrôle visuel sur les 3 profils, vérification de confidentialité). Puis liste les problèmes par priorité.
- Corrections, puis `/deployer` → **v1.0.0-rc.1** le dimanche 13/12.
- 🧑 Joue 30 min sur iPhone.
- **Jalon : GEL.** À partir de maintenant, uniquement des corrections.

---

## Phase 5 — Stabilisation (14 → 20/12)

### 5.1 Chasse aux bugs — 🧑 + 🟣/🟢 — 1 h par jour
- Joue chaque jour 20 à 30 min sur iPhone. Pour chaque bug :
  > /planifier-tache Correctif : <description, étapes pour reproduire, capture>. Écris d'abord un test qui reproduit le bug.
- Fais tester par une autre personne si possible, sans explications : c'est la meilleure simulation de ta sœur. Donne-lui le code secret.

### 5.2 Vrai aboiement et matrice de tests — 🧑 — 3 h
- 🎙️ Si tu as l'enregistrement : coupe-le à 1 ou 2 s (par exemple avec l'appli *Clipchamp* de Windows ou *Audacity*), dépose-le dans `prive/aboiement.m4a`, référence-le dans `pack.json`, puis `npm run pack` et commit. Aucun changement de code nécessaire (UI-50).
- **Mac de ton ami (créneau 2, sam. 19/12)** + ton iPhone :

| Test | Ton iPhone | iPhone d'un proche (si possible) | Mac ami (Dock) |
|---|---|---|---|
| Installation depuis le QR code | | | — |
| Saisie du code secret, photos visibles | | | |
| Partie gagnée, perdue, abandonnée | | | |
| Mémo | | | |
| Album : débloquer une photo | | | |
| Fermer en pleine partie → niveau gardé, nouvelle partie | | | |
| Mode avion (photos comprises) | | | |
| Mise à jour (publier, puis ouvrir 2 fois, vérifier la version) | | | |
| Sauvegarde après 8 jours sans ouvrir (test 3.4) | | | — |
| Bouton silencieux et aboiement | | | — |

### 5.3 Version finale — 🧑 + 🟣 — 1 h
- `/deployer` → **v1.0.0** au plus tard le **dimanche 20/12**.
- Sur ton iPhone : **réinitialise ta progression de test** (Réglages › Effacer toute la progression) ou supprime et réinstalle l'app, pour vérifier le premier lancement « comme elle ».

---

## Phase 6 — Le cadeau (21 → 24/12)

### 6.1 Carte cadeau — 🟣/🟢 + 🧑 — 1 h 30
> /planifier-tache Créer docs/cadeau/carte-cadeau.html : une carte A6 imprimable (recto : titre Sardinebagarre, tête de chien dessinée, emplacement pour mon message écrit à la main ; verso : QR code vers https://<pseudo>.github.io/sardinebagarre/ généré en SVG avec le paquet qrcode, 5 étapes illustrées pour iPhone et 4 pour Mac, et un cadre « Code secret : ________ » laissé VIDE, que j'écrirai à la main). Style de la direction artistique.
- 🧑 Imprime-la, **écris le code secret à la main** (il ne doit figurer dans aucun fichier), et scanne le QR code pour vérifier qu'il mène au bon endroit.

### 6.2 Plan B — 🧑 — 30 min
- Si l'installation échoue chez elle : elle peut jouer directement dans Safari (la progression y est séparée de l'app installée).
- Si elle perd le code : tu le connais. Si le code fuit : nouveau code, `npm run pack`, publication. Elle saisira le nouveau code.
- Garde sur ton téléphone une **vidéo d'écran** de 30 s montrant l'installation.

### 6.3 Gel absolu — du 21 au 24/12
- Aucune publication sauf bug bloquant, testé d'abord en HTTPS local sur ton iPhone.
- Après Noël : les corrections et les nouvelles photos (nouveau `npm run pack`) arriveront chez elle automatiquement.

---

## Moments d'apprentissage (récapitulatif)

| Quand | Sujet | Ce que tu fais | À lire |
|---|---|---|---|
| 0.1 | Claude Code (bases) | Installer, `/help`, `/model`, `/effort` | code.claude.com/docs › Quickstart, Model configuration |
| 0.2 | Git et GitHub | Clone, commit, push, branches | git-scm.com/book/fr/v2 (ch. 1–3) |
| 0.3 | CLAUDE.md, réglages, permissions | `/skills`, `/permissions`, `/hooks` | docs › Memory, Settings |
| 0.4 | Sous-agents, règles `deny` | Premier appel au `codeur` (vérifié avec Ctrl+O), test du blocage de `prive/` | docs › Subagents |
| 0.5 | Skills, hooks, CI, GitHub Pages | `/planifier-tache`, `/implementer-tache`, voir le hook formater, voir le déploiement | docs › Skills, Hooks ; docs.github.com › Pages |
| 1.x | Tests (TDD), ADR | Lire les tests écrits par Sonnet, relire les verdicts | vitest.dev › Guide |
| 2.2 | Playwright, contrôle visuel | Regarder les captures produites | playwright.dev › Docs › Screenshots |
| 2.5 | Réseau local, pare-feu Windows | `--host`, adresse IP locale | — |
| 3.2 | PWA, service worker, HTTPS | Inspecter l'app installée | MDN › Progressive web apps |
| 3.3 | Chiffrement (notions) | Comprendre clé, sel, PBKDF2, AES-GCM à partir du code écrit | MDN › SubtleCrypto (`deriveKey`, `encrypt`) |
| 4.x | Créer ton propre skill | Ex. `/jouer-test` qui lance une partie en console | docs › Skills (section *Create your first skill*) |