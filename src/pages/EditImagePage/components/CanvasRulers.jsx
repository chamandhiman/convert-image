import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './CanvasRulers.module.css';

const RULER_SIZE = 26;

/**
 * Choose nice major/medium/minor intervals adapting to current zoom level
 */
function getRulerInterval(zoom) {
  const targetPixelDistance = 80;
  const niceIntervals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  let best = niceIntervals[0];
  for (const interval of niceIntervals) {
    if (interval * zoom >= 45) {
      best = interval;
      break;
    }
  }
  return {
    major: best,
    medium: best / 2,
    minor: best / 10,
  };
}

export function CanvasRulers({
  width = 1200,
  height = 800,
  zoom = 1,
  pan = { x: 0, y: 0 },
  guides = [],
  selectedGuideId = null,
  showGuides = true,
  onAddGuide,
  onUpdateGuide,
  onDeleteGuide,
  onSelectGuide,
  viewportRef,
  stageRef,
}) {
  const hCanvasRef = useRef(null);
  const vCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // Active guide dragging state
  // { id?: string, orientation: 'horizontal'|'vertical', pos: number, isNew: boolean, mouseClientX, mouseClientY }
  const [activeDrag, setActiveDrag] = useState(null);

  const [originMetrics, setOriginMetrics] = useState({
    originX: 0,
    originY: 0,
    stageLeft: 0,
    stageTop: 0,
    vpLeft: 0,
    vpTop: 0,
  });

  // Measure ruler origin relative to viewport
  const getOriginOffsets = useCallback(() => {
    if (stageRef?.current && viewportRef?.current) {
      const stageRect = stageRef.current.getBoundingClientRect();
      const vpRect = viewportRef.current.getBoundingClientRect();
      const metrics = {
        originX: stageRect.left - vpRect.left - RULER_SIZE,
        originY: stageRect.top - vpRect.top - RULER_SIZE,
        stageLeft: stageRect.left,
        stageTop: stageRect.top,
        vpLeft: vpRect.left,
        vpTop: vpRect.top,
      };
      setOriginMetrics(metrics);
      return metrics;
    }
    // Fallback if refs not mounted yet
    const vp = viewportRef?.current;
    const vpW = vp ? vp.clientWidth : 1200;
    const vpH = vp ? vp.clientHeight : 800;
    const fallbackMetrics = {
      originX: (vpW - RULER_SIZE - width * zoom) / 2 + (pan?.x || 0),
      originY: (vpH - RULER_SIZE - height * zoom) / 2 + (pan?.y || 0),
      stageLeft: 0,
      stageTop: 0,
      vpLeft: 0,
      vpTop: 0,
    };
    setOriginMetrics(fallbackMetrics);
    return fallbackMetrics;
  }, [stageRef, viewportRef, width, height, zoom, pan?.x, pan?.y]);

  useEffect(() => {
    getOriginOffsets();
  }, [getOriginOffsets]);

  // Render rulers onto HTML5 canvases
  const drawRulers = useCallback(() => {
    const hCanvas = hCanvasRef.current;
    const vCanvas = vCanvasRef.current;
    if (!hCanvas || !vCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const hRect = hCanvas.getBoundingClientRect();
    const vRect = vCanvas.getBoundingClientRect();

    const hW = Math.round(hRect.width);
    const hH = Math.round(hRect.height) || RULER_SIZE;
    const vW = Math.round(vRect.width) || RULER_SIZE;
    const vH = Math.round(vRect.height);

    if (hW <= 0 || vH <= 0) return;

    // Adjust high-DPI canvas dimensions
    if (hCanvas.width !== hW * dpr || hCanvas.height !== hH * dpr) {
      hCanvas.width = hW * dpr;
      hCanvas.height = hH * dpr;
    }
    if (vCanvas.width !== vW * dpr || vCanvas.height !== vH * dpr) {
      vCanvas.width = vW * dpr;
      vCanvas.height = vH * dpr;
    }

    const hCtx = hCanvas.getContext('2d');
    const vCtx = vCanvas.getContext('2d');
    if (!hCtx || !vCtx) return;

    hCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { originX, originY } = getOriginOffsets();
    const interval = getRulerInterval(zoom);

    // -------------------------------------------------------------------------
    // Draw Top Horizontal Ruler
    // -------------------------------------------------------------------------
    hCtx.clearRect(0, 0, hW, hH);
    hCtx.fillStyle = '#ffffff';
    hCtx.fillRect(0, 0, hW, hH);

    // Bottom separator border
    hCtx.fillStyle = '#e2e8f0';
    hCtx.fillRect(0, hH - 1, hW, 1);

    // Document bounds indicator on ruler track
    const docStartX = originX;
    const docEndX = originX + width * zoom;
    hCtx.fillStyle = '#f8fafc';
    hCtx.fillRect(Math.max(0, docStartX), 0, Math.min(hW, docEndX) - Math.max(0, docStartX), hH - 1);

    hCtx.font = '9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    hCtx.fillStyle = '#64748b';
    hCtx.textBaseline = 'top';

    const startDocX = Math.floor((-originX / zoom) / interval.major) * interval.major;
    const endDocX = Math.ceil(((hW - originX) / zoom) / interval.major) * interval.major;

    for (let docX = startDocX; docX <= endDocX; docX += interval.minor) {
      const screenX = Math.round(originX + docX * zoom);
      if (screenX < -20 || screenX > hW + 20) continue;

      const isMajor = Math.abs(docX % interval.major) < 0.001;
      const isMedium = !isMajor && Math.abs(docX % interval.medium) < 0.001;

      if (isMajor) {
        hCtx.fillStyle = '#94a3b8';
        hCtx.fillRect(screenX, hH - 10, 1, 10);
        // Draw numeric label
        hCtx.fillStyle = '#64748b';
        hCtx.fillText(String(Math.round(docX)), screenX + 3, 3);
      } else if (isMedium) {
        hCtx.fillStyle = '#cbd5e1';
        hCtx.fillRect(screenX, hH - 6, 1, 6);
      } else {
        hCtx.fillStyle = '#e2e8f0';
        hCtx.fillRect(screenX, hH - 3.5, 1, 3.5);
      }
    }

    // -------------------------------------------------------------------------
    // Draw Left Vertical Ruler
    // -------------------------------------------------------------------------
    vCtx.clearRect(0, 0, vW, vH);
    vCtx.fillStyle = '#ffffff';
    vCtx.fillRect(0, 0, vW, vH);

    // Right separator border
    vCtx.fillStyle = '#e2e8f0';
    vCtx.fillRect(vW - 1, 0, 1, vH);

    // Document bounds indicator
    const docStartY = originY;
    const docEndY = originY + height * zoom;
    vCtx.fillStyle = '#f8fafc';
    vCtx.fillRect(0, Math.max(0, docStartY), vW - 1, Math.min(vH, docEndY) - Math.max(0, docStartY));

    vCtx.font = '9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    vCtx.fillStyle = '#64748b';

    const startDocY = Math.floor((-originY / zoom) / interval.major) * interval.major;
    const endDocY = Math.ceil(((vH - originY) / zoom) / interval.major) * interval.major;

    for (let docY = startDocY; docY <= endDocY; docY += interval.minor) {
      const screenY = Math.round(originY + docY * zoom);
      if (screenY < -20 || screenY > vH + 20) continue;

      const isMajor = Math.abs(docY % interval.major) < 0.001;
      const isMedium = !isMajor && Math.abs(docY % interval.medium) < 0.001;

      if (isMajor) {
        vCtx.fillStyle = '#94a3b8';
        vCtx.fillRect(vW - 10, screenY, 10, 1);

        // Draw numeric coordinate rotated -90 deg for crisp readability
        vCtx.save();
        vCtx.translate(4, screenY - 2);
        vCtx.rotate(-Math.PI / 2);
        vCtx.fillStyle = '#64748b';
        vCtx.textBaseline = 'bottom';
        vCtx.fillText(String(Math.round(docY)), 0, 0);
        vCtx.restore();
      } else if (isMedium) {
        vCtx.fillStyle = '#cbd5e1';
        vCtx.fillRect(vW - 6, screenY, 6, 1);
      } else {
        vCtx.fillStyle = '#e2e8f0';
        vCtx.fillRect(vW - 3.5, screenY, 3.5, 1);
      }
    }
  }, [zoom, width, height, getOriginOffsets]);

  // Redraw when parameters or viewport changes
  useEffect(() => {
    drawRulers();
    const handleResize = () => drawRulers();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawRulers]);

  // Snapping logic for guides
  const snapGuideCoordinate = useCallback(
    (val, orientation) => {
      const limit = orientation === 'horizontal' ? height : width;
      const snapPoints = [0, Math.round(limit / 2), limit];
      for (const pt of snapPoints) {
        if (Math.abs(val - pt) <= 5 / (zoom || 1)) {
          return pt;
        }
      }
      return Math.round(val);
    },
    [width, height, zoom]
  );

  // Start dragging a new horizontal guide from top ruler
  const handleMouseDownTopRuler = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const stageRect = stageRef?.current?.getBoundingClientRect();
    const stageTop = stageRect ? stageRect.top : 0;
    const rawPos = (e.clientY - stageTop) / (zoom || 1);
    const snapped = snapGuideCoordinate(rawPos, 'horizontal');

    setActiveDrag({
      id: null,
      orientation: 'horizontal',
      pos: snapped,
      isNew: true,
      mouseClientX: e.clientX,
      mouseClientY: e.clientY,
    });
  };

  // Start dragging a new vertical guide from left ruler
  const handleMouseDownLeftRuler = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const stageRect = stageRef?.current?.getBoundingClientRect();
    const stageLeft = stageRect ? stageRect.left : 0;
    const rawPos = (e.clientX - stageLeft) / (zoom || 1);
    const snapped = snapGuideCoordinate(rawPos, 'vertical');

    setActiveDrag({
      id: null,
      orientation: 'vertical',
      pos: snapped,
      isNew: true,
      mouseClientX: e.clientX,
      mouseClientY: e.clientY,
    });
  };

  // Start moving an existing guide
  const handleStartMoveGuide = (e, guide) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectGuide?.(guide.id);

    setActiveDrag({
      id: guide.id,
      orientation: guide.orientation,
      pos: guide.pos,
      isNew: false,
      mouseClientX: e.clientX,
      mouseClientY: e.clientY,
    });
  };

  // Window pointer move and up handlers during guide dragging
  useEffect(() => {
    if (!activeDrag) return;

    const handlePointerMove = (e) => {
      const stageRect = stageRef?.current?.getBoundingClientRect();
      const stageLeft = stageRect ? stageRect.left : 0;
      const stageTop = stageRect ? stageRect.top : 0;

      if (activeDrag.orientation === 'horizontal') {
        const rawPos = (e.clientY - stageTop) / (zoom || 1);
        const snapped = snapGuideCoordinate(rawPos, 'horizontal');
        setActiveDrag((prev) => ({
          ...prev,
          pos: snapped,
          mouseClientX: e.clientX,
          mouseClientY: e.clientY,
        }));
      } else {
        const rawPos = (e.clientX - stageLeft) / (zoom || 1);
        const snapped = snapGuideCoordinate(rawPos, 'vertical');
        setActiveDrag((prev) => ({
          ...prev,
          pos: snapped,
          mouseClientX: e.clientX,
          mouseClientY: e.clientY,
        }));
      }
    };

    const handlePointerUp = (e) => {
      const vpRect = viewportRef?.current?.getBoundingClientRect();
      const vpTop = vpRect ? vpRect.top : 0;
      const vpLeft = vpRect ? vpRect.left : 0;

      // Determine if dropped back onto the originating ruler (removal condition)
      const isDroppedOnTopRuler = e.clientY <= vpTop + RULER_SIZE;
      const isDroppedOnLeftRuler = e.clientX <= vpLeft + RULER_SIZE;

      if (activeDrag.isNew) {
        // Only add if dragged past the ruler into the workspace
        const shouldCancel =
          (activeDrag.orientation === 'horizontal' && isDroppedOnTopRuler) ||
          (activeDrag.orientation === 'vertical' && isDroppedOnLeftRuler);

        if (!shouldCancel) {
          const newGuide = {
            id: 'guide_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            orientation: activeDrag.orientation,
            pos: activeDrag.pos,
          };
          onAddGuide?.(newGuide);
        }
      } else {
        // Existing guide moved
        const shouldDelete =
          (activeDrag.orientation === 'horizontal' && isDroppedOnTopRuler) ||
          (activeDrag.orientation === 'vertical' && isDroppedOnLeftRuler);

        if (shouldDelete) {
          onDeleteGuide?.(activeDrag.id);
        } else {
          onUpdateGuide?.(activeDrag.id, { pos: activeDrag.pos });
        }
      }

      setActiveDrag(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    activeDrag,
    zoom,
    stageRef,
    viewportRef,
    snapGuideCoordinate,
    onAddGuide,
    onUpdateGuide,
    onDeleteGuide,
  ]);

  // Combine guides for rendering (including active drag line)
  const renderedGuides = [...guides];
  if (activeDrag && activeDrag.isNew) {
    renderedGuides.push({
      id: '__dragging_new__',
      orientation: activeDrag.orientation,
      pos: activeDrag.pos,
      isDragging: true,
    });
  }

  const baseVpLeft = originMetrics.vpLeft || 0;
  const baseVpTop = originMetrics.vpTop || 0;
  const stageLeft = originMetrics.stageLeft || 0;
  const stageTop = originMetrics.stageTop || 0;

  return (
    <div ref={containerRef} className={styles.rulerContainer} data-testid="canvas-rulers">
      {/* 1. Top-Left Corner Box (shows "px") */}
      <div className={styles.cornerBox} title="Origin (0, 0)">
        <span className={styles.cornerText}>px</span>
      </div>

      {/* 2. Top Horizontal Ruler */}
      <div
        className={styles.topRulerWrap}
        onMouseDown={handleMouseDownTopRuler}
        title="Drag downward to create a horizontal guide"
        data-testid="top-ruler"
      >
        <canvas ref={hCanvasRef} className={styles.rulerCanvas} />
      </div>

      {/* 3. Left Vertical Ruler */}
      <div
        className={styles.leftRulerWrap}
        onMouseDown={handleMouseDownLeftRuler}
        title="Drag rightward to create a vertical guide"
        data-testid="left-ruler"
      >
        <canvas ref={vCanvasRef} className={styles.rulerCanvas} />
      </div>

      {/* 4. Draggable Photoshop Guides Overlay */}
      {showGuides && (
        <div className={styles.guidesOverlay} data-testid="guides-overlay">
          {renderedGuides.map((guide) => {
            const isDraggingThis = activeDrag && (activeDrag.id === guide.id || guide.isDragging);
            const currentPos = isDraggingThis ? activeDrag.pos : guide.pos;
            const isSelected = guide.id === selectedGuideId || isDraggingThis;

            if (guide.orientation === 'horizontal') {
              const screenY = (stageTop - baseVpTop) + currentPos * zoom;

              return (
                <div
                  key={guide.id}
                  data-guide-id={guide.id}
                  data-guide-orientation="horizontal"
                  data-guide-pos={currentPos}
                  className={`${styles.guideLineHorizontal} ${
                    isSelected ? styles.guideLineHorizontalSelected : ''
                  }`}
                  style={{ top: `${screenY}px` }}
                  onMouseDown={(e) => handleStartMoveGuide(e, guide)}
                  title={`Horizontal Guide: Y = ${currentPos}px (Click to select, Drag to move, Del to delete)`}
                >
                  <div className={styles.guideHitAreaH} />
                  {isDraggingThis && (
                    <div
                      className={styles.guideTooltip}
                      style={{
                        left: `${activeDrag.mouseClientX - baseVpLeft}px`,
                      }}
                    >
                      Y: {currentPos} px
                    </div>
                  )}
                </div>
              );
            } else {
              const screenX = (stageLeft - baseVpLeft) + currentPos * zoom;

              return (
                <div
                  key={guide.id}
                  data-guide-id={guide.id}
                  data-guide-orientation="vertical"
                  data-guide-pos={currentPos}
                  className={`${styles.guideLineVertical} ${
                    isSelected ? styles.guideLineVerticalSelected : ''
                  }`}
                  style={{ left: `${screenX}px` }}
                  onMouseDown={(e) => handleStartMoveGuide(e, guide)}
                  title={`Vertical Guide: X = ${currentPos}px (Click to select, Drag to move, Del to delete)`}
                >
                  <div className={styles.guideHitAreaV} />
                  {isDraggingThis && (
                    <div
                      className={styles.guideTooltip}
                      style={{
                        top: `${activeDrag.mouseClientY - baseVpTop}px`,
                      }}
                    >
                      X: {currentPos} px
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

export default CanvasRulers;
