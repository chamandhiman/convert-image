/**
 * Adobe Photoshop PSD Parser & Importer for Image Convert Editor
 * Powered by ag-psd
 *
 * Supports:
 * - Document dimensions & composite canvas preview
 * - Individual layer extraction (bounds, coordinates, opacity, visibility, blend modes)
 * - Raster RGBA transparency preservation
 * - Layer masks & clipping masks
 * - Layer styles & effects (Drop Shadow, Outer Glow, Stroke, Color Overlay, Gradient Overlay)
 * - Text layers (string, font size, font family, color, alignment)
 * - Vector & shape layers
 * - Group hierarchy traversal
 * - Smart Objects & Adjustment layer raster preservation
 * - Detailed error handling & compatibility reporting
 */

import { readPsd, initializeCanvas } from 'ag-psd';
import { generateLayerId, generateDocId, createDocumentModel } from './documentManager.js';

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
    console.warn('[ag-psd] Canvas initialization note:', e);
  }
}

/**
 * Map Photoshop blend mode to CSS / Canvas blend mode string
 */
export function mapPsdBlendMode(psdMode) {
  if (!psdMode) return 'normal';
  const mode = String(psdMode).toLowerCase().replace(/[\s_-]+/g, '');
  const map = {
    normal: 'normal',
    passthrough: 'normal',
    dissolve: 'normal',
    multiply: 'multiply',
    screen: 'screen',
    overlay: 'overlay',
    darken: 'darken',
    lighten: 'lighten',
    colordodge: 'color-dodge',
    colorburn: 'color-burn',
    hardlight: 'hard-light',
    softlight: 'soft-light',
    difference: 'difference',
    exclusion: 'exclusion',
    hue: 'hue',
    saturation: 'saturation',
    color: 'color',
    luminosity: 'luminosity',
    linearburn: 'color-burn',
    lineardodge: 'color-dodge',
    vividlight: 'overlay',
    linearlight: 'overlay',
    pinlight: 'hard-light',
    hardmix: 'hard-light',
  };
  return map[mode] || 'normal';
}

/**
 * Convert Photoshop color object to hex color string
 */
export function psdColorToHex(color, defaultColor = '#000000') {
  if (!color) return defaultColor;
  if (typeof color === 'string') {
    if (color.startsWith('#')) return color;
    return defaultColor;
  }
  if (typeof color === 'object') {
    if ('r' in color && 'g' in color && 'b' in color) {
      const r = Math.round(Math.max(0, Math.min(255, color.r))).toString(16).padStart(2, '0');
      const g = Math.round(Math.max(0, Math.min(255, color.g))).toString(16).padStart(2, '0');
      const b = Math.round(Math.max(0, Math.min(255, color.b))).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }
  return defaultColor;
}

/**
 * Safely parse unit values (number or { value, units })
 */
function parseUnitValue(val, fallback = 0) {
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'value' in val) {
    return Number(val.value) || fallback;
  }
  return fallback;
}

/**
 * Extract layer effects (Drop Shadow, Outer Glow, Stroke, Color Overlay, Gradient Overlay)
 */
function extractLayerEffects(effects) {
  if (!effects) return null;

  const styles = {};
  let hasEffects = false;

  // 1. Drop Shadow
  if (effects.dropShadow && effects.dropShadow.length > 0) {
    const ds = effects.dropShadow.find((d) => d.enabled !== false) || effects.dropShadow[0];
    if (ds && ds.enabled !== false) {
      styles.dropShadow = {
        enabled: true,
        distance: parseUnitValue(ds.distance, 5),
        blur: parseUnitValue(ds.size, 10),
        color: psdColorToHex(ds.color, '#000000'),
        opacity: Math.round((ds.opacity ?? 0.75) * 100),
        angle: ds.angle ?? 90,
      };
      hasEffects = true;
    }
  }

  // 2. Outer Glow
  const og = Array.isArray(effects.outerGlow) ? effects.outerGlow[0] : effects.outerGlow;
  if (og && og.enabled !== false) {
    styles.outerGlow = {
      enabled: true,
      blur: parseUnitValue(og.size, 15),
      color: psdColorToHex(og.color, '#ffd700'),
      opacity: Math.round((og.opacity ?? 0.75) * 100),
    };
    hasEffects = true;
  }

  // 3. Stroke
  const st = Array.isArray(effects.stroke) ? effects.stroke[0] : effects.stroke;
  if (st && st.enabled !== false) {
    styles.stroke = {
      enabled: true,
      size: parseUnitValue(st.size, 3),
      color: psdColorToHex(st.color, '#000000'),
      opacity: Math.round((st.opacity ?? 1) * 100),
    };
    hasEffects = true;
  }

  // 4. Color Overlay / Solid Fill
  const sf = Array.isArray(effects.solidFill) ? effects.solidFill[0] : effects.solidFill;
  if (sf && sf.enabled !== false) {
    styles.colorOverlay = {
      enabled: true,
      color: psdColorToHex(sf.color, '#7c3aed'),
      opacity: Math.round((sf.opacity ?? 0.8) * 100),
      blendMode: mapPsdBlendMode(sf.blendMode),
    };
    hasEffects = true;
  }

  // 5. Gradient Overlay
  const go = Array.isArray(effects.gradientOverlay) ? effects.gradientOverlay[0] : effects.gradientOverlay;
  if (go && go.enabled !== false) {
    let color1 = '#7c3aed';
    let color2 = '#ec4899';
    if (go.gradient?.colorStops && go.gradient.colorStops.length >= 2) {
      color1 = psdColorToHex(go.gradient.colorStops[0].color, color1);
      color2 = psdColorToHex(go.gradient.colorStops[go.gradient.colorStops.length - 1].color, color2);
    }
    styles.gradientOverlay = {
      enabled: true,
      color1,
      color2,
      angle: go.angle ?? 90,
      opacity: Math.round((go.opacity ?? 1) * 100),
    };
    hasEffects = true;
  }

  return hasEffects ? styles : null;
}

/**
 * Extract DataURL from an HTMLCanvasElement or ImageData
 */
function canvasToDataUrl(canvasOrData) {
  if (!canvasOrData) return '';
  if (typeof canvasOrData.toDataURL === 'function') {
    try {
      return canvasOrData.toDataURL('image/png');
    } catch {
      return '';
    }
  }
  if (canvasOrData.data && canvasOrData.width && canvasOrData.height && typeof document !== 'undefined') {
    try {
      const c = document.createElement('canvas');
      c.width = canvasOrData.width;
      c.height = canvasOrData.height;
      const ctx = c.getContext('2d');
      ctx.putImageData(canvasOrData, 0, 0);
      return c.toDataURL('image/png');
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * Main PSD File Parser and Document Converter
 * Reads an ArrayBuffer or File, validates, parses with ag-psd, and maps to editor document model.
 *
 * @param {File|Blob|ArrayBuffer} fileOrBuffer
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function parsePsdFile(fileOrBuffer, options = {}) {
  const fileName = fileOrBuffer?.name || 'Photoshop Document.psd';
  const fileSize = fileOrBuffer?.size || 0;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

  onProgress?.(20, 'Reading file...');
  if (onProgress) {
    await new Promise((r) => setTimeout(r, 40));
  }

  // 1. Convert to ArrayBuffer
  let buffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    buffer = fileOrBuffer;
  } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
    buffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error('Invalid PSD input: Expected a File, Blob, or ArrayBuffer.');
  }

  if (!buffer || buffer.byteLength < 26) {
    throw new Error('The file is too small to be a valid Adobe Photoshop (PSD) document.');
  }

  onProgress?.(45, 'Parsing document structure...');
  if (onProgress) {
    await new Promise((r) => setTimeout(r, 50));
  }

  // Quick signature check ('8BPS' = 0x38 0x42 0x50 0x53)
  const view = new DataView(buffer);
  const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (sig !== '8BPS') {
    throw new Error(`Invalid PSD signature: expected '8BPS', found '${sig}'. Please select a valid Adobe Photoshop document.`);
  }

  const warnings = [];
  const stats = {
    totalLayersParsed: 0,
    rasterLayers: 0,
    textLayers: 0,
    shapeLayers: 0,
    smartObjects: 0,
    adjustmentLayers: 0,
    layerMasks: 0,
    clippingMasks: 0,
    layerEffects: 0,
    groups: 0,
  };

  onProgress?.(67, 'Parsing layers...');
  if (onProgress) {
    await new Promise((r) => setTimeout(r, 60));
  }

  // 2. Parse PSD with ag-psd
  let psd;
  try {
    psd = readPsd(buffer, {
      skipThumbnail: true,
      useCanvas: true,
      ...options,
    });
  } catch (err) {
    console.error('[psdImporter] ag-psd parse error:', err);
    throw new Error(`Failed to parse PSD document: ${err.message || 'Corrupted or unsupported format.'}`);
  }

  if (!psd || !psd.width || !psd.height) {
    throw new Error('The PSD document contains invalid dimensions (0×0).');
  }

  const docWidth = psd.width;
  const docHeight = psd.height;

  // Metadata extraction: Resolution, Color Mode, Bit Depth, Channels
  const resolution = Math.round(psd.resolutionInfo?.horizontalResolution || 72);
  const resolutionUnit = psd.resolutionInfo?.horizontalResolutionUnit === 2 ? 'pixelsPerCm' : 'pixelsPerInch';
  const colorModeMap = {
    0: 'Bitmap',
    1: 'Grayscale',
    2: 'Indexed',
    3: 'RGB',
    4: 'CMYK',
    7: 'Multichannel',
    8: 'Duotone',
    9: 'Lab',
  };
  const colorMode = colorModeMap[psd.colorMode] || 'RGB';
  const bitsPerChannel = psd.bitsPerChannel || 8;
  const channels = psd.channels || (psd.colorMode === 1 ? 1 : psd.colorMode === 4 ? 4 : 3);

  // Color mode detection warning
  if (psd.colorMode !== undefined && psd.colorMode !== 3 && psd.colorMode !== 1) {
    warnings.push(`Document uses ${colorMode} color mode. Converted to sRGB for web canvas editing.`);
  }

  // 3. Recursive Layer Traversal
  const importedLayers = [];

  function processLayer(rawLayer, groupName = null, isGroupDirectChild = false, isParentHidden = false, parentOpacity = 1) {
    if (!rawLayer) return;

    stats.totalLayersParsed++;

    const isThisHidden = Boolean(rawLayer.hidden || isParentHidden);
    const thisRawOpacity = rawLayer.opacity !== undefined ? rawLayer.opacity : 1;
    const combinedOpacity = Math.max(0, Math.min(1, thisRawOpacity * parentOpacity));

    // Check if this layer is a group folder
    const hasChildren = Array.isArray(rawLayer.children) && rawLayer.children.length > 0;
    if (hasChildren) {
      stats.groups++;
      const currentGroupName = groupName ? `${groupName} / ${rawLayer.name || 'Group'}` : (rawLayer.name || 'Group');

      // Process children in bottom-to-top order
      for (const child of rawLayer.children) {
        processLayer(child, currentGroupName, true, isThisHidden, combinedOpacity);
      }
      return;
    }

    const layerName = rawLayer.name || `Layer ${importedLayers.length + 1}`;
    const isHidden = isThisHidden;
    const opacity = Math.round(combinedOpacity * 100);
    const blendMode = mapPsdBlendMode(rawLayer.blendMode);
    const isClipping = Boolean(rawLayer.clipping);
    if (isClipping) stats.clippingMasks++;

    // Preserve exact Photoshop coordinates (strictly relative to PSD top-left (0,0))
    // Can be negative, zero, or extending outside document canvas
    const left = rawLayer.left !== undefined ? rawLayer.left : 0;
    const top = rawLayer.top !== undefined ? rawLayer.top : 0;
    const right = rawLayer.right !== undefined ? rawLayer.right : left;
    const bottom = rawLayer.bottom !== undefined ? rawLayer.bottom : top;

    // Check raster canvas or image data dimensions
    const canvasW = rawLayer.canvas ? rawLayer.canvas.width : (rawLayer.imageData ? rawLayer.imageData.width : 0);
    const canvasH = rawLayer.canvas ? rawLayer.canvas.height : (rawLayer.imageData ? rawLayer.imageData.height : 0);
    const boundsW = (right > left) ? (right - left) : 0;
    const boundsH = (bottom > top) ? (bottom - top) : 0;

    // Determine actual layer width and height without inflating to docWidth
    let width = boundsW > 0 ? boundsW : (canvasW > 0 ? canvasW : 0);
    let height = boundsH > 0 ? boundsH : (canvasH > 0 ? canvasH : 0);

    // Extract raster image dataUrl
    const rasterDataUrl = canvasToDataUrl(rawLayer.canvas || rawLayer.imageData);

    // Extract layer mask
    let maskObj = null;
    if (rawLayer.mask || rawLayer.realMask) {
      const m = rawLayer.mask || rawLayer.realMask;
      const maskCanvas = m.canvas || m.imageData;
      const maskUrl = canvasToDataUrl(maskCanvas);
      if (maskUrl) {
        maskObj = {
          enabled: !m.disabled,
          dataUrl: maskUrl,
          x: m.left ?? left,
          y: m.top ?? top,
          width: m.width ?? (m.right && m.left ? m.right - m.left : (width || docWidth)),
          height: m.height ?? (m.bottom && m.top ? m.bottom - m.top : (height || docHeight)),
        };
        stats.layerMasks++;
      }
    }

    // Extract layer effects
    const styles = extractLayerEffects(rawLayer.effects);
    if (styles) stats.layerEffects++;

    // -------------------------------------------------------------------------
    // A. Smart Object / Placed Layer
    // -------------------------------------------------------------------------
    if (rawLayer.placedLayer) {
      stats.smartObjects++;
      warnings.push(`Layer "${layerName}": Smart Object imported with full-resolution raster rendering.`);
      const smartW = width > 0 ? width : (rawLayer.placedLayer.width || 100);
      const smartH = height > 0 ? height : (rawLayer.placedLayer.height || 100);
      importedLayers.push({
        id: generateLayerId(),
        name: layerName,
        type: 'image',
        dataUrl: rasterDataUrl,
        x: left,
        y: top,
        width: smartW,
        height: smartH,
        origWidth: smartW,
        origHeight: smartH,
        opacity,
        blendMode,
        rotation: 0,
        locked: false,
        hidden: isHidden,
        isBackground: false,
        clippingMask: isClipping,
        mask: maskObj,
        styles,
        isSmartObject: true,
        groupName: groupName || undefined,
      });
      return;
    }

    // -------------------------------------------------------------------------
    // B. Adjustment Layer
    // -------------------------------------------------------------------------
    if (rawLayer.adjustment) {
      stats.adjustmentLayers++;
      if (rasterDataUrl) {
        warnings.push(`Layer "${layerName}": Adjustment layer preserved as raster layer.`);
        const adjW = width > 0 ? width : docWidth;
        const adjH = height > 0 ? height : docHeight;
        importedLayers.push({
          id: generateLayerId(),
          name: layerName,
          type: 'image',
          dataUrl: rasterDataUrl,
          x: left,
          y: top,
          width: adjW,
          height: adjH,
          origWidth: adjW,
          origHeight: adjH,
          opacity,
          blendMode,
          rotation: 0,
          locked: false,
          hidden: isHidden,
          isBackground: false,
          clippingMask: isClipping,
          mask: maskObj,
          styles,
          isAdjustment: true,
          groupName: groupName || undefined,
        });
      } else {
        warnings.push(`Layer "${layerName}": Procedural adjustment layer (${Object.keys(rawLayer.adjustment).join(', ')}) skipped without pre-rendered bitmap.`);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // C. Editable Text Layer
    // -------------------------------------------------------------------------
    if (rawLayer.text && typeof rawLayer.text.text === 'string' && rawLayer.text.text.trim()) {
      stats.textLayers++;
      const textData = rawLayer.text;
      const textContent = textData.text;
      const fontSize = Math.max(8, Math.round(textData.style?.fontSize || 32));
      const fontFamily = textData.style?.font?.name || 'Poppins';
      const textColor = psdColorToHex(textData.style?.fillColor, '#1e293b');
      const align = textData.paragraphStyle?.justification === 'center' ? 'center' :
        textData.paragraphStyle?.justification === 'right' ? 'right' : 'left';

      // Estimate natural dimensions if not provided by bounding box or canvas
      const lines = textContent.split(/\r\n|\r|\n/);
      const maxLineLength = Math.max(...lines.map((l) => l.length), 1);
      const approxW = Math.max(60, Math.round(maxLineLength * fontSize * 0.65));
      const approxH = Math.max(30, Math.round(lines.length * fontSize * 1.3));

      const textW = width > 0 ? width : approxW;
      const textH = height > 0 ? height : approxH;

      // Determine text position:
      // If left/top bounds are present and non-zero, use them directly
      // If left/top are (0,0) and textData.transform is present, use transform matrix translation
      let textX = left;
      let textY = top;
      if (left === 0 && top === 0 && textData.transform && textData.transform.length >= 6) {
        const tx = Math.round(textData.transform[4]);
        const ty = Math.round(textData.transform[5] - fontSize * 0.8);
        if (tx !== 0 || ty !== 0) {
          textX = tx;
          textY = ty;
        }
      }

      const fontRawName = textData.style?.font?.name || '';
      const fontRawStyle = textData.style?.font?.style || '';
      const isBold = Boolean(
        textData.style?.fauxBold ||
        /bold|black|heavy|semibold|bld/i.test(fontRawName) ||
        /bold|black|heavy|semibold|bld/i.test(fontRawStyle)
      );
      const isItalic = Boolean(
        textData.style?.fauxItalic ||
        /italic|oblique/i.test(fontRawName) ||
        /italic|oblique/i.test(fontRawStyle)
      );
      const isUnderline = Boolean(textData.style?.underline);

      importedLayers.push({
        id: generateLayerId(),
        name: layerName,
        type: 'text',
        text: textContent,
        dataUrl: rasterDataUrl || undefined,
        x: textX,
        y: textY,
        width: textW,
        height: textH,
        fontSize,
        fontFamily,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: isItalic ? 'italic' : 'normal',
        underline: isUnderline,
        color: textColor,
        align,
        lineHeight: 1.2,
        letterSpacing: 0,
        bgColor: 'transparent',
        opacity,
        blendMode,
        rotation: 0,
        locked: false,
        hidden: isHidden,
        isBackground: false,
        clippingMask: isClipping,
        mask: maskObj,
        styles,
        groupName: groupName || undefined,
      });
      return;
    }

    // -------------------------------------------------------------------------
    // D. Vector / Shape Layer
    // -------------------------------------------------------------------------
    if ((rawLayer.vectorMask || rawLayer.vectorStroke) && !rasterDataUrl) {
      stats.shapeLayers++;
      const strokeCol = rawLayer.vectorStroke?.content?.color
        ? psdColorToHex(rawLayer.vectorStroke.content.color, '#000000')
        : '#000000';
      const fillCol = rawLayer.vectorFill?.color
        ? psdColorToHex(rawLayer.vectorFill.color, '#7c3aed')
        : '#7c3aed';

      const shapeW = width > 0 ? width : 100;
      const shapeH = height > 0 ? height : 100;

      importedLayers.push({
        id: generateLayerId(),
        name: layerName,
        type: 'shape',
        shapeType: 'rect',
        x: left,
        y: top,
        width: shapeW,
        height: shapeH,
        fillColor: fillCol,
        strokeColor: strokeCol,
        strokeWidth: parseUnitValue(rawLayer.vectorStroke?.lineWidth, 2),
        borderRadius: 0,
        opacity,
        blendMode,
        rotation: 0,
        locked: false,
        hidden: isHidden,
        isBackground: false,
        clippingMask: isClipping,
        mask: maskObj,
        styles,
        groupName: groupName || undefined,
      });
      return;
    }

    // -------------------------------------------------------------------------
    // E. Standard Raster Image Layer
    // -------------------------------------------------------------------------
    stats.rasterLayers++;
    const finalW = width > 0 ? width : 100;
    const finalH = height > 0 ? height : 100;

    importedLayers.push({
      id: generateLayerId(),
      name: layerName,
      type: 'image',
      dataUrl: rasterDataUrl,
      x: left,
      y: top,
      width: finalW,
      height: finalH,
      origWidth: finalW,
      origHeight: finalH,
      opacity,
      blendMode,
      rotation: 0,
      locked: false,
      hidden: isHidden,
      isBackground: false,
      clippingMask: isClipping,
      mask: maskObj,
      styles,
      groupName: groupName || undefined,
    });
  }

  // Traverse children
  if (Array.isArray(psd.children) && psd.children.length > 0) {
    for (const child of psd.children) {
      processLayer(child);
    }
  }

  // Background and Transparency Detection
  let isTransparent = true;

  // If no layers could be extracted but composite canvas exists, create single background layer
  if (importedLayers.length === 0) {
    const compUrl = canvasToDataUrl(psd.canvas);
    if (!compUrl) {
      throw new Error('The PSD document contains no visible layer pixel data or composite preview.');
    }
    importedLayers.push({
      id: 'background',
      name: 'Background',
      type: 'image',
      dataUrl: compUrl,
      x: 0,
      y: 0,
      width: docWidth,
      height: docHeight,
      origWidth: docWidth,
      origHeight: docHeight,
      opacity: 100,
      blendMode: 'normal',
      rotation: 0,
      locked: false,
      hidden: false,
      isBackground: true,
      clippingMask: false,
      mask: null,
      styles: null,
    });
    isTransparent = false;
    warnings.push('Document layers were empty or merged. Composite flattened preview loaded as background.');
  } else {
    // If the bottom-most layer covers the entire document from (0,0) and is an opaque Background, mark as background
    const firstLayer = importedLayers[0];
    if (
      firstLayer &&
      firstLayer.x === 0 &&
      firstLayer.y === 0 &&
      firstLayer.width === docWidth &&
      firstLayer.height === docHeight &&
      firstLayer.opacity === 100 &&
      firstLayer.blendMode === 'normal' &&
      !firstLayer.hidden &&
      firstLayer.name.toLowerCase() === 'background'
    ) {
      firstLayer.id = 'background';
      firstLayer.isBackground = true;
      isTransparent = false;
    }
  }

  // Create composite base canvas for history and thumbnail
  let baseCanvas = psd.canvas;
  if (!baseCanvas && typeof document !== 'undefined') {
    baseCanvas = document.createElement('canvas');
    baseCanvas.width = docWidth;
    baseCanvas.height = docHeight;
    const ctx = baseCanvas.getContext('2d');
    if (!isTransparent) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, docWidth, docHeight);
    }
  }

  onProgress?.(100, 'Complete');
  if (onProgress) {
    await new Promise((r) => setTimeout(r, 60));
  }

  return {
    success: true,
    fileName,
    fileSize,
    width: docWidth,
    height: docHeight,
    resolution,
    resolutionUnit,
    colorMode,
    bitsPerChannel,
    channels,
    isTransparent,
    canvasBgOption: isTransparent ? 'transparent' : 'white',
    layers: importedLayers,
    baseCanvas,
    compositeDataUrl: canvasToDataUrl(psd.canvas || baseCanvas),
    warnings,
    stats,
  };
}

/**
 * Convenience helper to create a complete DocumentModel directly from a parsed PSD result.
 */
export function createPsdDocumentModel(psdResult, calculateFitZoom) {
  const {
    fileName,
    fileSize,
    width,
    height,
    resolution = 72,
    resolutionUnit = 'pixelsPerInch',
    colorMode = 'RGB',
    bitsPerChannel = 8,
    channels = 3,
    isTransparent = false,
    canvasBgOption = 'white',
    layers,
    baseCanvas,
  } = psdResult;
  const docId = generateDocId();
  const fitZoom = typeof calculateFitZoom === 'function' ? calculateFitZoom(width, height) : 1;

  const syntheticFile = {
    name: fileName,
    type: 'image/vnd.adobe.photoshop',
    size: fileSize,
  };

  const selectedId = layers[layers.length - 1]?.id || (layers[0] ? layers[0].id : 'background');

  return createDocumentModel({
    id: docId,
    name: fileName,
    width,
    height,
    origWidth: width,
    origHeight: height,
    origSize: fileSize,
    resolution,
    resolutionUnit,
    colorMode,
    bitsPerChannel,
    channels,
    isTransparent,
    canvasBgOption: isTransparent ? 'transparent' : (canvasBgOption || 'white'),
    zoom: fitZoom,
    pan: { x: 0, y: 0 },
    originalFile: syntheticFile,
    canvas: baseCanvas,
    layers,
    selectedLayerId: selectedId,
    selectedLayerIds: [selectedId],
    history: [
      {
        canvas: baseCanvas,
        width,
        height,
        layers: layers.map((l) => ({ ...l })),
        label: `Open PSD (${layers.length} Layers)`,
        timestamp: Date.now(),
      },
    ],
    historyIndex: 0,
    isDirty: false,
  });
}

/**
 * Detects whether a File or Blob is an Adobe Photoshop PSD document.
 * Examines file extension (.psd), MIME type, and handles case-insensitivity.
 *
 * @param {File|Blob|Object} file
 * @returns {boolean}
 */
export function isPsdFile(file) {
  if (!file) return false;

  // 1. Extension check (.psd, case-insensitive)
  if (typeof file.name === 'string' && /\.psd$/i.test(file.name)) {
    return true;
  }

  // 2. MIME type check
  const mime = (typeof file.type === 'string' ? file.type.toLowerCase() : '');
  if (
    mime === 'image/vnd.adobe.photoshop' ||
    mime === 'image/x-photoshop' ||
    mime === 'image/psd' ||
    mime === 'application/x-photoshop' ||
    mime === 'application/photoshop' ||
    mime.includes('photoshop')
  ) {
    return true;
  }

  return false;
}

/**
 * Validates the 4-byte PSD magic signature ('8BPS' = 0x38 0x42 0x50 0x53)
 * Useful when MIME type is reported as 'application/octet-stream' and file has no extension.
 *
 * @param {File|Blob} file
 * @returns {Promise<boolean>}
 */
export async function isPsdSignature(file) {
  try {
    if (!file || typeof file.slice !== 'function') return false;
    const slice = file.slice(0, 4);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    return (
      bytes.length >= 4 &&
      bytes[0] === 0x38 && // '8'
      bytes[1] === 0x42 && // 'B'
      bytes[2] === 0x50 && // 'P'
      bytes[3] === 0x53    // 'S'
    );
  } catch {
    return false;
  }
}

/**
 * Detects whether a File or Blob is a supported standard image file.
 *
 * @param {File|Blob|Object} file
 * @returns {boolean}
 */
export function isSupportedImageFile(file) {
  if (!file) return false;
  const mime = (typeof file.type === 'string' ? file.type.toLowerCase() : '');
  const name = (typeof file.name === 'string' ? file.name.toLowerCase() : '');

  if (
    mime.startsWith('image/') &&
    !mime.includes('photoshop') &&
    (mime.includes('jpeg') ||
      mime.includes('jpg') ||
      mime.includes('png') ||
      mime.includes('webp') ||
      mime.includes('gif') ||
      mime.includes('svg') ||
      mime.includes('avif') ||
      mime.includes('bmp') ||
      mime.includes('icon'))
  ) {
    return true;
  }

  return /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico)$/i.test(name);
}
