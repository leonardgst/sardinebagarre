# Sardinebagarre

Un petit jeu de déduction et de prise de risque, jouable hors ligne sur iPhone et sur Mac (application web installable). Les règles reprennent celles de la Voltorbataille de Pokémon HeartGold/SoulSilver ; la carte-bombe est **Sardine**, une chienne très connue dans sa famille. Cadeau de Noël 2026.

Graphismes, sons et textes **originaux**. Aucune ressource Nintendo, Game Freak ni The Pokémon Company n'est incluse. Projet personnel, non commercial.

Les photos du jeu sont dans un **pack chiffré** (`public/pack/pack.bin`), qui n'est lisible qu'avec un code secret. Aucune photo n'est stockée en clair dans ce dépôt.

## Démarrer
```bash
npm install
npm run dev        # http://localhost:5173/sardinebagarre/
npm run check      # types + lint + tests + contrôle de confidentialité
npm run e2e        # tests de bout en bout (Playwright WebKit)
npm run build      # version de production dans dist/
```

## Documentation
- `docs/specification.md` : règles du jeu (référence)
- `docs/architecture.md` : architecture et déploiement
- `docs/decisions/` : décisions (ADR)
- `docs/taches/` : tâches
- `docs/journal.md` : journal de bord
- `CLAUDE.md` et `.claude/` : configuration de Claude Code (skills, sous-agents, hooks)

## Publication
GitHub Pages, via GitHub Actions, à chaque push sur `main` (si les vérifications passent). Voir `.github/workflows/deploy.yml` et `.claude/skills/deployer/SKILL.md`.
