/**
 * Helpers for advanced image resizing, property detection, and size estimation.
 */

/**
 * Calculate greatest common divisor (GCD) using Euclid's algorithm.
 */
export function gcd(a, b) {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Return a clean, human-readable aspect ratio label.
 * Detects common photographic & digital standards (16:9, 4:3, 1:1, 9:16, 3:2, 4:5, 2:1).
 */
export function getAspectRatioLabel(width, height) {
  if (!width || !height || width <= 0 || height <= 0) return '1:1';
  const ratio = width / height;

  if (Math.abs(ratio - 16 / 9) < 0.025) return '16:9 (Widescreen)';
  if (Math.abs(ratio - 9 / 16) < 0.025) return '9:16 (Vertical Story)';
  if (Math.abs(ratio - 4 / 3) < 0.02) return '4:3 (Standard)';
  if (Math.abs(ratio - 3 / 4) < 0.02) return '3:4 (Portrait)';
  if (Math.abs(ratio - 1) < 0.015) return '1:1 (Square)';
  if (Math.abs(ratio - 3 / 2) < 0.02) return '3:2 (Classic 35mm)';
  if (Math.abs(ratio - 2 / 3) < 0.02) return '2:3 (Portrait 35mm)';
  if (Math.abs(ratio - 4 / 5) < 0.02) return '4:5 (Instagram Portrait)';
  if (Math.abs(ratio - 2 / 1) < 0.02) return '2:1 (Banner)';

  const divisor = gcd(width, height);
  const rw = Math.round(width / divisor);
  const rh = Math.round(height / divisor);

  if (rw <= 24 && rh <= 24) {
    return `${rw}:${rh}`;
  }
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Detect color mode and transparency from an HTMLImageElement using canvas sampling.
 */
export function detectColorModeAndAlpha(img) {
  if (!img || !img.width || !img.height) return 'RGB (24-bit)';
  try {
    const sampleW = Math.min(img.width, 100);
    const sampleH = Math.min(img.height, 100);
    const canvas = document.createElement('canvas');
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 'RGB (24-bit)';

    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

    let hasAlpha = false;
    for (let i = 3; i < imgData.length; i += 4) {
      if (imgData[i] < 255) {
        hasAlpha = true;
        break;
      }
    }

    if (hasAlpha) {
      return 'RGBA (32-bit Transparent)';
    }
    return 'RGB (24-bit Truecolor)';
  } catch {
    return 'RGB (24-bit)';
  }
}

/**
 * Calculate realistic estimated output file size based on pixel ratio, format, and quality.
 * Clearly returns estimated byte count and formatted string.
 */
export function calculateEstimatedSize({
  originalSize,
  origWidth,
  origHeight,
  newWidth,
  newHeight,
  outputFormat = 'original',
  origType = 'image/jpeg',
  quality = 85,
}) {
  if (!originalSize || !origWidth || !origHeight || !newWidth || !newHeight) {
    return null;
  }

  const origPixels = origWidth * origHeight;
  const newPixels = newWidth * newHeight;
  if (origPixels <= 0 || newPixels <= 0) return null;

  const pixelRatio = newPixels / origPixels;
  const targetFormat = outputFormat === 'original' ? origType : outputFormat;

  // Format compression efficiency factor relative to source
  let formatFactor = 1.0;
  if (targetFormat === 'image/webp') {
    formatFactor = origType === 'image/webp' ? 1.0 : 0.72;
  } else if (targetFormat === 'image/jpeg') {
    formatFactor = origType === 'image/png' ? 0.45 : (origType === 'image/webp' ? 1.25 : 1.0);
  } else if (targetFormat === 'image/png') {
    formatFactor = origType === 'image/jpeg' ? 2.1 : (origType === 'image/webp' ? 2.4 : 1.0);
  } else if (targetFormat === 'image/avif') {
    formatFactor = 0.55;
  }

  // Quality scaling for lossy formats
  let qualityFactor = 1.0;
  if (targetFormat !== 'image/png') {
    // 85% is baseline reference (1.0)
    qualityFactor = Math.pow(Math.max(10, quality) / 85, 1.15);
  }

  // File size scales sublinearly with pixel count (~0.88 power law due to header & entropy)
  const estimatedBytes = Math.round(
    originalSize * Math.pow(pixelRatio, 0.88) * formatFactor * qualityFactor
  );

  return Math.max(800, estimatedBytes);
}

/**
 * Standard dimension presets for social, web, and device viewports.
 */
export const DIMENSION_PRESETS = [
  { label: 'Full HD', width: 1920, height: 1080, ratio: '16:9' },
  { label: 'HD 720p', width: 1280, height: 720, ratio: '16:9' },
  { label: 'Instagram Square', width: 1080, height: 1080, ratio: '1:1' },
  { label: 'Instagram Portrait', width: 1080, height: 1350, ratio: '4:5' },
  { label: 'Story / Reel', width: 1080, height: 1920, ratio: '9:16' },
  { label: 'Standard Web', width: 800, height: 600, ratio: '4:3' },
];

/**
 * Standard percentage scaling presets.
 */
export const PERCENTAGE_PRESETS = [25, 50, 75, 100, 150, 200];

/**
 * Quick quality presets.
 */
export const QUALITY_PRESETS = [
  { label: 'Low', value: 60 },
  { label: 'Medium', value: 75 },
  { label: 'High', value: 85 },
  { label: 'Best', value: 95 },
];

