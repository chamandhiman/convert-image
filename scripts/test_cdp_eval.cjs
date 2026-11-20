const { spawn } = require('child_process');

const CDP_PORT = 9842;
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--user-data-dir=C:/Temp/edge-test-eval',
]);

setTimeout(async () => {
  try {
    const list = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`).then((r) => r.json());
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    let id = 1;
    const send = (method, params) =>
      new Promise((resolve) => {
        const cur = id++;
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === cur) {
            ws.removeEventListener('message', handler);
            resolve(msg);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: cur, method, params }));
      });

    const res = await send('Runtime.evaluate', {
      expression: `(() => ({ a: 1, b: "hello" }))()`,
      returnByValue: true,
    });
    console.log('Result:', JSON.stringify(res, null, 2));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    console.log('Screenshot length:', ss.result?.data?.length);

    ws.close();
    edge.kill();
    process.exit(0);
  } catch (e) {
    console.error(e);
    edge.kill();
    process.exit(1);
  }
}, 1500);

