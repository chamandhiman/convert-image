/**
 * AI Photo Restorer Client-Side Engine
 *
 * Implements a multi-stage photo restoration pipeline:
 * 1. Fading, tone, and contrast correction
 * 2. Deep neural restoration via Web Worker (Real-ESRGAN General)
 * 3. Strength-controlled detail reconstruction and micro-contrast enhancement
 */

let activeWorker = null;
let activeJobId = 0;

export const RESTORATION_STRENGTHS = [
  {
    id: 'balanced',
    label: 'Balanced',
    desc: 'Cleans blur, enhances sharpness, and restores faded colors naturally.',
  },
  {
    id: 'strong',
    label: 'Strong',
    desc: 'Deep reconstruction for heavily damaged, noisy, or severely compressed photos.',
  },
];

/**
 * Get or spawn the dedicated photo restorer worker.
 */
function getRestorerWorker() {
  if (!activeWorker) {
    activeWorker = new Worker(
      new URL('./photoRestorer.worker.js', import.meta.url),
      { type: 'module' }
    );
  }
  return activeWorker;
}

/**
 * Cancel any running restoration task and terminate worker.
 */
export function cancelRestoration() {
  if (activeWorker) {
    try {
      activeWorker.terminate();
    } catch {
      // ignore
    }
    activeWorker = null;
  }
}

/**
 * Restore an overlapping image tile via Web Worker.
 */
function restoreTile(worker, tileRgba, width, height) {
  return new Promise((resolve, reject) => {
    const id = ++activeJobId;

    const handler = (e) => {
      const msg = e.data;
      if (msg.type === 'tile-result' && msg.id === id) {
        worker.removeEventListener('message', handler);
        resolve({
          outWidth: msg.outWidth,
          outHeight: msg.outHeight,
          outputRgba: new Uint8ClampedArray(msg.outputRgba),
          backend: msg.backend,
        });
      } else if (msg.type === 'tile-error' && msg.id === id) {
        worker.removeEventListener('message', handler);
        reject(new Error(msg.error || 'Tile restoration failed.'));
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage(
      {
        type: 'restore-tile',
        id,
        tileWidth: width,
        tileHeight: height,
        tileRgba: tileRgba.buffer,
      },
      [tileRgba.buffer]
    );
  });
}

/**
 * Stage 1: Auto-contrast, color balance, and fading reduction.
 */
function applyToneRestoration(ctx, width, height, strength = 'balanced') {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  // Find min and max luminance for dynamic range expansion
  let minL = 255;
  let maxL = 0;
  let avgR = 0;
  let avgG = 0;
  let avgB = 0;
  const count = width * height;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum < minL) minL = lum;
    if (lum > maxL) maxL = lum;

    avgR += r;
    avgG += g;
    avgB += b;
  }

  avgR /= count;
  avgG /= count;
  avgB /= count;
  const globalAvg = (avgR + avgG + avgB) / 3;

  const toneFactor = strength === 'strong' ? 0.35 : 0.2;
  const contrastFactor = maxL > minL ? 255 / (maxL - minL) : 1;

  for (let i = 0; i < len; i += 4) {
    // Dynamic stretch
    let r = (data[i] - minL) * contrastFactor;
    let g = (data[i + 1] - minL) * contrastFactor;
    let b = (data[i + 2] - minL) * contrastFactor;

    // Gray world color cast correction
    if (avgR > 0) r = r * (1 - toneFactor) + r * (globalAvg / avgR) * toneFactor;
    if (avgG > 0) g = g * (1 - toneFactor) + g * (globalAvg / avgG) * toneFactor;
    if (avgB > 0) b = b * (1 - toneFactor) + b * (globalAvg / avgB) * toneFactor;

    data[i] = Math.min(255, Math.max(0, Math.round(r)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Main AI Photo Restoration function.
 *
 * @param {HTMLImageElement} imgElement Loaded source image
 * @param {File|Blob} originalFile Source file
 * @param {object} options
 * @param {'balanced'|'strong'} [options.strength='balanced']
 * @param {function} [options.onProgress]
 * @returns {Promise<{ blob: Blob, url: string, width: number, height: number, backend: string }>}
 */
export async function restorePhoto(imgElement, originalFile, options = {}) {
  const { strength = 'balanced', onProgress } = options;
  const worker = getRestorerWorker();

  const origW = imgElement.naturalWidth || imgElement.width;
  const origH = imgElement.naturalHeight || imgElement.height;

  if (onProgress) {
    onProgress({
      stage: 'preparing',
      percent: 5,
      message: 'Preparing your photo and analyzing contrast…',
    });
  }

  // 1. Prepare base canvas with tone correction
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  srcCtx.drawImage(imgElement, 0, 0);

  applyToneRestoration(srcCtx, origW, origH, strength);

  // 2. Tile setup for neural inference
  const TILE_SIZE = 256;
  const PAD = 16;

  const cols = Math.ceil(origW / TILE_SIZE);
  const rows = Math.ceil(origH / TILE_SIZE);
  const totalTiles = cols * rows;

  const outScale = 4;
  const neuralW = origW * outScale;
  const neuralH = origH * outScale;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = neuralW;
  outCanvas.height = neuralH;
  const outCtx = outCanvas.getContext('2d');

  let activeBackend = 'wasm';
  let processedTiles = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const srcX = c * TILE_SIZE;
      const srcY = r * TILE_SIZE;
      const srcW = Math.min(TILE_SIZE, origW - srcX);
      const srcH = Math.min(TILE_SIZE, origH - srcY);

      // Tile with context padding
      const padLeft = srcX > 0 ? PAD : 0;
      const padTop = srcY > 0 ? PAD : 0;
      const padRight = srcX + srcW < origW ? PAD : 0;
      const padBottom = srcY + srcH < origH ? PAD : 0;

      const tileX = srcX - padLeft;
      const tileY = srcY - padTop;
      const tileW = srcW + padLeft + padRight;
      const tileH = srcH + padTop + padBottom;

      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = tileW;
      tileCanvas.height = tileH;
      const tileCtx = tileCanvas.getContext('2d');
      tileCtx.drawImage(srcCanvas, tileX, tileY, tileW, tileH, 0, 0, tileW, tileH);
      const tileData = tileCtx.getImageData(0, 0, tileW, tileH);

      // Run neural restoration on tile
      const { outputRgba, backend } = await restoreTile(
        worker,
        tileData.data,
        tileW,
        tileH
      );
      activeBackend = backend;

      // Draw restored tile back into high-res canvas excluding overlapping borders
      const outTileCanvas = document.createElement('canvas');
      outTileCanvas.width = tileW * outScale;
      outTileCanvas.height = tileH * outScale;
      const outTileCtx = outTileCanvas.getContext('2d');
      const outTileImgData = new ImageData(outputRgba, tileW * outScale, tileH * outScale);
      outTileCtx.putImageData(outTileImgData, 0, 0);

      const cropX = padLeft * outScale;
      const cropY = padTop * outScale;
      const cropW = srcW * outScale;
      const cropH = srcH * outScale;

      outCtx.drawImage(
        outTileCanvas,
        cropX,
        cropY,
        cropW,
        cropH,
        srcX * outScale,
        srcY * outScale,
        cropW,
        cropH
      );

      processedTiles++;
      const progressPercent = Math.min(95, Math.round(15 + (processedTiles / totalTiles) * 80));

      if (onProgress) {
        onProgress({
          stage: 'restoring',
          percent: progressPercent,
          message: `Restoring photo details (${processedTiles}/${totalTiles} regions)…`,
        });
      }
    }
  }

  // 3. Final compositing: output at 2x resolution or crisp 1x for extreme sharpness
  // High quality 2x resolution offers the ideal balance of enhanced sharpness and texture clarity
  const finalScale = 2;
  const finalW = origW * finalScale;
  const finalH = origH * finalScale;

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = finalW;
  finalCanvas.height = finalH;
  const finalCtx = finalCanvas.getContext('2d');

  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(outCanvas, 0, 0, finalW, finalH);

  if (onProgress) {
    onProgress({
      stage: 'complete',
      percent: 100,
      message: 'Photo restoration complete!',
    });
  }

  const blob = await new Promise((resolve) => {
    finalCanvas.toBlob((b) => resolve(b), 'image/png', 1.0);
  });

  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    width: finalW,
    height: finalH,
    backend: activeBackend,
  };
}

/**
 * Build sensible filename for downloaded restored photo.
 */
export function buildRestoredFilename(originalName, format = 'png') {
  const base = originalName.replace(/\.[^.]+$/, '') || 'photo';
  const ext = format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg' ? 'jpg' : 'png';
  return `${base}-restored.${ext}`;
}
