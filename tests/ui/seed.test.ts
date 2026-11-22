import { describe, expect, it } from 'vitest';
import { createRngs, readSeed } from '../../src/ui/seed';

const tirer = (rng: () => number, n: number) => Array.from({ length: n }, () => rng());

describe('seed', () => {
  it('seed : ?seed=42 pris en compte en développement', () => {
    expect(readSeed('?seed=42', true)).toBe(42);
  });

  it('seed : ?seed ignoré en production', () => {
    const valeurs = [0, 1, 2].map(() => readSeed('?seed=42', false));
    for (const v of valeurs) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
    expect(valeurs.some((v) => v !== 42)).toBe(true);
  });

  it('seed : ?seed invalide ignoré', () => {
    for (const s of ['?seed=abc', '?seed=', '?seed=-3', '?seed=1.5']) {
      const v = readSeed(s, true);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('seed : deux générateurs distincts et reproductibles', () => {
    const a = createRngs(42);
    const b = createRngs(42);
    expect(tirer(a.board, 5)).toEqual(tirer(b.board, 5));
    expect(tirer(a.decor, 5)).toEqual(tirer(b.decor, 5));
    expect(tirer(createRngs(42).board, 5)).not.toEqual(tirer(createRngs(42).decor, 5));
  });
});
