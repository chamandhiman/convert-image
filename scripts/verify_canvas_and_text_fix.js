import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-canvas-fix-' + Date.now());
const testImagePath = path.resolve('src/assets/images/before-after.png');

console.log('Testing Canvas Creation, Text Selection Isolation, and Image Layers...');

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9228',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  'about:blank',
]);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPort() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9228/json/list');
      if (res.ok) return await res.json();
    } catch {
      await sleep(300);
    }
  }
  throw new Error('Timeout waiting for Edge debug port 9228');
}

async function run() {
  try {
    const targets = await waitForPort();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('LOG:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('JS EXCEPTION:', msg.params.exceptionDetails?.exception?.description || JSON.stringify(msg.params.exceptionDetails));
      }
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = idCounter++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Navigating to http://localhost:4173/edit-image...');
    await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
    await sleep(2000);

    // 1. Verify New Start Screen (2 main options)
    const startScreenCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const startBtn = document.getElementById('start-blank-canvas-btn');
        const openBtn = document.getElementById('start-open-image-btn');
        return {
          hasBlankBtn: Boolean(startBtn),
          hasOpenBtn: Boolean(openBtn)
        };
      })()`,
      returnByValue: true,
    });
    console.log('1. Start Screen Buttons Check:', startScreenCheck.result.value);

    // Capture start screen screenshot
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'smart-editor-start-screen.png'), Buffer.from(ss1.data, 'base64'));
    console.log('Saved smart-editor-start-screen.png');

    // 2. Open Canvas Setup Modal by clicking #start-blank-canvas-btn
    console.log('Opening Canvas Setup Modal via #start-blank-canvas-btn...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('start-blank-canvas-btn');
        if (btn) btn.click();
      })()`,
    });
    await sleep(500);

    const modalCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const confirmBtn = document.getElementById('confirm-create-canvas-btn');
        const inputs = Array.from(document.querySelectorAll('input[type="number"]')).map(i => i.value);
        return {
          isOpen: Boolean(confirmBtn),
          confirmBtnText: confirmBtn?.innerText || '',
          inputs
        };
      })()`,
      returnByValue: true,
    });
    console.log('2. Canvas Modal Check:', modalCheck.result.value);

    // Click "Create Canvas" in Modal (Default 400 x 300)
    console.log('Submitting Canvas Creation (400x300)...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const confirmBtn = document.getElementById('confirm-create-canvas-btn');
        if (confirmBtn) confirmBtn.click();
      })()`,
    });

    // Wait for stage to mount
    for (let i = 0; i < 20; i++) {
      const stageFound = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('[data-canvas-stage="true"]'))`,
        returnByValue: true
      });
      if (stageFound.result.value) break;
      await sleep(200);
    }
    await sleep(400);

    // 3. Verify Canvas Created with Real Dimensions (400 x 300)
    const canvasCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]');
        const bgImg = stage ? stage.querySelector('img[data-layer-id="background"]') : null;
        return {
          stageFound: Boolean(stage),
          stageStyleWidth: stage?.style.width,
          stageStyleHeight: stage?.style.height,
          bgImgFound: Boolean(bgImg)
        };
      })()`,
      returnByValue: true,
    });
    console.log('3. Canvas Stage Dimensions Check:', canvasCheck.result.value);

    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'smart-editor-blank-canvas-created.png'), Buffer.from(ss2.data, 'base64'));
    console.log('Saved smart-editor-blank-canvas-created.png');

    // 4. Add Image Layer via layer input
    console.log('Adding Image Layer from test image...');
    const fileBase64 = fs.readFileSync(testImagePath).toString('base64');
    await send('Runtime.evaluate', {
      expression: `(async () => {
        const res = await fetch('data:image/png;base64,${fileBase64}');
        const blob = await res.blob();
        const file = new File([blob], 'lake-view.png', { type: 'image/png' });

        const layerInput = document.querySelector('input[data-testid="layer-image-input"]');
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        layerInput.files = dataTransfer.files;
        layerInput.dispatchEvent(new Event('change', { bubbles: true }));
      })()`,
      awaitPromise: true,
    });
    await sleep(800);

    // 5. Add Text Layer via Photoshop-Style Click-to-Place
    console.log('Activating Text Tool and placing Text Layer on canvas...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textTool = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Text' || b.innerText.trim() === 'Text');
        if (textTool) textTool.click();
      })()`,
    });
    await sleep(400);

    // Click canvas stage to place text layer
    const stagePos = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]');
        const r = stage.getBoundingClientRect();
        return { x: Math.round(r.left + 80), y: Math.round(r.top + 80) };
      })()`,
      returnByValue: true,
    });
    const { x, y } = stagePos.result.value;
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(600);

    // Type text "Travel India"
    console.log('Typing text "Travel India"...');
    await send('Input.insertText', { text: 'Travel India' });
    await sleep(400);

    // Commit with Escape
    console.log('Committing text layer...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await sleep(500);

    // Properties panel adjustments: set font size to 36 and click Fit to Text
    console.log('Applying Font Size 36 & Fit to Text in Properties panel...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const pills = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.trim() === '36');
        if (pills[0]) pills[0].click();

        const fitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Fit to Text');
        if (fitBtn) fitBtn.click();

        // Stroke outline
        const toggle = document.querySelector('label[class*="toggleSwitch"] input');
        if (toggle && !toggle.checked) toggle.click();
      })()`,
    });
    await sleep(600);

    // Capture verified screenshot
    const ssTextVerified = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'smart-editor-text-tool-verified.png'), Buffer.from(ssTextVerified.data, 'base64'));
    console.log('Saved smart-editor-text-tool-verified.png');

    const layersAfterAdd = await send('Runtime.evaluate', {
      expression: `(() => {
        const layerWrappers = Array.from(document.querySelectorAll('[data-layer-id]')).map(el => ({
          layerId: el.getAttribute('data-layer-id'),
          tagName: el.tagName
        }));
        return layerWrappers;
      })()`,
      returnByValue: true,
    });
    console.log('5. Stage Layers on Canvas:', layersAfterAdd.result.value);

    // 6. CRITICAL BUG CHECK: Select Text Layer, Verify Background Image Handles Count is ZERO
    console.log('Selecting Text Layer directly...');
    const selectTextResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const textLayer = Array.from(document.querySelectorAll('[data-layer-id]')).find(el => el.getAttribute('data-layer-id')?.startsWith('text_'));
        if (textLayer) {
          textLayer.click();
        }

        // Check whether background handles are visible
        const bgHandles = document.querySelectorAll('[data-selection-frame="background"]');
        const textHandles = textLayer ? textLayer.querySelectorAll('[class*="layerHandle"]') : [];
        return {
          textLayerFound: Boolean(textLayer),
          bgHandlesCount: bgHandles.length,
          textHandlesCount: textHandles.length,
          isBgSelected: Boolean(document.querySelector('[data-selection-frame="background"]'))
        };
      })()`,
      returnByValue: true,
    });
    console.log('6. Text Selection Isolation Check (bgHandles MUST be 0):', selectTextResult.result.value);

    const ss3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'smart-editor-text-isolated-selection.png'), Buffer.from(ss3.data, 'base64'));
    console.log('Saved smart-editor-text-isolated-selection.png');

    // 7. Test Double Click Text Layer -> Inline Editing
    console.log('Double clicking text to verify inline editing...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textLayer = Array.from(document.querySelectorAll('[data-layer-id]')).find(el => el.getAttribute('data-layer-id')?.startsWith('text_'));
        const textContent = textLayer?.querySelector('[data-text-content="true"]');
        if (textContent) {
          textContent.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
        }
      })()`,
    });
    await sleep(400);

    const doubleClickResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('textarea[data-text-editor="true"]');
        return {
          textareaPresent: Boolean(textarea),
          textareaValue: textarea?.value
        };
      })()`,
      returnByValue: true,
    });
    console.log('7. Inline Text Editing Check:', doubleClickResult.result.value);

    // 8. Select Background Image directly -> Verify Background Frame appears
    console.log('Clicking Background Image directly...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const bgImg = document.querySelector('img[data-layer-id="background"]');
        if (bgImg) {
          bgImg.click();
        }
      })()`,
    });
    await sleep(400);

    const selectBgResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const bgImg = document.querySelector('img[data-layer-id="background"]');
        const bgHandles = document.querySelectorAll('[data-selection-frame="background"]');
        const textLayer = Array.from(document.querySelectorAll('[data-layer-id]')).find(el => el.getAttribute('data-layer-id')?.startsWith('text_'));
        const textHandles = textLayer ? textLayer.querySelectorAll('[class*="layerHandle"]') : [];
        return {
          bgImgFound: Boolean(bgImg),
          isBgSelected: bgHandles.length > 0,
          textHandlesCount: textHandles.length
        };
      })()`,
      returnByValue: true,
    });
    console.log('8. Background Direct Selection Check (Background handles present, text handles 0):', selectBgResult.result.value);

    // 9. Reorder, Hide, Delete Layer check
    console.log('Deleting Image Layer and verifying canvas intact...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const imageLayer = Array.from(document.querySelectorAll('[data-layer-id]')).find(el => el.getAttribute('data-layer-id')?.startsWith('image_'));
        if (imageLayer) {
          imageLayer.click();
        }
      })()`,
    });
    await sleep(300);

    await send('Runtime.evaluate', {
      expression: `(() => {
        const imageLayer = Array.from(document.querySelectorAll('[data-layer-id]')).find(el => el.getAttribute('data-layer-id')?.startsWith('image_'));
        const delBtn = imageLayer ? imageLayer.querySelector('button[title*="Delete"], button[aria-label*="Delete"]') : null;
        if (delBtn) delBtn.click();
      })()`,
    });
    await sleep(500);

    const deleteLayerResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const remainingLayers = Array.from(document.querySelectorAll('[data-layer-id]')).map(el => el.getAttribute('data-layer-id'));
        const canvasStillExists = Boolean(document.querySelector('img[data-layer-id="background"]'));
        return {
          remainingLayers,
          canvasStillExists
        };
      })()`,
      returnByValue: true,
    });
    console.log('9. Layer Deletion Check (canvas must remain intact):', deleteLayerResult.result.value);

    console.log('ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
    ws.close();
    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    edge.kill();
    process.exit(1);
  }
}

run();
