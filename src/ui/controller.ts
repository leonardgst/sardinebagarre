import { finalizeRound, initialGame, startRound } from '../logic/game';
import { flip } from '../logic/round';
import type { GameState, Rng, RoundState } from '../logic/types';
import { play, scale, setFast, skip, tween, wait } from './anim';
import { bark, unlockAudio } from './audio';
import { installInput } from './input';
import { dogHead, renderBoard, renderCard } from './render/board';
import { renderActions, renderHud, renderMessage, updateHud } from './render/hud';
import {
  firstCardMessage,
  levelChangeMessages,
  messages,
  multiplierMessage,
  pickMessage,
  wonPayoutMessage,
} from './texts.fr';

export type Phase = 'playing' | 'flipping' | 'ending' | 'waitingTap' | 'full';

export interface Controller {
  game(): GameState;
  round(): RoundState;
  phase(): Phase;
  /** Remplace la partie affichée (captures et tests, développement seulement). */
  setRound(round: RoundState): void;
}

export interface ControllerOptions {
  /** Point d'extension de la sauvegarde (étape 3.1), appelé juste après `finalizeRound`. */
  onFinalized?: (game: GameState) => void;
}

const FLIP_MS = 250;
const SARDINE_MS = 800;
const WON_MS = 1500;
const CASH_MS = 1500;
const REVEAL_MS = 600;
const REVEAL_SPREAD_MS = 350;
const LEVEL_MS = 1200;

export function createController(
  root: HTMLElement,
  rngs: { readonly board: Rng; readonly decor: Rng },
  options: ControllerOptions = {},
): Controller {
  let game = initialGame();
  const started = startRound(game, rngs.board);
  if (!started) throw new Error('Impossible de démarrer la première partie.');
  let round = started.round;
  let phase: Phase = 'playing';
  let bravoSeen = false; // « une seule fois par session » : jamais sauvegardé.
  /** Ce que le bandeau montre : niveau et total ne bougent qu'après l'encaissement visuel. */
  const shown = { level: game.level, total: game.coins, payout: 0 };

  const hud = renderHud(shown.level, 0, shown.total);
  const table = document.createElement('main');
  table.className = 'table';
  const message = renderMessage();
  root.replaceChildren(hud, table, message, renderActions());

  const boardEl = (): HTMLElement | null => table.querySelector<HTMLElement>('.board');
  const cardEl = (id: number): HTMLElement | null =>
    table.querySelector<HTMLElement>(`.card[data-id="${id}"]`);
  const setMessage = (text: string): void => {
    message.textContent = text;
  };
  const refreshHud = (): void => updateHud(hud, shown.level, shown.payout, shown.total);
  const drawBoard = (): void => {
    table.replaceChildren(renderBoard(round));
    refreshHud();
  };

  async function showBanner(
    lines: readonly string[],
    ms: number,
    className: string,
  ): Promise<void> {
    const banner = document.createElement('div');
    banner.className = `bandeau ${className}`;
    for (const line of lines) {
      const p = document.createElement('p');
      p.textContent = line;
      banner.append(p);
    }
    root.append(banner);
    await wait(ms);
    banner.remove();
  }

  /** UI-30 : rotation sur l'axe Y, en deux demi-tours autour du remplacement de la carte. */
  async function flipCard(r: RoundState, id: number): Promise<void> {
    const old = cardEl(id);
    if (!old) return;
    await play(old, 'flip-out', FLIP_MS / 2);
    const face = renderCard(r, id);
    old.replaceWith(face);
    await play(face, 'flip-in', FLIP_MS / 2);
  }

  /** UI-31 : la tête surgit, le plateau tremble, aboiement. */
  async function sardineSurges(): Promise<void> {
    bark();
    const head = document.createElement('div');
    head.className = 'surgit';
    head.append(dogHead('tete'));
    root.append(head);
    const board = boardEl();
    await Promise.all([
      play(head, 'surgit-anim', SARDINE_MS),
      board ? play(board, 'secoue', SARDINE_MS) : undefined,
    ]);
    head.remove();
  }

  /** UI-42 : les cartes encore cachées se retournent en vague. */
  async function revealAll(): Promise<void> {
    const all: RoundState = { ...round, flipped: round.flipped.map(() => true) };
    const hidden = round.flipped.flatMap((f, id) => (f ? [] : [id]));
    hidden.forEach((id, i) => {
      const old = cardEl(id);
      if (!old) return;
      const face = renderCard(all, id);
      face.classList.add('revele');
      face.style.setProperty(
        '--delai',
        `${Math.round(scale((i * REVEAL_SPREAD_MS) / hidden.length))}ms`,
      );
      face.style.setProperty('--duree', `${Math.round(scale(FLIP_MS))}ms`);
      old.replaceWith(face);
    });
    await wait(REVEAL_MS);
    for (const face of table.querySelectorAll<HTMLElement>('.revele')) {
      face.style.setProperty('animation', 'none');
    }
  }

  /** Enchaînement de fin (la partie est déjà finalisée : tout est visuel, R-55). */
  async function ending(previousCoins: number, lost: boolean): Promise<void> {
    try {
      if (lost) {
        await sardineSurges();
      } else {
        setMessage(messages.won);
        await showBanner([messages.wonBanner], WON_MS, 'bandeau-gagne');
        const gain = round.payout;
        const credited = game.coins - previousCoins;
        await tween(CASH_MS, (p) =>
          updateHud(
            hud,
            shown.level,
            Math.round(gain * (1 - p)),
            previousCoins + Math.round(credited * p),
          ),
        );
        shown.payout = 0;
        setMessage(wonPayoutMessage(credited));
      }
      await revealAll();
    } finally {
      shown.total = game.coins;
      refreshHud();
      if (phase === 'ending') {
        setMessage(messages.tapToContinue);
        phase = 'waitingTap';
      }
    }
  }

  async function doFlip(id: number): Promise<void> {
    const before = round;
    const next = flip(before, id);
    if (next === before) return; // R-30 : carte déjà retournée.
    setFast(false); // Un toucher accélérateur précédent ne doit pas couper UI-30.
    round = next;
    const previousCoins = game.coins;
    const finished = next.status !== 'PLAYING';
    if (finished) {
      // R-55 : finaliser avant toute animation.
      game = finalizeRound(game, next);
      options.onFinalized?.(game);
      phase = 'ending';
      setFast(false);
    } else {
      phase = 'flipping';
    }
    const value = next.board.cells[id];
    if (value === 'S') setMessage(pickMessage(messages.sardine, rngs.decor));
    if (value === 2 || value === 3 || value === 1) {
      if (before.cardsFlipped === 0) setMessage(firstCardMessage(value, next.payout));
      else if (value !== 1) setMessage(multiplierMessage(value, next.payout));
    }
    shown.total = previousCoins;
    shown.payout = next.payout;
    refreshHud();
    await flipCard(next, id);
    if (finished) await ending(previousCoins, next.status === 'LOST');
    else if (phase === 'flipping') phase = 'playing';
  }

  async function nextRound(): Promise<void> {
    const lines = levelChangeMessages(shown.level, game.level, bravoSeen);
    if (lines.includes(messages.bravo)) bravoSeen = true;
    const next = startRound(game, rngs.board);
    if (!next) {
      phase = 'full';
      setMessage(messages.boxFull);
      return;
    }
    round = next.round;
    setFast(false);
    shown.level = game.level;
    shown.total = game.coins;
    shown.payout = 0;
    setMessage('');
    drawBoard();
    if (lines.length === 0) {
      phase = 'playing';
      return;
    }
    phase = 'ending';
    setFast(false);
    try {
      await showBanner(lines, LEVEL_MS, 'bandeau-niveau');
    } finally {
      phase = 'playing';
    }
  }

  installInput(root, {
    onGesture: unlockAudio,
    onCard(id) {
      if (phase === 'playing') void doFlip(id);
      else if (phase === 'ending')
        skip(); // CL-20 : jamais `flip` après la fin.
      else if (phase === 'waitingTap') void nextRound();
    },
    onElsewhere() {
      if (phase === 'ending') skip();
      else if (phase === 'waitingTap') void nextRound();
    },
  });

  drawBoard();

  return {
    game: () => game,
    round: () => round,
    phase: () => phase,
    setRound(next) {
      round = next;
      shown.payout = next.payout;
      drawBoard();
    },
  };
}
