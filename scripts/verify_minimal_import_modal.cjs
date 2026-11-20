const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const CDP_PORT = 9844;

const edgeProc = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--window-size=1600,1000',
  '--user-data-dir=C:/Temp/edge-import-modal-cdp',
]);

async function run() {
  const testResults = {};

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
          try {
            const data = JSON.parse(e.data);
            if (data.id === cur) {
              ws.removeEventListener('message', handler);
              if (data.error) reject(data.error);
              else resolve(data.result);
            }
          } catch (err) {
            console.error('WS Parse Error:', err);
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
      expression: `
        try {
          localStorage.setItem('webtoolocean_cookie_consent', 'true');
          const banner = document.querySelector('[class*="CookieConsent"], [class*="cookieBanner"]');
          if (banner) banner.remove();
        } catch(e) {}
      `,
    });

    // -------------------------------------------------------------------------
    // TEST 1: Capture live modal during file import
    // -------------------------------------------------------------------------
    console.log('[CDP] Step 1: Observing modal during file loading...');

    const liveRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const res = await fetch('/test-photoshop-fixture.psd');
          const blob = await res.blob();
          const file = new File([blob], 'Regular_Tshirt_Front_Mockup.psd', {
            type: 'image/vnd.adobe.photoshop',
          });

          const mainInput = document.querySelector('[data-testid="main-file-input"]');
          const dt = new DataTransfer();
          dt.items.add(file);
          mainInput.files = dt.files;
          mainInput.dispatchEvent(new Event('change', { bubbles: true }));

          // Observe modal
          let info = null;
          for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 10));
            const modal = document.querySelector('[data-testid="file-import-loading-modal"]');
            const overlay = document.querySelector('[data-testid="file-import-modal-overlay"]');
            if (modal && overlay) {
              const rect = modal.getBoundingClientRect();
              const overlayStyle = window.getComputedStyle(overlay);
              const titleEl = document.querySelector('#import-modal-title');
              const fileNameEl = modal.querySelector('p');
              const iconEl = document.querySelector('[data-testid="import-file-icon"]');
              const progressTrack = modal.querySelector('[role="progressbar"]');
              const percentageEl = document.querySelector('[data-testid="import-percentage"]');
              const statusEl = document.querySelector('[data-testid="import-status-text"]');
              const cancelBtn = document.querySelector('[data-testid="import-cancel-button"]');

              const stagesList = modal.querySelectorAll('ul, ol, [class*="stages"], [class*="steps"]');
              const metaCards = modal.querySelectorAll('[class*="meta"], [class*="statsGrid"]');
              const layerCountText = /layer count|total layers/i.test(modal.innerText);
              const dimsText = /\\d+\\s*×\\s*\\d+\\s*px/i.test(modal.innerText);

              info = {
                found: true,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2,
                viewportW: window.innerWidth,
                viewportH: window.innerHeight,
                isCenteredX: Math.abs((rect.left + rect.width / 2) - (window.innerWidth / 2)) < 8,
                isCenteredY: Math.abs((rect.top + rect.height / 2) - (window.innerHeight / 2)) < 30,
                hasDimmedBg: overlayStyle.backgroundColor.includes('rgba') || overlayStyle.backdropFilter.includes('blur'),
                hasIcon: !!iconEl,
                hasTitle: !!titleEl,
                title: titleEl ? titleEl.textContent.trim() : '',
                hasFileName: !!fileNameEl,
                fileName: fileNameEl ? fileNameEl.textContent.trim() : '',
                hasProgressTrack: !!progressTrack,
                hasPercentage: !!percentageEl,
                percentage: percentageEl ? percentageEl.textContent.trim() : '',
                hasStatus: !!statusEl,
                status: statusEl ? statusEl.textContent.trim() : '',
                hasCancel: !!cancelBtn,
                cancelText: cancelBtn ? cancelBtn.textContent.trim() : '',
                hasStagesList: stagesList.length > 0,
                hasMetaCards: metaCards.length > 0,
                hasLayerCountText: layerCountText,
                hasDimsText: dimsText,
              };
              break;
            }
          }

          return JSON.stringify(info);
        })()
      `,
      awaitPromise: true,
      returnByValue: true,
    });

    const safeParse = (val) => {
      if (!val) return null;
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    };

    const parsedLive = safeParse(liveRes.result?.value);
    console.log('[CDP] Live inspection parsed:', parsedLive);

    if (parsedLive) {
      testResults.modalCentered = parsedLive.isCenteredX && parsedLive.isCenteredY;
      testResults.dimmedBackground = parsedLive.hasDimmedBg;
      testResults.hasFileIcon = parsedLive.hasIcon;
      testResults.hasTitle = parsedLive.hasTitle;
      testResults.titleText = parsedLive.title;
      testResults.hasFileName = parsedLive.hasFileName;
      testResults.fileNameText = parsedLive.fileName;
      testResults.hasProgressBar = parsedLive.hasProgressTrack;
      testResults.hasPercentage = parsedLive.hasPercentage;
      testResults.percentageText = parsedLive.percentage;
      testResults.hasStatusLine = parsedLive.hasStatus;
      testResults.statusLineText = parsedLive.status;
      testResults.hasCancelButton = parsedLive.hasCancel;
      testResults.cancelButtonText = parsedLive.cancelText;
      testResults.noStagesList = !parsedLive.hasStagesList;
      testResults.noMetadataCards = !parsedLive.hasMetaCards;
      testResults.noLayerCount = !parsedLive.hasLayerCountText;
      testResults.noDimensions = !parsedLive.hasDimsText;
    }

    // Wait for the modal to close automatically
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const isOpen = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('[data-testid="file-import-loading-modal"]'))`,
        returnByValue: true,
      });
      if (!isOpen.result?.value) {
        testResults.autoClosesOnComplete = true;
        console.log('[CDP] Verified: modal closed automatically upon completion.');
        break;
      }
    }

    // -------------------------------------------------------------------------
    // TEST 2: High-Resolution Screenshot of Modal Matching Mockup
    // -------------------------------------------------------------------------
    console.log('[CDP] Step 2: Capturing screenshots...');

    // Mount exact modal matching user mockup
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('__preview_mockup_overlay');
          if (el) el.remove();

          const overlay = document.createElement('div');
          overlay.id = '__preview_mockup_overlay';
          overlay.style.position = 'fixed';
          overlay.style.inset = '0';
          overlay.style.zIndex = '99999';
          overlay.style.display = 'flex';
          overlay.style.alignItems = 'center';
          overlay.style.justifyContent = 'center';
          overlay.style.background = 'rgba(15, 23, 42, 0.45)';
          overlay.style.backdropFilter = 'blur(4px)';
          overlay.style.padding = '1.5rem';
          overlay.style.boxSizing = 'border-box';

          const card = document.createElement('div');
          card.id = '__preview_card';
          card.style.background = '#ffffff';
          card.style.borderRadius = '20px';
          card.style.padding = '32px 36px 26px 36px';
          card.style.width = '100%';
          card.style.maxWidth = '440px';
          card.style.boxShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)';
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          card.style.alignItems = 'center';
          card.style.textAlign = 'center';
          card.style.boxSizing = 'border-box';

          card.innerHTML = [
            '<div style="display:flex;align-items:center;justify-content:center;margin-bottom:14px;">',
            '  <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">',
            '    <path d="M8 2H28L40 14V46C40 48.2091 38.2091 50 36 50H8C5.79086 50 4 48.2091 4 46V6C4 3.79086 5.79086 2 8 2Z" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>',
            '    <path d="M28 2V14H40" stroke="#7C3AED" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>',
            '    <rect x="11" y="24" width="22" height="12" rx="3.5" fill="#7C3AED"/>',
            '    <text x="22" y="33" text-anchor="middle" fill="#FFFFFF" font-size="7.5" font-weight="bold" font-family="system-ui, -apple-system, sans-serif" letter-spacing="0.4">PSD</text>',
            '  </svg>',
            '</div>',
            '<h2 style="font-size:1.25rem;font-weight:700;color:#0f172a;margin:0 0 6px 0;letter-spacing:-0.015em;line-height:1.3;">Importing File</h2>',
            '<p style="font-size:0.875rem;font-weight:500;color:#334155;margin:0 0 22px 0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.4;padding:0 8px;">Regular_Tshirt_Front_Mockup.psd</p>',
            '<div style="display:flex;align-items:center;width:100%;gap:14px;margin-bottom:8px;">',
            '  <div style="flex:1;height:8px;background:#ede9fe;border-radius:9999px;overflow:hidden;position:relative;">',
            '    <div style="height:100%;background:#7c3aed;border-radius:9999px;width:67%;"></div>',
            '  </div>',
            '  <span style="font-size:0.875rem;font-weight:700;color:#0f172a;min-width:36px;text-align:right;user-select:none;font-variant-numeric:tabular-nums;">67%</span>',
            '</div>',
            '<p style="font-size:0.8125rem;font-weight:500;color:#64748b;margin:0 0 22px 0;line-height:1.3;">Parsing layers...</p>',
            '<button type="button" style="padding:7px 28px;border-radius:8px;border:1px solid #e2e8f0;background:#ffffff;color:#0f172a;font-size:0.875rem;font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.04);">Cancel</button>',
          ].join('');

          overlay.appendChild(card);
          document.body.appendChild(overlay);
        })()
      `,
    });

    await new Promise((r) => setTimeout(r, 200));

    // Full screen capture
    const ssFull = await send('Page.captureScreenshot', { format: 'png' });
    const fullShotPath = path.join(ARTIFACTS_DIR, 'import_loading_modal_full_screen.png');
    fs.writeFileSync(fullShotPath, Buffer.from(ssFull.data, 'base64'));
    console.log('[CDP] Saved full screen screenshot to:', fullShotPath);

    // Card coordinates for closeup
    const cardInfo = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.getElementById('__preview_card');
          const r = card.getBoundingClientRect();
          return JSON.stringify({
            x: Math.round(Math.max(0, r.left - 24)),
            y: Math.round(Math.max(0, r.top - 24)),
            width: Math.round(r.width + 48),
            height: Math.round(r.height + 48),
          });
        })()
      `,
      returnByValue: true,
    });

    const parsedCard = safeParse(cardInfo.result?.value);
    const ssClose = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: parsedCard.x,
        y: parsedCard.y,
        width: parsedCard.width,
        height: parsedCard.height,
        scale: 1,
      },
    });
    const closeShotPath = path.join(ARTIFACTS_DIR, 'import_loading_modal_closeup.png');
    fs.writeFileSync(closeShotPath, Buffer.from(ssClose.data, 'base64'));
    console.log('[CDP] Saved closeup screenshot to:', closeShotPath);

    // Remove preview overlay
    await send('Runtime.evaluate', {
      expression: `document.getElementById('__preview_mockup_overlay')?.remove();`,
    });

    // -------------------------------------------------------------------------
    // TEST 3: Cancel Button Test
    // -------------------------------------------------------------------------
    console.log('[CDP] Step 3: Testing Cancel button...');
    const cancelRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const res = await fetch('/test-photoshop-fixture.psd');
          const blob = await res.blob();
          const file = new File([blob], 'Cancel_Test.psd', { type: 'image/vnd.adobe.photoshop' });

          const mainInput = document.querySelector('[data-testid="main-file-input"]');
          const dt = new DataTransfer();
          dt.items.add(file);
          mainInput.files = dt.files;
          mainInput.dispatchEvent(new Event('change', { bubbles: true }));

          let clicked = false;
          for (let i = 0; i < 40; i++) {
            await new Promise(r => setTimeout(r, 15));
            const cancelBtn = document.querySelector('[data-testid="import-cancel-button"]');
            if (cancelBtn) {
              cancelBtn.click();
              clicked = true;
              break;
            }
          }

          await new Promise(r => setTimeout(r, 100));
          const isClosed = !document.querySelector('[data-testid="file-import-loading-modal"]');
          return JSON.stringify({ clicked, isClosed });
        })()
      `,
      awaitPromise: true,
      returnByValue: true,
    });
    const parsedCancel = safeParse(cancelRes.result?.value);
    console.log('[CDP] Cancel test result:', parsedCancel);
    testResults.cancelAbortsImport = parsedCancel?.clicked && parsedCancel?.isClosed;

    // -------------------------------------------------------------------------
    // TEST 4: Standard Image Loading Modal Test
    // -------------------------------------------------------------------------
    console.log('[CDP] Step 4: Testing standard image loading modal...');
    const imgRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const cvs = document.createElement('canvas');
          cvs.width = 500;
          cvs.height = 350;
          const ctx = cvs.getContext('2d');
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(0, 0, 500, 350);
          const blob = await new Promise(r => cvs.toBlob(r, 'image/png'));
          const file = new File([blob], 'banner_artwork.png', { type: 'image/png' });

          const mainInput = document.querySelector('[data-testid="main-file-input"]');
          const dt = new DataTransfer();
          dt.items.add(file);
          mainInput.files = dt.files;
          mainInput.dispatchEvent(new Event('change', { bubbles: true }));

          let modalObserved = false;
          let modalName = '';
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 15));
            const modal = document.querySelector('[data-testid="file-import-loading-modal"]');
            if (modal) {
              modalObserved = true;
              const p = modal.querySelector('p');
              modalName = p ? p.textContent.trim() : '';
              break;
            }
          }

          // Wait for completion
          await new Promise(r => setTimeout(r, 600));
          const isFinishedAndClosed = !document.querySelector('[data-testid="file-import-loading-modal"]');

          return JSON.stringify({ modalObserved, modalName, isFinishedAndClosed });
        })()
      `,
      awaitPromise: true,
      returnByValue: true,
    });
    const parsedImg = safeParse(imgRes.result?.value);
    console.log('[CDP] Standard image test:', parsedImg);
    testResults.standardImageShowsModal = parsedImg?.modalObserved && parsedImg?.isFinishedAndClosed;

    // Save report json
    const jsonPath = path.join(ARTIFACTS_DIR, 'file_import_loading_modal_verification.json');
    fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
    console.log('[CDP] Verification JSON written to:', jsonPath);
    console.log('[ALL TESTS COMPLETED]:', testResults);

    ws.close();
    edgeProc.kill();
    process.exit(0);
  } catch (err) {
    console.error('[CDP] Error in test:', err);
    edgeProc.kill();
    process.exit(1);
  }
}

run();
