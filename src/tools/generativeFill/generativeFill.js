/**
 * AI Generative Fill Client Pipeline
 *
 * Coordinates in-browser selection inpainting, context-window bounding box
 * extraction, neural synthesis via Web Worker, and seamless feathered blending.
 */

let activeWorker = null;
let activeJobId = 0;

/**
 * Get or spawn the dedicated generative fill worker.
 */
function getGenerativeFillWorker() {
  if (!activeWorker) {
    activeWorker = new Worker(
      new URL('./generativeFill.worker.js', import.meta.url),
      { type: 'module' }
    );
  }
  return activeWorker;
}

/**
 * Terminate active generative fill worker.
 */
export function cancelGenerativeFill() {
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
 * Calculate bounding box of non-zero pixels in mask canvas.
 */
export function getMaskBoundingBox(maskCanvas) {
  const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let hasSelection = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 10 || data[idx] > 10) {
        hasSelection = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasSelection) return null;

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX + 1),
    height: Math.max(1, maxY - minY + 1),
  };
}

/**
 * Run generative fill patch inference on Web Worker.
 */
function runFillPatch(worker, imageRgba, maskRgba, onProgress) {
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
        reject(new Error(msg.error || 'Generative fill failed.'));
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage(
      {
        type: 'generate-fill',
        id,
        imageRgba: imageRgba.buffer,
        maskRgba: maskRgba.buffer,
      },
      [imageRgba.buffer, maskRgba.buffer]
    );
  });
}

/**
 * Execute AI Generative Fill inside the selected mask area.
 *
 * @param {HTMLImageElement} imgElement Source image
 * @param {File|Blob} originalFile Source file
 * @param {HTMLCanvasElement} maskCanvas Canvas containing the painted mask
 * @param {object} options
 * @param {string} [options.prompt] Prompt describing what to generate
 * @param {function} [options.onProgress]
 * @returns {Promise<{ blob: Blob, url: string, width: number, height: number, backend: string }>}
 */
export async function executeGenerativeFill(
  imgElement,
  originalFile,
  maskCanvas,
  options = {}
) {
  const { onProgress } = options;
  const worker = getGenerativeFillWorker();

  const origW = imgElement.naturalWidth || imgElement.width;
  const origH = imgElement.naturalHeight || imgElement.height;

  const bbox = getMaskBoundingBox(maskCanvas);
  if (!bbox) {
    throw new Error('Please select an area of the image to generate content inside.');
  }

  // 1. Calculate square crop with 2.5x context padding around the selection
  const maxDim = Math.max(bbox.width, bbox.height);
  const cropSize = Math.min(
    Math.max(origW, origH),
    Math.max(512, Math.round(maxDim * 2.5))
  );

  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;

  let cropX = Math.round(centerX - cropSize / 2);
  let cropY = Math.round(centerY - cropSize / 2);

  // Clamp to image boundaries
  if (cropX < 0) cropX = 0;
  if (cropY < 0) cropY = 0;
  if (cropX + cropSize > origW) cropX = Math.max(0, origW - cropSize);
  if (cropY + cropSize > origH) cropY = Math.max(0, origH - cropSize);

  const actualCropW = Math.min(cropSize, origW - cropX);
  const actualCropH = Math.min(cropSize, origH - cropY);

  // 2. Prepare 512x512 image patch
  const patchImgCanvas = document.createElement('canvas');
  patchImgCanvas.width = 512;
  patchImgCanvas.height = 512;
  const patchImgCtx = patchImgCanvas.getContext('2d', { willReadFrequently: true });
  patchImgCtx.drawImage(
    imgElement,
    cropX,
    cropY,
    actualCropW,
    actualCropH,
    0,
    0,
    512,
    512
  );
  const patchImgData = patchImgCtx.getImageData(0, 0, 512, 512);

  // 3. Prepare 512x512 mask patch
  const patchMaskCanvas = document.createElement('canvas');
  patchMaskCanvas.width = 512;
  patchMaskCanvas.height = 512;
  const patchMaskCtx = patchMaskCanvas.getContext('2d', { willReadFrequently: true });
  patchMaskCtx.drawImage(
    maskCanvas,
    cropX,
    cropY,
    actualCropW,
    actualCropH,
    0,
    0,
    512,
    512
  );
  const patchMaskData = patchMaskCtx.getImageData(0, 0, 512, 512);

  if (onProgress) {
    onProgress({
      stage: 'preparing',
      percent: 80,
      message: 'Synthesizing generative fill in selected region…',
    });
  }

  // 4. Run inference via Web Worker
  const { outputRgba, backend } = await runFillPatch(
    worker,
    patchImgData.data,
    patchMaskData.data,
    onProgress
  );

  // 5. Render synthesized patch to canvas
  const synthCanvas = document.createElement('canvas');
  synthCanvas.width = 512;
  synthCanvas.height = 512;
  const synthCtx = synthCanvas.getContext('2d');
  const synthImgData = new ImageData(outputRgba, 512, 512);
  synthCtx.putImageData(synthImgData, 0, 0);

  // 6. Composite generated content back into high-res original image with smooth feathered mask
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = origW;
  resultCanvas.height = origH;
  const resultCtx = resultCanvas.getContext('2d', { willReadFrequently: true });

  // Draw original image at 100% native quality
  resultCtx.drawImage(imgElement, 0, 0, origW, origH);

  // Extract high-res mask for soft alpha compositing
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  const rawMaskData = maskCtx.getImageData(cropX, cropY, actualCropW, actualCropH);

  const fillPatchCanvas = document.createElement('canvas');
  fillPatchCanvas.width = actualCropW;
  fillPatchCanvas.height = actualCropH;
  const fillPatchCtx = fillPatchCanvas.getContext('2d');
  fillPatchCtx.drawImage(synthCanvas, 0, 0, actualCropW, actualCropH);

  const fillPatchData = fillPatchCtx.getImageData(0, 0, actualCropW, actualCropH);

  // Alpha blend only the masked pixels
  const baseData = resultCtx.getImageData(cropX, cropY, actualCropW, actualCropH);
  const totalPixels = actualCropW * actualCropH;

  for (let i = 0; i < totalPixels; i++) {
    const maskAlpha = (rawMaskData.data[i * 4 + 3] || rawMaskData.data[i * 4]) / 255;
    if (maskAlpha > 0.05) {
      const idx = i * 4;
      baseData.data[idx] = Math.round(
        fillPatchData.data[idx] * maskAlpha + baseData.data[idx] * (1 - maskAlpha)
      );
      baseData.data[idx + 1] = Math.round(
        fillPatchData.data[idx + 1] * maskAlpha + baseData.data[idx + 1] * (1 - maskAlpha)
      );
      baseData.data[idx + 2] = Math.round(
        fillPatchData.data[idx + 2] * maskAlpha + baseData.data[idx + 2] * (1 - maskAlpha)
      );
    }
  }

  resultCtx.putImageData(baseData, cropX, cropY);

  if (onProgress) {
    onProgress({
      stage: 'complete',
      percent: 100,
      message: 'Generative fill complete!',
    });
  }

  const blob = await new Promise((resolve) => {
    resultCanvas.toBlob((b) => resolve(b), 'image/png', 1.0);
  });

  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    width: origW,
    height: origH,
    backend,
  };
}

/**
 * Build sensible filename for downloaded generative fill result.
 */
export function buildGenerativeFillFilename(originalName, format = 'png') {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const ext = format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg' ? 'jpg' : 'png';
  return `${base}-generative-fill.${ext}`;
}
