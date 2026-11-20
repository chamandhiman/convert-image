const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EDGE_PORT = 9450 + Math.floor(Math.random() * 400);
const APP_URL = 'http://127.0.0.1:4173/edit-image';

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('[TEST] Starting headless browser verification for Text Toolbar Redesign...');

  const tmpUserData = path.join(process.env.TEMP || 'C:\\Temp', 'edge_text_toolbar_' + Date.now());

  const edgeProcess = spawn(EDGE_BIN, [
    `--remote-debugging-port=${EDGE_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tmpUserData}`,
    '--window-size=1440,900',
    APP_URL,
  ]);

  edgeProcess.on('error', (err) => {
    console.error('[TEST] Edge process error:', err);
  });

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await wait(400);
    try {
      targets = await fetchJson(`http://127.0.0.1:${EDGE_PORT}/json`);
      if (targets && targets.length > 0) break;
    } catch (_) {}
  }

  if (!targets || targets.length === 0) {
    console.error('[TEST] Could not connect to Edge DevTools target.');
    edgeProcess.kill();
    process.exit(1);
  }

  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('4173')) || targets[0];
  console.log('[TEST] Connected to target page:', pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const res = JSON.parse(event.data);
    if (res.id && pending.has(res.id)) {
      const { resolve, reject } = pending.get(res.id);
      pending.delete(res.id);
      if (res.error) reject(res.error);
      else resolve(res.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function sendCmd(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expr) {
    for (let attempt = 0; attempt < 25; attempt++) {
      try {
        const res = await sendCmd('Runtime.evaluate', {
          expression: expr,
          returnByValue: true,
          awaitPromise: true,
        });
        if (res.exceptionDetails) {
          throw new Error(JSON.stringify(res.exceptionDetails));
        }
        return res.result ? res.result.value : undefined;
      } catch (err) {
        if (err.message && err.message.includes('execution context')) {
          await wait(300);
          continue;
        }
        throw err;
      }
    }
  }

  async function waitForSelector(selector, maxTries = 40) {
    for (let i = 0; i < maxTries; i++) {
      const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await wait(250);
    }
    return false;
  }

  async function captureScreenshot(name) {
    const res = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, `${name}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`[SCREENSHOT] Saved: ${name}.png`);
    return outPath;
  }

  const results = {};

  try {
    console.log('[Audit] Enabling DevTools domains...');
    await sendCmd('Page.enable');
    await sendCmd('DOM.enable');
    await sendCmd('Runtime.enable');

    console.log('[Audit] Navigating to editor...');
    await sendCmd('Page.navigate', { url: APP_URL });
    await wait(2500);

    // Dismiss cookie banner if present
    await evaluate(`
      (() => {
        const btn = document.querySelector('button[aria-label="Accept all cookies"]') ||
          Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept') || b.textContent.includes('Got it'));
        if (btn) btn.click();
      })()
    `);
    await wait(500);

    // Step 1: Open document from welcome screen
    console.log('[Audit] Checking welcome screen & opening project...');
    const hasPreset = await waitForSelector('[data-testid="preset-card-ig-post"]', 40);
    if (!hasPreset) {
      throw new Error('Preset card [data-testid="preset-card-ig-post"] not found on welcome screen');
    }

    await evaluate(`document.querySelector('[data-testid="preset-card-ig-post"]').click()`);
    await waitForSelector('[data-canvas-stage="true"], [data-testid="canvas-stage"]', 40);
    await wait(1500);

    const docState = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]') || document.querySelector('[data-testid="canvas-stage"]');
      const tabs = Array.from(document.querySelectorAll('[data-testid^="document-tab-"]')).map(t => t.textContent.trim());
      return {
        hasStage: Boolean(stage),
        tabs,
      };
    })()`);
    console.log('[Audit] Document Canvas initialized:', docState);

    // Step 2: Activate Text Tool
    console.log('[Audit] Activating Text Tool...');
    await waitForSelector('[data-testid="tool-text"]', 30);
    await evaluate(`document.querySelector('[data-testid="tool-text"]').click()`);
    await wait(800);

    // Step 3: Inspect Text Contextual Toolbar
    console.log('[Audit] Inspecting Text Contextual Toolbar...');
    const toolbarAudit = await evaluate(`
      (() => {
        const pill = document.querySelector('[data-testid="premium-text-toolbar"]');
        const badge = document.querySelector('[data-testid="contextual-tool-badge"]');
        const fontFamily = document.querySelector('[data-testid="select-text-font-family"]');
        const fontSize = document.querySelector('[data-testid="select-text-font-size"]');
        const boldBtn = document.querySelector('[data-testid="btn-text-bold"]');
        const italicBtn = document.querySelector('[data-testid="btn-text-italic"]');
        const underlineBtn = document.querySelector('[data-testid="btn-text-underline"]');
        const alignLeft = document.querySelector('[data-testid="btn-text-align-left"]');
        const alignCenter = document.querySelector('[data-testid="btn-text-align-center"]');
        const alignRight = document.querySelector('[data-testid="btn-text-align-right"]');
        const colorWrap = document.querySelector('[data-testid="wrap-text-color"]');
        const colorInput = document.querySelector('[data-testid="input-text-color"]');
        const strokeWrap = document.querySelector('[data-testid="wrap-text-stroke-color"]');
        const strokeWidth = document.querySelector('[data-testid="select-text-stroke-width"]');
        const strokeInput = document.querySelector('[data-testid="input-text-stroke-color"]');
        const opacity = document.querySelector('[data-testid="select-text-opacity"]');

        // Check removed items
        const posX = document.querySelector('[data-testid="input-text-pos-x"]');
        const posY = document.querySelector('[data-testid="input-text-pos-y"]');
        const width = document.querySelector('[data-testid="input-text-width"]');
        const lock = document.querySelector('[data-testid="btn-text-lock"]');
        const lineSpacing = document.querySelector('[data-testid="input-text-line-height"]');
        const letterSpacing = document.querySelector('[data-testid="input-text-letter-spacing"]');
        const preset = document.querySelector('[data-testid="select-text-preset"]');
        const bgColor = document.querySelector('[data-testid="input-text-bg-color"]');

        // Horizontal scroll check on wrapper
        const wrapper = document.querySelector('[data-testid="contextual-toolbar"]');
        const hasHorizontalScroll = wrapper ? (wrapper.scrollWidth > wrapper.clientWidth) : false;

        return {
          pillPresent: Boolean(pill),
          pillRect: pill ? pill.getBoundingClientRect() : null,
          badgePresent: Boolean(badge),
          badgeText: badge ? badge.textContent.trim() : null,
          fontFamilyValue: fontFamily ? fontFamily.value : null,
          fontSizeValue: fontSize ? fontSize.value : null,
          boldPresent: Boolean(boldBtn),
          italicPresent: Boolean(italicBtn),
          underlinePresent: Boolean(underlineBtn),
          alignLeftPresent: Boolean(alignLeft),
          alignCenterPresent: Boolean(alignCenter),
          alignRightPresent: Boolean(alignRight),
          colorWrapPresent: Boolean(colorWrap),
          strokeWrapPresent: Boolean(strokeWrap),
          strokeWidthValue: strokeWidth ? strokeWidth.value : null,
          opacityValue: opacity ? opacity.value : null,
          // Removed items confirmation
          removedItems: {
            posXAbsent: posX === null,
            posYAbsent: posY === null,
            widthAbsent: width === null,
            lockAbsent: lock === null,
            lineSpacingAbsent: lineSpacing === null,
            letterSpacingAbsent: letterSpacing === null,
            presetAbsent: preset === null,
            bgColorAbsent: bgColor === null,
          },
          wrapperClientWidth: wrapper ? wrapper.clientWidth : 0,
          wrapperScrollWidth: wrapper ? wrapper.scrollWidth : 0,
          hasHorizontalScroll,
        };
      })()
    `);

    results.toolbarAudit = toolbarAudit;
    console.log('[Audit] Toolbar audit result:', JSON.stringify(toolbarAudit, null, 2));

    await captureScreenshot('text_toolbar_01_initial_appearance');

    // Step 4: Click on canvas stage to insert text layer
    console.log('[Audit] Clicking on canvas stage with mousedown/mouseup to insert text layer...');
    await evaluate(`
      (() => {
        const stage = document.querySelector('[data-canvas-stage="true"]') || document.querySelector('canvas');
        if (stage) {
          const rect = stage.getBoundingClientRect();
          const clientX = Math.round(rect.left + rect.width / 2);
          const clientY = Math.round(rect.top + rect.height / 2);
          stage.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons: 1,
            clientX,
            clientY,
          }));
          stage.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons: 0,
            clientX: clientX,
            clientY: clientY,
          }));
        }
      })()
    `);
    await wait(1200);

    // Verify text layer was created
    const textLayerAudit = await evaluate(`
      (() => {
        const textNodes = Array.from(document.querySelectorAll('[data-text-content="true"], [data-testid*="text-layer"], textarea'));
        const textLayerSelected = document.querySelector('[data-testid="premium-text-toolbar"]');
        return {
          textNodesCount: textNodes.length,
          toolbarStillVisible: Boolean(textLayerSelected),
        };
      })()
    `);
    results.textLayerAudit = textLayerAudit;
    console.log('[Audit] Text layer insertion result:', textLayerAudit);

    // Step 5: Test Bold toggle
    console.log('[Audit] Testing Bold toggle...');
    await evaluate(`
      (() => {
        const boldBtn = document.querySelector('[data-testid="btn-text-bold"]');
        if (boldBtn) boldBtn.click();
      })()
    `);
    await wait(500);

    // Step 6: Test Italic toggle
    console.log('[Audit] Testing Italic toggle...');
    await evaluate(`
      (() => {
        const italicBtn = document.querySelector('[data-testid="btn-text-italic"]');
        if (italicBtn) italicBtn.click();
      })()
    `);
    await wait(500);

    // Step 7: Test Underline toggle
    console.log('[Audit] Testing Underline toggle...');
    await evaluate(`
      (() => {
        const underlineBtn = document.querySelector('[data-testid="btn-text-underline"]');
        if (underlineBtn) underlineBtn.click();
      })()
    `);
    await wait(500);

    // Step 8: Test Font Size Change to 48
    console.log('[Audit] Testing Font Size change to 48...');
    await evaluate(`
      (() => {
        const select = document.querySelector('[data-testid="select-text-font-size"]');
        if (select) {
          select.value = '48';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await wait(500);

    // Step 9: Test Stroke Width change to 2 px
    console.log('[Audit] Testing Stroke Width change to 2 px...');
    await evaluate(`
      (() => {
        const select = document.querySelector('[data-testid="select-text-stroke-width"]');
        if (select) {
          select.value = '2';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await wait(500);

    // Audit formatting state using computed styles and values
    const formattingAudit = await evaluate(`
      (() => {
        const boldBtn = document.querySelector('[data-testid="btn-text-bold"]');
        const italicBtn = document.querySelector('[data-testid="btn-text-italic"]');
        const underlineBtn = document.querySelector('[data-testid="btn-text-underline"]');
        const sizeSelect = document.querySelector('[data-testid="select-text-font-size"]');
        const strokeSelect = document.querySelector('[data-testid="select-text-stroke-width"]');
        const strokeSwatch = document.querySelector('[data-testid="wrap-text-stroke-color"]');
        const slashSvg = strokeSwatch ? strokeSwatch.querySelector('svg') : null;

        const boldBg = boldBtn ? window.getComputedStyle(boldBtn).backgroundColor : '';
        const italicBg = italicBtn ? window.getComputedStyle(italicBtn).backgroundColor : '';
        const underlineBg = underlineBtn ? window.getComputedStyle(underlineBtn).backgroundColor : '';

        return {
          boldBg,
          boldIsPurple: boldBg.includes('124, 58, 237'),
          italicBg,
          italicIsPurple: italicBg.includes('124, 58, 237'),
          underlineBg,
          underlineIsPurple: underlineBg.includes('124, 58, 237'),
          fontSizeValue: sizeSelect ? sizeSelect.value : null,
          strokeWidthValue: strokeSelect ? strokeSelect.value : null,
          slashSvgPresent: Boolean(slashSvg), // Should be false when stroke is 2px
        };
      })()
    `);
    results.formattingAudit = formattingAudit;
    console.log('[Audit] Formatting audit result:', formattingAudit);

    await captureScreenshot('text_toolbar_02_formatting_applied');

    // Step 10: Test Center Alignment & Opacity 75% & Stroke 0 px
    console.log('[Audit] Testing Center Alignment, Opacity 75%, and Stroke 0 px...');
    await evaluate(`
      (() => {
        const alignCenter = document.querySelector('[data-testid="btn-text-align-center"]');
        if (alignCenter) alignCenter.click();

        const opacitySelect = document.querySelector('[data-testid="select-text-opacity"]');
        if (opacitySelect) {
          opacitySelect.value = '75';
          opacitySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const strokeSelect = document.querySelector('[data-testid="select-text-stroke-width"]');
        if (strokeSelect) {
          strokeSelect.value = '0';
          strokeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await wait(800);

    const step10Audit = await evaluate(`
      (() => {
        const alignCenter = document.querySelector('[data-testid="btn-text-align-center"]');
        const opacitySelect = document.querySelector('[data-testid="select-text-opacity"]');
        const strokeSelect = document.querySelector('[data-testid="select-text-stroke-width"]');
        const strokeSwatch = document.querySelector('[data-testid="wrap-text-stroke-color"]');
        const slashSvg = strokeSwatch ? strokeSwatch.querySelector('svg') : null;
        const centerBg = alignCenter ? window.getComputedStyle(alignCenter).backgroundColor : '';

        return {
          centerBg,
          centerIsPurple: centerBg.includes('124, 58, 237'),
          opacityValue: opacitySelect ? opacitySelect.value : null,
          strokeWidthValue: strokeSelect ? strokeSelect.value : null,
          slashSvgPresent: Boolean(slashSvg), // Should be true when stroke is 0px
        };
      })()
    `);
    results.step10Audit = step10Audit;
    console.log('[Audit] Center alignment & Opacity & Stroke 0px audit:', step10Audit);

    await captureScreenshot('text_toolbar_03_center_and_opacity');

    // Step 11: Switch away to Move Tool, then back to Text Layer to verify selection persistence
    console.log('[Audit] Switching to Move Tool and verifying layer selection...');
    await evaluate(`
      (() => {
        const moveBtn = document.querySelector('[data-tool="move"]') ||
          Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('title')?.includes('Move'));
        if (moveBtn) moveBtn.click();
      })()
    `);
    await wait(600);

    // Reselect text layer
    await evaluate(`
      (() => {
        const textLayer = document.querySelector('[data-text-content="true"], [data-testid*="text-layer"]');
        if (textLayer) {
          textLayer.click();
        }
      })()
    `);
    await wait(800);

    const reselectAudit = await evaluate(`
      (() => {
        const pill = document.querySelector('[data-testid="premium-text-toolbar"]');
        return {
          pillVisibleOnTextLayerSelect: Boolean(pill),
        };
      })()
    `);
    results.reselectAudit = reselectAudit;
    console.log('[Audit] Reselection audit:', reselectAudit);

    await captureScreenshot('text_toolbar_04_text_layer_reselected');

    // Save test results json
    const outJson = path.join(ARTIFACT_DIR, 'text_toolbar_redesign_verification.json');
    fs.writeFileSync(outJson, JSON.stringify(results, null, 2));
    console.log('[Audit] Verification results saved to:', outJson);

  } catch (err) {
    console.error('[Audit] Verification failed with error:', err);
  } finally {
    ws.close();
    edgeProcess.kill();
    console.log('[TEST] Verification finished and Edge terminated.');
  }
}

runVerification();
