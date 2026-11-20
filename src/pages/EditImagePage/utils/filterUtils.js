/**
 * Photoshop-style Filter Processing Algorithms (HTML5 Canvas Pixel Manipulation)
 */

/**
 * Apply Gaussian / Box / Motion / Radial Blur to canvas
 */
export function applyBlur(ctx, width, height, radius = 5, type = 'gaussian') {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const r = Math.max(1, Math.round(radius));

  if (type === 'motion') {
    const copy = new Uint8ClampedArray(data);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < width) {
            const idx = (y * width + nx) * 4;
            rSum += copy[idx];
            gSum += copy[idx + 1];
            bSum += copy[idx + 2];
            aSum += copy[idx + 3];
            count++;
          }
        }
        const outIdx = (y * width + x) * 4;
        data[outIdx] = rSum / count;
        data[outIdx + 1] = gSum / count;
        data[outIdx + 2] = bSum / count;
        data[outIdx + 3] = aSum / count;
      }
    }
  } else if (type === 'radial') {
    const copy = new Uint8ClampedArray(data);
    const cx = width / 2;
    const cy = height / 2;
    const steps = Math.min(20, r * 2);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
        const vx = x - cx;
        const vy = y - cy;
        for (let s = 0; s < steps; s++) {
          const scale = 1 - (s / steps) * (r * 0.02);
          const sx = Math.round(cx + vx * scale);
          const sy = Math.round(cy + vy * scale);
          const clampedX = Math.max(0, Math.min(width - 1, sx));
          const clampedY = Math.max(0, Math.min(height - 1, sy));
          const idx = (clampedY * width + clampedX) * 4;
          rSum += copy[idx];
          gSum += copy[idx + 1];
          bSum += copy[idx + 2];
          aSum += copy[idx + 3];
        }
        const outIdx = (y * width + x) * 4;
        data[outIdx] = rSum / steps;
        data[outIdx + 1] = gSum / steps;
        data[outIdx + 2] = bSum / steps;
        data[outIdx + 3] = aSum / steps;
      }
    }
  } else {
    // Gaussian / Box 2D convolution
    const copy = new Uint8ClampedArray(data);
    const step = Math.max(1, Math.floor(r / 3));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
        for (let dy = -r; dy <= r; dy += step) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -r; dx <= r; dx += step) {
            const nx = x + dx;
            if (nx >= 0 && nx < width) {
              const idx = (ny * width + nx) * 4;
              rSum += copy[idx];
              gSum += copy[idx + 1];
              bSum += copy[idx + 2];
              aSum += copy[idx + 3];
              count++;
            }
          }
        }
        const outIdx = (y * width + x) * 4;
        data[outIdx] = rSum / count;
        data[outIdx + 1] = gSum / count;
        data[outIdx + 2] = bSum / count;
        data[outIdx + 3] = aSum / count;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Apply Sharpen or Unsharp Mask
 */
export function applySharpen(ctx, width, height, amount = 40, type = 'sharpen') {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);
  const factor = (amount / 100) * 1.5;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const up = ((y - 1) * width + x) * 4;
      const down = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val = copy[idx + c];
        const laplacian = 4 * val - copy[up + c] - copy[down + c] - copy[left + c] - copy[right + c];
        data[idx + c] = Math.max(0, Math.min(255, val + laplacian * factor));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Apply Noise, Film Grain, or Pixelate
 */
export function applyNoise(ctx, width, height, amount = 25, type = 'noise') {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  if (type === 'pixelate') {
    const size = Math.max(2, Math.round(amount));
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        for (let dy = 0; dy < size && y + dy < height; dy++) {
          for (let dx = 0; dx < size && x + dx < width; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        a = Math.round(a / count);

        for (let dy = 0; dy < size && y + dy < height; dy++) {
          for (let dx = 0; dx < size && x + dx < width; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
          }
        }
      }
    }
  } else {
    const scale = (amount / 100) * 60;
    for (let i = 0; i < data.length; i += 4) {
      const rand = (Math.random() - 0.5) * scale;
      data[i] = Math.max(0, Math.min(255, data[i] + rand));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + rand));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + rand));
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Apply Stylize: Emboss, Find Edges, Solarize, Posterize
 */
export function applyStylize(ctx, width, height, filterType = 'emboss', param = 50) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  if (filterType === 'emboss') {
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const prev = ((y - 1) * width + (x - 1)) * 4;
        const next = ((y + 1) * width + (x + 1)) * 4;
        for (let c = 0; c < 3; c++) {
          const diff = copy[next + c] - copy[prev + c] + 128;
          data[idx + c] = Math.max(0, Math.min(255, diff));
        }
      }
    }
  } else if (filterType === 'find-edges') {
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const right = (y * width + (x + 1)) * 4;
        const down = ((y + 1) * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          const hDiff = Math.abs(copy[right + c] - copy[idx + c]);
          const vDiff = Math.abs(copy[down + c] - copy[idx + c]);
          data[idx + c] = Math.min(255, (hDiff + vDiff) * 2);
        }
      }
    }
  } else if (filterType === 'solarize') {
    const threshold = (param / 100) * 255;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > threshold) data[i] = 255 - data[i];
      if (data[i + 1] > threshold) data[i + 1] = 255 - data[i + 1];
      if (data[i + 2] > threshold) data[i + 2] = 255 - data[i + 2];
    }
  } else if (filterType === 'posterize') {
    const levels = Math.max(2, Math.round(param / 10));
    const step = 255 / (levels - 1);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(Math.round(data[i] / step) * step);
      data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
      data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Apply Adjustments: Brightness, Contrast, Exposure, Hue, Saturation, Levels, Threshold, Grayscale, Invert, Sepia
 */
export function applyAdjustments(ctx, width, height, adjType = 'grayscale', value = 50) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  if (adjType === 'invert') {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  } else if (adjType === 'grayscale') {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  } else if (adjType === 'sepia') {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
  } else if (adjType === 'brightness') {
    const offset = ((value - 50) / 50) * 128;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + offset));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + offset));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + offset));
    }
  } else if (adjType === 'contrast') {
    const factor = (259 * (value * 2 + 255)) / (255 * (259 - value * 2));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    }
  } else if (adjType === 'exposure') {
    const expMult = Math.pow(2, ((value - 50) / 25));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] * expMult));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * expMult));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * expMult));
    }
  } else if (adjType === 'threshold') {
    const thresh = (value / 100) * 255;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const v = lum >= thresh ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
  } else if (adjType === 'hue') {
    const hueShift = ((value - 50) / 50) * Math.PI;
    const cosA = Math.cos(hueShift);
    const sinA = Math.sin(hueShift);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = Math.max(0, Math.min(255, (0.213 + cosA * 0.787 - sinA * 0.213) * r + (0.715 - cosA * 0.715 - sinA * 0.715) * g + (0.072 - cosA * 0.072 + sinA * 0.928) * b));
      data[i + 1] = Math.max(0, Math.min(255, (0.213 - cosA * 0.213 + sinA * 0.143) * r + (0.715 + cosA * 0.285 + sinA * 0.140) * g + (0.072 - cosA * 0.072 - sinA * 0.283) * b));
      data[i + 2] = Math.max(0, Math.min(255, (0.213 - cosA * 0.213 - sinA * 0.787) * r + (0.715 - cosA * 0.715 + sinA * 0.715) * g + (0.072 + cosA * 0.928 + sinA * 0.072) * b));
    }
  } else if (adjType === 'saturation') {
    const satMult = value / 50;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = Math.max(0, Math.min(255, gray + (data[i] - gray) * satMult));
      data[i + 1] = Math.max(0, Math.min(255, gray + (data[i + 1] - gray) * satMult));
      data[i + 2] = Math.max(0, Math.min(255, gray + (data[i + 2] - gray) * satMult));
    }
  } else if (adjType === 'levels') {
    const gamma = value <= 50 ? 0.5 + (value / 50) * 0.5 : 1 + ((value - 50) / 50) * 2;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, Math.pow(data[i] / 255, 1 / gamma) * 255));
      data[i + 1] = Math.max(0, Math.min(255, Math.pow(data[i + 1] / 255, 1 / gamma) * 255));
      data[i + 2] = Math.max(0, Math.min(255, Math.pow(data[i + 2] / 255, 1 / gamma) * 255));
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Top-level applyFilter helper for image data URLs
 */
export async function applyFilter(sourceDataUrl, filterType, paramVal) {
  if (!sourceDataUrl) return '';

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const val = Number(paramVal);

      if (['gaussian', 'motion', 'radial', 'box'].includes(filterType)) {
        applyBlur(ctx, w, h, val, filterType);
      } else if (['sharpen', 'unsharp'].includes(filterType)) {
        applySharpen(ctx, w, h, val, filterType);
      } else if (['noise', 'grain', 'pixelate'].includes(filterType)) {
        applyNoise(ctx, w, h, val, filterType);
      } else if (['emboss', 'find-edges', 'solarize', 'posterize'].includes(filterType)) {
        applyStylize(ctx, w, h, filterType, val);
      } else if (['brightness', 'contrast', 'grayscale', 'sepia', 'invert', 'exposure', 'threshold', 'hue', 'saturation', 'levels'].includes(filterType)) {
        applyAdjustments(ctx, w, h, filterType, val);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(sourceDataUrl);
    img.src = sourceDataUrl;
  });
}
