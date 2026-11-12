/**
 * Environment configuration.
 *
 * Vite only exposes variables prefixed with `VITE_` to client code. Read them
 * here once so the rest of the app never touches `import.meta.env` directly —
 * that keeps defaults in a single place and makes missing values obvious.
 */

const raw = import.meta.env;

/** Trim a trailing slash so URL joining stays predictable. */
const stripTrailingSlash = (value) => value.replace(/\/+$/, '');

export const env = {
  /** 'development' | 'production' | custom mode passed to Vite. */
  mode: raw.MODE,
  isDev: raw.DEV,
  isProd: raw.PROD,

  /** Public origin the app is served from, no trailing slash. */
  siteUrl: stripTrailingSlash(raw.VITE_SITE_URL ?? 'http://localhost:5173'),

  /** Base path the router mounts on. Matches `base` in vite.config.js. */
  basePath: raw.BASE_URL ?? '/',

  /** Optional analytics/telemetry ids — absent until wired up. */
  analyticsId: raw.VITE_ANALYTICS_ID ?? 'G-4C1PP726EZ',

  /**
   * Base URL for external model hosting (e.g. Cloudflare R2 bucket or custom CDN domain).
   * Example: 'https://models.webtoolocean.com' or 'https://pub-c2a4f4d2f09d4350a416ea05b4a0ca87.r2.dev'
   */
  modelsBaseUrl: raw.VITE_MODELS_BASE_URL ? stripTrailingSlash(raw.VITE_MODELS_BASE_URL) : '',

  /**
   * Specific URL for LaMa inpainting ONNX model (198.4 MB).
   */
  lamaModelUrl: raw.VITE_LAMA_MODEL_URL ? stripTrailingSlash(raw.VITE_LAMA_MODEL_URL) : '',

  /**
   * Specific URL for Real-ESRGAN restoration/upscaler ONNX model (4.6 MB).
   */
  upscalerModelUrl: raw.VITE_UPSCALER_MODEL_URL ? stripTrailingSlash(raw.VITE_UPSCALER_MODEL_URL) : '',
};

export default env;
