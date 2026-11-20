const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=9828',
  '--disable-gpu',
  '--window-size=1600,1000',
  '--user-data-dir=C:/Temp/edge-before-test',
]);

(async () => {
  for (let i = 0; i < 35; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9828/json/list');
      if (res.ok) {
        const [page] = await res.json();
        if (page?.webSocketDebuggerUrl) {
          const ws = new WebSocket(page.webSocketDebuggerUrl);
          await new Promise((r) => (ws.onopen = r));
          let id = 1;
          const send = (m, p = {}) =>
            new Promise((resolve) => {
              const cur = id++;
              const handler = (e) => {
                const d = JSON.parse(e.data);
                if (d.id === cur) {
                  ws.removeEventListener('message', handler);
                  resolve(d.result);
                }
              };
              ws.addEventListener('message', handler);
              ws.send(JSON.stringify({ id: cur, method: m, params: p }));
            });

          await send('Page.enable');
          await send('Runtime.enable');
          await send('Page.navigate', { url: 'http://127.0.0.1:4173/edit-image' });
          await new Promise((r) => setTimeout(r, 2000));

          const b64 = fs.readFileSync('scripts/fixtures/test_5400x3600_9layers.psd').toString('base64');
          await send('Runtime.evaluate', {
            awaitPromise: true,
            expression: `(async () => {
              const b64 = "${b64}";
              const byteChars = atob(b64);
              const byteNumbers = new Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
              const byteArray = new Uint8Array(byteNumbers);
              const file = new File([byteArray], 'test_5400x3600_9layers.psd', { type: 'image/vnd.adobe.photoshop' });
              const input = document.querySelector('[data-testid="main-file-input"]') || document.querySelector('input[type="file"]');
              const dt = new DataTransfer();
              dt.items.add(file);
              input.files = dt.files;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            })()`,
          });

          await new Promise((r) => setTimeout(r, 1500));

          // Simulate the un-patched state: flex-shrink: 1 (flex container collapses width)
          await send('Runtime.evaluate', {
            expression: `(() => {
              const stage = document.querySelector('[data-canvas-stage="true"]');
              if (stage) {
                stage.style.setProperty('flex-shrink', '1', 'important');
                stage.style.setProperty('min-width', '0px', 'important');
              }
              const titleLayer = Array.from(document.querySelectorAll('[data-layer-id]')).find(el => el.textContent && el.textContent.includes('MASTER'));
              if (titleLayer) titleLayer.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            })()`,
          });

          await new Promise((r) => setTimeout(r, 600));

          const ss = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(ARTIFACTS_DIR, 'psd_5400x3600_00_before_bug_reproduction.png'), Buffer.from(ss.data, 'base64'));
          console.log('[Success] Saved psd_5400x3600_00_before_bug_reproduction.png');

          edge.kill();
          process.exit(0);
        }
      }
    } catch {}
  }
  edge.kill();
  process.exit(1);
})();

