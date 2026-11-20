/**
 * Photoshop-style Pixel Selection & Masking Utilities
 */

/**
 * Check if a 2D point is inside a polygon
 */
export function isPointInPolygon([x, y], vs) {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const pointInPolygon = isPointInPolygon;

/**
 * Magic Wand Flood Fill by color tolerance
 * Supports:
 * - magicWandSelect(ctx, startX, startY, tolerance)
 * - magicWandSelect(ctx, width, height, startX, startY, tolerance)
 */
export function magicWandSelect(ctx, arg2, arg3, arg4, arg5, arg6) {
  let width, height, startX, startY, tolerance;

  if (typeof arg5 === 'number' || typeof arg6 === 'number') {
    width = arg2;
    height = arg3;
    startX = arg4;
    startY = arg5;
    tolerance = arg6 ?? 32;
  } else {
    width = ctx.canvas?.width || 800;
    height = ctx.canvas?.height || 600;
    startX = arg2;
    startY = arg3;
    tolerance = arg4 ?? 32;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const mask = new Uint8Array(width * height);

  const sx = Math.max(0, Math.min(width - 1, Math.round(startX)));
  const sy = Math.max(0, Math.min(height - 1, Math.round(startY)));
  const startIdx = (sy * width + sx) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  const queue = [sx, sy];
  mask[sy * width + sx] = 1;
  const tolSq = tolerance * tolerance * 3;

  let minX = sx, maxX = sx, minY = sy, maxY = sy;

  while (queue.length > 0) {
    const cy = queue.pop();
    const cx = queue.pop();

    if (cx < minX) minX = cx;
    if (cx > maxX) maxX = cx;
    if (cy < minY) minY = cy;
    if (cy > maxY) maxY = cy;

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (mask[nIdx] === 0) {
          const pIdx = nIdx * 4;
          const dr = data[pIdx] - targetR;
          const dg = data[pIdx + 1] - targetG;
          const db = data[pIdx + 2] - targetB;
          const da = data[pIdx + 3] - targetA;
          const distSq = dr * dr + dg * dg + db * db + da * da;

          if (distSq <= tolSq) {
            mask[nIdx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Extract boundary polygon points
  const points = [];
  const step = Math.max(2, Math.round(Math.max(maxX - minX, maxY - minY) / 60));
  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      if (mask[y * width + x] === 1) {
        // Check if edge
        const isEdge =
          x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
          mask[y * width + (x - 1)] === 0 || mask[y * width + (x + 1)] === 0 ||
          mask[(y - 1) * width + x] === 0 || mask[(y + 1) * width + x] === 0;
        if (isEdge) {
          points.push({ x, y });
        }
      }
    }
  }

  if (points.length < 3) {
    points.push({ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY });
  }

  return {
    mask,
    points,
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Delete pixels on a canvas inside an active selection
 */
export function deletePixelsInSelection(ctx, width, height, selection) {
  if (!selection) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  if (selection.type === 'rect') {
    const { x, y, width: w, height: h } = selection;
    const minX = Math.max(0, Math.min(Math.round(x), Math.round(x + w)));
    const maxX = Math.min(width, Math.max(Math.round(x), Math.round(x + w)));
    const minY = Math.max(0, Math.min(Math.round(y), Math.round(y + h)));
    const maxY = Math.min(height, Math.max(Math.round(y), Math.round(y + h)));

    for (let cy = minY; cy < maxY; cy++) {
      for (let cx = minX; cx < maxX; cx++) {
        const idx = (cy * width + cx) * 4;
        data[idx + 3] = 0;
      }
    }
  } else if (selection.type === 'ellipse') {
    const cx = selection.x + selection.width / 2;
    const cy = selection.y + selection.height / 2;
    const rX = Math.abs(selection.width / 2);
    const rY = Math.abs(selection.height / 2);
    if (rX <= 0 || rY <= 0) return;

    const minX = Math.max(0, Math.floor(cx - rX));
    const maxX = Math.min(width, Math.ceil(cx + rX));
    const minY = Math.max(0, Math.floor(cy - rY));
    const maxY = Math.min(height, Math.ceil(cy + rY));

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const dx = (x - cx) / rX;
        const dy = (y - cy) / rY;
        if (dx * dx + dy * dy <= 1) {
          const idx = (y * width + x) * 4;
          data[idx + 3] = 0;
        }
      }
    }
  } else if (selection.type === 'lasso' || selection.type === 'polygon') {
    const points = selection.points || [];
    if (points.length < 3) return;

    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    minX = Math.max(0, Math.floor(minX));
    maxX = Math.min(width, Math.ceil(maxX));
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(height, Math.ceil(maxY));

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        if (isPointInPolygon([x, y], points)) {
          const idx = (y * width + x) * 4;
          data[idx + 3] = 0;
        }
      }
    }
  } else if (selection.type === 'wand' && selection.mask) {
    const mask = selection.mask;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 1) {
        data[i * 4 + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * High-level helper: Delete pixels inside selection from a dataURL
 */
export async function deletePixelsInsideSelection(
  dataUrl,
  selection,
  layerPos = { x: 0, y: 0 },
  layerSize = null,
  feather = 0
) {
  if (!dataUrl || !selection) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = layerSize?.width || img.naturalWidth || img.width;
      const h = layerSize?.height || img.naturalHeight || img.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      // Translate selection coordinates to be local to this layer
      const localSelection = {
        ...selection,
        x: (selection.x || 0) - (layerPos.x || 0),
        y: (selection.y || 0) - (layerPos.y || 0),
        points: selection.points
          ? selection.points.map((p) => ({
            x: p.x - (layerPos.x || 0),
            y: p.y - (layerPos.y || 0),
          }))
          : undefined,
      };

      deletePixelsInSelection(ctx, w, h, localSelection);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Extract pixels inside an active selection into a transparent PNG dataUrl
 */
export async function extractPixelsFromSelection(
  dataUrl,
  selection,
  layerPos = { x: 0, y: 0 },
  layerSize = null
) {
  if (!dataUrl || !selection) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origW = layerSize?.width || img.naturalWidth || img.width;
      const origH = layerSize?.height || img.naturalHeight || img.height;

      const selX = Math.round(selection.x ?? 0);
      const selY = Math.round(selection.y ?? 0);
      const selW = Math.max(1, Math.round(selection.width ?? 1));
      const selH = Math.max(1, Math.round(selection.height ?? 1));

      const lX = Math.round(layerPos.x ?? 0);
      const lY = Math.round(layerPos.y ?? 0);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = selW;
      outCanvas.height = selH;
      const outCtx = outCanvas.getContext('2d');

      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = origW;
      fullCanvas.height = origH;
      const fullCtx = fullCanvas.getContext('2d');
      fullCtx.drawImage(img, 0, 0, origW, origH);

      const relX = selX - lX;
      const relY = selY - lY;

      outCtx.drawImage(fullCanvas, relX, relY, selW, selH, 0, 0, selW, selH);

      if (selection.type === 'ellipse') {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = selW;
        maskCanvas.height = selH;
        const mCtx = maskCanvas.getContext('2d');
        mCtx.fillStyle = '#000000';
        mCtx.beginPath();
        mCtx.ellipse(selW / 2, selH / 2, selW / 2, selH / 2, 0, 0, Math.PI * 2);
        mCtx.fill();

        outCtx.globalCompositeOperation = 'destination-in';
        outCtx.drawImage(maskCanvas, 0, 0);
      } else if (selection.type === 'lasso' || selection.type === 'polygon') {
        const points = selection.points || [];
        if (points.length >= 3) {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = selW;
          maskCanvas.height = selH;
          const mCtx = maskCanvas.getContext('2d');
          mCtx.fillStyle = '#000000';
          mCtx.beginPath();
          points.forEach((p, idx) => {
            const px = p.x - selX;
            const py = p.y - selY;
            if (idx === 0) mCtx.moveTo(px, py);
            else mCtx.lineTo(px, py);
          });
          mCtx.closePath();
          mCtx.fill();

          outCtx.globalCompositeOperation = 'destination-in';
          outCtx.drawImage(maskCanvas, 0, 0);
        }
      }

      resolve({
        dataUrl: outCanvas.toDataURL('image/png'),
        width: selW,
        height: selH,
        x: selX,
        y: selY,
      });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
