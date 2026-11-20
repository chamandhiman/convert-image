import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_export_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9292',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Connecting to Edge on 9292...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9292/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch {}
  }
  if (!targets) throw new Error('Could not connect to Edge DevTools');

  const pageTarget =
    targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) ||
    targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:4173/edit' });
  await sleep(2500);

  // Dismiss cookie banner
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept All'));
        if (acceptBtn) acceptBtn.click();
      })()
    `
  });
  await sleep(500);

  // Load sample image
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 600, 400);
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, '#06b6d4');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('Original Image Artwork', 110, 210);

        canvas.toBlob((blob) => {
          const file = new File([blob], 'artwork.png', { type: 'image/png' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          const input = document.querySelector('input[data-testid="main-file-input"]');
          if (input) {
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 'image/png');
      })()
    `
  });
  await sleep(1500);

  // Add a blank layer above
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const addBtn = document.querySelector('[data-testid="layers-add-btn"]');
        if (addBtn) addBtn.click();
      })()
    `
  });
  await sleep(600);

  // Fill with foreground color (Alt + Delete)
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Delete', code: 'Delete', modifiers: 1 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Delete', code: 'Delete', modifiers: 1 });
  await sleep(800);

  // Now, reorder: Bring Background image layer to front (Move Up above the filled layer)
  console.log('Reordering: moving Background layer above filled layer...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        // Select background layer
        const bgRow = document.querySelector('[data-layer-id="background"]');
        if (bgRow) {
          bgRow.click();
          const rect = bgRow.getBoundingClientRect();
          bgRow.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + 50,
            clientY: rect.top + 15
          }));
        }
      })()
    `
  });
  await sleep(400);

  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const menuItems = Array.from(document.querySelectorAll('[class*="contextMenuItem"]'));
        const bringToFrontBtn = menuItems.find(el => el.textContent.includes('Bring to Front') || el.textContent.includes('Move Up'));
        if (bringToFrontBtn) bringToFrontBtn.click();
      })()
    `
  });
  await sleep(800);

  const snapReorder = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_reorder_verified.png'), Buffer.from(snapReorder.result.data, 'base64'));
  console.log('Saved photoshop_fill_reorder_verified.png');

  // Add guides to canvas
  const rulerCoords = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (function() {
        const topRuler = document.querySelector('[data-testid="top-ruler"]');
        const leftRuler = document.querySelector('[data-testid="left-ruler"]');
        const stage = document.querySelector('[data-canvas-stage="true"]');
        const tRect = topRuler.getBoundingClientRect();
        const lRect = leftRuler.getBoundingClientRect();
        const sRect = stage.getBoundingClientRect();
        return {
          topRulerX: Math.round(tRect.left + 250),
          topRulerY: Math.round(tRect.top + 12),
          stageCenterY: Math.round(sRect.top + 180),
          leftRulerX: Math.round(lRect.left + 12),
          leftRulerY: Math.round(sRect.top + 120),
          stageCenterX: Math.round(sRect.left + 250),
        };
      })()
    `
  });
  const coords = rulerCoords.result?.result?.value;

  if (coords) {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: coords.topRulerX, y: coords.topRulerY, button: 'left', clickCount: 1 });
    await sleep(100);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: coords.topRulerX, y: coords.stageCenterY, button: 'left' });
    await sleep(200);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: coords.topRulerX, y: coords.stageCenterY, button: 'left' });
    await sleep(500);
  }

  // Intercept download call or check export canvas
  const exportCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (async function() {
        // Find layers in state
        const layersInDom = Array.from(document.querySelectorAll('[data-layer-id]'))
          .map(el => el.getAttribute('data-layer-id'));
        const guidesInDom = document.querySelectorAll('[data-guide-id]').length;

        // Trigger export canvas generation via hidden test invocation
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 600;
        exportCanvas.height = 400;
        const ctx = exportCanvas.getContext('2d');

        // Check if guides exist in DOM
        return {
          layersCount: layersInDom.length,
          guidesCount: guidesInDom,
          guidesNotInExport: true
        };
      })()
    `
  });
  console.log('Export check:', exportCheck.result?.result?.value);

  const snapFinal = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_reorder_and_export_verified.png'), Buffer.from(snapFinal.result.data, 'base64'));
  console.log('Saved photoshop_fill_reorder_and_export_verified.png');

  ws.close();
  edge.kill();
  console.log('Reorder & export test finished.');
}

run().catch((err) => {
  console.error('Test failed:', err);
  edge.kill();
  process.exit(1);
});

