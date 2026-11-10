import { describe, expect, it } from 'vitest';
import { CONFIGS, entriesForLevel, maxPayout } from '../../src/logic/configs';
import type { Level } from '../../src/logic/types';

// Copie indépendante de la table de docs/specification.md §3.
// [niveau, Sardines, n2, n3, nb1, gainMax, A.MaxLC, A.MaxT, B.MaxLC, B.MaxT]
const SPEC: readonly (readonly number[])[] = [
  [1, 6, 3, 1, 15, 24, 3, 3, 3, 3],
  [1, 6, 0, 3, 16, 27, 2, 2, 2, 2],
  [1, 6, 5, 0, 14, 32, 3, 4, 3, 4],
  [1, 6, 2, 2, 15, 36, 3, 3, 3, 3],
  [1, 6, 4, 1, 14, 48, 3, 4, 3, 4],
  [2, 7, 1, 3, 14, 54, 2, 3, 2, 2],
  [2, 7, 6, 0, 12, 64, 3, 4, 3, 3],
  [2, 7, 3, 2, 13, 72, 2, 3, 2, 2],
  [2, 7, 0, 4, 14, 81, 2, 3, 2, 2],
  [2, 7, 5, 1, 12, 96, 3, 4, 3, 3],
  [3, 8, 2, 3, 12, 108, 2, 3, 2, 2],
  [3, 8, 7, 0, 10, 128, 3, 4, 3, 3],
  [3, 8, 4, 2, 11, 144, 3, 4, 3, 3],
  [3, 8, 1, 4, 12, 162, 2, 3, 2, 2],
  [3, 8, 6, 1, 10, 192, 4, 3, 3, 3],
  [4, 8, 3, 3, 11, 216, 4, 3, 3, 3],
  [4, 8, 0, 5, 12, 243, 2, 3, 2, 2],
  [4, 10, 8, 0, 7, 256, 4, 5, 4, 4],
  [4, 10, 5, 2, 8, 288, 3, 4, 3, 3],
  [4, 10, 2, 4, 9, 324, 3, 4, 3, 3],
  [5, 10, 7, 1, 7, 384, 4, 5, 4, 4],
  [5, 10, 4, 3, 8, 432, 3, 4, 3, 3],
  [5, 10, 1, 5, 9, 486, 3, 4, 3, 3],
  [5, 10, 9, 0, 6, 512, 4, 5, 4, 4],
  [5, 10, 6, 2, 7, 576, 4, 5, 4, 4],
  [6, 10, 3, 4, 8, 648, 3, 4, 3, 3],
  [6, 10, 0, 6, 9, 729, 3, 4, 3, 3],
  [6, 10, 8, 1, 6, 768, 4, 5, 4, 4],
  [6, 10, 5, 3, 7, 864, 4, 5, 4, 4],
  [6, 10, 2, 5, 8, 972, 3, 4, 3, 3],
  [7, 10, 7, 2, 6, 1152, 4, 5, 4, 4],
  [7, 10, 4, 4, 7, 1296, 4, 5, 4, 4],
  [7, 13, 1, 6, 5, 1458, 3, 4, 3, 3],
  [7, 13, 9, 1, 2, 1536, 5, 6, 5, 5],
  [7, 10, 6, 3, 6, 1728, 4, 5, 4, 4],
  [8, 10, 0, 7, 8, 2187, 3, 4, 3, 3],
  [8, 10, 8, 2, 5, 2304, 5, 6, 5, 5],
  [8, 10, 5, 4, 6, 2592, 4, 5, 4, 4],
  [8, 10, 2, 6, 7, 2916, 4, 5, 4, 4],
  [8, 10, 7, 3, 5, 3456, 5, 6, 5, 5],
];

const LEVELS: readonly Level[] = [1, 2, 3, 4, 5, 6, 7, 8];

const cases = SPEC.map((row, index) => ({
  row,
  index,
  niveau: row[0],
  k: (index % 5) + 1,
  gainMax: row[5],
  nb1: row[4],
}));

const casesAB = cases.flatMap((c) => [
  { ...c, v: 'A' as const },
  { ...c, v: 'B' as const },
]);

function entryAt(i: number) {
  const entry = CONFIGS[i];
  if (!entry) throw new Error('entrée manquante');
  return entry;
}

describe('table des configurations', () => {
  it('R-11 la table contient 80 entrées (40 configurations × variantes A et B)', () => {
    expect(CONFIGS).toHaveLength(80);
    expect(CONFIGS.filter((e) => e.variant === 'A')).toHaveLength(40);
    expect(CONFIGS.filter((e) => e.variant === 'B')).toHaveLength(40);
  });

  it('R-11 chaque niveau de 1 à 8 a exactement 10 entrées', () => {
    for (const level of LEVELS) {
      const entries = entriesForLevel(level);
      expect(entries).toHaveLength(10);
      expect(entries.every((e) => e.level === level)).toBe(true);
    }
  });

  it.each(casesAB)(
    'R-11 niveau $niveau, configuration $k, variante $v conforme à la spec',
    ({ row, index, v }) => {
      const entry = entryAt(index * 2 + (v === 'A' ? 0 : 1));
      expect(entry).toEqual({
        level: row[0],
        variant: v,
        sardines: row[1],
        twos: row[2],
        threes: row[3],
        maxFreePerLine: v === 'A' ? row[6] : row[8],
        maxFreeTotal: v === 'A' ? row[7] : row[9],
      });
    },
  );

  it.each(cases)(
    'R-10 niveau $niveau, configuration $k : gain max = 2^n2 × 3^n3 = $gainMax',
    ({ index, gainMax }) => {
      expect(maxPayout(entryAt(index * 2))).toBe(gainMax);
    },
  );

  it.each(cases)(
    '§3 niveau $niveau, configuration $k : 25 − S − n2 − n3 = $nb1 cartes à 1',
    ({ index, nb1 }) => {
      const e = entryAt(index * 2);
      expect(25 - e.sardines - e.twos - e.threes).toBe(nb1);
    },
  );

  it('R-10 le gain max ne dépasse jamais 3 456', () => {
    expect(Math.max(...CONFIGS.map(maxPayout))).toBe(3456);
  });

  it("R-11 les variantes A et B d'une configuration ont les mêmes comptes", () => {
    for (let i = 0; i < CONFIGS.length; i += 2) {
      const a = entryAt(i);
      const b = entryAt(i + 1);
      expect(a.variant).toBe('A');
      expect(b.variant).toBe('B');
      expect([b.level, b.sardines, b.twos, b.threes]).toEqual([
        a.level,
        a.sardines,
        a.twos,
        a.threes,
      ]);
    }
  });

  it('R-11 la table est gelée', () => {
    expect(Object.isFrozen(CONFIGS)).toBe(true);
    expect(Object.isFrozen(CONFIGS[0])).toBe(true);
  });
});
