/**
 * Route path constants.
 *
 * Every `<Link to>` / `navigate()` call should reference a value from here so a
 * URL change is a one-line edit instead of a project-wide find-and-replace.
 *
 * Follows descriptive, keyword-rich SEO naming conventions (lowercase, hyphen-separated).
 */

export const ROUTES = {
  home: '/',

  // Canonical SEO-friendly tool routes
  edit: '/edit-image',
  convert: '/convert-image',
  resize: '/resize-image',
  compress: '/compress-image',
  crop: '/crop-image',
  rotate: '/rotate-image',
  jpgToPng: '/jpg-to-png',
  pngToJpg: '/png-to-jpg',
  imageToWebp: '/image-to-webp',
  removeBackground: '/remove-background',
  photoRestorer: '/photo-restorer',
  upscaler: '/image-upscaler',
  objectRemover: '/object-remover',
  imageExtender: '/image-extender',
  generativeFill: '/generative-fill',
  optimize: '/optimize-image',
  clean: '/remove-image-metadata',
  analyze: '/analyze-image',

  // Informational & legal routes
  licenses: '/licenses',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  contact: '/contact',
  notFound: '*',

  // Legacy URLs for permanent redirects (301-equivalent)
  editOld: '/edit',
  convertOld: '/convert',
  resizeOld: '/resize',
  compressOld: '/compress',
  cropOld: '/crop',
  rotateOld: '/rotate',
  optimizeOld: '/optimize',
  cleanOld: '/clean',
  analyzeOld: '/analyze',
};

export default ROUTES;
