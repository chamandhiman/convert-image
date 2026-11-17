const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9295;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-layers-cap-' + Date.now());

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
    } catch {}
  }
  if (!pageTarget) throw new Error('Page target not found');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const timer = setTimeout(() => {
      ws.removeEventListener('message', handler);
      reject(new Error(`CDP timeout: ${method}`));
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

  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2, // High resolution retina capture
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1500);

  // Seed cookie consent
  await evaluate(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.reload');
  await sleep(1800);

  // Create canvas
  for (let i = 0; i < 30; i++) {
    const ready = await evaluate(`Boolean(document.getElementById('start-blank-canvas-btn'))`);
    if (ready) break;
    await sleep(300);
  }
  await evaluate(`document.getElementById('start-blank-canvas-btn')?.click()`);
  await sleep(500);
  await evaluate(`document.getElementById('confirm-create-canvas-btn')?.click()`);
  await sleep(1200);

  // Switch to Layers tab
  await evaluate(`document.querySelector('[data-inspector-tab="layers"]')?.click()`);
  await sleep(500);

  // Create:
  // 1. Layer 1 -> renamed to 'Rectangle' or create rectangle shape
  // Let's create the 3 exact layers matching user mockup: "Rectangle", "Circle", "Layer 3"
  // First, add rectangle shape
  console.log('Adding rectangle layer...');
  await evaluate(`(() => {
    const rectTool = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('title') || '').includes('Rectangle Tool'));
    if (rectTool) rectTool.click();
    const stage = document.querySelector('[data-stage-container="true"]') || document.querySelector('canvas');
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    stage.dispatchEvent(new MouseEvent('mousedown', { clientX: r.left + 100, clientY: r.top + 100, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + 300, clientY: r.top + 250, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: r.left + 300, clientY: r.top + 250, bubbles: true }));
  })()`);
  await sleep(600);

  // Switch to circle tool and add circle shape
  console.log('Adding circle layer...');
  await evaluate(`(() => {
    const circleTool = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('title') || '').includes('Circle Tool'));
    if (circleTool) circleTool.click();
    const stage = document.querySelector('[data-stage-container="true"]') || document.querySelector('canvas');
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    stage.dispatchEvent(new MouseEvent('mousedown', { clientX: r.left + 350, clientY: r.top + 100, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + 500, clientY: r.top + 250, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: r.left + 500, clientY: r.top + 250, bubbles: true }));
  })()`);
  await sleep(600);

  // Switch to layers tab and add Layer 3 via + Add Layer
  console.log('Adding blank Layer 3...');
  await evaluate(`document.querySelector('[data-inspector-tab="layers"]')?.click()`);
  await sleep(400);
  await evaluate(`document.querySelector('[data-testid="layers-add-btn"]')?.click()`);
  await sleep(600);

  // Rename Rectangle layer if its default was 'Shape'
  await evaluate(`(() => {
    // Select layers
    const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]'));
    // We have 3 layers. Top is Layer 3, middle is Circle, bottom is Rectangle
  })()`);

  // Hover over the + Add Layer button to show the tooltip "Add Layer" exactly as in mockup!
  console.log('Hovering + Add Layer button to display Add Layer tooltip...');
  await evaluate(`(() => {
    const addBtn = document.querySelector('[data-testid="layers-add-btn"]');
    if (addBtn) {
      addBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      addBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }
  })()`);
  await sleep(500);

  // Get bounding box of aside / Right Workspace
  const box = await evaluate(`(() => {
    const el = document.querySelector('aside[class*="rightWorkspace"]') || document.querySelector('aside[aria-label*="Properties, Layers"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left),
      y: Math.round(r.top),
      width: Math.round(r.width),
      height: Math.round(r.height)
    };
  })()`);
  console.log('Right Workspace bounding box:', box);

  if (box) {
    const clipRes = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        scale: 1
      }
    });
    const panelPath = path.join(outDir, 'layers_panel_photoshop_style.png');
    fs.writeFileSync(panelPath, Buffer.from(clipRes.data, 'base64'));
    console.log(`[Saved Cropped Panel Screenshot] ${panelPath}`);
  }

  // Full screenshot
  const fullRes = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'layers_panel_full_desktop.png'), Buffer.from(fullRes.data, 'base64'));

  await send('Browser.close');
  if (edge) edge.kill();
  console.log('Done capturing layers panel visual matching mockup!');
}

main().catch(err => {
  console.error('Capture failed:', err);
  if (edge) edge.kill();
  process.exit(1);
});
