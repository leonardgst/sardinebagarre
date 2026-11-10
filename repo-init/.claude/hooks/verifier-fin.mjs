#!/usr/bin/env node
// Hook Stop (session principale) et SubagentStop (sous-agent codeur) :
// quand Claude veut terminer, on lance `npm run check` SI du code a été modifié
// (src/, tests/, scripts/). En cas d'échec, on renvoie l'erreur à Claude (code 2)
// pour qu'il corrige avant de rendre la main. Compatible Windows.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  /* entrée illisible : on continue avec un objet vide */
}

// Garde-fou anti-boucle : si Claude continue déjà à cause de ce hook, on ne bloque pas une 2e fois.
if (input.stop_hook_active === true) process.exit(0);

// Rien à vérifier tant que le projet n'est pas initialisé.
if (!existsSync(join(projectDir, "package.json"))) process.exit(0);
if (!existsSync(join(projectDir, "node_modules"))) process.exit(0);

// Y a-t-il des modifications non commitées dans le code ?
const status = spawnSync("git", ["status", "--porcelain", "--", "src", "tests", "scripts"], {
  cwd: projectDir,
  encoding: "utf8",
});
if (status.status !== 0 || status.stdout.trim() === "") process.exit(0);

// Sous Windows, npm est un raccourci .cmd : il faut un shell pour le lancer.
const check = spawnSync("npm", ["run", "check", "--silent"], {
  cwd: projectDir,
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (check.status === 0) process.exit(0);

const output = `${check.stdout ?? ""}\n${check.stderr ?? ""}`.trim().split(/\r?\n/).slice(-80).join("\n");
process.stderr.write(
  `❌ npm run check échoue sur le code modifié. Corrige avant de terminer :\n\n${output}\n`,
);
process.exit(2);
