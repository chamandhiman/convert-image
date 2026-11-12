import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-profile-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
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
      const res = await fetch('http://127.0.0.1:9222/json/list');
      if (res.ok) return await res.json();
    } catch {
      await sleep(300);
    }
  }
  throw new Error('Timeout waiting for Edge debug port 9222');
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
  await send('DOM.enable');
  await send('Runtime.enable');

  const pagesToTest = [
    { url: 'http://localhost:5173/remove-background', filename: 'verify-remove-bg.png' },
    { url: 'http://localhost:5173/photo-restorer', filename: 'verify-photo-restorer.png' },
    { url: 'http://localhost:5173/convert', filename: 'verify-convert.png' },
    { url: 'http://localhost:5173/crop', filename: 'verify-crop.png' },
    { url: 'http://localhost:5173/privacy', filename: 'verify-privacy.png' },
  ];

  for (const page of pagesToTest) {
    console.log(`Navigating to ${page.url}...`);
    await send('Page.navigate', { url: page.url });

    // Wait for hydration
    for (let s = 0; s < 30; s++) {
      await sleep(400);
      const res = await send('Runtime.evaluate', {
        expression: 'document.getElementById("root")?.children.length || 0',
        returnByValue: true,
      });
      if (res.result?.result?.value > 0) break;
    }

    await sleep(600);

    // Set viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 3200,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sleep(500);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.result.data, 'base64');
    const dest = path.join(outDir, page.filename);
    fs.writeFileSync(dest, buffer);
    console.log(`Saved screenshot: ${page.filename} (${Math.round(buffer.length / 1024)} KB)`);
  }

  ws.close();
  edge.kill();
  console.log('All verification screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error running capture:', err);
  edge.kill();
});
