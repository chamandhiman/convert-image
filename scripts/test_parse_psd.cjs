const fs = require('fs');
const { readPsd, initializeCanvas } = require('ag-psd');

// Initialize dummy canvas for Node.js test environment
initializeCanvas((w, h) => ({
  width: w,
  height: h,
  getContext: () => ({
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: () => { },
    drawImage: () => { },
  }),
  toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
}));

const buf = fs.readFileSync('public/test-photoshop-fixture.psd');
console.log('Loaded PSD buffer length:', buf.length);

const psd = readPsd(buf, { skipThumbnail: true });
console.log('Dimensions:', psd.width, 'x', psd.height);
console.log('Top-level children count:', psd.children.length);
psd.children.forEach((c, idx) => {
  console.log(`Layer ${idx + 1}: "${c.name}"`, {
    type: c.text ? 'text' : c.vectorStroke || c.vectorFill ? 'shape' : c.children ? 'group' : 'image',
    blendMode: c.blendMode,
    opacity: c.opacity,
    clipping: c.clipping,
    hasMask: Boolean(c.mask),
    hasEffects: Boolean(c.effects),
    hasSmartObject: Boolean(c.placedLayer),
    hasAdjustment: Boolean(c.adjustment),
    childrenCount: c.children ? c.children.length : undefined
  });
});

