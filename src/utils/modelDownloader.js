/**
 * Streamed ONNX Model Downloader with Browser Cache Storage.
 *
 * Designed for execution inside Web Workers.
 *
 * Solves:
 * 1. Cloudflare Workers 25 MiB asset limit by streaming large models from R2 / CDN.
 * 2. Duplicate downloads by caching the ~198.4 MB model in browser Cache Storage API.
 * 3. Real-time byte progress reporting during streaming.
 * 4. Multi-URL fallback (R2 custom domain -> R2.dev -> local dev -> upstream CDN).
 */

const CACHE_NAME = 'imageconvert-onnx-models-v1';

/**
 * Download an ONNX model with browser Cache Storage support and streaming progress.
 *
 * @param {object} options
 * @param {string} options.primaryUrl - Primary model URL (e.g. Cloudflare R2 bucket)
 * @param {string[]} [options.fallbackUrls] - Fallback URLs to attempt if primary fails
 * @param {object} options.spec - Model specification metadata
 * @param {string} options.spec.id - Unique model identifier (e.g. 'lama')
 * @param {string} options.spec.name - Human-readable model name
 * @param {string} options.spec.fileName - File name (e.g. 'lama_fp32.onnx')
 * @param {number} [options.spec.sizeBytes] - Expected size in bytes
 * @param {(progress: { stage: string, percent: number, message: string }) => void} [options.onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function downloadModelWithCache({
  primaryUrl,
  fallbackUrls = [],
  spec,
  onProgress,
}) {
  const modelName = spec?.name || spec?.fileName || 'AI model';
  const expectedBytes = spec?.sizeBytes || 208044816;

  // 1. Check browser Cache Storage API (instant retrieval, 0 network bandwidth)
  let cache = null;
  const isWorkerContext = typeof self !== 'undefined';

  try {
    if (isWorkerContext && 'caches' in self) {
      cache = await self.caches.open(CACHE_NAME);
    }
  } catch (err) {
    console.warn('[ModelDownloader] Cache Storage unavailable:', err?.message);
  }

  if (cache) {
    try {
      // Look up by canonical virtual cache key or URL
      const virtualKey = new URL(`/cached-models/${spec.fileName}`, self.location?.origin || 'http://localhost').href;
      let cachedResponse = await cache.match(virtualKey);

      if (!cachedResponse && primaryUrl) {
        cachedResponse = await cache.match(primaryUrl);
      }

      if (cachedResponse) {
        if (onProgress) {
          onProgress({
            stage: 'loading-model',
            percent: 70,
            message: `Loading ${modelName} from browser cache (instant)…`,
          });
        }

        const buffer = await cachedResponse.arrayBuffer();
        const minValidBytes = Math.round(expectedBytes * 0.85);

        if (buffer.byteLength >= minValidBytes) {
          if (onProgress) {
            onProgress({
              stage: 'loading-model',
              percent: 80,
              message: `Model loaded from browser cache (${(buffer.byteLength / (1024 * 1024)).toFixed(1)} MB).`,
            });
          }
          return new Uint8Array(buffer);
        }

        // Corrupt or partial cache entry — delete and re-fetch
        console.warn(`[ModelDownloader] Cached model was truncated (${buffer.byteLength} bytes). Evicting…`);
        await cache.delete(virtualKey);
        if (primaryUrl) await cache.delete(primaryUrl);
      }
    } catch (cacheErr) {
      console.warn('[ModelDownloader] Cache lookup error, falling back to network:', cacheErr?.message);
    }
  }

  // 2. Fetch from network with multi-URL fallback
  const attemptUrls = [primaryUrl, ...fallbackUrls].filter(Boolean);
  const attemptedLogs = [];
  let lastError = null;

  for (let i = 0; i < attemptUrls.length; i++) {
    const url = attemptUrls[i];
    try {
      if (onProgress) {
        onProgress({
          stage: 'loading-model',
          percent: 5,
          message: `Connecting to ${modelName}…`,
        });
      }

      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const contentLengthHeader = response.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : expectedBytes;

      let modelBytes;

      if (!response.body) {
        const buffer = await response.arrayBuffer();
        modelBytes = new Uint8Array(buffer);
      } else {
        const reader = response.body.getReader();
        let receivedBytes = 0;
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedBytes += value.length;

          const downloadPercent = Math.min(75, Math.round((receivedBytes / totalBytes) * 75));
          const recMb = (receivedBytes / (1024 * 1024)).toFixed(1);
          const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

          if (onProgress) {
            onProgress({
              stage: 'loading-model',
              percent: downloadPercent,
              message: `Downloading ${modelName} (${recMb} / ${totalMb} MB)…`,
            });
          }
        }

        modelBytes = new Uint8Array(receivedBytes);
        let offset = 0;
        for (const chunk of chunks) {
          modelBytes.set(chunk, offset);
          offset += chunk.length;
        }
      }

      // Integrity check
      const minValidSize = Math.round(expectedBytes * 0.85);
      if (modelBytes.byteLength < minValidSize) {
        throw new Error(`Incomplete download: received ${modelBytes.byteLength} bytes (expected ~${expectedBytes} bytes)`);
      }

      // Save valid model to Cache Storage for subsequent instant loads
      if (cache) {
        try {
          const virtualKey = new URL(`/cached-models/${spec.fileName}`, self.location?.origin || 'http://localhost').href;
          const cacheResponse = new Response(modelBytes.slice(0).buffer, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': String(modelBytes.byteLength),
              'X-Model-Name': spec.fileName,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
          await cache.put(virtualKey, cacheResponse);
        } catch (saveErr) {
          console.warn('[ModelDownloader] Failed to save model to Cache Storage:', saveErr?.message);
        }
      }

      return modelBytes;
    } catch (err) {
      lastError = err;
      attemptedLogs.push(`${url} -> ${err?.message || 'Failed'}`);
      console.warn(`[ModelDownloader] Could not load ${spec.fileName} from ${url}:`, err?.message);
      // Loop continues to next fallback URL
    }
  }

  // 3. All URLs failed — throw detailed actionable guidance
  const errorMessage =
    `Unable to download AI model "${modelName}" (${spec.fileName}).\n\n` +
    `Attempted sources:\n` +
    attemptedLogs.map((log) => ` • ${log}`).join('\n') +
    `\n\nCloudflare R2 Troubleshooting:\n` +
    `1. Ensure "${spec.fileName}" is uploaded to your Cloudflare R2 bucket.\n` +
    `2. Verify R2 CORS configuration allows origin "*" and method "GET".\n` +
    `3. Configure VITE_MODELS_BASE_URL (e.g. https://models.yourdomain.com) in Cloudflare Pages / Workers.\n` +
    `4. Check your internet connection and retry.`;

  throw new Error(errorMessage);
}

export default downloadModelWithCache;

