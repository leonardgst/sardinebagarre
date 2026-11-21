import { describe, expect, it } from 'vitest';
import { entriesForLevel } from '../../src/logic/configs';
import { appendHistory, nextLevel, pickEntry } from '../../src/logic/levels';
import { mulberry32 } from '../../src/logic/rng';
import type { Level, Outcome, RoundRecord } from '../../src/logic/types';

function r(outcome: Outcome, cardsFlipped: number, level: Level): RoundRecord {
  return { outcome, cardsFlipped, level };
}

const N11: RoundRecord[] = [
  r('WON', 8, 1),
  r('WON', 8, 2),
  r('WON', 8, 3),
  r('WON', 8, 4),
  r('WON', 8, 5),
];

describe('nextLevel : vecteurs de la spec §6.3', () => {
  const cases: [string, RoundRecord[], Level][] = [
    ['N1 abandon à 0 carte au niveau 1 → 1', [r('QUIT', 0, 1)], 1],
    ['N2 abandon à 0 carte au niveau 6 → 1', [r('QUIT', 0, 6)], 1],
    ['N3 défaite après 1 carte au niveau 4 → 1', [r('LOST', 1, 4)], 1],
    ['N4 défaite après 2 cartes au niveau 4 → 2', [r('LOST', 2, 4)], 2],
    ['N5 défaite après 3 cartes au niveau 8 → 3', [r('LOST', 3, 8)], 3],
    ['N6 défaite au niveau 8 après 9 cartes → 7', [r('LOST', 9, 8)], 7],
    ['N7 abandon au niveau 8 après 9 cartes → 7', [r('QUIT', 9, 8)], 7],
    ['N8 victoire au niveau 7 → 7', [r('WON', 6, 7)], 7],
    ['N9 victoire au niveau 3 → 4', [r('WON', 5, 3)], 4],
    ['N10 victoire au niveau 8 → 8', [r('WON', 12, 8)], 8],
    ['N11 série de 5 victoires à 8 cartes → 8', N11, 8],
    [
      'N12 série avec un abandon → 8',
      [r('WON', 8, 1), r('WON', 8, 2), r('WON', 8, 3), r('WON', 8, 4), r('QUIT', 8, 5)],
      8,
    ],
    [
      'N13 série avec une partie à 7 cartes → 6',
      [r('WON', 8, 1), r('WON', 8, 2), r('WON', 8, 3), r('WON', 7, 4), r('WON', 9, 5)],
      6,
    ],
    ['N14 5 abandons à 8 cartes au niveau 2 → 2', Array(5).fill(r('QUIT', 8, 2)), 2],
    [
      'N15 défaite à la fin de la série → 7',
      [r('WON', 8, 4), r('WON', 8, 5), r('WON', 8, 6), r('WON', 8, 7), r('LOST', 9, 7)],
      7,
    ],
    ['N16 défaite après 5 cartes au niveau 5 → 5', [r('LOST', 5, 5)], 5],
    ['N17 défaite à 0 carte au niveau 1 → 1', [r('LOST', 0, 1)], 1],
  ];
  it.each(cases)('%s', (_name, history, expected) => {
    expect(nextLevel(history)).toBe(expected);
  });
});

describe('nextLevel : autres cas', () => {
  it('R-61 historique vide → niveau 1', () => {
    expect(nextLevel([])).toBe(1);
  });
  it('CL-01 abandon sans carte au niveau 6 → 1', () => {
    expect(nextLevel([r('QUIT', 0, 6)])).toBe(1);
  });
  it('CL-02 Sardine au premier retournement → 1', () => {
    expect(nextLevel([r('LOST', 0, 5)])).toBe(1);
  });
  it('CL-03 niveau 4, deux 1 puis Sardine → 2', () => {
    expect(nextLevel([r('LOST', 2, 4)])).toBe(2);
  });
  it('CL-04 un seul 1 puis Sardine → 1', () => {
    expect(nextLevel([r('LOST', 1, 6)])).toBe(1);
  });
  it.each([5, 8, 12])('CL-15 R-65 victoire au niveau 7 (k=%i) → 7, jamais 8', (k) => {
    expect(nextLevel([r('WON', k, 7)])).toBe(7);
  });
  it('CL-16 défaite au niveau 8 après 10 cartes → 7', () => {
    expect(nextLevel([r('LOST', 10, 8)])).toBe(7);
  });
  it('CL-17 R-64 série de 5 parties ≥ 8 cartes sans défaite, la dernière au niveau 5 → 8', () => {
    const h = [r('QUIT', 8, 3), r('WON', 9, 4), r('QUIT', 10, 2), r('WON', 8, 4), r('QUIT', 8, 5)];
    expect(nextLevel(h)).toBe(8);
  });
  it('R-64 série incomplète : 4 parties seulement → pas de 8', () => {
    expect(nextLevel(Array(4).fill(r('WON', 8, 5)))).toBe(6);
  });
  it('R-64 une défaite dans la série la casse, même ancienne', () => {
    const h = [r('LOST', 8, 5), r('WON', 8, 5), r('WON', 8, 5), r('WON', 8, 5), r('QUIT', 8, 6)];
    expect(nextLevel(h)).toBe(6);
  });
  it('R-64 une partie à 7 cartes dans la série la casse', () => {
    const h = [r('WON', 7, 5), r('WON', 8, 5), r('WON', 8, 5), r('WON', 8, 5), r('QUIT', 9, 6)];
    expect(nextLevel(h)).toBe(6);
  });
  it('R-64 série valide mais dernière partie au niveau 4 → pas de 8', () => {
    const h = [r('WON', 8, 5), r('WON', 8, 6), r('WON', 8, 7), r('WON', 8, 5), r('QUIT', 9, 4)];
    expect(nextLevel(h)).toBe(4);
  });
  it('R-60 au-delà de 5 parties, seules les 5 dernières comptent', () => {
    expect(nextLevel([r('LOST', 0, 1), ...N11])).toBe(8);
  });
  it('R-62 R-63 accord du pseudo-code avec les formules simples (une seule partie)', () => {
    const outcomes: Outcome[] = ['WON', 'LOST', 'QUIT'];
    let count = 0;
    for (let level = 1; level <= 8; level++) {
      for (let k = 0; k <= 24; k++) {
        for (const o of outcomes) {
          const won = level === 8 ? 8 : Math.min(level + 1, 7);
          const expected = o === 'WON' ? won : Math.max(1, Math.min(level, k, 7));
          expect(nextLevel([r(o, k, level as Level)])).toBe(expected);
          count++;
        }
      }
    }
    expect(count).toBe(600);
  });
});

describe('appendHistory', () => {
  it('R-60 ajouter à un historique vide', () => {
    expect(appendHistory([], r('WON', 3, 1))).toEqual([r('WON', 3, 1)]);
  });
  it("R-60 l'historique garde les 5 parties les plus récentes, de l'ancienne à la récente", () => {
    let h: readonly RoundRecord[] = [];
    for (let k = 0; k <= 6; k++) h = appendHistory(h, r('QUIT', k, 1));
    expect(h.map((x) => x.cardsFlipped)).toEqual([2, 3, 4, 5, 6]);
  });
  it("R-60 appendHistory ne modifie pas l'historique reçu et renvoie un tableau gelé", () => {
    const input = Object.freeze(N11.map((x) => Object.freeze({ ...x })));
    const copy = structuredClone(input);
    const out = appendHistory(input, r('LOST', 2, 3));
    expect(input).toEqual(copy);
    expect(Object.isFrozen(out)).toBe(true);
    expect(out.every((x) => Object.isFrozen(x))).toBe(true);
  });
});

describe('pickEntry', () => {
  const levels: Level[] = [1, 2, 3, 4, 5, 6, 7, 8];
  it('§3 pickEntry renvoie une entrée du niveau demandé', () => {
    for (const level of levels) {
      const rng = mulberry32(42);
      for (let i = 0; i < 100; i++) expect(pickEntry(level, rng).level).toBe(level);
    }
  });
  it('§3 pickEntry : bornes du hasard', () => {
    for (const level of levels) {
      const list = entriesForLevel(level);
      expect(pickEntry(level, () => 0)).toBe(list[0]);
      expect(pickEntry(level, () => 0.999999)).toBe(list[list.length - 1]);
    }
  });
  it('§3 pickEntry consomme un seul nombre aléatoire', () => {
    let calls = 0;
    pickEntry(3, () => {
      calls++;
      return 0.5;
    });
    expect(calls).toBe(1);
  });
  it('§3 pickEntry est déterministe pour une graine donnée', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 20; i++) expect(pickEntry(4, a)).toBe(pickEntry(4, b));
  });
  it('§3 pickEntry tire les 10 entrées uniformément', () => {
    for (const level of levels) {
      const rng = mulberry32(1000 + level);
      const counts = new Map<unknown, number>();
      for (let i = 0; i < 10000; i++) {
        const e = pickEntry(level, rng);
        counts.set(e, (counts.get(e) ?? 0) + 1);
      }
      expect(counts.size).toBe(10);
      for (const c of counts.values()) {
        expect(c).toBeGreaterThanOrEqual(800);
        expect(c).toBeLessThanOrEqual(1200);
      }
    }
  });
});
