const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9291;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-upscaler-test-' + Date.now());

let edge = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`Starting headless Edge on port ${port}...`);
  edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    `--user-data-dir=${tmpProfile}`,
    'http://localhost:4173/image-upscaler'
  ]);

  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find(t => t.type === 'page' && t.url.includes('localhost:4173'));
        if (found) {
          pageTarget = found;
          break;
        }
      }
    } catch { }
  }

  if (!pageTarget) {
    throw new Error('Failed to find localhost:4173 page target in Edge DevTools');
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const timer = setTimeout(() => {
      ws.removeEventListener('message', handler);
      reject(new Error(`Timeout waiting for CDP method: ${method} (id=${curId})`));
    }, 12000);
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
    return res.result?.value;
  };

  const capture = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(outDir, filename);
    fs.writeFileSync(p, Buffer.from(res.data, 'base64'));
    console.log(`[Screenshot Saved] ${filename}`);
    return p;
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  // Set desktop viewport 1440x900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sleep(1500);

  // Wait for upscaler container to load
  for (let i = 0; i < 30; i++) {
    const ready = await evaluate(`Boolean(document.querySelector('[data-testid="upscaler-container"]'))`);
    if (ready) break;
    await sleep(200);
  }

  // Dismiss cookie banner
  await evaluate(`(() => {
    localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept'));
    if (btn) btn.click();
  })()`);
  await sleep(400);

  console.log('--- TEST 1: Check Header & Badge Removal ---');
  const test1 = await evaluate(`(() => {
    const bodyText = document.body.innerText;
    const hasOldBadge = bodyText.includes('FLAGSHIP NEURAL SUPER-RESOLUTION');
    const heading = document.querySelector('[data-testid="upscaler-heading"]');
    const appIcon = document.querySelector('[data-testid="app-icon-badge"]');
    const pills = Array.from(document.querySelectorAll('[data-testid="pill-item"]')).map(p => p.textContent.trim());

    return {
      hasOldBadge,
      headingText: heading ? heading.textContent.trim() : null,
      hasAppIcon: Boolean(appIcon),
      pills,
      pass: !hasOldBadge && heading && heading.textContent.includes('Image Upscaler') && pills.length === 4
    };
  })()`);
  console.log('Test 1 Result:', test1);

  console.log('--- TEST 2: Check Workspace Card & Two-Column Layout ---');
  const test2 = await evaluate(`(() => {
    const card = document.querySelector('[data-testid="workspace-card"]');
    const previewCol = document.querySelector('[data-testid="preview-column"]');
    const actionCol = document.querySelector('[data-testid="action-column"]');
    const cardStyle = card ? window.getComputedStyle(card) : null;
    
    return {
      hasCard: Boolean(card),
      hasPreviewCol: Boolean(previewCol),
      hasActionCol: Boolean(actionCol),
      display: cardStyle ? cardStyle.display : null,
      gridTemplateColumns: cardStyle ? cardStyle.gridTemplateColumns : null,
      borderRadius: cardStyle ? cardStyle.borderRadius : null,
      pass: Boolean(card && previewCol && actionCol)
    };
  })()`);
  console.log('Test 2 Result:', test2);

  console.log('--- TEST 3: Check Left Column (Mountain Sample Split Viewer & Sparkle) ---');
  const test3 = await evaluate(`(() => {
    const viewer = document.querySelector('[data-testid="sample-split-viewer"]');
    const sparkle = document.querySelector('[data-testid="sparkle-accent"]');
    const badgeOriginal = document.querySelector('[data-testid="badge-original"]');
    const badgeUpscaled = document.querySelector('[data-testid="badge-upscaled"]');
    const handle = document.querySelector('[data-testid="slider-handle"]');
    const images = viewer ? Array.from(viewer.querySelectorAll('img')).map(img => ({
      src: img.src,
      className: img.className
    })) : [];

    return {
      hasViewer: Boolean(viewer),
      hasSparkle: Boolean(sparkle),
      badgeOriginalText: badgeOriginal ? badgeOriginal.textContent.trim() : null,
      badgeUpscaledText: badgeUpscaled ? badgeUpscaled.textContent.trim() : null,
      hasHandle: Boolean(handle),
      imageCount: images.length,
      pass: Boolean(viewer && sparkle && badgeOriginal && badgeUpscaled && handle && images.length === 2)
    };
  })()`);
  console.log('Test 3 Result:', test3);

  console.log('--- TEST 4: Check Interactive Drag on Mountain Split Viewer ---');
  const initialHandle = await evaluate(`(() => {
    const handle = document.querySelector('[data-testid="slider-handle"]');
    return handle ? handle.style.left : null;
  })()`);

  // Simulate pointerdown and pointermove at 35% x position
  await evaluate(`(() => {
    const viewer = document.querySelector('[data-testid="sample-split-viewer"]');
    const rect = viewer.getBoundingClientRect();
    const clientX = rect.left + rect.width * 0.35;
    viewer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX, clientY: rect.top + 50 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX, clientY: rect.top + 50 }));
  })()`);
  await sleep(150);

  const dragResult = await evaluate(`(() => {
    const viewer = document.querySelector('[data-testid="sample-split-viewer"]');
    const handle = document.querySelector('[data-testid="slider-handle"]');
    const softLayer = viewer ? (viewer.querySelector('[class*="originalLayerSoft"]') || viewer.querySelectorAll('img')[1]) : null;
    return {
      newHandle: handle ? handle.style.left : null,
      clipPath: softLayer ? softLayer.style.clipPath : ''
    };
  })()`);

  const test4 = {
    initialHandle,
    newHandle: dragResult.newHandle,
    clipPath: dragResult.clipPath,
    pass: dragResult.newHandle === '35%'
  };
  console.log('Test 4 Result:', test4);

  console.log('--- TEST 5: Check Right Column (Upload Dropzone, Choose Button, Hints) ---');
  const test5 = await evaluate(`(() => {
    const dropzone = document.querySelector('[data-testid="upload-dropzone"]');
    const chooseBtn = document.querySelector('[data-testid="choose-image-btn"]');
    const fileInput = document.querySelector('[data-testid="file-input"]');
    const cloudIcon = document.querySelector('[data-testid="cloud-icon"]');
    const title = dropzone ? dropzone.querySelector('h2') : null;
    const formatHint = document.querySelector('[data-testid="format-hint"]');

    return {
      hasDropzone: Boolean(dropzone),
      hasChooseBtn: Boolean(chooseBtn),
      hasFileInput: Boolean(fileInput),
      hasCloudIcon: Boolean(cloudIcon),
      titleText: title ? title.textContent.trim() : null,
      formatHintText: formatHint ? formatHint.textContent.trim() : null,
      pass: Boolean(dropzone && chooseBtn && fileInput && cloudIcon && title && title.textContent === 'Upload your image' && formatHint)
    };
  })()`);
  console.log('Test 5 Result:', test5);

  console.log('--- TEST 6: Check Upscale Factor Selection (2x vs 4x Toggling) ---');
  const check2xInitial = await evaluate(`Boolean(document.querySelector('[data-testid="factor-2x-check"]'))`);
  const check4xInitial = await evaluate(`Boolean(document.querySelector('[data-testid="factor-4x-check"]'))`);

  // Click 4x
  await evaluate(`document.querySelector('[data-testid="factor-card-4x"]')?.click()`);
  await sleep(150);
  const check2xAfter4x = await evaluate(`Boolean(document.querySelector('[data-testid="factor-2x-check"]'))`);
  const check4xAfter4x = await evaluate(`Boolean(document.querySelector('[data-testid="factor-4x-check"]'))`);

  // Click 2x back
  await evaluate(`document.querySelector('[data-testid="factor-card-2x"]')?.click()`);
  await sleep(150);
  const check2xAfter2x = await evaluate(`Boolean(document.querySelector('[data-testid="factor-2x-check"]'))`);
  const check4xAfter2x = await evaluate(`Boolean(document.querySelector('[data-testid="factor-4x-check"]'))`);

  const test6 = {
    initial: { check2x: check2xInitial, check4x: check4xInitial },
    after4xClick: { check2x: check2xAfter4x, check4x: check4xAfter4x },
    after2xClick: { check2x: check2xAfter2x, check4x: check4xAfter2x },
    pass: check2xInitial && !check4xInitial && !check2xAfter4x && check4xAfter4x && check2xAfter2x && !check4xAfter2x
  };
  console.log('Test 6 Result:', test6);

  // Take Desktop Screenshot
  await capture('upscaler_redesign_desktop_1440.png');

  // Test Tablet Viewport
  console.log('--- TEST 7: Tablet Responsive Viewport (768px) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: false
  });
  await sleep(600);
  await capture('upscaler_redesign_tablet_768.png');

  // Test Mobile Viewport
  console.log('--- TEST 8: Mobile Responsive Viewport (390px) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await sleep(600);
  await capture('upscaler_redesign_mobile_390.png');

  const summary = {
    test1_header_and_badge_removal: test1,
    test2_workspace_card_layout: test2,
    test3_mountain_sample_split_viewer: test3,
    test4_interactive_split_drag: test4,
    test5_upload_dropzone_and_choose_button: test5,
    test6_upscale_factor_toggle: test6,
    all_pass: (
      test1.pass &&
      test2.pass &&
      test3.pass &&
      test4.pass &&
      test5.pass &&
      test6.pass
    )
  };

  fs.writeFileSync(path.join(outDir, 'upscaler_redesign_test_report.json'), JSON.stringify(summary, null, 2));
  console.log('\n=========================================');
  console.log('ALL VERIFICATION TESTS PASS:', summary.all_pass);
  console.log('=========================================\n');

  ws.close();
  edge.kill();
}

main().catch(err => {
  console.error('Test execution failed:', err);
  if (edge) edge.kill();
  process.exit(1);
});
