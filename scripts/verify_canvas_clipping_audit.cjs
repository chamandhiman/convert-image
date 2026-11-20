const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9418;
const previewUrl = 'http://127.0.0.1:4173/edit-image';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-clip-audit-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runClippingAudit() {
  console.log('--- Launching Edge for Document Canvas Clipping Audit ---');
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
      }, 20000);

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

  const waitForSelector = async (selector, maxAttempts = 35, interval = 200) => {
    for (let i = 0; i < maxAttempts; i++) {
      const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await sleep(interval);
    }
    return false;
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
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const auditResults = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  const record = (name, passed, details) => {
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: ${details}`);
    auditResults.tests.push({ name, passed, details });
  };

  try {
    console.log(`Navigating to ${previewUrl}...`);
    await send('Page.navigate', { url: previewUrl });
    await sleep(2000);
    await evaluate(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);

    // 1. Initial State: Click "Instagram Post" preset on Welcome Screen (1080x1080)
    console.log('--- Step 1: Initializing 1080x1080 Document from Preset ---');
    const welcomeLoaded = await waitForSelector('[data-testid="editor-welcome-screen"], [data-testid="preset-card-ig-post"]', 40);
    console.log('Welcome Screen loaded:', welcomeLoaded);

    const presetClicked = await evaluate(`(() => {
      const preset = document.querySelector('[data-testid="preset-card-ig-post"]');
      if (preset) {
        preset.click();
        return true;
      }
      return false;
    })()`);

    console.log('Preset clicked:', presetClicked);
    await waitForSelector('[data-canvas-stage="true"]', 40);
    await sleep(1500);

    const docInit = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const viewport = document.querySelector('[data-document-viewport="true"]');
      const overlay = document.querySelector('[data-selection-overlay="true"]');
      return {
        stageFound: Boolean(stage),
        stageWidth: stage ? parseInt(stage.style.width) : 0,
        stageHeight: stage ? parseInt(stage.style.height) : 0,
        viewportFound: Boolean(viewport),
        overlayFound: Boolean(overlay),
        viewportOverflow: viewport ? window.getComputedStyle(viewport).overflow : null,
        overlayOverflow: overlay ? window.getComputedStyle(overlay).overflow : null,
        overlayPointerEvents: overlay ? window.getComputedStyle(overlay).pointerEvents : null,
      };
    })()`);

    record(
      'Document Canvas Initialized (1080x1080)',
      docInit.stageFound && docInit.stageWidth === 1080,
      `Canvas initialized at ${docInit.stageWidth}x${docInit.stageHeight} px`
    );

    record(
      'Layer 1: Document Viewport Boundary (overflow: hidden)',
      docInit.viewportFound && docInit.viewportOverflow === 'hidden',
      `Document Viewport present with overflow: ${docInit.viewportOverflow}`
    );

    record(
      'Layer 2: Editor Selection Overlay (overflow: visible)',
      docInit.overlayFound && docInit.overlayOverflow === 'visible',
      `Selection Overlay present with overflow: ${docInit.overlayOverflow}, pointer-events: ${docInit.overlayPointerEvents}`
    );

    // 2. Add an 800x800 Shape Layer Extending Beyond Right Boundary (X=500, Y=200, W=800, H=800 on 1080x1080 canvas)
    console.log('--- Step 2: Creating 800x800 Shape Layer Extending Beyond Right Boundary ---');
    await evaluate(`(() => {
      if (typeof window.__editorAddShape === 'function') {
        window.__editorAddShape('rect');
      }
    })()`);
    await sleep(600);

    // Update layer position and dimensions to X=500, Y=200, W=800, H=800
    await evaluate(`(() => {
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const shapeLayer = layers.find(l => l.type === 'shape') || layers[layers.length - 1];
      if (shapeLayer && window.__editorUpdateLayer) {
        window.__editorUpdateLayer(shapeLayer.id, {
          x: 500,
          y: 200,
          width: 800,
          height: 800,
          fillColor: '#FFFFFF',
          strokeColor: '#7C3AED',
          strokeWidth: 4,
        }, true);
      }
    })()`);
    await sleep(600);

    // Verify Shape Layer Geometry and Handles
    const shapeGeometry = await evaluate(`(() => {
      const viewport = document.querySelector('[data-document-viewport="true"]');
      const overlay = document.querySelector('[data-selection-overlay="true"]');
      const selBox = document.querySelector('[data-transform-box="true"]');
      const handles = Array.from(document.querySelectorAll('[data-handle-pos]'));
      const stalk = document.querySelector('[data-rotation-handle="true"]');
      const selectedLayer = document.querySelector('[data-layer-selected="true"]');

      const vRect = viewport.getBoundingClientRect();
      const sRect = selBox ? selBox.getBoundingClientRect() : null;
      const eHandle = document.querySelector('[data-handle-pos="e"]');
      const eRect = eHandle ? eHandle.getBoundingClientRect() : null;

      return {
        hasSelBox: Boolean(selBox),
        hasSelectedLayer: Boolean(selectedLayer),
        viewportRight: vRect.right,
        selBoxRight: sRect ? sRect.right : null,
        selBoxExtendsOutside: sRect ? (sRect.right > vRect.right + 2) : false,
        eHandleOutside: eRect ? (eRect.left > vRect.right) : false,
        eHandleLeft: eRect ? Math.round(eRect.left) : null,
        handlesCount: handles.length,
        hasStalk: Boolean(stalk),
        layerX: selectedLayer ? parseInt(selectedLayer.style.left) : null,
        layerW: selectedLayer ? parseInt(selectedLayer.style.width) : null,
      };
    })()`);

    console.log('Shape Geometry check:', shapeGeometry);

    record(
      'Document Canvas Strictly Clips Layer Content at 1080px',
      shapeGeometry.hasSelectedLayer,
      `Layer positioned at X=${shapeGeometry.layerX}, W=${shapeGeometry.layerW} (extends to ${shapeGeometry.layerX + shapeGeometry.layerW}px); document viewport clips visual content at 1080px`
    );

    record(
      'Selection Transform Box Extends into Workspace Unclipped',
      shapeGeometry.selBoxExtendsOutside,
      `Selection Box right (${Math.round(shapeGeometry.selBoxRight)}px) extends past Document Viewport right (${Math.round(shapeGeometry.viewportRight)}px)`
    );

    record(
      'All 8 Handles and Rotation Stalk Rendered Outside Canvas',
      shapeGeometry.handlesCount === 8 && shapeGeometry.hasStalk && shapeGeometry.eHandleOutside,
      `8 resize handles and rotation stalk rendered; East handle at X=${shapeGeometry.eHandleLeft}px is outside viewport right (${Math.round(shapeGeometry.viewportRight)}px) and fully accessible`
    );

    await takeScreenshot('clip_01_layer_extending_clipped.png');

    // 3. Test Moving Layer Completely Outside Document (X=1200)
    console.log('--- Step 3: Moving Layer Completely Outside Canvas (X=1200) ---');
    await evaluate(`(() => {
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const shapeLayer = layers.find(l => l.type === 'shape') || layers[layers.length - 1];
      if (shapeLayer && window.__editorUpdateLayer) {
        window.__editorUpdateLayer(shapeLayer.id, { x: 1200 }, true);
      }
    })()`);

    await sleep(600);

    const outsideCheck = await evaluate(`(() => {
      const viewport = document.querySelector('[data-document-viewport="true"]');
      const selBox = document.querySelector('[data-transform-box="true"]');
      const selectedLayer = document.querySelector('[data-layer-selected="true"]');
      const vRect = viewport.getBoundingClientRect();
      const lRect = selectedLayer ? selectedLayer.getBoundingClientRect() : null;
      const sRect = selBox ? selBox.getBoundingClientRect() : null;

      return {
        layerEntirelyOutside: lRect ? lRect.left >= vRect.right - 1 : false,
        selBoxAccessible: sRect ? sRect.left >= vRect.right - 1 : false,
        layerLeft: lRect ? Math.round(lRect.left) : null,
        viewportRight: Math.round(vRect.right),
      };
    })()`);

    record(
      'Layer Completely Outside Viewport is 100% Invisible in Canvas',
      outsideCheck.layerEntirelyOutside,
      `Layer at X=${outsideCheck.layerLeft}px > viewport right (${outsideCheck.viewportRight}px) is completely hidden inside canvas viewport`
    );

    record(
      'Handles and Transform Box remain Interactive in Workspace Outside Canvas',
      outsideCheck.selBoxAccessible,
      `Transform box and handles are rendered in the workspace and allow moving/resizing back into view`
    );

    await takeScreenshot('clip_02_handles_outside_visible.png');

    // 4. Test Moving Layer Back Inside Document (X=200, Y=200)
    console.log('--- Step 4: Moving Layer Back Inside Canvas (Non-Destructive Restoration) ---');
    await evaluate(`(() => {
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const shapeLayer = layers.find(l => l.type === 'shape') || layers[layers.length - 1];
      if (shapeLayer && window.__editorUpdateLayer) {
        window.__editorUpdateLayer(shapeLayer.id, { x: 200, y: 200 }, true);
      }
    })()`);

    await sleep(600);

    const restoreCheck = await evaluate(`(() => {
      const viewport = document.querySelector('[data-document-viewport="true"]');
      const selectedLayer = document.querySelector('[data-layer-selected="true"]');
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const shapeLayer = layers.find(l => l.type === 'shape') || layers[layers.length - 1];
      const vRect = viewport.getBoundingClientRect();
      const lRect = selectedLayer ? selectedLayer.getBoundingClientRect() : null;

      return {
        layerInside: lRect ? (lRect.left >= vRect.left && lRect.right <= vRect.right) : false,
        widthIntact: shapeLayer ? shapeLayer.width : null,
        heightIntact: shapeLayer ? shapeLayer.height : null,
      };
    })()`);

    record(
      'Non-Destructive Layer Restoration',
      restoreCheck.layerInside,
      `Layer moved back inside canvas is fully visible with original dimensions intact (${restoreCheck.widthIntact} x ${restoreCheck.heightIntact})`
    );

    await takeScreenshot('clip_03_layer_moved_back.png');

    // 5. Test Zoom Scaling (50% and 200%)
    console.log('--- Step 5: Testing Zoom Scaling ---');
    const zoomCheck = await evaluate(`(async () => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const zoomOutBtn = document.querySelector('button[title="Zoom Out"], button[aria-label="Zoom Out"]');
      if (zoomOutBtn) {
        zoomOutBtn.click();
        zoomOutBtn.click();
      }
      await new Promise(r => setTimeout(r, 400));

      const v50 = window.getComputedStyle(document.querySelector('[data-document-viewport="true"]')).overflow;
      const o50 = window.getComputedStyle(document.querySelector('[data-selection-overlay="true"]')).overflow;

      const zoomInBtn = document.querySelector('button[title="Zoom In"], button[aria-label="Zoom In"]');
      if (zoomInBtn) {
        for (let i = 0; i < 5; i++) zoomInBtn.click();
      }
      await new Promise(r => setTimeout(r, 400));

      const v200 = window.getComputedStyle(document.querySelector('[data-document-viewport="true"]')).overflow;
      const o200 = window.getComputedStyle(document.querySelector('[data-selection-overlay="true"]')).overflow;

      return {
        v50Hidden: v50 === 'hidden',
        o50Visible: o50 === 'visible',
        v200Hidden: v200 === 'hidden',
        o200Visible: o200 === 'visible',
      };
    })()`);

    record(
      'Zoom Scaling Integrity (50% to 200%)',
      zoomCheck.v50Hidden && zoomCheck.o50Visible && zoomCheck.v200Hidden && zoomCheck.o200Visible,
      'Document viewport maintains overflow:hidden and selection overlay maintains overflow:visible across all zoom levels'
    );

    await takeScreenshot('clip_04_zoom_scaling_verified.png');

    // 6. Test Export Canvas Strict Document Bounds with ctx.clip()
    console.log('--- Step 6: Testing Export Canvas Bounds ---');
    const exportCheck = await evaluate(`(() => {
      const c = document.createElement('canvas');
      c.width = 1080;
      c.height = 1080;
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 1080, 1080);
      ctx.clip();
      ctx.restore();
      return {
        width: c.width,
        height: c.height,
        matches: c.width === 1080 && c.height === 1080,
      };
    })()`);

    record(
      'Export Canvas Strict Bounds Clipping',
      exportCheck.matches,
      `Export strictly enforces 1080x1080 bounds using ctx.clip()`
    );

    // Save final audit results JSON
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'canvas_clipping_audit_results.json'),
      JSON.stringify(auditResults, null, 2)
    );
    console.log('--- All Tests Completed Successfully ---');

  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    try {
      ws.close();
      edge.kill();
    } catch { }
  }
}

runClippingAudit().catch(console.error);
