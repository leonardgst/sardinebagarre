---
name: ajouter-fonctionnalite
description: Méthode pour ajouter ou corriger une fonctionnalité dans ce projet en développement piloté par les tests (Vitest pour la logique, Playwright pour l'UI) - écrire d'abord les tests qui citent les règles de la spec, puis le code minimal, puis vérifier avec npm run check et des captures. À utiliser dès qu'on écrit ou modifie du code dans src/ ou tests/.
---

# Ajouter une fonctionnalité avec tests

## 1. Comprendre
- Relis la fiche de tâche et les règles citées (`docs/specification.md`).
- Repère où va le code :
  - règle du jeu, calcul, état → `src/logic/` (pur, testé par Vitest dans `tests/logic/`) ;
  - affichage, gestes, sons, sauvegarde → `src/ui/` (testé par Playwright dans `tests/e2e/`, et par Vitest pour les fonctions utilitaires pures).

## 2. Test rouge d'abord
- Écris les tests **avant** le code. Nom du test = identifiant de règle + comportement :
  ```ts
  it("R-63 défaite au niveau 8 après 9 cartes → niveau 7", () => {
    expect(nextLevel([{ outcome: "LOST", cardsFlipped: 9, level: 8 }])).toBe(7);
  });
  ```
- Hasard : utilise `mulberry32(graine)` pour des plateaux reproductibles, ou construis le plateau à la main avec l'aide de test `boardFromRows(["1 2 V 1 1", …])` (à créer dans `tests/helpers.ts` si elle n'existe pas).
- Pour la génération : test de **propriété** (boucle sur de nombreuses graines) qui vérifie les invariants, plutôt qu'un plateau précis.
- Lance `npm test` : les nouveaux tests doivent **échouer pour la bonne raison**.

## 3. Code minimal
- Implémente juste de quoi passer au vert. Fonctions pures `(état, action) → nouvel état`, sans mutation.
- Types explicites aux frontières des modules ; pas de `any` ; `readonly` pour l'état.
- Textes affichés : seulement dans `src/ui/texts.fr.ts`.

## 4. Vérifier
- `npm run check` : typecheck, lint et tests doivent être verts (le hook de fin le relancera de toute façon).
- Si l'UI change : ajoute ou ajuste un test Playwright, puis `npm run screens`, et applique le skill `controle-visuel`.
- Relis ton diff (`git diff`) : code mort, `console.log`, TODO non justifiés.

## 5. Nettoyer et consigner
- Refactorise si utile, en gardant les tests verts.
- Commit : `type(portée): résumé (R-xx)`.
- Fiche de tâche : coche les critères atteints et remplis « Compte rendu ».
- `docs/journal.md` : 2 ou 3 lignes datées (fait, reste à faire, questions).

## Anti-patterns à éviter
- Modifier un test pour qu'il passe sans comprendre pourquoi il échouait.
- Tester des détails internes (noms de fonctions privées, structure du DOM sans rapport avec ce que voit le joueur).
- Utiliser `Math.random` ou `Date.now` dans `src/logic/`.
- Corriger « au passage » des choses hors du périmètre de la tâche : note-les plutôt dans le journal.
- Ajouter une image, un son ou une photo de test réaliste : utilise des images générées par code (aplats de couleur) et le pack de test `tests/fixtures/pack-test.bin`. Ne lis jamais `prive/`.
- Écrire un chemin absolu `/…` dans le code d'interface : passe par `import.meta.env.BASE_URL`.
