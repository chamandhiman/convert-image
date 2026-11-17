import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_drag_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9288',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9288/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch {}
  }

  const pageTarget =
    targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) ||
    targets[0];
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1000);

  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true,
        timestamp: Date.now()
      }));
    `,
  });

  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1500);

  // 1. Create canvas
  await send('Runtime.evaluate', {
    expression: `
      document.getElementById('start-blank-canvas-btn')?.click();
      setTimeout(() => document.getElementById('confirm-create-canvas-btn')?.click(), 300);
    `,
  });
  await sleep(1200);

  // 2. Click text tool
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-tool-id="text"]')?.click();`,
  });
  await sleep(500);

  // 3. Click canvas
  const coordsRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const r = stage.getBoundingClientRect();
      return { x: Math.round(r.left + 100), y: Math.round(r.top + 80) };
    })()`,
    returnByValue: true,
  });
  const coords = coordsRes.result.value;

  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: coords.x, y: coords.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: coords.x, y: coords.y, button: 'left' });
  await sleep(800);

  // Enter multi-line text
  await send('Runtime.evaluate', {
    expression: `(() => {
      const textarea = document.querySelector('textarea[class*="textContentArea"]') ||
        document.querySelector('textarea[data-text-editor="true"]');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, "Photoshop Style Smart Text Box with Interactive Resize Handles");
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`,
  });
  await sleep(800);

  // Locate the right 'e' handle
  const handleRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const handleE = document.querySelector('[data-handle-pos="e"]');
      if (!handleE) return null;
      const r = handleE.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    })()`,
    returnByValue: true,
  });

  const hPos = handleRes.result.value;
  console.log('Handle E Pos:', hPos);

  if (hPos) {
    // Drag handle 120px to the right
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: hPos.x, y: hPos.y, button: 'left' });
    for (let dx = 10; dx <= 140; dx += 20) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hPos.x + dx, y: hPos.y });
      await sleep(30);
    }
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: hPos.x + 140, y: hPos.y, button: 'left' });
  }
  await sleep(800);

  const afterDragState = await send('Runtime.evaluate', {
    expression: `(() => {
      const layerWrapper = document.querySelector('[data-layer-selected="true"]');
      const widthInput = document.querySelector('[data-text-width-input="true"]');
      const textHeightDisplay = document.querySelector('[data-text-height-display="true"]');
      const rect = layerWrapper ? layerWrapper.getBoundingClientRect() : null;
      return {
        width: rect ? Math.round(rect.width) : null,
        height: rect ? Math.round(rect.height) : null,
        widthInputVal: widthInput ? widthInput.value : null,
        displayHeight: textHeightDisplay ? textHeightDisplay.value : null,
      };
    })()`,
    returnByValue: true,
  });
  console.log('After Interactive Handle Drag State:', afterDragState.result.value);

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'smart_text_box_drag_verified.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved screenshot: smart_text_box_drag_verified.png');

  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  edge.kill();
  process.exit(1);
});

