import { test } from '@playwright/test';
import { attendre, idsWhere, ouvrir, roundForSeed, toucher } from './aide';

const SEED = 42;
const chemin = (profil: string, fichier: string) => `test-results/screens/${profil}/${fichier}`;

test('@screens plateau neuf', async ({ page }, testInfo) => {
  await ouvrir(page, SEED);
  await page.screenshot({ path: chemin(testInfo.project.name, '02-plateau-neuf.png') });
});

test('@screens en cours et défaite', async ({ page }, testInfo) => {
  const round = roundForSeed(SEED);
  const nombres = idsWhere(round, (v) => v !== 'S');
  const aRetourner = nombres.slice(0, 5);
  const aMarquer = nombres.slice(5, 9);
  if (aMarquer.length < 4) throw new Error('plateau inattendu');
  await ouvrir(page, SEED, true);
  await page.evaluate(
    ([flips, marks]) => {
      for (const id of flips as number[]) window.__sb?.flip(id);
      const [m0, m1, m2, m3] = marks as number[];
      for (const k of ['S', 1, 2, 3] as const) window.__sb?.mark(m0 as number, k);
      window.__sb?.mark(m1 as number, 'S');
      window.__sb?.mark(m2 as number, 2);
      window.__sb?.mark(m2 as number, 3);
      window.__sb?.mark(m3 as number, 1);
    },
    [aRetourner, aMarquer],
  );
  await page.screenshot({ path: chemin(testInfo.project.name, '03-en-cours.png') });
});

test('@screens gain affiché', async ({ page }, testInfo) => {
  const round = roundForSeed(SEED);
  const ids = idsWhere(round, (v) => v === 2 || v === 3).slice(0, 2);
  const [un] = idsWhere(round, (v) => v === 1);
  if (un === undefined) throw new Error('plateau inattendu');
  await ouvrir(page, SEED, true);
  for (const id of [un, ...ids]) {
    await toucher(page, id);
    await attendre(page, 'playing');
  }
  await page.screenshot({ path: chemin(testInfo.project.name, '04-gain.png') });
});

test('@screens défaite et révélation', async ({ page }, testInfo) => {
  const round = roundForSeed(SEED);
  const [un] = idsWhere(round, (v) => v === 1);
  const [sardine] = idsWhere(round, (v) => v === 'S');
  if (un === undefined || sardine === undefined) throw new Error('plateau inattendu');
  await ouvrir(page, SEED, true);
  await toucher(page, un);
  await attendre(page, 'playing');
  await toucher(page, sardine);
  await page.waitForTimeout(550);
  await page.screenshot({ path: chemin(testInfo.project.name, '05-sardine.png') });
  await attendre(page, 'waitingTap');
  await page.screenshot({ path: chemin(testInfo.project.name, '07-defaite-revelation.png') });
});

test('@screens victoire et niveau', async ({ page }, testInfo) => {
  const multis = idsWhere(roundForSeed(SEED), (v) => v === 2 || v === 3);
  await ouvrir(page, SEED, true);
  for (const id of multis) {
    await toucher(page, id);
    if (id !== multis[multis.length - 1]) await attendre(page, 'playing');
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: chemin(testInfo.project.name, '06-victoire.png') });
  await attendre(page, 'waitingTap');
  await page.screenshot({ path: chemin(testInfo.project.name, '06b-victoire-revelation.png') });
  await page.locator('.message').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: chemin(testInfo.project.name, '08-niveau.png') });
});
