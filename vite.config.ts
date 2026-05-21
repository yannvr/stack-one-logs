import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update mode: the SW silently fetches new versions, takes effect
      // on next reload. No user-facing "update available" prompt — overkill
      // for a single-page tool.
      registerType: 'autoUpdate',
      // Bypass the SW in dev so HMR isn't shadowed by cached responses.
      devOptions: { enabled: false },
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'StackOne Logs',
        short_name: 'Logs',
        description:
          'Request Logs investigator for StackOne — find and fix integration failures fast.',
        start_url: '/logs',
        scope: '/',
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#00AF66',
        categories: ['developer', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the static app shell (JS / CSS / HTML / fonts manifest).
        // Mock data fetches are NetworkOnly so refreshes regenerate Faker
        // output as expected — caching them would surface stale records.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/logs',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5173, host: true },
});
