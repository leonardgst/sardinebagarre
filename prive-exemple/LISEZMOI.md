# Fabriquer le pack personnel (photos et messages cachés)

Ce dossier est un **exemple sans aucune image**. Tes vraies photos vont dans un dossier `prive/`, que Git n'envoie jamais sur Internet. À la fin, un seul fichier **chiffré** est publié : `public/pack/pack.bin`. Sans le code secret, personne ne peut le lire.

## Règles d'or

- Ne copie **jamais** une photo ou un fichier de `prive/` ailleurs que dans `prive/`.
- N'écris **jamais** le code secret dans un fichier, dans un commit, dans un message d'erreur ni dans une conversation avec Claude. Il ne doit exister que dans ta tête et sur la carte cadeau imprimée.
- Ne mets **pas** le code dans un fichier texte « pour ne pas l'oublier ».

## Étape 1. Créer les dossiers

1. Dans le dossier du projet, crée un dossier nommé `prive`.
2. Dans `prive`, crée un dossier nommé `photos`.

## Étape 2. Ranger les images

- Mets la photo de la tête de Sardine dans `prive` : `sardine-tete.jpg`.
- Mets les photos de l'album dans `prive/photos` : `01.jpg`, `02.jpg`, etc.
- Les photos doivent être en **JPEG** (`.jpg`). Le format HEIC de l'iPhone ne marche pas : dans Photos ou Partage, choisis « le plus compatible » ou convertis-les d'abord.
- Les photos sont réduites automatiquement. Pas besoin de les alléger.

## Étape 3. Écrire `pack.json`

1. Copie `prive-exemple/pack.json` dans `prive`.
2. Ouvre-le avec le Bloc-notes et remplace les textes de l'exemple. Enregistre-le en **UTF-8** (le choix par défaut du Bloc-notes de Windows 11), sinon les accents seront abîmés.

À respecter, sinon le script refuse le fichier :

- Les textes sont entre **guillemets droits** `"`.
- Une **virgule** sépare deux éléments, mais il n'y en a **pas** après le dernier.
- Les nombres (les prix, le cadrage) s'écrivent **sans guillemets**, avec un point pour les décimales (`0.5`).
- Les noms de fichiers sont écrits exactement comme dans le dossier.

Que contient le fichier :

- `bienvenue` : le message affiché quand le code est accepté.
- `tete` : le fichier de la tête et son cadrage.
  - `x` et `y` : le centre du visage, entre 0 et 1 (0 = bord gauche ou haut, 1 = bord droit ou bas).
  - `zoom` : 1 garde le plus grand carré possible, 2 zoome deux fois. Il vaut au moins 1.
  - Le jeu découpera un rond à partir de ce carré.
- `photos` : l'ordre de la liste est l'ordre de l'album. `legende` est le texte sous la photo. `prix` est facultatif jusqu'à la 12e photo.
- `messages` : des listes de phrases (`sardine`, `victoire`, `suspense`, `montee`, `descente`). Chaque liste est facultative.
- `aboiement` : facultatif.

### Les prix

Sans `prix`, la photo n°1 coûte 100, puis : 200, 300, 500, 700, 1 000, 1 500, 2 000, 3 000, 5 000, 7 500, 10 000 pour la photo n°12. **À partir de la 13e photo, le prix est obligatoire.**

## Étape 4. Choisir le code secret

- Quatre mots **tirés au hasard**, séparés par des tirets, sans accent.
- Au moins 16 caractères au total.
- Pas le nom du chien, pas une date, pas un mot de la famille.
- Les codes d'exemple publiés dans le dépôt sont refusés.

## Étape 5. Ouvrir PowerShell

1. Ouvre le dossier du projet dans l'Explorateur de fichiers.
2. Clique dans la barre d'adresse, tape `powershell`, puis Entrée.
3. Une fenêtre bleue s'ouvre, déjà placée dans le bon dossier. (Le Terminal Windows convient aussi.)

## Étape 6. Fabriquer le pack

1. Tape `npm run pack` puis Entrée.
2. Écris le code secret : rien ne s'affiche, c'est normal. Entrée.
3. Écris-le une seconde fois pour confirmer. Entrée.
4. Le script affiche le nombre de photos, la taille et la durée. Si un message d'erreur apparaît, il dit quel champ de `pack.json` corriger.

## Étape 7. Publier le pack seul

1. Tape `npm run check` : tout doit finir sans erreur (« Contrôle de confidentialité : OK »).
2. Tape `git status`. Tu dois voir **uniquement** `public/pack/pack.bin` comme nouveauté. Si un fichier de `prive` apparaît, arrête-toi et demande de l'aide.
3. Tape :
   ```
   git add public/pack/pack.bin
   git commit -m "chore(pack): pack chiffré"
   ```

## Après le pack

- Garde `prive/` sur ton ordinateur **et fais-en une copie sur une clé USB** : sans lui, tu ne pourras pas refaire le pack.
- Le pack est publié sur le site au prochain envoi (`git push`), ou demande à Claude de publier.
- Note le code sur papier (et sur la carte cadeau), nulle part ailleurs.
- Si tu changes une photo ou un message : relance l'étape 6, puis l'étape 7.
- Si le code a fuité : choisis un nouveau code, refais le pack et publie-le.
