# T-016 — Fabriquer et lire le pack chiffré (sans interface)

| Champ | Valeur |
|---|---|
| Statut | planifiée |
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
- [ ] `npm run check` passe, ainsi que `E2E_PORT=5199 npm run e2e` (aucune régression).
- [ ] `npm run pack:test` reproduit la fixture. Le contenu change à chaque fois à cause du sel, mais reste valide.
- [ ] `npm run pack -- --source <dossier temporaire>` avec `PACK_CODE` fonctionne (test automatique).
- [ ] Le codeur ne lance **jamais** `npm run pack` sans `--source`, car le script lirait alors `prive/`.
- [ ] Aucune image n'est commitée hors des dossiers autorisés ; `git status` est vérifié avant chaque commit.
- [ ] Le compte rendu note le temps de dérivation et de déchiffrement de la fixture en Node (repère pour R-T8).

## Pièges connus
- En Node 24 comme dans Vitest, `globalThis.crypto.subtle` existe : pas besoin d'importer `node:crypto` dans `pack.ts`.
- `crypto.subtle.decrypt` attend un `BufferSource` : attention aux `Uint8Array` qui sont des vues sur un `ArrayBuffer` plus grand (`byteOffset`).
- Sous Windows, la saisie masquée passe par `process.stdin.setRawMode`. Gérer Ctrl+C et le retour arrière. Si l'entrée n'est pas un terminal (TTY), exiger `PACK_CODE`.
- Taille : le service worker n'embarque que les fichiers de 10 Mo au plus. Le script affiche un **avertissement** au-delà de 8 Mo.

## Questions

## Compte rendu

## Relecture
