import { spawn } from 'child_process';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-trace-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9229',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  'about:blank',
]);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPort() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9229/json/list');
      if (res.ok) return await res.json();
    } catch {
      await sleep(300);
    }
  }
  throw new Error('Timeout waiting for port');
}

async function run() {
  const targets = await waitForPort();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
    if (msg.method === 'Network.requestWillBeSent') {
      console.log('REQ:', msg.params.request.url);
    }
    if (msg.method === 'Network.loadingFailed') {
      console.log('FAILED:', msg.params.errorText, msg.params.canceled);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', msg.params.args.map(a => a.value));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION:', msg.params.exceptionDetails);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Network.enable');
  await send('Runtime.enable');

  console.log('Navigating to http://localhost:5173/convert-image ...');
  await send('Page.navigate', { url: 'http://localhost:5173/convert-image' });

  for (let i = 0; i < 15; i++) {
    await sleep(500);
    const evalRes = await send('Runtime.evaluate', {
      expression: `({
        path: window.location.pathname,
        root: document.getElementById('root')?.children.length || 0,
        h1: document.querySelector('h1')?.textContent || ''
      })`,
      returnByValue: true,
    });
    console.log(`Step ${i}:`, evalRes.result?.result?.value);
    if (evalRes.result?.result?.value?.root > 0) break;
  }

  ws.close();
  edge.kill();
}

run().catch((err) => {
  console.error(err);
  edge.kill();
});

