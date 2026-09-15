import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import styles from './GenerativeFillCanvas.module.css';

/**
 * Interactive Selection Canvas for AI Generative Fill.
 *
 * Supports Brush, Eraser, Lasso, and Rectangle selection modes, Undo/Redo history,
 * keyboard shortcuts (Ctrl+Z, Ctrl+Y), zoom (25% to 300%), and pan/drag navigation.
 */
const GenerativeFillCanvas = forwardRef(function GenerativeFillCanvas(
  {
    imageSrc,
    originalWidth,
    originalHeight,
    activeTool = 'brush', // 'brush' | 'eraser' | 'lasso' | 'rect' | 'pan'
    brushSize = 32,
    brushHardness = 80,
    onHistoryChange,
  },
  ref
) {
  const containerRef = useRef(null);
  const maskCanvasRef = useRef(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef(null);
  const lassoPointsRef = useRef([]);
  const rectStartRef = useRef(null);

  // Undo / Redo history
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  // Save canvas state to history stack
  const saveHistory = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Truncate redo stack
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(imageData);
    historyIndexRef.current = historyRef.current.length - 1;

    onHistoryChange?.({
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    });
  }, [onHistoryChange]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0 && maskCanvasRef.current) {
      historyIndexRef.current--;
      const ctx = maskCanvasRef.current.getContext('2d');
      ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);

      onHistoryChange?.({
        canUndo: historyIndexRef.current > 0,
        canRedo: historyIndexRef.current < historyRef.current.length - 1,
      });
    }
  }, [onHistoryChange]);

  // Redo
  const handleRedo = useCallback(() => {
    if (
      historyIndexRef.current < historyRef.current.length - 1 &&
      maskCanvasRef.current
    ) {
      historyIndexRef.current++;
      const ctx = maskCanvasRef.current.getContext('2d');
      ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);

      onHistoryChange?.({
        canUndo: historyIndexRef.current > 0,
        canRedo: historyIndexRef.current < historyRef.current.length - 1,
      });
    }
  }, [onHistoryChange]);

  // Clear mask
  const handleClearSelection = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    saveHistory();
  }, [saveHistory]);

  // Expose methods to parent
  useImperativeHandle(
    ref,
    () => ({
      getMaskCanvas: () => maskCanvasRef.current,
      hasMask: () => {
        if (!maskCanvasRef.current) return false;
        const ctx = maskCanvasRef.current.getContext('2d');
        const data = ctx.getImageData(
          0,
          0,
          maskCanvasRef.current.width,
          maskCanvasRef.current.height
        ).data;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 10) return true;
        }
        return false;
      },
      getFullImageMask: () => {
        if (!maskCanvasRef.current) return null;
        const w = maskCanvasRef.current.width;
        const h = maskCanvasRef.current.height;
        const full = document.createElement('canvas');
        full.width = w;
        full.height = h;
        const ctx = full.getContext('2d');
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillRect(0, 0, w, h);
        return full;
      },
      clearMask: () => {
        handleClearSelection();
      },
      undo: () => {
        handleUndo();
      },
      redo: () => {
        handleRedo();
      },
    }),
    [handleClearSelection, handleUndo, handleRedo]
  );

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Calculate fit-to-screen zoom
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current || originalWidth <= 0 || originalHeight <= 0) return 1;

    const containerW = containerRef.current.clientWidth - 48;
    const containerH = containerRef.current.clientHeight - 48;

    const scaleX = containerW / originalWidth;
    const scaleY = containerH / originalHeight;
    const fitScale = Math.min(scaleX, scaleY, 1);

    return Math.max(0.1, Number(fitScale.toFixed(2)));
  }, [originalWidth, originalHeight]);

  const handleResetView = useCallback(() => {
    const fit = calculateFitZoom();
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  }, [calculateFitZoom]);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      handleResetView();
      if (maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, originalWidth, originalHeight);
        historyRef.current = [];
        historyIndexRef.current = -1;
        saveHistory();
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [handleResetView, originalWidth, originalHeight, saveHistory]);

  // Convert client viewport coordinates to canvas pixel space
  const getCanvasCoords = (e) => {
    if (!maskCanvasRef.current) return { x: 0, y: 0 };
    const rect = maskCanvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * originalWidth;
    const y = ((clientY - rect.top) / rect.height) * originalHeight;

    return {
      x: Math.max(0, Math.min(originalWidth, x)),
      y: Math.max(0, Math.min(originalHeight, y)),
    };
  };

  // Pointer Down handler
  const handlePointerDown = (e) => {
    if (activeTool === 'pan' || e.button === 1 || e.spaceKey) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      };
      return;
    }

    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;

    if (activeTool === 'brush' || activeTool === 'eraser') {
      drawBrushPoint(coords.x, coords.y);
    } else if (activeTool === 'lasso') {
      lassoPointsRef.current = [coords];
    } else if (activeTool === 'rect') {
      rectStartRef.current = coords;
    }
  };

  // Draw smooth brush point
  const drawBrushPoint = (x, y) => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');

    ctx.save();
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(99, 102, 241, 0.75)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.75)';
      ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
      ctx.shadowBlur = brushHardness < 80 ? 8 : 2;
    }

    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Pointer Move handler
  const handlePointerMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (!isDrawing || !maskCanvasRef.current) return;

    const coords = getCanvasCoords(e);
    const ctx = maskCanvasRef.current.getContext('2d');

    if (activeTool === 'brush' || activeTool === 'eraser') {
      ctx.save();
      if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.75)';
        ctx.fillStyle = 'rgba(99, 102, 241, 0.75)';
        ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
        ctx.shadowBlur = brushHardness < 80 ? 8 : 2;
      }

      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.restore();

      lastPointRef.current = coords;
    } else if (activeTool === 'lasso') {
      lassoPointsRef.current.push(coords);
    }
  };

  // Pointer Up handler
  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === 'lasso' && lassoPointsRef.current.length > 2 && maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.75)';
      ctx.beginPath();
      ctx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);
      for (let i = 1; i < lassoPointsRef.current.length; i++) {
        ctx.lineTo(lassoPointsRef.current[i].x, lassoPointsRef.current[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      lassoPointsRef.current = [];
    } else if (activeTool === 'rect' && rectStartRef.current && lastPointRef.current && maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      const x = Math.min(rectStartRef.current.x, lastPointRef.current.x);
      const y = Math.min(rectStartRef.current.y, lastPointRef.current.y);
      const w = Math.abs(lastPointRef.current.x - rectStartRef.current.x);
      const h = Math.abs(lastPointRef.current.y - rectStartRef.current.y);

      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.75)';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
      rectStartRef.current = null;
    }

    saveHistory();
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.15, Number((prev - 0.15).toFixed(2))));
  };

  return (
    <div
      ref={containerRef}
      className={styles.canvasContainer}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role="region"
      aria-label="Generative Fill selection canvas"
    >
      <div className={styles.viewport}>
        <div
          className={styles.stage}
          style={{
            width: `${originalWidth}px`,
            height: `${originalHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Base Original Image */}
          <img
            src={imageSrc}
            alt="Original to edit"
            className={styles.baseImage}
            draggable={false}
          />

          {/* Mask Selection Canvas Overlay */}
          <canvas
            ref={maskCanvasRef}
            width={originalWidth}
            height={originalHeight}
            className={`${styles.maskCanvas} ${activeTool === 'pan' ? styles.maskCanvasPan : ''}`}
          />
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
});

export default GenerativeFillCanvas;
