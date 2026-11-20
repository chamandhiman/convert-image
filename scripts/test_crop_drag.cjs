const { spawn } = require('child_process');
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--remote-debugging-port=9410', '--disable-gpu', '--guest',
  '--user-data-dir=' + (process.env.TEMP || 'C:\\Temp') + '\\e-crop2-' + Date.now(),
  'http://localhost:4173/edit-image'
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:9410/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page');
        if (found) {
          pageTarget = found;
          break;
        }
      }
    } catch {}
  }
  if (!pageTarget) throw new Error('No target');
  const t = pageTarget;
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const curId = id++;
      const timer = setTimeout(() => reject(new Error('timeout ' + method)), 15000);
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
    return res.result ? res.result.value : null;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await evaluate(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(2000);

  // 1. Create a 1080x1080 canvas
  await evaluate(`document.querySelector('[data-testid="preset-card-ig-post"]')?.click()`);
  await sleep(1500);

  // 2. Click Crop Tool
  await evaluate(`document.querySelector('[data-testid="tool-crop"]')?.click()`);
  await sleep(500);

  // 3. Simulate dragging the crop handle SE or setting cropBox via mouse events on stage
  console.log('[Test] Simulating drag on stage to select a 400x300 area...');
  const dragResult = await evaluate(`(() => {
    const stage = document.querySelector('[data-canvas-stage="true"]');
    if (!stage) return { error: 'No stage' };
    const rect = stage.getBoundingClientRect();
    const zoomMatch = stage.style.transform.match(/scale\\(([^)]+)\\)/);
    const zoom = zoomMatch ? parseFloat(zoomMatch[1]) : 1;

    // Start at document 100, 100 -> screen: rect.left + 100 * zoom, rect.top + 100 * zoom
    const startX = rect.left + 100 * zoom;
    const startY = rect.top + 100 * zoom;
    const endX = rect.left + 500 * zoom;
    const endY = rect.top + 400 * zoom;

    stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: startX, clientY: startY }));
    stage.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: endX, clientY: endY }));
    stage.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: endX, clientY: endY }));

    const overlay = document.querySelector('[data-crop-overlay="true"]');
    const badge = document.querySelector('[data-crop-badge="true"]')?.textContent?.trim();
    return {
      badge,
      overlayStyle: overlay ? overlay.getAttribute('style') : null,
    };
  })()`);
  console.log('Drag result:', dragResult);
  await sleep(500);

  // 4. Click Apply Crop
  console.log('[Test] Clicking Apply Crop button...');
  await evaluate(`document.querySelector('[data-testid="crop-apply-btn"]')?.click()`);
  await sleep(1500);

  // 5. Inspect state after apply!
  const stateAfterApply = await evaluate(`(() => {
    const stage = document.querySelector('[data-canvas-stage="true"]');
    const dims = document.querySelector('[data-testid="status-bar-dimensions"]')?.textContent?.trim();
    const bgLayer = document.querySelector('[data-layer-id="background"]');
    const bgImg = bgLayer ? bgLayer.querySelector('img') : null;
    const allLayers = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]')).map(el => el.textContent.trim());

    // Also check what a download export canvas would measure!
    const activeTab = document.querySelector('[data-doc-active="true"]');
    const tabName = activeTab ? activeTab.querySelector('[data-testid="doc-tab-title"]')?.textContent?.trim() : null;

    return {
      statusBarDims: dims,
      stageStyle: stage ? stage.getAttribute('style') : null,
      bgLayerStyle: bgLayer ? bgLayer.getAttribute('style') : null,
      layersList: allLayers,
      tabName,
    };
  })()`);
  console.log('State after crop apply:', stateAfterApply);

  ws.close();
  edge.kill('SIGKILL');
}

run();

