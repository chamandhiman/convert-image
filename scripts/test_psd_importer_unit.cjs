const fs = require('fs');
const { writePsdUint8Array, initializeCanvas } = require('ag-psd');

// Initialize dummy canvas for Node.js
initializeCanvas((w, h) => ({
  width: w,
  height: h,
  getContext: () => ({
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: () => {},
    drawImage: () => {},
  }),
  toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
}));

// Build comprehensive Photoshop PSD model with all requested features:
const comprehensivePsd = {
  width: 800,
  height: 600,
  children: [
    // 1. Background raster layer
    {
      name: 'Background',
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      opacity: 1,
      blendMode: 'normal',
    },
    // 2. Transparent raster layer with blend mode
    {
      name: 'Shadow Texture',
      top: 100,
      left: 100,
      bottom: 400,
      right: 500,
      opacity: 0.7,
      blendMode: 'multiply',
    },
    // 3. Layer Group containing multiple layers
    {
      name: 'Graphics Group',
      opened: true,
      children: [
        // 4. Vector / Shape layer
        {
          name: 'Hero Badge',
          top: 150,
          left: 150,
          bottom: 350,
          right: 450,
          opacity: 0.9,
          blendMode: 'screen',
          vectorStroke: {
            strokeEnabled: true,
            lineWidth: { value: 4, units: 'Pixels' },
            content: { color: { r: 255, g: 255, b: 255 } },
          },
          vectorFill: {
            color: { r: 124, g: 58, b: 237 },
          },
        },
        // 5. Layer with Mask & Effects
        {
          name: 'Glowing Card',
          top: 200,
          left: 200,
          bottom: 450,
          right: 600,
          opacity: 0.85,
          blendMode: 'overlay',
          mask: {
            top: 200,
            left: 200,
            bottom: 450,
            right: 600,
            disabled: false,
          },
          effects: {
            dropShadow: [
              {
                enabled: true,
                distance: { value: 12, units: 'Pixels' },
                size: { value: 20, units: 'Pixels' },
                color: { r: 15, g: 23, b: 42 },
                opacity: 0.6,
                angle: 120,
              },
            ],
            outerGlow: [
              {
                enabled: true,
                size: { value: 25, units: 'Pixels' },
                color: { r: 168, g: 85, b: 247 },
                opacity: 0.8,
              },
            ],
            stroke: [
              {
                enabled: true,
                size: { value: 2, units: 'Pixels' },
                color: { r: 255, g: 255, b: 255 },
                opacity: 1,
              },
            ],
            solidFill: [
              {
                enabled: true,
                color: { r: 147, g: 51, b: 234 },
                opacity: 0.5,
                blendMode: 'color dodge',
              },
            ],
          },
        },
      ],
    },
    // 6. Text layer
    {
      name: 'Project Heading',
      text: {
        text: 'Photoshop PSD Layered Import',
        transform: [1, 0, 0, 1, 80, 80],
        style: {
          font: { name: 'Poppins' },
          fontSize: 36,
          fillColor: { r: 30, g: 41, b: 59 },
        },
        paragraphStyle: {
          justification: 'left',
        },
      },
    },
    // 7. Clipping mask layer
    {
      name: 'Highlight Clip',
      top: 200,
      left: 200,
      bottom: 300,
      right: 400,
      opacity: 0.5,
      blendMode: 'color-dodge',
      clipping: true,
    },
    // 8. Smart Object / Placed Layer
    {
      name: 'Logo Smart Object',
      top: 50,
      left: 50,
      bottom: 120,
      right: 200,
      opacity: 1,
      blendMode: 'normal',
      placedLayer: {
        id: '20953ddb-9391-11ec-b4f1-c15674f50bc4',
        type: 'raster',
        width: 150,
        height: 70,
        transform: [0, 0, 150, 0, 150, 70, 0, 70],
      },
    },
    // 9. Adjustment Layer
    {
      name: 'Color Balance 1',
      opacity: 0.6,
      blendMode: 'color',
      adjustment: {
        type: 'colorBalance',
      },
    },
  ],
};

const psdBytes = writePsdUint8Array(comprehensivePsd);
console.log('Generated PSD byte length:', psdBytes.length);
fs.writeFileSync('public/test-photoshop-fixture.psd', psdBytes);
console.log('Saved public/test-photoshop-fixture.psd successfully.');
