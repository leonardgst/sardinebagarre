# T-014 — Rendre le jeu installable et jouable hors ligne (PWA)

| Champ | Valeur |
|---|---|
| Statut | planifiée |
| Étape du plan | 3.2 |
| Branche | `t-014-pwa` |
| Estimation | M (2 à 3 h) |
| Planifiée par | Opus — 2026-11-24 |
| Implémentée par | codeur (Sonnet) |

## Objectif
Le jeu s'installe sur l'écran d'accueil de l'iPhone (et dans le Dock du Mac) avec sa propre icône, s'ouvre en plein écran, fonctionne hors ligne après une première visite, et applique une nouvelle version seulement quand le joueur est sur le menu.

## Règles et décisions concernées
- `R-104` : service worker en `registerType: 'prompt'` (vite-plugin-pwa). Jamais de mise à jour pendant une partie. Rechargement automatique quand le joueur est sur le menu : tout de suite s'il y est, sinon dès qu'il y revient. **La spec fait foi** : le plan (étape 3.2) dit `autoUpdate`, c'est une erreur du plan.
- `R-129` : `noindex` et `robots.txt` (déjà en place depuis T-001, à conserver).
- `UI-04` : la version de l'app est affichée dans Réglages.
- Spec §14, critère 6 : manifeste valide, icônes 180 px (Apple) et 512 px.
- `ADR-001` (PWA), `ADR-002` (GitHub Pages, base `/sardinebagarre/`), `ADR-007` (dessins originaux seulement).
- CLAUDE.md : tous les chemins publics passent par `import.meta.env.BASE_URL` ; images seulement dans `public/icons/` et `src/ui/art/`.

## Décisions prises pour cette tâche
1. **Dépendance** : `vite-plugin-pwa` (dernière version compatible avec Vite 8). Si aucune version n'est compatible, **s'arrêter** et écrire la question dans la fiche.
2. **Manifeste** (généré par le plugin) : `name` et `short_name` « Sardinebagarre », `lang: 'fr'`, `display: 'standalone'`, `orientation: 'portrait'`, `theme_color: '#6b2a2d'` (`--fond`), `background_color: '#2c0f11'`, `start_url` et `scope` relatifs à la base (`/sardinebagarre/`), icônes 192, 512 et 512 `maskable`.
3. **Précache** : tout le jeu (`js`, `css`, `html`, `svg`, `png`, `webmanifest`) **et** `pack/pack.bin` quand il existera (motif `**/*.bin`), avec `maximumFileSizeToCacheInBytes` à 10 Mo. `navigateFallback` vers `index.html`.
4. **Icônes** : dessinées à partir de `src/ui/art/chien.svg` (tête de chien originale) sur un fond `--fond`. Un script `scripts/icones.mjs` produit les PNG avec **Playwright** (déjà installé, aucune dépendance nouvelle) : `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (tête dans la zone sûre centrale de 80 %) et `apple-touch-icon.png` (180 px, fond opaque). Les PNG produits sont commités. Script lancé par `npm run icones` (ajouter au `package.json`).
5. **Balises Apple** dans `index.html` : `apple-mobile-web-app-capable` (`yes`), `apple-mobile-web-app-status-bar-style` (`black-translucent` : les zones sûres sont déjà gérées par `#app`), `apple-mobile-web-app-title` (« Sardinebagarre »), `<link rel="apple-touch-icon">`, `<meta name="theme-color">`. Chemins relatifs ou via la base, jamais `/icons/...` absolu sans la base.
6. **Mise à jour (R-104)** : `src/ui/pwa.ts` enregistre le service worker avec `registerSW` (`virtual:pwa-register`), **en production seulement** (`import.meta.env.PROD`). La règle de décision est une petite fonction testable sans navigateur, par exemple `createUpdateGate({ apply })` avec `needRefresh()` et `menuShown()` : si une mise à jour attend et que le joueur est sur le menu, `apply()` (qui appelle `updateSW(true)`) ; sinon elle attend le prochain `menuShown()`. Le contrôleur gagne une option `onMenu?: () => void`, appelée à chaque affichage du menu (`showMenu`). Pas de bandeau ni de message de mise à jour : le rechargement est silencieux (la spec n'en demande pas).
7. **Version** : `__APP_VERSION__` injectée par `define` dans `vite.config.ts` depuis `package.json` (déclarée dans un `.d.ts`). L'écran provisoire Réglages (aujourd'hui « Bientôt ici. ») affiche en plus « Version {x.y.z} ». Texte dans `texts.fr.ts`.
8. **Tests hors ligne** : ils tournent sur la version de production (`vite build` puis `vite preview`). Ajouter dans `playwright.config.ts` un projet `pwa` (profil iPhone 15, WebKit) avec son propre serveur de preview sur un autre port (par exemple `E2E_PREVIEW_PORT`, défaut 4173), limité au fichier `tests/e2e/pwa.spec.ts`. Les autres projets ignorent ce fichier. **Si Playwright WebKit ne prend pas en charge les service workers**, utiliser Chromium pour ce seul projet (installer le navigateur dans la CI si besoin) et le noter dans le compte rendu. Ne pas affaiblir les tests pour autant.

## Périmètre
**Inclus** : plugin et manifeste, icônes et leur script, balises Apple, `pwa.ts` et la porte de mise à jour, option `onMenu`, version dans Réglages, projet Playwright `pwa`, adaptation de la CI si nécessaire (le workflow `ci.yml` doit lancer les tests `pwa`).

**Exclu** : écran Réglages complet (étape 4.2), pack chiffré (étape 3.3, mais le précache doit déjà l'accepter), HTTPS de développement sur iPhone, mise à jour des actions GitHub (Node 20).

## Fichiers
| Fichier | Action |
|---|---|
| `package.json`, `package-lock.json` | `vite-plugin-pwa`, script `icones` |
| `vite.config.ts` | plugin PWA, `define` de la version |
| `index.html` | balises Apple, `theme-color`, icône |
| `scripts/icones.mjs` | créer |
| `public/icons/*.png` | créer (produits par le script) |
| `src/ui/pwa.ts` | créer |
| `src/ui/main.ts`, `src/ui/controller.ts` | modifier (`onMenu`, enregistrement en production) |
| `src/ui/render/menu.ts`, `src/ui/texts.fr.ts` | modifier (version dans Réglages) |
| `src/vite-env.d.ts` (ou équivalent) | déclarer `__APP_VERSION__` et les types du module virtuel |
| `playwright.config.ts`, `.github/workflows/ci.yml` | projet `pwa` |
| `tests/ui/pwa.test.ts` (Vitest) | créer |
| `tests/e2e/pwa.spec.ts` | créer |

## Tests à écrire
**Vitest (`tests/ui/pwa.test.ts`, la porte de mise à jour seulement, sans navigateur)**
| Nom du test | Scénario | Attendu |
|---|---|---|
| `R-104 mise à jour sur le menu : appliquée tout de suite` | `menuShown()` puis `needRefresh()` | `apply` appelé 1 fois |
| `R-104 mise à jour pendant une partie : attend le menu` | `needRefresh()` sans menu, puis `gameStarted()` (ou équivalent : le joueur a quitté le menu), puis `menuShown()` | `apply` non appelé avant `menuShown()`, appelé 1 fois après |
| `R-104 pas de mise à jour en attente : rien` | `menuShown()` plusieurs fois | `apply` jamais appelé |
| `R-104 apply une seule fois` | `needRefresh()` sur le menu, puis `menuShown()` encore | `apply` appelé 1 fois |

(L'inclusion Vitest actuelle est `tests/**/*.test.ts` : `tests/ui/` est donc pris en compte. `pwa.ts` doit isoler l'import de `virtual:pwa-register` pour que la porte soit testable sous Node, par exemple dans un fichier séparé ou par import dynamique.)

**e2e (`tests/e2e/pwa.spec.ts`, projet `pwa`, version de production)**
| Nom du test | Scénario | Attendu |
|---|---|---|
| `§14-6 manifeste valide` | Lire le `<link rel="manifest">` et charger le fichier | `name`, `short_name`, `display: 'standalone'`, `start_url` et `scope` sous `/sardinebagarre/`, une icône 512 et une `maskable`, et chaque URL d'icône répond 200 avec `image/png` |
| `§14-6 icône Apple 180 px` | Charger le `apple-touch-icon` | réponse 200, image 180 × 180 |
| `R-104 le service worker est enregistré et contrôle la page` | Ouvrir, attendre `navigator.serviceWorker.ready`, recharger | `navigator.serviceWorker.controller` non nul |
| `ADR-001 hors ligne : le jeu se lance et se joue` | Après le test précédent, `context.setOffline(true)`, recharger | menu affiché, « Jouer » lance un plateau de 25 cartes, une carte se retourne |
| `R-100 hors ligne : la sauvegarde reste lue` | Finir une partie en ligne, passer hors ligne, recharger | même total et même niveau sur le menu |
| `UI-04 version affichée dans Réglages` | Menu › Réglages | texte « Version » suivi de la version de `package.json` |
| `R-129 non-indexation conservée` | `index.html` et `robots.txt` | `noindex` présent, `Disallow: /` |

## Critères d'acceptation
- [ ] `npm run check` passe (avec les tests Vitest de la porte).
- [ ] `npm run e2e` (avec `E2E_PORT=5199` si besoin) : tous les tests existants passent sur les 5 profils, et les tests `pwa` passent sur le projet `pwa`. Les tests hors ligne passent avec `--repeat-each 5`.
- [ ] Contre-épreuves faites puis annulées (`git diff src/ vite.config.ts` vide ensuite) et rapportées :
  - a. Sans `navigateFallback` ni précache de `index.html` (ou sans le plugin), le test hors ligne échoue.
  - b. Si la porte applique la mise à jour sans attendre le menu, le test Vitest « pendant une partie » échoue.
  - c. Si une icône est déclarée avec un chemin absolu `/icons/...` (sans la base), le test du manifeste échoue.
- [ ] `npm run build` passe ; `dist/` contient `manifest.webmanifest`, `sw.js` et les icônes ; `__sb` est absent de `dist/`. Taille de `dist/` signalée.
- [ ] En développement (`npm run dev`), **aucun** service worker n'est enregistré (vérifié par un test ou dans le compte rendu), pour ne pas gêner les tests existants.
- [ ] `npm run screens` : les captures existantes restent conformes ; ajouter `11-reglages.png` (5 profils).
- [ ] `node scripts/verifier-confidentialite.mjs` accepte les nouvelles images (elles sont dans `public/icons/`).
- [ ] La CI (`ci.yml`) lance le projet `pwa` ; si Chromium est nécessaire, il est installé dans la CI.

## Pièges connus
- **Base `/sardinebagarre/`** : `start_url`, `scope`, icônes et enregistrement du service worker doivent tous être sous la base. Un chemin absolu `/…` casse l'installation sur GitHub Pages.
- **Le service worker ne doit pas exister en dev** : sinon il met en cache des fichiers du serveur de dev et les 395 tests existants deviennent instables.
- **`setOffline`** coupe le réseau du contexte, mais la page doit avoir été contrôlée par le service worker **avant** (recharger une fois après `ready`).
- **iOS** : le manifeste ne suffit pas pour l'icône d'écran d'accueil, il faut `apple-touch-icon` (180 px, opaque, sans transparence).
- **`black-translucent`** : la barre d'état passe par-dessus le contenu ; `#app` utilise déjà `env(safe-area-inset-top)`, ne pas le casser.
- **Version** : lire `package.json` dans `vite.config.ts` avec `node:fs` et `node:path` (Windows), pas d'import JSON fragile.
- **Fins de ligne LF** ; les PNG sont binaires (vérifier `.gitattributes` si besoin).

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
_(rempli par le codeur à la fin : ce qui a été fait, commits, écarts)_

## Relecture
_(verdict du relecteur, avec la date)_
