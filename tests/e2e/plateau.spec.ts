import { expect, test } from '@playwright/test';
import { formatHintSum } from '../../src/ui/format';
import { idsWhere, ouvrir, roundForSeed } from './aide';

const SEED = 42;

test('R-01 R-04 plateau neuf : 25 cartes cachées sans mémo', async ({ page }) => {
  await ouvrir(page, SEED);
  await expect(page.locator('[data-state=hidden]')).toHaveCount(25);
  await expect(page.locator('[data-mark]')).toHaveCount(0);
  await expect(page.locator('[data-value]')).toHaveCount(0);
});

test('R-02 indicateurs = ceux de la logique pour la graine', async ({ page }) => {
  const round = roundForSeed(SEED);
  await ouvrir(page, SEED);
  for (let i = 0; i < 5; i++) {
    for (const [kind, hints] of [
      ['row', round.board.rowHints],
      ['col', round.board.colHints],
    ] as const) {
      const hint = hints[i];
      const loc = page.locator(`[data-hint=${kind}-${i}]`);
      await expect(loc.locator('b')).toHaveText(formatHintSum(hint?.sum ?? -1));
      await expect(loc.locator('span')).toHaveText(String(hint?.sardines));
    }
  }
});

test('UI-02 bandeau du niveau 1', async ({ page }) => {
  await ouvrir(page, SEED);
  const hud = page.locator('.hud');
  await expect(hud.locator('.niveau')).toContainText('Niveau');
  await expect(hud.locator('.niveau strong')).toHaveText('1');
  await expect(hud.locator('.gain')).toContainText('Jetons de la partie');
  await expect(hud.locator('.gain strong')).toHaveText('00000');
  await expect(hud.locator('.total strong')).toHaveText('00000');
  await expect(page.getByRole('button', { name: 'Mémo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quitter' })).toBeVisible();
});

test('UI-10 UI-15 aucun défilement', async ({ page }) => {
  await ouvrir(page, SEED);
  const d = await page.evaluate(() => ({
    sh: document.documentElement.scrollHeight,
    ih: window.innerHeight,
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
  }));
  expect(d.sh).toBeLessThanOrEqual(d.ih);
  expect(d.sw).toBeLessThanOrEqual(d.iw);
});

test("UI-12 cartes d'au moins 44 px", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('paysage'), 'paysage exclu');
  await ouvrir(page, SEED);
  const tailles = await page.locator('.card').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return [r.width, r.height];
    }),
  );
  expect(tailles).toHaveLength(25);
  for (const [w, h] of tailles) {
    expect(w).toBeGreaterThanOrEqual(44);
    expect(h).toBeGreaterThanOrEqual(44);
  }
});

test('UI-12 plateau carré', async ({ page }) => {
  await ouvrir(page, SEED);
  const box = await page.locator('.board').boundingBox();
  expect(Math.abs((box?.width ?? 0) - (box?.height ?? 99))).toBeLessThanOrEqual(1);
});

test('UI-11 Mac : colonne centrée ≤ 480 px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mac', 'Mac seulement');
  await ouvrir(page, SEED);
  const box = await page.locator('#app').boundingBox();
  const vw = page.viewportSize()?.width ?? 0;
  expect(box?.width ?? 999).toBeLessThanOrEqual(480);
  expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - vw / 2)).toBeLessThanOrEqual(2);
});

test('R-82 marques du mémo et cartes retournées affichées', async ({ page }) => {
  const round = roundForSeed(SEED);
  const [a, b, c] = idsWhere(round, (v) => v !== 'S');
  if (a === undefined || b === undefined || c === undefined) throw new Error('plateau inattendu');
  await ouvrir(page, SEED, true);
  await page.evaluate(
    ([x, y, z]) => {
      window.__sb?.mark(x as number, 'S');
      window.__sb?.mark(x as number, 3);
      window.__sb?.mark(y as number, 2);
      window.__sb?.flip(z as number);
    },
    [a, b, c],
  );
  const carteA = page.locator(`[data-id="${a}"]`);
  await expect(carteA.locator('.m-s[data-mark=S]')).toHaveCount(1);
  await expect(carteA.locator('.m-3[data-mark="3"]')).toHaveCount(1);
  await expect(carteA.locator('[data-mark]')).toHaveCount(2);
  await expect(page.locator(`[data-id="${b}"] .m-2[data-mark="2"]`)).toHaveCount(1);
  const carteC = page.locator(`[data-id="${c}"]`);
  await expect(carteC).toHaveAttribute('data-state', 'shown');
  await expect(carteC).toHaveAttribute('data-value', String(round.board.cells[c]));
});

test('UI-14 Sardine retournée : tête de chien', async ({ page }) => {
  const round = roundForSeed(SEED);
  const [s] = idsWhere(round, (v) => v === 'S');
  if (s === undefined) throw new Error('aucune Sardine');
  await ouvrir(page, SEED, true);
  await page.evaluate((id) => window.__sb?.flip(id), s);
  await expect(page.locator(`[data-id="${s}"] use[href="#chien"]`)).toHaveCount(1);
});

test('debug absent sans ?debug=1', async ({ page }) => {
  await ouvrir(page, SEED);
  expect(await page.evaluate(() => window.__sb)).toBeUndefined();
});
