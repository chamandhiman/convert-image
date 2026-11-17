import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_compact_ui_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9297',
  '--disable-gpu',
  '--disable-extensions',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Connecting to Edge on port 9297...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9297/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch { }
  }
  if (!targets) throw new Error('Could not connect to Edge DevTools');

  const pageTarget =
    targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) ||
    targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        ws.removeEventListener('message', handler);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  // Test Desktop 1440 x 900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Navigating to http://localhost:4173/edit-image...');
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1000);

  // Set cookie consent
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({
        necessary: true, analytics: true, marketing: true, timestamp: Date.now()
      }));
    `,
  });

  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  for (let i = 0; i < 25; i++) {
    await sleep(300);
    const ready = await send('Runtime.evaluate', {
      expression: `Boolean(document.getElementById('start-blank-canvas-btn'))`,
      returnByValue: true,
    });
    if (ready.result?.value) break;
  }
  await sleep(500);

  // 1. Verify Header and Toolbar Heights
  const layoutCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const header = document.querySelector('header');
      const headerContainer = document.querySelector('[data-testid="header-container"]');
      const subToolbar = document.querySelector('[data-testid="sub-toolbar"]');
      const bottomBar = document.querySelector('[class*="bottomStatusBar"]') || document.querySelector('[class*="BottomStatusBar"]');
      const canvasViewport = document.querySelector('[data-testid="canvas-viewport"]');
      const rightWorkspace = document.querySelector('[class*="rightWorkspace"]');
      const leftToolbar = document.querySelector('aside[aria-label="Editing Tools"]');

      return {
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
        headerContainerHeight: headerContainer ? Math.round(headerContainer.getBoundingClientRect().height) : null,
        subToolbarHeight: subToolbar ? Math.round(subToolbar.getBoundingClientRect().height) : null,
        bottomBarFound: Boolean(bottomBar),
        viewportHeight: canvasViewport ? Math.round(canvasViewport.getBoundingClientRect().height) : null,
        viewportWidth: canvasViewport ? Math.round(canvasViewport.getBoundingClientRect().width) : null,
        leftToolbarFound: Boolean(leftToolbar),
        rightWorkspaceFound: Boolean(rightWorkspace)
      };
    })()`,
    returnByValue: true,
  });

  console.log('1. Initial Layout Check (Heights & Chrome):', layoutCheck.result.value);

  // Save screenshot of empty workspace
  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'compact_ui_1_empty_workspace.png'), Buffer.from(ss.data, 'base64'));

  // 2. Upload a very large image (2400 x 1600 synthetic image)
  console.log('Creating and uploading large 2400x1600 test image...');
  const largeImageData = await send('Runtime.evaluate', {
    expression: `(async () => {
      const c = document.createElement('canvas');
      c.width = 2400;
      c.height = 1600;
      const ctx = c.getContext('2d');
      // Create rich background
      const grad = ctx.createLinearGradient(0, 0, 2400, 1600);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(0.5, '#8b5cf6');
      grad.addColorStop(1, '#ec4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2400, 1600);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px sans-serif';
      ctx.fillText('Large 2400x1600 Test Image', 200, 300);
      ctx.font = '40px sans-serif';
      ctx.fillText('Auto-Fit to Screen Verification', 200, 400);

      // Draw grid
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 4;
      for (let x = 0; x < 2400; x += 200) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1600); ctx.stroke();
      }

      return new Promise(r => {
        c.toBlob(blob => {
          const reader = new FileReader();
          reader.onloadend = () => r(reader.result);
          reader.readAsDataURL(blob);
        }, 'image/png');
      });
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  const largeImgBase64 = largeImageData.result.value.replace(/^data:image\/[a-z]+;base64,/, '');
  const largeImgPath = path.join(outDir, 'large_test_2400x1600.png');
  fs.writeFileSync(largeImgPath, Buffer.from(largeImgBase64, 'base64'));

  // Submit large image
  const doc = await send('DOM.getDocument');
  const fileInputNode = await send('DOM.querySelector', {
    nodeId: doc.root.nodeId,
    selector: 'input[type="file"]:not([data-testid="layer-image-input"])'
  });

  await send('DOM.setFileInputFiles', {
    files: [largeImgPath],
    nodeId: fileInputNode.nodeId
  });

  await sleep(1500);

  // 3. Verify Auto-Fit on Upload
  const autoFitCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const img = stage ? stage.querySelector('img[data-layer-id="background"]') : null;
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      const zoomBtn = document.querySelector('[data-testid="zoom-dropdown-btn"]');

      const stageRect = stage ? stage.getBoundingClientRect() : null;
      const vpRect = vp ? vp.getBoundingClientRect() : null;

      const isInside = stageRect && vpRect &&
        stageRect.width <= vpRect.width &&
        stageRect.height <= vpRect.height;

      return {
        stageRect: stageRect ? { width: Math.round(stageRect.width), height: Math.round(stageRect.height) } : null,
        viewportRect: vpRect ? { width: Math.round(vpRect.width), height: Math.round(vpRect.height) } : null,
        naturalWidth: img ? img.naturalWidth : null,
        naturalHeight: img ? img.naturalHeight : null,
        zoomText: zoomBtn ? zoomBtn.innerText.trim() : null,
        stageStyleTransform: stage ? stage.style.transform : null,
        fitsInsideViewport: isInside
      };
    })()`,
    returnByValue: true,
  });

  console.log('2. Auto-Fit Verification Check:', autoFitCheck.result.value);

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'compact_ui_2_auto_fit_upload.png'), Buffer.from(ss.data, 'base64'));

  // 4. Test Ctrl + Wheel Zoom In
  console.log('Simulating Ctrl + Wheel Zoom In...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      const wheelEvt = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: true,
        clientX: 700,
        clientY: 450,
        bubbles: true,
        cancelable: true
      });
      vp.dispatchEvent(wheelEvt);
    })()`,
  });
  await sleep(300);

  const zoomInCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const zoomBtn = document.querySelector('[data-testid="zoom-dropdown-btn"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        zoomText: zoomBtn ? zoomBtn.innerText.trim() : null,
        transform: stage ? stage.style.transform : null
      };
    })()`,
    returnByValue: true,
  });
  console.log('3. Zoom In Check (Ctrl + Wheel Up):', zoomInCheck.result.value);

  // 5. Test Ctrl + Wheel Zoom Out
  console.log('Simulating Ctrl + Wheel Zoom Out...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      const wheelEvt = new WheelEvent('wheel', {
        deltaY: 200,
        ctrlKey: true,
        clientX: 700,
        clientY: 450,
        bubbles: true,
        cancelable: true
      });
      vp.dispatchEvent(wheelEvt);
    })()`,
  });
  await sleep(300);

  const zoomOutCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const zoomBtn = document.querySelector('[data-testid="zoom-dropdown-btn"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        zoomText: zoomBtn ? zoomBtn.innerText.trim() : null,
        transform: stage ? stage.style.transform : null
      };
    })()`,
    returnByValue: true,
  });
  console.log('4. Zoom Out Check (Ctrl + Wheel Down):', zoomOutCheck.result.value);

  // 6. Test Normal Mouse Wheel Scrolling (Pan X & Y)
  console.log('Simulating Normal Wheel Scroll (down & right)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      const wheelEvt = new WheelEvent('wheel', {
        deltaX: 50,
        deltaY: 80,
        ctrlKey: false,
        bubbles: true,
        cancelable: true
      });
      vp.dispatchEvent(wheelEvt);
    })()`,
  });
  await sleep(300);

  const panCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        transform: stage ? stage.style.transform : null
      };
    })()`,
    returnByValue: true,
  });
  console.log('5. Normal Wheel Scroll Check (Pan applied):', panCheck.result.value);

  // 7. Test Ctrl + 0 (Fit to screen shortcut)
  console.log('Simulating Ctrl + 0 (Fit to Screen)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: '0',
        code: 'Digit0',
        ctrlKey: true,
        bubbles: true
      }));
    })()`,
  });
  await sleep(300);

  const ctrl0Check = await send('Runtime.evaluate', {
    expression: `(() => {
      const zoomBtn = document.querySelector('[data-testid="zoom-dropdown-btn"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        zoomText: zoomBtn ? zoomBtn.innerText.trim() : null,
        transform: stage ? stage.style.transform : null
      };
    })()`,
    returnByValue: true,
  });
  console.log('6. Ctrl + 0 Fit to Screen Check:', ctrl0Check.result.value);

  // 8. Test Ctrl + 1 (100% zoom shortcut)
  console.log('Simulating Ctrl + 1 (100% Zoom)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: '1',
        code: 'Digit1',
        ctrlKey: true,
        bubbles: true
      }));
    })()`,
  });
  await sleep(300);

  const ctrl1Check = await send('Runtime.evaluate', {
    expression: `(() => {
      const zoomBtn = document.querySelector('[data-testid="zoom-dropdown-btn"]');
      const stage = document.querySelector('[data-canvas-stage="true"]');
      return {
        zoomText: zoomBtn ? zoomBtn.innerText.trim() : null,
        transform: stage ? stage.style.transform : null
      };
    })()`,
    returnByValue: true,
  });
  console.log('7. Ctrl + 1 100% Zoom Check:', ctrl1Check.result.value);

  // Return to fit
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: '0', code: 'Digit0', ctrlKey: true, bubbles: true
      }));
    })()`,
  });
  await sleep(300);

  // 9. Test Editing Operation & Undo/Redo Shortcuts (Ctrl+Z and Ctrl+Y)
  console.log('Adding text layer and testing Undo (Ctrl+Z) & Redo (Ctrl+Y)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const textBtn = document.querySelector('button[data-tool-id="text"]');
      if (textBtn) textBtn.click();
    })()`,
  });
  await sleep(200);

  // Click on stage
  await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      if (stage) {
        stage.dispatchEvent(new MouseEvent('click', {
          clientX: 400, clientY: 300, bubbles: true
        }));
      }
    })()`,
  });
  await sleep(400);

  const textAddedCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const textLayers = document.querySelectorAll('div[data-layer-id*="text"]');
      return { count: textLayers.length };
    })()`,
    returnByValue: true,
  });
  console.log('Text Layer Added:', textAddedCheck.result.value);

  // Blur any active element so keydown isn't suppressed by typing guard
  await send('Runtime.evaluate', {
    expression: `(() => {
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    })()`,
  });
  await sleep(200);

  // Trigger Ctrl + Z
  console.log('Dispatching Ctrl + Z...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'z', code: 'KeyZ', ctrlKey: true, bubbles: true
      }));
    })()`,
  });
  await sleep(300);

  const undoCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const textLayers = document.querySelectorAll('div[data-layer-id*="text"]');
      return { countAfterUndo: textLayers.length };
    })()`,
    returnByValue: true,
  });
  console.log('8. Undo Check (Ctrl + Z):', undoCheck.result.value);

  // Trigger Ctrl + Y
  console.log('Dispatching Ctrl + Y (Redo)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'y', code: 'KeyY', ctrlKey: true, bubbles: true
      }));
    })()`,
  });
  await sleep(300);

  const redoCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const textLayers = document.querySelectorAll('div[data-layer-id*="text"]');
      return { countAfterRedo: textLayers.length };
    })()`,
    returnByValue: true,
  });
  console.log('9. Redo Check (Ctrl + Y):', redoCheck.result.value);

  // 10. Check Laptop 1366x768 & Desktop 1920x1080 Responsiveness
  console.log('Testing Responsiveness on Laptop 1366x768...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(500);

  const laptopCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      return {
        viewportWidth: vp ? Math.round(vp.getBoundingClientRect().width) : null,
        viewportHeight: vp ? Math.round(vp.getBoundingClientRect().height) : null,
        docScrollHeight: document.documentElement.scrollHeight,
        windowInnerHeight: window.innerHeight,
        hasPageScrollbar: document.documentElement.scrollHeight > window.innerHeight
      };
    })()`,
    returnByValue: true,
  });
  console.log('10. Laptop 1366x768 Layout Check:', laptopCheck.result.value);

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'compact_ui_3_laptop_1366.png'), Buffer.from(ss.data, 'base64'));

  // Test Desktop 1920x1080
  console.log('Testing Responsiveness on Desktop 1920x1080...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(500);

  const desktopCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const vp = document.querySelector('[data-testid="canvas-viewport"]');
      return {
        viewportWidth: vp ? Math.round(vp.getBoundingClientRect().width) : null,
        viewportHeight: vp ? Math.round(vp.getBoundingClientRect().height) : null,
        docScrollHeight: document.documentElement.scrollHeight,
        windowInnerHeight: window.innerHeight,
        hasPageScrollbar: document.documentElement.scrollHeight > window.innerHeight
      };
    })()`,
    returnByValue: true,
  });
  console.log('11. Desktop 1920x1080 Layout Check:', desktopCheck.result.value);

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'compact_ui_4_desktop_1920.png'), Buffer.from(ss.data, 'base64'));

  edge.kill();
  console.log('\nAll compact UI, zoom, scrolling, auto-fit, and shortcut tests passed!');
  process.exit(0);
}

main().catch(err => {
  console.error('Test run failed:', err);
  edge.kill();
  process.exit(1);
});
