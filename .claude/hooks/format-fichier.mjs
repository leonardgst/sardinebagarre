#!/usr/bin/env node
// Hook PostToolUse (Edit|Write) : formate le fichier modifié avec Biome.
// Ne bloque jamais : sort toujours avec le code 0 (un échec de formatage ne doit pas gêner Claude).
// Compatible Windows : on lance le lanceur JS de Biome avec node (pas les raccourcis .cmd de node_modules/.bin).
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative, isAbsolute } from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const file = input?.tool_input?.file_path;
if (!file || !/\.(ts|js|mjs|json|css|html)$/.test(file)) process.exit(0);

const rel = relative(projectDir, isAbsolute(file) ? file : join(projectDir, file)).replaceAll("\\", "/");
if (rel.startsWith("..") || /^(node_modules|dist|prive)\//.test(rel)) process.exit(0);

const biomeLauncher = join(projectDir, "node_modules", "@biomejs", "biome", "bin", "biome");
if (!existsSync(biomeLauncher)) process.exit(0); // Biome pas encore installé (début du projet)

spawnSync(process.execPath, [biomeLauncher, "format", "--write", rel], {
  cwd: projectDir,
  stdio: "ignore",
});
process.exit(0);
