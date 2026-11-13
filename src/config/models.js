/**
 * Centralized ONNX Model Registry and URL Resolution.
 *
 * Cloudflare Worker / Pages asset limit: 25 MiB.
 * Large models (>25 MiB, e.g. LaMa at ~198.4 MiB) are hosted externally on Cloudflare R2
 * and streamed dynamically with browser Cache Storage API caching.
 */

import env from './env';

export const MODEL_SPECS = {
  lama: {
    id: 'lama',
    name: 'LaMa Neural Inpainting',
    fileName: 'lama_fp32.onnx',
    sizeBytes: 208044816, // 198.4 MB
    sha256: '1faef5301d78db7dda502fe59966957ec4b79dd64e16f03ed96913c7a4eb68d6',
    upstreamUrl: 'https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx',
    localDevPath: '/models/lama_fp32.onnx',
  },
  realesrgan: {
    id: 'realesrgan',
    name: 'Real-ESRGAN General x4 v3',
    fileName: 'realesr-general-x4v3.onnx',
    sizeBytes: 4866417, // 4.64 MB
    upstreamUrl:
      'https://huggingface.co/CoderViking/realesr-general-x4v3-onnx/resolve/main/realesr-general-x4v3.onnx',
    localDevPath: '/models/realesr-general-x4v3.onnx',
  },
};

/**
 * Resolves the primary URL and fallback URLs for a given model.
 *
 * Priority order:
 * 1. Dedicated env variable (e.g. VITE_LAMA_MODEL_URL)
 * 2. Models base URL (e.g. VITE_MODELS_BASE_URL + '/models/lama_fp32.onnx')
 * 3. Local dev path (/models/lama_fp32.onnx served by Vite during dev)
 * 4. Reliable public CDN / upstream mirror
 *
 * @param {'lama' | 'realesrgan'} modelKey
 * @returns {{ primaryUrl: string, fallbackUrls: string[], spec: typeof MODEL_SPECS[keyof typeof MODEL_SPECS] }}
 */
export function getModelConfig(modelKey) {
  const spec = MODEL_SPECS[modelKey];
  if (!spec) {
    throw new Error(`Unknown model key: ${modelKey}`);
  }

  const urls = [];

  // 1. Specific explicit environment URL
  if (modelKey === 'lama' && env.lamaModelUrl) {
    urls.push(env.lamaModelUrl);
  } else if (modelKey === 'realesrgan' && env.upscalerModelUrl) {
    urls.push(env.upscalerModelUrl);
  }

  // 2. Base URL (e.g. Cloudflare R2 bucket: https://models.webtoolocean.com or https://pub-xxx.r2.dev)
  if (env.modelsBaseUrl) {
    urls.push(`${env.modelsBaseUrl}/models/${spec.fileName}`);
    urls.push(`${env.modelsBaseUrl}/${spec.fileName}`);
  }

  // 3. Local path vs Upstream CDN
  // In development, prioritize local dev path served by Vite.
  // In production, lama_fp32.onnx is deliberately excluded from dist/ (>25 MiB Cloudflare limit),
  // so prioritize upstream CDN if no R2 URL was configured, keeping local path as final fallback.
  if (env.isDev || modelKey !== 'lama') {
    urls.push(spec.localDevPath);
    if (spec.upstreamUrl) {
      urls.push(spec.upstreamUrl);
    }
  } else {
    if (spec.upstreamUrl) {
      urls.push(spec.upstreamUrl);
    }
    urls.push(spec.localDevPath);
  }

  // Deduplicate URLs while preserving order
  const uniqueUrls = [...new Set(urls.filter(Boolean))];

  return {
    primaryUrl: uniqueUrls[0],
    fallbackUrls: uniqueUrls.slice(1),
    spec,
  };
}

export default getModelConfig;
