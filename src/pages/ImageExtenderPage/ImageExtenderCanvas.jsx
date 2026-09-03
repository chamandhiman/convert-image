import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ImageExtenderCanvas.module.css';

/**
 * Interactive preview canvas for AI Image Extender.
 *
 * Displays the original image embedded inside the target expansion box, with
 * checkerboard indicators for the generated area, zoom controls, and pan/drag support.
 */
function ImageExtenderCanvas({
  imageSrc,
  originalWidth,
  originalHeight,
  padding = { left: 0, right: 0, top: 0, bottom: 0 },
}) {
  const containerRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const padLeft = Math.max(0, padding.left || 0);
  const padRight = Math.max(0, padding.right || 0);
  const padTop = Math.max(0, padding.top || 0);
  const padBottom = Math.max(0, padding.bottom || 0);

  const targetWidth = originalWidth + padLeft + padRight;
  const targetHeight = originalHeight + padTop + padBottom;

  // Compute fit-to-container zoom factor
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current || targetWidth <= 0 || targetHeight <= 0) return 1;

    const containerW = containerRef.current.clientWidth - 48;
    const containerH = containerRef.current.clientHeight - 48;

    const scaleX = containerW / targetWidth;
    const scaleY = containerH / targetHeight;
    const fitScale = Math.min(scaleX, scaleY, 1);

    return Math.max(0.1, Number(fitScale.toFixed(2)));
  }, [targetWidth, targetHeight]);

  // Fit to screen on initial load and resize
  const handleResetView = useCallback(() => {
    const fit = calculateFitZoom();
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  }, [calculateFitZoom]);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      handleResetView();
    });
    return () => cancelAnimationFrame(rafId);
  }, [handleResetView]);

  // Handle Pan / Drag
  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.15, Number((prev - 0.15).toFixed(2))));
  };

  const hasExpansion = padLeft > 0 || padRight > 0 || padTop > 0 || padBottom > 0;

  return (
    <div
      ref={containerRef}
      className={styles.canvasContainer}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role="region"
      aria-label="Image extension canvas preview"
    >
      <div className={styles.viewport}>
        {/* Virtual Extended Stage */}
        <div
          className={styles.stage}
          style={{
            width: `${targetWidth}px`,
            height: `${targetHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Extension Area (Grid Pattern) */}
          <div className={styles.extensionArea}>
            {hasExpansion && (
              <div className={styles.extensionBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>AI Generated Area ({targetWidth} × {targetHeight} px)</span>
              </div>
            )}
          </div>

          {/* Original Image Inside Target Canvas */}
          <div
            className={styles.originalBox}
            style={{
              left: `${padLeft}px`,
              top: `${padTop}px`,
              width: `${originalWidth}px`,
              height: `${originalHeight}px`,
            }}
          >
            <img
              src={imageSrc}
              alt="Original"
              className={styles.originalImg}
              draggable={false}
            />
            <span className={styles.originalBadge}>Original</span>
          </div>
        </div>
      </div>

      {/* Floating Canvas Toolbar */}
      <div className={styles.toolbar} role="toolbar" aria-label="Canvas zoom and pan controls">
        <button
          type="button"
          className={styles.toolBtn}
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom Out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>

        <button
          type="button"
          className={styles.toolBtn}
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom In"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <span className={styles.divider} aria-hidden="true" />

        <button
          type="button"
          className={styles.toolBtn}
          onClick={handleResetView}
          aria-label="Fit to screen"
          title="Fit to Screen"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ImageExtenderCanvas;
