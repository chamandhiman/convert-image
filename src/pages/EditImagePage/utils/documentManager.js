/**
 * Document Manager Utilities for Photoshop-Style Multi-Document Editing
 * Provides independent document state models, deep cloning, and cross-document transfer operations.
 */

export function generateDocId() {
  return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

export function generateLayerId() {
  return 'layer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

/**
 * Safely deep-clone a layer object, preserving all creative properties and assigning a new ID.
 */
export function cloneLayerData(layer, newId = null) {
  if (!layer) return null;

  const cloned = {
    ...JSON.parse(JSON.stringify(layer)),
    id: newId || generateLayerId(),
  };

  // Ensure isBackground is false on transferred/copied layers so they remain movable
  if (cloned.isBackground) {
    cloned.isBackground = false;
    cloned.name = (cloned.name || 'Image') + ' (Transferred)';
  }

  return cloned;
}

/**
 * Create a new Document Model
 */
export function createDocumentModel({
  id = null,
  name = 'Untitled-1',
  originalFile = null,
  width: explicitWidth,
  height: explicitHeight,
  origWidth = 800,
  origHeight = 600,
  origSize = 0,
  canvas = null,
  layers = [],
  resolution = 72,
  resolutionUnit = 'pixelsPerInch',
  colorMode = 'RGB',
  bitsPerChannel = 8,
  channels = 3,
  isTransparent = false,
  selectedLayerId = null,
  activeTool = 'move',
  zoom = 1,
  pan = { x: 0, y: 0 },
  canvasBgOption = 'transparent',
  canvasCustomColor = '#7C3AED',
  history = null,
  historyIndex = 0,
  isDirty = false,
}) {
  const docId = id || generateDocId();
  const width =
    explicitWidth !== undefined && explicitWidth !== null
      ? explicitWidth
      : canvas
        ? canvas.width
        : origWidth || 800;
  const height =
    explicitHeight !== undefined && explicitHeight !== null
      ? explicitHeight
      : canvas
        ? canvas.height
        : origHeight || 600;

  // Ensure canvas dimensions match document model if canvas is provided
  if (canvas && (canvas.width !== width || canvas.height !== height)) {
    try {
      canvas.width = width;
      canvas.height = height;
    } catch { }
  }

  const initialHistory =
    history && history.length > 0
      ? history
      : [
        {
          canvas:
            canvas ||
            (() => {
              if (typeof document !== 'undefined') {
                const c = document.createElement('canvas');
                c.width = width;
                c.height = height;
                return c;
              }
              return null;
            })(),
          width,
          height,
          layers: layers.map((l) => ({ ...l })),
          label: 'Original',
          timestamp: Date.now(),
        },
      ];

  return {
    id: docId,
    name,
    originalFile,
    origWidth: width,
    origHeight: height,
    origSize,
    canvas,
    width,
    height,
    resolution,
    resolutionUnit,
    colorMode,
    bitsPerChannel,
    channels,
    isTransparent,
    layers: layers.map((l) => ({ ...l })),
    selectedLayerId: selectedLayerId || (layers[0] ? layers[0].id : null),
    selectedLayerIds: selectedLayerId ? [selectedLayerId] : layers[0] ? [layers[0].id] : [],
    activeMaskLayerId: null,
    activeTool,
    zoom,
    pan: { ...pan },
    activeSelection: null,
    selectionFeather: 0,
    selectionTolerance: 32,
    penPath: null,
    patchState: { selection: null, sourceOffset: { x: 0, y: 0 }, isDragging: false },
    guides: [],
    selectedGuideId: null,
    showGuides: true,
    resizeWidth: '',
    resizeHeight: '',
    lockAspectRatio: true,
    cropPreset: 'free',
    cropBox: { x: 0, y: 0, width: 0, height: 0 },
    rotateAngle: 0,
    flipH: false,
    flipV: false,
    canvasWidth: '',
    canvasHeight: '',
    canvasBgOption,
    canvasCustomColor,
    history: initialHistory,
    historyIndex: Math.max(0, initialHistory.length - 1),
    isDirty,
    createdAt: Date.now(),
  };
}

/**
 * Safely transfers a layer into a target document model
 */
export function transferLayerToDocument(
  targetDoc,
  sourceLayer,
  dropX = null,
  dropY = null,
  targetIndex = null
) {
  if (!targetDoc || !sourceLayer) return targetDoc;

  const newLayer = cloneLayerData(sourceLayer);

  // Position calculation
  if (dropX !== null && dropY !== null) {
    newLayer.x = Math.round(dropX);
    newLayer.y = Math.round(dropY);
  } else {
    // Center in target canvas
    const targetW = targetDoc.width || 800;
    const targetH = targetDoc.height || 600;
    const layerW = newLayer.width || 100;
    const layerH = newLayer.height || 100;
    newLayer.x = Math.max(10, Math.round((targetW - layerW) / 2));
    newLayer.y = Math.max(10, Math.round((targetH - layerH) / 2));
  }

  // Insert into target document layers array
  let nextLayers = [...targetDoc.layers];
  if (targetIndex !== null && targetIndex >= 0 && targetIndex <= nextLayers.length) {
    nextLayers.splice(targetIndex, 0, newLayer);
  } else {
    // Default: append above the active/selected layer
    const activeIdx = nextLayers.findIndex((l) => l.id === targetDoc.selectedLayerId);
    if (activeIdx !== -1) {
      nextLayers.splice(activeIdx + 1, 0, newLayer);
    } else {
      nextLayers.push(newLayer);
    }
  }

  // Push entry into target doc history
  const activeCanvas =
    targetDoc.history && targetDoc.history[targetDoc.historyIndex]
      ? targetDoc.history[targetDoc.historyIndex].canvas
      : targetDoc.canvas;

  const historyEntry = {
    canvas: activeCanvas,
    width: targetDoc.width,
    height: targetDoc.height,
    layers: nextLayers.map((l) => ({ ...l })),
    label: `Transfer Layer (${newLayer.name || 'Layer'})`,
    timestamp: Date.now(),
  };

  const curHistory = targetDoc.history || [];
  const sliced = curHistory.slice(0, Math.max(0, targetDoc.historyIndex + 1));
  const nextHistory = [...sliced, historyEntry];

  return {
    ...targetDoc,
    layers: nextLayers,
    selectedLayerId: newLayer.id,
    selectedLayerIds: [newLayer.id],
    history: nextHistory,
    historyIndex: nextHistory.length - 1,
    isDirty: true,
  };
}

/**
 * Creates clipboard package from layers
 */
export function copyLayersToClipboard(layers, sourceDocId) {
  if (!layers || layers.length === 0) return null;
  return {
    type: 'layers',
    sourceDocId,
    timestamp: Date.now(),
    layers: layers.map((l) => JSON.parse(JSON.stringify(l))),
  };
}

/**
 * Pastes clipboard package into target document
 */
export function pasteClipboardIntoDocument(clipboard, targetDoc) {
  if (!clipboard || !clipboard.layers || clipboard.layers.length === 0 || !targetDoc) {
    return null;
  }

  const isSameDoc = clipboard.sourceDocId === targetDoc.id;
  const targetW = targetDoc.width || 800;
  const targetH = targetDoc.height || 600;

  const pastedLayers = clipboard.layers.map((srcLayer, idx) => {
    const newL = cloneLayerData(srcLayer);
    if (isSameDoc) {
      // Offset slightly if pasted in same doc
      newL.x = (newL.x || 0) + 24;
      newL.y = (newL.y || 0) + 24;
    } else {
      // Center in target canvas
      const w = newL.width || 100;
      const h = newL.height || 100;
      newL.x = Math.max(10, Math.round((targetW - w) / 2) + idx * 10);
      newL.y = Math.max(10, Math.round((targetH - h) / 2) + idx * 10);
    }
    return newL;
  });

  const nextLayers = [...targetDoc.layers, ...pastedLayers];
  const activeCanvas =
    targetDoc.history && targetDoc.history[targetDoc.historyIndex]
      ? targetDoc.history[targetDoc.historyIndex].canvas
      : targetDoc.canvas;

  const historyEntry = {
    canvas: activeCanvas,
    width: targetDoc.width,
    height: targetDoc.height,
    layers: nextLayers.map((l) => ({ ...l })),
    label: `Paste ${pastedLayers.length} Layer(s)`,
    timestamp: Date.now(),
  };

  const curHistory = targetDoc.history || [];
  const sliced = curHistory.slice(0, Math.max(0, targetDoc.historyIndex + 1));
  const nextHistory = [...sliced, historyEntry];

  return {
    ...targetDoc,
    layers: nextLayers,
    selectedLayerId: pastedLayers[pastedLayers.length - 1].id,
    selectedLayerIds: pastedLayers.map((l) => l.id),
    history: nextHistory,
    historyIndex: nextHistory.length - 1,
    isDirty: true,
    newLayerIds: pastedLayers.map((l) => l.id),
  };
}

