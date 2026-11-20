const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const CDP_PORT = 9858;

const edgeProc = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-extensions',
  '--disable-gpu',
  '--window-size=1600,1000',
  '--user-data-dir=C:/Temp/edge-verify-toolbar-' + Date.now(),
]);

async function run() {
  const results = {
    test: 'Verification of Toolbar Outlines, Selection, Marquee Icon, and Pen Tool',
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
    await send('Runtime.enable');
    await send('DOM.enable');

    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        console.log('[Browser Console]', d.params.type, d.params.args.map((a) => a.value || a.description).join(' '));
      }
    });

    console.log('[CDP] Navigating to http://127.0.0.1:4173/edit ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/edit' });
    await new Promise((r) => setTimeout(r, 2500));

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result?.value;
    };

    const takeScreenshot = async (filePath, clip = null) => {
      const params = { format: 'png' };
      if (clip) params.clip = { ...clip, scale: 1 };
      const res = await send('Page.captureScreenshot', params);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`[Screenshot] Saved: ${filePath}`);
    };

    // Dismiss cookie consent & Initialize Blank Canvas via Instagram Post preset
    console.log('[Step 1] Initializing canvas via preset...');
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const ready = await evalJs(`Boolean(document.querySelector('[data-testid="preset-card-ig-post"]'))`);
      if (ready) break;
    }

    await evalJs(`(() => {
      try {
        localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));
      } catch {}
      const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Accept All'));
      if (acceptBtn) acceptBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 400));

    const initResult = await evalJs(`(() => {
      const preset = document.querySelector('[data-testid="preset-card-ig-post"]');
      if (preset) {
        preset.click();
        return { success: true };
      }
      return { success: false, error: 'Preset button not found' };
    })()`);
    console.log('[Step 1] Canvas init result:', initResult);

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const hasStage = await evalJs(`Boolean(document.querySelector('[data-canvas-stage="true"]'))`);
      if (hasStage) {
        console.log('[Step 1] Stage mounted successfully.');
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // TEST 1: Marquee Tool Icon (Dashed/Dotted Rectangular Selection Icon)
    // =========================================================================
    console.log('\n--- TEST 1: Marquee Tool Icon Verification ---');
    const marqueeIconData = await evalJs(`(() => {
      const marqueeBtn = document.querySelector('[data-tool-id="marquee-rect"]');
      const rectShapeBtn = document.querySelector('[data-tool-id="rect"]');
      const rectEl = marqueeBtn ? marqueeBtn.querySelector('svg rect') : null;
      const strokeDasharray = rectEl ? rectEl.getAttribute('stroke-dasharray') : null;
      const isDashed = strokeDasharray && (strokeDasharray.includes('3') || strokeDasharray.includes('2.5'));

      return {
        marqueeFound: Boolean(marqueeBtn),
        hasSvgRect: Boolean(rectEl),
        strokeDasharray,
        isDashed,
      };
    })()`);

    console.log('Marquee Icon Data:', marqueeIconData);
    results.tests.marqueeIcon = {
      passed: marqueeIconData.marqueeFound && marqueeIconData.isDashed,
      details: marqueeIconData,
    };

    // Capture Left Tool Panel Screenshot
    const toolPanelRect = await evalJs(`(() => {
      const panel = document.querySelector('[class*="toolPanel"]') || document.querySelector('[data-testid="left-tool-panel"]');
      if (panel) {
        const r = panel.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
      return null;
    })()`);
    if (toolPanelRect) {
      await takeScreenshot(path.join(ARTIFACTS_DIR, 'test_left_tool_panel_marquee_icon.png'), toolPanelRect);
    }

    // =========================================================================
    // TEST 2: Pen Tool Active Icon & SVG Pen Nib Cursor
    // =========================================================================
    console.log('\n--- TEST 2: Pen Tool Active State & Cursor Verification ---');
    const penToolData = await evalJs(`(() => {
      const penBtn = document.querySelector('[data-tool-id="pen"]');
      if (!penBtn) return { error: 'Pen button not found' };
      penBtn.click();
      return { clicked: true };
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const penState = await evalJs(`(() => {
      const penBtn = document.querySelector('[data-tool-id="pen"]');
      const isSlotActive = penBtn?.getAttribute('data-tool-active') === 'true';
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const stageStyle = stage ? window.getComputedStyle(stage) : null;
      const stageCursor = stageStyle ? stageStyle.cursor : '';
      const backgroundLayer = document.querySelector('[data-layer-id="background"]');
      const bgStyle = backgroundLayer ? window.getComputedStyle(backgroundLayer) : null;
      const bgCursor = bgStyle ? bgStyle.cursor : '';

      return {
        isSlotActive,
        stageCursor,
        bgCursor,
        noMoveCursor: !stageCursor.includes('move') && !bgCursor.includes('move'),
        isPenSvgCursor: stageCursor.includes('data:image/svg+xml') || stageCursor.includes('crosshair'),
      };
    })()`);
    console.log('Pen Tool State:', penState);

    results.tests.penTool = {
      passed: penState.isSlotActive && penState.noMoveCursor && penState.isPenSvgCursor,
      details: penState,
    };

    // =========================================================================
    // TEST 3: Text Tool Creation & Canvas Text Layer Selection with Move Tool
    // =========================================================================
    console.log('\n--- TEST 3: Canvas Text Layer Selection & Move Verification ---');
    // Switch to Text Tool
    await evalJs(`document.querySelector('[data-tool-id="text"]')?.click()`);
    await new Promise((r) => setTimeout(r, 600));

    // Get stage bounding box for click position
    const stagePos = await evalJs(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const r = stage.getBoundingClientRect();
      return { x: r.left + 250, y: r.top + 250 };
    })()`);

    // Click canvas using native CDP mouse event to start draft
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: stagePos.x, y: stagePos.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 60));
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: stagePos.x, y: stagePos.y, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 400));

    // Type text via CDP native insertText
    await send('Input.insertText', { text: 'Creative Design Studio' });
    await new Promise((r) => setTimeout(r, 200));

    // Press Ctrl + Enter to commit
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 2 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await new Promise((r) => setTimeout(r, 500));

    // Check that text layer was created
    const textLayerInfo = await evalJs(`(() => {
      const textLayerEl = document.querySelector('[data-layer-type="text"]');
      const textContent = textLayerEl ? textLayerEl.textContent.trim() : '';
      const layerId = textLayerEl ? textLayerEl.getAttribute('data-layer-id') : null;
      return { found: Boolean(textLayerEl), textContent, layerId };
    })()`);
    console.log('Text Layer Created:', textLayerInfo);

    // Now switch to Move Tool
    await evalJs(`document.querySelector('[data-tool-id="move"]')?.click()`);
    await new Promise((r) => setTimeout(r, 600));

    // Deselect first by clicking background or empty stage
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: stagePos.x - 200, y: stagePos.y - 200, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 60));
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: stagePos.x - 200, y: stagePos.y - 200, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 400));

    // Find text layer position on canvas
    const textLayerPos = await evalJs(`(() => {
      const textEl = document.querySelector('[data-layer-type="text"]');
      if (!textEl) return null;
      const r = textEl.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    console.log('Text Layer Pos on Canvas:', textLayerPos);

    if (textLayerPos) {
      const elAtPoint = await evalJs(`(() => {
        const el = document.elementFromPoint(${textLayerPos.x}, ${textLayerPos.y});
        return {
          tagName: el ? el.tagName : null,
          className: el ? el.className : null,
          dataset: el ? JSON.stringify(el.dataset) : null,
          closestLayerId: el ? el.closest('[data-layer-id]')?.getAttribute('data-layer-id') : null,
        };
      })()`);
      console.log('Element at text position before click:', elAtPoint);

      // Click DIRECTLY on the Text on canvas to select it with Move Tool
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: textLayerPos.x, y: textLayerPos.y, button: 'left', clickCount: 1 });
      await new Promise((r) => setTimeout(r, 60));
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: textLayerPos.x, y: textLayerPos.y, button: 'left', clickCount: 1 });
      await new Promise((r) => setTimeout(r, 500));
    }

    // Check layer selection state
    const selectionCheck = await evalJs(`(() => {
      const textLayerEl = document.querySelector('[data-layer-type="text"]');
      const isLayerSelected = textLayerEl?.getAttribute('data-layer-selected') === 'true';
      const transformBox = document.querySelector('[data-transform-box="true"]');
      const layerId = textLayerEl?.getAttribute('data-layer-id');

      // Check layers panel item highlight
      const layersPanelItem = document.querySelector(\`[data-testid="layer-row-\${layerId}"]\`);
      const isPanelItemActive = layersPanelItem ?
        (layersPanelItem.getAttribute('data-layer-selected') === 'true' || layersPanelItem.className.includes('Selected')) : false;

      return {
        isLayerSelected,
        hasTransformBox: Boolean(transformBox),
        layerId,
        isPanelItemActive,
      };
    })()`);
    console.log('Selection Check:', selectionCheck);

    // Double-click text layer on canvas to verify inline editing mode
    if (textLayerPos) {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: textLayerPos.x, y: textLayerPos.y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: textLayerPos.x, y: textLayerPos.y, button: 'left', clickCount: 1 });
      await new Promise((r) => setTimeout(r, 60));
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: textLayerPos.x, y: textLayerPos.y, button: 'left', clickCount: 2 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: textLayerPos.x, y: textLayerPos.y, button: 'left', clickCount: 2 });
      await new Promise((r) => setTimeout(r, 500));
    }

    const doubleClickCheck = await evalJs(`(() => {
      let textEditor = document.querySelector('[data-text-editor="true"]') || document.querySelector('textarea');
      if (!textEditor) {
        const tb = document.querySelector('[data-transform-box="true"]');
        if (tb) {
          tb.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
          textEditor = document.querySelector('[data-text-editor="true"]') || document.querySelector('textarea');
        }
      }
      return {
        isEditing: Boolean(textEditor),
      };
    })()`);
    console.log('Double-click to Edit Check:', doubleClickCheck);

    // Finish editing text (press Ctrl+Enter)
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 2 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await new Promise((r) => setTimeout(r, 500));

    results.tests.canvasTextSelection = {
      passed: selectionCheck.isLayerSelected && selectionCheck.hasTransformBox && selectionCheck.isPanelItemActive && doubleClickCheck.isEditing,
      details: { ...selectionCheck, ...doubleClickCheck },
    };

    // Take screenshot of selected text layer with transform bounding box
    await takeScreenshot(path.join(ARTIFACTS_DIR, 'test_text_layer_selected_on_canvas.png'));

    // =========================================================================
    // TEST 4: Top Contextual Toolbar (No Horizontal Scrollbar, No X/Y/W/H bloat)
    // =========================================================================
    console.log('\n--- TEST 4: Top Contextual Toolbar Clean Layout Verification ---');
    const toolbarLayoutData = await evalJs(`(() => {
      const toolbar = document.querySelector('[data-testid="contextual-toolbar"]') ||
        document.querySelector('[class*="contextualToolbar"]');
      if (!toolbar) return { error: 'Toolbar not found' };

      const hasPosX = Boolean(document.querySelector('[data-testid="input-pos-x"]') || document.querySelector('[data-testid="input-shape-pos-x"]'));
      const hasPosY = Boolean(document.querySelector('[data-testid="input-pos-y"]') || document.querySelector('[data-testid="input-shape-pos-y"]'));
      const hasWidth = Boolean(document.querySelector('[data-testid="input-width"]') || document.querySelector('[data-testid="input-shape-width"]'));
      const hasHeight = Boolean(document.querySelector('[data-testid="input-height"]') || document.querySelector('[data-testid="input-shape-height"]'));
      const hasLockAspect = Boolean(document.querySelector('[data-testid="btn-lock-aspect"]') || document.querySelector('[data-testid="btn-shape-lock-aspect"]'));

      const clientWidth = toolbar.clientWidth;
      const scrollWidth = toolbar.scrollWidth;
      const hasHorizontalScroll = scrollWidth > clientWidth + 2;

      return {
        hasPosX,
        hasPosY,
        hasWidth,
        hasHeight,
        hasLockAspect,
        clientWidth,
        scrollWidth,
        hasHorizontalScroll,
        noTransformInputs: !hasPosX && !hasPosY && !hasWidth && !hasHeight && !hasLockAspect,
      };
    })()`);
    console.log('Toolbar Layout Data:', toolbarLayoutData);

    results.tests.toolbarLayout = {
      passed: toolbarLayoutData.noTransformInputs && !toolbarLayoutData.hasHorizontalScroll,
      details: toolbarLayoutData,
    };

    // Capture Contextual Toolbar closeup
    const toolbarClip = await evalJs(`(() => {
      const toolbar = document.querySelector('[data-testid="contextual-toolbar"]') ||
        document.querySelector('[class*="contextualToolbar"]');
      if (toolbar) {
        const r = toolbar.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
      return null;
    })()`);
    if (toolbarClip) {
      await takeScreenshot(path.join(ARTIFACTS_DIR, 'test_contextual_toolbar_closeup.png'), toolbarClip);
    }

    // =========================================================================
    // TEST 5: Focus Outlines (No Double/Duplicate Focus Outlines)
    // =========================================================================
    console.log('\n--- TEST 5: Focus Outline Verification ---');
    // Switch to Text Tool to test text toolbar opacity and font dropdowns
    await evalJs(`(() => {
      const textBtn = document.querySelector('[data-tool-id="text"]');
      if (textBtn) textBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const focusCheck = await evalJs(`(() => {
      // Find Opacity dropdown or font select in contextual toolbar
      const selects = Array.from(document.querySelectorAll('[data-testid="contextual-toolbar"] select, [class*="contextualToolbar"] select'));
      if (!selects.length) return { error: 'No selects in toolbar' };

      const results = [];
      for (const sel of selects) {
        sel.focus();
        const selStyle = window.getComputedStyle(sel);
        const parent = sel.parentElement;
        const parentStyle = parent ? window.getComputedStyle(parent) : null;

        results.push({
          tagName: sel.tagName,
          className: sel.className,
          innerOutline: selStyle.outline,
          innerOutlineWidth: selStyle.outlineWidth,
          innerBoxShadow: selStyle.boxShadow,
          parentBoxShadow: parentStyle ? parentStyle.boxShadow : null,
          hasDuplicateOutline: (selStyle.outlineWidth !== '0px' && selStyle.outlineStyle !== 'none') &&
            (parentStyle && parentStyle.boxShadow && parentStyle.boxShadow !== 'none'),
        });
      }

      return {
        selectCount: selects.length,
        items: results,
        allClean: results.every((r) => !r.hasDuplicateOutline),
      };
    })()`);
    console.log('Focus Outline Check:', focusCheck);

    results.tests.focusOutlines = {
      passed: focusCheck.allClean,
      details: focusCheck,
    };

    // Capture Full Editor Screenshot
    await takeScreenshot(path.join(ARTIFACTS_DIR, 'test_editor_full_verification.png'));

    // Final Success Assessment
    results.success =
      results.tests.marqueeIcon.passed &&
      results.tests.penTool.passed &&
      results.tests.canvasTextSelection.passed &&
      results.tests.toolbarLayout.passed &&
      results.tests.focusOutlines.passed;

    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'toolbar_selection_and_pen_verification.json'),
      JSON.stringify(results, null, 2)
    );
    console.log('\n======================================================');
    console.log('VERIFICATION SUMMARY:', results.success ? 'ALL TESTS PASSED [PASS]' : 'SOME TESTS FAILED [FAIL]');
    console.log('======================================================\n');
  } catch (err) {
    console.error('[Error during verification]:', err);
    results.error = err.message;
  } finally {
    try {
      edgeProc.kill();
    } catch { }
  }
}

run();
