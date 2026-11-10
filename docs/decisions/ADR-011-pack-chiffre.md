# ADR-011 — Pack personnel chiffré

- **Statut** : acceptée
- **Date** : 2026-11-10
- **Décideur** : l'humain (proposé par Opus)

## Contexte
Le dépôt et le site sont publics (ADR-002), mais les photos de famille, la tête de Sardine, l'aboiement enregistré et les messages privés doivent rester privés, y compris dans l'historique Git (supprimer un fichier ne l'efface pas des anciens commits).

## Options envisagées
1. **Dépôt privé + URL secrète** : les photos restent téléchargeables par quiconque connaît l'URL.
2. **Photos hors du jeu** : plus de récompense personnelle.
3. **Pack chiffré AES-GCM, clé dérivée d'un code secret de 4 mots** : seul un fichier chiffré est publié.

## Décision
Option 3. Le dossier `prive/` (ignoré par Git, illisible pour Claude) est chiffré par `npm run pack`, lancé par l'humain seul, en un fichier `public/pack/pack.bin` (AES-GCM 256 bits, PBKDF2-SHA-256 600 000 itérations, en-tête `SBPACK1`). Le jeu le déchiffre sur l'appareil avec Web Crypto.

## Conséquences
- Une tâche de plus (script de pack + déchiffrement) ; la joueuse saisit le code une fois par appareil.
- Sans le code, le jeu reste jouable (tête dessinée, aboiement synthétisé, messages publics).
- Si le code fuit : refaire le pack avec un nouveau code et publier.
- Web Crypto exige HTTPS : tests sur iPhone via `npm run dev:https` ou le site publié.
- À surveiller : temps de déchiffrement sur iPhone (R-T8) ; garde-fous `verifier-confidentialite.mjs` et interdiction de lire `prive/` (R-V1).

## Références
`docs/specification.md` §13 (R-120 à R-128) ; `docs/architecture.md` §6.2 ; `docs/risques.md` R-V1, R-V2, R-T8.
