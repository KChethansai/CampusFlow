import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
            if (id.includes('three') || id.includes('@react-three')) return 'spatial';
            if (id.includes('react') || id.includes('zustand') || id.includes('axios')) return 'vendor';
          }
          return undefined;
        }
      }
    }
  }
});