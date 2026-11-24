import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const version = (
  JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
    version: string;
  }
).version;

interface Manifeste {
  name: string;
  short_name: string;
  display: string;
  start_url: string;
  scope: string;
  icons: { src: string; sizes: string; type: string; purpose?: string }[];
}

test('§15-6 manifeste valide', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  expect(href).toBeTruthy();
  const url = new URL(href as string, page.url()).toString();
  const reponse = await request.get(url);
  expect(reponse.status()).toBe(200);
  const m = (await reponse.json()) as Manifeste;
  expect(m.name).toBe('Sardinebagarre');
  expect(m.short_name).toBe('Sardinebagarre');
  expect(m.display).toBe('standalone');
  expect(new URL(m.start_url, url).pathname).toMatch(/^\/sardinebagarre\//);
  expect(new URL(m.scope, url).pathname).toMatch(/^\/sardinebagarre\//);
  expect(m.icons.some((i) => i.sizes === '512x512' && (i.purpose ?? 'any') === 'any')).toBe(true);
  expect(m.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  for (const icone of m.icons) {
    const r = await request.get(new URL(icone.src, url).toString());
    expect(r.status(), icone.src).toBe(200);
    expect(r.headers()['content-type']).toContain('image/png');
  }
});

test('§15-6 icône Apple 180 px', async ({ page }) => {
  await page.goto('./');
  const href = await page.locator('link[rel=apple-touch-icon]').getAttribute('href');
  expect(href).toBeTruthy();
  const r = await page.request.get(new URL(href as string, page.url()).toString());
  expect(r.status()).toBe(200);
  const png = await r.body();
  expect(png.readUInt32BE(16)).toBe(180);
  expect(png.readUInt32BE(20)).toBe(180);
});

test('R-104 le service worker est enregistré et contrôle la page', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.locator('.menu').waitFor();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
});

test('ADR-001 hors ligne : le jeu se lance et se joue', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.locator('.menu').waitFor();
  await context.setOffline(true);
  await page.reload();
  await page.locator('.menu').waitFor();
  await page.locator('[data-action=play]').click();
  await expect(page.locator('.board .card')).toHaveCount(25);
  await page.locator('#app:not([data-verrou])').waitFor({ state: 'attached' });
  await page.locator('.card[data-id="12"]').click();
  await expect(page.locator('.card[data-id="12"]')).toHaveAttribute('data-state', 'shown');
});

test('R-100 hors ligne : la sauvegarde reste lue', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.locator('.menu').waitFor();
  await page.evaluate(
    ([k, v]) => localStorage.setItem(k as string, v as string),
    ['sardinebagarre:save', JSON.stringify({ version: 1, coins: 1234, level: 4 })],
  );
  await page.reload();
  await page.locator('.menu').waitFor();
  const avant = await page.locator('.menu-stats').textContent();
  expect(avant).toContain('01234');
  await context.setOffline(true);
  await page.reload();
  await page.locator('.menu').waitFor();
  expect(await page.locator('.menu-stats').textContent()).toBe(avant);
});

test('UI-04 version affichée dans Réglages', async ({ page }) => {
  await page.goto('./');
  await page.locator('.menu').waitFor();
  await page.locator('[data-action=settings]').click();
  await expect(page.locator('.ecran')).toContainText(`Version ${version}`);
});

test('ADR-001 Réglages affiche le diagnostic hors ligne actif', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.locator('.menu').waitFor();
  await page.locator('[data-action=settings]').click();
  await expect(page.locator('.ecran-diagnostic')).toContainText('Hors ligne : actif');
  await expect(page.locator('.ecran-diagnostic')).toContainText('navigateur');
});

test('R-129 non-indexation conservée', async ({ page, request }) => {
  await page.goto('./');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
  const robots = await request.get(new URL('robots.txt', page.url()).toString());
  expect(await robots.text()).toContain('Disallow: /');
});
