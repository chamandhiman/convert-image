/**
 * Deterministic, explainable image readiness estimation.
 *
 * Evaluates how suitable an image is for a chosen destination based on
 * measurable properties (dimensions, file size, format efficiency).
 */

export const USE_CASES = [
  { id: 'website', label: 'Website', desc: 'Fast loading & mobile performance' },
  { id: 'email', label: 'Email', desc: 'Lightweight & universal email client compatibility' },
  { id: 'social', label: 'Social Media', desc: 'Crisp display without platform compression mangling' },
  { id: 'print', label: 'Print', desc: 'High pixel density & physical print detail' },
  { id: 'messaging', label: 'Messaging', desc: 'Compact file for instant chat sharing' },
  { id: 'general', label: 'General Use', desc: 'Everyday viewing and archival' },
];

/**
 * Calculate readiness score and transparent breakdown factors.
 *
 * @param {object} analysis Output from analyzeImage
 * @param {string} goalId One of USE_CASES ids
 * @returns {object} Score and factors breakdown
 */
export function calculateReadinessScore(analysis, goalId = 'website') {
  const { file, dimensions, format, characteristics } = analysis;
  const { width, height, megapixels } = dimensions;
  const maxDim = Math.max(width, height);
  const sizeBytes = file.sizeBytes;
  const isLosslessPng = format.name === 'PNG';

  const factors = [];
  let score = 0;

  switch (goalId) {
    case 'website': {
      // 1. Dimensions (30 max)
      if (maxDim <= 1920) {
        score += 30;
        factors.push({
          name: 'Dimensions',
          status: 'pass',
          message: `${width} × ${height} px fits standard web layouts cleanly.`,
        });
      } else if (maxDim <= 2560) {
        score += 20;
        factors.push({
          name: 'Dimensions',
          status: 'caution',
          message: `${maxDim}px wide is larger than needed for most website containers.`,
        });
      } else {
        score += 10;
        factors.push({
          name: 'Dimensions',
          status: 'caution',
          message: `${maxDim}px wide is unnecessarily large for web delivery.`,
        });
      }

      // 2. File Size (40 max)
      if (sizeBytes <= 350 * 1024) {
        score += 40;
        factors.push({
          name: 'File size',
          status: 'pass',
          message: `${file.sizeFormatted} loads quickly on desktop and mobile networks.`,
        });
      } else if (sizeBytes <= 1.2 * 1024 * 1024) {
        score += 25;
        factors.push({
          name: 'File size',
          status: 'caution',
          message: `${file.sizeFormatted} may slow mobile loading and Core Web Vitals.`,
        });
      } else {
        score += 10;
        factors.push({
          name: 'File size',
          status: 'fail',
          message: `${file.sizeFormatted} is heavy for typical website use.`,
        });
      }

      // 3. Format Efficiency (30 max)
      if (format.name === 'WebP' || format.name === 'AVIF') {
        score += 30;
        factors.push({
          name: 'Format',
          status: 'pass',
          message: `${format.name} is a modern, high-efficiency web format.`,
        });
      } else if (format.name === 'JPEG') {
        score += 24;
        factors.push({
          name: 'Format',
          status: 'pass',
          message: 'JPEG has universal browser support. WebP could reduce size further.',
        });
      } else if (isLosslessPng && characteristics.hasTransparency) {
        score += 20;
        factors.push({
          name: 'Format',
          status: 'pass',
          message: 'PNG preserves required transparency. WebP supports transparency with smaller files.',
        });
      } else {
        score += 12;
        factors.push({
          name: 'Format',
          status: 'caution',
          message: 'PNG without transparency is unnecessarily heavy compared to WebP or JPEG.',
        });
      }
      break;
    }

    case 'email': {
      // 1. Dimensions (35 max)
      if (maxDim <= 1200) {
        score += 35;
        factors.push({
          name: 'Dimensions',
          status: 'pass',
          message: `${width} × ${height} px displays properly in email message bodies.`,
        });
      } else {
        score += 15;
        factors.push({
          name: 'Dimensions',
          status: 'caution',
          message: `${maxDim}px exceeds standard email container widths (600–1200px).`,
        });
      }

      // 2. File Size (40 max)
      if (sizeBytes <= 300 * 1024) {
        score += 40;
        factors.push({
          name: 'File size',
          status: 'pass',
          message: `${file.sizeFormatted} is lightweight and avoids inbox clipping.`,
        });
      } else if (sizeBytes <= 1024 * 1024) {
        score += 22;
        factors.push({
          name: 'File size',
          status: 'caution',
          message: `${file.sizeFormatted} is slightly heavy for email newsletters.`,
        });
      } else {
        score += 5;
        factors.push({
          name: 'File size',
          status: 'fail',
          message: `${file.sizeFormatted} risks exceeding email client and attachment limits.`,
        });
      }

      // 3. Format (25 max)
      if (format.name === 'JPEG') {
        score += 25;
        factors.push({
          name: 'Format',
          status: 'pass',
          message: 'JPEG is supported by 100% of corporate and mobile email clients.',
        });
      } else if (format.name === 'PNG') {
        score += 20;
        factors.push({
          name: 'Format',
          status: 'pass',
          message: 'PNG has strong email support, though JPEG often provides lighter files.',
        });
      } else {
        score += 10;
        factors.push({
          name: 'Format',
          status: 'caution',
          message: `${format.name} is not universally supported in older desktop email apps (e.g. Outlook).`,
        });
      }
      break;
    }

    case 'print': {
      // 1. Resolution / Pixel Count (50 max)
      if (megapixels >= 8) {
        score += 50;
        factors.push({
          name: 'Resolution',
          status: 'pass',
          message: `${megapixels} MP provides sufficient pixel density for sharp 300 DPI physical prints.`,
        });
      } else if (megapixels >= 3) {
        score += 35;
        factors.push({
          name: 'Resolution',
          status: 'pass',
          message: `${megapixels} MP is suitable for small to medium snapshot prints (4×6 to 5×7).`,
        });
      } else {
        score += 15;
        factors.push({
          name: 'Resolution',
          status: 'caution',
          message: `${megapixels} MP is relatively low for quality physical paper prints.`,
        });
      }

      // 2. Fidelity (30 max)
      if (format.name === 'PNG' || sizeBytes >= 2 * 1024 * 1024) {
        score += 30;
        factors.push({
          name: 'Fidelity',
          status: 'pass',
          message: 'High file detail preserved without excessive compression smearing.',
        });
      } else {
        score += 20;
        factors.push({
          name: 'Fidelity',
          status: 'pass',
          message: 'Acceptable detail for home printing.',
        });
      }

      // 3. Aspect Ratio (20 max)
      score += 20;
      factors.push({
        name: 'Dimensions',
        status: 'pass',
        message: `Native ${width} × ${height} px preserved.`,
      });
      break;
    }

    case 'social': {
      // 1. Dimensions (40 max)
      if (maxDim >= 1080 && maxDim <= 2048) {
        score += 40;
        factors.push({
          name: 'Dimensions',
          status: 'pass',
          message: `${width} × ${height} px matches standard HD/2K social feed dimensions.`,
        });
      } else if (maxDim > 2048) {
        score += 25;
        factors.push({
          name: 'Dimensions',
          status: 'caution',
          message: `${maxDim}px wide will trigger aggressive platform downscaling.`,
        });
      } else {
        score += 25;
        factors.push({
          name: 'Dimensions',
          status: 'caution',
          message: 'Image may appear slightly soft when expanded on high-density displays.',
        });
      }

      // 2. File Size (35 max)
      if (sizeBytes <= 2 * 1024 * 1024) {
        score += 35;
        factors.push({
          name: 'File size',
          status: 'pass',
          message: `${file.sizeFormatted} uploads quickly without triggering heavy network throttling.`,
        });
      } else {
        score += 20;
        factors.push({
          name: 'File size',
          status: 'caution',
          message: `${file.sizeFormatted} may be heavily compressed by platform upload algorithms.`,
        });
      }

      // 3. Format (25 max)
      score += 25;
      factors.push({
        name: 'Format',
        status: 'pass',
        message: `${format.name} is supported by major social platforms.`,
      });
      break;
    }

    case 'messaging': {
      // 1. File Size (45 max)
      if (sizeBytes <= 500 * 1024) {
        score += 45;
        factors.push({
          name: 'File size',
          status: 'pass',
          message: `${file.sizeFormatted} sends immediately even over mobile data.`,
        });
      } else if (sizeBytes <= 2 * 1024 * 1024) {
        score += 25;
        factors.push({
          name: 'File size',
          status: 'caution',
          message: `${file.sizeFormatted} is slightly large for fast chat sending.`,
        });
      } else {
        score += 10;
        factors.push({
          name: 'File size',
          status: 'fail',
          message: `${file.sizeFormatted} will take noticeable time to send and consume mobile data.`,
        });
      }

      // 2. Dimensions (35 max)
      if (maxDim <= 1280) {
        score += 35;
        factors.push({
          name: 'Dimensions',
          status: 'pass',
          message: `${width} × ${height} px fits mobile chat screens comfortably.`,
        });
      } else {
        score += 20;
        factors.push({
          name: 'Dimensions',
          status: 'caution',
          message: `${maxDim}px is larger than needed for casual phone viewing.`,
        });
      }

      // 3. Format (20 max)
      score += 20;
      factors.push({
        name: 'Format',
        status: 'pass',
        message: `${format.name} is supported across messaging apps.`,
      });
      break;
    }

    default: {
      // General evaluation
      score = 80;
      factors.push({
        name: 'General readiness',
        status: 'pass',
        message: `${width} × ${height} px (${file.sizeFormatted}) in ${format.name} container.`,
      });
      break;
    }
  }

  return {
    score: Math.min(100, Math.max(10, score)),
    label: 'Practical readiness estimate',
    factors,
  };
}
