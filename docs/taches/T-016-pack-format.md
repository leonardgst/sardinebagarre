# T-016 — Fabriquer et lire le pack chiffré (sans interface)

| Champ | Valeur |
|---|---|
| Statut | terminée |
| Étape du plan | 3.3 (1ʳᵉ moitié ; l'intégration au jeu sera faite par T-017) |
| Branche | `t-016-pack-format` |
| Estimation | M (1–3 h) |
| Planifiée par | Opus — 2026-11-24 |
| Implémentée par | codeur (Sonnet) |

## Objectif
L'humain peut lancer `npm run pack` pour chiffrer `prive/` dans `public/pack/pack.bin`. Le module `src/ui/pack.ts` sait déchiffrer et décoder ce fichier avec le bon code, et refuse un mauvais code. Un pack de test (`tests/fixtures/pack-test.bin`, code `test-test-test-test`) permet de tout tester sans jamais toucher à `prive/`.

## Règles concernées
- `R-120` — source privée `prive/` (`pack.json`, `photos/*.jpg`, `sardine-tete.jpg`, plus tard `aboiement.m4a`)
- `R-121` — `npm run pack` : code saisi en masqué, photos 1 280 px max, JPEG qualité 80, un seul fichier `public/pack/pack.bin`
- `R-122` — AES-GCM 256, PBKDF2-SHA-256 600 000 itérations, sel 16 octets, IV 12 octets, en-tête `SBPACK1` + sel + IV + chiffré ; code normalisé
- `R-123` — code de 4 mots
- `R-124` — échec d'authentification GCM = mauvais code
- `R-115` — prix par défaut de l'album
- `R-127` — contrôle de confidentialité

## Décisions de cette tâche (Opus)
1. **Normalisation du code (R-122)**, appliquée **à l'identique** dans le script et dans le jeu :
   1. NFD, puis suppression des diacritiques ;
   2. passage en minuscules ;
   3. toute suite d'espaces, tirets, tirets bas ou points devient un seul `-` ;
   4. suppression des `-` en début et en fin.

   Ainsi `  Croquette Tempête-violon  sardine ` donne `croquette-tempete-violon-sardine`, et la joueuse peut taper des espaces au lieu des tirets.
2. **Format du fichier.**
   - **Externe :** `SBPACK1` (7 octets ASCII), puis le sel (16 octets), l'IV (12 octets) et le chiffré AES-GCM (étiquette de 16 octets comprise). Le sel et l'IV sont tirés au hasard à chaque `npm run pack`.
   - **Clair :** `SBDATA1` (7 octets ASCII), la longueur du JSON (uint32 petit-boutiste), le JSON en UTF-8, puis les fichiers binaires bout à bout.
   - **JSON (`PackIndex`) :**
     - `version: 1` ;
     - `welcome: string` ;
     - `head: Asset` ;
     - `photos: { id: string; caption: string; price: number; asset: Asset }[]`, dans l'ordre de l'album ;
     - `messages: Partial<Record<'sardine'|'won'|'suspense'|'levelUp'|'levelDown', string[]>>` ;
     - `bark?: Asset`.

     Un `Asset` vaut `{ offset: number; length: number; type: string }`, avec `offset` compté depuis le début de la zone binaire.
3. **Format source `prive/pack.json`** (en français, pour l'humain). Il est documenté par `prive-exemple/pack.json` (sans photos) et `prive-exemple/LISEZMOI.md` :
   - `bienvenue` : une chaîne ;
   - `tete` : `{ "fichier": "sardine-tete.jpg", "cadrage": { "x": 0.5, "y": 0.45, "zoom": 1 } }`.
     - `x` et `y` donnent le centre, en fraction de l'image ; `zoom` vaut au moins 1.
     - Le script en tire un carré JPEG de 512 px. Côté du carré : min(largeur, hauteur) / zoom. Il est centré sur (x, y), puis ramené dans l'image.
     - Le détourage en rond se fera en CSS (T-017).
   - `photos` : `[{ "fichier": "photos/01.jpg", "legende": "…", "prix": 100 }]`.
     - `prix` est facultatif ; par défaut, c'est le prix R-115 du même rang.
     - Les `id` (`p01`, `p02`, …) suivent l'ordre.
   - `messages` : `{ "sardine": [], "victoire": [], "suspense": [], "montee": [], "descente": [] }`. Chaque liste est facultative.
   - `aboiement` : facultatif.

   Les clés françaises sont traduites vers les clés anglaises du `PackIndex`.
4. **Code faible :** le script refuse un code normalisé de moins de 4 mots ou de moins de 16 caractères, avec un message clair. Le code du pack de test, `test-test-test-test`, passe.
5. **Saisie du code :** le script lit la variable d'environnement `PACK_CODE`. À défaut, il demande le code en saisie masquée, deux fois pour confirmation, sans écho. Il ne l'écrit jamais nulle part.
6. **Code partagé :**
   - `scripts/pack-lib.mjs` (Node) contient la normalisation, la dérivation de clé, le chiffrement, l'encodage du clair et la lecture de `pack.json`.
   - `src/ui/pack.ts` contient `normalizeCode`, `decryptPack(bytes, code)` et `decodePack(plain)`. C'est le seul fichier de `src/` qui utilise `crypto.subtle`.
   - Des tests d'aller-retour vérifient les deux implémentations l'une contre l'autre.

## Périmètre
**Inclus**
- `scripts/pack-lib.mjs`.
- `scripts/pack.mjs` :
  - options `--source <dossier>` (défaut `prive/`) et `--sortie <fichier>` (défaut `public/pack/pack.bin`) ;
  - affiche le nombre de photos, la taille finale et la durée, jamais le code.
- `scripts/pack-de-test.mjs` :
  - produit avec sharp des images factices (couleurs unies et texte, rien de personnel) dans un dossier temporaire ;
  - appelle la même chaîne que `pack.mjs`, avec le code `test-test-test-test` ;
  - écrit `tests/fixtures/pack-test.bin`, qui est commité : 3 photos, une tête, au moins un message par liste, sans aboiement.
- `src/ui/pack.ts` :
  - `normalizeCode`, `decryptPack` et `decodePack` ;
  - `decryptPack` lève `WrongCodeError` si l'authentification GCM échoue, et `BadPackError` si l'en-tête ou le format est invalide ;
  - le module renvoie des `Uint8Array` et des types, **sans** URL `blob:` ni DOM (ce sera T-017).
- `prive-exemple/pack.json` et `prive-exemple/LISEZMOI.md`. Le second explique :
  - comment remplir le fichier ;
  - le cadrage de la tête ;
  - les prix par défaut ;
  - puis `npm run pack`, `git status`, et le commit de `public/pack/pack.bin` seul.
- `package.json` : dépendance de développement `sharp` ; scripts `pack` et `pack:test`.
- `scripts/verifier-confidentialite.mjs` :
  - accepter `prive-exemple/`, qui ne contient aucune image ;
  - vérifier aussi que `tests/fixtures/pack-test.bin` commence par `SBPACK1`.

**Exclu**
- Toute interface (saisie du code, tête sur la carte, messages, album) : ce sera T-017 et la phase 4.
- **Interdit :** lancer `npm run pack` sur `prive/`, ou lire, lister ou créer `prive/`. Tous les tests passent par un dossier source temporaire (dans `os.tmpdir()`) ou par la fixture.
- Créer `public/pack/pack.bin` : c'est l'humain qui le fera.

## Fichiers
| Fichier | Action |
|---|---|
| `scripts/pack-lib.mjs`, `scripts/pack.mjs`, `scripts/pack-de-test.mjs` | créer |
| `src/ui/pack.ts` | créer |
| `tests/fixtures/pack-test.bin` | créer (produit par `npm run pack:test`) |
| `tests/ui/pack.test.ts`, `tests/scripts/pack.test.ts` (ou équivalent) | créer |
| `prive-exemple/pack.json`, `prive-exemple/LISEZMOI.md` | créer |
| `scripts/verifier-confidentialite.mjs` et son test | modifier |
| `package.json`, `package-lock.json` | modifier |

## Tests à écrire
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-122 normalisation du code` | `'  Croquette Tempête-violon  sardine '`, `'TEST_test.test test'` | `croquette-tempete-violon-sardine`, `test-test-test-test` |
| `R-122 aller-retour chiffrement Node → déchiffrement pack.ts` | petit pack construit en mémoire avec pack-lib | `decryptPack` + `decodePack` rendent le même index et les mêmes octets |
| `R-122 deux chiffrements du même contenu diffèrent` | même entrée, deux fois | sels et IV différents |
| `R-124 mauvais code refusé` | fixture, code `test-test-test-tesx` | `WrongCodeError` |
| `R-124 code de test accepté, avec variantes de saisie` | fixture, `'Test Test Test Test'` | index déchiffré : 3 photos, tête, messages |
| `R-122 en-tête invalide refusé` | octets ne commençant pas par `SBPACK1` ; fichier tronqué | `BadPackError` |
| `R-115 prix par défaut` | `pack.json` sans `prix` pour la 2ᵉ photo | `price` 200 |
| `R-121 photos réduites à 1 280 px` | image source 3 000 × 2 000 (générée) | photo décodée de 1 280 px de large au plus, JPEG |
| `R-120 tête carrée 512 px selon le cadrage` | image source 800 × 600, cadrage x 0,5 / y 0,5 / zoom 1 | JPEG 512 × 512 |
| `R-123 code faible refusé par le script` | `PACK_CODE=sardine` | sortie en erreur, aucun fichier écrit |
| `R-127 fixture de test bien formée` | `tests/fixtures/pack-test.bin` | commence par `SBPACK1` |

## Critères d'acceptation
- [x] `npm run check` passe, ainsi que `E2E_PORT=5199 npm run e2e` (aucune régression).
- [x] `npm run pack:test` reproduit la fixture. Le contenu change à chaque fois à cause du sel, mais reste valide.
- [x] `npm run pack -- --source <dossier temporaire>` avec `PACK_CODE` fonctionne (test automatique).
- [x] Le codeur ne lance **jamais** `npm run pack` sans `--source`, car le script lirait alors `prive/`.
- [x] Aucune image n'est commitée hors des dossiers autorisés ; `git status` est vérifié avant chaque commit.
- [x] Le compte rendu note le temps de dérivation et de déchiffrement de la fixture en Node (repère pour R-T8).

## Pièges connus
- En Node 24 comme dans Vitest, `globalThis.crypto.subtle` existe : pas besoin d'importer `node:crypto` dans `pack.ts`.
- `crypto.subtle.decrypt` attend un `BufferSource` : attention aux `Uint8Array` qui sont des vues sur un `ArrayBuffer` plus grand (`byteOffset`).
- Sous Windows, la saisie masquée passe par `process.stdin.setRawMode`. Gérer Ctrl+C et le retour arrière. Si l'entrée n'est pas un terminal (TTY), exiger `PACK_CODE`.
- Taille : le service worker n'embarque que les fichiers de 10 Mo au plus. Le script affiche un **avertissement** au-delà de 8 Mo.

## Questions
- (résolue) sharp installé par l'humain.

## Compte rendu
Terminée. Fixture `tests/fixtures/pack-test.bin` : 9 355 octets. En Node 24 : dérivation PBKDF2 (600 000 itérations) environ 86 ms, déchiffrement AES-GCM environ 0,5 ms (repère R-T8). `npm run check` : 444 tests verts. sharp ^0.35.5 installé par l'humain. Écart : ajout de `lireIndex` dans pack-lib (remplace les décalages en dur de pack.mjs).

## Relecture
**Relecteur — 2026-11-24 — 🟡 approuvé avec réserves.** Aucune fuite trouvée ; format conforme à R-122 et à ADR-011 ; `npm run check` OK (444 tests). Le code n'est jamais affiché, journalisé ni écrit ; les fichiers temporaires vont dans `os.tmpdir()` et sont supprimés ; `crypto.subtle` n'apparaît que dans `pack.ts` ; sharp retire les métadonnées EXIF (GPS compris) ; `verifier-confidentialite.mjs` n'a pas été assoupli.

Important (avant fusion) :
- **E1 — `decodePack`.**
  - Problème : `photos` est parcouru avant le contrôle `Array.isArray`, ce qui donne une `TypeError` au lieu d'une `BadPackError`. Par ailleurs, `welcome`, `id`, `caption`, `price` et `messages` ne sont pas validés.
  - Correction : tout valider, puis ajouter un test par branche `BadPackError`.
- **E2 — codes publiés acceptés.** `verifierCode` accepte l'exemple `croquette-tempete-violon-sardine` et le code de test `test-test-test-test`, tous deux publics. Correction : les refuser. Le LISEZMOI se contredit aussi : son exemple contient « sardine ».
- **E3 — normalisation.**
  - Problèmes : œ, æ et ß ne sont pas ramenés à des lettres simples, et les tirets typographiques (« – », « — ») ne sont pas des séparateurs.
  - Correction : `verifierCode` exige, après normalisation, la forme `^[a-z0-9]+(-[a-z0-9]+){3,}# T-016 — Fabriquer et lire le pack chiffré (sans interface)

| Champ | Valeur |
|---|---|
| Statut | terminée |
| Étape du plan | 3.3 (1ʳᵉ moitié ; l'intégration au jeu sera faite par T-017) |
| Branche | `t-016-pack-format` |
| Estimation | M (1–3 h) |
| Planifiée par | Opus — 2026-11-24 |
| Implémentée par | codeur (Sonnet) |

## Objectif
L'humain peut lancer `npm run pack` pour chiffrer `prive/` dans `public/pack/pack.bin`. Le module `src/ui/pack.ts` sait déchiffrer et décoder ce fichier avec le bon code, et refuse un mauvais code. Un pack de test (`tests/fixtures/pack-test.bin`, code `test-test-test-test`) permet de tout tester sans jamais toucher à `prive/`.

## Règles concernées
- `R-120` — source privée `prive/` (`pack.json`, `photos/*.jpg`, `sardine-tete.jpg`, plus tard `aboiement.m4a`)
- `R-121` — `npm run pack` : code saisi en masqué, photos 1 280 px max, JPEG qualité 80, un seul fichier `public/pack/pack.bin`
- `R-122` — AES-GCM 256, PBKDF2-SHA-256 600 000 itérations, sel 16 octets, IV 12 octets, en-tête `SBPACK1` + sel + IV + chiffré ; code normalisé
- `R-123` — code de 4 mots
- `R-124` — échec d'authentification GCM = mauvais code
- `R-115` — prix par défaut de l'album
- `R-127` — contrôle de confidentialité

## Décisions de cette tâche (Opus)
1. **Normalisation du code (R-122)**, appliquée **à l'identique** dans le script et dans le jeu :
   1. NFD, puis suppression des diacritiques ;
   2. passage en minuscules ;
   3. toute suite d'espaces, tirets, tirets bas ou points devient un seul `-` ;
   4. suppression des `-` en début et en fin.

   Ainsi `  Croquette Tempête-violon  sardine ` donne `croquette-tempete-violon-sardine`, et la joueuse peut taper des espaces au lieu des tirets.
2. **Format du fichier.**
   - **Externe :** `SBPACK1` (7 octets ASCII), puis le sel (16 octets), l'IV (12 octets) et le chiffré AES-GCM (étiquette de 16 octets comprise). Le sel et l'IV sont tirés au hasard à chaque `npm run pack`.
   - **Clair :** `SBDATA1` (7 octets ASCII), la longueur du JSON (uint32 petit-boutiste), le JSON en UTF-8, puis les fichiers binaires bout à bout.
   - **JSON (`PackIndex`) :**
     - `version: 1` ;
     - `welcome: string` ;
     - `head: Asset` ;
     - `photos: { id: string; caption: string; price: number; asset: Asset }[]`, dans l'ordre de l'album ;
     - `messages: Partial<Record<'sardine'|'won'|'suspense'|'levelUp'|'levelDown', string[]>>` ;
     - `bark?: Asset`.

     Un `Asset` vaut `{ offset: number; length: number; type: string }`, avec `offset` compté depuis le début de la zone binaire.
3. **Format source `prive/pack.json`** (en français, pour l'humain). Il est documenté par `prive-exemple/pack.json` (sans photos) et `prive-exemple/LISEZMOI.md` :
   - `bienvenue` : une chaîne ;
   - `tete` : `{ "fichier": "sardine-tete.jpg", "cadrage": { "x": 0.5, "y": 0.45, "zoom": 1 } }`.
     - `x` et `y` donnent le centre, en fraction de l'image ; `zoom` vaut au moins 1.
     - Le script en tire un carré JPEG de 512 px. Côté du carré : min(largeur, hauteur) / zoom. Il est centré sur (x, y), puis ramené dans l'image.
     - Le détourage en rond se fera en CSS (T-017).
   - `photos` : `[{ "fichier": "photos/01.jpg", "legende": "…", "prix": 100 }]`.
     - `prix` est facultatif ; par défaut, c'est le prix R-115 du même rang.
     - Les `id` (`p01`, `p02`, …) suivent l'ordre.
   - `messages` : `{ "sardine": [], "victoire": [], "suspense": [], "montee": [], "descente": [] }`. Chaque liste est facultative.
   - `aboiement` : facultatif.

   Les clés françaises sont traduites vers les clés anglaises du `PackIndex`.
4. **Code faible :** le script refuse un code normalisé de moins de 4 mots ou de moins de 16 caractères, avec un message clair. Le code du pack de test, `test-test-test-test`, passe.
5. **Saisie du code :** le script lit la variable d'environnement `PACK_CODE`. À défaut, il demande le code en saisie masquée, deux fois pour confirmation, sans écho. Il ne l'écrit jamais nulle part.
6. **Code partagé :**
   - `scripts/pack-lib.mjs` (Node) contient la normalisation, la dérivation de clé, le chiffrement, l'encodage du clair et la lecture de `pack.json`.
   - `src/ui/pack.ts` contient `normalizeCode`, `decryptPack(bytes, code)` et `decodePack(plain)`. C'est le seul fichier de `src/` qui utilise `crypto.subtle`.
   - Des tests d'aller-retour vérifient les deux implémentations l'une contre l'autre.

## Périmètre
**Inclus**
- `scripts/pack-lib.mjs`.
- `scripts/pack.mjs` :
  - options `--source <dossier>` (défaut `prive/`) et `--sortie <fichier>` (défaut `public/pack/pack.bin`) ;
  - affiche le nombre de photos, la taille finale et la durée, jamais le code.
- `scripts/pack-de-test.mjs` :
  - produit avec sharp des images factices (couleurs unies et texte, rien de personnel) dans un dossier temporaire ;
  - appelle la même chaîne que `pack.mjs`, avec le code `test-test-test-test` ;
  - écrit `tests/fixtures/pack-test.bin`, qui est commité : 3 photos, une tête, au moins un message par liste, sans aboiement.
- `src/ui/pack.ts` :
  - `normalizeCode`, `decryptPack` et `decodePack` ;
  - `decryptPack` lève `WrongCodeError` si l'authentification GCM échoue, et `BadPackError` si l'en-tête ou le format est invalide ;
  - le module renvoie des `Uint8Array` et des types, **sans** URL `blob:` ni DOM (ce sera T-017).
- `prive-exemple/pack.json` et `prive-exemple/LISEZMOI.md`. Le second explique :
  - comment remplir le fichier ;
  - le cadrage de la tête ;
  - les prix par défaut ;
  - puis `npm run pack`, `git status`, et le commit de `public/pack/pack.bin` seul.
- `package.json` : dépendance de développement `sharp` ; scripts `pack` et `pack:test`.
- `scripts/verifier-confidentialite.mjs` :
  - accepter `prive-exemple/`, qui ne contient aucune image ;
  - vérifier aussi que `tests/fixtures/pack-test.bin` commence par `SBPACK1`.

**Exclu**
- Toute interface (saisie du code, tête sur la carte, messages, album) : ce sera T-017 et la phase 4.
- **Interdit :** lancer `npm run pack` sur `prive/`, ou lire, lister ou créer `prive/`. Tous les tests passent par un dossier source temporaire (dans `os.tmpdir()`) ou par la fixture.
- Créer `public/pack/pack.bin` : c'est l'humain qui le fera.

## Fichiers
| Fichier | Action |
|---|---|
| `scripts/pack-lib.mjs`, `scripts/pack.mjs`, `scripts/pack-de-test.mjs` | créer |
| `src/ui/pack.ts` | créer |
| `tests/fixtures/pack-test.bin` | créer (produit par `npm run pack:test`) |
| `tests/ui/pack.test.ts`, `tests/scripts/pack.test.ts` (ou équivalent) | créer |
| `prive-exemple/pack.json`, `prive-exemple/LISEZMOI.md` | créer |
| `scripts/verifier-confidentialite.mjs` et son test | modifier |
| `package.json`, `package-lock.json` | modifier |

## Tests à écrire
| Nom du test | Entrée | Attendu |
|---|---|---|
| `R-122 normalisation du code` | `'  Croquette Tempête-violon  sardine '`, `'TEST_test.test test'` | `croquette-tempete-violon-sardine`, `test-test-test-test` |
| `R-122 aller-retour chiffrement Node → déchiffrement pack.ts` | petit pack construit en mémoire avec pack-lib | `decryptPack` + `decodePack` rendent le même index et les mêmes octets |
| `R-122 deux chiffrements du même contenu diffèrent` | même entrée, deux fois | sels et IV différents |
| `R-124 mauvais code refusé` | fixture, code `test-test-test-tesx` | `WrongCodeError` |
| `R-124 code de test accepté, avec variantes de saisie` | fixture, `'Test Test Test Test'` | index déchiffré : 3 photos, tête, messages |
| `R-122 en-tête invalide refusé` | octets ne commençant pas par `SBPACK1` ; fichier tronqué | `BadPackError` |
| `R-115 prix par défaut` | `pack.json` sans `prix` pour la 2ᵉ photo | `price` 200 |
| `R-121 photos réduites à 1 280 px` | image source 3 000 × 2 000 (générée) | photo décodée de 1 280 px de large au plus, JPEG |
| `R-120 tête carrée 512 px selon le cadrage` | image source 800 × 600, cadrage x 0,5 / y 0,5 / zoom 1 | JPEG 512 × 512 |
| `R-123 code faible refusé par le script` | `PACK_CODE=sardine` | sortie en erreur, aucun fichier écrit |
| `R-127 fixture de test bien formée` | `tests/fixtures/pack-test.bin` | commence par `SBPACK1` |

## Critères d'acceptation
- [x] `npm run check` passe, ainsi que `E2E_PORT=5199 npm run e2e` (aucune régression).
- [x] `npm run pack:test` reproduit la fixture. Le contenu change à chaque fois à cause du sel, mais reste valide.
- [x] `npm run pack -- --source <dossier temporaire>` avec `PACK_CODE` fonctionne (test automatique).
- [x] Le codeur ne lance **jamais** `npm run pack` sans `--source`, car le script lirait alors `prive/`.
- [x] Aucune image n'est commitée hors des dossiers autorisés ; `git status` est vérifié avant chaque commit.
- [x] Le compte rendu note le temps de dérivation et de déchiffrement de la fixture en Node (repère pour R-T8).

## Pièges connus
- En Node 24 comme dans Vitest, `globalThis.crypto.subtle` existe : pas besoin d'importer `node:crypto` dans `pack.ts`.
- `crypto.subtle.decrypt` attend un `BufferSource` : attention aux `Uint8Array` qui sont des vues sur un `ArrayBuffer` plus grand (`byteOffset`).
- Sous Windows, la saisie masquée passe par `process.stdin.setRawMode`. Gérer Ctrl+C et le retour arrière. Si l'entrée n'est pas un terminal (TTY), exiger `PACK_CODE`.
- Taille : le service worker n'embarque que les fichiers de 10 Mo au plus. Le script affiche un **avertissement** au-delà de 8 Mo.

## Questions
- (résolue) sharp installé par l'humain.

## Compte rendu
Terminée. Fixture `tests/fixtures/pack-test.bin` : 9 355 octets. En Node 24 : dérivation PBKDF2 (600 000 itérations) environ 86 ms, déchiffrement AES-GCM environ 0,5 ms (repère R-T8). `npm run check` : 444 tests verts. sharp ^0.35.5 installé par l'humain. Écart : ajout de `lireIndex` dans pack-lib (remplace les décalages en dur de pack.mjs).

. Ajouter U+2010 à U+2015 aux séparateurs dans les deux implémentations.
- **E4 — `lireSource` ne valide pas `pack.json`.**
  - Problèmes : prix en texte, légende qui n'est pas du texte, fichier absent, JSON invalide, cadrage non numérique.
  - Correction : refuser avec des messages en français qui nomment le champ et le rang de la photo.
- **E5 — LISEZMOI incomplet.** Il manque :
  - les photos en JPEG (pas de HEIC) ;
  - la création des dossiers ;
  - les pièges du JSON ;
  - les règles du code secret ;
  - ce qu'il faut faire après le pack ;
  - comment ouvrir PowerShell.

Mineur :
- **E6 — options `salt` et `iv` d'`encryptPlain` inutilisées.** Ce code mort permettrait de réutiliser un IV fixe ; à supprimer.
- **E7 — tests manquants :**
  - seuils de `verifierCode` ;
  - tête cadrée dans un coin (x 1, y 1, zoom 2 sur 800 × 600 : carré de 300 px, left 500, top 300) ;
  - absence du code dans `stderr` ;
  - aboiement dans l'aller-retour.
- **E8 — prix au-delà de 12 photos.** Le LISEZMOI dit que le dernier prix est repris : c'est une règle inventée.
- **E9 — sans terminal interactif.** Le message invite à utiliser `PACK_CODE`, et le code finit dans l'historique. Il faut plutôt conseiller PowerShell.
- **E10 — saisie masquée.** Il faut ignorer les séquences d'échappement et les caractères de contrôle, et comparer les deux saisies après normalisation.
- **E11 — contrôle d'en-tête dupliqué** dans `verifier-confidentialite.mjs`.
- **E12 — journal.** Le statut de T-016 n'est pas à jour.

Notes pour T-017 :
- refuser un code vide avant `decryptPack` ;
- ne jamais afficher `error.message` ;
- mesurer R-T8 sur iPhone.

**Opus — 2026-11-24 :**
- **E1 à E11** sont confiés au codeur.
- **E8, décision :** au-delà de la 12ᵉ photo, le prix est **obligatoire**. Le script refuse une photo sans prix à partir de la 13ᵉ, et rien n'est inventé.
- **E3, décision :** la forme ASCII du code est imposée et les tirets typographiques U+2010 à U+2015 deviennent des séparateurs. Après normalisation, œ, æ et ß ne posent donc plus de problème, puisque le code imprimé ne peut pas en contenir.
- **E12** est fait par Opus.

**Opus — 2026-11-24 — vérification des corrections (commit 033e229) : 🟢.**
- `npm run check` OK (492 tests) ; e2e annoncé à 433 passés.
- Les tests ont été écrits après le code. Contre-épreuves faites par Opus : chaque protection supprimée fait échouer au moins un test.
  - Codes publics acceptés : 1 test rouge.
  - Contrôle `Array.isArray(photos)` retiré : 2 tests rouges.
  - Forme ASCII du code non imposée : 2 tests rouges.
- LISEZMOI complété par Opus : enregistrement en UTF-8, `npm run check` avant le commit, copie de `prive/` sur clé USB, publication, code noté sur papier.
