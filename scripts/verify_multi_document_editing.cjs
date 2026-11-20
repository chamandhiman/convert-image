const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9355;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-multi-doc-' + Date.now());

let edge = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log(`[CDP] Launching Edge on port ${port}...`);
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
    'http://localhost:4173/edit-image',
  ]);

  console.log(`[CDP] Connecting to Edge DevTools target...`);
  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page' && t.url.includes('localhost:4173'));
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
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
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

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  };

  const takeScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(outDir, filename);
    fs.writeFileSync(fullPath, Buffer.from(res.data, 'base64'));
    console.log(`[Screenshot] Saved: ${filename}`);
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('[CDP] Setting cookie consent and navigating...');
  await evalJs(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(2500);

  // 1. Initial Start Screen
  console.log('[Step 1] Initial Start Screen');
  await takeScreenshot('multidoc_01_initial_screen.png');

  // 2. Create Blank Canvas (Document 1: Untitled-1.png)
  console.log('[Step 2] Creating Blank Canvas Document 1...');
  await evalJs(`
    (() => {
      const btn = document.getElementById('start-blank-canvas-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Create Canvas'));
      if (btn) btn.click();
    })()
  `);
  await sleep(600);

  // Click submit in setup modal
  await evalJs(`
    (() => {
      const confirmBtn = document.getElementById('confirm-create-canvas-btn') || document.querySelector('button[type="submit"]');
      if (confirmBtn) confirmBtn.click();
    })()
  `);
  await sleep(1200);

  const doc1Check = await evalJs(`
    (() => {
      const tabsBar = document.querySelector('[data-testid="document-tabs-bar"]');
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      return {
        hasTabsBar: Boolean(tabsBar),
        tabsCount: tabs.length,
        tabName: tabs[0]?.textContent?.trim() || '',
      };
    })()
  `);
  console.log('[Check] Doc 1 Created:', doc1Check);
  await takeScreenshot('multidoc_02_blank_document_1.png');

  // 3. Add a Shape layer to Document 1 (Rectangle)
  console.log('[Step 3] Adding Shape Layer (Rectangle) to Document 1...');
  await evalJs(`
    (() => {
      if (window.__editorAddShape) {
        window.__editorAddShape('rect');
      } else {
        const addBtn = document.querySelector('[data-testid="layers-add-btn"]');
        if (addBtn) addBtn.click();
      }
    })()
  `);
  await sleep(1000);

  const doc1Layers = await evalJs(`
    (() => {
      const activeTab = document.querySelector('[data-doc-active="true"]');
      const layers = Array.from(document.querySelectorAll('[data-testid^="layer-row-"], [class*="layerRow"]'));
      return {
        tabIsDirty: activeTab?.textContent.includes('*'),
        tabText: activeTab?.textContent?.trim(),
        layersCount: layers.length,
        layerNames: layers.map(l => {
          const nameEl = l.querySelector('[data-testid^="layer-name-"], [class*="layerName"]');
          return nameEl ? nameEl.textContent.trim() : l.textContent.trim();
        }),
      };
    })()
  `);
  console.log('[Check] Doc 1 with Rectangle and Dirty Flag:', doc1Layers);
  await takeScreenshot('multidoc_03_doc1_with_shape.png');

  // 4. Load Document 2 and Document 3 via CDP DOM.setFileInputFiles
  console.log('[Step 4] Loading Document 2 (sample-bg-original.jpg) and Document 3 (sample-bg-pet.jpg)...');
  const file1 = path.resolve('public/sample-bg-original.jpg');
  const file2 = path.resolve('public/sample-bg-pet.jpg');

  const rootDoc = await send('DOM.getDocument', { depth: -1 });
  const fileInputNode = await send('DOM.querySelector', {
    nodeId: rootDoc.root.nodeId,
    selector: 'input[data-testid="main-file-input"]',
  });

  if (!fileInputNode || !fileInputNode.nodeId) {
    throw new Error('main-file-input node not found');
  }

  await send('DOM.setFileInputFiles', {
    nodeId: fileInputNode.nodeId,
    files: [file1, file2],
  });
  await sleep(2000);

  const multiTabsState = await evalJs(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      return {
        tabsCount: tabs.length,
        tabs: tabs.map(t => t.textContent.trim()),
      };
    })()
  `);
  console.log('[Check] Multi-Document Tabs State:', multiTabsState);
  await takeScreenshot('multidoc_04_three_documents_open.png');

  // 5. Verify Tab Switching & State Preservation
  console.log('[Step 5] Switching back to Tab 1 (Untitled-1.png)...');
  await evalJs(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      const t1 = tabs.find(t => t.textContent.includes('Untitled-1'));
      if (t1) t1.click();
    })()
  `);
  await sleep(800);

  const switchedDoc1State = await evalJs(`
    (() => {
      const layers = Array.from(document.querySelectorAll('[data-testid^="layer-row-"], [class*="layerRow"]'));
      const activeTab = document.querySelector('[data-doc-active="true"]');
      return {
        activeTab: activeTab?.textContent?.trim(),
        layersCount: layers.length,
        layersNames: layers.map(l => {
          const nameEl = l.querySelector('[data-testid^="layer-name-"], [class*="layerName"]');
          return nameEl ? nameEl.textContent.trim() : l.textContent.trim();
        }),
      };
    })()
  `);
  console.log('[Check] Switched back to Doc 1 state:', switchedDoc1State);
  await takeScreenshot('multidoc_05_switched_to_doc1.png');

  // 6. Test Cross-Document Copy and Paste
  // In Doc 1: Select the Rectangle layer, Copy (Ctrl+C)
  console.log('[Step 6] Copying Rectangle Layer from Doc 1...');
  await evalJs(`
    (() => {
      const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"], [class*="layerRow"]'));
      const rectRow = rows.find(r => r.textContent.includes('Rectangle')) || rows[0];
      if (rectRow) rectRow.click();

      // Trigger Ctrl+C
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC', ctrlKey: true, bubbles: true }));
    })()
  `);
  await sleep(500);

  // Switch to Tab 2 (sample-bg-original.jpg)
  console.log('[Step 7] Switching to Doc 2 and Pasting Layer (Ctrl+V)...');
  await evalJs(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      const t2 = tabs.find(t => t.textContent.includes('sample-bg-original.jpg'));
      if (t2) t2.click();
    })()
  `);
  await sleep(800);

  // Paste into Doc 2 (Ctrl+V)
  await evalJs(`
    (() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', ctrlKey: true, bubbles: true }));
    })()
  `);
  await sleep(800);

  const doc2PastedState = await evalJs(`
    (() => {
      const layers = Array.from(document.querySelectorAll('[data-testid^="layer-row-"], [class*="layerRow"]'));
      const activeTab = document.querySelector('[data-doc-active="true"]');
      return {
        activeTab: activeTab?.textContent?.trim(),
        layersCount: layers.length,
        layersNames: layers.map(l => {
          const nameEl = l.querySelector('[data-testid^="layer-name-"], [class*="layerName"]');
          return nameEl ? nameEl.textContent.trim() : l.textContent.trim();
        }),
      };
    })()
  `);
  console.log('[Check] Doc 2 After Paste:', doc2PastedState);
  await takeScreenshot('multidoc_06_doc2_pasted_layer.png');

  // 7. Test Cross-Document Transfer: Drag layer from layers panel to Tab 3 (sample-bg-pet.jpg)
  console.log('[Step 8] Testing layer drop on Tab 3 (sample-bg-pet.jpg)...');
  await evalJs(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      const t3 = tabs.find(t => t.textContent.includes('sample-bg-pet.jpg'));

      const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"], [class*="layerRow"]'));
      const rectRow = rows.find(r => r.textContent.includes('Rectangle')) || rows[0];

      if (rectRow && t3) {
        const dt = new DataTransfer();
        // Drag start on layer row
        rectRow.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));

        // Drop on tab 3
        const payload = window.__draggedLayerPayload;
        if (payload && t3) {
          const dropDt = new DataTransfer();
          dropDt.setData('application/x-image-convert-layer', JSON.stringify(payload));
          t3.dispatchEvent(new DragEvent('drop', { dataTransfer: dropDt, bubbles: true }));
        }
      }
    })()
  `);
  await sleep(800);

  // Switch to Tab 3 to verify transferred layer
  await evalJs(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      const t3 = tabs.find(t => t.textContent.includes('sample-bg-pet.jpg'));
      if (t3) t3.click();
    })()
  `);
  await sleep(800);

  const doc3State = await evalJs(`
    (() => {
      const layers = Array.from(document.querySelectorAll('[data-testid^="layer-row-"], [class*="layerRow"]'));
      const activeTab = document.querySelector('[data-doc-active="true"]');
      return {
        activeTab: activeTab?.textContent?.trim(),
        layersCount: layers.length,
        layersNames: layers.map(l => {
          const nameEl = l.querySelector('[data-testid^="layer-name-"], [class*="layerName"]');
          return nameEl ? nameEl.textContent.trim() : l.textContent.trim();
        }),
      };
    })()
  `);
  console.log('[Check] Doc 3 State after layer transfer:', doc3State);
  await takeScreenshot('multidoc_07_doc3_transferred_layer.png');

  // 8. Test Tab Close with Unsaved Changes Warning Modal
  console.log('[Step 9] Requesting to close dirty Doc 2 (sample-bg-original.jpg)...');
  // Switch to Doc 2
  await evalJs(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      const t2 = tabs.find(t => t.textContent.includes('sample-bg-original.jpg'));
      if (t2) t2.click();
    })()
  `);
  await sleep(600);

  // Click close button on Doc 2 tab
  await evalJs(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      const t2 = tabs.find(t => t.textContent.includes('sample-bg-original.jpg'));
      if (t2) {
        const closeBtn = t2.querySelector('[data-testid^="close-doc-btn-"]');
        if (closeBtn) closeBtn.click();
      }
    })()
  `);
  await sleep(800);

  const modalCheck = await evalJs(`
    (() => {
      const modal = document.querySelector('[data-testid="unsaved-changes-modal"]') || document.querySelector('[role="dialog"]');
      return {
        hasModal: Boolean(modal),
        modalTitle: modal?.querySelector('h3')?.textContent,
      };
    })()
  `);
  console.log('[Check] Unsaved Changes Modal:', modalCheck);
  await takeScreenshot('multidoc_08_unsaved_changes_modal.png');

  // Click Cancel on modal
  console.log('[Step 10] Testing Cancel in modal...');
  await evalJs(`
    (() => {
      const cancelBtn = document.querySelector('[data-testid="btn-unsaved-cancel"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()
  `);
  await sleep(500);

  // Click close again and click "Don't Save"
  console.log('[Step 11] Closing sample-bg-original.jpg via "Don\'t Save"...');
  await evalJs(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      const t2 = tabs.find(t => t.textContent.includes('sample-bg-original.jpg'));
      if (t2) {
        const closeBtn = t2.querySelector('[data-testid^="close-doc-btn-"]');
        if (closeBtn) closeBtn.click();
      }
    })()
  `);
  await sleep(600);

  await evalJs(`
    (() => {
      const discardBtn = document.querySelector('[data-testid="btn-unsaved-discard"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes("Don't Save"));
      if (discardBtn) discardBtn.click();
    })()
  `);
  await sleep(800);

  const tabsAfterClose = await evalJs(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));
      return {
        tabsCount: tabs.length,
        tabs: tabs.map(t => t.textContent.trim()),
      };
    })()
  `);
  console.log('[Check] Tabs after closing sample-bg-original.jpg:', tabsAfterClose);
  await takeScreenshot('multidoc_09_after_discard_close.png');

  const report = {
    testDate: new Date().toISOString(),
    doc1Check,
    doc1Layers,
    multiTabsState,
    switchedDoc1State,
    doc2PastedState,
    doc3State,
    modalCheck,
    tabsAfterClose,
    success:
      multiTabsState.tabsCount === 3 &&
      switchedDoc1State.layersCount >= 2 &&
      doc2PastedState.layersCount >= 2 &&
      doc3State.layersCount >= 2 &&
      modalCheck.hasModal &&
      tabsAfterClose.tabsCount === 2,
  };

  fs.writeFileSync(
    path.join(outDir, 'multidoc_verification_results.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('[Report] Verification completed successfully:', report.success);

  ws.close();
  if (edge) edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Error]', err);
  if (edge) edge.kill();
  process.exit(1);
});
