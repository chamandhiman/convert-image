import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-screen-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9235',
  `--user-data-dir=${userDataDir}`,
  '--window-size=1280,900',
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
      const res = await fetch('http://127.0.0.1:9235/json/list');
      if (res.ok) return await res.json();
    } catch {
      await sleep(300);
    }
  }
  throw new Error('Timeout waiting for port');
}

async function run() {
  const targets = await waitForPort();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
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
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });

  // Wait for React to render
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    const evalRes = await send('Runtime.evaluate', {
      expression: `document.getElementById('root')?.children.length || 0`,
      returnByValue: true
    });
    if (evalRes.result?.result?.value > 0) {
      console.log('Home loaded!');
      break;
    }
  }

  await sleep(1000);

  // 1. Screenshot of Cookie Consent on Desktop
  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-cookie-desktop.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('Saved verify-cookie-desktop.png');

  // Dismiss cookie banner by clicking "Accept All"
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const acceptBtn = btns.find(b => b.textContent.includes('Accept All'));
      if (acceptBtn) acceptBtn.click();
    })()`
  });

  await sleep(600);

  // 2. Screenshot of Floating Header and Hero
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-floating-header-desktop.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('Saved verify-floating-header-desktop.png');

  // 3. Open Image Tools dropdown
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const toolsBtn = btns.find(b => b.textContent.includes('Image Tools'));
      if (toolsBtn) toolsBtn.click();
    })()`
  });

  await sleep(500);
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-tools-dropdown.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('Saved verify-tools-dropdown.png');

  // 4. Open Resources dropdown
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const resBtn = btns.find(b => b.textContent.includes('Resources'));
      if (resBtn) resBtn.click();
    })()`
  });

  await sleep(500);
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-resources-dropdown.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('Saved verify-resources-dropdown.png');

  // 5. Trigger reopen preferences via footer or window event
  await send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new CustomEvent('open-cookie-preferences'))`
  });
  await sleep(600);
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-cookie-customize.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('Saved verify-cookie-customize.png');

  ws.close();
  edge.kill();
  console.log('All screenshots captured successfully!');
}

run().catch(console.error);
