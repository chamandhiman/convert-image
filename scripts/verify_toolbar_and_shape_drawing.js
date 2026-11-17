import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-shape-test-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9293',
  '--disable-gpu',
  '--disable-extensions',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-fre',
  `--user-data-dir=${tmpProfile}`,
  'http://localhost:4173/edit-image'
]);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Connecting to Edge on port 9293...');
  let targets = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch('http://127.0.0.1:9293/json/list');
      if (res.ok) {
        targets = await res.json();
        if (targets && targets.length) break;
      }
    } catch {}
  }
  if (!targets || !targets.length) {
    throw new Error('Failed to connect to Edge DevTools');
  }

  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:4173')) || targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  ws.addEventListener('message', (e) => {
    try {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('BROWSER EXCEPTION:', JSON.stringify(d.params.exceptionDetails));
      }
    } catch {}
  });

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const timer = setTimeout(() => {
      ws.removeEventListener('message', handler);
      reject(new Error(`Timeout waiting for CDP method: ${method} (id=${curId})`));
    }, 10000);
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        clearTimeout(timer);
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

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
    });
    return res.result ? res.result.value : null;
  };

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1500);

  // Seed cookie consent
  await evalJs(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.reload');
  await sleep(1800);

  const report = {};

  // Step 1: Open Setup Modal and Create 1080x1080 Canvas
  console.log('Step 1: Open Setup Modal and Create 1080x1080 Canvas');
  for (let i = 0; i < 20; i++) {
    const ready = await evalJs(`Boolean(document.getElementById('start-blank-canvas-btn'))`);
    if (ready) break;
    await sleep(300);
  }

  await evalJs(`document.getElementById('start-blank-canvas-btn')?.click()`);
  await sleep(600);

  for (let i = 0; i < 20; i++) {
    const modalReady = await evalJs(`Boolean(document.getElementById('confirm-create-canvas-btn'))`);
    if (modalReady) break;
    await sleep(300);
  }

  await evalJs(`(() => {
    const presetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('1080 × 1080'));
    if (presetBtn) presetBtn.click();
    const confirmBtn = document.getElementById('confirm-create-canvas-btn');
    if (confirmBtn) confirmBtn.click();
  })()`);
  await sleep(1500);

  for (let i = 0; i < 20; i++) {
    const stageReady = await evalJs(`Boolean(document.querySelector('[data-canvas-stage="true"]'))`);
    if (stageReady) break;
    await sleep(300);
  }

  // Step 2: Audit Left Toolbar
  console.log('Step 2: Audit Left Toolbar');
  const toolbarMetrics = await evalJs(`(() => {
    const tb = document.querySelector('aside[aria-label="Editing Tools"]');
    if (!tb) return null;
    const buttons = Array.from(tb.querySelectorAll('button[data-tool-id]'));
    const dividers = Array.from(tb.querySelectorAll('[data-toolbar-divider="true"], [class*="groupDivider"]'));
    const scrollArea = tb.querySelector('[data-tools-scroll-area="true"], [class*="toolsScrollArea"]');
    const csScroll = scrollArea ? window.getComputedStyle(scrollArea) : null;

    return {
      width: Math.round(tb.getBoundingClientRect().width),
      height: Math.round(tb.getBoundingClientRect().height),
      toolCount: buttons.length,
      toolIds: buttons.map(b => b.getAttribute('data-tool-id')),
      dividerCount: dividers.length,
      buttonWidth: buttons[0] ? Math.round(buttons[0].getBoundingClientRect().width) : null,
      buttonHeight: buttons[0] ? Math.round(buttons[0].getBoundingClientRect().height) : null,
      hasScrollArea: Boolean(scrollArea),
      overflowY: csScroll ? csScroll.overflowY : null
    };
  })()`);
  report.toolbar = toolbarMetrics;
  console.log('Toolbar metrics:', toolbarMetrics);

  // Step 3: Select Rectangle Tool -> Must NOT auto-create shape!
  console.log('Step 3: Select Rectangle Tool');
  await evalJs(`(() => {
    const rectBtn = document.querySelector('button[data-tool-id="rect"]');
    if (rectBtn) rectBtn.click();
  })()`);
  await sleep(400);

  const afterSelectMetrics = await evalJs(`(() => {
    const rectBtn = document.querySelector('button[data-tool-id="rect"]');
    const stage = document.querySelector('[data-canvas-stage="true"]');
    const shapeLayers = Array.from(document.querySelectorAll('[data-layer-type="shape"]'));
    const surface = document.querySelector('[data-shape-drawing-surface="true"]');
    const csSurface = surface ? window.getComputedStyle(surface) : null;

    return {
      rectActive: rectBtn?.getAttribute('data-tool-active') === 'true',
      shapeLayersCount: shapeLayers.length,
      drawingSurfaceExists: Boolean(surface),
      cursor: csSurface ? csSurface.cursor : null
    };
  })()`);
  report.afterSelectRectangle = afterSelectMetrics;
  console.log('After selecting rectangle:', afterSelectMetrics);

  // Step 4: Click and drag draw rectangle (50, 30 to 180, 130 -> W: 130, H: 100)
  console.log('Step 4: Click and drag draw rectangle');
  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]');
    const rect = surface.getBoundingClientRect();

    surface.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 50, clientY: rect.top + 30, pointerId: 1
    }));
    surface.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 180, clientY: rect.top + 130, pointerId: 1
    }));
  })()`);
  await sleep(300);

  // Check preview while dragging
  const livePreviewMetrics = await evalJs(`(() => {
    const preview = document.querySelector('[data-shape-preview="true"]');
    const badge = document.querySelector('[data-shape-dimension-badge="true"]');
    return {
      previewVisible: Boolean(preview),
      badgeText: badge ? badge.textContent.trim() : null,
      previewWidth: preview ? Math.round(preview.getBoundingClientRect().width) : null,
      previewHeight: preview ? Math.round(preview.getBoundingClientRect().height) : null
    };
  })()`);
  report.livePreview = livePreviewMetrics;
  console.log('Live preview metrics:', livePreviewMetrics);

  // Capture dragging screenshot
  const ssDrag = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'shape_drag_live_preview.png'), Buffer.from(ssDrag.data, 'base64'));

  // Release mouse to create rectangle
  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]') || document.body;
    const rect = document.querySelector('[data-canvas-stage="true"]').getBoundingClientRect();

    surface.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 180, clientY: rect.top + 130, pointerId: 1
    }));
  })()`);
  await sleep(600);

  const createdRectMetrics = await evalJs(`(() => {
    const shapeLayers = Array.from(document.querySelectorAll('[data-layer-type="shape"]'));
    const selectedShape = document.querySelector('[data-layer-type="shape"][data-layer-selected="true"]');
    const handles = selectedShape ? selectedShape.querySelectorAll('[class*="layerHandle"]') : [];
    const rotateHandle = selectedShape ? selectedShape.querySelector('[data-rotation-handle="true"]') : null;
    const moveBtn = document.querySelector('button[data-tool-id="move"]');

    return {
      shapeLayersCount: shapeLayers.length,
      isSelected: Boolean(selectedShape),
      handleCount: handles.length,
      hasRotateHandle: Boolean(rotateHandle),
      moveToolActive: moveBtn?.getAttribute('data-tool-active') === 'true',
      rectX: selectedShape ? Math.round(parseFloat(selectedShape.style.left)) : null,
      rectY: selectedShape ? Math.round(parseFloat(selectedShape.style.top)) : null,
      rectWidth: selectedShape ? Math.round(parseFloat(selectedShape.style.width)) : null,
      rectHeight: selectedShape ? Math.round(parseFloat(selectedShape.style.height)) : null,
      propertiesHeading: document.querySelector('h2')?.textContent.trim()
    };
  })()`);
  report.createdRectangle = createdRectMetrics;
  console.log('Created rectangle metrics:', createdRectMetrics);

  // Capture created shape screenshot
  const ssCreated = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'shape_created_and_selected.png'), Buffer.from(ssCreated.data, 'base64'));

  // Step 5: Test Shift: Proportional Square Drawing (start at 200, 30, drag deltaX=80, deltaY=60 with shiftKey -> 80x80)
  console.log('Step 5: Test Shift key square drawing');
  await evalJs(`(() => {
    const rectBtn = document.querySelector('button[data-tool-id="rect"]');
    if (rectBtn) rectBtn.click();
  })()`);
  await sleep(400);

  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]');
    const rect = surface.getBoundingClientRect();

    surface.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 200, clientY: rect.top + 30, pointerId: 2, shiftKey: true
    }));
    surface.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 280, clientY: rect.top + 90, pointerId: 2, shiftKey: true
    }));
  })()`);
  await sleep(200);
  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]') || document.body;
    const rect = document.querySelector('[data-canvas-stage="true"]').getBoundingClientRect();
    surface.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 280, clientY: rect.top + 90, pointerId: 2, shiftKey: true
    }));
  })()`);
  await sleep(600);

  const squareMetrics = await evalJs(`(() => {
    const shapes = Array.from(document.querySelectorAll('[data-layer-type="shape"]'));
    const lastShape = shapes[shapes.length - 1];
    return {
      totalShapes: shapes.length,
      squareWidth: lastShape ? Math.round(parseFloat(lastShape.style.width)) : null,
      squareHeight: lastShape ? Math.round(parseFloat(lastShape.style.height)) : null,
      isPerfectSquare: lastShape ? Math.round(parseFloat(lastShape.style.width)) === Math.round(parseFloat(lastShape.style.height)) : false
    };
  })()`);
  report.shiftSquare = squareMetrics;
  console.log('Shift square metrics:', squareMetrics);

  // Step 6: Test Circle Tool & Alt: Draw from center
  console.log('Step 6: Test Circle tool with Alt');
  await evalJs(`(() => {
    const circleBtn = document.querySelector('button[data-tool-id="circle"]');
    if (circleBtn) circleBtn.click();
  })()`);
  await sleep(400);

  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]');
    const rect = surface.getBoundingClientRect();

    surface.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 100, clientY: rect.top + 180, pointerId: 3, altKey: true
    }));
    surface.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 140, clientY: rect.top + 210, pointerId: 3, altKey: true
    }));
  })()`);
  await sleep(200);
  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]') || document.body;
    const rect = document.querySelector('[data-canvas-stage="true"]').getBoundingClientRect();
    surface.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 140, clientY: rect.top + 210, pointerId: 3, altKey: true
    }));
  })()`);
  await sleep(600);

  const circleMetrics = await evalJs(`(() => {
    const shapes = Array.from(document.querySelectorAll('[data-layer-type="shape"]'));
    const lastShape = shapes[shapes.length - 1];
    return {
      totalShapes: shapes.length,
      circleX: lastShape ? Math.round(parseFloat(lastShape.style.left)) : null,
      circleY: lastShape ? Math.round(parseFloat(lastShape.style.top)) : null,
      circleWidth: lastShape ? Math.round(parseFloat(lastShape.style.width)) : null,
      circleHeight: lastShape ? Math.round(parseFloat(lastShape.style.height)) : null,
      hasCircleTag: Boolean(lastShape?.querySelector('svg circle'))
    };
  })()`);
  report.altCircle = circleMetrics;
  console.log('Alt circle metrics:', circleMetrics);

  // Step 7: Test Triangle Tool
  console.log('Step 7: Test Triangle tool');
  await evalJs(`(() => {
    const triBtn = document.querySelector('button[data-tool-id="triangle"]');
    if (triBtn) triBtn.click();
  })()`);
  await sleep(400);

  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]');
    const rect = surface.getBoundingClientRect();

    surface.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 220, clientY: rect.top + 150, pointerId: 4
    }));
    surface.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 320, clientY: rect.top + 230, pointerId: 4
    }));
  })()`);
  await sleep(200);
  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]') || document.body;
    const rect = document.querySelector('[data-canvas-stage="true"]').getBoundingClientRect();
    surface.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 320, clientY: rect.top + 230, pointerId: 4
    }));
  })()`);
  await sleep(600);

  // Step 8: Test Line Tool
  console.log('Step 8: Test Line tool');
  await evalJs(`(() => {
    const lineBtn = document.querySelector('button[data-tool-id="line"]');
    if (lineBtn) lineBtn.click();
  })()`);
  await sleep(400);

  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]');
    const rect = surface.getBoundingClientRect();

    surface.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 40, clientY: rect.top + 250, pointerId: 5, shiftKey: true
    }));
    surface.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 250, clientY: rect.top + 255, pointerId: 5, shiftKey: true
    }));
  })()`);
  await sleep(200);
  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]') || document.body;
    const rect = document.querySelector('[data-canvas-stage="true"]').getBoundingClientRect();
    surface.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 250, clientY: rect.top + 255, pointerId: 5, shiftKey: true
    }));
  })()`);
  await sleep(600);

  // Step 9: Test Zero-size Click Rejection
  console.log('Step 9: Test Zero-size click rejection');
  const countBefore = await evalJs(`document.querySelectorAll('[data-layer-type="shape"]').length`);
  await evalJs(`(() => {
    const rectBtn = document.querySelector('button[data-tool-id="rect"]');
    if (rectBtn) rectBtn.click();
  })()`);
  await sleep(300);
  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]');
    const rect = surface.getBoundingClientRect();

    surface.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 200, clientY: rect.top + 200, pointerId: 6
    }));
    surface.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 201, clientY: rect.top + 201, pointerId: 6
    }));
  })()`);
  await sleep(500);
  const countAfter = await evalJs(`document.querySelectorAll('[data-layer-type="shape"]').length`);
  report.zeroSizeClickRejected = (countBefore === countAfter);
  console.log('Zero size click rejected:', report.zeroSizeClickRejected);

  // Step 10: Test Escape Key Cancellation
  console.log('Step 10: Test Escape key cancellation');
  await evalJs(`(() => {
    const rectBtn = document.querySelector('button[data-tool-id="rect"]');
    if (rectBtn) rectBtn.click();
  })()`);
  await sleep(300);
  await evalJs(`(() => {
    const surface = document.querySelector('[data-shape-drawing-surface="true"]');
    const rect = surface.getBoundingClientRect();

    surface.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 200, clientY: rect.top + 200, pointerId: 7
    }));
    surface.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, button: 0, clientX: rect.left + 400, clientY: rect.top + 400, pointerId: 7
    }));
  })()`);
  await sleep(300);

  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))`);
  await sleep(400);

  const escapeCancelSuccess = await evalJs(`(() => {
    const preview = document.querySelector('[data-shape-preview="true"]');
    const shapes = document.querySelectorAll('[data-layer-type="shape"]');
    return !preview && shapes.length === ${countBefore};
  })()`);
  report.escapeCancelSuccess = escapeCancelSuccess;
  console.log('Escape cancellation success:', escapeCancelSuccess);

  // Step 11: Capture Final Verified Multi-Shape Canvas Screenshot
  const ssFinal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'shape_drawing_multi_shapes_verified.png'), Buffer.from(ssFinal.data, 'base64'));

  fs.writeFileSync(path.join(outDir, 'shape_drawing_test_report.json'), JSON.stringify(report, null, 2));
  console.log('Shape drawing test suite finished successfully!');

  edge.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  edge.kill();
  process.exit(1);
});
