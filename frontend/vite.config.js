import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['motion'],
          icons: ['lucide-react']
        }
      }
    }
  }
});