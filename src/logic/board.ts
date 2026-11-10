import type { Board, CardValue, ConfigEntry, FreeMultipliers, LineHint, Rng } from './types';

/** Nombre maximal de tentatives de génération (R-21.6). */
export const MAX_ATTEMPTS = 1000;

const SIZE = 5;

const cardPoints = (c: CardValue): number => (c === 'S' ? 0 : c);

function hint(line: readonly CardValue[]): LineHint {
  let sum = 0;
  let sardines = 0;
  for (const c of line) {
    sum += cardPoints(c);
    if (c === 'S') sardines++;
  }
  return Object.freeze({ sum, sardines });
}

/** Construit un plateau immuable et calcule ses indicateurs (R-02, R-03, R-24). */
export function createBoard(cells: readonly CardValue[]): Board {
  if (cells.length !== SIZE * SIZE) {
    throw new Error(`Un plateau doit avoir 25 cartes (reçu : ${cells.length}).`);
  }
  const rowHints: LineHint[] = [];
  const colHints: LineHint[] = [];
  for (let i = 0; i < SIZE; i++) {
    rowHints.push(hint(cells.slice(i * SIZE, i * SIZE + SIZE)));
    colHints.push(hint(Array.from({ length: SIZE }, (_, r) => cells[r * SIZE + i] as CardValue)));
  }
  return Object.freeze({
    cells: Object.freeze([...cells]),
    rowHints: Object.freeze(rowHints),
    colHints: Object.freeze(colHints),
  });
}

function bump(a: number[], i: number): void {
  a[i] = (a[i] ?? 0) + 1;
}

/** Compte les multiplicateurs gratuits : ligne OU colonne sans Sardine (R-21.3–4). */
export function countFreeMultipliers(cells: readonly CardValue[]): FreeMultipliers {
  const rowS = new Array<number>(SIZE).fill(0);
  const colS = new Array<number>(SIZE).fill(0);
  for (let id = 0; id < cells.length; id++) {
    if (cells[id] === 'S') {
      bump(rowS, Math.floor(id / SIZE));
      bump(colS, id % SIZE);
    }
  }
  const perRow = new Array<number>(SIZE).fill(0);
  const perCol = new Array<number>(SIZE).fill(0);
  let total = 0;
  for (let id = 0; id < cells.length; id++) {
    const c = cells[id];
    if (c !== 2 && c !== 3) continue;
    const r = Math.floor(id / SIZE);
    const col = id % SIZE;
    if (rowS[r] === 0 || colS[col] === 0) {
      total++;
      bump(perRow, r);
      bump(perCol, col);
    }
  }
  return { total, perRow, perCol };
}

/** Acceptation R-21.5 : comparaisons strictement inférieures. */
export function isAccepted(free: FreeMultipliers, entry: ConfigEntry): boolean {
  return (
    free.total < entry.maxFreeTotal &&
    free.perRow.every((n) => n < entry.maxFreePerLine) &&
    free.perCol.every((n) => n < entry.maxFreePerLine)
  );
}

/** Une tentative de placement, sans filtre (R-21.1–2, R-22) : Fisher-Yates. */
export function placeCards(entry: ConfigEntry, rng: Rng): CardValue[] {
  const positions = Array.from({ length: SIZE * SIZE }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = positions[i] as number;
    positions[i] = positions[j] as number;
    positions[j] = tmp;
  }
  const cells: CardValue[] = new Array<CardValue>(SIZE * SIZE).fill(1);
  let k = 0;
  for (let n = 0; n < entry.sardines; n++) cells[positions[k++] as number] = 'S';
  for (let n = 0; n < entry.twos; n++) cells[positions[k++] as number] = 2;
  for (let n = 0; n < entry.threes; n++) cells[positions[k++] as number] = 3;
  return cells;
}

/** Boucle R-21 avec repli sur le dernier plateau après MAX_ATTEMPTS échecs. */
export function generateBoardDetailed(
  entry: ConfigEntry,
  rng: Rng,
): { board: Board; attempts: number; accepted: boolean } {
  let cells: CardValue[] = [];
  let attempts = 0;
  let accepted = false;
  while (attempts < MAX_ATTEMPTS && !accepted) {
    attempts++;
    cells = placeCards(entry, rng);
    accepted = isAccepted(countFreeMultipliers(cells), entry);
  }
  return { board: createBoard(cells), attempts, accepted };
}

export function generateBoard(entry: ConfigEntry, rng: Rng): Board {
  return generateBoardDetailed(entry, rng).board;
}
