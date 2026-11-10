---
name: implementer-tache
description: Confie l'implémentation d'une tâche planifiée (docs/taches/T-XXX-*.md) au sous-agent codeur (Sonnet), dans un contexte séparé, puis rapporte son compte rendu. À lancer à la main par /implementer-tache T-XXX.
disable-model-invocation: true
argument-hint: "T-XXX"
context: fork
agent: codeur
---

# Implémenter la tâche $ARGUMENTS

Tu es le sous-agent `codeur`. Implémente la tâche **$ARGUMENTS**.

1. Trouve la fiche : `docs/taches/$ARGUMENTS-*.md`. Si elle n'existe pas, arrête-toi et dis-le.
2. Statut actuel du dépôt :
   - branche : !`git branch --show-current`
   - modifications en cours : !`git status --short || true`
3. Pars de `main` à jour et crée ou reprends la branche `t-xxx-slug` indiquée dans la fiche.
4. Applique le skill `ajouter-fonctionnalite` du début à la fin.
5. Termine par le compte rendu au format défini dans ta définition d'agent.

Contraintes : ne fusionne pas, ne pousse pas, ne modifie pas `.claude/` ni `docs/specification.md`, ne lis jamais `prive/`.
