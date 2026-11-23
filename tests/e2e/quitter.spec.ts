import { expect, type Page, test } from '@playwright/test';
import { initialGame } from '../../src/logic/game';
import { formatCoins } from '../../src/ui/format';
import { messages } from '../../src/ui/texts.fr';
import { attendre, idsWhere, ouvrir, ouvrirMenu, repondre, roundForSeed, toucher } from './aide';

const SEED = 42;
const quitter = (page: Page) => page.locator('[data-action=quit]').click();

test('R-40 Quitter à 0 jeton : message « aucun jeton »', async ({ page }) => {
  await ouvrir(page, SEED, true);
  await quitter(page);
  await expect(page.locator('[role=dialog] p')).toHaveText(
    "Tu n'as encore trouvé aucun jeton. Quitter quand même ?",
  );
  expect(await page.evaluate(() => window.__sb?.dialog())).toBe('quit');
  await expect(page.locator('[role=dialog] [data-action=no]')).toBeFocused();
});

test('R-40 Quitter avec un gain : message avec le gain', async ({ page }) => {
  const round = roundForSeed(SEED);
  const [id] = idsWhere(round, (v) => v === 2 || v === 3);
  if (id === undefined) throw new Error('plateau');
  const v = Number(round.board.cells[id]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, id);
  await attendre(page, 'playing');
  await quitter(page);
  await expect(page.locator('[role=dialog] p')).toHaveText(
    `Si tu t'arrêtes maintenant, tu gagnes ${v} jetons. Tu t'arrêtes ?`,
  );
});

test('R-40 accord : tu gagnes 1 jeton', async ({ page }) => {
  const [un] = idsWhere(roundForSeed(SEED), (v) => v === 1);
  if (un === undefined) throw new Error('plateau');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, un);
  await attendre(page, 'playing');
  await quitter(page);
  await expect(page.locator('[role=dialog] p')).toContainText('tu gagnes 1 jeton.');
});

test('CL-12 Quitter puis Non : état exact', async ({ page }) => {
  const [un] = idsWhere(roundForSeed(SEED), (v) => v === 1);
  if (un === undefined) throw new Error('plateau');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, un);
  await attendre(page, 'playing');
  const avant = await page.evaluate(() => window.__sb?.state());
  const message = await page.locator('.message').textContent();
  await quitter(page);
  await repondre(page, 'no');
  expect(await page.evaluate(() => window.__sb?.state())).toEqual(avant);
  await expect(page.locator('.message')).toHaveText(message ?? '');
  expect(await page.evaluate(() => window.__sb?.phase())).toBe('playing');
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
});

test('R-42 R-50 Quitter puis Oui : gain encaissé et plateau révélé', async ({ page }) => {
  const round = roundForSeed(SEED);
  const [id] = idsWhere(round, (v) => v === 2 || v === 3);
  if (id === undefined) throw new Error('plateau');
  const v = Number(round.board.cells[id]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, id);
  await attendre(page, 'playing');
  await quitter(page);
  await repondre(page, 'yes');
  // R-55 : encaissé avant l'animation.
  expect((await page.evaluate(() => window.__sb?.game()))?.coins).toBe(v);
  await attendre(page, 'waitingTap');
  await expect(page.locator('[data-state=shown]')).toHaveCount(25);
  await expect(page.locator('.total strong')).toHaveText(formatCoins(v));
  await expect(page.locator('.gain strong')).toHaveText('00000');
});

test('CL-01 abandon à 0 carte depuis le niveau 6 → niveau 1', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrirMenu(page, SEED, true);
  const game = { ...initialGame(), level: 6 as const };
  await page.evaluate((g) => window.__sb?.setGame(g), game);
  await page.locator('[data-action=play]').click();
  await page.locator('.board').waitFor();
  expect(await page.evaluate(() => window.__sb?.state().board)).toEqual(
    roundForSeed(SEED, game).board,
  );
  await quitter(page);
  await repondre(page, 'yes');
  await attendre(page, 'waitingTap');
  const apres = await page.evaluate(() => window.__sb?.game());
  expect(apres?.level).toBe(1);
  expect(apres?.coins).toBe(0);
  await page.locator('.message').click();
  await expect(page.locator('.bandeau-niveau')).toContainText('Retour au niveau 1.');
  await attendre(page, 'dialog');
  await expect(page.locator('[role=dialog] p')).toHaveText('Jouer au niveau 1 ?');
});

async function gagner(page: Page): Promise<void> {
  const multis = idsWhere(roundForSeed(SEED), (v) => v === 2 || v === 3);
  for (const id of multis) {
    await toucher(page, id);
    if (id !== multis[multis.length - 1]) await attendre(page, 'playing');
  }
  await attendre(page, 'waitingTap');
  await page.locator('.message').click();
}

test('ADR-019 R-66 après le bandeau, question Jouer au niveau n', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await gagner(page);
  await expect(page.locator('.bandeau-niveau')).toContainText('Niveau 2 atteint !');
  await attendre(page, 'dialog');
  await expect(page.locator('[role=dialog] p')).toHaveText('Jouer au niveau 2 ?');
  expect(await page.evaluate(() => window.__sb?.dialog())).toBe('play');
  await expect(page.locator('[data-state=shown]')).toHaveCount(25);
});

test('ADR-019 Oui lance la partie suivante', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await gagner(page);
  await attendre(page, 'dialog');
  await repondre(page, 'yes');
  await attendre(page, 'playing');
  await expect(page.locator('.niveau strong')).toHaveText('2');
  await expect(page.locator('[data-state=hidden]')).toHaveCount(25);
  const board = await page.evaluate(() => window.__sb?.state().board);
  expect(board).not.toEqual(roundForSeed(SEED).board);
});

test('ADR-019 Non ramène au menu avec le nouveau niveau et le total', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await gagner(page);
  await attendre(page, 'dialog');
  await repondre(page, 'no');
  await attendre(page, 'menu');
  const coins = (await page.evaluate(() => window.__sb?.game()))?.coins ?? -1;
  await expect(page.locator('.menu-niveau')).toHaveText('Niveau 2');
  await expect(page.locator('.menu-total strong')).toHaveText(formatCoins(coins));
  await expect(page.locator('[data-action=play]')).toHaveText('Jouer au niveau 2');
});

test('ADR-019 sans changement de niveau, la question vient directement', async ({ page }) => {
  const round = roundForSeed(SEED);
  const [un] = idsWhere(round, (v) => v === 1);
  const [sardine] = idsWhere(round, (v) => v === 'S');
  if (un === undefined || sardine === undefined) throw new Error('plateau');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, un);
  await attendre(page, 'playing');
  await toucher(page, sardine);
  await attendre(page, 'waitingTap');
  await page.locator('.message').click();
  await attendre(page, 'dialog');
  await expect(page.locator('.bandeau-niveau')).toHaveCount(0);
  await expect(page.locator('[role=dialog] p')).toHaveText('Jouer au niveau 1 ?');
});

test('CL-19 Quitter pendant un retournement est ignoré', async ({ page }) => {
  const [autre] = idsWhere(roundForSeed(SEED), (v) => v !== 'S');
  if (autre === undefined) throw new Error('plateau');
  await ouvrir(page, SEED, true); // sans reducedMotion : le retournement dure 250 ms
  await toucher(page, autre);
  await page.locator('[data-action=quit]').click({ force: true });
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  await attendre(page, 'playing');
});

test("CL-20 Quitter pendant la fin n'ouvre rien", async ({ page }) => {
  const [sardine] = idsWhere(roundForSeed(SEED), (v) => v === 'S');
  if (sardine === undefined) throw new Error('plateau');
  await ouvrir(page, SEED, true); // sans reducedMotion : sans skip(), la fin dure plus de 500 ms
  await toucher(page, sardine);
  await page.locator('[data-action=quit]').click({ force: true });
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  const debut = Date.now();
  await attendre(page, 'waitingTap');
  expect(Date.now() - debut).toBeLessThan(500);
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
});

test('dialogue modal : toucher une carte ou le voile ne fait rien', async ({ page }) => {
  await ouvrir(page, SEED, true);
  await quitter(page);
  const avant = await page.evaluate(() => window.__sb?.state());
  await page.locator('.voile').click({ position: { x: 4, y: 4 } });
  await page.locator('[data-id="0"]').click({ force: true });
  await expect(page.locator('[role=dialog]')).toHaveCount(1);
  expect(await page.evaluate(() => window.__sb?.dialog())).toBe('quit');
  expect(await page.evaluate(() => window.__sb?.state())).toEqual(avant);
});

test('T-011 un dialogue est dans #app', async ({ page }) => {
  await ouvrir(page, SEED, true);
  await quitter(page);
  await expect(page.locator('#app [role=dialog]')).toHaveCount(1);
  await expect(page.locator('body > [role=dialog]')).toHaveCount(0);
});

test('R-41 CL-12 double toucher sur Non : état exact', async ({ page }) => {
  const [un] = idsWhere(roundForSeed(SEED), (v) => v === 1);
  if (un === undefined) throw new Error('plateau');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, un);
  await attendre(page, 'playing');
  const avant = await page.evaluate(() => window.__sb?.state());
  await quitter(page);
  await page.locator('[role=dialog] [data-action=no]').dblclick();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__sb?.state())).toEqual(avant);
  expect(await page.evaluate(() => window.__sb?.phase())).toBe('playing');
});

test('ADR-019 double toucher sur Oui : aucune carte retournée', async ({ page }) => {
  const [sardine] = idsWhere(roundForSeed(SEED), (v) => v === 'S');
  if (sardine === undefined) throw new Error('plateau');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, sardine);
  await attendre(page, 'waitingTap');
  await page.locator('.message').click();
  await attendre(page, 'dialog');
  await page.locator('[role=dialog] [data-action=yes]').dblclick();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__sb?.phase())).toBe('playing');
  expect(await page.evaluate(() => window.__sb?.state().flipped.some(Boolean))).toBe(false);
});

test('R-52 toucher Quitter en waitingTap → question Jouer au niveau n', async ({ page }) => {
  const [sardine] = idsWhere(roundForSeed(SEED), (v) => v === 'S');
  if (sardine === undefined) throw new Error('plateau');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, sardine);
  await attendre(page, 'waitingTap');
  await page.locator('[data-action=quit]').click();
  await attendre(page, 'dialog');
  expect(await page.evaluate(() => window.__sb?.dialog())).toBe('play');
  await expect(page.locator('[role=dialog] p')).toHaveText('Jouer au niveau 1 ?');
  await expect(page.locator('.message')).toHaveText('');
});

test('ADR-019 R-53 boîte pleine en fin de partie : pas de question, menu avec le message', async ({
  page,
}) => {
  const game = { ...initialGame(), coins: 49_999 };
  const [id] = idsWhere(roundForSeed(SEED, game), (v) => v === 2 || v === 3);
  if (id === undefined) throw new Error('plateau');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrirMenu(page, SEED, true);
  await page.evaluate((g) => window.__sb?.setGame(g), game);
  await page.locator('[data-action=play]').click();
  await page.locator('.board').waitFor();
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
  await toucher(page, id);
  await attendre(page, 'playing');
  await quitter(page);
  await repondre(page, 'yes');
  expect((await page.evaluate(() => window.__sb?.game()))?.coins).toBe(50_000);
  await attendre(page, 'waitingTap');
  await page.locator('.message').click();
  await attendre(page, 'menu');
  await expect(page.locator('.menu-message')).toHaveText(messages.boxFull);
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__sb?.dialog())).toBeNull();
});
