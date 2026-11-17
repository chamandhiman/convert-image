import { spawn } from 'child_process';
import path from 'path';

const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-inspect-err-' + Date.now());
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=9294',
  '--disable-gpu',
  '--disable-extensions',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  let targets = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const res = await fetch('http://127.0.0.1:9294/json/list');
      if (res.ok) {
        targets = await res.json();
        if (targets && targets.length) break;
      }
    } catch {}
  }
  const pageTarget = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, p={}) => new Promise(r => {
    const cur = id++;
    const h = e => { const d = JSON.parse(e.data); if (d.id === cur) { ws.removeEventListener('message', h); r(d.result); } };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

  ws.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', d.params.type, d.params.args.map(a => a.value || a.description));
    }
    if (d.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION:', d.params.exceptionDetails.text, d.params.exceptionDetails.exception?.description);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(3000);

  edge.kill();
  process.exit(0);
}
main().catch(e => { console.error(e); edge.kill(); });

