import { spawn } from 'child_process';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-debug-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
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
      const res = await fetch('http://127.0.0.1:9225/json/list');
      if (res.ok) return await res.json();
    } catch {
      await sleep(300);
    }
  }
  throw new Error('Timeout waiting for Edge debug port 9225');
}

async function run() {
  const targets = await waitForPort();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => (ws.onopen = resolve));

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Console.messageAdded') {
      console.log('[BROWSER CONSOLE]', msg.params.message.text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
  };

  let idCounter = 1;
  function send(method, params = {}) {
    ws.send(JSON.stringify({ id: idCounter++, method, params }));
  }

  send('Page.enable');
  send('Console.enable');
  send('Runtime.enable');

  console.log('Navigating to http://localhost:5173/convert-image...');
  send('Page.navigate', { url: 'http://localhost:5173/convert-image' });

  await sleep(3000);
  ws.close();
  edge.kill();
}

run().catch((err) => {
  console.error(err);
  edge.kill();
});
