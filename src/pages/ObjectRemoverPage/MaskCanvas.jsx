import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import styles from './MaskCanvas.module.css';

/**
 * MaskCanvas — Premium interactive mask editor for AI object removal.
 *
 * Tools: Brush, Eraser, Lasso, Rectangle
 * Features: Zoom/Pan (mouse-wheel), Pinch-to-zoom, Hardness, Undo/Redo history,
 *           Fit View, touch+mouse support, circular brush cursor.
 */
const MaskCanvas = forwardRef(function MaskCanvas(
  { imageSrc, imageWidth, imageHeight, onMaskChange, onRemoveObject, isProcessing = false },
  ref
) {
  const [brushSize, setBrushSize] = useState(32);
  const [activeTool, setActiveTool] = useState('brush');
  const [localHardness, setLocalHardness] = useState(80);
  const [cursorPos, setCursorPos] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);

  // Lasso
  const lassoPointsRef = useRef([]);
  const isLassoActiveRef = useRef(false);
  const lassoCanvasRef = useRef(null);

  // Rectangle
  const rectStartRef = useRef(null);
  const isRectActiveRef = useRef(false);

  // Pinch
  const lastPinchDistRef = useRef(null);

  // History stack
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  /* ------------------------------------------------------------------ */
  /*  History Management                                                 */
  /* ------------------------------------------------------------------ */
  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(imageData);
    if (historyRef.current.length > 30) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
    onMaskChange?.(true);
  }, [onMaskChange]);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    onMaskChange?.(true);
  }, [onMaskChange]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    onMaskChange?.(true);
  }, [onMaskChange]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  }, [saveHistory]);

  /* ------------------------------------------------------------------ */
  /*  Expose imperative API to parent                                    */
  /* ------------------------------------------------------------------ */
  useImperativeHandle(ref, () => ({
    getMaskCanvas: () => canvasRef.current,
    /** Copy current mask data to a new canvas of target dimensions (for Edit Again). */
    getMaskDataURL: () => canvasRef.current?.toDataURL('image/png') ?? null,
    /** Restore mask from a dataURL (for Edit Again). */
    restoreMaskFromDataURL: (dataURL, targetW, targetH) => {
      const canvas = canvasRef.current;
      if (!canvas || !dataURL) return;
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0, targetW ?? canvas.width, targetH ?? canvas.height);
        saveHistory();
      };
      img.src = dataURL;
    },
    clearMask: handleClear,
    undo: handleUndo,
    redo: handleRedo,
    getCanUndo: () => canUndo,
    getCanRedo: () => canRedo,
  }), [handleClear, handleUndo, handleRedo, canUndo, canRedo, saveHistory]);

  /* ------------------------------------------------------------------ */
  /*  Canvas Initialisation (only when dimensions change)               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageWidth || !imageHeight) return;
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, imageWidth, imageHeight);
    const initial = ctx.getImageData(0, 0, imageWidth, imageHeight);
    historyRef.current = [initial];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    setZoom(1);
  }, [imageWidth, imageHeight]);

  /* ------------------------------------------------------------------ */
  /*  Keyboard Shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const onKey = (e) => {
      // Only fire if focus is not inside an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const isMeta = e.ctrlKey || e.metaKey;
      if (!isMeta) return;
      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) { e.preventDefault(); handleRedo(); }
        else            { e.preventDefault(); handleUndo(); }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault(); handleRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  /* ------------------------------------------------------------------ */
  /*  Coordinate mapping                                                 */
  /* ------------------------------------------------------------------ */
  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, clientX: 0, clientY: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const rawX = e.touches ? e.touches[0].clientX : e.clientX;
    const rawY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (rawX - rect.left) * scaleX,
      y: (rawY - rect.top) * scaleY,
      clientX: rawX - rect.left,
      clientY: rawY - rect.top,
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Brush drawing helpers                                              */
  /* ------------------------------------------------------------------ */
  const drawBrushPoint = useCallback((ctx, x, y) => {
    const r = brushSize / 2;
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const hardnessFraction = localHardness / 100;
      const innerRadius = r * hardnessFraction;
      ctx.globalCompositeOperation = 'source-over';
      const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, r);
      gradient.addColorStop(0, 'rgba(255, 0, 110, 0.60)');
      gradient.addColorStop(1, 'rgba(255, 0, 110, 0)');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }, [activeTool, brushSize, localHardness]);

  const drawBrushStroke = useCallback((ctx, from, to) => {
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / (brushSize * 0.2)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      drawBrushPoint(ctx, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    }
  }, [brushSize, drawBrushPoint]);

  /* ------------------------------------------------------------------ */
  /*  Pointer Events — Brush / Eraser / Lasso / Rect                    */
  /* ------------------------------------------------------------------ */
  const handlePointerDown = (e) => {
    e.preventDefault();

    if (activeTool === 'lasso') {
      isLassoActiveRef.current = true;
      lassoPointsRef.current = [getCanvasCoords(e)];
      return;
    }
    if (activeTool === 'rect') {
      isRectActiveRef.current = true;
      rectStartRef.current = getCanvasCoords(e);
      return;
    }

    isDrawingRef.current = true;
    try { canvasRef.current?.setPointerCapture(e.pointerId); } catch { /* ok */ }
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawBrushPoint(ctx, coords.x, coords.y);
    setCursorPos({ x: coords.clientX, y: coords.clientY });
  };

  const handlePointerMove = (e) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setCursorPos({ x: coords.clientX, y: coords.clientY });

    if (activeTool === 'lasso' && isLassoActiveRef.current) {
      lassoPointsRef.current.push(coords);
      drawLassoPreview();
      return;
    }
    if (activeTool === 'rect' && isRectActiveRef.current) {
      drawRectPreview(coords);
      return;
    }
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && lastPointRef.current) drawBrushStroke(ctx, lastPointRef.current, coords);
    lastPointRef.current = coords;
  };

  const handlePointerUp = (e) => {
    if (activeTool === 'lasso' && isLassoActiveRef.current) {
      isLassoActiveRef.current = false;
      commitLasso();
      return;
    }
    if (activeTool === 'rect' && isRectActiveRef.current) {
      isRectActiveRef.current = false;
      commitRect(getCanvasCoords(e));
      return;
    }
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    try { canvasRef.current?.releasePointerCapture(e.pointerId); } catch { /* ok */ }
    saveHistory();
  };

  const handlePointerLeave = () => {
    setCursorPos(null);
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      saveHistory();
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Lasso                                                              */
  /* ------------------------------------------------------------------ */
  const drawLassoPreview = () => {
    const overlay = lassoCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    const pts = lassoPointsRef.current;
    if (pts.length < 2) return;
    ctx.strokeStyle = 'rgba(255, 220, 0, 0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const commitLasso = () => {
    const overlay = lassoCanvasRef.current;
    if (overlay) overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
    const pts = lassoPointsRef.current;
    if (pts.length < 3) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 0, 110, 0.55)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
    lassoPointsRef.current = [];
    saveHistory();
  };

  /* ------------------------------------------------------------------ */
  /*  Rectangle                                                          */
  /* ------------------------------------------------------------------ */
  const drawRectPreview = (current) => {
    const overlay = lassoCanvasRef.current;
    if (!overlay || !rectStartRef.current) return;
    const ctx = overlay.getContext('2d');
    const start = rectStartRef.current;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.strokeStyle = 'rgba(255, 220, 0, 0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(
      Math.min(start.x, current.x), Math.min(start.y, current.y),
      Math.abs(current.x - start.x), Math.abs(current.y - start.y)
    );
    ctx.setLineDash([]);
  };

  const commitRect = (end) => {
    const overlay = lassoCanvasRef.current;
    if (overlay) overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
    const start = rectStartRef.current;
    if (!start) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 0, 110, 0.55)';
    ctx.fillRect(
      Math.min(start.x, end.x), Math.min(start.y, end.y),
      Math.abs(end.x - start.x), Math.abs(end.y - start.y)
    );
    rectStartRef.current = null;
    saveHistory();
  };

  /* ------------------------------------------------------------------ */
  /*  Zoom (wheel + pinch)                                               */
  /* ------------------------------------------------------------------ */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom(z => Math.min(8, Math.max(0.25, z * delta)));
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistRef.current = Math.hypot(dx, dy);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist / lastPinchDistRef.current;
      lastPinchDistRef.current = dist;
      setZoom(z => Math.min(8, Math.max(0.25, z * delta)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistRef.current = null;
  }, []);

  const handleFitView = useCallback(() => {
    setZoom(1);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Display scale for brush cursor size                                */
  /* ------------------------------------------------------------------ */
  const [displayScale, setDisplayScale] = useState(1);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !imageWidth) return;
    const update = () => {
      if (el.clientWidth && imageWidth) {
        setDisplayScale((el.clientWidth / imageWidth) * zoom);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageWidth, zoom]);

  const cursorDiameter = Math.max(8, brushSize * displayScale);
  const showCursor = cursorPos !== null && (activeTool === 'brush' || activeTool === 'eraser');

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className={styles.editorWrap}>
      {/* Toolbar */}
      <div className={styles.toolbar} role="toolbar" aria-label="Mask editing tools">
        {/* GROUP 1: TOOLS */}
        <div className={styles.toolSection}>
          <span className={styles.sectionLabel}>Tools</span>
          <div className={styles.toolGroup} role="radiogroup" aria-label="Select tool">
            {[
              {
                id: 'brush', label: 'Brush', title: 'Brush (paint mask freehand)',
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                    <path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
                  </svg>
                ),
              },
              {
                id: 'eraser', label: 'Eraser', title: 'Eraser (remove painted mask)',
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/><path d="M6.0001 11.0001L13 18"/>
                  </svg>
                ),
              },
              {
                id: 'lasso', label: 'Lasso', title: 'Lasso (draw freehand area)',
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a9 9 0 0 0-9 9c0 4.17 2.84 7.67 6.69 8.69"/><path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-2.31 6.08"/>
                    <path d="M12 8a4 4 0 0 0-4 4 4 4 0 0 0 4 4"/>
                  </svg>
                ),
              },
              {
                id: 'rect', label: 'Rectangle', title: 'Rectangle (drag box selection)',
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                ),
              },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={activeTool === t.id}
                className={`${styles.toolModeBtn} ${activeTool === t.id ? styles.toolModeBtnActive : ''}`}
                onClick={() => setActiveTool(t.id)}
                title={t.title}
                aria-label={t.title}
              >
                {t.icon}
                <span className={styles.toolBtnLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.toolbarDivider} aria-hidden="true" />

        {/* GROUP 2: SETTINGS (Size & Hardness) */}
        <div className={styles.settingsSection}>
          {(activeTool === 'brush' || activeTool === 'eraser') ? (
            <div className={styles.brushControls}>
              <div className={styles.sliderGroup}>
                <label htmlFor="brush-size-slider" className={styles.brushLabel}>
                  Size <span className={styles.brushVal}>{brushSize}px</span>
                </label>
                <input
                  id="brush-size-slider"
                  type="range" min="4" max="200" value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                  className={styles.brushSlider}
                  aria-label="Brush size"
                />
              </div>
              {activeTool === 'brush' && (
                <div className={styles.sliderGroup}>
                  <label htmlFor="brush-hardness-slider" className={styles.brushLabel}>
                    Hardness <span className={styles.brushVal}>{localHardness}%</span>
                  </label>
                  <input
                    id="brush-hardness-slider"
                    type="range" min="0" max="100" value={localHardness}
                    onChange={(e) => setLocalHardness(parseInt(e.target.value, 10))}
                    className={styles.brushSlider}
                    aria-label="Brush hardness"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className={styles.selectionModeNotice}>
              <span>{activeTool === 'lasso' ? 'Draw around the object to select it' : 'Drag a box over the object to select it'}</span>
            </div>
          )}
        </div>

        <div className={styles.toolbarDivider} aria-hidden="true" />

        {/* GROUP 3: EDIT / HISTORY */}
        <div className={styles.historySection}>
          <div className={styles.actionButtons}>
            <button type="button" className={styles.toolBtn} onClick={handleUndo}
              disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo last stroke">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
              <span>Undo</span>
            </button>
            <button type="button" className={styles.toolBtn} onClick={handleRedo}
              disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Redo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
              </svg>
              <span>Redo</span>
            </button>
            <button type="button" className={styles.toolBtn} onClick={handleClear}
              title="Clear all mask paint" aria-label="Clear mask">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              <span>Clear</span>
            </button>
            <button type="button" className={styles.toolBtn} onClick={handleFitView}
              title="Fit to view (reset zoom)" aria-label="Fit view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4"/>
              </svg>
              <span>Fit</span>
            </button>
          </div>
        </div>

        {/* GROUP 4: PRIMARY ACTION (Desktop) */}
        {onRemoveObject && (
          <div className={styles.primaryActionSection}>
            <button
              type="button"
              className={styles.btnRemoveObjectToolbar}
              onClick={onRemoveObject}
              disabled={isProcessing}
              aria-label="Remove the selected object with AI"
            >
              <span className={styles.magicSparkle} aria-hidden="true">✨</span>
              <span>Remove Object</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile-only Primary Action Bar (above canvas) */}
      {onRemoveObject && (
        <div className={styles.mobileActionBar}>
          <button
            type="button"
            className={styles.btnRemoveObjectMobile}
            onClick={onRemoveObject}
            disabled={isProcessing}
            aria-label="Remove the selected object with AI"
          >
            <span className={styles.magicSparkle} aria-hidden="true">✨</span>
            <span>Remove Object</span>
          </button>
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        ref={wrapperRef}
        className={styles.canvasViewport}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={containerRef}
          className={styles.canvasContainer}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          onPointerLeave={handlePointerLeave}
        >
          {/* Base Image */}
          <img
            src={imageSrc}
            alt="Edit: paint over the object to remove"
            className={styles.baseImage}
            draggable={false}
          />

          {/* Mask Canvas */}
          <canvas
            ref={canvasRef}
            className={styles.maskCanvas}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          {/* Lasso/Rect preview overlay */}
          <canvas
            ref={lassoCanvasRef}
            className={styles.lassoOverlay}
            width={imageWidth}
            height={imageHeight}
          />

          {/* Circular brush cursor */}
          {showCursor && (
            <div
              className={`${styles.brushCursor} ${activeTool === 'eraser' ? styles.eraserCursor : ''}`}
              style={{ left: cursorPos.x, top: cursorPos.y, width: cursorDiameter, height: cursorDiameter }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      <p className={styles.paintInstruction}>
        {activeTool === 'brush'   && 'Paint generously over the entire object — the more coverage, the better the result.'}
        {activeTool === 'eraser'  && 'Erase areas you painted by mistake.'}
        {activeTool === 'lasso'   && 'Draw around the object and release to fill the selection.'}
        {activeTool === 'rect'    && 'Drag a rectangle over the object.'}
      </p>
    </div>
  );
});

export default MaskCanvas;
