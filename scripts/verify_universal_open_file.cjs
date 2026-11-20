const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9817;
const previewUrl = 'http://127.0.0.1:4173';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-openfile-verify-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runVerification() {
  console.log('=== STARTING UNIVERSAL OPEN FILE VERIFICATION ===\n');

  const testReport = {
    welcomeScreen: {},
    fileMenu: {},
    nativePickerTrigger: {},
    pngLoading: {},
    psdLoading: {},
    mixedBatchLoading: {},
    dragAndDropPsd: {},
    closeAllDocuments: {},
    allPassed: true,
  };

  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--guest',
    `--user-data-dir=${tmpProfile}`,
    `${previewUrl}/edit-image`,
  ]);

  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page' && t.url.includes('4173')) || list.find((t) => t.type === 'page');
        if (found) { pageTarget = found; break; }
      }
    } catch { }
  }

  if (!pageTarget) {
    console.error('Failed to connect to headless Edge browser.');
    edge.kill();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  };

  const waitForSelector = async (selector, maxTries = 40) => {
    for (let i = 0; i < maxTries; i++) {
      const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await sleep(250);
    }
    return false;
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });

  // Navigate and wait for welcome screen to mount
  console.log('[INIT] Navigating to http://127.0.0.1:4173/edit-image...');
  await send('Page.navigate', { url: `${previewUrl}/edit-image` });
  
  const welcomeLoaded = await waitForSelector('[data-testid="welcome-card-new-project"]', 40);
  if (!welcomeLoaded) {
    console.error('[ERROR] Welcome screen failed to load in time.');
    edge.kill();
    process.exit(1);
  }
  await sleep(1000);

  // -------------------------------------------------------------
  // TEST 1: Welcome Screen UI Validation
  // -------------------------------------------------------------
  console.log('--- TEST 1: Welcome Screen UI Validation ---');
  const wc = await evaluate(`
    (() => {
      const newProjBtn = document.querySelector('[data-testid="welcome-card-new-project"]');
      const openFileBtn = document.querySelector('[data-testid="welcome-card-open-file"]');
      const openPsdBtn = document.querySelector('[data-testid="welcome-card-open-psd"]');
      const actionCards = document.querySelectorAll('[data-testid="welcome-action-cards"] > div, [data-testid="welcome-action-cards"] > button');
      const dropzone = document.querySelector('[data-testid="welcome-upload-dropzone"]');
      const psdModal = document.querySelector('[data-testid="psd-import-modal"]');

      return {
        hasNewProject: !!newProjBtn,
        hasOpenFile: !!openFileBtn,
        openFileText: openFileBtn?.textContent?.replace(/\\s+/g, ' ').trim() || '',
        hasOpenPsd: !!openPsdBtn,
        totalCards: actionCards.length,
        dropzoneText: dropzone?.textContent?.replace(/\\s+/g, ' ').trim() || '',
        hasPsdModalInDom: !!psdModal,
      };
    })()
  `);

  console.log('Welcome Screen Status:', wc);
  const wcPass = wc.hasNewProject && wc.hasOpenFile && !wc.hasOpenPsd && wc.totalCards === 2 && !wc.hasPsdModalInDom;
  testReport.welcomeScreen = { ...wc, passed: wcPass };
  console.log(`[TEST 1 Result]: ${wcPass ? 'PASS' : 'FAIL'}`);

  // Screenshot Welcome Screen
  const ssWelcome = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'universal_open_01_welcome_screen.png'), Buffer.from(ssWelcome.data, 'base64'));

  // -------------------------------------------------------------
  // TEST 2: File Menu Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: File Menu Validation ---');
  // Click menu button
  await evaluate(`(() => {
    const fileBtn = document.querySelector('[data-testid="menu-btn-file"]');
    if (fileBtn) fileBtn.click();
  })()`);
  await sleep(400);

  const fmc = await evaluate(`
    (() => {
      const openFileItem = document.querySelector('[data-testid="menu-file-open"]');
      const openPsdItem = document.querySelector('[data-testid="menu-file-open-psd"]');
      const dropdown = document.querySelector('[data-testid="dropdown-menu-file"]');

      return {
        menuOpened: !!dropdown,
        hasOpenFileItem: !!openFileItem,
        openFileItemText: openFileItem?.textContent?.replace(/\\s+/g, ' ').trim() || '',
        hasOpenPsdItem: !!openPsdItem,
      };
    })()
  `);

  console.log('File Menu Status:', fmc);
  const fmcPass = fmc.menuOpened && fmc.hasOpenFileItem && !fmc.hasOpenPsdItem && fmc.openFileItemText.includes('Open File');
  testReport.fileMenu = { ...fmc, passed: fmcPass };
  console.log(`[TEST 2 Result]: ${fmcPass ? 'PASS' : 'FAIL'}`);

  // Screenshot File Menu
  const ssFileMenu = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'universal_open_02_file_menu.png'), Buffer.from(ssFileMenu.data, 'base64'));

  // Close File Menu by clicking outside
  await evaluate(`(() => { document.body.click(); })()`);
  await sleep(300);

  // -------------------------------------------------------------
  // TEST 3: Native File Picker Trigger on Click (No Modal)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Native File Picker Trigger on Click ---');
  const tc = await evaluate(`
    (() => {
      let inputClicked = false;
      const mainInput = document.querySelector('[data-testid="main-file-input"]');
      if (!mainInput) return { error: 'main-file-input not found' };

      const origClick = mainInput.click;
      mainInput.click = () => { inputClicked = true; };

      const openBtn = document.querySelector('[data-testid="welcome-card-open-file"]');
      if (openBtn) openBtn.click();

      // Restore click
      mainInput.click = origClick;

      const anyModal = document.querySelector('[class*="modalOverlay"], [class*="Modal_overlay"]');

      return {
        inputClicked,
        acceptAttr: mainInput.getAttribute('accept'),
        isMultiple: mainInput.hasAttribute('multiple'),
        modalOpened: !!anyModal,
      };
    })()
  `);

  console.log('Native Trigger Status:', tc);
  const tcPass = tc.inputClicked && !tc.modalOpened && tc.isMultiple && tc.acceptAttr.includes('.psd');
  testReport.nativePickerTrigger = { ...tc, passed: tcPass };
  console.log(`[TEST 3 Result]: ${tcPass ? 'PASS' : 'FAIL'}`);

  // -------------------------------------------------------------
  // TEST 4: Single PNG Image Opening (Direct to Canvas, No Modals)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Single PNG Loading ---');
  const pngRes = await evaluate(`
    (async () => {
      try {
        // Create 600x400 PNG
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('Universal Open PNG', 60, 210);

        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        const file = new File([blob], 'landscape_photo.png', { type: 'image/png' });

        const mainInput = document.querySelector('[data-testid="main-file-input"]');
        const dt = new DataTransfer();
        dt.items.add(file);
        mainInput.files = dt.files;
        mainInput.dispatchEvent(new Event('change', { bubbles: true }));

        await new Promise(r => setTimeout(r, 1500));

        const stage = document.querySelector('[data-canvas-stage="true"]');
        const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]')).map(t => t.textContent.trim());
        const modal = document.querySelector('[class*="modalOverlay"], [class*="Modal_overlay"]');

        return {
          success: true,
          hasStage: !!stage,
          stageWidth: stage?.style.width,
          stageHeight: stage?.style.height,
          tabs,
          modalVisible: !!modal,
        };
      } catch (err) {
        return { error: err.message };
      }
    })()
  `);

  console.log('PNG Load Status:', pngRes);
  const pngPass = pngRes.success && pngRes.hasStage && pngRes.tabs.length === 1 && !pngRes.modalVisible;
  testReport.pngLoading = { ...pngRes, passed: pngPass };
  console.log(`[TEST 4 Result]: ${pngPass ? 'PASS' : 'FAIL'}`);

  // Screenshot PNG loaded
  const ssPng = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'universal_open_03_png_loaded.png'), Buffer.from(ssPng.data, 'base64'));

  // -------------------------------------------------------------
  // TEST 5: Single PSD File Opening (Routes to PSD Parser, Multi-layer, No Modal)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Single PSD Loading ---');
  const psdRes = await evaluate(`
    (async () => {
      try {
        const res = await fetch('/psd-test-fixtures/test_1_500x500.psd');
        const blob = await res.blob();
        const file = new File([blob], 'project_500x500.psd', { type: 'image/vnd.adobe.photoshop' });

        const mainInput = document.querySelector('[data-testid="main-file-input"]');
        const dt = new DataTransfer();
        dt.items.add(file);
        mainInput.files = dt.files;
        mainInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Wait for PSD parsing and document store population
        await new Promise(r => setTimeout(r, 1800));

        const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]')).map(t => t.textContent.trim());
        const layerNodes = Array.from(document.querySelectorAll('[data-layer-id]')).map(l => l.getAttribute('data-layer-id'));
        const stage = document.querySelector('[data-canvas-stage="true"]');
        const psdModal = document.querySelector('[data-testid="psd-import-modal"]');

        return {
          success: true,
          tabs,
          layerCount: layerNodes.length,
          stageWidth: stage?.style.width,
          stageHeight: stage?.style.height,
          psdModalVisible: !!psdModal,
        };
      } catch (err) {
        return { error: err.message };
      }
    })()
  `);

  console.log('PSD Load Status:', psdRes);
  const psdPass = psdRes.success && psdRes.tabs.length === 2 && psdRes.layerCount >= 2 && !psdRes.psdModalVisible;
  testReport.psdLoading = { ...psdRes, passed: psdPass };
  console.log(`[TEST 5 Result]: ${psdPass ? 'PASS' : 'FAIL'}`);

  // Screenshot PSD loaded
  const ssPsd = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'universal_open_04_psd_loaded.png'), Buffer.from(ssPsd.data, 'base64'));

  // -------------------------------------------------------------
  // TEST 6: Mixed Multi-File Batch Selection (1 PNG + 1 PSD in one shot)
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Mixed Multi-File Batch Selection ---');
  const mixedRes = await evaluate(`
    (async () => {
      try {
        // 1. Create a PNG
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#10b981';
        ctx.fillRect(0, 0, 800, 600);
        const blobImg = await new Promise(r => canvas.toBlob(r, 'image/png'));
        const imgFile = new File([blobImg], 'batch_photo.png', { type: 'image/png' });

        // 2. Fetch centered logo PSD
        const res = await fetch('/psd-test-fixtures/test_4_centered_logo.psd');
        const blobPsd = await res.blob();
        const psdFile = new File([blobPsd], 'batch_design.psd', { type: 'image/vnd.adobe.photoshop' });

        // Batch both into main-file-input
        const mainInput = document.querySelector('[data-testid="main-file-input"]');
        const dt = new DataTransfer();
        dt.items.add(imgFile);
        dt.items.add(psdFile);
        mainInput.files = dt.files;
        mainInput.dispatchEvent(new Event('change', { bubbles: true }));

        await new Promise(r => setTimeout(r, 2200));

        const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]')).map(t => t.textContent.trim());

        return {
          success: true,
          tabs,
          totalTabs: tabs.length,
        };
      } catch (err) {
        return { error: err.message };
      }
    })()
  `);

  console.log('Mixed Multi-File Load Status:', mixedRes);
  const mixedPass = mixedRes.success && mixedRes.totalTabs === 4; // 1 (png) + 1 (psd) + 2 (mixed batch)
  testReport.mixedBatchLoading = { ...mixedRes, passed: mixedPass };
  console.log(`[TEST 6 Result]: ${mixedPass ? 'PASS' : 'FAIL'}`);

  // Screenshot Mixed Batch loaded
  const ssMixed = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'universal_open_05_mixed_batch_loaded.png'), Buffer.from(ssMixed.data, 'base64'));

  // -------------------------------------------------------------
  // TEST 7: Universal Drag-and-Drop PSD Routing (No generic modal)
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Universal Drag-and-Drop PSD Routing ---');
  const dropRes = await evaluate(`
    (async () => {
      try {
        const res = await fetch('/psd-test-fixtures/test_8_transparent_bg.psd');
        const blob = await res.blob();
        const psdFile = new File([blob], 'drag_dropped_transparent.psd', { type: 'image/vnd.adobe.photoshop' });

        const dt = new DataTransfer();
        dt.items.add(psdFile);
        Object.defineProperty(dt, 'types', { value: ['Files'] });

        const toolEl = document.getElementById('tool');
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
        });

        toolEl.dispatchEvent(dropEvent);

        await new Promise(r => setTimeout(r, 2000));

        const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]')).map(t => t.textContent.trim());
        const genericUploadModal = document.querySelector('[data-testid="upload-modal"], [class*="UploadModal"]');
        const psdModal = document.querySelector('[data-testid="psd-import-modal"]');

        return {
          success: true,
          tabs,
          totalTabs: tabs.length,
          hasGenericModal: !!genericUploadModal,
          hasPsdModal: !!psdModal,
        };
      } catch (err) {
        return { error: err.message };
      }
    })()
  `);

  console.log('Drag and Drop PSD Status:', dropRes);
  const dropPass = dropRes.success && dropRes.totalTabs === 5 && !dropRes.hasGenericModal && !dropRes.hasPsdModal;
  testReport.dragAndDropPsd = { ...dropRes, passed: dropPass };
  console.log(`[TEST 7 Result]: ${dropPass ? 'PASS' : 'FAIL'}`);

  // Screenshot after drag and drop
  const ssDrop = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'universal_open_06_drag_drop_psd.png'), Buffer.from(ssDrop.data, 'base64'));

  // -------------------------------------------------------------
  // TEST 8: Close All Documents & Clean Welcome Screen Return
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Close All Documents & Clean Welcome Screen Return ---');
  await evaluate(`(() => {
    const closeAllBtn = document.querySelector('[data-testid="btn-close-all-docs"]');
    if (closeAllBtn) closeAllBtn.click();
  })()`);
  await sleep(500);

  // If unsaved modal appears, click discard
  await evaluate(`(() => {
    const discardBtn = document.querySelector('[data-testid="btn-unsaved-discard"]');
    if (discardBtn) discardBtn.click();
  })()`);
  await sleep(800);

  const closeAllRes = await evaluate(`
    (() => {
      const newProjBtn = document.querySelector('[data-testid="welcome-card-new-project"]');
      const openFileBtn = document.querySelector('[data-testid="welcome-card-open-file"]');
      const openPsdBtn = document.querySelector('[data-testid="welcome-card-open-psd"]');
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]'));

      return {
        remainingTabs: tabs.length,
        welcomeScreenVisible: !!newProjBtn && !!openFileBtn,
        hasOpenPsd: !!openPsdBtn,
      };
    })()
  `);

  console.log('Close All Status:', closeAllRes);
  const closeAllPass = closeAllRes.remainingTabs === 0 && closeAllRes.welcomeScreenVisible && !closeAllRes.hasOpenPsd;
  testReport.closeAllDocuments = { ...closeAllRes, passed: closeAllPass };
  console.log(`[TEST 8 Result]: ${closeAllPass ? 'PASS' : 'FAIL'}`);

  // Final Screenshot of Welcome Screen after closing all
  const ssFinalWelcome = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'universal_open_07_final_welcome_screen.png'), Buffer.from(ssFinalWelcome.data, 'base64'));

  // Check overall pass
  testReport.allPassed = wcPass && fmcPass && tcPass && pngPass && psdPass && mixedPass && dropPass && closeAllPass;

  fs.writeFileSync(
    path.join(outDir, 'universal_open_file_verification.json'),
    JSON.stringify(testReport, null, 2)
  );

  console.log('\n=============================================');
  console.log(`FINAL RESULT: ${testReport.allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
  console.log('=============================================\n');

  edge.kill();
  process.exit(testReport.allPassed ? 0 : 1);
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
