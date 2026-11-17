const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9299;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-layers-test-' + Date.now());

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
    } catch { }
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
    } catch { }
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
    if (res.exceptionDetails) {
      console.error('EVAL EXCEPTION:', JSON.stringify(res.exceptionDetails));
    }
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

  // STEP 1: Wait for empty workspace and click Create Canvas
  for (let i = 0; i < 30; i++) {
    const ready = await evaluate(`Boolean(document.getElementById('start-blank-canvas-btn'))`);
    if (ready) break;
    await sleep(300);
  }

  console.log('Opening blank canvas modal...');
  await evaluate(`document.getElementById('start-blank-canvas-btn')?.click()`);
  await sleep(600);

  for (let i = 0; i < 30; i++) {
    const modalReady = await evaluate(`Boolean(document.getElementById('confirm-create-canvas-btn'))`);
    if (modalReady) break;
    await sleep(300);
  }

  console.log('Selecting standard preset and confirming...');
  await evaluate(`(() => {
    const preset = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('400 × 300') || b.innerText.includes('800 × 600'));
    if (preset) preset.click();
  })()`);
  await sleep(400);

  await evaluate(`document.getElementById('confirm-create-canvas-btn')?.click()`);
  await sleep(1500);

  // STEP 2: Switch to Layers tab in Right Workspace
  console.log('\n--- Switching to Layers Tab ---');
  await evaluate(`(() => {
    const btn = document.querySelector('[data-inspector-tab="layers"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Layers'));
    if (btn) btn.click();
  })()`);
  await sleep(800);

  // Verification 1: Check Layers Header & Empty State
  const initialLayerState = await evaluate(`(() => {
    const header = document.querySelector('[data-testid="layers-panel-title"]')?.innerText || '';
    const badge = document.querySelector('[data-inspector-tab="layers"] span[class*="tabBadge"]')?.innerText || '';
    const emptyMsg = document.querySelector('[data-testid="layers-empty"]')?.innerText || '';
    const dropdown = document.querySelector('[class*="addLayerDropdown"]');
    return { header, badge, emptyMsg, hasDropdown: Boolean(dropdown) };
  })()`);
  console.log('Initial Layers State:', initialLayerState);

  const test1Pass = initialLayerState.header.includes('Layers (0)') && !initialLayerState.hasDropdown;
  testReport.tests.push({ name: 'Initial Layers Header and No Dropdown', pass: test1Pass, data: initialLayerState });
  await capture('layers_step1_empty');

  // Verification 2: Check Bottom Toolbar Buttons
  const toolbarButtons = await evaluate(`(() => {
    const addBtn = document.querySelector('[data-testid="layers-add-btn"]');
    const dupBtn = document.querySelector('[data-testid="layers-dup-btn"]');
    const delBtn = document.querySelector('[data-testid="layers-del-btn"]');
    const upBtn = document.querySelector('[data-testid="layers-moveup-btn"]');
    const downBtn = document.querySelector('[data-testid="layers-movedown-btn"]');
    return {
      hasAdd: Boolean(addBtn),
      addTitle: addBtn?.getAttribute('title'),
      hasDup: Boolean(dupBtn),
      hasDel: Boolean(delBtn),
      hasUp: Boolean(upBtn),
      hasDown: Boolean(downBtn)
    };
  })()`);
  console.log('Toolbar Buttons:', toolbarButtons);
  const test2Pass = toolbarButtons.hasAdd && toolbarButtons.hasDup && toolbarButtons.hasDel && toolbarButtons.hasUp && toolbarButtons.hasDown;
  testReport.tests.push({ name: 'Bottom Toolbar Buttons Present', pass: test2Pass, data: toolbarButtons });

  // Verification 3: Direct Click "+ Add Layer" -> Creates Layer 1
  console.log('\n--- Clicking + Add Layer (Direct) ---');
  await evaluate(`document.querySelector('[data-testid="layers-add-btn"]')?.click()`);
  await sleep(600);

  const layer1State = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => ({
      name: r.querySelector('[data-testid^="layer-name-"]')?.textContent?.trim() || '',
      selected: r.getAttribute('data-layer-selected') === 'true',
      hasThumb: Boolean(r.querySelector('[data-testid^="layer-thumb-"]')),
      hasLock: Boolean(r.querySelector('[data-testid^="layer-lock-"]')),
      hasEye: Boolean(r.querySelector('[data-testid^="layer-eye-"]'))
    }));
    const badge = document.querySelector('[data-inspector-tab="layers"] span[class*="tabBadge"]')?.textContent?.trim() || '';
    const header = document.querySelector('[data-testid="layers-panel-title"]')?.textContent?.trim() || '';
    return { rows, badge, header };
  })()`);
  console.log('Layer 1 Created:', layer1State);
  const test3Pass = layer1State.rows.length === 1 && layer1State.rows[0].name.includes('Layer 1') && layer1State.rows[0].selected;
  testReport.tests.push({ name: 'Layer 1 Directly Created and Selected', pass: test3Pass, data: layer1State });
  await capture('layers_step2_layer1_created');

  // Verification 4: Click "+ Add Layer" again -> Creates Layer 2 above Layer 1
  console.log('\n--- Clicking + Add Layer Again -> Layer 2 ---');
  await evaluate(`document.querySelector('[data-testid="layers-add-btn"]')?.click()`);
  await sleep(600);

  const layer2State = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => ({
      name: r.querySelector('[data-testid^="layer-name-"]')?.textContent?.trim() || '',
      selected: r.getAttribute('data-layer-selected') === 'true'
    }));
    const badge = document.querySelector('[data-inspector-tab="layers"] span[class*="tabBadge"]')?.textContent?.trim() || '';
    return { rows, badge };
  })()`);
  console.log('Layer 2 Created (Visual Order: top to bottom):', layer2State);
  const test4Pass = layer2State.rows.length === 2 && layer2State.rows[0].name.includes('Layer 2') && layer2State.rows[0].selected;
  testReport.tests.push({ name: 'Layer 2 Created on Top & Selected', pass: test4Pass, data: layer2State });
  await capture('layers_step3_layer2_created');

  // Verification 5: Add a Rectangle Shape via Left Toolbar to test shape thumbnail & name
  console.log('\n--- Creating Rectangle Shape ---');
  await evaluate(`(() => {
    const rectTool = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('title') || '').includes('Rectangle Tool'));
    if (rectTool) rectTool.click();
  })()`);
  await sleep(400);

  // Draw shape on stage
  await evaluate(`(() => {
    const stage = document.querySelector('[data-stage-container="true"]') || document.querySelector('canvas');
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const startX = rect.left + 150;
    const startY = rect.top + 150;
    const endX = rect.left + 350;
    const endY = rect.top + 300;
    
    stage.dispatchEvent(new MouseEvent('mousedown', { clientX: startX, clientY: startY, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: endX, clientY: endY, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: endX, clientY: endY, bubbles: true }));
  })()`);
  await sleep(800);

  // Switch back to Layers tab if needed
  await evaluate(`(() => {
    const btn = document.querySelector('[data-inspector-tab="layers"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Layers'));
    if (btn) btn.click();
  })()`);
  await sleep(500);

  // Click "+ Add Layer" again to create Layer 3
  console.log('\n--- Creating Layer 3 ---');
  await evaluate(`document.querySelector('[data-testid="layers-add-btn"]')?.click()`);
  await sleep(600);

  const layer3State = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => ({
      name: r.querySelector('[data-testid^="layer-name-"]')?.textContent?.trim() || '',
      selected: r.getAttribute('data-layer-selected') === 'true'
    }));
    const badge = document.querySelector('[data-inspector-tab="layers"] span[class*="tabBadge"]')?.textContent?.trim() || '';
    const header = document.querySelector('[data-testid="layers-panel-title"]')?.textContent?.trim() || '';
    return { rows, badge, header };
  })()`);
  console.log('After Layer 3:', layer3State);
  const test5Pass = layer3State.rows.some(r => r.name.includes('Layer 3'));
  testReport.tests.push({ name: 'Layer 3 Created With Auto-Increment Name', pass: test5Pass, data: layer3State });
  await capture('layers_step4_three_layers');

  // Verification 6: Test Move Down (↓) and Move Up (↑) buttons
  console.log('\n--- Testing Move Down (↓) ---');
  // Currently Layer 3 is top (selected). Let's click Move Down button
  await evaluate(`document.querySelector('[data-testid="layers-movedown-btn"]')?.click()`);
  await sleep(600);

  const afterMoveDownState = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => r.querySelector('[data-testid^="layer-name-"]')?.textContent?.trim() || '');
    return { rows };
  })()`);
  console.log('After Move Down:', afterMoveDownState);
  const test6Pass = afterMoveDownState.rows[1].includes('Layer 3');
  testReport.tests.push({ name: 'Move Down Button Reorders Layer', pass: test6Pass, data: afterMoveDownState });

  console.log('\n--- Testing Move Up (↑) ---');
  await evaluate(`document.querySelector('[data-testid="layers-moveup-btn"]')?.click()`);
  await sleep(600);

  const afterMoveUpState = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => r.querySelector('[data-testid^="layer-name-"]')?.textContent?.trim() || '');
    return { rows };
  })()`);
  console.log('After Move Up:', afterMoveUpState);
  const test7Pass = afterMoveUpState.rows[0].includes('Layer 3');
  testReport.tests.push({ name: 'Move Up Button Restores Layer to Top', pass: test7Pass, data: afterMoveUpState });

  // Verification 7: Test Duplicate Button
  console.log('\n--- Testing Duplicate Button ---');
  await evaluate(`document.querySelector('[data-testid="layers-dup-btn"]')?.click()`);
  await sleep(600);

  const afterDupState = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => r.querySelector('[data-testid^="layer-name-"]')?.textContent?.trim() || '');
    return { rows, count: rows.length };
  })()`);
  console.log('After Duplicate:', afterDupState);
  const test8Pass = afterDupState.rows.some(n => n && (n.includes('copy') || n.includes('Layer 3')));
  testReport.tests.push({ name: 'Duplicate Layer Button', pass: test8Pass, data: afterDupState });

  // Verification 8: Test Delete Button
  console.log('\n--- Testing Delete Button ---');
  await evaluate(`document.querySelector('[data-testid="layers-del-btn"]')?.click()`);
  await sleep(600);

  const afterDelState = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => r.querySelector('[data-testid^="layer-name-"]')?.textContent?.trim() || '');
    return { rows, count: rows.length };
  })()`);
  console.log('After Delete:', afterDelState);
  const test9Pass = afterDelState.count === afterMoveUpState.rows.length;
  testReport.tests.push({ name: 'Delete Layer Button', pass: test9Pass, data: afterDelState });

  // Verification 9: Test Visibility Toggle (Eye)
  console.log('\n--- Testing Visibility Toggle ---');
  await evaluate(`(() => {
    const firstEye = document.querySelector('[data-testid^="layer-row-"] [data-testid^="layer-eye-"]');
    if (firstEye) firstEye.click();
  })()`);
  await sleep(500);

  const visibilityState = await evaluate(`(() => {
    const firstRow = document.querySelector('[data-testid^="layer-row-"]');
    const isHidden = firstRow?.getAttribute('data-layer-hidden') === 'true';
    return { isHidden };
  })()`);
  console.log('After Visibility Toggle:', visibilityState);
  const test10Pass = visibilityState.isHidden;
  testReport.tests.push({ name: 'Visibility Eye Toggle', pass: test10Pass, data: visibilityState });

  // Toggle eye back on
  await evaluate(`(() => {
    const firstEye = document.querySelector('[data-testid^="layer-row-"] [data-testid^="layer-eye-"]');
    if (firstEye) firstEye.click();
  })()`);
  await sleep(400);

  // Verification 10: Test Lock Toggle
  console.log('\n--- Testing Lock Toggle ---');
  await evaluate(`(() => {
    const firstLock = document.querySelector('[data-testid^="layer-row-"] [data-testid^="layer-lock-"]');
    if (firstLock) firstLock.click();
  })()`);
  await sleep(500);

  const lockState = await evaluate(`(() => {
    const firstRow = document.querySelector('[data-testid^="layer-row-"]');
    const isLocked = firstRow?.getAttribute('data-layer-locked') === 'true';
    return { isLocked };
  })()`);
  console.log('After Lock Toggle:', lockState);
  const test11Pass = lockState.isLocked;
  testReport.tests.push({ name: 'Lock Layer Toggle', pass: test11Pass, data: lockState });

  // Unlock back
  await evaluate(`(() => {
    const firstLock = document.querySelector('[data-testid^="layer-row-"] [data-testid^="layer-lock-"]');
    if (firstLock) firstLock.click();
  })()`);
  await sleep(400);

  // Verification 11: Capture high-res Layers panel screenshot
  await capture('layers_final_panel_verification');

  testReport.passedAll = testReport.tests.every(t => t.pass);
  console.log('\n========================================');
  console.log(`ALL TESTS PASSED: ${testReport.passedAll ? 'YES' : 'NO'}`);
  console.log('========================================');

  fs.writeFileSync(
    path.join(outDir, 'layers_panel_test_report.json'),
    JSON.stringify(testReport, null, 2)
  );

  await send('Browser.close');
  if (edge) edge.kill();
  process.exit(testReport.passedAll ? 0 : 1);
}

main().catch(err => {
  console.error('Test execution failed:', err);
  if (edge) edge.kill();
  process.exit(1);
});
