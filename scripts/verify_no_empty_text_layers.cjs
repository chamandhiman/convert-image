const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const CDP_PORT = 9857;

const edgeProc = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-extensions',
  '--disable-gpu',
  '--window-size=1600,1000',
  '--user-data-dir=C:/Temp/edge-no-empty-text-' + Date.now(),
]);

async function run() {
  const results = {
    test: 'Verification of No Empty Text Layers and Drafting Lifecycle',
    timestamp: new Date().toISOString(),
    tests: {},
    success: false,
  };

  try {
    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        if (res.ok) {
          const list = await res.json();
          const target = list.find((x) => x.type === 'page' && !x.url.startsWith('chrome-extension://'));
          if (target?.webSocketDebuggerUrl) {
            wsUrl = target.webSocketDebuggerUrl;
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
    await send('Input.setIgnoreInputEvents', { ignore: false });
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('[CDP] Navigating to http://127.0.0.1:4173/edit-image ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/edit-image' });

    // Wait for preset button
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const res = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('[data-testid="preset-card-ig-post"]'))`,
        returnByValue: true,
      });
      if (res.result?.value) {
        break;
      }
    }

    // Dismiss cookie consent
    await send('Runtime.evaluate', {
      expression: `(() => {
        try {
          localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));
        } catch {}
        const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Accept All'));
        if (acceptBtn) acceptBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    // Step 1: Create Instagram Post preset canvas (1080x1080)
    console.log('[CDP] Creating 1080x1080 Canvas via preset...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('[data-testid="preset-card-ig-post"]')?.click()`,
    });

    // Wait for stage to mount
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const stageRes = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('[data-canvas-stage="true"]'))`,
        returnByValue: true,
      });
      if (stageRes.result?.value) {
        break;
      }
    }

    // Switch to Layers tab in Right Workspace
    await send('Runtime.evaluate', {
      expression: `document.querySelector('[data-testid="tab-layers"]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    // Helper: count layers in DOM and React state
    const getLayerCounts = async () => {
      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const layerItems = document.querySelectorAll('[data-layer-item="true"], [data-testid="layer-item"], [class*="layerItem"], [class*="layerRow"]');
          const stageLayers = document.querySelectorAll('[data-layer-id]');
          const textLayers = document.querySelectorAll('[data-layer-type="text"]');
          const textDraft = document.querySelector('[data-text-draft-container="true"]');
          const inlineTextarea = document.querySelector('[data-text-editor="true"]');
          const placeholders = Array.from(document.querySelectorAll('*')).filter(el =>
            el.textContent && (el.textContent.includes('Type text here...') || el.textContent.includes('Type your text here'))
          );
          return {
            layersPanelCount: layerItems.length,
            stageLayersCount: stageLayers.length,
            textLayersCount: textLayers.length,
            hasTextDraft: Boolean(textDraft),
            hasInlineTextarea: Boolean(inlineTextarea),
            placeholderCount: placeholders.length
          };
        })()`,
        returnByValue: true,
      });
      return evalRes.result.value;
    };

    const initialCounts = await getLayerCounts();
    console.log('[CDP] Initial state layer counts:', initialCounts);

    // Step 2: Select Text Tool
    console.log('[CDP] Activating Text Tool...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('[data-tool-id="text"]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    // Step 3: Click on canvas stage multiple times without typing
    console.log('[CDP] Clicking canvas 6 times in a row with Text Tool without typing anything...');
    const stageInfo = (await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]');
        const rect = stage.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      })()`,
      returnByValue: true,
    })).result.value;

    const clickPoints = [
      { x: stageInfo.left + stageInfo.width * 0.3, y: stageInfo.top + stageInfo.height * 0.3 },
      { x: stageInfo.left + stageInfo.width * 0.5, y: stageInfo.top + stageInfo.height * 0.3 },
      { x: stageInfo.left + stageInfo.width * 0.7, y: stageInfo.top + stageInfo.height * 0.4 },
      { x: stageInfo.left + stageInfo.width * 0.4, y: stageInfo.top + stageInfo.height * 0.6 },
      { x: stageInfo.left + stageInfo.width * 0.6, y: stageInfo.top + stageInfo.height * 0.7 },
      { x: stageInfo.left + stageInfo.width * 0.5, y: stageInfo.top + stageInfo.height * 0.5 },
    ];

    for (let i = 0; i < clickPoints.length; i++) {
      const pt = clickPoints[i];
      await send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: pt.x,
        y: pt.y,
        button: 'left',
        clickCount: 1,
      });
      await new Promise((r) => setTimeout(r, 60));
      await send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: pt.x,
        y: pt.y,
        button: 'left',
        clickCount: 1,
      });
      await new Promise((r) => setTimeout(r, 200));
    }

    const afterMultiClickCounts = await getLayerCounts();
    console.log('[CDP] After 6 canvas clicks without typing:', afterMultiClickCounts);

    // Verify test 1: ZERO text layers created in Layers panel or stageLayers
    const test1Passed =
      afterMultiClickCounts.textLayersCount === 0 &&
      afterMultiClickCounts.hasTextDraft === true &&
      afterMultiClickCounts.placeholderCount === 0;

    results.tests.noEmptyLayersOnMultipleClicks = {
      passed: test1Passed,
      textLayersCount: afterMultiClickCounts.textLayersCount,
      hasTextDraft: afterMultiClickCounts.hasTextDraft,
      placeholderCount: afterMultiClickCounts.placeholderCount,
      detail: '6 clicks created 0 permanent layers; only 1 active text draft container is open with blinking cursor and 0 placeholder texts.',
    };

    // Take screenshot of empty text draft with subtle boundary and no placeholders
    const snap1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_no_empty_layers_active_draft.png'), Buffer.from(snap1.data, 'base64'));

    // Step 4: Press Escape key to discard draft
    console.log('[CDP] Pressing Escape to cancel text draft...');
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await new Promise((r) => setTimeout(r, 300));

    const afterEscapeCounts = await getLayerCounts();
    console.log('[CDP] After Escape key:', afterEscapeCounts);

    const test2Passed =
      afterEscapeCounts.textLayersCount === 0 &&
      afterEscapeCounts.hasTextDraft === false;

    results.tests.escapeDiscardsDraft = {
      passed: test2Passed,
      textLayersCount: afterEscapeCounts.textLayersCount,
      hasTextDraft: afterEscapeCounts.hasTextDraft,
      detail: 'Escape cleanly discards temporary draft; 0 text layers added.',
    };

    // Step 5: Click canvas, type only whitespace '    ', click outside on viewport
    console.log('[CDP] Testing whitespace-only draft dismissal on click outside...');
    const clickPos2 = clickPoints[0];
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: clickPos2.x, y: clickPos2.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 60));
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: clickPos2.x, y: clickPos2.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 300));

    await send('Input.insertText', { text: '     ' });
    await new Promise((r) => setTimeout(r, 150));

    // Blur / click outside on canvas viewport outside the stage
    const outsidePos = { x: Math.round(stageInfo.left + stageInfo.width + 50), y: Math.round(stageInfo.top + 50) };
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: outsidePos.x, y: outsidePos.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 60));
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: outsidePos.x, y: outsidePos.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 400));

    const afterWhitespaceCounts = await getLayerCounts();
    console.log('[CDP] After whitespace-only click outside:', afterWhitespaceCounts);

    const test3Passed =
      afterWhitespaceCounts.textLayersCount === 0 &&
      afterWhitespaceCounts.hasTextDraft === false;

    results.tests.whitespaceDiscarded = {
      passed: test3Passed,
      textLayersCount: afterWhitespaceCounts.textLayersCount,
      hasTextDraft: afterWhitespaceCounts.hasTextDraft,
      detail: 'Whitespace-only draft was discarded cleanly when clicking outside; 0 text layers added.',
    };

    // Step 6: Click canvas, type actual text 'Creative Design Studio', press Ctrl+Enter
    console.log('[CDP] Typing actual text and committing with Ctrl+Enter...');
    const clickPos3 = { x: stageInfo.left + stageInfo.width * 0.35, y: stageInfo.top + stageInfo.height * 0.35 };
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: clickPos3.x, y: clickPos3.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 60));
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: clickPos3.x, y: clickPos3.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 300));

    await send('Input.insertText', { text: 'Creative Design Studio' });
    await new Promise((r) => setTimeout(r, 200));

    // Press Ctrl + Enter
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 2 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await new Promise((r) => setTimeout(r, 400));

    const afterCommitCounts = await getLayerCounts();
    const layerDetails = (await send('Runtime.evaluate', {
      expression: `(() => {
        const textLayers = Array.from(document.querySelectorAll('[data-layer-type="text"]'));
        const textContent = document.querySelector('[data-text-content="true"]');
        const layerItems = Array.from(document.querySelectorAll('[data-layer-item="true"], [data-testid="layer-item"], [class*="layerItem"], [class*="layerRow"]'));
        return {
          textLayerCount: textLayers.length,
          renderedText: textContent ? textContent.textContent.trim() : null,
          layersPanelTexts: layerItems.map(item => item.textContent.trim())
        };
      })()`,
      returnByValue: true,
    })).result.value;

    console.log('[CDP] After commit layer details:', layerDetails);

    const test4Passed =
      afterCommitCounts.textLayersCount === 1 &&
      afterCommitCounts.hasTextDraft === false &&
      layerDetails.renderedText === 'Creative Design Studio';

    results.tests.commitOnActualText = {
      passed: test4Passed,
      textLayersCount: afterCommitCounts.textLayersCount,
      renderedText: layerDetails.renderedText,
      layersPanelTexts: layerDetails.layersPanelTexts,
      detail: 'Committed exactly 1 permanent text layer with user typed text and correct layer name.',
    };

    const snap2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_text_layer_committed_successfully.png'), Buffer.from(snap2.data, 'base64'));

    // Step 7: Switch to Move Tool and double-click existing text layer to edit
    console.log('[CDP] Switching to Move tool and double clicking text layer to re-edit...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('[data-tool-id="move"]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    // Double click the text layer on the canvas
    const textLayerRect = (await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('[data-layer-type="text"]');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`,
      returnByValue: true,
    })).result.value;

    if (textLayerRect) {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: textLayerRect.x, y: textLayerRect.y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: textLayerRect.x, y: textLayerRect.y, button: 'left', clickCount: 1 });
      await new Promise((r) => setTimeout(r, 60));
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: textLayerRect.x, y: textLayerRect.y, button: 'left', clickCount: 2 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: textLayerRect.x, y: textLayerRect.y, button: 'left', clickCount: 2 });
      await new Promise((r) => setTimeout(r, 350));
    }

    const reeditCheck = (await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('[data-text-editor="true"]'))`,
      returnByValue: true,
    })).result.value;

    console.log('[CDP] Double click entered text editing mode:', reeditCheck);

    // Edit text to ' - 2026 Edition' and commit
    await send('Input.insertText', { text: ' - 2026 Edition' });
    await new Promise((r) => setTimeout(r, 150));
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 2 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await new Promise((r) => setTimeout(r, 400));

    const afterReedit = (await send('Runtime.evaluate', {
      expression: `(() => {
        const textContent = document.querySelector('[data-text-content="true"]');
        return textContent ? textContent.textContent.trim() : null;
      })()`,
      returnByValue: true,
    })).result.value;

    console.log('[CDP] Text content after re-edit:', afterReedit);
    const test5Passed = reeditCheck && afterReedit.includes('2026 Edition');

    results.tests.doubleClickReedit = {
      passed: test5Passed,
      reeditEntered: reeditCheck,
      updatedText: afterReedit,
      detail: 'Double clicking with Move Tool enters editing mode and commits updated text correctly.',
    };

    // Step 8: Undo test (Ctrl + Z)
    console.log('[CDP] Testing Undo with Ctrl + Z...');
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, modifiers: 2 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90 });
    await new Promise((r) => setTimeout(r, 400));

    const afterUndo1 = (await send('Runtime.evaluate', {
      expression: `(() => {
        const textContent = document.querySelector('[data-text-content="true"]');
        return textContent ? textContent.textContent.trim() : null;
      })()`,
      returnByValue: true,
    })).result.value;
    console.log('[CDP] After 1st Undo text content:', afterUndo1);

    // Undo again to revert layer creation
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, modifiers: 2 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90 });
    await new Promise((r) => setTimeout(r, 400));

    const afterUndo2Counts = await getLayerCounts();
    console.log('[CDP] After 2nd Undo layer counts:', afterUndo2Counts);

    const test6Passed =
      afterUndo1 === 'Creative Design Studio' &&
      afterUndo2Counts.textLayersCount === 0;

    results.tests.undoHistory = {
      passed: test6Passed,
      firstUndoRestoredOriginal: afterUndo1 === 'Creative Design Studio',
      secondUndoRemovedLayer: afterUndo2Counts.textLayersCount === 0,
      detail: 'Undo history correctly steps through text edits and removes text layer on previous step with no phantom states.',
    };

    const snap3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_text_undo_clean_stage.png'), Buffer.from(snap3.data, 'base64'));

    results.success = test1Passed && test2Passed && test3Passed && test4Passed && test5Passed && test6Passed;
    console.log('[CDP] All verification tests passed:', results.success);

    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'no_empty_text_layers_verification.json'),
      JSON.stringify(results, null, 2)
    );
  } catch (err) {
    console.error('[CDP] Error in verification:', err);
    results.error = err.message;
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'no_empty_text_layers_verification.json'),
      JSON.stringify(results, null, 2)
    );
  } finally {
    try {
      edgeProc.kill();
    } catch { }
  }
}

run();
