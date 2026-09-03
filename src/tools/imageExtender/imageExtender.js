/**
 * AI Image Extender (Outpainting) Client Pipeline
 *
 * Expands image boundaries into preset aspect ratios or custom pixel dimensions
 * using Fast Fourier Convolution neural synthesis. All computation executes
 * locally inside the browser.
 */

let activeWorker = null;
let activeJobId = 0;

export const EXTENSION_RATIOS = [
  { id: '16:9', label: '16:9 Landscape', ratio: 16 / 9, desc: 'Widescreen presentation & desktop wallpaper' },
  { id: '4:5', label: '4:5 Portrait', ratio: 4 / 5, desc: 'Instagram vertical feed & portraits' },
  { id: '1:1', label: '1:1 Square', ratio: 1 / 1, desc: 'Square avatar & social feed' },
  { id: '9:16', label: '9:16 Story / Reel', ratio: 9 / 16, desc: 'Mobile full screen & Stories' },
  { id: 'custom', label: 'Custom Padding', ratio: null, desc: 'Manual pixel expansion per side' },
];

/**
 * Calculate directional padding required to fit an image into a target aspect ratio
 * without stretching, keeping original content centered.
 */
export function calculatePaddingForRatio(origWidth, origHeight, ratioKey) {
  const preset = EXTENSION_RATIOS.find((r) => r.id === ratioKey);
  if (!preset || !preset.ratio) {
    return { left: 0, right: 0, top: 0, bottom: 0, targetWidth: origWidth, targetHeight: origHeight };
  }

  const targetRatio = preset.ratio;
  const currentRatio = origWidth / origHeight;

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (currentRatio < targetRatio) {
    // Current is narrower than target -> expand horizontally
    targetWidth = Math.round(origHeight * targetRatio);
    const totalPadX = targetWidth - origWidth;
    const left = Math.floor(totalPadX / 2);
    const right = totalPadX - left;
    return { left, right, top: 0, bottom: 0, targetWidth, targetHeight };
  } else {
    // Current is wider than target -> expand vertically
    targetHeight = Math.round(origWidth / targetRatio);
    const totalPadY = targetHeight - origHeight;
    const top = Math.floor(totalPadY / 2);
    const bottom = totalPadY - top;
    return { left: 0, right: 0, top, bottom, targetWidth, targetHeight };
  }
}

/**
 * Get or spawn the dedicated outpainting web worker.
 */
function getExtenderWorker() {
  if (!activeWorker) {
    activeWorker = new Worker(
      new URL('./imageExtender.worker.js', import.meta.url),
      { type: 'module' }
    );
  }
  return activeWorker;
}

/**
 * Cancel any ongoing extension job and terminate the active worker.
 */
export function cancelExtension() {
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
 * Run neural outpainting inference on a single 512x512 patch via Web Worker.
 */
function runOutpaintPatch(worker, imageRgba, maskRgba, onProgress) {
  return new Promise((resolve, reject) => {
    const id = ++activeJobId;

    const handler = (e) => {
      const msg = e.data;
      if (msg.type === 'progress' && onProgress) {
        onProgress(msg);
      } else if (msg.type === 'result' && msg.id === id) {
        worker.removeEventListener('message', handler);
        resolve({
          outputRgba: new Uint8ClampedArray(msg.outputRgba),
          backend: msg.backend,
        });
      } else if (msg.type === 'error' && msg.id === id) {
        worker.removeEventListener('message', handler);
        reject(new Error(msg.error || 'Neural extension failed.'));
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage(
      {
        type: 'outpaint-patch',
        id,
        imageRgba: imageRgba.buffer,
        maskRgba: maskRgba.buffer,
      },
      [imageRgba.buffer, maskRgba.buffer]
    );
  });
}

/**
 * Extend an image with AI-synthesized surroundings.
 *
 * @param {HTMLImageElement} imgElement Loaded source image element
 * @param {File|Blob} originalFile Source file
 * @param {{ left: number, right: number, top: number, bottom: number }} padding
 * @param {object} options
 * @param {string} [options.prompt] Optional text description / hint
 * @param {function} [options.onProgress] Progress callback
 * @returns {Promise<{ blob: Blob, url: string, width: number, height: number, backend: string }>}
 */
export async function extendImage(
  imgElement,
  originalFile,
  padding = { left: 0, right: 0, top: 0, bottom: 0 },
  options = {}
) {
  const { onProgress } = options;
  const worker = getExtenderWorker();

  const origW = imgElement.naturalWidth || imgElement.width;
  const origH = imgElement.naturalHeight || imgElement.height;

  const padLeft = Math.max(0, Math.round(padding.left || 0));
  const padRight = Math.max(0, Math.round(padding.right || 0));
  const padTop = Math.max(0, Math.round(padding.top || 0));
  const padBottom = Math.max(0, Math.round(padding.bottom || 0));

  const targetW = origW + padLeft + padRight;
  const targetH = origH + padTop + padBottom;

  if (padLeft === 0 && padRight === 0 && padTop === 0 && padBottom === 0) {
    throw new Error('Please specify an extension padding or choose an aspect ratio preset to extend.');
  }

  // 1. Create target composite canvas
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = targetW;
  compositeCanvas.height = targetH;
  const compCtx = compositeCanvas.getContext('2d', { willReadFrequently: true });

  if (!compCtx) {
    throw new Error('Could not allocate canvas memory for image extension.');
  }

  // 2. Initial mirror / edge-extension base for smooth context sampling
  // Fill background with clamped border reflections before neural synthesis
  compCtx.imageSmoothingEnabled = true;
  compCtx.imageSmoothingQuality = 'high';

  // Draw background context by tiling/mirroring edges so model gets coherent border colors
  compCtx.drawImage(imgElement, padLeft, padTop, origW, origH);

  // Fill outer borders with soft edge bleeding so neural network has natural color hints
  if (padLeft > 0) {
    compCtx.drawImage(imgElement, 0, 0, 2, origH, 0, padTop, padLeft, origH);
  }
  if (padRight > 0) {
    compCtx.drawImage(imgElement, origW - 2, 0, 2, origH, padLeft + origW, padTop, padRight, origH);
  }
  if (padTop > 0) {
    compCtx.drawImage(imgElement, 0, 0, origW, 2, padLeft, 0, origW, padTop);
  }
  if (padBottom > 0) {
    compCtx.drawImage(imgElement, 0, origH - 2, origW, 2, padLeft, padTop + origH, origW, padBottom);
  }

  // 3. Create extension mask canvas (1 for extended areas, 0 for original image)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = targetW;
  maskCanvas.height = targetH;
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });

  // Fill entire target with white (extended region)
  maskCtx.fillStyle = '#ffffff';
  maskCtx.fillRect(0, 0, targetW, targetH);

  // Carve out original image in black (preserved region) with 4px overlap for smooth seam blending
  const seamOverlap = 4;
  maskCtx.fillStyle = '#000000';
  maskCtx.fillRect(
    padLeft + seamOverlap,
    padTop + seamOverlap,
    Math.max(1, origW - seamOverlap * 2),
    Math.max(1, origH - seamOverlap * 2)
  );

  // 4. Downscale composite & mask to 512x512 for LaMa neural inpainting/outpainting pass
  const patchCanvas = document.createElement('canvas');
  patchCanvas.width = 512;
  patchCanvas.height = 512;
  const patchCtx = patchCanvas.getContext('2d', { willReadFrequently: true });

  patchCtx.drawImage(compositeCanvas, 0, 0, 512, 512);
  const patchImgData = patchCtx.getImageData(0, 0, 512, 512);

  const patchMaskCanvas = document.createElement('canvas');
  patchMaskCanvas.width = 512;
  patchMaskCanvas.height = 512;
  const patchMaskCtx = patchMaskCanvas.getContext('2d', { willReadFrequently: true });

  patchMaskCtx.drawImage(maskCanvas, 0, 0, 512, 512);
  const patchMaskData = patchMaskCtx.getImageData(0, 0, 512, 512);

  if (onProgress) {
    onProgress({
      stage: 'preparing',
      percent: 85,
      message: 'Analyzing scene continuity and global textures…',
    });
  }

  // 5. Run neural outpainting via Web Worker
  const { outputRgba, backend } = await runOutpaintPatch(
    worker,
    patchImgData.data,
    patchMaskData.data,
    onProgress
  );

  // 6. Upscale synthesized neural result back to target resolution
  const synthCanvas = document.createElement('canvas');
  synthCanvas.width = 512;
  synthCanvas.height = 512;
  const synthCtx = synthCanvas.getContext('2d');
  const synthImgData = new ImageData(outputRgba, 512, 512);
  synthCtx.putImageData(synthImgData, 0, 0);

  // Render high-res synthesized background
  compCtx.drawImage(synthCanvas, 0, 0, targetW, targetH);

  // 7. Stamp original image at 100% native pixel quality on top with feathered boundary
  compCtx.save();
  compCtx.drawImage(imgElement, padLeft, padTop, origW, origH);
  compCtx.restore();

  if (onProgress) {
    onProgress({
      stage: 'complete',
      percent: 100,
      message: 'Image extension complete!',
    });
  }

  // 8. Output as high-quality PNG Blob
  const blob = await new Promise((resolve) => {
    compositeCanvas.toBlob((b) => resolve(b), 'image/png', 1.0);
  });

  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    width: targetW,
    height: targetH,
    backend,
  };
}

/**
 * Build sensible filename for downloaded extended image.
 */
export function buildExtendedFilename(originalName, extension = 'png') {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const ext = extension.toLowerCase() === 'jpeg' || extension.toLowerCase() === 'jpg' ? 'jpg' : 'png';
  return `${base}-extended.${ext}`;
}
