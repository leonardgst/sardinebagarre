# ADR-001 — Application web installable (PWA)

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Le jeu est un cadeau qui doit se jouer sur l'iPhone (Safari) et, en bonus, sur le Mac de la destinataire. Budget : 0 €. Pas de compte Apple Developer : une app native installée avec un compte gratuit expire au bout de 7 jours, et Xcode n'existe pas sous Windows (ADR-014).

## Options envisagées
1. **PWA (web installable)** (36 points dans la comparaison) : 0 €, installation en 3 touchers dans Safari, hors ligne grâce au service worker, mise à jour par simple publication, terrain où Claude produit le code le plus fiable. Rendu un peu moins fidèle qu'en natif.
2. **App native Swift/SwiftUI** (22) : meilleure fidélité, mais 99 $/an pour une installation durable, alerte Gatekeeper sur Mac, Xcode indisponible sous Windows.
3. **Multiplateforme (Capacitor, Flutter, React Native)** (20–28) : même contrainte Apple côté iOS, deux couches d'outils.
4. **Moteur de jeu (Godot)** (21–25) : mêmes contraintes en export iOS ; export web lourd, hors ligne moyen, tests plus difficiles.
5. **Simple page web sans PWA** (31) : pas de hors ligne, barre Safari visible.

## Décision
PWA (manifeste + service worker), installée par Safari › « Sur l'écran d'accueil » sur iPhone et par « Ajouter au Dock » sur Mac (macOS 14+).

## Conséquences
- Plus facile : installation durable sans compte payant, jeu hors ligne, mises à jour automatiques pour tout le monde.
- Plus difficile ou impossible : pas de notifications ni d'App Store (inutiles ici) ; l'installation passe obligatoirement par Safari (pas par l'aperçu d'une app de messagerie) ; sur un Mac antérieur à macOS 14, onglet Safari ou installation via Chrome.
- À surveiller : comportements nouveaux d'iOS/Safari en fin d'année (R-S7), installation depuis le QR code (R-S4).

## Références
`docs/architecture.md` §1, §2 et §7 ; `docs/questions-cadrage.md` Q1, Q2 ; `docs/risques.md` R-S4, R-S6, R-S7.
