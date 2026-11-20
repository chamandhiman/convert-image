import { useState } from 'react';
import {
  SlidersHorizontal,
  Layers as LayersIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { HistoryPanel } from './HistoryPanel';
import styles from './RightWorkspace.module.css';

export function RightWorkspace({
  // Global / Document State
  hasImage = false,
  currentWidth,
  currentHeight,
  zoom = 1,
  // Layers State & Handlers
  layers = [],
  selectedLayer,
  selectedLayerId,
  selectedLayerIds = [],
  onSelectLayers,
  onSelectLayer,
  onUpdateLayer,
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
  // History State & Handlers
  history = [],
  historyIndex = -1,
  onJumpToHistory,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onResetOriginal,
  canReset = false,
  // Tools / Canvas Settings for Properties Panel
  activeTool = 'move',
  foregroundColor = '#7C3AED',
  backgroundColor = '#FFFFFF',
  lockAspectRatio = true,
  onToggleLockAspect,
  onScalePreset,
  resizeWidth,
  resizeHeight,
  onResizeWidthChange,
  onResizeHeightChange,
  onApplyResize,
  cropPreset,
  onSelectCropPreset,
  cropBox,
  onApplyCrop,
  onCancelCrop,
  rotateAngle,
  flipH,
  flipV,
  onAngleChange,
  onFlipH,
  onFlipV,
  onResetRotation,
  onApplyRotate,
  canvasWidth,
  canvasHeight,
  onCanvasWidthChange,
  onCanvasHeightChange,
  canvasBgOption,
  onCanvasBgOptionChange,
  canvasCustomColor,
  onCanvasCustomColorChange,
  onApplyCanvas,
  textSettings,
  onUpdateTextSettings,
  brushSize,
  onBrushSizeChange,
  brushHardness,
  onBrushHardnessChange,
  brushOpacity,
  onBrushOpacityChange,
}) {
  const [activeTab, setActiveTab] = useState('layers'); // 'properties' | 'layers' | 'history'
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`${styles.rightWorkspace} ${isCollapsed ? styles.rightWorkspaceCollapsed : ''}`}
      aria-label="Right Docked Panels"
      data-testid="right-workspace"
    >
      {/* -------------------------------------------------------------
          TOP TAB BAR
          ------------------------------------------------------------- */}
      {!isCollapsed ? (
        <div className={styles.dockTabBar} role="tablist">
          {/* Properties Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'properties'}
            className={`${styles.dockTab} ${activeTab === 'properties' ? styles.dockTabActive : ''}`}
            onClick={() => setActiveTab('properties')}
            title="Object and Document Properties"
            data-testid="tab-properties"
          >
            <SlidersHorizontal size={14} className={styles.tabIcon} />
            <span>Properties</span>
          </button>

          {/* Layers Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'layers'}
            className={`${styles.dockTab} ${activeTab === 'layers' ? styles.dockTabActive : ''}`}
            onClick={() => setActiveTab('layers')}
            title="Layer Management"
            data-testid="tab-layers"
          >
            <LayersIcon size={14} className={styles.tabIcon} />
            <span>Layers</span>
            {layers.length > 0 && <span className={styles.tabBadge}>{layers.length}</span>}
          </button>

          {/* History Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            className={`${styles.dockTab} ${activeTab === 'history' ? styles.dockTabActive : ''}`}
            onClick={() => setActiveTab('history')}
            title="Action History Timeline"
            data-testid="tab-history"
          >
            <Clock size={14} className={styles.tabIcon} />
            <span>History</span>
            {history.length > 0 && <span className={styles.tabBadge}>{history.length}</span>}
          </button>

          {/* Collapse Panel Button */}
          <button
            type="button"
            className={styles.collapseToggleBtn}
            onClick={() => setIsCollapsed(true)}
            title="Collapse Right Panel"
            aria-label="Collapse Right Panel"
            data-testid="btn-collapse-dock"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        /* Collapsed Tab Strip */
        <div className={styles.collapsedStrip}>
          <button
            type="button"
            className={styles.collapseToggleBtn}
            onClick={() => setIsCollapsed(false)}
            title="Expand Right Panel"
            aria-label="Expand Right Panel"
            data-testid="btn-expand-dock"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            type="button"
            className={`${styles.collapsedTabBtn} ${activeTab === 'properties' ? styles.collapsedTabActive : ''}`}
            onClick={() => {
              setActiveTab('properties');
              setIsCollapsed(false);
            }}
            title="Properties"
          >
            <SlidersHorizontal size={15} />
          </button>

          <button
            type="button"
            className={`${styles.collapsedTabBtn} ${activeTab === 'layers' ? styles.collapsedTabActive : ''}`}
            onClick={() => {
              setActiveTab('layers');
              setIsCollapsed(false);
            }}
            title="Layers"
          >
            <LayersIcon size={15} />
          </button>

          <button
            type="button"
            className={`${styles.collapsedTabBtn} ${activeTab === 'history' ? styles.collapsedTabActive : ''}`}
            onClick={() => {
              setActiveTab('history');
              setIsCollapsed(false);
            }}
            title="History"
          >
            <Clock size={15} />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          PANEL CONTENT BODY
          ------------------------------------------------------------- */}
      {!isCollapsed && (
        <div className={styles.dockPanelBody}>
          {/* PROPERTIES PANEL */}
          {activeTab === 'properties' && (
            <div data-testid="properties-panel" style={{ height: '100%', overflowY: 'auto' }}>
              <PropertiesPanel
                hasImage={hasImage}
                activeTool={activeTool}
                selectedLayer={selectedLayer}
                selectedLayerId={selectedLayerId}
                onUpdateLayer={onUpdateLayer}
                onDeleteLayer={onDeleteLayer}
                onDuplicateLayer={onDuplicateLayer}
                currentWidth={currentWidth}
                currentHeight={currentHeight}
                zoom={zoom}
                layers={layers}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                lockAspectRatio={lockAspectRatio}
                onToggleLockAspect={onToggleLockAspect}
                onScalePreset={onScalePreset}
                resizeWidth={resizeWidth}
                resizeHeight={resizeHeight}
                onResizeWidthChange={onResizeWidthChange}
                onResizeHeightChange={onResizeHeightChange}
                onApplyResize={onApplyResize}
                cropPreset={cropPreset}
                onSelectCropPreset={onSelectCropPreset}
                cropBox={cropBox}
                onApplyCrop={onApplyCrop}
                onCancelCrop={onCancelCrop}
                rotateAngle={rotateAngle}
                flipH={flipH}
                flipV={flipV}
                onAngleChange={onAngleChange}
                onFlipH={onFlipH}
                onFlipV={onFlipV}
                onResetRotation={onResetRotation}
                onApplyRotate={onApplyRotate}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                onCanvasWidthChange={onCanvasWidthChange}
                onCanvasHeightChange={onCanvasHeightChange}
                canvasBgOption={canvasBgOption}
                onCanvasBgOptionChange={onCanvasBgOptionChange}
                canvasCustomColor={canvasCustomColor}
                onCanvasCustomColorChange={onCanvasCustomColorChange}
                onApplyCanvas={onApplyCanvas}
                textSettings={textSettings}
                onUpdateTextSettings={onUpdateTextSettings}
                brushSize={brushSize}
                onBrushSizeChange={onBrushSizeChange}
                brushHardness={brushHardness}
                onBrushHardnessChange={onBrushHardnessChange}
                brushOpacity={brushOpacity}
                onBrushOpacityChange={onBrushOpacityChange}
              />
            </div>
          )}

          {/* LAYERS PANEL */}
          {activeTab === 'layers' && (
            <LayersPanel
              hasImage={hasImage}
              layers={layers}
              selectedLayerId={selectedLayerId}
              selectedLayerIds={selectedLayerIds}
              onSelectLayers={onSelectLayers}
              onSelectLayer={onSelectLayer}
              activeMaskLayerId={activeMaskLayerId}
              onSelectMaskTarget={onSelectMaskTarget}
              onAddBlankLayer={onAddBlankLayer}
              onAddBlankLayerAbove={onAddBlankLayerAbove}
              onAddBlankLayerBelow={onAddBlankLayerBelow}
              onAddGroup={onAddGroup}
              onDuplicateLayer={onDuplicateLayer}
              onDuplicateLayers={onDuplicateLayers}
              onDeleteLayer={onDeleteLayer}
              onDeleteLayers={onDeleteLayers}
              onMoveLayer={onMoveLayer}
              onMoveLayers={onMoveLayers}
              onBringToFront={onBringToFront}
              onSendToBack={onSendToBack}
              onToggleLock={onToggleLock}
              onToggleHide={onToggleHide}
              onRenameLayer={onRenameLayer}
              onReorderLayers={onReorderLayers}
              onOpenBlendingOptions={onOpenBlendingOptions}
              onToggleClippingMask={onToggleClippingMask}
              onAddLayerMask={onAddLayerMask}
              onDeleteLayerMask={onDeleteLayerMask}
              onMergeLayers={onMergeLayers}
              sourceDocId={sourceDocId}
              onTransferLayer={onTransferLayer}
            />
          )}

          {/* HISTORY PANEL */}
          {activeTab === 'history' && (
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
        </div>
      )}
    </aside>
  );
}

export default RightWorkspace;
