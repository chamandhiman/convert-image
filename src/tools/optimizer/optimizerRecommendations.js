import { OPTIMIZER_GOALS } from './optimizerPresets.js';
import { ALL_OUTPUT_FORMATS } from '../../utils/imageProcessor.js';

/**
 * Deterministically compute the recommended optimization settings based on
 * image metadata and the user's selected use case.
 *
 * @param {object} meta
 * @param {number} meta.width
 * @param {number} meta.height
 * @param {number} meta.size
 * @param {string} meta.type
 * @param {string} [meta.name]
 * @param {boolean} [meta.isSvg]
 * @param {string} goalId
 * @param {object} [overrides={}]
 * @returns {object} Recommendation object with format, quality, dimensions, notices, and estimates.
 */
export function getOptimizationRecommendation(meta, goalId, overrides = {}) {
  const goal = OPTIMIZER_GOALS.find((g) => g.id === goalId) || OPTIMIZER_GOALS[0];

  const origWidth = meta.width || 800;
  const origHeight = meta.height || 800;
  const origSize = meta.size || 0;
  const origType = meta.type || 'image/jpeg';

  // 1. Output Format Selection
  let recommendedFormat = goal.preferredFormat;
  if (recommendedFormat === 'keep') {
    // If source is SVG, keep implies lossless rasterization to PNG
    recommendedFormat = meta.isSvg ? 'image/png' : origType;
  }

  // Allow manual override if specified in advanced settings
  const targetFormat =
    overrides.format && overrides.format !== 'auto' ? overrides.format : recommendedFormat;

  // 2. Dimension Calculation
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  const maxAllowedWidth = overrides.maxWidth || goal.maxWidth;
  const maxAllowedHeight = overrides.maxHeight || null;

  if (maxAllowedWidth && origWidth > maxAllowedWidth) {
    const scale = maxAllowedWidth / origWidth;
    targetWidth = Math.round(maxAllowedWidth);
    targetHeight = Math.max(1, Math.round(origHeight * scale));
  }

  if (maxAllowedHeight && targetHeight > maxAllowedHeight) {
    const scale = maxAllowedHeight / targetHeight;
    targetHeight = Math.round(maxAllowedHeight);
    targetWidth = Math.max(1, Math.round(targetWidth * scale));
  }

  // 3. Quality Selection
  const isTargetLossless = targetFormat === 'image/png';
  let targetQuality = overrides.quality !== undefined ? overrides.quality : goal.defaultQuality;

  // If already a very small image (< 100 KB), avoid overly aggressive compression
  if (!overrides.quality && origSize < 100 * 1024 && targetQuality < 80) {
    targetQuality = Math.min(84, targetQuality + 5);
  }

  // 4. Expected Size Estimation (Conservative heuristic, labeled as estimate)
  let bytesPerPixel = 0.12; // default WebP / moderate JPEG
  if (targetFormat === 'image/png') {
    bytesPerPixel = 0.7;
  } else if (targetFormat === 'image/webp') {
    bytesPerPixel = targetQuality > 85 ? 0.15 : 0.09;
  } else if (targetFormat === 'image/jpeg') {
    bytesPerPixel = targetQuality > 85 ? 0.18 : 0.12;
  } else if (targetFormat === 'image/avif') {
    bytesPerPixel = 0.08;
  }

  const rawEstimatedBytes = Math.round(targetWidth * targetHeight * bytesPerPixel);
  // Estimate should generally not exceed original size if downscaling
  const estimatedBytes = Math.max(
    1024,
    Math.min(origSize > 0 ? Math.round(origSize * 1.1) : 500000, rawEstimatedBytes),
  );

  // 5. Notices and Warnings
  const notices = [];

  const isAlreadySmall = origSize > 0 && origSize < 80 * 1024 && origWidth <= 1200;
  if (isAlreadySmall) {
    notices.push({
      type: 'info',
      message: 'This image is already quite small. Optimization may produce modest savings.',
    });
  }

  if (targetFormat === 'image/png' && !meta.isSvg) {
    notices.push({
      type: 'neutral',
      message: 'PNG is a lossless format. Quality controls do not apply, and output may be larger than WebP or JPG.',
    });
  }

  if (meta.isSvg) {
    notices.push({
      type: 'info',
      message: 'Vector SVG will be rasterized to high-density pixels.',
    });
  }

  if (targetFormat === 'image/jpeg' && origType !== 'image/jpeg') {
    notices.push({
      type: 'neutral',
      message: 'Transparent backgrounds will be filled with clean white for JPEG compatibility.',
    });
  }

  return {
    goalId: goal.id,
    goalLabel: goal.label,
    goalSummary: goal.summary,
    goalRationale: goal.rationale,
    targetFormat,
    isTargetLossless,
    targetQuality,
    targetWidth,
    targetHeight,
    hasDimensionChange: targetWidth !== origWidth || targetHeight !== origHeight,
    estimatedBytes,
    notices,
    isAlreadySmall,
  };
}

/**
 * Build a descriptive output filename for optimized images (e.g. photo-optimized.webp).
 *
 * @param {string} originalName
 * @param {string} outputType
 * @param {string} [goalId='optimized']
 * @returns {string}
 */
export function buildOptimizedFilename(originalName, outputType, goalId = 'optimized') {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const format = ALL_OUTPUT_FORMATS.find((f) => f.value === outputType);
  const ext = format?.extension ?? '.webp';
  const suffix = goalId === 'website' ? 'web' : goalId;
  return `${base}-${suffix}${ext}`;
}
