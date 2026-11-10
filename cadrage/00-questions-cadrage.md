# 00 — Questions de cadrage

> ✅ **Tes réponses du 10/11/2026 sont intégrées** : voir la section « Décisions retenues » en fin de document. Elles remplacent les choix par défaut (★) proposés ci-dessous.

> Étape A. Pour chaque question : pourquoi elle compte, les options, **ma recommandation par défaut** (★).
> Tous les autres documents partent de ces recommandations par défaut. La colonne « Si tu réponds autrement » dit ce qui change.
>
> Les trois questions à traiter en priorité sont marquées 🔴.

---

## 1. Ta sœur et ses appareils

### Q1 🔴 Quelles versions d'iOS et de macOS a-t-elle ? Quel navigateur sur le Mac ?
- **Pourquoi** : tout le déploiement repose sur Safari. Sur iPhone, « Sur l'écran d'accueil » marche depuis longtemps. Sur Mac, **« Ajouter au Dock » demande macOS Sonoma (14) ou plus récent** avec Safari 17+. Sur un Mac plus ancien, elle jouera dans un onglet Safari ou Chrome (ça marche, c'est juste moins joli).
- **Options** : récupérer l'info discrètement (Réglages › Général › Informations sur l'iPhone ; menu  › À propos de ce Mac).
- ★ **Défaut** : iOS 17+ et macOS 14+. On teste aussi en mode « onglet Safari » au cas où.
- **Si tu réponds autrement** : macOS < 14 → on documente l'installation via Chrome (« Installer la page en tant qu'application ») ou un simple favori. iOS < 16 → on vérifie le service worker plus tôt (phase 3).

### Q2 🔴 Est-ce une surprise ?
- **Pourquoi** : si c'est une surprise, tu ne pourras pas installer ni tester sur *son* iPhone avant Noël. Il faudra donc une installation très simple le jour J, et tu devras tester sur des appareils qui ressemblent aux siens.
- **Options** : (a) surprise totale ; (b) surprise, mais tu « empruntes » son téléphone 5 min le 24 ; (c) pas de surprise, elle teste en avant-première.
- ★ **Défaut** : (a) surprise. On prépare une **carte cadeau imprimable avec un QR code** et 4 étapes illustrées, et on teste sur ton iPhone (ou celui d'un proche) et ton Mac.
- **Si tu réponds autrement** : (c) → on ajoute une phase de bêta-test avec elle (semaine du 7 décembre) et on peut adapter les réglages à ses retours.

### Q3 A-t-elle déjà joué à la Voltorbataille sur DS ?
- **Pourquoi** : ça décide de l'importance du tutoriel et du degré de fidélité attendu (elle verra le moindre écart si elle connaît le jeu).
- ★ **Défaut** : elle connaît le jeu → fidélité maximale aux règles, un tutoriel court (3 écrans d'aide comme dans l'original).
- **Si non** : on ajoute un mode guidé à la première partie (bulles d'aide).

---

## 2. Identité visuelle et propriété intellectuelle

### Q4 🔴 Style graphique : fidèle au jeu ou original ?
- **Pourquoi** : c'est la question qui pèse le plus sur la propriété intellectuelle (voir `02`, section 6) et sur le temps de travail. Les sprites, la police, les sons et la musique de HeartGold/SoulSilver appartiennent à Nintendo / Game Freak / The Pokémon Company. Les **règles** d'un jeu, elles, ne sont pas protégées par le droit d'auteur.
- **Options** :
  - (a) ressources extraites du jeu (sprites, sons) : rendu identique, mais illégal à diffuser, et Claude refusera de redessiner le personnage ;
  - (b) **look « hommage » original** : même disposition (grille 5×5, indicateurs en bout de ligne et de colonne, cartes ×1/×2/×3), mais graphismes, créature-bombe, couleurs et sons créés pour le projet ;
  - (c) thème totalement différent (par exemple de Noël).
- ★ **Défaut** : (b). La « bombe » est une **créature électrique originale** dessinée en SVG pour le projet, et les sons sont synthétisés dans le navigateur (Web Audio), donc aucun fichier tiers. On peut ajouter un thème « Noël » activable en option.
- **Si tu choisis (a)** : il faudrait un dépôt **et** un site privés (protection par mot de passe, voir Q8), avec un risque juridique faible mais réel. Je le déconseille, et Claude Code ne produira pas ces ressources pour toi.

### Q5 Quel nom affiché ?
- **Pourquoi** : « Voltorbataille » et « Voltorbe » sont des noms de The Pokémon Company. Pour un cadeau privé sur une adresse non publiée, le risque est très faible. Sur une page indexée par Google, il augmente.
- **Options** : (a) « Voltorbataille » partout ; (b) nom original à l'écran (par ex. « Orbataille »), avec un clin d'œil privé (« Voltorbataille — édition [prénom] ») uniquement dans le message d'accueil ; (c) nom original partout.
- ★ **Défaut** : (b). Le dépôt (privé) peut s'appeler `voltorbataille`. Le site public et son manifeste utilisent le nom original, et la page contient `noindex`.
- **Si (a)** : rien ne change techniquement. Garde quand même `noindex` et une URL non devinable.

### Q6 Dépôt GitHub public ou privé ?
- **Pourquoi** : sur un compte GitHub gratuit, **GitHub Pages n'est disponible que pour les dépôts publics**. Un dépôt privé impose donc un autre hébergeur, Cloudflare Pages par exemple, qui accepte les dépôts privés gratuitement.
- ★ **Défaut** : **privé** (cadeau surprise, rien d'exposé) + **Cloudflare Pages**.
- **Si public** : GitHub Pages devient le choix le plus simple (tout chez GitHub). Ce n'est acceptable qu'avec le style original (Q4-b ou c).

---

## 3. Contenu et comportement du jeu

### Q7 Langue : français uniquement ?
- ★ **Défaut** : oui. Mais **tous les textes sont dans un seul fichier** (`src/ui/texts.fr.ts`), ce qui rend une traduction triviale plus tard.

### Q8 Faut-il protéger l'accès au site (mot de passe) ?
- **Pourquoi** : une adresse `*.pages.dev` est publique, mais personne ne la connaît. Cloudflare Access (gratuit jusqu'à 50 utilisateurs) peut exiger un code envoyé par e-mail. En contrepartie : une étape de plus pour ta sœur, et des interactions possibles avec le mode hors ligne.
- ★ **Défaut** : pas de mot de passe. URL non devinable + `noindex`.
- **Si oui** : il faut tester le mode hors ligne derrière Access dès la phase 3.

### Q9 Sauvegarde entre les sessions : que garde-t-on ?
- **Pourquoi** : sur DS, quitter la Voltorbataille (sortir de la table) **remet le niveau à 1** et efface l'historique des 5 dernières parties. Sur iPhone, l'appli peut être fermée par le système à tout moment : appliquer cette règle à la lettre serait frustrant.
- **Options** : (a) fidèle : chaque ouverture repart au niveau 1 (on garde seulement les jetons) ; (b) tout sauvegarder : jetons, niveau, historique, **partie en cours** (plateau, cartes retournées, mémo) ; (c) mixte.
- ★ **Défaut** : (b). On ajoute un bouton « Quitter la table » dans le menu, qui applique la règle d'origine (niveau 1) pour qui veut la fidélité absolue.
- **Si (a)** : on supprime la sauvegarde de la partie en cours et du niveau (moins de code).

### Q10 Que faire des jetons ? Et à 50 000 ?
- **Pourquoi** : dans le jeu, les jetons s'échangent contre des lots, et la boîte est plafonnée à **50 000**. Au-delà, le jeu refuse de lancer une partie.
- **Options** : (a) fidèle : plafond + message, puis bouton « Vider la boîte à jetons » dans les réglages ; (b) boutique de récompenses originales (thèmes, dos de cartes) ; (c) pas de plafond.
- ★ **Défaut** : (a) en v1, avec des **records** (meilleur gain, niveau 8 atteint, nombre de parties). La boutique (b) est une idée de v2 s'il reste du temps.

### Q11 Synchronisation Mac ↔ iPhone ?
- **Pourquoi** : une vraie synchro demande un serveur et un compte, donc ni gratuit ni simple.
- ★ **Défaut** : non. Chaque appareil a sa propre partie. En v2, éventuellement, un « code de sauvegarde » à copier-coller (export/import).

### Q12 Sons et musique ?
- **Options** : aucun ; effets sonores synthétisés ; effets + petite musique originale.
- ★ **Défaut** : **effets sonores synthétisés** (retournement, tic des jetons, explosion, victoire, montée/descente de niveau), avec un bouton muet mémorisé. Pas de musique en v1.
- **À savoir** : sur iPhone, le son ne démarre qu'après un premier toucher, et le bouton silencieux peut le couper. C'est normal (voir `06-risques`).

### Q13 Mémo : interaction fidèle ou améliorée ?
- **Pourquoi** : sur DS, on ouvre le mémo, on sélectionne une case, puis on touche les boutons de marque (Voltorbe, 1, 2, 3) pour les activer ou désactiver. **On ne peut pas retourner de carte tant que le mémo est ouvert.**
- ★ **Défaut** : fidèle. Un réglage optionnel « appui long = mémo » pourra venir en phase 4.

### Q14 Détails « clin d'œil » du jeu d'origine ?
- Message de suspense (« Tu es sûr(e) de toi ?! ») quand on touche une case très risquée (règle exacte dans `01`, §9.4). Messages de montée et de descente de niveau. Révélation de tout le plateau en fin de partie.
- ★ **Défaut** : oui, tous (ils sont peu coûteux et font « vrai »).

### Q15 Personnalisation pour ta sœur ?
- ★ **Défaut** : message de bienvenue au premier lancement (texte libre que tu écriras), icône d'app originale. Thème de Noël optionnel en phase 4 si le temps le permet.

### Q16 Orientation et tailles d'écran ?
- ★ **Défaut** : iPhone en **portrait** uniquement (sur iOS, le verrouillage n'est pas toujours respecté : on prévoit une mise en page qui tient aussi en paysage). Mac : fenêtre redimensionnable, mise en page à deux colonnes inspirée des deux écrans de la DS au-delà de 900 px de large. **Clavier** sur Mac (flèches, Entrée, M pour le mémo, V/1/2/3 pour les marques, Q pour quitter).

### Q17 Accessibilité ?
- ★ **Défaut** : cibles tactiles ≥ 44 px, contrastes suffisants, indicateurs lisibles sans dépendre seulement des couleurs, option « animations réduites » (respecte le réglage système `prefers-reduced-motion`).

---

## 4. Toi et ton environnement

### Q18 🔴 (pratique) Ton ordinateur de développement est-il un Mac ou un PC (Windows/Linux) ?
- **Pourquoi** : ça change les commandes d'installation (Node, Git) et la façon de tester Safari. Sur Mac, tu as le vrai Safari et le simulateur iOS de Xcode (gratuit). Sur PC, on s'appuie sur Playwright WebKit (proche de Safari, sans être identique) et sur ton iPhone.
- ★ **Défaut** : un Mac. Les commandes Windows sont signalées quand elles diffèrent.

> Note : j'ai mis Q18 dans le top 3 à la place de Q1 si tu ne peux pas obtenir les versions de ta sœur rapidement. Dans le résumé final, je retiens **Q1+Q2 (appareils et surprise), Q4 (style / propriété intellectuelle) et Q18 (ton ordinateur)**.

### Q19 As-tu déjà des comptes GitHub et Cloudflare ? Node.js et Git sont-ils installés ?
- ★ **Défaut** : compte GitHub oui, Cloudflare non. Node et Git sont à installer. L'étape 0.1 du plan couvre tout.

### Q20 As-tu un iPhone (ou un iPhone à portée de main) pour tester ?
- **Pourquoi** : rien ne remplace un vrai iPhone pour le tactile, la zone de l'encoche, le son et l'installation.
- ★ **Défaut** : oui, le tien. Sinon, emprunter celui d'un proche aux étapes 3.4 et 5.2 du plan.

### Q21 Un nom de domaine personnalisé ?
- ★ **Défaut** : non (payant). L'adresse gratuite `xxx.pages.dev` suffit, et le QR code évite de la taper.

---

## Décisions retenues (réponses du 10/11/2026)

> Ces décisions **remplacent** les choix par défaut ci-dessus. Les documents 01 à 06 et `repo-init/` ont été mis à jour en conséquence.

| Q | Décision | Conséquences principales |
|---|---|---|
| Q1 | Par défaut : iOS 17+ et macOS 14+ supposés | Aucune |
| Q2 | **Surprise** ; tests sur ton iPhone et sur le Mac d'un ami | Deux créneaux à réserver avec l'ami (étapes 3.4 et 5.2) ; carte cadeau avec QR code |
| Q3 | Elle connaît **très bien** le jeu | Fidélité maximale aux règles ; aide courte |
| Q4 | **Thème original « Sardine »** : la carte-bombe est la **tête de Sardine** (sa chienne), avec un aboiement quand elle est révélée. Aboiement synthétisé pour commencer, vrai enregistrement plus tard. Thème « classique » uniquement pour l'instant | Plus aucun élément Pokémon à l'écran : risque de propriété intellectuelle quasi nul. Photo de la tête et audio à fournir (dates dans le plan) |
| Q5 | Nom : **Sardinebagarre**, pour le jeu et pour le dépôt | Dépôt `sardinebagarre`, site `https://<ton-pseudo>.github.io/sardinebagarre/` |
| Q6 | Dépôt GitHub **public** | Hébergement **GitHub Pages** (plus besoin de Cloudflare). **Tout le contenu personnel passe par un pack chiffré** (voir ci-dessous). Adresse e-mail des commits à masquer (étape 0.1) |
| Q7 | Français | — |
| Q8 | Pas de mot de passe sur le site | Le **code secret** ne sert qu'à ouvrir le pack de photos (spec §13) |
| Q9 | **Mixte** : on sauvegarde jetons, niveau et historique, **pas la partie en cours** | Fermer l'app en pleine partie = nouvelle partie au même niveau, gain perdu, sans pénalité (spec R-68, CL-18). Elle peut donc changer de plateau en fermant l'app (accepté). Si iOS ferme l'app en arrière-plan, la partie en cours est perdue, pas le niveau |
| Q10 | Les jetons débloquent des **photos** (Sardine surtout, mais aussi la famille et les chats). Thèmes : en v2 | **Album** avec prix croissants (spec §12). Les photos ne vont **jamais** en clair dans le dépôt public : pack chiffré (spec §13) |
| Q11 | Pas de synchronisation. Ouvert à un seul appareil si c'est plus simple | **Recommandation : garder les deux, iPhone en priorité.** Le même code tourne sur Mac sans effort ; on supprime seulement la mise en page Mac à deux colonnes (le Mac affiche la version iPhone, centrée) et on passe le clavier en priorité basse. Gain : environ 1 jour de travail et beaucoup de tests en moins |
| Q12 | Sons synthétisés | + aboiement (UI-50) |
| Q13 | **Mémo dès la v1**, interaction fidèle | Déjà prévu en phase 2 (étape 2.4) |
| Q14 | Clins d'œil oui ; tu veux choisir certains messages | Messages sous forme de **listes tirées au hasard** : listes publiques dans le code, messages privés (prénoms, blagues de famille) dans le pack (UI-60) |
| Q15 | Personnalisation en option pour l'instant | Message de bienvenue dans le pack |
| Q16 | Portrait sur iPhone | — |
| Q17 | Accessibilité par défaut ; **« S » (Sardine) remplace « V »** | Marques du mémo S/1/2/3, touche `S` |
| Q18 | Tu es sur **Windows** | Commandes Windows dans le plan ; hooks en Node lancés sans shell (exec form) ; `.gitattributes` pour les fins de ligne ; Safari testé seulement sur ton iPhone et le Mac de ton ami (Playwright WebKit en local) |
| Q19 | GitHub et Git : oui ; Node : à vérifier ; Cloudflare : inutile | Étape 0.1 : vérifier ou installer Node LTS |
| Q20 | Tu as un iPhone | Tests réels à chaque fin de phase |
| Q21 | Pas de domaine | URL GitHub Pages + QR code |

### Le pack chiffré, en deux mots
Le dépôt et le site sont publics, mais tes photos ne doivent pas l'être. Les photos, la tête de Sardine, l'aboiement et les messages personnels sont donc rangés dans un dossier `prive/` **qui ne quitte jamais ton ordinateur**. Un script les **chiffre** dans un seul fichier `pack.bin`, illisible sans le **code secret**, et c'est ce fichier qui est publié. Ta sœur saisit le code (imprimé sur la carte cadeau) une seule fois par appareil, et le jeu déchiffre les photos sur son téléphone. Sans le code, le jeu reste jouable avec une tête de chien dessinée.

### Ce que tu dois fournir, et quand
| Quoi | Format | Date limite |
|---|---|---|
| Photo de la tête de Sardine (de face, bien nette, fond simple) | JPG/PNG, ≥ 800 px | dim. 29/11 (pour l'intégrer en phase 3) |
| Photos de l'album (une douzaine) + légendes + ordre | JPG/HEIC → JPG | dim. 6/12 |
| Message de bienvenue + messages drôles (publics et privés) | texte | dim. 6/12 |
| Enregistrement de l'aboiement (facultatif) | M4A/MP3, 1 à 2 s, sans bruit autour | ven. 11/12 |
| Le code secret (4 mots) | à garder pour toi : jamais dans un fichier ni dans une conversation avec Claude | avant l'étape 3.3 |

### Questions encore ouvertes
1. **Photos de Sardine seule** : sont-elles aussi privées ? Par prudence, je les traite comme les autres (dans le pack chiffré), tête de la carte-bombe comprise. Si une photo de Sardine seule peut être publique, la tête pourrait être visible même sans code, ce qui simplifie un peu.
2. **Ordre de l'album imposé** (prochaine photo seulement) ou **libre** (n'importe quelle photo si on a assez de jetons) ? Par défaut : dans l'ordre (une surprise à chaque déblocage).
