---
name: consigner-decision
description: Enregistre une décision d'architecture, de règle ou de produit sous forme d'ADR court dans docs/decisions/ (contexte, options, décision, conséquences). À utiliser quand on tranche un choix structurant (bibliothèque, format de sauvegarde, écart volontaire avec le jeu d'origine, interprétation d'une règle ambiguë), ou à la demande /consigner-decision.
argument-hint: "[titre de la décision]"
---

# Consigner une décision : $ARGUMENTS

1. Liste `docs/decisions/` et prends le numéro suivant (`ADR-0XX`, sur 3 chiffres).
2. Vérifie qu'aucun ADR existant ne traite déjà du sujet. Si c'est le cas, crée un nouvel ADR qui le **remplace**, et passe l'ancien au statut « Remplacé par ADR-0XX » (on ne réécrit jamais l'histoire).
3. Crée `docs/decisions/ADR-0XX-slug.md` à partir de `docs/decisions/_modele.md`. Rédaction : 15 à 40 lignes, en français simple. Au moins 2 options réellement envisagées.
4. Si la décision touche une règle du jeu, mets à jour `docs/specification.md` **dans le même commit** et cite l'ADR à l'endroit concerné.
5. Ajoute une ligne à `docs/journal.md`.
6. Commit : `docs(adr): ADR-0XX <titre>`.
