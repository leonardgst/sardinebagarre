import { describe, expect, it } from 'vitest';
import { formatCoins, formatHintSum } from '../../src/ui/format';
import { colHintLabel, rowHintLabel } from '../../src/ui/texts.fr';

describe('format', () => {
  it('UI-02 formatCoins sur 5 chiffres', () => {
    expect([0, 7, 1235, 50000].map(formatCoins)).toEqual(['00000', '00007', '01235', '50000']);
  });

  it('R-02 formatHintSum sur 2 chiffres', () => {
    expect([0, 4, 13].map(formatHintSum)).toEqual(['00', '04', '13']);
  });

  it("UI-12 libellé d'indicateur au singulier et au pluriel", () => {
    expect(rowHintLabel(0, 5, 0)).toBe('Ligne 1 : somme 5, 0 Sardine');
    expect(rowHintLabel(0, 5, 1)).toBe('Ligne 1 : somme 5, 1 Sardine');
    expect(rowHintLabel(0, 5, 2)).toBe('Ligne 1 : somme 5, 2 Sardines');
    expect(colHintLabel(4, 7, 3)).toBe('Colonne 5 : somme 7, 3 Sardines');
    expect(colHintLabel(1, 7, 1)).toBe('Colonne 2 : somme 7, 1 Sardine');
  });
});
