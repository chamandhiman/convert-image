/**
 * Route path constants.
 *
 * Every `<Link to>` / `navigate()` call should reference a value from here so a
 * URL change is a one-line edit instead of a project-wide find-and-replace.
 */

export const ROUTES = {
  home: '/',
  removeBackground: '/remove-background',
  objectRemover: '/object-remover',
  upscaler: '/image-upscaler',
  imageExtender: '/image-extender',
  photoRestorer: '/photo-restorer',
  generativeFill: '/generative-fill',
  compress: '/compress',
  convert: '/convert',
  resize: '/resize',
  optimize: '/optimize',
  clean: '/clean',
  analyze: '/analyze',
  licenses: '/licenses',
  notFound: '*',
};

export default ROUTES;
