import {
  canStartRound,
  finalizeRound,
  freezeGame,
  initialGame,
  leaveTable,
  startRound,
} from '../logic/game';
import { flip, quit } from '../logic/round';
import type { GameState, Rng, RoundState } from '../logic/types';
import { play, scale, setFast, skip, tween, wait } from './anim';
import { bark, unlockAudio } from './audio';
import { installInput } from './input';
import { dogHead, renderBoard, renderCard } from './render/board';
import { renderDialog } from './render/dialog';
import { renderActions, renderHud, renderMessage, updateHud } from './render/hud';
import { renderMenu, renderScreen } from './render/menu';
import {
  firstCardMessage,
  leaveTableQuestion,
  levelChangeMessages,
  messages,
  multiplierMessage,
  pickMessage,
  playQuestion,
  quitQuestion,
  texts,
  wonPayoutMessage,
} from './texts.fr';

export type Phase = 'menu' | 'screen' | 'dialog' | 'playing' | 'flipping' | 'ending' | 'waitingTap';

export type DialogKind = 'quit' | 'play' | 'leave';

export interface Controller {
  game(): GameState;
  /** `null` tant qu'aucune partie n'a été lancée. */
  round(): RoundState | null;
  phase(): Phase;
  dialog(): DialogKind | null;
  /** Remplace la partie affichée (captures et tests, développement seulement). */
  setRound(round: RoundState): void;
  /** Remplace l'état du jeu, depuis le menu seulement (tests, développement seulement). */
  setGame(game: GameState): void;
}

export interface ControllerOptions {
  /** Point d'extension de la sauvegarde (étape 3.1), appelé après `finalizeRound` et `leaveTable`. */
  onGameChange?: (game: GameState) => void;
}

const FLIP_MS = 250;
const SARDINE_MS = 800;
const WON_MS = 1500;
const CASH_MS = 1500;
const REVEAL_MS = 600;
const REVEAL_SPREAD_MS = 350;
const LEVEL_MS = 1200;
/** Anti-rebond des touchers de carte (durée réelle, indépendante des animations réduites). */
const LOCK_MS = 350;

export function createController(
  root: HTMLElement,
  rngs: { readonly board: Rng; readonly decor: Rng },
  options: ControllerOptions = {},
): Controller {
  let game = initialGame();
  let round: RoundState | null = null;
  let phase: Phase = 'menu';
  let dialogKind: DialogKind | null = null;
  let dialogEl: HTMLElement | null = null;
  let beforeDialog: Phase = 'menu';
  let bravoSeen = false; // « une seule fois par session » : jamais sauvegardé.
  /** Ce que le bandeau montre : niveau et total ne bougent qu'après l'encaissement visuel. */
  const shown = { level: game.level, total: game.coins, payout: 0 };

  const hud = renderHud(shown.level, 0, shown.total);
  const table = document.createElement('main');
  table.className = 'table';
  const message = renderMessage();
  const actions = renderActions();

  let lockTimer: ReturnType<typeof setTimeout> | undefined;
  /** Un double toucher ne doit pas atteindre la carte située sous le bouton qui vient de disparaître. */
  function lockCards(): void {
    clearTimeout(lockTimer);
    root.dataset.verrou = '';
    lockTimer = setTimeout(() => {
      delete root.dataset.verrou;
    }, LOCK_MS);
  }
  const locked = (): boolean => root.dataset.verrou !== undefined;

  const cur = (): RoundState => {
    if (!round) throw new Error("Aucune partie n'est en cours.");
    return round;
  };
  const boardEl = (): HTMLElement | null => table.querySelector<HTMLElement>('.board');
  const cardEl = (id: number): HTMLElement | null =>
    table.querySelector<HTMLElement>(`.card[data-id="${id}"]`);
  const setMessage = (text: string): void => {
    message.textContent = text;
  };
  const refreshHud = (): void => updateHud(hud, shown.level, shown.payout, shown.total);
  const drawBoard = (): void => {
    table.replaceChildren(renderBoard(cur()));
    refreshHud();
  };

  function showMenu(note = ''): void {
    dialogKind = null;
    dialogEl = null;
    phase = 'menu';
    root.replaceChildren(renderMenu(game.level, game.coins, note));
  }

  function showScreen(title: string): void {
    phase = 'screen';
    root.replaceChildren(renderScreen(title));
  }

  /** Dialogue Oui/Non modal, dans `#app`. */
  function openDialog(kind: DialogKind, text: string): void {
    beforeDialog = phase;
    phase = 'dialog';
    dialogKind = kind;
    const { veil, no } = renderDialog(text);
    dialogEl = veil;
    root.append(veil);
    no.focus();
  }

  /** Retire le dialogue et rend la phase d'avant. */
  function closeDialog(): void {
    dialogEl?.remove();
    dialogEl = null;
    dialogKind = null;
    phase = beforeDialog;
    lockCards();
  }

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
    const current = cur();
    const all: RoundState = { ...current, flipped: current.flipped.map(() => true) };
    const hidden = current.flipped.flatMap((f, id) => (f ? [] : [id]));
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
  async function ending(previousCoins: number, kind: 'won' | 'lost' | 'quit'): Promise<void> {
    try {
      if (kind === 'lost') {
        await sardineSurges();
      } else {
        if (kind === 'won') {
          setMessage(messages.won);
          await showBanner([messages.wonBanner], WON_MS, 'bandeau-gagne');
        }
        const gain = cur().payout;
        if (gain > 0) {
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
    const before = cur();
    const next = flip(before, id);
    if (next === before) return; // R-30 : carte déjà retournée.
    setFast(false); // Un toucher accélérateur précédent ne doit pas couper UI-30.
    round = next;
    const previousCoins = game.coins;
    const finished = next.status !== 'PLAYING';
    if (finished) {
      // R-55 : finaliser avant toute animation.
      game = finalizeRound(game, next);
      options.onGameChange?.(game);
      phase = 'ending';
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
    if (finished) await ending(previousCoins, next.status === 'LOST' ? 'lost' : 'won');
    else if (phase === 'flipping') phase = 'playing';
  }

  /** R-42, R-55 : abandon confirmé. Finalisation avant toute animation. */
  async function confirmQuit(): Promise<void> {
    setFast(false);
    const next = quit(cur());
    round = next;
    const previousCoins = game.coins;
    game = finalizeRound(game, next);
    options.onGameChange?.(game);
    phase = 'ending';
    shown.total = previousCoins;
    shown.payout = next.payout;
    refreshHud();
    await ending(previousCoins, 'quit');
  }

  /** Tire une partie au niveau courant et affiche le plateau (la graine n'avance qu'ici). */
  function startNewRound(): void {
    const next = startRound(game, rngs.board);
    if (!next) {
      showMenu(messages.boxFull);
      return;
    }
    round = next.round;
    shown.level = game.level;
    shown.total = game.coins;
    shown.payout = 0;
    setMessage('');
    root.replaceChildren(hud, table, message, actions);
    drawBoard();
    phase = 'playing';
    lockCards();
  }

  /** Après le toucher de fin : bandeau de niveau (R-66), puis la question (ADR-019). */
  async function afterRound(): Promise<void> {
    phase = 'ending';
    setFast(false);
    const lines = levelChangeMessages(shown.level, game.level, bravoSeen);
    if (lines.includes(messages.bravo)) bravoSeen = true;
    shown.level = game.level;
    shown.total = game.coins;
    shown.payout = 0;
    refreshHud();
    if (lines.length > 0) await showBanner(lines, LEVEL_MS, 'bandeau-niveau');
    if (!canStartRound(game)) showMenu(messages.boxFull);
    else {
      setMessage('');
      openDialog('play', playQuestion(game.level));
    }
  }

  function answer(yes: boolean): void {
    const kind = dialogKind;
    if (kind === 'play') {
      if (!yes) {
        showMenu();
        return;
      }
      closeDialog();
      startNewRound();
      return;
    }
    closeDialog();
    if (!yes) return;
    if (kind === 'quit') {
      void confirmQuit();
    } else if (kind === 'leave') {
      game = leaveTable(game);
      options.onGameChange?.(game);
      showMenu();
    }
  }

  function menuAction(name: string): void {
    if (name === 'play') {
      if (canStartRound(game)) startNewRound();
      else showMenu(messages.boxFull);
    } else if (name === 'album') showScreen(texts.album);
    else if (name === 'infos') showScreen(texts.infos);
    else if (name === 'settings') showScreen(texts.settings);
    else if (name === 'leave-table') openDialog('leave', leaveTableQuestion);
  }

  installInput(root, {
    onGesture: unlockAudio,
    onCard(id) {
      if (locked()) return;
      if (phase === 'playing') void doFlip(id);
      else if (phase === 'ending')
        skip(); // CL-20 : jamais `flip` après la fin.
      else if (phase === 'waitingTap') void afterRound();
    },
    onAction(name) {
      if (phase === 'dialog') {
        if (name === 'yes' || name === 'no') answer(name === 'yes');
      } else if (phase === 'menu') {
        menuAction(name);
      } else if (phase === 'screen') {
        if (name === 'back') showMenu();
      } else if (phase === 'ending') {
        skip(); // CL-20 : tout bouton de l'écran de jeu est un toucher d'écran.
      } else if (phase === 'waitingTap') {
        void afterRound(); // R-52
      } else if (name === 'quit' && phase === 'playing') {
        openDialog('quit', quitQuestion(cur().payout));
      }
    },
    onElsewhere() {
      if (phase === 'ending') skip();
      else if (phase === 'waitingTap') void afterRound();
    },
  });

  showMenu();

  return {
    game: () => game,
    round: () => round,
    phase: () => phase,
    dialog: () => dialogKind,
    setRound(next) {
      round = next;
      shown.payout = next.payout;
      drawBoard();
    },
    setGame(next) {
      if (phase !== 'menu') return;
      game = freezeGame(next);
      showMenu();
    },
  };
}
