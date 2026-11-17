import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_empty_' + Date.now();

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9280',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Spawning Edge browser and waiting for DevTools...');
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9280/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch {}
  }
  if (!targets) throw new Error('Could not connect to Edge DevTools');

  const pageTarget =
    targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) ||
    targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
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

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Navigating to set consent...');
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(1000);

  // Set cookie consent in localStorage
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`
  });

  console.log('Navigating cleanly to http://localhost:4173/edit-image ...');
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });

  // Wait for header to appear
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    const hasHeader = await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('header') && document.getElementById('start-blank-canvas-btn'))`,
      returnByValue: true
    });
    if (hasHeader.result?.value) break;
  }

  // ==========================================
  // PART 1: EMPTY STATE VALIDATION
  // ==========================================
  console.log('>>> [1] Validating Empty State Layout & Elements...');
  const emptyStateData = await send('Runtime.evaluate', {
    expression: `(() => {
      // Header
      const header = document.querySelector('header');
      const editNavActive = document.querySelector('a[href*=\"edit\"][class*=\"navLinkActive\"]');
      
      // TopBar
      const topBar = document.querySelector('[class*=\"subToolbar\"]');
      
      // Left Toolbar
      const leftToolbar = document.querySelector('aside[aria-label=\"Editing Tools\"]');
      const tools = Array.from(document.querySelectorAll('button[data-tool-id]'));
      const activeTools = tools.filter(b => b.getAttribute('data-tool-active') === 'true');
      const allToolsDisabled = tools.every(b => b.disabled);
      
      // Central Viewport
      const viewport = document.querySelector('[class*=\"canvasViewport\"]');
      const csViewport = viewport ? window.getComputedStyle(viewport) : null;
      const rulers = {
        corner: Boolean(document.querySelector('[class*=\"cornerBox\"]')),
        top: Boolean(document.querySelector('[class*=\"topRulerWrap\"]')),
        left: Boolean(document.querySelector('[class*=\"leftRulerWrap\"]')),
      };
      
      // Starter Cards
      const card1Title = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Blank Canvas'));
      const card2Title = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Open Image'));
      const cardPills = Array.from(document.querySelectorAll('[class*=\"cardPillBadge\"]')).map(p => p.innerText.trim());
      const createBtn = document.getElementById('start-blank-canvas-btn');
      const chooseBtn = document.getElementById('start-open-image-btn');
      
      // Right Workspace
      const rightPanel = document.querySelector('aside[aria-label*=\"Properties\"]');
      const tabs = Array.from(document.querySelectorAll('[class*=\"tabBtn\"]')).map(b => b.innerText.trim());
      const emptyPropsHeading = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('No selection'));
      
      // Bottom Status Bar
      const statusBar = document.querySelector('footer[aria-label*=\"Editor Status\"]');
      const statusItems = Array.from(statusBar ? statusBar.querySelectorAll('[class*=\"statusItem\"]') : []).map(i => i.innerText.trim().replace(/\\s+/g, ' '));
      
      return {
        hasHeader: Boolean(header),
        isEditNavActive: Boolean(editNavActive),
        hasTopBar: Boolean(topBar),
        hasLeftToolbar: Boolean(leftToolbar),
        toolCount: tools.length,
        activeToolsCount: activeTools.length,
        allToolsDisabled,
        viewportBg: csViewport ? csViewport.backgroundColor : null,
        rulers,
        hasCard1: Boolean(card1Title),
        hasCard2: Boolean(card2Title),
        cardPills,
        hasCreateBtn: Boolean(createBtn),
        hasChooseBtn: Boolean(chooseBtn),
        hasRightPanel: Boolean(rightPanel),
        tabs,
        hasEmptyProps: Boolean(emptyPropsHeading),
        hasStatusBar: Boolean(statusBar),
        statusItems
      };
    })()`,
    returnByValue: true
  });

  console.log('Empty State Data:', JSON.stringify(emptyStateData.result.value, null, 2));

  // Screenshot 1: Empty Workspace
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'smart_editor_empty_workspace_photoshop.png'), Buffer.from(ss1.data, 'base64'));
  console.log('Saved smart_editor_empty_workspace_photoshop.png');

  // Test Right Panel Tabs in Empty State
  console.log('>>> [2] Testing Right Panel Tabs in Empty State...');
  // Click Layers Tab
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-inspector-tab=\"layers\"]')?.click()`
  });
  await sleep(400);
  const layersEmptyRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('No layers yet'));
      return Boolean(h3);
    })()`,
    returnByValue: true
  });
  console.log('Layers Tab Empty State:', layersEmptyRes.result.value);

  // Click History Tab
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-inspector-tab=\"history\"]')?.click()`
  });
  await sleep(400);
  const histEmptyRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('No actions yet'));
      return Boolean(h3);
    })()`,
    returnByValue: true
  });
  console.log('History Tab Empty State:', histEmptyRes.result.value);

  // Click back to Properties Tab
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-inspector-tab=\"properties\"]')?.click()`
  });
  await sleep(400);

  // ==========================================
  // PART 2: CREATE BLANK CANVAS (TRANSITION TO ACTIVE)
  // ==========================================
  console.log('>>> [3] Clicking Create Canvas & Creating 400x300 Blank Canvas...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('start-blank-canvas-btn')?.click()`
  });
  await sleep(500);

  // Confirm modal creation
  await send('Runtime.evaluate', {
    expression: `document.getElementById('confirm-create-canvas-btn')?.click()`
  });
  await sleep(1000);

  const activeStateData = await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('[data-canvas-stage=\"true\"]');
      const starterCards = document.querySelector('[class*=\"cardsGrid\"]');
      const moveTool = document.querySelector('button[data-tool-id=\"move\"]');
      const allTools = Array.from(document.querySelectorAll('button[data-tool-id]'));
      const areToolsEnabled = allTools.every(b => !b.disabled);
      const statusBar = document.querySelector('footer[aria-label*=\"Editor Status\"]');
      const statusPill = statusBar ? statusBar.querySelector('[class*=\"statusPill\"]')?.innerText.trim() : null;
      return {
        hasStage: Boolean(stage),
        cardsHidden: starterCards === null,
        isMoveToolActive: moveTool?.getAttribute('data-tool-active') === 'true',
        areToolsEnabled,
        statusPill
      };
    })()`,
    returnByValue: true
  });

  console.log('Active State Data:', JSON.stringify(activeStateData.result.value, null, 2));

  // Screenshot 2: Active Canvas Loaded
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'smart_editor_active_canvas_loaded.png'), Buffer.from(ss2.data, 'base64'));
  console.log('Saved smart_editor_active_canvas_loaded.png');

  // ==========================================
  // PART 3: CLOSE DOCUMENT & RESTORE EMPTY STATE
  // ==========================================
  console.log('>>> [4] Closing Document via File Menu -> Close Document...');
  // Open File menu
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-file-btn=\"true\"]')?.click()`
  });
  await sleep(400);

  // Click Close Document
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-close-doc-btn=\"true\"]')?.click()`
  });
  await sleep(800);

  const restoredStateData = await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('[data-canvas-stage=\"true\"]');
      const card1Title = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Blank Canvas'));
      const card2Title = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Open Image'));
      const tools = Array.from(document.querySelectorAll('button[data-tool-id]'));
      const allToolsDisabled = tools.every(b => b.disabled);
      const activeTools = tools.filter(b => b.getAttribute('data-tool-active') === 'true');
      const emptyPropsHeading = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('No selection'));
      const statusBar = document.querySelector('footer[aria-label*=\"Editor Status\"]');
      const statusItems = Array.from(statusBar ? statusBar.querySelectorAll('[class*=\"statusItem\"]') : []).map(i => i.innerText.trim().replace(/\\s+/g, ' '));
      return {
        stageRemoved: stage === null,
        cardsRestored: Boolean(card1Title && card2Title),
        allToolsDisabled,
        noActiveTools: activeTools.length === 0,
        emptyPropsRestored: Boolean(emptyPropsHeading),
        statusPlaceholdersRestored: statusItems.length === 3
      };
    })()`,
    returnByValue: true
  });

  console.log('Restored State Data:', JSON.stringify(restoredStateData.result.value, null, 2));

  // Screenshot 3: Restored Empty Workspace
  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'smart_editor_restored_empty_workspace.png'), Buffer.from(ss3.data, 'base64'));
  console.log('Saved smart_editor_restored_empty_workspace.png');

  console.log('=== ALL EMPTY WORKSPACE REDESIGN VERIFICATIONS COMPLETE! ===');
  ws.close();
  edge.kill();
}

run().catch((err) => {
  console.error('Test run failed:', err);
  edge.kill();
  process.exit(1);
});
