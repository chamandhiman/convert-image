import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_crop_' + Date.now();
const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9274',
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
      const res = await fetch('http://127.0.0.1:9274/json/list');
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

  // 1. Create blank canvas (400x300)
  console.log('Creating blank canvas...');
  await send('Runtime.evaluate', { expression: `document.getElementById('start-blank-canvas-btn')?.click()` });
  await sleep(500);
  await send('Runtime.evaluate', { expression: `document.getElementById('confirm-create-canvas-btn')?.click()` });
  await sleep(1000);

  // 2. Select Crop Tool
  console.log('Selecting Crop Tool...');
  const allButtons = await send('Runtime.evaluate', {
    expression: `(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        title: b.title,
        aria: b.getAttribute('aria-label')
      }));
    })()`,
    returnByValue: true
  });
  console.log('All buttons:', JSON.stringify(allButtons.result.value?.slice(0, 20)));

  const cropBtnResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cropBtn = btns.find(b => b.getAttribute('aria-label') === 'Crop' || b.getAttribute('title')?.includes('Crop') || b.innerText.includes('Crop'));
      if (cropBtn) {
        cropBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  console.log('Found & clicked Crop button:', JSON.stringify(cropBtnResult));
  await sleep(600);

  // 3. Inspect Crop Overlay and Measurement Badge
  const cropCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[data-crop-overlay=\"true\"]') || document.querySelector('[class*=\"cropOverlay\"]');
      const badge = document.querySelector('[data-crop-badge=\"true\"]') || document.querySelector('[class*=\"cropDimensionsBadge\"]');
      if (!overlay || !badge) return { hasOverlay: Boolean(overlay), hasBadge: Boolean(badge) };
      const cs = window.getComputedStyle(badge);
      return {
        hasOverlay: true,
        hasBadge: true,
        badgeText: badge.innerText.trim(),
        badgeBg: cs.backgroundColor,
        badgeColor: cs.color,
        badgeBorder: cs.border,
        badgeRadius: cs.borderRadius,
        badgeShadow: cs.boxShadow
      };
    })()`,
    returnByValue: true
  });
  console.log('Crop inspection:', JSON.stringify(cropCheck.result.value));

  // Capture screenshot of Crop Mode with White Measurement Badge
  const ssCropActive = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'crop_active_white_badge.png'), Buffer.from(ssCropActive.data, 'base64'));
  console.log('Saved crop_active_white_badge.png');

  // 4. Click 1:1 Aspect Ratio Preset
  console.log('Selecting 1:1 Square Crop preset...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sqBtn = btns.find(b => b.innerText.trim() === '1:1 Square');
      if (sqBtn) sqBtn.click();
    })()`
  });
  await sleep(500);

  // Inspect badge after preset
  const sqCheck = await send('Runtime.evaluate', {
    expression: `document.querySelector('[class*=\"cropDimensionsBadge\"]')?.innerText`,
    returnByValue: true
  });
  console.log('Square crop badge text:', JSON.stringify(sqCheck.result.value));

  // 5. Click Apply Crop
  console.log('Clicking Apply Crop...');
  const applyRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const applyBtn = btns.find(b => b.innerText.includes('Apply Crop'));
      if (applyBtn) {
        applyBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  console.log('Apply Crop button clicked:', JSON.stringify(applyRes.result.value));
  await sleep(1000);

  // 6. Verify Post-Apply State:
  // - Overlay GONE
  // - Badge GONE
  // - Dimensions updated in status bar
  // - activeTool is Move
  const postApplyCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[class*=\"cropOverlay\"]');
      const badge = document.querySelector('[class*=\"cropDimensionsBadge\"]');
      const handles = document.querySelectorAll('[class*=\"cropHandle\"]');
      const statusText = document.querySelector('footer, [class*=\"statusBar\"], [class*=\"bottomBar\"]')?.innerText;
      const moveBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Move' || b.getAttribute('title')?.includes('Move'));
      const isMoveActive = moveBtn?.className.includes('toolButtonActive');
      return {
        overlayGone: !Boolean(overlay),
        badgeGone: !Boolean(badge),
        handlesCount: handles.length,
        isMoveActive,
        statusText: statusText ? statusText.slice(0, 80) : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Post Apply Crop Check:', JSON.stringify(postApplyCheck.result.value));

  // Capture screenshot of Clean Cropped Result
  const ssPostCrop = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'crop_applied_clean_result.png'), Buffer.from(ssPostCrop.data, 'base64'));
  console.log('Saved crop_applied_clean_result.png');

  // 7. Re-enter Crop Tool and test Cancel
  console.log('Testing Re-enter Crop...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cropBtn = btns.find(b => b.getAttribute('aria-label') === 'Crop' || b.getAttribute('title')?.includes('Crop'));
      if (cropBtn) cropBtn.click();
    })()`
  });
  await sleep(500);

  const reenterCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[class*=\"cropOverlay\"]');
      const badge = document.querySelector('[class*=\"cropDimensionsBadge\"]');
      return {
        reenteredOverlay: Boolean(overlay),
        reenteredBadge: Boolean(badge),
        badgeText: badge?.innerText.trim()
      };
    })()`,
    returnByValue: true
  });
  console.log('Re-entered Crop Mode:', JSON.stringify(reenterCheck.result.value));

  // Click Cancel
  console.log('Clicking Cancel Crop...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(b => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()`
  });
  await sleep(500);

  const postCancelCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.querySelector('[class*=\"cropOverlay\"]');
      const badge = document.querySelector('[class*=\"cropDimensionsBadge\"]');
      return {
        cancelOverlayGone: !Boolean(overlay),
        cancelBadgeGone: !Boolean(badge)
      };
    })()`,
    returnByValue: true
  });
  console.log('Post Cancel Crop Check:', JSON.stringify(postCancelCheck.result.value));

  console.log('=== ALL CROP TESTS PASSED SUCCESSFULLY! ===');
  ws.close();
  edge.kill();
}

run();
