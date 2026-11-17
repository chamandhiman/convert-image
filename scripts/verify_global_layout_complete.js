import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-layout-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9298',
  '--disable-gpu',
  '--disable-extensions',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Waiting for Edge on port 9298...');
  let targets = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch('http://127.0.0.1:9298/json/list');
      if (res.ok) {
        targets = await res.json();
        if (targets && targets.length) break;
      }
    } catch {}
  }
  if (!targets || !targets.length) {
    throw new Error('Failed to connect to Edge DevTools');
  }

  const pageTarget = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        ws.removeEventListener('message', handler);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  };

  // Seed cookie consent
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(1500);
  await evalJs(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);

  const results = {};

  // 1. Test 1440px desktop routes
  const desktopRoutes = [
    { url: '/', name: 'home', file: 'layout_fixed_home_1440.png' },
    { url: '/compress-image', name: 'compress', file: 'layout_fixed_compress_1440.png' },
    { url: '/convert-image', name: 'convert', file: 'layout_fixed_convert_1440.png' },
    { url: '/remove-background', name: 'remove_bg', file: 'layout_fixed_remove_bg_1440.png' },
    { url: '/photo-restorer', name: 'photo_restorer', file: 'layout_fixed_photo_restorer_1440.png' },
    { url: '/image-upscaler', name: 'upscaler', file: 'layout_fixed_upscaler_1440.png' },
    { url: '/edit-image', name: 'edit', file: 'layout_fixed_edit_1440.png' }
  ];

  for (const r of desktopRoutes) {
    await send('Page.navigate', { url: 'http://localhost:4173' + r.url });
    await sleep(1200);

    const metrics = await evalJs(`(() => {
      const header = document.querySelector('header');
      const headerRect = header ? header.getBoundingClientRect() : null;
      const headerStyles = header ? window.getComputedStyle(header) : null;

      const activeLinks = Array.from(document.querySelectorAll('nav a')).filter(a => {
        return a.className.includes('Active') || a.getAttribute('aria-current') === 'page';
      }).map(a => a.textContent.trim());

      const heading = document.querySelector('h1') || document.querySelector('[class*="pageTitle"]');
      const headingRect = heading ? heading.getBoundingClientRect() : null;

      const converterSurface = document.querySelector('[class*="converterSurface"]');
      let surfaceBorder = null;
      let surfaceBg = null;
      let surfaceShadow = null;
      if (converterSurface) {
        const cs = window.getComputedStyle(converterSurface);
        surfaceBorder = cs.border;
        surfaceBg = cs.backgroundColor;
        surfaceShadow = cs.boxShadow;
      }

      const hasHorizScroll = document.documentElement.scrollWidth > window.innerWidth;
      const topDistance = (headingRect && headerRect) ? Math.round(headingRect.top - headerRect.bottom) : null;

      return {
        headerHeight: headerRect ? Math.round(headerRect.height) : null,
        headerPosition: headerStyles ? headerStyles.position : null,
        activeLinks,
        headingText: heading ? heading.textContent.trim().slice(0, 50) : null,
        topDistance,
        surfaceBorder,
        surfaceBg,
        surfaceShadow,
        hasHorizScroll,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      };
    })()`);

    results[r.name] = metrics;

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, r.file), Buffer.from(ss.data, 'base64'));
    console.log(`[1440px] Captured ${r.name}:`, JSON.stringify(metrics));
  }

  // 2. Test 1366px laptop on /compress-image
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:4173/compress-image' });
  await sleep(1000);
  results['laptop_1366'] = await evalJs(`(() => {
    const h = document.querySelector('header');
    const title = document.querySelector('h1') || document.querySelector('[class*="pageTitle"]');
    return {
      headerHeight: h ? h.getBoundingClientRect().height : null,
      topDistance: (title && h) ? Math.round(title.getBoundingClientRect().top - h.getBoundingClientRect().bottom) : null,
      hasHorizScroll: document.documentElement.scrollWidth > window.innerWidth
    };
  })()`);
  const ss1366 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'layout_fixed_laptop_1366.png'), Buffer.from(ss1366.data, 'base64'));
  console.log('[1366px] Captured:', JSON.stringify(results['laptop_1366']));

  // 3. Test 1024px tablet on /compress-image
  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:4173/compress-image' });
  await sleep(1000);
  results['tablet_1024'] = await evalJs(`(() => {
    const h = document.querySelector('header');
    const title = document.querySelector('h1') || document.querySelector('[class*="pageTitle"]');
    return {
      headerHeight: h ? h.getBoundingClientRect().height : null,
      topDistance: (title && h) ? Math.round(title.getBoundingClientRect().top - h.getBoundingClientRect().bottom) : null,
      hasHorizScroll: document.documentElement.scrollWidth > window.innerWidth
    };
  })()`);
  const ss1024 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'layout_fixed_tablet_1024.png'), Buffer.from(ss1024.data, 'base64'));
  console.log('[1024px] Captured:', JSON.stringify(results['tablet_1024']));

  // 4. Test 390px mobile on /compress-image
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: 'http://localhost:4173/compress-image' });
  await sleep(1000);
  results['mobile_390'] = await evalJs(`(() => {
    const h = document.querySelector('header');
    const title = document.querySelector('h1') || document.querySelector('[class*="pageTitle"]');
    return {
      headerHeight: h ? h.getBoundingClientRect().height : null,
      topDistance: (title && h) ? Math.round(title.getBoundingClientRect().top - h.getBoundingClientRect().bottom) : null,
      hasHorizScroll: document.documentElement.scrollWidth > window.innerWidth
    };
  })()`);
  const ss390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'layout_fixed_mobile_390.png'), Buffer.from(ss390.data, 'base64'));
  console.log('[390px] Captured:', JSON.stringify(results['mobile_390']));

  fs.writeFileSync(path.join(outDir, 'layout_verification_results.json'), JSON.stringify(results, null, 2));
  console.log('Successfully completed layout verification!');

  edge.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  edge.kill();
  process.exit(1);
});
