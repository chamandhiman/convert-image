import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-final-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9256',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  'about:blank',
]);

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  try {
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9256/json/list');
        if (res.ok) break;
      } catch {
        await sleep(200);
      }
    }
    const res = await fetch('http://127.0.0.1:9256/json/list');
    const targets = await res.json();
    const pageTarget = targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let id = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const curId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
    await new Promise((r) => (ws.onopen = r));
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    console.log('1. Navigating to http://localhost:4173/edit-image...');
    await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
    await sleep(2000);

    // 1. Open Blank Canvas Modal with retry until confirm button exists
    console.log('2. Opening Blank Canvas Setup Modal (with reactive check)...');
    let modalOpened = false;
    for (let i = 0; i < 30; i++) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.getElementById('start-blank-canvas-btn');
          if (btn) btn.click();
        })()`
      });
      await sleep(350);
      const check = await send('Runtime.evaluate', {
        expression: `Boolean(document.getElementById('confirm-create-canvas-btn'))`,
        returnByValue: true
      });
      if (check.result?.value) {
        modalOpened = true;
        console.log('Modal opened successfully on attempt', i);
        break;
      }
    }
    if (!modalOpened) throw new Error('Modal failed to open');

    // 2. Click confirm with retry until stage mounts
    console.log('3. Confirming Canvas Creation...');
    let stageMounted = false;
    for (let i = 0; i < 30; i++) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const confirmBtn = document.getElementById('confirm-create-canvas-btn');
          if (confirmBtn) confirmBtn.click();
        })()`
      });
      await sleep(350);
      const check = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('[data-canvas-stage="true"]'))`,
        returnByValue: true
      });
      if (check.result?.value) {
        stageMounted = true;
        console.log('Canvas Stage mounted successfully on attempt', i);
        break;
      }
    }
    if (!stageMounted) throw new Error('Stage failed to mount');
    await sleep(600);

    // 3. Select Text Tool from Left Toolbar
    console.log('4. Selecting Text Tool in Left Toolbar...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('aside button'));
        const textBtn = btns.find(b => b.innerText.trim() === 'Text' || b.title?.includes('Text'));
        if (textBtn) textBtn.click();
      })()`,
    });
    await sleep(500);

    // 4. Click canvas stage at (50, 50) using CDP native click
    console.log('5. Clicking canvas stage to place text layer...');
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

    // 5. Type "Travel India"
    console.log('6. Typing "Travel India"...');
    await send('Input.insertText', { text: 'Travel India' });
    await sleep(500);

    // 6. Escape to finish inline editing and show bounding box & 8 handles
    console.log('7. Committing inline edit...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await sleep(600);

    // 7. Adjust in Properties panel: pill 36, Fit to Text, Outline toggle
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
    await sleep(800);

    // 8. Capture verified screenshot
    console.log('9. Capturing screenshot...');
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.join(outDir, 'smart-editor-text-tool-verified.png');
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    console.log('Successfully saved verified screenshot to:', ssPath);

    ws.close();
  } catch (e) {
    console.error('Error during run:', e);
  } finally {
    edge.kill();
  }
}
run();
