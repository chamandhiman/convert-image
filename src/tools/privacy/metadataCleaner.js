import { convertImage, ALL_OUTPUT_FORMATS } from '../../utils/imageProcessor.js';
import { inspectImageMetadata } from './metadataInspector.js';

/**
 * Creates a clean copy of an image by rasterizing and re-encoding it via Canvas.
 *
 * This strips EXIF blocks, GPS data, camera serial numbers, author tags, and
 * creation timestamps that are not preserved by the browser's image encoding process.
 *
 * @param {HTMLImageElement} img
 * @param {object} options
 * @param {string} [options.outputType='image/jpeg'] Target MIME type
 * @param {number} [options.quality=0.9] Quality level for lossy formats
 * @returns {Promise<{ blob: Blob, url: string, width: number, height: number, outputType: string, postInspection: object }>}
 */
export async function cleanImageMetadata(img, { outputType = 'image/jpeg', quality = 0.9 } = {}) {
  // Canvas re-encoding at native dimensions
  const processed = await convertImage(img, {
    outputType,
    quality,
    width: img.naturalWidth,
    height: img.naturalHeight,
  });

  // Verify the newly created blob using the metadata inspector
  const postInspection = await inspectImageMetadata(processed.blob);

  return {
    ...processed,
    postInspection,
    verificationStatement:
      'Standard file headers only (image dimensions and color profile). Device, GPS, timestamp, and author metadata are not carried over.',
  };
}

/**
 * Build a clean filename for the privacy-cleaned image (e.g. photo-clean.jpg).
 *
 * @param {string} originalName
 * @param {string} outputType
 * @returns {string}
 */
export function buildCleanFilename(originalName, outputType) {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const format = ALL_OUTPUT_FORMATS.find((f) => f.value === outputType);
  const ext = format?.extension ?? '.jpg';
  return `${base}-clean${ext}`;
}
