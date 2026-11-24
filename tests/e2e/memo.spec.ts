import { expect, type Page, test } from '@playwright/test';
import {
  attendre,
  basculerMemo,
  idsWhere,
  memoState,
  ouvrir,
  repondre,
  roundForSeed,
  toucher,
} from './aide';

const SEED = 42;
const MARQUES = ['S', '1', '2', '3'] as const;
const marque = (page: Page, m: (typeof MARQUES)[number]) => page.locator(`[data-action=mark-${m}]`);
const etat = (page: Page) => page.evaluate(() => window.__sb?.state());

function ids() {
  const round = roundForSeed(SEED);
  const surs = idsWhere(round, (v) => v !== 'S' && v !== 1);
  const [un] = idsWhere(round, (v) => v === 1);
  const [sardine] = idsWhere(round, (v) => v === 'S');
  const [a, b] = surs;
  if (un === undefined || sardine === undefined || a === undefined || b === undefined)
    throw new Error('plateau');
  return { un, sardine, a, b };
}

test('R-81 Mémo ouvre le panneau, Fermer le referme', async ({ page }) => {
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  for (const m of MARQUES) await expect(marque(page, m)).toBeVisible();
  await expect(page.locator('[data-action=memo]')).toHaveText('Fermer');
  expect((await memoState(page))?.open).toBe(true);
  await basculerMemo(page);
  await expect(marque(page, 'S')).toHaveCount(0);
  await expect(page.locator('[data-action=memo]')).toHaveText('Mémo');
  expect((await memoState(page))?.open).toBe(false);
});

test('R-81 en mode mémo, toucher une carte la sélectionne sans la retourner', async ({ page }) => {
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, 0);
  const s = await etat(page);
  expect(s?.flipped[0]).toBe(false);
  expect(s?.cardsFlipped).toBe(0);
  await expect(page.locator('[data-id="0"]')).toHaveAttribute('aria-current', 'true');
  expect((await memoState(page))?.selected).toBe(0);
  expect(await page.evaluate(() => window.__sb?.phase())).toBe('playing');
});

test('R-80 R-82 poser puis retirer une marque', async ({ page }) => {
  const { a } = ids();
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, a);
  await marque(page, '2').click();
  await expect(page.locator(`[data-id="${a}"] .m-2.on`)).toBeVisible();
  await expect(marque(page, '2')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(`[data-id="${a}"]`)).toHaveAttribute('aria-current', 'true');
  await marque(page, '2').click();
  await expect(page.locator(`[data-id="${a}"] .m.on`)).toHaveCount(0);
  await expect(marque(page, '2')).toHaveAttribute('aria-pressed', 'false');
});

test('R-80 les 4 marques se combinent', async ({ page }) => {
  const { a } = ids();
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, a);
  for (const m of MARQUES) await marque(page, m).click();
  await expect(page.locator(`[data-id="${a}"] .m.on`)).toHaveCount(4);
  expect((await etat(page))?.memos[a]).toBe(15);
});

test('R-81 sans sélection, une marque ne fait rien', async ({ page }) => {
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  for (const m of MARQUES) await expect(marque(page, m)).toHaveAttribute('aria-disabled', 'true');
  await marque(page, '1').click({ force: true }); // aria-disabled : Playwright refuse sinon
  expect((await etat(page))?.memos.every((x) => x === 0)).toBe(true);
});

test('R-81 refus sur une carte retournée', async ({ page }) => {
  const { un, a } = ids();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, un);
  await attendre(page, 'playing');
  await basculerMemo(page);
  await toucher(page, a);
  await toucher(page, un);
  await expect(page.locator(`[data-id="${un}"]`)).toHaveClass(/refus/);
  expect((await memoState(page))?.selected).toBe(a);
  await marque(page, '3').click();
  const memos = (await etat(page))?.memos ?? [];
  expect(memos[a]).toBe(8);
  expect(memos.reduce((s, x) => s + x, 0)).toBe(8);
});

test('R-82 les marques restent visibles mémo fermé', async ({ page }) => {
  const { a } = ids();
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, a);
  await marque(page, 'S').click();
  await basculerMemo(page);
  await expect(page.locator(`[data-id="${a}"] .m-s.on`)).toBeVisible();
});

test('R-83 R-31 retourner une carte efface ses marques', async ({ page }) => {
  const { un } = ids();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, un);
  await marque(page, '2').click();
  await basculerMemo(page);
  await toucher(page, un);
  await attendre(page, 'playing');
  expect((await etat(page))?.memos[un]).toBe(0);
  await expect(page.locator(`[data-id="${un}"][data-state=shown]`)).toBeVisible();
  await expect(page.locator(`[data-id="${un}"] .m.on`)).toHaveCount(0);
});

test('R-83 une nouvelle partie part sans marques et mémo fermé', async ({ page }) => {
  const { un, sardine } = ids();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, un);
  await marque(page, '1').click();
  await basculerMemo(page);
  await toucher(page, sardine);
  await attendre(page, 'waitingTap');
  await page.locator('.message').click();
  await attendre(page, 'dialog');
  await repondre(page, 'yes');
  await attendre(page, 'playing');
  expect((await etat(page))?.memos.every((x) => x === 0)).toBe(true);
  expect(await memoState(page)).toEqual({ open: false, selected: null });
  await expect(page.locator('.m.on')).toHaveCount(0);
});

test('R-81 R-41 Quitter accessible en mode mémo, Non garde le mémo ouvert', async ({ page }) => {
  const { a } = ids();
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, a);
  await marque(page, '2').click();
  await page.locator('[data-action=quit]').click();
  await repondre(page, 'no');
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  await expect(marque(page, '2')).toBeVisible();
  expect(await memoState(page)).toEqual({ open: true, selected: a });
  expect((await etat(page))?.memos[a]).toBe(4);
});

test('R-81 R-42 Quitter puis Oui en mode mémo ferme le mémo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await page.locator('[data-action=quit]').click();
  await repondre(page, 'yes');
  expect((await memoState(page))?.open).toBe(false);
  await expect(page.locator('[data-action=memo]')).toHaveText('Mémo');
  await expect(page.locator('[data-action=quit]')).toHaveText('Quitter');
  await expect(marque(page, 'S')).toHaveCount(0);
});

test('R-84 le mémo ne change rien aux règles', async ({ page }) => {
  const { un } = ids();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, un);
  await marque(page, 'S').click();
  await basculerMemo(page);
  await toucher(page, un);
  await attendre(page, 'playing');
  const s = await etat(page);
  expect(s?.payout).toBe(1);
  expect(s?.cardsFlipped).toBe(1);
  expect(s?.status).toBe('PLAYING');
});

test('CL-20 Mémo en waitingTap continue', async ({ page }) => {
  const { sardine } = ids();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, sardine);
  await attendre(page, 'waitingTap');
  await page.locator('[data-action=memo]').click();
  await attendre(page, 'dialog');
  expect(await page.evaluate(() => window.__sb?.dialog())).toBe('play');
  expect((await memoState(page))?.open).toBe(false);
});

test('Anti-rebond double toucher sur Mémo', async ({ page }) => {
  await ouvrir(page, SEED, true);
  await page.locator('[data-action=memo]').dblclick();
  await page.waitForTimeout(600);
  expect((await memoState(page))?.open).toBe(true);
  const s = await etat(page);
  expect(s?.flipped.some(Boolean)).toBe(false);
  expect(s?.memos.every((x) => x === 0)).toBe(true);
});

test('UI-20 libellé accessible des marques', async ({ page }) => {
  const { a } = ids();
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, a);
  await marque(page, 'S').click();
  await marque(page, '2').click();
  const label = (await page.locator(`[data-id="${a}"]`).getAttribute('aria-label')) ?? '';
  expect(label).toContain('Sardine');
  expect(label).toContain('2');
});

test('Anti-rebond double toucher sur Fermer', async ({ page }) => {
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await page.locator('[data-action=memo]').dblclick();
  await page.waitForTimeout(600);
  expect((await memoState(page))?.open).toBe(false);
  const s = await etat(page);
  expect(s?.flipped.some(Boolean)).toBe(false);
  expect(s?.memos.every((x) => x === 0)).toBe(true);
});

test('Décision 2 sélection et curseur conservés après Fermer puis Mémo', async ({ page }) => {
  const { a } = ids();
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, a);
  await marque(page, '2').click();
  await basculerMemo(page);
  await expect(page.locator('[aria-current=true]')).toHaveCount(0);
  await basculerMemo(page);
  await expect(page.locator(`[data-id="${a}"]`)).toHaveAttribute('aria-current', 'true');
  expect((await memoState(page))?.selected).toBe(a);
  await expect(marque(page, '2')).toHaveAttribute('aria-pressed', 'true');
  await expect(marque(page, '3')).toHaveAttribute('aria-pressed', 'false');
});

test('Décision 2 la sélection disparaît quand la carte est retournée', async ({ page }) => {
  const { un } = ids();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await basculerMemo(page);
  await toucher(page, un);
  await basculerMemo(page);
  await toucher(page, un);
  await attendre(page, 'playing');
  await basculerMemo(page);
  expect((await memoState(page))?.selected).toBeNull();
  await expect(page.locator('[aria-current=true]')).toHaveCount(0);
  for (const m of MARQUES) await expect(marque(page, m)).toHaveAttribute('aria-disabled', 'true');
});
