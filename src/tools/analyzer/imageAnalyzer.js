import { formatFileSize } from '../../utils/formatFileSize.js';

/**
 * Common standard aspect ratios with tolerance for real-world pixel rounding.
 */
const KNOWN_RATIOS = [
  { name: '1:1 (Square)', ratio: 1.0 },
  { name: '4:3 (Standard photo)', ratio: 4 / 3 },
  { name: '3:4 (Portrait photo)', ratio: 3 / 4 },
  { name: '3:2 (Classic 35mm)', ratio: 3 / 2 },
  { name: '2:3 (Portrait 35mm)', ratio: 2 / 3 },
  { name: '16:9 (Widescreen / Banner)', ratio: 16 / 9 },
  { name: '9:16 (Vertical Story / Reel)', ratio: 9 / 16 },
  { name: '21:9 (Ultrawide)', ratio: 21 / 9 },
];

/**
 * Compute greatest common divisor for aspect ratio simplification.
 */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Determine aspect ratio label and formatted string.
 */
export function calculateAspectRatio(width, height) {
  if (!width || !height) return { ratioString: '1:1', ratioLabel: '1:1 (Square)', decimal: 1 };

  const decimal = width / height;

  // Check for known common ratios with 1.5% tolerance
  for (const known of KNOWN_RATIOS) {
    if (Math.abs(decimal - known.ratio) / known.ratio < 0.015) {
      return {
        ratioString: known.name.split(' ')[0],
        ratioLabel: known.name,
        decimal: Number(decimal.toFixed(2)),
      };
    }
  }

  // Simplified GCD ratio
  const divisor = gcd(width, height);
  const rw = Math.round(width / divisor);
  const rh = Math.round(height / divisor);

  if (rw <= 32 && rh <= 32) {
    return {
      ratioString: `${rw}:${rh}`,
      ratioLabel: `${rw}:${rh}`,
      decimal: Number(decimal.toFixed(2)),
    };
  }

  return {
    ratioString: `${decimal.toFixed(2)}:1`,
    ratioLabel: `${decimal.toFixed(2)}:1 (Custom)`,
    decimal: Number(decimal.toFixed(2)),
  };
}

/**
 * Detect whether an image contains any transparent or semi-transparent pixels.
 *
 * JPEGs never support alpha channels. For PNG, WebP, and GIF, we sample pixel
 * data from an offscreen Canvas.
 *
 * @param {HTMLImageElement} img
 * @param {string} mimeType
 * @returns {boolean}
 */
export function detectTransparency(img, mimeType = '') {
  if (mimeType === 'image/jpeg') return false;

  try {
    const canvas = document.createElement('canvas');
    // Sample grid up to 300x300 to balance speed and accuracy
    const sampleWidth = Math.min(img.naturalWidth || img.width, 300);
    const sampleHeight = Math.min(img.naturalHeight || img.height, 300);

    if (!sampleWidth || !sampleHeight) return false;

    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
    const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;

    // Check alpha channel (every 4th byte)
    for (let i = 3; i < imgData.length; i += 4) {
      if (imgData[i] < 255) {
        return true;
      }
    }
    return false;
  } catch {
    // If canvas reading is blocked (e.g. cross-origin), default to false
    return false;
  }
}

/**
 * Analyze an image and return measurable, deterministic technical properties.
 *
 * @param {File} file
 * @param {HTMLImageElement} img
 * @returns {object} Technical analysis result
 */
export function analyzeImage(file, img) {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const sizeBytes = file.size;
  const mimeType = file.type || '';
  const extension = (file.name.match(/\.[^.]+$/)?.[0] || '').toLowerCase();

  // 1. Dimensions & Density
  const megapixels = Number(((width * height) / 1000000).toFixed(1));
  const { ratioString, ratioLabel, decimal } = calculateAspectRatio(width, height);

  let orientation = 'landscape';
  if (width === height) orientation = 'square';
  else if (height > width) orientation = 'portrait';

  let resolutionLevel = 'standard';
  let resolutionDesc = 'Standard resolution';
  if (megapixels >= 12) {
    resolutionLevel = 'ultra_high';
    resolutionDesc = 'Ultra-high resolution (4K+ / Print ready)';
  } else if (megapixels >= 4) {
    resolutionLevel = 'high';
    resolutionDesc = 'High resolution (crisp on 2K/Retina)';
  } else if (megapixels < 0.5) {
    resolutionLevel = 'compact';
    resolutionDesc = 'Low / Thumbnail resolution';
  }

  // 2. File Size Assessment
  let sizeLevel = 'moderate';
  let sizeDesc = 'Moderate file size';
  if (sizeBytes < 150 * 1024) {
    sizeLevel = 'compact';
    sizeDesc = 'Small file size (fast to transmit)';
  } else if (sizeBytes > 5 * 1024 * 1024) {
    sizeLevel = 'very_large';
    sizeDesc = 'Very large file size (heavy for web or email)';
  } else if (sizeBytes > 1.5 * 1024 * 1024) {
    sizeLevel = 'large';
    sizeDesc = 'Relatively large file size';
  }

  // 3. Image Characteristics
  const hasTransparency = detectTransparency(img, mimeType);

  // 4. Format Characteristics
  let formatName = 'Unknown';
  let formatEfficiency = 'Standard';
  let isLossless = false;

  if (mimeType === 'image/jpeg' || extension === '.jpg' || extension === '.jpeg') {
    formatName = 'JPEG';
    formatEfficiency = 'Universal compatibility with lossy DCT compression.';
  } else if (mimeType === 'image/png' || extension === '.png') {
    formatName = 'PNG';
    isLossless = true;
    formatEfficiency = 'Lossless raster container with full alpha transparency support.';
  } else if (mimeType === 'image/webp' || extension === '.webp') {
    formatName = 'WebP';
    formatEfficiency = 'Modern web format with superior lossy and lossless compression.';
  } else if (mimeType === 'image/avif' || extension === '.avif') {
    formatName = 'AVIF';
    formatEfficiency = 'Next-generation container with high compression efficiency.';
  } else if (mimeType === 'image/gif' || extension === '.gif') {
    formatName = 'GIF';
    formatEfficiency = '8-bit indexed palette format.';
  } else if (mimeType === 'image/svg+xml' || extension === '.svg') {
    formatName = 'SVG';
    formatEfficiency = 'Scalable vector XML.';
  }

  return {
    file: {
      name: file.name,
      sizeBytes,
      sizeFormatted: formatFileSize(sizeBytes),
      sizeLevel,
      sizeDesc,
      mimeType,
      extension,
    },
    dimensions: {
      width,
      height,
      megapixels,
      orientation,
      aspectRatio: ratioString,
      aspectRatioLabel: ratioLabel,
      aspectRatioDecimal: decimal,
      resolutionLevel,
      resolutionDesc,
    },
    characteristics: {
      hasTransparency,
      isLossless,
    },
    format: {
      name: formatName,
      efficiencyDesc: formatEfficiency,
    },
  };
}
