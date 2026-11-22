import { flip, toggleMemo } from '../logic/round';
import type { MemoMark, RoundState } from '../logic/types';

export interface DebugHooks {
  flip(id: number): void;
  mark(id: number, mark: MemoMark): void;
  state(): RoundState;
}

declare global {
  interface Window {
    __sb?: DebugHooks;
  }
}

/** Développement seulement (`?debug=1`) : sert aux captures et aux tests e2e. */
export function installDebug(get: () => RoundState, set: (round: RoundState) => void): void {
  window.__sb = {
    flip: (id) => set(flip(get(), id)),
    mark: (id, mark) => set(toggleMemo(get(), id, mark)),
    state: get,
  };
}
