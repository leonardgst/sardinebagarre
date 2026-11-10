import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: '/sardinebagarre/',
  plugins: mode === 'https' ? [basicSsl()] : [],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
