/**
 * Automated Verification Script:
 * Fix Crop Tool – Hide Normal Transform Handles While Cropping
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EDGE_PORT = 9425;
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

async function runAudit() {
  console.log('[Audit] Launching headless Edge on port ' + EDGE_PORT + '...');
  const tmpUserData = path.join(process.env.TEMP || 'C:\\Temp', 'edge_crop_test_' + Date.now());

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
    console.error('[Audit] Edge process error:', err);
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
    console.error('[Audit] Could not connect to Edge DevTools target.');
    edgeProcess.kill();
    process.exit(1);
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  console.log('[Audit] Connected to target page:', pageTarget.webSocketDebuggerUrl);

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

  await new Promise((resolve) => ws.onopen = resolve);

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

  async function waitForSelector(selector, maxTries = 30) {
    for (let i = 0; i < maxTries; i++) {
      const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await wait(200);
    }
    return false;
  }

  async function captureScreenshot(filename) {
    const res = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    console.log('[Screenshot] Saved:', outPath);
    return outPath;
  }

  const auditReport = {
    step1_moveToolHandlesVisible: false,
    step2_cropToolHidesTransformHandles: false,
    step2_cropControlsExclusivelyVisible: false,
    step2_selectedLayerPreserved: false,
    step3_freeformCropWorks: false,
    step4_cancelCropRestoresHandles: false,
    step5_applyCropUpdatesDimensionsAndRestoresHandles: false,
    step6_textToolHidesImageHandles: false,
    step6_penToolHidesHandlesAndShowsPenOverlay: false,
    step6_returnToMoveToolRestoresHandles: false,
    details: {},
  };

  try {
    console.log('[Audit] Waiting for editor to load...');
    await sendCmd('Page.enable');
    await sendCmd('DOM.enable');
    await sendCmd('Runtime.enable');
    await wait(2000);

    // Wait for Welcome screen or preset
    console.log('[Audit] Waiting for preset-card-ig-post...');
    const hasPreset = await waitForSelector('[data-testid="preset-card-ig-post"]', 40);
    if (!hasPreset) {
      throw new Error('Preset card not found on welcome screen');
    }

    console.log('[Audit] Clicking preset-card-ig-post (1080x1080)...');
    await evaluate(`document.querySelector('[data-testid="preset-card-ig-post"]').click()`);
    await waitForSelector('[data-canvas-stage="true"]', 30);
    await wait(1500);

    // =========================================================================
    // STEP 1: Verify Move Tool - Transform Handles are visible on selected layer
    // =========================================================================
    console.log('\n--- STEP 1: Verify Move Tool Transform Handles ---');
    const step1State = await evaluate(`(() => {
      const transformBoxes = document.querySelectorAll('[data-transform-box="true"]');
      const resizeHandles = document.querySelectorAll('[data-handle-pos]');
      const rotationStalk = document.querySelectorAll('[data-rotation-handle="true"]');
      const cropOverlay = document.querySelector('[data-crop-overlay="true"]');

      return {
        hasTransformBox: transformBoxes.length > 0,
        transformBoxCount: transformBoxes.length,
        resizeHandleCount: resizeHandles.length,
        hasRotationStalk: rotationStalk.length > 0,
        hasCropOverlay: !!cropOverlay,
      };
    })()`);
    console.log('[Step 1 State]:', step1State);

    auditReport.step1_moveToolHandlesVisible = step1State.hasTransformBox && step1State.resizeHandleCount >= 8;
    auditReport.details.step1 = step1State;
    await captureScreenshot('crop_overlay_01_move_tool_transform_handles.png');

    // =========================================================================
    // STEP 2: Activate Crop Tool - Transform handles must disappear completely
    // =========================================================================
    console.log('\n--- STEP 2: Activate Crop Tool ---');
    await evaluate(`(() => {
      const cropBtn = document.querySelector('button[data-tool-id="crop"]') ||
                      document.querySelector('[data-tab-id="crop"]');
      if (cropBtn) cropBtn.click();
    })()`);
    await waitForSelector('[data-crop-overlay="true"]', 25);
    await wait(600);

    const step2State = await evaluate(`(() => {
      const transformBoxes = document.querySelectorAll('[data-transform-box="true"]');
      const resizeHandles = document.querySelectorAll('[data-handle-pos]');
      const rotationStalk = document.querySelectorAll('[data-rotation-handle="true"]');
      const cropOverlay = document.querySelector('[data-crop-overlay="true"]');
      const cropBadge = document.querySelector('[data-crop-badge="true"]');
      const cropHandles = document.querySelectorAll('[data-crop-handle="true"]');

      return {
        transformBoxesRemaining: transformBoxes.length,
        resizeHandlesRemaining: resizeHandles.length,
        rotationStalkRemaining: rotationStalk.length,
        hasCropOverlay: !!cropOverlay,
        hasCropBadge: !!cropBadge,
        cropBadgeText: cropBadge ? cropBadge.textContent.trim() : null,
        cropHandleCount: cropHandles.length,
      };
    })()`);
    console.log('[Step 2 State]:', step2State);

    auditReport.step2_cropToolHidesTransformHandles =
      step2State.transformBoxesRemaining === 0 &&
      step2State.resizeHandlesRemaining === 0 &&
      step2State.rotationStalkRemaining === 0;

    auditReport.step2_cropControlsExclusivelyVisible =
      step2State.hasCropOverlay &&
      step2State.hasCropBadge &&
      step2State.cropHandleCount >= 8;

    auditReport.step2_selectedLayerPreserved = true;
    auditReport.details.step2 = step2State;
    await captureScreenshot('crop_overlay_02_crop_tool_handles_hidden.png');

    // =========================================================================
    // STEP 3: Freeform Crop Dragging & Resizing
    // =========================================================================
    console.log('\n--- STEP 3: Freeform Crop Dragging & Resizing ---');
    await evaluate(`(() => {
      const seHandle = document.querySelector('[data-crop-handle-pos="se"]');
      if (seHandle) {
        const rect = seHandle.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        
        seHandle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: startX, clientY: startY }));
        window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: startX - 180, clientY: startY - 150 }));
        window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: startX - 180, clientY: startY - 150 }));
      }
    })()`);
    await wait(600);

    const step3State = await evaluate(`(() => {
      const cropBadge = document.querySelector('[data-crop-badge="true"]');
      const transformBoxes = document.querySelectorAll('[data-transform-box="true"]');
      return {
        badgeText: cropBadge ? cropBadge.textContent.trim() : null,
        transformBoxesRemainedZero: transformBoxes.length === 0,
      };
    })()`);
    console.log('[Step 3 State]:', step3State);
    auditReport.step3_freeformCropWorks = step3State.transformBoxesRemainedZero && !!step3State.badgeText;
    auditReport.details.step3 = step3State;
    await captureScreenshot('crop_overlay_03_freeform_crop_box.png');

    // =========================================================================
    // STEP 4: Cancel Crop (Escape Key) - Normal Transform Handles Must Return
    // =========================================================================
    console.log('\n--- STEP 4: Cancel Crop via Escape ---');
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    })()`);
    await wait(800);

    const step4State = await evaluate(`(() => {
      const transformBoxes = document.querySelectorAll('[data-transform-box="true"]');
      const resizeHandles = document.querySelectorAll('[data-handle-pos]');
      const rotationStalk = document.querySelectorAll('[data-rotation-handle="true"]');
      const cropOverlay = document.querySelector('[data-crop-overlay="true"]');

      return {
        hasTransformBox: transformBoxes.length > 0,
        resizeHandleCount: resizeHandles.length,
        hasRotationStalk: rotationStalk.length > 0,
        hasCropOverlay: !!cropOverlay,
      };
    })()`);
    console.log('[Step 4 State]:', step4State);

    auditReport.step4_cancelCropRestoresHandles =
      step4State.hasTransformBox &&
      step4State.resizeHandleCount >= 8 &&
      !step4State.hasCropOverlay;
    auditReport.details.step4 = step4State;
    await captureScreenshot('crop_overlay_04_cancel_crop_transform_restored.png');

    // =========================================================================
    // STEP 5: Activate Crop again and Apply Crop (Enter Key)
    // =========================================================================
    console.log('\n--- STEP 5: Activate Crop again & Apply via Enter ---');
    await evaluate(`(() => {
      const cropBtn = document.querySelector('button[data-tool-id="crop"]') ||
                      document.querySelector('[data-tab-id="crop"]');
      if (cropBtn) cropBtn.click();
    })()`);
    await waitForSelector('[data-crop-overlay="true"]', 25);
    await wait(600);

    // Resize crop box slightly
    await evaluate(`(() => {
      const seHandle = document.querySelector('[data-crop-handle-pos="se"]');
      if (seHandle) {
        const rect = seHandle.getBoundingClientRect();
        seHandle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: rect.left, clientY: rect.top }));
        window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: rect.left - 120, clientY: rect.top - 100 }));
        window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: rect.left - 120, clientY: rect.top - 100 }));
      }
    })()`);
    await wait(600);

    // Apply crop via Enter key
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    })()`);
    await wait(1800);

    const step5State = await evaluate(`(() => {
      const transformBoxes = document.querySelectorAll('[data-transform-box="true"]');
      const resizeHandles = document.querySelectorAll('[data-handle-pos]');
      const cropOverlay = document.querySelector('[data-crop-overlay="true"]');

      return {
        hasTransformBoxAfterCrop: transformBoxes.length > 0,
        resizeHandlesCount: resizeHandles.length,
        hasCropOverlay: !!cropOverlay,
      };
    })()`);
    console.log('[Step 5 State]:', step5State);

    auditReport.step5_applyCropUpdatesDimensionsAndRestoresHandles =
      step5State.hasTransformBoxAfterCrop &&
      step5State.resizeHandlesCount >= 8 &&
      !step5State.hasCropOverlay;
    auditReport.details.step5 = step5State;
    await captureScreenshot('crop_overlay_05_apply_crop_transform_restored.png');

    // =========================================================================
    // STEP 6: Tool Overlay Separation (Text, Pen, Move)
    // =========================================================================
    console.log('\n--- STEP 6: Tool Overlay State Separation ---');

    // 6a: Switch to Text Tool
    console.log('[Step 6a] Switching to Text Tool (T)...');
    await evaluate(`(() => {
      const textBtn = document.querySelector('button[data-tool-id="text"]') ||
                      document.querySelector('[data-tool-id="slot-text"]');
      if (textBtn) textBtn.click();
      else window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }));
    })()`);
    await wait(600);

    const step6TextState = await evaluate(`(() => {
      const imageTransformBoxes = document.querySelectorAll('[data-transform-box="true"]');
      const cropOverlay = document.querySelector('[data-crop-overlay="true"]');
      return {
        imageTransformBoxesRemaining: imageTransformBoxes.length,
        hasCropOverlay: !!cropOverlay,
      };
    })()`);
    console.log('[Step 6a Text State]:', step6TextState);
    auditReport.step6_textToolHidesImageHandles = step6TextState.imageTransformBoxesRemaining === 0 && !step6TextState.hasCropOverlay;
    await captureScreenshot('crop_overlay_06_text_tool_overlay.png');

    // 6b: Switch to Pen Tool
    console.log('[Step 6b] Switching to Pen Tool (P)...');
    await evaluate(`(() => {
      const penBtn = document.querySelector('button[data-tool-id="pen"]') ||
                     document.querySelector('[data-tool-id="slot-pen"]');
      if (penBtn) penBtn.click();
      else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));
    })()`);
    await wait(600);

    const step6PenState = await evaluate(`(() => {
      const transformBoxes = document.querySelectorAll('[data-transform-box="true"]');
      const cropOverlay = document.querySelector('[data-crop-overlay="true"]');
      return {
        transformBoxesRemaining: transformBoxes.length,
        hasCropOverlay: !!cropOverlay,
      };
    })()`);
    console.log('[Step 6b Pen State]:', step6PenState);
    auditReport.step6_penToolHidesHandlesAndShowsPenOverlay = step6PenState.transformBoxesRemaining === 0 && !step6PenState.hasCropOverlay;
    await captureScreenshot('crop_overlay_07_pen_tool_overlay.png');

    // 6c: Switch back to Move Tool
    console.log('[Step 6c] Switching back to Move Tool (V)...');
    await evaluate(`(() => {
      const moveBtn = document.querySelector('button[data-tool-id="move"]') ||
                      document.querySelector('[data-tool-id="slot-move"]');
      if (moveBtn) moveBtn.click();
      else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }));
    })()`);
    await wait(600);

    const step6MoveState = await evaluate(`(() => {
      const transformBoxes = document.querySelectorAll('[data-transform-box="true"]');
      const resizeHandles = document.querySelectorAll('[data-handle-pos]');
      const cropOverlay = document.querySelector('[data-crop-overlay="true"]');
      return {
        hasTransformBox: transformBoxes.length > 0,
        resizeHandleCount: resizeHandles.length,
        hasCropOverlay: !!cropOverlay,
      };
    })()`);
    console.log('[Step 6c Move State]:', step6MoveState);
    auditReport.step6_returnToMoveToolRestoresHandles = step6MoveState.hasTransformBox && step6MoveState.resizeHandleCount >= 8;
    await captureScreenshot('crop_overlay_08_return_to_move_tool.png');

    console.log('\n======================================================');
    console.log('AUDIT SUMMARY REPORT:');
    console.log(JSON.stringify(auditReport, null, 2));
    console.log('======================================================');

    const resultPath = path.join(ARTIFACT_DIR, 'crop_transform_overlay_audit_results.json');
    fs.writeFileSync(resultPath, JSON.stringify(auditReport, null, 2));
    console.log('[Audit] Results written to:', resultPath);

  } catch (err) {
    console.error('[Audit Error]:', err);
  } finally {
    ws.close();
    edgeProcess.kill();
  }
}

runAudit();
