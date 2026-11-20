const { spawn } = require('child_process');
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--remote-debugging-port=9405', '--disable-gpu', '--guest',
  '--user-data-dir=' + (process.env.TEMP || 'C:\\Temp') + '\\e-crop-' + Date.now(),
  'http://localhost:4173/edit-image'
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:9405/json/list`);
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

  // 1. Create a 1080x1080 canvas via Instagram Post preset
  console.log('[Test] Creating 1080x1080 Instagram Post canvas...');
  await evaluate(`document.querySelector('[data-testid="preset-card-ig-post"]')?.click()`);
  await sleep(1500);

  // 2. Click Crop Tool in Left Toolbar
  console.log('[Test] Selecting Crop Tool...');
  await evaluate(`document.querySelector('[data-testid="tool-crop"]')?.click()`);
  await sleep(500);

  const cropStateBefore = await evaluate(`(() => {
    const activeTool = document.querySelector('[data-testid="tool-crop"]')?.getAttribute('data-tool-active');
    const badge = document.querySelector('[data-testid="contextual-tool-badge"]')?.textContent?.trim();
    const cropBoxBadge = document.querySelector('[data-crop-badge="true"]')?.textContent?.trim();
    const applyBtn = document.querySelector('[data-testid="crop-apply-btn"]');
    return {
      cropActive: activeTool === 'true',
      contextualBadge: badge,
      cropBoxBadge,
      hasApplyBtn: Boolean(applyBtn),
    };
  })()`);
  console.log('Crop state before drag:', cropStateBefore);

  // 3. Let's see what cropBox is right now!
  const cropBoxValue = await evaluate(`(() => {
    const overlay = document.querySelector('[data-crop-overlay="true"]');
    return {
      overlayExists: Boolean(overlay),
      overlayStyle: overlay ? overlay.getAttribute('style') : null,
    };
  })()`);
  console.log('Crop overlay:', cropBoxValue);

  // 4. Click Apply Crop button
  console.log('[Test] Clicking Apply Crop button...');
  const applyRes = await evaluate(`(() => {
    const applyBtn = document.querySelector('[data-testid="crop-apply-btn"]');
    if (!applyBtn) return { error: 'No apply btn' };
    applyBtn.click();
    return { clicked: true };
  })()`);
  console.log('Apply result:', applyRes);
  await sleep(1000);

  // 5. Check what document dimensions and stage look like after Apply!
  const stateAfterApply = await evaluate(`(() => {
    const stage = document.querySelector('[data-canvas-stage="true"]');
    const dims = document.querySelector('[data-testid="status-bar-dimensions"]')?.textContent?.trim();
    const bgLayer = document.querySelector('[data-layer-id="background"]');
    const bgImg = bgLayer ? bgLayer.querySelector('img') : null;
    return {
      statusBarDims: dims,
      stageStyle: stage ? stage.getAttribute('style') : null,
      bgLayerStyle: bgLayer ? bgLayer.getAttribute('style') : null,
      bgImgSrcLength: bgImg ? bgImg.src.length : 0,
      activeToolAfter: document.querySelector('[data-tool-active="true"]')?.getAttribute('data-testid'),
    };
  })()`);
  console.log('State after apply:', stateAfterApply);

  ws.close();
  edge.kill('SIGKILL');
}

run();
