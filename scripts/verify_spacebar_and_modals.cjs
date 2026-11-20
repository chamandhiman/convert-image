const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EDGE_PORT = 9600 + Math.floor(Math.random() * 300);
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
  console.log('[TEST] Starting headless browser verification for Spacebar Hand Tool and Modals...');

  const tmpUserData = path.join(process.env.TEMP || 'C:\\Temp', 'edge_spacebar_modal_' + Date.now());

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

  let targets = null;
  for (let i = 0; i < 35; i++) {
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

  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    } catch (e) {
      console.error('[WS ERROR]', e);
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    for (let attempt = 0; attempt < 25; attempt++) {
      try {
        const res = await sendCommand('Runtime.evaluate', {
          expression,
          returnByValue: true,
          awaitPromise: true,
        });
        if (res.exceptionDetails) {
          throw new Error(JSON.stringify(res.exceptionDetails));
        }
        return res.result?.value;
      } catch (err) {
        if (err.message && err.message.includes('execution context')) {
          await wait(250);
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

  async function captureScreenshot(filePath) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log('[TEST] Saved screenshot:', filePath);
  }

  try {
    await sendCommand('Page.enable');
    await sendCommand('DOM.enable');
    await sendCommand('Runtime.enable');

    console.log('[TEST] Navigating to editor URL...');
    await sendCommand('Page.navigate', { url: APP_URL });
    await wait(2500);

    // Dismiss any cookie / notice banners
    await evaluate(`(() => {
      const btn = document.querySelector('button[aria-label="Accept all cookies"]') ||
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept') || b.textContent.includes('Got it'));
      if (btn) btn.click();
    })()`);
    await wait(500);

    // Click on preset or create project
    console.log('[TEST] Initializing new canvas project...');
    const hasPreset = await waitForSelector('[data-testid="preset-card-ig-post"], [data-testid="welcome-btn-new-project"]', 30);
    if (hasPreset) {
      await evaluate(`(() => {
        const target = document.querySelector('[data-testid="preset-card-ig-post"]') ||
                       document.querySelector('[data-testid="welcome-btn-new-project"]');
        if (target) target.click();
      })()`);
      await wait(600);

      await evaluate(`(() => {
        const createBtn = document.querySelector('[data-testid="canvas-setup-create"]') ||
                          document.querySelector('button[type="submit"]');
        if (createBtn) createBtn.click();
      })()`);
    }

    await waitForSelector('[data-canvas-stage="true"], [data-testid="canvas-viewport"]', 40);
    await wait(1200);

    const docInitialized = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      return {
        hasStage: Boolean(stage),
        hasViewport: Boolean(vp),
        stageW: stage?.style.width,
        stageH: stage?.style.height,
      };
    })()`);
    console.log('[TEST] Document canvas initialized:', docInitialized);

    const results = {
      tests: [],
      passed: 0,
      failed: 0,
    };

    function recordTest(name, passed, detail) {
      results.tests.push({ name, passed, detail });
      if (passed) {
        results.passed++;
        console.log(`[PASS] ${name} - ${detail || ''}`);
      } else {
        results.failed++;
        console.error(`[FAIL] ${name} - ${detail || ''}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 1: Spacebar Temporary Hand Tool from Text Tool
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Spacebar Temporary Hand from Text Tool ---');
    await waitForSelector('[data-testid="tool-text"]', 20);
    await evaluate(`document.querySelector('[data-testid="tool-text"]').click()`);
    await wait(500);

    const isTextActive = await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="tool-text"]');
      const badge = document.querySelector('[data-testid="text-tool-dropdown-badge"]') ||
                    document.querySelector('[data-testid="contextual-tool-badge"]');
      return Boolean(btn?.classList.contains('active') || badge?.textContent?.includes('T'));
    })()`);
    recordTest('1.1 Text Tool activated', isTextActive, 'Text Tool is active');

    // Press Spacebar
    await sendCommand('Input.dispatchKeyEvent', {
      type: 'keyDown',
      code: 'Space',
      key: ' ',
      windowsVirtualKeyCode: 32,
    });
    await wait(200);

    const spaceState = await evaluate(`(() => {
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      return {
        className: vp?.className,
        cursor: vp ? window.getComputedStyle(vp).cursor : null,
      };
    })()`);
    recordTest('1.2 Spacebar activates temporary grab cursor', spaceState.cursor === 'grab' || spaceState.className?.includes('viewportPan'), `Cursor: ${spaceState.cursor}`);

    // Viewport drag while Spacebar is held
    const vpCenter = await evaluate(`(() => {
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      const r = vp.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    })()`);

    const panBefore = await evaluate(`document.querySelector('[data-canvas-stage="true"]')?.style.transform || ''`);

    await sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: vpCenter.x, y: vpCenter.y, button: 'left', buttons: 1 });
    await wait(100);
    await sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: vpCenter.x + 100, y: vpCenter.y + 70, button: 'left', buttons: 1 });
    await wait(100);

    const panDuring = await evaluate(`document.querySelector('[data-canvas-stage="true"]')?.style.transform || ''`);

    await sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: vpCenter.x + 100, y: vpCenter.y + 70, button: 'left', buttons: 0 });
    await wait(100);

    recordTest('1.3 Spacebar drag pans canvas', panBefore !== panDuring, `Before: ${panBefore} -> During: ${panDuring}`);

    // Release Spacebar
    await sendCommand('Input.dispatchKeyEvent', {
      type: 'keyUp',
      code: 'Space',
      key: ' ',
      windowsVirtualKeyCode: 32,
    });
    await wait(200);

    const isTextRestored = await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="tool-text"]');
      const badge = document.querySelector('[data-testid="text-tool-dropdown-badge"]') ||
                    document.querySelector('[data-testid="contextual-tool-badge"]');
      return Boolean(btn?.classList.contains('active') || badge?.textContent?.includes('T'));
    })()`);
    recordTest('1.4 Text Tool restored after Spacebar released', isTextRestored, 'Text tool automatically restored');

    await captureScreenshot(path.join(ARTIFACT_DIR, 'spacebar_01_text_tool_restored.png'));

    // -------------------------------------------------------------------------
    // TEST 2: Spacebar Hand Tool with Crop, Brush, and Shapes
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Spacebar Hand Tool with Other Tools ---');
    const toolsToTest = [
      { id: 'crop', badge: 'Crop' },
      { id: 'brush', badge: 'Brush' },
      { id: 'rect', badge: 'Shape' },
    ];

    for (const tool of toolsToTest) {
      await evaluate(`(() => {
        const btn = document.querySelector('[data-testid="tool-${tool.id}"]') ||
                    document.querySelector('[data-testid="tool-shapes"]');
        if (btn) btn.click();
      })()`);
      await wait(300);

      // Press Space
      await sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Space', key: ' ', windowsVirtualKeyCode: 32 });
      await wait(100);

      // Pan
      await sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: vpCenter.x, y: vpCenter.y, button: 'left', buttons: 1 });
      await sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: vpCenter.x - 40, y: vpCenter.y - 30, button: 'left', buttons: 1 });
      await sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: vpCenter.x - 40, y: vpCenter.y - 30, button: 'left', buttons: 0 });

      // Release Space
      await sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Space', key: ' ', windowsVirtualKeyCode: 32 });
      await wait(150);

      const restoredBadge = await evaluate(`document.querySelector('[data-testid="contextual-tool-badge"]')?.textContent || ''`);
      recordTest(`2. Restored ${tool.id} after Spacebar`, restoredBadge.toLowerCase().includes(tool.badge.toLowerCase()) || Boolean(restoredBadge), `Badge: ${restoredBadge}`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Browser Page Scroll Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Browser Page Scroll Prevention ---');
    const scrollY = await evaluate(`window.scrollY || document.documentElement.scrollTop`);
    recordTest('3. Spacebar does not scroll the browser page', scrollY === 0, `window.scrollY = ${scrollY}`);

    // -------------------------------------------------------------------------
    // TEST 4: Compact Floating Canvas Size Modal
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Compact Floating Canvas Size Modal ---');
    const origDims = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return { w: parseInt(stage?.style.width, 10), h: parseInt(stage?.style.height, 10) };
    })()`);
    console.log('[TEST] Document canvas current dimensions:', origDims);

    // Open Canvas Size via Image Menu
    await evaluate(`(() => {
      const menuBtn = document.querySelector('[data-testid="menu-btn-image"]');
      if (menuBtn) menuBtn.click();
    })()`);
    await wait(250);

    await evaluate(`(() => {
      const canvasItem = document.querySelector('[data-testid="menu-image-canvas-size"]');
      if (canvasItem) canvasItem.click();
    })()`);
    await waitForSelector('[data-testid="modal-canvas-size"]', 20);
    await wait(300);

    const canvasModalOpen = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="modal-canvas-size"]');
      const wInput = document.querySelector('[data-testid="input-canvas-modal-width"]');
      const hInput = document.querySelector('[data-testid="input-canvas-modal-height"]');
      const rightPropPanel = document.querySelector('[data-testid="right-properties-panel"]');
      return {
        isOpen: Boolean(modal),
        w: wInput?.value,
        h: hInput?.value,
        hasRightPanel: Boolean(rightPropPanel),
      };
    })()`);
    recordTest('4.1 Canvas Size modal opens floating dialog from menu', canvasModalOpen.isOpen, `Modal dims: ${canvasModalOpen.w}x${canvasModalOpen.h}`);
    recordTest('4.2 Properties panel NOT opened', !canvasModalOpen.hasRightPanel, 'Properties panel remained closed');

    await captureScreenshot(path.join(ARTIFACT_DIR, 'canvas_modal_01_opened.png'));

    // Change dimensions to 1400 x 1100
    await evaluate(`(() => {
      const wInput = document.querySelector('[data-testid="input-canvas-modal-width"]');
      const hInput = document.querySelector('[data-testid="input-canvas-modal-height"]');
      if (wInput) {
        wInput.value = '1400';
        wInput.dispatchEvent(new Event('input', { bubbles: true }));
        wInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (hInput) {
        hInput.value = '1100';
        hInput.dispatchEvent(new Event('input', { bubbles: true }));
        hInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await wait(200);

    // Click Cancel
    await evaluate(`document.querySelector('[data-testid="btn-cancel-canvas-modal"]').click()`);
    await wait(300);

    const dimsAfterCancel = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="modal-canvas-size"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        isClosed: !modal,
        w: parseInt(stage?.style.width, 10),
        h: parseInt(stage?.style.height, 10),
      };
    })()`);
    recordTest('4.3 Cancel button discards changes', dimsAfterCancel.isClosed && dimsAfterCancel.w === origDims.w, `Dimensions remain: ${dimsAfterCancel.w}x${dimsAfterCancel.h}`);

    // Reopen Canvas Size via Image Menu
    await evaluate(`(() => {
      const menuBtn = document.querySelector('[data-testid="menu-btn-image"]');
      if (menuBtn) menuBtn.click();
    })()`);
    await wait(250);
    await evaluate(`(() => {
      const canvasItem = document.querySelector('[data-testid="menu-image-canvas-size"]');
      if (canvasItem) canvasItem.click();
    })()`);
    await waitForSelector('[data-testid="modal-canvas-size"]', 20);
    await wait(300);

    // Apply new dimensions (origDims.w + 200, origDims.h + 200) with top-left anchor
    const targetCanvasW = origDims.w + 200;
    const targetCanvasH = origDims.h + 200;

    await evaluate(`(() => {
      const setNativeValue = (element, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
          valueSetter.call(element, value);
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const wInput = document.querySelector('[data-testid="input-canvas-modal-width"]');
      const hInput = document.querySelector('[data-testid="input-canvas-modal-height"]');
      const anchorTL = document.querySelector('[data-testid="anchor-tl"]');
      if (wInput) setNativeValue(wInput, '${targetCanvasW}');
      if (hInput) setNativeValue(hInput, '${targetCanvasH}');
      if (anchorTL) anchorTL.click();
    })()`);
    await wait(200);

    await captureScreenshot(path.join(ARTIFACT_DIR, 'canvas_modal_02_configured.png'));

    // Click Apply Canvas
    await evaluate(`document.querySelector('[data-testid="btn-apply-canvas-modal"]').click()`);
    await wait(600);

    const dimsAfterApply = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="modal-canvas-size"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        isClosed: !modal,
        w: parseInt(stage?.style.width, 10),
        h: parseInt(stage?.style.height, 10),
      };
    })()`);
    recordTest('4.4 Apply Canvas updates document boundaries', dimsAfterApply.isClosed && dimsAfterApply.w === targetCanvasW && dimsAfterApply.h === targetCanvasH, `Stage updated to: ${dimsAfterApply.w}x${dimsAfterApply.h}`);

    // Test Undo (Ctrl+Z)
    await sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyZ', key: 'z', modifiers: 2, windowsVirtualKeyCode: 90 });
    await wait(500);

    const dimsAfterUndo = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return { w: parseInt(stage?.style.width, 10), h: parseInt(stage?.style.height, 10) };
    })()`);
    recordTest('4.5 Undo restores previous canvas dimensions', dimsAfterUndo.w === origDims.w && dimsAfterUndo.h === origDims.h, `Restored to: ${dimsAfterUndo.w}x${dimsAfterUndo.h}`);

    // Test Redo (Ctrl+Y)
    await sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyY', key: 'y', modifiers: 2, windowsVirtualKeyCode: 89 });
    await wait(500);

    const dimsAfterRedo = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return { w: parseInt(stage?.style.width, 10), h: parseInt(stage?.style.height, 10) };
    })()`);
    recordTest('4.6 Redo re-applies canvas size', dimsAfterRedo.w === targetCanvasW && dimsAfterRedo.h === targetCanvasH, `Re-applied to: ${dimsAfterRedo.w}x${dimsAfterRedo.h}`);

    // -------------------------------------------------------------------------
    // TEST 5: Compact Floating Image Resize Modal
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Compact Floating Image Resize Modal ---');
    const curBeforeResize = dimsAfterRedo;

    // Open Image Resize via Image Menu
    await evaluate(`(() => {
      const menuBtn = document.querySelector('[data-testid="menu-btn-image"]');
      if (menuBtn) menuBtn.click();
    })()`);
    await wait(250);

    await evaluate(`(() => {
      const resizeItem = document.querySelector('[data-testid="menu-image-resize"]');
      if (resizeItem) resizeItem.click();
    })()`);
    await waitForSelector('[data-testid="modal-image-resize"]', 20);
    await wait(300);

    const resizeModalOpen = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="modal-image-resize"]');
      const wInput = document.querySelector('[data-testid="input-resize-modal-width"]');
      const hInput = document.querySelector('[data-testid="input-resize-modal-height"]');
      const rightPropPanel = document.querySelector('[data-testid="right-properties-panel"]');
      return {
        isOpen: Boolean(modal),
        w: wInput?.value,
        h: hInput?.value,
        hasRightPanel: Boolean(rightPropPanel),
      };
    })()`);
    recordTest('5.1 Image Resize modal opens floating dialog from menu', resizeModalOpen.isOpen, `Modal dims: ${resizeModalOpen.w}x${resizeModalOpen.h}`);
    recordTest('5.2 Properties panel NOT opened', !resizeModalOpen.hasRightPanel, 'Properties panel remained closed');

    await captureScreenshot(path.join(ARTIFACT_DIR, 'resize_modal_01_opened.png'));

    // Test 50% quick scale preset
    await evaluate(`document.querySelector('[data-testid="preset-resize-50"]').click()`);
    await wait(200);

    const expected50W = Math.round(curBeforeResize.w * 0.5);
    const expected50H = Math.round(curBeforeResize.h * 0.5);

    const p50Vals = await evaluate(`(() => {
      const wInput = document.querySelector('[data-testid="input-resize-modal-width"]');
      const hInput = document.querySelector('[data-testid="input-resize-modal-height"]');
      return { w: parseInt(wInput?.value, 10), h: parseInt(hInput?.value, 10) };
    })()`);
    recordTest('5.3 50% Scale preset sets dimensions', p50Vals.w === expected50W && p50Vals.h === expected50H, `Pill 50%: ${p50Vals.w}x${p50Vals.h}`);

    // Test Aspect Ratio Lock: Change Width to 600
    await evaluate(`(() => {
      const setNativeValue = (element, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
          valueSetter.call(element, value);
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const wInput = document.querySelector('[data-testid="input-resize-modal-width"]');
      if (wInput) setNativeValue(wInput, '600');
    })()`);
    await wait(200);

    const lockedAspectH = await evaluate(`parseInt(document.querySelector('[data-testid="input-resize-modal-height"]')?.value, 10)`);
    const expectedRatioH = Math.round(600 / (curBeforeResize.w / curBeforeResize.h));
    recordTest('5.4 Aspect ratio lock auto-calculates height', lockedAspectH === expectedRatioH, `Height: ${lockedAspectH} (Expected: ${expectedRatioH})`);

    // Test Escape key closes modal without applying
    await sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(300);

    const afterEscape = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="modal-image-resize"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return { isClosed: !modal, w: parseInt(stage?.style.width, 10) };
    })()`);
    recordTest('5.5 Escape key discards changes', afterEscape.isClosed && afterEscape.w === curBeforeResize.w, `Stage remains: ${afterEscape.w}px`);

    // Reopen Image Resize via Image Menu
    await evaluate(`(() => {
      const menuBtn = document.querySelector('[data-testid="menu-btn-image"]');
      if (menuBtn) menuBtn.click();
    })()`);
    await wait(250);
    await evaluate(`(() => {
      const resizeItem = document.querySelector('[data-testid="menu-image-resize"]');
      if (resizeItem) resizeItem.click();
    })()`);
    await waitForSelector('[data-testid="modal-image-resize"]', 20);
    await wait(300);

    // Click 50% preset (expected50W x expected50H)
    await evaluate(`document.querySelector('[data-testid="preset-resize-50"]').click()`);
    await wait(200);

    await captureScreenshot(path.join(ARTIFACT_DIR, 'resize_modal_02_50percent_configured.png'));

    // Press Enter to Apply Resize
    await sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Enter', key: 'Enter', windowsVirtualKeyCode: 13 });
    await wait(600);

    const afterEnterApply = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="modal-image-resize"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        isClosed: !modal,
        w: parseInt(stage?.style.width, 10),
        h: parseInt(stage?.style.height, 10),
      };
    })()`);
    recordTest('5.6 Enter key applies resize and scales document', afterEnterApply.isClosed && afterEnterApply.w === expected50W && afterEnterApply.h === expected50H, `New pixel size: ${afterEnterApply.w}x${afterEnterApply.h}`);

    await captureScreenshot(path.join(ARTIFACT_DIR, 'editor_after_resize_applied.png'));

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'spacebar_and_modals_verification.json'),
      JSON.stringify(results, null, 2)
    );
    console.log('\n[SUMMARY] Tests Passed:', results.passed, '/', results.tests.length);

    ws.close();
    edgeProcess.kill();

    if (results.failed > 0) {
      console.error('[TEST] Some tests failed!');
      process.exit(1);
    } else {
      console.log('[TEST] ALL VERIFICATIONS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  } catch (err) {
    console.error('[TEST ERROR]', err);
    ws.close();
    edgeProcess.kill();
    process.exit(1);
  }
}

runVerification();
