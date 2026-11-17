import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_inspect_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9296',
  '--disable-gpu',
  '--disable-extensions',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://127.0.0.1:9296/json/list');
      targets = await res.json();
      if (targets && targets.length) break;
    } catch {}
  }
  const pageTarget = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

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

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  await send('Page.navigate', { url: 'http://localhost:4173/compress-image' });
  await sleep(1500);

  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`
  });

  const routes = ['/compress-image', '/convert-image', '/remove-background', '/photo-restorer', '/image-upscaler', '/'];
  for (const r of routes) {
    await send('Page.navigate', { url: 'http://localhost:4173' + r });
    await sleep(1200);
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const name = 'audit_page_' + (r === '/' ? 'home' : r.replace('/', '')) + '.png';
    fs.writeFileSync(path.join(outDir, name), Buffer.from(ss.data, 'base64'));
    console.log('Captured', name);
  }

  edge.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  edge.kill();
  process.exit(1);
});

