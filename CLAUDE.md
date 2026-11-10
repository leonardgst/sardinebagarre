# CLAUDE.md — Sardinebagarre

Recréation fidèle des **règles** du mini-jeu Voltorbataille (Pokémon HeartGold/SoulSilver), avec un thème personnel : la carte-bombe est **Sardine**, la chienne de ma sœur (lettre « S »). **Application web installable (PWA)**, jouable hors ligne, d'abord sur iPhone (Safari, écran d'accueil), puis sur Mac (Safari, Ajouter au Dock). Cadeau de Noël : **gel des fonctionnalités le 13/12/2026, v1.0.0 le 20/12, livraison le 24/12**.

## ⚠️ Dépôt PUBLIC : règles de confidentialité (non négociables)
- Ne **jamais** lire, lister, copier ni commiter le contenu de `prive/` (photos de famille, tête de Sardine, aboiement, messages privés). La lecture est interdite par les permissions ; ne cherche pas à la contourner (pas de `cat`, `type`, `Get-Content`, `ls` ou script sur `prive/`).
- Le seul contenu personnel commité est `public/pack/pack.bin`, **chiffré**, produit par l'humain avec `npm run pack`.
- Aucune image ni aucun son ailleurs que dans `public/icons/` et `src/ui/art/` (dessins originaux). `npm run check` le vérifie (`scripts/verifier-confidentialite.mjs`).
- Ne jamais demander, écrire ni deviner le **code secret** du pack. Les tests utilisent le pack de test (`tests/fixtures/pack-test.bin`, code `test-test-test-test`).
- Avant chaque commit : `git status` et vérification qu'aucun fichier inattendu n'est ajouté.

## Où est le contexte
- **Règles du jeu (référence unique)** : `docs/specification.md`. Identifiants `R-xx`, `CL-xx`, `UI-xx`. Ne jamais inventer une règle : si elle manque, l'écrire dans `docs/journal.md` (section « Questions ouvertes ») et s'arrêter.
- Décisions : `docs/questions-cadrage.md` (section « Décisions retenues ») et `docs/decisions/ADR-*.md`. Architecture : `docs/architecture.md`.
- Tâches : `docs/taches/T-XXX-*.md` (modèle : `docs/taches/_modele.md`). Plan : `docs/plan.md`.
- Journal de bord : `docs/journal.md`. **À lire en début de session.**
- Skill `regles-voltorbataille` : résumé des règles critiques. À charger avant de toucher à `src/logic/`.

## Pile
TypeScript strict · Vite (`base: '/sardinebagarre/'`) · DOM natif (sans framework) · vite-plugin-pwa · Web Crypto (pack) · Vitest · Playwright (WebKit) · Biome · Node LTS. Publication : GitHub Pages via GitHub Actions à chaque push sur `main`.

## Commandes
- `npm run dev` : serveur local (`npm run dev -- --host` pour l'iPhone en Wi-Fi) · `npm run dev:https -- --host` : en HTTPS (requis pour tester le pack et le service worker sur iPhone)
- `npm run check` : **typecheck + lint + tests unitaires + contrôle de confidentialité**. Doit passer avant tout commit.
- `npm test` : Vitest seul · `npm run e2e` : Playwright · `npm run screens` : captures dans `test-results/screens/`
- `npm run build` puis `npm run preview` : version de production locale
- `npm run pack` : **réservé à l'humain** (demande le code secret)

## Architecture (règles strictes)
- `src/logic/` est **pur** : pas de `window`, `document`, `localStorage`, `crypto`, `Math.random`, `Date.now`. Le hasard est injecté (`rng: () => number`).
- `src/logic/` n'importe jamais `src/ui/`. Seul `src/ui/storage.ts` touche `localStorage` ; seul `src/ui/pack.ts` touche Web Crypto. Tous les textes sont dans `src/ui/texts.fr.ts`.
- Fonctions d'état pures : `(état, action) → nouvel état`, sans mutation (objets en lecture seule).
- Les 80 configurations vivent uniquement dans `src/logic/configs.ts` et doivent correspondre à la spec §3.
- La partie en cours n'est **pas** sauvegardée (R-68) : seulement jetons, niveau, historique, album, réglages, stats, code.
- Tous les chemins publics passent par `import.meta.env.BASE_URL` (manifeste, service worker, icônes, pack) : le site est servi sous `/sardinebagarre/`.

## Conventions
- Identifiants de code en **anglais** ; commentaires, docs, messages de commit et textes UI en **français**.
- Commits : `type(portée): résumé` (types : feat, fix, test, refactor, docs, chore, style). Exemple : `feat(logic): calcul du niveau suivant (R-62..R-66)`.
- Chaque test cite la règle testée dans son nom : `it('R-63 défaite au niveau 8 après 9 cartes → 7')`.
- Branches : `main` = publiée automatiquement ; `t-XXX-slug` = une tâche, créée depuis `main`.
- Aucune ressource (image, son, police, texte) extraite d'un jeu Pokémon. Aucun nom Pokémon dans l'interface.
- Développement sous **Windows** : scripts en Node (pas de bash), chemins avec `node:path`, fins de ligne LF.

## Façon de travailler
- Session principale = **Opus** (réfléchir, planifier, relire). Le code est écrit par le sous-agent **`codeur` (Sonnet)** via `/implementer-tache T-XXX`. La relecture est faite par le sous-agent **`relecteur`**. Ne jamais remplacer le modèle ni l'effort définis dans ces sous-agents lors de leur appel.
- Développement piloté par les tests : test rouge → code minimal → test vert → nettoyage (skill `ajouter-fonctionnalite`).
- Toute modification d'interface est vérifiée par captures (skill `controle-visuel`).
- Toute décision structurante → ADR (skill `consigner-decision`).
- Ne jamais pousser sur `main` ni publier sans que l'humain le demande (skill `deployer`).
- En cas de doute sur une règle : relire `docs/specification.md` §0 (hiérarchie des sources) puis demander.

## Pièges connus
- iOS Safari : son seulement après un geste de l'utilisateur ; pas de `navigator.vibrate` ; `env(safe-area-inset-*)` ; `touch-action: manipulation` ; Web Crypto et service worker exigent HTTPS (sauf `localhost`).
- Un « 1 » compte dans les cartes retournées (descente de niveau, niveau 8). Une victoire au niveau 7 ne mène **pas** au niveau 8.
- Bloquer les entrées pendant l'animation de retournement (CL-19).
- GitHub Pages sert le site sous `/sardinebagarre/` : un chemin absolu `/…` casse l'installation.
