/**
 * Adobe Photoshop PSD Exporter for Image Convert Editor
 * Powered by ag-psd
 *
 * Exports active document state as a genuine, layered, editable Adobe Photoshop (.psd) project:
 * - Independent image, text, shape, and blank layers
 * - Preserves layer names, dimensions, coordinates (left, top, right, bottom)
 * - Preserves layer opacity, visibility (hidden), and Photoshop blend modes
 * - Preserves layer clipping masks and layer masks
 * - Preserves editable text layer metadata (font family, font size, color, justification)
 * - Preserves vector shape fills and strokes
 * - Preserves layer effects (Drop Shadow, Stroke, Solid Fill / Color Overlay, Outer Glow, Gradient Overlay)
 * - Generates valid raster bitmap channels for maximum Photoshop & viewer compatibility
 * - Preserves full document dimensions, background, and clean composite preview
 */

import { writePsdUint8Array, initializeCanvas } from 'ag-psd';

// Initialize DOM canvas creation in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    initializeCanvas((width, height) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width || 1));
      canvas.height = Math.max(1, Math.round(height || 1));
      return canvas;
    });
  } catch (e) {
    console.warn('[ag-psd] Exporter canvas initialization note:', e);
  }
}

/**
 * Map CSS / Canvas blend mode string to Photoshop PSD blend mode
 */
export function mapCanvasBlendModeToPsd(mode) {
  if (!mode) return 'normal';
  const clean = String(mode).toLowerCase().trim().replace(/[\s_-]+/g, '');
  const map = {
    normal: 'normal',
    passthrough: 'pass through',
    dissolve: 'dissolve',
    multiply: 'multiply',
    screen: 'screen',
    overlay: 'overlay',
    darken: 'darken',
    lighten: 'lighten',
    colordodge: 'color dodge',
    colorburn: 'color burn',
    linearburn: 'linear burn',
    lineardodge: 'linear dodge',
    darkercolor: 'darker color',
    lightercolor: 'lighter color',
    softlight: 'soft light',
    hardlight: 'hard light',
    vividlight: 'vivid light',
    linearlight: 'linear light',
    pinlight: 'pin light',
    hardmix: 'hard mix',
    difference: 'difference',
    exclusion: 'exclusion',
    subtract: 'subtract',
    subtraction: 'subtract',
    divide: 'divide',
    hue: 'hue',
    saturation: 'saturation',
    color: 'color',
    luminosity: 'luminosity',
  };
  return map[clean] || 'normal';
}

/**
 * Convert hex color or rgba string to PSD RGB object { r, g, b }
 */
export function hexOrRgbToPsdColor(colorStr, fallback = { r: 0, g: 0, b: 0 }) {
  if (!colorStr) return fallback;
  if (typeof colorStr === 'object' && 'r' in colorStr && 'g' in colorStr && 'b' in colorStr) {
    return {
      r: Math.round(Math.max(0, Math.min(255, colorStr.r))),
      g: Math.round(Math.max(0, Math.min(255, colorStr.g))),
      b: Math.round(Math.max(0, Math.min(255, colorStr.b))),
    };
  }
  const str = String(colorStr).trim();
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return {
        r: isNaN(r) ? fallback.r : r,
        g: isNaN(g) ? fallback.g : g,
        b: isNaN(b) ? fallback.b : b,
      };
    }
  }
  const matchRgb = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (matchRgb) {
    return {
      r: parseInt(matchRgb[1], 10),
      g: parseInt(matchRgb[2], 10),
      b: parseInt(matchRgb[3], 10),
    };
  }
  return fallback;
}

/**
 * Load an HTMLImageElement asynchronously from a data URL or image source
 */
export function loadImageElement(src) {
  return new Promise((resolve) => {
    if (!src || typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Render Shape layer onto an offscreen canvas
 */
export function renderShapeCanvas(layer, width, height) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const { shapeType, fillColor, strokeColor, strokeWidth, borderRadius, pathData } = layer;
  const effectiveFill = layer.styles?.colorOverlay?.enabled
    ? layer.styles.colorOverlay.color
    : fillColor;

  if (shapeType === 'custom-path' && pathData) {
    try {
      const p = new Path2D(pathData);
      if (effectiveFill && effectiveFill !== 'transparent') {
        ctx.fillStyle = effectiveFill;
        ctx.fill(p);
      }
      if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke(p);
      }
      return canvas;
    } catch {
      // Fallback to geometric
    }
  }

  ctx.beginPath();
  const w = canvas.width;
  const h = canvas.height;

  if (shapeType === 'rect') {
    const r = Math.min(borderRadius || 0, w / 2, h / 2);
    if (r > 0 && ctx.roundRect) ctx.roundRect(0, 0, w, h, r);
    else ctx.rect(0, 0, w, h);
  } else if (shapeType === 'rounded-rect') {
    const r = Math.min(borderRadius || 16, w / 2, h / 2);
    if (ctx.roundRect) ctx.roundRect(0, 0, w, h, r);
    else ctx.rect(0, 0, w, h);
  } else if (shapeType === 'circle') {
    const radius = Math.min(w, h) / 2;
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
  } else if (shapeType === 'ellipse') {
    ctx.ellipse(w / 2, h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
  } else if (shapeType === 'line') {
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
  } else if (shapeType === 'arrow') {
    const arrowHeadSize = Math.max(12, (strokeWidth || 2) * 3);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w - arrowHeadSize, h / 2);
    ctx.moveTo(w - arrowHeadSize, h / 2 - arrowHeadSize * 0.6);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w - arrowHeadSize, h / 2 + arrowHeadSize * 0.6);
    ctx.closePath();
  } else if (shapeType === 'triangle') {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
  } else if (shapeType === 'star') {
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * 0.45;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else {
    ctx.rect(0, 0, w, h);
  }

  if (effectiveFill && effectiveFill !== 'transparent') {
    ctx.fillStyle = effectiveFill;
    ctx.fill();
  }

  if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  return canvas;
}

/**
 * Render Text layer onto an offscreen canvas
 */
export function renderTextCanvas(layer, width, height) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const {
    text = '',
    fontSize = 32,
    fontFamily = 'Poppins',
    fontWeight = 'normal',
    fontStyle = 'normal',
    color = '#1e293b',
    align = 'left',
    bgColor = 'transparent',
    lineHeight = 1.2,
  } = layer;

  const effectiveColor = layer.styles?.colorOverlay?.enabled
    ? layer.styles.colorOverlay.color
    : color;

  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.font = `${fontStyle || 'normal'} ${fontWeight || 'normal'} ${fontSize}px "${fontFamily}", sans-serif`;
  ctx.textBaseline = 'top';

  let textAnchorX = 0;
  if (align === 'center') {
    ctx.textAlign = 'center';
    textAnchorX = canvas.width / 2;
  } else if (align === 'right') {
    ctx.textAlign = 'right';
    textAnchorX = canvas.width;
  } else {
    ctx.textAlign = 'left';
    textAnchorX = 0;
  }

  ctx.fillStyle = effectiveColor || '#1e293b';

  const lines = String(text || '').split('\n');
  const lineSpacing = fontSize * (lineHeight || 1.2);
  lines.forEach((lineStr, index) => {
    ctx.fillText(lineStr, textAnchorX, index * lineSpacing);
  });

  return canvas;
}

/**
 * Extract layer styles into ag-psd effects data
 */
export function formatLayerEffectsForPsd(styles) {
  if (!styles) return undefined;
  const effects = {
    scale: 1,
    disabled: false,
  };
  let hasEffects = false;

  // 1. Drop Shadow
  if (styles.dropShadow?.enabled) {
    const ds = styles.dropShadow;
    effects.dropShadow = [
      {
        enabled: true,
        distance: { units: 'Pixels', value: ds.distance ?? 5 },
        size: { units: 'Pixels', value: ds.blur ?? 10 },
        angle: ds.angle ?? 90,
        opacity: Math.max(0, Math.min(1, (ds.opacity ?? 75) / 100)),
        color: hexOrRgbToPsdColor(ds.color, { r: 0, g: 0, b: 0 }),
      },
    ];
    hasEffects = true;
  }

  // 2. Stroke
  if (styles.stroke?.enabled) {
    const st = styles.stroke;
    effects.stroke = [
      {
        enabled: true,
        position: 'outside',
        fillType: 'color',
        blendMode: 'normal',
        opacity: Math.max(0, Math.min(1, (st.opacity ?? 100) / 100)),
        size: { units: 'Pixels', value: st.size ?? 3 },
        color: hexOrRgbToPsdColor(st.color, { r: 0, g: 0, b: 0 }),
      },
    ];
    hasEffects = true;
  }

  // 3. Solid Fill / Color Overlay
  if (styles.colorOverlay?.enabled) {
    const co = styles.colorOverlay;
    effects.solidFill = [
      {
        enabled: true,
        opacity: Math.max(0, Math.min(1, (co.opacity ?? 80) / 100)),
        blendMode: mapCanvasBlendModeToPsd(co.blendMode || 'normal'),
        color: hexOrRgbToPsdColor(co.color, { r: 124, g: 58, b: 237 }),
      },
    ];
    hasEffects = true;
  }

  // 4. Outer Glow
  if (styles.outerGlow?.enabled) {
    const og = styles.outerGlow;
    effects.outerGlow = {
      enabled: true,
      size: { units: 'Pixels', value: og.blur ?? 15 },
      opacity: Math.max(0, Math.min(1, (og.opacity ?? 75) / 100)),
      color: hexOrRgbToPsdColor(og.color, { r: 255, g: 215, b: 0 }),
    };
    hasEffects = true;
  }

  // 5. Gradient Overlay
  if (styles.gradientOverlay?.enabled) {
    const go = styles.gradientOverlay;
    effects.gradientOverlay = [
      {
        enabled: true,
        blendMode: 'normal',
        opacity: Math.max(0, Math.min(1, (go.opacity ?? 85) / 100)),
        angle: go.angle ?? 90,
        gradient: {
          type: 'solid',
          name: 'Custom',
          smoothness: 1,
          colorStops: [
            {
              color: hexOrRgbToPsdColor(go.color1 || '#7c3aed'),
              location: 0,
              midpoint: 50,
            },
            {
              color: hexOrRgbToPsdColor(go.color2 || '#ec4899'),
              location: 4096,
              midpoint: 50,
            },
          ],
          opacityStops: [
            { opacity: 1, location: 0, midpoint: 50 },
            { opacity: 1, location: 4096, midpoint: 50 },
          ],
        },
      },
    ];
    hasEffects = true;
  }

  return hasEffects ? effects : undefined;
}

/**
 * Main PSD Exporter function
 * Converts editor document and layers into a Photoshop PSD Uint8Array binary
 *
 * @param {Object} documentModel - Active document object from documentManager
 * @param {Array} layers - Array of layer objects in bottom-to-top order
 * @param {Object} options - Export options (e.g. filename, background)
 * @returns {Promise<{ uint8: Uint8Array, blob: Blob, filename: string, stats: Object }>}
 */
export async function exportDocumentAsPsd(documentModel, layers = [], options = {}) {
  if (!documentModel || !documentModel.width || !documentModel.height) {
    throw new Error('Cannot export PSD: Invalid document dimensions.');
  }

  const docWidth = Math.max(1, Math.round(documentModel.width));
  const docHeight = Math.max(1, Math.round(documentModel.height));
  const rawFileName = options.filename || documentModel.name || 'Untitled-1.psd';
  const psdFileName = rawFileName.toLowerCase().endsWith('.psd')
    ? rawFileName
    : `${rawFileName.replace(/\.[^/.]+$/, '')}.psd`;

  // 1. Preload all layer image dataUrls & masks
  const imageMap = {};
  const maskMap = {};

  await Promise.all(
    layers.map(async (layer) => {
      const dataUrl = layer.dataUrl || (layer.id === 'background' ? documentModel.canvas?.toDataURL?.('image/png') : null);
      if (dataUrl && (layer.type === 'image' || layer.type === 'blank')) {
        const img = await loadImageElement(dataUrl);
        if (img) imageMap[layer.id] = img;
      }
      if (layer.mask?.enabled && layer.mask.dataUrl) {
        const maskImg = await loadImageElement(layer.mask.dataUrl);
        if (maskImg) maskMap[layer.id] = maskImg;
      }
    })
  );

  // 2. Build Clean Composite Canvas (psd.canvas)
  let compositeCanvas = null;
  if (typeof document !== 'undefined') {
    compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = docWidth;
    compositeCanvas.height = docHeight;
    const cCtx = compositeCanvas.getContext('2d');

    if (cCtx) {
      cCtx.imageSmoothingEnabled = true;
      cCtx.imageSmoothingQuality = 'high';

      // Draw background if not transparent
      const bgOption = documentModel.canvasBgOption || 'transparent';
      if (bgOption !== 'transparent') {
        cCtx.fillStyle =
          bgOption === 'custom' || bgOption === 'color'
            ? documentModel.canvasCustomColor || '#7c3aed'
            : bgOption === 'white'
            ? '#ffffff'
            : bgOption;
        cCtx.fillRect(0, 0, docWidth, docHeight);
      }

      // Draw layers strictly inside document bounds
      cCtx.save();
      cCtx.beginPath();
      cCtx.rect(0, 0, docWidth, docHeight);
      cCtx.clip();

      for (const layer of layers) {
        if (layer.hidden) continue;

        const lw = Math.max(1, Math.round(layer.width || docWidth));
        const lh = Math.max(1, Math.round(layer.height || docHeight));

        let layerBuffer = null;
        if (layer.type === 'shape') {
          layerBuffer = renderShapeCanvas(layer, lw, lh);
        } else if (layer.type === 'text') {
          layerBuffer = renderTextCanvas(layer, lw, lh);
        } else if (imageMap[layer.id]) {
          layerBuffer = document.createElement('canvas');
          layerBuffer.width = lw;
          layerBuffer.height = lh;
          const bCtx = layerBuffer.getContext('2d');
          if (bCtx) {
            bCtx.drawImage(imageMap[layer.id], 0, 0, lw, lh);
            if (maskMap[layer.id]) {
              bCtx.globalCompositeOperation = 'destination-in';
              bCtx.drawImage(maskMap[layer.id], 0, 0, lw, lh);
            }
          }
        }

        if (layerBuffer) {
          cCtx.save();
          const cx = (layer.x || 0) + lw / 2;
          const cy = (layer.y || 0) + lh / 2;
          cCtx.translate(cx, cy);
          if (layer.rotation) cCtx.rotate((layer.rotation * Math.PI) / 180);
          cCtx.globalAlpha = Math.max(0, Math.min(1, (layer.opacity ?? 100) / 100));

          if (layer.blendMode && layer.blendMode !== 'normal') {
            cCtx.globalCompositeOperation = layer.blendMode;
          }

          cCtx.drawImage(layerBuffer, -lw / 2, -lh / 2, lw, lh);
          cCtx.restore();
        }
      }
      cCtx.restore();
    }
  }

  // 3. Build Individual PSD Layers
  const psdChildren = [];
  const stats = {
    totalExportedLayers: 0,
    rasterLayers: 0,
    textLayers: 0,
    shapeLayers: 0,
    groups: 0,
  };

  // Group folder lookup
  const groupMap = {};

  for (let index = 0; index < layers.length; index++) {
    const layer = layers[index];
    const layerName = layer.name || `Layer ${index + 1}`;
    const left = Math.round(layer.x || 0);
    const top = Math.round(layer.y || 0);
    const lw = Math.max(1, Math.round(layer.width || docWidth));
    const lh = Math.max(1, Math.round(layer.height || docHeight));
    const opacity = Math.max(0, Math.min(1, (layer.opacity ?? 100) / 100));
    const blendMode = mapCanvasBlendModeToPsd(layer.blendMode);
    const isHidden = Boolean(layer.hidden);
    const isClipping = Boolean(layer.clippingMask);

    // Group Header Layer
    if (layer.type === 'group') {
      stats.groups++;
      const groupNode = {
        name: layerName,
        opened: true,
        children: [],
      };
      groupMap[layer.id || layer.name] = groupNode;
      psdChildren.push(groupNode);
      continue;
    }

    // Render individual layer canvas
    let layerCanvas = null;

    if (layer.type === 'shape') {
      stats.shapeLayers++;
      layerCanvas = renderShapeCanvas(layer, lw, lh);
    } else if (layer.type === 'text') {
      stats.textLayers++;
      layerCanvas = renderTextCanvas(layer, lw, lh);
    } else if (imageMap[layer.id]) {
      stats.rasterLayers++;
      layerCanvas = document.createElement('canvas');
      layerCanvas.width = lw;
      layerCanvas.height = lh;
      const bCtx = layerCanvas.getContext('2d');
      if (bCtx) {
        bCtx.drawImage(imageMap[layer.id], 0, 0, lw, lh);
      }
    } else {
      // Empty or fallback raster canvas
      stats.rasterLayers++;
      if (typeof document !== 'undefined') {
        layerCanvas = document.createElement('canvas');
        layerCanvas.width = lw;
        layerCanvas.height = lh;
      }
    }

    // Construct layer definition
    const psdLayer = {
      name: layerName,
      left,
      top,
      right: left + lw,
      bottom: top + lh,
      opacity,
      blendMode,
      hidden: isHidden,
      clipping: isClipping,
      canvas: layerCanvas || undefined,
    };

    // Layer Mask
    if (maskMap[layer.id]) {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = lw;
      maskCanvas.height = lh;
      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) mCtx.drawImage(maskMap[layer.id], 0, 0, lw, lh);
      psdLayer.mask = {
        left,
        top,
        right: left + lw,
        bottom: top + lh,
        canvas: maskCanvas,
        disabled: !layer.mask?.enabled,
      };
    }

    // Text Layer Metadata
    if (layer.type === 'text') {
      psdLayer.text = {
        text: layer.text || '',
        style: {
          font: { name: layer.fontFamily || 'Poppins' },
          fontSize: layer.fontSize || 32,
          fillColor: hexOrRgbToPsdColor(layer.color || '#1e293b'),
          fauxBold: layer.fontWeight === 'bold',
          fauxItalic: layer.fontStyle === 'italic',
          underline: Boolean(layer.underline),
        },
        paragraphStyle: {
          justification:
            layer.align === 'center' ? 'center' : layer.align === 'right' ? 'right' : 'left',
        },
      };
    }

    // Shape Layer Vector Fill
    if (layer.type === 'shape' && layer.fillColor && layer.fillColor !== 'transparent') {
      psdLayer.vectorFill = {
        type: 'color',
        color: hexOrRgbToPsdColor(layer.fillColor, { r: 124, g: 58, b: 237 }),
      };
    }

    // Layer Effects
    const effectsData = formatLayerEffectsForPsd(layer.styles);
    if (effectsData) {
      psdLayer.effects = effectsData;
    }

    stats.totalExportedLayers++;

    // Check if layer belongs to a parent group
    if (layer.groupId && groupMap[layer.groupId]) {
      groupMap[layer.groupId].children.push(psdLayer);
    } else if (layer.groupName && groupMap[layer.groupName]) {
      groupMap[layer.groupName].children.push(psdLayer);
    } else {
      psdChildren.push(psdLayer);
    }
  }

  // 4. Create Root PSD Object
  const psd = {
    width: docWidth,
    height: docHeight,
    channels: 4,
    colorMode: 3, // RGB
    canvas: compositeCanvas || undefined,
    children: psdChildren,
  };

  // 5. Serialize with ag-psd
  const uint8 = writePsdUint8Array(psd, {
    noBackground: true,
    generateThumbnail: Boolean(compositeCanvas),
  });

  // 6. Wrap in Blob
  const blob = new Blob([uint8], { type: 'image/vnd.adobe.photoshop' });

  return {
    uint8,
    blob,
    filename: psdFileName,
    stats,
  };
}

/**
 * Trigger native browser file download
 */
export function triggerFileDownload(blob, filename) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

