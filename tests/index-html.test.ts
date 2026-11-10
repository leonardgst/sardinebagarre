import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const racine = join(import.meta.dirname, '..');
const lire = (...p: string[]) => readFileSync(join(racine, ...p), 'utf8');

describe('index.html', () => {
  it('R-129 index.html contient la balise robots noindex', () => {
    expect(lire('index.html')).toContain('<meta name="robots" content="noindex">');
  });

  it('R-129 robots.txt interdit tout le site', () => {
    const lignes = lire('public', 'robots.txt').split(/\r?\n/);
    expect(lignes).toContain('User-agent: *');
    expect(lignes).toContain('Disallow: /');
  });

  it('UI-10 index.html active viewport-fit=cover', () => {
    const viewport = lire('index.html').match(/<meta name="viewport"[^>]*>/)?.[0] ?? '';
    expect(viewport).toContain('viewport-fit=cover');
  });

  it('index.html est en français et titré Sardinebagarre', () => {
    const html = lire('index.html');
    expect(html).toContain('lang="fr"');
    expect(html).toContain('<title>Sardinebagarre</title>');
  });
});
