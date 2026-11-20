/**
 * Dynamic format validation and metadata configuration for Convert Image page.
 *
 * Provides format detection, compatibility rules, dynamic accept attributes,
 * and dynamic helper texts per selected output format.
 */

export const OUTPUT_FORMAT_CONFIG = {
  'image/jpeg': {
    key: 'jpg',
    label: 'JPG',
    supportedText: 'Supports: PNG, WEBP, GIF, BMP, TIFF, HEIC',
    accept:
      '.png,.webp,.gif,.bmp,.tiff,.tif,.heic,.heif,.svg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/heic,image/svg+xml',
    altFormatsText: 'PNG, WEBP, GIF',
  },
  'image/png': {
    key: 'png',
    label: 'PNG',
    supportedText: 'Supports: JPG, JPEG, WEBP, GIF, BMP, TIFF, HEIC',
    accept:
      '.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.heic,.heif,.svg,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/heic,image/svg+xml',
    altFormatsText: 'JPG, WEBP, GIF',
  },
  'image/webp': {
    key: 'webp',
    label: 'WEBP',
    supportedText: 'Supports: JPG, JPEG, PNG, GIF, BMP, TIFF, HEIC',
    accept:
      '.jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.heic,.heif,.svg,image/jpeg,image/png,image/gif,image/bmp,image/tiff,image/heic,image/svg+xml',
    altFormatsText: 'JPG, PNG, GIF',
  },
  'image/gif': {
    key: 'gif',
    label: 'GIF',
    supportedText: 'Supports: JPG, JPEG, PNG, WEBP, BMP, TIFF, HEIC',
    accept:
      '.jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif,.heic,.heif,.svg,image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/heic,image/svg+xml',
    altFormatsText: 'JPG, PNG, WEBP',
  },
  'application/pdf': {
    key: 'pdf',
    label: 'PDF',
    supportedText: 'Supports: JPG, JPEG, PNG, WEBP, GIF, BMP, TIFF, HEIC',
    accept:
      '.jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff,.tif,.heic,.heif,.svg,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/heic,image/svg+xml',
    altFormatsText: 'JPG, PNG, WEBP, GIF',
  },
};

/**
 * Detect the canonical format of an uploaded File.
 *
 * @param {File|Blob|{name?: string, type?: string}} file
 * @returns {{ key: string, label: string }}
 */
export function detectFileFormat(file) {
  if (!file) return { key: 'other', label: 'IMAGE' };

  const name = file.name || '';
  const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  const type = (file.type || '').toLowerCase();

  // Treat JPG and JPEG as equivalent
  if (
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    ext === 'jpg' ||
    ext === 'jpeg' ||
    ext === 'jfif' ||
    ext === 'jpe'
  ) {
    return { key: 'jpg', label: 'JPG' };
  }
  if (type === 'image/png' || ext === 'png') {
    return { key: 'png', label: 'PNG' };
  }
  if (type === 'image/webp' || ext === 'webp') {
    return { key: 'webp', label: 'WEBP' };
  }
  if (type === 'image/gif' || ext === 'gif') {
    return { key: 'gif', label: 'GIF' };
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return { key: 'pdf', label: 'PDF' };
  }
  if (type === 'image/bmp' || ext === 'bmp') {
    return { key: 'bmp', label: 'BMP' };
  }
  if (type === 'image/tiff' || ext === 'tiff' || ext === 'tif') {
    return { key: 'tiff', label: 'TIFF' };
  }
  if (
    type === 'image/heic' ||
    type === 'image/heif' ||
    ext === 'heic' ||
    ext === 'heif'
  ) {
    return { key: 'heic', label: 'HEIC' };
  }
  if (type === 'image/svg+xml' || ext === 'svg') {
    return { key: 'svg', label: 'SVG' };
  }

  return { key: ext || 'other', label: ext ? ext.toUpperCase() : 'IMAGE' };
}

/**
 * Check whether a file can be converted to targetOutputMime.
 *
 * @param {File} file
 * @param {string} targetOutputMime
 * @returns {{
 *   compatible: boolean,
 *   detectedKey: string,
 *   detectedLabel: string,
 *   targetKey: string,
 *   targetLabel: string,
 *   reason: string,
 *   errorMessage: string
 * }}
 */
export function checkFileCompatibility(file, targetOutputMime) {
  const targetConfig =
    OUTPUT_FORMAT_CONFIG[targetOutputMime] || OUTPUT_FORMAT_CONFIG['image/jpeg'];
  const detected = detectFileFormat(file);

  const isSameFormat = detected.key === targetConfig.key;

  if (isSameFormat) {
    return {
      compatible: false,
      detectedKey: detected.key,
      detectedLabel: detected.label,
      targetKey: targetConfig.key,
      targetLabel: targetConfig.label,
      reason: `Skipped: Already ${targetConfig.label}`,
      errorMessage: `${targetConfig.label} is already the selected format. Please upload ${targetConfig.altFormatsText} or another supported format.`,
    };
  }

  return {
    compatible: true,
    detectedKey: detected.key,
    detectedLabel: detected.label,
    targetKey: targetConfig.key,
    targetLabel: targetConfig.label,
    reason: '',
    errorMessage: '',
  };
}

/**
 * Get dynamic upload helper text for the specified output format.
 *
 * @param {string} outputMime
 * @returns {string}
 */
export function getSupportedTextForFormat(outputMime) {
  const cfg = OUTPUT_FORMAT_CONFIG[outputMime] || OUTPUT_FORMAT_CONFIG['image/jpeg'];
  return cfg.supportedText;
}

/**
 * Get dynamic accept attribute string for file inputs.
 *
 * @param {string} outputMime
 * @returns {string}
 */
export function getAcceptStringForFormat(outputMime) {
  const cfg = OUTPUT_FORMAT_CONFIG[outputMime] || OUTPUT_FORMAT_CONFIG['image/jpeg'];
  return cfg.accept;
}

