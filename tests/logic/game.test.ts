import { describe, expect, it } from 'vitest';
import { generateBoard } from '../../src/logic/board';
import {
  canStartRound,
  emptyBox,
  finalizeRound,
  initialGame,
  leaveTable,
  resetProgress,
  startRound,
} from '../../src/logic/game';
import { pickEntry } from '../../src/logic/levels';
import { mulberry32 } from '../../src/logic/rng';
import { flip, newRound } from '../../src/logic/round';
import type {
  GameState,
  Level,
  Outcome,
  RoundRecord,
  RoundState,
  RoundStatus,
} from '../../src/logic/types';
import { boardFromRows } from './helpers';

const PLATEAU_MAIN = boardFromRows([
  'S 1 2 1 1',
  '1 3 1 1 S',
  '2 1 1 1 1',
  '1 1 S 1 3',
  '1 2 1 S 1',
]);

function game(overrides: Partial<GameState>): GameState {
  return { ...initialGame(), ...overrides };
}

function ended(status: RoundStatus, payout: number, cardsFlipped: number): RoundState {
  return { ...newRound(PLATEAU_MAIN), status, payout, cardsFlipped };
}

function r(outcome: Outcome, k: number, level: Level): RoundRecord {
  return { outcome, cardsFlipped: k, level };
}

function expectFrozen(g: GameState): void {
  expect(Object.isFrozen(g)).toBe(true);
  expect(Object.isFrozen(g.history)).toBe(true);
  expect(Object.isFrozen(g.stats)).toBe(true);
  expect(Object.isFrozen(g.album)).toBe(true);
}

describe('état initial', () => {
  it('R-61 R-70 état initial', () => {
    const g = initialGame();
    expect(g.coins).toBe(0);
    expect(g.level).toBe(1);
    expect(g.history).toEqual([]);
    expect(g.album).toEqual([]);
    expect(g.stats).toEqual({
      bestPayout: 0,
      maxLevel: 1,
      played: 0,
      won: 0,
      lost: 0,
      quit: 0,
      level8Reached: 0,
    });
    expectFrozen(g);
  });
});

describe('finalizeRound', () => {
  it('CL-23 R-55 victoire au niveau 3, gain 72, total 100 → 172, historique, niveau 4, records', () => {
    const g = finalizeRound(game({ coins: 100, level: 3, album: ['p1'] }), ended('WON', 72, 5));
    expect(g.album).toEqual(['p1']);
    expect(g.coins).toBe(172);
    expect(g.history).toEqual([r('WON', 5, 3)]);
    expect(g.level).toBe(4);
    expect(g.stats.played).toBe(1);
    expect(g.stats.won).toBe(1);
    expect(g.stats.bestPayout).toBe(72);
    expect(g.stats.maxLevel).toBe(4);
  });

  it("R-51 défaite : rien n'est encaissé", () => {
    // État impossible en jeu (R-34 met le gain à 0) : on vérifie que finalizeRound ignore le gain d'une défaite.
    const g = finalizeRound(game({ coins: 500, level: 4 }), ended('LOST', 40, 2));
    expect(g.coins).toBe(500);
    expect(g.history).toEqual([r('LOST', 2, 4)]);
    expect(g.level).toBe(2);
    expect(g.stats.lost).toBe(1);
    expect(g.stats.bestPayout).toBe(0);
  });

  it('R-42 R-50 abandon : le gain est encaissé', () => {
    const g = finalizeRound(game({ coins: 10, level: 2 }), ended('QUIT', 6, 3));
    expect(g.coins).toBe(16);
    expect(g.history).toEqual([r('QUIT', 3, 2)]);
    expect(g.level).toBe(2);
    expect(g.stats.quit).toBe(1);
    expect(g.stats.bestPayout).toBe(6);
  });

  it('CL-01 abandon sans carte au niveau 6 → niveau 1, +0', () => {
    const g = finalizeRound(game({ coins: 300, level: 6 }), ended('QUIT', 0, 0));
    expect(g.coins).toBe(300);
    expect(g.level).toBe(1);
  });

  it('CL-13 R-50 total 49 990 + gain 48 → 50 000', () => {
    const g = finalizeRound(game({ coins: 49_990 }), ended('QUIT', 48, 3));
    expect(g.coins).toBe(50_000);
    expect(g.stats.bestPayout).toBe(48);
  });

  it('R-55 finaliser une partie en cours est une erreur', () => {
    expect(() => finalizeRound(initialGame(), ended('PLAYING', 6, 2))).toThrow(Error);
  });

  it("CL-17 R-55 le niveau suivant est calculé sur l'historique complété", () => {
    const g = finalizeRound(
      game({
        level: 5,
        history: [r('WON', 8, 1), r('WON', 8, 2), r('WON', 8, 3), r('WON', 8, 4)],
      }),
      ended('QUIT', 50, 8),
    );
    expect(g.level).toBe(8);
    expect(g.history.length).toBe(5);
    expect(g.stats.maxLevel).toBe(8);
    expect(g.stats.level8Reached).toBe(1);
  });

  it("R-60 l'historique ne garde que 5 parties", () => {
    let g = initialGame();
    for (let i = 0; i < 6; i++) g = finalizeRound(g, ended('QUIT', 1, 1));
    expect(g.history.length).toBe(5);
    expect(g.stats.played).toBe(6);
  });

  it('ADR-017 niveau 8 atteint : seules les montées comptent', () => {
    const g1 = game({
      level: 5,
      history: [r('WON', 8, 1), r('WON', 8, 2), r('WON', 8, 3), r('WON', 8, 4)],
    });
    const g2 = finalizeRound(g1, ended('QUIT', 50, 8));
    expect(g2.level).toBe(8);
    expect(g2.stats.level8Reached).toBe(1);

    const g3 = finalizeRound(g2, ended('WON', 100, 9));
    expect(g3.level).toBe(8);
    expect(g3.stats.level8Reached).toBe(1);

    const g4 = finalizeRound(g3, ended('LOST', 0, 9));
    expect(g4.level).toBe(7);
    expect(g4.stats.level8Reached).toBe(1);

    const g5 = finalizeRound(g4, ended('QUIT', 10, 8));
    expect(g5.history).toEqual([
      r('WON', 8, 4),
      r('QUIT', 8, 5),
      r('WON', 9, 8),
      r('LOST', 9, 8),
      r('QUIT', 8, 7),
    ]);
    expect(g5.level).toBe(7);
    expect(g5.stats.level8Reached).toBe(1);
    expect(g5.stats.maxLevel).toBe(8);

    // Remontée réelle (cas séparé).
    const h = game({
      level: 7,
      history: [r('WON', 8, 5), r('WON', 8, 6), r('WON', 8, 7), r('QUIT', 8, 7)],
      stats: { ...initialGame().stats, level8Reached: 1, maxLevel: 8 },
    });
    const h2 = finalizeRound(h, ended('QUIT', 20, 8));
    expect(h2.level).toBe(8);
    expect(h2.stats.level8Reached).toBe(2);
  });

  it('ADR-017 niveau maximal = plus haut niveau obtenu', () => {
    const a = finalizeRound(game({ level: 3 }), ended('WON', 10, 5));
    expect(a.level).toBe(4);
    expect(a.stats.maxLevel).toBe(4);
    const b = finalizeRound(a, ended('LOST', 0, 0));
    expect(b.level).toBe(1);
    expect(b.stats.maxLevel).toBe(4);
  });

  it('R-72 meilleur gain : maximum des parties gagnées ou abandonnées', () => {
    let g = initialGame();
    g = finalizeRound(g, ended('QUIT', 30, 3));
    g = finalizeRound(g, ended('WON', 12, 4));
    g = finalizeRound(g, ended('LOST', 0, 2));
    expect(g.stats.bestPayout).toBe(30);
  });

  it('R-72 compteurs par issue', () => {
    let g = initialGame();
    g = finalizeRound(g, ended('WON', 6, 4));
    g = finalizeRound(g, ended('LOST', 0, 2));
    g = finalizeRound(g, ended('LOST', 0, 1));
    g = finalizeRound(g, ended('QUIT', 2, 2));
    expect(g.stats.played).toBe(4);
    expect(g.stats.won).toBe(1);
    expect(g.stats.lost).toBe(2);
    expect(g.stats.quit).toBe(1);
  });

  it("R-55 finalizeRound ne modifie pas l'état reçu et renvoie un état gelé", () => {
    const g = game({ coins: 100, level: 3, history: [r('WON', 5, 2)] });
    const copy = structuredClone(g);
    const after = finalizeRound(g, ended('WON', 72, 5));
    expect(g).toEqual(copy);
    expectFrozen(after);
  });
});

describe('startRound', () => {
  it('R-53 CL-14 boîte pleine : pas de nouvelle partie', () => {
    const g = game({ coins: 50_000 });
    expect(canStartRound(g)).toBe(false);
    expect(startRound(g, mulberry32(1))).toBeNull();
  });

  it('R-53 à 49 999 jetons on peut encore jouer', () => {
    const g = game({ coins: 49_999 });
    expect(canStartRound(g)).toBe(true);
    expect(startRound(g, mulberry32(1))).not.toBeNull();
  });

  it('§3 startRound tire une entrée du niveau courant et une partie neuve', () => {
    const s = startRound(game({ level: 6 }), mulberry32(3));
    expect(s).not.toBeNull();
    expect(s?.entry.level).toBe(6);
    expect(s?.round.status).toBe('PLAYING');
    expect(s?.round.payout).toBe(0);
    expect(s?.round.cardsFlipped).toBe(0);
    expect(s?.round.flipped.some(Boolean)).toBe(false);
  });

  it('§3 startRound est déterministe et suit pickEntry puis generateBoard', () => {
    const s = startRound(game({ level: 6 }), mulberry32(9));
    const rng = mulberry32(9);
    const e = pickEntry(6, rng);
    const b = generateBoard(e, rng);
    expect(s?.entry).toBe(e);
    expect(s?.round.board.cells).toEqual(b.cells);
  });

  it('CL-18 R-68 une partie interrompue ne laisse aucune trace', () => {
    const g = game({ coins: 1000, level: 5 });
    const copy = structuredClone(g);
    const s = startRound(g, mulberry32(4));
    let round = s?.round as RoundState;
    for (let id = 0; id < 25 && round.status === 'PLAYING' && round.payout === 0; id++) {
      round = flip(round, id);
    }
    expect(g).toEqual(copy);
    const s2 = startRound(g, mulberry32(5));
    expect(s2?.entry.level).toBe(5);
  });
});

describe('états du joueur', () => {
  it('R-67 quitter la table : niveau 1 et historique vide', () => {
    const g = game({
      coins: 700,
      level: 6,
      history: [r('WON', 6, 5)],
      album: ['p1'],
      stats: { ...initialGame().stats, played: 3, won: 1, bestPayout: 72, maxLevel: 6 },
    });
    const after = leaveTable(g);
    expect(after.level).toBe(1);
    expect(after.history).toEqual([]);
    expect(after.coins).toBe(700);
    expect(after.album).toEqual(['p1']);
    expect(after.stats).toEqual(g.stats);
    expectFrozen(after);
  });

  it('R-53 vider la boîte : jetons à 0, le reste inchangé', () => {
    const g = game({
      coins: 50_000,
      level: 4,
      history: [r('WON', 5, 3)],
      album: ['p1'],
      stats: { ...initialGame().stats, played: 3, won: 1, bestPayout: 72, maxLevel: 6 },
    });
    const after = emptyBox(g);
    expect(after.coins).toBe(0);
    expect(after.level).toBe(4);
    expect(after.history).toEqual(g.history);
    expect(after.album).toEqual(['p1']);
    expect(after.stats).toEqual(g.stats);
    expectFrozen(after);
  });

  it('ADR-017 effacer toute la progression', () => {
    const g = game({
      coins: 1234,
      level: 6,
      history: [r('WON', 6, 5)],
      album: ['p1', 'p2'],
      stats: { ...initialGame().stats, played: 9, won: 4, maxLevel: 8, bestPayout: 999 },
    });
    const after = resetProgress(g);
    expect(after).toEqual(initialGame());
    expectFrozen(after);
  });
});
