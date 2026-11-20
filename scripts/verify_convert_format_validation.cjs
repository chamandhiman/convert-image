const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9317;
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-convert-val-' + Date.now());

let edge = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[Test] Launching Edge on port ${port}...`);
  edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    `--user-data-dir=${tmpProfile}`,
    'http://localhost:4173/convert-image',
  ]);

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
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error('Eval failed: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  };

  const captureScreenshot = async (filepath) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filepath, buffer);
    console.log(`[Screenshot] Saved ${path.basename(filepath)}`);
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Wait for React to render
  console.log('[CDP] Waiting for React application to mount...');
  for (let i = 0; i < 40; i++) {
    const isRendered = await evaluate(`!!document.querySelector('h1')`);
    if (isRendered) {
      console.log(`[CDP] React rendered after ${i * 250}ms`);
      break;
    }
    await sleep(250);
  }

  const testReport = {
    testDate: new Date().toISOString(),
    tests: [],
  };

  const record = (name, passed, details = {}) => {
    testReport.tests.push({ name, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}:`, details);
  };

  // Test 1: Initial JPG Selected State
  console.log('\n--- 1. Testing Default JPG State ---');
  const initialData = await evaluate(`(() => {
    const header = document.querySelector('h1')?.textContent;
    const supportRow = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Supports:'))?.textContent;
    const input = document.querySelector('input[type="file"]');
    const convertBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convert Images'));
    return {
      header,
      supportRow,
      accept: input?.getAttribute('accept'),
      convertDisabled: convertBtn?.disabled
    };
  })()`);

  record('Default JPG Helper Text', initialData.supportRow?.includes('Supports: PNG, WEBP, GIF, BMP, TIFF, HEIC'), {
    actual: initialData.supportRow,
  });
  record('Default JPG Accept Excludes JPG', !initialData.accept?.includes('.jpg') && !initialData.accept?.includes('image/jpeg'), {
    actualAccept: initialData.accept,
  });
  record('Convert Button Disabled When Empty', initialData.convertDisabled === true);

  // Test 2: Switch to PNG Output
  console.log('\n--- 2. Testing PNG Output Selection ---');
  await evaluate(`(() => {
    const pngBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Convert to PNG' || (b.textContent.includes('PNG') && b.closest('[class*="rightCard"], div')));
    if (pngBtn) pngBtn.click();
  })()`);
  await sleep(400);

  const pngState = await evaluate(`(() => {
    const supportRow = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Supports:'))?.textContent;
    const input = document.querySelector('input[type="file"]');
    return {
      supportRow,
      accept: input?.getAttribute('accept')
    };
  })()`);

  record('PNG Helper Text', pngState.supportRow?.includes('Supports: JPG, JPEG, WEBP, GIF, BMP, TIFF, HEIC'), {
    actual: pngState.supportRow,
  });
  record('PNG Accept Excludes PNG', !pngState.accept?.includes('.png') && !pngState.accept?.includes('image/png'), {
    actualAccept: pngState.accept,
  });

  // Test 3: Upload Incompatible PNG file when PNG output is selected
  console.log('\n--- 3. Testing Upload of Incompatible PNG to PNG Output ---');
  await evaluate(`(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(0, 0, 100, 100);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const file = new File([blob], 'photo_sample.png', { type: 'image/png' });

    const input = document.querySelector('input[type="file"]');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(1000);

  const incompatibleState = await evaluate(`(() => {
    const errorAlert = document.querySelector('[role="alert"]')?.textContent;
    const removeBtn = document.querySelector('button[title="Remove image"]');
    const cardEl = removeBtn?.closest('div[class*="fileCard"], div');
    const cardText = cardEl?.innerText;
    const convertBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convert Images'));
    return {
      errorAlert,
      cardText,
      convertDisabled: convertBtn?.disabled
    };
  })()`);

  record('Incompatible PNG shows Skipped Status', incompatibleState.cardText?.includes('Skipped: Already PNG'), {
    actualCardText: incompatibleState.cardText,
  });
  record('Inline Error Banner specifies PNG selected format', incompatibleState.errorAlert?.includes('PNG is already the selected format'), {
    actualAlert: incompatibleState.errorAlert,
  });
  record('Convert Button Disabled when 0 valid files', incompatibleState.convertDisabled === true);

  await captureScreenshot(path.join(outDir, 'convert_test_png_incompatible.png'));

  // Test 4: Upload Compatible JPG alongside PNG (mixed files)
  console.log('\n--- 4. Testing Mixed Batch (JPG + PNG) with PNG Output ---');
  await evaluate(`(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, 120, 90);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg'));
    const file = new File([blob], 'vacation_pic.jpg', { type: 'image/jpeg' });

    const input = document.querySelector('input[type="file"]');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(1000);

  const mixedState = await evaluate(`(() => {
    const removeBtns = Array.from(document.querySelectorAll('button[title="Remove image"]'));
    const cards = removeBtns.map(btn => {
      const card = btn.parentElement;
      return card?.innerText || '';
    });
    const convertBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convert Images'));
    const errorAlert = document.querySelector('[role="alert"]')?.textContent;
    return {
      cards,
      convertDisabled: convertBtn?.disabled,
      errorAlert
    };
  })()`);

  const pngCard = mixedState.cards.find(c => c.includes('photo_sample.png'));
  const jpgCard = mixedState.cards.find(c => c.includes('vacation_pic.jpg'));

  record('Mixed Batch: PNG remains Skipped', pngCard?.includes('Skipped: Already PNG'), { pngCard });
  record('Mixed Batch: JPG is Ready', jpgCard?.includes('Ready'), { jpgCard });
  record('Mixed Batch: Convert Button Enabled', mixedState.convertDisabled === false);

  await captureScreenshot(path.join(outDir, 'convert_test_mixed_batch.png'));

  // Test 5: Switch output format to JPG -> Dynamic Revalidation!
  console.log('\n--- 5. Testing Dynamic Revalidation: Switch Output to JPG ---');
  await evaluate(`(() => {
    const jpgBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Convert to JPG' || (b.textContent.includes('JPG') && b.closest('[class*="rightCard"], div')));
    if (jpgBtn) jpgBtn.click();
  })()`);
  await sleep(600);

  const revalidatedJpgState = await evaluate(`(() => {
    const removeBtns = Array.from(document.querySelectorAll('button[title="Remove image"]'));
    const cards = removeBtns.map(btn => btn.parentElement?.innerText || '');
    const convertBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convert Images'));
    return {
      cards,
      convertDisabled: convertBtn?.disabled
    };
  })()`);

  const pngCardAfterJpg = revalidatedJpgState.cards.find(c => c.includes('photo_sample.png'));
  const jpgCardAfterJpg = revalidatedJpgState.cards.find(c => c.includes('vacation_pic.jpg'));

  record('Revalidation on JPG: PNG becomes Ready', pngCardAfterJpg?.includes('Ready'), { pngCardAfterJpg });
  record('Revalidation on JPG: JPG becomes Skipped', jpgCardAfterJpg?.includes('Skipped: Already JPG'), { jpgCardAfterJpg });
  record('Revalidation on JPG: Convert Button Remains Enabled', revalidatedJpgState.convertDisabled === false);

  await captureScreenshot(path.join(outDir, 'convert_test_revalidated_jpg.png'));

  // Test 6: Switch output format to WEBP -> Both become Ready!
  console.log('\n--- 6. Testing Switch to WEBP Output ---');
  await evaluate(`(() => {
    const webpBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Convert to WEBP' || (b.textContent.includes('WEBP') && b.closest('[class*="rightCard"], div')));
    if (webpBtn) webpBtn.click();
  })()`);
  await sleep(600);

  const webpState = await evaluate(`(() => {
    const removeBtns = Array.from(document.querySelectorAll('button[title="Remove image"]'));
    const cards = removeBtns.map(btn => btn.parentElement?.innerText || '');
    const errorAlert = document.querySelector('[role="alert"]');
    const convertBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convert Images'));
    return {
      cards,
      hasError: !!errorAlert,
      convertDisabled: convertBtn?.disabled
    };
  })()`);

  record('On WEBP: Both PNG and JPG are Ready', webpState.cards.every(c => c.includes('Ready')), {
    cards: webpState.cards,
  });
  record('On WEBP: Error Alert Cleared', webpState.hasError === false);
  record('On WEBP: Convert Button Enabled', webpState.convertDisabled === false);

  await captureScreenshot(path.join(outDir, 'convert_test_webp_all_ready.png'));

  // Test 7: Remove item with X button
  console.log('\n--- 7. Testing Remove Item Button ---');
  await evaluate(`(() => {
    const removeBtn = document.querySelector('button[title="Remove image"]');
    if (removeBtn) removeBtn.click();
  })()`);
  await sleep(400);

  const countAfterRemove = await evaluate(`document.querySelectorAll('button[title="Remove image"]').length`);
  record('Remove item decreases card count to 1', countAfterRemove === 1);

  // Test 8: Convert Image Execution
  console.log('\n--- 8. Testing Actual Conversion Execution ---');
  await evaluate(`(() => {
    const convertBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convert Images'));
    if (convertBtn) convertBtn.click();
  })()`);

  // Wait for conversion to complete and results page to appear
  let resultsLoaded = false;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    const hasResults = await evaluate(`!!document.querySelector('table')`);
    if (hasResults) {
      resultsLoaded = true;
      break;
    }
  }

  record('Conversion Completed and Rendered Results Table', resultsLoaded === true);

  const resultsData = await evaluate(`(() => {
    const h2 = document.querySelector('h2')?.textContent;
    const body = document.body.innerText;
    const downloadZipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Download All') || b.textContent.includes('Download Selected'));
    return {
      h2,
      hasConverted: body.includes('Converted'),
      hasWebp: body.includes('WEBP') || body.includes('WebP'),
      downloadZipDisabled: downloadZipBtn?.disabled
    };
  })()`);

  record('Results Banner displays Conversion Complete', resultsData.h2?.includes('Conversion Complete') || resultsData.hasConverted, { resultsData });
  record('Results row displays Converted status', resultsData.hasConverted === true);
  record('Target format is WEBP', resultsData.hasWebp === true);
  record('Download button is enabled', resultsData.downloadZipDisabled === false);

  await captureScreenshot(path.join(outDir, 'convert_test_results_complete.png'));

  fs.writeFileSync(
    path.join(outDir, 'convert_validation_verification_report.json'),
    JSON.stringify(testReport, null, 2)
  );
  console.log(`\n[Report] Saved convert_validation_verification_report.json`);

  const allPassed = testReport.tests.every((t) => t.passed);
  console.log(`\nSummary: ${testReport.tests.filter((t) => t.passed).length}/${testReport.tests.length} tests passed.`);
  if (!allPassed) {
    console.error('Some tests failed!');
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during test:', e);
    process.exitCode = 1;
  })
  .finally(() => {
    if (edge) {
      try {
        edge.kill();
      } catch {}
    }
  });
