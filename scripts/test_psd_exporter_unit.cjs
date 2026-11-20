/**
 * Unit Test for PSD Exporter logic using ag-psd
 */
const { writePsdUint8Array, readPsd } = require('ag-psd');

console.log('[Test] Running PSD Exporter Unit Verification...');

// 1. Build a synthetic document with 6 different layer types:
// - Background/Raster image layer
// - Text layer with styles
// - Shape layer with stroke/fill
// - Layer with Drop Shadow & Stroke effects
// - Group folder with child layer
// - Hidden layer with blendMode and custom opacity
const testPsd = {
  width: 800,
  height: 600,
  children: [
    {
      name: 'Background Photo',
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      opacity: 1,
      blendMode: 'normal',
    },
    {
      name: 'Geometric Shape',
      left: 50,
      top: 50,
      right: 250,
      bottom: 150,
      opacity: 0.9,
      blendMode: 'multiply',
      vectorFill: { type: 'color', color: { r: 124, g: 58, b: 237 } },
      effects: {
        stroke: [
          {
            enabled: true,
            size: { units: 'Pixels', value: 4 },
            color: { r: 0, g: 0, b: 0 },
            opacity: 1,
          },
        ],
      },
    },
    {
      name: 'Editable Title',
      left: 100,
      top: 200,
      right: 500,
      bottom: 260,
      opacity: 1,
      blendMode: 'normal',
      text: {
        text: 'Photoshop PSD Export',
        style: {
          fontSize: 36,
          font: { name: 'Poppins' },
          fillColor: { r: 30, g: 41, b: 59 },
        },
        paragraphStyle: {
          justification: 'left',
        },
      },
      effects: {
        dropShadow: [
          {
            enabled: true,
            distance: { units: 'Pixels', value: 8 },
            size: { units: 'Pixels', value: 12 },
            color: { r: 0, g: 0, b: 0 },
            opacity: 0.6,
            angle: 120,
          },
        ],
      },
    },
    {
      name: 'Hidden Overlay',
      left: 200,
      top: 300,
      right: 400,
      bottom: 450,
      opacity: 0.5,
      blendMode: 'screen',
      hidden: true,
    },
    {
      name: 'Design Elements',
      opened: true,
      children: [
        {
          name: 'Badge Icon',
          left: 50,
          top: 350,
          right: 150,
          bottom: 450,
          opacity: 0.85,
          blendMode: 'overlay',
        },
      ],
    },
  ],
};

const bytes = writePsdUint8Array(testPsd, { noBackground: true, generateThumbnail: false });
console.log('[Test] Successfully generated PSD binary size:', bytes.byteLength, 'bytes');

// Check magic header ('8BPS')
const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
if (sig !== '8BPS') {
  throw new Error(`Invalid signature: ${sig}`);
}
console.log('[Test] Magic signature verified: 8BPS');

// Read back and inspect
const readBack = readPsd(bytes, { skipLayerImageData: true, skipCompositeImageData: true });
console.log('[Test] Document dimensions:', readBack.width, 'x', readBack.height);
console.log('[Test] Root children count:', readBack.children.length);

// Verify layers
const names = readBack.children.map((c) => c.name);
console.log('[Test] Layer names:', names);
if (!names.includes('Background Photo')) throw new Error('Missing Background Photo');
if (!names.includes('Geometric Shape')) throw new Error('Missing Geometric Shape');
if (!names.includes('Editable Title')) throw new Error('Missing Editable Title');
if (!names.includes('Hidden Overlay')) throw new Error('Missing Hidden Overlay');
if (!names.includes('Design Elements')) throw new Error('Missing Design Elements');

const titleLayer = readBack.children.find((c) => c.name === 'Editable Title');
console.log('[Test] Text metadata on Editable Title:', titleLayer.text?.text);
if (titleLayer.text?.text !== 'Photoshop PSD Export') throw new Error('Text mismatch');
if (titleLayer.text?.style?.fontSize !== 36) throw new Error('Font size mismatch');
if (!titleLayer.effects?.dropShadow) throw new Error('Missing Drop Shadow effect on Title');

const hiddenLayer = readBack.children.find((c) => c.name === 'Hidden Overlay');
console.log('[Test] Hidden layer hidden flag:', hiddenLayer.hidden, 'blendMode:', hiddenLayer.blendMode);
if (!hiddenLayer.hidden) throw new Error('Hidden flag not preserved');
if (hiddenLayer.blendMode !== 'screen') throw new Error('BlendMode not preserved');

const groupLayer = readBack.children.find((c) => c.name === 'Design Elements');
console.log('[Test] Group folder children:', groupLayer.children?.map((c) => c.name));
if (!groupLayer.children || groupLayer.children.length !== 1 || groupLayer.children[0].name !== 'Badge Icon') {
  throw new Error('Group hierarchy not preserved');
}

console.log('[Test] All unit test assertions PASSED (100%)!');
