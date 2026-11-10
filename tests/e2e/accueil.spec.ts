import { expect, test } from '@playwright/test';

test("la page d'accueil a pour titre Sardinebagarre", async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Sardinebagarre');
  await expect(page.locator('h1')).toBeVisible();
});
