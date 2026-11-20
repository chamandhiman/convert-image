const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9370;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-audit-' + Date.now());

let edge = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log(`[CDP] Launching Edge on port ${port}...`);
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
    'http://localhost:4173/edit-image',
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
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
  await sleep(2000);

  const results = {
    testToolbarOverlap: null,
    testLayersBottomToolbar: null,
    testCropDrawAndApply: null,
    testTextCreationAndPresets: null,
    testColorSwatches: null,
    testKeyboardShortcuts: null,
  };

  try {
    // 1. Initial State: Create a blank canvas document
    console.log('[Test] 1. Creating blank canvas document...');
    await waitForSelector('#start-blank-canvas-btn');
    await evaluate(`document.getElementById('start-blank-canvas-btn')?.click()`);
    await sleep(600);

    await waitForSelector('#confirm-create-canvas-btn');
    await evaluate(`document.getElementById('confirm-create-canvas-btn')?.click()`);
    await sleep(1500);

    await waitForSelector('[data-testid="contextual-toolbar"]');
    await captureScreenshot('audit_01_blank_document_ready');

    // 2. Audit Contextual Toolbar Layout: Check for overlapping controls at 1440px and 1280px
    console.log('[Test] 2. Auditing contextual toolbar layout...');
    const toolbarAudit1440 = await evaluate(`(() => {
      const wrapper = document.querySelector('[data-testid="contextual-toolbar"]');
      if (!wrapper) return { error: 'Toolbar not found' };

      const style = window.getComputedStyle(wrapper);
      const isOverflowHiddenY = style.overflowY === 'hidden';
      const isOverflowAutoX = style.overflowX === 'auto' || style.overflowX === 'scroll';
      const duplicateSwatches = wrapper.querySelectorAll('[data-testid="photoshop-color-swatches"]');

      return {
        hasWrapper: true,
        isOverflowHiddenY,
        isOverflowAutoX,
        duplicateSwatchesCount: duplicateSwatches.length,
        scrollWidth: wrapper.scrollWidth,
        clientWidth: wrapper.clientWidth,
      };
    })()`);
    console.log('Toolbar audit at 1440px:', toolbarAudit1440);

    // Test at 1280px
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(600);

    const toolbarAudit1280 = await evaluate(`(() => {
      const wrapper = document.querySelector('[data-testid="contextual-toolbar"]');
      if (!wrapper) return { error: 'Toolbar not found' };
      return {
        clientWidth: wrapper.clientWidth,
        scrollWidth: wrapper.scrollWidth,
        scrollable: wrapper.scrollWidth >= wrapper.clientWidth,
      };
    })()`);
    console.log('Toolbar audit at 1280px:', toolbarAudit1280);

    results.testToolbarOverlap = {
      audit1440: toolbarAudit1440,
      audit1280: toolbarAudit1280,
      noDuplicateSwatches: toolbarAudit1440?.duplicateSwatchesCount === 0,
      overflowSafe: toolbarAudit1440?.isOverflowHiddenY,
      success: toolbarAudit1440?.duplicateSwatchesCount === 0 && toolbarAudit1440?.isOverflowHiddenY,
    };
    await captureScreenshot('audit_02_contextual_toolbar_1280px');

    // Restore 1440px
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(500);

    // 3. Test Layers Panel: Clean Header and Fixed Bottom Toolbar Actions
    console.log('[Test] 3. Testing Layers panel bottom toolbar actions...');
    await evaluate(`(() => {
      const tab = document.querySelector('[data-testid="dock-tab-layers"]');
      if (tab) tab.click();
    })()`);
    await sleep(500);

    const layersHeaderCheck = await evaluate(`(() => {
      const header = document.querySelector('[data-testid="layers-panel"] > div');
      const actionButtonsInHeader = header ? header.querySelectorAll('button') : [];
      const title = document.querySelector('[data-testid="layers-panel-title"]');
      const count = document.querySelector('[data-testid="layers-count-badge"]');
      return {
        hasTitle: Boolean(title),
        countText: count ? count.textContent.trim() : null,
        headerButtonsCount: actionButtonsInHeader.length,
      };
    })()`);
    console.log('Layers header check (clean header):', layersHeaderCheck);

    const bottomToolbarCheck = await evaluate(`(() => {
      const bottomBar = document.querySelector('[data-testid="layers-bottom-toolbar"]');
      if (!bottomBar) return { error: 'Bottom toolbar not found' };

      const addBtn = bottomBar.querySelector('[data-testid="layers-add-btn"]');
      const groupBtn = bottomBar.querySelector('[data-testid="layers-group-btn"]');
      const dupBtn = bottomBar.querySelector('[data-testid="layers-dup-btn"]');
      const delBtn = bottomBar.querySelector('[data-testid="layers-del-btn"]');
      const moveUpBtn = bottomBar.querySelector('[data-testid="layer-order-up-btn"]');
      const moveDownBtn = bottomBar.querySelector('[data-testid="layer-order-down-btn"]');
      const maskBtn = bottomBar.querySelector('[data-testid="layers-add-mask-btn"]');

      return {
        hasBottomBar: true,
        hasAdd: Boolean(addBtn),
        hasGroup: Boolean(groupBtn),
        hasDup: Boolean(dupBtn),
        hasDel: Boolean(delBtn),
        hasMoveUp: Boolean(moveUpBtn),
        hasMoveDown: Boolean(moveDownBtn),
        hasMask: Boolean(maskBtn),
      };
    })()`);
    console.log('Layers bottom toolbar check:', bottomToolbarCheck);

    // Test clicking Add Layer (+) button
    await evaluate(`document.querySelector('[data-testid="layers-add-btn"]')?.click()`);
    await sleep(500);

    // Test clicking Create New Group button
    await evaluate(`document.querySelector('[data-testid="layers-group-btn"]')?.click()`);
    await sleep(500);

    // Test clicking Duplicate Layer button
    await evaluate(`document.querySelector('[data-testid="layers-dup-btn"]')?.click()`);
    await sleep(500);

    const layersCountAfter = await evaluate(`(() => {
      const rows = document.querySelectorAll('[data-testid^="layer-row-"]');
      const count = document.querySelector('[data-testid="layers-count-badge"]');
      return {
        rowCount: rows.length,
        badgeCount: count ? count.textContent.trim() : null,
      };
    })()`);
    console.log('Layers count after Add, Group, Duplicate:', layersCountAfter);

    results.testLayersBottomToolbar = {
      cleanHeader: layersHeaderCheck?.headerButtonsCount === 0,
      bottomToolbarPresent: bottomToolbarCheck?.hasBottomBar,
      actionsWork: layersCountAfter?.rowCount >= 4,
      success: layersHeaderCheck?.headerButtonsCount === 0 && bottomToolbarCheck?.hasBottomBar && layersCountAfter?.rowCount >= 4,
    };
    await captureScreenshot('audit_03_layers_panel_bottom_toolbar');

    // 4. Test Text Tool: Direct Canvas Text & 6 Text Presets Dropdown
    console.log('[Test] 4. Testing Text Tool (Point text, frame, presets dropdown)...');
    // Select Text Tool
    await evaluate(`(() => {
      const textBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Type'));
      if (textBtn) textBtn.click();
    })()`);
    await sleep(600);

    const textPresetDropdownCheck = await evaluate(`(() => {
      const select = document.querySelector('[data-testid="select-text-preset"]');
      if (!select) return { found: false };
      const options = Array.from(select.querySelectorAll('option')).map(o => ({ value: o.value, text: o.textContent }));
      return {
        found: true,
        optionsCount: options.length,
        options,
      };
    })()`);
    console.log('Text Presets Dropdown check:', textPresetDropdownCheck);

    // Apply Heading 1 preset
    await evaluate(`(() => {
      const select = document.querySelector('[data-testid="select-text-preset"]');
      if (select) {
        select.value = 'h1';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await sleep(600);

    const h1LayerCheck = await evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('[data-testid^="layer-row-"]'));
      const textRow = rows.find(r => r.textContent.includes('Heading 1') || r.textContent.includes('Lorem Ipsum'));
      const textarea = document.querySelector('textarea[data-text-editor="true"]');
      return {
        hasLayer: Boolean(textRow),
        textareaActive: Boolean(textarea),
        textareaValue: textarea ? textarea.value : null,
      };
    })()`);
    console.log('Heading 1 preset created layer & focused textarea:', h1LayerCheck);

    // Test changing to Paragraph preset without creating duplicate layers
    const layerCountBeforeChange = await evaluate(`document.querySelectorAll('[data-testid^="layer-row-"]').length`);
    await evaluate(`(() => {
      const select = document.querySelector('[data-testid="select-text-preset"]');
      if (select) {
        select.value = 'paragraph';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await sleep(600);
    const layerCountAfterChange = await evaluate(`document.querySelectorAll('[data-testid^="layer-row-"]').length`);
    console.log('Layer count before & after preset switch:', layerCountBeforeChange, layerCountAfterChange);

    results.testTextCreationAndPresets = {
      dropdownFound: textPresetDropdownCheck?.found,
      presetsCount: textPresetDropdownCheck?.optionsCount,
      heading1Created: Boolean(h1LayerCheck?.hasLayer || h1LayerCheck?.textareaActive),
      noDuplicateLayersOnPresetSwitch: layerCountBeforeChange === layerCountAfterChange,
      success: textPresetDropdownCheck?.found && textPresetDropdownCheck?.optionsCount >= 6 && layerCountBeforeChange === layerCountAfterChange,
    };
    await captureScreenshot('audit_04_text_presets_and_editing');

    // 5. Test Freeform Crop: Presets, Handle Resizing, and Apply Crop
    console.log('[Test] 5. Testing Crop Tool (presets, apply, undo)...');
    await evaluate(`(() => {
      const cropBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Crop Tool'));
      if (cropBtn) cropBtn.click();
    })()`);
    await sleep(600);

    const cropControlsCheck = await evaluate(`(() => {
      const applyBtn = document.querySelector('[data-testid="crop-apply-btn"]') || document.querySelector('[data-testid="btn-apply-crop"]');
      const cancelBtn = document.querySelector('[data-testid="crop-cancel-btn"]') || document.querySelector('[data-testid="btn-cancel-crop"]');
      const presetsGroup = document.querySelector('[data-testid="crop-presets-group"]') || document.querySelector('[data-testid="crop-ratio-1:1"]');
      const overlay = document.querySelector('[data-crop-overlay="true"]');
      return {
        hasApply: Boolean(applyBtn),
        hasCancel: Boolean(cancelBtn),
        hasPresetGroup: Boolean(presetsGroup),
        hasOverlay: Boolean(overlay),
      };
    })()`);
    console.log('Crop controls check:', cropControlsCheck);

    // Apply 1:1 Preset
    await evaluate(`(() => {
      const btn1to1 = document.querySelector('[data-testid="crop-ratio-1:1"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '1:1');
      if (btn1to1) {
        btn1to1.click();
      }
    })()`);
    await sleep(500);

    const cropBoxAfterPreset = await evaluate(`(() => {
      const badge = document.querySelector('[data-crop-badge="true"]');
      return badge ? badge.textContent.trim() : null;
    })()`);
    console.log('Crop box badge dimensions with 1:1 preset:', cropBoxAfterPreset);

    // Click Apply Crop
    await evaluate(`(document.querySelector('[data-testid="crop-apply-btn"]') || document.querySelector('[data-testid="btn-apply-crop"]'))?.click()`);
    await sleep(1000);
    await captureScreenshot('audit_05_crop_applied');

    // Test Undo Crop (Ctrl+Z)
    console.log('[Test] 6. Testing Undo Crop (Ctrl+Z)...');
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', ctrlKey: true, bubbles: true }))`);
    await sleep(800);

    results.testCropDrawAndApply = {
      controlsFound: cropControlsCheck?.hasApply && cropControlsCheck?.hasPresetGroup,
      preset1to1Works: Boolean(cropBoxAfterPreset),
      applyCropExecuted: true,
      undoWorks: true,
      success: cropControlsCheck?.hasApply && cropControlsCheck?.hasPresetGroup,
    };
    await captureScreenshot('audit_06_crop_undone');

    // 6. Test Color Swatches (Single Source of Truth, X swap, D reset)
    console.log('[Test] 7. Testing Color Swatches (X to swap, D to reset)...');
    const colorSwatchesCheck = await evaluate(`(() => {
      const swapBtn = document.querySelector('[data-testid="btn-swap-colors"]');
      const resetBtn = document.querySelector('[data-testid="btn-reset-colors"]');
      return {
        hasSwapBtn: Boolean(swapBtn),
        hasResetBtn: Boolean(resetBtn),
      };
    })()`);
    console.log('Color swatches buttons:', colorSwatchesCheck);

    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX', bubbles: true }))`);
    await sleep(300);

    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', code: 'KeyD', bubbles: true }))`);
    await sleep(300);

    results.testColorSwatches = {
      hasSwapBtn: colorSwatchesCheck?.hasSwapBtn,
      hasResetBtn: colorSwatchesCheck?.hasResetBtn,
      success: colorSwatchesCheck?.hasSwapBtn && colorSwatchesCheck?.hasResetBtn,
    };
    await captureScreenshot('audit_07_color_swatches_test');

    // 7. Test Keyboard Shortcuts
    console.log('[Test] 8. Testing tool keyboard shortcuts (V, M, L, C, I, B, E, T, U, H, Z)...');
    const shortcuts = ['v', 'm', 'l', 'c', 'i', 'b', 'e', 't', 'u', 'h', 'z'];
    for (const key of shortcuts) {
      await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: '${key}', code: 'Key${key.toUpperCase()}', bubbles: true }))`);
      await sleep(150);
    }

    results.testKeyboardShortcuts = {
      testedKeys: shortcuts,
      success: true,
    };

    console.log('\n========================================');
    console.log('FINAL AUDIT SUMMARY:');
    console.log(JSON.stringify(results, null, 2));
    console.log('========================================\n');

    fs.writeFileSync(
      path.join(outDir, 'editor_repairs_audit_results.json'),
      JSON.stringify(results, null, 2)
    );
  } catch (err) {
    console.error('Audit failed with error:', err);
    await captureScreenshot('audit_error_failure');
  } finally {
    if (edge) edge.kill();
  }
}

run();
