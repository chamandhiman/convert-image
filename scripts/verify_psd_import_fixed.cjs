const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { writePsdUint8Array, initializeCanvas, readPsd } = require('ag-psd');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9814;
const previewUrl = 'http://127.0.0.1:4173';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-psd-verify-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Setup canvas mock for ag-psd in Node.js
initializeCanvas((w, h) => {
  const width = Math.max(1, Math.round(w || 1));
  const height = Math.max(1, Math.round(h || 1));
  return {
    width,
    height,
    getContext: () => ({
      createImageData: (iw, ih) => ({ width: iw, height: ih, data: new Uint8ClampedArray(iw * ih * 4) }),
      putImageData: () => { },
      drawImage: () => { },
      fillRect: () => { },
      clearRect: () => { },
    }),
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };
});

// Helper to create dummy canvas with real dimensions
function createMockCanvas(w, h) {
  return {
    width: w,
    height: h,
    getContext: () => ({
      createImageData: (iw, ih) => ({ width: iw, height: ih, data: new Uint8ClampedArray(iw * ih * 4) }),
      getImageData: (sx, sy, sw, sh) => ({ width: sw, height: sh, data: new Uint8ClampedArray(sw * sh * 4) }),
      putImageData: () => { },
      drawImage: () => { },
      fillRect: () => { },
      clearRect: () => { },
    }),
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };
}

async function runTests() {
  console.log('=== STEP 1: GENERATE 8 REAL PHOTOSHOP PSD TEST FIXTURES ===');
  const fixturesDir = path.join(__dirname, '..', 'public', 'psd-test-fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // 1. 500 x 500 PSD
  const psd1 = {
    width: 500,
    height: 500,
    resolutionInfo: { horizontalResolution: 72, horizontalResolutionUnit: 1 },
    children: [
      {
        name: 'Background',
        top: 0,
        left: 0,
        bottom: 500,
        right: 500,
        opacity: 1,
        canvas: createMockCanvas(500, 500),
      },
      {
        name: 'Center Card',
        top: 100,
        left: 100,
        bottom: 400,
        right: 400,
        opacity: 0.9,
        canvas: createMockCanvas(300, 300),
      },
    ],
  };
  const psd1Bytes = writePsdUint8Array(psd1);
  const p1Path = path.join(fixturesDir, 'test_1_500x500.psd');
  fs.writeFileSync(p1Path, psd1Bytes);
  console.log('✓ Generated test_1_500x500.psd:', psd1Bytes.length, 'bytes');

  // 2. 1920 x 1080 PSD
  const psd2 = {
    width: 1920,
    height: 1080,
    resolutionInfo: { horizontalResolution: 72, horizontalResolutionUnit: 1 },
    children: [
      {
        name: 'Background',
        top: 0,
        left: 0,
        bottom: 1080,
        right: 1920,
        opacity: 1,
        canvas: createMockCanvas(1920, 1080),
      },
      {
        name: 'Banner Layer',
        top: 200,
        left: 300,
        bottom: 600,
        right: 1620,
        opacity: 0.85,
        canvas: createMockCanvas(1320, 400),
      },
    ],
  };
  const psd2Bytes = writePsdUint8Array(psd2);
  const p2Path = path.join(fixturesDir, 'test_2_1920x1080.psd');
  fs.writeFileSync(p2Path, psd2Bytes);
  console.log('✓ Generated test_2_1920x1080.psd:', psd2Bytes.length, 'bytes');

  // 3. 3000 x 3000 PSD
  const psd3 = {
    width: 3000,
    height: 3000,
    resolutionInfo: { horizontalResolution: 300, horizontalResolutionUnit: 1 },
    children: [
      {
        name: 'Background',
        top: 0,
        left: 0,
        bottom: 3000,
        right: 3000,
        opacity: 1,
        canvas: createMockCanvas(3000, 3000),
      },
      {
        name: 'High-Res Artwork',
        top: 500,
        left: 500,
        bottom: 2500,
        right: 2500,
        opacity: 1,
        canvas: createMockCanvas(2000, 2000),
      },
    ],
  };
  const psd3Bytes = writePsdUint8Array(psd3);
  const p3Path = path.join(fixturesDir, 'test_3_3000x3000.psd');
  fs.writeFileSync(p3Path, psd3Bytes);
  console.log('✓ Generated test_3_3000x3000.psd:', psd3Bytes.length, 'bytes');

  // 4. Centered small logo (200x200 inside 1920x1080)
  // Center of 1920: (1920-200)/2 = 860; Center of 1080: (1080-200)/2 = 440
  const psd4 = {
    width: 1920,
    height: 1080,
    resolutionInfo: { horizontalResolution: 72, horizontalResolutionUnit: 1 },
    children: [
      {
        name: 'Background',
        top: 0,
        left: 0,
        bottom: 1080,
        right: 1920,
        opacity: 1,
        canvas: createMockCanvas(1920, 1080),
      },
      {
        name: 'Brand Logo',
        top: 440,
        left: 860,
        bottom: 640,
        right: 1060,
        opacity: 1,
        canvas: createMockCanvas(200, 200),
      },
    ],
  };
  const psd4Bytes = writePsdUint8Array(psd4);
  const p4Path = path.join(fixturesDir, 'test_4_centered_logo.psd');
  fs.writeFileSync(p4Path, psd4Bytes);
  console.log('✓ Generated test_4_centered_logo.psd:', psd4Bytes.length, 'bytes');

  // 5. Layers positioned near edges (Top bar 0,0, Bottom bar 0,950, Left badge 10,500)
  const psd5 = {
    width: 1000,
    height: 1000,
    resolutionInfo: { horizontalResolution: 72, horizontalResolutionUnit: 1 },
    children: [
      {
        name: 'Background',
        top: 0,
        left: 0,
        bottom: 1000,
        right: 1000,
        opacity: 1,
        canvas: createMockCanvas(1000, 1000),
      },
      {
        name: 'Top Nav Bar',
        top: 0,
        left: 0,
        bottom: 60,
        right: 1000,
        opacity: 1,
        canvas: createMockCanvas(1000, 60),
      },
      {
        name: 'Bottom Footer Bar',
        top: 940,
        left: 0,
        bottom: 1000,
        right: 1000,
        opacity: 1,
        canvas: createMockCanvas(1000, 60),
      },
      {
        name: 'Left Edge Badge',
        top: 460,
        left: 10,
        bottom: 540,
        right: 90,
        opacity: 1,
        canvas: createMockCanvas(80, 80),
      },
    ],
  };
  const psd5Bytes = writePsdUint8Array(psd5);
  const p5Path = path.join(fixturesDir, 'test_5_edge_layers.psd');
  fs.writeFileSync(p5Path, psd5Bytes);
  console.log('✓ Generated test_5_edge_layers.psd:', psd5Bytes.length, 'bytes');

  // 6. Layers partially outside document (X: -100, Y: -50, W: 400, H: 300)
  const psd6 = {
    width: 1200,
    height: 800,
    resolutionInfo: { horizontalResolution: 72, horizontalResolutionUnit: 1 },
    children: [
      {
        name: 'Background',
        top: 0,
        left: 0,
        bottom: 800,
        right: 1200,
        opacity: 1,
        canvas: createMockCanvas(1200, 800),
      },
      {
        name: 'Bleed Outside Element',
        top: -50,
        left: -100,
        bottom: 250,
        right: 300,
        opacity: 0.9,
        canvas: createMockCanvas(400, 300),
      },
    ],
  };
  const psd6Bytes = writePsdUint8Array(psd6);
  const p6Path = path.join(fixturesDir, 'test_6_outside_layers.psd');
  fs.writeFileSync(p6Path, psd6Bytes);
  console.log('✓ Generated test_6_outside_layers.psd:', psd6Bytes.length, 'bytes');

  // 7. Multiple groups and layers
  const psd7 = {
    width: 1280,
    height: 720,
    resolutionInfo: { horizontalResolution: 72, horizontalResolutionUnit: 1 },
    children: [
      {
        name: 'Background',
        top: 0,
        left: 0,
        bottom: 720,
        right: 1280,
        opacity: 1,
        canvas: createMockCanvas(1280, 720),
      },
      {
        name: 'Header Group',
        opened: true,
        children: [
          {
            name: 'Logo Icon',
            top: 20,
            left: 40,
            bottom: 80,
            right: 100,
            opacity: 1,
            canvas: createMockCanvas(60, 60),
          },
          {
            name: 'Navigation Bar',
            top: 25,
            left: 200,
            bottom: 75,
            right: 1200,
            opacity: 0.95,
            canvas: createMockCanvas(1000, 50),
          },
        ],
      },
      {
        name: 'Content Group',
        opened: true,
        children: [
          {
            name: 'Hero Graphic',
            top: 150,
            left: 100,
            bottom: 550,
            right: 600,
            opacity: 1,
            canvas: createMockCanvas(500, 400),
          },
          {
            name: 'Feature Card',
            top: 200,
            left: 700,
            bottom: 500,
            right: 1180,
            opacity: 0.9,
            canvas: createMockCanvas(480, 300),
          },
        ],
      },
    ],
  };
  const psd7Bytes = writePsdUint8Array(psd7);
  const p7Path = path.join(fixturesDir, 'test_7_groups_hierarchy.psd');
  fs.writeFileSync(p7Path, psd7Bytes);
  console.log('✓ Generated test_7_groups_hierarchy.psd:', psd7Bytes.length, 'bytes');

  // 8. Transparent background (No background layer, only floating layers)
  const psd8 = {
    width: 800,
    height: 800,
    resolutionInfo: { horizontalResolution: 72, horizontalResolutionUnit: 1 },
    children: [
      {
        name: 'Floating Sticker',
        top: 150,
        left: 150,
        bottom: 650,
        right: 650,
        opacity: 1,
        blendMode: 'normal',
        canvas: createMockCanvas(500, 500),
      },
    ],
  };
  const psd8Bytes = writePsdUint8Array(psd8);
  const p8Path = path.join(fixturesDir, 'test_8_transparent_bg.psd');
  fs.writeFileSync(p8Path, psd8Bytes);
  console.log('✓ Generated test_8_transparent_bg.psd:', psd8Bytes.length, 'bytes');

  console.log('\n=== STEP 2: UNIT VERIFICATION OF PSD PARSER & DOCUMENT MODEL ===');
  const { parsePsdFile, createPsdDocumentModel } = await import('../src/pages/EditImagePage/utils/psdImporter.js');

  const testCases = [
    { name: '1. 500x500 PSD', file: p1Path, expW: 500, expH: 500, expLayers: 2, expTransp: false },
    { name: '2. 1920x1080 PSD', file: p2Path, expW: 1920, expH: 1080, expLayers: 2, expTransp: false },
    { name: '3. 3000x3000 PSD (300 DPI)', file: p3Path, expW: 3000, expH: 3000, expLayers: 2, expTransp: false, expDpi: 300 },
    { name: '4. Centered Small Logo', file: p4Path, expW: 1920, expH: 1080, expLayers: 2, expTransp: false, checkLayer: { idx: 1, x: 860, y: 440, w: 200, h: 200 } },
    { name: '5. Edge Layers', file: p5Path, expW: 1000, expH: 1000, expLayers: 4, expTransp: false, checkLayer: { idx: 3, x: 10, y: 460, w: 80, h: 80 } },
    { name: '6. Out-of-bounds Layer', file: p6Path, expW: 1200, expH: 800, expLayers: 2, expTransp: false, checkLayer: { idx: 1, x: -100, y: -50, w: 400, h: 300 } },
    { name: '7. Groups & Hierarchy', file: p7Path, expW: 1280, expH: 720, expLayers: 5, expTransp: false },
    { name: '8. Transparent Background', file: p8Path, expW: 800, expH: 800, expLayers: 1, expTransp: true },
  ];

  const unitResults = [];
  for (const tc of testCases) {
    const buf = fs.readFileSync(tc.file);
    const parsed = await parsePsdFile(buf.buffer, { name: path.basename(tc.file) });
    const docModel = createPsdDocumentModel(parsed, (w, h) => 0.5);

    const passDims = docModel.width === tc.expW && docModel.height === tc.expH;
    const passLayers = docModel.layers.length === tc.expLayers;
    const passTransp = docModel.isTransparent === tc.expTransp;
    let passLayerCheck = true;
    if (tc.checkLayer) {
      const l = docModel.layers[tc.checkLayer.idx];
      passLayerCheck = l.x === tc.checkLayer.x && l.y === tc.checkLayer.y && l.width === tc.checkLayer.w && l.height === tc.checkLayer.h;
    }

    const allPassed = passDims && passLayers && passTransp && passLayerCheck;
    console.log(`[Unit Test] ${tc.name}: ${allPassed ? 'PASS' : 'FAIL'} (Doc: ${docModel.width}x${docModel.height}, Layers: ${docModel.layers.length}, Transp: ${docModel.isTransparent})`);
    if (!allPassed) {
      console.error('Mismatch details:', { passDims, passLayers, passTransp, passLayerCheck });
    }
    unitResults.push({ name: tc.name, allPassed, docModel: { width: docModel.width, height: docModel.height, layers: docModel.layers.length, isTransparent: docModel.isTransparent } });
  }

  console.log('\n=== STEP 3: BROWSER CDP VERIFICATION IN ACTIVE RUNNING EDITOR ===');
  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--guest',
    `--user-data-dir=${tmpProfile}`,
    `${previewUrl}/edit-image`,
  ]);

  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page');
        if (found) { pageTarget = found; break; }
      }
    } catch { }
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = msgId++;
    const handler = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });

  await sleep(1500);

  // Test loading test_4_centered_logo.psd via browser UI
  console.log('Testing 1920x1080 PSD with centered logo in Browser UI...');
  const fixtureBase64 = psd4Bytes.toString('base64');

  const browserRes = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          const b64 = "${fixtureBase64}";
          const binaryStr = atob(b64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const buf = bytes.buffer;
          
          const openCard = document.querySelector('[data-testid="welcome-card-open-psd"]');
          if (openCard) openCard.click();
          await new Promise(r => setTimeout(r, 600));

          const fileInput = document.querySelector('[data-testid="psd-file-input"]');
          const file = new File([buf], 'Brand-Centered-Logo-1920x1080.psd', { type: 'image/vnd.adobe.photoshop' });
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));

          // Wait for parse & modal summary
          for (let i = 0; i < 40; i++) {
            await new Promise(r => setTimeout(r, 200));
            const confirmBtn = document.querySelector('[data-testid="psd-confirm-import-btn"], [data-testid="psd-confirm-btn"]');
            if (confirmBtn) {
              confirmBtn.click();
              break;
            }
          }
          await new Promise(r => setTimeout(r, 1500));

          const stage = document.querySelector('[data-canvas-stage="true"]');
          const docVp = document.querySelector('[data-document-viewport="true"]');
          const transformBoxes = Array.from(document.querySelectorAll('[data-transform-box="true"]')).map(b => ({
            id: b.getAttribute('data-testid'),
            style: {
              left: b.style.left,
              top: b.style.top,
              width: b.style.width,
              height: b.style.height
            }
          }));

          const layerNodes = Array.from(document.querySelectorAll('[data-layer-id]')).map(l => ({
            id: l.getAttribute('data-layer-id'),
            style: {
              left: l.style.left,
              top: l.style.top,
              width: l.style.width,
              height: l.style.height
            }
          }));

          return {
            success: true,
            stageStyle: {
              width: stage?.style.width,
              height: stage?.style.height,
              transform: stage?.style.transform
            },
            docVpStyle: {
              width: docVp?.style.width,
              height: docVp?.style.height,
              backgroundColor: docVp?.style.backgroundColor,
              overflow: window.getComputedStyle(docVp).overflow
            },
            layerNodes,
            transformBoxes
          };
        } catch (err) {
          return { error: err.message };
        }
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });

  console.log('Browser evaluation result:\n', JSON.stringify(browserRes.result.value, null, 2));

  // Capture screenshot of imported 1920x1080 PSD with centered logo
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const shot1Path = path.join(outDir, 'psd_import_01_1920x1080_centered_logo.png');
  fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
  console.log('✓ Captured screenshot:', shot1Path);

  // Now test loading test_8_transparent_bg.psd to verify transparent checkerboard canvas
  console.log('Testing Transparent PSD in Browser UI...');
  const transpBase64 = psd8Bytes.toString('base64');
  const browserTranspRes = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          const b64 = "${transpBase64}";
          const binaryStr = atob(b64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const buf = bytes.buffer;

          // Open PSD file input in File menu or Welcome Screen
          const fileInput = document.querySelector('[data-testid="psd-file-input"]') || document.querySelector('input[type="file"]');
          const file = new File([buf], 'Transparent-Floating-Sticker-800x800.psd', { type: 'image/vnd.adobe.photoshop' });
          
          // Open PSD modal if available
          const openCard = document.querySelector('[data-testid="welcome-card-open-psd"]');
          if (openCard) {
            openCard.click();
            await new Promise(r => setTimeout(r, 400));
          }

          const psdInput = document.querySelector('[data-testid="psd-file-input"]');
          if (psdInput) {
            const dt = new DataTransfer();
            dt.items.add(file);
            psdInput.files = dt.files;
            psdInput.dispatchEvent(new Event('change', { bubbles: true }));

            for (let i = 0; i < 40; i++) {
              await new Promise(r => setTimeout(r, 200));
              const confirmBtn = document.querySelector('[data-testid="psd-confirm-import-btn"], [data-testid="psd-confirm-btn"]');
              if (confirmBtn) {
                confirmBtn.click();
                break;
              }
            }
          }
          await new Promise(r => setTimeout(r, 1500));

          const docVp = document.querySelector('[data-document-viewport="true"]');
          return {
            stageWidth: document.querySelector('[data-canvas-stage="true"]')?.style.width,
            stageHeight: document.querySelector('[data-canvas-stage="true"]')?.style.height,
            backgroundColor: docVp?.style.backgroundColor,
            backgroundImage: docVp?.style.backgroundImage,
          };
        } catch (err) {
          return { error: err.message };
        }
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });

  console.log('Transparent PSD browser result:\n', JSON.stringify(browserTranspRes.result.value, null, 2));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const shot2Path = path.join(outDir, 'psd_import_02_transparent_checkerboard.png');
  fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
  console.log('✓ Captured screenshot:', shot2Path);

  // Now test loading test_6_outside_layers.psd to verify out-of-bounds layer coordinates
  console.log('Testing Out-of-bounds Layer PSD in Browser UI...');
  const outsideBase64 = psd6Bytes.toString('base64');
  const browserOutsideRes = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          const b64 = "${outsideBase64}";
          const binaryStr = atob(b64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const buf = bytes.buffer;

          const openCard = document.querySelector('[data-testid="welcome-card-open-psd"]');
          if (openCard) {
            openCard.click();
            await new Promise(r => setTimeout(r, 400));
          }

          const psdInput = document.querySelector('[data-testid="psd-file-input"]');
          if (psdInput) {
            const file = new File([buf], 'Bleed-Outside-Element-1200x800.psd', { type: 'image/vnd.adobe.photoshop' });
            const dt = new DataTransfer();
            dt.items.add(file);
            psdInput.files = dt.files;
            psdInput.dispatchEvent(new Event('change', { bubbles: true }));

            for (let i = 0; i < 40; i++) {
              await new Promise(r => setTimeout(r, 200));
              const confirmBtn = document.querySelector('[data-testid="psd-confirm-import-btn"], [data-testid="psd-confirm-btn"]');
              if (confirmBtn) {
                confirmBtn.click();
                break;
              }
            }
          }
          await new Promise(r => setTimeout(r, 1500));

          const layerNodes = Array.from(document.querySelectorAll('[data-layer-id]')).map(l => ({
            id: l.getAttribute('data-layer-id'),
            left: l.style.left,
            top: l.style.top,
            width: l.style.width,
            height: l.style.height
          }));

          return {
            stageWidth: document.querySelector('[data-canvas-stage="true"]')?.style.width,
            stageHeight: document.querySelector('[data-canvas-stage="true"]')?.style.height,
            layerNodes
          };
        } catch (err) {
          return { error: err.message };
        }
      })()
    `,
    returnByValue: true,
    awaitPromise: true,
  });

  console.log('Outside layers browser result:\n', JSON.stringify(browserOutsideRes.result.value, null, 2));

  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  const shot3Path = path.join(outDir, 'psd_import_03_outside_layers.png');
  fs.writeFileSync(shot3Path, Buffer.from(shot3.data, 'base64'));
  console.log('✓ Captured screenshot:', shot3Path);

  ws.close();
  edge.kill();

  const finalReport = {
    timestamp: new Date().toISOString(),
    unitResults,
    browserCenteredLogo: browserRes.result.value,
    browserTransparent: browserTranspRes.result.value,
    browserOutside: browserOutsideRes.result.value,
  };

  fs.writeFileSync(path.join(outDir, 'psd_import_verification.json'), JSON.stringify(finalReport, null, 2));
  console.log('\n✓ Saved complete verification report to psd_import_verification.json');
}

runTests().catch(console.error);