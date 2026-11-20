const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9316;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-ps-desktop-' + Date.now());

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
    console.log(`[CDP] Screenshot saved: ${path.basename(filePath)}`);
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

  // Set cookie consent
  await evalJs(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.reload');
  await sleep(2000);

  const results = {};

  // 1. Initial Empty State Verification
  console.log('[Step 1] Checking Initial Start Screen & Viewport...');
  results.emptyState = await evalJs(`(() => {
    const websiteHeader = document.querySelector('[class*="headerContainer"]');
    const menuBar = document.querySelector('[data-testid="application-menu-bar"]');
    const leftPanel = document.querySelector('[data-testid="left-tool-panel"]');
    const rightWorkspace = document.querySelector('[data-testid="right-workspace"]');
    const brandTitle = document.querySelector('[class*="brandMainText"]')?.textContent.trim();
    const menuButtons = Array.from(document.querySelectorAll('[data-testid^="menu-btn-"]')).map(b => b.textContent.trim());

    return {
      hasWebsiteHeader: !!websiteHeader,
      hasMenuBar: !!menuBar,
      menuBarHeight: menuBar ? Math.round(menuBar.getBoundingClientRect().height) : null,
      brandTitle,
      menuButtons,
      hasLeftPanel: !!leftPanel,
      leftPanelWidth: leftPanel ? Math.round(leftPanel.getBoundingClientRect().width) : null,
      hasRightWorkspace: !!rightWorkspace
    };
  })()`);
  console.log('Empty State:', JSON.stringify(results.emptyState, null, 2));
  await captureScreenshot(path.join(outDir, 'ps_workspace_01_empty_start.png'));

  // 2. Load Sample Image
  console.log('[Step 2] Uploading sample image to workspace...');
  const sampleImagePath = path.resolve('public/sample-bg-original.jpg');
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
    console.log('[CDP] Sample image sent to file input.');
  } else {
    throw new Error('Could not find input[data-testid="main-file-input"]');
  }

  await sleep(2500);

  // 3. Inspect Full Desktop 5-Area Layout
  console.log('[Step 3] Inspecting Desktop 5-Area Layout...');
  results.layoutState = await evalJs(`(() => {
    const menuBar = document.querySelector('[data-testid="application-menu-bar"]');
    const leftPanel = document.querySelector('[data-testid="left-tool-panel"]');
    const contextualBar = document.querySelector('[data-testid="contextual-toolbar"]');
    const canvasViewport = document.querySelector('[data-testid="canvas-viewport"]');
    const stage = document.querySelector('[data-canvas-stage="true"]');
    const rightWorkspace = document.querySelector('[data-testid="right-workspace"]');
    const bottomBar = document.querySelector('[data-testid="bottom-status-bar"]');

    // Left toolbar tool buttons
    const toolButtons = Array.from(document.querySelectorAll('[data-testid^="tool-"]')).map(b => b.getAttribute('data-testid'));

    // Rulers
    const rulers = document.querySelectorAll('canvas');

    return {
      hasMenuBar: !!menuBar,
      hasContextualBar: !!contextualBar,
      contextualBarHeight: contextualBar ? Math.round(contextualBar.getBoundingClientRect().height) : null,
      hasLeftPanel: !!leftPanel,
      leftPanelWidth: leftPanel ? Math.round(leftPanel.getBoundingClientRect().width) : null,
      toolButtonsCount: toolButtons.length,
      toolButtons: toolButtons.slice(0, 10),
      hasCanvasViewport: !!canvasViewport,
      stageSize: stage ? { width: stage.clientWidth, height: stage.clientHeight } : null,
      rulersCount: rulers.length,
      hasRightWorkspace: !!rightWorkspace,
      rightWorkspaceWidth: rightWorkspace ? Math.round(rightWorkspace.getBoundingClientRect().width) : null,
      hasBottomBar: !!bottomBar
    };
  })()`);
  console.log('Layout State:', JSON.stringify(results.layoutState, null, 2));
  await captureScreenshot(path.join(outDir, 'ps_workspace_02_full_desktop.png'));

  // 4. Test Hamburger Navigation Drawer
  console.log('[Step 4] Testing Hamburger Navigation Drawer...');
  await evalJs(`document.querySelector('[data-testid="hamburger-menu-btn"]')?.click();`);
  await sleep(500);
  results.drawerState = await evalJs(`(() => {
    const drawer = document.querySelector('[data-testid="hamburger-nav-drawer"]');
    const links = Array.from(document.querySelectorAll('[data-testid="hamburger-nav-drawer"] a')).map(l => l.textContent.trim());
    return {
      isOpen: !!drawer && drawer.classList.contains(Array.from(drawer.classList).find(c => c.includes('drawerOpen'))),
      linksCount: links.length,
      links: links.slice(0, 8)
    };
  })()`);
  console.log('Drawer State:', JSON.stringify(results.drawerState, null, 2));
  await captureScreenshot(path.join(outDir, 'ps_workspace_03_hamburger_drawer.png'));

  // Close drawer
  await evalJs(`document.querySelector('[data-testid="drawer-close-btn"]')?.click();`);
  await sleep(400);

  // 5. Test Application Menu Bar Dropdowns (e.g. Filters menu)
  console.log('[Step 5] Testing Filters Menu Bar dropdown...');
  await evalJs(`document.querySelector('[data-testid="menu-btn-filters"]')?.click();`);
  await sleep(400);
  results.filtersMenuState = await evalJs(`(() => {
    const menuDropdown = document.querySelector('[data-testid="dropdown-menu-filters"]');
    const items = Array.from(document.querySelectorAll('[data-testid="dropdown-menu-filters"] button')).map(i => i.textContent.trim());
    return {
      isOpen: !!menuDropdown,
      itemsCount: items.length,
      items: items.slice(0, 6)
    };
  })()`);
  console.log('Filters Menu State:', JSON.stringify(results.filtersMenuState, null, 2));
  await captureScreenshot(path.join(outDir, 'ps_workspace_04_menu_dropdown.png'));

  // Click document to close dropdown
  await evalJs(`document.body.click();`);
  await sleep(300);

  // 6. Test Left Tool Panel Flyout Menu (e.g. Shapes flyout)
  console.log('[Step 6] Testing Left Toolbar Shape Slot Flyout...');
  await evalJs(`(() => {
    const shapeBtn = document.querySelector('[data-testid="tool-rect"]');
    if (shapeBtn) {
      const indicator = shapeBtn.querySelector('[class*="cornerIndicator"]');
      if (indicator) indicator.click();
    }
  })()`);
  await sleep(400);
  results.flyoutState = await evalJs(`(() => {
    const flyout = document.querySelector('[data-testid="flyout-slot-shapes"]');
    const items = Array.from(document.querySelectorAll('[data-testid="flyout-slot-shapes"] button')).map(i => i.textContent.trim());
    return {
      isOpen: !!flyout,
      itemsCount: items.length,
      items
    };
  })()`);
  console.log('Flyout State:', JSON.stringify(results.flyoutState, null, 2));
  await captureScreenshot(path.join(outDir, 'ps_workspace_05_tool_flyout.png'));

  // 7. Select Rectangle Shape and add to canvas
  console.log('[Step 7] Adding a shape layer to canvas...');
  await evalJs(`(() => {
    if (window.__editorAddShape) {
      window.__editorAddShape('rect');
    }
  })()`);
  await sleep(600);

  // 8. Test Right Workspace Tabs (Properties, Layers, History)
  console.log('[Step 8] Testing Right Workspace Tabs...');
  // Switch to Properties Tab
  await evalJs(`document.querySelector('[data-testid="tab-properties"]')?.click();`);
  await sleep(400);
  results.propertiesTab = await evalJs(`(() => {
    const propPanel = document.querySelector('[data-testid="properties-panel"]');
    return { isVisible: !!propPanel };
  })()`);
  console.log('Properties Tab:', JSON.stringify(results.propertiesTab, null, 2));
  await captureScreenshot(path.join(outDir, 'ps_workspace_06_properties_tab.png'));

  // Switch to Layers Tab
  await evalJs(`document.querySelector('[data-testid="tab-layers"]')?.click();`);
  await sleep(400);
  results.layersTab = await evalJs(`(() => {
    const layerRows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => ({
      id: r.getAttribute('data-testid'),
      name: r.querySelector('[class*="layerName"]')?.textContent.trim()
    }));
    return { layerCount: layerRows.length, layerRows };
  })()`);
  console.log('Layers Tab:', JSON.stringify(results.layersTab, null, 2));

  // Switch to History Tab
  await evalJs(`document.querySelector('[data-testid="tab-history"]')?.click();`);
  await sleep(400);
  results.historyTab = await evalJs(`(() => {
    const historyPanel = document.querySelector('[data-testid="history-panel"]');
    const items = Array.from(document.querySelectorAll('[data-testid="history-panel"] [class*="historyItem"], [data-testid="history-panel"] li, [data-testid="history-panel"] button')).map(e => e.textContent.trim());
    return { isVisible: !!historyPanel, itemsCount: items.length, items: items.slice(0, 5) };
  })()`);
  console.log('History Tab:', JSON.stringify(results.historyTab, null, 2));
  await captureScreenshot(path.join(outDir, 'ps_workspace_07_history_tab.png'));

  // Switch back to Layers Tab
  await evalJs(`document.querySelector('[data-testid="tab-layers"]')?.click();`);
  await sleep(300);

  // 9. Test Add Blank Layer via bottom toolbar
  console.log('[Step 9] Testing "+ Add Layer" bottom toolbar button...');
  await evalJs(`document.querySelector('[data-testid="btn-add-layer"]')?.click();`);
  await sleep(500);

  results.afterAddBlank = await evalJs(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(r => ({
      name: r.querySelector('[class*="layerName"]')?.textContent.trim(),
      isSelected: r.getAttribute('class').includes('selected') || r.getAttribute('class').includes('Selected')
    }));
    return { count: rows.length, rows };
  })()`);
  console.log('After Add Blank Layer:', JSON.stringify(results.afterAddBlank, null, 2));
  await captureScreenshot(path.join(outDir, 'ps_workspace_08_blank_layer_added.png'));

  // 10. Test Collapsible Dock (Collapse & Expand)
  console.log('[Step 10] Testing Dock Collapse / Expand...');
  await evalJs(`document.querySelector('[data-testid="btn-collapse-dock"]')?.click();`);
  await sleep(400);
  results.collapsedState = await evalJs(`(() => {
    const rightWorkspace = document.querySelector('[data-testid="right-workspace"]');
    return {
      width: rightWorkspace ? Math.round(rightWorkspace.getBoundingClientRect().width) : null
    };
  })()`);
  console.log('Collapsed Dock Width:', results.collapsedState.width);
  await captureScreenshot(path.join(outDir, 'ps_workspace_09_dock_collapsed.png'));

  // Expand dock back
  await evalJs(`document.querySelector('[data-testid="btn-expand-dock"]')?.click();`);
  await sleep(400);

  // Final Overview Screenshot
  await captureScreenshot(path.join(outDir, 'ps_workspace_10_final_overview.png'));

  fs.writeFileSync(
    path.join(outDir, 'photoshop_desktop_verification_report.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('[SUCCESS] Verification completed successfully!');
}

run()
  .catch((err) => {
    console.error('[ERROR]', err);
    process.exitCode = 1;
  })
  .finally(() => {
    if (edge) {
      edge.kill('SIGTERM');
      console.log('[CDP] Edge process terminated.');
    }
  });
