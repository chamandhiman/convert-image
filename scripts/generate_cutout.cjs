const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9295;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cutout-gen-' + Date.now());

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`Starting headless Edge on port ${port}...`);
  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    `--user-data-dir=${tmpProfile}`,
    'http://localhost:4173/remove-background'
  ]);

  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find(t => t.type === 'page' && t.url.includes('localhost:4173'));
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
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const timer = setTimeout(() => {
      ws.removeEventListener('message', handler);
      reject(new Error(`Timeout: ${method}`));
    }, 60000);
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        clearTimeout(timer);
        ws.removeEventListener('message', handler);
        if (d.error) reject(new Error(JSON.stringify(d.error)));
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  // Wait for file input to appear in DOM
  console.log('Waiting for input[type="file"]...');
  for (let i = 0; i < 50; i++) {
    const ready = await evaluate(`Boolean(document.querySelector('input[type="file"]'))`);
    if (ready) break;
    await sleep(300);
  }

  // Read sample-bg-portrait.jpg as base64
  const imgPath = path.resolve('public/sample-bg-portrait.jpg');
  const imgBase64 = fs.readFileSync(imgPath).toString('base64');

  console.log('Injecting image into page and calling handleFileSelect...');
  const res = await evaluate(`(async () => {
    try {
      const b64 = "${imgBase64}";
      const byteChars = atob(b64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const file = new File([blob], 'sample-bg-portrait.jpg', { type: 'image/jpeg' });

      // Find file input on current page
      const input = document.querySelector('input[type="file"]');
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true };
      }
      return { ok: false, reason: 'No input found' };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  })()`);

  console.log('Injection result:', res);

  console.log('Waiting for background removal result...');
  let done = false;
  for (let i = 0; i < 180; i++) {
    await sleep(1000);
    const state = await evaluate(`(() => {
      const successBadge = document.querySelector('[class*="successBadge"]');
      const errorTitle = document.querySelector('[class*="errorTitle"]');
      const statusMsg = document.querySelector('[class*="statusMessage"]')?.innerText;
      const progressPercent = document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow');
      
      const resultImg = document.querySelector('[class*="imageStageCutout"] img') || 
                        document.querySelector('[class*="stageImage"]');
      return {
        done: Boolean(successBadge),
        error: errorTitle?.innerText,
        status: statusMsg,
        progress: progressPercent,
        hasImg: Boolean(resultImg?.src)
      };
    })()`);

    if (state.error) {
      console.error('Error in processing:', state.error);
      break;
    }

    if (state.status) {
      console.log(`Progress: ${state.progress || 0}% - ${state.status}`);
    }

    if (state.done) {
      done = true;
      console.log('Background removal done!');
      break;
    }
  }

  if (done) {
    const cutoutBase64 = await evaluate(`(async () => {
      // Find the displayed cut-out image
      const imgs = Array.from(document.querySelectorAll('img'));
      const cutoutImg = imgs.find(img => img.alt && img.alt.includes('Background removed')) || imgs[imgs.length - 1];
      if (!cutoutImg || !cutoutImg.src) return null;
      const response = await fetch(cutoutImg.src);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          resolve(res.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
    })()`);

    if (cutoutBase64) {
      const buf = Buffer.from(cutoutBase64, 'base64');
      fs.writeFileSync('public/sample-bg-cutout.png', buf);
      fs.writeFileSync('src/assets/images/sample-bg-cutout.png', buf);
      console.log(`[SAVED] Cutout saved to public/sample-bg-cutout.png (${buf.length} bytes)`);
    } else {
      console.error('Could not extract cutout base64');
    }
  }

  edge.kill();
  process.exit(done ? 0 : 1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
