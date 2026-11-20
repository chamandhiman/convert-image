const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9410;
const previewUrl = 'http://127.0.0.1:4173';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-psd-drag-' + Date.now());

let edge = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log(`[PSD Drag Test] Reading PSD fixture...`);
  const psdBuf = fs.readFileSync(path.join(__dirname, '..', 'public', 'test-photoshop-fixture.psd'));
  const psdBase64 = psdBuf.toString('base64');
  console.log(`[PSD Drag Test] Fixture size: ${psdBuf.length} bytes, base64 length: ${psdBase64.length}`);

  // 100x100 transparent/colored sample PNG
  const samplePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA7SURBVHhe7cExAQAAAMKg9U9tDQ8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4Fs1QAAByj44pQAAAABJRU5ErkJggg==';

  console.log(`[PSD Drag Test] Launching Edge headless on port ${port}...`);
  edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-features=SyncConfirmation,SignInPromo',
    '--guest',
    `--user-data-dir=${tmpProfile}`,
    `${previewUrl}/edit-image`,
  ]);

  console.log(`[PSD Drag Test] Connecting to Edge DevTools target...`);
  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page');
        if (found) {
          pageTarget = found;
          break;
        }
      }
    } catch {}
  }

  if (!pageTarget) {
    throw new Error('Failed to find page target in Edge DevTools');
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const curId = id++;
      const timer = setTimeout(() => {
        ws.removeEventListener('message', handler);
        reject(new Error(`Timeout waiting for CDP method: ${method} (id=${curId})`));
      }, 25000);

      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === curId) {
          clearTimeout(timer);
          ws.removeEventListener('message', handler);
          if (data.error) reject(new Error(JSON.stringify(data.error)));
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  ws.addEventListener('message', (msg) => {
    const data = JSON.parse(msg.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map((a) => a.value || a.description).join(' ');
      console.log(`[Browser Console ${data.params.type}]`, text);
    }
  });

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1500,
    height: 980,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const evaluate = async (expr) => {
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
        const res = await send('Runtime.evaluate', {
          expression: expr,
          returnByValue: true,
          awaitPromise: true,
        });
        if (res.exceptionDetails) {
          throw new Error(
            `Evaluation failed: ${res.exceptionDetails.exception?.description || JSON.stringify(res.exceptionDetails)}`
          );
        }
        return res.result?.value;
      } catch (err) {
        if (attempt < 14 && (err.message.includes('execution context') || err.message.includes('context'))) {
          await sleep(400);
          continue;
        }
        throw err;
      }
    }
  };

  const captureScreenshot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(outDir, filename);
    fs.writeFileSync(fullPath, Buffer.from(shot.data, 'base64'));
    console.log(`[PSD Drag Test] Saved screenshot: ${fullPath}`);
  };

  // Wait for initial render
  console.log(`[PSD Drag Test] Waiting for Editor Welcome Screen...`);
  for (let i = 0; i < 40; i++) {
    try {
      const ready = await evaluate(`Boolean(document.querySelector('[data-testid="editor-welcome-screen"]'))`);
      if (ready) break;
    } catch {}
    await sleep(300);
  }
  await sleep(800);

  const setupHelpers = () => evaluate(`
    window.__base64ToBlob = function(b64, mime) {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    };

    window.__createFile = function(b64, name, mime) {
      const blob = window.__base64ToBlob(b64, mime);
      return new File([blob], name, { type: mime });
    };

    window.__dispatchDragAndDrop = function(selector, files) {
      let target = document.querySelector(selector);
      if (!target) {
        target =
          document.querySelector('[data-testid="canvas-viewport"]') ||
          document.querySelector('[data-testid="welcome-upload-dropzone"]') ||
          document.querySelector('[data-testid="welcome-drag-drop-area"]') ||
          document.getElementById('tool') ||
          document.body;
      }
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));

      const enterEvt = new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt });
      target.dispatchEvent(enterEvt);

      const overEvt = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt });
      target.dispatchEvent(overEvt);

      // Check if generic "Convert Image" overlay is visible
      const genericOverlay = document.querySelector('[class*="DragOverlay_overlay"]');
      const genericText = genericOverlay ? genericOverlay.textContent : null;

      const dropEvt = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
      target.dispatchEvent(dropEvt);

      return {
        genericOverlayFound: Boolean(genericOverlay),
        genericText: genericText
      };
    };
  `);

  await setupHelpers();

  const results = {};

  // =========================================================================
  // SCENARIO 1: Drag PSD onto Welcome Screen
  // =========================================================================
  console.log(`\n--- SCENARIO 1: Drag PSD onto Welcome Screen ---`);
  const s1Drop = await evaluate(`
    (function() {
      const psdFile = window.__createFile('${psdBase64}', 'hero-banner.psd', 'image/vnd.adobe.photoshop');
      return window.__dispatchDragAndDrop('[data-testid="welcome-upload-dropzone"]', [psdFile]);
    })()
  `);
  console.log(`[Scenario 1] Drop dispatched. Generic overlay present:`, s1Drop.genericOverlayFound);

  // Wait for document tab to appear
  let s1State = null;
  for (let i = 0; i < 25; i++) {
    await sleep(200);
    s1State = await evaluate(`
      (function() {
        const tabs = Array.from(document.querySelectorAll('[data-testid="document-tabs-bar"] [role="tab"]'))
          .map(t => t.textContent.trim());
        const layers = Array.from(document.querySelectorAll('[data-testid="layer-row"]'))
          .map(l => l.textContent.trim());
        const hasCanvas = Boolean(document.querySelector('[data-canvas-stage="true"]'));
        const hasGenericOverlay = Boolean(document.querySelector('[class*="DragOverlay_overlay"]'));
        const hasPsdModal = Boolean(document.querySelector('[data-testid="psd-import-modal"]'));
        return { tabs, layersCount: layers.length, layers, hasCanvas, hasGenericOverlay, hasPsdModal };
      })()
    `);
    if (s1State && s1State.tabs.length > 0) break;
  }
  // Switch to Layers tab to inspect imported layers
  await evaluate(`
    (function() {
      const layersTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Layers');
      if (layersTab) layersTab.click();
    })()
  `);
  await sleep(400);

  s1State = await evaluate(`
    (function() {
      const tabs = Array.from(document.querySelectorAll('[data-testid="document-tabs-bar"] [role="tab"]'))
        .map(t => t.textContent.trim());
      const layers = Array.from(document.querySelectorAll('[data-testid="layer-row"]'))
        .map(l => l.textContent.trim());
      const hasCanvas = Boolean(document.querySelector('[data-canvas-stage="true"]'));
      const hasGenericOverlay = Boolean(document.querySelector('[class*="DragOverlay_overlay"]'));
      const hasPsdModal = Boolean(document.querySelector('[data-testid="psd-import-modal"]'));
      return { tabs, layersCount: layers.length, layers, hasCanvas, hasGenericOverlay, hasPsdModal };
    })()
  `);

  console.log(`[Scenario 1] Tabs:`, s1State.tabs);
  console.log(`[Scenario 1] Layers count:`, s1State.layersCount);
  console.log(`[Scenario 1] Canvas rendered:`, s1State.hasCanvas);
  console.log(`[Scenario 1] Generic overlay opened:`, s1State.hasGenericOverlay);
  console.log(`[Scenario 1] Intermediate PSD modal opened:`, s1State.hasPsdModal);

  results.scenario1 = {
    genericOverlayPrevented: !s1Drop.genericOverlayFound && !s1State.hasGenericOverlay,
    noIntermediateModal: !s1State.hasPsdModal,
    tabCreated: s1State.tabs.some((t) => t.includes('hero-banner.psd')),
    layersImported: s1State.layersCount >= 1,
    canvasRendered: s1State.hasCanvas,
  };
  await captureScreenshot('psd_drag_01_welcome_drop.png');

  // =========================================================================
  // SCENARIO 2: Drag PNG onto Editor Canvas Viewport
  // =========================================================================
  console.log(`\n--- SCENARIO 2: Drag PNG onto Editor Canvas ---`);
  const s2Drop = await evaluate(`
    (function() {
      const pngFile = window.__createFile('${samplePngBase64}', 'photo-card.png', 'image/png');
      return window.__dispatchDragAndDrop('[data-testid="canvas-viewport"]', [pngFile]);
    })()
  `);
  console.log(`[Scenario 2] Generic overlay present:`, s2Drop.genericOverlayFound);

  let s2State = null;
  for (let i = 0; i < 20; i++) {
    await sleep(200);
    s2State = await evaluate(`
      (function() {
        const tabs = Array.from(document.querySelectorAll('[data-testid="document-tabs-bar"] [role="tab"]'))
          .map(t => t.textContent.trim());
        return { tabs, tabsCount: tabs.length };
      })()
    `);
    if (s2State && s2State.tabsCount >= 2) break;
  }
  console.log(`[Scenario 2] Tabs after canvas drop:`, s2State.tabs);
  results.scenario2 = {
    genericOverlayPrevented: !s2Drop.genericOverlayFound,
    twoTabsOpen: s2State.tabsCount >= 2,
    hasPhotoCardTab: s2State.tabs.some((t) => t.includes('photo-card.png')),
  };
  await captureScreenshot('psd_drag_02_canvas_drop.png');

  // =========================================================================
  // SCENARIO 3: Drag PSD onto Document Tabs Bar
  // =========================================================================
  console.log(`\n--- SCENARIO 3: Drag PSD onto Document Tabs Bar ---`);
  const s3Drop = await evaluate(`
    (function() {
      const psdFile2 = window.__createFile('${psdBase64}', 'vector-logo.psd', 'image/vnd.adobe.photoshop');
      return window.__dispatchDragAndDrop('[data-testid="document-tabs-bar"]', [psdFile2]);
    })()
  `);
  console.log(`[Scenario 3] Generic overlay present:`, s3Drop.genericOverlayFound);

  let s3State = null;
  for (let i = 0; i < 20; i++) {
    await sleep(200);
    s3State = await evaluate(`
      (function() {
        const tabs = Array.from(document.querySelectorAll('[data-testid="document-tabs-bar"] [role="tab"]'))
          .map(t => t.textContent.trim());
        return { tabs, tabsCount: tabs.length };
      })()
    `);
    if (s3State && s3State.tabsCount >= 3) break;
  }
  console.log(`[Scenario 3] Tabs after tabs bar drop:`, s3State.tabs);
  results.scenario3 = {
    genericOverlayPrevented: !s3Drop.genericOverlayFound,
    threeTabsOpen: s3State.tabsCount >= 3,
    hasVectorLogoTab: s3State.tabs.some((t) => t.includes('vector-logo.psd')),
  };
  await captureScreenshot('psd_drag_03_tabs_bar_drop.png');

  // =========================================================================
  // SCENARIO 4: Return to Welcome Screen -> Drag PNG onto Welcome Screen
  // =========================================================================
  console.log(`\n--- SCENARIO 4: Drag PNG onto Welcome Screen ---`);
  await send('Page.navigate', { url: `${previewUrl}/edit-image` });
  for (let i = 0; i < 40; i++) {
    try {
      const ready = await evaluate(`Boolean(document.querySelector('[data-testid="editor-welcome-screen"]'))`);
      if (ready) break;
    } catch {}
    await sleep(300);
  }
  await sleep(600);
  await setupHelpers();

  // Check if on Welcome Screen
  const onWelcome = await evaluate(`Boolean(document.querySelector('[data-testid="editor-welcome-screen"]'))`);
  console.log(`[Scenario 4] Returned to Welcome Screen:`, onWelcome);

  const s4Drop = await evaluate(`
    (function() {
      const pngFile = window.__createFile('${samplePngBase64}', 'welcome-splash.png', 'image/png');
      return window.__dispatchDragAndDrop('[data-testid="welcome-upload-dropzone"]', [pngFile]);
    })()
  `);

  let s4State = null;
  for (let i = 0; i < 25; i++) {
    await sleep(200);
    s4State = await evaluate(`
      (function() {
        const tabs = Array.from(document.querySelectorAll('[data-testid="document-tabs-bar"] [role="tab"]'))
          .map(t => t.textContent.trim());
        const hasCanvas = Boolean(document.querySelector('[data-canvas-stage="true"]'));
        return { tabs, hasCanvas };
      })()
    `);
    if (s4State && s4State.tabs.length > 0) break;
  }
  console.log(`[Scenario 4] Tabs:`, s4State.tabs);
  results.scenario4 = {
    genericOverlayPrevented: !s4Drop.genericOverlayFound,
    openedPngDocument: s4State.tabs.some((t) => t.includes('welcome-splash.png')),
    canvasRendered: s4State.hasCanvas,
  };
  await captureScreenshot('psd_drag_04_png_welcome_drop.png');

  // =========================================================================
  // SCENARIO 5: Drag Multiple Images (Batch drop)
  // =========================================================================
  console.log(`\n--- SCENARIO 5: Drag Multiple Images Simultaneously ---`);
  const s5Drop = await evaluate(`
    (function() {
      const img1 = window.__createFile('${samplePngBase64}', 'batch-one.png', 'image/png');
      const img2 = window.__createFile('${samplePngBase64}', 'batch-two.jpg', 'image/jpeg');
      return window.__dispatchDragAndDrop('[data-testid="canvas-viewport"]', [img1, img2]);
    })()
  `);
  await sleep(1200);

  const s5State = await evaluate(`
    (function() {
      const tabs = Array.from(document.querySelectorAll('[data-testid="document-tabs-bar"] [role="tab"]'))
        .map(t => t.textContent.trim());
      return { tabs, tabsCount: tabs.length };
    })()
  `);
  console.log(`[Scenario 5] Tabs after batch image drop:`, s5State.tabs);
  results.scenario5 = {
    genericOverlayPrevented: !s5Drop.genericOverlayFound,
    bothImagesOpened:
      s5State.tabs.some((t) => t.includes('batch-one.png')) &&
      s5State.tabs.some((t) => t.includes('batch-two.jpg')),
    totalTabsCount: s5State.tabsCount,
  };
  await captureScreenshot('psd_drag_05_multiple_images.png');

  // =========================================================================
  // SCENARIO 6: Drag PSD + PNG Together (Mixed File Types)
  // =========================================================================
  console.log(`\n--- SCENARIO 6: Drag Mixed PSD + PNG Simultaneously ---`);
  const s6Drop = await evaluate(`
    (function() {
      const psd = window.__createFile('${psdBase64}', 'mixed-design.psd', 'image/vnd.adobe.photoshop');
      const png = window.__createFile('${samplePngBase64}', 'mixed-asset.png', 'image/png');
      return window.__dispatchDragAndDrop('[data-testid="canvas-viewport"]', [psd, png]);
    })()
  `);
  await sleep(1800);

  const s6State = await evaluate(`
    (function() {
      const tabs = Array.from(document.querySelectorAll('[data-testid="document-tabs-bar"] [role="tab"]'))
        .map(t => t.textContent.trim());
      return { tabs, tabsCount: tabs.length };
    })()
  `);
  console.log(`[Scenario 6] Tabs after mixed drop:`, s6State.tabs);
  results.scenario6 = {
    genericOverlayPrevented: !s6Drop.genericOverlayFound,
    psdTabOpened: s6State.tabs.some((t) => t.includes('mixed-design.psd')),
    pngTabOpened: s6State.tabs.some((t) => t.includes('mixed-asset.png')),
  };
  await captureScreenshot('psd_drag_06_mixed_psd_png.png');

  // =========================================================================
  // SCENARIO 7: Drag Unsupported File (e.g. document.pdf)
  // =========================================================================
  console.log(`\n--- SCENARIO 7: Drag Unsupported File (document.pdf) ---`);
  const s7Drop = await evaluate(`
    (function() {
      const pdf = window.__createFile(btoa('%PDF-1.4 sample document content here'), 'architecture-spec.pdf', 'application/pdf');
      return window.__dispatchDragAndDrop('[data-testid="canvas-viewport"]', [pdf]);
    })()
  `);

  let s7State = null;
  for (let i = 0; i < 20; i++) {
    await sleep(200);
    s7State = await evaluate(`
      (function() {
        const alert = document.querySelector('[data-testid="workspace-alert"]') || document.querySelector('[class*="workspaceAlert"]');
        const alertText = alert ? alert.textContent.trim() : '';
        return { alertText, hasAlert: Boolean(alert) };
      })()
    `);
    if (s7State && s7State.hasAlert) break;
  }

  console.log(`[Scenario 7] Alert message:`, s7State?.alertText);
  results.scenario7 = {
    genericOverlayPrevented: !s7Drop.genericOverlayFound,
    unsupportedAlertShown: Boolean(s7State?.hasAlert && s7State?.alertText?.includes('Unsupported file format')),
    alertText: s7State?.alertText || '',
  };
  await captureScreenshot('psd_drag_07_unsupported_file_error.png');

  // Clear alert for next scenario
  await evaluate(`
    (function() {
      const btn = document.querySelector('[data-testid="alert-close-btn"]') || document.querySelector('[class*="alertCloseBtn"]');
      if (btn) btn.click();
    })()
  `);
  await sleep(400);

  // =========================================================================
  // SCENARIO 8: Drag Invalid / Corrupted PSD File
  // =========================================================================
  console.log(`\n--- SCENARIO 8: Drag Corrupt / Invalid PSD File ---`);
  const s8Drop = await evaluate(`
    (function() {
      // Fake PSD with text content (invalid 8BPS signature)
      const fakePsd = window.__createFile(btoa('NOT_A_VALID_PSD_HEADER_DATA_CONTENT_HERE'), 'corrupt-mock.psd', 'image/vnd.adobe.photoshop');
      return window.__dispatchDragAndDrop('[data-testid="canvas-viewport"]', [fakePsd]);
    })()
  `);

  let s8State = null;
  for (let i = 0; i < 20; i++) {
    await sleep(200);
    s8State = await evaluate(`
      (function() {
        const alert = document.querySelector('[data-testid="workspace-alert"]') || document.querySelector('[class*="workspaceAlert"]');
        const alertText = alert ? alert.textContent.trim() : '';
        const currentUrl = window.location.pathname;
        return { alertText, hasAlert: Boolean(alert), currentUrl };
      })()
    `);
    if (s8State && s8State.hasAlert) break;
  }

  console.log(`[Scenario 8] Alert message:`, s8State?.alertText);
  console.log(`[Scenario 8] URL after corrupt drop:`, s8State?.currentUrl);
  results.scenario8 = {
    genericOverlayPrevented: !s8Drop.genericOverlayFound,
    dedicatedPsdErrorShown: Boolean(s8State?.hasAlert && s8State?.alertText?.includes('Failed to import Photoshop file')),
    signatureErrorExplained: Boolean(s8State?.alertText?.includes('signature') || s8State?.alertText?.includes('8BPS')),
    noRedirectionToConvert: s8State?.currentUrl === '/edit-image',
  };
  await captureScreenshot('psd_drag_08_corrupt_psd_fallback.png');

  // Write comprehensive test results JSON
  const resultsPath = path.join(outDir, 'psd_drag_drop_verification_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n[PSD Drag Test] Results successfully written to ${resultsPath}`);
  console.log(JSON.stringify(results, null, 2));

  // Check overall pass/fail
  const allPassed =
    results.scenario1.genericOverlayPrevented &&
    results.scenario1.tabCreated &&
    results.scenario2.twoTabsOpen &&
    results.scenario3.threeTabsOpen &&
    results.scenario4.openedPngDocument &&
    results.scenario5.bothImagesOpened &&
    results.scenario6.psdTabOpened &&
    results.scenario6.pngTabOpened &&
    results.scenario7.unsupportedAlertShown &&
    results.scenario8.dedicatedPsdErrorShown &&
    results.scenario8.noRedirectionToConvert;

  console.log(`\n======================================================`);
  console.log(`OVERALL TEST STATUS: ${allPassed ? 'ALL 8 SCENARIOS PASSED (100%)' : 'SOME TESTS FAILED'}`);
  console.log(`======================================================`);

  if (edge) {
    edge.kill();
  }
  process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error('[PSD Drag Test FATAL ERROR]:', err);
  if (edge) edge.kill();
  process.exit(1);
});
