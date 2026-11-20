const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const CDP_PORT = 9851;

const edgeProc = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-extensions',
  '--disable-gpu',
  '--window-size=1600,1000',
  '--user-data-dir=C:/Temp/edge-crop-closeups-' + Date.now(),
]);

(async () => {
  try {
    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        if (res.ok) {
          const list = await res.json();
          const target = list.find((x) => x.type === 'page' && !x.url.startsWith('chrome-extension://'));
          if (target?.webSocketDebuggerUrl) {
            wsUrl = target.webSocketDebuggerUrl;
            break;
          }
        }
      } catch { }
    }
    if (!wsUrl) throw new Error('No wsUrl');

    const ws = new WebSocket(wsUrl);
    await new Promise((r) => (ws.onopen = r));
    let id = 1;
    const send = (m, p = {}) =>
      new Promise((res, rej) => {
        const cur = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === cur) {
            ws.removeEventListener('message', h);
            if (d.error) rej(d.error);
            else res(d.result);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: cur, method: m, params: p }));
      });

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/edit-image' });
    await new Promise((r) => setTimeout(r, 2000));

    // Preset click
    await send('Runtime.evaluate', {
      expression: `(() => {
        const preset = document.querySelector('[data-testid="preset-card-ig-post"]');
        if (preset) preset.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Select text tool
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-tool-id="text"]');
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Click canvas
    const pos = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]');
        const rect = stage.getBoundingClientRect();
        return { x: Math.round(rect.left + 220), y: Math.round(rect.top + 180) };
      })()`,
      returnByValue: true,
    });

    const clickX = pos.result.value.x;
    const clickY = pos.result.value.y;

    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: clickX, y: clickY, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 50));
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: clickX, y: clickY, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 500));

    // Insert text
    await send('Input.insertText', { text: 'Modern Design\nHigh Impact Typography' });
    await new Promise((r) => setTimeout(r, 400));

    // Closeup shot 1: Active inline editor
    const clipRect = { x: Math.max(0, clickX - 80), y: Math.max(0, clickY - 80), width: 680, height: 380, scale: 1 };
    const shot1 = await send('Page.captureScreenshot', { format: 'png', clip: clipRect });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'text_typing_editor_closeup.png'), Buffer.from(shot1.data, 'base64'));

    // Finish edit
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', modifiers: 2, windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', modifiers: 2, windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
    await new Promise((r) => setTimeout(r, 600));

    // Closeup shot 2: Rendered text on canvas
    const shot2 = await send('Page.captureScreenshot', { format: 'png', clip: clipRect });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'text_typing_rendered_closeup.png'), Buffer.from(shot2.data, 'base64'));

    ws.close();
    edgeProc.kill();
    console.log('Closeups captured successfully!');
  } catch (err) {
    console.error(err);
    edgeProc.kill();
  }
})();

