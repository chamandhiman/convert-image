import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9251',
  '--disable-gpu',
  '--no-first-run',
  'about:blank',
]);

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  try {
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9251/json/list');
        if (res.ok) break;
      } catch {
        await sleep(200);
      }
    }
    const res = await fetch('http://127.0.0.1:9251/json/list');
    const targets = await res.json();
    console.log('Targets found:', targets.map(t => ({ id: t.id, type: t.type, url: t.url })));

    const pageTarget = targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || targets[0];
    console.log('Selected target:', pageTarget.url);

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
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

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', msg.params.exceptionDetails?.exception?.description || JSON.stringify(msg.params.exceptionDetails));
      }
    };

    await new Promise((r) => (ws.onopen = r));
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Navigating to http://localhost:4173/edit-image...');
    await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
    await sleep(2000);

    const doc = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          title: document.title,
          url: window.location.href,
          btnCount: document.querySelectorAll('button').length,
          btns: Array.from(document.querySelectorAll('button')).map(b => b.id || b.innerText.trim()).slice(0, 10)
        };
      })()`,
      returnByValue: true
    });
    console.log('Doc info:', doc.result.value);

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    edge.kill();
  }
}
run();
