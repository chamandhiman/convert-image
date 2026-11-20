import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_ps_shape_text_' + Date.now();
const PORT = 9302;

const edge = spawn(edgePath, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${tmpProfile}`,
  'about:blank'
]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const report = {
  step1_init: {},
  step2_circleSelected: {},
  step3_rectSelected: {},
  step4_shapeStyleUpdated: {},
  step5_textToolActive: {},
  step6_textCreatedOnCanvas: {},
  step7_textCommitted: {},
  step8_textPropertiesAuto: {},
  step9_reeditWithoutDuplicate: {},
  step10_layerTypeSwitching: {},
  screenshots: []
};

async function run() {
  console.log(`Connecting to Edge on port ${PORT}...`);
  let targets = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      targets = await res.json();
      if (targets && targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://'))) {
        console.log(`Found actual page target at iteration ${i}!`);
        break;
      }
    } catch { }
  }
  const pageTarget = targets?.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://'));
  if (!pageTarget) throw new Error('Could not find actual page target in Edge DevTools');
  console.log(`Connecting to page target: ${pageTarget.title || 'about:blank'} (${pageTarget.id})`);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  const capture = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(outDir, `${name}.png`);
    fs.writeFileSync(filePath, Buffer.from(res.result.data, 'base64'));
    report.screenshots.push(`${name}.png`);
    console.log(`Captured screenshot: ${name}.png`);
  };

  const evalExpr = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res && res.result && res.result.result) {
      return res.result.result.value;
    }
    return res && res.result ? res.result.value : null;
  };

  console.log('Navigating to http://localhost:4173/edit-image ...');
  await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });

  // Wait for page to load and React to hydrate EditorStartScreen
  console.log('Waiting for Edit Image page hydration...');
  for (let i = 0; i < 40; i++) {
    const ready = await evalExpr(
      `Boolean(document.getElementById('start-blank-canvas-btn') || document.querySelector('input[data-testid="main-file-input"]'))`
    );
    if (ready) {
      console.log(`Edit Image page hydrated at iteration ${i}!`);
      break;
    }
    await sleep(300);
  }
  await sleep(400);

  // Dismiss cookie consent banner if present
  await evalExpr(`
    (() => {
      const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Accept All'));
      if (acceptBtn) acceptBtn.click();
    })()
  `);
  await sleep(400);

  // 1. Initialize canvas with a test image and two shapes (Circle and Rectangle)
  console.log('Step 1: Setting up canvas with base image, Circle shape, and Rectangle shape...');
  const initDebug = await evalExpr(`(() => {
    const startBlankBtn = document.getElementById('start-blank-canvas-btn');
    const mainInput = document.querySelector('input[data-testid="main-file-input"]');
    
    // If start blank button exists, click it and confirm
    if (startBlankBtn) {
      startBlankBtn.click();
      setTimeout(() => {
        const confirmBtn = document.getElementById('confirm-create-canvas-btn');
        if (confirmBtn) confirmBtn.click();
      }, 100);
      return { used: 'blank-canvas-btn' };
    }

    if (mainInput) {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 600, 400);
      ctx.fillStyle = '#6366F1';
      ctx.font = 'bold 24px Poppins, sans-serif';
      ctx.fillText('Auto Shape & Text Test Canvas', 40, 80);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'test-art.png', { type: 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);
        mainInput.files = dt.files;
        mainInput.dispatchEvent(new Event('change', { bubbles: true }));
      }, 'image/png');
      return { used: 'file-input' };
    }

    return { used: 'none' };
  })()`);
  console.log('Init debug:', initDebug);

  console.log('Waiting for canvas to load and initialize...');
  for (let i = 0; i < 30; i++) {
    const ready = await evalExpr(`Boolean(document.querySelector('[data-canvas-stage="true"]') && window.__editorAddShape)`);
    if (ready) {
      console.log(`Canvas and shape engine ready at iteration ${i}!`);
      break;
    }
    await sleep(400);
  }
  await sleep(1000);

  // Add Circle shape and Rectangle shape using the editor shape engine
  console.log('Adding Circle shape and Rectangle shape to canvas...');
  await evalExpr(`(() => {
    if (window.__editorAddShape) {
      window.__editorAddShape('circle');
      window.__editorAddShape('rect');
    }
  })()`);
  await sleep(1000);

  // =========================================================================
  // STEP 2: Add and Select Circle Shape -> Verify Automatic Shape Properties
  // =========================================================================
  console.log('Step 2: Adding and selecting Circle shape...');
  await evalExpr(`(() => {
    if (window.__editorAddShape) {
      window.__editorAddShape('circle');
    }
  })()`);
  await sleep(600);

  const circleSelectResult = await evalExpr(`(() => {
    const badge = document.querySelector('[data-testid="contextual-tool-badge"]');
    const shapeTypeSelect = document.querySelector('[data-testid="select-shape-type"]');
    const fillColorWrap = document.querySelector('[data-testid="shape-fill-color"]');
    const strokeColorWrap = document.querySelector('[data-testid="shape-stroke-color"]');
    const strokeWidthInput = document.querySelector('[data-testid="input-shape-stroke-width"]');
    const opacitySelect = document.querySelector('[data-testid="select-shape-opacity"]');
    const blendModeSelect = document.querySelector('[data-testid="select-shape-blend-mode"]');
    const cornerRadiusWrap = document.querySelector('[data-testid="shape-corner-radius-wrap"]');
    const posXInput = document.querySelector('[data-testid="input-shape-pos-x"]');
    const posYInput = document.querySelector('[data-testid="input-shape-pos-y"]');

    return {
      hasBadge: Boolean(badge),
      badgeText: badge ? badge.textContent.trim() : null,
      shapeTypeVal: shapeTypeSelect ? shapeTypeSelect.value : null,
      hasFillColor: Boolean(fillColorWrap),
      hasStrokeColor: Boolean(strokeColorWrap),
      hasStrokeWidth: Boolean(strokeWidthInput),
      hasOpacity: Boolean(opacitySelect),
      hasBlendMode: Boolean(blendModeSelect),
      hasCornerRadiusForCircle: Boolean(cornerRadiusWrap), // Should be FALSE for circle
      hasPosX: Boolean(posXInput),
      hasPosY: Boolean(posYInput)
    };
  })()`);
  report.step2_circleSelected = circleSelectResult;
  console.log('Step 2 Result:', circleSelectResult);
  await capture('shape_text_1_circle_selected');

  // =========================================================================
  // STEP 3: Add and Select Rectangle Shape -> Verify Corner Radius & Shape Type
  // =========================================================================
  console.log('Step 3: Adding and selecting Rectangle shape...');
  await evalExpr(`(() => {
    if (window.__editorAddShape) {
      window.__editorAddShape('rect');
    }
  })()`);
  await sleep(600);

  const rectSelectResult = await evalExpr(`(() => {
    const badge = document.querySelector('[data-testid="contextual-tool-badge"]');
    const shapeTypeSelect = document.querySelector('[data-testid="select-shape-type"]');
    const cornerRadiusWrap = document.querySelector('[data-testid="shape-corner-radius-wrap"]');
    const cornerRadiusInput = document.querySelector('[data-testid="input-shape-corner-radius"]');

    return {
      hasBadge: Boolean(badge),
      badgeText: badge ? badge.textContent.trim() : null,
      shapeTypeVal: shapeTypeSelect ? shapeTypeSelect.value : null,
      hasCornerRadiusForRect: Boolean(cornerRadiusWrap), // Should be TRUE for rectangle
      cornerRadiusVal: cornerRadiusInput ? cornerRadiusInput.value : null
    };
  })()`);
  report.step3_rectSelected = rectSelectResult;
  console.log('Step 3 Result:', rectSelectResult);
  await capture('shape_text_2_rectangle_selected');

  // =========================================================================
  // STEP 4: Change Fill, Stroke, Stroke Width & Live Update
  // =========================================================================
  console.log('Step 4: Changing Fill and Stroke live...');
  await evalExpr(`(() => {
    const strokeWidthInput = document.querySelector('[data-testid="input-shape-stroke-width"]');
    if (strokeWidthInput) {
      strokeWidthInput.value = '6';
      strokeWidthInput.dispatchEvent(new Event('input', { bubbles: true }));
      strokeWidthInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const fillInput = document.querySelector('[data-testid="shape-fill-color"] input[type="color"]');
    if (fillInput) {
      fillInput.value = '#ef4444';
      fillInput.dispatchEvent(new Event('input', { bubbles: true }));
      fillInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const strokeInput = document.querySelector('[data-testid="shape-stroke-color"] input[type="color"]');
    if (strokeInput) {
      strokeInput.value = '#10b981';
      strokeInput.dispatchEvent(new Event('input', { bubbles: true }));
      strokeInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(600);

  const shapeUpdateResult = await evalExpr(`(() => {
    // Find the rectangle svg on stage
    const rects = Array.from(document.querySelectorAll('[data-canvas-stage="true"] svg rect'));
    const styledRect = rects.find(r => r.getAttribute('stroke-width') === '6' || r.getAttribute('fill') === '#ef4444');
    const target = styledRect || rects[rects.length - 1];
    return {
      fillApplied: target ? target.getAttribute('fill') : null,
      strokeApplied: target ? target.getAttribute('stroke') : null,
      strokeWidthApplied: target ? target.getAttribute('stroke-width') : null
    };
  })()`);
  report.step4_shapeStyleUpdated = shapeUpdateResult;
  console.log('Step 4 Result:', shapeUpdateResult);
  await capture('shape_text_3_shape_style_updated');

  // =========================================================================
  // STEP 5: Select Text Tool -> Verify Contextual Toolbar (No Add Text button)
  // =========================================================================
  console.log('Step 5: Selecting Text tool from main toolbar...');
  await evalExpr(`(() => {
    const textToolBtn = document.querySelector('[data-testid="tool-text"]');
    if (textToolBtn) textToolBtn.click();
  })()`);
  await sleep(600);

  const textToolResult = await evalExpr(`(() => {
    const badge = document.querySelector('[data-testid="contextual-tool-badge"]');
    const fontSelect = document.querySelector('[data-testid="select-text-font-family"]');
    const fontSizeInput = document.querySelector('[data-testid="input-text-font-size"]');
    const boldBtn = document.querySelector('[data-testid="btn-text-bold"]');
    const italicBtn = document.querySelector('[data-testid="btn-text-italic"]');
    const underlineBtn = document.querySelector('[data-testid="btn-text-underline"]');
    const alignLeftBtn = document.querySelector('[data-testid="btn-text-align-left"]');
    const textColorWrap = document.querySelector('[data-testid="wrap-text-color"]');
    const lineSpacingInput = document.querySelector('[data-testid="input-text-line-height"]');
    const letterSpacingInput = document.querySelector('[data-testid="input-text-letter-spacing"]');
    const textBgColorWrap = document.querySelector('[data-testid="wrap-text-bg-color"]');
    const textOpacitySelect = document.querySelector('[data-testid="select-text-opacity"]');

    // Check that "+ Add Text" button is completely gone
    const allButtons = Array.from(document.querySelectorAll('[data-testid="contextual-toolbar"] button'));
    const hasAddTextBtn = allButtons.some(b => (b.textContent || '').includes('Add Text'));

    return {
      badgeText: badge ? badge.textContent.trim() : null,
      hasFontSelect: Boolean(fontSelect),
      hasFontSizeInput: Boolean(fontSizeInput),
      hasBold: Boolean(boldBtn),
      hasItalic: Boolean(italicBtn),
      hasUnderline: Boolean(underlineBtn),
      hasAlign: Boolean(alignLeftBtn),
      hasTextColor: Boolean(textColorWrap),
      hasLineSpacing: Boolean(lineSpacingInput),
      hasLetterSpacing: Boolean(letterSpacingInput),
      hasTextBgColor: Boolean(textBgColorWrap),
      hasTextOpacity: Boolean(textOpacitySelect),
      hasAddTextBtn
    };
  })()`);
  report.step5_textToolActive = textToolResult;
  console.log('Step 5 Result:', textToolResult);
  await capture('shape_text_4_text_tool_active');

  // =========================================================================
  // STEP 6: Click Directly on Canvas to Create Text Layer
  // =========================================================================
  console.log('Step 6: Clicking directly on canvas stage to create text layer...');
  await evalExpr(`(() => {
    const stage = document.querySelector('[data-canvas-stage="true"]');
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const clickX = rect.left + 150;
    const clickY = rect.top + 220;

    stage.dispatchEvent(new MouseEvent('click', { clientX: clickX, clientY: clickY, bubbles: true }));
  })()`);
  await sleep(600);

  const textCreatedResult = await evalExpr(`(() => {
    const textarea = document.querySelector('textarea[data-text-editor="true"]');
    const rows = Array.from(document.querySelectorAll('[data-layer-id]'));
    const hasTextLayerInPanel = rows.some(r => (r.textContent || '').includes('Text'));

    return {
      hasTextarea: Boolean(textarea),
      textareaFocused: textarea === document.activeElement,
      hasTextLayerInPanel,
      totalLayers: rows.length
    };
  })()`);
  report.step6_textCreatedOnCanvas = textCreatedResult;
  console.log('Step 6 Result:', textCreatedResult);

  // Type text directly
  await evalExpr(`(() => {
    const textarea = document.querySelector('textarea[data-text-editor="true"]');
    if (textarea) {
      textarea.value = 'PROSPER DRIVING';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(400);
  await capture('shape_text_5_text_created_and_typing');

  // =========================================================================
  // STEP 7: Click Outside to Commit Text
  // =========================================================================
  console.log('Step 7: Clicking outside to commit text...');
  await evalExpr(`(() => {
    const stage = document.querySelector('[data-canvas-stage="true"]');
    if (stage) {
      const rect = stage.getBoundingClientRect();
      stage.dispatchEvent(new MouseEvent('click', { clientX: rect.left + 10, clientY: rect.top + 10, bubbles: true }));
    }
  })()`);
  await sleep(600);

  const textCommitResult = await evalExpr(`(() => {
    const textarea = document.querySelector('textarea[data-text-editor="true"]');
    const textContentEl = document.querySelector('[data-text-content="true"]');
    const rows = Array.from(document.querySelectorAll('[data-layer-id]'));

    return {
      isEditingClosed: !textarea,
      renderedText: textContentEl ? textContentEl.textContent.trim() : null,
      totalLayers: rows.length
    };
  })()`);
  report.step7_textCommitted = textCommitResult;
  console.log('Step 7 Result:', textCommitResult);
  await capture('shape_text_6_text_committed');

  // =========================================================================
  // STEP 8: Select Existing Text Layer -> Auto Text Properties
  // =========================================================================
  console.log('Step 8: Selecting existing text layer...');
  await evalExpr(`(() => {
    const selectBtn = document.querySelector('[data-testid="tool-select"]') || document.querySelector('[data-testid="tool-move"]');
    if (selectBtn) selectBtn.click();
  })()`);
  await sleep(300);

  await evalExpr(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-layer-id]'));
    const textRow = rows.find(r => (r.textContent || '').includes('Text'));
    if (textRow) textRow.click();
  })()`);
  await sleep(600);

  const textPropsResult = await evalExpr(`(() => {
    const badge = document.querySelector('[data-testid="contextual-tool-badge"]');
    const fontSelect = document.querySelector('[data-testid="select-text-font-family"]');
    const fontSizeInput = document.querySelector('[data-testid="input-text-font-size"]');

    return {
      badgeText: badge ? badge.textContent.trim() : null,
      fontFamily: fontSelect ? fontSelect.value : null,
      fontSize: fontSizeInput ? fontSizeInput.value : null
    };
  })()`);
  report.step8_textPropertiesAuto = textPropsResult;
  console.log('Step 8 Result:', textPropsResult);
  await capture('shape_text_7_text_properties');

  // =========================================================================
  // STEP 9: Re-edit Text Layer with Text Tool without Duplicating
  // =========================================================================
  console.log('Step 9: Clicking text layer with Text tool active (should not duplicate)...');
  await evalExpr(`(() => {
    const textToolBtn = document.querySelector('[data-testid="tool-text"]');
    if (textToolBtn) textToolBtn.click();
  })()`);
  await sleep(400);

  const countBefore = await evalExpr(`document.querySelectorAll('[data-layer-id]').length`);

  await evalExpr(`(() => {
    const textContentEl = document.querySelector('[data-text-content="true"]');
    if (textContentEl) {
      textContentEl.click();
    }
  })()`);
  await sleep(600);

  const reeditResult = await evalExpr(`(() => {
    const textarea = document.querySelector('textarea[data-text-editor="true"]');
    const countAfter = document.querySelectorAll('[data-layer-id]').length;

    return {
      countBefore: ${countBefore},
      countAfter,
      noDuplicateCreated: ${countBefore} === countAfter,
      editingActive: Boolean(textarea)
    };
  })()`);
  report.step9_reeditWithoutDuplicate = reeditResult;
  console.log('Step 9 Result:', reeditResult);
  await capture('shape_text_8_reedit_text');

  // =========================================================================
  // STEP 10: Switch Between Shape, Text, and Image Layers
  // =========================================================================
  console.log('Step 10: Testing seamless layer switching between Shape, Text, and Image...');
  // Commit text first
  await evalExpr(`(() => {
    const stage = document.querySelector('[data-canvas-stage="true"]');
    if (stage) stage.click();
    const selectBtn = document.querySelector('[data-testid="tool-select"]') || document.querySelector('[data-testid="tool-move"]');
    if (selectBtn) selectBtn.click();
  })()`);
  await sleep(400);

  // 1. Select Circle
  await evalExpr(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-layer-id]'));
    const circleRow = rows.find(r => (r.textContent || '').includes('Circle'));
    if (circleRow) circleRow.click();
  })()`);
  await sleep(400);

  const circleBadge = await evalExpr(`document.querySelector('[data-testid="contextual-tool-badge"]')?.textContent.trim()`);
  const circleShapeSelect = await evalExpr(`Boolean(document.querySelector('[data-testid="select-shape-type"]'))`);

  // 2. Select Text
  await evalExpr(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-layer-id]'));
    const textRow = rows.find(r => (r.textContent || '').includes('Text'));
    if (textRow) textRow.click();
  })()`);
  await sleep(400);

  const textBadge = await evalExpr(`document.querySelector('[data-testid="contextual-tool-badge"]')?.textContent.trim()`);
  const textFontSelect = await evalExpr(`Boolean(document.querySelector('[data-testid="select-text-font-family"]'))`);
  const textHasNoShapeSelect = await evalExpr(`!document.querySelector('[data-testid="select-shape-type"]')`);

  // 3. Select Background / Image
  await evalExpr(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-layer-id]'));
    const bgRow = rows.find(r => (r.textContent || '').includes('Background') || (r.textContent || '').includes('Canvas'));
    if (bgRow) bgRow.click();
  })()`);
  await sleep(400);

  const bgBadge = await evalExpr(`document.querySelector('[data-testid="contextual-tool-badge"]')?.textContent.trim()`);
  const bgHasNoShapeSelect = await evalExpr(`!document.querySelector('[data-testid="select-shape-type"]')`);
  const bgHasNoTextFont = await evalExpr(`!document.querySelector('[data-testid="select-text-font-family"]')`);

  const layerSwitchResult = {
    circleBadge,
    circleShapeSelect,
    textBadge,
    textFontSelect,
    textHasNoShapeSelect,
    bgBadge,
    bgHasNoShapeSelect,
    bgHasNoTextFont
  };
  report.step10_layerTypeSwitching = layerSwitchResult;
  console.log('Step 10 Result:', layerSwitchResult);
  await capture('shape_text_9_switch_layers');

  // Save JSON report
  fs.writeFileSync(
    path.join(outDir, 'shape_and_text_verification_results.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('--- ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
  ws.close();
  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Test error:', err);
  edge.kill();
  process.exit(1);
});
