import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Backend-poort (companion). Moet matchen met server/.env PORT.
const API = 'http://127.0.0.1:4317';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/dee.svg'],
      manifest: {
        name: 'Claude Session Panel',
        short_name: 'session panel',
        description: 'Overzicht van lopende Claude Code sessies over meerdere VS Code windows.',
        theme_color: '#0F1012',
        background_color: '#0F1012',
        display: 'standalone',
        icons: [
          { src: 'icons/dee.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/dee.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': API,
      '/ws': { target: API, ws: true },
    },
  },
});
