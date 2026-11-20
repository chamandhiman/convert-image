const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const port = 9390;
const previewUrl = 'http://localhost:4173';
const outDir = 'C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const tmpProfile = `${process.env.TEMP || 'C:\\Temp'}\\edge-audit-sidebar-${Date.now()}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAudit() {
  console.log(`[CDP] Launching Edge on port ${port}...`);
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-features=SyncConfirmation,SignInPromo',
    '--guest',
    `--user-data-dir=${tmpProfile}`,
    `${previewUrl}/edit-image`,
  ]);

  console.log(`[CDP] Connecting to Edge DevTools target...`);
  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page' && t.url.includes('localhost:4173'));
        if (found) {
          pageTarget = found;
          break;
        }
      }
    } catch {}
  }

  if (!pageTarget) {
    throw new Error('Failed to find localhost:4173 page target in Edge DevTools');
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const curId = id++;
      const timer = setTimeout(() => {
        ws.removeEventListener('message', handler);
        reject(new Error(`Timeout waiting for CDP method: ${method} (id=${curId})`));
      }, 15000);
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
    return res.result ? res.result.value : null;
  };

  const waitForSelector = async (selector, maxAttempts = 30, interval = 200) => {
    for (let i = 0; i < maxAttempts; i++) {
      const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await sleep(interval);
    }
    return false;
  };

  const captureScreenshot = async (name) => {
    try {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(outDir, `${name}.png`);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`[Screenshot] Saved: ${name}.png`);
    } catch (e) {
      console.warn(`[Screenshot] Failed to capture ${name}:`, e.message);
    }
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('[CDP] Setting consent & navigating...');
  await evaluate(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);
  await send('Page.navigate', { url: `${previewUrl}/edit-image` });
  await sleep(1500);

  const results = {};

  try {
    // =========================================================================
    // 1. Audit Sidebar in /edit-image (Studio Desktop Viewport)
    // =========================================================================
    console.log('[Test] 1. Auditing Hamburger Sidebar in Studio Editor (/edit-image)...');

    // Create a blank canvas document if landing screen is shown
    const hasBlankBtn = await waitForSelector('#start-blank-canvas-btn', 15);
    if (hasBlankBtn) {
      await evaluate(`document.getElementById('start-blank-canvas-btn')?.click()`);
      await sleep(600);
      await waitForSelector('#confirm-create-canvas-btn');
      await evaluate(`document.getElementById('confirm-create-canvas-btn')?.click()`);
      await sleep(1500);
    }

    await waitForSelector('[data-testid="hamburger-menu-btn"]');
    await evaluate(`document.querySelector('[data-testid="hamburger-menu-btn"]')?.click()`);
    await sleep(600);
    await captureScreenshot('sidebar_01_studio_drawer_open');

    // Audit drawer contents
    const studioDrawerAudit = await evaluate(`(() => {
      const drawer = document.querySelector('[data-testid="hamburger-nav-drawer"]');
      if (!drawer) return { error: 'Drawer not found' };

      const links = Array.from(drawer.querySelectorAll('nav a'));
      const linkDetails = links.map(l => ({
        text: l.textContent.trim(),
        href: l.getAttribute('href'),
        isActive: l.getAttribute('aria-current') === 'page' || Boolean(l.querySelector('[class*="activeBadge"]')),
        hasCurrentBadge: Boolean(l.querySelector('[class*="activeBadge"]')),
      }));

      // Search for prohibited extra tools
      const allDrawerText = drawer.textContent;
      const forbiddenTools = [
        'Resize Image',
        'Crop Image',
        'Rotate Image',
        'Object Remover',
        'Generative Fill',
        'Image Extender',
        'Clean Metadata',
        'Optimize Image',
        'Analyze Image',
        'JPG to PNG',
        'PNG to JPG',
        'Image to WebP',
        'PDF & Document Tools',
        'Developer Tools',
        'Main Creative Tools',
        'Image Tools',
        'Format Conversion',
        'More Suites'
      ];

      const foundForbidden = forbiddenTools.filter(t => allDrawerText.includes(t));

      return {
        drawerVisible: true,
        linksCount: links.length,
        linkDetails,
        foundForbidden,
        isClean: foundForbidden.length === 0 && links.length === 4,
      };
    })()`);
    console.log('Studio drawer audit:', studioDrawerAudit);
    results.studioDrawer = studioDrawerAudit;

    // Test closing drawer via close button
    await evaluate(`document.querySelector('[data-testid="drawer-close-btn"]')?.click()`);
    await sleep(500);

    const studioDrawerClosed = await evaluate(`(() => {
      const drawer = document.querySelector('[data-testid="hamburger-nav-drawer"]');
      return drawer ? !drawer.className.includes('Open') : true;
    })()`);
    console.log('Studio drawer closed via X button:', studioDrawerClosed);
    await captureScreenshot('sidebar_02_studio_drawer_closed');

    // =========================================================================
    // 2. Audit Sidebar in /convert-image (Mobile Viewport)
    // =========================================================================
    console.log('[Test] 2. Auditing Hamburger Sidebar on Mobile /convert-image...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 480,
      height: 850,
      deviceScaleFactor: 1,
      mobile: true,
    });

    await send('Page.navigate', { url: `${previewUrl}/convert-image` });
    await sleep(1500);

    await waitForSelector('button[aria-label*="navigation menu"]');
    await evaluate(`document.querySelector('button[aria-label*="navigation menu"]')?.click()`);
    await sleep(600);
    await captureScreenshot('sidebar_03_convert_mobile_drawer_open');

    const convertDrawerAudit = await evaluate(`(() => {
      const drawer = document.querySelector('[data-testid="hamburger-nav-drawer"]');
      if (!drawer) return { error: 'Drawer not found' };

      const links = Array.from(drawer.querySelectorAll('nav a'));
      const linkDetails = links.map(l => ({
        text: l.textContent.trim(),
        href: l.getAttribute('href'),
        isActive: l.getAttribute('aria-current') === 'page' || Boolean(l.querySelector('[class*="activeBadge"]')),
      }));

      const activeLink = linkDetails.find(l => l.isActive);

      return {
        drawerVisible: true,
        linksCount: links.length,
        linkDetails,
        activeLinkText: activeLink ? activeLink.text : null,
      };
    })()`);
    console.log('Convert mobile drawer audit:', convertDrawerAudit);
    results.convertDrawer = convertDrawerAudit;

    // Click "Remove Background" link to test navigation & automatic closing
    console.log('[Test] 3. Testing navigation to /remove-background via sidebar link...');
    await evaluate(`(() => {
      const link = Array.from(document.querySelectorAll('[data-testid="hamburger-nav-drawer"] nav a'))
        .find(l => l.textContent.includes('Remove Background'));
      if (link) link.click();
    })()`);
    await sleep(2000);
    await captureScreenshot('sidebar_04_navigated_to_remove_bg');

    const removeBgPageAudit = await evaluate(`(() => {
      return {
        pathname: window.location.pathname,
        pageTitle: document.title,
      };
    })()`);
    console.log('After clicking Remove Background:', removeBgPageAudit);
    results.navigationSuccess = removeBgPageAudit.pathname === '/remove-background';

    // Open drawer again on /remove-background to verify active highlight
    console.log('[Test] 4. Verifying active state on /remove-background...');
    await waitForSelector('button[aria-label*="navigation menu"]');
    await evaluate(`document.querySelector('button[aria-label*="navigation menu"]')?.click()`);
    await sleep(600);
    await captureScreenshot('sidebar_05_remove_bg_drawer_open');

    const removeBgDrawerAudit = await evaluate(`(() => {
      const drawer = document.querySelector('[data-testid="hamburger-nav-drawer"]');
      if (!drawer) return { error: 'Drawer not found' };

      const links = Array.from(drawer.querySelectorAll('nav a'));
      const activeLink = links.find(l => l.getAttribute('aria-current') === 'page' || Boolean(l.querySelector('[class*="activeBadge"]')));
      return {
        linksCount: links.length,
        activeLinkText: activeLink ? activeLink.textContent.trim() : null,
      };
    })()`);
    console.log('Remove Background drawer audit:', removeBgDrawerAudit);
    results.removeBgDrawer = removeBgDrawerAudit;

    // =========================================================================
    // FINAL AUDIT EVALUATION
    // =========================================================================
    const allPassed =
      results.studioDrawer?.isClean === true &&
      results.studioDrawer?.linksCount === 4 &&
      results.studioDrawer?.foundForbidden.length === 0 &&
      studioDrawerClosed === true &&
      results.convertDrawer?.linksCount === 4 &&
      results.convertDrawer?.activeLinkText?.includes('Convert Image') &&
      results.navigationSuccess === true &&
      results.removeBgDrawer?.linksCount === 4 &&
      results.removeBgDrawer?.activeLinkText?.includes('Remove Background');

    console.log('\n========================================');
    console.log('FINAL AUDIT RESULT:', allPassed ? 'ALL PASSED (100% OK)' : 'FAILED');
    console.log(JSON.stringify(results, null, 2));
    console.log('========================================');

    fs.writeFileSync(
      path.join(outDir, 'sidebar_navigation_audit_results.json'),
      JSON.stringify(results, null, 2)
    );
  } finally {
    ws.close();
    edge.kill();
  }
}

runAudit().catch((err) => {
  console.error('[Error during audit]:', err);
  process.exit(1);
});
