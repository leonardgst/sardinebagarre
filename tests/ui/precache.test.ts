import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(import.meta.dirname, '..', '..', 'vite.config.ts'), 'utf8');

describe('précache du service worker', () => {
  it('R-125 précache : bin couvert, limite ≥ 10 Mo', () => {
    const motifs = /globPatterns:\s*\[\s*'([^']+)'/.exec(source)?.[1] ?? '';
    const extensions = /\{([^}]+)\}/.exec(motifs)?.[1]?.split(',') ?? [];
    expect(extensions).toContain('bin');
    const limite = /maximumFileSizeToCacheInBytes:\s*(\d+)\s*\*\s*1024\s*\*\s*1024/.exec(source);
    expect(Number(limite?.[1])).toBeGreaterThanOrEqual(10);
  });
});
