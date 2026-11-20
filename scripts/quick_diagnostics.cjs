const { spawn } = require('child_process');
const path = require('path');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9435;
const previewUrl = 'http://localhost:4173';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--disable-gpu',
    '--guest',
    '--user-data-dir=' + path.join(process.env.TEMP || 'C:\\Temp', 'edge-diag-' + Date.now()),
    'about:blank'
  ]);
  await sleep(1500);
  const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  const pageTarget = list.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
  
  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log('Exception Thrown:', JSON.stringify(msg.params.exceptionDetails, null, 2));
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('Console:', msg.params.type, msg.params.args.map(a => a.value || a.description));
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: previewUrl + '/edit-image' });
  await sleep(2500);
  
  ws.close();
  edge.kill();
}
main().catch(console.error);
