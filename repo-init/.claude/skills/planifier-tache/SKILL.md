---
name: planifier-tache
description: Transforme une demande ou une étape du plan en fiche de tâche précise et testable dans docs/taches/, prête à être confiée au sous-agent codeur. À lancer à la main par /planifier-tache suivi de la description ou du numéro d'étape du plan.
disable-model-invocation: true
argument-hint: "[description ou n° d'étape du plan, ex. 1.3]"
model: opus
effort: high
---

# Planifier une tâche

Demande : **$ARGUMENTS**

## Étapes
1. **Contexte** : lis `docs/journal.md` (où en est-on ?), la ou les sections pertinentes de `docs/specification.md`, `docs/architecture.md` et, si on te donne un numéro d'étape, `docs/plan.md`. Liste les fichiers existants concernés (`Glob`/`Grep`).
2. **Découpe** : une tâche doit pouvoir être faite et relue en **une session** (en gros < 400 lignes modifiées). Si c'est plus gros, propose 2 à 4 tâches et crée seulement la première.
3. **Numéro** : prends le plus grand `T-XXX` de `docs/taches/` + 1 (sur 3 chiffres).
4. **Rédige** `docs/taches/T-XXX-slug.md` à partir de `docs/taches/_modele.md` :
   - objectif en une phrase, du point de vue du joueur ou du code ;
   - règles concernées (identifiants `R-`, `CL-`, `UI-`) ;
   - périmètre : ce qui est inclus **et ce qui est exclu** ;
   - fichiers à créer ou modifier (chemins exacts) ;
   - **tests à écrire** : liste nommée, avec les valeurs attendues (vecteurs de la spec quand ils existent) ;
   - critères d'acceptation vérifiables (commande + résultat attendu) ;
   - pièges connus ;
   - estimation (S/M/L).
5. **Vérifie** que chaque critère d'acceptation est vérifiable par une commande ou une capture, sans jugement subjectif.
6. Mets à jour l'index en tête de `docs/journal.md` (ligne « T-XXX — titre — planifiée »).
7. **Ne code rien.** Termine par :
   - le chemin de la fiche ;
   - la commande à lancer ensuite : `/implementer-tache T-XXX` ;
   - les questions éventuelles pour l'humain (au plus 3).
