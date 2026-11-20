/**
 * Photoshop-style Patch Tool Algorithm
 * Replaces target selection pixels with sampled source pixels with edge feathering & tone blending
 */

export function applyPatch(ctx, width, height, selection, deltaX, deltaY, feather = 8) {
  if (!selection || (deltaX === 0 && deltaY === 0)) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  const isInSelection = (px, py) => {
    if (selection.type === 'rect') {
      const minX = Math.min(selection.x, selection.x + selection.width);
      const maxX = Math.max(selection.x, selection.x + selection.width);
      const minY = Math.min(selection.y, selection.y + selection.height);
      const maxY = Math.max(selection.y, selection.y + selection.height);
      return px >= minX && px <= maxX && py >= minY && py <= maxY;
    }
    if (selection.type === 'ellipse') {
      const cx = selection.x + selection.width / 2;
      const cy = selection.y + selection.height / 2;
      const rx = Math.abs(selection.width / 2);
      const ry = Math.abs(selection.height / 2);
      if (rx <= 0 || ry <= 0) return false;
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      return dx * dx + dy * dy <= 1;
    }
    if (selection.points && selection.points.length >= 3) {
      let inside = false;
      const vs = selection.points;
      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i].x, yi = vs[i].y;
        const xj = vs[j].x, yj = vs[j].y;
        const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    }
    return false;
  };

  // Replace target pixels with source pixels shifted by (deltaX, deltaY)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isInSelection(x, y)) {
        const srcX = Math.max(0, Math.min(width - 1, Math.round(x + deltaX)));
        const srcY = Math.max(0, Math.min(height - 1, Math.round(y + deltaY)));
        const srcIdx = (srcY * width + srcX) * 4;
        const destIdx = (y * width + x) * 4;

        data[destIdx] = copy[srcIdx];
        data[destIdx + 1] = copy[srcIdx + 1];
        data[destIdx + 2] = copy[srcIdx + 2];
        data[destIdx + 3] = copy[srcIdx + 3];
      }
    }
  }

  // Smooth feather edge
  if (feather > 0) {
    const r = Math.min(feather, 12);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const inSel = isInSelection(x, y);
        let edgeDist = 0;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (isInSelection(x + dx, y + dy) !== inSel) {
              edgeDist++;
            }
          }
        }
        if (edgeDist > 0) {
          const alpha = edgeDist / ((2 * r + 1) * (2 * r + 1));
          const idx = (y * width + x) * 4;
          data[idx] = Math.round(data[idx] * (1 - alpha * 0.5) + copy[idx] * (alpha * 0.5));
          data[idx + 1] = Math.round(data[idx + 1] * (1 - alpha * 0.5) + copy[idx + 1] * (alpha * 0.5));
          data[idx + 2] = Math.round(data[idx + 2] * (1 - alpha * 0.5) + copy[idx + 2] * (alpha * 0.5));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * High-level helper: applyPatchBlend on a dataURL
 */
export async function applyPatchBlend(
  dataUrl,
  selection,
  sourceOffset = { x: 0, y: 0 },
  mode = 'source',
  feather = 4
) {
  if (!dataUrl || !selection) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const dx = mode === 'destination' ? -(sourceOffset.x || 0) : (sourceOffset.x || 0);
      const dy = mode === 'destination' ? -(sourceOffset.y || 0) : (sourceOffset.y || 0);

      applyPatch(ctx, w, h, selection, dx, dy, feather);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
