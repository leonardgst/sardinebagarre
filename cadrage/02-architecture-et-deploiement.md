# 02 — Architecture et déploiement

> ✅ **Mis à jour après tes réponses du 10/11** : dépôt **public** → hébergement **GitHub Pages** ; contenu personnel dans un **pack chiffré** ; thème Sardine ; développement sous **Windows**.
>
> Étape B. On commence par expliquer le déploiement simplement, puis on compare les options et on tranche. Chaque décision est résumée en **ADR** (Architecture Decision Record : une fiche courte « contexte → décision → conséquences ») à la fin.

---

## 1. Le déploiement expliqué simplement

### 1.1 Ce qu'il faut pour qu'un jeu soit « jouable sur un iPhone »
Il y a deux grandes familles :

1. **Une application native** (comme celles de l'App Store), fabriquée avec les outils d'Apple (Xcode, Swift). Pour la mettre sur un iPhone qui n'est pas le tien de façon durable, Apple impose un **compte développeur payant (99 $/an)**. Avec un compte gratuit, une app installée depuis Xcode **expire au bout de 7 jours** et ne s'installe que sur un appareil branché à un Mac. Et Xcode n'existe pas sur Windows. Pour un cadeau, c'est éliminatoire.
2. **Une application web** : un ensemble de fichiers (HTML, CSS, JavaScript) qu'un navigateur télécharge depuis une adresse web et exécute. Aucune autorisation d'Apple n'est nécessaire.

### 1.2 Les mots à connaître
- **Site statique** : le jeu tourne entièrement dans le navigateur. Le serveur ne fait que **donner les fichiers**, il ne calcule rien. C'est le type de site le plus simple et le moins cher à héberger (souvent gratuit).
- **Hébergeur** : la société qui garde tes fichiers sur ses serveurs et les sert à l'adresse `https://<ton-pseudo>.github.io/sardinebagarre/`.
- **Build** (construction) : l'étape qui transforme ton code source (TypeScript, plusieurs fichiers) en fichiers optimisés que le navigateur comprend (dossier `dist/`). Commande : `npm run build`.
- **Déployer** : envoyer le résultat du build chez l'hébergeur. Avec la méthode retenue, c'est automatique : tu fais `git push` vers GitHub, l'hébergeur le voit, construit et publie en 1 à 2 minutes.
- **HTTPS** : connexion chiffrée (le cadenas). Obligatoire pour les fonctions avancées. Fourni gratuitement par l'hébergeur.
- **PWA** (Progressive Web App, « application web progressive ») : une application web qui ajoute deux fichiers :
  - un **manifeste** (`manifest.webmanifest`) : nom, icône, couleurs, « s'ouvre en plein écran sans barre d'adresse » ;
  - un **service worker** : un petit script que le navigateur garde de côté et qui **met en cache** tous les fichiers du jeu. Résultat : **le jeu marche hors ligne** (en avion, dans le métro) et se lance instantanément.
- **Installer une PWA** : sur iPhone, Safari › Partager › **« Sur l'écran d'accueil »**. Sur Mac (macOS Sonoma 14+), Safari › Fichier › **« Ajouter au Dock »**. Une icône apparaît et l'app s'ouvre dans sa propre fenêtre, sans interface de navigateur. Pour ta sœur, ça ressemble à une vraie app.
- **Mise à jour** : quand tu publies une nouvelle version, le service worker la télécharge au prochain lancement avec du réseau et l'applique au lancement suivant. Tu peux donc corriger un bug après Noël sans qu'elle ne fasse rien.

### 1.3 Le parcours complet, en une image
```
Ton PC Windows (Claude Code écrit le code)          prive/ (photos, tête, aboiement, messages)
   │                                                    │ npm run pack  (toi, avec le code secret)
   │                                                    ▼
   │                                              public/pack/pack.bin  (chiffré, illisible)
   │  git push (branche main)
   ▼
GitHub (dépôt PUBLIC : code + pack chiffré, jamais les photos en clair)
   │  GitHub Actions : vérifications → npm run build → déploiement
   ▼
GitHub Pages : https://<ton-pseudo>.github.io/sardinebagarre/
   ▼
iPhone / Mac de ta sœur (Safari → « Sur l'écran d'accueil » / « Ajouter au Dock »)
   → code secret saisi une fois → photos déchiffrées sur l'appareil ; tout marche hors ligne
```

---

## 2. Comparaison des approches techniques

Notes de 1 (mauvais) à 5 (excellent).

| Critère | **PWA (web installable)** | App native Swift/SwiftUI | Multiplateforme (Capacitor, Flutter, React Native) | Moteur de jeu (Godot export web/iOS) | Simple page web (sans PWA) |
|---|---|---|---|---|---|
| Coût | **5** — 0 € | 1 — 99 $/an pour iPhone durable | 1 pour iPhone (même contrainte Apple) ; 5 si export web | 1 pour iOS ; 5 en export web | 5 |
| Installation iPhone | **4** — 3 touchers dans Safari | 1 — expire au bout de 7 jours sans compte payant | 1 (natif) / 4 (web) | 1 / 3 (export web lourd) | 3 — favori, barre Safari visible |
| Installation Mac | **4** — Ajouter au Dock (macOS 14+) | 2 — app non signée : alerte Gatekeeper à contourner | 2 | 2 | 3 |
| Hors ligne | **5** — service worker | 5 | 4 | 3 — gros fichiers WebAssembly | 1 |
| Maintenance / mises à jour | **5** — push = mise à jour pour tout le monde | 2 — réinstaller tous les 7 jours | 3 | 3 | 5 |
| Difficulté pour toi | **4** | 2 — Xcode, signature | 2 — deux couches d'outils | 3 — un éditeur de plus à apprendre | 5 |
| Qualité du code produit par Claude | **5** — TypeScript/web, son terrain le plus solide, tests faciles | 4 | 3 — plus de configuration, plus de pièges | 3 — GDScript, moins d'exemples, tests plus durs | 5 |
| Fidélité au rendu (animations, tactile) | 4 | 5 | 4 | 5 | 4 |
| **Total** | **36** | 22 | 20–28 | 21–25 | 31 |

**Verdict : PWA.** C'est la seule option à 0 € qui s'installe durablement sur un iPhone, marche hors ligne et se met à jour toute seule. C'est aussi là où Claude Code produit le code le plus fiable et le plus facile à tester.

---

## 3. Hébergeurs gratuits

| | **Cloudflare Pages** | GitHub Pages | Netlify (gratuit) | Vercel (Hobby) |
|---|---|---|---|---|
| Dépôt **privé** sur compte gratuit | **Oui** | **Non** (GitHub Pages en dépôt privé exige GitHub Pro, Team ou Enterprise) | Oui | Oui |
| Bande passante | Requêtes statiques illimitées | ~100 Go/mois (limite « souple ») | Système de **crédits** (300/mois, environ 15 par déploiement de production et 20 par Go servi) ; le site est **mis en pause** quand ils sont épuisés | 100 Go/mois |
| Builds | 500 / mois, 1 à la fois, 20 min max | Via GitHub Actions (~10 builds/h, limite souple) | Comptés en crédits | Inclus |
| Usage autorisé | Libre | Pas pour un usage commercial | Libre | **Personnel, non commercial** uniquement |
| Aperçu par branche (URL de test) | **Oui**, automatique | Non (un seul site) | Oui | Oui |
| Adresse gratuite | `projet.pages.dev` | `pseudo.github.io/projet` | `projet.netlify.app` | `projet.vercel.app` |
| Complexité | Faible (connexion GitHub en 5 clics) | Très faible | Faible | Faible |

Limites relevées le 10/11/2026 sur les pages officielles et des comparatifs récents. À revérifier au moment de créer le compte : les offres gratuites changent souvent (Netlify est passé aux crédits en 2025).

**Choix (après ta réponse Q6 : dépôt public) : GitHub Pages.** Tout est au même endroit (code, vérifications, publication) et il n'y a pas de compte en plus à créer. Les limites (1 Go, ~100 Go/mois) sont très loin de nos besoins (site de quelques Mo, une joueuse).

Ce qu'on perd par rapport à Cloudflare : les **aperçus par branche** (un seul site). Notre solution :
- **jusqu'au 20/12**, le site publié sert de terrain de test : ta sœur ne connaît pas l'adresse ;
- **après la v1.0.0**, on ne publie sur `main` qu'après un test local sur iPhone (`npm run dev:https`, voir le plan, étape 3.2) ;
- la publication est faite par un workflow GitHub Actions (`.github/workflows/deploy.yml`) déclenché à chaque push sur `main`, **seulement si les vérifications passent**.

À régler dans Vite : `base: '/sardinebagarre/'`, car le site est servi dans un sous-dossier. Le manifeste et le service worker doivent utiliser ce chemin (piège classique, noté dans CLAUDE.md).

*Cloudflare Pages reste le plan B* si un jour tu repasses le dépôt en privé.

---

## 4. Pile technique retenue

| Brique | Choix | Pourquoi |
|---|---|---|
| Langage | **TypeScript** (mode `strict`) | Les types attrapent les erreurs avant l'exécution. Claude écrit un TypeScript excellent. |
| Interface | **TypeScript « vanilla »** (DOM natif, sans framework) | Un plateau de 25 cartes ne justifie pas React. Moins de dépendances = moins de mises à jour et un mode hors ligne léger. Les 25 éléments de carte sont créés une fois puis mis à jour (classes CSS), ce qui convient bien aux animations CSS de retournement. *Alternative crédible : Preact (3 ko), si l'UI se complique.* |
| Outil de build | **Vite** | Standard actuel : rapide, simple, serveur de développement avec rechargement instantané, et `vite --host` pour tester sur ton iPhone en Wi-Fi. |
| PWA | **vite-plugin-pwa** (Workbox) | Génère le manifeste et le service worker, gère les mises à jour (`registerType: 'autoUpdate'`). |
| Tests unitaires | **Vitest** | Intégré à Vite, rapide, même syntaxe que Jest. Pour toute la logique du jeu. |
| Tests de bout en bout + captures | **Playwright** (navigateur **WebKit**, profils iPhone) | WebKit est le moteur de Safari : c'est le plus proche de ce que verra ta sœur. Claude peut lancer les tests **et regarder les captures** pour contrôler le visuel. |
| Lint + formatage | **Biome** | Un seul outil remplace ESLint + Prettier, configuration minimale. |
| Hasard | PRNG à graine (`mulberry32`) dans la logique ; graine tirée avec `crypto.getRandomValues` dans l'UI | Tests reproductibles (même graine = même plateau). |
| Sons | **Web Audio API**, sons synthétisés dans le code | Zéro fichier, zéro droit d'auteur, très léger. |
| Graphismes | **SVG + CSS** originaux | Net à toutes les tailles (écran Retina), modifiable par Claude. |
| Intégration continue + publication | **GitHub Actions** (gratuit et illimité pour un dépôt public) | À chaque push : types, lint, tests, contrôle de confidentialité, build ; sur `main` : publication GitHub Pages. |
| Pack personnel | Script Node `scripts/pack.mjs` avec **sharp** (redimensionnement) + **Web Crypto** (AES-GCM, PBKDF2) ; déchiffrement dans le navigateur avec la même API | Aucune photo en clair dans le dépôt public (ADR-011). Web Crypto est standard sur Safari et Node. |
| HTTPS en local | **@vitejs/plugin-basic-ssl** (script `dev:https`) | Web Crypto et le service worker exigent HTTPS sur un iPhone. |
| Node.js | Version LTS en cours (22 ou plus) | Requis par Vite et Claude Code. Sous Windows : `winget install OpenJS.NodeJS.LTS`. |

---

## 5. Séparation logique / interface

```
scripts/
  pack.mjs                  ← lancé par toi : prive/ → public/pack/pack.bin (chiffré)
  verifier-confidentialite.mjs  ← CI : aucune image/son/fichier privé en clair dans Git
src/
  logic/      ← PUR : aucune dépendance au navigateur (pas de window, document, localStorage, Date.now, Math.random)
    types.ts      Card, Board, RoundState, GameState, Outcome…
    configs.ts    la table du §3 de la spec (80 entrées)
    rng.ts        mulberry32(seed) → () => number
    board.ts      generateBoard(config, rng) ; indicateurs
    round.ts      flip(), toggleMemo(), quit() : fonctions pures état → nouvel état
    levels.ts     nextLevel(history), pickBoardEntry(level, rng)
    game.ts       enchaînement des parties, encaissement, plafond 50 000, partie interrompue (R-68)
    album.ts      achat et déblocage des photos (pur : prix, ordre, solde)
    save.ts       serialize/deserialize + validation + migration (pur)
  ui/         ← tout ce qui touche au navigateur
    main.ts       point d'entrée : charge la sauvegarde, crée le contrôleur
    controller.ts relie les entrées → logic → rendu → sauvegarde
    render/       board.ts, hud.ts, dialogs.ts, menu.ts
    input.ts      tactile, souris, clavier
    anim.ts       séquences d'animation (promesses), « toucher pour accélérer »
    audio.ts      synthèse Web Audio
    storage.ts    adaptateur localStorage (seul fichier qui l'utilise)
    pack.ts       déchiffrement du pack (Web Crypto) → URL blob: des photos, tête, aboiement, messages
    texts.fr.ts   tous les textes
    styles/       CSS
```

**Règle d'or** : `src/logic/` n'importe **jamais** `src/ui/`. Biome le vérifie avec une règle d'imports interdits (et un test d'architecture peut aussi le faire).

Principe : **cœur fonctionnel, coquille impérative**. La logique est un ensemble de fonctions `(état, action) → nouvel état` faciles à tester sans navigateur, et l'UI se contente d'afficher l'état et de transmettre les gestes. Avantage pour Claude : 90 % des règles sont testées en millisecondes par Vitest, sans écran.

---

## 6. Propriété intellectuelle et vie privée

### 6.1 Propriété intellectuelle : réglée par le thème Sardine
- **Les règles** d'un jeu ne sont pas protégées par le droit d'auteur : les recréer est légal.
- Avec ta décision Q4 (bombe = Sardine) et Q5 (nom « Sardinebagarre »), **plus aucun élément Pokémon n'apparaît** : ni personnage, ni nom, ni graphisme, ni son. Le risque devient quasi nul, même avec un dépôt et un site publics.
- Il reste deux précautions :
  - ne jamais ajouter de ressource extraite d'un jeu (sprite, son, police) ;
  - dans le README et les docs, on peut écrire « inspiré de la Voltorbataille de Pokémon HeartGold/SoulSilver ». C'est un usage descriptif, mais on n'utilise pas ces noms comme titre du jeu.
- Ceci n'est pas un avis juridique (je ne suis pas juriste), seulement les pratiques prudentes courantes.

### 6.2 Vie privée : le vrai sujet maintenant
Le dépôt est **public** : n'importe qui peut lire tout ce qui y est commité, **y compris dans l'historique**. Supprimer un fichier ne l'efface pas des anciens commits. D'où ces règles :

| Contenu | Où il vit | Visible publiquement ? |
|---|---|---|
| Photos (Sardine, famille, chats), tête de Sardine, aboiement enregistré | `prive/` (sur ton PC uniquement, ignoré par Git) → chiffrés dans `public/pack/pack.bin` | **Non** : seul le fichier chiffré est publié |
| Message de bienvenue, messages avec des prénoms | `prive/pack.json` → chiffré | Non |
| Messages drôles génériques | `src/ui/texts.fr.ts` | Oui (sans problème) |
| Code secret | Ta tête + la carte cadeau | Non : **jamais** dans un fichier du dépôt ni dans une conversation avec Claude |
| Ton adresse e-mail | Métadonnées des commits | À masquer : réglage GitHub « Keep my email addresses private » + adresse `…@users.noreply.github.com` dans `git config` (étape 0.1) |

Garde-fous automatiques :
1. `.gitignore` contient `prive/`.
2. `scripts/verifier-confidentialite.mjs` en CI : échec si une image ou un son est commité ailleurs que dans les dossiers autorisés (icônes, dessins), ou si `pack.bin` n'est pas chiffré (spec R-127).
3. `.claude/settings.json` **interdit à Claude de lire `prive/`** : Claude n'a pas besoin de voir les photos de ta famille. C'est toi qui lances `npm run pack`.
4. Le relecteur vérifie ce point à chaque revue.

**Si une photo est commitée par erreur** : ne pas pousser. Si c'est déjà poussé, prévenir Opus, qui t'aidera à réécrire l'historique (`git filter-repo`) et à forcer la mise à jour, puis à changer le code secret. C'est la seule situation où un `push --force` est justifié, et c'est toi qui le lances, à la main.

## 7. Installation par ta sœur (pas à pas)

### 7.1 iPhone (Safari)
1. Scanner le QR code de la carte cadeau avec l'appareil photo (il pointe vers `https://<ton-pseudo>.github.io/sardinebagarre/`), puis toucher le lien jaune. Le jeu s'ouvre **dans Safari** (important : pas dans un autre navigateur, ni dans l'aperçu intégré d'une app de messagerie).
2. Toucher le bouton **Partager** (carré avec une flèche vers le haut).
3. Faire défiler et toucher **« Sur l'écran d'accueil »**. Laisser « Ouvrir en tant qu'app web » activé si l'option apparaît.
4. Toucher **Ajouter**. L'icône apparaît sur l'écran d'accueil.
5. Lancer le jeu **depuis l'icône** (et non depuis Safari) : c'est là que la progression est sauvegardée.
6. Au premier lancement, saisir le **code secret** imprimé sur la carte : les photos et le message apparaissent.

À savoir : la progression de l'app installée est **séparée** de celle de l'onglet Safari. Il suffit de jouer depuis l'icône.

### 7.2 Mac (Safari, macOS Sonoma 14 ou plus récent)
1. Ouvrir le lien dans **Safari**.
2. Menu **Fichier › Ajouter au Dock…** (ou bouton Partager › Ajouter au Dock).
3. Valider le nom et l'icône, puis cliquer sur **Ajouter**.
4. Lancer depuis le Dock ou le Launchpad, puis saisir le code secret (une fois par appareil).

*Mac plus ancien* : utiliser Chrome › menu ⋮ › « Caster, enregistrer et partager » › « Installer la page en tant qu'application », ou simplement un favori.

### 7.3 Ce que tu prépares pour elle
- Une **carte imprimable** (A6) avec le QR code de l'adresse, les étapes en images, ton message et le **code secret**. À générer en phase 6 (étape 6.1 du plan).

---

## 8. Décisions (ADR courts)

> Dans le dépôt, chaque ADR deviendra un fichier `docs/decisions/ADR-00X-titre.md` (modèle fourni dans `repo-init/docs/decisions/_modele.md`).

**ADR-001 — Application web installable (PWA)**
Contexte : 0 €, iPhone + Mac, pas de compte Apple Developer. Décision : PWA. Conséquences : installation via Safari, mode hors ligne grâce au service worker, pas de notifications ni d'App Store (inutiles ici).

**ADR-002 — Dépôt GitHub public + GitHub Pages** *(remplace la version « privé + Cloudflare »)*
Contexte : tu préfères un dépôt public (Q6), et GitHub Pages est gratuit pour les dépôts publics. Décision : publication par GitHub Actions à chaque push sur `main`, après les vérifications ; `base: '/sardinebagarre/'`. Conséquences : pas d'aperçu par branche (le site sert de terrain de test jusqu'au 20/12, puis tests locaux en HTTPS) ; obligation absolue de ne rien commiter de personnel en clair (ADR-011).

**ADR-003 — TypeScript strict + Vite, sans framework d'UI**
Contexte : petite UI, priorité à la simplicité et à la légèreté hors ligne. Décision : DOM natif, éléments créés une fois puis mis à jour. Conséquences : un peu plus de code d'affichage manuel ; aucune dépendance d'UI à maintenir. À réévaluer (Preact) si `src/ui/render` dépasse environ 800 lignes.

**ADR-004 — Vitest pour la logique, Playwright WebKit pour le bout en bout et le visuel**
Décision : chaque règle de la spec a au moins un test Vitest ; parcours clés et captures d'écran avec Playwright (WebKit, profils iPhone SE, iPhone 15, bureau). Conséquences : Claude peut vérifier son propre travail, y compris visuellement.

**ADR-005 — Biome pour le lint et le formatage**
Décision : `biome check` en CI et après chaque modification (hook). Conséquences : un seul outil ; moins de plugins qu'ESLint (acceptable ici).

**ADR-006 — Cœur logique pur, hasard injecté**
Décision : `src/logic` sans accès au navigateur ; PRNG à graine passé en paramètre. Conséquences : tests déterministes ; un paramètre de développement `?seed=` permet de rejouer un plateau précis.

**ADR-007 — Ressources originales et thème Sardine**
Décision : aucune ressource Nintendo ; carte-bombe = tête de Sardine (photo du pack) avec une tête de chien dessinée en secours ; sons synthétisés, aboiement enregistré en option ; nom « Sardinebagarre ». Conséquences : risque de propriété intellectuelle quasi nul ; dépendance à des contenus personnels fournis par toi (dates dans le plan).

**ADR-008 — Sauvegarde locale du niveau, sans la partie en cours** *(décision Q9)*
Décision : `localStorage`, une clé, JSON versionné : jetons, niveau, historique, album, réglages, stats, code. La partie en cours n'est pas sauvegardée : une partie interrompue est oubliée sans pénalité (R-68). Conséquences : code plus simple ; on peut changer de plateau en fermant l'app ; si iOS ferme l'app en arrière-plan, la partie en cours est perdue.

**ADR-009 — En cas de désaccord entre sources, le code décompilé fait foi**
Décision : hiérarchie S1 > S2 > S3 (spec §0). Conséquences : comportements parfois différents de ce que disent les wikis (niveau 8, défaite au niveau 8), documentés et testés.

**ADR-010 — Placement des cartes par mélange plutôt que par tirage avec abandon**
Décision : on garantit toujours les comptes exacts de la configuration. Conséquence : écart volontaire et invisible avec un cas rarissime de l'original (carte sautée après 100 tirages ratés).

**ADR-011 — Pack personnel chiffré**
Contexte : dépôt et site publics, mais photos de famille privées. Options : (a) dépôt privé + URL secrète (les photos restent téléchargeables par qui connaît l'URL) ; (b) photos hors du jeu ; (c) **pack chiffré AES-GCM, clé dérivée d'un code secret de 4 mots**. Décision : (c). Conséquences : une tâche de plus (script de pack + déchiffrement) ; ta sœur saisit un code une fois par appareil ; sans le code, le jeu reste jouable ; si le code fuit, il suffit de refaire le pack avec un nouveau code.

**ADR-012 — Les jetons débloquent un album photo**
Décision : album ordonné à prix croissants (spec §12) ; les thèmes visuels sont reportés en v2. Conséquences : la boucle de jeu a un but personnel ; les prix sont réglables dans le pack sans toucher au code.

**ADR-013 — iPhone d'abord, Mac en version iPhone centrée**
Contexte : Q11 (prêt à n'avoir qu'un appareil si c'est plus simple). Décision : on garde les deux ; le Mac affiche la mise en page iPhone centrée ; le clavier passe en priorité basse. Conséquences : environ 1 jour de travail en moins ; le Mac reste un bonus testé deux fois chez ton ami.

**ADR-014 — Développement sous Windows**
Décision : scripts et hooks en Node (pas de bash), hooks lancés sans shell (exec form), `.gitattributes` qui impose les fins de ligne LF, projet hors de OneDrive (par exemple `C:\dev\sardinebagarre`). Conséquences : pas de Safari local ; Playwright WebKit plus tests réguliers sur ton iPhone.
