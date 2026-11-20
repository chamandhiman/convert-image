const { spawn } = require('child_process');
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--remote-debugging-port=9388', '--disable-gpu', '--guest',
  '--user-data-dir=' + (process.env.TEMP || 'C:\\Temp') + '\\e-' + Date.now(),
  'http://localhost:4173/edit-image'
]);
setTimeout(async () => {
  const list = await (await fetch('http://127.0.0.1:9388/json/list')).json();
  const t = list.find(x => x.type === 'page' && x.url.includes('4173'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const el = document.querySelector('[data-testid="editor-welcome-screen"]');
          if (el) return 'FOUND: ' + el.className;
          const idx = document.body.innerHTML.indexOf('Start');
          return 'NOT FOUND. Around Start: ' + document.body.innerHTML.substring(idx - 50, idx + 250);
        })()`,
        returnByValue: true
      }
    }));
  };
  ws.onmessage = (m) => {
    console.log('Result:', JSON.parse(m.data));
    edge.kill('SIGKILL');
    process.exit(0);
  };
}, 3000);

