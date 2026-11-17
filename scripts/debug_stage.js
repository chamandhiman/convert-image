import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-capture-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9238',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  'about:blank',
]);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  try {
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9238/json/list');
        if (res.ok) break;
      } catch {
        await sleep(200);
      }
    }
    const res = await fetch('http://127.0.0.1:9238/json/list');
    const targets = await res.json();
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    console.log('Navigating to http://localhost:4173/edit-image...');
    await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });

    // Wait for start button to be available
    for (let i = 0; i < 30; i++) {
      const check = await send('Runtime.evaluate', {
        expression: `Boolean(document.getElementById('start-blank-canvas-btn'))`,
        returnByValue: true
      });
      if (check.result?.value) {
        console.log('Start blank canvas button found on iteration', i);
        break;
      }
      await sleep(250);
    }

    // Dismiss cookie banner if present
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const accept = btns.find(b => b.innerText.includes('Accept All'));
        if (accept) accept.click();
      })()`
    });
    await sleep(300);

    // Click Blank Canvas Button
    console.log('Clicking #start-blank-canvas-btn...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('start-blank-canvas-btn')?.click()`,
    });

    // Wait for modal confirm button to appear
    for (let i = 0; i < 30; i++) {
      const check = await send('Runtime.evaluate', {
        expression: `Boolean(document.getElementById('confirm-create-canvas-btn'))`,
        returnByValue: true
      });
      if (check.result?.value) {
        console.log('Modal confirm button found on iteration', i);
        break;
      }
      await sleep(250);
    }

    // Click confirm in modal
    console.log('Clicking #confirm-create-canvas-btn...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('confirm-create-canvas-btn')?.click()`,
    });

    // Wait for stage to appear
    for (let i = 0; i < 30; i++) {
      const check = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('[data-canvas-stage="true"]'))`,
        returnByValue: true
      });
      if (check.result?.value) {
        console.log('Canvas Stage mounted on iteration', i);
        break;
      }
      await sleep(250);
    }
    await sleep(800);

    // Click Text tool
    console.log('Clicking Text tool on Left Toolbar...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('aside[aria-label="Editing Tools"] button'));
        const textBtn = btns.find(b => b.innerText.trim() === 'Text' || b.title.includes('Text'));
        if (textBtn) textBtn.click();
      })()`,
    });
    await sleep(600);

    // Get stage rect
    const stageRect = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]');
        if (!stage) return null;
        const r = stage.getBoundingClientRect();
        return { x: Math.round(r.left + 80), y: Math.round(r.top + 80) };
      })()`,
      returnByValue: true
    });
    console.log('Stage click position:', stageRect.result?.value);

    const { x, y } = stageRect.result.value;
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(800);

    // Type "Travel India"
    console.log('Typing text "Travel India"...');
    await send('Input.insertText', { text: 'Travel India' });
    await sleep(500);

    // Press Escape to commit text and show 8 handles
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await sleep(500);

    // Properties panel: set font size to 36 and click Fit to Text
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
    await sleep(800);

    // Capture verified screenshot
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.join(outDir, 'smart-editor-text-tool-verified.png');
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    console.log('Successfully saved verified screenshot to:', ssPath);

    ws.close();
  } catch (e) {
    console.error('Error:', e);
  } finally {
    edge.kill();
  }
}

run();
