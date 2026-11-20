const { spawn } = require('child_process');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9385;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-debug-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--guest',
    `--user-data-dir=${tmpProfile}`,
    'http://localhost:4173/edit-image',
  ]);

  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page' && t.url.includes('localhost:4173'));
        if (found) {
          pageTarget = found;
          break;
        }
      }
    } catch {}
  }

  if (!pageTarget) {
    console.error('Target not found');
    edge.kill();
    return;
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[Browser Console]', data.params.type, data.params.args.map(a => a.value));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.log('[Browser Error]', data.params.exceptionDetails);
    }
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const curId = id++;
      pending.set(curId, (res) => {
        if (res.error) reject(new Error(res.error.message || JSON.stringify(res.error)));
        else resolve(res.result);
      });
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  await new Promise((resolve) => {
    if (ws.readyState === WebSocket.OPEN) resolve();
    else ws.onopen = resolve;
  });

  await send('Page.enable');
  await send('Runtime.enable');

  await sleep(3000);

  const debugInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 300),
        rootChildren: document.getElementById('root')?.innerHTML?.substring(0, 500)
      };
    })()`,
    returnByValue: true,
  });

  console.log('Page Debug Info:', JSON.stringify(debugInfo, null, 2));

  ws.close();
  edge.kill('SIGKILL');
}

run();
