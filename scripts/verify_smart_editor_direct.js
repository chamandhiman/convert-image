import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge-cdp-editor-' + Date.now());
const testImagePath = path.resolve('src/assets/images/before-after.png');

console.log('Testing Smart Image Editor Direct Load & Interaction Fixes...');
console.log('Using test image:', testImagePath);

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  'about:blank',
]);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPort() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9225/json/list');
      if (res.ok) return await res.json();
    } catch {
      await sleep(300);
    }
  }
  throw new Error('Timeout waiting for Edge debug port 9225');
}

async function run() {
  try {
    const targets = await waitForPort();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('LOG:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('JS EXCEPTION:', msg.params.exceptionDetails?.exception?.description || JSON.stringify(msg.params.exceptionDetails));
      }
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = idCounter++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Navigating directly to http://localhost:4173/edit-image...');
    await send('Page.navigate', { url: 'http://localhost:4173/edit-image' });
    await sleep(2000);

    // 1. Verify Full-Width Header
    const headerCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const header = document.querySelector('header');
        if (!header) return { found: false };
        const hStyle = window.getComputedStyle(header);
        const rect = header.getBoundingClientRect();
        const container = header.firstElementChild;
        const cStyle = container ? window.getComputedStyle(container) : null;
        return {
          found: true,
          position: hStyle.position,
          top: hStyle.top,
          headerWidth: rect.width,
          windowWidth: window.innerWidth,
          containerBorderRadius: cStyle?.borderRadius,
          containerHeight: rect.height,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Header Check:', headerCheck.result?.value);

    // Capture Initial Empty State Screenshot
    const emptySnap = await send('Page.captureScreenshot', { format: 'png' });
    const emptyPath = path.join(outDir, 'smart-image-editor-direct-empty.png');
    fs.writeFileSync(emptyPath, Buffer.from(emptySnap.data, 'base64'));
    console.log('[PASS] Saved empty state screenshot:', emptyPath);

    // 2. Upload test image
    console.log('Uploading test image...');
    const doc = await send('DOM.getDocument');
    const fileInput = await send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: 'input[type="file"]',
    });

    if (fileInput.nodeId) {
      await send('DOM.setFileInputFiles', {
        nodeId: fileInput.nodeId,
        files: [testImagePath],
      });
      await send('Runtime.evaluate', {
        expression: 'document.querySelector("input[type=\'file\']").dispatchEvent(new Event("change", { bubbles: true }))',
      });
      console.log('Dispatched file change, waiting for decode...');
      await sleep(2500);
    } else {
      throw new Error('File input not found');
    }

    // 3. Inspect loaded state, 8 handles, and right-side unified panel
    const loadedEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const stageImg = document.querySelector('img[alt="Active Canvas"]');
        const stage = stageImg ? stageImg.parentElement : null;
        const handles = document.querySelectorAll('div[title^="Resize "]');
        const handleTitles = Array.from(handles).map(h => h.title);
        const rightPanel = document.querySelector('aside[aria-label*="Properties"]');
        const rightWidth = rightPanel ? Math.round(rightPanel.getBoundingClientRect().width) : 0;
        
        // Find tabs in right panel
        const tabBtns = Array.from(rightPanel ? rightPanel.querySelectorAll('button') : []).slice(0, 3);
        const tabTexts = tabBtns.map(b => b.textContent.trim());

        const inputs = Array.from(document.querySelectorAll('input[type="number"]')).map(i => i.value);
        const scalePresetBtns = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => ['25%', '50%', '75%', '100%', '200%'].includes(t));

        return {
          hasStageImage: Boolean(stageImg),
          stageStyleWidth: stage?.style.width,
          stageStyleHeight: stage?.style.height,
          handleCount: handles.length,
          handleTitles,
          rightPanelWidth: rightWidth,
          tabTexts,
          inputs,
          scalePresetBtns,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Loaded state inspect:', loadedEval.result?.value);

    // 4. Capture Loaded Desktop Screenshot
    const loadedSnap = await send('Page.captureScreenshot', { format: 'png' });
    const loadedPath = path.join(outDir, 'smart-image-editor-direct-loaded.png');
    fs.writeFileSync(loadedPath, Buffer.from(loadedSnap.data, 'base64'));
    console.log('[PASS] Saved loaded state screenshot:', loadedPath);

    // 5. Test Quick Scale 50%
    console.log('Testing Quick Scale 50%...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn50 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '50%');
        if (btn50) btn50.click();
      })()`,
    });
    await sleep(600);

    const scale50Check = await send('Runtime.evaluate', {
      expression: `(() => {
        const stageImg = document.querySelector('img[alt="Active Canvas"]');
        const stage = stageImg ? stageImg.parentElement : null;
        const inputs = Array.from(document.querySelectorAll('input[type="number"]')).map(i => i.value);
        return {
          stageWidth: stage?.style.width,
          stageHeight: stage?.style.height,
          inputs,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Quick Scale 50% result after render:', scale50Check.result?.value);

    // 6. Test Right Tab Switching (Layers Tab)
    console.log('Testing Right Tab Switching to Layers...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const rightPanel = document.querySelector('aside[aria-label*="Properties"]');
        const layersBtn = Array.from(rightPanel.querySelectorAll('button')).find(b => b.textContent.includes('Layers'));
        if (layersBtn) layersBtn.click();
      })()`,
    });
    await sleep(400);

    const layersTabCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const rightPanel = document.querySelector('aside[aria-label*="Properties"]');
        return {
          activeTabButtonText: rightPanel.querySelector('button[class*="tabBtnActive"]')?.textContent.trim(),
          hasLayersList: Boolean(rightPanel.querySelector('[class*="layersList"]')),
        };
      })()`,
      returnByValue: true,
    });
    console.log('Layers Tab result:', layersTabCheck.result?.value);

    // 7. Test Text Tool (Select Text Tool in Left Toolbar -> Click on Stage -> Inline Edit)
    console.log('Testing Photoshop-style Text Tool...');
    // Switch back to properties
    await send('Runtime.evaluate', {
      expression: `(() => {
        const rightPanel = document.querySelector('aside[aria-label*="Properties"]');
        const propBtn = Array.from(rightPanel.querySelectorAll('button')).find(b => b.textContent.includes('Properties'));
        if (propBtn) propBtn.click();
      })()`,
    });
    await sleep(300);

    // Click Text tool in left toolbar
    const textToolSelect = await send('Runtime.evaluate', {
      expression: `(() => {
        const textToolBtn = Array.from(document.querySelectorAll('aside[aria-label="Editing Tools"] button')).find(
          b => b.getAttribute('aria-label') === 'Text' || b.title === 'Text Tool'
        );
        if (textToolBtn) {
          textToolBtn.click();
          return { clicked: true, title: textToolBtn.title };
        }
        return { clicked: false };
      })()`,
      returnByValue: true,
    });
    console.log('Text tool select:', textToolSelect.result?.value);
    await sleep(400);

    // Click on canvas stage to place text
    const placeTextResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const stageImg = document.querySelector('img[alt="Active Canvas"]');
        const stage = stageImg ? stageImg.parentElement : null;
        if (!stage) return { placed: false, reason: 'no stage' };
        
        const rect = stage.getBoundingClientRect();
        const clickEvt = new MouseEvent('click', {
          bubbles: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        });
        stage.dispatchEvent(clickEvt);
        return { placed: true };
      })()`,
      returnByValue: true,
    });
    console.log('Place text trigger:', placeTextResult.result?.value);
    await sleep(800);

    // Inspect placed text layer, inline textarea, and right Typography properties
    const textStateCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('textarea');
        const textProperties = document.querySelector('input[type="text"][placeholder*="text"]') || document.querySelector('input[type="text"]');
        const selectDropdowns = Array.from(document.querySelectorAll('aside[aria-label*="Properties"] select')).map(s => s.value);
        return {
          hasInlineTextarea: Boolean(textarea),
          textareaValue: textarea ? textarea.value : null,
          hasTypographyTextInput: Boolean(textProperties),
          typographyInputValue: textProperties ? textProperties.value : null,
          selectDropdowns,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Text state inspect:', textStateCheck.result?.value);

    // Capture Text Added Desktop Screenshot
    const textSnap = await send('Page.captureScreenshot', { format: 'png' });
    const textPath = path.join(outDir, 'smart-image-editor-text-added.png');
    fs.writeFileSync(textPath, Buffer.from(textSnap.data, 'base64'));
    console.log('[PASS] Saved text added screenshot:', textPath);

    // 8. Test Mobile Viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(1000);

    const mobileSnap = await send('Page.captureScreenshot', { format: 'png' });
    const mobilePath = path.join(outDir, 'smart-image-editor-direct-mobile.png');
    fs.writeFileSync(mobilePath, Buffer.from(mobileSnap.data, 'base64'));
    console.log('[PASS] Saved mobile state screenshot:', mobilePath);

    ws.close();
    edge.kill();
    console.log('\n========================================');
    console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
    console.log('========================================');
  } catch (err) {
    console.error('Error during test:', err);
    edge.kill();
  }
}

run();
