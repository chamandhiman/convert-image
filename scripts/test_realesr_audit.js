import * as ortModule from 'onnxruntime-web';
import fs from 'fs';

const ort = ortModule.default || ortModule;

async function run() {
  console.log('Loading model public/models/realesr-general-x4v3.onnx...');
  const session = await ort.InferenceSession.create('public/models/realesr-general-x4v3.onnx');
  console.log('Model loaded successfully!');
  console.log('Input names:', session.inputNames);
  console.log('Output names:', session.outputNames);

  // Test with a 32x32 image with known values: R=0.8, G=0.4, B=0.2
  const w = 32, h = 32;
  const floatArray = new Float32Array(3 * w * h);
  for (let i = 0; i < w * h; i++) {
    floatArray[i] = 0.8;                     // R
    floatArray[w * h + i] = 0.4;             // G
    floatArray[2 * w * h + i] = 0.2;         // B
  }

  const tensor = new ort.Tensor('float32', floatArray, [1, 3, h, w]);
  const startTime = Date.now();
  const res = await session.run({ input: tensor });
  console.log(`Inference took ${Date.now() - startTime}ms`);

  const out = res.output.data;
  const outW = w * 4;
  const outH = h * 4;
  const outSize = outW * outH;
  console.log(`Output shape: [1, 3, ${outH}, ${outW}], length: ${out.length}`);

  const rOut = out.slice(0, 5);
  const gOut = out.slice(outSize, outSize + 5);
  const bOut = out.slice(2 * outSize, 2 * outSize + 5);

  console.log('Sample R channel out:', Array.from(rOut));
  console.log('Sample G channel out:', Array.from(gOut));
  console.log('Sample B channel out:', Array.from(bOut));

  // Check min and max across output
  let minVal = Infinity, maxVal = -Infinity;
  for (let i = 0; i < out.length; i++) {
    if (out[i] < minVal) minVal = out[i];
    if (out[i] > maxVal) maxVal = out[i];
  }
  console.log(`Output range: min=${minVal}, max=${maxVal}`);
}

run().catch(console.error);

