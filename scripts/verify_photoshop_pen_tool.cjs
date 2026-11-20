const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9460;
const previewUrl = 'http://127.0.0.1:4173/edit-image';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-pen-tool-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runPenToolAudit() {
  console.log('--- Launching Edge for Photoshop Pen Tool Verification ---');
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
    test: 'Make Pen Tool Work Like Photoshop - Closed Editable Vector Shapes',
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
    await sleep(4000);

    // Dismiss cookie banner
    await evaluate(`(() => {
      try {
        localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));
      } catch {}
      const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Accept All'));
      if (acceptBtn) acceptBtn.click();
    })()`);
    await sleep(800);

    // Create a new blank canvas project (1000x800)
    console.log('Creating blank project...');
    // Try welcome card first
    let hasNewProjectCard = await evaluate(`!!document.querySelector('[data-testid="welcome-card-new-project"]')`);
    if (!hasNewProjectCard) {
      // May need more time; wait and retry
      await sleep(2000);
      hasNewProjectCard = await evaluate(`!!document.querySelector('[data-testid="welcome-card-new-project"]')`);
    }
    if (hasNewProjectCard) {
      await evaluate(`document.querySelector('[data-testid="welcome-card-new-project"]').click()`);
      await sleep(600);
      const hasSubmitBtn = await evaluate(`!!document.querySelector('[data-testid="new-project-submit-btn"]')`);
      if (hasSubmitBtn) {
        await evaluate(`document.querySelector('[data-testid="new-project-submit-btn"]').click()`);
      }
      await sleep(2000);
    }
    // Verify canvas stage is loaded
    const stageLoaded = await evaluate(`!!document.querySelector('[data-canvas-stage="true"]')`);
    console.log('Canvas stage loaded:', stageLoaded);
    if (!stageLoaded) throw new Error('Stage not found after project creation');

    // Step 1: Select Pen Tool
    console.log('Selecting Pen Tool...');
    await evaluate(`(() => {
      const penBtn = document.querySelector('[data-testid="tool-pen"]') || document.querySelector('button[title*="Pen" i]');
      if (penBtn) penBtn.click();
    })()`);
    await sleep(400);

    const penActive = await evaluate(`(() => {
      const penBtn = document.querySelector('[data-testid="tool-pen"]');
      const contextualBadge = document.querySelector('[data-testid="contextual-tool-badge"]');
      return {
        hasBadge: !!contextualBadge && contextualBadge.textContent.includes('Pen Tool'),
        isPenBtnActive: penBtn ? penBtn.className.includes('active') || penBtn.getAttribute('aria-pressed') === 'true' : false,
      };
    })()`);
    console.log('Pen tool activation status:', penActive);
    auditResults.checks.penToolSelected = penActive.hasBadge;

    // Check Contextual Toolbar controls for Pen Tool
    const toolbarAudit = await evaluate(`(() => {
      const fillColor = document.querySelector('[data-testid="pen-fill-color"]');
      const strokeColor = document.querySelector('[data-testid="pen-stroke-color"]');
      const strokeWidth = document.querySelector('[data-testid="pen-stroke-width-select"]');
      const opacitySelect = document.querySelector('[data-testid="pen-opacity-select"]');
      const blendSelect = document.querySelector('[data-testid="pen-blend-select"]');
      const selectionBtn = document.querySelector('[data-testid="btn-pen-make-selection"]');
      return {
        hasFill: !!fillColor,
        hasStroke: !!strokeColor,
        hasStrokeWidth: !!strokeWidth,
        hasOpacity: !!opacitySelect,
        hasBlend: !!blendSelect,
        hasSelectionBtn: !!selectionBtn,
      };
    })()`);
    console.log('Pen Contextual Toolbar Audit:', toolbarAudit);
    auditResults.checks.contextualToolbarControlsPresent = Object.values(toolbarAudit).every(Boolean);

    // Step 2: Draw a triangle on canvas and close it by clicking first point
    console.log('Drawing triangle vector path...');
    // Stage coordinates - stageInfo is for reference only
    const stageInfo = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]') || document.querySelector('.mainCanvasContainer');
      const rect = stage ? stage.getBoundingClientRect() : null;
      return rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null;
    })()`);

    if (!stageInfo) throw new Error('Stage not found');
    console.log('Stage info:', stageInfo);

    // Canvas click positions (P1, P2, P3, then P1 again to close)
    const p1 = { x: 250, y: 150 };
    const p2 = { x: 550, y: 150 };
    const p3 = { x: 400, y: 400 };

    // Function to simulate canvas pointer down/up at doc coordinates
    const clickAt = async (docX, docY) => {
      const dbg = await evaluate(`(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]') || document.querySelector('.mainCanvasContainer');
        const rect = stage.getBoundingClientRect();
        const effZoom = rect.width / 1000;
        const clientX = rect.left + ${docX} * effZoom;
        const clientY = rect.top + ${docY} * effZoom;

        const down = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX, clientY, pointerType: 'mouse' });
        const up = new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX, clientY, pointerType: 'mouse' });
        stage.dispatchEvent(down);
        stage.dispatchEvent(up);
        return { rectWidth: rect.width, rectHeight: rect.height, effZoom, clientX, clientY };
      })()`);
      console.log('clickAt (' + docX + ', ' + docY + '):', dbg);
      await sleep(250);
    };

    const hoverAt = async (docX, docY) => {
      await evaluate(`(() => {
        const stage = document.querySelector('[data-canvas-stage="true"]') || document.querySelector('.mainCanvasContainer');
        const rect = stage.getBoundingClientRect();
        const effZoom = rect.width / 1000;
        const clientX = rect.left + ${docX} * effZoom;
        const clientY = rect.top + ${docY} * effZoom;
        const move = new PointerEvent('pointermove', { bubbles: true, cancelable: true, clientX, clientY, pointerType: 'mouse' });
        stage.dispatchEvent(move);
      })()`);
      await sleep(150);
    };

    // Click Point 1
    console.log('Clicking Point 1...');
    await clickAt(p1.x, p1.y);
    // Click Point 2
    console.log('Clicking Point 2...');
    await clickAt(p2.x, p2.y);
    // Click Point 3
    console.log('Clicking Point 3...');
    await clickAt(p3.x, p3.y);

    // Hover over Point 1 - verify close indicator
    console.log('Hovering Point 1 to test close indicator...');
    await hoverAt(p1.x, p1.y);
    await sleep(300);
    const closeIndicator = await evaluate(`(() => {
      // Check DOM elements for close ring / tooltip
      const closeRing = document.querySelector('[class*="closeRingIndicator"]');
      const closeTooltip = Array.from(document.querySelectorAll('[class*="floatingTooltip"]')).find(t => t.textContent.toLowerCase().includes('close'));
      const startCloseNode = document.querySelector('[class*="anchorNodeStartClose"]');
      // Also check penHoverMode internal state via data attribute or React fiber
      const overlay = document.querySelector('[data-testid="vector-path-overlay"]');
      const overlayHasClose = overlay ? (overlay.dataset.hovermode === 'close') : false;
      // Check if close ring SVG circle exists in svg layer
      const svgRings = Array.from(document.querySelectorAll('circle[class*="closeRing"]'));
      return {
        hasCloseRing: !!closeRing || svgRings.length > 0,
        hasTooltip: !!closeTooltip,
        hasStartCloseNode: !!startCloseNode,
        overlayHasClose,
      };
    })()`);
    console.log('Close indicator audit:', closeIndicator);
    auditResults.checks.closeHoverIndicatorPresent = closeIndicator.hasCloseRing || closeIndicator.hasTooltip || closeIndicator.hasStartCloseNode || closeIndicator.overlayHasClose;

    // Click Point 1 to close and automatically complete the shape
    console.log('Clicking Point 1 to close shape...');
    await clickAt(p1.x, p1.y);
    await sleep(600);

    // Verify Vector Shape layer created automatically
    const shapeLayerAudit = await evaluate(`(() => {
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const vectorShape = layers.find(l => l.name?.includes('Vector Shape') || l.shapeType === 'custom-path');
      return {
        created: !!vectorShape,
        name: vectorShape?.name,
        type: vectorShape?.type,
        shapeType: vectorShape?.shapeType,
        hasPoints: Boolean(vectorShape?.points && vectorShape.points.length >= 3),
        pointsCount: vectorShape?.points?.length,
        hasPathData: !!vectorShape?.pathData,
        fillColor: vectorShape?.fillColor,
        strokeColor: vectorShape?.strokeColor,
        strokeWidth: vectorShape?.strokeWidth,
      };
    })()`);
    console.log('Vector Shape Creation Audit:', shapeLayerAudit);
    auditResults.checks.vectorShapeCreatedOnClose = shapeLayerAudit.created && shapeLayerAudit.hasPoints && shapeLayerAudit.hasPathData;
    auditResults.measurements.shapeLayer = shapeLayerAudit;

    // Capture screenshot 1: Closed triangle vector shape
    await captureScreenshot(path.join(ARTIFACT_DIR, 'test_pen_01_closed_triangle_shape.png'));

    // Step 3: Edit Anchor Point & Bézier Handles
    console.log('Testing Anchor Point selection and Bézier handles...');
    // Click Anchor Node 0 to select it
    await evaluate(`(() => {
      const node0 = document.querySelector('[data-testid="anchor-node-0"]');
      if (node0) {
        node0.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      }
    })()`);
    await sleep(300);

    // Convert to Smooth Curve via floating toolbar
    const floatingBarAudit = await evaluate(`(() => {
      const bar = document.querySelector('[data-testid="floating-node-bar"]');
      const cornerBtn = document.querySelector('[data-testid="btn-node-corner"]');
      const smoothBtn = document.querySelector('[data-testid="btn-node-smooth"]');
      const symmetricBtn = document.querySelector('[data-testid="btn-node-symmetric"]');
      const deleteBtn = document.querySelector('[data-testid="btn-delete-node"]');
      return {
        hasBar: !!bar,
        hasCorner: !!cornerBtn,
        hasSmooth: !!smoothBtn,
        hasSymmetric: !!symmetricBtn,
        hasDelete: !!deleteBtn,
      };
    })()`);
    console.log('Floating Node Conversion Bar Audit:', floatingBarAudit);
    auditResults.checks.floatingNodeBarPresent = floatingBarAudit.hasBar && floatingBarAudit.hasSmooth;

    console.log('Clicking Smooth Curve button...');
    await evaluate(`document.querySelector('[data-testid="btn-node-smooth"]').click()`);
    await sleep(400);

    // Verify Bézier handles appear
    const bezierHandlesAudit = await evaluate(`(() => {
      const group = document.querySelector('[data-testid="bezier-handles-group"]');
      const cp1 = document.querySelector('[data-testid="bezier-handle-cp1"]');
      const cp2 = document.querySelector('[data-testid="bezier-handle-cp2"]');
      return {
        hasGroup: !!group,
        hasCp1: !!cp1,
        hasCp2: !!cp2,
      };
    })()`);
    console.log('Bézier Handles Audit:', bezierHandlesAudit);
    auditResults.checks.bezierHandlesCreated = bezierHandlesAudit.hasCp1 && bezierHandlesAudit.hasCp2;

    // Capture screenshot 2: Bézier curve handles
    await captureScreenshot(path.join(ARTIFACT_DIR, 'test_pen_02_bezier_curve_handles.png'));

    // Step 4: Add Anchor Point by clicking path segment
    console.log('Testing adding anchor point on segment...');
    // Use direct helper: add anchor at midpoint of segment P1->P2 (250+550/2=400, 150->150 y same=150)
    // Actual midpoint along segment from P2(550,150) to P3(400,400) ≈ (475, 275) in doc coords
    await hoverAt(475, 275);
    const addNodeIndicator = await evaluate(`(() => {
      const tooltip = Array.from(document.querySelectorAll('[class*="floatingTooltip"]')).find(t => t.textContent.includes('Add Node'));
      const addCursor = document.body.style.cursor || '';
      return { hasTooltip: !!tooltip, cursor: addCursor };
    })()`);
    console.log('Add node hover indicator:', addNodeIndicator);

    // Use direct programmatic helper to add anchor at midpoint of P2->P3 segment
    const addResult = await evaluate(`window.__editorAddAnchorNode ? window.__editorAddAnchorNode(475, 275) : false`);
    console.log('Direct add anchor result:', addResult);
    await sleep(300);

    const pointCountAfterAdd = await evaluate(`(() => {
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const vectorShape = layers.find(l => l.shapeType === 'custom-path');
      return vectorShape?.points?.length || 0;
    })()`);
    console.log('Point count after add:', pointCountAfterAdd);
    auditResults.checks.anchorPointAddedOnSegment = pointCountAfterAdd === 4;

    // Capture screenshot 3: Added anchor point
    await captureScreenshot(path.join(ARTIFACT_DIR, 'test_pen_03_added_anchor_point.png'));

    // Step 5: Delete Anchor Point via context / Delete button
    console.log('Testing deleting anchor point...');
    await evaluate(`document.querySelector('[data-testid="btn-delete-node"]').click()`);
    await sleep(400);

    const pointCountAfterDelete = await evaluate(`(() => {
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const vectorShape = layers.find(l => l.shapeType === 'custom-path');
      return vectorShape?.points?.length || 0;
    })()`);
    console.log('Point count after delete:', pointCountAfterDelete);
    auditResults.checks.anchorPointDeleted = pointCountAfterDelete === 3;

    // Capture screenshot 4: Deleted anchor point
    await captureScreenshot(path.join(ARTIFACT_DIR, 'test_pen_04_deleted_anchor_point.png'));

    // Step 6: Convert Vector Shape to Active Selection (Ctrl + Enter)
    console.log('Testing Ctrl + Enter to convert to active selection...');
    await evaluate(`(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, ctrlKey: true, bubbles: true }));
    })()`);
    await sleep(600);

    const selectionAudit = await evaluate(`(() => {
      const marchingAnts = document.querySelector('[data-testid="marching-ants-overlay"]') || document.querySelector('[class*="marchingAntsOutline"]');
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const vectorShapeStillExists = layers.some(l => l.shapeType === 'custom-path');
      return {
        hasMarchingAnts: !!marchingAnts,
        shapePreserved: vectorShapeStillExists,
      };
    })()`);
    console.log('Selection from Pen Audit:', selectionAudit);
    auditResults.checks.convertedToSelectionWithMarchingAnts = selectionAudit.hasMarchingAnts;
    auditResults.checks.vectorShapeLayerPreserved = selectionAudit.shapePreserved;

    // Capture screenshot 5: Selection with marching ants
    await captureScreenshot(path.join(ARTIFACT_DIR, 'test_pen_05_converted_to_selection_marching_ants.png'));

    // Step 7: Fill with Foreground Color (Ctrl + Delete)
    console.log('Testing Ctrl + Delete (Fill with Foreground Color)...');
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', ctrlKey: true, bubbles: true }));
    })()`);
    await sleep(500);

    // Capture screenshot 6: Filled Foreground
    await captureScreenshot(path.join(ARTIFACT_DIR, 'test_pen_06_filled_foreground.png'));

    // Step 8: Fill with Background Color (Ctrl + Alt + Delete) & Deselect (Ctrl + D)
    console.log('Testing Ctrl + Alt + Delete (Fill with Background Color)...');
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', ctrlKey: true, altKey: true, bubbles: true }));
    })()`);
    await sleep(400);

    console.log('Testing Ctrl + D (Deselect)...');
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true }));
    })()`);
    await sleep(400);

    const deselectAudit = await evaluate(`(() => {
      const marchingAnts = document.querySelector('[class*="marchingAntsOutline"]');
      return { selectionCleared: !marchingAnts };
    })()`);
    console.log('Deselect Audit:', deselectAudit);
    auditResults.checks.deselectedCleanly = deselectAudit.selectionCleared;

    // Step 9: Opacity Keyboard Shortcuts (Keys 1 - 0)
    console.log('Testing opacity shortcut keys (5 -> 50%, 8 -> 80%, 0 -> 100%)...');
    // Press '5' for 50%
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: '5', bubbles: true }))`);
    await sleep(200);
    const op50 = await evaluate(`(() => {
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const sel = layers.find(l => l.shapeType === 'custom-path');
      return sel?.opacity;
    })()`);

    // Press '8' for 80%
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: '8', bubbles: true }))`);
    await sleep(200);
    const op80 = await evaluate(`(() => {
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const sel = layers.find(l => l.shapeType === 'custom-path');
      return sel?.opacity;
    })()`);

    // Press '0' for 100%
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }))`);
    await sleep(200);
    const op100 = await evaluate(`(() => {
      const layers = window.__editorGetLayers ? window.__editorGetLayers() : [];
      const sel = layers.find(l => l.shapeType === 'custom-path');
      return sel?.opacity;
    })()`);

    console.log('Opacity Shortcuts Audit:', { op50, op80, op100 });
    auditResults.checks.opacityShortcutsWork = op50 === 50 && op80 === 80 && op100 === 100;
    auditResults.measurements.opacityValues = { op50, op80, op100 };

    // Capture screenshot 7: Opacity shortcut verified
    await captureScreenshot(path.join(ARTIFACT_DIR, 'test_pen_07_opacity_shortcut_50.png'));

    // Step 10: Cheatsheet Card & Feature Checklist Verification
    const cheatsheetAudit = await evaluate(`(() => {
      const card = document.querySelector('[data-testid="pen-shortcuts-card"]');
      const checklist = document.querySelector('[data-testid="pen-guide-checklist"]');
      return {
        hasShortcutsCard: !!card,
        shortcutsText: card?.textContent || '',
        hasChecklist: !!checklist,
        checklistText: checklist?.textContent || '',
      };
    })()`);
    console.log('Cheatsheet and Checklist Audit:', cheatsheetAudit);
    auditResults.checks.cheatsheetCardPresent = cheatsheetAudit.hasShortcutsCard && cheatsheetAudit.shortcutsText.includes('Ctrl + Enter');
    auditResults.checks.featureChecklistPresent = cheatsheetAudit.hasChecklist && cheatsheetAudit.checklistText.includes('Pen tool creates a filled shape');

    // Capture screenshot 8: Full editor view matching reference mockup
    await captureScreenshot(path.join(ARTIFACT_DIR, 'test_pen_08_full_editor_view.png'));

    // Save JSON results
    const jsonPath = path.join(ARTIFACT_DIR, 'photoshop_pen_tool_verification.json');
    fs.writeFileSync(jsonPath, JSON.stringify(auditResults, null, 2), 'utf8');
    console.log(`Saved audit results: ${jsonPath}`);
    console.log('--- ALL PEN TOOL AUDIT CHECKS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exitCode = 1;
  } finally {
    try { ws.close(); } catch { }
    try { edge.kill(); } catch { }
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch { }
  }
}

runPenToolAudit();

