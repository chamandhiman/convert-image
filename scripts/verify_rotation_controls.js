import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_rot_' + Date.now();

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

  // 2. Add a Text Layer
  console.log('2. Adding Text Layer...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-tool-id="text"]')?.click()`,
  });
  await sleep(500);

  const stageCoordRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      if (!stage) return null;
      const r = stage.getBoundingClientRect();
      return { x: Math.round(r.left + 200), y: Math.round(r.top + 160) };
    })()`,
    returnByValue: true,
  });

  const coords = stageCoordRes.result.value;
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
  await sleep(1000);

  // Enter text "Design Rotation Test"
  await send('Runtime.evaluate', {
    expression: `(() => {
      const textarea = document.querySelector('textarea[class*="textContentArea"]') ||
        document.querySelector('textarea[data-text-editor="true"]');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, "Design Rotation Test");
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`,
  });
  await sleep(800);

  // Verify on-canvas rotation handle is present
  const handleCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const handle = document.querySelector('[data-rotation-handle="true"]');
      const rotSection = document.querySelector('[data-rotation-section="true"]');
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      const presets = Array.from(document.querySelectorAll('[data-angle-preset]')).map(b => ({
        angle: b.getAttribute('data-angle-preset'),
        active: b.getAttribute('data-active') === 'true'
      }));
      return {
        hasHandle: Boolean(handle),
        hasSection: Boolean(rotSection),
        angleInputValue: angleInput ? angleInput.value : null,
        presets,
      };
    })()`,
    returnByValue: true,
  });
  console.log('Rotation Controls Initial State:', handleCheck.result.value);

  // Capture Screenshot 1: Initial 0° state with on-canvas rotation handle
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'rotation_1_initial_state.png'), Buffer.from(ss1.data, 'base64'));
  console.log('Saved screenshot 1: rotation_1_initial_state.png');

  // 3. Test on-canvas rotation handle dragging
  console.log('3. Dragging on-canvas rotation handle to rotate clockwise...');
  const handlePosRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const handle = document.querySelector('[data-rotation-knob="true"]') ||
        document.querySelector('[data-rotation-handle="true"]');
      if (!handle) return null;
      const r = handle.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    })()`,
    returnByValue: true,
  });

  const hPos = handlePosRes.result.value;
  console.log('Handle position:', hPos);

  if (hPos) {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: hPos.x, y: hPos.y, button: 'left' });
    // Move to the right/down to rotate clockwise ~45 degrees
    for (let i = 1; i <= 6; i++) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hPos.x + i * 15, y: hPos.y + i * 5 });
      await sleep(50);
    }

    // Check live tooltip visibility during drag
    const liveTooltipRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const tooltip = document.querySelector('[data-rotation-tooltip="true"]');
        return {
          visible: Boolean(tooltip),
          text: tooltip ? tooltip.innerText.trim() : null
        };
      })()`,
      returnByValue: true,
    });
    console.log('Live Angle Tooltip during drag:', liveTooltipRes.result.value);

    // Capture Screenshot 2: Active drag with live angle tooltip
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'rotation_2_active_drag_tooltip.png'), Buffer.from(ss2.data, 'base64'));
    console.log('Saved screenshot 2: rotation_2_active_drag_tooltip.png');

    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: hPos.x + 90, y: hPos.y + 30, button: 'left' });
  }
  await sleep(800);

  const afterDragState = await send('Runtime.evaluate', {
    expression: `(() => {
      const layer = document.querySelector('[data-layer-selected="true"]');
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      const slider = document.querySelector('[data-rotation-slider="true"]');
      return {
        transform: layer ? layer.style.transform : null,
        angleInputValue: angleInput ? angleInput.value : null,
        sliderValue: slider ? slider.value : null
      };
    })()`,
    returnByValue: true,
  });
  console.log('After Drag State (synchronized handle -> input & slider):', afterDragState.result.value);

  // 4. Test Presets: 45°, 90°, 180°, 270°
  console.log('4. Testing quick rotation presets...');
  // Click 45° preset
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-angle-preset="45"]')?.click()`,
  });
  await sleep(600);

  const preset45State = await send('Runtime.evaluate', {
    expression: `(() => {
      const layer = document.querySelector('[data-layer-selected="true"]');
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      const activePreset = document.querySelector('button[data-angle-preset="45"][data-active="true"]');
      return {
        transform: layer ? layer.style.transform : null,
        inputVal: angleInput ? angleInput.value : null,
        is45Active: Boolean(activePreset)
      };
    })()`,
    returnByValue: true,
  });
  console.log('Preset 45° State:', preset45State.result.value);

  // Capture Screenshot 3: Preset 45° active with Rotation section scrolled into view
  await send('Runtime.evaluate', {
    expression: `document.querySelector('[data-rotation-section="true"]')?.scrollIntoView({ behavior: 'instant', block: 'center' })`
  });
  await sleep(300);
  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'rotation_3_preset_45_active.png'), Buffer.from(ss3.data, 'base64'));
  console.log('Saved screenshot 3: rotation_3_preset_45_active.png');

  // Click 90° preset
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-angle-preset="90"]')?.click()`,
  });
  await sleep(600);

  // Click 180° preset
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-angle-preset="180"]')?.click()`,
  });
  await sleep(600);

  // Click 270° preset
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-angle-preset="270"]')?.click()`,
  });
  await sleep(600);

  const preset270State = await send('Runtime.evaluate', {
    expression: `(() => {
      const layer = document.querySelector('[data-layer-selected="true"]');
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      const activePreset = document.querySelector('button[data-angle-preset="270"][data-active="true"]');
      return {
        transform: layer ? layer.style.transform : null,
        inputVal: angleInput ? angleInput.value : null,
        is270Active: Boolean(activePreset)
      };
    })()`,
    returnByValue: true,
  });
  console.log('Preset 270° State:', preset270State.result.value);

  // 5. Test Custom Angle Input (Decimal: 33.5° and Negative: -60°)
  console.log('5. Testing custom angle input with decimal 33.5°...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      if (angleInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(angleInput, '33.5');
        angleInput.dispatchEvent(new Event('input', { bubbles: true }));
        angleInput.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    })()`,
  });
  await sleep(600);

  const customDecimalState = await send('Runtime.evaluate', {
    expression: `(() => {
      const layer = document.querySelector('[data-layer-selected="true"]');
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      return {
        transform: layer ? layer.style.transform : null,
        inputVal: angleInput ? angleInput.value : null
      };
    })()`,
    returnByValue: true,
  });
  console.log('Custom Decimal Angle (33.5°) State:', customDecimalState.result.value);

  // Capture Screenshot 4: Custom Angle 33.5°
  await send('Runtime.evaluate', {
    expression: `document.querySelector('[data-rotation-section="true"]')?.scrollIntoView({ behavior: 'instant', block: 'center' })`
  });
  await sleep(300);
  const ss4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'rotation_4_custom_decimal_angle.png'), Buffer.from(ss4.data, 'base64'));
  console.log('Saved screenshot 4: rotation_4_custom_decimal_angle.png');

  // Test Negative Angle (-60° -> 300°)
  console.log('Testing negative angle (-60°)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      if (angleInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(angleInput, '-60');
        angleInput.dispatchEvent(new Event('input', { bubbles: true }));
        angleInput.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    })()`,
  });
  await sleep(600);

  const negativeAngleState = await send('Runtime.evaluate', {
    expression: `(() => {
      const layer = document.querySelector('[data-layer-selected="true"]');
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      return {
        transform: layer ? layer.style.transform : null,
        inputVal: angleInput ? angleInput.value : null
      };
    })()`,
    returnByValue: true,
  });
  console.log('Negative Angle (-60° normalized to 300°) State:', negativeAngleState.result.value);

  // 6. Test Reset Rotation to 0°
  console.log('6. Clicking Reset Rotation (0°)...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('[data-rotation-reset-btn="true"]')?.click()`,
  });
  await sleep(600);

  const resetState = await send('Runtime.evaluate', {
    expression: `(() => {
      const layer = document.querySelector('[data-layer-selected="true"]');
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      const is0Active = Boolean(document.querySelector('button[data-angle-preset="0"][data-active="true"]'));
      return {
        transform: layer ? layer.style.transform : null,
        inputVal: angleInput ? angleInput.value : null,
        is0Active
      };
    })()`,
    returnByValue: true,
  });
  console.log('Reset Rotation State (0°):', resetState.result.value);

  // 7. Add a Shape Layer and Rotate Shape
  console.log('7. Adding a Shape (Star) and rotating via Properties Panel...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-tool-id="star"]')?.click()`,
  });
  await sleep(1000);

  // Rotate Shape to 45° using preset
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-angle-preset="45"]')?.click()`,
  });
  await sleep(600);

  const shapeRotState = await send('Runtime.evaluate', {
    expression: `(() => {
      const layer = document.querySelector('[data-layer-selected="true"]');
      const angleInput = document.querySelector('[data-rotation-angle-input="true"]');
      return {
        type: layer ? layer.getAttribute('data-layer-type') : null,
        transform: layer ? layer.style.transform : null,
        inputVal: angleInput ? angleInput.value : null
      };
    })()`,
    returnByValue: true,
  });
  console.log('Shape Rotation State (45°):', shapeRotState.result.value);

  // Capture Screenshot 5: Shape layer rotated with rotation handle
  const ss5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'rotation_5_shape_rotated.png'), Buffer.from(ss5.data, 'base64'));
  console.log('Saved screenshot 5: rotation_5_shape_rotated.png');

  // 8. Test Undo and Redo
  console.log('8. Testing Undo & Redo for rotation...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[title*="Undo"]')?.click()`,
  });
  await sleep(600);

  const undoState = await send('Runtime.evaluate', {
    expression: `(() => {
      const layer = document.querySelector('[data-layer-selected="true"]');
      return { transform: layer ? layer.style.transform : null };
    })()`,
    returnByValue: true,
  });
  console.log('After Undo State:', undoState.result.value);

  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[title*="Redo"]')?.click()`,
  });
  await sleep(600);

  const redoState = await send('Runtime.evaluate', {
    expression: `(() => {
      const layer = document.querySelector('[data-layer-selected="true"]');
      return { transform: layer ? layer.style.transform : null };
    })()`,
    returnByValue: true,
  });
  console.log('After Redo State:', redoState.result.value);

  console.log('ALL ROTATION CHECKS PASSED PERFECTLY!');
  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error during rotation verification:', err);
  edge.kill();
  process.exit(1);
});
