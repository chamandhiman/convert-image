import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_crop_comp_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9293',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Connecting to Edge on port 9293...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9293/json/list');
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

  await send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(1500);

  // Crop a 160x100 region from debug-hero.png around the text "Convert Images"
  const compResult = await send('Runtime.evaluate', {
    expression: `(async () => {
      const img = new Image();
      img.src = '/src/assets/images/extracted/debug-hero.png';
      await new Promise(r => img.onload = r);

      // Create low-res crop (160x80)
      const cropC = document.createElement('canvas');
      cropC.width = 160;
      cropC.height = 80;
      const cropCtx = cropC.getContext('2d');
      // Crop around "Convert Images"
      cropCtx.drawImage(img, 20, 30, 160, 80, 0, 0, 160, 80);

      // 1. Standard Canvas 4x Resize (High Quality Bilinear/Bicubic)
      const resizeC = document.createElement('canvas');
      resizeC.width = 640;
      resizeC.height = 320;
      const resizeCtx = resizeC.getContext('2d');
      resizeCtx.imageSmoothingEnabled = true;
      resizeCtx.imageSmoothingQuality = 'high';
      resizeCtx.drawImage(cropC, 0, 0, 640, 320);

      return {
        lowRes: cropC.toDataURL('image/png'),
        standardResize: resizeC.toDataURL('image/png')
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  const { lowRes, standardResize } = compResult.result.value;

  fs.writeFileSync(path.join(outDir, 'audit_comp_original_lowres.png'), Buffer.from(lowRes.replace(/^data:image\/png;base64,/, ''), 'base64'));
  fs.writeFileSync(path.join(outDir, 'audit_comp_standard_canvas_4x.png'), Buffer.from(standardResize.replace(/^data:image\/png;base64,/, ''), 'base64'));
  console.log('Saved original low-res and standard canvas 4x resize images.');

  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  edge.kill();
  process.exit(1);
});

