import { expect, test } from '@playwright/test';

test("la page d'accueil a pour titre Sardinebagarre et affiche le plateau", async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Sardinebagarre');
  await expect(page.locator('#app .board')).toBeVisible();
});
