const { spawn } = require('child_process');
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--remote-debugging-port=9390', '--disable-gpu', '--guest',
  '--user-data-dir=' + (process.env.TEMP || 'C:\\Temp') + '\\e-' + Date.now(),
  'http://localhost:4173/edit-image'
]);
setTimeout(async () => {
  const list = await (await fetch('http://127.0.0.1:9390/json/list')).json();
  const t = list.find(x => x.type === 'page' && x.url.includes('4173'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const root = document.getElementById('root');
          const testids = Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'));
          return {
            testids: testids.slice(0, 30),
            editorMainFound: Boolean(document.querySelector('[data-testid=\"editor-workspace\"]')),
            startFound: Boolean(document.querySelector('[data-testid=\"editor-start-screen\"]')),
            welcomeFound: Boolean(document.querySelector('[data-testid=\"editor-welcome-screen\"]')),
          };
        })()`,
        returnByValue: true
      }
    }));
  };
  ws.onmessage = (m) => {
    console.log('Result:', JSON.stringify(JSON.parse(m.data), null, 2));
    edge.kill('SIGKILL');
    process.exit(0);
  };
}, 3000);

