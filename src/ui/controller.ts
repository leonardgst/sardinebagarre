import {
  canStartRound,
  finalizeRound,
  freezeGame,
  initialGame,
  leaveTable,
  startRound,
} from '../logic/game';
import { flip, quit, toggleMemo } from '../logic/round';
import type { GameState, MemoMark, Rng, RoundState } from '../logic/types';
import { play, scale, setFast, skip, tween, wait } from './anim';
import { bark, unlockAudio } from './audio';
import { collectOfflineInfo, formatOfflineInfo, formatPackInfo } from './diagnostic';
import { installInput } from './input';
import { normalizeCode } from './pack';
import { createPackStore, type PackResult, type PackStore } from './pack-store';
import { dogHead, renderBoard, renderCard } from './render/board';
import { renderDialog } from './render/dialog';
import { renderActions, renderHud, renderMessage, updateHud, updateMemoPanel } from './render/hud';
import { renderCodeSection, renderMenu, renderScreen } from './render/menu';
import {
  firstCardMessage,
  leaveTableQuestion,
  levelChangeMessages,
  messages,
  multiplierMessage,
  packTexts,
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
  /** R-81 : mode mémo ouvert ou non, carte sélectionnée. */
  memo(): { readonly open: boolean; readonly selected: number | null };
  /** R-124 : recharge le pack avec le code sauvegardé (lancement), sans message à l'écran. */
  loadSavedPack(code: string): Promise<PackResult>;
}

export interface ControllerOptions {
  /** État de jeu chargé depuis la sauvegarde (R-100) ; sinon un premier lancement. */
  initialGame?: GameState;
  /** Sauvegarde (R-100), appelé après `finalizeRound` et `leaveTable`. */
  onGameChange?: (game: GameState) => void;
  /** R-104 : appelé à chaque affichage du menu. */
  onMenu?: () => void;
  /** R-104 : appelé quand le joueur quitte le menu (partie ou écran). */
  onLeaveMenu?: () => void;
  /** R-124 : contenu du pack (par défaut, un magasin vide qui charge `pack/pack.bin`). */
  pack?: PackStore;
  /** R-101, R-124 : code accepté (normalisé), ou `null` s'il ne marche plus. À sauvegarder. */
  onPackCode?: (code: string | null) => void;
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
/** Durée de l'animation de refus (R-81). */
const REFUS_MS = 250;

export function createController(
  root: HTMLElement,
  rngs: { readonly board: Rng; readonly decor: Rng },
  options: ControllerOptions = {},
): Controller {
  let game = freezeGame(options.initialGame ?? initialGame());
  let round: RoundState | null = null;
  let phase: Phase = 'menu';
  let dialogKind: DialogKind | null = null;
  let dialogEl: HTMLElement | null = null;
  let beforeDialog: Phase = 'menu';
  const pack = options.pack ?? createPackStore();
  let packBusy = false;
  /** « Changer le code » : le champ reste affiché même si un pack est déjà chargé. */
  let changingCode = false;
  let packError = '';
  let packStatus: 'absent' | 'loaded' | 'unavailable' = 'absent';
  let bravoSeen = false; // « une seule fois par session » : jamais sauvegardé.
  /** Ce que le bandeau montre : niveau et total ne bougent qu'après l'encaissement visuel. */
  const shown = { level: game.level, total: game.coins, payout: 0 };

  const hud = renderHud(shown.level, 0, shown.total);
  const table = document.createElement('main');
  table.className = 'table';
  const message = renderMessage();
  let actions = renderActions();
  let memo: { open: boolean; selected: number | null } = { open: false, selected: null };

  let lockTimer: ReturnType<typeof setTimeout> | undefined;
  /** Un double toucher ne doit pas atteindre la carte située sous le bouton qui vient de disparaître. */
  function lockInput(): void {
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
  const headUrl = (): string | null => pack.content()?.headUrl ?? null;
  const setMessage = (text: string): void => {
    message.textContent = text;
  };
  const refreshHud = (): void => updateHud(hud, shown.level, shown.payout, shown.total);
  const drawBoard = (): void => {
    table.replaceChildren(renderBoard(cur(), memo.open ? memo.selected : null, headUrl()));
    refreshHud();
  };

  /** Bits de mémo de la carte sélectionnée, ou `null` sans sélection. */
  const selectedBits = (): number | null =>
    memo.selected === null ? null : (cur().memos[memo.selected] ?? 0);

  /** Remplace le pied de page (mémo ouvert ou fermé). */
  function drawActions(): void {
    const next = renderActions(memo.open, selectedBits());
    actions.replaceWith(next);
    actions = next;
  }

  /** Redessine une seule carte (garde le curseur, évite de faire clignoter le plateau). */
  function refreshCard(id: number | null): void {
    if (id === null) return;
    cardEl(id)?.replaceWith(
      renderCard(cur(), id, {
        selected: memo.open && memo.selected === id,
        headUrl: headUrl(),
      }),
    );
  }

  /** R-81 : ouvre ou ferme le mémo ; la mise en page change sous le doigt, donc verrou. */
  function toggleMemoMode(): void {
    lockInput();
    memo = { ...memo, open: !memo.open };
    drawActions();
    refreshCard(memo.selected);
  }

  function selectCard(id: number): void {
    if (cur().flipped[id]) {
      // R-81 : carte retournée refusée, sans changer la sélection ni les marques.
      const el = cardEl(id);
      if (!el) return;
      el.classList.add('refus');
      setTimeout(() => el.classList.remove('refus'), REFUS_MS);
      return;
    }
    const previous = memo.selected;
    memo = { ...memo, selected: id };
    if (previous !== id) refreshCard(previous);
    refreshCard(id);
    updateMemoPanel(actions, selectedBits());
  }

  function markSelected(mark: MemoMark): void {
    if (memo.selected === null) return;
    round = toggleMemo(cur(), memo.selected, mark);
    refreshCard(memo.selected);
    updateMemoPanel(actions, selectedBits());
  }

  /** R-81 : le mémo repart fermé et sans sélection. */
  function resetMemo(): void {
    memo = { open: false, selected: null };
  }

  function showMenu(note = ''): void {
    dialogKind = null;
    dialogEl = null;
    phase = 'menu';
    root.replaceChildren(renderMenu(game.level, game.coins, note));
    options.onMenu?.();
  }

  function showScreen(title: string, version?: string): void {
    phase = 'screen';
    changingCode = false;
    options.onLeaveMenu?.();
    const screen = renderScreen(title, version, version === undefined ? undefined : codeSection());
    root.replaceChildren(screen);
    refreshPackLine();
    const diag = screen.querySelector<HTMLElement>('.ecran-diagnostic');
    if (diag) {
      // T-015 (provisoire) : rempli après coup ; rien si l'écran a été quitté entre-temps.
      void collectOfflineInfo()
        .then((info) => {
          if (!diag.isConnected) return;
          diag.replaceChildren(
            ...formatOfflineInfo(info).map((ligne) => {
              const div = document.createElement('div');
              div.textContent = ligne;
              return div;
            }),
          );
        })
        .catch(() => {});
    }
  }

  function codeSection(): HTMLElement {
    const content = pack.content();
    if (packBusy) return renderCodeSection({ kind: 'checking' });
    if (content && !changingCode)
      return renderCodeSection({ kind: 'accepted', welcome: content.welcome });
    return renderCodeSection({ kind: 'form', error: packError });
  }

  /** Rien n'est écrit si l'écran Réglages a été quitté entre-temps. */
  function refreshCodeSection(): void {
    // F5 : la zone aria-live (p.code-etat) reste en place ; seul son texte change.
    const existing = root.querySelector<HTMLElement>('.code-secret');
    if (existing) {
      const next = codeSection();
      const status = existing.querySelector('.code-etat');
      const nextStatus = next.querySelector('.code-etat');
      existing.querySelector('.code-corps')?.replaceWith(next.querySelector('.code-corps') as Node);
      if (status) status.textContent = nextStatus?.textContent ?? '';
      existing.dataset.etat = next.dataset.etat ?? '';
    }
    refreshPackLine();
  }

  /** T-017 (provisoire) : ligne « pack : … » du diagnostic. */
  function refreshPackLine(): void {
    const line = root.querySelector<HTMLElement>('.ecran-pack');
    if (!line) return;
    const content = pack.content();
    const ms = pack.decryptMs();
    line.textContent = formatPackInfo(
      packStatus === 'loaded' && content && ms !== null
        ? { status: 'loaded', photos: content.photos.length, ms }
        : { status: packStatus === 'loaded' ? 'absent' : packStatus },
    );
  }

  const errorText = (result: PackResult): string =>
    result === 'wrong'
      ? packTexts.wrong
      : result === 'unavailable'
        ? packTexts.unavailable
        : result === 'empty'
          ? packTexts.empty
          : '';

  /** R-124 : une seule vérification à la fois ; le résultat est appliqué même si l'écran est quitté. */
  async function checkCode(code: string, fromLaunch: boolean): Promise<PackResult> {
    if (packBusy) return 'empty';
    packBusy = true;
    packError = '';
    refreshCodeSection();
    const result = await pack.load(code);
    packBusy = false;
    if (result === 'ok') {
      changingCode = false;
      packStatus = 'loaded';
      if (!fromLaunch) options.onPackCode?.(normalizeCode(code));
    } else if (result === 'unavailable') {
      packStatus = 'unavailable';
    } else if (result === 'wrong' && fromLaunch) {
      options.onPackCode?.(null); // le pack a été refait avec un autre code.
    }
    packError = fromLaunch ? '' : errorText(result);
    refreshCodeSection();
    return result;
  }

  function submitCode(): void {
    if (packBusy) return;
    const field = root.querySelector<HTMLInputElement>('.code-champ');
    void checkCode(field?.value ?? '', false);
  }

  /** Dialogue Oui/Non modal, dans `#app`. */
  function openDialog(kind: DialogKind, text: string): void {
    lockInput(); // Le dialogue s'ouvre parfois sous le doigt : le second toucher d'un double toucher ne doit pas y répondre.
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
    lockInput();
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
    const face = renderCard(r, id, { headUrl: headUrl() });
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
      const face = renderCard(all, id, { headUrl: headUrl() });
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
    if (memo.selected === id) memo = { ...memo, selected: null };
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
    if (value === 'S') setMessage(pickMessage(pack.sardineMessages(messages.sardine), rngs.decor));
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
    if (memo.open) {
      resetMemo(); // R-42 : le mémo se ferme avant l'encaissement.
      drawActions();
    }
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
    options.onLeaveMenu?.();
    round = next.round;
    shown.level = game.level;
    shown.total = game.coins;
    shown.payout = 0;
    setMessage('');
    resetMemo();
    actions = renderActions();
    root.replaceChildren(hud, table, message, actions);
    drawBoard();
    phase = 'playing';
    lockInput();
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
        lockInput();
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
    else if (name === 'settings') showScreen(texts.settings, __APP_VERSION__);
    else if (name === 'leave-table') openDialog('leave', leaveTableQuestion);
  }

  installInput(root, {
    onGesture: unlockAudio,
    onCard(id) {
      if (locked()) return;
      if (phase === 'playing') {
        if (memo.open) selectCard(id);
        else void doFlip(id);
      } else if (phase === 'ending')
        skip(); // CL-20 : jamais `flip` après la fin.
      else if (phase === 'waitingTap') void afterRound();
    },
    onAction(name) {
      if (phase === 'dialog') {
        if ((name === 'yes' || name === 'no') && !locked()) answer(name === 'yes');
      } else if (phase === 'menu') {
        if (!locked()) menuAction(name);
      } else if (phase === 'screen') {
        if (name === 'back') showMenu();
        else if (name === 'submit-code') submitCode();
        else if (name === 'change-code') {
          packError = '';
          changingCode = true;
          refreshCodeSection();
        }
      } else if (phase === 'ending') {
        skip(); // CL-20 : tout bouton de l'écran de jeu est un toucher d'écran.
      } else if (phase === 'waitingTap') {
        void afterRound(); // R-52
      } else if (phase === 'playing') {
        if (name === 'quit') openDialog('quit', quitQuestion(cur().payout));
        else if (locked()) return;
        else if (name === 'memo') toggleMemoMode();
        else if (memo.open && name.startsWith('mark-')) {
          const mark = name.slice(5);
          markSelected(mark === 'S' ? 'S' : (Number(mark) as 1 | 2 | 3));
        }
      }
    },
    onElsewhere() {
      if (phase === 'ending') skip();
      else if (phase === 'waitingTap') void afterRound();
    },
  });

  // R-124 : la touche Entrée valide le code.
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    if (event.target instanceof Element && event.target.matches('.code-champ')) {
      event.preventDefault();
      submitCode();
    }
  });

  // R-53 : boîte pleine dès le lancement.
  showMenu(canStartRound(game) ? '' : messages.boxFull);

  return {
    game: () => game,
    round: () => round,
    phase: () => phase,
    dialog: () => dialogKind,
    memo: () => memo,
    loadSavedPack: (code) => checkCode(code, true),
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
