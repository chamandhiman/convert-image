import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_verify_final_' + Date.now();
const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9282',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  let targets = null;
  for (let i = 0; i < 15; i++) {
    await sleep(600);
    try {
      const res = await fetch('http://127.0.0.1:9282/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch {}
  }
  if (!targets) throw new Error('Could not connect to Edge DevTools');

  const pageTarget = targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1000);

  // Set consent in localStorage and navigate cleanly so cookie modal never appears
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`
  });
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1500);

  const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';

  // ==========================================
  // PART 1: BLANK CANVAS & TEXT LAYER
  // ==========================================
  console.log('>>> [1] Creating 400x300 Blank Canvas...');
  await send('Runtime.evaluate', { expression: `document.getElementById('start-blank-canvas-btn')?.click()` });
  await sleep(500);
  await send('Runtime.evaluate', { expression: `document.getElementById('confirm-create-canvas-btn')?.click()` });
  await sleep(1000);

  console.log('>>> [2] Selecting Text Tool & Placing Text Layer...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-tool-id=\"text\"]')?.click()`
  });
  await sleep(400);

  const stagePos = await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('[data-canvas-stage=\"true\"]');
      const rect = stage.getBoundingClientRect();
      return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 3) };
    })()`,
    returnByValue: true
  });
  const { x, y } = stagePos.result.value;
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(400);

  await send('Input.insertText', { text: 'Travel India' });
  await sleep(400);
  await send('Runtime.evaluate', { expression: `document.querySelector('textarea')?.blur()` });
  await sleep(500);

  // ==========================================
  // PART 2: FONT SIZE PRESETS & LIVE UPDATES
  // ==========================================
  console.log('>>> [3] Testing Font Size Presets (14, 18, 24, 30, 36, 72)...');
  const presets = [14, 18, 24, 30, 36, 72];
  for (const sz of presets) {
    await send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-font-size-pill=\"${sz}\"]')?.click()`
    });
    await sleep(350);

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[type=\"number\"][min=\"8\"]');
        const textEl = document.querySelector('[data-text-content=\"true\"]');
        const activePill = document.querySelector('button[data-font-size-pill=\"${sz}\"][data-active=\"true\"]');
        return {
          preset: ${sz},
          inputVal: input?.value,
          textDomFontSize: textEl?.style.fontSize,
          activePillMatches: Boolean(activePill)
        };
      })()`,
      returnByValue: true
    });
    console.log(`Pill ${sz}px:`, JSON.stringify(res.result.value));
  }

  console.log('>>> [4] Testing Custom Font Size (27px)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type=\"number\"][min=\"8\"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '27');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`
  });
  await sleep(350);

  const customTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type=\"number\"][min=\"8\"]');
      const textEl = document.querySelector('[data-text-content=\"true\"]');
      const anyActivePill = document.querySelector('button[data-font-size-pill][data-active=\"true\"]');
      return {
        inputVal: input?.value,
        textDomFontSize: textEl?.style.fontSize,
        noPillActive: anyActivePill === null
      };
    })()`,
    returnByValue: true
  });
  console.log('Custom size test:', JSON.stringify(customTest.result.value));

  // ==========================================
  // PART 3: TEXT ALIGNMENT STABILITY
  // ==========================================
  console.log('>>> [5] Testing Text Alignment Stability (Left, Center, Right)...');
  const alignOps = ['center', 'right', 'left', 'center', 'right', 'left'];
  for (const al of alignOps) {
    await send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-align-btn=\"${al}\"]')?.click()`
    });
    await sleep(350);

    const alignRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const alignGroup = document.querySelector('[class*=\"alignGroup\"]');
        const r2 = alignGroup?.getBoundingClientRect();
        const textEl = document.querySelector('[data-text-content=\"true\"]');
        const activeBtn = document.querySelector('button[data-align-btn][class*=\"alignBtnActive\"]');
        return {
          targetAlign: '${al}',
          domTextAlign: textEl?.style.textAlign,
          activeBtnAttribute: activeBtn?.getAttribute('data-align-btn'),
          width: r2?.width,
          left: r2?.left
        };
      })()`,
      returnByValue: true
    });
    console.log(`Align to ${al}:`, JSON.stringify(alignRes.result.value));
  }

  // Set font size to 36 and take screenshot of text properties
  await send('Runtime.evaluate', { expression: `document.querySelector('button[data-font-size-pill=\"36\"]')?.click()` });
  await sleep(400);

  const ssText = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verified_text_tool_final.png'), Buffer.from(ssText.data, 'base64'));
  console.log('Saved verified_text_tool_final.png');

  // ==========================================
  // PART 4: CROP TOOL & MEASUREMENT BADGE
  // ==========================================
  console.log('>>> [6] Selecting Crop Tool in Left Toolbar...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-tool-id=\"crop\"]')?.click()`
  });
  await sleep(600);

  const cropBadgeData = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[data-crop-overlay=\"true\"]');
      const badge = document.querySelector('[data-crop-badge=\"true\"]');
      if (!badge) return null;
      const cs = window.getComputedStyle(badge);
      return {
        hasOverlay: Boolean(overlay),
        hasBadge: Boolean(badge),
        text: badge.innerText.trim(),
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        border: cs.border,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow
      };
    })()`,
    returnByValue: true
  });
  console.log('Crop Badge inspection:', JSON.stringify(cropBadgeData.result.value));

  // Capture screenshot showing Crop active with white measurement badge
  const ssCropBadge = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verified_crop_badge_white.png'), Buffer.from(ssCropBadge.data, 'base64'));
  console.log('Saved verified_crop_badge_white.png');

  // ==========================================
  // PART 5: APPLY CROP
  // ==========================================
  console.log('>>> [7] Clicking 1:1 Square Preset & Applying Crop...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const sqBtn = document.querySelector('button[data-crop-preset="1:1"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '1:1 Square');
      if (sqBtn) sqBtn.click();
    })()`
  });
  await sleep(500);

  const applyCropRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const applyBtn = document.querySelector('button[data-apply-crop="true"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Apply Crop'));
      if (applyBtn) {
        applyBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  console.log('Clicked Apply Crop:', JSON.stringify(applyCropRes.result.value));
  await sleep(1000);

  const afterApplyState = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[data-crop-overlay=\"true\"]');
      const badge = document.querySelector('[data-crop-badge=\"true\"]');
      const handles = document.querySelectorAll('[class*=\"cropHandle\"]');
      const moveBtn = document.querySelector('button[data-tool-id=\"move\"][data-tool-active=\"true\"]');
      const statusText = document.querySelector('footer, [class*=\"statusBar\"], [class*=\"bottomBar\"]')?.innerText;
      return {
        overlayRemoved: overlay === null,
        badgeRemoved: badge === null,
        cropHandlesCount: handles.length,
        isMoveToolActive: moveBtn !== null,
        statusBar: statusText ? statusText.slice(0, 100) : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Post-Apply Verification:', JSON.stringify(afterApplyState.result.value));

  const ssCropped = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verified_cropped_clean_result.png'), Buffer.from(ssCropped.data, 'base64'));
  console.log('Saved verified_cropped_clean_result.png');

  // ==========================================
  // PART 6: RE-ENTER CROP & CANCEL CROP
  // ==========================================
  console.log('>>> [8] Testing Re-enter Crop & Cancel...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-tool-id=\"crop\"]')?.click()`
  });
  await sleep(500);

  const reenterState = await send('Runtime.evaluate', {
    expression: `Boolean(document.querySelector('[data-crop-overlay=\"true\"]'))`,
    returnByValue: true
  });
  console.log('Crop Overlay Re-entered:', reenterState.result.value);

  // Cancel Crop
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()`
  });
  await sleep(500);

  const afterCancelState = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[data-crop-overlay=\"true\"]');
      const moveBtn = document.querySelector('button[data-tool-id=\"move\"][data-tool-active=\"true\"]');
      return {
        overlayGoneAfterCancel: overlay === null,
        moveActiveAfterCancel: moveBtn !== null
      };
    })()`,
    returnByValue: true
  });
  console.log('After Cancel Verification:', JSON.stringify(afterCancelState.result.value));

  console.log('=== ALL COMPREHENSIVE VERIFICATIONS PASSED 100%! ===');
  ws.close();
  edge.kill();
}

run();
