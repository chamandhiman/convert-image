import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-resize-' + Date.now());
const testImagePath = path.resolve('src/assets/images/before-after.png');

console.log('Using test image:', testImagePath);

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9223',
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
      const res = await fetch('http://127.0.0.1:9223/json/list');
      if (res.ok) return await res.json();
    } catch {
      await sleep(300);
    }
  }
  throw new Error('Timeout waiting for Edge debug port 9223');
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1360,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Navigating to http://localhost:5173/resize...');
  await send('Page.navigate', { url: 'http://localhost:5173/resize' });

  // Wait for hydration
  for (let s = 0; s < 30; s++) {
    await sleep(400);
    const res = await send('Runtime.evaluate', {
      expression: 'document.getElementById("tool") ? 1 : 0',
      returnByValue: true,
    });
    if (res.result?.result?.value === 1) break;
  }
  await sleep(600);

  // Capture empty state
  const emptyShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'resize-empty.png'), Buffer.from(emptyShot.result.data, 'base64'));
  console.log('Saved resize-empty.png');

  // Find file input and set test image
  const doc = await send('DOM.getDocument');
  const fileInputNode = await send('DOM.querySelector', {
    nodeId: doc.result.root.nodeId,
    selector: 'input[type="file"]',
  });

  if (!fileInputNode.result.nodeId) {
    throw new Error('Could not find file input');
  }

  console.log('Setting file on file input nodeId:', fileInputNode.result.nodeId);
  await send('DOM.setFileInputFiles', {
    nodeId: fileInputNode.result.nodeId,
    files: [testImagePath],
  });

  // Wait for image loading and state transition
  console.log('Waiting for image to load into studio...');
  for (let s = 0; s < 30; s++) {
    await sleep(400);
    const res = await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("input[type=\'number\']").length',
      returnByValue: true,
    });
    if (res.result?.result?.value > 0) {
      console.log('Studio controls detected!');
      break;
    }
  }

  await sleep(1000);

  // Inspect values in DOM
  const evalValues = await send('Runtime.evaluate', {
    expression: `(() => {
      const inputs = Array.from(document.querySelectorAll("input[type='number']")).map(i => i.value);
      const inspectorVals = Array.from(document.querySelectorAll("[class*='inspectorValue']")).map(e => e.textContent);
      const comparisonVals = Array.from(document.querySelectorAll("[class*='compRow']")).map(e => e.textContent);
      return { inputs, inspectorVals, comparisonVals };
    })()`,
    returnByValue: true,
  });
  console.log('Detected Studio Values:', JSON.stringify(evalValues.result?.result?.value, null, 2));

  // Set height for full studio screenshot
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1360,
    height: 1800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(500);

  // Capture studio with image loaded
  const studioShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'resize-studio.png'), Buffer.from(studioShot.result.data, 'base64'));
  console.log('Saved resize-studio.png');

  // Click Before / After view tab
  console.log('Switching to Before / After view tab...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const compareBtn = btns.find(b => b.textContent.includes("Before / After"));
      if (compareBtn) compareBtn.click();
      return !!compareBtn;
    })()`,
  });
  await sleep(800);

  const compareShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'resize-compare.png'), Buffer.from(compareShot.result.data, 'base64'));
  console.log('Saved resize-compare.png');

  // Click "Resize Image" primary button
  console.log('Clicking Resize Image primary CTA...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const resizeBtn = btns.find(b => b.textContent.includes("Resize Image") || b.textContent.includes("Resize All"));
      if (resizeBtn) resizeBtn.click();
      return !!resizeBtn;
    })()`,
  });

  // Wait for results
  console.log('Waiting for resize completion...');
  for (let s = 0; s < 30; s++) {
    await sleep(400);
    const res = await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("[class*=\'resultCard\']").length',
      returnByValue: true,
    });
    if (res.result?.result?.value > 0) {
      console.log('Results view rendered!');
      break;
    }
  }
  await sleep(800);

  const resultsShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'resize-results.png'), Buffer.from(resultsShot.result.data, 'base64'));
  console.log('Saved resize-results.png');

  ws.close();
  edge.kill();
  console.log('Resize testing completed successfully!');
}

run().catch((err) => {
  console.error('Error running test_resize_studio:', err);
  edge.kill();
});

