# T-015 — Afficher un diagnostic hors ligne dans Réglages

| Champ | Valeur |
|---|---|
| Statut | implémentée (à relire) |
| Étape du plan | 3.2 (suite de T-014) |
| Branche | `t-015-diagnostic-hors-ligne` |
| Estimation | S (< 1 h) |
| Planifiée par | Opus — 2026-11-24 |
| Implémentée par | codeur (Sonnet) |

## Objectif
Sous la version, l'écran Réglages affiche l'état du service worker vu de la page, pour comprendre sur iPhone pourquoi l'app installée ne démarre pas hors ligne alors que l'onglet Safari, lui, fonctionne (recette T-014, v0.6.0).

Constat de la recette : app de l'écran d'accueil relancée en mode avion → alerte iOS « Désactivez le mode avion… » puis « Safari ne peut pas ouvrir la page… ». Dans un onglet Safari, même manipulation : le jeu se lance et se joue. Le site publié est conforme (précache complet, aucune redirection). Le diagnostic doit dire, dans l'app installée lancée en ligne : la page est-elle contrôlée par le service worker, quelle URL iOS a lancée, quelle portée est enregistrée, combien de fichiers sont en réserve.

Diagnostic **provisoire** : il sera retiré ou réduit avant le gel (13/12).

## Règles concernées
- ADR-001 — jouable hors ligne
- UI-04 — version affichée dans Réglages (le diagnostic se place juste dessous)

## Périmètre
**Inclus**
- `src/ui/diagnostic.ts` :
  - `collectOfflineInfo(): Promise<OfflineInfo>` lit `navigator.serviceWorker` (présence, `controller`, `getRegistration()` → `scope`, état `active`/`waiting`/`installing`), `location.pathname + location.search`, `matchMedia('(display-mode: standalone)').matches` ou `navigator.standalone`, et le nombre total d'entrées de tous les caches (`caches.keys()` puis `cache.keys()`). Chaque lecture est protégée par try/catch : une erreur donne une valeur « ? » au lieu de casser l'écran.
  - `formatOfflineInfo(info): string[]` est pure et renvoie deux lignes :
    1. `Hors ligne : actif` (page contrôlée), `Hors ligne : pas encore prêt` (service worker présent mais page non contrôlée) ou `Hors ligne : indisponible` (pas de service worker) ;
    2. une ligne technique : `app|navigateur · page /sardinebagarre/ · portée /sardinebagarre/ · sw active · réserve 9`. Remplacer la portée absolue par son chemin. S'il n'y a pas d'enregistrement, écrire `portée aucune`.
- Réglages : sous `.ecran-version`, un élément `.ecran-diagnostic` (petit, discret, même style que la version). Il est rempli de façon asynchrone après l'affichage. Si l'écran a été quitté entre-temps, on n'écrit rien.
- Tous les libellés sont dans `src/ui/texts.fr.ts`.

**Exclu**
- Toute tentative de correction du hors ligne (elle viendra après le diagnostic).
- Toute modification de `vite.config.ts` ou de `src/ui/pwa.ts`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/ui/diagnostic.ts` | créer |
| `src/ui/texts.fr.ts` | modifier |
| `src/ui/render/menu.ts` et/ou `src/ui/controller.ts` | modifier (affichage dans Réglages) |
| `src/ui/style.css` (ou la feuille existante) | modifier |
| `tests/ui/diagnostic.test.ts` | créer |
| `tests/e2e/pwa.spec.ts` | modifier |

## Tests à écrire
| Nom du test | Entrée | Attendu |
|---|---|---|
| `ADR-001 diagnostic : page contrôlée → actif` | controller présent, app, portée `https://x/sardinebagarre/`, réserve 9 | `Hors ligne : actif` ; ligne 2 contient `app`, `portée /sardinebagarre/`, `réserve 9` |
| `ADR-001 diagnostic : enregistré mais non contrôlé → pas encore prêt` | controller absent, enregistrement présent | `Hors ligne : pas encore prêt` |
| `ADR-001 diagnostic : sans service worker → indisponible` | pas de serviceWorker | `Hors ligne : indisponible`, `portée aucune` |
| `ADR-001 diagnostic : valeur illisible → ?` | réserve inconnue | `réserve ?` |
| e2e (projet `pwa`) `ADR-001 Réglages affiche le diagnostic hors ligne actif` | SW prêt, rechargement, Réglages | `.ecran-diagnostic` contient `Hors ligne : actif` et `navigateur` |

## Critères d'acceptation
- [x] `npm run check` passe
- [x] Les tests listés ci-dessus existent et passent ; `E2E_PORT=5199 npm run e2e` passe
- [x] `npm run screens` : la capture de Réglages reste lisible sur iPhone SE, sans débordement (ligne technique sur plusieurs lignes si nécessaire, `overflow-wrap: anywhere`)
- [x] `__sb` toujours absent de `dist/`

## Pièges connus
- `caches` n'existe qu'en contexte sécurisé : vérifier `'caches' in window`.
- `navigator.standalone` n'est pas typé : passer par une interface locale, sans `any`.
- En développement il n'y a pas de service worker (enregistrement en production seulement) : le diagnostic affiche `indisponible` ou `pas encore prêt`, c'est normal.

## Questions

## Compte rendu
- `src/ui/diagnostic.ts` (collectOfflineInfo, formatOfflineInfo), libellés `offlineTexts`, élément `.ecran-diagnostic` sous la version, rempli en asynchrone (rien si l'écran est quitté).
- 4 tests unitaires + 1 e2e (projet pwa). check OK (429 tests) ; e2e 433 passés, 10 ignorés ; `__sb` absent de dist non modifié (aucun changement de build).
- Capture : test-results/screens/iphone-se/11-reglages.png (lisible, ligne technique sur 2 lignes ; en dev : « pas encore prêt », normal).

## Relecture
