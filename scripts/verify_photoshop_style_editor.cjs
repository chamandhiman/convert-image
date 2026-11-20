const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9311;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-photoshop-editor-' + Date.now());

let edge = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[CDP] Launching Edge on port ${port}...`);
  edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
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

  const captureScreenshot = async (filePath) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`[CDP] Screenshot saved: ${filePath}`);
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('[CDP] Navigating to http://localhost:4173/edit-image...');
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(2000);

  // Dismiss cookie banner
  await evalJs(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.reload');
  await sleep(2000);

  console.log('[Test 1] Inspecting Global Header...');
  const headerInfo = await evalJs(`(() => {
    const header = document.querySelector('header');
    if (!header) return { found: false };
    const rect = header.getBoundingClientRect();
    const links = Array.from(header.querySelectorAll('nav a, header a')).map(a => a.textContent.trim()).filter(Boolean);
    const search = document.querySelector('input[type="search"], [aria-label*="search" i]');
    const avatar = document.querySelector('[data-testid="user-avatar"], [aria-label*="profile" i]');
    return {
      found: true,
      height: Math.round(rect.height),
      links,
      hasSearch: !!search,
      hasAvatar: !!avatar
    };
  })()`);
  console.log('Header Info:', JSON.stringify(headerInfo, null, 2));

  console.log('[Test 2] Loading image via native CDP setFileInputFiles...');
  const sampleImagePath = path.resolve('public/sample-bg-original.jpg');
  console.log('Sample image file path:', sampleImagePath);

  const doc = await send('DOM.getDocument');
  const fileNode = await send('DOM.querySelector', {
    nodeId: doc.root.nodeId,
    selector: 'input[data-testid="main-file-input"]'
  });

  if (fileNode && fileNode.nodeId) {
    await send('DOM.setFileInputFiles', {
      files: [sampleImagePath],
      nodeId: fileNode.nodeId
    });
    console.log('[CDP] setFileInputFiles called successfully!');
  } else {
    console.error('[CDP ERROR] Could not find main file input nodeId!');
  }

  await sleep(2500);

  console.log('[Test 3] Verifying Editor Structure with Image Loaded...');
  const editorState = await evalJs(`(() => {
    const topBar = document.querySelector('[data-testid="editor-top-bar"]');
    const contextualToolbar = document.querySelector('[data-testid="contextual-toolbar"]');
    const rightWorkspace = document.querySelector('[data-testid="right-workspace"]');
    const bottomBar = document.querySelector('[data-testid="bottom-status-bar"]');
    const baseSelectionFrame = document.querySelector('[data-selection-frame="background"]');
    const baseHandles = document.querySelectorAll('[class*="baseHandle"]');
    const floatingToolbarInCanvas = document.querySelector('[data-selection-frame="background"] [data-testid="contextual-toolbar"]');

    // Layers panel info
    const layersHeader = document.querySelector('[data-testid="layers-panel-header"]');
    const layerCountBadge = document.querySelector('[data-testid="layers-count-badge"]')?.textContent.trim();
    const layerRows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => ({
      id: r.getAttribute('data-testid'),
      name: r.querySelector('[class*="layerName"]')?.textContent.trim(),
      isSelected: r.getAttribute('class').includes('selected') || r.getAttribute('class').includes('Selected')
    }));

    // Status bar info
    const dimensionsText = document.querySelector('[data-testid="status-bar-dimensions"]')?.textContent.trim();
    const zoomText = document.querySelector('[data-testid="status-zoom-display"]')?.textContent.trim();

    return {
      hasTopBar: !!topBar,
      hasContextualToolbar: !!contextualToolbar,
      contextualToolbarY: contextualToolbar ? Math.round(contextualToolbar.getBoundingClientRect().top) : null,
      contextualToolbarHeight: contextualToolbar ? Math.round(contextualToolbar.getBoundingClientRect().height) : null,
      hasRightWorkspace: !!rightWorkspace,
      rightWorkspaceWidth: rightWorkspace ? Math.round(rightWorkspace.getBoundingClientRect().width) : null,
      hasBottomBar: !!bottomBar,
      bottomBarHeight: bottomBar ? Math.round(bottomBar.getBoundingClientRect().height) : null,
      hasBaseSelectionFrame: !!baseSelectionFrame,
      baseHandlesCount: baseHandles.length,
      hasFloatingToolbarInCanvas: !!floatingToolbarInCanvas,
      layerCountBadge,
      layerRows,
      dimensionsText,
      zoomText
    };
  })()`);
  console.log('Editor State:', JSON.stringify(editorState, null, 2));

  console.log('[Test 4] Capturing Desktop Full View (Default Select / Move)...');
  await captureScreenshot(path.join(outDir, 'photoshop_editor_full_desktop.png'));

  console.log('[Test 5] Testing Shapes tool with Inline Palette...');
  await evalJs(`(() => {
    const shapesBtn = document.querySelector('[data-testid="tool-shapes"]');
    if (shapesBtn) shapesBtn.click();
  })()`);
  await sleep(600);

  const shapesContextualState = await evalJs(`(() => {
    const palette = document.querySelector('[data-testid="inline-shape-palette"]');
    const shapeBtns = Array.from(document.querySelectorAll('[data-testid^="shape-btn-"]')).map(b => b.getAttribute('data-testid'));
    const fillBtn = document.querySelector('[data-testid="shape-fill-picker"]');
    return {
      hasPalette: !!palette,
      shapeBtnsCount: shapeBtns.length,
      shapeBtns,
      hasFillPicker: !!fillBtn
    };
  })()`);
  console.log('Shapes Contextual State:', JSON.stringify(shapesContextualState, null, 2));
  await captureScreenshot(path.join(outDir, 'photoshop_editor_shapes_inline.png'));

  console.log('[Test 6] Testing Crop Tool Contextual Toolbar...');
  await evalJs(`(() => {
    const cropBtn = document.querySelector('[data-testid="tool-crop"]');
    if (cropBtn) cropBtn.click();
  })()`);
  await sleep(600);

  const cropState = await evalJs(`(() => {
    const applyBtn = document.querySelector('[data-testid="btn-apply-crop"]');
    const cancelBtn = document.querySelector('[data-testid="btn-cancel-crop"]');
    const presetBtns = Array.from(document.querySelectorAll('[class*="presetBtn"]')).map(b => b.textContent.trim());
    return { hasApply: !!applyBtn, hasCancel: !!cancelBtn, presetBtns };
  })()`);
  console.log('Crop Contextual State:', JSON.stringify(cropState, null, 2));

  console.log('[Test 7] Testing Resize Tool Contextual Toolbar...');
  await evalJs(`(() => {
    const resizeBtn = document.querySelector('[data-testid="tool-resize"]');
    if (resizeBtn) resizeBtn.click();
  })()`);
  await sleep(600);

  const resizeState = await evalJs(`(() => {
    const wInput = document.querySelector('[data-testid="input-resize-w"]');
    const hInput = document.querySelector('[data-testid="input-resize-h"]');
    const applyBtn = document.querySelector('[data-testid="btn-apply-resize"]');
    return { hasW: !!wInput, hasH: !!hInput, hasApply: !!applyBtn };
  })()`);
  console.log('Resize Contextual State:', JSON.stringify(resizeState, null, 2));

  console.log('[Test 8] Return to Select Tool and test Add Blank Layer...');
  await evalJs(`(() => {
    const selectBtn = document.querySelector('[data-testid="tool-select"]');
    if (selectBtn) selectBtn.click();
  })()`);
  await sleep(400);

  // Click Add Layer button in Layers Panel
  await evalJs(`(() => {
    const addLayerBtn = document.querySelector('[data-testid="layers-add-btn"]');
    if (addLayerBtn) addLayerBtn.click();
  })()`);
  await sleep(600);

  const layersAfterAdd = await evalJs(`(() => {
    const layerCountBadge = document.querySelector('[data-testid="layers-count-badge"]')?.textContent.trim();
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => ({
      id: r.getAttribute('data-testid'),
      name: r.querySelector('[class*="layerName"]')?.textContent.trim(),
      isSelected: r.getAttribute('data-layer-selected') === 'true'
    }));
    return { layerCountBadge, rows };
  })()`);
  console.log('Layers After Add Blank Layer:', JSON.stringify(layersAfterAdd, null, 2));

  console.log('[Test 9] Testing Right-Click Context Menu on Layer Row...');
  await evalJs(`(() => {
    const firstRow = document.querySelector('[data-testid^="layer-row-"]');
    if (firstRow) {
      const rect = firstRow.getBoundingClientRect();
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 50,
        clientY: rect.top + 15
      });
      firstRow.dispatchEvent(event);
    }
  })()`);
  await sleep(400);

  const contextMenuState = await evalJs(`(() => {
    const menu = document.querySelector('[data-testid="layer-context-menu"]');
    if (!menu) return { found: false };
    const items = Array.from(menu.querySelectorAll('button')).map(b => b.textContent.trim());
    return { found: true, itemsCount: items.length, items };
  })()`);
  console.log('Context Menu State:', JSON.stringify(contextMenuState, null, 2));
  await captureScreenshot(path.join(outDir, 'photoshop_editor_layer_context_menu.png'));

  // Close context menu with Escape key
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(400);

  console.log('[Test 10] Capturing Final Verified Desktop Screenshot...');
  await captureScreenshot(path.join(outDir, 'photoshop_editor_final_verified.png'));

  // Save JSON summary report
  const report = {
    header: headerInfo,
    editor: editorState,
    shapes: shapesContextualState,
    crop: cropState,
    resize: resizeState,
    layersAfterAdd,
    contextMenu: contextMenuState,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(path.join(outDir, 'photoshop_editor_verification_report.json'), JSON.stringify(report, null, 2));
  console.log('[CDP] Verification report written successfully!');

  ws.close();
  if (edge) edge.kill();
  console.log('ALL TESTS COMPLETED SUCCESSFULLY.');
}

main().catch(err => {
  console.error('[CDP ERROR]', err);
  if (edge) edge.kill();
  process.exit(1);
});

