const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9812;
const previewUrl = 'http://127.0.0.1:4173';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-psd-debug-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--guest',
    `--user-data-dir=${tmpProfile}`,
    `${previewUrl}/edit-image`,
  ]);

  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page');
        if (found) { pageTarget = found; break; }
      }
    } catch { }
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 950, deviceScaleFactor: 1, mobile: false });

  await sleep(1500);

  const fixtureBuf = fs.readFileSync(path.join(__dirname, '..', 'public', 'test-photoshop-fixture.psd'));
  const fixtureBase64 = fixtureBuf.toString('base64');

  const debug = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          const b64 = "${fixtureBase64}";
          const binaryStr = atob(b64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const buf = bytes.buffer;
          
          const openCard = document.querySelector('[data-testid="welcome-card-open-psd"]');
          if (openCard) openCard.click();
          await new Promise(r => setTimeout(r, 600));

          const fileInput = document.querySelector('[data-testid="psd-file-input"]');
          const file = new File([buf], 'Creative-Studio-Design.psd', { type: 'image/vnd.adobe.photoshop' });
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));

          // Wait for parse
          for (let i = 0; i < 40; i++) {
            await new Promise(r => setTimeout(r, 200));
            const confirmBtn = document.querySelector('[data-testid="psd-confirm-import-btn"], [data-testid="psd-confirm-btn"]');
            if (confirmBtn) {
              confirmBtn.click();
              break;
            }
          }
          await new Promise(r => setTimeout(r, 1500));

          const stage = document.querySelector('[data-canvas-stage="true"]');
          const docVp = document.querySelector('[data-document-viewport="true"]');
          const viewport = document.querySelector('[class*="canvasViewport"]');
          const layers = Array.from(document.querySelectorAll('[data-layer-id]')).map(l => ({
            id: l.getAttribute('data-layer-id'),
            type: l.getAttribute('data-layer-type'),
            rect: l.getBoundingClientRect(),
            style: {
              left: l.style.left,
              top: l.style.top,
              width: l.style.width,
              height: l.style.height
            }
          }));

          return {
            viewportRect: viewport?.getBoundingClientRect(),
            stageRect: stage?.getBoundingClientRect(),
            stageStyle: {
              width: stage?.style.width,
              height: stage?.style.height,
              transform: stage?.style.transform
            },
            docVpRect: docVp?.getBoundingClientRect(),
            docVpStyle: {
              width: docVp?.style.width,
              height: docVp?.style.height,
              backgroundColor: docVp?.style.backgroundColor
            },
            layers
          };
        } catch (err) {
          return { error: err.message, stack: err.stack };
        }
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });

  console.log('DEBUG STAGE & LAYERS:', JSON.stringify(debug.result.value, null, 2));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'debug_psd_import.png'), Buffer.from(shot.data, 'base64'));
  console.log('Screenshot saved to debug_psd_import.png');

  ws.close();
  edge.kill();
}

main().catch(console.error);
