# T-017 — Brancher le pack chiffré dans le jeu

| Champ | Valeur |
|---|---|
| Statut | terminée (à relire) |
| Étape du plan | 3.3 (2ᵉ moitié, après T-016) |
| Branche | `t-017-pack-dans-le-jeu` |
| Estimation | M (1–3 h) |
| Planifiée par | Opus — 2026-11-24 |
| Implémentée par | codeur (Sonnet) |

## Objectif
Dans Réglages, la joueuse saisit le code secret. S'il est bon, le code est sauvegardé et le message de bienvenue du pack s'affiche. Le jeu montre alors la tête de Sardine (photo ronde) sur les cartes Sardine révélées et ajoute les messages privés « Sardine » à la liste publique. Le pack est rechargé à chaque lancement avec le code sauvegardé. Sans code ou sans pack, le jeu reste entièrement jouable comme aujourd'hui.

## Règles concernées
- `R-124` — saisie, déchiffrement, message d'échec « Ce code ne marche pas. Vérifie ta carte ! », code enregistré en cas de succès, URL `blob:`, messages privés ajoutés, déchiffrement refait à chaque lancement
- `R-125` — `pack.bin` préchargé par le service worker
- `R-126` — sans pack valide, jeu entièrement jouable
- `R-101` — `packCode` dans la sauvegarde ; `R-100` — écriture à chaque changement
- `UI-04` — Réglages : code secret (saisir ou changer)
- `UI-14` — carte Sardine révélée : tête de Sardine en rond, sinon tête dessinée
- `UI-60` — messages privés ajoutés aux listes
- `R-71` / ADR-017 — « Effacer la progression » conserve le code (rien à faire ici, ne pas casser)

## Décisions de cette tâche (Opus)
1. **Architecture.**
   - `src/ui/pack.ts` reste le seul fichier qui utilise `crypto.subtle`. Il ne change pas, sauf une petite fonction utilitaire si nécessaire.
   - Nouveau module `src/ui/pack-store.ts`. Il charge `${import.meta.env.BASE_URL}pack/pack.bin` (`fetch`), déchiffre avec `pack.ts` et crée les URL `blob:` (tête, photos, aboiement). Il garde le contenu en mémoire : `headUrl`, `photos` (id, légende, prix, url), `barkUrl?`, `messages`, `welcome`.
   - En cas de changement de code, il révoque les anciennes URL (`URL.revokeObjectURL`).
   - Il mesure la durée du déchiffrement (`performance.now()`), pour R-T8.
2. **Résultats d'une tentative** (type union) :
   - `ok` ;
   - `wrong` (`WrongCodeError`) ;
   - `unavailable` : `fetch` en échec, statut ≠ 200 ou `BadPackError`. En développement, Vite peut renvoyer `index.html` avec un statut 200 pour un fichier absent ; l'en-tête invalide donne alors `BadPackError`, donc `unavailable`.
   - `empty` : code vide après normalisation, refusé **avant** tout appel à `decryptPack`.
3. **Au lancement** (`main.ts`), si `save.packCode` existe, le pack est chargé en arrière-plan, sans bloquer le menu ni la partie :
   - `ok` : le jeu utilise le pack dès qu'il est prêt (prochain rendu d'une carte Sardine, prochain tirage de message) ;
   - `wrong` : le pack a été refait avec un autre code ; `packCode` est remis à `null` et la sauvegarde est écrite ;
   - `unavailable` : le code est gardé et le jeu tourne sans pack.
4. **Réglages** (l'écran provisoire `renderScreen` reçoit une section « Code secret » entre le titre et la version) :
   - **Sans pack chargé :**
     - libellé « Code secret de ta carte cadeau » ;
     - champ texte : `autocapitalize="off"`, `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"`, `enterkeyhint="done"`, taille de police ≥ 16 px (sinon iOS zoome) ;
     - bouton « Valider » ; la touche Entrée valide aussi.
   - **Pendant la vérification :** bouton désactivé et texte « Vérification… ». Les doubles touchers sont ignorés.
   - **Résultat :**
     - `ok` : sauvegarde de `packCode` (le code tel que saisi, normalisé) ; la section affiche « Code accepté » et le message de bienvenue du pack, puis un bouton « Changer le code » qui réaffiche le champ ;
     - `wrong` : « Ce code ne marche pas. Vérifie ta carte ! » (R-124) ; rien n'est sauvegardé ; le pack précédent, s'il y en avait un, reste en place ;
     - `unavailable` : « Les photos ne sont pas encore disponibles. Réessaie plus tard. » ;
     - `empty` : « Écris le code de ta carte cadeau. ».
   - **Pack déjà chargé :** la section affiche directement « Code accepté » et « Changer le code ».
   - **Écran quitté pendant la vérification :** le résultat est quand même appliqué (sauvegarde, pack), mais rien n'est écrit dans un écran détaché.
   - Ne jamais afficher `error.message`. Tous les textes sont dans `texts.fr.ts`.
5. **Carte Sardine (UI-14).** Si une tête est chargée, le médaillon de la carte révélée contient `<img class="tete-photo" src="blob:…" alt="">`, en rond (`border-radius: 50%`, `object-fit: cover`), à la place de `dogHead('tete')`. L'indicateur (petite tête des colonnes et lignes) et le menu gardent la tête dessinée.
6. **Messages (UI-60).** Le tirage d'un message « Sardine » se fait dans la liste publique, à laquelle s'ajoutent les messages `sardine` du pack. Les autres listes du pack (`won`, `suspense`, `levelUp`, `levelDown`) sont conservées en mémoire pour la phase 4 (4.3), sans être utilisées ici.
7. **Diagnostic provisoire (T-015).** Ajouter une ligne « pack : absent | chargé (N photos, déchiffré en X ms) | indisponible ». Elle sert à mesurer R-T8 sur iPhone et sera retirée avec le reste avant le gel.
8. **Précache (R-125, réserve C6 de T-014).** Un test unitaire vérifie dans `vite.config.ts` que `globPatterns` couvre `bin` et que `maximumFileSizeToCacheInBytes` vaut au moins 10 Mo. La vérification réelle (`pack/pack.bin` présent dans le `sw.js` publié) sera faite par Opus après la première publication du vrai pack ; elle est notée au journal.

## Périmètre
**Inclus**
- `src/ui/pack-store.ts`.
- Branchement dans `src/ui/main.ts` : chargement au lancement et sauvegarde du code.
- Contrôleur et rendu : Réglages, carte Sardine, messages.
- Styles et textes.
- Tests unitaires de `pack-store.ts` (avec `fetch` simulé et la fixture `tests/fixtures/pack-test.bin`).
- Tests e2e sur les 5 profils (serveur de développement). `page.route('**/pack/pack.bin', …)` sert la fixture (ou renvoie 404).
- Captures de Réglages (formulaire vide, erreur, code accepté) et d'une carte Sardine avec photo.

**Exclu**
- Écran Bienvenue UI-05 (4.2), écran Album (4.1), aboiement enregistré joué (4.3), autres listes de messages (4.3).
- Création de `public/pack/pack.bin` : c'est l'humain qui le fera. Ne jamais lire ni lister `prive/`.

## Fichiers
| Fichier | Action |
|---|---|
| `src/ui/pack-store.ts` | créer |
| `src/ui/main.ts`, `src/ui/controller.ts` | modifier |
| `src/ui/render/menu.ts`, `src/ui/render/board.ts` | modifier |
| `src/ui/texts.fr.ts`, `src/ui/styles/main.css` | modifier |
| `src/ui/diagnostic.ts` | modifier (ligne pack) |
| `tests/ui/pack-store.test.ts` | créer |
| `tests/e2e/pack.spec.ts` | créer |
| `tests/ui/…` (config précache) | créer ou modifier |

## Tests à écrire
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-124 pack-store : bon code → ok, tête et 3 photos en blob:` | fixture, `test-test-test-test` | `ok`, `headUrl` commence par `blob:`, 3 photos |
| `R-124 pack-store : mauvais code → wrong` | fixture, autre code | `wrong`, contenu inchangé |
| `R-124 pack-store : code vide → empty sans déchiffrer` | `'  - '` | `empty`, `fetch` non appelé |
| `R-126 pack-store : 404 ou en-tête invalide → unavailable` | `fetch` 404 ; corps HTML | `unavailable` |
| `UI-60 messages Sardine du pack ajoutés à la liste publique` | pack chargé | la liste de tirage = publique + pack |
| `R-125 précache : bin couvert, limite ≥ 10 Mo` | `vite.config.ts` | vrai |
| e2e `R-124 code accepté dans Réglages` | fixture servie, saisie `Test Test Test Test` | « Code accepté » + message de bienvenue ; sauvegarde contient `packCode` |
| e2e `R-124 mauvais code refusé` | saisie `faux-faux-faux-faux` | message R-124 ; `packCode` absent |
| e2e `R-126 pack absent : jeu jouable, message indisponible` | route 404 | message « pas encore disponibles » ; une partie se lance |
| e2e `R-124 au relancement, pack rechargé avec le code sauvegardé` | sauvegarde avec `packCode`, rechargement | carte Sardine révélée (graine fixe) contient `img.tete-photo[src^="blob:"]` |
| e2e `R-124 code sauvegardé devenu faux → oublié` | sauvegarde avec un faux `packCode` | après chargement, `packCode` est `null` |
| e2e `UI-14 sans pack : tête dessinée` | aucun code | carte Sardine contient le SVG, pas d'`img` |
| e2e `CL-19 double toucher sur Valider : une seule vérification` | double clic | un seul `fetch` de `pack.bin` |

## Critères d'acceptation
- [x] `npm run check` passe ; `E2E_PORT=5199 npm run e2e` passe
- [x] Captures `controle-visuel` : Réglages (vide, erreur, accepté) et carte Sardine avec photo, sur les 5 profils, sans débordement ; champ lisible et ≥ 16 px
- [x] `crypto.subtle` uniquement dans `pack.ts` ; `localStorage` uniquement dans `storage.ts` ; aucun `error.message` affiché
- [x] Le code saisi n'apparaît dans aucun `console.log`, aucune URL ni aucun attribut du DOM après validation (le champ est vidé)
- [x] `__sb` absent de `dist/`

## Pièges connus
- Une partie peut être en cours quand le pack finit de se charger au lancement : ne pas re-rendre le plateau pour autant ; la photo apparaîtra sur la prochaine carte Sardine révélée.
- `URL.createObjectURL` n'existe pas dans l'environnement `node` de Vitest : l'injecter (paramètre) ou utiliser une implémentation de test.
- Le déchiffrement prend du temps sur iPhone (PBKDF2 600 000 itérations) : ne rien bloquer pendant ce temps.
- Effacer la progression (plus tard) doit conserver `packCode` : ne pas réinitialiser le pack.

## Questions

## Compte rendu
- Test rouge d'abord : `tests/ui/pack-store.test.ts` (échec : module absent), puis `src/ui/pack-store.ts` ; e2e `tests/e2e/pack.spec.ts` (12 tests, sur les 5 profils) écrits avant le branchement.
- `pack-store.ts` : `load(code)` → `ok | wrong | unavailable | empty`, URL `blob:` (tête, photos, aboiement), révocation des anciennes, durée mesurée, `sardineMessages(base)` (UI-60). `fetch`, `createUrl`, `revokeUrl` injectables.
- Contrôleur : section « Code secret » des Réglages (vérification, erreur, accepté, « Changer le code », Entrée valide, un seul chargement à la fois), résultat appliqué même si l'écran est quitté. `main.ts` recharge le pack au lancement ; code faux → `packCode` remis à `null` ; pack indisponible → code gardé.
- Carte Sardine : `<img class="tete-photo">` en rond si la tête est chargée (UI-14) ; indicateur et menu inchangés. Messages Sardine du pack ajoutés au tirage.
- Diagnostic provisoire : ligne « pack : … » (ms de déchiffrement dans le navigateur de test : ~570 ms sur le pack de test, ~3 photos).
- Précache : test unitaire sur `vite.config.ts` (R-125). Vérification réelle du `sw.js` publié : à faire par Opus après la publication du vrai pack.
- Hors périmètre mais nécessaire : les écrans Réglages/Infos/Album étaient centrés sans défilement, le contenu débordait en paysage ; ajout de `overflow-y: auto` et marges automatiques (`.ecran`).
- Le champ de saisie impose `user-select: text` (le corps est en `user-select: none`, iOS refuserait la saisie sinon).
- Captures : `test-results/screens/<profil>/11-reglages.png`, `11b-reglages-saisie.png`, `11c-reglages-erreur.png`, `11d-reglages-accepte.png`, `12-sardine-photo.png`.

## Relecture
**Relecteur — 2026-11-24 — 🟡 approuvé avec réserves.**

Vérifications :
- `npm run check` : OK, 504 tests.
- e2e complet : OK, 493 réussis, 10 ignorés.
- Captures 11c, 11d et 12 vues : aucun débordement.
- `__sb` : absent de `dist/`.

Confidentialité OK :
- le champ est vidé dès la vérification ;
- aucun `console` ni `error.message` ;
- `crypto.subtle` n'apparaît que dans `pack.ts`.

Concurrence et robustesse OK : partie en cours, double toucher, écran quitté, révocation des URL après un succès seulement.

Écarts annoncés par le codeur : tous acceptés.

Important :
- **F1 — `controller.ts`, `codeSection`.** Après « Changer le code », un code faux, vide ou indisponible réaffiche « Code accepté » sans message, car `pack.content()` est testé avant `packError`.
  - Correction : drapeau `changingCode`.
  - Tests e2e : changement de code faux puis vide, depuis un pack déjà chargé. Le message est affiché, `packCode` reste inchangé et la photo reste sur la carte Sardine.

Mineur :
- **F2 — alignement.** `.code-secret` est aligné à gauche alors que l'écran est centré. Passer en `text-align: center`.
- **F3 — test « code devenu faux → oublié ».** Il doit aussi vérifier que jetons, niveau et historique sont conservés.
- **F4 — mesure du temps.** La durée inclut le téléchargement et la création des URL. Ne mesurer que `decryptPack` (R-T8).
- **F5 — annonce VoiceOver.** La zone `aria-live` est recréée à chaque rendu, donc VoiceOver risque de ne rien annoncer. Garder le même élément et ne changer que son texte.

**Opus — 2026-11-24 :** F1 à F5 sont confiés au codeur.

**Opus — 2026-11-24 — vérification des corrections (commit 70d0ce3) : 🟢.**
- `npm run check` OK (505 tests) ; e2e complet annoncé à 508 passés.
- F1 : deux tests e2e rouges avant la correction.
- Build sans `__sb`.
- Capture 11d sur iPhone SE : section centrée.
