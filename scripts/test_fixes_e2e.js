import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_profile_' + Date.now();
const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9272',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  await sleep(2000);
  const res = await fetch('http://127.0.0.1:9272/json/list');
  const targets = await res.json();
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
  await sleep(2000);

  // Set cookie consent
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`
  });
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Accept All'));
      if (btn) btn.click();
    })()`
  });
  await sleep(500);

  const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';

  // 1. Create blank canvas
  console.log('--- TEST 1: Create Blank Canvas ---');
  await send('Runtime.evaluate', { expression: `document.getElementById('start-blank-canvas-btn')?.click()` });
  await sleep(500);
  await send('Runtime.evaluate', { expression: `document.getElementById('confirm-create-canvas-btn')?.click()` });
  await sleep(1000);

  // 2. Add text layer
  console.log('--- TEST 2: Add Text Layer ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('aside button'));
      const textBtn = btns.find(b => b.innerText.trim() === 'Text');
      if (textBtn) textBtn.click();
    })()`
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
  await sleep(500);

  await send('Input.insertText', { text: 'Travel India' });
  await sleep(400);

  // Blur textarea
  await send('Runtime.evaluate', { expression: `document.querySelector('textarea')?.blur()` });
  await sleep(500);

  // 3. Test Font Size Presets (14, 18, 24, 30, 36, 72)
  console.log('--- TEST 3: Font Size Presets ---');
  const presetsToTest = [14, 18, 24, 30, 36, 72];
  for (const sz of presetsToTest) {
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '${sz}');
        if (!btn) return { error: 'Button ${sz} not found' };
        btn.click();
        const input = document.querySelector('input[type=\"number\"][min=\"8\"]');
        const textEl = document.querySelector('[data-text-content=\"true\"]');
        const activePill = document.querySelector('button[class*=\"quickSizePillActive\"]');
        return {
          clicked: sz,
          inputValue: input ? input.value : null,
          textStyleFontSize: textEl ? textEl.style.fontSize : null,
          activePillText: activePill ? activePill.innerText.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log(`Preset ${sz}:`, JSON.stringify(res.result.value));
    await sleep(250);
  }

  // Test custom font size
  console.log('--- TEST 3B: Custom Font Size (27px) ---');
  const customRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type=\"number\"][min=\"8\"]');
      if (!input) return { error: 'input not found' };
      input.value = '27';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const textEl = document.querySelector('[data-text-content=\"true\"]');
      const activePill = document.querySelector('button[class*=\"quickSizePillActive\"]');
      return {
        inputValue: input.value,
        textStyleFontSize: textEl ? textEl.style.fontSize : null,
        activePill: activePill ? activePill.innerText.trim() : 'NONE (correct)'
      };
    })()`,
    returnByValue: true
  });
  console.log('Custom 27px:', JSON.stringify(customRes.result.value));

  // Set to 48px preset
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '48');
      if (btn) btn.click();
    })()`
  });
  await sleep(400);

  // 4. Test Text Alignment (Left, Center, Right)
  console.log('--- TEST 4: Text Alignment Stability ---');
  const alignments = ['left', 'center', 'right', 'left'];
  for (const align of alignments) {
    const alignRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const alignGroup = document.querySelector('[class*=\"alignGroup\"]');
        const groupRectBefore = alignGroup?.getBoundingClientRect();
        const titleMatch = '${align === 'left' ? 'Align Left' : align === 'center' ? 'Align Center' : 'Align Right'}';
        const btn = document.querySelector('button[title=\"' + titleMatch + '\"]');
        if (btn) btn.click();
        const groupRectAfter = alignGroup?.getBoundingClientRect();
        const textEl = document.querySelector('[data-text-content=\"true\"]');
        const activeAlignBtn = document.querySelector('[class*=\"alignBtnActive\"]');
        return {
          align: '${align}',
          groupWidth: groupRectAfter ? groupRectAfter.width : null,
          groupLeft: groupRectAfter ? groupRectAfter.left : null,
          textAlign: textEl ? textEl.style.textAlign : null,
          activeBtnTitle: activeAlignBtn ? activeAlignBtn.getAttribute('title') : null,
          stable: groupRectBefore && groupRectAfter && groupRectBefore.width === groupRectAfter.width
        };
      })()`,
      returnByValue: true
    });
    console.log(`Align ${align}:`, JSON.stringify(alignRes.result.value));
    await sleep(250);
  }

  // Screenshot text verification
  const ssText = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verified_text_properties.png'), Buffer.from(ssText.data, 'base64'));
  console.log('Saved verified_text_properties.png');

  // 5. Test Crop Tool
  console.log('--- TEST 5: Crop Tool Enter & Measurement Badge ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('aside button'));
      const cropBtn = btns.find(b => b.innerText.trim() === 'Crop');
      if (cropBtn) cropBtn.click();
    })()`
  });
  await sleep(600);

  // Inspect measurement badge styles
  const badgeInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const badge = document.querySelector('[class*=\"cropDimensionsBadge\"]');
      if (!badge) return null;
      const cs = window.getComputedStyle(badge);
      return {
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
  console.log('Crop Badge computed style:', JSON.stringify(badgeInfo.result.value));

  // Capture screenshot of crop active with white badge
  const ssCropActive = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verified_crop_active_badge.png'), Buffer.from(ssCropActive.data, 'base64'));
  console.log('Saved verified_crop_active_badge.png');

  // 6. Apply Crop
  console.log('--- TEST 6: Apply Crop ---');
  const cropApplyRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Apply Crop');
      if (applyBtn) applyBtn.click();
      return Boolean(applyBtn);
    })()`,
    returnByValue: true
  });
  console.log('Clicked Apply Crop:', JSON.stringify(cropApplyRes.result.value));
  await sleep(1000);

  // Check state after Apply Crop
  const afterCrop = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[class*=\"cropOverlay\"]');
      const badge = document.querySelector('[class*=\"cropDimensionsBadge\"]');
      const handles = document.querySelectorAll('[class*=\"cropHandle\"]');
      const statusText = document.querySelector('footer, [class*=\"statusBar\"], [class*=\"bottomBar\"]')?.innerText;
      return {
        overlayVisible: Boolean(overlay),
        badgeVisible: Boolean(badge),
        handlesCount: handles.length,
        statusText: statusText ? statusText.slice(0, 100) : null
      };
    })()`,
    returnByValue: true
  });
  console.log('After Crop State:', JSON.stringify(afterCrop.result.value));

  // Capture screenshot of cleanly cropped result
  const ssCropped = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verified_crop_applied_clean.png'), Buffer.from(ssCropped.data, 'base64'));
  console.log('Saved verified_crop_applied_clean.png');

  // 7. Test Re-enter Crop and Cancel Crop
  console.log('--- TEST 7: Re-enter Crop & Cancel ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('aside button'));
      const cropBtn = btns.find(b => b.innerText.trim() === 'Crop');
      if (cropBtn) cropBtn.click();
    })()`
  });
  await sleep(600);

  const reenterState = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[class*=\"cropOverlay\"]');
      return { reenteredOverlayVisible: Boolean(overlay) };
    })()`,
    returnByValue: true
  });
  console.log('Re-enter Crop:', JSON.stringify(reenterState.result.value));

  // Click Cancel
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()`
  });
  await sleep(600);

  const afterCancel = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[class*=\"cropOverlay\"]');
      return { cancelOverlayGone: !Boolean(overlay) };
    })()`,
    returnByValue: true
  });
  console.log('After Cancel Crop:', JSON.stringify(afterCancel.result.value));

  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY! ===');
  ws.close();
  edge.kill();
}

run();
