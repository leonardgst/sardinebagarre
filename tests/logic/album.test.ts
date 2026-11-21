import { describe, expect, it } from 'vitest';
import { buyNextPhoto, missingCoins, nextPhoto } from '../../src/logic/album';
import { canStartRound, initialGame } from '../../src/logic/game';
import type { AlbumPhoto, GameState } from '../../src/logic/types';

const PHOTOS: readonly AlbumPhoto[] = [
  { id: 'p1', price: 100 },
  { id: 'p2', price: 200 },
  { id: 'p3', price: 300 },
];

function game(overrides: Partial<GameState>): GameState {
  return { ...initialGame(), ...overrides };
}

function expectFrozen(g: GameState): void {
  expect(Object.isFrozen(g)).toBe(true);
  expect(Object.isFrozen(g.history)).toBe(true);
  expect(Object.isFrozen(g.stats)).toBe(true);
  expect(Object.isFrozen(g.album)).toBe(true);
}

describe('album : prochaine photo', () => {
  it("R-111 la prochaine photo suit l'ordre du pack", () => {
    expect(nextPhoto(PHOTOS, [])?.id).toBe('p1');
    expect(nextPhoto(PHOTOS, ['p1'])?.id).toBe('p2');
    expect(nextPhoto(PHOTOS, ['p1', 'p2'])?.id).toBe('p3');
    expect(nextPhoto(PHOTOS, ['p1', 'p2', 'p3'])).toBeNull();
  });

  it("R-111 les identifiants inconnus de l'album sont ignorés", () => {
    expect(nextPhoto(PHOTOS, ['zz'])?.id).toBe('p1');
  });
});

describe('album : achat', () => {
  it("R-111 l'ordre du pack prime sur le prix", () => {
    const photos: readonly AlbumPhoto[] = [
      { id: 'a', price: 300 },
      { id: 'b', price: 100 },
    ];
    const g = game({ coins: 150 });
    expect(nextPhoto(photos, [])?.id).toBe('a');
    expect(buyNextPhoto(g, photos)).toBe(g);
    expect(missingCoins(g, photos)).toBe(150);
  });

  it('R-112 acheter débite le prix et ajoute la photo', () => {
    const g = buyNextPhoto(game({ coins: 250 }), PHOTOS);
    expect(g.coins).toBe(150);
    expect(g.album).toEqual(['p1']);
  });

  it('R-112 acheter au prix exact', () => {
    const g = buyNextPhoto(game({ coins: 100 }), PHOTOS);
    expect(g.coins).toBe(0);
    expect(g.album).toEqual(['p1']);
  });

  it('R-112 solde insuffisant : refus (même objet) et jetons manquants', () => {
    const g = game({ coins: 150, album: ['p1'] });
    expect(buyNextPhoto(g, PHOTOS)).toBe(g);
    expect(missingCoins(g, PHOTOS)).toBe(50);
  });

  it("R-112 missingCoins vaut 0 si on peut acheter ou s'il ne reste rien", () => {
    expect(missingCoins(game({ coins: 500 }), PHOTOS)).toBe(0);
    expect(missingCoins(game({ coins: 5, album: ['p1', 'p2', 'p3'] }), PHOTOS)).toBe(0);
  });

  it('R-111 album complet : plus rien à acheter', () => {
    const g = game({ coins: 10_000, album: ['p1', 'p2', 'p3'] });
    expect(buyNextPhoto(g, PHOTOS)).toBe(g);
  });

  it('R-116 CL-14 acheter une photo débloque une boîte pleine', () => {
    const g = game({ coins: 50_000 });
    expect(canStartRound(g)).toBe(false);
    const after = buyNextPhoto(g, PHOTOS);
    expect(after.coins).toBe(49_900);
    expect(canStartRound(after)).toBe(true);
  });

  it.each([-100, 12.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'R-116 un prix invalide (%s) est refusé',
    (price) => {
      const g = game({ coins: 50_000 });
      const photos: readonly AlbumPhoto[] = [{ id: 'p', price }];
      expect(buyNextPhoto(g, photos)).toBe(g);
      expect(missingCoins(g, photos)).toBe(0);
    },
  );

  it('R-110 une photo à 0 jeton peut être débloquée', () => {
    const g = buyNextPhoto(game({ coins: 0 }), [{ id: 'p', price: 0 }]);
    expect(g.album).toEqual(['p']);
    expect(g.coins).toBe(0);
  });

  it("R-112 trois achats successifs suivent l'ordre", () => {
    let g = game({ coins: 600 });
    for (let i = 0; i < 3; i++) g = buyNextPhoto(g, PHOTOS);
    expect(g.album).toEqual(['p1', 'p2', 'p3']);
    expect(g.coins).toBe(0);
  });

  it("R-112 buyNextPhoto ne modifie pas l'état reçu et renvoie un état gelé", () => {
    const g = game({ coins: 250, history: [], stats: { ...initialGame().stats }, album: [] });
    expect(Object.isFrozen(g.history)).toBe(false);
    expect(Object.isFrozen(g.stats)).toBe(false);
    const copy = structuredClone(g);
    const after = buyNextPhoto(g, PHOTOS);
    expect(g).toEqual(copy);
    expectFrozen(after);
  });
});
