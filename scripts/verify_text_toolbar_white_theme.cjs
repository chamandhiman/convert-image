const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const CDP_PORT = 9832;

const edgeProc = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--window-size=1600,1000',
  '--user-data-dir=C:/Temp/edge-white-toolbar-test',
]);

async function run() {
  try {
    let wsUrl = null;
    for (let i = 0; i < 35; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        if (res.ok) {
          const list = await res.json();
          if (list[0]?.webSocketDebuggerUrl) {
            wsUrl = list[0].webSocketDebuggerUrl;
            break;
          }
        }
      } catch { }
    }

    if (!wsUrl) throw new Error('Could not connect to Edge remote debugging WebSocket');
    console.log('[CDP] Connected to Edge WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((r) => (ws.onopen = r));

    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const cur = msgId++;
        const handler = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === cur) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: cur, method, params }));
      });

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('[CDP] Navigating to http://127.0.0.1:4173/edit-image ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/edit-image' });
    await new Promise((r) => setTimeout(r, 2000));

    // Dismiss cookie banner
    await send('Runtime.evaluate', {
      expression: `(() => {
        try {
          localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));
        } catch {}
        const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Accept All'));
        if (acceptBtn) acceptBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Click "New Project" to create a blank canvas document
    console.log('[CDP] Creating blank canvas document...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const newProjBtn = document.querySelector('[data-testid="welcome-card-new-project"]');
        if (newProjBtn) newProjBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Confirm Create Canvas in modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const createBtn = document.querySelector('[data-testid="btn-create-blank-canvas"]') ||
          Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Create'));
        if (createBtn) createBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Select the Text Tool from the left toolbar
    console.log('[CDP] Selecting Text Tool...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textToolBtn = document.querySelector('[data-tool-id="text"]') ||
          document.querySelector('button[title*="Type Tool" i]');
        if (textToolBtn) textToolBtn.click();
      })()`,
    });

    await new Promise((r) => setTimeout(r, 1000));

    // Inspect the Text Tool Contextual Toolbar styles
    const toolbarMetrics = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const pill = document.querySelector('[data-testid="premium-text-toolbar"]');
        if (!pill) return { found: false };

        const pillCs = window.getComputedStyle(pill);
        const fontSelect = pill.querySelector('[data-testid="select-text-font-family"]');
        const fontWrap = fontSelect ? fontSelect.parentElement : null;
        const fontCs = fontSelect ? window.getComputedStyle(fontSelect) : null;
        const fontWrapCs = fontWrap ? window.getComputedStyle(fontWrap) : null;

        const sizeSelect = pill.querySelector('[data-testid="select-text-font-size"]');
        const sizeCs = sizeSelect ? window.getComputedStyle(sizeSelect) : null;

        const boldBtn = pill.querySelector('[data-testid="btn-text-bold"]');
        const boldCs = boldBtn ? window.getComputedStyle(boldBtn) : null;

        const alignLeftBtn = pill.querySelector('[data-testid="btn-text-align-left"]');
        const alignLeftCs = alignLeftBtn ? window.getComputedStyle(alignLeftBtn) : null;

        const alignCenterBtn = pill.querySelector('[data-testid="btn-text-align-center"]');
        const alignCenterCs = alignCenterBtn ? window.getComputedStyle(alignCenterBtn) : null;

        const colorLabel = pill.querySelector('[class*="textColorA"]');
        const colorLabelCs = colorLabel ? window.getComputedStyle(colorLabel) : null;

        const strokeLabel = pill.querySelector('[class*="premiumControlLabel"]');
        const strokeLabelCs = strokeLabel ? window.getComputedStyle(strokeLabel) : null;

        const strokeSelect = pill.querySelector('[data-testid="select-text-stroke-width"]');
        const strokeSelectCs = strokeSelect ? window.getComputedStyle(strokeSelect) : null;

        const opacitySelect = pill.querySelector('[data-testid="select-text-opacity"]');
        const opacitySelectCs = opacitySelect ? window.getComputedStyle(opacitySelect) : null;

        const divider = pill.querySelector('[class*="pillDivider"]');
        const dividerCs = divider ? window.getComputedStyle(divider) : null;

        const toolBadge = pill.querySelector('[data-testid="contextual-tool-badge"]');
        const toolBadgeCs = toolBadge ? window.getComputedStyle(toolBadge) : null;
        const toolLetter = toolBadge ? toolBadge.querySelector('[class*="toolIndicatorLetter"]') : null;
        const toolLetterCs = toolLetter ? window.getComputedStyle(toolLetter) : null;

        const pillRect = pill.getBoundingClientRect();

        return {
          found: true,
          pill: {
            background: pillCs.backgroundColor,
            borderColor: pillCs.borderColor,
            boxShadow: pillCs.boxShadow,
            borderRadius: pillCs.borderRadius,
            height: pillRect.height,
            width: pillRect.width,
            rect: {
              left: Math.round(pillRect.left),
              top: Math.round(pillRect.top),
              width: Math.round(pillRect.width),
              height: Math.round(pillRect.height),
            }
          },
          toolBadge: {
            letterColor: toolLetterCs ? toolLetterCs.color : null,
          },
          fontSelect: {
            background: fontCs ? fontCs.backgroundColor : null,
            color: fontCs ? fontCs.color : null,
            wrapBackground: fontWrapCs ? fontWrapCs.backgroundColor : null,
            wrapBorderColor: fontWrapCs ? fontWrapCs.borderColor : null,
          },
          boldBtn: {
            color: boldCs ? boldCs.color : null,
            background: boldCs ? boldCs.backgroundColor : null,
          },
          alignLeftBtn: {
            color: alignLeftCs ? alignLeftCs.color : null,
            background: alignLeftCs ? alignLeftCs.backgroundColor : null,
          },
          alignCenterBtn: {
            color: alignCenterCs ? alignCenterCs.color : null,
            background: alignCenterCs ? alignCenterCs.backgroundColor : null,
          },
          colorLabel: {
            color: colorLabelCs ? colorLabelCs.color : null,
          },
          strokeLabel: {
            color: strokeLabelCs ? strokeLabelCs.color : null,
          },
          divider: {
            background: dividerCs ? dividerCs.backgroundColor : null,
          },
        };
      })()`,
    });

    console.log('[CDP] Toolbar computed styling:', JSON.stringify(toolbarMetrics.result.value, null, 2));

    // Capture screenshot 1: Full editor with white theme text contextual toolbar
    const ssFull = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'text_toolbar_white_theme_restored.png'), Buffer.from(ssFull.data, 'base64'));
    console.log('[CDP] Saved text_toolbar_white_theme_restored.png');

    // Capture screenshot 2: Close-up clip of the restored text contextual toolbar
    const pillRect = toolbarMetrics.result.value?.pill?.rect || { left: 40, top: 40, width: 800, height: 44 };
    const ssClip = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: Math.max(0, pillRect.left - 20),
        y: Math.max(0, pillRect.top - 10),
        width: Math.min(1500, pillRect.width + 40),
        height: pillRect.height + 20,
        scale: 2, // HiDPI
      },
    });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'text_toolbar_white_theme_closeup.png'), Buffer.from(ssClip.data, 'base64'));
    console.log('[CDP] Saved text_toolbar_white_theme_closeup.png');

    // Write verification JSON
    const reportData = {
      timestamp: new Date().toISOString(),
      toolbarMetrics: toolbarMetrics.result.value,
      isWhiteTheme: toolbarMetrics.result.value?.pill?.background === 'rgb(255, 255, 255)',
      isNotDarkTheme: toolbarMetrics.result.value?.pill?.background !== 'rgb(24, 24, 34)',
      activeAlignButtonPurple: toolbarMetrics.result.value?.alignLeftBtn?.background === 'rgb(124, 58, 237)',
      textIsDarkNavy: toolbarMetrics.result.value?.fontSelect?.color === 'rgb(30, 41, 59)',
    };
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'text_toolbar_white_theme_verification.json'), JSON.stringify(reportData, null, 2));
    console.log('[CDP] Saved text_toolbar_white_theme_verification.json');

    edgeProc.kill();
    process.exit(0);
  } catch (err) {
    console.error('[CDP] Verification failed:', err);
    edgeProc.kill();
    process.exit(1);
  }
}

run();
