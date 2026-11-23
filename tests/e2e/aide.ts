import type { Page } from '@playwright/test';
import { initialGame, startRound } from '../../src/logic/game';
import type { GameState, RoundState } from '../../src/logic/types';
import { createRngs } from '../../src/ui/seed';

/** Partie attendue pour une graine (et un état de jeu) : même calcul que l'application. */
export function roundForSeed(seed: number, game: GameState = initialGame()): RoundState {
  const started = startRound(game, createRngs(seed).board);
  if (!started) throw new Error('partie non démarrée');
  return started.round;
}

export function idsWhere(round: RoundState, keep: (v: string | number) => boolean): number[] {
  return round.board.cells.flatMap((v, id) => (keep(v) ? [id] : []));
}

/** Ouvre l'application en mode développement sur le menu. */
export async function ouvrirMenu(page: Page, seed: number, debug = false): Promise<void> {
  await page.goto(`./?seed=${seed}${debug ? '&debug=1' : ''}`);
  await page.locator('.menu').waitFor();
}

/** Ouvre l'application, passe par le menu (« Jouer ») et attend le plateau. */
export async function ouvrir(page: Page, seed: number, debug = false): Promise<void> {
  await ouvrirMenu(page, seed, debug);
  await page.locator('[data-action=play]').click();
  await page.locator('.board').waitFor();
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
}

/** Répond au dialogue Oui/Non ouvert. */
export async function repondre(page: Page, reponse: 'yes' | 'no'): Promise<void> {
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
  await page.locator(`[role=dialog] [data-action=${reponse}]`).click();
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
}

export const attendre = (page: Page, phase: string) =>
  page.waitForFunction((p) => window.__sb?.phase() === p, phase);

export async function toucher(page: Page, id: number): Promise<void> {
  await page.locator(`[data-id="${id}"]`).click();
}
