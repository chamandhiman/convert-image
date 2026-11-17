import { useState } from 'react';
import { Sliders, Layers as LayersIcon, Clock } from 'lucide-react';
import PropertiesPanel from './PropertiesPanel';
import LayersPanel from './LayersPanel';
import HistoryPanel from './HistoryPanel';
import styles from './RightWorkspace.module.css';

export function RightWorkspace({
  activeTab,
  activeTool = 'move',
  selectedLayer,
  onUpdateLayer,
  layers = [],
  selectedLayerId,
  onSelectLayer,
  onAddBlankLayer,
  onAddTextLayer,
  onAddShape,
  onAddImageLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayer,
  onToggleLock,
  onToggleHide,
  onRenameLayer,
  onReorderLayers,
  backgroundThumbnail,
  history = [],
  historyIndex = -1,
  onJumpToHistory,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetOriginal,
  canReset,
  // Tool properties props
  resizeWidth,
  resizeHeight,
  onResizeWidthChange,
  onResizeHeightChange,
  lockAspectRatio,
  onToggleLockAspect,
  onScalePreset,
  onApplyResize,
  cropPreset,
  onSelectCropPreset,
  cropBox,
  onApplyCrop,
  onCancelCrop,
  rotateAngle,
  flipH,
  flipV,
  onRotateLeft90,
  onRotateRight90,
  onRotate180,
  onResetRotation,
  onFlipH,
  onFlipV,
  onAngleChange,
  onApplyRotate,
  canvasWidth,
  canvasHeight,
  onCanvasWidthChange,
  onCanvasHeightChange,
  canvasAnchor,
  onCanvasAnchorChange,
  canvasBgOption,
  onCanvasBgOptionChange,
  canvasCustomColor,
  onCanvasCustomColorChange,
  onApplyCanvas,
  brushSize,
  onBrushSizeChange,
  brushHardness,
  onBrushHardnessChange,
  brushOpacity,
  onBrushOpacityChange,
  onClearEraser,
  hasImage = false,
  currentWidth,
  currentHeight,
  zoom = 1,
  foregroundColor = '#7C3AED',
  onForegroundColorChange,
  backgroundColor = '#FFFFFF',
  onBackgroundColorChange,
}) {
  const [activeInspectorTab, setActiveInspectorTab] = useState('properties');

  return (
    <aside className={styles.rightWorkspace} aria-label="Editor Properties, Layers and History">
      {/* 1. Unified 3-Tab Switcher Bar */}
      <div className={styles.inspectorTabsRow}>
        <button
          type="button"
          data-inspector-tab="properties"
          className={`${styles.tabBtn} ${
            activeInspectorTab === 'properties' ? styles.tabBtnActive : ''
          }`}
          onClick={() => setActiveInspectorTab('properties')}
        >
          <Sliders size={13} />
          <span>Properties</span>
        </button>

        <button
          type="button"
          data-inspector-tab="layers"
          className={`${styles.tabBtn} ${
            activeInspectorTab === 'layers' ? styles.tabBtnActive : ''
          }`}
          onClick={() => setActiveInspectorTab('layers')}
        >
          <LayersIcon size={13} />
          <span>Layers</span>
          {hasImage && (
            <span className={styles.tabBadge}>{layers.length}</span>
          )}
        </button>

        <button
          type="button"
          data-inspector-tab="history"
          className={`${styles.tabBtn} ${
            activeInspectorTab === 'history' ? styles.tabBtnActive : ''
          }`}
          onClick={() => setActiveInspectorTab('history')}
        >
          <Clock size={13} />
          <span>History</span>
        </button>
      </div>

      {/* 2. ONE Single Panel Body — Only Active Tab Rendered */}
      <div className={styles.panelBody}>
        {/* ===================================================================
            EMPTY STATE: No Image / Canvas Open
            =================================================================== */}
        {!hasImage ? (
          <div className={styles.emptyContainer}>
            {activeInspectorTab === 'properties' && (
              <div className={styles.emptyStateBox}>
                <div className={styles.emptyIconCard}>
                  {/* Vector SVG Sliders & Cursor Card matching mockup */}
                  <svg width="72" height="64" viewBox="0 0 72 64" fill="none">
                    <rect
                      x="10"
                      y="8"
                      width="50"
                      height="42"
                      rx="9"
                      stroke="#CBD5E1"
                      strokeWidth="2.5"
                      fill="#F8FAFC"
                    />
                    {/* Track 1 */}
                    <line x1="18" y1="22" x2="52" y2="22" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="28" cy="22" r="5" fill="#CBD5E1" />
                    {/* Track 2 */}
                    <line x1="18" y1="36" x2="52" y2="36" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="42" cy="36" r="5" fill="#CBD5E1" />
                    {/* Mouse pointer cursor overlapping */}
                    <path
                      d="M46 38L53 56L57 49L64 47L46 38Z"
                      fill="#CBD5E1"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className={styles.emptyHeading}>No selection</h3>
                <p className={styles.emptySubtext}>
                  Create a canvas or open an image to start editing.
                </p>
              </div>
            )}

            {activeInspectorTab === 'layers' && (
              <div className={styles.emptyStateBox}>
                <div className={styles.emptyIconCard}>
                  {/* Vector SVG Stacked Layers */}
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path
                      d="M32 14L14 24L32 34L50 24L32 14Z"
                      stroke="#CBD5E1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="#F8FAFC"
                    />
                    <path
                      d="M14 34L32 44L50 34"
                      stroke="#CBD5E1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 44L32 54L50 44"
                      stroke="#CBD5E1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className={styles.emptyHeading}>No layers yet</h3>
                <p className={styles.emptySubtext}>
                  Create a canvas or open an image to see your layers here.
                </p>
              </div>
            )}

            {activeInspectorTab === 'history' && (
              <div className={styles.emptyStateBox}>
                <div className={styles.emptyIconCard}>
                  {/* Vector SVG Clock / History */}
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="22" stroke="#CBD5E1" strokeWidth="2.5" fill="#F8FAFC" />
                    <path
                      d="M32 20V32L40 36"
                      stroke="#CBD5E1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className={styles.emptyHeading}>No actions yet</h3>
                <p className={styles.emptySubtext}>
                  Your editing actions will appear here.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ===================================================================
              ACTIVE EDITOR STATE: Normal Panels
              =================================================================== */
          <>
            {activeInspectorTab === 'properties' && (
              <PropertiesPanel
                activeTab={activeTab}
                activeTool={activeTool}
                selectedLayer={selectedLayer}
                selectedLayerId={selectedLayerId}
                onUpdateLayer={onUpdateLayer}
                onDeleteLayer={onDeleteLayer}
                onDuplicateLayer={onDuplicateLayer}
                resizeWidth={resizeWidth}
                resizeHeight={resizeHeight}
                onResizeWidthChange={onResizeWidthChange}
                onResizeHeightChange={onResizeHeightChange}
                lockAspectRatio={lockAspectRatio}
                onToggleLockAspect={onToggleLockAspect}
                onScalePreset={onScalePreset}
                onApplyResize={onApplyResize}
                cropPreset={cropPreset}
                onSelectCropPreset={onSelectCropPreset}
                cropBox={cropBox}
                onApplyCrop={onApplyCrop}
                onCancelCrop={onCancelCrop}
                rotateAngle={rotateAngle}
                flipH={flipH}
                flipV={flipV}
                onRotateLeft90={onRotateLeft90}
                onRotateRight90={onRotateRight90}
                onRotate180={onRotate180}
                onResetRotation={onResetRotation}
                onFlipH={onFlipH}
                onFlipV={onFlipV}
                onAngleChange={onAngleChange}
                onApplyRotate={onApplyRotate}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                onCanvasWidthChange={onCanvasWidthChange}
                onCanvasHeightChange={onCanvasHeightChange}
                canvasAnchor={canvasAnchor}
                onCanvasAnchorChange={onCanvasAnchorChange}
                canvasBgOption={canvasBgOption}
                onCanvasBgOptionChange={onCanvasBgOptionChange}
                canvasCustomColor={canvasCustomColor}
                onCanvasCustomColorChange={onCanvasCustomColorChange}
                onApplyCanvas={onApplyCanvas}
                brushSize={brushSize}
                onBrushSizeChange={onBrushSizeChange}
                brushHardness={brushHardness}
                onBrushHardnessChange={onBrushHardnessChange}
                brushOpacity={brushOpacity}
                onBrushOpacityChange={onBrushOpacityChange}
                onClearEraser={onClearEraser}
                onAddShape={onAddShape}
                onAddTextLayer={onAddTextLayer}
                hasImage={hasImage}
                currentWidth={currentWidth}
                currentHeight={currentHeight}
                zoom={zoom}
                foregroundColor={foregroundColor}
                onForegroundColorChange={onForegroundColorChange}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={onBackgroundColorChange}
                layers={layers}
              />
            )}

            {activeInspectorTab === 'layers' && (
              <LayersPanel
                layers={layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={onSelectLayer}
                onAddBlankLayer={onAddBlankLayer}
                onDuplicateLayer={onDuplicateLayer}
                onDeleteLayer={onDeleteLayer}
                onMoveLayer={onMoveLayer}
                onToggleLock={onToggleLock}
                onToggleHide={onToggleHide}
                onRenameLayer={onRenameLayer}
                onReorderLayers={onReorderLayers}
              />
            )}

            {activeInspectorTab === 'history' && (
              <HistoryPanel
                history={history}
                historyIndex={historyIndex}
                onJumpToHistory={onJumpToHistory}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={onUndo}
                onRedo={onRedo}
                onResetOriginal={onResetOriginal}
                canReset={canReset}
              />
            )}
          </>
        )}
      </div>
    </aside>
  );
}

export default RightWorkspace;
