const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9405;
const previewUrl = 'http://127.0.0.1:4173';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-psd-audit-' + Date.now());

let edge = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log(`[PSD Audit] Launching Edge headless on port ${port}...`);
  edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-features=SyncConfirmation,SignInPromo',
    '--guest',
    `--user-data-dir=${tmpProfile}`,
    `${previewUrl}/edit-image`,
  ]);

  console.log(`[PSD Audit] Connecting to Edge DevTools target...`);
  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page');
        if (found) {
          pageTarget = found;
          break;
        }
      }
    } catch {}
  }

  if (!pageTarget) {
    throw new Error('Failed to find page target in Edge DevTools');
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
      }, 25000);

      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === curId) {
          clearTimeout(timer);
          ws.removeEventListener('message', handler);
          if (data.error) reject(new Error(JSON.stringify(data.error)));
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  ws.addEventListener('message', (msg) => {
    const data = JSON.parse(msg.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map((a) => a.value || a.description).join(' ');
      console.log(`[Browser Console ${data.params.type}]`, text);
    }
  });

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1500,
    height: 980,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const evaluate = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  };

  const takeScreenshot = async (name) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(outDir, name);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    console.log(`[PSD Audit] Screenshot captured: ${name}`);
    return filePath;
  };

  console.log(`[PSD Audit] Waiting for editor welcome screen...`);
  for (let i = 0; i < 40; i++) {
    const isReady = await evaluate(`Boolean(document.querySelector('[data-testid="welcome-card-open-psd"]'))`);
    if (isReady) break;
    await sleep(300);
  }
  await sleep(1000);

  // Check initial state
  const initialCheck = await evaluate(`
    (() => {
      const welcome = document.querySelector('[data-testid="editor-welcome-screen"]');
      const openPsdCard = document.querySelector('[data-testid="welcome-card-open-psd"]');
      const menuBar = document.querySelector('[data-testid="application-menu-bar"]');
      return {
        welcomeFound: Boolean(welcome),
        openPsdCardFound: Boolean(openPsdCard),
        menuBarFound: Boolean(menuBar),
      };
    })()
  `);
  console.log('[PSD Audit] Initial welcome screen state:', initialCheck);

  // Step 1: Open PSD Modal
  console.log('[PSD Audit] Clicking Open PSD card...');
  await evaluate(`
    (() => {
      const card = document.querySelector('[data-testid="welcome-card-open-psd"]');
      if (card) card.click();
    })()
  `);
  await sleep(600);

  const modalCheck = await evaluate(`
    (() => {
      const modal = document.querySelector('[data-testid="psd-modal"]');
      const title = modal?.querySelector('#psd-modal-title')?.textContent;
      const subtitle = modal?.querySelector('p')?.textContent;
      const dropZone = modal?.querySelector('[data-testid="psd-drop-zone"], [data-testid="psd-modal-dropzone"]');
      const placeholderText = modal?.textContent.includes('under development');
      return {
        modalVisible: Boolean(modal),
        title,
        subtitle,
        dropZoneExists: Boolean(dropZone),
        placeholderFound: placeholderText,
      };
    })()
  `);
  console.log('[PSD Audit] Modal check:', modalCheck);
  await takeScreenshot('psd_01_import_modal.png');

  // Step 2: Feed test PSD file into modal
  console.log('[PSD Audit] Loading test fixture into PSD import modal...');
  const parseResult = await evaluate(`
    (async () => {
      try {
        const resp = await fetch('/test-photoshop-fixture.psd');
        if (!resp.ok) throw new Error('Failed to fetch /test-photoshop-fixture.psd');
        const blob = await resp.blob();
        const file = new File([blob], 'Creative-Studio-Design.psd', { type: 'image/vnd.adobe.photoshop' });

        // Simulate file input change event
        const input = document.querySelector('[data-testid="psd-file-input"]');
        if (!input) throw new Error('psd-file-input not found');

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));

        return { triggered: true, fileName: file.name, fileSize: file.size };
      } catch (e) {
        return { error: e.message };
      }
    })()
  `);
  console.log('[PSD Audit] File injected:', parseResult);

  // Step 3: Wait for PSD parsing to complete
  console.log('[PSD Audit] Waiting for parsing and summary to render...');
  let summaryCheck = null;
  for (let i = 0; i < 40; i++) {
    await sleep(400);
    summaryCheck = await evaluate(`
      (() => {
        const modal = document.querySelector('[data-testid="psd-modal"]');
        const confirmBtn = modal?.querySelector('[data-testid="psd-confirm-import-btn"], [data-testid="psd-confirm-btn"]');
        const docTitle = modal?.querySelector('h4')?.textContent;
        const progress = modal?.querySelector('[role="progressbar"], [class*="progressBarTrack"]');
        const summaryStats = Array.from(modal?.querySelectorAll('[class*="statItem"], [class*="badge"], [class*="chip"]') || []).map(el => el.textContent.trim());
        const warnings = Array.from(modal?.querySelectorAll('[class*="warningItem"], [class*="warningList"] li') || []).map(el => el.textContent.trim());
        const errorText = modal?.querySelector('[data-testid="psd-error-alert"]')?.textContent;

        return {
          confirmBtnReady: Boolean(confirmBtn),
          docTitle,
          isProgressing: Boolean(progress),
          summaryStats,
          warnings,
          errorText,
          modalHtml: modal?.innerText,
        };
      })()
    `);

    if (summaryCheck && (summaryCheck.confirmBtnReady || summaryCheck.errorText)) {
      break;
    }
  }

  console.log('[PSD Audit] Summary check:', {
    confirmBtnReady: summaryCheck?.confirmBtnReady,
    docTitle: summaryCheck?.docTitle,
    summaryStatsCount: summaryCheck?.summaryStats?.length,
    warnings: summaryCheck?.warnings,
    errorText: summaryCheck?.errorText,
  });
  await takeScreenshot('psd_02_parsed_summary.png');

  // Step 4: Click "Open in Editor"
  console.log('[PSD Audit] Clicking "Open in Editor"...');
  await evaluate(`
    (() => {
      const confirmBtn = document.querySelector('[data-testid="psd-confirm-import-btn"], [data-testid="psd-confirm-btn"]');
      if (confirmBtn) confirmBtn.click();
    })()
  `);
  await sleep(1500);

  // Step 5: Check Editor Workspace with PSD Document loaded
  const editorCheck = await evaluate(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"], [class*="docTab"]')).map(t => t.textContent.trim());
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const stageW = stage?.style.width;
      const stageH = stage?.style.height;

      // Ensure Layers tab is selected in RightWorkspace
      const layersTab = Array.from(document.querySelectorAll('[role="tab"], button')).find(b => b.textContent.includes('Layers'));
      if (layersTab && !layersTab.className.includes('Active')) {
        layersTab.click();
      }

      // Collect layer items from Layers panel
      const layerRows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"], [class*="layerRow"], [class*="layerItem"]')).map(r => {
        return {
          text: r.textContent.trim(),
          isSelected: r.className.includes('Selected') || r.getAttribute('aria-selected') === 'true',
          hasMask: Boolean(r.querySelector('[class*="maskThumbnail"], [class*="maskBadge"], [title*="mask"]')),
          hasClipping: Boolean(r.querySelector('[class*="clipping"], [class*="arrowDown"], [class*="clip"]')),
          hasEffects: Boolean(r.querySelector('[class*="effectsBadge"], [class*="fxIcon"], [class*="layerEffects"]')),
        };
      });

      return {
        tabs,
        stageW,
        stageH,
        layerRowsCount: layerRows.length,
        layerRows,
      };
    })()
  `);
  console.log('[PSD Audit] Editor check:', {
    tabs: editorCheck.tabs,
    stageDimensions: `${editorCheck.stageW} x ${editorCheck.stageH}`,
    layerCount: editorCheck.layerRowsCount,
    layers: editorCheck.layerRows,
  });
  await takeScreenshot('psd_03_editor_layers_loaded.png');

  // Step 6: Test Layer Interaction (Select text layer, toggle visibility)
  console.log('[PSD Audit] Testing layer interactions...');
  const interactionCheck = await evaluate(`
    (() => {
      // Find Project Heading text layer row
      const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"], [class*="layerRow"]'));
      const textRow = rows.find(r => r.textContent.includes('Heading') || r.textContent.includes('Project') || r.textContent.includes('Title'));
      if (textRow) {
        textRow.click();
      }

      // Check contextual toolbar or properties for text controls
      const contextBar = document.querySelector('[data-testid="contextual-toolbar"], [class*="contextualToolbar"]');
      const hasFontControls = Boolean(contextBar?.querySelector('select, input, button'));

      return {
        textRowClicked: Boolean(textRow),
        contextBarFound: Boolean(contextBar),
        hasFontControls,
      };
    })()
  `);
  console.log('[PSD Audit] Interaction check:', interactionCheck);
  await sleep(500);
  await takeScreenshot('psd_04_layer_manipulation.png');

  const auditReport = {
    timestamp: new Date().toISOString(),
    initialCheck,
    modalCheck,
    summaryCheck: {
      confirmBtnReady: summaryCheck?.confirmBtnReady,
      docTitle: summaryCheck?.docTitle,
      warnings: summaryCheck?.warnings,
    },
    editorCheck,
    interactionCheck,
    success: Boolean(
      modalCheck.modalVisible &&
      !modalCheck.placeholderFound &&
      summaryCheck?.confirmBtnReady &&
      editorCheck.layerRowsCount >= 6
    ),
  };

  fs.writeFileSync(
    path.join(outDir, 'psd_import_audit_results.json'),
    JSON.stringify(auditReport, null, 2)
  );
  console.log('[PSD Audit] Full results written to psd_import_audit_results.json');
  console.log('[PSD Audit] Overall status:', auditReport.success ? 'SUCCESS' : 'FAILED');

  ws.close();
  if (edge) edge.kill();
}

run().catch((err) => {
  console.error('[PSD Audit] Error:', err);
  if (edge) edge.kill();
  process.exit(1);
});
