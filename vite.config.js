import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // `@` points at src/ — keeps imports flat instead of ../../../ chains.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Served from the domain root (https://convert-image.webtoolocean.com).
  base: '/',

  server: {
    port: 5173,
    // Fail loudly instead of silently moving to another port.
    strictPort: true,
    open: true,
  },

  preview: {
    port: 4173,
    strictPort: true,
  },

  css: {
    // Readable generated class names in dev, hashed in production builds.
    modules: {
      generateScopedName:
        process.env.NODE_ENV === 'production'
          ? '[hash:base64:6]'
          : '[name]__[local]__[hash:base64:4]',
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    // Warn earlier than Vite's 500 kB default so bundle growth is noticed.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Keep React in its own long-lived chunk so app updates don't bust it.
        // Vite 8 / Rolldown requires manualChunks as a function.
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          if (id.includes('node_modules/@imgly')) {
            return 'imgly-bg-removal';
          }
        },
      },
    },
  },
});
