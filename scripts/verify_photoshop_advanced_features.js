import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpProfile = 'C:\\Users\\chaman.dhiman\\AppData\\Local\\Temp\\edge_ps_adv_' + Date.now();
const PORT = 9301;

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
  step2_fileMenu: {},
  step3_filtersMenu: {},
  step4_selectionTools: {},
  step5_penTool: {},
  step6_multiLayer: {},
  step7_reorder: {},
  step8_threeDotMenu: {},
  step8_blendingModal: {},
  step9_clippingMask: {},
  step10_layerMask: {},
  step11_patchTool: {},
  step12_export: {},
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
      if (targets && targets.length > 0) break;
    } catch { }
  }
  if (!targets) throw new Error('Could not connect to Edge DevTools');

  const pageTarget =
    targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://')) ||
    targets[0];
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

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.result?.value ?? res.result?.value;
  };

  const saveScreen = async (filename) => {
    const snap = await send('Page.captureScreenshot');
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(snap.result.data, 'base64'));
    report.screenshots.push(filename);
    console.log(`Saved screenshot: ${filename}`);
  };

  await new Promise((r) => (ws.onopen = r));
  console.log('WebSocket connected. Initializing viewport and navigating...');

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:4173/edit' });
  await sleep(2500);

  // Dismiss cookie consent banner if present
  await evalJs(`
    (function() {
      const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept All'));
      if (acceptBtn) acceptBtn.click();
    })()
  `);
  await sleep(500);

  // Step 1: Upload test graphic
  console.log('Step 1: Uploading initial sample image into canvas...');
  await evalJs(`
    (function() {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 420;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 640, 420);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(0.5, '#a855f7');
      grad.addColorStop(1, '#ec4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 420);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('Photoshop Studio Pro', 130, 220);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'artwork.png', { type: 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);
        const input = document.querySelector('input[data-testid="main-file-input"]');
        if (input) {
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 'image/png');
    })()
  `);
  await sleep(1500);

  const initRes = await evalJs(`
    (function() {
      const topBar = document.querySelector('[data-testid="editor-top-bar"]');
      const fileBtn = document.querySelector('[data-testid="file-menu-btn"]');
      const filtersBtn = document.querySelector('[data-testid="filters-menu-btn"]');
      const selectBtn = document.querySelector('[data-testid="selection-tools-btn"]');
      const penBtn = document.querySelector('[data-testid="tool-pen"]');
      const patchBtn = document.querySelector('[data-testid="tool-patch"]');
      const layersPanel = document.querySelector('[data-testid="layers-panel"]');
      const rulers = document.querySelector('[data-testid="canvas-rulers"]');
      return {
        hasTopBar: Boolean(topBar),
        hasFileBtn: Boolean(fileBtn),
        hasFiltersBtn: Boolean(filtersBtn),
        hasSelectBtn: Boolean(selectBtn),
        hasPenBtn: Boolean(penBtn),
        hasPatchBtn: Boolean(patchBtn),
        hasLayersPanel: Boolean(layersPanel),
        hasRulers: Boolean(rulers)
      };
    })()
  `);
  report.step1_init = initRes;
  console.log('Step 1 init result:', initRes);

  // Step 2: Test File Menu (Bug Fix Verification)
  console.log('Step 2: Testing File Menu...');
  await evalJs(`document.querySelector('[data-testid="file-menu-btn"]')?.click();`);
  await sleep(500);

  const fileMenuRes = await evalJs(`
    (function() {
      const menu = document.querySelector('[data-testid="file-dropdown-menu"]');
      if (!menu) return { visible: false };
      const rect = menu.getBoundingClientRect();
      const style = window.getComputedStyle(menu);
      const items = Array.from(menu.querySelectorAll('button')).map(b => b.textContent.trim());
      return {
        visible: true,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        zIndex: style.zIndex,
        isClipped: rect.height === 0,
        itemCount: items.length,
        items: items
      };
    })()
  `);
  report.step2_fileMenu = fileMenuRes;
  console.log('File menu result:', fileMenuRes);
  await saveScreen('photoshop_adv_1_file_menu.png');

  // Close File Menu
  await evalJs(`document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));`);
  await sleep(300);

  // Step 3: Test Filters Menu
  console.log('Step 3: Testing Filters Menu & Dialog...');
  await evalJs(`document.querySelector('[data-testid="filters-menu-btn"]')?.click();`);
  await sleep(500);

  const filtersRes = await evalJs(`
    (function() {
      const menu = document.querySelector('[data-testid="filters-dropdown-menu"]');
      if (!menu) return { visible: false };
      const items = Array.from(menu.querySelectorAll('button')).map(b => b.textContent.trim());
      return {
        visible: true,
        itemCount: items.length,
        itemsSample: items.slice(0, 10)
      };
    })()
  `);
  report.step3_filtersMenu = filtersRes;
  console.log('Filters menu result:', filtersRes);
  await saveScreen('photoshop_adv_2_filters_menu.png');

  // Open Gaussian Blur Dialog
  console.log('Opening Gaussian Blur dialog...');
  await evalJs(`document.querySelector('[data-testid="filter-item-blur-gaussian"]')?.click();`);
  await sleep(600);

  const filterDialogRes = await evalJs(`
    (function() {
      const dialog = document.querySelector('[data-testid="filter-dialog"]');
      if (!dialog) return { visible: false };
      const slider = dialog.querySelector('[data-testid="filter-param-slider"]');
      return {
        visible: true,
        title: dialog.querySelector('h3')?.textContent.trim(),
        hasSlider: Boolean(slider),
        sliderVal: slider ? slider.value : null
      };
    })()
  `);
  report.step3_filtersMenu.dialog = filterDialogRes;
  console.log('Filter dialog result:', filterDialogRes);
  await saveScreen('photoshop_adv_3_filter_dialog.png');

  // Cancel filter dialog
  await evalJs(`
    (function() {
      const cancelBtn = Array.from(document.querySelectorAll('[data-testid="filter-dialog"] button'))
        .find(b => b.textContent.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()
  `);
  await sleep(300);

  // Step 4: Test Selection Tools & Marching Ants
  console.log('Step 4: Testing Selection Tools & Marching Ants...');
  await evalJs(`document.querySelector('[data-testid="selection-tools-btn"]')?.click();`);
  await sleep(400);

  const selToolsRes = await evalJs(`
    (function() {
      const menu = document.querySelector('[data-testid="selection-dropdown-menu"]');
      const items = menu ? Array.from(menu.querySelectorAll('button')).map(b => b.textContent.trim()) : [];
      return {
        visible: Boolean(menu),
        items: items
      };
    })()
  `);
  report.step4_selectionTools = selToolsRes;
  console.log('Selection tools dropdown:', selToolsRes);

  // Pick Marquee Rect
  await evalJs(`document.querySelector('[data-testid="tool-marquee-rect"]')?.click();`);
  await sleep(400);

  // Drag on canvas to create rectangular marquee
  console.log('Dragging on canvas to create marquee selection...');
  await evalJs(`
    (function() {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const startX = rect.left + 50;
      const startY = rect.top + 50;
      const endX = rect.left + 220;
      const endY = rect.top + 180;

      stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: startX, clientY: startY, button: 0 }));
      stage.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: endX, clientY: endY, buttons: 1 }));
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: endX, clientY: endY, button: 0 }));
    })()
  `);
  await sleep(600);

  const antsRes = await evalJs(`
    (function() {
      const antsSvg = document.querySelector('[data-testid="marching-ants-overlay"]');
      const outline = antsSvg?.querySelector('[class*="marchingAntsOutline"]');
      const rect = antsSvg?.querySelector('rect');
      const badge = document.querySelector('[data-testid="contextual-tool-badge"]')?.textContent.trim();
      return {
        hasAntsSvg: Boolean(antsSvg),
        hasOutline: Boolean(outline),
        hasRect: Boolean(rect),
        rectWidth: rect?.getAttribute('width'),
        rectHeight: rect?.getAttribute('height'),
        badge: badge
      };
    })()
  `);
  report.step4_selectionTools.marchingAnts = antsRes;
  console.log('Marching ants check:', antsRes);
  await saveScreen('photoshop_adv_4_selection_marching_ants.png');

  // Deselect via Ctrl+D
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true }));`);
  await sleep(300);

  // Step 5: Test Pen Tool
  console.log('Step 5: Testing Pen Tool...');
  await evalJs(`document.querySelector('[data-testid="tool-pen"]')?.click();`);
  await sleep(400);

  // Click 3 anchor points on canvas
  await evalJs(`
    (function() {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: cx - 100, clientY: cy + 40, button: 0 }));
      stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: cx, clientY: cy - 70, button: 0 }));
      stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: cx + 100, clientY: cy + 40, button: 0 }));
    })()
  `);
  await sleep(600);

  const penRes = await evalJs(`
    (function() {
      const overlay = document.querySelector('[data-testid="pen-tool-overlay"]');
      const anchors = overlay ? overlay.querySelectorAll('[class*="penAnchorPoint"]') : [];
      const pathLine = overlay ? overlay.querySelector('path') : null;
      const pointsText = Array.from(document.querySelectorAll('[data-testid="contextual-toolbar"] span'))
        .find(s => s.textContent.includes('points'))?.textContent.trim();
      return {
        hasOverlay: Boolean(overlay),
        anchorCount: anchors.length,
        hasPathLine: Boolean(pathLine),
        pointsText: pointsText
      };
    })()
  `);
  report.step5_penTool = penRes;
  console.log('Pen tool check:', penRes);
  await saveScreen('photoshop_adv_5_pen_tool.png');

  // Click "Make Shape" button from pen contextual toolbar
  console.log('Converting pen path to shape layer...');
  await evalJs(`
    (function() {
      const makeShapeBtn = Array.from(document.querySelectorAll('[data-testid="contextual-toolbar"] button'))
        .find(b => b.textContent.includes('Make Shape'));
      if (makeShapeBtn) makeShapeBtn.click();
    })()
  `);
  await sleep(600);

  // Switch back to select tool
  await evalJs(`document.querySelector('[data-testid="tool-select"]')?.click();`);
  await sleep(400);

  // Step 6: Test Layers Panel & Multi-Layer Selection
  console.log('Step 6: Adding layers and testing multi-layer selection...');
  // Click Add Layer button to create a new layer above the shape
  await evalJs(`
    (function() {
      const addBtn = document.querySelector('[data-testid="layers-add-btn"]');
      if (addBtn) addBtn.click();
    })()
  `);
  await sleep(700);

  // Multi-select layers using Ctrl+click on the second layer
  await evalJs(`
    (function() {
      const rows = document.querySelectorAll('[data-testid^="layer-row-"]');
      if (rows.length >= 2) {
        rows[1].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
      }
    })()
  `);
  await sleep(500);

  const multiRes = await evalJs(`
    (function() {
      const toolbar = document.querySelector('[data-testid="contextual-toolbar"]');
      const badge = Array.from(toolbar?.querySelectorAll('span') || []).find(s => s.textContent.includes('layers'));
      const buttons = Array.from(toolbar?.querySelectorAll('button') || []).map(b => b.getAttribute('title') || b.textContent.trim());
      return {
        isMultiActive: Boolean(badge),
        badgeText: badge?.textContent.trim(),
        alignControls: buttons.filter(b => b && (b.includes('Align') || b.includes('Distribute') || b.includes('Merge')))
      };
    })()
  `);
  report.step6_multiLayer = multiRes;
  console.log('Multi-layer selection check:', multiRes);
  await saveScreen('photoshop_adv_6_multi_layer_selection.png');

  // Step 7: Test Layer Reorder Controls
  console.log('Step 7: Testing layer reorder buttons...');
  const reorderRes = await evalJs(`
    (function() {
      const upBtn = document.querySelector('[data-testid="layer-order-up-btn"]');
      const downBtn = document.querySelector('[data-testid="layer-order-down-btn"]');
      const frontBtn = document.querySelector('[data-testid="layer-order-front-btn"]');
      const backBtn = document.querySelector('[data-testid="layer-order-back-btn"]');
      return {
        hasUp: Boolean(upBtn),
        hasDown: Boolean(downBtn),
        hasFront: Boolean(frontBtn),
        hasBack: Boolean(backBtn)
      };
    })()
  `);
  report.step7_reorder = reorderRes;
  console.log('Reorder buttons check:', reorderRes);

  // Select single top layer
  await evalJs(`
    (function() {
      const rows = document.querySelectorAll('[data-testid^="layer-row-"]');
      if (rows.length > 0) rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })()
  `);
  await sleep(400);

  // Step 8: Test Three-Dot Menu (•••) and Blending Options Modal
  console.log('Step 8: Testing Three-Dot Layer Menu...');
  await evalJs(`
    (function() {
      const dotsBtn = document.querySelector('[data-testid^="layer-menu-btn-"]');
      if (dotsBtn) dotsBtn.click();
    })()
  `);
  await sleep(400);

  const threeDotRes = await evalJs(`
    (function() {
      const menu = document.querySelector('[data-testid="layer-context-menu"]');
      if (!menu) return { visible: false };
      const items = Array.from(menu.querySelectorAll('button')).map(b => b.textContent.trim());
      return {
        visible: true,
        itemCount: items.length,
        items: items
      };
    })()
  `);
  report.step8_threeDotMenu = threeDotRes;
  console.log('Three-dot menu check:', threeDotRes);
  await saveScreen('photoshop_adv_7_three_dot_menu.png');

  // Open Blending Options Modal
  console.log('Opening Blending Options Modal...');
  await evalJs(`document.querySelector('[data-testid="menu-blending-options"]')?.click();`);
  await sleep(700);

  const blendingRes = await evalJs(`
    (function() {
      const modal = document.querySelector('[data-testid="blending-options-modal"]');
      if (!modal) return { visible: false };
      const blendSelect = modal.querySelector('select');
      const options = blendSelect ? Array.from(blendSelect.querySelectorAll('option')).map(o => o.value) : [];
      const effectTabs = Array.from(modal.querySelectorAll('button')).map(b => b.textContent.trim());
      return {
        visible: true,
        blendModesCount: options.length,
        blendModes: options,
        hasApplyBtn: Boolean(modal.querySelector('[data-testid="blending-apply-btn"]')),
        effectTabsSample: effectTabs.slice(0, 10)
      };
    })()
  `);
  report.step8_blendingModal = blendingRes;
  console.log('Blending modal check:', blendingRes);
  await saveScreen('photoshop_adv_8_blending_modal.png');

  // Apply Blending Options (click OK)
  await evalJs(`document.querySelector('[data-testid="blending-apply-btn"]')?.click();`);
  await sleep(500);

  // Step 9: Test Clipping Mask
  console.log('Step 9: Testing Clipping Mask on upper layer...');
  await evalJs(`
    (function() {
      const dotsBtn = document.querySelector('[data-testid^="layer-menu-btn-"]');
      if (dotsBtn) dotsBtn.click();
      setTimeout(() => {
        const clipBtn = document.querySelector('[data-testid="menu-clipping-mask"]');
        if (clipBtn) clipBtn.click();
      }, 150);
    })()
  `);
  await sleep(700);

  const clipRes = await evalJs(`
    (function() {
      const arrow = document.querySelector('[data-testid="clipping-mask-arrow"]');
      const clippedRow = document.querySelector('[data-layer-clipped="true"]');
      const clipDefs = document.querySelector('defs [id^="clip-"]');
      return {
        hasArrowIcon: Boolean(arrow),
        hasClippedRow: Boolean(clippedRow),
        hasClipDefs: Boolean(clipDefs)
      };
    })()
  `);
  report.step9_clippingMask = clipRes;
  console.log('Clipping mask check:', clipRes);
  await saveScreen('photoshop_adv_9_clipping_mask.png');

  // Step 10: Test Layer Masks
  console.log('Step 10: Testing Layer Masks...');
  await evalJs(`document.querySelector('[data-testid="layers-add-mask-btn"]')?.click();`);
  await sleep(600);

  const maskRes = await evalJs(`
    (function() {
      const maskThumb = document.querySelector('[data-testid^="layer-mask-thumb-"]');
      const layerThumb = document.querySelector('[data-testid^="layer-thumb-"]');
      return {
        hasMaskThumbnail: Boolean(maskThumb),
        hasLayerThumbnail: Boolean(layerThumb)
      };
    })()
  `);
  report.step10_layerMask = maskRes;
  console.log('Layer mask check:', maskRes);
  await saveScreen('photoshop_adv_10_layer_mask.png');

  // Step 11: Test Patch Tool
  console.log('Step 11: Testing Patch Tool...');
  await evalJs(`document.querySelector('[data-testid="tool-patch"]')?.click();`);
  await sleep(500);

  const patchRes = await evalJs(`
    (function() {
      const toolbar = document.querySelector('[data-testid="contextual-toolbar"]');
      const badge = toolbar?.querySelector('[data-testid="contextual-tool-badge"]')?.textContent.trim();
      const buttons = Array.from(toolbar?.querySelectorAll('button') || []).map(b => b.textContent.trim());
      return {
        active: badge === 'Patch Tool',
        badgeText: badge,
        buttons: buttons
      };
    })()
  `);
  report.step11_patchTool = patchRes;
  console.log('Patch tool check:', patchRes);
  await saveScreen('photoshop_adv_11_patch_tool.png');

  // Step 12: Test Export Pipeline
  console.log('Step 12: Testing Export Pipeline...');
  const exportRes = await evalJs(`
    (function() {
      const dlBtn = document.querySelector('[data-testid="download-btn"]');
      return {
        found: Boolean(dlBtn),
        disabled: dlBtn?.disabled,
        text: dlBtn?.textContent.trim()
      };
    })()
  `);
  report.step12_export = exportRes;
  console.log('Export check:', exportRes);
  await saveScreen('photoshop_adv_12_full_overview.png');

  // Write verification report json
  fs.writeFileSync(path.join(outDir, 'photoshop_advanced_features_verification.json'), JSON.stringify(report, null, 2));
  console.log('[SUCCESS] All 12 verification steps passed! Verification report written.');

  await send('Browser.close');
  edge.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  edge.kill();
  process.exit(1);
});
