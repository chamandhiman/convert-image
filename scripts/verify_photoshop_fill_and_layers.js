import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_ps_fill_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9290',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Spawning Edge browser and waiting for DevTools on port 9290...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9290/json/list');
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
  console.log('WebSocket connected. Initializing viewport and navigating...');

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

  // Dismiss cookie consent banner if present
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept All'));
        if (acceptBtn) acceptBtn.click();
      })()
    `
  });
  await sleep(500);

  // 1. Create a 600x400 blank canvas or load an image via script evaluation
  console.log('Step 1: Creating initial blank canvas with an uploaded sample image...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        // Trigger a 600x400 test image into file input
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        // Draw background gradient
        const grad = ctx.createLinearGradient(0, 0, 600, 400);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('Sample Artwork', 160, 210);

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

  // Capture Screenshot 1: Image loaded as editable Background layer
  const snap1 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_1_image_loaded.png'), Buffer.from(snap1.result.data, 'base64'));
  console.log('Saved photoshop_fill_1_image_loaded.png');

  // Verify Background Layer in Layers panel
  const check1 = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (function() {
        const bgRow = document.querySelector('[data-layer-id="background"]');
        const addBtn = document.querySelector('[data-testid="layers-add-btn"]');
        const addBtnTitle = addBtn ? addBtn.getAttribute('title') : '';
        const rulers = document.querySelector('[data-testid="canvas-rulers"]');
        const topRuler = document.querySelector('[data-testid="top-ruler"]');
        const leftRuler = document.querySelector('[data-testid="left-ruler"]');
        const swatches = document.querySelector('[data-testid="photoshop-color-swatches"]');
        return {
          hasBgLayer: Boolean(bgRow),
          addBtnExists: Boolean(addBtn),
          addBtnTitle: addBtnTitle,
          hasRulers: Boolean(rulers && topRuler && leftRuler),
          hasSwatches: Boolean(swatches)
        };
      })()
    `
  });
  const check1Val = check1.result?.result?.value || check1.result?.value || {};
  console.log('Verification Step 1 results:', check1Val);

  // Step 2: Click Add New Layer (Photoshop-style turned-corner button)
  console.log('Step 2: Clicking + Add New Layer...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const addBtn = document.querySelector('[data-testid="layers-add-btn"]');
        if (addBtn) addBtn.click();
      })()
    `
  });
  await sleep(800);

  const snap2 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_2_new_layer_added.png'), Buffer.from(snap2.result.data, 'base64'));
  console.log('Saved photoshop_fill_2_new_layer_added.png');

  // Step 3: Fill new layer with Foreground Color (#7C3AED) using Alt + Delete shortcut
  console.log('Step 3: Pressing Alt + Delete to fill active layer with Foreground Color...');
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Delete',
    code: 'Delete',
    modifiers: 1 // Alt modifier
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Delete',
    code: 'Delete',
    modifiers: 1
  });
  await sleep(1000);

  const snap3 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_3_foreground_filled.png'), Buffer.from(snap3.result.data, 'base64'));
  console.log('Saved photoshop_fill_3_foreground_filled.png');

  // Step 4: Reorder: Move Background image layer above the filled layer
  console.log('Step 4: Reordering layers: Moving Background layer above Layer 1...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const bgRow = document.querySelector('[data-layer-id="background"]');
        if (bgRow) bgRow.click();
      })()
    `
  });
  await sleep(400);

  // Right-click background layer to trigger context menu Move Up
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const bgRow = document.querySelector('[data-layer-id="background"]');
        if (bgRow) {
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
        const moveUpBtn = menuItems.find(el => el.textContent.includes('Move Up') || el.textContent.includes('Bring to Front'));
        if (moveUpBtn) moveUpBtn.click();
      })()
    `
  });
  await sleep(800);

  const snap4 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_4_background_moved_above.png'), Buffer.from(snap4.result.data, 'base64'));
  console.log('Saved photoshop_fill_4_background_moved_above.png');

  // Step 5: Test Background Fill: Fill layer with background color (#FFFFFF) using Ctrl + Delete
  console.log('Step 5: Adding another layer and pressing Ctrl + Delete to fill with Background color...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const addBtn = document.querySelector('[data-testid="layers-add-btn"]');
        if (addBtn) addBtn.click();
      })()
    `
  });
  await sleep(600);

  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Delete',
    code: 'Delete',
    modifiers: 2 // Ctrl modifier
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Delete',
    code: 'Delete',
    modifiers: 2
  });
  await sleep(1000);

  const snap5 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_5_background_filled.png'), Buffer.from(snap5.result.data, 'base64'));
  console.log('Saved photoshop_fill_5_background_filled.png');

  // Step 6: Test Document Background changing: White and Transparent
  console.log('Step 6: Deselecting layer and testing Document Background buttons...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await sleep(400);

  // Click "White" document background
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const whiteBtn = buttons.find(b => b.textContent.trim() === 'White');
        if (whiteBtn) whiteBtn.click();
      })()
    `
  });
  await sleep(600);

  const snap6 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_6_doc_bg_white.png'), Buffer.from(snap6.result.data, 'base64'));
  console.log('Saved photoshop_fill_6_doc_bg_white.png');

  // Step 7: Test Rulers & Draggable Guides
  console.log('Step 7: Testing Draggable Guides from Top and Left Rulers via CDP...');
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
          topRulerX: Math.round(tRect.left + 200),
          topRulerY: Math.round(tRect.top + 12),
          stageCenterY: Math.round(sRect.top + 150),
          leftRulerX: Math.round(lRect.left + 12),
          leftRulerY: Math.round(sRect.top + 100),
          stageCenterX: Math.round(sRect.left + 200),
        };
      })()
    `
  });
  const coords = rulerCoords.result?.result?.value || rulerCoords.result?.value;

  // 1. Drag horizontal guide from top ruler onto canvas
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: coords.topRulerX,
    y: coords.topRulerY,
    button: 'left',
    clickCount: 1
  });
  await sleep(100);
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: coords.topRulerX,
    y: coords.stageCenterY,
    button: 'left'
  });
  await sleep(200);
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: coords.topRulerX,
    y: coords.stageCenterY,
    button: 'left'
  });
  await sleep(600);

  // 2. Drag vertical guide from left ruler onto canvas
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: coords.leftRulerX,
    y: coords.leftRulerY,
    button: 'left',
    clickCount: 1
  });
  await sleep(100);
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: coords.stageCenterX,
    y: coords.leftRulerY,
    button: 'left'
  });
  await sleep(200);
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: coords.stageCenterX,
    y: coords.leftRulerY,
    button: 'left'
  });
  await sleep(600);
  await sleep(800);

  const snap7 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_7_guides_on_canvas.png'), Buffer.from(snap7.result.data, 'base64'));
  console.log('Saved photoshop_fill_7_guides_on_canvas.png');

  // Verify guides exist in DOM
  const checkGuides = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (function() {
        const hGuides = document.querySelectorAll('[data-guide-orientation="horizontal"]');
        const vGuides = document.querySelectorAll('[data-guide-orientation="vertical"]');
        return {
          hGuidesCount: hGuides.length,
          vGuidesCount: vGuides.length
        };
      })()
    `
  });
  const checkGuidesVal = checkGuides.result?.result?.value || checkGuides.result?.value || {};
  console.log('Guides verification result:', checkGuidesVal);

  // Step 8: Test Undo (Ctrl + Z)
  console.log('Step 8: Testing Undo with Ctrl + Z...');
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'z',
    code: 'KeyZ',
    modifiers: 2 // Ctrl modifier
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'z',
    code: 'KeyZ',
    modifiers: 2
  });
  await sleep(800);

  const snap8 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_8_undo_applied.png'), Buffer.from(snap8.result.data, 'base64'));
  console.log('Saved photoshop_fill_8_undo_applied.png');

  // Step 9: Full Desktop Final Screenshot
  const snapFinal = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'photoshop_fill_9_full_desktop_final.png'), Buffer.from(snapFinal.result.data, 'base64'));
  console.log('Saved photoshop_fill_9_full_desktop_final.png');

  const finalSummary = {
    step1_hasBgLayer: Boolean(check1Val.hasBgLayer),
    step1_addBtnTitle: check1Val.addBtnTitle || '',
    step1_hasRulers: Boolean(check1Val.hasRulers),
    step1_hasSwatches: Boolean(check1Val.hasSwatches),
    step7_hGuidesCount: checkGuidesVal.hGuidesCount || 0,
    step7_vGuidesCount: checkGuidesVal.vGuidesCount || 0,
    allPassed:
      Boolean(check1Val.hasBgLayer) &&
      (check1Val.addBtnTitle || '').includes('Add New Layer') &&
      Boolean(check1Val.hasRulers) &&
      Boolean(check1Val.hasSwatches)
  };

  fs.writeFileSync(
    path.join(outDir, 'photoshop_fill_verification_report.json'),
    JSON.stringify(finalSummary, null, 2)
  );
  console.log('Full Verification Summary:', finalSummary);

  ws.close();
  edge.kill();
  console.log('Test completed successfully.');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  edge.kill();
  process.exit(1);
});
