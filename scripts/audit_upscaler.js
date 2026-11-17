import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_upscale_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9292',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Connecting to Edge DevTools on port 9292...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9292/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch { }
  }
  if (!targets) throw new Error('Could not connect to Edge DevTools');

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const curId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === curId) {
          ws.removeEventListener('message', handler);
          if (d.error) reject(d.error);
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  ws.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled') {
      const args = d.params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[Browser Console ${d.params.type}]:`, args);
    } else if (d.method === 'Runtime.exceptionThrown') {
      console.error('[Browser Exception]:', d.params.exceptionDetails);
    }
  });

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Navigating to http://localhost:4173/image-upscaler...');
  await send('Page.navigate', { url: 'http://localhost:4173/image-upscaler' });
  await sleep(1500);

  // Set consent
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({
        necessary: true, analytics: true, marketing: true, timestamp: Date.now()
      }));
    `,
  });

  console.log('Setting file on file input via CDP DOM.setFileInputFiles...');
  const testFileAbs = path.resolve('public/logo.png');
  const doc = await send('DOM.getDocument');
  const inputNode = await send('DOM.querySelector', {
    nodeId: doc.root.nodeId,
    selector: 'input[type="file"]'
  });

  if (!inputNode.nodeId) throw new Error('Could not find input[type="file"]');

  await send('DOM.setFileInputFiles', {
    files: [testFileAbs],
    nodeId: inputNode.nodeId
  });

  console.log('File selected. Monitoring upscaler state machine...');

  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const statusRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const errorEl = document.querySelector('[role="alert"]');
        const successEl = document.querySelector('[class*="successBadge"]');
        const progressEl = document.querySelector('[class*="statusMessage"]');
        const progressBar = document.querySelector('[class*="progressBarFill"]');
        const dimFlow = document.querySelector('[class*="dimensionFlow"]');
        return {
          hasError: Boolean(errorEl),
          errorText: errorEl ? errorEl.innerText : null,
          hasSuccess: Boolean(successEl),
          progressMessage: progressEl ? progressEl.innerText : null,
          progressWidth: progressBar ? progressBar.style.width : null,
          dimensionFlow: dimFlow ? dimFlow.innerText : null,
        };
      })()`,
      returnByValue: true,
    });

    const s = statusRes.result.value;
    console.log(`[Tick ${i}s] Progress: ${s.progressMessage || 'none'}, Success: ${s.hasSuccess}, Error: ${s.hasError}`);

    if (s.hasSuccess || s.hasError) {
      console.log('Finished! Final State:', s);
      break;
    }
  }

  // Capture screenshot of results
  await sleep(1000);
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'upscaler_audit_result.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved screenshot: upscaler_audit_result.png');

  // Check actual image properties on page
  const imgData = await send('Runtime.evaluate', {
    expression: `(() => {
      const upscaled = document.querySelector('img[alt*="AI Upscaled"]');
      const orig = document.querySelector('img[alt*="Original"]');
      return {
        upscaled: upscaled ? {
          naturalWidth: upscaled.naturalWidth,
          naturalHeight: upscaled.naturalHeight,
          src: upscaled.src.slice(0, 50),
          className: upscaled.className,
          clientWidth: upscaled.clientWidth,
          clientHeight: upscaled.clientHeight
        } : null,
        original: orig ? {
          naturalWidth: orig.naturalWidth,
          naturalHeight: orig.naturalHeight,
          src: orig.src.slice(0, 50),
          className: orig.className,
          clientWidth: orig.clientWidth,
          clientHeight: orig.clientHeight
        } : null
      };
    })()`,
    returnByValue: true,
  });

  console.log('Images On Page:', JSON.stringify(imgData.result.value, null, 2));

  // Extract upscaled blob data directly from page and save to disk for inspection
  const extractedBuffer = await send('Runtime.evaluate', {
    expression: `(async () => {
      const upscaled = document.querySelector('img[alt*="AI Upscaled"]');
      if (!upscaled) return null;
      const res = await fetch(upscaled.src);
      const blob = await res.blob();
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  if (extractedBuffer.result?.value) {
    const base64Data = extractedBuffer.result.value.replace(/^data:image\/[a-z]+;base64,/, '');
    fs.writeFileSync(path.join(outDir, 'audit_extracted_upscaled.png'), Buffer.from(base64Data, 'base64'));
    console.log('Saved raw upscaled image to audit_extracted_upscaled.png');
  }

  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Audit script failed:', err);
  edge.kill();
  process.exit(1);
});
