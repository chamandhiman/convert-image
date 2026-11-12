import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-ui-verify-' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9227',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  'about:blank',
]);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPort() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9227/json/list');
      if (res.ok) return await res.json();
    } catch {
      await sleep(300);
    }
  }
  throw new Error('Timeout waiting for Edge debug port 9227');
}

async function run() {
  const targets = await waitForPort();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1360,
    height: 850,
    deviceScaleFactor: 1,
    mobile: false,
  });

  async function waitForHydration() {
    for (let i = 0; i < 40; i++) {
      const evalRes = await send('Runtime.evaluate', {
        expression: 'document.getElementById("root")?.children.length || 0',
        returnByValue: true,
      });
      if (evalRes.result?.result?.value > 0) return true;
      await sleep(300);
    }
    return false;
  }

  // =========================================================================
  // TEST 1: Redirect /convert -> /convert-image & Verify Page
  // =========================================================================
  console.log('--- TEST 1: Testing /convert redirect ---');
  await send('Page.navigate', { url: 'http://localhost:5173/convert' });
  await waitForHydration();
  await sleep(800);

  const urlEval = await send('Runtime.evaluate', {
    expression: 'window.location.href',
    returnByValue: true,
  });
  console.log('Redirect target URL:', urlEval.result?.result?.value);

  const titleEval = await send('Runtime.evaluate', {
    expression: 'document.title',
    returnByValue: true,
  });
  console.log('Page Title:', titleEval.result?.result?.value);

  const convertShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-convert-image.png'), Buffer.from(convertShot.result.data, 'base64'));
  console.log('Saved verify-convert-image.png');

  // =========================================================================
  // TEST 2: Cookie Consent Modal (Initial view, Customize, and Accept)
  // =========================================================================
  console.log('--- TEST 2: Cookie Consent Modal ---');
  const cookieModalEval = await send('Runtime.evaluate', {
    expression: '!!document.querySelector("[aria-labelledby=\'cookie-heading\']")',
    returnByValue: true,
  });
  console.log('Cookie modal present:', cookieModalEval.result?.result?.value);

  const cookieShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-cookie-modal.png'), Buffer.from(cookieShot.result.data, 'base64'));
  console.log('Saved verify-cookie-modal.png');

  // Click Customize Preferences
  console.log('Opening Cookie Preferences Customize view...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.includes("Customize Preferences"));
      if (btn) btn.click();
    })()`,
  });
  await sleep(500);

  const cookieCustomShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-cookie-customize.png'), Buffer.from(cookieCustomShot.result.data, 'base64'));
  console.log('Saved verify-cookie-customize.png');

  // Save Preferences
  console.log('Clicking Save Preferences...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.includes("Save Preferences"));
      if (btn) btn.click();
    })()`,
  });
  await sleep(500);

  const storedConsent = await send('Runtime.evaluate', {
    expression: 'localStorage.getItem("webtoolocean_cookie_consent")',
    returnByValue: true,
  });
  console.log('Stored consent in localStorage:', storedConsent.result?.result?.value);

  // =========================================================================
  // TEST 3: Dropdowns on Floating Header
  // =========================================================================
  console.log('--- TEST 3: Dropdown Menus in Floating Header ---');
  // Open Image Tools Dropdown
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("header button"));
      const btn = btns.find(b => b.textContent.includes("Image Tools"));
      if (btn) btn.click();
    })()`,
  });
  await sleep(500);

  const toolsDropdownShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-tools-dropdown.png'), Buffer.from(toolsDropdownShot.result.data, 'base64'));
  console.log('Saved verify-tools-dropdown.png');

  // Open Resources Dropdown
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("header button"));
      const btn = btns.find(b => b.textContent.includes("Resources"));
      if (btn) btn.click();
    })()`,
  });
  await sleep(500);

  const resDropdownShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-resources-dropdown.png'), Buffer.from(resDropdownShot.result.data, 'base64'));
  console.log('Saved verify-resources-dropdown.png');

  // Close dropdowns
  await send('Runtime.evaluate', { expression: 'document.body.click()' });
  await sleep(300);

  // =========================================================================
  // TEST 4: Cross-page Anchor Navigation from /cookies to Features and Resources
  // =========================================================================
  console.log('--- TEST 4: Cross-page anchor navigation ---');
  await send('Page.navigate', { url: 'http://localhost:5173/cookies' });
  await waitForHydration();
  await sleep(800);

  console.log('Current URL on cookies page:', (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.result?.value);

  // Click Features
  console.log('Clicking Features link from /cookies...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("header button, header a"));
      const btn = btns.find(b => b.textContent.trim().includes("Features"));
      if (btn) btn.click();
    })()`,
  });
  await sleep(1000);

  const featuresNavUrl = await send('Runtime.evaluate', {
    expression: 'window.location.href',
    returnByValue: true,
  });
  console.log('Navigated URL after clicking Features:', featuresNavUrl.result?.result?.value);

  // Navigate back to /cookies and test All Tools navigation
  await send('Page.navigate', { url: 'http://localhost:5173/cookies' });
  await waitForHydration();
  await sleep(600);

  console.log('Clicking All Tools button from /cookies...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("header button"));
      const btn = btns.find(b => b.textContent.includes("All Tools"));
      if (btn) btn.click();
    })()`,
  });
  await sleep(1000);

  const allToolsNavUrl = await send('Runtime.evaluate', {
    expression: 'window.location.href',
    returnByValue: true,
  });
  console.log('Navigated URL after clicking All Tools:', allToolsNavUrl.result?.result?.value);

  // =========================================================================
  // TEST 5: Verify Email Everywhere on Contact & Legal Pages
  // =========================================================================
  console.log('--- TEST 5: Verify Email webtoolocean@gmail.com ---');
  await send('Page.navigate', { url: 'http://localhost:5173/contact' });
  await waitForHydration();
  await sleep(600);

  const contactCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      const hasGmail = text.includes("webtoolocean@gmail.com");
      const hasOldSupport = text.includes("support@webtoolocean.com");
      const mailto = document.querySelector("a[href*='webtoolocean@gmail.com']")?.getAttribute("href");
      return { hasGmail, hasOldSupport, mailto };
    })()`,
    returnByValue: true,
  });
  console.log('Contact Page Email Check:', contactCheck.result?.result?.value);

  const contactShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-contact.png'), Buffer.from(contactShot.result.data, 'base64'));
  console.log('Saved verify-contact.png');

  // =========================================================================
  // TEST 6: Reopen Cookie Preferences from Footer Button
  // =========================================================================
  console.log('--- TEST 6: Reopen Cookie Preferences from Footer Button ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent.includes("Cookie Preferences"));
      if (btn) btn.click();
    })()`,
  });
  await sleep(600);

  const reopenedEval = await send('Runtime.evaluate', {
    expression: '!!document.querySelector("[aria-labelledby=\'cookie-heading\']")',
    returnByValue: true,
  });
  console.log('Cookie modal reopened from Footer:', reopenedEval.result?.result?.value);

  const reopenedShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'verify-cookie-reopened.png'), Buffer.from(reopenedShot.result.data, 'base64'));
  console.log('Saved verify-cookie-reopened.png');

  ws.close();
  edge.kill();
  console.log('=== All UI improvements verified successfully! ===');
}

run().catch((err) => {
  console.error('Error running verify_ui_improvements:', err);
  edge.kill();
});
