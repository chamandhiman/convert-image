#!/usr/bin/env node

/**
 * Cloudflare Workers Asset Verification Script
 *
 * Cloudflare Workers Assets and Pages enforce a strict 25 MiB (26,214,400 bytes)
 * maximum size per individual asset file.
 *
 * This script runs after the Vite production build to:
 * 1. Recursively scan the `dist/` directory.
 * 2. Assert that `dist/models/lama_fp32.onnx` (198 MiB) is NOT included.
 * 3. Verify EVERY asset is strictly under 25 MiB.
 * 4. Report asset sizes and exit with status code 1 if any asset violates the limit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

const CLOUDFLARE_LIMIT_BYTES = 25 * 1024 * 1024; // 25 MiB (26,214,400 bytes)

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (entry.isFile()) {
      const stat = fs.statSync(fullPath);
      const relativePath = path.relative(distDir, fullPath).replace(/\\/g, '/');
      fileList.push({
        fullPath,
        relativePath,
        size: stat.size,
        sizeFormatted: formatBytes(stat.size),
        exceedsLimit: stat.size > CLOUDFLARE_LIMIT_BYTES,
      });
    }
  }
  return fileList;
}

console.log('\n============================================================');
console.log('  Cloudflare Workers Asset Size Verification');
console.log('  Limit per asset: 25.00 MiB (26,214,400 bytes)');
console.log('============================================================\n');

if (!fs.existsSync(distDir)) {
  console.error(`[ERROR] Build output directory not found: ${distDir}`);
  console.error('Run "npm run build" first.\n');
  process.exit(1);
}

const assets = scanDirectory(distDir);

if (assets.length === 0) {
  console.error(`[ERROR] No assets found in ${distDir}.\n`);
  process.exit(1);
}

// Sort assets by size descending
assets.sort((a, b) => b.size - a.size);

console.log(`Scanned ${assets.length} deployed assets in dist/:\n`);
console.log('Largest 10 assets:');
assets.slice(0, 10).forEach((a, i) => {
  const flag = a.exceedsLimit ? ' [FAIL: > 25 MiB]' : ' [OK]';
  const prefix = String(i + 1).padStart(2, ' ');
  console.log(`  ${prefix}. ${a.relativePath.padEnd(50)} ${a.sizeFormatted.padStart(10)}${flag}`);
});

const oversized = assets.filter((a) => a.exceedsLimit);
const lamaFound = assets.find((a) => a.relativePath.includes('lama_fp32.onnx'));

console.log('\n------------------------------------------------------------');

if (lamaFound) {
  console.error(`\n[CRITICAL ERROR] Large AI model file detected in dist/:\n`);
  console.error(`  ${lamaFound.relativePath} (${lamaFound.sizeFormatted})`);
  console.error('\nThis file must NOT be in dist/. Large models belong in Cloudflare R2.');
}

if (oversized.length > 0) {
  console.error(`\n[BUILD FAILED] ${oversized.length} asset(s) exceed the Cloudflare 25 MiB limit:`);
  oversized.forEach((item) => {
    console.error(`  - ${item.relativePath}: ${item.sizeFormatted} (max 25.00 MiB)`);
  });
  console.error('\nDeployment to Cloudflare Workers / Pages will fail during asset upload.');
  console.error('Action required: Host oversized models in Cloudflare R2.\n');
  process.exit(1);
}

console.log(`\n[PASS] All ${assets.length} assets are under the 25 MiB Cloudflare limit.`);
console.log(`[PASS] Largest asset: ${assets[0].relativePath} (${assets[0].sizeFormatted})`);
console.log('[PASS] Build is verified and ready for Cloudflare deployment.\n');
process.exit(0);

