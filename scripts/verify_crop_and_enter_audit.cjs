const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9412;
const previewUrl = 'http://localhost:4173';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-crop-audit-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAudit() {
  console.log('--- Launching Edge for Crop & Enter Audit ---');
  const edge = spawn(edgePath, [
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
    'about:blank',
  ]);

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
    } catch { }
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

      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === curId) {
          clearTimeout(timer);
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  const evaluate = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  };

  const waitForSelector = async (selector, maxAttempts = 35, interval = 250) => {
    for (let i = 0; i < maxAttempts; i++) {
      const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await sleep(interval);
    }
    return false;
  };

  const captureScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const fullPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(fullPath, buf);
    console.log(`Saved screenshot: ${fullPath}`);
    return fullPath;
  };

  const auditResults = {
    cropAppliedViaButton: false,
    cropCanvasDimensionsUpdated: false,
    cropBackgroundLayerUpdated: false,
    cropUndoRestoresDimensions: false,
    cropRedoReappliesDimensions: false,
    cropAppliedViaEnter: false,
    resizeAppliedViaEnter: false,
    multilineTextareaPreservesEnter: false,
    screenshots: [],
    details: {},
  };

  try {
    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Set cookie consent and navigate
    console.log('[Setup] Setting cookie consent...');
    await send('Page.navigate', { url: `${previewUrl}/edit-image` });
    await sleep(2000);
    const pageState = await evaluate(`(() => ({
      href: window.location.href,
      title: document.title,
      bodyClasses: document.body.className,
      hasWelcome: Boolean(document.querySelector('[data-testid="editor-welcome-screen"]')),
      hasPresetsRow: Boolean(document.querySelector('[data-testid="popular-presets-row"]')),
      allTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')),
    }))()`);
    console.log('[Page Diagnostics]:', pageState);

    // 1. Create a 1080x1080 canvas from Instagram Post preset
    console.log('[Step 1] Waiting for Welcome Screen preset card...');
    const hasPreset = await waitForSelector('[data-testid="preset-card-ig-post"]', 30);
    if (!hasPreset) {
      throw new Error('preset-card-ig-post not found on welcome screen');
    }

    console.log('[Step 1] Clicking preset-card-ig-post (1080x1080)...');
    await evaluate(`document.querySelector('[data-testid="preset-card-ig-post"]').click()`);

    await waitForSelector('[data-testid="document-tab-active"]', 30);
    await waitForSelector('[data-canvas-stage="true"]', 30);
    await sleep(1500);

    // Verify initial canvas dimensions
    const initDims = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        width: stage ? parseInt(stage.style.width, 10) : 0,
        height: stage ? parseInt(stage.style.height, 10) : 0,
      };
    })()`);
    console.log('[Step 1] Initial Stage Dimensions:', initDims);
    auditResults.details.initialDims = initDims;

    // 2. Select Crop Tool
    console.log('[Step 2] Selecting Crop Tool (C)...');
    await evaluate(`(() => {
      const cropBtn = document.querySelector('button[data-tool-id="crop"]') ||
                      document.querySelector('[data-tab-id="crop"]');
      if (cropBtn) cropBtn.click();
    })()`);

    const hasOverlay = await waitForSelector('[data-crop-overlay="true"]', 30);
    if (!hasOverlay) {
      throw new Error('Crop overlay failed to appear after activating Crop Tool');
    }
    await sleep(800);

    // 3. Set a specific crop region: 500 x 400 starting at (100, 100)
    console.log('[Step 3] Dragging on canvas to define crop box (100, 100, 500, 400)...');
    await evaluate(`(() => {
      const overlay = document.querySelector('[data-crop-overlay="true"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const rect = stage.getBoundingClientRect();

      overlay.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 100,
        clientY: rect.top + 100
      }));

      window.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 600,
        clientY: rect.top + 500
      }));

      window.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true
      }));
    })()`);
    await sleep(600);

    const cropBoxState = await evaluate(`(() => {
      const badge = document.querySelector('[data-crop-badge="true"]');
      const overlay = document.querySelector('[data-crop-overlay="true"]');
      return {
        badgeText: badge ? badge.textContent.trim() : '',
        overlayLeft: overlay ? overlay.style.left : '',
        overlayTop: overlay ? overlay.style.top : '',
        overlayW: overlay ? overlay.style.width : '',
        overlayH: overlay ? overlay.style.height : '',
      };
    })()`);
    console.log('[Step 3] Crop Box before Apply:', cropBoxState);
    auditResults.details.cropBoxBeforeApply = cropBoxState;

    // 4. Click "Apply Crop" via button
    console.log('[Step 4] Clicking Apply Crop button...');
    await evaluate(`(() => {
      const applyBtn = document.querySelector('[data-testid="crop-apply-btn"]') ||
                       document.querySelector('[data-apply-crop="true"]');
      if (applyBtn) applyBtn.click();
    })()`);
    await sleep(1500);

    // Inspect post-crop dimensions
    const postCropDims = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const bgLayer = document.querySelector('[data-layer-id="background"]');
      const bgImg = bgLayer ? bgLayer.querySelector('img') : null;
      const docTab = document.querySelector('[data-testid="document-tab-active"]');
      return {
        stageWidth: stage ? parseInt(stage.style.width, 10) : 0,
        stageHeight: stage ? parseInt(stage.style.height, 10) : 0,
        bgLayerLeft: bgLayer ? bgLayer.style.left : '',
        bgLayerTop: bgLayer ? bgLayer.style.top : '',
        bgLayerWidth: bgLayer ? bgLayer.style.width : '',
        bgLayerHeight: bgLayer ? bgLayer.style.height : '',
        bgImgSrcLength: bgImg ? bgImg.src.length : 0,
        docTabInfo: docTab ? docTab.textContent.trim() : '',
      };
    })()`);
    console.log('[Step 4] Post-Crop State:', postCropDims);
    auditResults.details.postCropState = postCropDims;

    const snap1 = await captureScreenshot('crop_01_applied_via_button.png');
    auditResults.screenshots.push(snap1);

    if (postCropDims.stageWidth > 0 && postCropDims.stageWidth < 1080 &&
      postCropDims.stageHeight > 0 && postCropDims.stageHeight < 1080) {
      auditResults.cropAppliedViaButton = true;
      auditResults.cropCanvasDimensionsUpdated = true;
    }

    if (postCropDims.bgLayerLeft === '0px' && postCropDims.bgLayerTop === '0px' &&
      postCropDims.bgLayerWidth === `${postCropDims.stageWidth}px` &&
      postCropDims.bgLayerHeight === `${postCropDims.stageHeight}px`) {
      auditResults.cropBackgroundLayerUpdated = true;
    }

    // 5. Test UNDO (Ctrl + Z)
    console.log('[Step 5] Testing Undo (Ctrl + Z)...');
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'z',
        code: 'KeyZ',
        ctrlKey: true,
        bubbles: true
      }));
    })()`);
    await sleep(1000);

    const undoDims = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const bgLayer = document.querySelector('[data-layer-id="background"]');
      return {
        stageWidth: stage ? parseInt(stage.style.width, 10) : 0,
        stageHeight: stage ? parseInt(stage.style.height, 10) : 0,
        bgLayerWidth: bgLayer ? bgLayer.style.width : '',
        bgLayerHeight: bgLayer ? bgLayer.style.height : '',
      };
    })()`);
    console.log('[Step 5] Undo State (Reverted to original):', undoDims);
    auditResults.details.undoState = undoDims;

    const snap2 = await captureScreenshot('crop_02_undo_restores_1080.png');
    auditResults.screenshots.push(snap2);

    if (undoDims.stageWidth === 1080 && undoDims.stageHeight === 1080) {
      auditResults.cropUndoRestoresDimensions = true;
    }

    // 6. Test REDO (Ctrl + Y)
    console.log('[Step 6] Testing Redo (Ctrl + Y)...');
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'y',
        code: 'KeyY',
        ctrlKey: true,
        bubbles: true
      }));
    })()`);
    await sleep(1000);

    const redoDims = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        stageWidth: stage ? parseInt(stage.style.width, 10) : 0,
        stageHeight: stage ? parseInt(stage.style.height, 10) : 0,
      };
    })()`);
    console.log('[Step 6] Redo State (Crop reapplied):', redoDims);
    auditResults.details.redoState = redoDims;

    const snap3 = await captureScreenshot('crop_03_redo_reapplies_crop.png');
    auditResults.screenshots.push(snap3);

    if (redoDims.stageWidth === postCropDims.stageWidth && redoDims.stageHeight === postCropDims.stageHeight) {
      auditResults.cropRedoReappliesDimensions = true;
    }

    // 7. Test Enter Key to Apply Crop
    console.log('[Step 7] Testing Enter Key to Apply Crop...');
    await evaluate(`(() => {
      const cropBtn = document.querySelector('button[data-tool-id="crop"]') ||
                      document.querySelector('[data-tab-id="crop"]');
      if (cropBtn) cropBtn.click();
    })()`);
    await waitForSelector('[data-crop-overlay="true"]', 25);
    await sleep(600);

    await evaluate(`(() => {
      const overlay = document.querySelector('[data-crop-overlay="true"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const rect = stage.getBoundingClientRect();

      overlay.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 50,
        clientY: rect.top + 50
      }));

      window.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 350,
        clientY: rect.top + 300
      }));

      window.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true
      }));
    })()`);
    await sleep(500);

    console.log('[Step 7] Pressing ENTER to apply crop...');
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true
      }));
    })()`);
    await sleep(1500);

    const postEnterCropDims = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        stageWidth: stage ? parseInt(stage.style.width, 10) : 0,
        stageHeight: stage ? parseInt(stage.style.height, 10) : 0,
      };
    })()`);
    console.log('[Step 7] Post-Enter-Crop Dimensions:', postEnterCropDims);
    auditResults.details.postEnterCropDims = postEnterCropDims;

    const snap4 = await captureScreenshot('crop_04_applied_via_enter.png');
    auditResults.screenshots.push(snap4);

    if (postEnterCropDims.stageWidth > 0 && postEnterCropDims.stageWidth < redoDims.stageWidth) {
      auditResults.cropAppliedViaEnter = true;
    }

    // 8. Test Enter Key to Apply Resize
    console.log('[Step 8] Testing Enter Key to Apply Resize...');
    await evaluate(`(() => {
      const resizeTab = document.querySelector('button[data-tool-id="resize"]') ||
                        document.querySelector('[data-tab-id="resize"]');
      if (resizeTab) resizeTab.click();
    })()`);
    await sleep(800);

    await evaluate(`(() => {
      const wInput = document.querySelector('input[data-testid="resize-width-input"]') ||
                    document.querySelector('input[placeholder="Width"]') ||
                    document.querySelectorAll('input[type="number"]')[0];
      if (wInput) {
        wInput.focus();
        wInput.value = '750';
        wInput.dispatchEvent(new Event('input', { bubbles: true }));
        wInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await sleep(400);

    console.log('[Step 8] Pressing ENTER in Resize input...');
    await evaluate(`(() => {
      const activeEl = document.activeElement;
      activeEl.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true
      }));
    })()`);
    await sleep(1500);

    const postResizeDims = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        stageWidth: stage ? parseInt(stage.style.width, 10) : 0,
        stageHeight: stage ? parseInt(stage.style.height, 10) : 0,
      };
    })()`);
    console.log('[Step 8] Post-Resize Dimensions:', postResizeDims);
    auditResults.details.postResizeDims = postResizeDims;

    const snap5 = await captureScreenshot('crop_05_resize_applied_via_enter.png');
    auditResults.screenshots.push(snap5);

    if (postResizeDims.stageWidth === 750) {
      auditResults.resizeAppliedViaEnter = true;
    }

    // 9. Test multiline textarea does NOT apply on Enter
    console.log('[Step 9] Testing multiline textarea does not trigger apply on Enter...');
    const textareaCheck = await evaluate(`(() => {
      const ta = document.createElement('textarea');
      document.body.appendChild(ta);
      ta.focus();
      ta.value = 'Line 1';

      const evt = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(evt);
      document.body.removeChild(ta);
      return { defaultPrevented: evt.defaultPrevented };
    })()`);
    console.log('[Step 9] Textarea Enter Check (defaultPrevented should be false):', textareaCheck);
    if (!textareaCheck.defaultPrevented) {
      auditResults.multilineTextareaPreservesEnter = true;
    }

    console.log('--- Audit Completed Successfully ---');
    console.log(JSON.stringify(auditResults, null, 2));

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'crop_and_enter_audit_results.json'),
      JSON.stringify(auditResults, null, 2)
    );
  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    if (edge) {
      edge.kill();
    }
  }
}

runAudit();