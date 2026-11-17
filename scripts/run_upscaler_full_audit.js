import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_full_audit_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9294',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Connecting to Edge DevTools on port 9294...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9294/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch {}
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Navigating to http://localhost:4173/image-upscaler...');
  await send('Page.navigate', { url: 'http://localhost:4173/image-upscaler' });
  await sleep(1500);

  // Set cookie consent
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({
        necessary: true, analytics: true, marketing: true, timestamp: Date.now()
      }));
    `,
  });

  const testCases = [
    { name: 'logo_with_text', filePath: path.resolve('public/logo.png'), factor: 2 },
    { name: 'small_icon', filePath: path.resolve('public/favicon.png'), factor: 4 },
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`\n================ Testing: ${tc.name} (${tc.factor}x) ================`);
    await send('Page.navigate', { url: 'http://localhost:4173/image-upscaler' });
    await sleep(1000);

    // Select scale factor if 4x
    if (tc.factor === 4) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btns = Array.from(document.querySelectorAll('button[role="radio"]'));
          const btn4x = btns.find(b => b.textContent.includes('4×'));
          if (btn4x) btn4x.click();
        })()`,
      });
      await sleep(200);
    }

    const doc = await send('DOM.getDocument');
    const inputNode = await send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: 'input[type="file"]'
    });

    if (!inputNode.nodeId) throw new Error('Could not find input[type="file"]');

    await send('DOM.setFileInputFiles', {
      files: [tc.filePath],
      nodeId: inputNode.nodeId
    });

    console.log('File submitted, waiting for inference...');

    let finished = false;
    let finalState = null;
    for (let i = 0; i < 45; i++) {
      await sleep(1000);
      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const errorEl = document.querySelector('[role="alert"]');
          const successEl = document.querySelector('[class*="successBadge"]');
          const progressEl = document.querySelector('[class*="statusMessage"]');
          const dimFlow = document.querySelector('[class*="dimensionFlow"]');
          return {
            hasError: Boolean(errorEl),
            errorText: errorEl ? errorEl.innerText : null,
            hasSuccess: Boolean(successEl),
            progressMessage: progressEl ? progressEl.innerText : null,
            dimensionFlow: dimFlow ? dimFlow.innerText : null,
          };
        })()`,
        returnByValue: true,
      });

      finalState = res.result.value;
      if (finalState.hasSuccess || finalState.hasError) {
        finished = true;
        break;
      }
    }

    console.log(`State after processing ${tc.name}:`, finalState);

    // Capture screenshot of viewer
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.join(outDir, `upscaler_test_${tc.name}.png`);
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    console.log(`Saved screenshot: ${ssPath}`);

    // Verify dimensions of upscaled image
    const imgInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const upscaled = document.querySelector('img[alt*="AI Upscaled"]');
        const orig = document.querySelector('img[alt*="Original"]');
        return {
          upscaled: upscaled ? {
            naturalWidth: upscaled.naturalWidth,
            naturalHeight: upscaled.naturalHeight,
            clientWidth: upscaled.clientWidth,
            clientHeight: upscaled.clientHeight,
            src: upscaled.src.slice(0, 50)
          } : null,
          original: orig ? {
            naturalWidth: orig.naturalWidth,
            naturalHeight: orig.naturalHeight,
            clientWidth: orig.clientWidth,
            clientHeight: orig.clientHeight,
          } : null
        };
      })()`,
      returnByValue: true,
    });

    results.push({
      test: tc.name,
      factor: tc.factor,
      state: finalState,
      images: imgInfo.result.value,
    });
  }

  console.log('\n================ Final Test Summary ================');
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(
    path.join(outDir, 'upscaler_test_results.json'),
    JSON.stringify(results, null, 2)
  );

  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Audit run failed:', err);
  edge.kill();
  process.exit(1);
});

