import { beforeAll, describe, expect, it } from 'vitest';
import {
  countFreeMultipliers,
  createBoard,
  generateBoard,
  generateBoardDetailed,
  isAccepted,
  MAX_ATTEMPTS,
  placeCards,
} from '../../src/logic/board';
import { CONFIGS } from '../../src/logic/configs';
import { mulberry32 } from '../../src/logic/rng';
import type { CardValue, ConfigEntry, LineHint } from '../../src/logic/types';
import { boardFromRows } from './helpers';

const PLATEAU_MAIN = boardFromRows([
  'S 1 2 1 1',
  '1 3 1 1 S',
  '2 1 1 1 1',
  '1 1 S 1 3',
  '1 2 1 S 1',
]);

const entree = (maxLC: number, maxT: number): ConfigEntry => ({
  level: 1,
  variant: 'A',
  sardines: 6,
  twos: 0,
  threes: 0,
  maxFreePerLine: maxLC,
  maxFreeTotal: maxT,
});

const compter = (cells: readonly CardValue[], v: CardValue): number =>
  cells.filter((c) => c === v).length;

describe('plateau', () => {
  it("R-01 R-02 indicateurs de ligne d'un plateau construit à la main", () => {
    expect(PLATEAU_MAIN.rowHints).toEqual([
      { sum: 5, sardines: 1 },
      { sum: 6, sardines: 1 },
      { sum: 6, sardines: 0 },
      { sum: 6, sardines: 1 },
      { sum: 5, sardines: 1 },
    ]);
  });

  it("R-02 indicateurs de colonne d'un plateau construit à la main", () => {
    expect(PLATEAU_MAIN.colHints).toEqual([
      { sum: 5, sardines: 1 },
      { sum: 8, sardines: 0 },
      { sum: 5, sardines: 1 },
      { sum: 4, sardines: 1 },
      { sum: 6, sardines: 1 },
    ]);
  });

  it('R-01 id = ligne × 5 + colonne', () => {
    const c = PLATEAU_MAIN.cells;
    expect([c[0], c[6], c[10], c[17], c[24]]).toEqual(['S', 3, 2, 'S', 1]);
  });

  it('R-21 multiplicateur gratuit si sa ligne OU sa colonne est sans Sardine', () => {
    expect(countFreeMultipliers(PLATEAU_MAIN.cells)).toEqual({
      total: 3,
      perRow: [0, 1, 1, 0, 1],
      perCol: [1, 2, 0, 0, 0],
    });
  });

  it("R-21 un multiplicateur à la croisée d'une ligne et d'une colonne sans Sardine compte une seule fois", () => {
    const cells = [...PLATEAU_MAIN.cells];
    cells[11] = 2;
    expect(countFreeMultipliers(cells)).toEqual({
      total: 4,
      perRow: [0, 1, 2, 0, 1],
      perCol: [1, 3, 0, 0, 0],
    });
  });

  it('R-21 accepté si strictement sous les deux maxima', () => {
    const free = countFreeMultipliers(PLATEAU_MAIN.cells);
    expect(isAccepted(free, entree(3, 4))).toBe(true);
  });

  it('R-21 refusé si une ligne ou colonne atteint MaxLC', () => {
    const free = countFreeMultipliers(PLATEAU_MAIN.cells);
    expect(isAccepted(free, entree(2, 4))).toBe(false);
  });

  it('R-21 refusé si le total atteint MaxT', () => {
    const free = countFreeMultipliers(PLATEAU_MAIN.cells);
    expect(isAccepted(free, entree(3, 3))).toBe(false);
  });

  it('R-24 un plateau est gelé', () => {
    const b = PLATEAU_MAIN;
    expect(Object.isFrozen(b)).toBe(true);
    expect(Object.isFrozen(b.cells)).toBe(true);
    expect(Object.isFrozen(b.rowHints)).toBe(true);
    expect(Object.isFrozen(b.colHints)).toBe(true);
    expect(b.rowHints.every((h) => Object.isFrozen(h))).toBe(true);
    expect(b.colHints.every((h) => Object.isFrozen(h))).toBe(true);
  });

  it("R-01 createBoard refuse un plateau qui n'a pas 25 cartes", () => {
    expect(() => createBoard(new Array<CardValue>(24).fill(1))).toThrow();
  });
});

describe('génération', () => {
  it("R-22 placeCards place exactement S, 2, 3 et 1 selon l'entrée", () => {
    const cells = placeCards(CONFIGS[0] as ConfigEntry, mulberry32(1));
    expect(cells).toHaveLength(25);
    expect(compter(cells, 'S')).toBe(6);
    expect(compter(cells, 2)).toBe(3);
    expect(compter(cells, 3)).toBe(1);
    expect(compter(cells, 1)).toBe(15);
  });

  it('R-21 R-22 placeCards : chaque case reçoit une Sardine avec la même probabilité', () => {
    const rng = mulberry32(99);
    const entry = CONFIGS[0] as ConfigEntry;
    const n = 10000;
    const freq = new Array<number>(25).fill(0);
    for (let k = 0; k < n; k++) {
      placeCards(entry, rng).forEach((c, i) => {
        if (c === 'S') freq[i] = (freq[i] ?? 0) + 1;
      });
    }
    for (const f of freq) {
      expect(f / n).toBeGreaterThan(0.21);
      expect(f / n).toBeLessThan(0.27);
    }
  });

  it('R-20 même graine → même plateau', () => {
    const e = CONFIGS[40] as ConfigEntry;
    expect(generateBoard(e, mulberry32(2026))).toEqual(generateBoard(e, mulberry32(2026)));
  });

  it('R-20 graines différentes → plateaux différents', () => {
    const e = CONFIGS[40] as ConfigEntry;
    expect(generateBoard(e, mulberry32(1)).cells).not.toEqual(
      generateBoard(e, mulberry32(2)).cells,
    );
  });

  it('R-21 accepté dès la 1re tentative quand aucune contrainte ne gêne', () => {
    const e: ConfigEntry = { ...entree(1, 1), sardines: 6, twos: 0, threes: 0 };
    const r = generateBoardDetailed(e, mulberry32(3));
    expect(r.attempts).toBe(1);
    expect(r.accepted).toBe(true);
  });

  it('R-21 repli après 1 000 tentatives : on garde le dernier plateau', () => {
    const e: ConfigEntry = { ...entree(1, 0), sardines: 0, twos: 1, threes: 0 };
    const r = generateBoardDetailed(e, mulberry32(5));
    expect(r.attempts).toBe(1000);
    expect(r.accepted).toBe(false);
    expect(compter(r.board.cells, 2)).toBe(1);
    expect(compter(r.board.cells, 1)).toBe(24);
    const rng = mulberry32(5);
    let dernier: CardValue[] = [];
    for (let k = 0; k < MAX_ATTEMPTS; k++) dernier = placeCards(e, rng);
    expect(r.board.cells).toEqual(dernier);
  });
});

interface Resultat {
  readonly entry: ConfigEntry;
  readonly cells: readonly CardValue[];
  readonly rows: readonly LineHint[];
  readonly cols: readonly LineHint[];
  readonly attempts: number;
  readonly accepted: boolean;
}

const incr = (a: number[], i: number): void => {
  a[i] = (a[i] ?? 0) + 1;
};

/** Recalcul indépendant de R-21.3–5 (sans appeler board.ts). */
function contraintesRespectees(cells: readonly CardValue[], e: ConfigEntry): boolean {
  const sRow = [0, 0, 0, 0, 0];
  const sCol = [0, 0, 0, 0, 0];
  cells.forEach((c, id) => {
    if (c === 'S') {
      incr(sRow, Math.floor(id / 5));
      incr(sCol, id % 5);
    }
  });
  const gRow = [0, 0, 0, 0, 0];
  const gCol = [0, 0, 0, 0, 0];
  let total = 0;
  cells.forEach((c, id) => {
    if (c !== 2 && c !== 3) return;
    const l = Math.floor(id / 5);
    const k = id % 5;
    if (sRow[l] === 0 || sCol[k] === 0) {
      total++;
      incr(gRow, l);
      incr(gCol, k);
    }
  });
  return (
    total < e.maxFreeTotal &&
    gRow.every((n) => n < e.maxFreePerLine) &&
    gCol.every((n) => n < e.maxFreePerLine)
  );
}

describe('propriétés sur 80 000 plateaux', () => {
  const resultats: Resultat[] = [];

  beforeAll(() => {
    CONFIGS.forEach((entry, i) => {
      for (let k = 0; k < 1000; k++) {
        const r = generateBoardDetailed(entry, mulberry32(i * 1000 + k));
        resultats.push({
          entry,
          cells: r.board.cells,
          rows: r.board.rowHints,
          cols: r.board.colHints,
          attempts: r.attempts,
          accepted: r.accepted,
        });
      }
    });
  });

  it('§15.2 propriété : 1 000 plateaux par entrée, comptes exacts, contraintes et indicateurs', () => {
    expect(resultats).toHaveLength(80000);
    const val = (c: CardValue): number => (c === 'S' ? 0 : c);
    const problemes: string[] = [];
    const verifier = (ok: boolean, msg: string): void => {
      if (!ok) problemes.push(msg);
    };
    const egal = (h: LineHint | undefined, sum: number, sardines: number): boolean =>
      h?.sum === sum && h.sardines === sardines;
    resultats.forEach((r, n) => {
      const e = r.entry;
      verifier(r.accepted, `#${n} non accepté`);
      verifier(compter(r.cells, 'S') === e.sardines, `#${n} comptes S`);
      verifier(compter(r.cells, 2) === e.twos, `#${n} comptes 2`);
      verifier(compter(r.cells, 3) === e.threes, `#${n} comptes 3`);
      verifier(compter(r.cells, 1) === 25 - e.sardines - e.twos - e.threes, `#${n} comptes 1`);
      verifier(contraintesRespectees(r.cells, e), `#${n} contraintes R-21.5`);
      for (let i = 0; i < 5; i++) {
        const ligne = r.cells.slice(i * 5, i * 5 + 5);
        const colonne = [0, 1, 2, 3, 4].map((l) => r.cells[l * 5 + i] as CardValue);
        verifier(
          egal(
            r.rows[i],
            ligne.reduce((x, c) => x + val(c), 0),
            compter(ligne, 'S'),
          ),
          `#${n} ligne ${i}`,
        );
        verifier(
          egal(
            r.cols[i],
            colonne.reduce((x, c) => x + val(c), 0),
            compter(colonne, 'S'),
          ),
          `#${n} colonne ${i}`,
        );
      }
    });
    expect({ nombre: problemes.length, premiers: problemes.slice(0, 20) }).toEqual({
      nombre: 0,
      premiers: [],
    });
  });

  it('R-23 propriété : 1 à 3 tentatives en moyenne, jamais de repli', () => {
    const total = resultats.reduce((a, r) => a + r.attempts, 0);
    const moyenne = total / resultats.length;
    expect(moyenne).toBeGreaterThanOrEqual(1);
    expect(moyenne).toBeLessThanOrEqual(3);
    expect(resultats.every((r) => r.accepted)).toBe(true);
  });
});
