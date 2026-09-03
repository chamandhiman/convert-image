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
  analyticsId: raw.VITE_ANALYTICS_ID ?? '',
};

export default env;
