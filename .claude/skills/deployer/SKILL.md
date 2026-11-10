---
name: deployer
description: Publie une nouvelle version du jeu sur GitHub Pages (fusion dans main + push, puis publication automatique par GitHub Actions) après toutes les vérifications. À lancer uniquement à la main par /deployer, jamais automatiquement.
disable-model-invocation: true
argument-hint: "[branche de tâche à fusionner, facultatif]"
---

# Publier une nouvelle version

Rappel : le workflow `.github/workflows/deploy.yml` publie automatiquement sur `https://<pseudo>.github.io/sardinebagarre/` **à chaque push sur `main`**, si les vérifications passent. Pousser `main`, c'est publier.
Jusqu'au 20/12, le site sert de terrain de test (ma sœur n'en connaît pas l'adresse). Après la v1.0.0, chaque publication arrive sur **son** téléphone.

## 1. Pré-vols (tout doit être vert, sinon on s'arrête)
- Branche et état : !`git branch --show-current` / !`git status --short || true`
- Si une branche de tâche est donnée ($ARGUMENTS) : verdict ✅ ou 🟡 du relecteur présent dans sa fiche.
- `npm ci` (si les dépendances ont changé), puis `npm run check` (dont le contrôle de confidentialité)
- `npm run e2e` (Playwright WebKit)
- `npm run build`. Taille de `dist/` : signaler si elle dépasse 8 Mo (pack compris).
- `git status` : **aucun fichier de `prive/`**, aucune image ni aucun son inattendu.
- Après le 20/12 : demander à l'humain s'il a testé la version sur son iPhone en HTTPS local (`npm run dev:https -- --host`). Sans test, on s'arrête.

## 2. Version
- Incrémente `version` dans `package.json` (correctif → patch, fonctionnalité → mineure).
- Ajoute une entrée à `CHANGELOG.md` (date, version, 3 à 5 puces en français, sans rien de personnel).
- Commit : `chore(release): vX.Y.Z`.

## 3. Publication
1. Si une branche de tâche est donnée : `git switch main && git merge --no-ff $ARGUMENTS` (autorisation de l'humain).
2. `git tag vX.Y.Z`
3. `git push origin main --tags` (autorisation de l'humain).
4. Indique où suivre la publication : onglet **Actions** du dépôt, workflow « Déploiement » (1 à 3 minutes).

## 4. Après publication : checklist pour l'humain
- [ ] L'URL répond et affiche la nouvelle version (Réglages › version).
- [ ] Sur iPhone : ouvrir l'app installée **deux fois** (la 1ʳᵉ télécharge la mise à jour, la 2ᵉ l'applique) et vérifier la version.
- [ ] Mode avion, puis relancer l'app : elle fonctionne hors ligne, photos comprises.
- [ ] La sauvegarde existante est toujours là (jetons, niveau, album).

## Interdits
Pas de `--force`. Pas de publication si un test échoue. Pas de publication entre le 21 et le 24/12, sauf correctif critique validé par l'humain. Ne jamais lancer `npm run pack` (réservé à l'humain).
