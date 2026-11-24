import { expect, type Page, test } from '@playwright/test';
import { initialGame } from '../../src/logic/game';
import { attendre, idsWhere, ouvrir, ouvrirMenu, repondre, roundForSeed, toucher } from './aide';

const SEED = 42;
const appliques = (page: Page) => page.evaluate(() => window.__sb?.applyCount());
const signaler = (page: Page) => page.evaluate(() => window.__sb?.needRefresh());

async function finirParVictoire(page: Page, game = initialGame()): Promise<void> {
  const multis = idsWhere(roundForSeed(SEED, game), (v) => v === 2 || v === 3);
  for (const id of multis) {
    await toucher(page, id);
    if (id !== multis[multis.length - 1]) await attendre(page, 'playing');
  }
  await attendre(page, 'waitingTap');
}

test('R-104 sur le menu : la mise à jour est appliquée tout de suite', async ({ page }) => {
  await ouvrirMenu(page, SEED, true);
  expect(await appliques(page)).toBe(0);
  await signaler(page);
  expect(await appliques(page)).toBe(1);
});

test('R-104 pendant une partie : attend le retour au menu (Non)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await signaler(page);
  expect(await appliques(page)).toBe(0);
  await finirParVictoire(page);
  expect(await appliques(page)).toBe(0);
  await page.locator('.message').click();
  await attendre(page, 'dialog');
  expect(await appliques(page)).toBe(0);
  await repondre(page, 'no');
  await attendre(page, 'menu');
  expect(await appliques(page)).toBe(1);
});

test('R-104 sur un écran (Infos) : attend le Retour', async ({ page }) => {
  await ouvrirMenu(page, SEED, true);
  await page.locator('[data-action=infos]').click();
  await attendre(page, 'screen');
  await signaler(page);
  expect(await appliques(page)).toBe(0);
  await page.getByRole('button', { name: 'Retour' }).click();
  await attendre(page, 'menu');
  expect(await appliques(page)).toBe(1);
});

test('R-104 dialogue « Quitter la table » ouvert depuis le menu : appliquée tout de suite', async ({
  page,
}) => {
  await ouvrirMenu(page, SEED, true);
  await page.locator('[data-action=leave-table]').click();
  await attendre(page, 'dialog');
  await signaler(page);
  expect(await appliques(page)).toBe(1);
});

test('R-104 R-53 boîte pleine après une partie : appliquée au menu', async ({ page }) => {
  const game = { ...initialGame(), coins: 49_999 };
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrirMenu(page, SEED, true);
  await page.evaluate((g) => window.__sb?.setGame(g), game);
  await page.locator('[data-action=play]').click();
  await page.locator('.board').waitFor();
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
  await signaler(page);
  expect(await appliques(page)).toBe(0);
  await finirParVictoire(page, game);
  await page.locator('.message').click();
  await attendre(page, 'menu');
  expect(await appliques(page)).toBe(1);
});
