const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9414;
const previewUrl = 'http://localhost:4173';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-comp-audit-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAudit() {
  console.log('--- Launching Edge for Comprehensive Editor Priority Audit ---');
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
      console.error('Eval Exception:', res.exceptionDetails);
      throw new Error(res.exceptionDetails.text || 'CDP Eval Exception');
    }
    return res.result?.value;
  };

  const takeScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot Saved] -> ${filename}`);
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1500,
    height: 980,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log(`Navigating to ${previewUrl}/edit-image...`);
  await send('Page.navigate', { url: `${previewUrl}/edit-image` });
  await sleep(2000);
  await evaluate(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);

  const results = {};

  // 1. Initial State: Click "Instagram Post" preset on Welcome Screen to create a 1080x1080 canvas
  console.log('1. Creating 1080x1080 document from welcome screen preset...');
  const presetClicked = await evaluate(`(() => {
    const preset = document.querySelector('[data-testid="preset-card-ig-post"]');
    if (preset) {
      preset.click();
      return true;
    }
    return false;
  })()`);
  results.presetClicked = presetClicked;
  await sleep(1500);

  // Verify document canvas initialized
  const docInit = await evaluate(`(() => {
    const stage = document.querySelector('[data-canvas-stage="true"]');
    const bg = document.querySelector('[data-layer-id="background"]');
    return {
      stageFound: Boolean(stage),
      stageWidth: stage ? parseInt(stage.style.width) : 0,
      stageHeight: stage ? parseInt(stage.style.height) : 0,
      stageOverflow: stage ? stage.style.overflow : '',
      bgFound: Boolean(bg),
    };
  })()`);
  results.docInit = docInit;
  console.log('Document Initialized:', docInit);

  // 2. Priority 2: Proper Canvas Clipping
  // Create a Rectangle shape layer and test moving partially and completely outside canvas
  console.log('2. Testing Priority 2: Proper Canvas Clipping...');
  const shapeCreated = await evaluate(`(() => {
    const shapeBtn = document.querySelector('button[data-tool-id="rect"], button[data-testid="tool-rect"]');
    if (shapeBtn) {
      shapeBtn.click();
      return true;
    }
    return false;
  })()`);
  await sleep(500);

  // Draw rectangle on canvas
  const drawnShape = await evaluate(`(() => {
    const stage = document.querySelector('[data-canvas-stage="true"]');
    if (!stage) return false;
    const rect = stage.getBoundingClientRect();
    const downEvt = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 100,
      clientY: rect.top + 100,
    });
    stage.dispatchEvent(downEvt);

    const moveEvt = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 400,
      clientY: rect.top + 350,
    });
    window.dispatchEvent(moveEvt);

    const upEvt = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 400,
      clientY: rect.top + 350,
    });
    window.dispatchEvent(upEvt);
    return true;
  })()`);
  await sleep(800);

  // Test moving shape partially outside canvas (x = -150)
  const partialClipCheck = await evaluate(`(() => {
    const shapeLayer = Array.from(document.querySelectorAll('[data-layer-type="shape"]')).pop();
    if (!shapeLayer) return null;

    // Move layer to x = -150
    const stage = document.querySelector('[data-canvas-stage="true"]');
    const downEvt = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 200, clientY: 200 });
    shapeLayer.dispatchEvent(downEvt);

    // Dispatch move event with dx = -350
    const moveEvt = new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 200 - 350, clientY: 200 });
    window.dispatchEvent(moveEvt);

    const upEvt = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
    window.dispatchEvent(upEvt);

    const visualContent = shapeLayer.querySelector('[class*="layerVisualContent"]');
    const handles = shapeLayer.querySelectorAll('[class*="layerHandle"]');
    return {
      layerX: parseInt(shapeLayer.style.left),
      layerY: parseInt(shapeLayer.style.top),
      clipPath: visualContent ? visualContent.style.clipPath : '',
      handlesCount: handles.length,
      stageOverflow: stage ? stage.style.overflow : '',
    };
  })()`);
  results.partialClipCheck = partialClipCheck;
  console.log('Partial Clip Check:', partialClipCheck);
  await takeScreenshot('audit_01_canvas_clipping_partial.png');

  // Move back inside canvas and verify clipPath is 'none' / unclipped
  const restoreClipCheck = await evaluate(`(() => {
    const shapeLayer = Array.from(document.querySelectorAll('[data-layer-type="shape"]')).pop();
    if (!shapeLayer) return null;

    const downEvt = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100, clientY: 200 });
    shapeLayer.dispatchEvent(downEvt);

    const moveEvt = new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 100 + 300, clientY: 200 });
    window.dispatchEvent(moveEvt);

    const upEvt = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
    window.dispatchEvent(upEvt);

    const visualContent = shapeLayer.querySelector('[class*="layerVisualContent"]');
    return {
      layerX: parseInt(shapeLayer.style.left),
      clipPath: visualContent ? visualContent.style.clipPath : '',
    };
  })()`);
  results.restoreClipCheck = restoreClipCheck;
  console.log('Restore Clip Check:', restoreClipCheck);

  // 3. Priority 5: Blending Options & Layer Styles Live Rendering
  console.log('3. Testing Priority 5: Blending Options & Layer Styles...');
  // Open Blending Options on the shape layer
  const blendStyleTest = await evaluate(`(() => {
    const shapeLayer = Array.from(document.querySelectorAll('[data-layer-type="shape"]')).pop();
    if (!shapeLayer) return null;

    // Trigger context menu or select layer
    shapeLayer.click();

    // Verify updating layer styles programmatically via right-click / menu or direct state
    const moreBtn = document.querySelector('[data-testid="layer-row-action-more"]') ||
                    document.querySelector('[data-layer-selected="true"]');
    return Boolean(moreBtn);
  })()`);

  // Direct test of Blending Options styles rendering on the DOM element:
  const styleRenderTest = await evaluate(`(() => {
    const shapeLayer = Array.from(document.querySelectorAll('[data-layer-type="shape"]')).pop();
    if (!shapeLayer) return null;

    // Test Color Overlay rendering
    const rectEl = shapeLayer.querySelector('rect');
    const visualContent = shapeLayer.querySelector('[class*="layerVisualContent"]');
    return {
      shapeFound: Boolean(shapeLayer),
      rectFound: Boolean(rectEl),
      fillAttr: rectEl ? rectEl.getAttribute('fill') : '',
      currentFilter: shapeLayer.style.filter || '',
      currentBlendMode: shapeLayer.style.mixBlendMode || 'normal',
    };
  })()`);
  results.styleRenderTest = styleRenderTest;
  console.log('Style Render Test:', styleRenderTest);

  // 4. Priority 6: Pen Tool & Bézier Handles
  console.log('4. Testing Priority 6: Pen Tool & Bézier Handles...');
  const penToolActivated = await evaluate(`(() => {
    const penBtn = document.querySelector('button[data-tool-id="pen"], button[data-testid="tool-pen"]');
    if (penBtn) {
      penBtn.click();
      return true;
    }
    return false;
  })()`);
  results.penToolActivated = penToolActivated;
  await sleep(500);

  // Create points with Bézier dragging on canvas
  const penPointsCreated = await evaluate(`(() => {
    const stage = document.querySelector('[data-canvas-stage="true"]');
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();

    // Point 1: Click & drag to create Bézier handles
    stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: rect.left + 200, clientY: rect.top + 200 }));
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: rect.left + 250, clientY: rect.top + 180 }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    // Point 2: Click & drag
    stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: rect.left + 400, clientY: rect.top + 300 }));
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: rect.left + 430, clientY: rect.top + 350 }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    // Point 3: Click
    stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: rect.left + 250, clientY: rect.top + 450 }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    // Verify SVG Pen overlay
    const overlay = document.querySelector('[data-testid="pen-tool-overlay"]');
    const pathLine = overlay ? overlay.querySelector('[class*="penPathLine"]') : null;
    const anchorPoints = overlay ? overlay.querySelectorAll('[class*="penAnchorPoint"]') : [];
    const handleCircles = overlay ? overlay.querySelectorAll('circle') : [];

    return {
      overlayFound: Boolean(overlay),
      pathData: pathLine ? pathLine.getAttribute('d') : '',
      anchorsCount: anchorPoints.length,
      bezierKnobsCount: handleCircles.length,
    };
  })()`);
  results.penPointsCreated = penPointsCreated;
  console.log('Pen Points Created:', penPointsCreated);
  await takeScreenshot('audit_02_pen_tool_bezier.png');

  // Test "Make Shape" from Pen Tool in Contextual Toolbar
  const makeShapeClicked = await evaluate(`(() => {
    const makeShapeBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Make Shape')
    );
    if (makeShapeBtn) {
      makeShapeBtn.click();
      return true;
    }
    return false;
  })()`);
  await sleep(800);

  const penShapeVerified = await evaluate(`(() => {
    const customShape = Array.from(document.querySelectorAll('[data-layer-type="shape"]')).find((el) => {
      return el.querySelector('path');
    });
    return {
      convertedToShape: Boolean(customShape),
      pathD: customShape ? customShape.querySelector('path')?.getAttribute('d') : '',
    };
  })()`);
  results.penShapeVerified = penShapeVerified;
  console.log('Pen Shape Verified:', penShapeVerified);

  // 5. Priority 3 & 4: Multi-Document & Cross-Document Layer Transfer & Duplication
  console.log('5. Testing Priority 3 & 4: Cross-Document Operations & Duplication...');
  // Test Ctrl+J layer duplication
  const duplicateTest = await evaluate(`(() => {
    const shape = document.querySelector('[data-layer-type="shape"]');
    if (shape) shape.click();

    // Trigger Ctrl+J
    const downEvt = new KeyboardEvent('keydown', { key: 'j', ctrlKey: true, bubbles: true });
    window.dispatchEvent(downEvt);

    const layerRows = document.querySelectorAll('[data-testid^="layer-row-"]');
    return {
      layerRowsCount: layerRows.length,
    };
  })()`);
  results.duplicateTest = duplicateTest;
  console.log('Layer Duplication Test:', duplicateTest);

  // Open a second document
  const secondDocCreated = await evaluate(`(() => {
    const newDocBtn = document.querySelector('button[title*="New Document"], button[title*="New Blank Canvas"]');
    if (newDocBtn) {
      newDocBtn.click();
      return true;
    }
    return false;
  })()`);
  await sleep(600);

  // If blank canvas modal is open, click Create Blank Document
  await evaluate(`(() => {
    const createBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Create Canvas') || b.textContent?.includes('Create Document')
    );
    if (createBtn) createBtn.click();
  })()`);
  await sleep(1000);

  const multiDocState = await evaluate(`(() => {
    const tabs = document.querySelectorAll('[data-testid^="doc-tab-"], [class*="docTab"]');
    return {
      tabsCount: tabs.length,
    };
  })()`);
  results.multiDocState = multiDocState;
  console.log('Multi-Document State:', multiDocState);
  await takeScreenshot('audit_03_multi_document_tabs.png');

  // 6. Priority 8: Photoshop Keyboard Shortcuts (Alt+Ctrl+I, Alt+Ctrl+C)
  console.log('6. Testing Priority 8: Keyboard Shortcuts...');
  const shortcutsTest = await evaluate(`(() => {
    // Test Alt+Ctrl+I -> opens Resize Modal / Tab
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', altKey: true, ctrlKey: true, bubbles: true }));
    const resizeActive = document.querySelector('[data-testid="input-resize-width"]') !== null ||
                         document.querySelector('[data-tool-id="resize"]')?.getAttribute('data-active') === 'true';

    // Test Alt+Ctrl+C -> opens Canvas Size Modal / Tab
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', altKey: true, ctrlKey: true, bubbles: true }));
    const canvasActive = document.querySelector('[data-testid="input-canvas-width"]') !== null ||
                         document.querySelector('[data-tool-id="canvas"]')?.getAttribute('data-active') === 'true';

    return {
      resizeTriggered: resizeActive,
      canvasTriggered: canvasActive,
    };
  })()`);
  results.shortcutsTest = shortcutsTest;
  console.log('Shortcuts Test:', shortcutsTest);

  // 7. Write complete audit results artifact
  const outJson = path.join(ARTIFACT_DIR, 'comprehensive_editor_audit_results.json');
  fs.writeFileSync(outJson, JSON.stringify(results, null, 2));
  console.log('Audit Results Written to:', outJson);

  await sleep(1000);
  ws.close();
  edge.kill();
  console.log('--- Comprehensive Editor Audit Finished ---');
}

runAudit().catch((err) => {
  console.error('Audit Fatal Error:', err);
  process.exit(1);
});
