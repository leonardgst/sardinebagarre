# 05 — Guide Claude Code pour ce projet

> Comment fonctionnent `CLAUDE.md`, les réglages, les skills, les sous-agents et les hooks, et comment mettre en place la répartition **Opus (réflexion) / Sonnet (code)**.
> ✅ Mis à jour le 10/11 : développement sous **Windows** (§6 et §7), interdiction de lire `prive/`.
> Tout ce qui suit a été vérifié le 10/11/2026 dans la documentation officielle (code.claude.com/docs : pages *Subagents*, *Skills*, *Model configuration*, *Hooks*). Les points incertains sont marqués ⚠️ avec la façon de les vérifier.

---

## 1. La carte des concepts

| Élément | Fichier(s) | Chargé quand ? | Déclenché par | Rôle dans ce projet |
|---|---|---|---|---|
| **CLAUDE.md** | `./CLAUDE.md` | Toujours, au début de chaque session et de chaque sous-agent | Automatique | Règles permanentes : pile, commandes, architecture, conventions |
| **Réglages** | `.claude/settings.json` (partagé), `.claude/settings.local.json` (perso), `~/.claude/settings.json` (global) | Au démarrage | Automatique | Modèle par défaut, permissions, hooks |
| **Permissions** | clé `permissions` des réglages | À chaque outil | Automatique | Autoriser `npm run *` sans demander ; demander avant `git push` ; interdire `--force` ; **interdire la lecture de `prive/`** (photos de famille) |
| **Skills** | `.claude/skills/<nom>/SKILL.md` (+ fichiers annexes) | La **description** est toujours visible ; le **contenu** est chargé à l'invocation | Toi (`/nom`) ou Claude (automatiquement si la description correspond) | Méthodes : planifier, implémenter, TDD, contrôle visuel, déployer, ADR, règles |
| **Commandes personnalisées** | `.claude/commands/<nom>.md` | Idem | Toi (`/nom`) | **Fusionnées dans les skills** : on utilise uniquement des skills |
| **Sous-agents** | `.claude/agents/<nom>.md` | Quand Claude (ou toi) les appelle | Claude délègue, ou tu demandes (« utilise le sous-agent X », `@agent-X`) | `codeur` (Sonnet), `relecteur` (Opus) |
| **Hooks** | clé `hooks` des réglages + scripts `.claude/hooks/` | À des événements précis | Automatique | Formater après modification ; vérifier avant de s'arrêter |

Deux idées clés :
1. **Le contexte coûte.** Tout ce qui est dans CLAUDE.md est relu à chaque fois, donc il reste court. Le reste est chargé à la demande (skills, spec).
2. **Un sous-agent part de zéro.** Il reçoit sa propre définition, CLAUDE.md et le message de délégation, mais **pas** ta conversation. D'où les fiches de tâche complètes.

---

## 2. Modèles et effort

### 2.1 Ce qui existe
- **Alias de modèles** : `opus`, `sonnet`, `haiku`, `fable`, `best`, `opusplan`, `default`. Aujourd'hui, avec un abonnement Claude, `opus` = Opus 5.5 et `sonnet` = Sonnet 5.5. Sur l'offre Pro, le modèle **par défaut est Opus 5.5**.
- **Effort** (profondeur de réflexion) : `low`, `medium`, `high`, `xhigh`, `max`. Opus 5.5 et Sonnet 5.5 sont réglés par défaut sur **`medium`**.
- **Choisir le modèle** (par ordre de priorité) : `/model <alias>` en cours de session ; `claude --model <alias>` au lancement ; variable `ANTHROPIC_MODEL` ; clé `"model"` des réglages. `/model` enregistre aussi ton choix pour les sessions suivantes.
- **Choisir l'effort** : `/effort high` (enregistré **pour le modèle actif**) ; `/effort` seul ouvre un curseur ; `/effort status` affiche le niveau courant ; `/effort auto` revient au défaut ; `claude --effort high` vaut pour une session ; la variable `CLAUDE_CODE_EFFORT_LEVEL` passe **avant tout le reste** ; champ `effort` dans un skill ou un sous-agent.
- `max` **n'est pas accepté dans les fichiers de réglages** : seulement via `/effort`, `--effort` ou la variable d'environnement, et seulement pour la session.

### 2.2 Ordre de choix du modèle d'un sous-agent
1. le paramètre `model` que Claude passe éventuellement en lançant le sous-agent ;
2. le champ `model` de la définition (`inherit` = même modèle que la session) ;
3. la variable `CLAUDE_CODE_SUBAGENT_MODEL` ;
4. le modèle de la session.

Effort d'un sous-agent : champ `effort` de la définition ; Claude peut le remplacer ponctuellement ; la variable `CLAUDE_CODE_EFFORT_LEVEL` passe avant tout.

---

## 3. Mettre en place la répartition Opus / Sonnet

### 3.1 Recette retenue (A) : « Opus orchestre, Sonnet code »

```
Toi ──► Session principale : OPUS, effort high  (.claude/settings.json → "model": "opus" ; /effort high une fois)
          │  /planifier-tache …   (skill exécuté par Opus, effort high)
          │  /implementer-tache T-XXX
          │        └─► skill avec context: fork + agent: codeur
          │              └─► SOUS-AGENT codeur : model: sonnet, effort: medium
          │                     écrit le code, lance les tests, rend un compte rendu
          │  « Utilise le sous-agent relecteur pour relire T-XXX »
          │        └─► SOUS-AGENT relecteur : model: opus, effort: high, lecture seule
          ▼
        Opus lit les comptes rendus, décide, te répond
```

**Ce qui lance quoi :**
| Action | Qui la lance | Modèle qui travaille |
|---|---|---|
| Discuter, cadrer, décider | Toi, dans la session | Opus (high) |
| `/planifier-tache` | Toi | Opus (high, fixé dans le skill) |
| `/implementer-tache T-XXX` | Toi | Sonnet (medium) via `codeur` |
| Délégation spontanée de code | Opus, qui lit la description du `codeur` | Sonnet (medium) |
| Relecture | Toi (« utilise le sous-agent relecteur ») ou Opus | Opus (high) |
| Corrections après relecture | Toi : `/implementer-tache T-XXX` à nouveau | Sonnet |

**Mise en place, une seule fois :**
1. Les fichiers `repo-init/` sont dans le dépôt (étape 0.3).
2. Dans le dossier : `claude`, puis `/model` → vérifier « Opus » ; puis `/effort high` (enregistré pour Opus) ; `/effort status` doit afficher `high`.
3. Demande à Claude : « Quels sous-agents de projet sont disponibles ? » → `codeur` et `relecteur`. (La commande `/agents` a été retirée des versions récentes de Claude Code ; les sous-agents sont lus depuis `.claude/agents/` **au démarrage** : relancer `claude` après toute modification.)
4. **Ne définis pas** `CLAUDE_CODE_EFFORT_LEVEL` dans ton shell : la variable écraserait l'effort `medium` du `codeur` et le `high` d'Opus.

**Passer la main :**
- Opus → Sonnet : par la fiche de tâche (seul canal d'information, d'où son niveau de détail) et `/implementer-tache`.
- Sonnet → Opus : par le **compte rendu** final du sous-agent, résumé dans ta conversation, et par la fiche (sections *Compte rendu* et *Questions*).
- Opus → toi : questions, verdicts, propositions de fusion.

### 3.2 Variante B : alias `opusplan`
`/model opusplan` : Opus en **mode plan** (Maj+Tab pour l'activer), Sonnet automatiquement en exécution. L'effort étant enregistré par modèle, `/effort high` sous Opus et `/effort medium` sous Sonnet devraient être conservés ⚠️ (à vérifier avec `/effort status` dans chaque mode).
- ➕ Une seule conversation, pas de sous-agent.
- ➖ Moins de contrôle (relecture par le même fil de discussion, contexte qui grossit). Bien pour des petites corrections pendant la phase 5.

### 3.3 Variante C : deux terminaux
- Terminal 1 : `claude` (Opus) pour planifier et relire.
- Terminal 2 : `claude --agent codeur`. Toute la session prend le modèle et les outils du `codeur` (Sonnet).
- Le passage de relais se fait par les fiches `docs/taches/`. Utile si tu veux **voir** Sonnet travailler pas à pas et intervenir.

### 3.4 Ce qui n'est pas possible tel quel (ou demande de la vigilance)
| Souhait | Réalité | Contournement |
|---|---|---|
| « Opus ne peut **jamais** lancer le codeur avec un autre modèle » | Claude peut passer un paramètre `model` qui l'emporte sur la définition | Consigne dans CLAUDE.md ; tu peux vérifier dans le transcript. Forcer `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` imposerait le **même** modèle à **tous** les sous-agents, relecteur compris : déconseillé |
| Fixer l'effort `max` par défaut | Refusé dans les réglages | Inutile ici : `high` suffit |
| Fixer l'effort de la session dans `.claude/settings.json` | La clé `effortLevel` existe, mais sa prise en compte dépend du modèle et des choix déjà enregistrés via `/effort` ⚠️ | Utiliser `/effort high` une fois (enregistré par modèle dans `~/.claude/settings.json`) |
| Partager la conversation avec le sous-agent | Impossible : il repart de zéro | Fiche de tâche complète + champ `skills` qui précharge les règles |
| Un sous-agent sans CLAUDE.md | Possible (`omitClaudeMd: true`) | Pas souhaité ici : le codeur doit connaître les règles du projet |
| Choisir le modèle exact d'un skill exécuté en fork | Le skill prend le modèle de son `agent:` (`codeur` → Sonnet) ⚠️ | Vérifier une fois (§4.5) ; sinon demander « utilise le sous-agent codeur pour T-XXX » |

### 3.5 Offre Pro et limites d'usage
Ton abonnement Pro a des **limites d'usage** (fenêtres de quelques heures, et une limite hebdomadaire). Opus en effort `high` les consomme plus vite que Sonnet en `medium`, et c'est précisément pour ça qu'on confie le code (le plus gros volume) à Sonnet.
- Si une limite tombe : faire une pause, ou passer temporairement la session sur Sonnet pour les petites choses (`/model sonnet`, sans oublier de revenir à Opus).
- Les relectures Opus sont chères : une relecture par tâche, pas plus ; regrouper les petites tâches.
- Le détail exact des limites varie : consulte la page d'aide de ton offre sur support.claude.com et la commande `/usage` dans Claude Code ⚠️ (si elle n'existe pas dans ta version, `/help` liste les commandes).

---

## 4. Les skills de ce projet

### 4.1 Anatomie
```markdown
---
name: planifier-tache                 ← devient /planifier-tache
description: Ce que fait le skill et QUAND l'utiliser   ← lu en permanence par Claude pour décider
disable-model-invocation: true        ← seulement toi peux le lancer (pour les actions qui ont des effets)
argument-hint: "[description]"        ← aide à la saisie
model: opus                           ← modèle pendant ce skill
effort: high                          ← effort pendant ce skill
context: fork                         ← exécuter dans un sous-agent séparé…
agent: codeur                         ← …de ce type
allowed-tools: Bash(npm run screens*) ← outils autorisés sans demander pendant ce tour
---
Instructions en Markdown. $ARGUMENTS = ce que tu tapes après /nom.
!`git status --short`  ← commande exécutée AVANT que Claude lise le texte (le résultat est injecté)
```
Les noms de champs doivent être exacts : un champ mal écrit est **ignoré sans erreur**.

### 4.2 Les 7 skills
| Skill | Qui l'invoque | Pourquoi ces réglages |
|---|---|---|
| `regles-voltorbataille` | Claude (auto) + préchargé dans les 2 agents | Connaissance de référence, sans effet de bord |
| `planifier-tache` | Toi seulement | Opus high, ne code rien |
| `implementer-tache` | Toi seulement | `context: fork` + `agent: codeur` : c'est **le pont vers Sonnet** |
| `ajouter-fonctionnalite` | Claude (auto) + préchargé dans le codeur | Méthode TDD |
| `controle-visuel` | Claude (auto) | `allowed-tools` évite des demandes d'autorisation pour les captures |
| `deployer` | Toi seulement | Effets irréversibles (production) |
| `consigner-decision` | Claude ou toi | Garder l'historique des décisions |

### 4.3 Exercice d'apprentissage (phase 4)
Crée toi-même un skill `/jouer-test` qui lance `npx tsx scripts/partie-console.ts --seed $ARGUMENTS` et résume la partie. Étapes : dossier `.claude/skills/jouer-test/`, fichier `SKILL.md` avec `name`, `description`, `disable-model-invocation: true`, puis le texte. Tape `/` dans Claude Code : il apparaît.

### 4.4 Déboguer un skill
- Il n'apparaît pas : le `---` doit être sur la **première ligne** ; YAML valide (si le YAML est invalide, le skill est chargé sans ses réglages).
- Claude ne le déclenche pas tout seul : enrichir la `description` (cas d'usage en premier, mots que tu emploies réellement).
- Description + `when_to_use` sont tronquées à 1 536 caractères dans la liste.

### 4.5 Vérifier quel modèle a vraiment tourné
1. Après `/implementer-tache T-001`, développe le transcript (Ctrl+O) : le bloc du sous-agent indique son type (`codeur`) et, selon les versions, son modèle ⚠️.
2. Si le modèle n'est pas affiché : fais un essai témoin en changeant temporairement `model: sonnet` en `model: haiku` dans `codeur.md`, puis lance une petite tâche. La différence de style et de vitesse, et la consommation affichée par `/usage` ⚠️, le confirment. Remets ensuite `sonnet`.

---

## 5. Les sous-agents de ce projet

| | `codeur` | `relecteur` |
|---|---|---|
| Modèle / effort | `sonnet` / `medium` | `opus` / `high` |
| Outils | Read, Edit, Write, Glob, Grep, Bash | Read, Glob, Grep, Bash (**pas d'écriture**) |
| Skills préchargés | règles + ajouter-fonctionnalite | règles |
| Ne peut pas | lancer d'autres sous-agents (outil `Agent` absent), déployer | modifier le code |
| Sortie | compte rendu structuré | verdict ✅/🟡/❌ + liste priorisée |

Bon à savoir :
- Pour appeler un sous-agent explicitement : « Utilise le sous-agent relecteur pour… », ou `@` puis choisir `relecteur (agent)`.
- Les sous-agents lancés par Claude tournent **en arrière-plan** par défaut : tu peux continuer à discuter avec Opus pendant ce temps.
- Un sous-agent peut en lancer d'autres (jusqu'à 3 niveaux), sauf si l'outil `Agent` lui est retiré, ce qui est le cas ici.
- Pour créer ou modifier un sous-agent : édite le fichier dans `.claude/agents/`, ou demande-le à Claude (« modifie le sous-agent codeur pour… »), puis relance `claude`. L'ancien assistant `/agents` n'existe plus.

---

## 6. Les hooks de ce projet (compatibles Windows)

| Événement | Script | Effet |
|---|---|---|
| `PostToolUse` sur `Edit|Write` | `format-fichier.mjs` | Formate le fichier touché avec Biome. Ne bloque jamais. |
| `Stop` (Claude veut rendre la main) | `verifier-fin.mjs` | Si `src/`, `tests/` ou `scripts/` ont changé : `npm run check`. En cas d'échec, **code 2** : Claude reçoit l'erreur et doit corriger avant de s'arrêter. Le champ `stop_hook_active` évite une boucle infinie. |
| `Stop` **du sous-agent codeur** (déclaré dans `codeur.md`) | `verifier-fin.mjs` | Même contrôle, mais pour que **Sonnet** corrige lui-même avant de rendre son compte rendu. ⚠️ Dans un sous-agent, un hook `Stop` est converti en `SubagentStop` : vérifie une fois avec `/hooks` pendant que le codeur travaille, ou à la lecture de son compte rendu. |

**Pourquoi c'est fiable sous Windows** : les hooks sont déclarés en **exec form** (`"command": "node"` + `"args": [...]`). Claude Code lance alors `node.exe` directement, **sans passer par un shell** (ni Git Bash, ni PowerShell), et remplace lui-même `${CLAUDE_PROJECT_DIR}`. C'est la forme recommandée par la doc dès qu'un chemin est en jeu. Les scripts eux-mêmes sont en Node (pas de bash ni de `jq`), et appellent Biome via `node` (les raccourcis `.cmd` de `node_modules/.bin` ne se lancent pas sans shell sous Windows).

Tester un hook à la main (PowerShell, à la racine du dépôt) :
```powershell
$env:CLAUDE_PROJECT_DIR = (Get-Location).Path
'{"tool_input":{"file_path":"src/logic/rng.ts"}}' | node .claude/hooks/format-fichier.mjs ; "code=$LASTEXITCODE"
'{}' | node .claude/hooks/verifier-fin.mjs ; "code=$LASTEXITCODE"
```
`/hooks` dans Claude Code liste les hooks actifs.

### 6.1 Claude Code sous Windows : points d'attention
- Claude Code s'appuie sur **Git for Windows** (Git Bash) pour ses commandes shell ; tu l'as déjà. Lance `claude` depuis Windows Terminal ou PowerShell, dans `C:\dev\sardinebagarre`.
- Garde le projet **hors de OneDrive** (synchronisation et `node_modules` ne font pas bon ménage).
- Fins de ligne : `.gitattributes` impose LF ; `git config --global core.autocrlf false` (étape 0.1).
- Le pare-feu Windows demandera une autorisation la première fois que tu lances `npm run dev -- --host` : autorise sur les **réseaux privés**.
- Pas de Safari sous Windows : Playwright **WebKit** (le moteur de Safari) s'installe avec `npx playwright install webkit`. Le vrai Safari, c'est ton iPhone et le Mac de ton ami.

## 7. Aide-mémoire quotidien

```text
claude                         ouvrir Claude Code dans le dossier du projet
/model  /effort status         vérifier Opus + high
/skills                        skills chargés (ceux du projet doivent y figurer)
/context                       voir ce qui occupe le contexte
/hooks   /permissions   /context
/planifier-tache 2.3a          → fiche T-XXX
/implementer-tache T-XXX       → Sonnet code
« Utilise le sous-agent relecteur pour relire T-XXX »
/consigner-decision <titre>
/deployer                      vérifications, version, publication sur main (GitHub Pages)
/clear                         nouvelle conversation (le journal et les fiches gardent la mémoire)
Maj+Tab                        changer de mode (normal / acceptation auto des modifications / plan)
Échap                          interrompre Claude
```

Bonnes habitudes :
- **Une conversation par tâche** (`/clear` entre deux). Le journal et les fiches assurent la continuité.
- Relis toujours la fiche avant `/implementer-tache` (5 minutes qui évitent une heure perdue).
- Ne mélange pas « réfléchir » et « coder » dans le même message à Sonnet.
- Quand Claude se trompe sur une règle, ne corrige pas seulement le code : **ajoute un test** qui cite la règle, et, si c'était une ambiguïté, un ADR.

## 8. Sources
- Sous-agents : https://code.claude.com/docs/en/sub-agents
- Skills : https://code.claude.com/docs/en/skills
- Modèles et effort : https://code.claude.com/docs/en/model-config
- Hooks : https://code.claude.com/docs/en/hooks
- Réglages : https://code.claude.com/docs/en/settings
- Mémoire (CLAUDE.md) : https://code.claude.com/docs/en/memory