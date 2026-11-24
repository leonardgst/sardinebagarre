import { expect, type Page, test } from '@playwright/test';
import { initialGame } from '../../src/logic/game';
import { formatCoins } from '../../src/ui/format';
import { SAVE_KEY } from '../../src/ui/storage';
import { messages, wonPayoutMessage } from '../../src/ui/texts.fr';
import {
  attendre,
  idsWhere,
  lireSauvegarde,
  ouvrir,
  ouvrirAvecSauvegarde,
  ouvrirMenu,
  repondre,
  roundForSeed,
  sauvegardeTexte,
  surveillerErreurs,
  toucher,
} from './aide';

const SEED = 42;
const sardineDe = (game = initialGame()) => {
  const [id] = idsWhere(roundForSeed(SEED, game), (v) => v === 'S');
  if (id === undefined) throw new Error('plateau');
  return id;
};
const multisDe = (game = initialGame()) =>
  idsWhere(roundForSeed(SEED, game), (v) => v === 2 || v === 3);

async function verifierMenu(page: Page, niveau: number, total: number): Promise<void> {
  await expect(page.locator('.menu-niveau')).toHaveText(`Niveau ${niveau}`);
  await expect(page.locator('.menu-total strong')).toHaveText(formatCoins(total));
}

async function lancer(page: Page): Promise<void> {
  await page.locator('[data-action=play]').click();
  await page.locator('.board').waitFor();
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
}

/** Retourne toutes les cartes 2 et 3 (victoire automatique). */
async function toutRetourner(page: Page, game = initialGame()): Promise<void> {
  const multis = multisDe(game);
  for (const id of multis) {
    await toucher(page, id);
    if (id !== multis[multis.length - 1]) await attendre(page, 'playing');
  }
}

test('R-100 premier lancement : aucune sauvegarde, menu niveau 1, total 0', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrirMenu(page, SEED, true);
  await verifierMenu(page, 1, 0);
  expect(await lireSauvegarde(page)).toBeNull();
  expect(erreurs).toEqual([]);
});

test("R-55 R-100 une défaite est sauvegardée avant l'animation", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrir(page, SEED, true);
  await toucher(page, sardineDe());
  await page.waitForFunction(() => window.__sb?.phase() === 'ending');
  const save = await lireSauvegarde(page);
  expect(save?.history).toEqual([{ outcome: 'LOST', cardsFlipped: 0, level: 1 }]);
  expect(save?.level).toBe(1);
  expect(save?.coins).toBe(0);
  expect(save?.stats).toMatchObject({ played: 1, lost: 1, won: 0, quit: 0 });
  expect(erreurs).toEqual([]);
});

test('R-55 CL-23 recharger pendant la révélation ne perd rien', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrir(page, SEED, true);
  await toutRetourner(page);
  await page.waitForFunction(() => window.__sb?.phase() === 'ending');
  const coins = (await page.evaluate(() => window.__sb?.game()))?.coins ?? -1;
  expect(coins).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__sb?.phase())).toBe('ending');
  await page.reload();
  await page.locator('.menu').waitFor();
  await verifierMenu(page, 2, coins);
  const save = await lireSauvegarde(page);
  expect(save?.history).toMatchObject([{ outcome: 'WON', level: 1 }]);
  expect(save?.history).toHaveLength(1);
  expect(save?.stats).toMatchObject({ won: 1 });
  expect(erreurs).toEqual([]);
});

test('R-42 R-100 un abandon est sauvegardé', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  const round = roundForSeed(SEED);
  const [un] = idsWhere(round, (v) => v === 1);
  const [multi] = multisDe();
  if (un === undefined || multi === undefined) throw new Error('plateau');
  const gain = Number(round.board.cells[multi]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrir(page, SEED, true);
  await toucher(page, un);
  await attendre(page, 'playing');
  await toucher(page, multi);
  await attendre(page, 'playing');
  await page.locator('[data-action=quit]').click();
  await repondre(page, 'yes');
  const save = await lireSauvegarde(page);
  expect(save?.coins).toBe(gain);
  expect(save?.history).toMatchObject([{ outcome: 'QUIT' }]);
  expect(erreurs).toEqual([]);
});

test('CL-18 R-68 recharger en pleine partie : partie oubliée', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  const history = [
    { outcome: 'WON', cardsFlipped: 6, level: 4 },
    { outcome: 'LOST', cardsFlipped: 3, level: 5 },
  ] as const;
  const game = { ...initialGame(), level: 5 as const, coins: 100, history };
  const texte = sauvegardeTexte(game);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrirAvecSauvegarde(page, SEED, texte);
  await verifierMenu(page, 5, 100);
  await lancer(page);
  const [multi] = multisDe(game);
  if (multi === undefined) throw new Error('plateau');
  await toucher(page, multi);
  await attendre(page, 'playing');
  expect((await page.evaluate(() => window.__sb?.state()))?.payout).toBeGreaterThan(0);
  await page.reload();
  await page.locator('.menu').waitFor();
  await verifierMenu(page, 5, 100);
  expect(await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY)).toBe(texte);
  await lancer(page);
  await expect(page.locator('.niveau strong')).toHaveText('5');
  expect(await page.evaluate(() => window.__sb?.state().board)).toEqual(
    roundForSeed(SEED, game).board,
  );
  expect(erreurs).toEqual([]);
});

test('R-67 R-100 Quitter la table est sauvegardé', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrirAvecSauvegarde(page, SEED, sauvegardeTexte({ level: 4, coins: 250 }));
  await verifierMenu(page, 4, 250);
  await page.locator('[data-action=leave-table]').click();
  await repondre(page, 'yes');
  await verifierMenu(page, 1, 250);
  await page.reload();
  await page.locator('.menu').waitFor();
  await verifierMenu(page, 1, 250);
  expect(erreurs).toEqual([]);
});

test('R-101 les champs hors jeu sont conservés', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrirAvecSauvegarde(
    page,
    SEED,
    sauvegardeTexte(
      {},
      { settings: { sound: false, reducedMotion: null }, welcomeSeen: true, packCode: 'abc' },
    ),
  );
  await lancer(page);
  await toucher(page, sardineDe());
  await page.waitForFunction(() => window.__sb?.phase() === 'ending');
  const save = await lireSauvegarde(page);
  expect(save?.settings).toEqual({ sound: false, reducedMotion: null });
  expect(save?.welcomeSeen).toBe(true);
  expect(save?.packCode).toBe('abc');
  expect(save?.history).toHaveLength(1);
  expect(erreurs).toEqual([]);
});

test('CL-22 sauvegarde corrompue : pas de plantage', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrirAvecSauvegarde(page, SEED, '{pas du json');
  await verifierMenu(page, 1, 0);
  await lancer(page);
  expect(erreurs).toEqual([]);
});

test('CL-22 version inconnue : on garde le total', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrirAvecSauvegarde(page, SEED, '{"version":99,"coins":1234}');
  await verifierMenu(page, 1, 1234);
  expect(erreurs).toEqual([]);
});

test('CL-22 R-102 champ invalide isolé', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  const valide = JSON.parse(sauvegardeTexte({ coins: 300 })) as Record<string, unknown>;
  await ouvrirAvecSauvegarde(page, SEED, JSON.stringify({ ...valide, level: 12 }));
  await verifierMenu(page, 1, 300);
  expect(erreurs).toEqual([]);
});

test('CL-22 stockage indisponible : le jeu tourne', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.addInitScript(() => {
    const refuser = () => {
      throw new DOMException('stockage bloqué', 'SecurityError');
    };
    Storage.prototype.getItem = refuser;
    Storage.prototype.setItem = refuser;
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrirMenu(page, SEED, true);
  await verifierMenu(page, 1, 0);
  await lancer(page);
  await toucher(page, sardineDe());
  await attendre(page, 'waitingTap');
  await page.locator('.message').click();
  await attendre(page, 'dialog');
  await expect(page.locator('[role=dialog] p')).toHaveText('Jouer au niveau 1 ?');
  expect(erreurs).toEqual([]);
});

test('R-53 boîte pleine au lancement', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrirAvecSauvegarde(page, SEED, sauvegardeTexte({ level: 3, coins: 50_000 }));
  await verifierMenu(page, 3, 50_000);
  await expect(page.locator('.menu-message')).toHaveText(messages.boxFull);
  await page.locator('[data-action=play]').click();
  await expect(page.locator('.board')).toHaveCount(0);
  await expect(page.locator('.menu-message')).toHaveText(messages.boxFull);
  expect(erreurs).toEqual([]);
});

test('R-51 C3 total plafonné : 49 990 + gain ≥ 10 → « Tu remportes 10 jetons ! »', async ({
  page,
}) => {
  const erreurs = surveillerErreurs(page);
  const game = { ...initialGame(), coins: 49_990 };
  await ouvrirAvecSauvegarde(page, SEED, sauvegardeTexte(game));
  await lancer(page);
  await toutRetourner(page, game);
  await expect(page.locator('.message')).toHaveText(wonPayoutMessage(10), { timeout: 10_000 });
  await attendre(page, 'waitingTap');
  await expect(page.locator('.total strong')).toHaveText(formatCoins(50_000));
  expect((await lireSauvegarde(page))?.coins).toBe(50_000);
  expect(erreurs).toEqual([]);
});
