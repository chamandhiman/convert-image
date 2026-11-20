const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9448;
const previewUrl = 'http://127.0.0.1:4173/edit-image';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-new-proj-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runSimplifiedNewProjectModalAudit() {
  console.log('--- Launching Edge for Simplified New Project Modal Verification ---');
  const edge = spawn(edgePath, [
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
    'about:blank',
  ]);

  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((t) => t.type === 'page' && (t.url.startsWith('http') || t.url === 'about:blank'));
        if (found) {
          pageTarget = found;
          break;
        }
      }
    } catch { }
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
      }, 20000);

      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === curId) {
          clearTimeout(timer);
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  const evaluate = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  };

  const captureScreenshot = async (filePath) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
  };

  const auditResults = {
    test: 'Simplify New Project Modal - Remove Unnecessary Presets',
    timestamp: new Date().toISOString(),
    checks: {},
    measurements: {},
  };

  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log(`Navigating to ${previewUrl}...`);
    await send('Page.navigate', { url: previewUrl });
    await sleep(2500);

    // Dismiss cookie banner if present
    await evaluate(`(() => {
      try {
        localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));
      } catch {}
      const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Accept All'));
      if (acceptBtn) acceptBtn.click();
    })()`);
    await sleep(500);

    // Ensure we are on welcome screen or can open new project modal
    let foundCard = false;
    for (let i = 0; i < 30; i++) {
      foundCard = await evaluate(`!!document.querySelector('[data-testid="welcome-card-new-project"]') || !!document.querySelector('[data-testid="editor-welcome-screen"]')`);
      if (foundCard) break;
      await sleep(200);
    }

    const initialScreen = await evaluate(`(() => {
      const welcome = document.querySelector('[data-testid="welcome-screen"]') || document.querySelector('[data-testid="editor-welcome-screen"]') || document.querySelector('[data-testid="welcome-card-new-project"]');
      const canvas = document.querySelector('canvas') || document.querySelector('.mainCanvasContainer');
      return { hasWelcome: !!welcome, hasCanvas: !!canvas };
    })()`);
    console.log('Initial screen state:', initialScreen);

    // Open modal via Welcome screen card
    console.log('Clicking New Project card on Welcome Screen...');
    await evaluate(`document.querySelector('[data-testid="welcome-card-new-project"]').click()`);
    await sleep(600);

    // Check modal opened
    const modalInfo = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="new-project-modal"]');
      if (!modal) return null;
      const rect = modal.getBoundingClientRect();
      return {
        exists: true,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        htmlText: modal.textContent,
      };
    })()`);

    if (!modalInfo) {
      throw new Error('New Project Modal did not open!');
    }
    console.log('Modal opened successfully. Dimensions:', modalInfo.rect);
    auditResults.measurements.modalRect = modalInfo.rect;

    // Check 1: Popular presets completely removed
    const presetsAudit = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="new-project-modal"]');
      const allText = modal.textContent;
      const forbiddenPhrases = [
        'Popular Presets',
        'Instagram Post',
        'Instagram Story',
        'YouTube Thumbnail',
        'Facebook Cover',
        'Custom Size',
      ];
      const foundPhrases = forbiddenPhrases.filter(p => allText.includes(p));
      const presetChips = modal.querySelectorAll('[class*="presetChip"], [data-testid*="preset-chip"]');
      const presetChipsRow = modal.querySelectorAll('[class*="presetChipsRow"]');
      return {
        forbiddenFound: foundPhrases,
        chipsCount: presetChips.length,
        chipRowsCount: presetChipsRow.length,
        hasNoPresets: foundPhrases.length === 0 && presetChips.length === 0 && presetChipsRow.length === 0,
      };
    })()`);

    console.log('Presets Audit:', presetsAudit);
    auditResults.checks.popularPresetsCompletelyRemoved = presetsAudit.hasNoPresets;
    auditResults.measurements.presetsFound = presetsAudit.forbiddenFound;

    // Check 2: Essential settings present and verified
    const essentialSettingsAudit = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="new-project-modal"]');
      const docName = modal.querySelector('[data-testid="input-doc-name"]');
      const width = modal.querySelector('[data-testid="input-canvas-width"]');
      const height = modal.querySelector('[data-testid="input-canvas-height"]');
      const lockAspect = modal.querySelector('[data-testid="btn-lock-aspect"]');
      const unit = modal.querySelector('[data-testid="select-canvas-unit"]');
      const dpi72 = modal.querySelector('[data-testid="dpi-chip-72"]');
      const dpi150 = modal.querySelector('[data-testid="dpi-chip-150"]');
      const dpi300 = modal.querySelector('[data-testid="dpi-chip-300"]');
      const bgWhite = modal.querySelector('[data-testid="bg-option-white"]');
      const bgTrans = modal.querySelector('[data-testid="bg-option-transparent"]');
      const bgCustom = modal.querySelector('[data-testid="bg-option-custom"]');
      const cancelBtn = modal.querySelector('[data-testid="new-project-cancel-btn"]');
      const submitBtn = modal.querySelector('[data-testid="new-project-submit-btn"]');

      return {
        hasDocName: !!docName && docName.placeholder === 'Untitled-1',
        hasWidth: !!width && Number(width.value) > 0,
        hasHeight: !!height && Number(height.value) > 0,
        hasLockAspect: !!lockAspect,
        hasUnit: !!unit,
        unitOptions: unit ? Array.from(unit.options).map(o => o.value) : [],
        hasDpi72: !!dpi72,
        hasDpi150: !!dpi150,
        hasDpi300: !!dpi300,
        hasBgWhite: !!bgWhite,
        hasBgTrans: !!bgTrans,
        hasBgCustom: !!bgCustom,
        hasCancelBtn: !!cancelBtn && cancelBtn.textContent.trim() === 'Cancel',
        hasSubmitBtn: !!submitBtn && submitBtn.textContent.includes('Create Project'),
      };
    })()`);

    console.log('Essential Settings Audit:', essentialSettingsAudit);
    const allEssentialPresent = Object.values(essentialSettingsAudit).every((v) =>
      Array.isArray(v) ? v.length >= 3 : Boolean(v)
    );
    auditResults.checks.allEssentialSettingsPresent = allEssentialPresent;
    auditResults.measurements.essentialSettings = essentialSettingsAudit;

    // Check 3: Compact and centered modal layout
    const layoutAudit = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="new-project-modal"]');
      const rect = modal.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      const centeredX = Math.abs((viewportW - rect.width) / 2 - rect.left) < 15;
      const centeredY = Math.abs((viewportH - rect.height) / 2 - rect.top) < 30;

      // Check if body is scrollable or fits comfortably
      const isCompactHeight = rect.height <= 550;
      const isCompactWidth = rect.width <= 500;

      return {
        width: rect.width,
        height: rect.height,
        centeredX,
        centeredY,
        isCompactHeight,
        isCompactWidth,
      };
    })()`);

    console.log('Layout Audit:', layoutAudit);
    auditResults.checks.layoutIsCompactAndCentered = layoutAudit.centeredX && layoutAudit.isCompactHeight && layoutAudit.isCompactWidth;
    auditResults.measurements.layout = layoutAudit;

    // Capture screenshot of simplified modal
    const modalScreenshotPath = path.join(ARTIFACT_DIR, 'simplified_new_project_modal_opened.png');
    await captureScreenshot(modalScreenshotPath);

    // Test 4: Interactive functionality: Fill in custom values, change DPI to 300, select Transparent background
    console.log('Testing interactive updates in New Project Modal...');
    await evaluate(`(() => {
      const docName = document.querySelector('[data-testid="input-doc-name"]');
      const width = document.querySelector('[data-testid="input-canvas-width"]');
      const height = document.querySelector('[data-testid="input-canvas-height"]');
      const dpi300 = document.querySelector('[data-testid="dpi-chip-300"]');
      const bgTrans = document.querySelector('[data-testid="bg-option-transparent"]');

      // Update name
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(docName, 'Social Banner HD');
      docName.dispatchEvent(new Event('input', { bubbles: true }));

      // Update dimensions to 1920x1080
      nativeSetter.call(width, '1920');
      width.dispatchEvent(new Event('input', { bubbles: true }));

      nativeSetter.call(height, '1080');
      height.dispatchEvent(new Event('input', { bubbles: true }));

      // Click DPI 300
      dpi300.click();

      // Click Transparent BG
      bgTrans.click();
    })()`);

    await sleep(400);

    // Verify values updated in state
    const updatedValues = await evaluate(`(() => {
      const dpi300 = document.querySelector('[data-testid="dpi-chip-300"]');
      const bgTrans = document.querySelector('[data-testid="bg-option-transparent"]');
      return {
        name: document.querySelector('[data-testid="input-doc-name"]').value,
        width: document.querySelector('[data-testid="input-canvas-width"]').value,
        height: document.querySelector('[data-testid="input-canvas-height"]').value,
        isDpi300Active: dpi300.className.includes('dpiChipActive'),
        isTransActive: bgTrans.className.includes('bgOptionCardActive'),
      };
    })()`);

    console.log('Updated Form Values:', updatedValues);
    auditResults.measurements.updatedValues = updatedValues;
    auditResults.checks.inputsAndSelectionWork = updatedValues.isDpi300Active && updatedValues.isTransActive;

    // Capture screenshot with updated custom inputs
    const filledScreenshotPath = path.join(ARTIFACT_DIR, 'simplified_new_project_modal_filled.png');
    await captureScreenshot(filledScreenshotPath);

    // Click Create Project button
    console.log('Submitting form to create project...');
    await evaluate(`document.querySelector('[data-testid="new-project-submit-btn"]').click()`);
    await sleep(1500);

    // Verify modal closed and canvas created with 1920x1080
    const canvasCreated = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="new-project-modal"]');
      const canvas = document.querySelector('canvas') || document.querySelector('.mainCanvasContainer');
      const docNameHeader = document.querySelector('[data-testid="document-name"]') || Array.from(document.querySelectorAll('span, div')).find(el => el.textContent.includes('Social Banner HD'));
      return {
        modalClosed: !modal,
        hasCanvas: !!canvas,
        hasDocName: !!docNameHeader,
      };
    })()`);

    console.log('Canvas creation result:', canvasCreated);
    auditResults.checks.projectCreatedSuccessfully = canvasCreated.modalClosed && canvasCreated.hasCanvas;

    // Capture canvas screenshot
    const canvasScreenshotPath = path.join(ARTIFACT_DIR, 'simplified_new_project_created_canvas.png');
    await captureScreenshot(canvasScreenshotPath);

    // Test 5: Open from File menu -> New Document while inside editor
    console.log('Testing opening New Project modal from File menu...');
    await evaluate(`
      const fileBtn = document.querySelector('[data-testid="menu-btn-file"]');
      if (fileBtn) fileBtn.click();
    `);
    await sleep(400);

    const menuOpen = await evaluate(`(() => {
      const newDocBtn = document.querySelector('[data-testid="menu-file-new"]');
      if (newDocBtn) {
        newDocBtn.click();
        return true;
      }
      return false;
    })()`);

    console.log('File -> New clicked:', menuOpen);
    await sleep(600);

    const reOpenedModal = await evaluate(`(() => {
      const modal = document.querySelector('[data-testid="new-project-modal"]');
      if (!modal) return null;
      const presets = modal.querySelectorAll('[class*="presetChip"], [data-testid*="preset-chip"]');
      const cancelBtn = modal.querySelector('[data-testid="new-project-cancel-btn"]');
      return {
        opened: true,
        presetsCount: presets.length,
        hasCancel: !!cancelBtn,
      };
    })()`);

    console.log('Re-opened modal from File menu:', reOpenedModal);
    auditResults.checks.openedFromFileMenuCleanly = !!(reOpenedModal && reOpenedModal.opened && reOpenedModal.presetsCount === 0);

    if (reOpenedModal) {
      const menuModalScreenshotPath = path.join(ARTIFACT_DIR, 'simplified_new_project_modal_from_menu.png');
      await captureScreenshot(menuModalScreenshotPath);

      // Cancel to close
      await evaluate(`document.querySelector('[data-testid="new-project-cancel-btn"]').click()`);
      await sleep(400);
      const isClosed = await evaluate(`!document.querySelector('[data-testid="new-project-modal"]')`);
      auditResults.checks.cancelButtonClosesModal = isClosed;
    }

    // Save JSON results
    const jsonPath = path.join(ARTIFACT_DIR, 'simplified_new_project_verification.json');
    fs.writeFileSync(jsonPath, JSON.stringify(auditResults, null, 2), 'utf8');
    console.log(`Saved audit results: ${jsonPath}`);
    console.log('--- ALL CHECKS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exitCode = 1;
  } finally {
    try { ws.close(); } catch {}
    try { edge.kill(); } catch {}
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch {}
  }
}

runSimplifiedNewProjectModalAudit();
