const fs = require('fs');
const { spawn } = require('child_process');

const CDP_PORT = 9847;
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-extensions',
  '--window-size=1600,1000',
  '--user-data-dir=C:/Temp/edge-snap-' + Date.now(),
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

    console.log('Connected to target:', wsUrl);
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
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/edit-image' });
    await new Promise((r) => setTimeout(r, 3000));

    const info = await send('Runtime.evaluate', {
      expression: '({ title: document.title, url: window.location.href, body: document.body.innerText.slice(0, 300) })',
      returnByValue: true,
    });
    console.log('PAGE INFO:', info.result.value);

    const snap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Temp/page_snap.png', Buffer.from(snap.data, 'base64'));
    console.log('Saved C:/Temp/page_snap.png');

    ws.close();
    edge.kill();
  } catch (e) {
    console.error(e);
    edge.kill();
  }
})();
