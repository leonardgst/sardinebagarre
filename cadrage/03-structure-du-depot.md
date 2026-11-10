# 03 — Structure du dépôt

> Étape C. L'arborescence complète cible, avec le rôle de chaque élément, puis les principes qui aident Claude Code à bien travailler.
> ✅ Mis à jour le 10/11 : dépôt public `sardinebagarre`, GitHub Pages, pack chiffré, Windows.
> Les fichiers marqués ✍️ sont fournis **en entier** dans `repo-init/` (documents du projet). Les autres seront créés par Claude Code pendant le plan.

## 1. Arborescence

```
sardinebagarre/
├── CLAUDE.md ✍️                    Mémoire du projet, chargée automatiquement à chaque session Claude Code
├── README.md ✍️                    Présentation humaine du dépôt
├── CHANGELOG.md                    Versions publiées (rempli par le skill deployer)
├── .gitignore ✍️                    Ignore notamment prive/ (photos) et node_modules/
├── .gitattributes ✍️                Fins de ligne LF partout (indispensable sous Windows)
├── package.json                    Dépendances et scripts npm (dev, build, check, test, e2e, screens…)
├── package-lock.json               Versions exactes des dépendances (ne jamais éditer à la main)
├── tsconfig.json                   TypeScript strict
├── vite.config.ts                  Build (base '/sardinebagarre/') + plugin PWA + HTTPS local (dev:https)
├── vitest.config.ts                Tests unitaires (environnement node pour logic/)
├── playwright.config.ts            Tests de bout en bout : WebKit, profils iPhone SE, iPhone 15, Mac
├── biome.json                      Lint et formatage, règle « logic n'importe pas ui »
├── index.html                      Page unique : meta viewport, noindex, liens du manifeste et des icônes Apple
│
├── prive/                          ── ⚠️ JAMAIS COMMITÉ (ignoré par Git, illisible pour Claude) — uniquement sur ton PC
│   ├── pack.json                   Message de bienvenue, photos (ordre, prix, légendes), messages privés, cadrage de la tête
│   ├── sardine-tete.jpg            Tête de Sardine pour la carte-bombe
│   ├── aboiement.m4a               (plus tard) vrai aboiement
│   └── photos/*.jpg                Photos de l'album
│
├── scripts/
│   ├── pack.mjs                    npm run pack : prive/ → public/pack/pack.bin (demande le code secret)
│   ├── pack-de-test.mjs            Génère un faux pack (images colorées, code connu) pour les tests automatiques
│   └── verifier-confidentialite.mjs  CI : aucune image/son/fichier privé en clair dans Git
│
├── .claude/                        ── Configuration de Claude Code (versionnée, partagée)
│   ├── settings.json ✍️            Modèle par défaut, permissions (dont : interdit de lire prive/), hooks
│   ├── settings.local.json         (non versionné) tes réglages personnels
│   ├── hooks/
│   │   ├── format-fichier.mjs ✍️   Après chaque Edit/Write : formatage Biome du fichier
│   │   └── verifier-fin.mjs ✍️     Quand Claude veut s'arrêter : npm run check si le code a changé
│   ├── agents/
│   │   ├── codeur.md ✍️            Sous-agent Sonnet (effort medium) qui écrit le code
│   │   └── relecteur.md ✍️         Sous-agent Opus (effort high), lecture seule, rend un verdict
│   └── skills/
│       ├── regles-voltorbataille/SKILL.md ✍️  Aide-mémoire des règles (chargé par les deux agents)
│       ├── planifier-tache/SKILL.md ✍️        /planifier-tache → fiche docs/taches/T-XXX
│       ├── implementer-tache/SKILL.md ✍️      /implementer-tache T-XXX → délègue au codeur (Sonnet)
│       ├── ajouter-fonctionnalite/SKILL.md ✍️ Méthode TDD (tests d'abord)
│       ├── controle-visuel/SKILL.md ✍️        Captures Playwright + checklist visuelle
│       ├── deployer/SKILL.md ✍️               /deployer : vérifications, version, publication
│       └── consigner-decision/SKILL.md ✍️     Création d'ADR
│
├── .github/workflows/
│   ├── ci.yml ✍️                   Vérifications à chaque push (types, lint, tests, confidentialité, build, e2e)
│   └── deploy.yml ✍️               Publication GitHub Pages à chaque push sur main (si les vérifications passent)
│
├── docs/                           ── Contexte durable pour humains et Claude
│   ├── specification.md            = cadrage/01 (règles, référence unique)
│   ├── architecture.md             = cadrage/02 (sans les ADR, qui vont dans decisions/)
│   ├── plan.md                     = cadrage/04
│   ├── guide-claude-code.md        = cadrage/05
│   ├── risques.md                  = cadrage/06
│   ├── questions-cadrage.md        = cadrage/00 (avec tes réponses)
│   ├── journal.md ✍️               Journal de bord : index des tâches, questions ouvertes, historique
│   ├── decisions/
│   │   ├── _modele.md ✍️
│   │   └── ADR-001-pwa.md … ADR-010-placement.md
│   ├── taches/
│   │   ├── _modele.md ✍️
│   │   └── T-001-….md …
│   └── cadeau/
│       ├── carte-cadeau.html       Carte imprimable : QR code + 4 étapes + message
│       └── qr.svg
│
├── src/
│   ├── logic/                      ── PUR, sans navigateur (≈ 600 lignes)
│   │   ├── types.ts                Types : CardValue, Board, RoundState, GameState, Outcome, History
│   │   ├── configs.ts              Les 80 entrées de configuration (spec §3)
│   │   ├── rng.ts                  mulberry32(seed)
│   │   ├── board.ts                generateBoard(entry, rng), indicateurs, multiplicateurs gratuits
│   │   ├── round.ts                flip, toggleMemo, quit, état de la partie
│   │   ├── levels.ts               pickEntry(level, rng), nextLevel(history)
│   │   ├── game.ts                 enchaînement : nouvelle partie, encaissement, plafond, stats, partie interrompue
│   │   ├── album.ts                achat et déblocage des photos (R-110..R-116)
│   │   ├── suspense.ts             règle R-90 (message de suspense)
│   │   └── save.ts                 sérialisation, validation, migration de la sauvegarde
│   └── ui/                         ── Navigateur
│       ├── main.ts                 Point d'entrée
│       ├── controller.ts           Boucle : entrée → logique → animation → rendu → sauvegarde
│       ├── render/{board,hud,dialogs,menu,settings,album,welcome}.ts
│       ├── input.ts                Tactile, souris, clavier, verrou pendant les animations
│       ├── anim.ts                 Séquenceur d'animations, accélération au toucher
│       ├── audio.ts                Sons synthétisés (Web Audio)
│       ├── storage.ts              Seul accès à localStorage
│       ├── pack.ts                 Déchiffrement du pack (Web Crypto) → photos, tête, aboiement, messages privés
│       ├── texts.fr.ts             Tous les textes
│       ├── art/                    SVG originaux (tête de chien de secours, icônes)
│       └── styles/{base,board,hud,dialogs}.css
│
├── public/
│   ├── icons/                      icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon-180.png (dessins, pas de photo)
│   ├── pack/pack.bin               Pack personnel CHIFFRÉ (seul contenu personnel commité)
│   └── robots.txt                  Disallow: /
│
└── tests/
    ├── helpers.ts                  boardFromRows(), fabriques d'états
    ├── logic/                      Vitest : configs, board (propriétés), round, levels, game, save, suspense
    ├── fixtures/pack-test.bin      Faux pack chiffré (code « test-test-test-test »)
    └── e2e/                        Playwright : parcours, memo, sauvegarde, album, pack, screens
```

## 2. Comment le dépôt aide Claude Code à bien travailler

### 2.1 Où est le contexte (et pourquoi à cet endroit)
| Besoin | Où | Chargé comment |
|---|---|---|
| Règles permanentes du projet (pile, commandes, architecture, conventions) | `CLAUDE.md` | **Automatiquement**, à chaque session et pour chaque sous-agent. Il reste court (< 100 lignes) parce qu'il coûte du contexte à chaque fois. |
| Règles du jeu détaillées | `docs/specification.md` | À la demande (cité par les tâches et les skills) |
| Résumé des règles critiques | skill `regles-voltorbataille` | **Préchargé** dans `codeur` et `relecteur` (champ `skills`) ; chargé automatiquement par Claude quand il touche à la logique |
| Méthodes de travail répétables | `.claude/skills/*` | Description toujours visible ; contenu chargé seulement quand c'est utile |
| État d'avancement entre sessions | `docs/journal.md` | Lu en début de session (consigne dans CLAUDE.md) |
| Pourquoi on a choisi X | `docs/decisions/ADR-*` | À la demande |

Principe : **CLAUDE.md dit « où » et « comment », la spec dit « quoi », les skills disent « avec quelle méthode ».** Rien n'est dupliqué, à une exception assumée : le skill de règles résume la spec, parce que ces règles sont celles que les modèles se trompent le plus souvent à reconstituer de mémoire.

### 2.2 Comment les tâches sont décrites
- Une fiche par tâche dans `docs/taches/`, au format `_modele.md` : objectif, règles citées, périmètre **et exclusions**, fichiers, **tests nommés avec valeurs attendues**, critères d'acceptation vérifiables par commande.
- Créée par Opus (`/planifier-tache`), exécutée par Sonnet (`/implementer-tache`), relue par Opus (sous-agent `relecteur`). La fiche garde tout : questions, compte rendu, verdict.

### 2.3 Comment Claude vérifie son propre travail
| Niveau | Outil | Déclenchement |
|---|---|---|
| Format | Biome (format) | **Hook** après chaque modification de fichier |
| Types + lint + tests unitaires | `npm run check` | **Hook** quand Claude veut terminer (bloque si rouge) ; CI à chaque push |
| Comportement réel dans Safari (moteur) | Playwright WebKit (`npm run e2e`) | Skill `ajouter-fonctionnalite` / `deployer` ; CI |
| Visuel | Captures + checklist (`npm run screens`, puis Read sur les images) | Skill `controle-visuel` |
| Fidélité aux règles | Sous-agent `relecteur` (Opus) qui recalcule des cas à la main | Après chaque tâche |
| Confidentialité | `scripts/verifier-confidentialite.mjs` + interdiction de lire `prive/` + relecteur | CI à chaque push |
| Réalité du terrain | Toi, sur ton iPhone (et le Mac de ton ami deux fois) | Fin de chaque phase |

### 2.4 Historique des décisions
- **ADR** dans `docs/decisions/` : un fichier par décision, jamais réécrit (on le remplace par un nouveau).
- **Journal** pour le quotidien, **Git** pour le détail (messages de commit qui citent les règles et les tâches).
- **CHANGELOG** pour ce qui a été livré.

## 3. Mise en place des fichiers de cadrage dans le dépôt
À l'étape 0.3 du plan :
1. Copier le contenu de `repo-init/` à la racine du dépôt (en conservant les chemins, `.claude/` et `.github/` compris). Le plus simple : décompresser l'archive `sardinebagarre-cadrage.zip`, puis copier le **contenu** de son dossier `repo-init/` à la racine du dépôt.
2. Copier `cadrage/01` → `docs/specification.md`, `02` → `docs/architecture.md`, `04` → `docs/plan.md`, `05` → `docs/guide-claude-code.md`, `06` → `docs/risques.md`, `00` → `docs/questions-cadrage.md`.
3. Demander à Claude : « découpe les ADR de docs/architecture.md §8 en fichiers docs/decisions/ADR-00X-*.md selon le modèle ».
