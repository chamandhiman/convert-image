/**
 * Vector Path Utilities for Photoshop-style Pen Tool & Vector Shape Node Editing
 */

/**
 * Generate an SVG path `d` string from a sequence of anchor points with Bézier handles.
 *
 * @param {Array<{ x: number, y: number, cp1?: { x: number, y: number }, cp2?: { x: number, y: number } }>} points
 * @param {boolean} closed
 * @returns {string} SVG path string
 */
export function generateSvgPath(points, closed = true) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${Math.round(points[0].x)} ${Math.round(points[0].y)}`;

  let d = `M ${Math.round(points[0].x)} ${Math.round(points[0].y)} `;

  const numSegments = closed ? points.length : points.length - 1;

  for (let i = 0; i < numSegments; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const hasCp2 = Boolean(p1.cp2 && (p1.cp2.x !== p1.x || p1.cp2.y !== p1.y));
    const hasCp1 = Boolean(p2.cp1 && (p2.cp1.x !== p2.x || p2.cp1.y !== p2.y));

    if (hasCp2 && hasCp1) {
      d += `C ${Math.round(p1.cp2.x)} ${Math.round(p1.cp2.y)}, ${Math.round(p2.cp1.x)} ${Math.round(p2.cp1.y)}, ${Math.round(p2.x)} ${Math.round(p2.y)} `;
    } else if (hasCp2) {
      d += `C ${Math.round(p1.cp2.x)} ${Math.round(p1.cp2.y)}, ${Math.round(p2.x)} ${Math.round(p2.y)}, ${Math.round(p2.x)} ${Math.round(p2.y)} `;
    } else if (hasCp1) {
      d += `C ${Math.round(p1.x)} ${Math.round(p1.y)}, ${Math.round(p2.cp1.x)} ${Math.round(p2.cp1.y)}, ${Math.round(p2.x)} ${Math.round(p2.y)} `;
    } else {
      d += `L ${Math.round(p2.x)} ${Math.round(p2.y)} `;
    }
  }

  if (closed) {
    d += 'Z';
  }

  return d.trim();
}

/**
 * Sample points along curves to create a high-fidelity polygon for selection / raster clipping.
 */
export function samplePolygonFromPoints(points, closed = true, steps = 8) {
  if (!points || points.length === 0) return [];
  if (points.length < 3 && closed) return points;

  const result = [];
  const numSegments = closed ? points.length : points.length - 1;

  for (let i = 0; i < numSegments; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const hasCp2 = Boolean(p1.cp2 && (p1.cp2.x !== p1.x || p1.cp2.y !== p1.y));
    const hasCp1 = Boolean(p2.cp1 && (p2.cp1.x !== p2.x || p2.cp1.y !== p2.y));

    if (hasCp2 || hasCp1) {
      const c1x = hasCp2 ? p1.cp2.x : p1.x;
      const c1y = hasCp2 ? p1.cp2.y : p1.y;
      const c2x = hasCp1 ? p2.cp1.x : p2.x;
      const c2y = hasCp1 ? p2.cp1.y : p2.y;

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const mt = 1 - t;
        const x = mt * mt * mt * p1.x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * p2.x;
        const y = mt * mt * mt * p1.y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * p2.y;
        result.push({ x: Math.round(x), y: Math.round(y) });
      }
    } else {
      result.push({ x: Math.round(p1.x), y: Math.round(p1.y) });
    }
  }

  if (!closed && points.length > 0) {
    const last = points[points.length - 1];
    result.push({ x: Math.round(last.x), y: Math.round(last.y) });
  }

  return result;
}

/**
 * Find the closest point on segment i -> (i+1) to (px, py).
 */
export function findClosestSegment(points, px, py, closed = true, threshold = 10) {
  if (!points || points.length < 2) return null;

  const numSegments = closed ? points.length : points.length - 1;
  let closest = null;
  let minDistance = threshold;

  for (let i = 0; i < numSegments; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) continue;

    let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq;
    t = Math.max(0.05, Math.min(0.95, t));

    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    const dist = Math.hypot(px - projX, py - projY);

    if (dist < minDistance) {
      minDistance = dist;
      closest = {
        segmentIndex: i,
        insertIndex: i + 1,
        projectedX: Math.round(projX),
        projectedY: Math.round(projY),
        t,
        distance: dist,
      };
    }
  }

  return closest;
}

/**
 * Convert a standard shape layer (rect, circle, triangle, etc.) to editable vector points.
 */
export function convertShapeLayerToVectorPoints(layer) {
  const w = layer.width || 100;
  const h = layer.height || 100;
  const shapeType = layer.shapeType || 'rect';

  if (layer.points && layer.points.length >= 3) {
    return layer.points;
  }

  if (shapeType === 'triangle') {
    return [
      { x: Math.round(w / 2), y: 0, type: 'corner' },
      { x: w, y: h, type: 'corner' },
      { x: 0, y: h, type: 'corner' },
    ];
  }

  if (shapeType === 'circle' || shapeType === 'ellipse') {
    // 4 points with Bézier handles to form a perfect circle/ellipse (kappa = 0.5522847498)
    const k = 0.5522847498;
    const rx = w / 2;
    const ry = h / 2;
    const cx = rx;
    const cy = ry;

    return [
      {
        x: cx,
        y: 0,
        type: 'smooth',
        cp1: { x: cx - rx * k, y: 0 },
        cp2: { x: cx + rx * k, y: 0 },
      },
      {
        x: w,
        y: cy,
        type: 'smooth',
        cp1: { x: w, y: cy - ry * k },
        cp2: { x: w, y: cy + ry * k },
      },
      {
        x: cx,
        y: h,
        type: 'smooth',
        cp1: { x: cx + rx * k, y: h },
        cp2: { x: cx - rx * k, y: h },
      },
      {
        x: 0,
        y: cy,
        type: 'smooth',
        cp1: { x: 0, y: cy + ry * k },
        cp2: { x: 0, y: cy - ry * k },
      },
    ];
  }

  // Default: Rectangle / Rounded-rect / Polygon 4 corners
  return [
    { x: 0, y: 0, type: 'corner' },
    { x: w, y: 0, type: 'corner' },
    { x: w, y: h, type: 'corner' },
    { x: 0, y: h, type: 'corner' },
  ];
}

