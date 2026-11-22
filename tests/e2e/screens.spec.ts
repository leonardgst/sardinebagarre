import { test } from '@playwright/test';
import { idsWhere, ouvrir, roundForSeed } from './aide';

const SEED = 42;
const chemin = (profil: string, fichier: string) => `test-results/screens/${profil}/${fichier}`;

test('@screens plateau neuf', async ({ page }, testInfo) => {
  await ouvrir(page, SEED);
  await page.screenshot({ path: chemin(testInfo.project.name, '02-plateau-neuf.png') });
});

test('@screens en cours et défaite', async ({ page }, testInfo) => {
  const round = roundForSeed(SEED);
  const nombres = idsWhere(round, (v) => v !== 'S');
  const [sardine] = idsWhere(round, (v) => v === 'S');
  const aRetourner = nombres.slice(0, 5);
  const aMarquer = nombres.slice(5, 9);
  if (sardine === undefined || aMarquer.length < 4) throw new Error('plateau inattendu');
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
  await page.evaluate((id) => window.__sb?.flip(id), sardine);
  await page.screenshot({ path: chemin(testInfo.project.name, '07-defaite-revelation.png') });
});
