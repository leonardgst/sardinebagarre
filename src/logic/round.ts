/**
 * Fonctions pures de déroulement d'une partie (R-04, R-30..R-34, R-40..R-42, R-80..R-84).
 *
 * Convention de refus : quand une action n'a aucun effet (carte déjà retournée,
 * marque sur une carte retournée, action sur une partie terminée), la fonction
 * renvoie le MÊME objet (`===`). L'interface s'en sert pour jouer le son « refus ».
 * Tout état renvoyé est gelé ; l'état reçu n'est jamais modifié.
 */
import { COIN_CAP } from './constants';
import type { Board, MemoMark, RoundState } from './types';

const CARD_COUNT = 25;

export const MEMO_BITS: Readonly<Record<MemoMark, number>> = Object.freeze({
  S: 1,
  1: 2,
  2: 4,
  3: 8,
});

function checkId(id: number): void {
  if (!Number.isInteger(id) || id < 0 || id >= CARD_COUNT) {
    throw new RangeError(`Identifiant de carte invalide : ${id} (entier de 0 à 24 attendu)`);
  }
}

function freeze(state: RoundState): RoundState {
  Object.freeze(state.flipped);
  Object.freeze(state.memos);
  return Object.freeze(state);
}

export function hasMark(state: RoundState, id: number, mark: MemoMark): boolean {
  checkId(id);
  return ((state.memos[id] ?? 0) & MEMO_BITS[mark]) !== 0;
}

/** R-04 : 25 cartes face cachée, aucun mémo. */
export function newRound(board: Board): RoundState {
  let multipliersTotal = 0;
  let product = 1;
  for (const c of board.cells) {
    if (c === 2 || c === 3) {
      multipliersTotal += 1;
      product *= c;
    }
  }
  return freeze({
    board,
    flipped: new Array<boolean>(CARD_COUNT).fill(false),
    memos: new Array<number>(CARD_COUNT).fill(0),
    payout: 0,
    cardsFlipped: 0,
    multipliersFlipped: 0,
    multipliersTotal,
    maxPayout: Math.min(product, COIN_CAP),
    status: 'PLAYING',
  });
}

/** R-30..R-34 : retourne une carte face cachée. */
export function flip(state: RoundState, id: number): RoundState {
  checkId(id);
  if (state.status !== 'PLAYING' || state.flipped[id]) return state;
  const value = state.board.cells[id];
  const flipped = state.flipped.slice();
  flipped[id] = true;
  const memos = state.memos.slice();
  memos[id] = 0;
  if (value === 'S') {
    return freeze({ ...state, flipped, memos, payout: 0, status: 'LOST' });
  }
  if (value === undefined) throw new RangeError(`Carte absente du plateau : ${id}`);
  const isMultiplier = value === 2 || value === 3;
  const payout = state.payout === 0 ? value : Math.min(state.payout * value, COIN_CAP);
  const multipliersFlipped = state.multipliersFlipped + (isMultiplier ? 1 : 0);
  return freeze({
    ...state,
    flipped,
    memos,
    payout,
    cardsFlipped: state.cardsFlipped + 1,
    multipliersFlipped,
    status: multipliersFlipped === state.multipliersTotal ? 'WON' : 'PLAYING',
  });
}

/** R-80, R-81 : inverse une marque sur une carte non retournée. */
export function toggleMemo(state: RoundState, id: number, mark: MemoMark): RoundState {
  checkId(id);
  if (state.status !== 'PLAYING' || state.flipped[id]) return state;
  const memos = state.memos.slice();
  memos[id] = (memos[id] ?? 0) ^ MEMO_BITS[mark];
  return freeze({ ...state, memos });
}

/** R-40, R-42 : abandonner en conservant le gain. */
export function quit(state: RoundState): RoundState {
  if (state.status !== 'PLAYING') return state;
  return freeze({ ...state, status: 'QUIT' });
}
