/**
 * Drag and Drop Isolation Helpers
 *
 * Distinguishes external file drags (e.g. dragging images from the desktop/OS)
 * from internal application drag operations (e.g. reordering layers in the Layers panel).
 */

export function isExternalFileDrag(e) {
  if (!e || !e.dataTransfer) return false;

  // 1. Explicit window-level internal drag flag (active during internal layer reordering)
  if (typeof window !== 'undefined' && window.__isInternalLayerDrag) {
    return false;
  }

  const dt = e.dataTransfer;
  const types = Array.from(dt.types || []);

  // 2. Reject internal application drag identifiers
  if (
    types.includes('application/x-image-editor-layer') ||
    types.includes('application/x-layer-drag') ||
    types.includes('application/x-layer-reorder')
  ) {
    return false;
  }

  // 3. External file drops MUST have 'Files' in dataTransfer.types
  if (!types.includes('Files')) {
    return false;
  }

  // 4. If items are populated, at least one item must have kind === 'file'
  if (dt.items && dt.items.length > 0) {
    const hasRealFile = Array.from(dt.items).some((item) => item.kind === 'file');
    if (!hasRealFile) {
      return false;
    }
  }

  return true;
}

/**
 * Safely extracts File objects from a DragEvent's dataTransfer.
 * Checks both dataTransfer.files and dataTransfer.items (with item.getAsFile()).
 *
 * @param {DragEvent} e
 * @returns {File[]}
 */
export function extractFilesFromEvent(e) {
  if (!e || !e.dataTransfer) return [];
  const dt = e.dataTransfer;

  if (dt.files && dt.files.length > 0) {
    return Array.from(dt.files);
  }

  if (dt.items && dt.items.length > 0) {
    const list = [];
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (item.kind === 'file') {
        const file = typeof item.getAsFile === 'function' ? item.getAsFile() : null;
        if (file) list.push(file);
      }
    }
    if (list.length > 0) return list;
  }

  return [];
}

