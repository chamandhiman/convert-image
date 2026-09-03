/**
 * Real-ESRGAN Upscaler Web Worker
 *
 * Runs on a dedicated background thread so the React UI stays 60fps responsive
 * during neural upscaler loading, tensor conversions, and tile inference.
 */

import * as ortModule from 'onnxruntime-web';

const ort = ortModule.default || ortModule;

let cachedSession = null;
let activeBackend = 'wasm';
let wasmBlobUrls = null;

const MODEL_PATH = '/models/realesr-general-x4v3.onnx';

/**
 * Configure JSEP WASM binaries so WebGPU executes hardware-accelerated shaders.
 */
async function setupOrtWasm() {
  if (wasmBlobUrls) {
    ort.env.wasm.wasmPaths = wasmBlobUrls;
    return;
  }

  try {
    const [mjsRes, wasmRes] = await Promise.all([
      fetch('/onnx/ort-wasm-simd-threaded.jsep.mjs'),
      fetch('/onnx/ort-wasm-simd-threaded.jsep.wasm'),
    ]);

    if (!mjsRes.ok || !wasmRes.ok) {
      throw new Error(`Failed to load JSEP WASM binaries (status ${mjsRes.status}/${wasmRes.status})`);
    }

    const [mjsBlob, wasmBlob] = await Promise.all([mjsRes.blob(), wasmRes.blob()]);
    const mjsUrl = URL.createObjectURL(new Blob([mjsBlob], { type: 'text/javascript' }));
    const wasmUrl = URL.createObjectURL(new Blob([wasmBlob], { type: 'application/wasm' }));

    wasmBlobUrls = { mjs: mjsUrl, wasm: wasmUrl };
    ort.env.wasm.wasmPaths = wasmBlobUrls;
  } catch (err) {
    console.warn('[Upscaler Worker] JSEP blob creation failed, falling back to /onnx/ path:', err?.message);
    ort.env.wasm.wasmPaths = '/onnx/';
  }

  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
}

/**
 * Initialize or return the cached Real-ESRGAN InferenceSession.
 * Tries WebGPU first, then falls back seamlessly to WASM.
 */
async function getSession() {
  if (cachedSession) return cachedSession;

  await setupOrtWasm();

  self.postMessage({
    type: 'progress',
    stage: 'loading-model',
    percent: 30,
    message: 'Loading neural upscaler weights (4.6 MB)…',
  });

  // Try WebGPU first if available
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      cachedSession = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ['webgpu'],
        graphOptimizationLevel: 'all',
      });
      activeBackend = 'webgpu';
    } catch (gpuErr) {
      console.warn('[Upscaler Worker] WebGPU initialization failed, falling back to WASM:', gpuErr?.message);
      cachedSession = null;
    }
  }

  // Fallback to WASM
  if (!cachedSession) {
    self.postMessage({
      type: 'progress',
      stage: 'loading-model',
      percent: 60,
      message: 'Compiling neural upscaler in browser memory (WASM)…',
    });

    cachedSession = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    activeBackend = 'wasm';
  }

  self.postMessage({
    type: 'progress',
    stage: 'loading-model',
    percent: 100,
    message: 'AI upscaler ready.',
  });

  return cachedSession;
}

/**
 * Convert RGBA pixel buffer to NCHW Float32Array [0, 1].
 */
function rgbaToNchw(rgbaData, width, height) {
  const channelSize = width * height;
  const floatArray = new Float32Array(3 * channelSize);

  for (let i = 0; i < channelSize; i++) {
    floatArray[i] = rgbaData[i * 4] / 255.0;                   // R
    floatArray[channelSize + i] = rgbaData[i * 4 + 1] / 255.0; // G
    floatArray[2 * channelSize + i] = rgbaData[i * 4 + 2] / 255.0; // B
  }

  return floatArray;
}

/**
 * Convert NCHW Float32Array back to RGBA Uint8ClampedArray clamped [0, 255].
 */
function nchwToRgba(floatArray, width, height) {
  const channelSize = width * height;
  const rgba = new Uint8ClampedArray(channelSize * 4);

  for (let i = 0; i < channelSize; i++) {
    const r = Math.min(255, Math.max(0, Math.round(floatArray[i] * 255.0)));
    const g = Math.min(255, Math.max(0, Math.round(floatArray[channelSize + i] * 255.0)));
    const b = Math.min(255, Math.max(0, Math.round(floatArray[2 * channelSize + i] * 255.0)));

    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = 255;
  }

  return rgba;
}

// Listen for tile inference requests from main thread
self.onmessage = async (e) => {
  const { type, id, tileWidth, tileHeight, tileRgba } = e.data;

  if (type === 'init') {
    try {
      await getSession();
      self.postMessage({ type: 'ready', backend: activeBackend });
    } catch (err) {
      self.postMessage({ type: 'error', error: err?.message });
    }
    return;
  }

  if (type === 'upscale-tile') {
    let inputTensor = null;
    let results = null;

    try {
      const session = await getSession();

      const nchwData = rgbaToNchw(new Uint8ClampedArray(tileRgba), tileWidth, tileHeight);
      inputTensor = new ort.Tensor('float32', nchwData, [1, 3, tileHeight, tileWidth]);

      const feeds = { input: inputTensor };
      results = await session.run(feeds);
      const outputTensor = results.output;

      const outW = tileWidth * 4;
      const outH = tileHeight * 4;
      const outRgba = nchwToRgba(outputTensor.data, outW, outH);

      // Explicitly dispose tensors immediately to free memory
      inputTensor.dispose?.();
      outputTensor.dispose?.();
      inputTensor = null;

      self.postMessage(
        {
          type: 'tile-result',
          id,
          outWidth: outW,
          outHeight: outH,
          outputRgba: outRgba.buffer,
          backend: activeBackend,
        },
        [outRgba.buffer]
      );
    } catch (err) {
      inputTensor?.dispose?.();
      results?.output?.dispose?.();
      console.error('[Upscaler Worker Error]:', err);
      self.postMessage({
        type: 'tile-error',
        id,
        error: err?.message || 'Tile upscaling failed inside worker.',
      });
    }
  }
};
