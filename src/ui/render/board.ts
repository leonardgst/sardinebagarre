import type { LineHint, MemoMark, RoundState } from '../../logic/types';
import { formatHintSum } from '../format';
import {
  cardLabel,
  colHintLabel,
  hiddenCardLabel,
  rowHintLabel,
  symbols,
  texts,
} from '../texts.fr';

const MARKS: readonly { readonly mark: MemoMark; readonly className: string }[] = [
  { mark: 'S', className: 'm-s' },
  { mark: 1, className: 'm-1' },
  { mark: 2, className: 'm-2' },
  { mark: 3, className: 'm-3' },
];
const MARK_BITS: Readonly<Record<MemoMark, number>> = { S: 1, 1: 2, 2: 4, 3: 8 };

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = className;
  return e;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function dogHead(className: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '#chien');
  svg.append(use);
  return svg;
}

export function renderCard(
  round: RoundState,
  id: number,
  options: { readonly selected?: boolean } = {},
): HTMLElement {
  const value = round.board.cells[id];
  if (round.flipped[id] && value !== undefined) {
    const card = el('div', value === 'S' ? 'card face sardine' : 'card face');
    card.dataset.id = String(id);
    card.dataset.state = 'shown';
    card.dataset.value = String(value);
    card.setAttribute('role', 'img');
    if (value === 'S') {
      card.setAttribute('aria-label', texts.sardine);
      const medal = el('span', 'medaillon');
      medal.append(dogHead('tete'));
      card.append(medal);
    } else {
      card.setAttribute('aria-label', cardLabel(value));
      const digit = el('span', 'chiffre');
      digit.textContent = String(value);
      card.append(digit);
    }
    return card;
  }
  const card = el('button', 'card cachee');
  card.type = 'button';
  card.dataset.id = String(id);
  card.dataset.state = 'hidden';
  if (options.selected) card.setAttribute('aria-current', 'true');
  const bits = round.memos[id] ?? 0;
  card.setAttribute(
    'aria-label',
    hiddenCardLabel(MARKS.filter(({ mark }) => (bits & MARK_BITS[mark]) !== 0).map((m) => m.mark)),
  );
  for (const { mark, className } of MARKS) {
    const on = (bits & MARK_BITS[mark]) !== 0;
    const m = el('i', `m ${className}${on ? ' on' : ''}`);
    m.textContent = symbols.marks[mark];
    m.setAttribute('aria-hidden', 'true');
    if (on) m.dataset.mark = String(mark);
    card.append(m);
  }
  return card;
}

function renderHint(kind: 'row' | 'col', index: number, hint: LineHint): HTMLElement {
  const ind = el('div', `ind c${index}`);
  ind.dataset.hint = `${kind}-${index}`;
  ind.setAttribute('role', 'img');
  ind.setAttribute(
    'aria-label',
    kind === 'row'
      ? rowHintLabel(index, hint.sum, hint.sardines)
      : colHintLabel(index, hint.sum, hint.sardines),
  );
  const sum = document.createElement('b');
  sum.textContent = formatHintSum(hint.sum);
  const count = document.createElement('span');
  count.append(dogHead('mini'), String(hint.sardines));
  ind.append(sum, count);
  return ind;
}

/** R-01..R-04, R-82 : grille 6 × 6 (25 cartes, 10 indicateurs, 1 coin décoratif). */
export function renderBoard(round: RoundState, selected: number | null = null): HTMLElement {
  const board = el('div', 'board');
  board.setAttribute('role', 'group');
  board.setAttribute('aria-label', texts.board);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const id = row * 5 + col;
      board.append(renderCard(round, id, { selected: id === selected }));
    }
    const hint = round.board.rowHints[row];
    if (hint) board.append(renderHint('row', row, hint));
  }
  for (let col = 0; col < 5; col++) {
    const hint = round.board.colHints[col];
    if (hint) board.append(renderHint('col', col, hint));
  }
  const coin = el('div', 'coin');
  coin.setAttribute('aria-hidden', 'true');
  coin.textContent = symbols.coin;
  board.append(coin);
  return board;
}
