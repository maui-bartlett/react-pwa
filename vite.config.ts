import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { ManifestOptions } from 'vite-plugin-pwa';

import manifest from './manifest.json';

// https://vite.dev/config/
export default defineConfig({
  define: {
    __PWA_VERSION__: JSON.stringify(manifest.pwa_version),
  },
  plugins: [
    react(),
    VitePWA({
      manifest: manifest as Partial<ManifestOptions>,
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      // switch to "true" to enable sw on development
      devOptions: { enabled: false },
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html}', '**/*.{svg,png,jpg,gif}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
