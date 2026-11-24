import { expect, test } from '@playwright/test';
import { initialGame } from '../../src/logic/game';
import type { GameState } from '../../src/logic/types';
import { formatCoins } from '../../src/ui/format';
import { messages } from '../../src/ui/texts.fr';
import { attendre, ouvrirMenu, repondre, roundForSeed } from './aide';

const SEED = 42;

const jeu = (extra: Partial<GameState>): GameState => ({ ...initialGame(), ...extra });

test("ADR-019 au lancement, le menu s'affiche", async ({ page }) => {
  await ouvrirMenu(page, SEED, true);
  await expect(page.locator('.menu h1')).toHaveText('Sardinebagarre');
  await expect(page.locator('.menu-niveau')).toHaveText('Niveau 1');
  await expect(page.locator('.menu-total strong')).toHaveText('00000');
  await expect(page.locator('.menu-boutons button')).toHaveText([
    'Jouer au niveau 1',
    'Album',
    'Infos',
    'Réglages',
    'Quitter la table',
  ]);
  await expect(page.locator('.board')).toHaveCount(0);
  expect(await page.evaluate(() => window.__sb?.phase())).toBe('menu');
});

test('UI-01 Jouer au niveau 1 lance la partie de la graine', async ({ page }) => {
  await ouvrirMenu(page, SEED, true);
  await page.getByRole('button', { name: 'Jouer au niveau 1' }).click();
  await expect(page.locator('.board')).toBeVisible();
  const board = await page.evaluate(() => window.__sb?.state().board);
  expect(board).toEqual(roundForSeed(SEED).board);
  expect(await page.evaluate(() => window.__sb?.phase())).toBe('playing');
});

test('UI-01 Album, Infos, Réglages puis Retour', async ({ page }) => {
  await ouvrirMenu(page, SEED, true);
  for (const [action, titre] of [
    ['album', 'Album'],
    ['infos', 'Infos'],
    ['settings', 'Réglages'],
  ] as const) {
    await page.locator(`[data-action=${action}]`).click();
    await expect(page.locator('.ecran h2')).toHaveText(titre);
    await expect(page.locator('.ecran-texte')).toHaveText('Bientôt ici.');
    expect(await page.evaluate(() => window.__sb?.phase())).toBe('screen');
    await page.getByRole('button', { name: 'Retour' }).click();
    await attendre(page, 'menu');
    await expect(page.locator('.menu h1')).toBeVisible();
  }
});

test('UI-10 UI-12 menu sans défilement, boutons de 44 px au moins', async ({ page }) => {
  await ouvrirMenu(page, SEED);
  const d = await page.evaluate(() => ({
    sh: document.documentElement.scrollHeight,
    ih: window.innerHeight,
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
    haut: document.querySelector('.menu')?.scrollHeight ?? 0,
    bas: document.querySelector('.menu')?.clientHeight ?? 0,
  }));
  expect(d.sh).toBeLessThanOrEqual(d.ih);
  expect(d.sw).toBeLessThanOrEqual(d.iw);
  expect(d.haut).toBeLessThanOrEqual(d.bas);
  const tailles = await page
    .locator('.menu-boutons button')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  for (const h of tailles) expect(h).toBeGreaterThanOrEqual(44);
});

test('R-67 Quitter la table : Non garde le niveau, Oui remet au niveau 1', async ({ page }) => {
  await ouvrirMenu(page, SEED, true);
  const game = jeu({
    coins: 123,
    level: 4,
    history: [
      { outcome: 'WON', cardsFlipped: 5, level: 4 },
      { outcome: 'QUIT', cardsFlipped: 3, level: 4 },
    ],
  });
  await page.evaluate((g) => window.__sb?.setGame(g), game);
  await expect(page.locator('.menu-niveau')).toHaveText('Niveau 4');
  await page.locator('[data-action=leave-table]').click();
  await expect(page.locator('[role=dialog]')).toContainText(
    'Quitter la table ? Tu repartiras du niveau 1.',
  );
  expect(await page.evaluate(() => window.__sb?.dialog())).toBe('leave');
  await repondre(page, 'no');
  await attendre(page, 'menu');
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  expect((await page.evaluate(() => window.__sb?.game()))?.level).toBe(4);
  await expect(page.locator('.menu-niveau')).toHaveText('Niveau 4');
  await page.locator('[data-action=leave-table]').click();
  await repondre(page, 'yes');
  await attendre(page, 'menu');
  await expect(page.locator('.menu-niveau')).toHaveText('Niveau 1');
  await expect(page.locator('.menu-total strong')).toHaveText(formatCoins(123));
  const apres = await page.evaluate(() => window.__sb?.game());
  expect(apres?.level).toBe(1);
  expect(apres?.history).toEqual([]);
  expect(apres?.coins).toBe(123);
});

test('R-53 CL-14 boîte pleine : Jouer affiche le message et reste au menu', async ({ page }) => {
  await ouvrirMenu(page, SEED, true);
  await page.evaluate((g) => window.__sb?.setGame(g), jeu({ coins: 50000 }));
  await page.locator('[data-action=play]').click();
  await expect(page.locator('.menu-message')).toHaveText(messages.boxFull);
  expect(await page.evaluate(() => window.__sb?.phase())).toBe('menu');
  await expect(page.locator('.board')).toHaveCount(0);
});

test("ADR-001 en développement, aucun service worker n'est enregistré", async ({ page }) => {
  await ouvrirMenu(page, SEED, true);
  const nombre = await page.evaluate(
    async () => (await navigator.serviceWorker.getRegistrations()).length,
  );
  expect(nombre).toBe(0);
});
