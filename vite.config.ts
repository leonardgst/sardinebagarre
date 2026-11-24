import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(join(import.meta.dirname, 'package.json'), 'utf8')) as {
  version: string;
};

const BASE = '/sardinebagarre/';

export default defineConfig(({ mode }) => ({
  base: BASE,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    ...(mode === 'https' ? [basicSsl()] : []),
    VitePWA({
      // R-104 : la mise à jour est appliquée par `src/ui/pwa.ts`, jamais pendant une partie.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Sardinebagarre',
        short_name: 'Sardinebagarre',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#6b2a2d',
        background_color: '#2c0f11',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,bin}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: `${BASE}index.html`,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
