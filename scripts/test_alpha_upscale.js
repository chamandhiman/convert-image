import * as ortModule from 'onnxruntime-web';
import fs from 'fs';

const ort = ortModule.default || ortModule;

async function testAlphaUpscale() {
  console.log('Testing Neural Alpha Super-Resolution with Real-ESRGAN...');
  const session = await ort.InferenceSession.create('public/models/realesr-general-x4v3.onnx');

  // Create a 32x32 circle alpha mask (0 outside, 1 inside, smooth edge)
  const w = 32, h = 32;
  const alphaMask = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - 16, y - 16);
      alphaMask[y * w + x] = Math.max(0, Math.min(1, 1 - (d - 12) / 2));
    }
  }

  // Create 3-channel NCHW tensor where R=G=B=Alpha
  const nchw = new Float32Array(3 * w * h);
  for (let i = 0; i < w * h; i++) {
    nchw[i] = alphaMask[i];
    nchw[w * h + i] = alphaMask[i];
    nchw[2 * w * h + i] = alphaMask[i];
  }

  const tensor = new ort.Tensor('float32', nchw, [1, 3, h, w]);
  const res = await session.run({ input: tensor });
  const outAlpha = res.output.data.slice(0, w * 4 * h * 4);

  console.log('Neural Alpha output length:', outAlpha.length);
  console.log('Min alpha out:', Math.min(...outAlpha), 'Max alpha out:', Math.max(...outAlpha));
  console.log('Center pixel alpha (should be ~1.0):', outAlpha[(16 * 4) * (w * 4) + (16 * 4)]);
  console.log('Corner pixel alpha (should be ~0.0):', outAlpha[0]);
}

testAlphaUpscale().catch(console.error);

