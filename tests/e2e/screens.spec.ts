import { test } from '@playwright/test';
import {
  attendre,
  basculerMemo,
  CODE_TEST,
  idsWhere,
  ouvrir,
  ouvrirMenu,
  ouvrirReglages,
  roundForSeed,
  servirPack,
  toucher,
} from './aide';

const SEED = 42;
const chemin = (profil: string, fichier: string) => `test-results/screens/${profil}/${fichier}`;

test('@screens menu', async ({ page }, testInfo) => {
  await ouvrirMenu(page, SEED);
  await page.screenshot({ path: chemin(testInfo.project.name, '01-menu.png') });
});

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

test('@screens dialogue Quitter', async ({ page }, testInfo) => {
  const ids = idsWhere(roundForSeed(SEED), (v) => v === 2 || v === 3).slice(0, 1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  for (const id of ids) {
    await toucher(page, id);
    await attendre(page, 'playing');
  }
  await page.locator('[data-action=quit]').click();
  await page.screenshot({ path: chemin(testInfo.project.name, '08-dialogue-quitter.png') });
});

test('@screens mémo ouvert', async ({ page }, testInfo) => {
  const round = roundForSeed(SEED);
  const [a, b] = idsWhere(round, (v) => v !== 'S');
  if (a === undefined || b === undefined) throw new Error('plateau inattendu');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await page.evaluate((id) => {
    for (const k of ['S', 1, 2, 3] as const) window.__sb?.mark(id, k);
  }, b);
  await basculerMemo(page);
  await toucher(page, a);
  await page.locator('[data-action=mark-2]').click();
  await page.locator('[data-action=mark-S]').click();
  await page.screenshot({ path: chemin(testInfo.project.name, '10-memo.png') });
});

test('@screens question Jouer au niveau', async ({ page }, testInfo) => {
  const multis = idsWhere(roundForSeed(SEED), (v) => v === 2 || v === 3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  for (const id of multis) {
    await toucher(page, id);
    if (id !== multis[multis.length - 1]) await attendre(page, 'playing');
  }
  await attendre(page, 'waitingTap');
  await page.locator('.message').click();
  await attendre(page, 'dialog');
  await page.screenshot({ path: chemin(testInfo.project.name, '09-jouer-niveau.png') });
});

test('@screens réglages', async ({ page }, testInfo) => {
  await ouvrirMenu(page, SEED);
  await page.locator('[data-action=settings]').click();
  await page.locator('.ecran').waitFor();
  await page.screenshot({ path: chemin(testInfo.project.name, '11-reglages.png') });
});

test('@screens réglages : code erroné puis accepté', async ({ page }, testInfo) => {
  await servirPack(page);
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  await page.locator('.code-champ').fill('faux-faux-faux-faux');
  await page.screenshot({ path: chemin(testInfo.project.name, '11b-reglages-saisie.png') });
  await page.locator('[data-action=submit-code]').click();
  await page.locator('.code-etat', { hasText: 'ne marche pas' }).waitFor();
  await page.screenshot({ path: chemin(testInfo.project.name, '11c-reglages-erreur.png') });
  await page.locator('.code-champ').fill(CODE_TEST);
  await page.locator('[data-action=submit-code]').click();
  await page.locator('[data-action=change-code]').waitFor();
  await page.screenshot({ path: chemin(testInfo.project.name, '11d-reglages-accepte.png') });
});

test('@screens carte Sardine avec la photo du pack', async ({ page }, testInfo) => {
  const [sardine] = idsWhere(roundForSeed(SEED), (v) => v === 'S');
  if (sardine === undefined) throw new Error('plateau inattendu');
  await servirPack(page);
  await ouvrirMenu(page, SEED, true);
  await ouvrirReglages(page);
  await page.locator('.code-champ').fill(CODE_TEST);
  await page.locator('[data-action=submit-code]').click();
  await page.locator('[data-action=change-code]').waitFor();
  await page.locator('[data-action=back]').click();
  await page.locator('[data-action=play]').click();
  await page.locator('.board').waitFor();
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
  await toucher(page, sardine);
  await page.locator('.card.sardine img.tete-photo').waitFor();
  await attendre(page, 'waitingTap');
  await page.screenshot({ path: chemin(testInfo.project.name, '12-sardine-photo.png') });
});
