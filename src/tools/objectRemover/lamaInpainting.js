/**
 * AI Object Remover Main Thread Controller
 *
 * Coordinates Web Worker execution, intelligent context cropping,
 * 512x512 scaling for LaMa, and feathered alpha compositing.
 */

let activeWorker = null;
let currentRequestId = 0;

/**
 * Get or create the singleton Web Worker.
 */
function getWorker() {
  if (!activeWorker) {
    activeWorker = new Worker(
      new URL('./lamaInpainting.worker.js', import.meta.url),
      { type: 'module' }
    );
  }
  return activeWorker;
}

/**
 * Terminate the active worker if running.
 */
export function cancelInpainting() {
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
 * Find bounding box of painted mask pixels on a canvas.
 *
 * @param {HTMLCanvasElement} maskCanvas
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, hasMask: boolean }}
 */
export function getMaskBoundingBox(maskCanvas) {
  const width = maskCanvas.width;
  const height = maskCanvas.height;
  const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
  const data = ctx.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasMask = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Mask painted pixel has alpha or red > 10
      if (data[idx + 3] > 10 || data[idx] > 10) {
        hasMask = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return { minX, minY, maxX, maxY, hasMask };
}

/**
 * Execute LaMa inpainting on an image and mask canvas.
 *
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage
 * @param {HTMLCanvasElement} maskCanvas
 * @param {object} options
 * @param {(progress: { stage: string, percent: number, message: string }) => void} [options.onProgress]
 * @param {string} [options.outputType='image/png']
 * @param {number} [options.quality=0.95]
 * @returns {Promise<{ blob: Blob, width: number, height: number, processingTimeMs: number, backend: string }>}
 */
export async function removeObject(sourceImage, maskCanvas, {
  onProgress,
  outputType = 'image/png',
  quality = 0.95,
} = {}) {
  const startTime = Date.now();
  const width = sourceImage.naturalWidth || sourceImage.width;
  const height = sourceImage.naturalHeight || sourceImage.height;

  // 1. Safety check
  if (width > 4096 || height > 4096) {
    throw new Error('Image dimensions exceed 4096px. Please select a moderately sized photo to avoid memory exhaustion.');
  }

  // 2. Scan mask bounding box
  const bbox = getMaskBoundingBox(maskCanvas);
  if (!bbox.hasMask) {
    throw new Error('Paint over the object you want to remove first.');
  }

  if (onProgress) {
    onProgress({ stage: 'preparing', percent: 5, message: 'Preparing image context…' });
  }

  // 3. Compute square context crop box around the masked object
  const maskW = Math.max(1, bbox.maxX - bbox.minX);
  const maskH = Math.max(1, bbox.maxY - bbox.minY);
  const centerX = bbox.minX + maskW / 2;
  const centerY = bbox.minY + maskH / 2;

  // Provide at least 2.5x context padding around the object to allow LaMa to sample background textures
  let cropSize = Math.max(maskW, maskH) * 2.5;
  cropSize = Math.max(cropSize, 512); // at least 512px for high detail
  cropSize = Math.min(cropSize, Math.max(width, height)); // clamp to image max

  // If crop box covers most of the image (>70%), use full image to avoid unnecessary cropping
  const useFullImage = cropSize >= width * 0.85 && cropSize >= height * 0.85;

  let cropX = 0;
  let cropY = 0;
  let cropW = width;
  let cropH = height;

  if (!useFullImage) {
    cropX = Math.max(0, Math.min(width - cropSize, Math.round(centerX - cropSize / 2)));
    cropY = Math.max(0, Math.min(height - cropSize, Math.round(centerY - cropSize / 2)));
    cropW = Math.min(cropSize, width - cropX);
    cropH = Math.min(cropSize, height - cropY);
  }

  // 4. Render 512x512 inputs for LaMa
  const LAMA_SIZE = 512;

  // Source crop canvas scaled to 512x512
  const inImgCanvas = document.createElement('canvas');
  inImgCanvas.width = LAMA_SIZE;
  inImgCanvas.height = LAMA_SIZE;
  const inImgCtx = inImgCanvas.getContext('2d');
  inImgCtx.drawImage(sourceImage, cropX, cropY, cropW, cropH, 0, 0, LAMA_SIZE, LAMA_SIZE);
  const imgData = inImgCtx.getImageData(0, 0, LAMA_SIZE, LAMA_SIZE);

  // Mask crop canvas scaled to 512x512
  const inMskCanvas = document.createElement('canvas');
  inMskCanvas.width = LAMA_SIZE;
  inMskCanvas.height = LAMA_SIZE;
  const inMskCtx = inMskCanvas.getContext('2d');
  inMskCtx.drawImage(maskCanvas, cropX, cropY, cropW, cropH, 0, 0, LAMA_SIZE, LAMA_SIZE);
  const mskData = inMskCtx.getImageData(0, 0, LAMA_SIZE, LAMA_SIZE);

  // 5. Send to Web Worker
  const worker = getWorker();
  const requestId = ++currentRequestId;
  const modelUrl = typeof window !== 'undefined' && window.location
    ? new URL('/models/lama_fp32.onnx', window.location.origin).href
    : '/models/lama_fp32.onnx';

  const workerResult = await new Promise((resolve, reject) => {
    const handleMessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        if (onProgress) {
          onProgress({
            stage: msg.stage,
            percent: msg.percent,
            message: msg.message,
          });
        }
      } else if (msg.type === 'result' && msg.id === requestId) {
        worker.removeEventListener('message', handleMessage);
        resolve(msg);
      } else if (msg.type === 'error' && msg.id === requestId) {
        worker.removeEventListener('message', handleMessage);
        reject(new Error(msg.error || 'LaMa inpainting failed.'));
      }
    };

    worker.addEventListener('message', handleMessage);

    // Transfer buffers to worker
    worker.postMessage(
      {
        type: 'inpaint',
        id: requestId,
        modelUrl,
        imageRgba: imgData.data.buffer,
        maskRgba: mskData.data.buffer,
      },
      [imgData.data.buffer, mskData.data.buffer]
    );
  });

  if (onProgress) {
    onProgress({ stage: 'finishing', percent: 95, message: 'Blending seamlessly onto original image…' });
  }

  // 6. Postprocess: Composite inpainted patch onto original image with feathered mask
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outCtx = outputCanvas.getContext('2d');

  // Draw 100% untouched original image first
  outCtx.drawImage(sourceImage, 0, 0);

  // Put 512x512 worker result into temporary canvas
  const patch512Canvas = document.createElement('canvas');
  patch512Canvas.width = LAMA_SIZE;
  patch512Canvas.height = LAMA_SIZE;
  const patch512Ctx = patch512Canvas.getContext('2d');
  const patchImgData = new ImageData(
    new Uint8ClampedArray(workerResult.outputRgba),
    LAMA_SIZE,
    LAMA_SIZE
  );
  patch512Ctx.putImageData(patchImgData, 0, 0);

  // Create crop-sized inpaint canvas
  const inpaintedCropCanvas = document.createElement('canvas');
  inpaintedCropCanvas.width = cropW;
  inpaintedCropCanvas.height = cropH;
  const inpaintCropCtx = inpaintedCropCanvas.getContext('2d');
  inpaintCropCtx.imageSmoothingEnabled = true;
  inpaintCropCtx.imageSmoothingQuality = 'high';
  inpaintCropCtx.drawImage(patch512Canvas, 0, 0, cropW, cropH);

  // Create feathered mask for the crop region to ensure 0 visible seam lines
  const featherMaskCanvas = document.createElement('canvas');
  featherMaskCanvas.width = cropW;
  featherMaskCanvas.height = cropH;
  const featherMaskCtx = featherMaskCanvas.getContext('2d');

  // Draw the original unscaled mask of this crop region with subtle blur feathering
  featherMaskCtx.filter = 'blur(3px)';
  featherMaskCtx.drawImage(maskCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  featherMaskCtx.filter = 'none';

  // Apply feathered mask using source-in compositing on the inpaint patch
  const maskedPatchCanvas = document.createElement('canvas');
  maskedPatchCanvas.width = cropW;
  maskedPatchCanvas.height = cropH;
  const maskedPatchCtx = maskedPatchCanvas.getContext('2d');

  // 1. Draw inpainted result
  maskedPatchCtx.drawImage(inpaintedCropCanvas, 0, 0);
  // 2. Restrict to mask shape with feathered alpha
  maskedPatchCtx.globalCompositeOperation = 'destination-in';
  maskedPatchCtx.drawImage(featherMaskCanvas, 0, 0);

  // 3. Composite masked patch back onto the full original image
  outCtx.drawImage(maskedPatchCanvas, cropX, cropY);

  // 7. Export final Blob
  const blob = await new Promise((resolve, reject) => {
    outputCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to encode inpainted image.'));
    }, outputType, quality);
  });

  const processingTimeMs = Date.now() - startTime;

  return {
    blob,
    width,
    height,
    processingTimeMs,
    backend: workerResult.backend || 'wasm',
  };
}

/**
 * Generate output filename for object remover exports.
 */
export function buildObjectRemovedFilename(originalName, outputType = 'image/png') {
  const base = originalName.replace(/\.[^.]+$/, '') || 'photo';
  let ext = 'png';
  if (outputType === 'image/jpeg') ext = 'jpg';
  else if (outputType === 'image/webp') ext = 'webp';
  return `${base}-object-removed.${ext}`;
}
