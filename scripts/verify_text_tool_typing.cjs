const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const CDP_PORT = 9850;

const edgeProc = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-extensions',
  '--disable-gpu',
  '--window-size=1600,1000',
  '--user-data-dir=C:/Temp/edge-text-tool-typing-' + Date.now(),
]);

async function run() {
  const results = {
    test: 'Text Tool Click & Inline Typing Verification',
    timestamp: new Date().toISOString(),
    steps: {},
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

    // Wait for React to mount and hydrate
    console.log('[CDP] Waiting for React to hydrate...');
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const ready = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('[data-testid="editor-welcome-screen"]') || document.querySelector('[data-canvas-stage="true"]'))`,
        returnByValue: true,
      });
      if (ready.result?.value) {
        console.log('[CDP] React hydrated successfully after', (i + 1) * 300, 'ms');
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
    await new Promise((r) => setTimeout(r, 400));

    // Step 1: Click Instagram Post Preset to create 1080x1080 Canvas
    console.log('[CDP] Creating 1080x1080 Canvas via preset...');
    const createNewRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const presetBtn = document.querySelector('[data-testid="preset-card-ig-post"]');
        if (presetBtn) {
          presetBtn.click();
          return { clickedPreset: true };
        }
        return { clickedPreset: false };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Preset button click:', createNewRes.result.value);
    await new Promise((r) => setTimeout(r, 1200));

    // Verify stage exists
    const stageCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]');
        if (!stage) return { found: false };
        const rect = stage.getBoundingClientRect();
        return {
          found: true,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          left: Math.round(rect.left),
          top: Math.round(rect.top)
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Canvas Stage check:', stageCheck.result.value);
    results.steps.canvasStage = stageCheck.result.value;

    // Step 2: Select the Text Tool from the left toolbar
    console.log('[CDP] Selecting Text Tool from left toolbar...');
    const selectToolRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const textToolBtn = document.querySelector('[data-tool-id="text"]') ||
          document.querySelector('button[title*="Type Tool" i]') ||
          document.querySelector('[data-testid="tool-text"]');
        if (textToolBtn) {
          textToolBtn.click();
          return { found: true, title: textToolBtn.title || 'Text Tool' };
        }
        return { found: false };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Select Text Tool result:', selectToolRes.result.value);
    results.steps.selectTextTool = selectToolRes.result.value;
    await new Promise((r) => setTimeout(r, 600));

    // Step 3: Click on the canvas stage to create a new editable text layer
    console.log('[CDP] Clicking canvas stage via native mouse events at (250, 200)...');
    const stagePos = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]');
        if (!stage) return null;
        const rect = stage.getBoundingClientRect();
        return {
          x: Math.round(rect.left + 250),
          y: Math.round(rect.top + 200)
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Target stage coordinates:', stagePos.result.value);

    const clickX = stagePos.result.value.x;
    const clickY = stagePos.result.value.y;

    // Dispatch native hardware mouse events
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: clickX,
      y: clickY,
      button: 'left',
      clickCount: 1,
    });
    await new Promise((r) => setTimeout(r, 60));
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: clickX,
      y: clickY,
      button: 'left',
      clickCount: 1,
    });
    results.steps.clickCanvas = { success: true, clickX, clickY };
    await new Promise((r) => setTimeout(r, 800));

    // Step 4: Verify inline textarea editor is mounted and focused
    console.log('[CDP] Checking for active inline textarea editor...');
    const editorCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('[data-text-editor="true"]') ||
          document.querySelector('textarea[data-testid="inline-text-editor"]');
        if (!textarea) return { mounted: false };
        return {
          mounted: true,
          isFocused: document.activeElement === textarea,
          placeholder: textarea.placeholder,
          value: textarea.value,
          fontFamily: textarea.style.fontFamily,
          fontSize: textarea.style.fontSize,
          color: textarea.style.color,
          width: textarea.offsetWidth,
          height: textarea.offsetHeight
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Text editor check:', editorCheck.result.value);
    results.steps.editorCheck = editorCheck.result.value;

    // Step 5: Type text using native keyboard input
    console.log('[CDP] Typing text via native Input.insertText...');
    const textToType = 'Modern Design\nHigh Impact Typography';
    await send('Input.insertText', { text: textToType });
    await new Promise((r) => setTimeout(r, 500));

    const typeRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('[data-text-editor="true"]') ||
          document.querySelector('textarea[data-testid="inline-text-editor"]');
        if (!textarea) return { success: false, reason: 'No textarea' };
        return {
          success: true,
          currentValue: textarea.value,
          activeElIsTextarea: document.activeElement === textarea
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Typing result:', typeRes.result.value);
    results.steps.typeText = typeRes.result.value;
    await new Promise((r) => setTimeout(r, 500));

    // Capture screenshot while actively typing
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'text_typing_active_editor.png'), Buffer.from(shot1.data, 'base64'));
    console.log('[CDP] Captured text_typing_active_editor.png');

    // Step 6: Finish editing with Ctrl + Enter
    console.log('[CDP] Pressing Ctrl + Enter via native Input.dispatchKeyEvent...');
    await send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      modifiers: 2, // Ctrl
      windowsVirtualKeyCode: 13,
      key: 'Enter',
      code: 'Enter',
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      modifiers: 2,
      windowsVirtualKeyCode: 13,
      key: 'Enter',
      code: 'Enter',
    });
    results.steps.finishEditing = { success: true };
    await new Promise((r) => setTimeout(r, 800));

    // Step 7: Verify text layer is rendered on canvas stage
    const renderedCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const textDiv = document.querySelector('[data-text-content="true"]');
        const textarea = document.querySelector('[data-text-editor="true"]');
        return {
          textareaUnmounted: !textarea,
          hasTextDiv: Boolean(textDiv),
          textContent: textDiv ? textDiv.textContent : null,
          fontFamily: textDiv ? textDiv.style.fontFamily : null,
          fontSize: textDiv ? textDiv.style.fontSize : null,
          color: textDiv ? textDiv.style.color : null
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Rendered text check:', renderedCheck.result.value);
    results.steps.renderedCheck = renderedCheck.result.value;

    // Capture screenshot after finish editing
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'text_multiline_rendered.png'), Buffer.from(shot2.data, 'base64'));
    console.log('[CDP] Captured text_multiline_rendered.png');

    // Step 8: Switch to Move Tool and double click the text layer to re-enter editing mode
    console.log('[CDP] Switching to Move Tool and double clicking text layer...');
    const switchMoveRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const moveBtn = document.querySelector('[data-tool-id="move"]') ||
          document.querySelector('button[title*="Move Tool" i]') ||
          document.querySelector('[data-testid="tool-move"]');
        if (moveBtn) {
          moveBtn.click();
          return { clickedMove: true };
        }
        return { clickedMove: false };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Switch Move Tool result:', switchMoveRes.result.value);
    await new Promise((r) => setTimeout(r, 500));

    // Double click at text layer location
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: clickX,
      y: clickY,
      button: 'left',
      clickCount: 2,
    });
    await new Promise((r) => setTimeout(r, 50));
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: clickX,
      y: clickY,
      button: 'left',
      clickCount: 2,
    });
    results.steps.doubleClickReedit = { success: true };
    await new Promise((r) => setTimeout(r, 800));

    // Verify textarea re-mounted with existing text
    const reeditCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('[data-text-editor="true"]');
        if (!textarea) return { mounted: false };
        return {
          mounted: true,
          isFocused: document.activeElement === textarea,
          value: textarea.value
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Re-edit check:', reeditCheck.result.value);
    results.steps.reeditCheck = reeditCheck.result.value;

    // Capture screenshot while in re-edit
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'text_reedit_doubleclick.png'), Buffer.from(shot3.data, 'base64'));
    console.log('[CDP] Captured text_reedit_doubleclick.png');

    // Step 9: Press Escape to cancel current text edit
    console.log('[CDP] Pressing Escape via native Input.dispatchKeyEvent...');
    await send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      windowsVirtualKeyCode: 27,
      key: 'Escape',
      code: 'Escape',
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      windowsVirtualKeyCode: 27,
      key: 'Escape',
      code: 'Escape',
    });
    await new Promise((r) => setTimeout(r, 600));

    const escCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('[data-text-editor="true"]');
        const textDiv = document.querySelector('[data-text-content="true"]');
        return {
          textareaUnmounted: !textarea,
          hasTextDiv: Boolean(textDiv),
          textContent: textDiv ? textDiv.textContent : null
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Escape check:', escCheck.result.value);
    results.steps.escapeCheck = escCheck.result.value;

    // Step 10: Check Layers Panel for text layer representation
    const layersPanelCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const layerRows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]'));
        const textRow = layerRows.find(el => el.textContent.includes('Modern Design') || el.textContent.includes('Text Layer'));
        return {
          totalLayersCount: layerRows.length,
          foundTextLayerInPanel: Boolean(textRow),
          layerNames: layerRows.map(r => r.querySelector('[data-testid^="layer-name-"]')?.textContent?.trim() || r.textContent?.trim().slice(0, 30))
        };
      })()`,
      returnByValue: true,
    });
    console.log('[CDP] Layers Panel check:', layersPanelCheck.result.value);
    results.steps.layersPanelCheck = layersPanelCheck.result.value;

    // Final success criteria
    const passed =
      results.steps.canvasStage?.found &&
      results.steps.selectTextTool?.found &&
      results.steps.editorCheck?.mounted &&
      results.steps.editorCheck?.isFocused &&
      results.steps.typeText?.success &&
      results.steps.renderedCheck?.textareaUnmounted &&
      results.steps.renderedCheck?.textContent?.includes('Modern Design') &&
      results.steps.reeditCheck?.mounted &&
      results.steps.reeditCheck?.value?.includes('Modern Design') &&
      results.steps.escapeCheck?.textareaUnmounted &&
      results.steps.layersPanelCheck?.foundTextLayerInPanel;

    results.success = Boolean(passed);
    console.log('[CDP] Overall test success:', results.success);

    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'text_typing_verification.json'),
      JSON.stringify(results, null, 2)
    );
  } catch (err) {
    console.error('[CDP] Error running verification:', err);
    results.error = err.message;
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'text_typing_verification.json'),
      JSON.stringify(results, null, 2)
    );
  } finally {
    edgeProc.kill();
    process.exit(0);
  }
}

run();
