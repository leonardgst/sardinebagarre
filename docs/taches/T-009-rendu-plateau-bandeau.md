# T-009 — Afficher le plateau et le bandeau (rendu statique, style Salon)

| Champ | Valeur |
|---|---|
| Statut | terminée (à relire) |
| Étape du plan | 2.2 |
| Branche | `t-009-rendu-plateau` |
| Estimation | M (1–3 h) |
| Planifiée par | Opus — 2026-11-22 |
| Implémentée par | codeur (Sonnet) |

## Objectif
À l'ouverture de l'app, on voit une partie neuve du niveau 1 : bandeau (niveau, jetons de la partie, total), plateau 5 × 5 face cachée avec ses 10 indicateurs, zone de message, boutons Mémo et Quitter, dans le style Salon (ADR-018). La mise en page est sans défilement sur les 5 profils. Le rendu sait aussi afficher une partie avancée (cartes retournées, mémo, Sardine), mais rien n'est encore interactif.

## Règles concernées
- `R-01` — grille 5 × 5, `id = ligne × 5 + colonne`
- `R-02`, `R-03` — indicateurs à droite (lignes) et en bas (colonnes) : somme + nombre de Sardines, fixes
- `R-04` — au début, tout est face cachée et sans mémo
- `R-82` — marques du mémo visibles en permanence, dans les 4 coins (S en haut à gauche, 1 en haut à droite, 2 en bas à gauche, 3 en bas à droite, comme dans la maquette)
- `UI-02` — bandeau « Niveau {n} », « Jetons de la partie » (5 chiffres), « Total » (5 chiffres) ; boutons Mémo, Quitter ; zone de message d'une ligne
- `UI-10` — iPhone portrait : bandeau en haut, plateau carré pleine largeur (marges ≥ 12 px), boutons en bas, zones sûres, aucun défilement
- `UI-11` — Mac : même mise en page, centrée, largeur max 480 px, fond décoré
- `UI-12` — cartes ≥ 44 × 44 px ; ligne i et colonne i de même couleur ; la couleur n'est jamais la seule information
- `UI-13` — `touch-action: manipulation`, pas de sélection de texte, pas de menu contextuel sur appui long
- `UI-14` — Sardine révélée : tête de chien dessinée dans un médaillon rond (pas encore de pack)
- `UI-15` — paysage : rien ne déborde, le plateau tient dans la hauteur
- `ADR-018` — direction artistique « Salon » : **référence visuelle `docs/maquettes/variante-1.html`** (couleurs, ombres, formes, disposition paysage)

## Périmètre
**Inclus**
- Remplacer le `<h1>` de `index.html` par un conteneur `<div id="app"></div>` (garder `lang`, `title`, viewport, robots).
- `src/ui/main.ts` : lit la graine, démarre une partie avec `startRound(initialGame(), rngs.board)` (niveau 1, total 0), puis l'affiche.
- `src/ui/seed.ts` : seul fichier à appeler `crypto.getRandomValues`.
  - `readSeed(search: string, dev: boolean): number` : `?seed=<entier>` n'est pris en compte qu'en développement (`import.meta.env.DEV`, passé en paramètre pour pouvoir le tester). Sinon, graine aléatoire.
  - `createRngs(seed)` → `{ board, decor }` : **deux générateurs distincts** (contrainte du journal pour la phase 2). Par exemple `mulberry32(seed)` et `mulberry32(seed ^ 0x9e3779b9)`.
- `src/ui/format.ts` (pur, testable sous Node) : `formatCoins(n)` sur 5 chiffres (`0` → `"00000"`, `1235` → `"01235"`, `50000` → `"50000"`) et `formatHintSum(n)` sur 2 chiffres (`4` → `"04"`, `13` → `"13"`).
- `src/ui/texts.fr.ts` : tous les libellés (Niveau, Jetons de la partie, Total, Mémo, Quitter), plus les libellés d'accessibilité : « Carte cachée », « Carte {n} », « Sardine », « Ligne {i} : somme {s}, {k} Sardine(s) » avec un pluriel correct (0 ou 1 → « Sardine », ≥ 2 → « Sardines »), idem pour « Colonne {i} ».
- `src/ui/render/board.ts` : `renderBoard(round: RoundState): HTMLElement`. Grille 6 × 6 : 25 cartes, 5 indicateurs de ligne, 5 de colonne, 1 coin décoratif (♣).
  - Carte cachée : `<button>` avec ses 4 marques.
  - Carte retournée : chiffre.
  - Sardine retournée : tête de chien dans un médaillon.
  - Attributs pour les tests : `data-id` sur chaque carte, `data-state="hidden|shown"`, `data-value` **seulement** si la carte est retournée, `data-hint="row-i|col-i"` sur les indicateurs, `data-mark="S|1|2|3"` sur les marques actives.
- `src/ui/render/hud.ts` : `renderHud(level, payout, total)`, la zone de message (vide pour l'instant) et la barre de boutons (inertes).
- `src/ui/art/chien.svg` : la tête de chien de secours, **copiée de la maquette** (symbole `#chien`, couleurs par variables CSS `--chien-tete`, `--chien-oreille`, `--chien-museau`). Importée avec `?raw` et insérée une fois dans le document. Utilisée pour la carte Sardine et en petit dans les indicateurs.
- `src/ui/styles/main.css` : styles repris de la maquette Salon (jetons de couleur en variables CSS sur `:root`, polices système à empattements, `font-variant-numeric: lining-nums tabular-nums`, `100dvh`, `env(safe-area-inset-*)`, `container-type: size` pour un plateau carré, disposition paysage de la maquette, `prefers-reduced-motion`).
- `src/ui/debug.ts` : **uniquement si `import.meta.env.DEV` et `?debug=1`**, expose `window.__sb = { flip(id), mark(id, m), state() }`. Ces fonctions appliquent les fonctions pures `flip` / `toggleMemo` à la partie affichée, puis réaffichent. Elles servent seulement aux captures et aux tests e2e (réutilisables en 2.3).
- `playwright.config.ts` : 5 projets.
  - `iphone-se` = `devices['iPhone SE (3rd gen)']` (375 × 667, comme la spec §15) ;
  - `iphone-15` = `devices['iPhone 15']` ;
  - `iphone-15-pro-max` = `devices['iPhone 15 Pro Max']` ;
  - `iphone-15-paysage` = `devices['iPhone 15 landscape']` ;
  - `mac` = WebKit 1280 × 800.

  Les hauteurs Playwright (barres de Safari déduites) sont plus petites que celles de la spec : elles sont donc plus exigeantes, et c'est voulu.
- `tests/e2e/screens.spec.ts` : refait (voir les tests).
- `tests/e2e/accueil.spec.ts` : adapté (le `<h1>` disparaît).

**Exclu** (ne pas faire dans cette tâche)
- Toucher une carte pour la retourner, animations, sons, verrou d'entrée (T-010, étape 2.3).
- Fonctionnement des boutons Mémo et Quitter, panneau du mémo, dialogues, menu d'accueil.
- Sauvegarde (`storage.ts`), PWA, pack, tête de Sardine réelle.
- Toute modification de `src/logic/`.

## Fichiers
| Fichier | Action |
|---|---|
| `index.html` | modifier (`#app` à la place du `<h1>`) |
| `src/ui/main.ts` | modifier |
| `src/ui/seed.ts` | créer |
| `src/ui/format.ts` | créer |
| `src/ui/texts.fr.ts` | créer |
| `src/ui/render/board.ts` | créer |
| `src/ui/render/hud.ts` | créer |
| `src/ui/debug.ts` | créer |
| `src/ui/art/chien.svg` | créer (copie du symbole de la maquette) |
| `src/ui/styles/main.css` | créer |
| `playwright.config.ts` | modifier (5 projets) |
| `tests/ui/format.test.ts` | créer |
| `tests/ui/seed.test.ts` | créer |
| `tests/e2e/accueil.spec.ts` | modifier |
| `tests/e2e/screens.spec.ts` | refaire |
| `tests/e2e/plateau.spec.ts` | créer |

## Tests à écrire
| Nom du test | Entrée | Attendu |
|---|---|---|
| `UI-02 formatCoins sur 5 chiffres` | `0`, `7`, `1235`, `50000` | `"00000"`, `"00007"`, `"01235"`, `"50000"` |
| `R-02 formatHintSum sur 2 chiffres` | `0`, `4`, `13` | `"00"`, `"04"`, `"13"` |
| `UI-12 libellé d'indicateur au singulier et au pluriel` | ligne 0, somme 5, 0 / 1 / 2 Sardines | `…0 Sardine`, `…1 Sardine`, `…2 Sardines` |
| `seed : ?seed=42 pris en compte en développement` | `readSeed('?seed=42', true)` | `42` |
| `seed : ?seed ignoré en production` | `readSeed('?seed=42', false)` deux fois | entier ≥ 0, et pas toujours 42 (tirer 3 fois ; au moins une valeur ≠ 42) |
| `seed : ?seed invalide ignoré` | `readSeed('?seed=abc', true)` | entier ≥ 0 (pas `NaN`) |
| `seed : deux générateurs distincts et reproductibles` | `createRngs(42)` deux fois | mêmes suites pour la même graine ; `board()` ≠ `decor()` sur les 5 premiers tirages |
| e2e `R-01 R-04 plateau neuf : 25 cartes cachées sans mémo` | `?seed=42` | 25 `[data-state=hidden]`, 0 `[data-mark]`, aucun `data-value` |
| e2e `R-02 indicateurs = ceux de la logique pour la graine` | `?seed=42` | dans le test, recalculer avec `createRngs(42)` + `startRound(initialGame(), board)` ; le texte des 10 indicateurs = `rowHints` / `colHints` (somme sur 2 chiffres, nombre de Sardines) |
| e2e `UI-02 bandeau du niveau 1` | `?seed=42` | « Niveau » + `1`, jetons de la partie `00000`, total `00000`, boutons « Mémo » et « Quitter » visibles |
| e2e `UI-10 UI-15 aucun défilement` | chaque profil | `scrollHeight ≤ innerHeight` et `scrollWidth ≤ innerWidth` |
| e2e `UI-12 cartes d'au moins 44 px` | chaque profil **sauf paysage** | largeur et hauteur de chaque carte ≥ 44 |
| e2e `UI-12 plateau carré` | chaque profil | `abs(largeur − hauteur) ≤ 1` pour la grille |
| e2e `UI-11 Mac : colonne centrée ≤ 480 px` | `mac` | largeur de `#app` ≤ 480, centre à ± 2 px du centre de la fenêtre |
| e2e `R-82 marques du mémo et cartes retournées affichées` | `?seed=42&debug=1`, puis `__sb.mark(…)` et `__sb.flip(…)` sur des cartes chiffrées | marques visibles aux bons coins ; cartes retournées avec `data-value` correct |
| e2e `UI-14 Sardine retournée : tête de chien` | `?seed=42&debug=1`, `__sb.flip(id d'une Sardine)` | la carte contient le SVG du chien (`use[href="#chien"]`) |
| e2e `debug absent sans ?debug=1` | `?seed=42` | `window.__sb` est `undefined` |
| `@screens` captures | 5 profils | `02-plateau-neuf.png` (`?seed=42`) ; `03-en-cours.png` (5 cartes chiffrées retournées + 4 cartes avec mémo, dont une avec les 4 marques) ; `07-defaite-revelation.png` (même état + une Sardine retournée ; la révélation complète viendra en 2.3) |

Les ids des cartes chiffrées et des Sardines se calculent dans le test à partir de la logique (même graine) : ne pas les coder en dur.

## Critères d'acceptation
- [x] `npm run check` passe (typecheck, Biome, Vitest, confidentialité)
- [x] `npm run e2e` passe sur les 5 projets
- [x] `npm run screens` produit `test-results/screens/<profil>/02-plateau-neuf.png`, `03-en-cours.png` et `07-defaite-revelation.png` pour les 5 profils
- [x] Les captures sont vérifiées avec la checklist du skill `controle-visuel`. Le compte rendu liste les problèmes vus et corrigés. Comparer aussi avec `docs/maquettes/variante-1.html` (même ambiance, mêmes couleurs).
- [x] `grep -rn "getRandomValues" src` ne trouve que `src/ui/seed.ts`
- [x] Aucun texte affiché en dur hors de `src/ui/texts.fr.ts`
- [x] Aucun chemin absolu `/…` dans `src/ui/` ni `index.html` (sauf le `src="/src/ui/main.ts"` géré par Vite)
- [x] `npm run build` passe

## Pièges connus
- **Taille des cartes sur iPhone SE.** Le cadre doré du plateau (padding + liseré) mange de la place : dans la maquette, les cartes font 42 px à 320 px de large. À 375 px, c'est plus large, mais vérifiez ≥ 44 px. Si ce n'est pas le cas, amincissez le cadre ou réduisez l'écart, sans réduire les marges latérales sous 12 px.
- Le plateau doit être carré **et** tenir en hauteur : `container-type: size` sur la zone du plateau, puis `width: min(100cqw, 100cqh)` (méthode de la maquette). Évitez `vw` seul.
- Polices **système** uniquement (pas de Google Fonts : l'app doit marcher hors ligne). Sous Windows, Georgia remplace Iowan Old Style : c'est normal.
- Chiffres de Georgia : sans `lining-nums`, le « 1 » et le « 0 » ont l'air plus petits (chiffres elzéviriens).
- `?seed` et `?debug` doivent être inertes en production : tester `import.meta.env.DEV`. `vite build` élimine alors le code de `debug.ts`, à condition que l'import soit dynamique ou que l'appel soit gardé.
- Les marques du mémo ne doivent pas se confondre avec une carte retournée : petites pastilles bordeaux, chiffre de face beaucoup plus grand.
- Sous Windows, chemins de fichiers dans les tests avec `node:path`.
- `src/ui/art/chien.svg` est vérifié par le contrôle de confidentialité : pas de `<image>` ni de `data:image/`.

## Questions
_(remplies par le codeur s'il bloque ; l'humain ou Opus répond ici)_

## Compte rendu
Rendu statique du plateau 6×6, du bandeau, du message et des boutons (style Salon) ; seed.ts (2 générateurs), format.ts, texts.fr.ts, crochet debug réservé au dev (absent du build), 5 profils Playwright. Tests : 7 Vitest, 10 e2e par profil (50 passés, 5 ignorés par conception). Captures des 5 profils vérifiées : pas de défaut visible (cartes >= 44 px, aucun défilement, paysage correct). Écart : `playwright.config.ts` accepte la variable `E2E_PORT` (défaut 5173) car le port 5173 était occupé par le serveur des maquettes. Les marques S/1/2/3 et le symbole ♣ sont dans `symbols` de texts.fr.ts. Les captures 00-page-minimale restantes ont été supprimées.

## Relecture
2026-11-22 — relecteur — 🟡 Approuvé avec réserves. check OK, e2e 50/50 (5 ignorés), captures vues (5 profils), debug et `__sb` absents du build vérifiés.

Corrections demandées :
- **C1** (important) `src/ui/styles/main.css:11` : Georgia n'a pas de chiffres alignés (`lining-nums` sans effet ; le « 0 » du nombre de Sardines se lit « o », le « 1 » est plus petit que le « 3 »). Remplacer par `--police-chiffres: Palatino, "Palatino Linotype", "Book Antiqua", "Times New Roman", serif;`, puis relancer les captures.
- **C2** (mineur) `src/ui/render/board.ts:43, 48, 76, 92` : `aria-label` ignoré sur des `div` génériques. Ajouter `role="img"` sur la face Sardine, la face chiffrée et les indicateurs, et `role="group"` sur le plateau.
- **C3** (mineur) `tests/e2e/plateau.spec.ts` : ajouter un test géométrique R-01/R-02 avec `boundingBox`. La carte `id` doit être à la ligne `floor(id/5)` et à la colonne `id%5`. `row-r` doit être aligné sur la ligne r, à droite de la carte `r*5+4`. `col-c` doit être aligné sur la colonne c, sous la carte `20+c`.
- **C4** (documentation, Opus) : UI-15 et disposition paysage (fait : UI-15 et ADR-018 annotés). Nom de l'appareil iPhone SE dans le skill `controle-visuel` et `E2E_PORT` dans CLAUDE.md : en attente de l'accord de l'humain.

### Corrections après relecture (codeur)
C1, C2, C3 appliquées (police des chiffres Palatino, `role` img/group, test géométrique e2e). check OK ; e2e 55 passés ; captures revues (chiffres alignés). C4 reste à Opus/humain.
