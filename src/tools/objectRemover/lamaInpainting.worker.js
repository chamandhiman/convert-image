/**
 * LaMa Inpainting Web Worker
 *
 * Runs on a dedicated background thread to prevent any UI freezing during
 * model download, graph compilation, and neural inpainting inference.
 */

import * as ortModule from 'onnxruntime-web';

const ort = ortModule.default || ortModule;

let cachedSession = null;
let activeBackend = 'wasm';
const MODEL_SIZE = 208044816; // 198.4 MB
const WEBGPU_TIMEOUT_MS = 12000;
const WASM_TIMEOUT_MS = 60000;

let wasmBlobUrls = null;

async function getWasmBlobPaths() {
  if (wasmBlobUrls) return wasmBlobUrls;
  try {
    const [mjsRes, wasmRes] = await Promise.all([
      fetch('/onnx/ort-wasm-simd-threaded.mjs'),
      fetch('/onnx/ort-wasm-simd-threaded.wasm'),
    ]);
    if (!mjsRes.ok || !wasmRes.ok) {
      throw new Error(`Failed to load WASM binaries (status ${mjsRes.status}/${wasmRes.status})`);
    }
    const [mjsBlob, wasmBlob] = await Promise.all([mjsRes.blob(), wasmRes.blob()]);
    const mjsUrl = URL.createObjectURL(new Blob([mjsBlob], { type: 'text/javascript' }));
    const wasmUrl = URL.createObjectURL(new Blob([wasmBlob], { type: 'application/wasm' }));
    wasmBlobUrls = { mjs: mjsUrl, wasm: wasmUrl };
    return wasmBlobUrls;
  } catch (err) {
    console.warn('[LaMa Worker] Failed to create blob paths for WASM:', err);
    return '/onnx/';
  }
}

/**
 * Configure same-origin WASM paths for ONNX Runtime Web.
 */
async function setupOrtWasm() {
  const paths = await getWasmBlobPaths();
  ort.env.wasm.wasmPaths = paths;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
}

/**
 * Download model with streamed byte progress and integrity validation.
 */
async function downloadModel(modelUrl) {
  self.postMessage({
    type: 'progress',
    stage: 'loading-model',
    percent: 5,
    message: 'Connecting to AI inpainting model…',
  });

  const response = await fetch(modelUrl);
  if (!response.ok) {
    throw new Error(`Failed to download LaMa model from ${modelUrl} (HTTP ${response.status} ${response.statusText})`);
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : MODEL_SIZE;

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

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

    self.postMessage({
      type: 'progress',
      stage: 'loading-model',
      percent: downloadPercent,
      message: `Downloading AI model (${recMb} / ${totalMb} MB)…`,
    });
  }

  const modelData = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    modelData.set(chunk, offset);
    offset += chunk.length;
  }

  if (modelData.byteLength < 180000000) {
    throw new Error(`Model download was incomplete (${modelData.byteLength} bytes). Please check your connection and try again.`);
  }

  return modelData;
}

/**
 * Helper to wrap session creation in a timeout promise.
 */
function createSessionWithTimeout(modelData, options, timeoutMs, providerName) {
  return new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        reject(new Error(`Session creation for provider "${providerName}" timed out after ${timeoutMs / 1000}s`));
      }
    }, timeoutMs);

    ort.InferenceSession.create(modelData, options)
      .then((sess) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve(sess);
        } else {
          try {
            sess?.release?.();
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          reject(err);
        }
      });
  });
}

/**
 * Initialize or return the cached LaMa InferenceSession.
 */
async function getSession(modelUrl) {
  if (cachedSession) return cachedSession;

  await setupOrtWasm();

  // 1. Download model bytes with real streamed progress
  const modelBytes = await downloadModel(modelUrl);

  self.postMessage({
    type: 'progress',
    stage: 'preparing',
    percent: 80,
    message: 'Compiling neural inpainting network…',
  });

  let session = null;

  // Try WebGPU first if supported
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      session = await createSessionWithTimeout(
        modelBytes.buffer,
        {
          executionProviders: ['webgpu'],
          graphOptimizationLevel: 'all',
        },
        WEBGPU_TIMEOUT_MS,
        'webgpu'
      );
      activeBackend = 'webgpu';
    } catch (gpuErr) {
      console.warn('[LaMa Worker] WebGPU failed or timed out, falling back to WASM:', gpuErr?.message);
      session = null;
    }
  }

  // Fallback to WASM
  if (!session) {
    self.postMessage({
      type: 'progress',
      stage: 'preparing',
      percent: 85,
      message: 'Compiling neural network in browser memory (WASM)…',
    });

    session = await createSessionWithTimeout(
      modelBytes.buffer,
      {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      },
      WASM_TIMEOUT_MS,
      'wasm'
    );
    activeBackend = 'wasm';
  }

  cachedSession = session;
  return cachedSession;
}

/**
 * Convert 512x512 RGBA pixels to NCHW [1, 3, 512, 512] Float32Array in [0, 1].
 */
function imageToNCHW(rgbaData, size = 512) {
  const pixelCount = size * size;
  const nchw = new Float32Array(3 * pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    nchw[i] = rgbaData[i * 4] / 255.0;                   // R
    nchw[pixelCount + i] = rgbaData[i * 4 + 1] / 255.0; // G
    nchw[2 * pixelCount + i] = rgbaData[i * 4 + 2] / 255.0; // B
  }

  return nchw;
}

/**
 * Convert 512x512 mask pixels to NCHW [1, 1, 512, 512] Float32Array in {0, 1}.
 */
function maskToNCHW(maskData, size = 512) {
  const pixelCount = size * size;
  const nchw = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    // Check alpha or red channel of painted mask
    const val = maskData[i * 4 + 3] > 10 || maskData[i * 4] > 10 ? 1.0 : 0.0;
    nchw[i] = val;
  }

  return nchw;
}

/**
 * Convert LaMa NCHW [1, 3, 512, 512] output float32 [0, 255] back to RGBA uint8.
 */
function nchwToRgba(outputTensorData, size = 512) {
  const pixelCount = size * size;
  const rgba = new Uint8ClampedArray(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const r = Math.min(255, Math.max(0, Math.round(outputTensorData[i])));
    const g = Math.min(255, Math.max(0, Math.round(outputTensorData[pixelCount + i])));
    const b = Math.min(255, Math.max(0, Math.round(outputTensorData[2 * pixelCount + i])));

    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = 255;
  }

  return rgba;
}

// Worker message router
self.onmessage = async (e) => {
  const { type, id, modelUrl, imageRgba, maskRgba } = e.data;

  if (type === 'inpaint') {
    try {
      const session = await getSession(modelUrl);

      self.postMessage({
        type: 'progress',
        stage: 'inpainting',
        percent: 90,
        message: 'Removing object with LaMa…',
      });

      // Prepare tensors [1, 3, 512, 512] and [1, 1, 512, 512]
      const imgNchw = imageToNCHW(new Uint8ClampedArray(imageRgba), 512);
      const mskNchw = maskToNCHW(new Uint8ClampedArray(maskRgba), 512);

      const imageTensor = new ort.Tensor('float32', imgNchw, [1, 3, 512, 512]);
      const maskTensor = new ort.Tensor('float32', mskNchw, [1, 1, 512, 512]);

      const inputNameImg = session.inputNames[0] || 'image';
      const inputNameMask = session.inputNames[1] || 'mask';
      const outputName = session.outputNames[0] || 'output';

      const feeds = {
        [inputNameImg]: imageTensor,
        [inputNameMask]: maskTensor,
      };

      const results = await session.run(feeds);
      const outputTensor = results[outputName];

      const outRgba = nchwToRgba(outputTensor.data, 512);

      self.postMessage(
        {
          type: 'result',
          id,
          outputRgba: outRgba.buffer,
          backend: activeBackend,
        },
        [outRgba.buffer]
      );
    } catch (err) {
      console.error('[LaMa Worker Error]:', err);
      self.postMessage({
        type: 'error',
        id,
        error: err?.message || 'Inpainting failed inside Web Worker.',
      });
    }
  }
};
