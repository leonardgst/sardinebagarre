import { describe, expect, it } from 'vitest';
import { coinsLabel, levelChangeMessages, messages, pickMessage } from '../../src/ui/texts.fr';

describe('texts', () => {
  it('UI-60 pluriel de jeton', () => {
    expect([0, 1, 2, 50000].map(coinsLabel)).toEqual([
      '0 jeton',
      '1 jeton',
      '2 jetons',
      '50000 jetons',
    ]);
  });

  it('R-66 montée de niveau, avec et sans Bravo', () => {
    expect(levelChangeMessages(1, 2, false)).toEqual([
      'Niveau 2 atteint !',
      'Bravo ! Tu peux gagner encore plus de jetons.',
    ]);
    expect(levelChangeMessages(1, 2, true)).toEqual(['Niveau 2 atteint !']);
  });

  it('R-66 descente de niveau', () => {
    expect(levelChangeMessages(4, 2, false)).toEqual(['Retour au niveau 2.']);
  });

  it('R-66 niveau identique : aucun message', () => {
    expect(levelChangeMessages(3, 3, false)).toEqual([]);
  });

  it('UI-60 tirage dans la liste sardine', () => {
    const list = messages.sardine;
    expect(pickMessage(list, () => 0)).toBe(list[0]);
    expect(pickMessage(list, () => 0.99)).toBe(list[list.length - 1]);
  });
});
