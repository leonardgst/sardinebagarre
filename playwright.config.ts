import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 5173);
const base = `http://localhost:${port}/sardinebagarre/`;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results/playwright',
  reporter: process.env.CI ? [['dot'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: base },
  projects: [
    { name: 'iphone-se', use: { ...devices['iPhone SE (3rd gen)'] } },
    { name: 'iphone-15', use: { ...devices['iPhone 15'] } },
    { name: 'iphone-15-pro-max', use: { ...devices['iPhone 15 Pro Max'] } },
    { name: 'iphone-15-paysage', use: { ...devices['iPhone 15 landscape'] } },
    { name: 'mac', use: { browserName: 'webkit', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: base,
    reuseExistingServer: !process.env.CI,
  },
});
