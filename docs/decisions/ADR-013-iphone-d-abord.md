# ADR-013 — iPhone d'abord, Mac en version iPhone centrée

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Réponse Q11 : pas de synchronisation, et prêt à n'avoir qu'un appareil si c'est plus simple. Le choix par défaut initial prévoyait une mise en page Mac à deux colonnes (au-delà de 900 px) et un clavier complet.

## Options envisagées
1. **iPhone seul** : le plus simple, mais on perd le Mac alors que le même code y tourne sans effort.
2. **iPhone + Mac avec mise en page dédiée à deux colonnes et clavier complet** : plus de travail et beaucoup plus de tests.
3. **Les deux, le Mac affichant la mise en page iPhone centrée**, clavier en priorité basse.

## Décision
Option 3 : on garde les deux appareils ; le Mac affiche la mise en page iPhone, centrée ; le clavier passe en priorité basse (P3).

## Conséquences
- Environ 1 jour de travail et beaucoup de tests en moins.
- Le Mac reste un bonus, testé deux fois chez un ami (5-6/12 et 19/12).
- Chaque appareil a sa propre sauvegarde.

## Références
`docs/specification.md` UI-10, UI-11, UI-21, R-103 ; `docs/questions-cadrage.md` Q11, Q16 ; `docs/plan.md` étapes 3.4 et 5.2 ; `docs/risques.md` R-S6, R-P7.
