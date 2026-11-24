import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 5173);
const base = `http://localhost:${port}/sardinebagarre/`;
// Projet `pwa` : version de production servie par `vite preview` (service worker réel).
const previewPort = Number(process.env.E2E_PREVIEW_PORT ?? 4173);
const previewBase = `http://localhost:${previewPort}/sardinebagarre/`;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results/playwright',
  reporter: process.env.CI ? [['dot'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: base },
  projects: [
    { name: 'iphone-se', use: { ...devices['iPhone SE (3rd gen)'] }, testIgnore: 'pwa.spec.ts' },
    { name: 'iphone-15', use: { ...devices['iPhone 15'] }, testIgnore: 'pwa.spec.ts' },
    {
      name: 'iphone-15-pro-max',
      use: { ...devices['iPhone 15 Pro Max'] },
      testIgnore: 'pwa.spec.ts',
    },
    {
      name: 'iphone-15-paysage',
      use: { ...devices['iPhone 15 landscape'] },
      testIgnore: 'pwa.spec.ts',
    },
    {
      name: 'mac',
      use: { browserName: 'webkit', viewport: { width: 1280, height: 800 } },
      testIgnore: 'pwa.spec.ts',
    },
    {
      name: 'pwa',
      use: { ...devices['iPhone 15'], baseURL: previewBase },
      testMatch: 'pwa.spec.ts',
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${port} --strictPort`,
      url: base,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx vite build && npx vite preview --port ${previewPort} --strictPort`,
      url: previewBase,
      // Jamais de réutilisation : 4173 est aussi le port de `npm run preview` (ancien build possible).
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
