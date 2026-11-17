const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9293;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-restorer-test-' + Date.now());

let edge = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`Starting headless Edge on port ${port}...`);
  edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    `--user-data-dir=${tmpProfile}`,
    'http://localhost:4173/photo-restorer'
  ]);

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

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const timer = setTimeout(() => {
      ws.removeEventListener('message', handler);
      reject(new Error(`Timeout waiting for CDP method: ${method} (id=${curId})`));
    }, 15000);
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

  const capture = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(outDir, filename);
    fs.writeFileSync(p, Buffer.from(res.data, 'base64'));
    console.log(`[Screenshot Saved] ${filename}`);
    return p;
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  // Set desktop viewport 1440x900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sleep(1500);

  // Wait for restorer container to load
  for (let i = 0; i < 30; i++) {
    const ready = await evaluate(`Boolean(document.querySelector('[data-testid="restorer-container"]'))`);
    if (ready) break;
    await sleep(200);
  }

  const testReport = {
    title: 'Photo Restorer Page Redesign Verification Report',
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: []
  };

  function record(name, pass, details = {}) {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`, details);
    testReport.tests.push({ name, pass, details });
  }

  // 1. Verify Hero Header
  const heroInfo = await evaluate(`(() => {
    const header = document.querySelector('[data-testid="restorer-hero"]');
    if (!header) return null;
    const title = header.querySelector('h1')?.innerText?.trim();
    const sub = header.querySelector('p')?.innerText?.trim();
    const pills = Array.from(header.querySelectorAll('[data-testid="pill-item"]')).map(el => el.innerText.trim());
    return { title, sub, pills };
  })()`);

  record('Hero Header Elements', 
    heroInfo?.title?.includes('Photo Restorer') && 
    heroInfo?.sub?.includes('Restore old, blurry, or damaged photos') &&
    heroInfo?.pills?.length === 5,
    heroInfo
  );

  // 2. Verify Workspace Card Structure
  const workspaceInfo = await evaluate(`(() => {
    const card = document.querySelector('[data-testid="workspace-card"]');
    if (!card) return null;
    const cs = window.getComputedStyle(card);
    const prevCol = card.querySelector('[data-testid="preview-column"]');
    const actCol = card.querySelector('[data-testid="action-column"]');
    const featuresRow = card.querySelector('[data-testid="features-row"]');
    return {
      borderRadius: cs.borderRadius,
      hasLeftCol: Boolean(prevCol),
      hasRightCol: Boolean(actCol),
      hasFeaturesRow: Boolean(featuresRow)
    };
  })()`);

  record('Workspace Card Structure',
    workspaceInfo?.hasLeftCol && workspaceInfo?.hasRightCol && workspaceInfo?.hasFeaturesRow,
    workspaceInfo
  );

  // 3. Verify Before/After Split Viewer & Slider
  const viewerInfo = await evaluate(`(() => {
    const viewer = document.querySelector('[data-testid="sample-split-viewer"]');
    const handle = document.querySelector('[data-testid="slider-handle"]');
    const badgeBefore = document.querySelector('[data-testid="badge-before"]');
    const badgeRestored = document.querySelector('[data-testid="badge-restored"]');
    if (!viewer || !handle) return null;
    const rect = viewer.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      handleLeft: handle.style.left,
      badgeBefore: badgeBefore?.innerText?.trim(),
      badgeRestored: badgeRestored?.innerText?.trim()
    };
  })()`);

  record('Before/After Split Viewer',
    viewerInfo && viewerInfo.badgeBefore === 'Before' && viewerInfo.badgeRestored === 'Restored' && viewerInfo.handleLeft === '50%',
    viewerInfo
  );

  // 4. Test Split Slider Dragging
  await evaluate(`(() => {
    const viewer = document.querySelector('[data-testid="sample-split-viewer"]');
    const handle = document.querySelector('[data-testid="slider-handle"]');
    if (!viewer || !handle) return;
    const rect = viewer.getBoundingClientRect();
    const startX = rect.left + rect.width * 0.5;
    const targetX = rect.left + rect.width * 0.25; // drag to 25%

    viewer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: startX, clientY: rect.top + 50 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: targetX, clientY: rect.top + 50 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: targetX, clientY: rect.top + 50 }));
  })()`);

  await sleep(150); // allow state reconciliation
  const afterDragState = await evaluate(`(() => {
    const handle = document.querySelector('[data-testid="slider-handle"]');
    const origLayer = document.querySelector('[class*="originalLayerWrap"]');
    return {
      handleLeft: handle?.style?.left,
      clipPath: origLayer?.style?.clipPath
    };
  })()`);

  record('Interactive Split Slider Drag',
    afterDragState?.handleLeft !== '50%',
    afterDragState
  );

  // Reset handle back to 50% for screenshot
  await evaluate(`(() => {
    const viewer = document.querySelector('[data-testid="sample-split-viewer"]');
    if (!viewer) return;
    const rect = viewer.getBoundingClientRect();
    const midX = rect.left + rect.width * 0.5;
    viewer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: midX, clientY: rect.top + 50 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: midX, clientY: rect.top + 50 }));
  })()`);
  await sleep(100);

  // 5. Verify Upload Dropzone, Choose Button, Format Hint
  const uploadInfo = await evaluate(`(() => {
    const dropzone = document.querySelector('[data-testid="upload-dropzone"]');
    const btn = document.querySelector('[data-testid="choose-image-btn"]');
    const cloudIcon = document.querySelector('[data-testid="cloud-icon"]');
    const formatHint = document.querySelector('[data-testid="format-hint"]');
    return {
      hasDropzone: Boolean(dropzone),
      hasBtn: Boolean(btn),
      btnText: btn?.innerText?.trim(),
      hasCloudIcon: Boolean(cloudIcon),
      formatHintText: formatHint?.innerText?.trim()
    };
  })()`);

  record('Upload Dropzone & Controls',
    uploadInfo?.hasDropzone && uploadInfo?.btnText === 'Choose Image' && uploadInfo?.formatHintText?.includes('50 MB'),
    uploadInfo
  );

  // 6. Verify 4 Sample Photos
  const sampleInfo = await evaluate(`(() => {
    const sampleSection = document.querySelector('[data-testid="sample-section"]');
    const thumbs = Array.from(document.querySelectorAll('[data-testid^="sample-thumb-"]'));
    return {
      hasSampleSection: Boolean(sampleSection),
      thumbCount: thumbs.length,
      sampleTitles: thumbs.map(t => t.getAttribute('title'))
    };
  })()`);

  record('Sample Photos Picker',
    sampleInfo?.hasSampleSection && sampleInfo?.thumbCount === 4,
    sampleInfo
  );

  // 7. Verify 4 Core Feature Highlights at bottom of workspace card
  const featuresInfo = await evaluate(`(() => {
    const row = document.querySelector('[data-testid="features-row"]');
    if (!row) return null;
    const items = Array.from(row.querySelectorAll('[data-testid="feature-item"]')).map(it => {
      const title = it.querySelector('[data-testid="feature-item-title"]')?.innerText?.trim();
      const desc = it.querySelector('[data-testid="feature-item-desc"]')?.innerText?.trim();
      return { title, desc };
    });
    return { count: items.length, items };
  })()`);

  record('Core Feature Highlights Row',
    featuresInfo?.count === 4 &&
    featuresInfo.items.some(i => i.title === 'Remove Scratches') &&
    featuresInfo.items.some(i => i.title === 'Fix Colors') &&
    featuresInfo.items.some(i => i.title === 'Sharpen Details') &&
    featuresInfo.items.some(i => i.title === 'Reduce Noise'),
    featuresInfo
  );

  // 8. Verify "How Photo Restoration Works" Section
  const howItWorksInfo = await evaluate(`(() => {
    const section = document.querySelector('[data-testid="how-it-works-section"]');
    if (!section) return null;
    const heading = section.querySelector('h3')?.innerText?.trim();
    const steps = Array.from(section.querySelectorAll('[data-testid="step-card"]')).map(sc => {
      const num = sc.querySelector('[data-testid="step-num"]')?.innerText?.trim();
      const title = sc.querySelector('[data-testid="step-title"]')?.innerText?.trim();
      return { num, title };
    });
    return { heading, stepsCount: steps.length, steps };
  })()`);

  record('How Photo Restoration Works Section',
    howItWorksInfo?.heading === 'How Photo Restoration Works' && howItWorksInfo?.stepsCount === 3,
    howItWorksInfo
  );

  // Capture Desktop Screenshot
  const desktopShot = await capture('photo_restorer_desktop_1440.png');
  testReport.screenshots.push({ name: 'Desktop 1440x900', path: desktopShot });

  // 9. Capture Tablet Screenshot
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: true
  });
  await sleep(1000);
  const tabletShot = await capture('photo_restorer_tablet_768.png');
  testReport.screenshots.push({ name: 'Tablet 768x1024', path: tabletShot });

  // 10. Capture Mobile Screenshot
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(1000);
  const mobileShot = await capture('photo_restorer_mobile_390.png');
  testReport.screenshots.push({ name: 'Mobile 390x844', path: mobileShot });

  // 11. Test Interactive Sample Click Loading into Editor
  // Switch back to desktop viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await sleep(1000);

  console.log('Testing sample photo click...');
  await evaluate(`(() => {
    const sampleBtn = document.querySelector('[data-testid="sample-thumb-sample-2"]');
    if (sampleBtn) sampleBtn.click();
  })()`);

  // Wait for LOADED phase (editor workspace appears)
  let loadedPhaseDetected = false;
  for (let i = 0; i < 25; i++) {
    await sleep(300);
    const hasControls = await evaluate(`Boolean(document.querySelector('[data-testid="editor-workspace"]') || document.querySelector('[data-testid="controls-card"]'))`);
    if (hasControls) {
      loadedPhaseDetected = true;
      break;
    }
  }

  record('Interactive Sample Click Loads Photo', loadedPhaseDetected, { loadedPhaseDetected });

  // Capture Loaded state screenshot
  if (loadedPhaseDetected) {
    const loadedShot = await capture('photo_restorer_loaded_state_1440.png');
    testReport.screenshots.push({ name: 'Loaded State 1440x900', path: loadedShot });
  }

  const allPassed = testReport.tests.every(t => t.pass);
  testReport.all_passed = allPassed;

  fs.writeFileSync(path.join(outDir, 'photo_restorer_test_report.json'), JSON.stringify(testReport, null, 2));
  console.log(`\n========================================`);
  console.log(`ALL TESTS: ${allPassed ? 'PASSED (100%)' : 'SOME FAILED'}`);
  console.log(`========================================\n`);

  if (edge) {
    edge.kill('SIGTERM');
  }
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Test execution failed:', err);
  if (edge) edge.kill('SIGTERM');
  process.exit(1);
});
