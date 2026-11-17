import fs from 'fs';
import path from 'path';

// 1. CompressPage.module.css
{
  const filePath = 'src/pages/CompressPage/CompressPage.module.css';
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /\.converterSurface\s*\{[\s\S]*?\.converterSurface:hover\s*\{[\s\S]*?\}/,
    `.converterSurface {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  padding: 0;
  margin: 0;
}`
  );
  content = content.replace(
    /\.uploadSurface\s*\{[\s\S]*?padding:\s*var\(--space-8\);[\s\S]*?\}/,
    `.uploadSurface {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0;
  width: 100%;
}`
  );
  content = content.replace(
    /\.workspaceSurface\s*\{[\s\S]*?padding:\s*var\(--space-6\);[\s\S]*?\}/,
    `.workspaceSurface {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0;
  width: 100%;
}`
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', filePath);
}

// 2. RemoveBackgroundPage.jsx & RemoveBackgroundPage.module.css
{
  const jsxPath = 'src/pages/RemoveBackgroundPage/RemoveBackgroundPage.jsx';
  let jsx = fs.readFileSync(jsxPath, 'utf8');
  jsx = jsx.replace('showHero={false}', 'showHero={true}');
  // Remove uploadHeader
  jsx = jsx.replace(
    /<div className=\{styles\.uploadHeader\}>[\s\S]*?<\/div>\s*<\/div>/,
    ''
  );
  // Also check if uploadHeader had no inner div
  jsx = jsx.replace(
    /<div className=\{styles\.uploadHeader\}>[\s\S]*?<\/div>/,
    ''
  );
  fs.writeFileSync(jsxPath, jsx, 'utf8');
  console.log('Updated', jsxPath);

  const cssPath = 'src/pages/RemoveBackgroundPage/RemoveBackgroundPage.module.css';
  let css = fs.readFileSync(cssPath, 'utf8');
  css = css.replace(
    /\.converterSurface\s*\{[\s\S]*?\.converterSurface:hover\s*\{[\s\S]*?\}/,
    `.converterSurface {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  padding: 0;
  margin: 0;
}`
  );
  css = css.replace(
    /\.uploadSurface\s*\{[\s\S]*?padding:\s*var\(--space-8\);[\s\S]*?\}/,
    `.uploadSurface {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0;
  width: 100%;
}`
  );
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated', cssPath);
}

// 3. PhotoRestorerPage.jsx & PhotoRestorerPage.module.css
{
  const jsxPath = 'src/pages/PhotoRestorerPage/PhotoRestorerPage.jsx';
  let jsx = fs.readFileSync(jsxPath, 'utf8');
  jsx = jsx.replace('showHero={false}', 'showHero={true}');
  jsx = jsx.replace('title="AI Photo Restorer"', 'title="Photo Restorer"');
  jsx = jsx.replace(
    /<div className=\{styles\.uploadHeader\}>[\s\S]*?<\/div>/,
    ''
  );
  fs.writeFileSync(jsxPath, jsx, 'utf8');
  console.log('Updated', jsxPath);

  const cssPath = 'src/pages/PhotoRestorerPage/PhotoRestorerPage.module.css';
  let css = fs.readFileSync(cssPath, 'utf8');
  css = css.replace(
    /\.converterSurface\s*\{[\s\S]*?\}/,
    `.converterSurface {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  padding: 0;
  margin: 0;
}`
  );
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated', cssPath);
}

// 4. ImageUpscalerPage.jsx & ImageUpscalerPage.module.css
{
  const jsxPath = 'src/pages/ImageUpscalerPage/ImageUpscalerPage.jsx';
  let jsx = fs.readFileSync(jsxPath, 'utf8');
  jsx = jsx.replace('showHero={false}', 'showHero={true}');
  jsx = jsx.replace('title="AI Image Upscaler"', 'title="Image Upscaler"');
  jsx = jsx.replace(
    /<div className=\{styles\.uploadHeader\}>[\s\S]*?<\/div>/,
    ''
  );
  fs.writeFileSync(jsxPath, jsx, 'utf8');
  console.log('Updated', jsxPath);

  const cssPath = 'src/pages/ImageUpscalerPage/ImageUpscalerPage.module.css';
  let css = fs.readFileSync(cssPath, 'utf8');
  css = css.replace(
    /\.converterSurface\s*\{[\s\S]*?\}/,
    `.converterSurface {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  padding: 0;
  margin: 0;
}`
  );
  css = css.replace(
    /\.idleWrap\s*\{[\s\S]*?\}/,
    `.idleWrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0;
  width: 100%;
}`
  );
  // Update scaleSelectorBar to be a clean white card
  css = css.replace(
    /\.scaleSelectorBar\s*\{[\s\S]*?text-align:\s*center;\s*\}/,
    `.scaleSelectorBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0.875rem 1.25rem;
  border-radius: 18px;
  background-color: #ffffff;
  border: 1px solid #ebe8f3;
  box-shadow: 0 4px 20px -2px rgba(124, 58, 237, 0.05);
  margin-bottom: 0.75rem;
  box-sizing: border-box;
}`
  );
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated', cssPath);
}

// 5. CropPage.jsx & CropPage.module.css
{
  const jsxPath = 'src/pages/CropPage/CropPage.jsx';
  let jsx = fs.readFileSync(jsxPath, 'utf8');
  jsx = jsx.replace('showHero={false}', 'showHero={true}');
  jsx = jsx.replace(
    /<div className=\{styles\.uploadHeader\}>[\s\S]*?<\/div>/,
    ''
  );
  fs.writeFileSync(jsxPath, jsx, 'utf8');
  console.log('Updated', jsxPath);

  const cssPath = 'src/pages/CropPage/CropPage.module.css';
  let css = fs.readFileSync(cssPath, 'utf8');
  css = css.replace(
    /\.converterSurface\s*\{[\s\S]*?flex-direction:\s*column;\s*\}/,
    `.converterSurface {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}`
  );
  css = css.replace(
    /\.uploadSurface\s*\{[\s\S]*?gap:\s*var\(--space-6\);\s*\}/,
    `.uploadSurface {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}`
  );
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated', cssPath);
}

// 6. RotatePage.jsx & RotatePage.module.css
{
  const jsxPath = 'src/pages/RotatePage/RotatePage.jsx';
  let jsx = fs.readFileSync(jsxPath, 'utf8');
  jsx = jsx.replace('showHero={false}', 'showHero={true}');
  jsx = jsx.replace(
    /<div className=\{styles\.uploadHeader\}>[\s\S]*?<\/div>/,
    ''
  );
  fs.writeFileSync(jsxPath, jsx, 'utf8');
  console.log('Updated', jsxPath);

  const cssPath = 'src/pages/RotatePage/RotatePage.module.css';
  let css = fs.readFileSync(cssPath, 'utf8');
  css = css.replace(
    /\.converterSurface\s*\{[\s\S]*?flex-direction:\s*column;\s*\}/,
    `.converterSurface {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}`
  );
  css = css.replace(
    /\.uploadSurface\s*\{[\s\S]*?gap:\s*var\(--space-6\);\s*\}/,
    `.uploadSurface {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}`
  );
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated', cssPath);
}

// 7. ResizePage.jsx & ResizePage.module.css
{
  const jsxPath = 'src/pages/ResizePage/ResizePage.jsx';
  let jsx = fs.readFileSync(jsxPath, 'utf8');
  jsx = jsx.replace('showHero={false}', 'showHero={true}');
  // Inside uploadBox, remove uploadTitle & uploadSubtitle
  jsx = jsx.replace(
    /<h2 className=\{styles\.uploadTitle\}>[\s\S]*?<\/h2>\s*<p className=\{styles\.uploadSubtitle\}>[\s\S]*?<\/p>/,
    `<p className={styles.uploadPrompt}>Drag and drop an image here, or browse from your device</p>`
  );
  fs.writeFileSync(jsxPath, jsx, 'utf8');
  console.log('Updated', jsxPath);

  const cssPath = 'src/pages/ResizePage/ResizePage.module.css';
  let css = fs.readFileSync(cssPath, 'utf8');
  css += `\n.uploadPrompt { font-size: 1.05rem; font-weight: 600; color: #1e293b; margin: 0; }\n`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated', cssPath);
}

// 8. ConvertWorkspace.module.css
{
  const cssPath = 'src/pages/ConvertPage/ConvertWorkspace.module.css';
  let css = fs.readFileSync(cssPath, 'utf8');
  css = css.replace(
    /\.workspaceWrapper\s*\{[\s\S]*?padding:\s*0\s+1rem\s+2\.5rem\s+1rem;\s*\}/,
    `.workspaceWrapper {
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 0 2.5rem 0;
}`
  );
  css = css.replace(
    /\.pageHeader\s*\{[\s\S]*?margin-bottom:\s*2rem;\s*\}/,
    `.pageHeader {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.45rem;
  margin-bottom: clamp(1.5rem, 3vw, 2.25rem);
}`
  );
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated', cssPath);
}

// 9. Other tool modules: ObjectRemover, Optimize, Clean, Analyze
{
  const otherFiles = [
    'src/pages/ObjectRemoverPage/ObjectRemoverPage.module.css',
    'src/pages/OptimizePage/OptimizePage.module.css',
    'src/pages/CleanPage/CleanPage.module.css',
    'src/pages/AnalyzePage/AnalyzePage.module.css'
  ];
  for (const f of otherFiles) {
    if (fs.existsSync(f)) {
      let content = fs.readFileSync(f, 'utf8');
      content = content.replace(
        /\.converterSurface\s*\{[\s\S]*?\}/,
        `.converterSurface {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  padding: 0;
  margin: 0;
}`
      );
      content = content.replace(
        /\.converterSurface:hover\s*\{[\s\S]*?\}/,
        ''
      );
      content = content.replace(
        /\.uploadSurface\s*\{[\s\S]*?padding:\s*var\(--space-8\);[\s\S]*?\}/,
        `.uploadSurface {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0;
  width: 100%;
}`
      );
      fs.writeFileSync(f, content, 'utf8');
      console.log('Updated', f);
    }
  }
}

