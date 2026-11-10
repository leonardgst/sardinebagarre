# T-001 — Initialiser le projet

| Champ | Valeur |
|---|---|
| Statut | approuvée (à fusionner) |
| Étape du plan | 0.5 |
| Branche | `t-001-initialiser-projet` |
| Estimation | M (1–3 h) |
| Planifiée par | Opus — 2026-11-10 |
| Implémentée par | codeur (Sonnet) |

## Objectif
`npm install` puis `npm run check`, `npm run build`, `npm run e2e` et `npm run screens` passent sous Windows et en CI Linux, et `npm run dev` affiche une page « Sardinebagarre » servie sous `/sardinebagarre/`.

## Règles concernées
- `R-127` — `scripts/verifier-confidentialite.mjs` échoue si une image ou un son est suivi hors de `public/icons/` et `src/ui/art/`, si un fichier de `prive/` est suivi, ou si `public/pack/pack.bin` ne commence pas par `SBPACK1`.
- `R-128` — Web Crypto exige HTTPS (sauf `localhost`) : d'où le script `dev:https`.
- `R-129` — `index.html` contient `<meta name="robots" content="noindex">` ; `public/robots.txt` contient `User-agent: *` / `Disallow: /`.
- `UI-10` — `viewport-fit=cover` (zones sûres).
- Architecture (CLAUDE.md, ADR-005, ADR-006) — `src/logic/` n'importe jamais `src/ui/` ; vérifié par Biome.
- ADR-014 — tout fonctionne sous Windows : scripts en Node, pas de bash.

## Périmètre
**Inclus**
- `package.json` (`"type": "module"`, `"private": true`, `"engines": { "node": ">=22" }`), `package-lock.json` commité (la CI fait `npm ci`).
- Dépendances de développement : `vite`, `typescript`, `vitest`, `@biomejs/biome`, `@playwright/test`, `@vitejs/plugin-basic-ssl`, `@types/node`.
- Scripts npm, **exactement** :
  | Script | Commande |
  |---|---|
  | `dev` | `vite` |
  | `dev:https` | `vite --mode https` |
  | `build` | `tsc --noEmit && vite build` |
  | `preview` | `vite preview` |
  | `test` | `vitest run` |
  | `check` | `tsc --noEmit && biome check && vitest run && node scripts/verifier-confidentialite.mjs` |
  | `e2e` | `playwright test --grep-invert @screens` |
  | `screens` | `playwright test --grep @screens` |
- `vite.config.ts` : `base: '/sardinebagarre/'` ; plugin `basicSsl()` **seulement** si `mode === 'https'` ; bloc `test` de Vitest (environnement `node`, `include: ['tests/**/*.test.ts']`).
- `tsconfig.json` strict (`strict`, `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `isolatedModules`, `moduleResolution: "bundler"`, `target`/`lib` ES2022 + DOM, `allowJs: true` pour typer l'import du script `.mjs` dans les tests, `noEmit`), qui couvre `src`, `tests`, `scripts` et les fichiers de configuration.
- `biome.json` : formatage + lint recommandés, limités à `src/**`, `tests/**`, `scripts/**` et aux `*.config.ts` (pas `docs/`, `.claude/`, `.github/`, `prive/`) ; **surcharge pour `src/logic/**`** :
  - `noRestrictedImports` : interdit tout import de `src/ui` (chemins relatifs `../ui`, `../ui/…`, `../../ui/…`, etc.) ;
  - `noRestrictedGlobals` : interdit `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, `crypto`.
- `playwright.config.ts` : `testDir: 'tests/e2e'`, `outputDir: 'test-results/playwright'`, 3 projets WebKit : `iphone-se` (`devices['iPhone SE']`), `iphone-15` (`devices['iPhone 15']`), `mac` (`browserName: 'webkit'`, viewport 1280 × 800) ; `baseURL: 'http://localhost:5173/sardinebagarre/'` ; `webServer` = `npm run dev -- --port 5173 --strictPort`, `reuseExistingServer: !process.env.CI`.
- `index.html` : `lang="fr"`, `charset utf-8`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<meta name="robots" content="noindex">`, `<title>Sardinebagarre</title>`, `<h1>Sardinebagarre</h1>`, `<script type="module" src="/src/ui/main.ts">` (Vite réécrit ce chemin avec la base).
- `public/robots.txt` (R-129).
- `src/ui/main.ts` minimal (commentaire « point d'entrée, rempli à l'étape 2.2 » ; aucun texte d'interface).
- `scripts/verifier-confidentialite.mjs` (voir « Conception du script »).
- Tests : voir « Tests à écrire ».

**Exclu** (ne pas faire dans cette tâche)
- PWA : `vite-plugin-pwa`, manifeste, service worker, icônes.
- Profils `iphone-15-pro-max` et `iphone-15-paysage` (ajoutés à l'étape 2.2 avec les vraies captures).
- `src/logic/*` (aucun fichier de logique), `texts.fr.ts`, styles, rendu.
- `scripts/pack.mjs`, `tests/fixtures/pack-test.bin`, `scripts/pack-de-test.mjs`.
- Toute modification de `.claude/`, `.github/`, `docs/specification.md`, `.gitignore`, `.gitattributes`.

## Conception du script `scripts/verifier-confidentialite.mjs`
- **Liste des fichiers** : `git ls-files -z --cached --others --exclude-standard` (suivis **et** nouveaux non ignorés, c'est-à-dire tout ce qui pourrait être commité). Inclure les non-suivis va un peu au-delà de R-127, volontairement : le plan 0.5 demande qu'une image copiée dans `src/` fasse échouer `npm run check` **avant** le commit. `prive/` étant ignoré, il n'apparaît que s'il a été forcé dans Git.
- **Ne lit jamais `prive/`** : seuls les noms renvoyés par Git sont examinés. Les seuls fichiers lus sont l'en-tête (7 octets) de `public/pack/pack.bin` et le texte des `.svg` situés **hors** de `prive/` (un `.svg` de `prive/` est signalé comme fichier de `prive/` sans être ouvert).
- **Fonction pure exportée** : `findViolations(paths, packHeader, readText)` → `string[]` (messages en français, un par problème, qui citent le chemin).
  - `paths` : chemins Git (séparateur `/`).
  - `packHeader` : `Uint8Array` des premiers octets de `public/pack/pack.bin`, ou `null` si le fichier n'existe pas sur le disque.
  - `readText` : `(path) => string`, appelée **uniquement** pour les `.svg` hors de `prive/` (en exécution réelle : `readFileSync(path, 'utf8')` ; dans les tests : une table de contenus fictifs).
- **Extensions bloquées hors des dossiers autorisés** (comparaison en minuscules) — images : `png jpg jpeg gif webp avif heic heif bmp tif tiff ico` ; sons : `mp3 m4a aac wav ogg oga opus flac caf` ; vidéos (photos animées d'iPhone) : `mov mp4 m4v webm`.
- **Dossiers autorisés** : préfixes exacts `public/icons/` et `src/ui/art/` (avec la barre finale : `public/icons-bis/` est refusé).
- **SVG** : acceptés **partout** (dossiers autorisés compris), **sauf** si leur texte contient `data:image/` ou une balise `<image` (recherche insensible à la casse). Message clair, par exemple : « src/ui/logo.svg : SVG contenant une image intégrée (data:image/ ou <image) — interdit, une photo pourrait s'y cacher ». Le contrôle s'applique aussi dans `public/icons/` et `src/ui/art/`, qui ne doivent contenir que des dessins vectoriels originaux.
- **`prive/`** : tout chemin qui commence par `prive/` est une violation, quelle que soit son extension.
- **Pack** : `packHeader === null` → pas de vérification (le pack n'existe pas encore, R-126) ; sinon violation si les 7 premiers octets ne valent pas l'ASCII `SBPACK1` (fichier trop court compris).
- **Exécution directe** : garde `import.meta.url === pathToFileURL(process.argv[1]).href` (fonctionne sous Windows). Affiche « Contrôle de confidentialité : OK » et sort avec 0, ou liste les violations sur `stderr` et sort avec 1. Si `git` échoue, sortir avec 1 (ne jamais conclure « OK » sans liste).

## Fichiers
| Fichier | Action |
|---|---|
| `package.json`, `package-lock.json` | créer |
| `tsconfig.json` | créer |
| `vite.config.ts` | créer |
| `biome.json` | créer |
| `playwright.config.ts` | créer |
| `index.html` | créer |
| `public/robots.txt` | créer |
| `src/ui/main.ts` | créer |
| `scripts/verifier-confidentialite.mjs` | créer |
| `tests/scripts/verifier-confidentialite.test.ts` | créer |
| `tests/index-html.test.ts` | créer |
| `tests/e2e/accueil.spec.ts` | créer |
| `tests/e2e/screens.spec.ts` | créer (provisoire, refait à l'étape 2.2) |
| `docs/taches/T-001-initialiser-projet.md` | compléter (Compte rendu) |

## Tests à écrire
**Vitest — `tests/scripts/verifier-confidentialite.test.ts`** (appelle `findViolations`)
Sauf mention contraire, `readText` renvoie `<svg><circle r="5"/></svg>`.
| Nom du test | Entrée (`paths`, `packHeader`, contenu SVG) | Attendu |
|---|---|---|
| `R-127 fichiers autorisés → aucune violation` | `['src/ui/main.ts', 'public/icons/icone-512.png', 'src/ui/art/chien.svg', 'index.html']`, `null` | `[]` |
| `R-127 SVG vectoriel accepté hors des dossiers autorisés` | `['src/ui/logo.svg']`, `null` | `[]` |
| `R-127 SVG contenant data:image/ → violation` | `['src/ui/logo.svg']`, `null`, `<svg><use href="data:image/png;base64,AAAA"/></svg>` | 1 message contenant `src/ui/logo.svg` et `data:image/` |
| `R-127 SVG contenant une balise <image → violation` | `['docs/schema.svg']`, `null`, `<svg><IMAGE href="photo.jpg"/></svg>` | 1 message contenant `docs/schema.svg` et `<image` |
| `R-127 SVG avec image intégrée refusé même dans src/ui/art/` | `['src/ui/art/chien.svg']`, `null`, `<svg><image href="data:image/jpeg;base64,AAAA"/></svg>` | 1 message (pas 2) |
| `R-127 SVG de prive/ signalé sans être lu` | `['prive/tete.svg']`, `null`, `readText` qui **lève une erreur** si elle est appelée | 1 message contenant `prive/tete.svg`, aucune erreur levée |
| `R-127 image hors des dossiers autorisés → violation` | `['src/photo.jpg']`, `null` | 1 message contenant `src/photo.jpg` |
| `R-127 extension en majuscules détectée` | `['docs/IMG_0001.HEIC']`, `null` | 1 message |
| `R-127 son hors des dossiers autorisés → violation` | `['src/ui/aboiement.m4a']`, `null` | 1 message |
| `R-127 dossier voisin public/icons-bis/ refusé` | `['public/icons-bis/a.png']`, `null` | 1 message |
| `R-127 fichier de prive/ suivi → violation` | `['prive/pack.json']`, `null` | 1 message contenant `prive/pack.json` |
| `R-127 plusieurs problèmes → un message chacun` | `['a.png', 'prive/x.txt', 'b.wav']`, `null` | 3 messages |
| `R-127 pack absent → aucune violation` | `[]`, `null` | `[]` |
| `R-127 pack avec en-tête SBPACK1 → aucune violation` | `['public/pack/pack.bin']`, octets de `SBPACK1` + 3 octets quelconques | `[]` |
| `R-127 pack sans en-tête SBPACK1 → violation` | `['public/pack/pack.bin']`, octets de `XXPACK1` | 1 message contenant `SBPACK1` |
| `R-127 pack trop court → violation` | `['public/pack/pack.bin']`, octets de `SB` | 1 message |

**Vitest — `tests/index-html.test.ts`** (lit les fichiers avec `node:fs`, chemins construits avec `node:path`)
| Nom du test | Attendu |
|---|---|
| `R-129 index.html contient la balise robots noindex` | contient `<meta name="robots" content="noindex">` |
| `R-129 robots.txt interdit tout le site` | contient les lignes `User-agent: *` et `Disallow: /` |
| `UI-10 index.html active viewport-fit=cover` | la balise viewport contient `viewport-fit=cover` |
| `index.html est en français et titré Sardinebagarre` | contient `lang="fr"` et `<title>Sardinebagarre</title>` |

**Playwright — `tests/e2e/accueil.spec.ts`**
| Nom du test | Attendu |
|---|---|
| `la page d'accueil a pour titre Sardinebagarre` | `page.goto('./')` ; `toHaveTitle('Sardinebagarre')` ; titre `h1` visible. 3 projets → 3 tests verts. |

**Playwright — `tests/e2e/screens.spec.ts`** (tag `@screens`)
| Nom du test | Attendu |
|---|---|
| `@screens page minimale` | capture `test-results/screens/<projet>/00-page-minimale.png` (nom du projet : `testInfo.project.name`) |

## Critères d'acceptation
- [x] `npm install` puis `npm run check` : code de sortie 0 (types, Biome, Vitest, « Contrôle de confidentialité : OK »).
- [x] `npm test` : les 20 tests Vitest ci-dessus existent et passent.
- [x] `npm run build` : `dist/index.html` existe et `grep -c "/sardinebagarre/assets/" dist/index.html` renvoie ≥ 1 ; `dist/robots.txt` existe.
- [x] `npx playwright install webkit` puis `npm run e2e` : **3 passed** (1 test × 3 projets), aucun test `@screens` lancé.
- [x] `npm run screens` : les 3 fichiers `test-results/screens/{iphone-se,iphone-15,mac}/00-page-minimale.png` existent ; les ouvrir avec Read : le titre « Sardinebagarre » est visible.
- [x] Règle d'architecture : créer temporairement `src/logic/essai-interdit.ts` contenant `import "../ui/main";` puis `npx biome lint src/logic` → code ≠ 0 avec `noRestrictedImports`. Remplacer le contenu par `export const t = document.title;` → code ≠ 0 avec `noRestrictedGlobals`. Supprimer le fichier, puis `npx biome lint src/logic` → 0.
- [x] Garde-fou : `node -e "require('node:fs').writeFileSync('src/essai.png','x')"` puis `node scripts/verifier-confidentialite.mjs` → code 1 et message citant `src/essai.png` ; supprimer le fichier → code 0.
- [x] Garde-fou SVG : `node -e "require('node:fs').writeFileSync('src/essai.svg','<svg><image href=\"x.png\"/></svg>')"` puis `node scripts/verifier-confidentialite.mjs` → code 1 et message citant `src/essai.svg` ; supprimer le fichier → code 0.
- [x] `npm run dev:https` (en arrière-plan) puis `curl -k -s -o /dev/null -w "%{http_code}" https://localhost:5173/sardinebagarre/` → `200`. Arrêter le serveur.
- [x] `npm run dev` (en arrière-plan) puis `curl -s http://localhost:5173/sardinebagarre/` contient `Sardinebagarre`. Arrêter le serveur.
- [x] `git status` avant commit : uniquement les fichiers de la table « Fichiers » (aucun `dist/`, `test-results/`, `node_modules/`, aucune image).

## Pièges connus
- **Windows / npm** : pas de `VAR=valeur commande`, pas d'apostrophes dans les scripts npm (cmd.exe ne les comprend pas), pas de `rm`. `&&` fonctionne partout. D'où `--mode https` et les tags `@screens` plutôt que des variables d'environnement.
- **Vitest** ramasserait `tests/e2e/*.spec.ts` sans `include: ['tests/**/*.test.ts']` : les specs Playwright planteraient dans Vitest.
- **Playwright vide son `outputDir` à chaque lancement** : d'où `outputDir: 'test-results/playwright'`, pour que `npm run e2e` n'efface pas `test-results/screens/`.
- **Base `/sardinebagarre/`** : `page.goto('/')` sort de la base (404). Utiliser `page.goto('./')` avec un `baseURL` terminé par `/`.
- **Biome `noRestrictedImports`** compare le texte de l'import, pas le chemin résolu : il faut couvrir les chemins relatifs (`../ui`, `../../ui/…`). Vérifier dans la doc de la version installée que la forme choisie (motifs ou liste) est prise en charge, et **prouver** la règle par le critère d'acceptation ci-dessus. Si Biome ne sait pas l'exprimer, ajouter `tests/architecture.test.ts` (scan des imports de `src/logic/`) et le signaler dans « Questions ».
- Le `$schema` de `biome.json` doit correspondre à la version installée (Biome 2 : clé `files.includes`).
- **Ne jamais lister ni lire `prive/`**, y compris pour tester le script : les tests passent des listes de chemins fictives à `findViolations`.
- `crypto` est interdit dans `src/logic/` mais le script `scripts/` n'est pas concerné par la surcharge.
- `@vitejs/plugin-basic-ssl` produit un certificat auto-signé : avertissement attendu dans Safari (accepter manuellement) ; c'est normal.
- Le hook `verifier-fin.mjs` lance `npm run check` à la fin de la session du codeur dès que `src/`, `tests/` ou `scripts/` sont modifiés : il doit passer.
- `npm install` déclenche une demande d'autorisation (règle `ask`) : c'est attendu.

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
Fait le 2026-11-10 par codeur. Projet initialisé : package.json (scripts exacts), vite.config.ts, tsconfig.json, biome.json (règles d architecture prouvées : noRestrictedImports et noRestrictedGlobals sont dans le groupe `style` de Biome 2.6), playwright.config.ts, index.html, robots.txt, main.ts, script de confidentialité et ses 16 tests + 4 tests index.html (20 Vitest), 2 specs Playwright.
Vérifié : check OK, build OK (base /sardinebagarre/ dans dist), e2e 3 passed, screens 3 captures, dev et dev:https répondent. Écarts : `biome migrate` a remplacé `recommended: true` par `preset: "recommended"` (Biome 2.6). Versions installées : TypeScript 7, Vite 8, Vitest 5. Aucune question.

### Compte rendu — corrections après relecture
Fait le 2026-11-10 par codeur. C1 : script indépendant du dossier courant (racine calculée depuis le script, cwd git, lectures via join), vérifié depuis src/ui/ et la racine. C2 : .dng bloqué, .svgz bloqué partout (+2 tests). C3 : globalThis, self, Date ajoutés à noRestrictedGlobals ; tests/architecture.test.ts (+10 tests) ; essai Date.now() : Vitest et Biome échouent, puis repassent après suppression. C4 : reporter Playwright html en CI. Vérifié : check OK (32 tests), e2e 3 passed. Aucune question.

## Corrections après relecture
_Validées par l'humain le 2026-11-10. À faire sur la même branche, dans un nouveau commit `fix(projet): corrections après relecture de T-001`. Ne rien changer d'autre._

### C1 — Script de confidentialité indépendant du dossier courant
- `scripts/verifier-confidentialite.mjs` : calculer la racine du dépôt à partir du script (`fileURLToPath(new URL('..', import.meta.url))`), passer `cwd: racine` à l'appel `git`, et lire `public/pack/pack.bin` et les SVG avec `join(racine, chemin)`. `findViolations` ne change pas de signature.
- **Critère** : avec `src/essai.png` présent (créé par `node -e`), lancer le script **depuis `src/ui/`** (`node ../../scripts/verifier-confidentialite.mjs`) → code 1 et message citant `src/essai.png` ; supprimer le fichier → code 0 depuis `src/ui/` et depuis la racine.

### C2 — `.dng` et `.svgz` bloqués
- Ajouter `dng` aux images bloquées hors de `public/icons/` et `src/ui/art/`.
- `svgz` (SVG compressé, contenu non vérifiable) est bloqué **partout**, dossiers autorisés compris.
- **Tests** (dans `tests/scripts/verifier-confidentialite.test.ts`) :
  | Nom du test | Entrée | Attendu |
  |---|---|---|
  | `R-127 photo ProRAW .dng bloquée` | `['src/IMG_0002.DNG']`, `null` | 1 message contenant `src/IMG_0002.DNG` |
  | `R-127 SVG compressé .svgz bloqué même dans src/ui/art/` | `['src/ui/art/logo.svgz']`, `null` | 1 message ; `readText` jamais appelée |

### C3 — Pureté de `src/logic/` vérifiée par Biome et par un test d'architecture
- `biome.json`, surcharge `src/logic/**` : ajouter `globalThis`, `self` et `Date` à `noRestrictedGlobals`.
- Créer `tests/architecture.test.ts` :
  - une fonction `findForbiddenUsages(source: string): string[]` (dans le fichier de test) qui **retire d'abord les commentaires** (`//…` et `/*…*/`), puis signale chaque occurrence de : `window`, `document`, `localStorage`, `crypto`, `Date.now`, `Math.random`, `globalThis` (mots entiers, `\b`), et tout import ou `export … from` dont le chemin vise `ui` (`../ui`, `../ui/…`, `../../ui/…`) ;
  - un parcours **récursif** de tous les `.ts` de `src/logic/` (dossier absent ou vide → aucun fichier, test vert), chemins construits avec `node:path`.
- **Tests** :
  | Nom du test | Entrée | Attendu |
  |---|---|---|
  | `ADR-006 aucun fichier de src/logic/ n'utilise d'API interdite` | contenu réel de `src/logic/**/*.ts` | aucune violation (le message d'échec cite fichier et usage) |
  | `ADR-006 détecteur : <usage> est repéré` (`it.each`, 8 cas) | `window.innerWidth`, `document.title`, `localStorage.getItem("k")`, `crypto.getRandomValues(a)`, `Date.now()`, `Math.random()`, `globalThis.x`, `import { a } from "../ui/main";` | 1 violation chacun |
  | `ADR-006 détecteur : code pur et commentaires acceptés` | `export const add = (a: number, b: number) => a + b; // Math.random et window interdits ici` + `/* document */` + `const documentCount = 1;` | 0 violation |
- **Critère** : créer temporairement `src/logic/essai-interdit.ts` contenant `export const t = Date.now();` → `npm test` échoue sur le test d'architecture **et** `npx biome lint src/logic` échoue (`noRestrictedGlobals`) ; supprimer le fichier → les deux repassent.

### C4 — Rapport Playwright en CI
- `playwright.config.ts` : `reporter: process.env.CI ? [['dot'], ['html', { open: 'never' }]] : 'list'`.
- **Critère** : la ligne est présente ; `npm run e2e` → 3 passed.

### Critère global
- `npm run check` → code 0, avec **32** tests Vitest (20 + 2 pour C2 + 10 pour C3) ; `npm run e2e` → 3 passed ; `git status` avant commit : uniquement les 5 fichiers ci-dessus (script, test du script, `biome.json`, `tests/architecture.test.ts`, `playwright.config.ts`), la fiche et `docs/journal.md`.

## Relecture
**2026-11-10 — relecteur — ⚠️ approuvé avec réserves mineures** (aucun point bloquant ni important).
Vérifié par exécution : `npm run check` (20/20), build, e2e (3 passed), 3 captures ouvertes, `dev:https` → 200, surcharge Biome prouvée dans un dépôt d'essai (5 formes d'import vers `ui` et 6 globales refusées, sans faux positif), script R-127 testé en réel (non suivi, SVG `<Image` dans `src/ui/art/`, pack court, hors Git).

Réserves mineures :
1. `scripts/verifier-confidentialite.mjs` dépend du dossier courant : lancé depuis un sous-dossier, il conclut « OK » à tort. Correction : `cwd` = racine du dépôt (`fileURLToPath(new URL('..', import.meta.url))`) pour `git` et les lectures.
2. `.dng` (ProRAW iPhone) et `.svgz` ne sont pas bloqués.
3. `biome.json` : `globalThis`, `self`, `Date` non interdits dans `src/logic/` ; `Math.random` hors de portée de Biome → test d'architecture à prévoir avant l'étape 1.
4. `playwright.config.ts` : pas de reporter `html` en CI, donc l'artefact `playwright-report/` de `ci.yml` sera vide en cas d'échec.
**2026-11-10 — relecteur (relecture limitée à C1–C4, commit `cc5af52`) — ✅ approuvé.**
Prouvé par exécution : C1 (script lancé depuis `src/ui/` et `C:\Windows`, SVG lus via la racine), C3 (`Date.now()` et `export * from '../../ui/main'` dans un sous-dossier de `src/logic/` refusés par le test et par Biome). `npm run check` 32/32, e2e 3 passed, commit limité aux 7 fichiers prévus.
Remarques mineures, non bloquantes : le détecteur de `tests/architecture.test.ts` ignore `import('../ui/…')`, `Date . now()` et un usage placé après `//` dans une chaîne, et signale à tort « document » ou « window » dans une chaîne. Biome rattrape les angles morts ; seul le faux positif pourrait gêner un jour.
