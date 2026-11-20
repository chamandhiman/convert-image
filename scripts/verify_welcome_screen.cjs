const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9400;
const previewUrl = 'http://localhost:4173';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-welcome-final-' + Date.now());

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
    `${previewUrl}/edit-image`,
  ]);

  console.log(`[CDP] Connecting to Edge DevTools target...`);
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
    return res.result ? res.result.value : null;
  };

  const waitForSelector = async (selector, maxAttempts = 30, interval = 200) => {
    for (let i = 0; i < maxAttempts; i++) {
      const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await sleep(interval);
    }
    return false;
  };

  const captureScreenshot = async (name) => {
    try {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(outDir, `${name}.png`);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`[Screenshot Saved] -> ${filePath}`);
    } catch (e) {
      console.warn(`[Screenshot Error] ${name}:`, e.message);
    }
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

  console.log('[CDP] Setting consent & navigating to /edit-image...');
  await evaluate(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.navigate', { url: `${previewUrl}/edit-image` });
  await sleep(2000);

  try {
    // 1. Initial Welcome Screen Audit
    console.log('[Test] 1. Waiting for Welcome Screen to appear...');
    await waitForSelector('[data-testid="editor-welcome-screen"]', 25);

    const initialCheck = await evaluate(`(() => {
      const screen = document.querySelector('[data-testid="editor-welcome-screen"]');
      const heading = screen ? screen.querySelector('h1')?.textContent?.trim() : null;
      const subtitle = screen ? screen.querySelector('p')?.textContent?.trim() : null;
      const actionCards = document.querySelectorAll('[data-testid="welcome-action-cards"] > div');
      const presets = document.querySelectorAll('[data-testid="popular-presets-row"] > div');
      const dragDrop = document.querySelector('[data-testid="welcome-drag-drop-area"]');
      const layersEmpty = document.querySelector('[data-testid="layers-empty"]');
      const layersEmptyTitle = layersEmpty ? layersEmpty.querySelector('p')?.textContent?.trim() : null;
      const layersEmptySub = layersEmpty ? layersEmpty.querySelector('span')?.textContent?.trim() : null;

      const addLayerBtn = document.querySelector('[data-testid="layers-add-btn"]');
      const dupLayerBtn = document.querySelector('[data-testid="layers-dup-btn"]');
      const delLayerBtn = document.querySelector('[data-testid="layers-del-btn"]');

      return {
        hasWelcomeScreen: Boolean(screen),
        heading,
        subtitle,
        actionCardsCount: actionCards.length,
        presetsCount: presets.length,
        hasDragDrop: Boolean(dragDrop),
        layersEmptyTitle,
        layersEmptySub,
        addLayerBtnDisabled: addLayerBtn ? addLayerBtn.disabled : null,
        dupLayerBtnDisabled: dupLayerBtn ? dupLayerBtn.disabled : null,
        delLayerBtnDisabled: delLayerBtn ? delLayerBtn.disabled : null,
      };
    })()`);

    console.log('Initial Welcome Screen Check:', initialCheck);
    await captureScreenshot('welcome_01_initial_dashboard');

    // 2. Open New Project Modal
    console.log('[Test] 2. Testing New Project dialog modal...');
    await evaluate(`(() => {
      const card = document.querySelector('[data-testid="welcome-card-new-project"]');
      if (card) card.click();
    })()`);
    await waitForSelector('[data-testid="new-project-modal"]', 20);
    await sleep(400);

    const newProjectModalCheck = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="new-project-modal"]');
      const nameInput = document.querySelector('[data-testid="input-doc-name"]');
      const widthInput = document.querySelector('[data-testid="input-canvas-width"]');
      const heightInput = document.querySelector('[data-testid="input-canvas-height"]');
      const unitsSelect = document.querySelector('[data-testid="select-canvas-unit"]');
      const dpiSelect = document.querySelector('[data-testid="select-canvas-dpi"]');
      const createBtn = document.querySelector('[data-testid="btn-create-canvas"]');

      return {
        hasModal: Boolean(modal),
        defaultName: nameInput ? nameInput.value : null,
        defaultWidth: widthInput ? widthInput.value : null,
        defaultHeight: heightInput ? heightInput.value : null,
        defaultUnits: unitsSelect ? unitsSelect.value : null,
        defaultDpi: dpiSelect ? dpiSelect.value : null,
        hasCreateBtn: Boolean(createBtn),
      };
    })()`);
    console.log('New Project Modal Check:', newProjectModalCheck);
    await captureScreenshot('welcome_02_new_project_modal');

    // Close New Project modal
    await evaluate(`(() => {
      const closeBtn = document.querySelector('[data-testid="new-project-close-btn"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(400);

    // 3. Open PSD Unavailable Modal
    console.log('[Test] 3. Testing Open PSD unavailable modal...');
    await evaluate(`(() => {
      const card = document.querySelector('[data-testid="welcome-card-open-psd"]');
      if (card) card.click();
    })()`);
    await waitForSelector('[data-testid="psd-modal"]', 20);
    await sleep(400);

    const psdModalCheck = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="psd-modal"]');
      const title = modal ? modal.querySelector('h3')?.textContent?.trim() : null;
      return {
        hasPsdModal: Boolean(modal),
        title,
      };
    })()`);
    console.log('PSD Modal Check:', psdModalCheck);
    await captureScreenshot('welcome_04_psd_modal');

    // Close PSD modal
    await evaluate(`(() => {
      const closeBtn = document.querySelector('[data-testid="psd-close-btn"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(400);

    // 4. Open Templates Modal via "View All Presets"
    console.log('[Test] 4. Testing Templates & Presets gallery...');
    await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="btn-view-all-presets"]');
      if (btn) btn.click();
    })()`);
    await waitForSelector('[data-testid="templates-modal"]', 20);
    await sleep(400);

    const templatesModalCheck = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="templates-modal"]');
      const cats = document.querySelectorAll('[data-testid^="filter-cat-"]');
      const items = document.querySelectorAll('[data-testid^="template-card-"]');
      return {
        hasTemplatesModal: Boolean(modal),
        categoriesCount: cats.length,
        templatesCount: items.length,
      };
    })()`);
    console.log('Templates Modal Check:', templatesModalCheck);
    await captureScreenshot('welcome_03_templates_modal');

    // Close Templates modal
    await evaluate(`(() => {
      const closeBtn = document.querySelector('[data-testid="templates-close-btn"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(400);

    // 5. Click a Popular Preset card (Instagram Post 1080x1080)
    console.log('[Test] 5. Creating canvas from Instagram Post preset...');
    await evaluate(`(() => {
      const card = document.querySelector('[data-testid="preset-card-ig-post"]');
      if (card) card.click();
    })()`);
    await waitForSelector('[data-testid="document-tab-active"]', 25);
    await sleep(1500);

    const createdCanvasCheck = await evaluate(`(() => {
      const activeTab = document.querySelector('[data-testid="document-tab-active"]');
      const tabTitle = activeTab ? activeTab.querySelector('[data-testid="doc-tab-title"]')?.textContent?.trim() : null;
      const welcomeGone = !document.querySelector('[data-testid="editor-welcome-screen"]');
      const rulers = document.querySelectorAll('[data-testid="canvas-ruler-h"], [data-testid="canvas-ruler-v"]');
      const layersCount = document.querySelectorAll('[data-testid^="layer-row-"]').length;
      const statusBarDims = document.querySelector('[data-testid="status-bar-dimensions"]')?.textContent?.trim();

      return {
        tabTitle,
        welcomeScreenHidden: welcomeGone,
        rulersVisible: rulers.length === 2,
        layersCount,
        statusBarDims,
      };
    })()`);
    console.log('Created Canvas Check:', createdCanvasCheck);
    await captureScreenshot('welcome_05_preset_created_canvas');

    // 6. Close the Document Tab to return to the Welcome Screen
    console.log('[Test] 6. Closing document tab to verify Welcome Screen return...');
    await evaluate(`(() => {
      const closeTabBtn = document.querySelector('[data-doc-active="true"] [data-testid^="close-doc-btn-"]') ||
                          document.querySelector('[data-testid^="close-doc-btn-"]');
      if (closeTabBtn) closeTabBtn.click();
    })()`);
    await sleep(500);

    // Handle Unsaved Changes modal if opened
    await evaluate(`(() => {
      const discardBtn = document.querySelector('[data-testid="btn-unsaved-discard"]');
      if (discardBtn) discardBtn.click();
    })()`);
    await waitForSelector('[data-testid="editor-welcome-screen"]', 20);
    await sleep(800);

    const returnedCheck = await evaluate(`(() => {
      const screen = document.querySelector('[data-testid="editor-welcome-screen"]');
      const tabs = document.querySelectorAll('[data-testid^="document-tab-"]').length;
      return {
        hasWelcomeScreenAgain: Boolean(screen),
        tabsCount: tabs,
      };
    })()`);
    console.log('Returned to Welcome Screen Check:', returnedCheck);
    await captureScreenshot('welcome_06_returned_to_welcome_screen');

    // Save full JSON audit
    const auditSummary = {
      timestamp: new Date().toISOString(),
      initialCheck,
      newProjectModalCheck,
      psdModalCheck,
      templatesModalCheck,
      createdCanvasCheck,
      returnedCheck,
    };
    fs.writeFileSync(path.join(outDir, 'welcome_screen_audit_results.json'), JSON.stringify(auditSummary, null, 2));
    console.log('[DONE] All verification steps completed successfully!');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    try {
      ws.close();
    } catch {}
    if (edge) {
      edge.kill('SIGKILL');
    }
  }
}

run();
