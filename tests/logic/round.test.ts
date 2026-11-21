import { describe, expect, it } from 'vitest';
import { generateBoard } from '../../src/logic/board';
import { CONFIGS, maxPayout } from '../../src/logic/configs';
import { mulberry32 } from '../../src/logic/rng';
import { flip, hasMark, isSuspense, newRound, quit, toggleMemo } from '../../src/logic/round';
import type { MemoMark, RoundState } from '../../src/logic/types';
import { boardFromRows } from './helpers';

const PLATEAU_MAIN = boardFromRows([
  'S 1 2 1 1',
  '1 3 1 1 S',
  '2 1 1 1 1',
  '1 1 S 1 3',
  '1 2 1 S 1',
]);

const PLATEAU_PLAFOND = boardFromRows([
  '3 3 3 3 3',
  '3 3 3 3 3',
  '3 1 1 1 1',
  '1 1 1 1 1',
  '1 1 1 1 S',
]);

const jouer = (s: RoundState, ids: readonly number[]): RoundState => ids.reduce(flip, s);
const gains = (s: RoundState, ids: readonly number[]): number[] => {
  const out: number[] = [];
  let cur = s;
  for (const id of ids) {
    cur = flip(cur, id);
    out.push(cur.payout);
  }
  return out;
};
const neuve = () => newRound(PLATEAU_MAIN);
const VICTOIRE = [2, 6, 10, 19, 21];

describe('partie', () => {
  it('R-04 nouvelle partie : tout face cachée, sans mémo, gain 0', () => {
    const s = neuve();
    expect(s.flipped).toEqual(new Array(25).fill(false));
    expect(s.memos).toEqual(new Array(25).fill(0));
    expect(s.payout).toBe(0);
    expect(s.cardsFlipped).toBe(0);
    expect(s.multipliersFlipped).toBe(0);
    expect(s.multipliersTotal).toBe(5);
    expect(s.maxPayout).toBe(72);
    expect(s.status).toBe('PLAYING');
  });

  it("R-24 l'état d'une partie est gelé", () => {
    for (const s of [neuve(), flip(neuve(), 1)]) {
      expect(Object.isFrozen(s)).toBe(true);
      expect(Object.isFrozen(s.flipped)).toBe(true);
      expect(Object.isFrozen(s.memos)).toBe(true);
    }
  });

  it('CL-05 premier retournement = 1 → gain 1', () => {
    const s = flip(neuve(), 1);
    expect([s.payout, s.cardsFlipped, s.multipliersFlipped, s.status]).toEqual([
      1,
      1,
      0,
      'PLAYING',
    ]);
  });

  it('R-32 premier retournement = 2 → gain 2', () => {
    const s = flip(neuve(), 2);
    expect([s.payout, s.cardsFlipped, s.multipliersFlipped]).toEqual([2, 1, 1]);
  });

  it('CL-06 1 puis 3 puis 2 → 1, 3, 6', () => {
    expect(gains(neuve(), [1, 6, 2])).toEqual([1, 3, 6]);
    const s = jouer(neuve(), [1, 6, 2]);
    expect(s.cardsFlipped).toBe(3);
    expect(s.multipliersFlipped).toBe(2);
  });

  it('CL-07 2 puis 1 puis 1 → 2, 2, 2 et k = 3', () => {
    expect(gains(neuve(), [2, 1, 3])).toEqual([2, 2, 2]);
    expect(jouer(neuve(), [2, 1, 3]).cardsFlipped).toBe(3);
  });

  it('CL-02 premier retournement = Sardine → perdue, k = 0', () => {
    const s = flip(neuve(), 0);
    expect([s.status, s.payout, s.cardsFlipped, s.flipped[0]]).toEqual(['LOST', 0, 0, true]);
  });

  it('CL-03 1, 1 puis Sardine → perdue, k = 2', () => {
    const s = jouer(neuve(), [1, 3, 0]);
    expect([s.status, s.payout, s.cardsFlipped]).toEqual(['LOST', 0, 2]);
  });

  it('CL-04 un seul 1 puis Sardine → k = 1', () => {
    const s = jouer(neuve(), [1, 0]);
    expect([s.status, s.cardsFlipped]).toEqual(['LOST', 1]);
  });

  it('R-34 Sardine après des multiplicateurs → gain remis à 0', () => {
    const avant = jouer(neuve(), [2, 6]);
    expect(avant.payout).toBe(6);
    const s = flip(avant, 9);
    expect([s.status, s.payout, s.cardsFlipped, s.multipliersFlipped]).toEqual(['LOST', 0, 2, 2]);
  });

  it('R-33 victoire dès le dernier multiplicateur', () => {
    expect(gains(neuve(), VICTOIRE)).toEqual([2, 6, 12, 36, 72]);
    expect(jouer(neuve(), VICTOIRE.slice(0, 4)).status).toBe('PLAYING');
    const s = jouer(neuve(), VICTOIRE);
    expect(s.status).toBe('WON');
    expect(s.payout).toBe(s.maxPayout);
  });

  it("CL-08 victoire alors qu'il reste des 1 : ils restent face cachée", () => {
    const s = jouer(neuve(), VICTOIRE);
    expect(s.cardsFlipped).toBe(5);
    expect(s.flipped.filter(Boolean)).toHaveLength(5);
    expect(s.flipped[1]).toBe(false);
  });

  it('R-33 les 1 retournés avant la victoire comptent dans k', () => {
    const s = jouer(neuve(), [1, 3, ...VICTOIRE]);
    expect([s.status, s.payout, s.cardsFlipped]).toEqual(['WON', 72, 7]);
  });

  it('CL-09 retourner une carte déjà retournée ne change rien', () => {
    const s1 = flip(neuve(), 1);
    expect(flip(s1, 1)).toBe(s1);
  });

  it('R-30 aucun retournement après la fin de partie', () => {
    const fins = [flip(neuve(), 0), jouer(neuve(), VICTOIRE), quit(neuve())];
    for (const s of fins) expect(flip(s, 1)).toBe(s);
  });

  it('R-30 identifiant invalide → RangeError', () => {
    for (const id of [-1, 25, 2.5]) {
      expect(() => flip(neuve(), id)).toThrow(RangeError);
      expect(() => toggleMemo(neuve(), id, 'S')).toThrow(RangeError);
      expect(() => hasMark(neuve(), id, 'S')).toThrow(RangeError);
    }
  });

  it('R-32 le gain est plafonné à 50 000', () => {
    const s0 = newRound(PLATEAU_PLAFOND);
    expect(s0.maxPayout).toBe(50_000);
    const neuf = jouer(s0, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(neuf.payout).toBe(19_683);
    const dix = flip(neuf, 9);
    expect([dix.payout, dix.status]).toEqual([50_000, 'PLAYING']);
    const onze = flip(dix, 10);
    expect([onze.payout, onze.status]).toEqual([50_000, 'WON']);
  });
});

describe('mémo', () => {
  const marques: MemoMark[] = ['S', 1, 2, 3];

  it('R-80 les 4 marques sont indépendantes et combinables', () => {
    let s = neuve();
    for (const m of marques) s = toggleMemo(s, 1, m);
    for (const m of marques) expect(hasMark(s, 1, m)).toBe(true);
    expect(s.memos[1]).toBe(15);
    s = toggleMemo(s, 1, 2);
    expect(s.memos[1]).toBe(11);
    expect(hasMark(s, 1, 2)).toBe(false);
    expect(hasMark(s, 1, 'S') && hasMark(s, 1, 1) && hasMark(s, 1, 3)).toBe(true);
  });

  it("R-81 inverser deux fois une marque revient à l'état initial", () => {
    const s = toggleMemo(toggleMemo(neuve(), 4, 3), 4, 3);
    expect(s.memos).toEqual(new Array(25).fill(0));
  });

  it('CL-10 marquer une carte retournée est refusé', () => {
    const s = flip(neuve(), 1);
    expect(toggleMemo(s, 1, 'S')).toBe(s);
  });

  it('R-81 aucune marque après la fin de partie', () => {
    const s = flip(neuve(), 0);
    expect(toggleMemo(s, 5, 'S')).toBe(s);
  });

  it('CL-11 retourner une carte marquée efface ses marques', () => {
    let s = toggleMemo(neuve(), 4, 2);
    s = toggleMemo(toggleMemo(s, 1, 'S'), 1, 3);
    s = flip(s, 1);
    expect(s.memos[1]).toBe(0);
    expect(s.memos[4]).toBe(4);
  });

  it("R-84 le mémo n'a aucun effet sur les règles", () => {
    const a = flip(toggleMemo(neuve(), 1, 'S'), 1);
    expect([a.payout, a.status]).toEqual([1, 'PLAYING']);
    const b = flip(toggleMemo(neuve(), 0, 1), 0);
    expect(b.status).toBe('LOST');
    expect(b.memos[0]).toBe(0);
  });

  it('R-84 marquer ne change ni le gain ni les compteurs', () => {
    const s = jouer(neuve(), [2, 6]);
    let t = s;
    for (const id of [1, 3, 4]) for (const m of marques) t = toggleMemo(t, id, m);
    expect({ ...t, memos: 0 }).toEqual({ ...s, memos: 0 });
  });
});

describe('abandon', () => {
  it('CL-01 quitter sans avoir retourné de carte → QUIT, gain 0, k = 0', () => {
    const s = quit(neuve());
    expect([s.status, s.payout, s.cardsFlipped]).toEqual(['QUIT', 0, 0]);
  });

  it('R-42 quitter conserve le gain', () => {
    const s = quit(jouer(neuve(), [1, 2, 6]));
    expect([s.status, s.payout, s.cardsFlipped]).toEqual(['QUIT', 6, 3]);
  });

  it('R-40 quitter une partie terminée ne change rien', () => {
    const fins = [flip(neuve(), 0), jouer(neuve(), VICTOIRE), quit(neuve())];
    for (const s of fins) expect(quit(s)).toBe(s);
  });

  it("CL-12 l'état précédent reste intact (« Non » = aucun appel)", () => {
    const s = toggleMemo(jouer(neuve(), [1, 2]), 4, 3);
    const copie = structuredClone(s);
    flip(s, 6);
    expect(s).toEqual(copie);
    toggleMemo(s, 5, 'S');
    expect(s).toEqual(copie);
    quit(s);
    expect(s).toEqual(copie);
  });
});

describe('configurations', () => {
  it('R-33 maxPayout de newRound = maxPayout(entrée) pour les 80 configurations', () => {
    CONFIGS.forEach((entry, i) => {
      const s = newRound(generateBoard(entry, mulberry32(i)));
      expect(s.maxPayout).toBe(maxPayout(entry));
      expect(s.multipliersTotal).toBe(entry.twos + entry.threes);
    });
  });

  it('R-30..R-34 propriété : parties aléatoires sur les 80 configurations', () => {
    const ecarts: string[] = [];
    const noter = (msg: string) => {
      if (ecarts.length < 20) ecarts.push(msg);
    };
    for (const [ci, entry] of CONFIGS.entries()) {
      for (let seed = 0; seed < 20; seed++) {
        const rng = mulberry32(ci * 1000 + seed);
        const board = generateBoard(entry, rng);
        const ordre = Array.from({ length: 25 }, (_, i) => i);
        for (let i = 24; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [ordre[i], ordre[j]] = [ordre[j] as number, ordre[i] as number];
        }
        const etiquette = `${ci}/${seed}`;
        let s = newRound(board);
        let gain = 0;
        let k = 0;
        let restants = entry.twos + entry.threes;
        let fin = false;
        let sardinesRetournees = 0;
        for (const id of ordre) {
          if (fin) {
            if (flip(s, id) !== s) noter(`${etiquette} flip après fin a changé l'état`);
            continue;
          }
          const v = board.cells[id];
          s = flip(s, id);
          if (v === 'S') {
            sardinesRetournees++;
            if (s.status !== 'LOST' || s.payout !== 0) noter(`${etiquette} Sardine mal gérée`);
            fin = true;
            continue;
          }
          k++;
          gain = gain === 0 ? (v as number) : Math.min(gain * (v as number), 50_000);
          if (v !== 1) restants--;
          if (s.payout !== gain || s.cardsFlipped !== k) noter(`${etiquette} gain/k divergent`);
          if (restants === 0) {
            fin = true;
            if (s.status !== 'WON' || s.payout !== maxPayout(entry) || sardinesRetournees !== 0) {
              noter(`${etiquette} victoire attendue mal gérée`);
            }
          } else if (s.status !== 'PLAYING') {
            noter(`${etiquette} fin prématurée`);
          }
        }
        if (!fin) noter(`${etiquette} partie jamais terminée`);
      }
    }
    expect(ecarts).toEqual([]);
  });
});

describe('indicateurs et lignes sans Sardine', () => {
  it('R-03 les indicateurs ne changent pas pendant la partie', () => {
    const depart = neuve();
    const s = quit(jouer(depart, [1, 2, 6]));
    expect(s.board).toBe(depart.board);
    expect(s.board.rowHints).toEqual([
      { sum: 5, sardines: 1 },
      { sum: 6, sardines: 1 },
      { sum: 6, sardines: 0 },
      { sum: 6, sardines: 1 },
      { sum: 5, sardines: 1 },
    ]);
    expect(s.board.colHints).toEqual([
      { sum: 5, sardines: 1 },
      { sum: 8, sardines: 0 },
      { sum: 5, sardines: 1 },
      { sum: 4, sardines: 1 },
      { sum: 6, sardines: 1 },
    ]);
  });

  it('CL-21 ligne sans Sardine : retourner une carte ne retourne pas les autres', () => {
    const s = flip(neuve(), 11);
    expect(s.flipped.filter(Boolean)).toHaveLength(1);
    for (const id of [10, 12, 13, 14]) expect(s.flipped[id]).toBe(false);
    expect([s.cardsFlipped, s.status]).toEqual([1, 'PLAYING']);
  });
});

describe('suspense (R-90)', () => {
  // Un 2 caché (hors ligne/colonne visées) évite la victoire automatique après le premier retournement.
  const SUSPENSE = boardFromRows(['S S S 1 2', '1 2 1 1 1', '1 1 1 1 1', '1 1 1 1 1', '1 1 1 S S']);
  const SUSPENSE_SANS_COLONNE = boardFromRows([
    'S S S 1 2',
    '1 2 1 1 1',
    '1 1 1 1 1',
    '1 1 1 1 1',
    '1 1 1 1 S',
  ]);
  const COLONNE = boardFromRows(['1 1 1 1 1', 'S 1 2 1 1', 'S 1 1 1 1', 'S 1 1 1 1', '1 1 1 1 S']);

  it('R-90 pas de suspense à 3 Sardines sur 5 cartes cachées (60 %)', () => {
    expect(isSuspense(newRound(SUSPENSE), 3)).toBe(false);
  });

  it('R-90 suspense à 75 % : 3 Sardines sur 4 cartes cachées, colonne avec une Sardine', () => {
    expect(isSuspense(flip(newRound(SUSPENSE), 4), 3)).toBe(true);
  });

  it("R-90 pas de suspense si la colonne de la carte n'a aucune Sardine", () => {
    expect(isSuspense(flip(newRound(SUSPENSE_SANS_COLONNE), 4), 3)).toBe(false);
  });

  it('R-90 suspense par la colonne seule', () => {
    const s = newRound(COLONNE);
    expect(isSuspense(s, 20)).toBe(false);
    expect(isSuspense(flip(s, 0), 20)).toBe(true);
  });

  it("R-90 pas de suspense si la ligne de la carte n'a aucune Sardine", () => {
    const b = boardFromRows(['1 1 1 1 1', 'S 1 2 1 1', 'S 1 1 1 1', 'S 1 1 1 1', '1 1 1 1 1']);
    expect(isSuspense(flip(newRound(b), 0), 20)).toBe(false);
  });

  it('R-90 aucun suspense sur une carte retournée ou une partie finie', () => {
    const s = flip(newRound(SUSPENSE), 3);
    expect(isSuspense(s, 3)).toBe(false);
    expect(isSuspense(quit(flip(newRound(SUSPENSE), 4)), 3)).toBe(false);
    expect(isSuspense(flip(newRound(SUSPENSE), 0), 3)).toBe(false);
  });

  it('R-90 identifiant invalide → RangeError', () => {
    for (const id of [-1, 25, 2.5]) {
      expect(() => isSuspense(neuve(), id)).toThrow(RangeError);
    }
  });
});
