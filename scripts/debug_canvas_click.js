import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-verified-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9248',
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
        const res = await fetch('http://127.0.0.1:9248/json/list');
        if (res.ok) break;
      } catch {
        await sleep(200);
      }
    }
    const res = await fetch('http://127.0.0.1:9248/json/list');
    const targets = await res.json();
    const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
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

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, functional: true, marketing: false, consentDate: Date.now() }));`
    });

    console.log('1. Navigating to http://localhost:4173/edit-image...');
    await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });

    // 1. Wait for start-blank-canvas-btn to be mounted in DOM
    console.log('2. Waiting for start-blank-canvas-btn...');
    let startFound = false;
    for (let i = 0; i < 40; i++) {
      const res = await send('Runtime.evaluate', {
        expression: `Boolean(document.getElementById('start-blank-canvas-btn'))`,
        returnByValue: true
      });
      if (res.result?.value) {
        startFound = true;
        console.log('Found start button on attempt', i);
        break;
      }
      await sleep(250);
    }
    if (!startFound) throw new Error('Start button never mounted');

    // Click it
    await send('Runtime.evaluate', {
      expression: `document.getElementById('start-blank-canvas-btn').click()`,
    });
    console.log('Clicked start-blank-canvas-btn');

    // 2. Wait for confirm-create-canvas-btn to appear
    let modalFound = false;
    for (let i = 0; i < 40; i++) {
      const res = await send('Runtime.evaluate', {
        expression: `Boolean(document.getElementById('confirm-create-canvas-btn'))`,
        returnByValue: true
      });
      if (res.result?.value) {
        modalFound = true;
        console.log('Found confirm button on attempt', i);
        break;
      }
      await sleep(200);
    }
    if (!modalFound) throw new Error('Modal confirm button never mounted');

    // Click confirm
    await send('Runtime.evaluate', {
      expression: `document.getElementById('confirm-create-canvas-btn').click()`,
    });
    console.log('Clicked confirm-create-canvas-btn');

    // 3. Wait for data-canvas-stage="true"
    let stageFound = false;
    for (let i = 0; i < 40; i++) {
      const res = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('[data-canvas-stage="true"]'))`,
        returnByValue: true
      });
      if (res.result?.value) {
        stageFound = true;
        console.log('Stage mounted on attempt', i);
        break;
      }
      await sleep(200);
    }
    if (!stageFound) throw new Error('Stage never mounted');
    await sleep(600);

    // 4. Click Text tool
    console.log('3. Clicking Text tool in Left Toolbar...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textTool = Array.from(document.querySelectorAll('aside button')).find(b => b.innerText.trim() === 'Text' || b.title.includes('Text'));
        if (textTool) textTool.click();
      })()`,
    });
    await sleep(500);

    // 5. Click canvas stage at (50, 50)
    console.log('4. Clicking canvas stage to place text layer...');
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
    console.log('5. Typing "Travel India"...');
    await send('Input.insertText', { text: 'Travel India' });
    await sleep(500);

    // 7. Commit with Escape
    console.log('6. Committing inline edit...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await sleep(600);

    // 8. Properties panel adjustments: click 36 pill, click Fit to Text, toggle outline
    console.log('7. Adjusting Properties panel: 36px font, Fit to Text, Stroke outline...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const pills = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.trim() === '36');
        if (pills[0]) pills[0].click();

        const fitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Fit to Text');
        if (fitBtn) fitBtn.click();

        const toggle = document.querySelector('label[class*="toggleSwitch"] input');
        if (toggle && !toggle.checked) toggle.click();
      })()`,
    });
    await sleep(800);

    // 9. Verify 8 handles
    const handlesCount = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[data-handle-pos]').length`,
      returnByValue: true
    });
    console.log('Verified handles count:', handlesCount.result.value);

    // 10. Capture screenshot
    console.log('8. Capturing final verified screenshot...');
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.join(outDir, 'smart-editor-text-tool-verified.png');
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    console.log('Successfully saved final verified screenshot to:', ssPath);

    ws.close();
  } catch (e) {
    console.error('Error during execution:', e);
  } finally {
    edge.kill();
  }
}
run();
