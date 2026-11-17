import * as ortModule from 'onnxruntime-web';
import fs from 'fs';
import path from 'path';

const ort = ortModule.default || ortModule;
const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';

// Decode a PNG buffer using browser or pure Node canvas/raw
// Since we have headless Edge, let's use Edge to crop before-after.png to 128x128 and compare
import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_crop_test_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9295',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Connecting to Edge on port 9295...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9295/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch {}
  }
  if (!targets) throw new Error('Could not connect to Edge');

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const curId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === curId) {
          ws.removeEventListener('message', handler);
          if (d.error) reject(d.error);
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://localhost:4173/image-upscaler' });
  await sleep(1500);

  // Read before-after.png as dataURL in page
  const beforeAfterBuf = fs.readFileSync('src/assets/images/before-after.png');
  const beforeAfterBase64 = beforeAfterBuf.toString('base64');

  // Create a 160x160 crop containing photo details & text
  const cropData = await send('Runtime.evaluate', {
    expression: `(async () => {
      const img = new Image();
      img.src = 'data:image/png;base64,${beforeAfterBase64}';
      await new Promise(r => img.onload = r);

      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      // Crop a high-detail face/texture region
      ctx.drawImage(img, 100, 100, 160, 160, 0, 0, 160, 160);

      return new Promise(resolve => {
        canvas.toBlob(blob => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        }, 'image/png');
      });
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  const cropBase64 = cropData.result.value.replace(/^data:image\/[a-z]+;base64,/, '');
  const cropFilePath = path.join(outDir, 'photo_crop_160.png');
  fs.writeFileSync(cropFilePath, Buffer.from(cropBase64, 'base64'));
  console.log('Saved photo crop 160x160 to:', cropFilePath);

  // Now submit this photo crop to the upscaler page via DOM.setFileInputFiles
  await send('Page.navigate', { url: 'http://localhost:4173/image-upscaler' });
  await sleep(1200);

  // Set cookie consent
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({
        necessary: true, analytics: true, marketing: true, timestamp: Date.now()
      }));
    `,
  });

  // Select 4x factor
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button[role="radio"]'));
      const btn4x = btns.find(b => b.textContent.includes('4×'));
      if (btn4x) btn4x.click();
    })()`,
  });
  await sleep(200);

  const doc = await send('DOM.getDocument');
  const inputNode = await send('DOM.querySelector', {
    nodeId: doc.root.nodeId,
    selector: 'input[type="file"]'
  });

  await send('DOM.setFileInputFiles', {
    files: [cropFilePath],
    nodeId: inputNode.nodeId
  });

  console.log('Submitted photo crop for 4x AI upscale. Waiting for inference...');

  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const upscaled = document.querySelector('img[alt*="AI Upscaled"]');
        return upscaled ? {
          loaded: upscaled.complete,
          naturalWidth: upscaled.naturalWidth,
          naturalHeight: upscaled.naturalHeight,
          src: upscaled.src.slice(0, 50)
        } : null;
      })()`,
      returnByValue: true,
    });

    if (check.result.value?.loaded) {
      console.log('Photo crop 4x AI upscale complete!', check.result.value);
      break;
    }
  }

  // Capture screenshot of the 4x result viewer
  await sleep(1000);
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  const ssPath = path.join(outDir, 'upscaler_photo_crop_4x_result.png');
  fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
  console.log('Saved result screenshot to:', ssPath);

  // Extract upscaled blob
  const extractedBuffer = await send('Runtime.evaluate', {
    expression: `(async () => {
      const upscaled = document.querySelector('img[alt*="AI Upscaled"]');
      if (!upscaled) return null;
      const res = await fetch(upscaled.src);
      const blob = await res.blob();
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  if (extractedBuffer.result?.value) {
    const rawData = extractedBuffer.result.value.replace(/^data:image\/[a-z]+;base64,/, '');
    fs.writeFileSync(path.join(outDir, 'photo_crop_4x_upscaled.png'), Buffer.from(rawData, 'base64'));
    console.log('Saved raw upscaled image: photo_crop_4x_upscaled.png');
  }

  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Photo test failed:', err);
  edge.kill();
  process.exit(1);
});

