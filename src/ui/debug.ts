import { flip, toggleMemo } from '../logic/round';
import type { GameState, MemoMark, RoundState } from '../logic/types';
import type { Controller, DialogKind, Phase } from './controller';
import type { UpdateGate } from './update-gate';

export interface DebugHooks {
  /** Raccourci de capture : ne passe pas par le contrôleur (pas d'animation, pas de finalisation). */
  flip(id: number): void;
  mark(id: number, mark: MemoMark): void;
  state(): RoundState;
  game(): GameState;
  phase(): Phase;
  dialog(): DialogKind | null;
  /** Remplace l'état du jeu (depuis le menu seulement). */
  setGame(game: GameState): void;
  memo(): { readonly open: boolean; readonly selected: number | null };
  /** R-104 : simule « une nouvelle version est prête ». */
  needRefresh(): void;
  /** R-104 : nombre d'appels à `apply` (factice en développement). */
  applyCount(): number;
}

declare global {
  interface Window {
    __sb?: DebugHooks;
  }
}

/** Développement seulement (`?debug=1`) : sert aux captures et aux tests e2e. */
export function installDebug(
  controller: Controller,
  pwa: { readonly gate: UpdateGate; readonly applyCalls: { readonly count: number } },
): void {
  const current = (): RoundState => {
    const round = controller.round();
    if (!round) throw new Error("Aucune partie n'est lancée.");
    return round;
  };
  window.__sb = {
    flip: (id) => controller.setRound(flip(current(), id)),
    mark: (id, mark) => controller.setRound(toggleMemo(current(), id, mark)),
    state: current,
    game: () => controller.game(),
    phase: () => controller.phase(),
    dialog: () => controller.dialog(),
    setGame: (game) => controller.setGame(game),
    memo: () => controller.memo(),
    needRefresh: () => pwa.gate.needRefresh(),
    applyCount: () => pwa.applyCalls.count,
  };
}
