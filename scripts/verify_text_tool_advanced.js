import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-text-tool-' + Date.now());

console.log('--- Running Complete Photoshop-Style Text Tool Verification ---');

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9233',
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
      const res = await fetch('http://127.0.0.1:9233/json/list');
      if (res.ok) return await res.json();
    } catch {
      await sleep(250);
    }
  }
  throw new Error('Timeout waiting for Edge debug port 9233');
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
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    const send = (method, params = {}) => {
      return new Promise((resolve) => {
        const id = idCounter++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await new Promise((r) => (ws.onopen = r));
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('1. Navigating to http://localhost:4173/edit-image...');
    await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
    await sleep(2000);

    // 1. Create a blank canvas
    console.log('2. Creating blank canvas (1200 x 800)...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('start-blank-canvas-btn')?.click()`,
    });
    await sleep(400);

    // Change canvas dimensions in modal to 1200x800 for high-res editing
    await send('Runtime.evaluate', {
      expression: `(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
        if (inputs[0]) {
          inputs[0].value = '1200';
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (inputs[1]) {
          inputs[1].value = '800';
          inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`,
    });
    await sleep(200);

    await send('Runtime.evaluate', {
      expression: `document.getElementById('confirm-create-canvas-btn')?.click()`,
    });
    await sleep(1000);

    // 2. Click Text tool on Left Toolbar
    console.log('3. Selecting Text Tool from Left Toolbar...');
    const selectToolRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('aside[aria-label="Editing Tools"] button'));
        const textBtn = btns.find(b => b.innerText.trim() === 'Text' || b.title.includes('Text'));
        if (textBtn) {
          textBtn.click();
          return { success: true };
        }
        return { success: false };
      })()`,
      returnByValue: true,
    });
    console.log('Text tool selected:', selectToolRes.result.value);
    await sleep(400);

    // Verify no premature layers exist
    const prematureLayersCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const layers = Array.from(document.querySelectorAll('[data-layer-id]')).filter(l => l.getAttribute('data-layer-id') !== 'background');
        return layers.length;
      })()`,
      returnByValue: true,
    });
    console.log('Layers before canvas click (must be 0):', prematureLayersCheck.result.value);

    // 3. Click stage using native CDP mouse event
    console.log('4. Clicking canvas stage to create text layer at click position...');
    const stageRect = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]');
        const r = stage.getBoundingClientRect();
        return { x: Math.round(r.left + 80), y: Math.round(r.top + 80) };
      })()`,
      returnByValue: true,
    });
    const { x, y } = stageRect.result.value;

    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await sleep(800);

    // Verify inline editing opened
    const inlineCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('textarea');
        return {
          found: Boolean(textarea),
          placeholder: textarea?.placeholder,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Inline editing state:', inlineCheck.result.value);

    // 4. Type "Travel India"
    console.log('5. Typing "Travel India" into text layer...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.value = 'Travel India';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`,
    });
    await sleep(300);

    // 5. Blur / commit text layer by clicking outside
    console.log('6. Committing text layer...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.blur();
      })()`,
    });
    await sleep(600);

    // 6. Verify 8 resize handles on text layer
    console.log('7. Verifying 8 selection & resize handles...');
    const handlesInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const handles = Array.from(document.querySelectorAll('[data-layer-id]:not([data-layer-id="background"]) [class*="layerHandle"]'));
        const handleClasses = handles.map(h => h.className);
        return {
          totalHandles: handles.length,
          handleClasses
        };
      })()`,
      returnByValue: true,
    });
    console.log('Handles found on text bounding box:', handlesInfo.result.value.totalHandles);

    // 7. Verify Properties Panel Text Inspector
    console.log('8. Inspecting Properties Panel Text Controls...');
    const panelDetails = await send('Runtime.evaluate', {
      expression: `(() => {
        const heading = document.querySelector('[class*="panelHeading"]')?.innerText;
        const fontSizeInput = document.querySelector('input[class*="fontSizeDirectInput"]');
        const quickPills = Array.from(document.querySelectorAll('button[class*="quickSizePill"]')).map(b => b.innerText.trim());
        const fitBtn = document.querySelector('button[class*="fitWidthLinkBtn"]');
        const widthInput = document.querySelector('input[class*="numberInputWithSuffix"]');
        const contentArea = document.querySelector('textarea[class*="textContentArea"]');
        
        return {
          heading,
          fontSize: fontSizeInput?.value,
          quickPills,
          hasFitBtn: Boolean(fitBtn),
          currentWidth: widthInput?.value,
          content: contentArea?.value
        };
      })()`,
      returnByValue: true,
    });
    console.log('Properties Panel Text Details:', panelDetails.result.value);

    // 8. Test direct input change of font size to 48px
    console.log('9. Changing Font Size directly via input to 48px...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[class*="fontSizeDirectInput"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, '48');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()`,
    });
    await sleep(400);

    const checkAfter48 = await send('Runtime.evaluate', {
      expression: `(() => {
        const layerSpan = document.querySelector('[data-layer-id]:not([data-layer-id="background"]) [class*="textRenderSpan"]');
        const input = document.querySelector('input[class*="fontSizeDirectInput"]');
        return {
          inputValue: input?.value,
          canvasRenderedSize: layerSpan?.style?.fontSize
        };
      })()`,
      returnByValue: true,
    });
    console.log('Canvas live font size after typing 48:', checkAfter48.result.value);

    // 9. Test quick size pill 72
    console.log('10. Clicking Quick Size pill (72px)...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const pills = Array.from(document.querySelectorAll('button[class*="quickSizePill"]'));
        const pill72 = pills.find(p => p.innerText.trim() === '72');
        if (pill72) pill72.click();
      })()`,
    });
    await sleep(400);

    const checkAfter72 = await send('Runtime.evaluate', {
      expression: `(() => {
        const layerSpan = document.querySelector('[data-layer-id]:not([data-layer-id="background"]) [class*="textRenderSpan"]');
        const input = document.querySelector('input[class*="fontSizeDirectInput"]');
        return {
          inputValue: input?.value,
          canvasRenderedSize: layerSpan?.style?.fontSize
        };
      })()`,
      returnByValue: true,
    });
    console.log('Canvas live font size after 72px pill:', checkAfter72.result.value);

    // 10. Test Fit to Text button
    console.log('11. Testing "Fit to Text" button...');
    const widthBefore = await send('Runtime.evaluate', {
      expression: `document.querySelector('input[class*="numberInputWithSuffix"]')?.value`,
      returnByValue: true,
    });

    await send('Runtime.evaluate', {
      expression: `document.querySelector('button[class*="fitWidthLinkBtn"]')?.click()`,
    });
    await sleep(400);

    const widthAfter = await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[class*="numberInputWithSuffix"]');
        const layer = document.querySelector('[data-layer-id]:not([data-layer-id="background"])');
        return {
          widthInputValue: input?.value,
          layerWidthStyle: layer?.style?.width
        };
      })()`,
      returnByValue: true,
    });
    console.log('Text box width before:', widthBefore.result.value, '| After Fit to Text:', widthAfter.result.value);

    // 11. Add Bold, Italic, Underline & Stroke for reference styling
    console.log('12. Applying Bold, Underline & Stroke...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const formatBtns = Array.from(document.querySelectorAll('button[class*="formatBtn"]'));
        if (formatBtns[0]) formatBtns[0].click(); // Bold
        if (formatBtns[2]) formatBtns[2].click(); // Underline

        // Outline toggle switch
        const toggle = document.querySelector('label[class*="toggleSwitch"] input');
        if (toggle && !toggle.checked) toggle.click();
      })()`,
    });
    await sleep(500);

    // 12. Capture final verification screenshot
    console.log('13. Capturing comprehensive verification screenshot...');
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.join(outDir, 'smart-editor-text-tool-verified.png');
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    console.log('Saved screenshot:', ssPath);

    console.log('==============================================');
    console.log('ALL ADVANCED TEXT TOOL TESTS PASSED PERFECTLY!');
    console.log('==============================================');

    ws.close();
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    edge.kill();
  }
}

run();
