const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9298;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-dyn-props-' + Date.now());

let edge = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`Launching Edge on port ${port}...`);
  edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    `--user-data-dir=${tmpProfile}`,
    'http://localhost:4173/edit-image'
  ]);

  console.log(`Connecting to Edge on port ${port}...`);
  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find(t => t.type === 'page' && t.url.includes('localhost:4173'));
        if (found) {
          pageTarget = found;
          break;
        }
      }
    } catch {}
  }
  if (!pageTarget) {
    throw new Error('Failed to find localhost:4173 page target in Edge DevTools');
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  ws.addEventListener('message', (e) => {
    try {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('BROWSER EXCEPTION:', JSON.stringify(d.params.exceptionDetails));
      }
    } catch {}
  });

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const timer = setTimeout(() => {
      ws.removeEventListener('message', handler);
      reject(new Error(`Timeout waiting for CDP method: ${method} (id=${curId})`));
    }, 12000);
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        clearTimeout(timer);
        ws.removeEventListener('message', handler);
        if (d.error) reject(new Error(JSON.stringify(d.error)));
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  };

  const capture = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(outDir, `${name}.png`);
    fs.writeFileSync(p, Buffer.from(res.data, 'base64'));
    console.log(`[Captured Screenshot] ${name}.png`);
    return p;
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:4173/edit-image...');
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1500);

  // Seed cookie consent
  await evaluate(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.reload');
  await sleep(1800);

  const testReport = {
    timestamp: new Date().toISOString(),
    tests: [],
    passedAll: false
  };

  // STEP 1: Empty workspace check
  for (let i = 0; i < 20; i++) {
    const ready = await evaluate(`Boolean(document.getElementById('start-blank-canvas-btn'))`);
    if (ready) break;
    await sleep(300);
  }

  const emptyStateHeading = await evaluate(`(() => {
    return document.querySelector('[class*="emptyHeading"]')?.innerText || '';
  })()`);
  console.log('Initial empty state heading:', emptyStateHeading);

  // STEP 2: Create a Blank Canvas
  console.log('Opening blank canvas modal...');
  await evaluate(`document.getElementById('start-blank-canvas-btn')?.click()`);
  await sleep(600);

  for (let i = 0; i < 20; i++) {
    const modalReady = await evaluate(`Boolean(document.getElementById('confirm-create-canvas-btn'))`);
    if (modalReady) break;
    await sleep(300);
  }

  console.log('Selecting standard preset and confirming...');
  await evaluate(`(() => {
    const preset = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('400 × 300'));
    if (preset) preset.click();
  })()`);
  await sleep(400);

  await evaluate(`document.getElementById('confirm-create-canvas-btn')?.click()`);
  await sleep(1200);

  // Helper to read current Properties panel heading and badge
  const getPanelInfo = async () => {
    return await evaluate(`(() => {
      const heading = document.querySelector('aside [data-panel-heading], aside h2')?.innerText || '';
      const text = document.querySelector('aside')?.innerText || '';
      return { heading, snippet: text.slice(0, 200) };
    })()`);
  };

  // Helper to click left toolbar tool by title
  const clickTool = async (titleSubstring) => {
    return await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('[data-tools-scroll-area="true"] button, aside button, button')).find(b => {
        const title = b.getAttribute('title') || '';
        const aria = b.getAttribute('aria-label') || '';
        return title.includes('${titleSubstring}') || aria.includes('${titleSubstring}');
      });
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`);
  };

  // TEST 1: Move Tool (Default Canvas Document Properties)
  console.log('\n--- Test 1: Move Tool (Default Canvas Document) ---');
  let info = await getPanelInfo();
  console.log('Move Tool Panel Info:', info);
  const test1Pass = info.heading.includes('Canvas Document');
  testReport.tests.push({ name: 'Move Tool Document Properties', pass: test1Pass, info });
  await capture('dynamic_props_1_move_canvas');

  // TEST 2: Text Tool (Settings Mode)
  console.log('\n--- Test 2: Horizontal Type Tool (Settings Mode) ---');
  await clickTool('Horizontal Type Tool');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Text Tool Panel Info:', info);
  const test2Pass = info.heading.includes('Horizontal Type Tool');
  testReport.tests.push({ name: 'Text Tool Settings Mode', pass: test2Pass, info });
  await capture('dynamic_props_2_text_settings');

  // TEST 3: Resize Tool
  console.log('\n--- Test 3: Resize Image Tool ---');
  await clickTool('Resize Image');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Resize Tool Panel Info:', info);
  const test3Pass = info.heading.includes('Resize Dimensions');
  testReport.tests.push({ name: 'Resize Dimensions Tool', pass: test3Pass, info });
  await capture('dynamic_props_3_resize_tool');

  // TEST 4: Return to Move Tool (Verify Resize is NOT stuck!)
  console.log('\n--- Test 4: Return to Move Tool (Verify Resize is GONE) ---');
  await clickTool('Move Tool');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Move Tool Restored Info:', info);
  const test4Pass = info.heading.includes('Canvas Document') && !info.heading.includes('Resize');
  testReport.tests.push({ name: 'Move Tool Restored without Resize Stale Panel', pass: test4Pass, info });
  await capture('dynamic_props_4_move_restored');

  // TEST 5: Crop Tool
  console.log('\n--- Test 5: Crop Tool ---');
  await clickTool('Crop Tool');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Crop Tool Panel Info:', info);
  const test5Pass = info.heading.includes('Crop Composition');
  testReport.tests.push({ name: 'Crop Composition Tool', pass: test5Pass, info });
  await capture('dynamic_props_5_crop_tool');

  // Cancel Crop to return to Move
  await evaluate(`(() => {
    const cancelBtn = document.querySelector('[data-cancel-crop="true"]');
    if (cancelBtn) cancelBtn.click();
  })()`);
  await sleep(600);

  // TEST 6: Rotate Tool
  console.log('\n--- Test 6: Rotate & Flip Tool ---');
  await clickTool('Rotate & Flip');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Rotate Tool Panel Info:', info);
  const test6Pass = info.heading.includes('Rotate & Flip');
  testReport.tests.push({ name: 'Rotate & Flip Tool', pass: test6Pass, info });
  await capture('dynamic_props_6_rotate_tool');

  // TEST 7: Brush Painting Tool
  console.log('\n--- Test 7: Brush Tool ---');
  await clickTool('Brush Tool');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Brush Tool Panel Info:', info);
  const test7Pass = info.heading.includes('Brush Painting');
  testReport.tests.push({ name: 'Brush Painting Tool', pass: test7Pass, info });
  await capture('dynamic_props_7_brush_tool');

  // TEST 8: Eraser Tool
  console.log('\n--- Test 8: Eraser Tool ---');
  await clickTool('Eraser Tool');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Eraser Tool Panel Info:', info);
  const test8Pass = info.heading.includes('Eraser Tool');
  testReport.tests.push({ name: 'Eraser Tool', pass: test8Pass, info });
  await capture('dynamic_props_8_eraser_tool');

  // TEST 9: Shape Tool Settings & Insert Shape
  console.log('\n--- Test 9: Shape Tool Settings & Insertion ---');
  await clickTool('Rectangle Tool');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Shape Tool Panel Info:', info);
  const test9aPass = info.heading.includes('Shape Tool');

  // Click "Insert Rectangle to Center" button
  console.log('Inserting Rectangle to Center...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Insert') && b.innerText.includes('Center'));
    if (btn) btn.click();
  })()`);
  await sleep(800);

  // After inserting, shape is selected and Move tool is active -> Shape Properties!
  info = await getPanelInfo();
  console.log('Selected Shape Layer Properties Info:', info);
  const hasAlignment = await evaluate(`Boolean(document.querySelector('[title="Align Left"]'))`);
  const hasLock = await evaluate(`Boolean(document.querySelector('[title*="Lock"]'))`);
  const test9bPass = info.heading.includes('Shape Properties') && hasAlignment && hasLock;
  testReport.tests.push({ name: 'Shape Tool Settings & Selected Shape Properties', pass: test9aPass && test9bPass, info, hasAlignment, hasLock });
  await capture('dynamic_props_9_shape_selected');

  // TEST 10: Switch to Resize while shape is selected (Layer preserved)
  console.log('\n--- Test 10: Layer Selection Preserved across Tool Switching ---');
  await clickTool('Resize Image');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Resize active with shape preserved:', info);
  const test10aPass = info.heading.includes('Resize Dimensions');

  // Return to Move tool
  await clickTool('Move Tool');
  await sleep(600);
  info = await getPanelInfo();
  console.log('Back to Move tool with shape selected:', info);
  const test10bPass = info.heading.includes('Shape Properties');
  testReport.tests.push({ name: 'Layer Preserved When Switching Tools', pass: test10aPass && test10bPass, info });
  await capture('dynamic_props_10_layer_preserved');

  // TEST 11: Deselect shape layer -> Returns to Canvas Document
  console.log('\n--- Test 11: Deselect to Canvas Document ---');
  await evaluate(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  })()`);
  await sleep(600);
  info = await getPanelInfo();
  if (!info.heading.includes('Canvas Document')) {
    await evaluate(`(() => {
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      if (vp) vp.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    })()`);
    await sleep(600);
    info = await getPanelInfo();
  }
  console.log('Deselected Info:', info);
  const test11Pass = info.heading.includes('Canvas Document');
  testReport.tests.push({ name: 'Deselect to Canvas Document', pass: test11Pass, info });
  await capture('dynamic_props_11_deselected_canvas');

  testReport.passedAll = testReport.tests.every(t => t.pass);
  console.log('\n======================================================');
  console.log('TEST SUMMARY:', testReport.passedAll ? 'ALL PASSED!' : 'SOME FAILED!');
  testReport.tests.forEach((t, i) => {
    console.log(`[Test ${i+1}] ${t.name}: ${t.pass ? 'PASS' : 'FAIL'}`);
  });
  console.log('======================================================');

  fs.writeFileSync(path.join(outDir, 'dynamic_properties_verification_report.json'), JSON.stringify(testReport, null, 2), 'utf8');

  ws.close();
  edge.kill();
  process.exit(testReport.passedAll ? 0 : 1);
}

main().catch(err => {
  console.error('Test execution failed:', err);
  try { edge.kill(); } catch {}
  process.exit(1);
});
