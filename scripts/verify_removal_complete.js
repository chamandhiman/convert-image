import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_removal_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9298',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Connecting to Edge on port 9298...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9298/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch {}
  }
  if (!targets) throw new Error('Could not connect to Edge DevTools');

  const pageTarget =
    targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) ||
    targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgIdCounter = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgIdCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  const results = {
    step1_home: {},
    step2_editor: {},
    step3_convert: {},
    step4_redirectPhotoRestorer: {},
    step5_redirectUpscaler: {},
    allPassed: false
  };

  // STEP 1: HOME PAGE
  console.log('1. Testing Home Page (http://localhost:4173/)...');
  await send('Page.navigate', { url: 'http://localhost:4173/' });
  await sleep(1500);

  // Dismiss cookie banner
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept All'));
        if (acceptBtn) acceptBtn.click();
      })()
    `
  });
  await sleep(500);

  const homeHeaderCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (function() {
        const navLinks = Array.from(document.querySelectorAll('nav[aria-label="Main Navigation"] a'));
        const labels = navLinks.map(a => a.textContent.trim());
        const hrefs = navLinks.map(a => a.getAttribute('href'));
        const hasRestorer = labels.some(l => l.toLowerCase().includes('restorer'));
        const hasUpscaler = labels.some(l => l.toLowerCase().includes('upscaler'));

        // Check image tools directory cards
        const allToolHeadings = Array.from(document.querySelectorAll('h3, h4, [class*="toolName"], [class*="cardTitle"]'))
          .map(el => el.textContent.trim());
        const toolCardRestorer = allToolHeadings.some(h => h.toLowerCase().includes('restorer'));
        const toolCardUpscaler = allToolHeadings.some(h => h.toLowerCase().includes('upscaler'));

        return {
          navLabels: labels,
          navHrefs: hrefs,
          navCount: labels.length,
          hasRestorerInNav: hasRestorer,
          hasUpscalerInNav: hasUpscaler,
          hasRestorerInCards: toolCardRestorer,
          hasUpscalerInCards: toolCardUpscaler
        };
      })()
    `
  });
  results.step1_home = homeHeaderCheck.result?.result?.value;
  console.log('Home check:', results.step1_home);

  const snapHome = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'removal_verification_home_1440.png'), Buffer.from(snapHome.result.data, 'base64'));

  // STEP 2: EDIT IMAGE PAGE
  console.log('2. Testing Edit Image Page (http://localhost:4173/edit)...');
  await send('Page.navigate', { url: 'http://localhost:4173/edit' });
  await sleep(1500);

  const editHeaderCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (function() {
        const navLinks = Array.from(document.querySelectorAll('nav[aria-label="Main Navigation"] a'));
        const labels = navLinks.map(a => a.textContent.trim());
        const hasRestorer = labels.some(l => l.toLowerCase().includes('restorer'));
        const hasUpscaler = labels.some(l => l.toLowerCase().includes('upscaler'));

        return {
          navLabels: labels,
          navCount: labels.length,
          hasRestorerInNav: hasRestorer,
          hasUpscalerInNav: hasUpscaler
        };
      })()
    `
  });
  results.step2_editor = editHeaderCheck.result?.result?.value;
  console.log('Editor check:', results.step2_editor);

  const snapEdit = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'removal_verification_editor_1440.png'), Buffer.from(snapEdit.result.data, 'base64'));

  // STEP 3: CONVERT PAGE (Check related tools)
  console.log('3. Testing Convert Page (http://localhost:4173/convert-image)...');
  await send('Page.navigate', { url: 'http://localhost:4173/convert-image' });
  await sleep(1500);

  const convertCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (function() {
        const bodyText = document.body.innerText;
        const hasRestorer = bodyText.includes('Photo Restorer');
        const hasUpscaler = bodyText.includes('Image Upscaler');
        return {
          hasRestorerOnConvertPage: hasRestorer,
          hasUpscalerOnConvertPage: hasUpscaler
        };
      })()
    `
  });
  results.step3_convert = convertCheck.result?.result?.value;
  console.log('Convert check:', results.step3_convert);

  const snapConvert = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'removal_verification_convert_1440.png'), Buffer.from(snapConvert.result.data, 'base64'));

  // STEP 4: REDIRECT PHOTO RESTORER
  console.log('4. Testing Redirect for /photo-restorer...');
  await send('Page.navigate', { url: 'http://localhost:4173/photo-restorer' });
  await sleep(1200);

  const redirectRestorerCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      ({
        currentUrl: window.location.href,
        currentPath: window.location.pathname,
        isRedirected: window.location.pathname === '/'
      })
    `
  });
  results.step4_redirectPhotoRestorer = redirectRestorerCheck.result?.result?.value;
  console.log('Redirect Photo Restorer check:', results.step4_redirectPhotoRestorer);

  // STEP 5: REDIRECT IMAGE UPSCALER
  console.log('5. Testing Redirect for /image-upscaler...');
  await send('Page.navigate', { url: 'http://localhost:4173/image-upscaler' });
  await sleep(1200);

  const redirectUpscalerCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      ({
        currentUrl: window.location.href,
        currentPath: window.location.pathname,
        isRedirected: window.location.pathname === '/'
      })
    `
  });
  results.step5_redirectUpscaler = redirectUpscalerCheck.result?.result?.value;
  console.log('Redirect Upscaler check:', results.step5_redirectUpscaler);

  // Evaluation
  const passHome = results.step1_home.navCount === 4 &&
    !results.step1_home.hasRestorerInNav &&
    !results.step1_home.hasUpscalerInNav &&
    !results.step1_home.hasRestorerInCards &&
    !results.step1_home.hasUpscalerInCards;

  const passEditor = results.step2_editor.navCount === 4 &&
    !results.step2_editor.hasRestorerInNav &&
    !results.step2_editor.hasUpscalerInNav;

  const passConvert = !results.step3_convert.hasRestorerOnConvertPage &&
    !results.step3_convert.hasUpscalerOnConvertPage;

  const passRedirect1 = results.step4_redirectPhotoRestorer.isRedirected;
  const passRedirect2 = results.step5_redirectUpscaler.isRedirected;

  results.allPassed = passHome && passEditor && passConvert && passRedirect1 && passRedirect2;
  console.log('All tests passed:', results.allPassed);

  fs.writeFileSync(path.join(outDir, 'removal_verification_report.json'), JSON.stringify(results, null, 2));

  ws.close();
  edge.kill();
  console.log('Verification finished successfully.');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  edge.kill();
  process.exit(1);
});

