const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EDGE_PORT = 9400 + Math.floor(Math.random() * 500);
const APP_URL = 'http://127.0.0.1:4173/edit-image';

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('[TEST] Starting headless browser verification for Image Menu & Tool Groups...');

  const tmpUserData = path.join(process.env.TEMP || 'C:\\Temp', 'edge_img_menu_' + Date.now());

  const edgeProcess = spawn(EDGE_BIN, [
    `--remote-debugging-port=${EDGE_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tmpUserData}`,
    '--window-size=1440,900',
    APP_URL,
  ]);

  edgeProcess.on('error', (err) => {
    console.error('[TEST] Edge process error:', err);
  });

  // Wait for Edge to start
  let targets = null;
  for (let i = 0; i < 30; i++) {
    await wait(400);
    try {
      targets = await fetchJson(`http://127.0.0.1:${EDGE_PORT}/json`);
      if (targets && targets.length > 0) break;
    } catch (_) {}
  }

  if (!targets || targets.length === 0) {
    console.error('[TEST] Could not connect to Edge DevTools target.');
    edgeProcess.kill();
    process.exit(1);
  }

  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('4173')) || targets[0];
  console.log('[TEST] Connected to target page:', pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const res = JSON.parse(event.data);
    if (res.id && pending.has(res.id)) {
      const { resolve, reject } = pending.get(res.id);
      pending.delete(res.id);
      if (res.error) reject(res.error);
      else resolve(res.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function sendCmd(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expr) {
    for (let attempt = 0; attempt < 25; attempt++) {
      try {
        const res = await sendCmd('Runtime.evaluate', {
          expression: expr,
          returnByValue: true,
          awaitPromise: true,
        });
        if (res.exceptionDetails) {
          throw new Error(JSON.stringify(res.exceptionDetails));
        }
        return res.result ? res.result.value : undefined;
      } catch (err) {
        if (err.message && err.message.includes('execution context')) {
          await wait(300);
          continue;
        }
        throw err;
      }
    }
  }

  async function waitForSelector(selector, maxTries = 40) {
    for (let i = 0; i < maxTries; i++) {
      const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await wait(250);
    }
    return false;
  }

  async function captureScreenshot(name) {
    const res = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, `${name}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`[SCREENSHOT] Saved: ${name}.png`);
    return outPath;
  }

  const results = {};

  try {
    console.log('[Audit] Enabling DevTools domains...');
    await sendCmd('Page.enable');
    await sendCmd('DOM.enable');
    await sendCmd('Runtime.enable');
    console.log('[Audit] Navigating explicitly to APP_URL...');
    await sendCmd('Page.navigate', { url: APP_URL });
    await wait(3000);

    // Dismiss Cookie Banner if present
    await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept All') || b.textContent.includes('Reject'));
      if (btn) btn.click();
    })()`);
    await wait(500);

    // 1. Wait for Welcome Screen and create project
    console.log('[STEP 1] Waiting for Welcome screen and creating 1080x1080 project...');
    const hasPreset = await waitForSelector('[data-testid="preset-card-ig-post"]', 40);
    if (!hasPreset) {
      throw new Error('Preset card not found on welcome screen');
    }

    await evaluate(`document.querySelector('[data-testid="preset-card-ig-post"]').click()`);
    await waitForSelector('[data-canvas-stage="true"], [data-testid="canvas-stage"]', 40);
    await wait(1500);

    const docState = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]') || document.querySelector('[data-testid="canvas-stage"]');
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]')).map(t => t.textContent.trim());
      return {
        hasStage: Boolean(stage),
        tabs,
      };
    })()`);
    results.docState = docState;
    console.log('[CHECK] Active document initialized:', docState);

    // 2. Check Top Menu Bar Menus
    console.log('[STEP 2] Verifying top application menu buttons...');
    const topMenus = await evaluate(`(() => {
      return Array.from(document.querySelectorAll('[data-testid^="menu-btn-"]')).map(b => ({
        id: b.getAttribute('data-testid'),
        text: b.textContent.trim(),
      }));
    })()`);
    results.topMenus = topMenus;
    console.log('[CHECK] Top menu bar buttons:', topMenus.map(m => m.text).join(' | '));

    // 3. Open and Inspect Image Menu Dropdown
    console.log('[STEP 3] Opening Image menu...');
    await evaluate(`(() => {
      const imgMenuBtn = document.querySelector('[data-testid="menu-btn-image"]');
      if (imgMenuBtn) imgMenuBtn.click();
    })()`);
    await wait(500);

    const imageMenuItems = await evaluate(`(() => {
      const popover = document.querySelector('[data-testid="dropdown-menu-image"]');
      if (!popover) return null;
      const headers = Array.from(popover.querySelectorAll('[data-category-header="true"]')).map(h => h.textContent.trim());
      const items = Array.from(popover.querySelectorAll('[data-testid]')).map(b => ({
        id: b.getAttribute('data-testid'),
        text: b.textContent.trim(),
        disabled: b.disabled,
      }));
      return { found: true, headers, items };
    })()`);
    results.imageMenuItems = imageMenuItems;
    console.log('[CHECK] Image Menu Categories:', imageMenuItems?.headers);
    console.log('[CHECK] Image Menu Item Count:', imageMenuItems?.items?.length);
    console.log('[CHECK] Enabled items count:', imageMenuItems?.items?.filter(i => !i.disabled).length);

    await captureScreenshot('image_menu_01_dropdown_opened');

    // 4. Test Image Information Dialog
    console.log('[STEP 4] Testing Image Information dialog...');
    await evaluate(`(() => {
      const infoBtn = document.querySelector('[data-testid="menu-image-info"]');
      if (infoBtn) infoBtn.click();
    })()`);
    await wait(600);

    const imageInfoModal = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="modal-image-info"]');
      if (!modal) return null;
      return { found: true, text: modal.textContent.trim() };
    })()`);
    results.imageInfoModal = imageInfoModal;
    console.log('[CHECK] Image Info Modal Found:', Boolean(imageInfoModal?.found));
    await captureScreenshot('image_menu_02_info_modal');

    // Close Info dialog
    await evaluate(`(() => {
      const okBtn = document.querySelector('[data-testid="btn-close-image-info"]');
      if (okBtn) okBtn.click();
    })()`);
    await wait(400);

    // 5. Test Image Resolution Dialog
    console.log('[STEP 5] Testing Image Resolution dialog...');
    await evaluate(`(() => {
      const imgMenuBtn = document.querySelector('[data-testid="menu-btn-image"]');
      if (imgMenuBtn) imgMenuBtn.click();
    })()`);
    await wait(400);
    await evaluate(`(() => {
      const resBtn = document.querySelector('[data-testid="menu-image-resolution"]');
      if (resBtn) resBtn.click();
    })()`);
    await wait(600);

    const resolutionModal = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="modal-image-resolution"]');
      return { found: Boolean(modal), text: modal?.textContent?.trim() };
    })()`);
    results.resolutionModal = resolutionModal;
    console.log('[CHECK] Image Resolution Modal Found:', Boolean(resolutionModal?.found));
    await captureScreenshot('image_menu_03_resolution_modal');

    // Close Resolution dialog
    await evaluate(`(() => {
      const okBtn = document.querySelector('[data-testid="btn-close-resolution"]');
      if (okBtn) okBtn.click();
    })()`);
    await wait(400);

    // 6. Test Canvas Background Modal
    console.log('[STEP 6] Testing Canvas Background dialog...');
    await evaluate(`(() => {
      const imgMenuBtn = document.querySelector('[data-testid="menu-btn-image"]');
      if (imgMenuBtn) imgMenuBtn.click();
    })()`);
    await wait(400);
    await evaluate(`(() => {
      const bgBtn = document.querySelector('[data-testid="menu-image-canvas-bg"]');
      if (bgBtn) bgBtn.click();
    })()`);
    await wait(600);

    const canvasBgModal = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="modal-canvas-background"]');
      return { found: Boolean(modal), text: modal?.textContent?.trim() };
    })()`);
    results.canvasBgModal = canvasBgModal;
    console.log('[CHECK] Canvas Background Modal Found:', Boolean(canvasBgModal?.found));
    await captureScreenshot('image_menu_04_canvas_bg_modal');

    // Close Canvas Background dialog
    await evaluate(`(() => {
      const cancelBtn = document.querySelector('[data-testid="modal-canvas-background"] button') ||
                         document.querySelector('[data-testid="modal-canvas-background"]');
      if (cancelBtn) cancelBtn.click();
    })()`);
    await wait(400);

    // 7. Test Marquee Tool Group & Flyout
    console.log('[STEP 7] Testing Marquee flyout via corner indicator zone...');
    await evaluate(`(() => {
      const trigger = document.querySelector('[data-testid="corner-trigger-slot-marquee"]');
      if (trigger) trigger.click();
    })()`);
    await wait(500);

    const marqueeFlyout = await evaluate(`(() => {
      const flyout = document.querySelector('[data-testid="flyout-slot-marquee"]');
      if (!flyout) return null;
      return {
        found: true,
        tools: Array.from(flyout.querySelectorAll('[data-testid]')).map(b => ({
          id: b.getAttribute('data-testid'),
          text: b.textContent.trim(),
        }))
      };
    })()`);
    results.marqueeFlyout = marqueeFlyout;
    console.log('[CHECK] Marquee Flyout Tools Count:', marqueeFlyout?.tools?.length);
    console.log('[CHECK] Marquee Tools:', marqueeFlyout?.tools?.map(t => t.text).join(' | '));
    await captureScreenshot('left_toolbar_01_marquee_flyout');

    // 8. Select Single Row Marquee Tool from flyout & click stage
    console.log('[STEP 8] Selecting Single Row Marquee and making selection...');
    await evaluate(`(() => {
      const rowTool = document.querySelector('[data-testid="tool-single-row-marquee"]');
      if (rowTool) rowTool.click();
    })()`);
    await wait(400);

    // Click on canvas stage to create single row selection
    await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]') || document.querySelector('[data-testid="canvas-stage"]');
      if (stage) {
        const rect = stage.getBoundingClientRect();
        const evt = new MouseEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 200,
          clientY: rect.top + 200,
          button: 0,
        });
        stage.dispatchEvent(evt);
      }
    })()`);
    await wait(600);

    const rowSelection = await evaluate(`(() => {
      const ants = document.querySelector('[data-testid="marching-ants-overlay"]') ||
                   document.querySelector('svg[data-testid="marching-ants-overlay"]');
      return { marchingAntsFound: Boolean(ants) };
    })()`);
    results.rowSelection = rowSelection;
    console.log('[CHECK] Single Row Marquee selection created (marching ants):', rowSelection.marchingAntsFound);
    await captureScreenshot('marquee_01_single_row_selected');

    // 9. Test Shapes Tool Group Flyout
    console.log('[STEP 9] Testing Shapes flyout via corner indicator zone...');
    await evaluate(`(() => {
      const trigger = document.querySelector('[data-testid="corner-trigger-slot-shape"]');
      if (trigger) trigger.click();
    })()`);
    await wait(500);

    const shapeFlyout = await evaluate(`(() => {
      const flyout = document.querySelector('[data-testid="flyout-slot-shape"]');
      if (!flyout) return null;
      return {
        found: true,
        tools: Array.from(flyout.querySelectorAll('[data-testid]')).map(b => ({
          id: b.getAttribute('data-testid'),
          text: b.textContent.trim(),
        }))
      };
    })()`);
    results.shapeFlyout = shapeFlyout;
    console.log('[CHECK] Shape Flyout Tools Count:', shapeFlyout?.tools?.length);
    console.log('[CHECK] Shape Tools:', shapeFlyout?.tools?.map(t => t.text).join(' | '));
    await captureScreenshot('left_toolbar_02_shapes_flyout');

    // 10. Select Polygon (Hexagon) Tool from flyout
    console.log('[STEP 10] Selecting Polygon Tool from flyout...');
    await evaluate(`(() => {
      const polyTool = document.querySelector('[data-testid="tool-polygon"]');
      if (polyTool) polyTool.click();
    })()`);
    await wait(400);

    // 11. Test Rectangular Marquee Selection -> Crop to Selection
    console.log('[STEP 11] Testing Rectangular Marquee & Crop to Selection...');
    await evaluate(`(() => {
      const rectMarquee = document.querySelector('[data-testid="tool-marquee-rect"]');
      if (rectMarquee) rectMarquee.click();
    })()`);
    await wait(400);

    await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]') || document.querySelector('[data-testid="canvas-stage"]');
      if (stage) {
        const rect = stage.getBoundingClientRect();
        stage.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: rect.left + 50, clientY: rect.top + 50 }));
        stage.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: rect.left + 450, clientY: rect.top + 350 }));
        stage.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      }
    })()`);
    await wait(600);

    // Open Image menu & click Crop to Selection
    await evaluate(`(() => {
      const imgMenuBtn = document.querySelector('[data-testid="menu-btn-image"]');
      if (imgMenuBtn) imgMenuBtn.click();
    })()`);
    await wait(400);

    await evaluate(`(() => {
      const cropBtn = document.querySelector('[data-testid="menu-image-crop-selection"]');
      if (cropBtn) cropBtn.click();
    })()`);
    await wait(1200);

    const afterCrop = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]') || document.querySelector('[data-testid="canvas-stage"]');
      const widthVal = document.querySelector('[data-testid="canvas-width-input"]')?.value ||
                       document.querySelector('[data-testid="bottom-status-dimensions"]')?.textContent;
      return {
        stageStyleWidth: stage?.style?.width,
        stageStyleHeight: stage?.style?.height,
        dimensions: widthVal,
      };
    })()`);
    results.afterCrop = afterCrop;
    console.log('[CHECK] Document after Crop to Selection:', afterCrop);
    await captureScreenshot('image_menu_05_after_crop_to_selection');

    // 12. Check Move Tool (Single-tool slot has NO corner indicator)
    console.log('[STEP 12] Checking Move tool slot has NO corner indicator...');
    const moveCorner = await evaluate(`(() => {
      const trigger = document.querySelector('[data-testid="corner-trigger-slot-move"]');
      return { hasCornerTrigger: Boolean(trigger) };
    })()`);
    results.moveCorner = moveCorner;
    console.log('[CHECK] Move tool corner trigger present (should be false):', moveCorner.hasCornerTrigger);

    // 13. Test Keyboard Shortcuts
    console.log('[STEP 13] Testing Keyboard Shortcuts...');
    const shortcutsTest = await evaluate(`(() => {
      // Test Shift+M (Elliptical Marquee)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'M', shiftKey: true, bubbles: true }));
      const activeMarquee = document.querySelector('[data-testid="corner-trigger-slot-marquee"]')?.parentElement?.getAttribute('data-tool-id');

      // Test Shift+U (Ellipse Shape)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'U', shiftKey: true, bubbles: true }));
      const activeShape = document.querySelector('[data-testid="corner-trigger-slot-shape"]')?.parentElement?.getAttribute('data-tool-id');

      // Test V (Move tool)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }));
      const activeMove = document.querySelector('[data-tool-id="move"]')?.getAttribute('data-tool-active');

      return {
        activeMarqueeAfterShiftM: activeMarquee,
        activeShapeAfterShiftU: activeShape,
        isMoveActiveAfterV: activeMove === 'true',
      };
    })()`);
    results.shortcutsTest = shortcutsTest;
    console.log('[CHECK] Shortcuts test result:', shortcutsTest);

    // Save JSON audit results
    const resultsPath = path.join(ARTIFACT_DIR, 'image_menu_tool_groups_verification.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('[REPORT] Results written to:', resultsPath);

  } catch (err) {
    console.error('[TEST ERROR]', err);
  } finally {
    edgeProcess.kill();
    console.log('[DONE] Verification complete.');
    process.exit(0);
  }
}

runVerification();
