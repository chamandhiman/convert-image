import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-capture-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9240',
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
        const res = await fetch('http://127.0.0.1:9240/json/list');
        if (res.ok) break;
      } catch {
        await sleep(200);
      }
    }
    const res = await fetch('http://127.0.0.1:9240/json/list');
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

    console.log('1. Navigating to http://localhost:4173/edit-image...');
    await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
    await sleep(2000);

    // 2. Open Canvas Setup Modal
    console.log('2. Clicking Blank Canvas...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('start-blank-canvas-btn');
        if (btn) btn.click();
      })()`,
    });
    await sleep(500);

    // 3. Confirm Canvas (400 x 300)
    console.log('3. Confirming Canvas...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const confirmBtn = document.getElementById('confirm-create-canvas-btn');
        if (confirmBtn) confirmBtn.click();
      })()`,
    });
    await sleep(1000);

    // 4. Click Text Tool on Left Toolbar
    console.log('4. Clicking Text Tool in Left Toolbar...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('aside[aria-label="Editing Tools"] button'));
        const textBtn = btns.find(b => b.innerText.trim() === 'Text' || b.title.includes('Text'));
        if (textBtn) textBtn.click();
      })()`,
    });
    await sleep(500);

    // 5. Get stage coordinates and click
    console.log('5. Clicking stage to place text layer...');
    const stagePos = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]');
        const rect = stage.getBoundingClientRect();
        return { x: Math.round(rect.left + 50), y: Math.round(rect.top + 50) };
      })()`,
      returnByValue: true
    });
    const { x, y } = stagePos.result.value;

    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(800);

    // 6. Type "Travel India"
    console.log('6. Typing "Travel India"...');
    await send('Input.insertText', { text: 'Travel India' });
    await sleep(400);

    // 7. Finish editing by pressing Escape
    console.log('7. Committing inline edit...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await sleep(500);

    // 8. Properties Panel: Click quick pill 36 and click Fit to Text
    console.log('8. Styling text in Properties panel...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const pills = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.trim() === '36');
        if (pills[0]) pills[0].click();

        const fitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Fit to Text');
        if (fitBtn) fitBtn.click();

        // Stroke toggle
        const toggle = document.querySelector('label[class*="toggleSwitch"] input');
        if (toggle && !toggle.checked) toggle.click();
      })()`,
    });
    await sleep(600);

    // 9. Capture screenshot
    console.log('9. Capturing final screenshot...');
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.join(outDir, 'smart-editor-text-tool-verified.png');
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    console.log('Successfully saved screenshot to:', ssPath);

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edge.kill();
  }
}

run();

