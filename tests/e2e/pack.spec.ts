import { expect, type Page, test } from '@playwright/test';
import { initialGame } from '../../src/logic/game';
import type { RoundRecord } from '../../src/logic/types';
import { packTexts } from '../../src/ui/texts.fr';
import {
  CODE_TEST,
  idsWhere,
  lireSauvegarde,
  ouvrir,
  ouvrirAvecSauvegarde,
  ouvrirMenu,
  ouvrirReglages,
  roundForSeed,
  sauvegardeTexte,
  servirPack,
  surveillerErreurs,
  toucher,
} from './aide';

const SEED = 42;
const WELCOME = 'Bienvenue dans le pack de test.';
const sardineDe = () => {
  const [id] = idsWhere(roundForSeed(SEED, initialGame()), (v) => v === 'S');
  if (id === undefined) throw new Error('plateau');
  return id;
};

async function saisir(page: Page, code: string): Promise<void> {
  await page.locator('.code-champ').fill(code);
  await page.locator('[data-action=submit-code]').click();
}

test('R-124 code accepté dans Réglages', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await servirPack(page);
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  await saisir(page, 'Test Test Test Test');
  const section = page.locator('.code-secret');
  await expect(section).toContainText(packTexts.accepted);
  await expect(section).toContainText(WELCOME);
  await expect(page.locator('.code-champ')).toHaveCount(0);
  expect((await lireSauvegarde(page))?.packCode).toBe(CODE_TEST);
  // Changer le code réaffiche le champ, vide.
  await page.locator('[data-action=change-code]').click();
  await expect(page.locator('.code-champ')).toHaveValue('');
  expect(erreurs).toEqual([]);
});

test('R-124 le champ du code : attributs et taille pour iOS', async ({ page }) => {
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  const champ = page.locator('.code-champ');
  await expect(champ).toHaveAttribute('autocapitalize', 'off');
  await expect(champ).toHaveAttribute('autocomplete', 'off');
  await expect(champ).toHaveAttribute('autocorrect', 'off');
  await expect(champ).toHaveAttribute('spellcheck', 'false');
  await expect(champ).toHaveAttribute('enterkeyhint', 'done');
  const taille = await champ.evaluate((e) => Number.parseFloat(getComputedStyle(e).fontSize));
  expect(taille).toBeGreaterThanOrEqual(16);
});

test('R-124 la touche Entrée valide le code', async ({ page }) => {
  await servirPack(page);
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  await page.locator('.code-champ').fill(CODE_TEST);
  await page.locator('.code-champ').press('Enter');
  await expect(page.locator('.code-secret')).toContainText(packTexts.accepted);
});

test('R-124 mauvais code refusé', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await servirPack(page);
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  await saisir(page, 'faux-faux-faux-faux');
  await expect(page.locator('.code-secret')).toContainText(packTexts.wrong);
  await expect(page.locator('.code-champ')).toHaveValue('');
  expect((await lireSauvegarde(page))?.packCode ?? null).toBeNull();
  expect(erreurs).toEqual([]);
});

test('R-124 code vide : demande de saisir le code', async ({ page }) => {
  const compteur = await servirPack(page);
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  await page.locator('[data-action=submit-code]').click();
  await expect(page.locator('.code-secret')).toContainText(packTexts.empty);
  expect(compteur.count).toBe(0);
});

test('R-126 pack absent : jeu jouable, message indisponible', async ({ page }) => {
  await servirPack(page, '404');
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  await saisir(page, CODE_TEST);
  await expect(page.locator('.code-secret')).toContainText(packTexts.unavailable);
  await page.locator('[data-action=back]').click();
  await page.locator('[data-action=play]').click();
  await expect(page.locator('.board')).toBeVisible();
});

test('R-124 au relancement, pack rechargé avec le code sauvegardé', async ({ page }) => {
  await servirPack(page);
  await ouvrirAvecSauvegarde(page, SEED, sauvegardeTexte({}, { packCode: CODE_TEST }));
  await ouvrirReglages(page);
  await expect(page.locator('.code-secret')).toContainText(packTexts.accepted, {
    timeout: 30_000,
  });
  await page.locator('[data-action=back]').click();
  await page.locator('[data-action=play]').click();
  await page.locator('.board').waitFor();
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
  await toucher(page, sardineDe());
  await expect(page.locator('.card.sardine img.tete-photo[src^="blob:"]')).toBeVisible();
  expect((await lireSauvegarde(page))?.packCode).toBe(CODE_TEST);
});

test('R-124 code sauvegardé devenu faux → oublié, progression conservée', async ({ page }) => {
  await servirPack(page);
  const history: RoundRecord[] = [
    { outcome: 'WON', cardsFlipped: 5, level: 3 },
    { outcome: 'LOST', cardsFlipped: 2, level: 4 },
  ];
  await ouvrirAvecSauvegarde(
    page,
    SEED,
    sauvegardeTexte({ coins: 1234, level: 4, history }, { packCode: 'faux-faux-faux-faux' }),
  );
  await expect
    .poll(async () => (await lireSauvegarde(page))?.packCode ?? null, { timeout: 30_000 })
    .toBeNull();
  const game = await page.evaluate(() => window.__sb?.game());
  expect(game?.coins).toBe(1234);
  expect(game?.level).toBe(4);
  expect(game?.history).toEqual(history);
  const sauvegarde = await lireSauvegarde(page);
  expect(sauvegarde?.coins).toBe(1234);
  expect(sauvegarde?.level).toBe(4);
});

async function accepterPuisChanger(page: Page): Promise<void> {
  await servirPack(page);
  await ouvrirMenu(page, SEED, true);
  await ouvrirReglages(page);
  await saisir(page, CODE_TEST);
  await expect(page.locator('.code-secret')).toContainText(packTexts.accepted);
  await page.locator('[data-action=change-code]').click();
}

async function sardineGardeLaPhoto(page: Page): Promise<void> {
  await page.locator('[data-action=back]').click();
  await page.locator('[data-action=play]').click();
  await page.locator('.board').waitFor();
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
  await toucher(page, sardineDe());
  await expect(page.locator('.card.sardine img.tete-photo[src^="blob:"]')).toBeVisible();
}

test('R-124 changer le code, code faux : message, code et photo conservés', async ({ page }) => {
  await accepterPuisChanger(page);
  await saisir(page, 'faux-faux-faux-faux');
  const section = page.locator('.code-secret');
  await expect(section).toContainText(packTexts.wrong);
  await expect(page.locator('.code-champ')).toBeVisible();
  expect((await lireSauvegarde(page))?.packCode).toBe(CODE_TEST);
  await sardineGardeLaPhoto(page);
});

test('R-124 changer le code, champ vide : message de saisie', async ({ page }) => {
  await accepterPuisChanger(page);
  await page.locator('[data-action=submit-code]').click();
  await expect(page.locator('.code-secret')).toContainText(packTexts.empty);
  expect((await lireSauvegarde(page))?.packCode).toBe(CODE_TEST);
  await sardineGardeLaPhoto(page);
});

test('R-126 code sauvegardé, pack indisponible : code gardé', async ({ page }) => {
  await servirPack(page, '404');
  await ouvrirAvecSauvegarde(page, SEED, sauvegardeTexte({}, { packCode: CODE_TEST }));
  await ouvrirReglages(page);
  await expect(page.locator('.ecran-pack')).toContainText('indisponible');
  expect((await lireSauvegarde(page))?.packCode).toBe(CODE_TEST);
});

test('UI-14 sans pack : tête dessinée', async ({ page }) => {
  await servirPack(page, '404');
  await ouvrir(page, SEED, true);
  await toucher(page, sardineDe());
  const carte = page.locator('.card.sardine');
  await expect(carte.locator('svg.tete')).toBeVisible();
  await expect(carte.locator('img')).toHaveCount(0);
});

test('CL-19 double toucher sur Valider : une seule vérification', async ({ page }) => {
  const compteur = await servirPack(page);
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  await page.locator('.code-champ').fill(CODE_TEST);
  await page.locator('[data-action=submit-code]').dblclick();
  await expect(page.locator('.code-secret')).toContainText(packTexts.accepted);
  expect(compteur.count).toBe(1);
});

test('R-124 écran quitté pendant la vérification : code quand même enregistré', async ({
  page,
}) => {
  const erreurs = surveillerErreurs(page);
  await servirPack(page);
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  await page.locator('.code-champ').fill(CODE_TEST);
  await page.locator('[data-action=submit-code]').click();
  await page.locator('[data-action=back]').click();
  await expect.poll(async () => (await lireSauvegarde(page))?.packCode).toBe(CODE_TEST);
  expect(erreurs).toEqual([]);
});

test('UI-04 la zone annoncée (aria-live) reste le même élément', async ({ page }) => {
  await servirPack(page);
  await ouvrirMenu(page, SEED);
  await ouvrirReglages(page);
  await page.locator('.code-etat').evaluate((e) => {
    e.setAttribute('data-repere', '1');
  });
  await saisir(page, 'faux-faux-faux-faux');
  await expect(page.locator('.code-etat[data-repere="1"]')).toContainText(packTexts.wrong);
  await saisir(page, CODE_TEST);
  await expect(page.locator('.code-etat[data-repere="1"]')).toContainText(packTexts.accepted);
  await expect(page.locator('.code-etat[aria-live="polite"]')).toHaveCount(1);
});
