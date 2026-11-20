const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { writePsdUint8Array, initializeCanvas } = require('ag-psd');

const ARTIFACTS_DIR = 'C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
const PSD_PATH = path.resolve(FIXTURES_DIR, 'test_5400x3600_9layers.psd');

// 1. Generate 5400x3600 9-Layer PSD Fixture
const makeCanvas = (w, h) => ({
  width: w,
  height: h,
  getContext: () => ({
    createImageData: (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
    getImageData: (x, y, width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: () => {},
    drawImage: () => {},
    fillRect: () => {},
  }),
  toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
});

initializeCanvas(makeCanvas);

const psdData = {
  width: 5400,
  height: 3600,
  children: [
    // 1. Background (full canvas)
    {
      name: 'Background',
      left: 0,
      top: 0,
      canvas: makeCanvas(5400, 3600),
      opacity: 1,
      blendMode: 'normal',
    },
    // 2. Art Backdrop
    {
      name: 'Art Backdrop',
      left: 200,
      top: 300,
      canvas: makeCanvas(5000, 3000),
      opacity: 0.9,
      blendMode: 'multiply',
    },
    // 3. Corner Decal (partially outside canvas: negative coordinates)
    {
      name: 'Corner Decal',
      left: -200,
      top: -100,
      canvas: makeCanvas(1200, 1000),
      opacity: 0.85,
      blendMode: 'normal',
    },
    // 4. Branding Group (Group with 3 child layers: Emblem, Title, Tagline)
    {
      name: 'Branding Group',
      opened: true,
      children: [
        // 4a. Vector Emblem (Shape)
        {
          name: 'Vector Emblem',
          left: 1500,
          top: 800,
          canvas: makeCanvas(1000, 1000),
          opacity: 1,
          blendMode: 'screen',
          vectorStroke: {
            strokeEnabled: true,
            lineWidth: { value: 6, units: 'Pixels' },
            content: { color: { r: 255, g: 255, b: 255 } },
          },
          vectorFill: { color: { r: 124, g: 58, b: 237 } },
        },
        // 4b. Title Text (Editable Text Layer)
        {
          name: 'Title Text',
          left: 1600,
          top: 1900,
          canvas: makeCanvas(2200, 300),
          opacity: 1,
          blendMode: 'normal',
          text: {
            text: 'MASTER CREATIVE SUITE',
            style: {
              fontSize: 120,
              font: { name: 'Poppins', style: 'Bold' },
              fillColor: { r: 255, g: 255, b: 255 },
            },
          },
        },
        // 4c. Tagline Text (Editable Text Layer)
        {
          name: 'Tagline Text',
          left: 1600,
          top: 2300,
          canvas: makeCanvas(1800, 200),
          opacity: 0.8,
          blendMode: 'normal',
          text: {
            text: 'Photoshop PSD Layered Engine',
            style: {
              fontSize: 64,
              font: { name: 'Poppins', style: 'Regular' },
              fillColor: { r: 167, g: 139, b: 250 },
            },
          },
        },
      ],
    },
    // 5. Product Art
    {
      name: 'Product Art',
      left: 2800,
      top: 1000,
      canvas: makeCanvas(2200, 2200),
      opacity: 0.95,
      blendMode: 'normal',
    },
    // 6. Top Flare (Screen blend mode)
    {
      name: 'Top Flare',
      left: 1000,
      top: 200,
      canvas: makeCanvas(3400, 600),
      opacity: 0.8,
      blendMode: 'screen',
    },
    // 7. Accent Badge
    {
      name: 'Accent Badge',
      left: 4000,
      top: 2500,
      canvas: makeCanvas(800, 800),
      opacity: 0.9,
      blendMode: 'normal',
    },
  ],
};

const bytes = writePsdUint8Array(psdData);
fs.writeFileSync(PSD_PATH, Buffer.from(bytes));
console.log('[Setup] Created test fixture 5400x3600 PSD with 9 layers:', PSD_PATH, 'Size:', bytes.length);

// 2. Launch Edge CDP and run verification
const CDP_PORT = 9825;
const edgeProc = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--window-size=1600,1000',
  '--user-data-dir=C:/Temp/edge-psd-5400-test',
]);

async function run() {
  try {
    let wsUrl = null;
    for (let i = 0; i < 35; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        if (res.ok) {
          const list = await res.json();
          if (list[0]?.webSocketDebuggerUrl) {
            wsUrl = list[0].webSocketDebuggerUrl;
            break;
          }
        }
      } catch {}
    }

    if (!wsUrl) throw new Error('Could not connect to Edge remote debugging WebSocket');
    console.log('[CDP] Connected to Edge WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((r) => (ws.onopen = r));

    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const cur = msgId++;
        const handler = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === cur) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: cur, method, params }));
      });

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    console.log('[CDP] Navigating to http://127.0.0.1:4173/edit-image ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/edit-image' });
    await new Promise((r) => setTimeout(r, 2500));

    console.log('[CDP] Setting file input with 5400x3600 9-layer PSD fixture...');
    const base64Data = fs.readFileSync(PSD_PATH).toString('base64');
    const uploadRes = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        const b64 = "${base64Data}";
        const byteChars = atob(b64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], 'test_5400x3600_9layers.psd', { type: 'image/vnd.adobe.photoshop' });
        const input = document.querySelector('[data-testid="main-file-input"]') || document.querySelector('input[type="file"]');
        if (!input) return { success: false, error: 'File input not found' };
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true };
      })()`,
    });
    console.log('[CDP] Upload dispatched result:', uploadRes?.result?.value);

    // Wait for document to load
    let loaded = false;
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const res = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('[data-canvas-stage="true"]'))`,
        returnByValue: true,
      });
      if (res?.result?.value) {
        loaded = true;
        break;
      }
    }

    if (!loaded) throw new Error('Document stage did not load within 10 seconds');
    console.log('[CDP] Document loaded successfully! Inspecting stage and layout metrics...');

    await new Promise((r) => setTimeout(r, 1200));

    // Capture screenshot 1: Loaded Canvas
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'psd_5400x3600_01_loaded_canvas.png'), Buffer.from(ss1.data, 'base64'));
    console.log('[CDP] Saved psd_5400x3600_01_loaded_canvas.png');

    // Evaluate comprehensive DOM and layout metrics
    const metrics = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        try {
          const stage = document.querySelector('[data-canvas-stage="true"]');
          if (!stage) return { error: 'Stage element not found' };
          const docVp = document.querySelector('[data-document-viewport="true"]') || stage.firstElementChild;
          const viewport = document.querySelector('[class*="canvasViewport"]') || stage.parentElement;
          const stageCs = window.getComputedStyle(stage);
          const stageRect = stage.getBoundingClientRect();
          const vpRect = viewport ? viewport.getBoundingClientRect() : { width: 0, height: 0 };
          const docVpRect = docVp ? docVp.getBoundingClientRect() : { width: 0, height: 0, left: 0, top: 0 };

          // Layers in layers panel
          const layerItems = Array.from(document.querySelectorAll('[data-testid^="layer-item-"], [class*="layerRow"]'));
          const layerItemTexts = layerItems.map(el => (el.textContent || '').trim());

          // Layers on canvas stage
          const canvasLayers = Array.from(document.querySelectorAll('[data-layer-id]')).map(el => {
            const r = el.getBoundingClientRect();
            const cs = window.getComputedStyle(el);
            return {
              id: el.getAttribute('data-layer-id'),
              type: el.getAttribute('data-layer-type'),
              selected: el.getAttribute('data-layer-selected'),
              styleLeft: el.style.left,
              styleTop: el.style.top,
              styleWidth: el.style.width,
              styleHeight: el.style.height,
              styleOpacity: el.style.opacity,
              styleMixBlendMode: el.style.mixBlendMode,
              rectLeft: Math.round(r.left),
              rectTop: Math.round(r.top),
              rectWidth: Math.round(r.width),
              rectHeight: Math.round(r.height),
            };
          });

          // Status bar info
          const statusEl = document.querySelector('[class*="statusBar"], [class*="bottomBar"]');
          const statusText = statusEl ? (statusEl.textContent || '').trim() : '';

          return {
            stage: {
              inlineWidth: stage.style.width,
              inlineHeight: stage.style.height,
              inlineMinWidth: stage.style.minWidth,
              inlineMinHeight: stage.style.minHeight,
              inlineFlexShrink: stage.style.flexShrink,
              computedWidth: stageCs.width,
              computedHeight: stageCs.height,
              computedFlexShrink: stageCs.flexShrink,
              transform: stage.style.transform,
              rectWidth: Math.round(stageRect.width),
              rectHeight: Math.round(stageRect.height),
              rectLeft: Math.round(stageRect.left),
              rectTop: Math.round(stageRect.top),
              aspectRatio: +(stageRect.width / (stageRect.height || 1)).toFixed(3),
            },
            viewport: {
              width: Math.round(vpRect.width),
              height: Math.round(vpRect.height),
            },
            docViewport: {
              rectWidth: Math.round(docVpRect.width),
              rectHeight: Math.round(docVpRect.height),
              rectLeft: Math.round(docVpRect.left),
              rectTop: Math.round(docVpRect.top),
            },
            statusText,
            layersPanelCount: layerItems.length,
            layerItemTexts: layerItemTexts.slice(0, 10),
            canvasLayersCount: canvasLayers.length,
            canvasLayers,
          };
        } catch (e) {
          return { error: e.message, stack: e.stack };
        }
      })()`,
    });

    if (metrics.result?.value?.error) {
      console.error('[CDP] Metrics evaluation returned error:', metrics.result.value);
      throw new Error(metrics.result.value.error);
    }
    if (!metrics.result?.value) {
      console.error('[CDP] Metrics evaluation failed completely:', metrics);
      throw new Error('metrics.result.value is undefined');
    }

    console.log('[CDP] Evaluated stage layout metrics:', JSON.stringify(metrics.result.value.stage, null, 2));
    console.log('[CDP] Total canvas layers rendered:', metrics.result.value.canvasLayersCount);

    // Click on Title Text layer to test transform overlay alignment
    console.log('[CDP] Selecting Title Text layer to verify transform overlay alignment...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textLayerEl = Array.from(document.querySelectorAll('[data-layer-id]')).find(el => {
          return el.textContent && el.textContent.includes('MASTER CREATIVE SUITE');
        });
        if (textLayerEl) {
          textLayerEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return { found: true, id: textLayerEl.getAttribute('data-layer-id') };
        }
        return { found: false };
      })()`,
    });

    await new Promise((r) => setTimeout(r, 600));

    // Capture screenshot 2: Selected Layer with Transform Box
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'psd_5400x3600_02_layer_selection_transform.png'), Buffer.from(ss2.data, 'base64'));
    console.log('[CDP] Saved psd_5400x3600_02_layer_selection_transform.png');

    // Evaluate transform box alignment
    const transformMetrics = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const selectedLayer = document.querySelector('[data-layer-selected="true"]');
        const transformBox = document.querySelector('[data-transform-box="true"]');
        if (!selectedLayer || !transformBox) return { aligned: false, reason: 'Element missing' };

        const layerRect = selectedLayer.getBoundingClientRect();
        const boxRect = transformBox.getBoundingClientRect();
        const diffX = Math.abs(layerRect.left - boxRect.left);
        const diffY = Math.abs(layerRect.top - boxRect.top);
        const diffW = Math.abs(layerRect.width - boxRect.width);
        const diffH = Math.abs(layerRect.height - boxRect.height);

        const handles = Array.from(transformBox.querySelectorAll('[class*="layerHandle"]')).map(h => ({
          pos: h.getAttribute('data-handle-pos'),
          rect: h.getBoundingClientRect(),
        }));

        return {
          aligned: diffX <= 2 && diffY <= 2 && diffW <= 2 && diffH <= 2,
          diffX, diffY, diffW, diffH,
          layerRect: {
            left: Math.round(layerRect.left),
            top: Math.round(layerRect.top),
            width: Math.round(layerRect.width),
            height: Math.round(layerRect.height),
          },
          boxRect: {
            left: Math.round(boxRect.left),
            top: Math.round(boxRect.top),
            width: Math.round(boxRect.width),
            height: Math.round(boxRect.height),
          },
          handlesCount: handles.length,
        };
      })()`,
    });

    console.log('[CDP] Transform overlay alignment:', JSON.stringify(transformMetrics.result.value, null, 2));

    // Capture screenshot 3: Zoom In Detail
    console.log('[CDP] Testing zoom in to 50%...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const zoomInput = document.querySelector('input[aria-label*="zoom" i], input[type="number"]');
        // Or dispatch keyboard event / zoom function
        const event = new WheelEvent('wheel', { deltaY: -200, ctrlKey: true, bubbles: true });
        const vp = document.querySelector('[class*="canvasViewport"]');
        if (vp) vp.dispatchEvent(event);
      })()`,
    });

    await new Promise((r) => setTimeout(r, 600));

    const ss3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'psd_5400x3600_03_zoom_detail.png'), Buffer.from(ss3.data, 'base64'));
    console.log('[CDP] Saved psd_5400x3600_03_zoom_detail.png');

    // Screenshot 4: Layers Panel inspection
    const ss4 = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 1250, y: 80, width: 350, height: 850, scale: 1 },
    });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'psd_5400x3600_04_layers_panel.png'), Buffer.from(ss4.data, 'base64'));
    console.log('[CDP] Saved psd_5400x3600_04_layers_panel.png');

    const resultSummary = {
      timestamp: new Date().toISOString(),
      psdDimensions: { width: 5400, height: 3600 },
      stageLayout: metrics.result.value.stage,
      aspectRatioExpected: 1.5,
      aspectRatioActual: metrics.result.value.stage.aspectRatio,
      flexShrink: metrics.result.value.stage.computedFlexShrink,
      narrowStripBugEliminated: metrics.result.value.stage.rectWidth >= 700,
      totalLayersImported: metrics.result.value.canvasLayersCount,
      all9LayersImported: metrics.result.value.canvasLayersCount === 9,
      transformOverlayAligned: transformMetrics.result.value.aligned,
      transformDiffs: {
        diffX: transformMetrics.result.value.diffX,
        diffY: transformMetrics.result.value.diffY,
        diffW: transformMetrics.result.value.diffW,
        diffH: transformMetrics.result.value.diffH,
      },
      layers: metrics.result.value.canvasLayers,
    };

    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'psd_5400x3600_verification.json'),
      JSON.stringify(resultSummary, null, 2)
    );
    console.log('[CDP] Saved verification JSON results successfully!');

    edgeProc.kill();
    process.exit(0);
  } catch (err) {
    console.error('[CDP] Verification failed:', err);
    edgeProc.kill();
    process.exit(1);
  }
}

run();
