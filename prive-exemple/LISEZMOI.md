# Fabriquer le pack personnel

Ce dossier est un **exemple sans aucune image**. Ton vrai contenu va dans `prive/` (ignoré par Git, jamais publié). Seul le fichier chiffré `public/pack/pack.bin` est commité.

## 1. Préparer `prive/`

```
prive/
  pack.json
  sardine-tete.jpg
  photos/01.jpg, 02.jpg, ...
  aboiement.m4a        (facultatif)
```

Copie `prive-exemple/pack.json` dans `prive/` puis remplis-le :

- `bienvenue` : le message affiché quand le code est accepté.
- `tete` : le fichier de la tête de Sardine et son cadrage.
  - `x` et `y` : le centre du visage, en fraction de l'image (0 = bord gauche ou haut, 1 = bord droit ou bas).
  - `zoom` : 1 garde le plus grand carré possible, 2 zoome deux fois. Il vaut au moins 1.
  - Le script découpe un carré de 512 px centré sur (x, y), ramené dans l'image. Le détourage en rond est fait par le jeu.
- `photos` : l'ordre de la liste est l'ordre de l'album. `legende` est le texte sous la photo. `prix` est facultatif.
- `messages` : listes de phrases (`sardine`, `victoire`, `suspense`, `montee`, `descente`). Chaque liste est facultative.
- `aboiement` : facultatif, nom du fichier son.

### Prix par défaut

Sans `prix`, la photo du rang n prend le n-ième prix : 100, 200, 300, 500, 700, 1 000, 1 500, 2 000, 3 000, 5 000, 7 500, 10 000. Au-delà de 12 photos, le dernier prix est repris.

## 2. Choisir un code

Quatre mots tirés au hasard, par exemple `croquette-tempete-violon-sardine`. Le script refuse un code de moins de 4 mots ou de moins de 16 caractères. Ne mets jamais le nom du chien.

## 3. Chiffrer

Dans un terminal, à la racine du projet :

```
npm run pack
```

Le code est demandé deux fois, sans s'afficher. Le script écrit `public/pack/pack.bin` et affiche le nombre de photos, la taille et la durée.

## 4. Commiter le pack seul

```
git status
```

Vérifie que seul `public/pack/pack.bin` apparaît (et rien venant de `prive/`), puis :

```
git add public/pack/pack.bin
git commit -m "chore(pack): pack chiffré"
```
