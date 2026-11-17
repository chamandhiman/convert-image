import { useState, useRef } from 'react';
import {
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
} from 'lucide-react';
import styles from './LayersPanel.module.css';

export function LayersPanel({
  layers = [],
  selectedLayerId,
  onSelectLayer,
  onAddBlankLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayer,
  onToggleLock,
  onToggleHide,
  onRenameLayer,
  onReorderLayers,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const touchStartRef = useRef(null);

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

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const selectedIdx = layers.findIndex((l) => l.id === selectedLayerId);

  // In stacking order, top layer is at layers.length - 1
  const canMoveUp = selectedIdx !== -1 && selectedIdx < layers.length - 1;
  const canMoveDown = selectedIdx !== -1 && selectedIdx > 0;

  return (
    <div className={styles.layersContainer} data-testid="layers-panel">
      {/* 1. Header Bar with Layer Count: Matches "Layers (3)" mockup */}
      <div className={styles.headerRow}>
        <div className={styles.titleWithBadge}>
          <span className={styles.panelTitle} data-testid="layers-panel-title">
            Layers ({layers.length})
          </span>
        </div>
      </div>

      {/* 2. Interactive Layers Stack List (Reversed so top layer is at top) */}
      <div
        className={styles.layersList}
        data-testid="layers-list"
        onDragOver={(e) => e.stopPropagation()}
        onDrop={(e) => e.stopPropagation()}
      >
        {layers.length === 0 ? (
          <div className={styles.emptyLayersState} data-testid="layers-empty">
            <p className={styles.emptyLayersTitle}>No layers yet</p>
            <span className={styles.emptyLayersSubtext}>Click + below to create a layer</span>
          </div>
        ) : (
          [...layers]
            .map((layer, index) => ({ layer, index }))
            .reverse()
            .map(({ layer, index }) => {
              const isSelected = layer.id === selectedLayerId;
              const isRenaming = renamingId === layer.id;

              return (
                <div
                  key={layer.id}
                  data-testid={`layer-row-${layer.id}`}
                  data-layer-id={layer.id}
                  data-layer-selected={isSelected ? 'true' : 'false'}
                  data-layer-hidden={layer.hidden ? 'true' : 'false'}
                  data-layer-locked={layer.locked ? 'true' : 'false'}
                  className={`${styles.layerRow} ${isSelected ? styles.layerRowSelected : ''} ${
                    layer.hidden ? styles.layerRowHidden : ''
                  } ${layer.locked ? styles.layerRowLocked : ''} ${
                    dragOverIdx === index ? styles.layerRowDragOver : ''
                  }`}
                  draggable={!layer.locked}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    if (typeof window !== 'undefined') window.__isInternalLayerDrag = true;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(index));
                    setDraggedIdx(index);
                  }}
                  onDragEnd={(e) => {
                    e.stopPropagation();
                    if (typeof window !== 'undefined') window.__isInternalLayerDrag = false;
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
                    if (typeof window !== 'undefined') window.__isInternalLayerDrag = false;
                    const raw = e.dataTransfer.getData('text/plain');
                    const src = raw !== '' ? parseInt(raw, 10) : draggedIdx;
                    if (src !== null && !isNaN(src) && src !== index) {
                      onReorderLayers(src, index);
                    }
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onClick={() => onSelectLayer(layer.id)}
                >
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
                  <div className={styles.layerThumbnail} data-testid={`layer-thumb-${layer.id}`}>
                    {layer.type === 'image' && layer.dataUrl ? (
                      <img
                        src={layer.dataUrl}
                        alt={layer.name || 'Image'}
                        className={styles.layerThumbImg}
                      />
                    ) : layer.type === 'text' ? (
                      <span className={styles.textBadgeIcon}>T</span>
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
                      /* Blank layer: Clean transparent checkerboard */
                      <div className={styles.blankThumbInner} />
                    )}
                  </div>

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

      {/* 3. Bottom Toolbar — Exactly matching Photoshop & mockup */}
      <div className={styles.bottomToolbar} role="toolbar" aria-label="Layer actions" data-testid="layers-bottom-toolbar">
        {/* + Add Layer Button (Creates genuine blank layer directly) */}
        <div className={styles.addBtnWrapper}>
          <button
            type="button"
            className={styles.addLayerBtn}
            onClick={onAddBlankLayer}
            title="Add Layer"
            aria-label="Add Layer"
            data-testid="layers-add-btn"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
          <span className={styles.btnTooltip}>Add Layer</span>
        </div>

        {/* Duplicate Layer Button */}
        <button
          type="button"
          className={styles.toolbarBtn}
          disabled={!selectedLayer}
          onClick={() => selectedLayer && onDuplicateLayer(selectedLayer.id)}
          title="Duplicate Layer"
          aria-label="Duplicate Layer"
          data-testid="layers-dup-btn"
        >
          <Copy size={16} />
        </button>

        {/* Delete Layer Button */}
        <button
          type="button"
          className={`${styles.toolbarBtn} ${styles.toolbarDeleteBtn}`}
          disabled={!selectedLayer}
          onClick={() => selectedLayer && onDeleteLayer(selectedLayer.id)}
          title="Delete Layer"
          aria-label="Delete Layer"
          data-testid="layers-del-btn"
        >
          <Trash2 size={16} />
        </button>

        {/* Vertical Divider */}
        <div className={styles.toolbarDivider} aria-hidden="true" />

        {/* Move Up Button */}
        <button
          type="button"
          className={styles.toolbarBtn}
          disabled={!canMoveUp}
          onClick={() => selectedLayer && onMoveLayer(selectedLayer.id, 'up')}
          title="Move Layer Up"
          aria-label="Move Layer Up"
          data-testid="layers-moveup-btn"
        >
          <ArrowUp size={16} strokeWidth={2.2} />
        </button>

        {/* Move Down Button */}
        <button
          type="button"
          className={styles.toolbarBtn}
          disabled={!canMoveDown}
          onClick={() => selectedLayer && onMoveLayer(selectedLayer.id, 'down')}
          title="Move Layer Down"
          aria-label="Move Layer Down"
          data-testid="layers-movedown-btn"
        >
          <ArrowDown size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

export default LayersPanel;
