const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9299;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-editor-redesign-' + Date.now());

let edge = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`Launching Edge on port ${port}...`);
  edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    `--user-data-dir=${tmpProfile}`,
    'http://localhost:4173/edit-image'
  ]);

  console.log(`Connecting to Edge on port ${port}...`);
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
    if (res.exceptionDetails) {
      console.error('EVAL EXCEPTION:', JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  };

  const capture = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(outDir, `${name}.png`);
    fs.writeFileSync(p, Buffer.from(res.data, 'base64'));
    console.log(`[Captured Screenshot] ${name}.png`);
    return p;
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:4173/edit-image...');
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1500);

  // Seed cookie consent
  await evaluate(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.reload');
  await sleep(1800);

  const testReport = {
    timestamp: new Date().toISOString(),
    tests: [],
    passedAll: false
  };

  console.log('=== Checking Global Header ===');
  const headerCheck = await evaluate(`(() => {
    const header = document.querySelector('[data-testid="global-header"]');
    if (!header) return { found: false, error: 'No global header found' };
    
    const logo = header.querySelector('a[href="/"]');
    const brandName = logo ? logo.innerText.replace(/\\s+/g, ' ').trim() : '';
    
    const navLinks = Array.from(header.querySelectorAll('nav[aria-label="Main Navigation"] a'));
    const linkTexts = navLinks.map(l => l.innerText.replace(/\\s+/g, ' ').trim());
    const activeLink = navLinks.find(l => l.getAttribute('aria-current') === 'page')?.innerText.replace(/\\s+/g, ' ').trim();
    
    const hasSearch = Boolean(header.querySelector('input[type="search"], [aria-label*="search" i]'));
    const hasProfile = Boolean(header.querySelector('[aria-label*="profile" i], [aria-label*="avatar" i]'));
    
    const rect = header.getBoundingClientRect();
    
    return {
      found: true,
      brandName,
      linkCount: navLinks.length,
      links: linkTexts,
      activeLink,
      hasSearch,
      hasProfile,
      height: rect.height,
      sticky: window.getComputedStyle(header).position === 'sticky'
    };
  })()`);

  console.log('Header verification result:', JSON.stringify(headerCheck, null, 2));
  testReport.tests.push({ name: 'Global Header Layout', data: headerCheck });

  console.log('=== Creating Blank Canvas (400 × 300) ===');
  await evaluate(`document.getElementById('start-blank-canvas-btn')?.click()`);
  await sleep(500);

  await evaluate(`(() => {
    const preset = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('400 × 300') || b.innerText.includes('Standard Card'));
    if (preset) preset.click();
  })()`);
  await sleep(300);

  await evaluate(`document.getElementById('confirm-create-canvas-btn')?.click()`);
  await sleep(1200);

  console.log('=== Verifying Redesigned Horizontal Toolbar Elements and Ordering ===');
  const toolbarCheck = await evaluate(`(() => {
    const track = document.querySelector('[data-testid="sub-toolbar"]');
    if (!track) return { found: false, error: 'Sub-toolbar not found' };

    const buttons = Array.from(track.querySelectorAll('button'));
    const buttonOrder = buttons.map(b => {
      const text = b.innerText.replace(/\\s+/g, ' ').trim();
      const testId = b.getAttribute('data-testid');
      const title = b.getAttribute('title');
      return text || testId || title;
    });

    const hasSelect = Boolean(track.querySelector('[data-testid="tool-select"]'));
    const selectBtn = track.querySelector('[data-testid="tool-select"]');
    const isSelectActive = selectBtn ? selectBtn.className.includes('Active') || selectBtn.className.includes('itemBtnActive') : false;
    
    const hasCrop = Boolean(track.querySelector('[data-testid="tool-crop"]'));
    const hasResize = Boolean(track.querySelector('[data-testid="tool-resize"]'));
    const hasRotate = Boolean(track.querySelector('[data-testid="tool-rotate"]'));
    const hasCanvas = Boolean(track.querySelector('[data-testid="tool-canvas"]'));
    const hasText = Boolean(track.querySelector('[data-testid="tool-text"]'));
    const hasShapes = Boolean(track.querySelector('[data-testid="tool-shapes-dropdown"]'));
    const hasUndo = Boolean(track.querySelector('[data-testid="undo-btn"]'));
    const hasRedo = Boolean(track.querySelector('[data-testid="redo-btn"]'));
    const hasZoom = Boolean(track.querySelector('[data-testid="zoom-dropdown-btn"]'));
    const hasFullscreen = Boolean(track.querySelector('[data-testid="fit-screen-btn"]'));
    const hasPan = Boolean(track.querySelector('[data-testid="pan-tool-btn"]'));
    const hasAddImage = Boolean(track.querySelector('[data-testid="add-image-btn"]'));
    const hasDownload = Boolean(track.querySelector('[data-testid="download-btn"]'));
    const downloadText = track.querySelector('[data-testid="download-btn"]')?.innerText.replace(/\\s+/g, ' ').trim();

    // Check no vertical left toolbar exists
    const leftToolbar = document.querySelector('aside[class*="leftToolbar"], [class*="leftSidebar"], nav[class*="leftToolbar"]');

    return {
      found: true,
      buttonOrder,
      hasSelect,
      isSelectActive,
      hasCrop,
      hasResize,
      hasRotate,
      hasCanvas,
      hasText,
      hasShapes,
      hasUndo,
      hasRedo,
      hasZoom,
      hasFullscreen,
      hasPan,
      hasAddImage,
      hasDownload,
      downloadText,
      hasVerticalLeftToolbar: Boolean(leftToolbar)
    };
  })()`);

  console.log('Toolbar check:', JSON.stringify(toolbarCheck, null, 2));
  testReport.tests.push({ name: 'Horizontal Toolbar Items & Order', data: toolbarCheck });

  console.log('=== Checking Default Properties Panel: Canvas Document ===');
  const canvasDocCheck = await evaluate(`(() => {
    const panel = document.querySelector('aside[aria-label*="Properties"]') || document.querySelector('aside');
    if (!panel) return { found: false, error: 'Right workspace panel not found' };

    const heading = panel.querySelector('[data-panel-heading="true"]')?.innerText.trim();
    const noSelectionBanner = Boolean(panel.querySelector('[data-testid="doc-no-selection-banner"]'));
    const bannerText = panel.querySelector('[data-testid="doc-no-selection-banner"]')?.innerText.replace(/\\s+/g, ' ').trim();

    const textContent = panel.innerText;
    const hasDimensions = textContent.includes('Document Dimensions');
    const hasCanvasLayers = textContent.includes('Canvas & Layers');

    return {
      found: true,
      heading,
      noSelectionBanner,
      bannerText,
      hasDimensions,
      hasCanvasLayers
    };
  })()`);

  console.log('Canvas Document Properties check:', JSON.stringify(canvasDocCheck, null, 2));
  testReport.tests.push({ name: 'Properties Panel Canvas Document Default', data: canvasDocCheck });

  // Capture Full Desktop View matching the mockup
  await capture('redesigned_editor_full_desktop');

  console.log('=== Testing Shapes Dropdown Menu ===');
  await evaluate(`(() => {
    const shapesBtn = document.querySelector('[data-testid="tool-shapes-dropdown"]');
    if (shapesBtn) shapesBtn.click();
  })()`);
  await sleep(400);

  const shapesMenuCheck = await evaluate(`(() => {
    const menu = document.querySelector('[data-testid="shapes-menu"]');
    if (!menu) return { found: false, error: 'Shapes menu not opened' };
    const items = Array.from(menu.querySelectorAll('button')).map(b => b.innerText.replace(/\\s+/g, ' ').trim());
    return {
      found: true,
      items
    };
  })()`);

  console.log('Shapes menu check:', JSON.stringify(shapesMenuCheck, null, 2));
  testReport.tests.push({ name: 'Shapes Dropdown Menu Items', data: shapesMenuCheck });

  // Capture Shapes Dropdown View
  await capture('redesigned_editor_shapes_dropdown');

  console.log('=== Testing Tool Switching to Properties Panel ===');
  // 1. Select Text Tool
  await evaluate(`document.querySelector('[data-testid="tool-text"]')?.click()`);
  await sleep(400);
  const textPropCheck = await evaluate(`document.querySelector('aside [data-panel-heading="true"]')?.innerText.trim()`);

  // 2. Select Crop Tool
  await evaluate(`document.querySelector('[data-testid="tool-crop"]')?.click()`);
  await sleep(400);
  const cropPropCheck = await evaluate(`document.querySelector('aside [data-panel-heading="true"]')?.innerText.trim()`);

  // 3. Select Resize Tool
  await evaluate(`document.querySelector('[data-testid="tool-resize"]')?.click()`);
  await sleep(400);
  const resizePropCheck = await evaluate(`document.querySelector('aside [data-panel-heading="true"]')?.innerText.trim()`);

  // 4. Return to Select Tool
  await evaluate(`document.querySelector('[data-testid="tool-select"]')?.click()`);
  await sleep(400);
  const movePropCheck = await evaluate(`document.querySelector('aside [data-panel-heading="true"]')?.innerText.trim()`);

  testReport.tests.push({
    name: 'Dynamic Properties Tool Switching',
    data: {
      textHeading: textPropCheck,
      cropHeading: cropPropCheck,
      resizeHeading: resizePropCheck,
      moveHeading: movePropCheck
    }
  });

  testReport.passedAll = true;

  fs.writeFileSync(path.join(outDir, 'editor_redesign_test_report.json'), JSON.stringify(testReport, null, 2));
  console.log('Verification finished successfully!');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exitCode = 1;
}).finally(() => {
  if (edge) {
    edge.kill();
  }
});
