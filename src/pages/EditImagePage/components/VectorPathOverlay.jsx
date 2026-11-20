import { CheckCircle2, Move, Trash2 } from 'lucide-react';
import styles from './VectorPathOverlay.module.css';

/**
 * High-fidelity Vector Path Canvas Overlay:
 * - Live Pen tool drawing path & rubber-band line
 * - First anchor close-path hover indicator
 * - Anchor point nodes (squares) with selection state
 * - Bézier curve handles with control circles
 * - Floating node conversion bar (Corner / Smooth / Symmetric / Delete)
 * - Cheatsheet cards matching Photoshop mockup
 */
export function VectorPathOverlay({
  activeTool,
  penPath,
  penHoverMode,
  penCursorPos,
  selectedLayer,
  selectedNodeIndex,
  onSelectNode,
  onConvertNodeType,
  onDeleteNode,
  onAnchorPointerDown,
  onHandlePointerDown,
  hoveredSegment,
}) {
  const isPenActive = activeTool === 'pen';
  if (!isPenActive) return null;

  // 1. Drawing Mode: User is placing points in penPath
  const isDrawing = Boolean(penPath && penPath.points && penPath.points.length > 0 && !penPath.closed);

  // 2. Editing Mode: A vector shape layer is selected
  const isEditingShape = Boolean(
    !isDrawing &&
    selectedLayer &&
    selectedLayer.type === 'shape' &&
    (selectedLayer.shapeType === 'custom-path' || (selectedLayer.points && selectedLayer.points.length >= 3))
  );

  // Determine active points to display
  let points = [];
  let isClosed = false;
  let originX = 0;
  let originY = 0;

  if (isDrawing) {
    points = penPath.points;
    isClosed = false;
  } else if (isEditingShape) {
    points = selectedLayer.points || [];
    isClosed = true;
    originX = selectedLayer.x || 0;
    originY = selectedLayer.y || 0;
  }

  // Active selected node in document coordinates
  const activeNode =
    selectedNodeIndex !== null && points[selectedNodeIndex]
      ? {
        ...points[selectedNodeIndex],
        docX: originX + points[selectedNodeIndex].x,
        docY: originY + points[selectedNodeIndex].y,
        docCp1: points[selectedNodeIndex].cp1
          ? { x: originX + points[selectedNodeIndex].cp1.x, y: originY + points[selectedNodeIndex].cp1.y }
          : null,
        docCp2: points[selectedNodeIndex].cp2
          ? { x: originX + points[selectedNodeIndex].cp2.x, y: originY + points[selectedNodeIndex].cp2.y }
          : null,
      }
      : null;

  return (
    <div className={styles.overlayRoot} data-testid="vector-path-overlay" data-hovermode={penHoverMode || ''} data-drawing={isDrawing ? 'true' : 'false'} data-editing={isEditingShape ? 'true' : 'false'}>
      <svg className={styles.svgLayer} aria-label="Vector path canvas overlay">
        {/* Render Live Path when Drawing */}
        {isDrawing && (
          <>
            {/* Committed Segments so far */}
            <path
              d={(() => {
                let d = '';
                points.forEach((pt, i) => {
                  if (i === 0) d += `M ${pt.x} ${pt.y} `;
                  else if (pt.cp1 && pt.cp2) d += `C ${pt.cp1.x} ${pt.cp1.y}, ${pt.cp2.x} ${pt.cp2.y}, ${pt.x} ${pt.y} `;
                  else d += `L ${pt.x} ${pt.y} `;
                });
                return d;
              })()}
              className={styles.activePathLine}
            />

            {/* Rubber-band preview line from last point to cursor */}
            {penCursorPos && points.length > 0 && (
              <line
                x1={points[points.length - 1].x}
                y1={points[points.length - 1].y}
                x2={penHoverMode === 'close' ? points[0].x : penCursorPos.x}
                y2={penHoverMode === 'close' ? points[0].y : penCursorPos.y}
                className={styles.rubberBandLine}
              />
            )}
          </>
        )}

        {/* Hovered Segment Add-Node Indicator */}
        {hoveredSegment && (
          <g>
            <circle
              cx={hoveredSegment.projectedX}
              cy={hoveredSegment.projectedY}
              r="4.5"
              fill="#22c55e"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        )}

        {/* Render Anchor Point Nodes */}
        {points.map((pt, idx) => {
          const docX = originX + pt.x;
          const docY = originY + pt.y;
          const isSelected = selectedNodeIndex === idx;
          const isFirstInDrawing = isDrawing && idx === 0;
          const isCloseHovered = isFirstInDrawing && penHoverMode === 'close';

          return (
            <g key={`anchor-${idx}`}>
              {/* Close Ring Indicator on First Node when Hovered */}
              {isCloseHovered && (
                <circle
                  cx={docX}
                  cy={docY}
                  r="10"
                  className={styles.closeRingIndicator}
                />
              )}

              {/* Anchor Square Node */}
              <rect
                x={docX - 4}
                y={docY - 4}
                width={8}
                height={8}
                className={`${styles.anchorNode} ${isSelected ? styles.anchorNodeSelected : ''} ${isCloseHovered ? styles.anchorNodeStartClose : ''}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onAnchorPointerDown?.(idx, e);
                }}
                data-testid={`anchor-node-${idx}`}
                title={
                  isFirstInDrawing
                    ? 'Click to close path'
                    : `Anchor Point ${idx + 1} (${pt.type || 'corner'})`
                }
              />
            </g>
          );
        })}

        {/* Render Bézier Handle Lines and Endpoints for Active Node */}
        {activeNode && (
          <g data-testid="bezier-handles-group">
            {/* Handle 1 (cp1) */}
            {activeNode.docCp1 && (
              <>
                <line
                  x1={activeNode.docX}
                  y1={activeNode.docY}
                  x2={activeNode.docCp1.x}
                  y2={activeNode.docCp1.y}
                  className={styles.handleConnectorLine}
                />
                <circle
                  cx={activeNode.docCp1.x}
                  cy={activeNode.docCp1.y}
                  className={styles.handleControlCircle}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onHandlePointerDown?.(selectedNodeIndex, 'cp1', e);
                  }}
                  data-testid="bezier-handle-cp1"
                  title="Drag Bézier handle (cp1)"
                />
              </>
            )}

            {/* Handle 2 (cp2) */}
            {activeNode.docCp2 && (
              <>
                <line
                  x1={activeNode.docX}
                  y1={activeNode.docY}
                  x2={activeNode.docCp2.x}
                  y2={activeNode.docCp2.y}
                  className={styles.handleConnectorLine}
                />
                <circle
                  cx={activeNode.docCp2.x}
                  cy={activeNode.docCp2.y}
                  className={styles.handleControlCircle}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onHandlePointerDown?.(selectedNodeIndex, 'cp2', e);
                  }}
                  data-testid="bezier-handle-cp2"
                  title="Drag Bézier handle (cp2)"
                />
              </>
            )}
          </g>
        )}
      </svg>

      {/* Floating Node Conversion Bar near Selected Anchor Node */}
      {isEditingShape && activeNode && (
        <div
          className={styles.floatingNodeBar}
          style={{
            left: `${activeNode.docX}px`,
            top: `${activeNode.docY}px`,
          }}
          data-testid="floating-node-bar"
        >
          <button
            type="button"
            className={`${styles.floatingNodeBtn} ${styles.floatingNodeBtnActive}`}
            title="Move Node"
            aria-label="Move Node"
          >
            <Move size={13} />
          </button>

          <div className={styles.floatingDivider} />

          {/* Corner Node */}
          <button
            type="button"
            className={`${styles.floatingNodeBtn} ${activeNode.type === 'corner' ? styles.floatingNodeBtnActive : ''}`}
            onClick={() => onConvertNodeType?.(selectedNodeIndex, 'corner')}
            title="Convert to Corner Point (Sharp)"
            aria-label="Corner Point"
            data-testid="btn-node-corner"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="5" y="5" width="14" height="14" rx="1" />
            </svg>
          </button>

          {/* Smooth Node */}
          <button
            type="button"
            className={`${styles.floatingNodeBtn} ${activeNode.type === 'smooth' ? styles.floatingNodeBtnActive : ''}`}
            onClick={() => onConvertNodeType?.(selectedNodeIndex, 'smooth')}
            title="Convert to Smooth Curve"
            aria-label="Smooth Curve"
            data-testid="btn-node-smooth"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 18 C8 6, 16 6, 20 18" />
              <circle cx="12" cy="10" r="2.5" fill="currentColor" />
            </svg>
          </button>

          {/* Symmetric Node */}
          <button
            type="button"
            className={`${styles.floatingNodeBtn} ${activeNode.type === 'symmetric' ? styles.floatingNodeBtnActive : ''}`}
            onClick={() => onConvertNodeType?.(selectedNodeIndex, 'symmetric')}
            title="Convert to Symmetrical Handles"
            aria-label="Symmetrical Handles"
            data-testid="btn-node-symmetric"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <circle cx="3" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <circle cx="21" cy="12" r="2" fill="currentColor" />
            </svg>
          </button>

          <div className={styles.floatingDivider} />

          {/* Delete Node */}
          <button
            type="button"
            className={styles.floatingNodeBtn}
            onClick={() => onDeleteNode?.(selectedNodeIndex)}
            title="Delete Selected Anchor Point (Delete)"
            aria-label="Delete Node"
            data-testid="btn-delete-node"
          >
            <Trash2 size={13} color="#ef4444" />
          </button>
        </div>
      )}

      {/* Floating Tooltip Indicator when hovering segment or first anchor */}
      {hoveredSegment && (
        <div
          className={styles.floatingTooltip}
          style={{
            left: `${hoveredSegment.projectedX}px`,
            top: `${hoveredSegment.projectedY}px`,
          }}
        >
          Add Node
        </div>
      )}

      {isDrawing && penHoverMode === 'close' && points.length > 0 && (
        <div
          className={styles.floatingTooltip}
          style={{
            left: `${points[0].x}px`,
            top: `${points[0].y}px`,
          }}
        >
          Click to close path
        </div>
      )}

      {/* Photoshop Shortcuts Cheatsheet Card (Top Right) */}
      <div className={styles.cheatsheetCard} data-testid="pen-shortcuts-card">
        <div className={styles.shortcutRow}>
          <span className={styles.shortcutKeyBadge}>1 – 0</span>
          <span className={styles.shortcutDesc}>Set opacity (10% – 100%)</span>
        </div>
        <div className={styles.shortcutRow}>
          <span className={styles.shortcutKeyBadge}>Ctrl + Enter</span>
          <span className={styles.shortcutDesc}>Convert to Selection</span>
        </div>
        <div className={styles.shortcutRow}>
          <span className={styles.shortcutKeyBadge}>Ctrl + Delete</span>
          <span className={styles.shortcutDesc}>Fill with Foreground Color</span>
        </div>
        <div className={styles.shortcutRow}>
          <span className={styles.shortcutKeyBadge}>Ctrl + Alt</span>
          <span className={styles.shortcutDesc}>Fill with Background Color</span>
        </div>
      </div>

      {/* Feature Guide Checklist (Bottom Left) */}
      <div className={styles.checklistCard} data-testid="pen-guide-checklist">
        <div className={styles.checklistItem}>
          <CheckCircle2 size={14} className={styles.checkIcon} />
          <span>Pen tool creates a filled shape by default</span>
        </div>
        <div className={styles.checklistItem}>
          <CheckCircle2 size={14} className={styles.checkIcon} />
          <span>Click the first point to close and complete the shape</span>
        </div>
        <div className={styles.checklistItem}>
          <CheckCircle2 size={14} className={styles.checkIcon} />
          <span>Hover a node to add or delete node</span>
        </div>
        <div className={styles.checklistItem}>
          <CheckCircle2 size={14} className={styles.checkIcon} />
          <span>Edit nodes to adjust the shape</span>
        </div>
      </div>
    </div>
  );
}

export default VectorPathOverlay;

