import { useState, useRef, useEffect } from 'react';
import {
  Layers as LayersIcon,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Edit2,
  Layers,
  MoreVertical,
  Sliders,
  Sparkles,
  CornerDownRight,
  SquareDashedBottomCode,
  SquareCode,
  Folder,
  FolderPlus,
} from 'lucide-react';
import styles from './LayersPanel.module.css';

/**
 * Photoshop-Style Add New Layer Icon
 * Turned-corner sheet with plus symbol
 */
function PhotoshopNewLayerIcon({ size = 15, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

/**
 * 3D-Stacked Isometric Layers Icon matching the mockup
 */
function IsometricLayersIcon({ size = 48, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24 7L41 16.5L24 26L7 16.5L24 7Z"
        stroke="#94A3B8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 23.5L24 33L41 23.5"
        stroke="#94A3B8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 30.5L24 40L41 30.5"
        stroke="#94A3B8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LayersPanel({
  hasImage = false,
  layers = [],
  selectedLayerId,
  selectedLayerIds = [],
  onSelectLayers,
  onSelectLayer,
  activeMaskLayerId = null,
  onSelectMaskTarget,
  onAddBlankLayer,
  onAddBlankLayerAbove,
  onAddBlankLayerBelow,
  onAddGroup,
  onDuplicateLayer,
  onDuplicateLayers,
  onDeleteLayer,
  onDeleteLayers,
  onMoveLayer,
  onMoveLayers,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onToggleHide,
  onRenameLayer,
  onReorderLayers,
  onOpenBlendingOptions,
  onToggleClippingMask,
  onAddLayerMask,
  onDeleteLayerMask,
  onMergeLayers,
  sourceDocId = null,
  onTransferLayer = null,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [lastClickedIdx, setLastClickedIdx] = useState(null);
  const touchStartRef = useRef(null);

  // Active selection list
  const activeSelectedIds = selectedLayerIds.length > 0
    ? selectedLayerIds
    : selectedLayerId
      ? [selectedLayerId]
      : [];

  // Close context menu on Escape or outside click
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setContextMenu(null);
    }
    if (contextMenu) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [contextMenu]);

  const handleStartRename = (layer) => {
    setRenamingId(layer.id);
    setRenameValue(layer.name || (layer.type === 'text' ? 'Text Layer' : 'Layer'));
  };

  const handleCommitRename = (id) => {
    if (renameValue.trim()) {
      onRenameLayer(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleRowClick = (e, layer, index) => {
    e.stopPropagation();

    if (e.ctrlKey || e.metaKey) {
      // Toggle layer in multi-selection
      const exists = activeSelectedIds.includes(layer.id);
      const next = exists
        ? activeSelectedIds.filter((id) => id !== layer.id)
        : [...activeSelectedIds, layer.id];
      onSelectLayers?.(next);
      setLastClickedIdx(index);
    } else if (e.shiftKey && lastClickedIdx !== null) {
      // Range selection
      const start = Math.min(lastClickedIdx, index);
      const end = Math.max(lastClickedIdx, index);
      const rangeIds = layers.slice(start, end + 1).map((l) => l.id);
      onSelectLayers?.(rangeIds);
    } else {
      // Single selection
      onSelectLayers?.([layer.id]);
      onSelectLayer?.(layer.id);
      setLastClickedIdx(index);
    }
  };

  const handleOpenMenu = (e, layer) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeSelectedIds.includes(layer.id)) {
      onSelectLayers?.([layer.id]);
      onSelectLayer?.(layer.id);
    }

    const menuW = 230;
    const menuH = 410;
    const x = Math.min(e.clientX || 200, window.innerWidth - menuW - 10);
    const y = Math.min(e.clientY || 200, window.innerHeight - menuH - 10);

    setContextMenu({
      x,
      y,
      layer,
    });
  };

  const selectedIdx = layers.findIndex((l) => l.id === selectedLayerId);
  const canMoveUp = selectedIdx !== -1 && selectedIdx < layers.length - 1;
  const canMoveDown = selectedIdx !== -1 && selectedIdx > 0;

  const currentActiveLayer = layers.find((l) => l.id === (activeSelectedIds[0] || selectedLayerId));

  return (
    <div className={styles.layersContainer} data-testid="layers-panel">
      {/* 1. Header Bar: Title + Count Badge */}
      <div
        className={styles.headerRow}
        style={!hasImage ? { display: 'none' } : undefined}
      >
        <div className={styles.titleWithBadge}>
          <LayersIcon size={16} className={styles.layersHeaderIcon} />
          <span className={styles.panelTitle} data-testid="layers-panel-title">
            Layers
          </span>
          <span className={styles.panelCountBadge} data-testid="layers-count-badge">
            {layers.length}
          </span>
        </div>
      </div>

      {/* 2. Interactive Layers Stack List (Reversed: top layer at top) */}
      <div
        className={styles.layersList}
        data-testid="layers-list"
        onDragOver={(e) => e.stopPropagation()}
        onDrop={(e) => e.stopPropagation()}
      >
        {layers.length === 0 ? (
          <div className={styles.emptyLayersState} data-testid="layers-empty">
            <IsometricLayersIcon size={48} className={styles.emptyLayersIcon} />
            <p className={styles.emptyLayersTitle}>No layers yet</p>
            <span className={styles.emptyLayersSubtext}>
              Create a new layer or open an image to get started.
            </span>
          </div>
        ) : (
          [...layers]
            .map((layer, index) => ({ layer, index }))
            .reverse()
            .map(({ layer, index }) => {
              const isSelected = activeSelectedIds.includes(layer.id);
              const isRenaming = renamingId === layer.id;
              const isClipped = Boolean(layer.clippingMask);
              const hasMask = Boolean(layer.mask);
              const isEditingMask = activeMaskLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  data-testid={`layer-row-${layer.id}`}
                  data-layer-id={layer.id}
                  data-layer-selected={isSelected ? 'true' : 'false'}
                  data-layer-hidden={layer.hidden ? 'true' : 'false'}
                  data-layer-locked={layer.locked ? 'true' : 'false'}
                  data-layer-clipped={isClipped ? 'true' : 'false'}
                  className={`${styles.layerRow} ${isSelected ? styles.layerRowSelected : ''} ${layer.hidden ? styles.layerRowHidden : ''
                    } ${layer.locked ? styles.layerRowLocked : ''} ${isClipped ? styles.clippedRow : ''
                    } ${dragOverIdx === index ? styles.layerRowDragOver : ''}`}
                  draggable={!layer.locked}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    const isMulti = selectedLayerIds.length > 1 && selectedLayerIds.includes(layer.id);
                    const draggedLayers = isMulti
                      ? layers.filter((l) => selectedLayerIds.includes(l.id))
                      : [layer];
                    if (typeof window !== 'undefined') {
                      window.__isInternalLayerDrag = true;
                      window.__draggedLayerPayload = {
                        sourceDocId,
                        layer: JSON.parse(JSON.stringify(layer)),
                        layers: JSON.parse(JSON.stringify(draggedLayers)),
                      };
                    }
                    e.dataTransfer.effectAllowed = 'copyMove';
                    e.dataTransfer.setData('text/plain', String(index));
                    e.dataTransfer.setData(
                      'application/x-image-convert-layer',
                      JSON.stringify({
                        sourceDocId,
                        layer: JSON.parse(JSON.stringify(layer)),
                        layers: JSON.parse(JSON.stringify(draggedLayers)),
                      })
                    );
                    setDraggedIdx(index);
                  }}
                  onDragEnd={(e) => {
                    e.stopPropagation();
                    if (typeof window !== 'undefined') {
                      window.__isInternalLayerDrag = false;
                      window.__draggedLayerPayload = null;
                    }
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverIdx !== index) setDragOverIdx(index);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const draggedPayload =
                      typeof window !== 'undefined' && window.__draggedLayerPayload
                        ? window.__draggedLayerPayload
                        : null;

                    // If dropped from another document
                    if (
                      draggedPayload &&
                      draggedPayload.layer &&
                      draggedPayload.sourceDocId &&
                      draggedPayload.sourceDocId !== sourceDocId
                    ) {
                      onTransferLayer?.(draggedPayload.layer, index);
                      if (typeof window !== 'undefined') {
                        window.__isInternalLayerDrag = false;
                        window.__draggedLayerPayload = null;
                      }
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                      return;
                    }

                    if (typeof window !== 'undefined') {
                      window.__isInternalLayerDrag = false;
                      window.__draggedLayerPayload = null;
                    }
                    const raw = e.dataTransfer.getData('text/plain');
                    const src = raw !== '' ? parseInt(raw, 10) : draggedIdx;
                    if (src !== null && !isNaN(src) && src !== index) {
                      onReorderLayers(src, index);
                    }
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onClick={(e) => handleRowClick(e, layer, index)}
                  onContextMenu={(e) => handleOpenMenu(e, layer)}
                >
                  {/* Clipping Mask Downward Elbow Arrow Indicator */}
                  {isClipped && (
                    <span className={styles.clippingArrow} data-testid="clipping-mask-arrow" title="Clipped to layer below">
                      ↳
                    </span>
                  )}

                  {/* Drag Handle */}
                  <div
                    className={styles.dragHandle}
                    title="Drag to reorder"
                    onTouchStart={(e) => {
                      if (layer.locked) return;
                      touchStartRef.current = {
                        startIndex: index,
                        startY: e.touches[0].clientY,
                      };
                    }}
                    onTouchMove={(e) => {
                      if (!touchStartRef.current) return;
                      const deltaY = e.touches[0].clientY - touchStartRef.current.startY;
                      const offsetIndex = Math.round(deltaY / 44);
                      const targetIndex = Math.max(
                        0,
                        Math.min(layers.length - 1, touchStartRef.current.startIndex - offsetIndex)
                      );
                      setDragOverIdx(targetIndex);
                    }}
                    onTouchEnd={() => {
                      if (touchStartRef.current && dragOverIdx !== null) {
                        onReorderLayers(touchStartRef.current.startIndex, dragOverIdx);
                      }
                      touchStartRef.current = null;
                      setDragOverIdx(null);
                    }}
                  >
                    <GripVertical size={14} />
                  </div>

                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    className={styles.iconToggleBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHide(layer.id);
                    }}
                    title={layer.hidden ? 'Show Layer' : 'Hide Layer'}
                    aria-label="Toggle Visibility"
                    data-testid={`layer-eye-${layer.id}`}
                  >
                    {layer.hidden ? (
                      <EyeOff size={15} className={styles.dimIcon} />
                    ) : (
                      <Eye size={15} className={styles.activeIcon} />
                    )}
                  </button>

                  {/* Layer Checkerboard Thumbnail with Content Preview */}
                  <div
                    className={`${styles.layerThumbnail} ${!isEditingMask ? styles.thumbSelectedTarget : ''
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMaskTarget?.(null);
                      onSelectLayer?.(layer.id);
                    }}
                    title="Click to edit layer contents"
                    data-testid={`layer-thumb-${layer.id}`}
                  >
                    {layer.dataUrl ? (
                      <img
                        src={layer.dataUrl}
                        alt={layer.name || 'Image'}
                        className={styles.layerThumbImg}
                      />
                    ) : layer.type === 'image' || layer.type === 'blank' ? (
                      <div className={styles.blankLayerThumb} />
                    ) : layer.type === 'text' ? (
                      <span className={styles.textBadgeIcon}>T</span>
                    ) : layer.type === 'group' ? (
                      <Folder size={18} style={{ color: '#7c3aed' }} />
                    ) : layer.type === 'shape' ? (
                      layer.shapeType === 'circle' ? (
                        <div
                          className={styles.circleThumb}
                          style={{
                            backgroundColor:
                              layer.fillColor && layer.fillColor !== 'transparent'
                                ? layer.fillColor
                                : '#8b5cf6',
                          }}
                        />
                      ) : layer.shapeType === 'rect' || layer.shapeType === 'rounded-rect' ? (
                        <div
                          className={styles.rectThumb}
                          style={{
                            backgroundColor:
                              layer.fillColor && layer.fillColor !== 'transparent'
                                ? layer.fillColor
                                : '#ef4444',
                          }}
                        />
                      ) : (
                        <div
                          className={styles.shapeSwatch}
                          style={{
                            backgroundColor:
                              layer.fillColor && layer.fillColor !== 'transparent'
                                ? layer.fillColor
                                : '#eab308',
                            borderColor: layer.strokeColor || '#ca8a04',
                          }}
                        />
                      )
                    ) : (
                      /* Blank layer */
                      <div className={styles.blankThumbInner} />
                    )}
                  </div>

                  {/* Layer Mask Thumbnail (if present) */}
                  {hasMask && (
                    <div
                      className={`${styles.maskThumbnail} ${isEditingMask ? styles.thumbSelectedTarget : ''
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMaskTarget?.(layer.id);
                        onSelectLayer?.(layer.id);
                      }}
                      title="Layer Mask: click to paint/edit mask"
                      data-testid={`layer-mask-thumb-${layer.id}`}
                    >
                      {layer.mask.dataUrl ? (
                        <img
                          src={layer.mask.dataUrl}
                          alt="Mask"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#ffffff' }} />
                      )}
                    </div>
                  )}

                  {/* Layer Name / Inline Rename Input */}
                  <div className={styles.nameWrap}>
                    {isRenaming ? (
                      <input
                        type="text"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleCommitRename(layer.id)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') handleCommitRename(layer.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className={styles.renameInput}
                        data-testid="layer-rename-input"
                      />
                    ) : (
                      <span
                        className={styles.layerNameText}
                        onDoubleClick={() => handleStartRename(layer)}
                        title="Double-click to rename"
                        data-testid={`layer-name-${layer.id}`}
                      >
                        {layer.name || (layer.type === 'text' ? layer.text || 'Text Layer' : 'Layer')}
                      </span>
                    )}
                  </div>

                  {/* Three-Dot Menu Trigger */}
                  <button
                    type="button"
                    className={styles.threeDotBtn}
                    onClick={(e) => handleOpenMenu(e, layer)}
                    title="Layer Options & Blending"
                    data-testid={`layer-menu-btn-${layer.id}`}
                  >
                    <MoreVertical size={14} />
                  </button>

                  {/* Lock Status Button */}
                  <button
                    type="button"
                    className={styles.iconToggleBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(layer.id);
                    }}
                    title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                    aria-label="Toggle Lock"
                    data-testid={`layer-lock-${layer.id}`}
                  >
                    {layer.locked ? (
                      <Lock size={14} className={styles.lockedIcon} />
                    ) : (
                      <Unlock size={14} className={styles.unlockedIcon} />
                    )}
                  </button>
                </div>
              );
            })
        )}
      </div>

      {/* 3. Dedicated Bottom Action Icons Bar (Requirement #2) */}
      <div className={styles.bottomActionsBar} data-testid="layers-bottom-toolbar">
        <div className={styles.bottomActionsGroup}>
          {/* Create New Layer */}
          <button
            type="button"
            className={`${styles.bottomActionBtn} ${styles.bottomActionBtnPrimary}`}
            disabled={!hasImage}
            onClick={onAddBlankLayer}
            title={hasImage ? "Create New Layer" : "Open or create a document first"}
            aria-label="Create New Layer"
            data-testid="layers-add-btn"
          >
            <Plus size={15} />
          </button>

          {/* Create New Group */}
          <button
            type="button"
            className={styles.bottomActionBtn}
            disabled={!hasImage}
            onClick={onAddGroup}
            title={hasImage ? "Create New Group" : "Open or create a document first"}
            aria-label="Create New Group"
            data-testid="layers-group-btn"
          >
            <FolderPlus size={15} />
          </button>

          {/* Duplicate Layer */}
          <button
            type="button"
            className={styles.bottomActionBtn}
            disabled={!hasImage || activeSelectedIds.length === 0}
            onClick={() => {
              if (onDuplicateLayers) onDuplicateLayers(activeSelectedIds);
              else if (selectedLayerId) onDuplicateLayer?.(selectedLayerId);
            }}
            title={hasImage ? "Duplicate Selected Layer(s)" : "Open or create a document first"}
            aria-label="Duplicate Layers"
            data-testid="layers-dup-btn"
          >
            <Copy size={14} />
          </button>

          {/* Delete Layer */}
          <button
            type="button"
            className={`${styles.bottomActionBtn} ${styles.bottomActionBtnDanger}`}
            disabled={!hasImage || activeSelectedIds.length === 0}
            onClick={() => {
              if (onDeleteLayers) onDeleteLayers(activeSelectedIds);
              else if (selectedLayerId) onDeleteLayer?.(selectedLayerId);
            }}
            title={hasImage ? "Delete Selected Layer(s) (Delete/Backspace)" : "Open or create a document first"}
            aria-label="Delete Layers"
            data-testid="layers-del-btn"
          >
            <Trash2 size={14} />
          </button>

          <div className={styles.bottomToolbarDivider} />

          {/* Move Layer Up */}
          <button
            type="button"
            className={styles.bottomActionBtn}
            disabled={!hasImage || !canMoveUp}
            onClick={() => {
              if (activeSelectedIds.length > 0) onMoveLayers?.(activeSelectedIds, 'up');
              else if (selectedLayerId) onMoveLayer?.(selectedLayerId, 'up');
            }}
            title="Move Layer Up (Ctrl+])"
            aria-label="Move Up"
            data-testid="layer-order-up-btn"
          >
            <ArrowUp size={14} />
          </button>

          {/* Move Layer Down */}
          <button
            type="button"
            className={styles.bottomActionBtn}
            disabled={!hasImage || !canMoveDown}
            onClick={() => {
              if (activeSelectedIds.length > 0) onMoveLayers?.(activeSelectedIds, 'down');
              else if (selectedLayerId) onMoveLayer?.(selectedLayerId, 'down');
            }}
            title="Move Layer Down (Ctrl+[)"
            aria-label="Move Down"
            data-testid="layer-order-down-btn"
          >
            <ArrowDown size={14} />
          </button>

          {/* Add Layer Mask */}
          <button
            type="button"
            className={styles.bottomActionBtn}
            disabled={!hasImage || !currentActiveLayer}
            onClick={() => currentActiveLayer && onAddLayerMask?.(currentActiveLayer.id, 'reveal-all')}
            title="Add Layer Mask"
            aria-label="Add Layer Mask"
            data-testid="layers-add-mask-btn"
          >
            <SquareCode size={14} />
          </button>

          {/* Blending Options Quick Trigger */}
          <button
            type="button"
            className={styles.bottomActionBtn}
            disabled={!hasImage || !currentActiveLayer}
            onClick={() => currentActiveLayer && onOpenBlendingOptions?.(currentActiveLayer)}
            title="Blending Options..."
            aria-label="Blending Options"
            data-testid="layer-blending-quick-btn"
          >
            <Sliders size={14} />
          </button>
        </div>
      </div>

      {/* 4. Three-Dot & Right-Click Context Menu (Requirement #3) */}
      {contextMenu && (
        <>
          <div
            className={styles.contextMenuBackdrop}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className={styles.contextMenuPopup}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
            data-testid="layer-context-menu"
          >
            {/* Blending Options */}
            <button
              type="button"
              className={styles.contextMenuItem}
              onClick={() => {
                setContextMenu(null);
                onOpenBlendingOptions?.(contextMenu.layer);
              }}
              data-testid="menu-blending-options"
            >
              <Sliders size={13} />
              <span>Blending Options...</span>
            </button>

            <div className={styles.contextMenuDivider} />

            {/* Clipping Mask */}
            <button
              type="button"
              className={styles.contextMenuItem}
              onClick={() => {
                setContextMenu(null);
                onToggleClippingMask?.(contextMenu.layer.id);
              }}
              data-testid="menu-clipping-mask"
            >
              <CornerDownRight size={13} />
              <span>
                {contextMenu.layer.clippingMask
                  ? 'Release Clipping Mask'
                  : 'Create Clipping Mask'}
              </span>
            </button>

            {/* Layer Mask Submenu / Toggle */}
            {contextMenu.layer.mask ? (
              <button
                type="button"
                className={styles.contextMenuItem}
                onClick={() => {
                  setContextMenu(null);
                  onDeleteLayerMask?.(contextMenu.layer.id);
                }}
                data-testid="menu-delete-mask"
              >
                <SquareCode size={13} />
                <span>Delete Layer Mask</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.contextMenuItem}
                  onClick={() => {
                    setContextMenu(null);
                    onAddLayerMask?.(contextMenu.layer.id, 'reveal-all');
                  }}
                  data-testid="menu-add-mask-reveal"
                >
                  <SquareCode size={13} />
                  <span>Add Layer Mask (Reveal All)</span>
                </button>
                <button
                  type="button"
                  className={styles.contextMenuItem}
                  onClick={() => {
                    setContextMenu(null);
                    onAddLayerMask?.(contextMenu.layer.id, 'hide-all');
                  }}
                  data-testid="menu-add-mask-hide"
                >
                  <SquareCode size={13} />
                  <span>Add Layer Mask (Hide All)</span>
                </button>
              </>
            )}

            <div className={styles.contextMenuDivider} />

            {/* Merge Layers (when 2+ layers selected) */}
            {activeSelectedIds.length > 1 && (
              <button
                type="button"
                className={styles.contextMenuItem}
                onClick={() => {
                  setContextMenu(null);
                  onMergeLayers?.(activeSelectedIds);
                }}
                data-testid="menu-merge-layers"
              >
                <Layers size={13} />
                <span>Merge Selected Layers</span>
              </button>
            )}

            {/* Duplicate */}
            <button
              type="button"
              className={styles.contextMenuItem}
              onClick={() => {
                setContextMenu(null);
                onDuplicateLayer?.(contextMenu.layer.id);
              }}
              data-testid="menu-duplicate-layer"
            >
              <Copy size={13} />
              <span>Duplicate Layer</span>
            </button>

            {/* Rename */}
            <button
              type="button"
              className={styles.contextMenuItem}
              onClick={() => {
                setContextMenu(null);
                handleStartRename(contextMenu.layer);
              }}
              data-testid="menu-rename-layer"
            >
              <Edit2 size={13} />
              <span>Rename Layer</span>
            </button>

            <div className={styles.contextMenuDivider} />

            {/* Move Up */}
            <button
              type="button"
              className={styles.contextMenuItem}
              disabled={!canMoveUp}
              onClick={() => {
                setContextMenu(null);
                onMoveLayer?.(contextMenu.layer.id, 'up');
              }}
            >
              <ArrowUp size={13} />
              <span>Move Up (Ctrl+])</span>
            </button>

            {/* Move Down */}
            <button
              type="button"
              className={styles.contextMenuItem}
              disabled={!canMoveDown}
              onClick={() => {
                setContextMenu(null);
                onMoveLayer?.(contextMenu.layer.id, 'down');
              }}
            >
              <ArrowDown size={13} />
              <span>Move Down (Ctrl+[)</span>
            </button>

            {/* Bring to Front */}
            <button
              type="button"
              className={styles.contextMenuItem}
              disabled={!canMoveUp}
              onClick={() => {
                setContextMenu(null);
                onBringToFront?.(contextMenu.layer.id);
              }}
            >
              <ChevronsUp size={13} />
              <span>Bring to Front (Ctrl+Shift+])</span>
            </button>

            {/* Send to Back */}
            <button
              type="button"
              className={styles.contextMenuItem}
              disabled={!canMoveDown}
              onClick={() => {
                setContextMenu(null);
                onSendToBack?.(contextMenu.layer.id);
              }}
            >
              <ChevronsDown size={13} />
              <span>Send to Back (Ctrl+Shift+[)</span>
            </button>

            <div className={styles.contextMenuDivider} />

            {/* Delete */}
            <button
              type="button"
              className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`}
              onClick={() => {
                setContextMenu(null);
                onDeleteLayer?.(contextMenu.layer.id);
              }}
              data-testid="menu-delete-layer"
            >
              <Trash2 size={13} />
              <span>Delete Layer</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default LayersPanel;
