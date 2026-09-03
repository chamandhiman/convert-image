import { ROUTES } from '../../routes/paths.js';

/**
 * Generate actionable, deterministic recommendations based on actual image measurements.
 *
 * @param {object} analysis Output from analyzeImage
 * @param {string} goalId Selected use-case ID
 * @returns {object} Recommendation and direct tool navigation paths
 */
export function getUseRecommendations(analysis, goalId = 'website') {
  const { file, dimensions, format, characteristics } = analysis;
  const { width, height } = dimensions;
  const maxDim = Math.max(width, height);
  const sizeBytes = file.sizeBytes;
  const isLosslessPng = format.name === 'PNG';

  let summary = '';
  let primaryAction = {
    label: 'Optimize Image',
    route: ROUTES.optimize,
    goal: goalId,
    reason: '',
  };
  const advice = [];
  const secondaryActions = [];

  switch (goalId) {
    case 'website': {
      if (sizeBytes <= 350 * 1024 && maxDim <= 1920 && (format.name === 'WebP' || format.name === 'AVIF')) {
        summary = 'Your image is already well-optimized for modern website delivery.';
        advice.push('File size is under 350 KB, suitable for fast mobile page loads.');
        advice.push('Dimensions fit standard web containers without unnecessary downscaling.');
        primaryAction = null;
      } else if (maxDim > 2000 || sizeBytes > 1.5 * 1024 * 1024) {
        summary = `Your image is ${width} × ${height} px and ${file.sizeFormatted}. That is more resolution and file weight than most websites need.`;
        advice.push('Downscaling to 1600–1920px wide will dramatically reduce loading time.');
        advice.push('Converting to WebP will save 25%–35% bandwidth over JPEG while keeping crisp detail.');
        primaryAction = {
          label: 'Optimize for Website',
          route: ROUTES.optimize,
          goal: 'website',
          reason: 'Scales to 1600px and converts to WebP at 82% quality.',
        };
      } else if (isLosslessPng && !characteristics.hasTransparency) {
        summary = `This PNG file (${file.sizeFormatted}) does not use transparency. Converting to WebP or JPEG will substantially cut file size.`;
        advice.push('PNG is lossless and creates larger files for photographic content.');
        primaryAction = {
          label: 'Convert to WebP',
          route: ROUTES.convert,
          goal: null,
          reason: 'Lossless to modern lossy web format.',
        };
      } else {
        summary = 'Image is reasonably sized, but light compression can improve Core Web Vitals.';
        advice.push('Lossless or subtle compression can shave another 20%–40% off file size.');
        primaryAction = {
          label: 'Optimize for Website',
          route: ROUTES.optimize,
          goal: 'website',
          reason: 'Fine-tune for website loading.',
        };
      }

      secondaryActions.push({ label: 'Compress Image', route: ROUTES.compress });
      secondaryActions.push({ label: 'Resize Image', route: ROUTES.resize });
      secondaryActions.push({ label: 'Convert Format', route: ROUTES.convert });
      break;
    }

    case 'email': {
      if (sizeBytes <= 300 * 1024 && maxDim <= 1200 && format.name === 'JPEG') {
        summary = 'This image is well-suited for email newsletters and campaign templates.';
        advice.push('Standard JPEG ensures 100% rendering compatibility across desktop and mobile clients.');
        primaryAction = null;
      } else {
        summary = `At ${file.sizeFormatted} and ${width} × ${height} px, this file may trigger email attachment limits or render slowly.`;
        advice.push('Most corporate and mobile email templates restrict image widths to 600–1200px.');
        advice.push('Keeping file size under 300 KB prevents newsletter clipping.');
        primaryAction = {
          label: 'Optimize for Email',
          route: ROUTES.optimize,
          goal: 'email',
          reason: 'Scales to 1200px and saves as universal JPEG.',
        };
      }

      secondaryActions.push({ label: 'Compress Image', route: ROUTES.compress });
      secondaryActions.push({ label: 'Resize Image', route: ROUTES.resize });
      break;
    }

    case 'social': {
      if (maxDim <= 2048 && maxDim >= 1080 && sizeBytes <= 2 * 1024 * 1024) {
        summary = 'Dimensions and file size are well-balanced for social media feeds.';
        advice.push('Resolution is high enough for sharp mobile and desktop display without excessive size.');
        primaryAction = null;
      } else if (maxDim > 2048) {
        summary = `At ${maxDim}px wide, social platforms will aggressively re-compress this image, potentially causing smearing or artifacts.`;
        advice.push('Pre-scaling to standard 1080p or 2K (1920px) avoids harsh platform compression.');
        primaryAction = {
          label: 'Optimize for Social Media',
          route: ROUTES.optimize,
          goal: 'social',
          reason: 'Scale to 1920px at 84% quality.',
        };
      } else {
        summary = 'Image is slightly low resolution for modern 2K/Retina social media banners.';
        primaryAction = null;
      }

      secondaryActions.push({ label: 'Resize Image', route: ROUTES.resize });
      secondaryActions.push({ label: 'Compress Image', route: ROUTES.compress });
      break;
    }

    case 'print': {
      if (dimensions.megapixels >= 8) {
        summary = `At ${dimensions.megapixels} MP (${width} × ${height} px), this image has ample pixel density for sharp 300 DPI physical prints.`;
        advice.push('Keep original dimensions intact to prevent pixelation on paper.');
        advice.push('Do not apply aggressive web compression before printing.');
        primaryAction = null;
      } else if (dimensions.megapixels >= 3) {
        summary = `${dimensions.megapixels} MP is sufficient for small standard prints (4×6 in / 10×15 cm), but larger posters may show softness.`;
        primaryAction = null;
      } else {
        summary = `At ${dimensions.megapixels} MP, resolution is low for high-fidelity physical printing.`;
        advice.push('At 300 DPI, this image can only print sharply at small thumbnail sizes.');
        primaryAction = null;
      }

      secondaryActions.push({ label: 'Convert Format', route: ROUTES.convert });
      break;
    }

    case 'messaging': {
      if (sizeBytes <= 500 * 1024 && maxDim <= 1280) {
        summary = 'File size and dimensions are ideal for instant messaging and chat sharing.';
        primaryAction = null;
      } else {
        summary = `At ${file.sizeFormatted}, this image is larger than necessary for quick messaging and mobile data.`;
        advice.push('Creating a compact copy will send instantly without consuming mobile data.');
        primaryAction = {
          label: 'Optimize for Messaging',
          route: ROUTES.optimize,
          goal: 'messaging',
          reason: 'Scales to 1280px and compresses to ~76% quality.',
        };
      }

      secondaryActions.push({ label: 'Compress Image', route: ROUTES.compress });
      secondaryActions.push({ label: 'Resize Image', route: ROUTES.resize });
      break;
    }

    default: {
      summary = `Image properties: ${width} × ${height} px (${dimensions.megapixels} MP), ${file.sizeFormatted}.`;
      secondaryActions.push({ label: 'Smart Optimizer', route: ROUTES.optimize });
      secondaryActions.push({ label: 'Compress Image', route: ROUTES.compress });
      secondaryActions.push({ label: 'Resize Image', route: ROUTES.resize });
      secondaryActions.push({ label: 'Convert Image', route: ROUTES.convert });
      break;
    }
  }

  return {
    summary,
    advice,
    primaryAction,
    secondaryActions,
  };
}
