import { flip, toggleMemo } from '../logic/round';
import type { GameState, MemoMark, RoundState } from '../logic/types';
import type { Controller, Phase } from './controller';

export interface DebugHooks {
  /** Raccourci de capture : ne passe pas par le contrôleur (pas d'animation, pas de finalisation). */
  flip(id: number): void;
  mark(id: number, mark: MemoMark): void;
  state(): RoundState;
  game(): GameState;
  phase(): Phase;
}

declare global {
  interface Window {
    __sb?: DebugHooks;
  }
}

/** Développement seulement (`?debug=1`) : sert aux captures et aux tests e2e. */
export function installDebug(controller: Controller): void {
  window.__sb = {
    flip: (id) => controller.setRound(flip(controller.round(), id)),
    mark: (id, mark) => controller.setRound(toggleMemo(controller.round(), id, mark)),
    state: () => controller.round(),
    game: () => controller.game(),
    phase: () => controller.phase(),
  };
}
