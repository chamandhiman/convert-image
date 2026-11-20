const { spawn } = require('child_process');
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--remote-debugging-port=9820', '--disable-gpu', '--user-data-dir=C:/Temp/edge-flex-test'
]);
(async () => {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9820/json/list');
      if (res.ok) {
        const [page] = await res.json();
        if (page) {
          const ws = new WebSocket(page.webSocketDebuggerUrl);
          await new Promise(r => ws.onopen = r);
          let id = 1;
          const send = (m, p={}) => new Promise(res => {
            const cur = id++;
            ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id === cur) res(d.result); };
            ws.send(JSON.stringify({ id: cur, method: m, params: p }));
          });
          await send('Page.enable');
          await send('Runtime.enable');
          const evalRes = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `(() => {
              document.body.innerHTML = \`
                <div id="viewport" style="display:flex; align-items:center; justify-content:center; width:1200px; height:800px; background:#eee; overflow:hidden;">
                  <div id="stage" style="width:5400px; height:3600px; flex-shrink:0; transform:translate(0px, 0px) scale(0.16); transform-origin:center center; position:relative; background:white; display:inline-block;">
                    <div id="vp" style="position:absolute; top:0; left:0; width:100%; height:100%; background:blue;">
                      <div id="layer" style="position:absolute; left:2000px; top:1500px; width:500px; height:400px; background:red;"></div>
                    </div>
                  </div>
                </div>
              \`;
              const stage = document.getElementById('stage');
              const layer = document.getElementById('layer');
              const cs = window.getComputedStyle(stage);
              const rect = stage.getBoundingClientRect();
              const layerRect = layer.getBoundingClientRect();
              return {
                computedWidth: cs.width,
                computedHeight: cs.height,
                flexShrink: cs.flexShrink,
                rectWidth: rect.width,
                rectHeight: rect.height,
                rectLeft: rect.left,
                rectTop: rect.top,
                layerRectLeft: layerRect.left,
                layerRectTop: layerRect.top,
                layerRectWidth: layerRect.width,
                layerRectHeight: layerRect.height,
              };
            })()`
          });
          console.log('Result:', evalRes.result.value);
          edge.kill();
          process.exit(0);
        }
      }
    } catch {}
  }
  edge.kill();
  process.exit(1);
})();
