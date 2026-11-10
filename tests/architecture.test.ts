import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RACINE_LOGIC = join(import.meta.dirname, '..', 'src', 'logic');

function retirerCommentaires(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function findForbiddenUsages(source: string): string[] {
  const code = retirerCommentaires(source);
  const trouves: string[] = [];
  const motifs: [string, RegExp][] = [
    ['window', /\bwindow\b/g],
    ['document', /\bdocument\b/g],
    ['localStorage', /\blocalStorage\b/g],
    ['crypto', /\bcrypto\b/g],
    ['Date.now', /\bDate\.now\b/g],
    ['Math.random', /\bMath\.random\b/g],
    ['globalThis', /\bglobalThis\b/g],
    [
      'import de ui',
      /\b(?:import|export)\b[^;'"]*?\bfrom\s*['"](?:\.{1,2}\/)+ui(?:\/[^'"]*)?['"]|\bimport\s*['"](?:\.{1,2}\/)+ui(?:\/[^'"]*)?['"]/g,
    ],
  ];
  for (const [nom, re] of motifs) {
    for (const _ of code.matchAll(re)) trouves.push(nom);
  }
  return trouves;
}

function listerTs(dossier: string): string[] {
  let entrees: import('node:fs').Dirent[];
  try {
    entrees = readdirSync(dossier, { withFileTypes: true });
  } catch {
    return [];
  }
  return entrees.flatMap((e) => {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) return listerTs(chemin);
    return e.name.endsWith('.ts') ? [chemin] : [];
  });
}

describe('architecture', () => {
  it("ADR-006 aucun fichier de src/logic/ n'utilise d'API interdite", () => {
    const problemes = listerTs(RACINE_LOGIC).flatMap((f) =>
      findForbiddenUsages(readFileSync(f, 'utf8')).map((u) => `${f} : ${u}`),
    );
    expect(problemes).toEqual([]);
  });

  it.each([
    'window.innerWidth',
    'document.title',
    'localStorage.getItem("k")',
    'crypto.getRandomValues(a)',
    'Date.now()',
    'Math.random()',
    'globalThis.x',
    'import { a } from "../ui/main";',
  ])('ADR-006 détecteur : %s est repéré', (code) => {
    expect(findForbiddenUsages(code)).toHaveLength(1);
  });

  it('ADR-006 détecteur : code pur et commentaires acceptés', () => {
    const code = [
      'export const add = (a: number, b: number) => a + b; // Math.random et window interdits ici',
      '/* document */',
      'const documentCount = 1;',
    ].join('\n');
    expect(findForbiddenUsages(code)).toEqual([]);
  });
});
