import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../src/logic/rng';

function draw(seed: number, n: number): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => rng());
}

describe('mulberry32', () => {
  it('R-20 mulberry32 : vecteur de référence pour la graine 42', () => {
    expect(draw(42, 5)).toEqual([
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693,
      0.17481389874592423,
    ]);
  });

  it('R-20 mulberry32 : vecteur de référence pour la graine 0', () => {
    expect(draw(0, 3)).toEqual([0.26642920868471265, 0.0003297457005828619, 0.2232720274478197]);
  });

  it('R-20 mulberry32 : même graine → même suite', () => {
    expect(draw(123, 100)).toEqual(draw(123, 100));
  });

  it('R-20 mulberry32 : graines différentes → suites différentes', () => {
    expect(draw(1, 10)).not.toEqual(draw(2, 10));
  });

  it("R-20 mulberry32 : deux générateurs ne partagent pas d'état", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const first = a();
    a();
    a();
    expect(b()).toBe(first);
  });

  it('R-20 mulberry32 : 10 000 tirages dans [0, 1) et bien répartis', () => {
    const values = draw(2026, 10000);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    const buckets = new Array<number>(10).fill(0);
    for (const v of values) {
      const i = Math.floor(v * 10);
      buckets[i] = (buckets[i] ?? 0) + 1;
    }
    for (const count of buckets) {
      expect(count / values.length).toBeGreaterThanOrEqual(0.09);
      expect(count / values.length).toBeLessThanOrEqual(0.11);
    }
  });
});
