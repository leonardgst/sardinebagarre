# Risques

> ✅ Mis à jour le 10/11 : nouvelle section **Vie privée** (dépôt public + photos de famille), risques Windows et contenus à fournir.
>
> Étape E. Probabilité (P) et impact (I) notés de 1 à 3. On traite en priorité les risques où P × I ≥ 4.

## 1. Techniques

| ID | Risque | P | I | Prévention | Si ça arrive |
|---|---|---|---|---|---|
| R-T1 | Bug de règle subtil (niveaux, gains) que personne ne remarque avant Noël | 2 | 3 | Spec avec identifiants ; vecteurs de test N1–N17 et CL-01–CL-23 obligatoires ; relecteur qui recalcule à la main ; script de partie en console (1.6) | Correctif + test, essai en HTTPS local sur iPhone, puis publication |
| R-T2 | Animations et état désynchronisés (double toucher, toucher pendant une animation) | 2 | 2 | Verrou d'entrée (CL-19), animations sous forme de promesses dans un séquenceur unique, test e2e de clics rapides | Désactiver l'animation fautive (mode réduit par défaut) |
| R-T3 | Sauvegarde perdue | 1 | 3 | Stockage de l'app d'écran d'accueil (exempté de l'effacement de Safari après 7 jours d'inutilisation) ; test de durée de 8 jours (étape 3.4) ; lecture tolérante (CL-22) | Les jetons et le niveau se reconstituent en jouant ; prévoir en v1.1 un export par code |
| R-T4 | Service worker qui sert une ancienne version « coincée » | 2 | 2 | `registerType: 'prompt'` avec application automatique sur le menu, jamais en pleine partie (spec R-104) ; version affichée dans Réglages ; test de mise à jour (5.2) | Nouvelle publication ; en dernier recours, supprimer l'icône puis réinstaller (la sauvegarde est perdue : à éviter) |
| R-T5 | Dépendances qui cassent (mise à jour majeure de Vite, Playwright…) | 1 | 2 | `package-lock.json` versionné, `npm ci` en CI, aucune mise à jour majeure après le 6/12 | `git revert` du commit de mise à jour |
| R-T6 | Écart Playwright WebKit / vrai Safari iOS (aucun Safari sous Windows) | 2 | 2 | Tests sur vrai iPhone à chaque fin de phase (2.5, 3.4, 4.8, 5.2) | Correctif ciblé avec un test e2e qui reproduit le problème si c'est possible |
| R-T7 | Particularités Windows : fins de ligne, chemins, pare-feu, raccourcis `.cmd`, OneDrive | 2 | 2 | `.gitattributes`, hooks et scripts en Node lancés sans shell, projet dans `C:\dev`, CI sous Linux qui révèle vite les écarts | Signaler l'erreur exacte à Opus ; la CI sert de référence |
| R-T8 | Déchiffrement du pack trop lent ou trop gourmand sur iPhone (photos lourdes) | 1 | 2 | Photos redimensionnées à 1 280 px, pack visé < 6 Mo, mesure du temps de déchiffrement à l'étape 3.3 | Déchiffrer photo par photo, à la demande (un fichier chiffré par photo) |
| R-T9 | `base: '/sardinebagarre/'` mal propagé (manifeste, service worker, icônes) : installation cassée sur GitHub Pages | 2 | 2 | Noté dans CLAUDE.md ; test e2e en mode preview avec la même base ; vérification sur iPhone à l'étape 3.4 | Correctif de configuration |

## 2. iPhone / Safari

| ID | Risque | P | I | Prévention |
|---|---|---|---|---|
| R-S1 | Le son ne joue pas | 3 | 1 | Déverrouiller l'`AudioContext` au premier toucher ; le bouton silencieux de l'iPhone peut couper le son Web Audio (comportement normal, à expliquer dans l'aide) ; le jeu reste entièrement jouable sans son |
| R-S2 | Mise en page cassée par l'encoche, la barre d'accueil ou la barre Safari | 2 | 2 | `viewport-fit=cover`, `env(safe-area-inset-*)`, unités `dvh`, captures sur les 5 profils (iPhone SE, iPhone 15, iPhone 15 Pro Max, iPhone 15 en paysage, Mac) à chaque modification d'UI |
| R-S3 | Zoom involontaire, sélection de texte, menu sur appui long | 2 | 2 | `touch-action: manipulation`, `user-select: none`, `-webkit-touch-callout: none`, police ≥ 16 px dans les champs |
| R-S4 | Ta sœur ouvre le lien dans une app (Messages, Instagram…) et non dans Safari : « Sur l'écran d'accueil » absent | 2 | 2 | QR code scanné avec l'appareil photo (ouvre Safari) ; la carte précise « dans Safari » ; le jeu détecte s'il n'est pas installé et affiche une aide d'installation (sur iOS, `navigator.standalone`) |
| R-S5 | Elle joue d'abord dans Safari, puis installe : la progression ne suit pas | 2 | 1 | Le message d'aide invite à installer **avant** de jouer ; la carte le dit |
| R-S6 | Mac trop ancien pour « Ajouter au Dock » (avant macOS 14) | 2 | 1 | Question Q1 ; plan B : onglet Safari ou installation via Chrome. Le Mac est secondaire (ADR-013) |
| R-S9 | Le code secret est mal saisi (majuscules, accents, tirets) | 2 | 1 | Normalisation du code avant dérivation (R-122) ; message clair ; code écrit lisiblement sur la carte |
| R-S7 | Comportement nouveau d'iOS ou de Safari en fin d'année (iOS 26.x) | 1 | 2 | Tester sur la dernière version d'iOS disponible en décembre ; garder le code standard (pas d'API exotique) |
| R-S8 | Pas de retour haptique (vibration) sur iPhone | 3 | 1 | Accepté : `navigator.vibrate` n'existe pas sur iOS. Le retour passe par l'animation et le son |

## 3. Planning

| ID | Risque | P | I | Prévention | Si ça arrive |
|---|---|---|---|---|---|
| R-P1 | Retard cumulé (6 semaines, c'est court) | 2 | 3 | Gel le 13/12, une semaine de stabilisation, priorités P1/P2/P3 dans la phase 4 | Couper P3 puis P2 ; la v1 = règles + UI + PWA |
| R-P2 | Limites d'usage de l'offre Pro atteintes en pleine session | 3 | 2 | Code par Sonnet ; une relecture Opus par tâche ; `/clear` entre les tâches ; répartir le travail sur la semaine | Pause jusqu'à la remise à zéro, ou travail manuel (tests sur appareil, lecture) pendant ce temps |
| R-P3 | Tu passes du temps à « jouer avec les outils » plutôt qu'à avancer | 2 | 2 | Moments d'apprentissage placés dans le plan, sans plus | Revenir au plan ; l'exercice de skill reste en phase 4 |
| R-P4 | Effet tunnel : la tâche « UI » gonfle sans fin | 2 | 2 | Tâches < 400 lignes ; critères vérifiables ; 2.3 déjà découpée | Redécouper avec `/planifier-tache` |
| R-P5 | Indisponibilité (maladie, travail) en décembre | 1 | 3 | Marge d'une semaine ; ce qui est en production le 13/12 est déjà offrable | Offrir la version candidate |
| R-P6 | Photos, messages ou aboiement fournis en retard | 2 | 2 | Dates limites (tête : 29/11 ; photos et messages : 6/12 ; aboiement : 11/12) ; le jeu fonctionne sans (tête dessinée, aboiement synthétisé) | Le pack peut être refait et publié jusqu'au 20/12, et même après Noël |
| R-P7 | Le Mac de ton ami n'est pas disponible | 2 | 1 | Deux créneaux réservés à l'avance (5-6/12 et 19/12) | Le Mac est secondaire : on livre testé sur iPhone seulement |

## 4. Vie privée (dépôt et site publics)

| ID | Risque | P | I | Prévention | Si ça arrive |
|---|---|---|---|---|---|
| R-V1 | **Une photo de famille est commitée en clair** dans le dépôt public | 2 | 3 | `prive/` dans `.gitignore` ; `verifier-confidentialite.mjs` dans `npm run check`, dans le hook de fin et en CI ; Claude ne peut pas lire `prive/` ; toujours regarder `git status` avant un commit | **Non poussé** : `git reset HEAD~1` puis retirer le fichier. **Déjà poussé** : demander à Opus la procédure `git filter-repo`, forcer la mise à jour à la main, puis changer le code secret |
| R-V2 | Code secret faible ou divulgué | 2 | 3 | 4 mots aléatoires (R-123) ; jamais dans un fichier, un commit ni une conversation avec Claude ; écrit à la main sur la carte | Nouveau code, `npm run pack`, publication |
| R-V3 | Perte du dossier `prive/` (panne du PC) | 1 | 2 | Copie sur une clé USB ou un cloud personnel après chaque mise à jour | Repartir des photos d'origine (téléphone) |
| R-V4 | Ton adresse e-mail exposée dans les commits publics | 2 | 1 | Adresse `noreply` de GitHub (étape 0.1) | Changer l'adresse pour les commits suivants (les anciens restent : acceptable) |
| R-V5 | Docs du dépôt (spec, plan) qui révèlent la surprise si ta sœur tombe dessus | 1 | 1 | Le dépôt n'est lié nulle part ; ne pas le partager avant Noël | Aucun impact réel |

## 4 bis. Propriété intellectuelle

| ID | Risque | P | I | Prévention |
|---|---|---|---|---|
| R-I1 | Ressource officielle (sprite, son, police, texte) glissée dans le dépôt | 1 | 2 | ADR-007 ; checklist du relecteur ; contrôle de confidentialité (les images sont limitées à deux dossiers) |
| R-I2 | Nom ou visuel trop proche du jeu d'origine | 1 | 1 | Thème Sardine et nom « Sardinebagarre » : écarté par construction. Les mentions « inspiré de… » restent descriptives (README) |
| R-I3 | Reprise du code de `pret/pokeheartgold` | 1 | 2 | On ne copie pas de code : la spec décrit le comportement, le code est écrit de zéro en TypeScript |

## 5. Fidélité des règles

| ID | Risque | P | I | Prévention |
|---|---|---|---|---|
| R-F1 | Les wikis disent autre chose que notre jeu (niveau 8, défaite au niveau 8) et ta sœur pense à un bug | 2 | 1 | Hiérarchie des sources documentée (spec §0) ; page « Astuces » qui explique la règle du niveau 8 |
| R-F2 | La version française de la DS diffère de la version américaine décompilée | 1 | 2 | Les règles sont communes aux versions occidentales (même code de jeu) ; seuls les textes diffèrent, et nous ne les reprenons pas. ⚠️ Non vérifiable sans la ROM française : risque accepté |
| R-F3 | Interprétation erronée de la contrainte des multiplicateurs gratuits (« < » contre « ≤ ») | 1 | 2 | Spec explicite (strictement inférieur, d'après le code) ; test de propriété ; simulation de référence (1 à 3 tentatives en moyenne) |
| R-F4 | Probabilités de configuration différentes de l'original | 1 | 1 | Tirage uniforme sur 10 entrées (fidèle au code) ; test statistique (1.4) |
| R-F5 | Différences d'interface ressenties (mémo, enchaînements) | 2 | 1 | Mémo fidèle (Q13) ; révélation de fin et messages de niveau (Q14) ; le bêta-testeur de la phase 5 |

## 6. Les 5 risques à surveiller chaque semaine
1. **R-V1** Photo commitée en clair → `git status` avant chaque commit ; la CI doit rester verte.
2. **R-P1** Retard → regarder le calendrier tous les dimanches.
3. **R-T1** Règles → aucune tâche de logique fusionnée sans verdict ✅ du relecteur.
4. **R-P2** Limites Pro → noter les blocages dans le journal et ajuster le rythme.
5. **R-T6** Écart avec le vrai Safari → un test sur iPhone à chaque fin de phase, sans exception.
