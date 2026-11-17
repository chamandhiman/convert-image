import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_dbg_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9298',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://127.0.0.1:9298/json/list');
      const targets = await res.json();
      if (targets?.length) {
        const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
        await new Promise(r => ws.onopen = r);

        let id = 1;
        const send = (method, params = {}) => new Promise((resolve) => {
          const curId = id++;
          const handler = (e) => {
            const d = JSON.parse(e.data);
            if (d.id === curId) {
              ws.removeEventListener('message', handler);
              resolve(d.result);
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({ id: curId, method, params }));
        });

        ws.addEventListener('message', (e) => {
          const d = JSON.parse(e.data);
          if (d.method === 'Runtime.consoleAPICalled') {
            console.log('[Browser Console]:', d.params.type, d.params.args.map(a => a.value || a.description).join(' '));
          } else if (d.method === 'Runtime.exceptionThrown') {
            console.error('[Browser Exception]:', d.params.exceptionDetails);
          }
        });

        await send('Page.enable');
        await send('Runtime.enable');
        console.log('Navigating to http://localhost:4173/edit-image...');
        await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
        await sleep(3000);

        const resCheck = await send('Runtime.evaluate', {
          expression: `(() => ({
            url: window.location.href,
            title: document.title,
            header: Boolean(document.querySelector('header')),
            headerContainerHeight: document.querySelector('[class*="headerContainer"]')?.clientHeight,
            subToolbarHeight: document.querySelector('[class*="subToolbar"]')?.clientHeight,
            bottomBar: Boolean(document.querySelector('[class*="bottomStatusBar"]')),
            viewport: document.querySelector('[class*="canvasViewport"]')?.clientHeight
          }))()`,
          returnByValue: true
        });
        console.log('Page check:', resCheck.result?.value);
        edge.kill();
        process.exit(0);
      }
    } catch (e) {}
  }
}
main();

