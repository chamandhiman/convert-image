/**
 * Optimized AI Image Upscaler Engine using Real-ESRGAN (realesr-general-x4v3)
 * via Web Worker and ONNX Runtime Web (WebGPU with WASM fallback).
 *
 * Fully client-side neural super-resolution with:
 * - Web Worker offloading (zero UI thread freezing)
 * - Optimal 384px tiling with 16px overlap padding
 * - Session reuse across all tiles
 * - JSEP WebGPU hardware acceleration
 * - Immediate tensor and buffer disposal
 * - Pre-processing & post-processing memory optimization
 * - Full alpha transparency channel preservation
 */

let activeWorker = null;
let currentRequestId = 0;

/**
 * Maximum safe output resolution in pixels to prevent browser memory exhaustion.
 * 4096 x 4096 = 16,777,216 pixels (~16.7 Megapixels).
 */
export const MAX_SAFE_OUTPUT_PIXELS = 16777216;

/**
 * Optimal tile size and overlap padding.
 * 384px cuts tile count by 33-50% compared to 256px while fitting safely
 * within all desktop and mobile WebGPU/WASM buffer limits.
 */
export const TILE_SIZE = 384;
export const TILE_PAD = 16;

/**
 * Calculate safety thresholds and warnings before initiating upscale inference.
 *
 * @param {number} width Source image width
 * @param {number} height Source image height
 * @param {number} [scale=2] Scale factor (2 or 4)
 * @returns {{
 *   isSafe: boolean,
 *   isLarge: boolean,
 *   outputWidth: number,
 *   outputHeight: number,
 *   sourcePixels: number,
 *   outputPixels: number,
 *   estimatedTiles: number,
 *   canTry2x: boolean,
 *   warning?: string
 * }}
 */
export function checkImageSafety(width, height, scale = 2) {
  const outputWidth = width * scale;
  const outputHeight = height * scale;
  const sourcePixels = width * height;
  const outputPixels = outputWidth * outputHeight;

  const numTilesX = Math.ceil(width / TILE_SIZE);
  const numTilesY = Math.ceil(height / TILE_SIZE);
  const estimatedTiles = numTilesX * numTilesY;

  const isSafe = outputPixels <= MAX_SAFE_OUTPUT_PIXELS;
  const isLarge = sourcePixels >= 1500000 || estimatedTiles >= 4;

  const canTry2x = scale === 4 && (width * 2 * height * 2 <= MAX_SAFE_OUTPUT_PIXELS);

  let warning = '';
  if (!isSafe) {
    warning = 'This image is too large to safely process at this scale in your browser.';
  } else if (isLarge) {
    warning = 'Large image — AI processing may take longer.';
  }

  return {
    isSafe,
    isLarge,
    outputWidth,
    outputHeight,
    sourcePixels,
    outputPixels,
    estimatedTiles,
    canTry2x,
    warning,
  };
}

/**
 * Get or initialize the singleton Web Worker.
 */
function getWorker() {
  if (!activeWorker) {
    activeWorker = new Worker(
      new URL('./upscaler.worker.js', import.meta.url),
      { type: 'module' }
    );
  }
  return activeWorker;
}

/**
 * Terminate the active worker and reset state on user cancel.
 */
export function cancelUpscaling() {
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
 * Check if canvas/image has alpha transparency.
 */
function hasTransparency(ctx, width, height) {
  const sampleW = Math.min(width, 200);
  const sampleH = Math.min(height, 200);
  const sampleData = ctx.getImageData(0, 0, sampleW, sampleH).data;
  for (let i = 3; i < sampleData.length; i += 4) {
    if (sampleData[i] < 250) return true;
  }
  return false;
}

/**
 * Upscale an image using Real-ESRGAN with optimized tile-based Web Worker processing.
 *
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} img
 * @param {object} options
 * @param {2|4} [options.scale=2] Upscale factor (2 or 4)
 * @param {string} [options.outputType='image/png'] MIME type for export
 * @param {number} [options.quality=0.92] JPEG/WebP export quality
 * @param {(progress: { stage: string, percent: number, message: string }) => void} [options.onProgress]
 * @returns {Promise<{ blob: Blob, width: number, height: number, executionProvider: string, processingTimeMs: number }>}
 */
export async function upscaleImage(img, {
  scale = 2,
  outputType = 'image/png',
  quality = 0.92,
  onProgress,
} = {}) {
  const startTime = Date.now();
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  // 1. Safety Check
  const safety = checkImageSafety(srcWidth, srcHeight, scale);
  if (!safety.isSafe) {
    throw new Error(safety.warning || 'This image is too large to safely process at this scale in your browser.');
  }

  // 2. Render source image to an offscreen canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcWidth;
  srcCanvas.height = srcHeight;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  srcCtx.drawImage(img, 0, 0);

  const isTransparent = hasTransparency(srcCtx, srcWidth, srcHeight);

  // Real-ESRGAN natively outputs 4x resolution
  const MODEL_UPSCALE = 4;
  const out4xWidth = srcWidth * MODEL_UPSCALE;
  const out4xHeight = srcHeight * MODEL_UPSCALE;

  const out4xCanvas = document.createElement('canvas');
  out4xCanvas.width = out4xWidth;
  out4xCanvas.height = out4xHeight;
  const out4xCtx = out4xCanvas.getContext('2d');

  // Tile configuration
  const numTilesX = Math.ceil(srcWidth / TILE_SIZE);
  const numTilesY = Math.ceil(srcHeight / TILE_SIZE);
  const totalTiles = numTilesX * numTilesY;

  const worker = getWorker();
  let activeBackend = 'wasm';
  let processedTiles = 0;

  // Reusable offscreen canvas for blitting tile patches
  const tilePatchCanvas = document.createElement('canvas');
  const tilePatchCtx = tilePatchCanvas.getContext('2d');

  // 3. Process tiles sequentially through the worker
  for (let ty = 0; ty < numTilesY; ty++) {
    for (let tx = 0; tx < numTilesX; tx++) {
      const tileX = tx * TILE_SIZE;
      const tileY = ty * TILE_SIZE;
      const tileW = Math.min(TILE_SIZE, srcWidth - tileX);
      const tileH = Math.min(TILE_SIZE, srcHeight - tileY);

      // Overlap padding to eliminate seam boundaries
      const padLeft = Math.min(TILE_PAD, tileX);
      const padTop = Math.min(TILE_PAD, tileY);
      const padRight = Math.min(TILE_PAD, srcWidth - (tileX + tileW));
      const padBottom = Math.min(TILE_PAD, srcHeight - (tileY + tileH));

      const extractX = tileX - padLeft;
      const extractY = tileY - padTop;
      const extractW = tileW + padLeft + padRight;
      const extractH = tileH + padTop + padBottom;

      // Extract pixel data for this tile directly from source canvas
      const tileImageData = srcCtx.getImageData(extractX, extractY, extractW, extractH);

      const requestId = ++currentRequestId;

      // Send tile to worker
      const tileResult = await new Promise((resolve, reject) => {
        const handleMessage = (e) => {
          const msg = e.data;
          if (msg.type === 'progress') {
            onProgress?.({
              stage: msg.stage,
              percent: msg.percent,
              message: msg.message,
            });
          } else if (msg.type === 'tile-result' && msg.id === requestId) {
            worker.removeEventListener('message', handleMessage);
            resolve(msg);
          } else if (msg.type === 'tile-error' && msg.id === requestId) {
            worker.removeEventListener('message', handleMessage);
            reject(new Error(msg.error || 'Tile processing failed.'));
          }
        };

        worker.addEventListener('message', handleMessage);

        worker.postMessage(
          {
            type: 'upscale-tile',
            id: requestId,
            tileWidth: extractW,
            tileHeight: extractH,
            tileRgba: tileImageData.data.buffer,
          },
          [tileImageData.data.buffer]
        );
      });

      activeBackend = tileResult.backend || activeBackend;

      const outTilePaddedW = extractW * MODEL_UPSCALE;
      const outTilePaddedH = extractH * MODEL_UPSCALE;

      // Update patch canvas size if needed and blit unpadded inner region
      if (tilePatchCanvas.width !== outTilePaddedW || tilePatchCanvas.height !== outTilePaddedH) {
        tilePatchCanvas.width = outTilePaddedW;
        tilePatchCanvas.height = outTilePaddedH;
      }

      const outImgData = new ImageData(
        new Uint8ClampedArray(tileResult.outputRgba),
        outTilePaddedW,
        outTilePaddedH
      );
      tilePatchCtx.putImageData(outImgData, 0, 0);

      // Discard padded border margins to blend seamlessly
      const cropX = padLeft * MODEL_UPSCALE;
      const cropY = padTop * MODEL_UPSCALE;
      const cropW = tileW * MODEL_UPSCALE;
      const cropH = tileH * MODEL_UPSCALE;

      const destX = tileX * MODEL_UPSCALE;
      const destY = tileY * MODEL_UPSCALE;

      out4xCtx.drawImage(
        tilePatchCanvas,
        cropX, cropY, cropW, cropH,
        destX, destY, cropW, cropH
      );

      processedTiles++;

      if (onProgress) {
        const percent = Math.round((processedTiles / totalTiles) * 100);
        const tileStatus = totalTiles > 1
          ? `Upscaling image with AI (${processedTiles}/${totalTiles} tiles, ${percent}%)…`
          : `Enhancing details with neural network (${percent}%)…`;

        const largeStatus = safety.isLarge
          ? `${tileStatus} Large image — processing may take longer.`
          : tileStatus;

        onProgress({
          stage: 'processing',
          percent,
          message: largeStatus,
        });
      }

      // Micro-yield to maintain UI responsiveness
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // 4. Alpha Channel Preservation
  if (isTransparent) {
    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = out4xWidth;
    alphaCanvas.height = out4xHeight;
    const alphaCtx = alphaCanvas.getContext('2d');
    alphaCtx.imageSmoothingEnabled = true;
    alphaCtx.imageSmoothingQuality = 'high';
    alphaCtx.drawImage(srcCanvas, 0, 0, out4xWidth, out4xHeight);

    const alphaData = alphaCtx.getImageData(0, 0, out4xWidth, out4xHeight).data;
    const outData = out4xCtx.getImageData(0, 0, out4xWidth, out4xHeight);

    for (let i = 0; i < outData.data.length; i += 4) {
      outData.data[i + 3] = alphaData[i + 3];
    }
    out4xCtx.putImageData(outData, 0, 0);
  }

  // 5. Final Canvas Resolution (2x downsampling from 4x produces optimal sharpness)
  let finalCanvas = out4xCanvas;
  const targetWidth = srcWidth * scale;
  const targetHeight = srcHeight * scale;

  if (scale === 2) {
    finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(out4xCanvas, 0, 0, targetWidth, targetHeight);
  }

  // 6. Export to Blob
  const blob = await new Promise((resolve, reject) => {
    finalCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to encode upscaled image blob.'));
    }, outputType, quality);
  });

  const processingTimeMs = Date.now() - startTime;

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    executionProvider: activeBackend,
    processingTimeMs,
  };
}

/**
 * Generate a sensible filename for upscaled images.
 */
export function buildUpscaledFilename(originalName, scale = 2, outputType = 'image/png') {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  let ext = 'png';
  if (outputType === 'image/jpeg') ext = 'jpg';
  else if (outputType === 'image/webp') ext = 'webp';
  return `${base}-upscaled-${scale}x.${ext}`;
}
