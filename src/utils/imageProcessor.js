/**
 * Client-side image processing via Canvas API.
 *
 * Every function runs entirely in the browser — no uploads, no servers, no
 * third-party services. The Canvas API supports quality parameters for JPEG,
 * WebP, and AVIF (where supported); PNG is always lossless.
 */

/** All potential output formats supported by modern browsers. */
export const ALL_OUTPUT_FORMATS = [
  { value: 'image/jpeg', label: 'JPG', extension: '.jpg', lossy: true },
  { value: 'image/png', label: 'PNG', extension: '.png', lossy: false },
  { value: 'image/webp', label: 'WebP', extension: '.webp', lossy: true },
  { value: 'image/avif', label: 'AVIF', extension: '.avif', lossy: true },
];

/** Default output formats for compression (JPG, PNG, WebP). */
export const OUTPUT_FORMATS = ALL_OUTPUT_FORMATS.slice(0, 3);

/** Input formats supported by conversion and resizing tools. */
export const CONVERT_INPUT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
];

export const CONVERT_ACCEPT_STRING = '.jpg,.jpeg,.png,.webp,.avif,.gif,.svg';

/** Input formats supported by the compressor tool. */
export const ACCEPTED_INPUT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const ACCEPT_STRING = '.jpg,.jpeg,.png,.webp,.avif';

/** Maximum file size we will attempt to process (50 MB). */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Maximum dimension allowed for Canvas processing (16,384 pixels). */
export const MAX_CANVAS_DIMENSION = 16384;

/** Maximum total pixel count allowed for Canvas processing (100 megapixels). */
export const MAX_CANVAS_PIXELS = 100000000;

/**
 * Detect browser encoding support for a specific MIME type.
 *
 * Browsers fall back to image/png in canvas.toDataURL when an encoding MIME
 * type is unsupported.
 *
 * @param {string} mimeType
 * @returns {boolean}
 */
export function isFormatEncodingSupported(mimeType) {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL(mimeType);
    return typeof dataUrl === 'string' && dataUrl.startsWith(`data:${mimeType}`);
  } catch {
    return false;
  }
}

/**
 * Get list of output formats with browser support status.
 *
 * @returns {Array<{ value: string, label: string, extension: string, lossy: boolean, isSupported: boolean }>}
 */
export function getSupportedOutputFormats() {
  return ALL_OUTPUT_FORMATS.map((fmt) => {
    if (fmt.value === 'image/jpeg' || fmt.value === 'image/png') {
      return { ...fmt, isSupported: true };
    }
    const isSupported = isFormatEncodingSupported(fmt.value);
    return {
      ...fmt,
      isSupported,
      label: isSupported ? fmt.label : `${fmt.label} (Not supported in this browser)`,
    };
  });
}

/**
 * Get a clean, human-readable format label from a MIME type or filename.
 *
 * @param {string} mimeType
 * @param {string} [filename='']
 * @returns {string} e.g. "JPG", "PNG", "WebP", "AVIF", "GIF", "SVG"
 */
export function getFormatLabel(mimeType, filename = '') {
  switch (mimeType) {
    case 'image/jpeg':
      return 'JPG';
    case 'image/png':
      return 'PNG';
    case 'image/webp':
      return 'WebP';
    case 'image/avif':
      return 'AVIF';
    case 'image/gif':
      return 'GIF';
    case 'image/svg+xml':
      return 'SVG';
    default: {
      const match = filename.match(/\.([a-zA-Z0-9]+)$/);
      return match ? match[1].toUpperCase() : 'IMAGE';
    }
  }
}

/**
 * Load a File or Blob as an HTMLImageElement.
 * Safely parses SVG viewBox or dimensions when width/height attributes are missing.
 *
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      if (file.type === 'image/svg+xml' && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
        try {
          const text = await file.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'image/svg+xml');
          const svgEl = doc.querySelector('svg');
          if (svgEl) {
            const viewBox = svgEl.getAttribute('viewBox');
            let w = parseFloat(svgEl.getAttribute('width'));
            let h = parseFloat(svgEl.getAttribute('height'));
            if ((!w || !h) && viewBox) {
              const parts = viewBox.trim().split(/[\s,]+/).map(Number);
              if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                w = parts[2];
                h = parts[3];
              }
            }
            if (!w || !h) {
              w = 800;
              h = 800;
            }
            img._overrideWidth = Math.round(w);
            img._overrideHeight = Math.round(h);
          }
        } catch {
          img._overrideWidth = 800;
          img._overrideHeight = 800;
        }
      }
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          'The selected file could not be loaded as an image. It may be corrupted or in an unsupported format.',
        ),
      );
    };

    img.src = url;
  });
}

/**
 * Read basic metadata from a loaded image and its source File.
 *
 * @param {HTMLImageElement} img
 * @param {File} file
 * @returns {{ name: string, type: string, size: number, width: number, height: number, isSvg: boolean }}
 */
export function getImageMeta(img, file) {
  // Gracefully handle (file) as single arg, (img, file) as pair, or (img) as single arg
  const f =
    file ||
    (img instanceof Blob || (img && typeof img === 'object' && 'name' in img && 'size' in img)
      ? img
      : null);
  const image =
    img instanceof HTMLImageElement || (img && 'naturalWidth' in img)
      ? img
      : null;

  const width = image?._overrideWidth || image?.naturalWidth || image?.width || 0;
  const height = image?._overrideHeight || image?.naturalHeight || image?.height || 0;

  const fileName = f?.name || 'image';
  const fileType = f?.type || '';
  const isSvg = fileType === 'image/svg+xml' || fileName.toLowerCase().endsWith('.svg');

  return {
    name: fileName,
    type: fileType || (isSvg ? 'image/svg+xml' : 'image/jpeg'),
    size: f?.size || 0,
    width,
    height,
    isSvg,
  };
}

/** Alias for getImageMeta to satisfy naming conventions. */
export const getImageMetadata = getImageMeta;

/**
 * Calculate proportional dimensions when aspect ratio lock or percentage is used.
 *
 * @param {number} origWidth
 * @param {number} origHeight
 * @param {object} options
 * @param {'dimensions' | 'percentage'} [options.mode='dimensions']
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @param {number} [options.percentage=100]
 * @param {boolean} [options.lockAspectRatio=true]
 * @param {'width' | 'height'} [options.changedField='width']
 * @returns {{ width: number, height: number }}
 */
export function calculateDimensions(
  origWidth,
  origHeight,
  {
    mode = 'dimensions',
    width,
    height,
    percentage = 100,
    lockAspectRatio = true,
    changedField = 'width',
  } = {},
) {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: 1, height: 1 };
  }

  if (mode === 'percentage') {
    const scale = Math.max(1, percentage) / 100;
    return {
      width: Math.max(1, Math.round(origWidth * scale)),
      height: Math.max(1, Math.round(origHeight * scale)),
    };
  }

  // Dimension mode
  let targetWidth = width !== undefined && width !== null ? Math.round(width) : origWidth;
  let targetHeight = height !== undefined && height !== null ? Math.round(height) : origHeight;

  if (lockAspectRatio) {
    const aspectRatio = origWidth / origHeight;
    if (changedField === 'width') {
      targetHeight = Math.max(1, Math.round(targetWidth / aspectRatio));
    } else {
      targetWidth = Math.max(1, Math.round(targetHeight * aspectRatio));
    }
  }

  return {
    width: Math.max(1, targetWidth),
    height: Math.max(1, targetHeight),
  };
}

/**
 * Draw an image onto a Canvas with optional dimension scaling and format encoding.
 *
 * @param {HTMLImageElement} img
 * @param {object} options
 * @param {string} [options.outputType='image/jpeg'] MIME type
 * @param {number} [options.quality=0.85] 0.1–1.0
 * @param {number} [options.width] Target canvas width (defaults to image natural width)
 * @param {number} [options.height] Target canvas height (defaults to image natural height)
 * @returns {Promise<{ blob: Blob, url: string, width: number, height: number, outputType: string }>}
 */
function processCanvas(
  img,
  { outputType = 'image/jpeg', quality = 0.85, width: targetWidth, height: targetHeight } = {},
) {
  return new Promise((resolve, reject) => {
    try {
      const width = Math.round(targetWidth || img._overrideWidth || img.naturalWidth || 800);
      const height = Math.round(targetHeight || img._overrideHeight || img.naturalHeight || 800);

      if (width <= 0 || height <= 0) {
        reject(new Error('Dimensions must be greater than 0 pixels.'));
        return;
      }

      if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
        reject(
          new Error(
            `Dimensions exceed the maximum limit of ${MAX_CANVAS_DIMENSION.toLocaleString()} pixels.`,
          ),
        );
        return;
      }

      if (width * height > MAX_CANVAS_PIXELS) {
        reject(
          new Error(
            `Total image resolution exceeds the maximum safe canvas limit of 100 megapixels.`,
          ),
        );
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context is not available in this browser.'));
        return;
      }

      // Configure high-quality bicubic/bilinear image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background for JPEG so transparent pixels do not turn black
      if (outputType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                `Your browser could not encode the image as ${outputType}. Please try another format.`,
              ),
            );
            return;
          }

          if (outputType !== 'image/png' && blob.type === 'image/png') {
            const formatName = getFormatLabel(outputType);
            reject(
              new Error(
                `Your browser does not support encoding images to ${formatName}. Please select JPG, PNG, or WebP.`,
              ),
            );
            return;
          }

          const url = URL.createObjectURL(blob);
          resolve({
            blob,
            url,
            width: canvas.width,
            height: canvas.height,
            outputType: blob.type,
          });
        },
        outputType,
        quality,
      );
    } catch (err) {
      reject(
        new Error(
          err?.message ?? 'An unexpected error occurred during image processing.',
        ),
      );
    }
  });
}

/**
 * Compress an image via off-screen canvas.
 *
 * @param {HTMLImageElement} img
 * @param {object} options
 * @returns {Promise<{ blob: Blob, url: string, width: number, height: number, outputType: string }>}
 */
export function compressImage(img, options) {
  return processCanvas(img, options);
}

/**
 * Convert an image to another format via off-screen canvas.
 *
 * @param {HTMLImageElement} img
 * @param {object} options
 * @returns {Promise<{ blob: Blob, url: string, width: number, height: number, outputType: string }>}
 */
export function convertImage(img, options) {
  return processCanvas(img, options);
}

/**
 * Resize an image to specified dimensions with format and quality options.
 *
 * @param {HTMLImageElement} img
 * @param {object} options
 * @param {number} options.width Target width
 * @param {number} options.height Target height
 * @param {string} [options.outputType='image/jpeg']
 * @param {number} [options.quality=0.85]
 * @returns {Promise<{ blob: Blob, url: string, width: number, height: number, outputType: string }>}
 */
export function resizeImage(img, options) {
  return processCanvas(img, options);
}

/**
 * Build a download filename for compressed images (e.g. photo-compressed-q80.jpg).
 *
 * @param {string} originalName
 * @param {string} outputType
 * @param {number} quality
 * @returns {string}
 */
export function buildOutputFilename(originalName, outputType, quality) {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const format = ALL_OUTPUT_FORMATS.find((f) => f.value === outputType);
  const ext = format?.extension ?? '.jpg';
  const q = Math.round(quality * 100);
  return `${base}-compressed-q${q}${ext}`;
}

/**
 * Build a clean download filename for converted images (e.g. photo.webp).
 *
 * @param {string} originalName
 * @param {string} outputType
 * @returns {string}
 */
export function buildConvertedFilename(originalName, outputType) {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const format = ALL_OUTPUT_FORMATS.find((f) => f.value === outputType);
  const ext = format?.extension ?? '.jpg';
  return `${base}${ext}`;
}

/**
 * Build a descriptive download filename for resized images (e.g. photo-1200x800.jpg).
 *
 * @param {string} originalName
 * @param {string} outputType
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
export function buildResizedFilename(originalName, outputType, width, height) {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const format = ALL_OUTPUT_FORMATS.find((f) => f.value === outputType);
  const ext = format?.extension ?? '.jpg';
  return `${base}-${Math.round(width)}x${Math.round(height)}${ext}`;
}

/**
 * Trigger a browser download for a Blob.
 *
 * @param {Blob}   blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }, 100);
}
