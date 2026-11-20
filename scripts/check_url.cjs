const { spawn } = require('child_process');
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--remote-debugging-port=9392', '--disable-gpu', '--guest',
  '--user-data-dir=' + (process.env.TEMP || 'C:\\Temp') + '\\e-' + Date.now(),
  'http://localhost:4173/edit-image'
]);
setTimeout(async () => {
  const list = await (await fetch('http://127.0.0.1:9392/json/list')).json();
  const t = list.find(x => x.type === 'page' && x.url.includes('4173'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          return {
            href: window.location.href,
            pathname: window.location.pathname,
            title: document.title,
            html: document.documentElement.outerHTML.substring(0, 1000)
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

