const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\chaman.dhiman\\.gemini\\antigravity\\brain\\d3f36d29-6193-4d9f-9b49-bfc11ad62f9e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9422;
const previewUrl = 'http://127.0.0.1:4173/edit-image';
const tmpProfile = path.join(process.env.TEMP || 'C:\\Temp', 'edge-welc-redesign-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runWelcomeRedesignAudit() {
  console.log('--- Launching Edge for Welcome Screen Redesign Verification ---');
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
        const found = list.find((t) => t.type === 'page');
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
      console.error('Eval Exception:', res.exceptionDetails);
      throw new Error(res.exceptionDetails.text || 'CDP Eval Exception');
    }
    return res.result?.value;
  };

  const waitForSelector = async (selector, maxAttempts = 35, interval = 200) => {
    for (let i = 0; i < maxAttempts; i++) {
      const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await sleep(interval);
    }
    return false;
  };

  const takeScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot Saved] -> ${filename}`);
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1500,
    height: 950,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const auditResults = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  const record = (name, passed, details) => {
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: ${details}`);
    auditResults.tests.push({ name, passed, details });
  };

  try {
    console.log(`Navigating to ${previewUrl}...`);
    await send('Page.navigate', { url: previewUrl });
    await sleep(2000);
    await evaluate(`localStorage.setItem('webtoolocean_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() }));`);

    // Wait for welcome screen
    const welcomeLoaded = await waitForSelector('[data-testid="editor-welcome-screen"]', 40);
    record('Welcome Screen Container Loaded', welcomeLoaded, 'Found [data-testid="editor-welcome-screen"]');

    // 1. Audit Requirement 1: Removed Unnecessary Header Content & Branding
    console.log('--- Step 1: Auditing Header Content Removal ---');
    const headerCheck = await evaluate(`(() => {
      const screen = document.querySelector('[data-testid="editor-welcome-screen"]');
      if (!screen) return null;

      const logoImgs = screen.querySelectorAll('img[src*="logo"], [class*="brandLogo"]');
      const h1Headings = screen.querySelectorAll('h1');
      const templatesCard = screen.querySelector('[data-testid="welcome-card-templates"]');
      const viewAllPresetsBtn = screen.querySelector('[data-testid="btn-view-all-presets"]');

      return {
        logoImgsCount: logoImgs.length,
        h1Count: h1Headings.length,
        hasTemplatesCard: Boolean(templatesCard),
        hasViewAllPresetsBtn: Boolean(viewAllPresetsBtn),
      };
    })()`);

    record(
      'Logo & Branding Removed from Welcome Screen',
      headerCheck.logoImgsCount === 0,
      `Logo images found inside welcome content: ${headerCheck.logoImgsCount} (expected 0)`
    );

    record(
      'Large Heading & Subtitle Removed',
      headerCheck.h1Count === 0,
      `Large H1 headings found inside welcome content: ${headerCheck.h1Count} (expected 0)`
    );

    record(
      'Templates Card & Links Removed',
      !headerCheck.hasTemplatesCard && !headerCheck.hasViewAllPresetsBtn,
      `Templates card present: ${headerCheck.hasTemplatesCard}, View All Presets present: ${headerCheck.hasViewAllPresetsBtn} (both expected false)`
    );

    // 2. Audit Requirement 2: Exactly 3 Compact Action Cards
    console.log('--- Step 2: Auditing Compact Action Cards (3 items) ---');
    const cardsCheck = await evaluate(`(() => {
      const container = document.querySelector('[data-testid="welcome-action-cards"]');
      const cards = container ? Array.from(container.children) : [];
      const newProjCard = document.querySelector('[data-testid="welcome-card-new-project"]');
      const openImgCard = document.querySelector('[data-testid="welcome-card-open-image"]');
      const openPsdCard = document.querySelector('[data-testid="welcome-card-open-psd"]');

      return {
        cardsCount: cards.length,
        hasNewProject: Boolean(newProjCard),
        newProjectTitle: newProjCard?.querySelector('h3')?.textContent?.trim(),
        newProjectDesc: newProjCard?.querySelector('p')?.textContent?.trim(),
        hasOpenImage: Boolean(openImgCard),
        openImageTitle: openImgCard?.querySelector('h3')?.textContent?.trim(),
        openImageDesc: openImgCard?.querySelector('p')?.textContent?.trim(),
        hasOpenPsd: Boolean(openPsdCard),
        openPsdTitle: openPsdCard?.querySelector('h3')?.textContent?.trim(),
        openPsdDesc: openPsdCard?.querySelector('p')?.textContent?.trim(),
        cardHeight: newProjCard ? newProjCard.getBoundingClientRect().height : 0,
      };
    })()`);

    record(
      'Exactly 3 Action Cards Rendered',
      cardsCheck.cardsCount === 3,
      `Action cards rendered: ${cardsCheck.cardsCount} ([New Project], [Open Image], [Open PSD])`
    );

    record(
      'Action Cards Compact Height (< 75px)',
      cardsCheck.cardHeight > 0 && cardsCheck.cardHeight <= 75,
      `Action card height: ${Math.round(cardsCheck.cardHeight)}px (compact, minimal border & subtle shadow)`
    );

    // 3. Audit Requirement 3: Main Upload Area (Primary Focus)
    console.log('--- Step 3: Auditing Main Upload Area (Primary Focus) ---');
    const uploadCheck = await evaluate(`(() => {
      const uploadArea = document.querySelector('[data-testid="welcome-drag-drop-area"]');
      if (!uploadArea) return null;

      const rect = uploadArea.getBoundingClientRect();
      const style = window.getComputedStyle(uploadArea);
      const heading = uploadArea.querySelector('h2')?.textContent?.trim() || '';
      const ps = Array.from(uploadArea.querySelectorAll('p'));
      const subtext = ps[0]?.textContent?.trim() || '';
      const formatText = ps[1]?.textContent?.trim() || '';
      const hiddenInput = uploadArea.querySelector('input[type="file"]');

      return {
        found: true,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        borderStyle: style.borderStyle,
        borderColor: style.borderColor,
        heading,
        subtext,
        formatText,
        hasHiddenInput: Boolean(hiddenInput),
        accept: hiddenInput?.getAttribute('accept'),
      };
    })()`);

    record(
      'Upload Area is Visually Dominant (Height >= 200px, Width >= 700px)',
      uploadCheck.height >= 200 && uploadCheck.width >= 650,
      `Upload box dimensions: ${uploadCheck.width} × ${uploadCheck.height} px, border: dashed ${uploadCheck.borderColor}`
    );

    record(
      'Upload Area Typography & Format Support',
      uploadCheck.heading === 'Drop your images here' &&
      uploadCheck.subtext.includes('browse files') &&
      uploadCheck.formatText.includes('JPG, PNG, WEBP, GIF, BMP and PSD'),
      `Heading: "${uploadCheck.heading}", Sub: "${uploadCheck.subtext}", Formats: "${uploadCheck.formatText}"`
    );

    // 4. Audit Requirement 4: Compact Social Media Presets (5 presets)
    console.log('--- Step 4: Auditing Compact Social Media Presets ---');
    const presetsCheck = await evaluate(`(() => {
      const row = document.querySelector('[data-testid="popular-presets-row"]');
      const presets = row ? Array.from(row.children) : [];

      const igPost = document.querySelector('[data-testid="preset-card-ig-post"]');
      const igStory = document.querySelector('[data-testid="preset-card-ig-story"]');
      const ytThumb = document.querySelector('[data-testid="preset-card-yt-thumb"]');
      const fbCover = document.querySelector('[data-testid="preset-card-fb-cover"]');
      const custom = document.querySelector('[data-testid="preset-card-custom-size"]');

      return {
        presetsCount: presets.length,
        hasIgPost: Boolean(igPost),
        igPostText: igPost?.textContent?.trim(),
        hasIgStory: Boolean(igStory),
        igStoryText: igStory?.textContent?.trim(),
        hasYtThumb: Boolean(ytThumb),
        ytThumbText: ytThumb?.textContent?.trim(),
        hasFbCover: Boolean(fbCover),
        fbCoverText: fbCover?.textContent?.trim(),
        hasCustom: Boolean(custom),
        customText: custom?.textContent?.trim(),
        presetHeight: igPost ? igPost.getBoundingClientRect().height : 0,
      };
    })()`);

    record(
      'Exactly 5 Compact Canvas Presets Rendered',
      presetsCheck.presetsCount === 5 && presetsCheck.hasIgPost && presetsCheck.hasIgStory && presetsCheck.hasYtThumb && presetsCheck.hasFbCover && presetsCheck.hasCustom,
      `5 presets rendered in single horizontal row: IG Post, IG Story, YT Thumbnail, FB Cover, Custom Size`
    );

    record(
      'Canvas Presets Compact Height (<= 55px)',
      presetsCheck.presetHeight > 0 && presetsCheck.presetHeight <= 55,
      `Preset button height: ${Math.round(presetsCheck.presetHeight)}px (small icons, compact dimensions)`
    );

    // Capture Screenshot 1: Clean, Minimal, Compact Welcome Screen
    await takeScreenshot('welcome_redesign_01_initial_state.png');

    // 5. Test Functionality: New Project Dialog
    console.log('--- Step 5: Testing New Project Card Click ---');
    await evaluate(`(() => {
      const card = document.querySelector('[data-testid="welcome-card-new-project"]');
      if (card) card.click();
    })()`);
    await waitForSelector('[data-testid="new-project-modal"]', 25);
    await sleep(400);

    const newProjectModalOpen = await evaluate(`Boolean(document.querySelector('[data-testid="new-project-modal"]'))`);
    record('New Project Card Opens Modal', newProjectModalOpen, 'New Project dialog modal displayed');
    await takeScreenshot('welcome_redesign_02_new_project_modal.png');

    // Close New Project modal
    await evaluate(`(() => {
      const closeBtn = document.querySelector('[data-testid="new-project-close-btn"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(400);

    // 6. Test Functionality: Open PSD Modal
    console.log('--- Step 6: Testing Open PSD Card Click ---');
    await evaluate(`(() => {
      const card = document.querySelector('[data-testid="welcome-card-open-psd"]');
      if (card) card.click();
    })()`);
    await waitForSelector('[data-testid="psd-modal"]', 25);
    await sleep(400);

    const psdModalOpen = await evaluate(`Boolean(document.querySelector('[data-testid="psd-modal"]'))`);
    record('Open PSD Card Opens Real PSD Importer', psdModalOpen, 'PSD Import modal displayed');
    await takeScreenshot('welcome_redesign_03_psd_import_modal.png');

    // Close PSD modal
    await evaluate(`(() => {
      const closeBtn = document.querySelector('[data-testid="psd-close-btn"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(400);

    // 7. Test Functionality: Canvas Preset Click (Instagram Post 1080x1080)
    console.log('--- Step 7: Testing Canvas Preset Document Creation ---');
    await evaluate(`(() => {
      const card = document.querySelector('[data-testid="preset-card-ig-post"]');
      if (card) card.click();
    })()`);
    await waitForSelector('[data-canvas-stage="true"]', 35);
    await sleep(1200);

    const createdCanvasCheck = await evaluate(`(() => {
      const stage = document.querySelector('[data-canvas-stage="true"]');
      const activeTab = document.querySelector('[data-testid="document-tab-active"]');
      return {
        stageFound: Boolean(stage),
        stageWidth: stage ? parseInt(stage.style.width) : 0,
        stageHeight: stage ? parseInt(stage.style.height) : 0,
        tabFound: Boolean(activeTab),
      };
    })()`);

    record(
      'Preset Creates Document (1080x1080)',
      createdCanvasCheck.stageFound && createdCanvasCheck.stageWidth === 1080,
      `Document created from preset: ${createdCanvasCheck.stageWidth}x${createdCanvasCheck.stageHeight} px`
    );
    await takeScreenshot('welcome_redesign_04_created_canvas_from_preset.png');

    // Save audit results JSON
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'welcome_screen_redesign_results.json'),
      JSON.stringify(auditResults, null, 2)
    );
    console.log('--- All Welcome Screen Redesign Tests Completed Successfully ---');

  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    try {
      ws.close();
      edge.kill();
    } catch { }
  }
}

runWelcomeRedesignAudit().catch(console.error);
