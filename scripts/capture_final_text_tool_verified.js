import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-final-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9252',
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
        const res = await fetch('http://127.0.0.1:9252/json/list');
        if (res.ok) break;
      } catch {
        await sleep(200);
      }
    }
    const res = await fetch('http://127.0.0.1:9252/json/list');
    const targets = await res.json();
    const pageTarget = targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || targets[0];
    console.log('Selected target:', pageTarget.url);

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

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', msg.params.exceptionDetails?.exception?.description || JSON.stringify(msg.params.exceptionDetails));
      }
    };

    await new Promise((r) => (ws.onopen = r));
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    // Pre-accept cookie consent
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, functional: true, marketing: false, consentDate: Date.now() }));`
    });

    console.log('1. Navigating to http://localhost:4173/edit-image...');
    await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
    await sleep(2000);

    // 2. Open Canvas Setup Modal
    console.log('2. Opening Blank Canvas Setup Modal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('start-blank-canvas-btn');
        if (btn) btn.click();
      })()`,
    });
    await sleep(600);

    // 3. Confirm Canvas (400 x 300)
    console.log('3. Submitting Canvas Creation...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const confirmBtn = document.getElementById('confirm-create-canvas-btn');
        if (confirmBtn) confirmBtn.click();
      })()`,
    });
    await sleep(800);

    // 4. Select Text Tool
    console.log('4. Selecting Text Tool from Left Toolbar...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textTool = Array.from(document.querySelectorAll('aside button')).find(b => b.innerText.trim() === 'Text' || b.title.includes('Text'));
        if (textTool) textTool.click();
      })()`,
    });
    await sleep(500);

    // 5. Click canvas stage at (50, 50)
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

    // 6. Type "Travel India"
    console.log('6. Typing text "Travel India"...');
    await send('Input.insertText', { text: 'Travel India' });
    await sleep(500);

    // 7. Commit with Escape key
    console.log('7. Committing inline edit...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await sleep(600);

    // 8. Properties Panel: set font size to 36 and click Fit to Text
    console.log('8. Adjusting font size to 36px and auto-fitting text width...');
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

    // 9. Inspect 8 handles
    const handlesCount = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[data-handle-pos]').length`,
      returnByValue: true
    });
    console.log('Handles count verified:', handlesCount.result.value);

    // 10. Capture screenshot
    console.log('9. Capturing final verified screenshot...');
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.join(outDir, 'smart-editor-text-tool-verified.png');
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    console.log('Successfully saved verified screenshot to:', ssPath);

    ws.close();
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    edge.kill();
  }
}
run();
