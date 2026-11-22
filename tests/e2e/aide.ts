import type { Page } from '@playwright/test';
import { initialGame, startRound } from '../../src/logic/game';
import type { RoundState } from '../../src/logic/types';
import { createRngs } from '../../src/ui/seed';

/** Partie attendue pour une graine : même calcul que l'application. */
export function roundForSeed(seed: number): RoundState {
  const started = startRound(initialGame(), createRngs(seed).board);
  if (!started) throw new Error('partie non démarrée');
  return started.round;
}

export function idsWhere(round: RoundState, keep: (v: string | number) => boolean): number[] {
  return round.board.cells.flatMap((v, id) => (keep(v) ? [id] : []));
}

/** Ouvre l'application en mode développement avec le crochet de debug. */
export async function ouvrir(page: Page, seed: number, debug = false): Promise<void> {
  await page.goto(`./?seed=${seed}${debug ? '&debug=1' : ''}`);
  await page.locator('.board').waitFor();
}
