# ADR-002 — Dépôt GitHub public + GitHub Pages

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Réponse Q6 : le dépôt est **public**. Sur un compte gratuit, GitHub Pages n'est disponible que pour les dépôts publics. Le site est servi dans un sous-dossier : `https://<pseudo>.github.io/sardinebagarre/`. Le site ne pèse que quelques Mo et n'a qu'une joueuse.

## Options envisagées
1. **GitHub Pages** : tout au même endroit (code, vérifications, publication), aucun compte supplémentaire, très simple. En contrepartie : pas d'aperçu par branche (un seul site), usage non commercial.
2. **Cloudflare Pages** : accepte les dépôts privés, aperçus automatiques par branche. En contrepartie : un compte de plus. Reste le plan B si le dépôt repasse en privé.
3. **Netlify (gratuit)** : système de crédits, site mis en pause quand ils sont épuisés.
4. **Vercel (Hobby)** : usage personnel uniquement, sans avantage décisif ici.

## Décision
GitHub Pages, publié par GitHub Actions (`.github/workflows/deploy.yml`) à chaque push sur `main`, seulement si les vérifications passent. Vite est configuré avec `base: '/sardinebagarre/'`.

## Conséquences
- Plus facile : un seul outil, limites très largement suffisantes, publication automatique.
- Plus difficile : pas d'aperçu par branche. Le site publié sert de terrain de test jusqu'au 20/12 ; ensuite, chaque version est testée en HTTPS local sur iPhone avant d'être poussée. Pousser `main`, c'est publier.
- Obligation absolue de ne rien commiter de personnel en clair (ADR-011).
- Le sous-dossier impose de faire passer tous les chemins publics par `import.meta.env.BASE_URL` (manifeste, service worker, icônes, pack) : risque R-T9.
- À réévaluer : si le dépôt redevient privé, passer à Cloudflare Pages.

## Références
`docs/architecture.md` §3 ; `docs/questions-cadrage.md` Q6, Q21 ; `.github/workflows/deploy.yml` ; skill `deployer` ; `docs/risques.md` R-T9 ; ADR-011.
