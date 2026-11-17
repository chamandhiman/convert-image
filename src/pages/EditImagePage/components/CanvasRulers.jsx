import { useState, useEffect, useRef, useMemo } from 'react';
import styles from './CanvasRulers.module.css';

/**
 * Pixel Rulers for Photoshop-style Central Canvas.
 * Renders crisp top horizontal and left vertical rulers with 10px sub-ticks,
 * 50px medium ticks, and 100px major tick marks with numeric pixel coordinates.
 */
export function CanvasRulers({
  width = 1200,
  height = 800,
  zoom = 1,
  pan = { x: 0, y: 0 },
}) {
  const [viewportDims, setViewportDims] = useState({ width: 0, height: 0 });
  const cornerRef = useRef(null);

  // Measure parent viewport dynamically using ResizeObserver
  useEffect(() => {
    const cornerEl = cornerRef.current;
    if (!cornerEl) return;
    const parent = cornerEl.parentElement;
    if (!parent) return;

    const updateDims = () => {
      setViewportDims({
        width: parent.clientWidth,
        height: parent.clientHeight,
      });
    };

    updateDims();
    const ro = new ResizeObserver(updateDims);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  // Generate ruler tick values from negative buffer to document boundaries plus buffer
  const maxW = Math.max(width, 2400);
  const maxH = Math.max(height, 2000);

  const horizontalTicks = useMemo(() => {
    const ticks = [];
    for (let x = -2000; x <= maxW + 2000; x += 10) {
      const isMajor = x % 100 === 0;
      const isMedium = x % 50 === 0 && !isMajor;
      ticks.push({ pos: x, isMajor, isMedium, label: isMajor ? String(x) : null });
    }
    return ticks;
  }, [maxW]);

  const verticalTicks = useMemo(() => {
    const ticks = [];
    for (let y = -2000; y <= maxH + 2000; y += 10) {
      const isMajor = y % 100 === 0;
      const isMedium = y % 50 === 0 && !isMajor;
      ticks.push({ pos: y, isMajor, isMedium, label: isMajor ? String(y) : null });
    }
    return ticks;
  }, [maxH]);

  // Compute exact origin so 0 coordinate aligns with canvas stage
  const originX = viewportDims.width > 0
    ? (viewportDims.width - 24 - width * zoom) / 2 + pan.x
    : pan.x;
  const originY = viewportDims.height > 0
    ? (viewportDims.height - 24 - height * zoom) / 2 + pan.y
    : pan.y;

  return (
    <>
      {/* Top-Left Corner Box */}
      <div ref={cornerRef} className={styles.cornerBox} title="Pixel Coordinate Origin (0, 0)">
        <span className={styles.cornerText}>px</span>
      </div>

      {/* Top Horizontal Ruler */}
      <div className={styles.topRulerWrap}>
        <div
          className={styles.topRulerTrack}
          style={{
            transform: `translateX(${originX}px) scaleX(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {horizontalTicks.map(({ pos, isMajor, isMedium, label }) => (
            <div
              key={`h-${pos}`}
              className={`${styles.tick} ${
                isMajor ? styles.majorTick : isMedium ? styles.mediumTick : styles.minorTick
              }`}
              style={{ left: `${pos}px` }}
            >
              {label !== null && <span className={styles.tickLabelH}>{label}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Left Vertical Ruler */}
      <div className={styles.leftRulerWrap}>
        <div
          className={styles.leftRulerTrack}
          style={{
            transform: `translateY(${originY}px) scaleY(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {verticalTicks.map(({ pos, isMajor, isMedium, label }) => (
            <div
              key={`v-${pos}`}
              className={`${styles.tickV} ${
                isMajor ? styles.majorTickV : isMedium ? styles.mediumTickV : styles.minorTickV
              }`}
              style={{ top: `${pos}px` }}
            >
              {label !== null && <span className={styles.tickLabelV}>{label}</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default CanvasRulers;

