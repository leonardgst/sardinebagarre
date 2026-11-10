# ADR-014 — Développement sous Windows

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Réponse Q18 : l'ordinateur de développement est sous Windows. Claude Code s'appuie sur Git Bash, les hooks manipulent des chemins, la CI tourne sous Linux et il n'y a pas de Safari en local.

## Options envisagées
1. **Scripts et hooks en shell (bash)** : habituels, mais fragiles sous Windows (Git Bash ou PowerShell, `jq` absent, raccourcis `.cmd` non lancés sans shell).
2. **Scripts et hooks en Node, hooks lancés sans shell (exec form)** : même comportement sous Windows et en CI Linux.

## Décision
Scripts et hooks en Node (pas de bash), hooks lancés sans shell (`"command": "node"` + `"args"`), `.gitattributes` qui impose les fins de ligne LF, `core.autocrlf false`, projet hors de OneDrive (par exemple `C:\dev\sardinebagarre`).

## Conséquences
- Plus facile : comportement identique en local et en CI ; chemins gérés avec `node:path`.
- Plus difficile : pas de Safari local. Playwright WebKit en local, puis tests réguliers sur l'iPhone de l'humain ; le pare-feu Windows doit autoriser `--host` sur les réseaux privés.

## Références
`docs/guide-claude-code.md` §6 et §6.1 ; `docs/risques.md` R-T7 ; `docs/plan.md` étapes 0.1 et 2.5 ; ADR-004.
