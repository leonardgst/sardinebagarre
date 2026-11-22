import { expect, type Page, test } from '@playwright/test';
import { formatCoins } from '../../src/ui/format';
import { messages } from '../../src/ui/texts.fr';
import { attendre, idsWhere, ouvrir, roundForSeed, toucher } from './aide';

const SEED = 42;

async function ouvrirRapide(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
}

test('R-32 R-33 R-50 partie gagnée', async ({ page }) => {
  const round = roundForSeed(SEED);
  const multis = idsWhere(round, (v) => v === 2 || v === 3);
  const produit = multis.reduce((acc, id) => acc * Number(round.board.cells[id]), 1);
  await ouvrirRapide(page);
  for (const id of multis) {
    await toucher(page, id);
    if (id !== multis[multis.length - 1]) await attendre(page, 'playing');
  }
  await expect(page.locator('.bandeau-gagne')).toContainText('Gagné !');
  await attendre(page, 'waitingTap');
  await expect(page.locator('.total strong')).toHaveText(formatCoins(produit));
  await expect(page.locator('.gain strong')).toHaveText('00000');
  await expect(page.locator('[data-state=shown]')).toHaveCount(25);
  await page.locator('.message').click();
  await expect(page.locator('.bandeau-niveau')).toContainText('Niveau 2 atteint !');
  await expect(page.locator('.bandeau-niveau')).toContainText('Bravo !');
  await attendre(page, 'playing');
  await expect(page.locator('.niveau strong')).toHaveText('2');
  await expect(page.locator('[data-state=hidden]')).toHaveCount(25);
});

test('R-34 R-51 R-63 partie perdue', async ({ page }) => {
  const round = roundForSeed(SEED);
  const [a, b] = idsWhere(round, (v) => v === 1);
  const [sardine] = idsWhere(round, (v) => v === 'S');
  if (a === undefined || b === undefined || sardine === undefined) throw new Error('plateau');
  await ouvrirRapide(page);
  for (const id of [a, b]) {
    await toucher(page, id);
    await attendre(page, 'playing');
  }
  await toucher(page, sardine);
  const message = (await page.locator('.message').textContent()) ?? '';
  expect(messages.sardine as readonly string[]).toContain(message);
  await attendre(page, 'waitingTap');
  await expect(page.locator('.gain strong')).toHaveText('00000');
  await expect(page.locator('.total strong')).toHaveText('00000');
  await expect(page.locator('.message')).toHaveText(messages.tapToContinue);
  await expect(page.locator('[data-state=shown]')).toHaveCount(25);
  await page.locator('.message').click();
  await attendre(page, 'playing');
  await expect(page.locator('.bandeau')).toHaveCount(0);
  await expect(page.locator('.niveau strong')).toHaveText('1');
  await expect(page.locator('[data-state=hidden]')).toHaveCount(25);
});

test('R-55 état finalisé avant les animations', async ({ page }) => {
  const [sardine] = idsWhere(roundForSeed(SEED), (v) => v === 'S');
  if (sardine === undefined) throw new Error('plateau');
  await ouvrir(page, SEED, true);
  await toucher(page, sardine);
  const game = await page.evaluate(() => window.__sb?.game());
  expect(game?.history).toHaveLength(1);
  expect(game?.stats.lost).toBe(1);
});

test('R-30 toucher une carte retournée ne fait rien', async ({ page }) => {
  const [un] = idsWhere(roundForSeed(SEED), (v) => v === 1);
  if (un === undefined) throw new Error('plateau');
  await ouvrirRapide(page);
  await toucher(page, un);
  await attendre(page, 'playing');
  await toucher(page, un);
  const state = await page.evaluate(() => window.__sb?.state());
  expect(state?.cardsFlipped).toBe(1);
  expect(state?.payout).toBe(1);
});

test('CL-19 double toucher rapide', async ({ page }) => {
  const [a, b] = idsWhere(roundForSeed(SEED), (v) => v === 1);
  if (a === undefined || b === undefined) throw new Error('plateau');
  const doubler = (ids: number[]) =>
    page.evaluate((list) => {
      for (const id of list) document.querySelector<HTMLElement>(`[data-id="${id}"]`)?.click();
      return window.__sb?.state().cardsFlipped;
    }, ids);
  await ouvrirRapide(page);
  expect(await doubler([a, a])).toBe(1);
  await ouvrirRapide(page);
  expect(await doubler([a, b])).toBe(1);
});

test('CL-20 toucher pendant la fin', async ({ page }) => {
  const erreurs: Error[] = [];
  page.on('pageerror', (e) => erreurs.push(e));
  const [sardine] = idsWhere(roundForSeed(SEED), (v) => v === 'S');
  if (sardine === undefined) throw new Error('plateau');
  await ouvrirRapide(page);
  await toucher(page, sardine);
  const pendant = await page.evaluate(() => {
    const phase = window.__sb?.phase();
    document.querySelector<HTMLElement>('[data-state=hidden]')?.click();
    return phase;
  });
  expect(pendant).toBe('ending');
  await attendre(page, 'waitingTap');
  expect(erreurs).toEqual([]);
  expect(await page.evaluate(() => window.__sb?.state().cardsFlipped)).toBe(0);
  await expect(page.locator('[data-state=shown]')).toHaveCount(25);
  await page.locator('.message').click();
  await attendre(page, 'playing');
  await expect(page.locator('[data-state=hidden]')).toHaveCount(25);
});

test('CL-21 aucun retournement automatique', async ({ page }) => {
  await ouvrir(page, SEED);
  await page.waitForTimeout(1000);
  await expect(page.locator('[data-state=hidden]')).toHaveCount(25);
});

test('C1 le toucher pendant la fin ne coupe pas UI-30 de la partie suivante', async ({ page }) => {
  const [sardine] = idsWhere(roundForSeed(SEED), (v) => v === 'S');
  if (sardine === undefined) throw new Error('plateau');
  await ouvrir(page, SEED, true); // sans reducedMotion
  await toucher(page, sardine);
  await page.evaluate(() => document.querySelector<HTMLElement>('[data-state=hidden]')?.click());
  await attendre(page, 'waitingTap');
  await page.locator('.message').click();
  await attendre(page, 'playing');
  const animee = await page.evaluate(() => {
    document.querySelector<HTMLElement>('[data-state=hidden]')?.click();
    return !!document.querySelector('.flip-out');
  });
  expect(animee).toBe(true);
});

test('R-52 clic sur le fond décoré (Mac) : la partie suivante démarre', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mac', 'fond décoré hors colonne : grand écran seulement');
  const [sardine] = idsWhere(roundForSeed(SEED), (v) => v === 'S');
  if (sardine === undefined) throw new Error('plateau');
  await ouvrirRapide(page);
  await toucher(page, sardine);
  await attendre(page, 'waitingTap');
  await page.mouse.click(5, 400);
  await attendre(page, 'playing');
  await expect(page.locator('[data-state=hidden]')).toHaveCount(25);
});

test('R-52 parcours au doigt : Sardine, toucher sur le message, nouvelle partie', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'projets tactiles seulement');
  const [sardine] = idsWhere(roundForSeed(SEED), (v) => v === 'S');
  if (sardine === undefined) throw new Error('plateau');
  await ouvrirRapide(page);
  await page.locator(`[data-id="${sardine}"]`).tap();
  await attendre(page, 'waitingTap');
  await page.locator('.message').tap();
  await attendre(page, 'playing');
  await expect(page.locator('[data-state=hidden]')).toHaveCount(25);
});
