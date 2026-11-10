---
name: controle-visuel
description: Contrôle visuel de l'interface - génère des captures Playwright (WebKit) aux tailles iPhone SE, iPhone 15 et Mac, les ouvre et les vérifie avec une liste de critères (débordement, zones sûres, tailles tactiles, lisibilité des indicateurs, états du jeu). À utiliser après toute modification de src/ui/ ou des styles, ou quand on demande à quoi ressemble le jeu.
allowed-tools: Bash(npm run screens*) Bash(npm run e2e*) Read Glob
---

# Contrôle visuel

## 1. Produire les captures
`npm run screens` lance `tests/e2e/screens.spec.ts`, qui doit produire, pour chaque profil (`iphone-se` 375×667, `iphone-15` 393×852, `mac` 1280×800), les écrans suivants dans `test-results/screens/<profil>/` :
`01-menu.png`, `02-plateau-neuf.png`, `03-en-cours.png` (quelques cartes retournées), `04-memo-ouvert.png`, `05-dialogue-quitter.png`, `06-victoire.png`, `07-defaite-revelation.png` (Sardine révélée), `08-reglages.png`, `09-bienvenue-code.png`, `10-album.png` (avec le pack de test déverrouillé : quelques photos débloquées, la suivante à acheter, les autres verrouillées).
Sur le profil `mac`, la mise en page attendue est **celle de l'iPhone, centrée** (UI-11).
Les états sont obtenus avec une **graine fixe** passée par l'URL (`?seed=42&debug=1`). Ce paramètre n'est actif qu'en développement.

Si le script ou la spec n'existent pas encore, crée-les (Playwright, `devices['iPhone SE']`, `devices['iPhone 15']`, navigateur WebKit).

## 2. Regarder vraiment
Ouvre **chaque** capture avec l'outil Read (il affiche l'image) et vérifie :
- [ ] Rien ne déborde ni ne nécessite de défilement (iPhone SE inclus).
- [ ] Les zones sûres sont respectées : rien sous l'encoche ou la barre d'accueil.
- [ ] Cartes ≥ 44 px ; espacement régulier ; plateau carré.
- [ ] Indicateurs lisibles : somme et nombre de bombes distincts, et la ligne ou colonne associée est évidente.
- [ ] Les marques du mémo se distinguent (4 coins) et ne se confondent pas avec une carte retournée.
- [ ] Contraste suffisant (texte sur fond), y compris pour les cartes retournées.
- [ ] Les états sont distinguables : carte cachée / retournée / sélectionnée en mémo / Voltorbe révélé.
- [ ] Textes en français, sans faute, sans débordement ; pluriels corrects.
- [ ] Aucune ressource ressemblant à un élément Pokémon officiel.
- [ ] La tête de Sardine (ou la tête de chien de secours) est bien ronde, centrée et lisible sur la carte, même sur iPhone SE.
- [ ] Aucune vraie photo dans les captures : seulement les images du pack de test.

## 3. Rendre compte
Liste les problèmes par capture (`iphone-se/03-en-cours.png : indicateur de la colonne 5 coupé`), corrige-les si c'est dans ton périmètre, puis relance les captures. Mentionne les chemins des captures finales dans le compte rendu.

## Limites
Playwright WebKit est proche de Safari, sans être identique (et il n'y a pas de Safari sous Windows). Avant chaque jalon (fin de phase), un test sur un vrai iPhone reste nécessaire : `npm run dev:https -- --host`, puis l'adresse IP locale en `https://` dans Safari.
