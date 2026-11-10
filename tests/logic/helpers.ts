import { createBoard } from '../../src/logic/board';
import type { Board, CardValue } from '../../src/logic/types';

/** Construit un plateau depuis 5 chaînes de 5 symboles (S, 1, 2, 3) séparés par des espaces. */
export function boardFromRows(rows: readonly string[]): Board {
  if (rows.length !== 5) throw new Error('boardFromRows : 5 lignes attendues');
  const cells: CardValue[] = [];
  for (const row of rows) {
    const symbols = row.trim().split(/\s+/);
    if (symbols.length !== 5) throw new Error(`boardFromRows : ligne mal formée « ${row} »`);
    for (const s of symbols) {
      if (s === 'S') cells.push('S');
      else if (s === '1') cells.push(1);
      else if (s === '2') cells.push(2);
      else if (s === '3') cells.push(3);
      else throw new Error(`boardFromRows : symbole inconnu « ${s} »`);
    }
  }
  return createBoard(cells);
}
