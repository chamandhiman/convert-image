import * as ortModule from 'onnxruntime-web';
import fs from 'fs';
import path from 'path';

const ort = ortModule.default || ortModule;

// Create a synthetic low-res photograph/texture:
// A 128x128 image with fine lines, circle, text-like shapes, gradient, and high frequency pattern
function createTestImage(w, h) {
  const buf = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      // High frequency checkerboard pattern in top-left
      const check = ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0) ? 220 : 30;
      // Diagonal line
      const diag = Math.abs(x - y) < 2 ? 255 : 0;
      // Sharp circular ring
      const dist = Math.hypot(x - w / 2, y - h / 2);
      const ring = (dist >= 25 && dist <= 28) ? 255 : 0;

      if (x < w / 2 && y < h / 2) {
        buf[idx] = check;
        buf[idx + 1] = check;
        buf[idx + 2] = check;
      } else if (dist <= 30) {
        buf[idx] = ring ? 255 : 40;
        buf[idx + 1] = ring ? 200 : 80;
        buf[idx + 2] = ring ? 50 : 180;
      } else {
        // Gradient with diagonal
        buf[idx] = Math.min(255, (x / w) * 200 + diag);
        buf[idx + 1] = Math.min(255, (y / h) * 150 + diag);
        buf[idx + 2] = Math.min(255, 120 + diag);
      }
      buf[idx + 3] = 255;
    }
  }
  return buf;
}

function rgbaToNchw(rgbaData, width, height) {
  const channelSize = width * height;
  const floatArray = new Float32Array(3 * channelSize);
  for (let i = 0; i < channelSize; i++) {
    floatArray[i] = rgbaData[i * 4] / 255.0;
    floatArray[channelSize + i] = rgbaData[i * 4 + 1] / 255.0;
    floatArray[2 * channelSize + i] = rgbaData[i * 4 + 2] / 255.0;
  }
  return floatArray;
}

function nchwToRgba(floatArray, width, height) {
  const channelSize = width * height;
  const rgba = new Uint8ClampedArray(channelSize * 4);
  for (let i = 0; i < channelSize; i++) {
    rgba[i * 4] = Math.min(255, Math.max(0, Math.round(floatArray[i] * 255.0)));
    rgba[i * 4 + 1] = Math.min(255, Math.max(0, Math.round(floatArray[channelSize + i] * 255.0)));
    rgba[i * 4 + 2] = Math.min(255, Math.max(0, Math.round(floatArray[2 * channelSize + i] * 255.0)));
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}

// Simple nearest-neighbor / bilinear 4x resize for comparison
function bicubicResize4x(srcRgba, w, h) {
  const outW = w * 4;
  const outH = h * 4;
  const outRgba = new Uint8ClampedArray(outW * outH * 4);

  for (let y = 0; y < outH; y++) {
    const srcY = Math.min(h - 1, Math.floor(y / 4));
    for (let x = 0; x < outW; x++) {
      const srcX = Math.min(w - 1, Math.floor(x / 4));
      const srcIdx = (srcY * w + srcX) * 4;
      const dstIdx = (y * outW + x) * 4;
      outRgba[dstIdx] = srcRgba[srcIdx];
      outRgba[dstIdx + 1] = srcRgba[srcIdx + 1];
      outRgba[dstIdx + 2] = srcRgba[srcIdx + 2];
      outRgba[dstIdx + 3] = srcRgba[srcIdx + 3];
    }
  }
  return outRgba;
}

async function run() {
  const w = 128, h = 128;
  const rawRgba = createTestImage(w, h);

  console.log('Running ONNX Real-ESRGAN on 128x128 test image...');
  const session = await ort.InferenceSession.create('public/models/realesr-general-x4v3.onnx');
  const nchw = rgbaToNchw(rawRgba, w, h);
  const tensor = new ort.Tensor('float32', nchw, [1, 3, h, w]);

  const t0 = Date.now();
  const res = await session.run({ input: tensor });
  console.log(`Inference completed in ${Date.now() - t0}ms`);

  const outRgba = nchwToRgba(res.output.data, w * 4, h * 4);
  const standardResizeRgba = bicubicResize4x(rawRgba, w, h);

  // Measure gradient sharpness (Laplacian variance) on both
  function calcSharpness(rgba, width, height) {
    let sumLaplacian = 0;
    let count = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const getGray = (px, py) => {
          const i = (py * width + px) * 4;
          return 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
        };
        const lap = getGray(x + 1, y) + getGray(x - 1, y) + getGray(x, y + 1) + getGray(x, y - 1) - 4 * getGray(x, y);
        sumLaplacian += Math.abs(lap);
        count++;
      }
    }
    return sumLaplacian / count;
  }

  const aiSharpness = calcSharpness(outRgba, w * 4, h * 4);
  const resizeSharpness = calcSharpness(standardResizeRgba, w * 4, h * 4);

  console.log('AI Model Output Sharpness (Laplacian energy):', aiSharpness.toFixed(3));
  console.log('Standard Resize Output Sharpness:', resizeSharpness.toFixed(3));

  // Let's inspect some pixel transitions across the diagonal line
  console.log('Done test');
}

run().catch(console.error);

