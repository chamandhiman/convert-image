import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_metrics_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9296',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9296/json/list');
      targets = await res.json();
      if (targets?.length) break;
    } catch {}
  }
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  const origBase64 = fs.readFileSync(path.join(outDir, 'photo_crop_160.png')).toString('base64');
  const aiBase64 = fs.readFileSync(path.join(outDir, 'photo_crop_4x_upscaled.png')).toString('base64');

  const metrics = await send('Runtime.evaluate', {
    expression: `(async () => {
      const loadImg = (b64) => new Promise(r => {
        const img = new Image();
        img.onload = () => r(img);
        img.src = 'data:image/png;base64,' + b64;
      });

      const origImg = await loadImg('${origBase64}');
      const aiImg = await loadImg('${aiBase64}');

      // Render standard 4x bicubic resize on canvas
      const bicubicCanvas = document.createElement('canvas');
      bicubicCanvas.width = 640;
      bicubicCanvas.height = 640;
      const bCtx = bicubicCanvas.getContext('2d');
      bCtx.imageSmoothingEnabled = true;
      bCtx.imageSmoothingQuality = 'high';
      bCtx.drawImage(origImg, 0, 0, 640, 640);
      const bicubicData = bCtx.getImageData(0, 0, 640, 640).data;

      // Render AI upscaled image
      const aiCanvas = document.createElement('canvas');
      aiCanvas.width = 640;
      aiCanvas.height = 640;
      const aiCtx = aiCanvas.getContext('2d');
      aiCtx.drawImage(aiImg, 0, 0);
      const aiData = aiCtx.getImageData(0, 0, 640, 640).data;

      // Calculate Laplacian gradient energy (edge sharpness)
      function calcLaplacian(data, w, h) {
        let sum = 0, count = 0;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const getLum = (px, py) => {
              const idx = (py * w + px) * 4;
              return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            };
            const l = getLum(x+1, y) + getLum(x-1, y) + getLum(x, y+1) + getLum(x, y-1) - 4 * getLum(x, y);
            sum += Math.abs(l);
            count++;
          }
        }
        return sum / count;
      }

      const bicubicLap = calcLaplacian(bicubicData, 640, 640);
      const aiLap = calcLaplacian(aiData, 640, 640);

      // Check color preservation (mean channel difference between bicubic and AI in [0, 255])
      let diffR = 0, diffG = 0, diffB = 0;
      for (let i = 0; i < bicubicData.length; i += 4) {
        diffR += Math.abs(bicubicData[i] - aiData[i]);
        diffG += Math.abs(bicubicData[i+1] - aiData[i+1]);
        diffB += Math.abs(bicubicData[i+2] - aiData[i+2]);
      }
      const numPix = 640 * 640;

      return {
        dimensions: {
          original: { width: origImg.width, height: origImg.height },
          bicubic: { width: 640, height: 640 },
          ai: { width: aiImg.width, height: aiImg.height }
        },
        laplacianSharpness: {
          bicubicResize: bicubicLap.toFixed(3),
          aiUpscale: aiLap.toFixed(3),
          improvementPercent: (((aiLap - bicubicLap) / bicubicLap) * 100).toFixed(1) + '%'
        },
        colorPreservation: {
          meanDeltaR: (diffR / numPix).toFixed(2) + ' / 255',
          meanDeltaG: (diffG / numPix).toFixed(2) + ' / 255',
          meanDeltaB: (diffB / numPix).toFixed(2) + ' / 255',
        }
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Metrics comparison:', JSON.stringify(metrics.result.value, null, 2));
  fs.writeFileSync(path.join(outDir, 'upscaler_comparison_metrics.json'), JSON.stringify(metrics.result.value, null, 2));
  edge.kill();
  process.exit(0);
}
main().catch(err => {
  console.error(err);
  edge.kill();
  process.exit(1);
});

