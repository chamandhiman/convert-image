import { useRef } from 'react';
import {
  MousePointer,
  Crop as CropIcon,
  Scaling,
  RotateCw,
  Layout,
  Type,
  LayoutGrid,
  Square,
  Circle,
  Triangle,
  Minus,
  Star,
  Hexagon,
  ArrowRight,
  Paintbrush,
  Eraser,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  Check,
  X,
  Bold,
  Italic,
  Underline,
  ArrowLeftRight,
  Wand2,
  Lasso,
  PenTool,
  Bandage,
  Trash2,
  Layers,
  SquareDashed,
  CircleDashed,
  Spline,
  ChevronDown,
} from 'lucide-react';
import styles from './ContextualToolbar.module.css';

const SHAPE_PALETTE_ITEMS = [
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'rounded-rect', label: 'Rounded Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'ellipse', label: 'Ellipse', icon: Circle },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'polygon', label: 'Polygon', icon: Hexagon },
  { id: 'arrow', label: 'Arrow', icon: ArrowRight },
];

const SHAPE_OPTIONS = [
  { id: 'rect', label: 'Rectangle' },
  { id: 'rounded-rect', label: 'Rounded Rectangle' },
  { id: 'circle', label: 'Circle' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'line', label: 'Line' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'star', label: 'Star' },
  { id: 'polygon', label: 'Polygon' },
];

const BLEND_MODES = [
  { id: 'normal', label: 'Normal' },
  { id: 'dissolve', label: 'Dissolve' },
  { id: 'darken', label: 'Darken' },
  { id: 'multiply', label: 'Multiply' },
  { id: 'color-burn', label: 'Color Burn' },
  { id: 'lighten', label: 'Lighten' },
  { id: 'screen', label: 'Screen' },
  { id: 'color-dodge', label: 'Color Dodge' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'soft-light', label: 'Soft Light' },
  { id: 'hard-light', label: 'Hard Light' },
  { id: 'difference', label: 'Difference' },
];

const CROP_RATIOS = [
  { id: 'free', label: 'Freeform' },
  { id: '1:1', label: '1:1' },
  { id: '16:9', label: '16:9' },
  { id: '4:3', label: '4:3' },
  { id: '9:16', label: '9:16' },
  { id: '3:2', label: '3:2' },
];

const FONT_FAMILIES = [
  'Poppins',
  'Inter',
  'Roboto',
  'Montserrat',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120, 144];

const STROKE_WIDTH_OPTIONS = [
  { value: 0, label: '0 px' },
  { value: 1, label: '1 px' },
  { value: 2, label: '2 px' },
  { value: 3, label: '3 px' },
  { value: 4, label: '4 px' },
  { value: 5, label: '5 px' },
  { value: 8, label: '8 px' },
  { value: 10, label: '10 px' },
];

const OPACITY_OPTIONS = [100, 90, 80, 75, 50, 25, 10];

export const TEXT_SAMPLE_PRESETS = [
  {
    id: 'h1',
    label: 'Heading 1',
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 1.2,
    letterSpacing: -1,
    align: 'left',
    sampleText: 'Lorem Ipsum Dolor Sit Amet',
    autoWidth: true,
  },
  {
    id: 'h2',
    label: 'Heading 2',
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 1.25,
    letterSpacing: -0.5,
    align: 'left',
    sampleText: 'Lorem Ipsum Dolor Sit Amet',
    autoWidth: true,
  },
  {
    id: 'h3',
    label: 'Heading 3',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 1.3,
    letterSpacing: 0,
    align: 'left',
    sampleText: 'Lorem Ipsum Dolor Sit Amet',
    autoWidth: true,
  },
  {
    id: 'h4',
    label: 'Heading 4',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 1.35,
    letterSpacing: 0,
    align: 'left',
    sampleText: 'Lorem Ipsum Dolor Sit Amet',
    autoWidth: true,
  },
  {
    id: 'paragraph',
    label: 'Paragraph',
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    letterSpacing: 0,
    align: 'left',
    sampleText:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    autoWidth: false,
  },
  {
    id: 'small-paragraph',
    label: 'Small Paragraph',
    fontSize: 13,
    fontWeight: 'normal',
    lineHeight: 1.4,
    letterSpacing: 0,
    align: 'left',
    sampleText:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    autoWidth: false,
  },
];

export function ContextualToolbar({
  activeTool = 'move',
  onSelectTool,
  selectedLayer,
  selectedLayerIds = [],
  onUpdateLayer,
  currentWidth = 800,
  currentHeight = 600,
  zoom = 1,
  // Select / Move props
  lockAspectRatio = false,
  onToggleLockAspect,
  onAlignLayers,
  onDistributeLayers,
  onMergeLayers,
  onDeleteSelectedLayers,
  // Selection Tools props
  activeSelection = null,
  selectionFeather = 0,
  onSelectionFeatherChange,
  selectionTolerance = 32,
  onSelectionToleranceChange,
  onDeselect,
  onInvertSelection,
  onSelectAll,
  onDeleteSelectedPixels,
  onConvertSelectionToMask,
  // Pen Tool props
  penPath = null,
  penFillColor = '#7C3AED',
  onPenFillColorChange,
  penStrokeColor = '#7C3AED',
  onPenStrokeColorChange,
  penStrokeWidth = 2,
  onPenStrokeWidthChange,
  onMakeSelectionFromPen,
  onMakeShapeFromPen,
  onMakeMaskFromPen,
  onStrokePenPath,
  onFillPenPath,
  onClearPenPath,
  // Patch Tool props
  patchMode = 'source',
  onPatchModeChange,
  patchFeather = 4,
  onPatchFeatherChange,
  hasPatchSelection = false,
  onApplyPatch,
  onCancelPatch,
  // Crop props
  cropPreset = 'free',
  onSelectCropPreset,
  cropBox = { width: 0, height: 0 },
  onApplyCrop,
  onCancelCrop,
  // Resize props
  resizeWidth = 800,
  resizeHeight = 600,
  onResizeWidthChange,
  onResizeHeightChange,
  onScalePreset,
  onApplyResize,
  onOpenResizeModal,
  // Rotate props
  rotateAngle = 0,
  onAngleChange,
  onFlipH,
  onFlipV,
  onResetRotation,
  onApplyRotate,
  // Canvas props
  canvasWidth = 800,
  canvasHeight = 600,
  onCanvasWidthChange,
  onCanvasHeightChange,
  canvasBgOption = 'transparent',
  onCanvasBgOptionChange,
  canvasCustomColor = '#ffffff',
  onCanvasCustomColorChange,
  onApplyCanvas,
  onOpenCanvasModal,
  // Text props
  textSettings = {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    color: '#1e293b',
    align: 'left',
    lineHeight: 1.2,
    letterSpacing: 0,
    bgColor: 'transparent',
    opacity: 100,
  },
  onUpdateTextSettings,
  onApplyTextPreset,
  // Shapes props
  activeShapeType = 'rect',
  onSelectShapeType,
  foregroundColor = '#7C3AED',
  onForegroundColorChange,
  backgroundColor = '#FFFFFF',
  onBackgroundColorChange,
  onSwapColors,
  // Brush & Eraser props
  brushSize = 36,
  onBrushSizeChange,
  brushHardness = 80,
  onBrushHardnessChange,
  brushOpacity = 100,
  onBrushOpacityChange,
  onClearEraser,
}) {
  const fillColorRef = useRef(null);
  const strokeColorRef = useRef(null);
  const shapeFillColorRef = useRef(null);
  const shapeStrokeColorRef = useRef(null);
  const penFillColorRef = useRef(null);
  const penStrokeColorRef = useRef(null);
  const textColorRef = useRef(null);
  const textStrokeColorRef = useRef(null);
  const textBgColorRef = useRef(null);
  const brushColorRef = useRef(null);
  const canvasColorRef = useRef(null);
  const fgInputRef = useRef(null);
  const bgInputRef = useRef(null);

  // Classify active selection and layer types
  const isMultiSelected = selectedLayerIds && selectedLayerIds.length > 1;
  const isShapeLayer = Boolean(selectedLayer && selectedLayer.type === 'shape');
  const isTextLayer = Boolean(selectedLayer && selectedLayer.type === 'text');
  const isImageLayer = Boolean(
    selectedLayer &&
    (selectedLayer.type === 'image' ||
      selectedLayer.type === 'raster' ||
      selectedLayer.type === 'blank' ||
      selectedLayer.id === 'background')
  );

  const isShapeTool =
    activeTool === 'shapes' ||
    ['rect', 'rounded-rect', 'circle', 'ellipse', 'triangle', 'line', 'star', 'polygon', 'arrow'].includes(
      activeTool
    );

  const isSelectionTool = [
    'marquee-rect',
    'marquee-ellipse',
    'lasso',
    'polygonal-lasso',
    'magic-wand',
  ].includes(activeTool);

  const penPointsCount = penPath?.points?.length || 0;
  const isPenPathClosed = penPath?.closed || false;

  // Compute effective view according to priority waterfall:
  // Modal Tools -> Text Tool Active -> Multi-Layer Selection -> Shape Layer -> Text Layer -> Image Layer -> Shape Create -> Select Default
  let effectiveView = 'select-empty';
  if (activeTool === 'crop') effectiveView = 'crop';
  else if (activeTool === 'resize') effectiveView = 'resize';
  else if (activeTool === 'rotate') effectiveView = 'rotate';
  else if (activeTool === 'canvas') effectiveView = 'canvas';
  else if (activeTool === 'brush' || activeTool === 'eraser') effectiveView = 'brush-eraser';
  else if (activeTool === 'pen') effectiveView = 'pen';
  else if (activeTool === 'patch') effectiveView = 'patch';
  else if (isSelectionTool) effectiveView = 'selection';
  else if (activeTool === 'text') effectiveView = 'text';
  else if (isMultiSelected) effectiveView = 'multi-layers';
  else if (isShapeLayer) effectiveView = 'shape';
  else if (isTextLayer) effectiveView = 'text';
  else if (isImageLayer) effectiveView = 'image';
  else if (isShapeTool) effectiveView = 'shape-create';
  else effectiveView = 'select-empty';

  // Layer alignment handlers
  const handleAlign = (mode) => {
    if (selectedLayerIds && selectedLayerIds.length > 1 && onAlignLayers) {
      onAlignLayers(mode);
      return;
    }
    if (!selectedLayer || !onUpdateLayer) return;
    const lW = selectedLayer.width || 100;
    const lH = selectedLayer.height || 100;
    const cW = currentWidth || 800;
    const cH = currentHeight || 600;

    let newX = selectedLayer.x;
    let newY = selectedLayer.y;

    if (mode === 'left') newX = 0;
    else if (mode === 'center-h') newX = Math.round((cW - lW) / 2);
    else if (mode === 'right') newX = Math.round(cW - lW);
    else if (mode === 'top') newY = 0;
    else if (mode === 'middle-v') newY = Math.round((cH - lH) / 2);
    else if (mode === 'bottom') newY = Math.round(cH - lH);

    onUpdateLayer(selectedLayer.id, { x: newX, y: newY }, true);
  };

  const handleShapeTypeChange = (newType) => {
    if (!selectedLayer || selectedLayer.type !== 'shape') return;
    const shapeLabel = SHAPE_OPTIONS.find((s) => s.id === newType)?.label || 'Shape';
    onUpdateLayer?.(
      selectedLayer.id,
      {
        shapeType: newType,
        name: shapeLabel,
        borderRadius: newType === 'rounded-rect' ? (selectedLayer.borderRadius || 16) : (selectedLayer.borderRadius || 0),
      },
      true
    );
  };

  const currentText = isTextLayer ? selectedLayer : textSettings;

  const handleTextUpdate = (changes) => {
    if (isTextLayer && onUpdateLayer) {
      onUpdateLayer(selectedLayer.id, changes, true);
    }
    if (onUpdateTextSettings) {
      onUpdateTextSettings((prev) => ({ ...prev, ...changes }));
    }
  };

  const handleTextPresetSelect = (presetId) => {
    const preset = TEXT_SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (isTextLayer && onUpdateLayer) {
      const measuredW = preset.autoWidth
        ? Math.min(currentWidth - 40, Math.round(preset.sampleText.length * preset.fontSize * 0.65) + 30)
        : Math.min(currentWidth - 40, 480);
      onUpdateLayer(
        selectedLayer.id,
        {
          fontSize: preset.fontSize,
          fontWeight: preset.fontWeight,
          lineHeight: preset.lineHeight,
          letterSpacing: preset.letterSpacing,
          align: preset.align,
          text: preset.sampleText,
          autoWidth: preset.autoWidth,
          width: measuredW,
        },
        true
      );
    } else if (onApplyTextPreset) {
      onApplyTextPreset(preset);
    }
  };

  return (
    <div
      className={`${styles.contextualToolbarWrapper} ${effectiveView === 'text' ? styles.contextualToolbarWrapperText : ''
        }`}
      data-testid="contextual-toolbar"
      role="toolbar"
      aria-label="Tool options toolbar"
    >
      <div
        className={`${styles.contextualScrollArea} ${effectiveView === 'text' ? styles.contextualScrollAreaText : ''
          }`}
      >
        {/* ===================================================================
            1. MULTI-LAYER SELECTION MODE
            =================================================================== */}
        {effectiveView === 'multi-layers' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <MousePointer size={13} className={styles.toolBadgeIcon} />
              <span>Select</span>
            </div>

            <div className={styles.inputFieldGroup} title="Multiple layers selected">
              <span className={styles.inputLabel}>{selectedLayerIds.length} layers</span>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            <div className={styles.btnGroup} title="Align Selected Layers">
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('left')}
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('center-h')}
                title="Align Center Horizontal"
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('right')}
                title="Align Right"
              >
                <AlignRight size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('top')}
                title="Align Top"
              >
                <AlignVerticalJustifyStart size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('middle-v')}
                title="Align Middle Vertical"
              >
                <AlignVerticalJustifyCenter size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('bottom')}
                title="Align Bottom"
              >
                <AlignVerticalJustifyEnd size={13} />
              </button>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {onDistributeLayers && (
              <div className={styles.btnGroup} title="Distribute Selected Layers">
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => onDistributeLayers('horizontal')}
                  title="Distribute Horizontally"
                >
                  <ArrowLeftRight size={13} />
                </button>
              </div>
            )}

            <div className={styles.vDivider} aria-hidden="true" />

            {onMergeLayers && (
              <button
                type="button"
                className={styles.presetBtn}
                onClick={onMergeLayers}
                title="Merge Selected Layers into Single Raster Layer"
              >
                <Layers size={12} />
                <span>Merge</span>
              </button>
            )}

            {onDeleteSelectedLayers && (
              <button
                type="button"
                className={styles.actionBtnCancel}
                onClick={onDeleteSelectedLayers}
                title="Delete Selected Layers"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </>
        )}

        {/* ===================================================================
            2. AUTOMATIC SHAPE PROPERTIES (When a shape layer is selected)
            =================================================================== */}
        {effectiveView === 'shape' && selectedLayer && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <LayoutGrid size={13} className={styles.toolBadgeIcon} />
              <span>Shape</span>
            </div>

            {/* Shape Type Selector */}
            <div className={styles.inputFieldGroup} title="Shape Type">
              <span className={styles.inputLabel}>Shape:</span>
              <select
                value={selectedLayer.shapeType || 'rect'}
                onChange={(e) => handleShapeTypeChange(e.target.value)}
                className={styles.selectInsideGroup}
                style={{ minWidth: '95px' }}
                data-testid="select-shape-type"
              >
                {SHAPE_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
                {selectedLayer.shapeType === 'custom-path' && (
                  <option value="custom-path">Vector Path</option>
                )}
              </select>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Fill Color */}
            <div
              className={styles.colorPickerWrap}
              onClick={() => shapeFillColorRef.current?.click()}
              title="Shape Fill Color"
              data-testid="shape-fill-color"
            >
              <span className={styles.inputLabel}>Fill:</span>
              <div
                className={styles.colorSwatchSquare}
                style={{
                  backgroundColor:
                    selectedLayer.fillColor === 'transparent' ? 'transparent' : selectedLayer.fillColor || '#7C3AED',
                  backgroundImage:
                    selectedLayer.fillColor === 'transparent'
                      ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)'
                      : undefined,
                  backgroundSize: '6px 6px',
                }}
              />
              <span className={styles.colorHexText}>
                {selectedLayer.fillColor === 'transparent' ? 'None' : selectedLayer.fillColor || '#7C3AED'}
              </span>
              <input
                ref={shapeFillColorRef}
                type="color"
                value={
                  selectedLayer.fillColor === 'transparent' ? '#ffffff' : selectedLayer.fillColor || '#7C3AED'
                }
                onChange={(e) => onUpdateLayer?.(selectedLayer.id, { fillColor: e.target.value }, true)}
                className={styles.hiddenColorInput}
              />
            </div>

            {/* Transparent Fill Toggle */}
            <button
              type="button"
              className={`${styles.iconBtn} ${selectedLayer.fillColor === 'transparent' ? styles.iconBtnActive : ''}`}
              onClick={() =>
                onUpdateLayer?.(
                  selectedLayer.id,
                  { fillColor: selectedLayer.fillColor === 'transparent' ? (foregroundColor || '#7C3AED') : 'transparent' },
                  true
                )
              }
              title={selectedLayer.fillColor === 'transparent' ? 'Enable Color Fill' : 'Set Transparent Fill (No Fill)'}
              aria-label="Toggle Transparent Fill"
            >
              <X size={12} />
            </button>

            {/* Stroke Color */}
            <div
              className={styles.colorPickerWrap}
              onClick={() => shapeStrokeColorRef.current?.click()}
              title="Shape Stroke Color"
              data-testid="shape-stroke-color"
            >
              <span className={styles.inputLabel}>Stroke:</span>
              <div
                className={styles.colorSwatchSquare}
                style={{ backgroundColor: selectedLayer.strokeColor || '#000000' }}
              />
              <input
                ref={shapeStrokeColorRef}
                type="color"
                value={selectedLayer.strokeColor || '#000000'}
                onChange={(e) => onUpdateLayer?.(selectedLayer.id, { strokeColor: e.target.value }, true)}
                className={styles.hiddenColorInput}
              />
            </div>

            {/* Stroke Width */}
            <div className={styles.inputFieldGroup} title="Stroke Width (pixels)">
              <input
                type="number"
                min="0"
                max="50"
                value={selectedLayer.strokeWidth ?? 2}
                onChange={(e) =>
                  onUpdateLayer?.(
                    selectedLayer.id,
                    { strokeWidth: Math.max(0, parseInt(e.target.value, 10) || 0) },
                    true
                  )
                }
                className={styles.textInput}
                style={{ width: '38px' }}
                data-testid="input-shape-stroke-width"
              />
              <span className={styles.inputSuffix}>px</span>
            </div>

            {/* Corner Radius (where applicable for rect and rounded-rect) */}
            {(selectedLayer.shapeType === 'rounded-rect' || selectedLayer.shapeType === 'rect') && (
              <div className={styles.inputFieldGroup} title="Corner Radius (pixels)" data-testid="shape-corner-radius-wrap">
                <span className={styles.inputLabel}>Radius</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedLayer.borderRadius ?? (selectedLayer.shapeType === 'rounded-rect' ? 16 : 0)}
                  onChange={(e) =>
                    onUpdateLayer?.(
                      selectedLayer.id,
                      { borderRadius: Math.max(0, parseInt(e.target.value, 10) || 0) },
                      true
                    )
                  }
                  className={styles.textInput}
                  style={{ width: '38px' }}
                  data-testid="input-shape-corner-radius"
                />
                <span className={styles.inputSuffix}>px</span>
              </div>
            )}

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Opacity */}
            <div className={styles.inputFieldGroup} title="Shape Opacity">
              <span className={styles.inputLabel}>Opacity:</span>
              <select
                value={selectedLayer.opacity !== undefined ? selectedLayer.opacity : 100}
                onChange={(e) =>
                  onUpdateLayer?.(selectedLayer.id, { opacity: parseInt(e.target.value, 10) }, true)
                }
                className={styles.selectInsideGroup}
                style={{ minWidth: '70px' }}
                data-testid="select-shape-opacity"
              >
                <option value={100}>100%</option>
                <option value={90}>90%</option>
                <option value={75}>75%</option>
                <option value={50}>50%</option>
                <option value={25}>25%</option>
                <option value={10}>10%</option>
              </select>
            </div>

            {/* Blend Mode */}
            <div className={styles.inputFieldGroup} title="Shape Blend Mode">
              <span className={styles.inputLabel}>Blend:</span>
              <select
                value={selectedLayer.blendMode || 'normal'}
                onChange={(e) =>
                  onUpdateLayer?.(selectedLayer.id, { blendMode: e.target.value }, true)
                }
                className={styles.selectInsideGroup}
                style={{ minWidth: '95px' }}
                data-testid="select-shape-blend-mode"
              >
                {BLEND_MODES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Rotation Angle */}
            <div className={styles.inputFieldGroup} title="Shape Rotation">
              <span className={styles.inputLabel}>Rotate</span>
              <select
                value={selectedLayer.rotation || 0}
                onChange={(e) =>
                  onUpdateLayer?.(selectedLayer.id, { rotation: parseInt(e.target.value, 10) }, true)
                }
                className={styles.selectDropdown}
                style={{ border: 'none', padding: 0 }}
                data-testid="select-shape-rotation"
              >
                <option value={0}>0°</option>
                <option value={45}>45°</option>
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </select>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Alignment Buttons */}
            <div className={styles.btnGroup} title="Align Shape">
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('left')}
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('center-h')}
                title="Align Center Horizontal"
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('right')}
                title="Align Right"
              >
                <AlignRight size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('top')}
                title="Align Top"
              >
                <AlignVerticalJustifyStart size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('middle-v')}
                title="Align Middle Vertical"
              >
                <AlignVerticalJustifyCenter size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('bottom')}
                title="Align Bottom"
              >
                <AlignVerticalJustifyEnd size={13} />
              </button>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Lock Shape Layer */}
            <button
              type="button"
              className={`${styles.iconBtn} ${selectedLayer.locked ? styles.iconBtnActive : ''}`}
              onClick={() => onUpdateLayer?.(selectedLayer.id, { locked: !selectedLayer.locked }, true)}
              title={selectedLayer.locked ? 'Unlock Layer' : 'Lock Layer'}
              aria-label="Toggle Layer Lock"
              data-testid="btn-shape-lock"
            >
              {selectedLayer.locked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          </>
        )}

        {/* ===================================================================
            3. TEXT TOOL & TEXT LAYER CONTEXTUAL CONTROLS (Premium Minimal UI)
            =================================================================== */}
        {effectiveView === 'text' && (
          <div
            className={styles.textToolbarPill}
            data-testid="premium-text-toolbar"
            role="group"
            aria-label="Text Formatting Toolbar"
          >
            {/* 1. Tool Indicator: T ⌵ */}
            <div
              className={styles.toolIndicator}
              title="Type Tool"
              data-testid="contextual-tool-badge"
              onClick={() => onSelectTool?.('text')}
            >
              <span className={styles.toolIndicatorLetter}>T</span>
              <ChevronDown size={11} className={styles.toolIndicatorChevron} aria-hidden="true" />
            </div>

            {/* 2. Font Family */}
            <div className={styles.premiumSelectWrap} title="Font Family">
              <select
                value={currentText.fontFamily || 'Poppins'}
                onChange={(e) => handleTextUpdate({ fontFamily: e.target.value })}
                className={styles.premiumSelect}
                style={{ minWidth: '95px' }}
                data-testid="select-text-font-family"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
              <ChevronDown size={11} className={styles.premiumSelectChevron} aria-hidden="true" />
            </div>

            {/* 3. Font Size */}
            <div className={styles.premiumSelectWrap} title="Font Size (pixels)">
              <select
                value={currentText.fontSize || 36}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 36;
                  handleTextUpdate({ fontSize: val });
                }}
                className={styles.premiumSelect}
                style={{ minWidth: '48px' }}
                data-testid="select-text-font-size"
              >
                {!FONT_SIZES.includes(currentText.fontSize || 36) && (
                  <option value={currentText.fontSize}>{currentText.fontSize}</option>
                )}
                {FONT_SIZES.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
              <ChevronDown size={11} className={styles.premiumSelectChevron} aria-hidden="true" />
            </div>

            <div className={styles.pillDivider} aria-hidden="true" />

            {/* 4. Formatting: Bold, Italic, Underline */}
            <div className={styles.premiumBtnGroup} aria-label="Text Formatting">
              <button
                type="button"
                className={`${styles.premiumToggleBtn} ${currentText.fontWeight === 'bold' || currentText.fontWeight >= 700
                  ? styles.premiumToggleBtnActive
                  : ''
                  }`}
                onClick={() =>
                  handleTextUpdate({
                    fontWeight:
                      currentText.fontWeight === 'bold' || currentText.fontWeight >= 700
                        ? 'normal'
                        : 'bold',
                  })
                }
                title="Bold"
                aria-label="Bold"
                data-testid="btn-text-bold"
              >
                <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1 }}>B</span>
              </button>
              <button
                type="button"
                className={`${styles.premiumToggleBtn} ${currentText.fontStyle === 'italic' ? styles.premiumToggleBtnActive : ''
                  }`}
                onClick={() =>
                  handleTextUpdate({
                    fontStyle: currentText.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                title="Italic"
                aria-label="Italic"
                data-testid="btn-text-italic"
              >
                <span style={{ fontStyle: 'italic', fontWeight: 600, fontSize: 13, fontFamily: 'serif', lineHeight: 1 }}>I</span>
              </button>
              <button
                type="button"
                className={`${styles.premiumToggleBtn} ${currentText.underline ? styles.premiumToggleBtnActive : ''
                  }`}
                onClick={() => handleTextUpdate({ underline: !currentText.underline })}
                title="Underline"
                aria-label="Underline"
                data-testid="btn-text-underline"
              >
                <span style={{ textDecoration: 'underline', fontWeight: 600, fontSize: 13, lineHeight: 1 }}>U</span>
              </button>
            </div>

            <div className={styles.pillDivider} aria-hidden="true" />

            {/* 5. Text Alignment: Left, Center, Right */}
            <div className={styles.premiumBtnGroup} aria-label="Text Alignment">
              <button
                type="button"
                className={`${styles.premiumToggleBtn} ${(currentText.align || 'left') === 'left' ? styles.premiumToggleBtnActive : ''
                  }`}
                onClick={() => handleTextUpdate({ align: 'left' })}
                title="Align Left"
                aria-label="Align Left"
                data-testid="btn-text-align-left"
              >
                <AlignLeft size={14} />
              </button>
              <button
                type="button"
                className={`${styles.premiumToggleBtn} ${currentText.align === 'center' ? styles.premiumToggleBtnActive : ''
                  }`}
                onClick={() => handleTextUpdate({ align: 'center' })}
                title="Align Center"
                aria-label="Align Center"
                data-testid="btn-text-align-center"
              >
                <AlignCenter size={14} />
              </button>
              <button
                type="button"
                className={`${styles.premiumToggleBtn} ${currentText.align === 'right' ? styles.premiumToggleBtnActive : ''
                  }`}
                onClick={() => handleTextUpdate({ align: 'right' })}
                title="Align Right"
                aria-label="Align Right"
                data-testid="btn-text-align-right"
              >
                <AlignRight size={14} />
              </button>
            </div>

            <div className={styles.pillDivider} aria-hidden="true" />

            {/* 6. Text Color: A + Swatch */}
            <div className={styles.premiumColorGroup} title="Text Color" data-testid="wrap-text-color">
              <span className={styles.textColorA}>A</span>
              <button
                type="button"
                className={styles.premiumColorSwatch}
                style={{ backgroundColor: currentText.color || foregroundColor || '#7c3aed' }}
                onClick={() => textColorRef.current?.click()}
                aria-label="Change text color"
              />
              <input
                ref={textColorRef}
                type="color"
                value={currentText.color || foregroundColor || '#7c3aed'}
                onChange={(e) => handleTextUpdate({ color: e.target.value })}
                className={styles.hiddenColorInput}
                data-testid="input-text-color"
              />
            </div>

            <div className={styles.pillDivider} aria-hidden="true" />

            {/* 7. Stroke: Label + Swatch + Stroke Width */}
            <div className={styles.premiumStrokeGroup}>
              <span className={styles.premiumControlLabel}>Stroke</span>
              <button
                type="button"
                className={`${styles.premiumStrokeSwatch} ${(!currentText.strokeWidth || currentText.strokeWidth === 0) ? styles.strokeSwatchDisabled : ''
                  }`}
                style={{
                  backgroundColor:
                    (!currentText.strokeWidth || currentText.strokeWidth === 0)
                      ? '#ffffff'
                      : (currentText.strokeColor || '#000000'),
                }}
                onClick={() => {
                  if (!currentText.strokeWidth || currentText.strokeWidth === 0) {
                    handleTextUpdate({ strokeWidth: 1, strokeColor: currentText.strokeColor || '#000000' });
                  }
                  textStrokeColorRef.current?.click();
                }}
                title="Stroke Color"
                aria-label="Stroke Color"
                data-testid="wrap-text-stroke-color"
              >
                {(!currentText.strokeWidth || currentText.strokeWidth === 0) && (
                  <svg
                    className={styles.strokeSlashSvg}
                    viewBox="0 0 20 20"
                    width="20"
                    height="20"
                    aria-hidden="true"
                  >
                    <line x1="2" y1="2" x2="18" y2="18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              <input
                ref={textStrokeColorRef}
                type="color"
                value={currentText.strokeColor || '#000000'}
                onChange={(e) =>
                  handleTextUpdate({
                    strokeColor: e.target.value,
                    strokeWidth: currentText.strokeWidth || 1,
                  })
                }
                className={styles.hiddenColorInput}
                data-testid="input-text-stroke-color"
              />

              <div className={styles.premiumSelectWrap} title="Stroke Width">
                <select
                  value={currentText.strokeWidth ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    handleTextUpdate({
                      strokeWidth: val,
                      strokeColor: currentText.strokeColor || '#000000',
                    });
                  }}
                  className={styles.premiumSelect}
                  style={{ minWidth: '58px' }}
                  data-testid="select-text-stroke-width"
                >
                  {STROKE_WIDTH_OPTIONS.map((sw) => (
                    <option key={sw.value} value={sw.value}>
                      {sw.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className={styles.premiumSelectChevron} aria-hidden="true" />
              </div>
            </div>

            <div className={styles.pillDivider} aria-hidden="true" />

            {/* 8. Opacity: Label + Select */}
            <div className={styles.premiumOpacityGroup}>
              <span className={styles.premiumControlLabel}>Opacity</span>
              <div className={styles.premiumSelectWrap} title="Opacity">
                <select
                  value={currentText.opacity !== undefined ? currentText.opacity : 100}
                  onChange={(e) => handleTextUpdate({ opacity: parseInt(e.target.value, 10) })}
                  className={styles.premiumSelect}
                  style={{ minWidth: '64px' }}
                  data-testid="select-text-opacity"
                >
                  {OPACITY_OPTIONS.map((op) => (
                    <option key={op} value={op}>
                      {op}%
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className={styles.premiumSelectChevron} aria-hidden="true" />
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            4. IMAGE / RASTER LAYER PROPERTIES (When an image layer is selected)
            =================================================================== */}
        {effectiveView === 'image' && selectedLayer && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <MousePointer size={13} className={styles.toolBadgeIcon} />
              <span>{selectedLayer.name || 'Image'}</span>
            </div>

            {/* Rotation Angle */}
            <div className={styles.inputFieldGroup} title="Layer Rotation">
              <span className={styles.inputLabel}>Rotate</span>
              <select
                value={selectedLayer.rotation || 0}
                onChange={(e) =>
                  onUpdateLayer?.(selectedLayer.id, { rotation: parseInt(e.target.value, 10) }, true)
                }
                className={styles.selectDropdown}
                style={{ border: 'none', padding: 0 }}
              >
                <option value={0}>0°</option>
                <option value={45}>45°</option>
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </select>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Alignment Buttons */}
            <div className={styles.btnGroup} title="Align Layer">
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('left')}
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('center-h')}
                title="Align Center Horizontal"
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('right')}
                title="Align Right"
              >
                <AlignRight size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('top')}
                title="Align Top"
              >
                <AlignVerticalJustifyStart size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('middle-v')}
                title="Align Middle Vertical"
              >
                <AlignVerticalJustifyCenter size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => handleAlign('bottom')}
                title="Align Bottom"
              >
                <AlignVerticalJustifyEnd size={13} />
              </button>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Opacity */}
            <div className={styles.inputFieldGroup} title="Layer Opacity">
              <span className={styles.inputLabel}>Opacity</span>
              <select
                value={selectedLayer.opacity !== undefined ? selectedLayer.opacity : 100}
                onChange={(e) =>
                  onUpdateLayer?.(selectedLayer.id, { opacity: parseInt(e.target.value, 10) }, true)
                }
                className={styles.selectInsideGroup}
                style={{ minWidth: '70px' }}
                data-testid="select-image-opacity"
              >
                <option value={100}>100%</option>
                <option value={90}>90%</option>
                <option value={75}>75%</option>
                <option value={50}>50%</option>
                <option value={25}>25%</option>
                <option value={10}>10%</option>
              </select>
            </div>

            {/* Blend Mode */}
            <div className={styles.inputFieldGroup} title="Layer Blend Mode">
              <span className={styles.inputLabel}>Blend</span>
              <select
                value={selectedLayer.blendMode || 'normal'}
                onChange={(e) =>
                  onUpdateLayer?.(selectedLayer.id, { blendMode: e.target.value }, true)
                }
                className={styles.selectInsideGroup}
                style={{ minWidth: '95px' }}
                data-testid="select-image-blend-mode"
              >
                {BLEND_MODES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Lock Button */}
            <button
              type="button"
              className={`${styles.iconBtn} ${selectedLayer.locked ? styles.iconBtnActive : ''}`}
              onClick={() => onUpdateLayer?.(selectedLayer.id, { locked: !selectedLayer.locked }, true)}
              title={selectedLayer.locked ? 'Unlock Layer' : 'Lock Layer'}
              aria-label="Toggle Layer Lock"
            >
              {selectedLayer.locked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          </>
        )}

        {/* ===================================================================
            5. SHAPES CREATION PALETTE (When Shape tool is active and no shape selected)
            =================================================================== */}
        {effectiveView === 'shape-create' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <LayoutGrid size={13} className={styles.toolBadgeIcon} />
              <span>Shape Tool</span>
            </div>

            {/* Shape Type Selector */}
            <div className={styles.btnGroup}>
              {SHAPE_PALETTE_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = activeShapeType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.iconBtn} ${isSelected ? styles.iconBtnActive : ''}`}
                    onClick={() => onSelectShapeType?.(item.id)}
                    title={item.label}
                    data-testid={`shape-option-${item.id}`}
                  >
                    <IconComponent size={13} />
                  </button>
                );
              })}
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Fill Color */}
            <div
              className={styles.colorPickerWrap}
              onClick={() => fillColorRef.current?.click()}
              title="Shape Fill Color"
            >
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Fill:</span>
              <div
                className={styles.colorSwatchSquare}
                style={{ backgroundColor: foregroundColor }}
              />
              <input
                ref={fillColorRef}
                type="color"
                value={foregroundColor}
                onChange={(e) => onForegroundColorChange?.(e.target.value)}
                className={styles.hiddenColorInput}
              />
            </div>

            {/* Stroke Color */}
            <div
              className={styles.colorPickerWrap}
              onClick={() => strokeColorRef.current?.click()}
              title="Shape Stroke Color"
            >
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Stroke:</span>
              <div
                className={styles.colorSwatchSquare}
                style={{ backgroundColor: backgroundColor || '#000000' }}
              />
              <input
                ref={strokeColorRef}
                type="color"
                value={backgroundColor || '#000000'}
                onChange={(e) => onBackgroundColorChange?.(e.target.value)}
                className={styles.hiddenColorInput}
              />
            </div>
          </>
        )}

        {/* ===================================================================
            6. SELECT TOOL EMPTY STATE (When Move tool is active and no layer selected)
            =================================================================== */}
        {effectiveView === 'select-empty' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <MousePointer size={13} className={styles.toolBadgeIcon} />
              <span>Select</span>
            </div>
            <span className={styles.emptyNotice}>Select an object on the canvas or a layer to adjust properties</span>
          </>
        )}

        {/* ===================================================================
            7. SELECTION TOOLS CONTEXTUAL CONTROLS
            =================================================================== */}
        {effectiveView === 'selection' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              {activeTool === 'marquee-rect' && <SquareDashed size={13} className={styles.toolBadgeIcon} />}
              {activeTool === 'marquee-ellipse' && <CircleDashed size={13} className={styles.toolBadgeIcon} />}
              {activeTool === 'lasso' && <Lasso size={13} className={styles.toolBadgeIcon} />}
              {activeTool === 'polygonal-lasso' && <Spline size={13} className={styles.toolBadgeIcon} />}
              {activeTool === 'magic-wand' && <Wand2 size={13} className={styles.toolBadgeIcon} />}
              <span>
                {activeTool === 'marquee-rect' && 'Rectangular Marquee'}
                {activeTool === 'marquee-ellipse' && 'Elliptical Marquee'}
                {activeTool === 'lasso' && 'Lasso'}
                {activeTool === 'polygonal-lasso' && 'Polygonal Lasso'}
                {activeTool === 'magic-wand' && 'Magic Wand'}
              </span>
            </div>

            {/* Feather input */}
            <div className={styles.inputFieldGroup} title="Feather boundary softening in pixels">
              <span className={styles.inputLabel}>Feather:</span>
              <input
                type="number"
                min="0"
                max="50"
                value={selectionFeather}
                onChange={(e) =>
                  onSelectionFeatherChange?.(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className={styles.textInput}
                style={{ width: '38px' }}
              />
              <span className={styles.inputSuffix}>px</span>
            </div>

            {/* Tolerance (Magic Wand only) */}
            {activeTool === 'magic-wand' && (
              <div className={styles.inputFieldGroup} title="Color tolerance (1 - 100)">
                <span className={styles.inputLabel}>Tolerance:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={selectionTolerance}
                  onChange={(e) =>
                    onSelectionToleranceChange?.(
                      Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 32))
                    )
                  }
                  className={styles.textInput}
                  style={{ width: '38px' }}
                />
              </div>
            )}

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Deselect */}
            <button
              type="button"
              className={styles.presetBtn}
              onClick={onDeselect}
              disabled={!activeSelection}
              title="Deselect (Ctrl+D)"
            >
              <span>Deselect</span>
            </button>

            {/* Invert */}
            <button
              type="button"
              className={styles.presetBtn}
              onClick={onInvertSelection}
              disabled={!activeSelection}
              title="Invert Selection (Ctrl+Shift+I)"
            >
              <span>Invert</span>
            </button>

            {/* Select All */}
            <button
              type="button"
              className={styles.presetBtn}
              onClick={onSelectAll}
              title="Select All Canvas (Ctrl+A)"
            >
              <span>Select All</span>
            </button>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Delete Selected Pixels */}
            <button
              type="button"
              className={styles.actionBtnCancel}
              onClick={onDeleteSelectedPixels}
              disabled={!activeSelection}
              title="Delete Selected Pixels (Delete / Backspace)"
            >
              <Trash2 size={12} />
              <span>Delete Pixels</span>
            </button>

            {/* Convert to Mask */}
            <button
              type="button"
              className={styles.presetBtn}
              onClick={onConvertSelectionToMask}
              disabled={!activeSelection}
              title="Convert Selection to Layer Mask"
            >
              <span>Make Mask</span>
            </button>
          </>
        )}

        {/* ===================================================================
            8. PEN TOOL CONTEXTUAL CONTROLS
            =================================================================== */}
        {effectiveView === 'pen' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <PenTool size={13} className={styles.toolBadgeIcon} />
              <span>Pen Tool</span>
            </div>

            {/* Fill Color */}
            <div
              className={styles.colorPickerWrap}
              onClick={() => penFillColorRef.current?.click()}
              title="Shape Fill Color"
              data-testid="pen-fill-color"
            >
              <div
                className={styles.colorSwatchSquare}
                style={{
                  backgroundColor:
                    (selectedLayer?.type === 'shape' ? selectedLayer.fillColor : penFillColor) === 'transparent'
                      ? 'transparent'
                      : (selectedLayer?.type === 'shape' ? selectedLayer.fillColor : penFillColor) || '#7C3AED',
                  backgroundImage:
                    (selectedLayer?.type === 'shape' ? selectedLayer.fillColor : penFillColor) === 'transparent'
                      ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)'
                      : undefined,
                  backgroundSize: '6px 6px',
                }}
              />
              <span className={styles.inputLabel}>Fill</span>
              <input
                ref={penFillColorRef}
                type="color"
                value={
                  (selectedLayer?.type === 'shape' ? selectedLayer.fillColor : penFillColor) === 'transparent'
                    ? '#7C3AED'
                    : (selectedLayer?.type === 'shape' ? selectedLayer.fillColor : penFillColor) || '#7C3AED'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (selectedLayer?.type === 'shape') {
                    onUpdateLayer?.(selectedLayer.id, { fillColor: val }, true);
                  }
                  onPenFillColorChange?.(val);
                }}
                className={styles.hiddenColorInput}
              />
            </div>

            {/* Stroke Color */}
            <div
              className={styles.colorPickerWrap}
              onClick={() => penStrokeColorRef.current?.click()}
              title="Shape Stroke Color"
              data-testid="pen-stroke-color"
            >
              <div
                className={styles.colorSwatchSquare}
                style={{
                  backgroundColor:
                    (selectedLayer?.type === 'shape' ? selectedLayer.strokeColor : penStrokeColor) || '#7C3AED',
                }}
              />
              <span className={styles.inputLabel}>Stroke</span>
              <input
                ref={penStrokeColorRef}
                type="color"
                value={(selectedLayer?.type === 'shape' ? selectedLayer.strokeColor : penStrokeColor) || '#7C3AED'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (selectedLayer?.type === 'shape') {
                    onUpdateLayer?.(selectedLayer.id, { strokeColor: val }, true);
                  }
                  onPenStrokeColorChange?.(val);
                }}
                className={styles.hiddenColorInput}
              />
            </div>

            {/* Stroke Width Dropdown */}
            <div className={styles.inputFieldGroup} title="Stroke Width">
              <select
                value={(selectedLayer?.type === 'shape' ? selectedLayer.strokeWidth : penStrokeWidth) ?? 2}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (selectedLayer?.type === 'shape') {
                    onUpdateLayer?.(selectedLayer.id, { strokeWidth: val }, true);
                  }
                  onPenStrokeWidthChange?.(val);
                }}
                className={styles.selectInsideGroup}
                data-testid="pen-stroke-width-select"
              >
                {[0, 1, 2, 3, 4, 5, 8, 10, 15, 20].map((w) => (
                  <option key={w} value={w}>
                    {w} px
                  </option>
                ))}
              </select>
            </div>

            {/* Opacity Dropdown */}
            <div className={styles.inputFieldGroup} title="Layer Opacity">
              <span className={styles.inputLabel}>Opacity</span>
              <select
                value={selectedLayer?.opacity ?? 100}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (selectedLayer) {
                    onUpdateLayer?.(selectedLayer.id, { opacity: val }, true);
                  }
                }}
                className={styles.selectInsideGroup}
                data-testid="pen-opacity-select"
              >
                {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map((op) => (
                  <option key={op} value={op}>
                    {op}%
                  </option>
                ))}
              </select>
            </div>

            {/* Blend Mode Dropdown */}
            <div className={styles.inputFieldGroup} title="Blend Mode">
              <span className={styles.inputLabel}>Blend</span>
              <select
                value={selectedLayer?.blendMode || 'normal'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (selectedLayer) {
                    onUpdateLayer?.(selectedLayer.id, { blendMode: val }, true);
                  }
                }}
                className={styles.selectInsideGroup}
                data-testid="pen-blend-select"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
              </select>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            <button
              type="button"
              className={styles.presetBtn}
              onClick={onMakeSelectionFromPen}
              disabled={penPointsCount < 3 && (!selectedLayer || selectedLayer.type !== 'shape')}
              title="Convert Path or Vector Shape to Selection (Ctrl + Enter)"
              data-testid="btn-pen-make-selection"
            >
              <span>Selection</span>
            </button>

            {penPointsCount > 0 && (
              <button
                type="button"
                className={styles.actionBtnCancel}
                onClick={onClearPenPath}
                title="Clear Active Path (Esc)"
                data-testid="btn-pen-clear"
              >
                <X size={12} />
                <span>Cancel</span>
              </button>
            )}
          </>
        )}

        {/* ===================================================================
            9. PATCH TOOL CONTEXTUAL CONTROLS
            =================================================================== */}
        {effectiveView === 'patch' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <Bandage size={13} className={styles.toolBadgeIcon} />
              <span>Patch Tool</span>
            </div>

            {/* Mode: Source vs Destination */}
            <div className={styles.btnGroup} title="Patch Mode">
              <button
                type="button"
                className={`${styles.presetBtn} ${patchMode === 'source' ? styles.presetBtnActive : ''}`}
                onClick={() => onPatchModeChange?.('source')}
                title="Source: Drag selection to clean area to repair source"
              >
                <span>Source</span>
              </button>
              <button
                type="button"
                className={`${styles.presetBtn} ${patchMode === 'destination' ? styles.presetBtnActive : ''}`}
                onClick={() => onPatchModeChange?.('destination')}
                title="Destination: Drag clean sample to duplicate over target"
              >
                <span>Destination</span>
              </button>
            </div>

            {/* Feather radius */}
            <div className={styles.inputFieldGroup} title="Patch Edge Feather in pixels">
              <span className={styles.inputLabel}>Feather:</span>
              <input
                type="number"
                min="0"
                max="20"
                value={patchFeather}
                onChange={(e) =>
                  onPatchFeatherChange?.(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className={styles.textInput}
                style={{ width: '38px' }}
              />
              <span className={styles.inputSuffix}>px</span>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            <button
              type="button"
              className={styles.actionBtnSuccess}
              onClick={onApplyPatch}
              disabled={!hasPatchSelection}
              title="Apply Seamless Patch Blend (Enter)"
            >
              <Check size={12} />
              <span>Apply Patch</span>
            </button>

            <button
              type="button"
              className={styles.actionBtnCancel}
              onClick={onCancelPatch}
              disabled={!hasPatchSelection}
              title="Cancel Patch Selection"
            >
              <X size={12} />
              <span>Cancel</span>
            </button>
          </>
        )}

        {/* ===================================================================
            10. CROP TOOL CONTEXTUAL CONTROLS
            =================================================================== */}
        {effectiveView === 'crop' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <CropIcon size={13} className={styles.toolBadgeIcon} />
              <span>Crop</span>
            </div>

            {/* Ratio Presets */}
            <div className={styles.btnGroup} data-testid="crop-presets-group">
              {CROP_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  className={`${styles.presetBtn} ${cropPreset === ratio.id ? styles.presetBtnActive : ''}`}
                  onClick={() => onSelectCropPreset?.(ratio.id)}
                  data-testid={`crop-ratio-${ratio.id}`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Crop Width × Height Info */}
            <div className={styles.inputFieldGroup} title="Crop dimensions">
              <span className={styles.inputLabel}>Size</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b' }}>
                {Math.round(cropBox.width)} × {Math.round(cropBox.height)}
              </span>
              <span className={styles.inputSuffix}>px</span>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Apply & Cancel */}
            <button
              type="button"
              className={styles.actionBtnSuccess}
              onClick={onApplyCrop}
              data-testid="crop-apply-btn"
              title="Apply Crop (Enter)"
            >
              <Check size={12} />
              <span>Apply Crop</span>
            </button>
            <button
              type="button"
              className={styles.actionBtnCancel}
              onClick={onCancelCrop}
              data-testid="crop-cancel-btn"
              title="Cancel Crop (Esc)"
            >
              <X size={12} />
              <span>Cancel</span>
            </button>
          </>
        )}

        {/* ===================================================================
            11. RESIZE TOOL CONTEXTUAL CONTROLS
            =================================================================== */}
        {effectiveView === 'resize' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <Scaling size={13} className={styles.toolBadgeIcon} />
              <span>Image Size</span>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            <button
              type="button"
              className={styles.applyBtn}
              onClick={onOpenResizeModal}
              title="Open Image Resize Dialog (Ctrl+Alt+I)"
              data-testid="btn-open-resize-modal-from-toolbar"
            >
              <Scaling size={13} />
              <span>Image Size...</span>
            </button>

            <span style={{ fontSize: '11px', color: '#94a3b8', padding: '0 4px' }}>
              {resizeWidth} × {resizeHeight} px
            </span>
          </>
        )}

        {/* ===================================================================
            12. ROTATE & FLIP TOOL CONTEXTUAL CONTROLS
            =================================================================== */}
        {effectiveView === 'rotate' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <RotateCw size={13} className={styles.toolBadgeIcon} />
              <span>Rotate</span>
            </div>

            {/* Quick 90 deg steps */}
            <div className={styles.btnGroup}>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => onAngleChange?.((rotateAngle - 90 + 360) % 360)}
                title="Rotate 90° CCW"
              >
                <RotateCcw size={12} />
                <span>-90°</span>
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => onAngleChange?.((rotateAngle + 90) % 360)}
                title="Rotate 90° CW"
              >
                <RotateCw size={12} />
                <span>+90°</span>
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => onAngleChange?.((rotateAngle + 180) % 360)}
                title="Rotate 180°"
              >
                <span>180°</span>
              </button>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Flip H / V */}
            <div className={styles.btnGroup}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={onFlipH}
                title="Flip Horizontally"
                data-testid="btn-flip-h"
              >
                <FlipHorizontal size={13} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={onFlipV}
                title="Flip Vertically"
                data-testid="btn-flip-v"
              >
                <FlipVertical size={13} />
              </button>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Reset & Apply */}
            <button
              type="button"
              className={styles.actionBtnCancel}
              onClick={onResetRotation}
              title="Reset Rotation"
            >
              <span>Reset</span>
            </button>
            <button
              type="button"
              className={styles.actionBtnSuccess}
              onClick={onApplyRotate}
              data-testid="btn-apply-rotate"
              title="Apply Rotation & Flip"
            >
              <Check size={12} />
              <span>Apply</span>
            </button>
          </>
        )}

        {/* ===================================================================
            13. CANVAS TOOL CONTEXTUAL CONTROLS
            =================================================================== */}
        {effectiveView === 'canvas' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              <Layout size={13} className={styles.toolBadgeIcon} />
              <span>Canvas Size</span>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            <button
              type="button"
              className={styles.applyBtn}
              onClick={onOpenCanvasModal}
              title="Open Canvas Size Dialog (Ctrl+Alt+C)"
              data-testid="btn-open-canvas-modal-from-toolbar"
            >
              <Layout size={13} />
              <span>Canvas Size...</span>
            </button>

            <span style={{ fontSize: '11px', color: '#94a3b8', padding: '0 4px' }}>
              {canvasWidth} × {canvasHeight} px
            </span>
          </>
        )}

        {/* ===================================================================
            14. BRUSH & ERASER CONTEXTUAL CONTROLS
            =================================================================== */}
        {effectiveView === 'brush-eraser' && (
          <>
            <div className={styles.toolBadge} data-testid="contextual-tool-badge">
              {activeTool === 'brush' ? (
                <Paintbrush size={13} className={styles.toolBadgeIcon} />
              ) : (
                <Eraser size={13} className={styles.toolBadgeIcon} />
              )}
              <span>{activeTool === 'brush' ? 'Brush' : 'Eraser'}</span>
            </div>

            {/* Brush Size */}
            <div className={styles.sliderGroup} title="Brush Size (pixels)">
              <span className={styles.inputLabel}>Size:</span>
              <input
                type="range"
                min="2"
                max="120"
                value={brushSize}
                onChange={onBrushSizeChange}
                className={styles.rangeSlider}
              />
              <span className={styles.sliderValueText}>{brushSize}px</span>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Brush Hardness */}
            <div className={styles.sliderGroup} title="Brush Hardness (%)">
              <span className={styles.inputLabel}>Hardness:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={brushHardness}
                onChange={onBrushHardnessChange}
                className={styles.rangeSlider}
              />
              <span className={styles.sliderValueText}>{brushHardness}%</span>
            </div>

            <div className={styles.vDivider} aria-hidden="true" />

            {/* Brush Opacity */}
            <div className={styles.sliderGroup} title="Brush Opacity (%)">
              <span className={styles.inputLabel}>Opacity:</span>
              <input
                type="range"
                min="5"
                max="100"
                value={brushOpacity}
                onChange={onBrushOpacityChange}
                className={styles.rangeSlider}
              />
              <span className={styles.sliderValueText}>{brushOpacity}%</span>
            </div>

            {/* Brush Color (if brush) */}
            {activeTool === 'brush' && (
              <>
                <div className={styles.vDivider} aria-hidden="true" />
                <div
                  className={styles.colorPickerWrap}
                  onClick={() => brushColorRef.current?.click()}
                  title="Brush Color"
                >
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Color:</span>
                  <div
                    className={styles.colorSwatchSquare}
                    style={{ backgroundColor: foregroundColor }}
                  />
                  <input
                    ref={brushColorRef}
                    type="color"
                    value={foregroundColor}
                    onChange={(e) => onForegroundColorChange?.(e.target.value)}
                    className={styles.hiddenColorInput}
                  />
                </div>
              </>
            )}

            {/* Clear Eraser (if eraser) */}
            {activeTool === 'eraser' && (
              <>
                <div className={styles.vDivider} aria-hidden="true" />
                <button
                  type="button"
                  className={styles.actionBtnCancel}
                  onClick={onClearEraser}
                  title="Clear Eraser Changes"
                >
                  <RotateCcw size={12} />
                  <span>Reset Eraser</span>
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ContextualToolbar;
