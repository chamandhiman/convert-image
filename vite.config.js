import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Cloudflare Worker asset size limit: 25 MiB.
 * Large ONNX models (>25 MiB, e.g. lama_fp32.onnx at 198 MiB) are hosted in Cloudflare R2
 * and streamed dynamically by clients.
 *
 * This Vite plugin:
 * 1. Serves the local model from `models/` during `vite dev` without copying it to `public/` (zero internet usage in dev).
 * 2. Ensures `dist/` never bundles `lama_fp32.onnx` or any file exceeding 25 MiB in production builds.
 */
function externalModelsPlugin() {
  const rootDir = fileURLToPath(new URL('.', import.meta.url));
  const localLamaPath = path.resolve(rootDir, 'models/lama_fp32.onnx');

  return {
    name: 'external-models-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url === '/models/lama_fp32.onnx' || req.url.startsWith('/models/lama_fp32.onnx?'))) {
          if (fs.existsSync(localLamaPath)) {
            const stat = fs.statSync(localLamaPath);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            if (req.method === 'HEAD') {
              res.end();
              return;
            }
            fs.createReadStream(localLamaPath).pipe(res);
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      const distDir = path.resolve(rootDir, 'dist');
      if (!fs.existsSync(distDir)) return;

      const MAX_BYTES = 25 * 1024 * 1024; // 25 MiB Cloudflare asset limit
      function verifyDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            verifyDir(fullPath);
          } else if (entry.isFile()) {
            const stat = fs.statSync(fullPath);
            if (stat.size > MAX_BYTES) {
              const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
              if (entry.name === 'lama_fp32.onnx') {
                console.warn(`[Cloudflare Guard] Excluded ${entry.name} (${sizeMb} MiB) from dist/ (hosted via R2).`);
                fs.unlinkSync(fullPath);
              } else {
                console.warn(`[Cloudflare Guard Alert] File exceeds 25 MiB: ${fullPath} (${sizeMb} MiB)`);
              }
            }
          }
        }
      }
      verifyDir(distDir);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), externalModelsPlugin()],

  resolve: {
    alias: {
      // `@` points at src/ — keeps imports flat instead of ../../../ chains.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Served from the domain root (https://image.webtoolocean.com).
  base: '/',

  server: {
    port: 5173,
    // Fail loudly instead of silently moving to another port.
    strictPort: true,
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
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
