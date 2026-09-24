import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Offline shell: precached app shell + navigation fallback. Authenticated
    // API responses are deliberately NOT cached by Workbox to prevent cross-user
    // leaks on shared devices; user-scoped offline caching is handled in config/api.js
    // with session-isolated storage keys and complete purge on logout.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // hand-authored public/manifest.webmanifest stays canonical
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}']
      }
    })
  ],
  server: {
    port: 5173
  },
  build: {
    // 3D ships as a lazy, intersection-gated chunk (never initial load),
    // so the budget covers it explicitly instead of warning on every build.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Stable vendor chunks: better long-term caching + smaller main entry.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'router';
            if (id.includes('motion')) return 'motion';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('three') || id.includes('@react-three')) return 'hero-3d';
            if (id.includes('react') || id.includes('zustand') || id.includes('axios')) return 'vendor';
          }
          return undefined;
        }
      }
    }
  }
});