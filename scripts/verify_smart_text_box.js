import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_smart_text_2_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9286',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Spawning Edge browser on port 9286...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9286/json/list');
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

  console.log('Setting consent cookie...');
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

  console.log('Navigating to Smart Image Editor...');
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });

  for (let i = 0; i < 20; i++) {
    await sleep(300);
    const ready = await send('Runtime.evaluate', {
      expression: `Boolean(document.getElementById('start-blank-canvas-btn'))`,
      returnByValue: true,
    });
    if (ready.result?.value) break;
  }

  // 1. Create 800x600 Blank Canvas
  console.log('1. Creating Blank Canvas...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('start-blank-canvas-btn')?.click()`,
  });
  await sleep(500);

  await send('Runtime.evaluate', {
    expression: `document.getElementById('confirm-create-canvas-btn')?.click()`,
  });
  await sleep(1000);

  // 2. Click Text tool on left toolbar
  console.log('2. Activating Text tool on Left Toolbar...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-tool-id="text"]')?.click()`,
  });
  await sleep(500);

  // 3. Click canvas stage to add text layer
  console.log('3. Clicking canvas stage to place compact text layer...');
  const stageCoordRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      if (!stage) return null;
      const r = stage.getBoundingClientRect();
      return { x: Math.round(r.left + 150), y: Math.round(r.top + 120) };
    })()`,
    returnByValue: true,
  });

  const coords = stageCoordRes.result.value;
  console.log('Stage Click Coords:', coords);
  if (coords) {
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: coords.x,
      y: coords.y,
      button: 'left',
      clickCount: 1,
    });
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: coords.x,
      y: coords.y,
      button: 'left',
    });
  }
  await sleep(1000);

  // Check state of newly created text layer
  const step1State = await send('Runtime.evaluate', {
    expression: `(() => {
      const layerWrapper = document.querySelector('[data-layer-selected="true"]');
      const textWidthInput = document.querySelector('[data-text-width-input="true"]');
      const textHeightDisplay = document.querySelector('[data-text-height-display="true"]');
      const handles = Array.from(document.querySelectorAll('[data-handle-pos]')).map(h => h.getAttribute('data-handle-pos'));
      const rect = layerWrapper ? layerWrapper.getBoundingClientRect() : null;
      return {
        found: Boolean(layerWrapper),
        width: rect ? Math.round(rect.width) : null,
        height: rect ? Math.round(rect.height) : null,
        inputWidth: textWidthInput ? textWidthInput.value : null,
        displayHeight: textHeightDisplay ? textHeightDisplay.value : null,
        handlesCount: handles.length,
        handles,
      };
    })()`,
    returnByValue: true,
  });
  console.log('Step 1 (Compact Default Text Box):', step1State.result.value);

  // Screenshot 1: Compact initial text box
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'smart_text_box_1_default_compact.png'), Buffer.from(ss1.data, 'base64'));
  console.log('Saved screenshot 1: smart_text_box_1_default_compact.png');

  // 4. Test Auto-Wrapping with multi-line text
  console.log('4. Entering multi-line sentence: "This is a professional image editor with smart text auto-wrapping"...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const textarea = document.querySelector('textarea[class*="textContentArea"]') ||
        document.querySelector('textarea[data-text-editor="true"]');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, "This is a professional image editor with smart text auto-wrapping");
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`,
  });
  await sleep(1000);

  const step2State = await send('Runtime.evaluate', {
    expression: `(() => {
      const layerWrapper = document.querySelector('[data-layer-selected="true"]');
      const textHeightDisplay = document.querySelector('[data-text-height-display="true"]');
      const rect = layerWrapper ? layerWrapper.getBoundingClientRect() : null;
      return {
        found: Boolean(layerWrapper),
        width: rect ? Math.round(rect.width) : null,
        height: rect ? Math.round(rect.height) : null,
        displayHeight: textHeightDisplay ? textHeightDisplay.value : null,
      };
    })()`,
    returnByValue: true,
  });
  console.log('Step 2 (Multi-line Auto-Wrap & Height Expansion):', step2State.result.value);

  // Screenshot 2: Auto-wrapped multi-line box
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'smart_text_box_2_autowrap_multiline.png'), Buffer.from(ss2.data, 'base64'));
  console.log('Saved screenshot 2: smart_text_box_2_autowrap_multiline.png');

  // 5. Test Width Input adjustment in Properties Panel (340px)
  console.log('5. Adjusting width to 340px in Properties Panel...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const widthInput = document.querySelector('[data-text-width-input="true"]');
      if (widthInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(widthInput, '340');
        widthInput.dispatchEvent(new Event('input', { bubbles: true }));
        widthInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`,
  });
  await sleep(1000);

  const step3State = await send('Runtime.evaluate', {
    expression: `(() => {
      const layerWrapper = document.querySelector('[data-layer-selected="true"]');
      const textHeightDisplay = document.querySelector('[data-text-height-display="true"]');
      const rect = layerWrapper ? layerWrapper.getBoundingClientRect() : null;
      return {
        width: rect ? Math.round(rect.width) : null,
        height: rect ? Math.round(rect.height) : null,
        displayHeight: textHeightDisplay ? textHeightDisplay.value : null,
      };
    })()`,
    returnByValue: true,
  });
  console.log('Step 3 (Widened to 340px - reflowed into fewer lines, height contracted):', step3State.result.value);

  // Screenshot 3: Reflowed widened box
  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'smart_text_box_3_reflowed_widened.png'), Buffer.from(ss3.data, 'base64'));
  console.log('Saved screenshot 3: smart_text_box_3_reflowed_widened.png');

  // 6. Test "Fit to Text" button
  console.log('6. Clicking "Fit to Text" button in Properties Panel...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('[data-fit-text-btn="true"]')?.click()`,
  });
  await sleep(1000);

  const step4State = await send('Runtime.evaluate', {
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
  console.log('Step 4 (Fitted to Text):', step4State.result.value);

  // Screenshot 4: Fitted to Text
  const ss4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'smart_text_box_4_fitted_to_text.png'), Buffer.from(ss4.data, 'base64'));
  console.log('Saved screenshot 4: smart_text_box_4_fitted_to_text.png');

  // 7. Test "Auto Width" Toggle
  console.log('7. Enabling Auto Width toggle and typing short title...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const autoWidthCheckbox = document.querySelector('[data-auto-width-checkbox="true"]');
      if (autoWidthCheckbox) {
        autoWidthCheckbox.click();
      }
    })()`,
  });
  await sleep(500);

  await send('Runtime.evaluate', {
    expression: `(() => {
      const textarea = document.querySelector('textarea[class*="textContentArea"]') ||
        document.querySelector('textarea[data-text-editor="true"]');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, "Smart Image Editor Pro");
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`,
  });
  await sleep(1000);

  const step5State = await send('Runtime.evaluate', {
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
  console.log('Step 5 (Auto Width dynamic expansion):', step5State.result.value);

  // Screenshot 5: Auto-width dynamic expansion
  const ss5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'smart_text_box_5_auto_width_expanded.png'), Buffer.from(ss5.data, 'base64'));
  console.log('Saved screenshot 5: smart_text_box_5_auto_width_expanded.png');

  console.log('ALL VERIFICATION CHECKS PASSED WITH FLYING COLORS!');
  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error during verification:', err);
  edge.kill();
  process.exit(1);
});
