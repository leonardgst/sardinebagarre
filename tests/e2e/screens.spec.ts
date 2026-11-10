import { expect, test } from '@playwright/test';

// Provisoire : refait à l'étape 2.2.
test('@screens page minimale', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('h1')).toBeVisible();
  await page.screenshot({
    path: `test-results/screens/${testInfo.project.name}/00-page-minimale.png`,
  });
});
