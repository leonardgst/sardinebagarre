import type { Page } from '@playwright/test';
import { initialGame, startRound } from '../../src/logic/game';
import { initialSave, serialize } from '../../src/logic/save';
import type { GameState, RoundState, SaveData } from '../../src/logic/types';
import { createRngs } from '../../src/ui/seed';
import { SAVE_KEY } from '../../src/ui/storage';

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

/** Ouvre ou ferme le mémo (même bouton) et attend la fin du verrou anti-rebond. */
export async function basculerMemo(page: Page): Promise<void> {
  await page.locator('[data-action=memo]').click();
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
}

export const memoState = (page: Page) => page.evaluate(() => window.__sb?.memo());

/** Erreurs de page non interceptées (à vérifier vides en fin de test). */
export function surveillerErreurs(page: Page): string[] {
  const erreurs: string[] = [];
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

/** Ouvre l'application, écrit `texte` dans `localStorage` puis recharge (une seule écriture). */
export async function ouvrirAvecSauvegarde(
  page: Page,
  seed: number,
  texte: string,
  debug = true,
): Promise<void> {
  await ouvrirMenu(page, seed, debug);
  await page.evaluate(
    ([k, v]) => localStorage.setItem(k as string, v as string),
    [SAVE_KEY, texte],
  );
  await page.reload();
  await page.locator('.menu').waitFor();
}

/** Sauvegarde brute lue dans la page (`null` si la clé est absente). */
export const lireSauvegarde = (page: Page) =>
  page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) ?? 'null') as Record<string, unknown> | null,
    SAVE_KEY,
  );

/** Texte de sauvegarde pour un état de jeu donné (partie neuve pour le reste). */
export function sauvegardeTexte(
  game: Partial<GameState>,
  reste: Partial<Omit<SaveData, 'game'>> = {},
): string {
  const base = initialSave();
  return serialize({ ...base, ...reste, game: { ...base.game, ...game } });
}
