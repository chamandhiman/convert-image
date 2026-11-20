import { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  X,
  Square,
  Circle,
  ArrowRight,
  Triangle,
  Star,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Copy,
  FoldHorizontal,
  Paintbrush,
  Eraser,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import styles from './PropertiesPanel.module.css';

const FONT_FAMILIES = [
  'Poppins',
  'Inter',
  'Instrument Sans',
  'IBM Plex Mono',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Impact',
  'Courier New',
  'Trebuchet MS',
  'Verdana',
];

const FONT_WEIGHTS = [
  { id: 'normal', label: 'Regular' },
  { id: '500', label: 'Medium' },
  { id: '600', label: 'SemiBold' },
  { id: 'bold', label: 'Bold' },
  { id: '800', label: 'ExtraBold' },
];

const SHAPE_PRESETS = [
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'rounded-rect', label: 'Rounded Rect', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'ellipse', label: 'Ellipse', icon: Circle },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'arrow', label: 'Arrow', icon: ArrowRight },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'star', label: 'Star', icon: Star },
];

const CROP_PRESETS = [
  { id: 'free', label: 'Freeform', ratio: null },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '16:9', label: '16:9 Landscape', ratio: 16 / 9 },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3 },
  { id: '9:16', label: '9:16 Story', ratio: 9 / 16 },
  { id: '3:2', label: '3:2 Photo', ratio: 3 / 2 },
  { id: 'custom', label: 'Custom', ratio: 'custom' },
];

const ANCHOR_POINTS = [
  { id: 'tl', label: '↖' },
  { id: 'tc', label: '↑' },
  { id: 'tr', label: '↗' },
  { id: 'ml', label: '←' },
  { id: 'mc', label: '•' },
  { id: 'mr', label: '→' },
  { id: 'bl', label: '↙' },
  { id: 'bc', label: '↓' },
  { id: 'br', label: '↘' },
];

/**
 * Professional Object Rotation Controls Component
 * Provides custom angle numeric input, 1° steppers,
 * quick angle presets (0°, 45°, 90°, 180°, 270°),
 * smooth -180° to 180° fine-tuning slider, and 0° reset.
 */
function LayerRotationSection({ layer, onUpdateLayer }) {
  const rotation = layer?.rotation ?? 0;
  const [inputValue, setInputValue] = useState(String(Math.round(rotation * 10) / 10));

  useEffect(() => {
    setInputValue(String(Math.round(rotation * 10) / 10));
  }, [rotation]);

  const handleApplyAngle = (val, commitToHistory = true) => {
    let parsed = parseFloat(val);
    if (isNaN(parsed)) parsed = 0;
    let norm = Math.round(parsed * 10) / 10;
    norm = ((norm % 360) + 360) % 360;
    onUpdateLayer(layer.id, { rotation: norm }, commitToHistory);
    setInputValue(String(norm));
  };

  const presets = [0, 45, 90, 180, 270];

  let sliderValue = Math.round(rotation);
  if (sliderValue > 180) {
    sliderValue -= 360;
  }

  return (
    <div className={styles.rotationSectionCard} data-rotation-section="true">
      <div className={styles.labelWithActionRow}>
        <div className={styles.titleWithIcon}>
          <RotateCw size={14} className={styles.sectionTitleIcon} />
          <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>
            Rotation
          </label>
        </div>
        <button
          type="button"
          data-rotation-reset-btn="true"
          className={styles.resetAngleBtn}
          onClick={() => {
            onUpdateLayer(layer.id, { rotation: 0 }, true);
            setInputValue('0');
          }}
          title="Reset Rotation to 0°"
        >
          <RotateCcw size={12} style={{ marginRight: 4 }} />
          Reset 0°
        </button>
      </div>

      {/* Numeric Input & Steppers */}
      <div className={styles.angleInputRow}>
        <button
          type="button"
          className={styles.angleStepperBtn}
          onClick={() => {
            const next = ((Math.round(rotation) - 1 + 360) % 360);
            onUpdateLayer(layer.id, { rotation: next }, true);
          }}
          title="Decrease angle by 1°"
        >
          <Minus size={13} />
        </button>

        <div className={styles.inputWithUnitWrap}>
          <input
            type="number"
            step="any"
            data-rotation-angle-input="true"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              const parsed = parseFloat(e.target.value);
              if (!isNaN(parsed)) {
                let norm = Math.round(parsed * 10) / 10;
                norm = ((norm % 360) + 360) % 360;
                onUpdateLayer(layer.id, { rotation: norm }, false);
              }
            }}
            onBlur={() => handleApplyAngle(inputValue, true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApplyAngle(inputValue, true);
                e.target.blur();
              }
            }}
            className={styles.numberInputWithSuffix}
            placeholder="0"
          />
          <span className={styles.inputSuffixInside}>°</span>
        </div>

        <button
          type="button"
          className={styles.angleStepperBtn}
          onClick={() => {
            const next = ((Math.round(rotation) + 1) % 360);
            onUpdateLayer(layer.id, { rotation: next }, true);
          }}
          title="Increase angle by 1°"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Quick Rotation Presets: 0°, 45°, 90°, 180°, 270° */}
      <div className={styles.anglePresetsRow} role="group" aria-label="Quick angle presets">
        {presets.map((angle) => {
          const isActive = Math.round(rotation) === angle;
          return (
            <button
              key={angle}
              type="button"
              data-angle-preset={angle}
              data-active={isActive ? 'true' : 'false'}
              className={`${styles.anglePresetPill} ${isActive ? styles.anglePresetActive : ''}`}
              onClick={() => {
                onUpdateLayer(layer.id, { rotation: angle }, true);
                setInputValue(String(angle));
              }}
              title={`Rotate to ${angle}°`}
            >
              {angle}°
            </button>
          );
        })}
      </div>

      {/* Smooth Rotation Slider (-180° to 180°) */}
      <div className={styles.rotationSliderWrap}>
        <div className={styles.sliderLabelRow}>
          <span className={styles.subFieldLabel}>Fine Tuning (-180° to 180°)</span>
          <span className={styles.sliderValueBadge}>{Math.round(rotation)}°</span>
        </div>
        <input
          type="range"
          min="-180"
          max="180"
          step="1"
          data-rotation-slider="true"
          value={sliderValue}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            const norm = ((val % 360) + 360) % 360;
            onUpdateLayer(layer.id, { rotation: norm }, false);
          }}
          onMouseUp={() => onUpdateLayer(layer.id, { rotation }, true)}
          onTouchEnd={() => onUpdateLayer(layer.id, { rotation }, true)}
          className={styles.rangeTrack}
        />
      </div>
    </div>
  );
}

/**
 * Photoshop-Style Alignment Controls for selected layers
 */
function LayerAlignmentSection({ layer, onUpdateLayer, currentWidth, currentHeight }) {
  if (!layer) return null;
  const w = layer.width || 100;
  const h = layer.height || 40;
  const cW = currentWidth || 800;
  const cH = currentHeight || 600;

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Align to Canvas</label>
      <div className={styles.alignIconsGrid}>
        <button
          type="button"
          className={styles.alignIconButton}
          title="Align Left"
          onClick={() => onUpdateLayer(layer.id, { x: 0 }, true)}
        >
          <AlignStartHorizontal size={15} />
        </button>
        <button
          type="button"
          className={styles.alignIconButton}
          title="Align Center Horizontal"
          onClick={() => onUpdateLayer(layer.id, { x: Math.max(0, Math.round((cW - w) / 2)) }, true)}
        >
          <AlignCenterHorizontal size={15} />
        </button>
        <button
          type="button"
          className={styles.alignIconButton}
          title="Align Right"
          onClick={() => onUpdateLayer(layer.id, { x: Math.max(0, cW - w) }, true)}
        >
          <AlignEndHorizontal size={15} />
        </button>
        <button
          type="button"
          className={styles.alignIconButton}
          title="Align Top"
          onClick={() => onUpdateLayer(layer.id, { y: 0 }, true)}
        >
          <AlignStartVertical size={15} />
        </button>
        <button
          type="button"
          className={styles.alignIconButton}
          title="Align Center Vertical"
          onClick={() => onUpdateLayer(layer.id, { y: Math.max(0, Math.round((cH - h) / 2)) }, true)}
        >
          <AlignCenterVertical size={15} />
        </button>
        <button
          type="button"
          className={styles.alignIconButton}
          title="Align Bottom"
          onClick={() => onUpdateLayer(layer.id, { y: Math.max(0, cH - h) }, true)}
        >
          <AlignEndVertical size={15} />
        </button>
      </div>
    </div>
  );
}

/**
 * Lock / Unlock layer position toggle
 */
function LayerLockSection({ layer, onUpdateLayer }) {
  if (!layer) return null;
  const isLocked = !!layer.locked;

  return (
    <div className={styles.lockRow}>
      <button
        type="button"
        className={`${styles.lockToggleBtn} ${isLocked ? styles.lockToggleBtnLocked : ''}`}
        onClick={() => onUpdateLayer(layer.id, { locked: !isLocked }, true)}
        title={isLocked ? 'Unlock layer' : 'Lock layer in position'}
      >
        {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
        <span>{isLocked ? 'Layer Locked (Click to Unlock)' : 'Lock Layer Position'}</span>
      </button>
    </div>
  );
}

export function PropertiesPanel({
  activeTab,
  activeTool = 'move',
  selectedLayer,
  selectedLayerId,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  // Resize Props
  resizeWidth,
  resizeHeight,
  onResizeWidthChange,
  onResizeHeightChange,
  lockAspectRatio,
  onToggleLockAspect,
  onScalePreset,
  onApplyResize,
  // Crop Props
  cropPreset,
  onSelectCropPreset,
  cropBox,
  onApplyCrop,
  onCancelCrop,
  // Rotate Props
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
  // Canvas Props
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
  // Eraser / Brush Props
  brushSize = 36,
  onBrushSizeChange,
  brushHardness = 80,
  onBrushHardnessChange,
  brushOpacity = 100,
  onBrushOpacityChange,
  onClearEraser,
  // Shape Props
  onAddShape,
  // Text Props
  hasImage = false,
  currentWidth = 0,
  currentHeight = 0,
  zoom = 1,
  foregroundColor = '#7C3AED',
  onForegroundColorChange,
  _backgroundColor = '#FFFFFF',
  _onBackgroundColorChange,
  layers = [],
}) {
  const [effectsOpen, setEffectsOpen] = useState(true);
  const [selectedScalePreset, setSelectedScalePreset] = useState(100);
  const textColorInputRef = useRef(null);
  const textBgColorInputRef = useRef(null);
  const textStrokeColorInputRef = useRef(null);
  const shapeFillInputRef = useRef(null);
  const shapeStrokeInputRef = useRef(null);
  const brushColorInputRef = useRef(null);
  const defaultTextColorInputRef = useRef(null);
  const defaultShapeFillRef = useRef(null);
  const defaultShapeStrokeRef = useRef(null);

  // Defaults for text tool creation mode
  const [defaultFontFamily, setDefaultFontFamily] = useState('Poppins');
  const [defaultFontSize, setDefaultFontSize] = useState(32);
  const [defaultFontWeight, setDefaultFontWeight] = useState('bold');
  const [defaultFontStyle, setDefaultFontStyle] = useState('normal');
  const [defaultTextAlign, setDefaultTextAlign] = useState('left');
  const [defaultTextColor, setDefaultTextColor] = useState('#FFFFFF');

  // Defaults for shape tool creation mode
  const [defaultShapeFill, setDefaultShapeFill] = useState('#7C3AED');
  const [defaultShapeStroke, setDefaultShapeStroke] = useState('#FFFFFF');
  const [defaultShapeStrokeWidth, setDefaultShapeStrokeWidth] = useState(2);
  const [defaultShapeOpacity, setDefaultShapeOpacity] = useState(100);

  // Single source of truth for tool state
  const effectiveTool = activeTool || (
    activeTab === 'crop' ? 'crop' :
    activeTab === 'resize' ? 'resize' :
    activeTab === 'rotate' ? 'rotate' :
    activeTab === 'canvas' ? 'canvas' :
    activeTab === 'erase' ? 'eraser' :
    activeTab === 'brush' ? 'brush' :
    activeTab === 'shapes' ? 'rect' :
    activeTab === 'text' ? 'text' : 'move'
  );

  const isShapeToolActive = ['rect', 'circle', 'ellipse', 'triangle', 'line', 'star', 'shapes'].includes(effectiveTool);
  const isSelectedLayerReal = Boolean(selectedLayer && selectedLayerId);

  // ---------------------------------------------------------------------------
  // 1. RENDER: CROP TOOL
  // ---------------------------------------------------------------------------
  const renderCropSection = () => (
            <div className={styles.sectionScroll}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelHeading} data-panel-heading="true">Crop Composition</h2>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Aspect Ratio Presets</label>
            <div className={styles.cropPresetsGrid}>
              {CROP_PRESETS.map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  data-crop-preset={pr.id}
                  className={`${styles.cropPresetBtn} ${cropPreset === pr.id ? styles.cropPresetBtnActive : ''
                    }`}
                  onClick={() => onSelectCropPreset(pr.id)}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.infoBox}>
            <span className={styles.infoLabel}>Selected Crop Area</span>
            <strong className={styles.infoVal}>
              {Math.round(cropBox.width)} × {Math.round(cropBox.height)} px
            </strong>
          </div>

          <div className={styles.actionButtonGroup}>
            <button
              type="button"
              data-apply-crop="true"
              className={styles.primaryActionBtn}
              onClick={onApplyCrop}
            >
              <Check size={15} />
              <span>Apply Crop</span>
            </button>
            <button
              type="button"
              data-cancel-crop="true"
              className={styles.secondaryActionBtn}
              onClick={onCancelCrop}
            >
              <X size={15} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
  );

  // ---------------------------------------------------------------------------
  // 2. RENDER: RESIZE TOOL
  // ---------------------------------------------------------------------------
  const renderResizeSection = () => (
            <div className={styles.sectionScroll}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelHeading} data-panel-heading="true">Resize Dimensions</h2>
          </div>

          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Width (px)</label>
              <input
                type="number"
                min="1"
                value={resizeWidth}
                onChange={onResizeWidthChange}
                className={styles.numberInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Height (px)</label>
              <input
                type="number"
                min="1"
                value={resizeHeight}
                onChange={onResizeHeightChange}
                className={styles.numberInput}
              />
            </div>
          </div>

          <div className={styles.toggleRowBetween}>
            <div className={styles.toggleLeftGroup}>
              <span className={styles.lockIconBox}>
                {lockAspectRatio ? <Lock size={13} /> : <Unlock size={13} />}
              </span>
              <span className={styles.toggleText}>Maintain Aspect Ratio</span>
            </div>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={lockAspectRatio}
                onChange={onToggleLockAspect}
              />
              <span className={styles.sliderRound} />
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Quick Scale</label>
            <div className={styles.scalePresetRow}>
              {[25, 50, 75, 100, 200].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.scalePresetBtn} ${selectedScalePreset === p ? styles.scalePresetBtnActive : ''
                    }`}
                  onClick={() => {
                    setSelectedScalePreset(p);
                    onScalePreset(p);
                  }}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <button type="button" className={styles.primaryActionBtn} onClick={onApplyResize}>
            <Check size={15} />
            <span>Apply Resize</span>
          </button>
        </div>
  );

  // ---------------------------------------------------------------------------
  // 3. RENDER: ROTATE TOOL
  // ---------------------------------------------------------------------------
  const renderRotateSection = () => (
            <div className={styles.sectionScroll}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelHeading} data-panel-heading="true">Rotate & Flip</h2>
          </div>

          <div className={styles.rotateActionsGrid}>
            <button type="button" className={styles.rotateBtn} onClick={onRotateLeft90}>
              <RotateCcw size={16} />
              <span>90° Left</span>
            </button>
            <button type="button" className={styles.rotateBtn} onClick={onRotateRight90}>
              <RotateCw size={16} />
              <span>90° Right</span>
            </button>
            <button type="button" className={styles.rotateBtn} onClick={onRotate180}>
              <span>180° Flip</span>
            </button>
            <button type="button" className={styles.rotateBtn} onClick={onResetRotation}>
              <span>Reset 0°</span>
            </button>
          </div>

          <div className={styles.gridTwoCols}>
            <button
              type="button"
              className={`${styles.flipBtn} ${flipH ? styles.flipBtnActive : ''}`}
              onClick={onFlipH}
            >
              <FlipHorizontal size={16} />
              <span>Flip Horizontal</span>
            </button>
            <button
              type="button"
              className={`${styles.flipBtn} ${flipV ? styles.flipBtnActive : ''}`}
              onClick={onFlipV}
            >
              <FlipVertical size={16} />
              <span>Flip Vertical</span>
            </button>
          </div>

          <div className={styles.sliderFieldGroup}>
            <div className={styles.sliderLabelRow}>
              <label className={styles.fieldLabel}>Custom Angle</label>
              <span className={styles.sliderValueBadge}>{rotateAngle}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotateAngle}
              onChange={onAngleChange}
              className={styles.rangeTrack}
            />
          </div>

          <button type="button" className={styles.primaryActionBtn} onClick={onApplyRotate}>
            <Check size={15} />
            <span>Apply Rotation</span>
          </button>
        </div>
  );

  // ---------------------------------------------------------------------------
  // 4. RENDER: CANVAS EXPANSION TOOL
  // ---------------------------------------------------------------------------
  const renderCanvasSection = () => (
            <div className={styles.sectionScroll}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelHeading} data-panel-heading="true">Canvas Expansion</h2>
          </div>

          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Width (px)</label>
              <input
                type="number"
                min="1"
                value={canvasWidth}
                onChange={onCanvasWidthChange}
                className={styles.numberInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Height (px)</label>
              <input
                type="number"
                min="1"
                value={canvasHeight}
                onChange={onCanvasHeightChange}
                className={styles.numberInput}
              />
            </div>
          </div>

          {/* Anchor Matrix */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Anchor Position</label>
            <div className={styles.anchorMatrix}>
              {ANCHOR_POINTS.map((anc) => (
                <button
                  key={anc.id}
                  type="button"
                  className={`${styles.anchorCell} ${canvasAnchor === anc.id ? styles.anchorCellActive : ''
                    }`}
                  onClick={() => onCanvasAnchorChange(anc.id)}
                >
                  {anc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Background Color */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Background Color</label>
            <select
              value={canvasBgOption}
              onChange={onCanvasBgOptionChange}
              className={styles.selectDropdown}
            >
              <option value="transparent">Transparent Checkerboard</option>
              <option value="#FFFFFF">Solid White</option>
              <option value="#000000">Solid Black</option>
              <option value="custom">Custom Color...</option>
            </select>
          </div>

          {canvasBgOption === 'custom' && (
            <div className={styles.propertyRow}>
              <label className={styles.fieldLabel}>Pick Color</label>
              <input
                type="color"
                value={canvasCustomColor}
                onChange={onCanvasCustomColorChange}
                className={styles.colorPickerInline}
              />
            </div>
          )}

          <button type="button" className={styles.primaryActionBtn} onClick={onApplyCanvas}>
            <Check size={15} />
            <span>Apply Canvas Size</span>
          </button>
        </div>
  );

  // ---------------------------------------------------------------------------
  // 5. RENDER: BRUSH PAINTING TOOL
  // ---------------------------------------------------------------------------
  const renderBrushSection = () => {
    const brushPresets = [6, 12, 24, 48, 96];

    return (
      <div className={styles.sectionScroll}>
        <div className={styles.panelTitleRow}>
          <h2 className={styles.panelHeading} data-panel-heading="true">Brush Painting</h2>
          <span className={styles.docTitleBadge}>
            <Paintbrush size={11} />
            <span>Brush (B)</span>
          </span>
        </div>

        {/* Brush Size */}
        <div className={styles.sliderFieldGroup}>
          <div className={styles.sliderLabelRow}>
            <label className={styles.fieldLabel}>Brush Size</label>
            <span className={styles.sliderValueBadge}>{brushSize} px</span>
          </div>
          <input
            type="range"
            min="1"
            max="200"
            value={brushSize}
            onChange={onBrushSizeChange}
            className={styles.rangeTrack}
          />
          <div className={styles.brushPresetRow}>
            {brushPresets.map((sz) => (
              <button
                key={sz}
                type="button"
                className={`${styles.brushPresetBtn} ${brushSize === sz ? styles.brushPresetBtnActive : ''}`}
                onClick={() => onBrushSizeChange?.({ target: { value: sz } })}
              >
                {sz}px
              </button>
            ))}
          </div>
        </div>

        {/* Brush Hardness */}
        <div className={styles.sliderFieldGroup}>
          <div className={styles.sliderLabelRow}>
            <label className={styles.fieldLabel}>Hardness</label>
            <span className={styles.sliderValueBadge}>{brushHardness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={brushHardness}
            onChange={onBrushHardnessChange}
            className={styles.rangeTrack}
          />
        </div>

        {/* Brush Opacity */}
        <div className={styles.sliderFieldGroup}>
          <div className={styles.sliderLabelRow}>
            <label className={styles.fieldLabel}>Opacity</label>
            <span className={styles.sliderValueBadge}>{brushOpacity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={brushOpacity}
            onChange={onBrushOpacityChange}
            className={styles.rangeTrack}
          />
        </div>

        {/* Brush Color */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Brush Color</label>
          <div
            className={styles.colorPickerTrigger}
            onClick={() => brushColorInputRef.current?.click()}
          >
            <div
              className={styles.colorSwatchPreview}
              style={{ backgroundColor: foregroundColor || '#7C3AED' }}
            />
            <span className={styles.colorHexCode}>
              {(foregroundColor || '#7C3AED').toUpperCase()}
            </span>
            <input
              ref={brushColorInputRef}
              type="color"
              value={foregroundColor || '#7C3AED'}
              onChange={(e) => onForegroundColorChange?.(e.target.value)}
              className={styles.hiddenNativeColorInput}
            />
          </div>
        </div>

        {/* Tip */}
        <div className={styles.tipCard}>
          <Paintbrush size={15} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 2 }} />
          <p className={styles.tipCardText}>
            Click and drag on the canvas to paint smooth brush strokes with the selected color and opacity.
          </p>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 6. RENDER: ERASER TOOL
  // ---------------------------------------------------------------------------
  const renderEraserSection = () => {
    const eraserPresets = [10, 25, 50, 100];

    return (
      <div className={styles.sectionScroll}>
        <div className={styles.panelTitleRow}>
          <h2 className={styles.panelHeading} data-panel-heading="true">Eraser Tool</h2>
          <span className={styles.docTitleBadge}>
            <Eraser size={11} />
            <span>Eraser (E)</span>
          </span>
        </div>

        {/* Eraser Size */}
        <div className={styles.sliderFieldGroup}>
          <div className={styles.sliderLabelRow}>
            <label className={styles.fieldLabel}>Eraser Size</label>
            <span className={styles.sliderValueBadge}>{brushSize} px</span>
          </div>
          <input
            type="range"
            min="4"
            max="160"
            value={brushSize}
            onChange={onBrushSizeChange}
            className={styles.rangeTrack}
          />
          <div className={styles.brushPresetRow}>
            {eraserPresets.map((sz) => (
              <button
                key={sz}
                type="button"
                className={`${styles.brushPresetBtn} ${brushSize === sz ? styles.brushPresetBtnActive : ''}`}
                onClick={() => onBrushSizeChange?.({ target: { value: sz } })}
              >
                {sz}px
              </button>
            ))}
          </div>
        </div>

        {/* Hardness */}
        <div className={styles.sliderFieldGroup}>
          <div className={styles.sliderLabelRow}>
            <label className={styles.fieldLabel}>Hardness</label>
            <span className={styles.sliderValueBadge}>{brushHardness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={brushHardness}
            onChange={onBrushHardnessChange}
            className={styles.rangeTrack}
          />
        </div>

        {/* Opacity */}
        <div className={styles.sliderFieldGroup}>
          <div className={styles.sliderLabelRow}>
            <label className={styles.fieldLabel}>Opacity</label>
            <span className={styles.sliderValueBadge}>{brushOpacity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={brushOpacity}
            onChange={onBrushOpacityChange}
            className={styles.rangeTrack}
          />
        </div>

        {/* Reset Eraser Strokes */}
        <button type="button" className={styles.secondaryActionBtn} onClick={onClearEraser}>
          <RotateCcw size={14} />
          <span>Reset Eraser Strokes</span>
        </button>

        {/* Tip */}
        <div className={styles.tipCard}>
          <Eraser size={15} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 2 }} />
          <p className={styles.tipCardText}>
            Click and drag on the canvas to erase image areas and reveal transparency beneath.
          </p>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 7. RENDER: TEXT TOOL SETTINGS (When no text layer selected)
  // ---------------------------------------------------------------------------
  const renderTextToolSettingsSection = () => {
    const fontPresets = [14, 18, 24, 30, 36, 48, 64, 72];

    return (
      <div className={styles.sectionScroll}>
        <div className={styles.panelTitleRow}>
          <h2 className={styles.panelHeading} data-panel-heading="true">Horizontal Type Tool</h2>
          <span className={styles.docTitleBadge}>
            <Type size={11} />
            <span>Text (T)</span>
          </span>
        </div>

        {/* Font Family */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Font Family</label>
          <select
            value={defaultFontFamily}
            onChange={(e) => setDefaultFontFamily(e.target.value)}
            className={styles.selectDropdown}
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size Stepper with Direct Input */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Font Size</label>
          <div className={styles.fontSizeStepperContainer}>
            <button
              type="button"
              className={styles.fontSizeStepBtn}
              onClick={() => setDefaultFontSize((prev) => Math.max(8, prev - 2))}
              title="Decrease Font Size"
            >
              <Minus size={13} />
            </button>
            <div className={styles.fontSizeNumberWrap}>
              <input
                type="number"
                min="8"
                max="240"
                value={defaultFontSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) setDefaultFontSize(Math.max(8, Math.min(240, val)));
                }}
                className={styles.fontSizeDirectInput}
              />
              <span className={styles.fontSizePxSuffix}>px</span>
            </div>
            <button
              type="button"
              className={styles.fontSizeStepBtn}
              onClick={() => setDefaultFontSize((prev) => Math.min(240, prev + 2))}
              title="Increase Font Size"
            >
              <Plus size={13} />
            </button>
          </div>
          {/* Quick Size Presets */}
          <div className={styles.quickSizesRow}>
            {fontPresets.map((sz) => (
              <button
                key={sz}
                type="button"
                className={`${styles.quickSizePill} ${defaultFontSize === sz ? styles.quickSizePillActive : ''}`}
                onClick={() => setDefaultFontSize(sz)}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Font Style Toggles */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Style & Alignment</label>
          <div className={styles.styleAndAlignRow}>
            <div className={styles.btnGroupThree}>
              <button
                type="button"
                className={`${styles.formatBtn} ${defaultFontWeight === 'bold' ? styles.formatBtnActive : ''}`}
                onClick={() => setDefaultFontWeight((prev) => (prev === 'bold' ? 'normal' : 'bold'))}
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                className={`${styles.formatBtn} ${defaultFontStyle === 'italic' ? styles.formatBtnActive : ''}`}
                onClick={() => setDefaultFontStyle((prev) => (prev === 'italic' ? 'normal' : 'italic'))}
                title="Italic"
              >
                <Italic size={13} />
              </button>
            </div>
            <div className={styles.btnGroupThree}>
              <button
                type="button"
                className={`${styles.alignBtn} ${defaultTextAlign === 'left' ? styles.alignBtnActive : ''}`}
                onClick={() => setDefaultTextAlign('left')}
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                className={`${styles.alignBtn} ${defaultTextAlign === 'center' ? styles.alignBtnActive : ''}`}
                onClick={() => setDefaultTextAlign('center')}
                title="Align Center"
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                className={`${styles.alignBtn} ${defaultTextAlign === 'right' ? styles.alignBtnActive : ''}`}
                onClick={() => setDefaultTextAlign('right')}
                title="Align Right"
              >
                <AlignRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Text Color */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Text Color</label>
          <div
            className={styles.colorPickerTrigger}
            onClick={() => defaultTextColorInputRef.current?.click()}
          >
            <div
              className={styles.colorSwatchPreview}
              style={{ backgroundColor: defaultTextColor }}
            />
            <span className={styles.colorHexCode}>
              {defaultTextColor.toUpperCase()}
            </span>
            <input
              ref={defaultTextColorInputRef}
              type="color"
              value={defaultTextColor}
              onChange={(e) => setDefaultTextColor(e.target.value)}
              className={styles.hiddenNativeColorInput}
            />
          </div>
        </div>

        {/* Instruction Guidance */}
        <div className={styles.tipCard}>
          <Type size={15} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 2 }} />
          <p className={styles.tipCardText}>
            Click anywhere on the image canvas to create an editable text box at that position, or click the button above.
          </p>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 8. RENDER: SHAPE TOOL SETTINGS (When no shape layer selected)
  // ---------------------------------------------------------------------------
  const renderShapeToolSettingsSection = () => {
    const shapeId = ['rect', 'circle', 'ellipse', 'triangle', 'line', 'star'].includes(effectiveTool)
      ? effectiveTool
      : 'rect';
    const shapeLabel = SHAPE_PRESETS.find((s) => s.id === shapeId)?.label || 'Shape';

    return (
      <div className={styles.sectionScroll}>
        <div className={styles.panelTitleRow}>
          <h2 className={styles.panelHeading} data-panel-heading="true">Shape Tool</h2>
          <span className={styles.docTitleBadge}>
            <Square size={11} />
            <span>{shapeLabel}</span>
          </span>
        </div>

        {/* Shape Types Selector Grid */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Shape Preset</label>
          <div className={styles.shapesGrid}>
            {SHAPE_PRESETS.map((sh) => {
              const Icon = sh.icon;
              const active = shapeId === sh.id;
              return (
                <button
                  key={sh.id}
                  type="button"
                  className={`${styles.shapeOptionBtn} ${active ? styles.shapeOptionActive : ''}`}
                  onClick={() => onAddShape?.(sh.id)}
                  title={`Draw ${sh.label}`}
                >
                  <Icon size={14} />
                  <span>{sh.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fill Color */}
        <div className={styles.fieldGroup}>
          <div className={styles.labelWithActionRow}>
            <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>Fill Color</label>
            <button
              type="button"
              className={styles.fitWidthLinkBtn}
              onClick={() => setDefaultShapeFill((prev) => (prev === 'transparent' ? '#7C3AED' : 'transparent'))}
            >
              {defaultShapeFill === 'transparent' ? 'Use Solid' : 'Transparent'}
            </button>
          </div>
          <div
            className={styles.colorPickerTrigger}
            onClick={() => defaultShapeFillRef.current?.click()}
          >
            <div
              className={`${styles.colorSwatchPreview} ${defaultShapeFill === 'transparent' ? styles.checkerPattern : ''}`}
              style={{ backgroundColor: defaultShapeFill !== 'transparent' ? defaultShapeFill : 'transparent' }}
            />
            <span className={styles.colorHexCode}>
              {defaultShapeFill !== 'transparent' ? defaultShapeFill.toUpperCase() : 'TRANSPARENT'}
            </span>
            <input
              ref={defaultShapeFillRef}
              type="color"
              value={defaultShapeFill !== 'transparent' ? defaultShapeFill : '#7C3AED'}
              onChange={(e) => setDefaultShapeFill(e.target.value)}
              className={styles.hiddenNativeColorInput}
            />
          </div>
        </div>

        {/* Stroke Color & Width */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Stroke Color</label>
          <div
            className={styles.colorPickerTrigger}
            onClick={() => defaultShapeStrokeRef.current?.click()}
          >
            <div
              className={styles.colorSwatchPreview}
              style={{ backgroundColor: defaultShapeStroke }}
            />
            <span className={styles.colorHexCode}>
              {defaultShapeStroke.toUpperCase()}
            </span>
            <input
              ref={defaultShapeStrokeRef}
              type="color"
              value={defaultShapeStroke}
              onChange={(e) => setDefaultShapeStroke(e.target.value)}
              className={styles.hiddenNativeColorInput}
            />
          </div>
        </div>

        <div className={styles.sliderFieldGroup}>
          <div className={styles.sliderLabelRow}>
            <label className={styles.fieldLabel}>Stroke Width</label>
            <span className={styles.sliderValueBadge}>{defaultShapeStrokeWidth} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="32"
            value={defaultShapeStrokeWidth}
            onChange={(e) => setDefaultShapeStrokeWidth(parseInt(e.target.value, 10))}
            className={styles.rangeTrack}
          />
        </div>

        {/* Opacity */}
        <div className={styles.sliderFieldGroup}>
          <div className={styles.sliderLabelRow}>
            <label className={styles.fieldLabel}>Opacity</label>
            <span className={styles.sliderValueBadge}>{defaultShapeOpacity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={defaultShapeOpacity}
            onChange={(e) => setDefaultShapeOpacity(parseInt(e.target.value, 10))}
            className={styles.rangeTrack}
          />
        </div>

        {/* Add Shape to Center Button */}
        {onAddShape && (
          <button
            type="button"
            className={styles.primaryActionBtn}
            onClick={() => onAddShape(shapeId)}
          >
            <Plus size={15} />
            <span>Insert {shapeLabel} to Center</span>
          </button>
        )}

        {/* Drawing Hint */}
        <div className={styles.tipCard}>
          <Square size={15} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 2 }} />
          <p className={styles.tipCardText}>
            Click and drag on the canvas to draw a custom shape. Hold <strong>Shift</strong> for 1:1 proportion, and <strong>Alt</strong> to draw from center.
          </p>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 9. RENDER: SELECTED TEXT LAYER PROPERTIES
  // ---------------------------------------------------------------------------
  const renderTextLayerSection = () => (
            <div className={styles.sectionScroll}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelHeading} data-panel-heading="true">Text Properties</h2>
            <div className={styles.panelActionBtns}>
              {onDuplicateLayer && (
                <button
                  type="button"
                  className={styles.iconActionBtn}
                  onClick={() => onDuplicateLayer(selectedLayer.id)}
                  title="Duplicate Text Layer"
                >
                  <Copy size={14} />
                </button>
              )}
              {onDeleteLayer && (
                <button
                  type="button"
                  className={`${styles.iconActionBtn} ${styles.dangerActionBtn}`}
                  onClick={() => onDeleteLayer(selectedLayer.id)}
                  title="Delete Text Layer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Text Content Input */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Text Content</label>
            <textarea
              value={selectedLayer.text || ''}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { text: e.target.value }, true)}
              className={styles.textContentArea}
              placeholder="Type your text here..."
              rows={2}
            />
          </div>

          {/* Font Family & Weight Row */}
          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Font Family</label>
              <select
                value={selectedLayer.fontFamily || 'Poppins'}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { fontFamily: e.target.value }, true)}
                className={styles.selectDropdown}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Weight</label>
              <select
                value={selectedLayer.fontWeight || 'bold'}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { fontWeight: e.target.value }, true)}
                className={styles.selectDropdown}
              >
                {FONT_WEIGHTS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Font Size Stepper & Format Buttons Row */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Font Size</label>
            <div className={styles.fontSizeStepperContainer}>
              <button
                type="button"
                className={styles.fontSizeStepBtn}
                onClick={() => {
                  const curr = Number(selectedLayer.fontSize) || 32;
                  const step = curr > 32 ? 4 : 2;
                  const nextVal = Math.max(8, curr - step);
                  onUpdateLayer(selectedLayer.id, { fontSize: nextVal }, true);
                }}
                title="Decrease Font Size"
              >
                <Minus size={15} />
              </button>

              <div className={styles.fontSizeNumberWrap}>
                <input
                  type="number"
                  min="8"
                  max="300"
                  value={selectedLayer.fontSize ?? 32}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      onUpdateLayer(
                        selectedLayer.id,
                        { fontSize: Math.min(300, Math.max(8, parsed)) },
                        true
                      );
                    }
                  }}
                  className={styles.fontSizeDirectInput}
                />
                <span className={styles.fontSizePxSuffix}>px</span>
              </div>

              <button
                type="button"
                className={styles.fontSizeStepBtn}
                onClick={() => {
                  const curr = Number(selectedLayer.fontSize) || 32;
                  const step = curr >= 32 ? 4 : 2;
                  const nextVal = Math.min(300, curr + step);
                  onUpdateLayer(selectedLayer.id, { fontSize: nextVal }, true);
                }}
                title="Increase Font Size"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Quick Size Presets */}
            <div className={styles.quickSizesRow}>
              {[14, 18, 24, 30, 36, 48, 64, 72].map((sz) => {
                const currentFontSize = Number(selectedLayer.fontSize) || 32;
                const isSelected = currentFontSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    data-font-size-pill={sz}
                    data-active={isSelected ? 'true' : 'false'}
                    className={`${styles.quickSizePill} ${isSelected ? styles.quickSizePillActive : ''
                      }`}
                    onClick={() => onUpdateLayer(selectedLayer.id, { fontSize: sz }, true)}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style & Align Row */}
          <div className={styles.formatAndAlignRow}>
            {/* B, I, U Buttons */}
            <div className={styles.fieldSubRow}>
              <label className={styles.fieldLabel}>Style</label>
              <div className={styles.formatButtonGroup}>
                <button
                  type="button"
                  className={`${styles.formatBtn} ${selectedLayer.fontWeight === 'bold' || selectedLayer.fontWeight === '800'
                    ? styles.formatBtnActive
                    : ''
                    }`}
                  onClick={() =>
                    onUpdateLayer(
                      selectedLayer.id,
                      {
                        fontWeight:
                          selectedLayer.fontWeight === 'bold' || selectedLayer.fontWeight === '800'
                            ? 'normal'
                            : 'bold',
                      },
                      true
                    )
                  }
                  title="Bold"
                >
                  <Bold size={13} />
                </button>

                <button
                  type="button"
                  className={`${styles.formatBtn} ${selectedLayer.fontStyle === 'italic' ? styles.formatBtnActive : ''
                    }`}
                  onClick={() =>
                    onUpdateLayer(
                      selectedLayer.id,
                      {
                        fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic',
                      },
                      true
                    )
                  }
                  title="Italic"
                >
                  <Italic size={13} />
                </button>

                <button
                  type="button"
                  className={`${styles.formatBtn} ${selectedLayer.underline ? styles.formatBtnActive : ''
                    }`}
                  onClick={() =>
                    onUpdateLayer(selectedLayer.id, { underline: !selectedLayer.underline }, true)
                  }
                  title="Underline"
                >
                  <Underline size={13} />
                </button>
              </div>
            </div>

            {/* Align Buttons */}
            <div className={styles.fieldSubRow}>
              <label className={styles.fieldLabel}>Align</label>
              <div className={styles.alignGroup}>
                <button
                  type="button"
                  data-align-btn="left"
                  data-active={(selectedLayer.align || 'left') === 'left' ? 'true' : 'false'}
                  className={`${styles.alignBtn} ${(selectedLayer.align || 'left') === 'left' ? styles.alignBtnActive : ''
                    }`}
                  onClick={() => onUpdateLayer(selectedLayer.id, { align: 'left' }, true)}
                  title="Align Left"
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  data-align-btn="center"
                  data-active={(selectedLayer.align || 'left') === 'center' ? 'true' : 'false'}
                  className={`${styles.alignBtn} ${(selectedLayer.align || 'left') === 'center' ? styles.alignBtnActive : ''
                    }`}
                  onClick={() => onUpdateLayer(selectedLayer.id, { align: 'center' }, true)}
                  title="Align Center"
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  data-align-btn="right"
                  data-active={(selectedLayer.align || 'left') === 'right' ? 'true' : 'false'}
                  className={`${styles.alignBtn} ${(selectedLayer.align || 'left') === 'right' ? styles.alignBtnActive : ''
                    }`}
                  onClick={() => onUpdateLayer(selectedLayer.id, { align: 'right' }, true)}
                  title="Align Right"
                >
                  <AlignRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Text Box Dimensions & Auto-Wrap */}
          <div className={styles.textBoxSectionCard}>
            <div className={styles.labelWithActionRow}>
              <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>
                Text Box & Wrapping
              </label>
              <button
                type="button"
                data-fit-text-btn="true"
                className={styles.fitWidthLinkBtn}
                onClick={() => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    const fontStyle = selectedLayer.fontStyle === 'italic' ? 'italic' : 'normal';
                    const fontWeight = selectedLayer.fontWeight || 'bold';
                    const fontSize = selectedLayer.fontSize || 32;
                    const fontFamily = selectedLayer.fontFamily || 'Poppins';
                    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
                    if (selectedLayer.letterSpacing && ctx.letterSpacing !== undefined) {
                      ctx.letterSpacing = `${selectedLayer.letterSpacing}px`;
                    }
                    const text = selectedLayer.text || selectedLayer.placeholder || 'Type your text here';
                    const lines = text.split('\n');
                    let maxLineWidth = 0;
                    for (const line of lines) {
                      const metrics = ctx.measureText(line);
                      if (metrics.width > maxLineWidth) {
                        maxLineWidth = metrics.width;
                      }
                    }
                    const fittedWidth = Math.max(60, Math.ceil(maxLineWidth + 16));
                    onUpdateLayer(selectedLayer.id, { width: fittedWidth, autoWidth: false }, true);
                  }
                }}
                title="Automatically calculate width to fit text without wrapping"
              >
                <FoldHorizontal size={13} style={{ marginRight: 4 }} />
                Fit to Text
              </button>
            </div>

            <div className={styles.dimensionRow}>
              <div className={styles.dimensionCol}>
                <span className={styles.subFieldLabel}>Width</span>
                <div className={styles.inputWithUnitWrap}>
                  <input
                    type="number"
                    min="40"
                    max="3000"
                    data-text-width-input="true"
                    value={selectedLayer.width || 180}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val > 0) {
                        onUpdateLayer(selectedLayer.id, { width: val, autoWidth: false }, true);
                      }
                    }}
                    className={styles.numberInputWithSuffix}
                  />
                  <span className={styles.inputSuffixInside}>px</span>
                </div>
              </div>

              <div className={styles.dimensionCol}>
                <span className={styles.subFieldLabel}>Height (Auto)</span>
                <div className={styles.inputWithUnitWrap}>
                  <input
                    type="text"
                    readOnly
                    data-text-height-display="true"
                    value={`${selectedLayer.height || 44} px`}
                    className={`${styles.numberInputWithSuffix} ${styles.readOnlyInput}`}
                    title="Calculated automatically based on wrapped text lines"
                  />
                </div>
              </div>
            </div>

            <div className={styles.autoWidthRow}>
              <label className={styles.autoWidthLabel}>
                <input
                  type="checkbox"
                  data-auto-width-checkbox="true"
                  checked={!!selectedLayer.autoWidth}
                  onChange={(e) => {
                    onUpdateLayer(selectedLayer.id, { autoWidth: e.target.checked }, true);
                  }}
                  className={styles.autoWidthCheckbox}
                />
                <span className={styles.autoWidthText}>Auto Width (expand as you type)</span>
              </label>
            </div>
          </div>

          {/* Text Color Row */}
          <div className={styles.propertyRow}>
            <label className={styles.fieldLabel}>Text Color</label>
            <div
              className={styles.colorPickerTrigger}
              onClick={() => textColorInputRef.current?.click()}
            >
              <div
                className={styles.colorSwatchPreview}
                style={{ backgroundColor: selectedLayer.color || '#FFFFFF' }}
              />
              <span className={styles.colorHexCode}>
                {(selectedLayer.color || '#FFFFFF').toUpperCase()}
              </span>
              <ChevronDown size={12} className={styles.dimChevron} />
              <input
                ref={textColorInputRef}
                type="color"
                value={selectedLayer.color || '#FFFFFF'}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value }, true)}
                className={styles.hiddenColorPicker}
              />
            </div>
          </div>

          {/* Background Color Row */}
          <div className={styles.propertyRow}>
            <div className={styles.fieldLabel}>
              <span>Background</span>
              <button
                type="button"
                className={styles.smallTransparentToggle}
                onClick={() =>
                  onUpdateLayer(
                    selectedLayer.id,
                    {
                      bgColor:
                        !selectedLayer.bgColor || selectedLayer.bgColor === 'transparent'
                          ? 'rgba(0,0,0,0.7)'
                          : 'transparent',
                    },
                    true
                  )
                }
              >
                {!selectedLayer.bgColor || selectedLayer.bgColor === 'transparent'
                  ? 'Add Fill'
                  : 'Clear'}
              </button>
            </div>
            <div
              className={styles.colorPickerTrigger}
              onClick={() => textBgColorInputRef.current?.click()}
            >
              <div
                className={`${styles.colorSwatchPreview} ${!selectedLayer.bgColor || selectedLayer.bgColor === 'transparent'
                  ? styles.checkerPattern
                  : ''
                  }`}
                style={{
                  backgroundColor:
                    selectedLayer.bgColor && selectedLayer.bgColor !== 'transparent'
                      ? selectedLayer.bgColor
                      : 'transparent',
                }}
              />
              <span className={styles.colorHexCode}>
                {selectedLayer.bgColor && selectedLayer.bgColor !== 'transparent'
                  ? selectedLayer.bgColor.toUpperCase()
                  : 'Transparent'}
              </span>
              <ChevronDown size={12} className={styles.dimChevron} />
              <input
                ref={textBgColorInputRef}
                type="color"
                value={
                  selectedLayer.bgColor && selectedLayer.bgColor !== 'transparent'
                    ? selectedLayer.bgColor
                    : '#000000'
                }
                onChange={(e) => onUpdateLayer(selectedLayer.id, { bgColor: e.target.value }, true)}
                className={styles.hiddenColorPicker}
              />
            </div>
          </div>

          {/* Stroke (Outline) Row */}
          <div className={styles.propertyRow}>
            <div className={styles.strokeLabelRow}>
              <label className={styles.fieldLabel}>Stroke (Outline)</label>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={(selectedLayer.strokeWidth || 0) > 0}
                  onChange={(e) =>
                    onUpdateLayer(
                      selectedLayer.id,
                      {
                        strokeWidth: e.target.checked ? 4 : 0,
                        strokeColor: selectedLayer.strokeColor || '#FFD700',
                      },
                      true
                    )
                  }
                />
                <span className={styles.sliderRound} />
              </label>
            </div>

            {(selectedLayer.strokeWidth || 0) > 0 && (
              <div className={styles.strokeControlsInline}>
                <div
                  className={styles.colorPickerTrigger}
                  onClick={() => textStrokeColorInputRef.current?.click()}
                >
                  <div
                    className={styles.colorSwatchPreview}
                    style={{ backgroundColor: selectedLayer.strokeColor || '#FFD700' }}
                  />
                  <span className={styles.colorHexCode}>
                    {(selectedLayer.strokeColor || '#FFD700').toUpperCase()}
                  </span>
                  <input
                    ref={textStrokeColorInputRef}
                    type="color"
                    value={selectedLayer.strokeColor || '#FFD700'}
                    onChange={(e) =>
                      onUpdateLayer(selectedLayer.id, { strokeColor: e.target.value }, true)
                    }
                    className={styles.hiddenColorPicker}
                  />
                </div>

                <select
                  value={selectedLayer.strokeWidth || 4}
                  onChange={(e) =>
                    onUpdateLayer(selectedLayer.id, { strokeWidth: parseInt(e.target.value, 10) }, true)
                  }
                  className={styles.strokeWidthSelect}
                >
                  <option value={1}>1 px</option>
                  <option value={2}>2 px</option>
                  <option value={3}>3 px</option>
                  <option value={4}>4 px</option>
                  <option value={6}>6 px</option>
                  <option value={8}>8 px</option>
                </select>
              </div>
            )}
          </div>

          {/* Opacity Slider */}
          <div className={styles.sliderFieldGroup}>
            <div className={styles.sliderLabelRow}>
              <label className={styles.fieldLabel}>Opacity</label>
              <span className={styles.sliderValueBadge}>{selectedLayer.opacity || 100}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={selectedLayer.opacity || 100}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { opacity: parseInt(e.target.value, 10) }, true)
              }
              className={styles.rangeTrack}
            />
          </div>

          {/* Letter Spacing & Line Height */}
          <div className={styles.sliderFieldGroup}>
            <div className={styles.sliderLabelRow}>
              <label className={styles.fieldLabel}>Letter Spacing</label>
              <span className={styles.sliderValueBadge}>{selectedLayer.letterSpacing || 0}px</span>
            </div>
            <input
              type="range"
              min="-2"
              max="20"
              step="1"
              value={selectedLayer.letterSpacing || 0}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { letterSpacing: parseInt(e.target.value, 10) }, true)
              }
              className={styles.rangeTrack}
            />
          </div>

          <div className={styles.sliderFieldGroup}>
            <div className={styles.sliderLabelRow}>
              <label className={styles.fieldLabel}>Line Height</label>
              <span className={styles.sliderValueBadge}>{selectedLayer.lineHeight || 1.25}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={selectedLayer.lineHeight || 1.25}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { lineHeight: parseFloat(e.target.value) }, true)
              }
              className={styles.rangeTrack}
            />
          </div>

          {/* Effects Collapsible Section */}
          <div className={styles.accordionSection}>
            <button
              type="button"
              className={styles.accordionHeader}
              onClick={() => setEffectsOpen((prev) => !prev)}
            >
              <span>Effects (Shadow & Glow)</span>
              {effectsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {effectsOpen && (
              <div className={styles.accordionBody}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={(selectedLayer.shadowBlur || 0) > 0}
                    onChange={(e) =>
                      onUpdateLayer(
                        selectedLayer.id,
                        {
                          shadowBlur: e.target.checked ? 10 : 0,
                          shadowColor: 'rgba(0,0,0,0.6)',
                          shadowOffsetX: 2,
                          shadowOffsetY: 2,
                        },
                        true
                      )
                    }
                  />
                  <span>Shadow</span>
                </label>

                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedLayer.glow)}
                    onChange={(e) =>
                      onUpdateLayer(
                        selectedLayer.id,
                        {
                          glow: e.target.checked,
                          shadowBlur: e.target.checked ? 16 : selectedLayer.shadowBlur,
                          shadowColor: e.target.checked ? '#7c3aed' : selectedLayer.shadowColor,
                        },
                        true
                      )
                    }
                  />
                  <span>Glow</span>
                </label>
              </div>
            )}
          </div>

          {/* Position X and Y */}
          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Position X</label>
              <input
                type="number"
                value={selectedLayer.x || 0}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, { x: parseInt(e.target.value, 10) || 0 }, true)
                }
                className={styles.numberInput}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Position Y</label>
              <input
                type="number"
                value={selectedLayer.y || 0}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, { y: parseInt(e.target.value, 10) || 0 }, true)
                }
                className={styles.numberInput}
              />
            </div>
          </div>

          {/* Opacity Slider */}
          <div className={styles.sliderFieldGroup}>
            <div className={styles.sliderLabelRow}>
              <label className={styles.fieldLabel}>Opacity</label>
              <span className={styles.sliderValueBadge}>{selectedLayer.opacity || 100}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={selectedLayer.opacity || 100}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { opacity: parseInt(e.target.value, 10) }, true)
              }
              className={styles.rangeTrack}
            />
          </div>

          {/* Alignment to Canvas */}
          <LayerAlignmentSection
            layer={selectedLayer}
            onUpdateLayer={onUpdateLayer}
            currentWidth={currentWidth}
            currentHeight={currentHeight}
          />

          {/* Lock / Unlock Toggle */}
          <LayerLockSection layer={selectedLayer} onUpdateLayer={onUpdateLayer} />

          {/* Professional Object Rotation */}
          <LayerRotationSection layer={selectedLayer} onUpdateLayer={onUpdateLayer} />

          {/* Layer Actions */}
          <div className={styles.layerActionButtonsRow}>
            {onDuplicateLayer && (
              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={() => onDuplicateLayer(selectedLayer.id)}
              >
                <Copy size={13} />
                <span>Duplicate Layer</span>
              </button>
            )}
            {onDeleteLayer && (
              <button
                type="button"
                className={`${styles.secondaryActionBtn} ${styles.deleteActionBtn}`}
                onClick={() => onDeleteLayer(selectedLayer.id)}
              >
                <Trash2 size={13} />
                <span>Delete Layer</span>
              </button>
            )}
          </div>
        </div>
  );

  // ---------------------------------------------------------------------------
  // 10. RENDER: SELECTED SHAPE LAYER PROPERTIES
  // ---------------------------------------------------------------------------
  const renderShapeLayerSection = () => (
            <div className={styles.sectionScroll}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelHeading} data-panel-heading="true">Shape Properties</h2>
          </div>

          {/* Shape Types Selector Grid */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Shape Type</label>
            <div className={styles.shapesGrid}>
              {SHAPE_PRESETS.map((sh) => {
                const Icon = sh.icon;
                const active = selectedLayer.shapeType === sh.id;
                return (
                  <button
                    key={sh.id}
                    type="button"
                    className={`${styles.shapeOptionBtn} ${active ? styles.shapeOptionActive : ''}`}
                    onClick={() => onUpdateLayer(selectedLayer.id, { shapeType: sh.id }, true)}
                    title={sh.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fill Color */}
          <div className={styles.propertyRow}>
            <label className={styles.fieldLabel}>Fill Color</label>
            <div
              className={styles.colorPickerTrigger}
              onClick={() => shapeFillInputRef.current?.click()}
            >
              <div
                className={`${styles.colorSwatchPreview} ${selectedLayer.fillColor === 'transparent' ? styles.checkerPattern : ''
                  }`}
                style={{
                  backgroundColor:
                    selectedLayer.fillColor !== 'transparent' ? selectedLayer.fillColor : 'transparent',
                }}
              />
              <span className={styles.colorHexCode}>
                {selectedLayer.fillColor ? selectedLayer.fillColor.toUpperCase() : '#7C3AED'}
              </span>
              <input
                ref={shapeFillInputRef}
                type="color"
                value={
                  selectedLayer.fillColor && selectedLayer.fillColor !== 'transparent'
                    ? selectedLayer.fillColor
                    : '#7C3AED'
                }
                onChange={(e) => onUpdateLayer(selectedLayer.id, { fillColor: e.target.value }, true)}
                className={styles.hiddenColorPicker}
              />
            </div>
          </div>

          {/* Stroke Color & Width */}
          <div className={styles.propertyRow}>
            <label className={styles.fieldLabel}>Stroke & Width</label>
            <div className={styles.strokeControlsInline}>
              <div
                className={styles.colorPickerTrigger}
                onClick={() => shapeStrokeInputRef.current?.click()}
              >
                <div
                  className={styles.colorSwatchPreview}
                  style={{ backgroundColor: selectedLayer.strokeColor || '#FFFFFF' }}
                />
                <span className={styles.colorHexCode}>
                  {(selectedLayer.strokeColor || '#FFFFFF').toUpperCase()}
                </span>
                <input
                  ref={shapeStrokeInputRef}
                  type="color"
                  value={selectedLayer.strokeColor || '#FFFFFF'}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeColor: e.target.value }, true)}
                  className={styles.hiddenColorPicker}
                />
              </div>

              <select
                value={selectedLayer.strokeWidth || 2}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, { strokeWidth: parseInt(e.target.value, 10) }, true)
                }
                className={styles.strokeWidthSelect}
              >
                <option value={0}>0 px (None)</option>
                <option value={1}>1 px</option>
                <option value={2}>2 px</option>
                <option value={4}>4 px</option>
                <option value={8}>8 px</option>
              </select>
            </div>
          </div>

          {/* Rounded Rect Border Radius */}
          {selectedLayer.shapeType === 'rounded-rect' && (
            <div className={styles.sliderFieldGroup}>
              <div className={styles.sliderLabelRow}>
                <label className={styles.fieldLabel}>Corner Radius</label>
                <span className={styles.sliderValueBadge}>{selectedLayer.borderRadius || 16} px</span>
              </div>
              <input
                type="range"
                min="2"
                max="60"
                value={selectedLayer.borderRadius || 16}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, { borderRadius: parseInt(e.target.value, 10) }, true)
                }
                className={styles.rangeTrack}
              />
            </div>
          )}

          {/* Opacity */}
          <div className={styles.sliderFieldGroup}>
            <div className={styles.sliderLabelRow}>
              <label className={styles.fieldLabel}>Opacity</label>
              <span className={styles.sliderValueBadge}>{selectedLayer.opacity || 100}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={selectedLayer.opacity || 100}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { opacity: parseInt(e.target.value, 10) }, true)
              }
              className={styles.rangeTrack}
            />
          </div>

          {/* Dimensions: Width & Height */}
          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Width (px)</label>
              <input
                type="number"
                min="5"
                max="8000"
                value={selectedLayer.width || 100}
                onChange={(e) => {
                  const newW = Math.max(5, parseInt(e.target.value, 10) || 5);
                  onUpdateLayer(selectedLayer.id, { width: newW }, true);
                }}
                className={styles.numberInput}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Height (px)</label>
              <input
                type="number"
                min="5"
                max="8000"
                value={selectedLayer.height || 100}
                onChange={(e) => {
                  const newH = Math.max(5, parseInt(e.target.value, 10) || 5);
                  onUpdateLayer(selectedLayer.id, { height: newH }, true);
                }}
                className={styles.numberInput}
              />
            </div>
          </div>

          {/* Position: X and Y */}
          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Position X</label>
              <input
                type="number"
                value={selectedLayer.x || 0}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, { x: parseInt(e.target.value, 10) || 0 }, true)
                }
                className={styles.numberInput}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Position Y</label>
              <input
                type="number"
                value={selectedLayer.y || 0}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, { y: parseInt(e.target.value, 10) || 0 }, true)
                }
                className={styles.numberInput}
              />
            </div>
          </div>

          {/* Alignment to Canvas */}
          <LayerAlignmentSection
            layer={selectedLayer}
            onUpdateLayer={onUpdateLayer}
            currentWidth={currentWidth}
            currentHeight={currentHeight}
          />

          {/* Lock / Unlock Toggle */}
          <LayerLockSection layer={selectedLayer} onUpdateLayer={onUpdateLayer} />

          {/* Professional Object Rotation */}
          <LayerRotationSection layer={selectedLayer} onUpdateLayer={onUpdateLayer} />

          {/* Layer Actions */}
          <div className={styles.layerActionButtonsRow}>
            {onDuplicateLayer && (
              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={() => onDuplicateLayer(selectedLayer.id)}
              >
                <Copy size={13} />
                <span>Duplicate Layer</span>
              </button>
            )}
            {onDeleteLayer && (
              <button
                type="button"
                className={`${styles.secondaryActionBtn} ${styles.deleteActionBtn}`}
                onClick={() => onDeleteLayer(selectedLayer.id)}
              >
                <Trash2 size={13} />
                <span>Delete Layer</span>
              </button>
            )}
          </div>
        </div>
  );

  // ---------------------------------------------------------------------------
  // 11. RENDER: SELECTED IMAGE LAYER PROPERTIES
  // ---------------------------------------------------------------------------
  const renderImageLayerSection = () => (
            <div className={styles.sectionScroll}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelHeading} data-panel-heading="true">Image Layer</h2>
          </div>

          {/* Layer Name Input */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Layer Name</label>
            <input
              type="text"
              value={selectedLayer.name || 'Image Layer'}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { name: e.target.value }, true)}
              className={styles.textInput}
              placeholder="Layer name..."
            />
          </div>

          {/* Dimensions: Width & Height */}
          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Width (px)</label>
              <input
                type="number"
                min="10"
                max="8000"
                value={selectedLayer.width || 100}
                onChange={(e) => {
                  const newW = Math.max(10, parseInt(e.target.value, 10) || 10);
                  const ratio = (selectedLayer.originalWidth && selectedLayer.originalHeight)
                    ? selectedLayer.originalWidth / selectedLayer.originalHeight
                    : (selectedLayer.width / (selectedLayer.height || 1));
                  const newH = selectedLayer.lockAspect ? Math.round(newW / ratio) : selectedLayer.height;
                  onUpdateLayer(selectedLayer.id, { width: newW, height: newH }, true);
                }}
                className={styles.numberInput}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Height (px)</label>
              <input
                type="number"
                min="10"
                max="8000"
                value={selectedLayer.height || 100}
                onChange={(e) => {
                  const newH = Math.max(10, parseInt(e.target.value, 10) || 10);
                  const ratio = (selectedLayer.originalWidth && selectedLayer.originalHeight)
                    ? selectedLayer.originalWidth / selectedLayer.originalHeight
                    : (selectedLayer.width / (selectedLayer.height || 1));
                  const newW = selectedLayer.lockAspect ? Math.round(newH * ratio) : selectedLayer.width;
                  onUpdateLayer(selectedLayer.id, { width: newW, height: newH }, true);
                }}
                className={styles.numberInput}
              />
            </div>
          </div>

          {/* Position X and Y */}
          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Position X</label>
              <input
                type="number"
                value={selectedLayer.x || 0}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, { x: parseInt(e.target.value, 10) || 0 }, true)
                }
                className={styles.numberInput}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Position Y</label>
              <input
                type="number"
                value={selectedLayer.y || 0}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, { y: parseInt(e.target.value, 10) || 0 }, true)
                }
                className={styles.numberInput}
              />
            </div>
          </div>

          {/* Opacity Slider */}
          <div className={styles.sliderFieldGroup}>
            <div className={styles.sliderLabelRow}>
              <label className={styles.fieldLabel}>Opacity</label>
              <span className={styles.sliderValueBadge}>{selectedLayer.opacity || 100}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={selectedLayer.opacity || 100}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { opacity: parseInt(e.target.value, 10) }, true)
              }
              className={styles.rangeTrack}
            />
          </div>

          {/* Professional Object Rotation */}
          <LayerRotationSection layer={selectedLayer} onUpdateLayer={onUpdateLayer} />
          {/* Alignment to Canvas */}
          <LayerAlignmentSection
            layer={selectedLayer}
            onUpdateLayer={onUpdateLayer}
            currentWidth={currentWidth}
            currentHeight={currentHeight}
          />

          {/* Lock / Unlock Toggle */}
          <LayerLockSection layer={selectedLayer} onUpdateLayer={onUpdateLayer} />

          {/* Professional Object Rotation */}
          <LayerRotationSection layer={selectedLayer} onUpdateLayer={onUpdateLayer} />

          {/* Layer Actions */}
          <div className={styles.layerActionButtonsRow}>
            {onDuplicateLayer && (
              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={() => onDuplicateLayer(selectedLayer.id)}
              >
                <Copy size={13} />
                <span>Duplicate Layer</span>
              </button>
            )}
            {onDeleteLayer && (
              <button
                type="button"
                className={`${styles.secondaryActionBtn} ${styles.deleteActionBtn}`}
                onClick={() => onDeleteLayer(selectedLayer.id)}
              >
                <Trash2 size={13} />
                <span>Delete Layer</span>
              </button>
            )}
          </div>
        </div>
  );

  // ---------------------------------------------------------------------------
  // 11B. RENDER: SELECTED BLANK LAYER PROPERTIES
  // ---------------------------------------------------------------------------
  const renderBlankLayerSection = () => (
    <div className={styles.sectionScroll}>
      <div className={styles.panelTitleRow}>
        <h2 className={styles.panelHeading} data-panel-heading="true">Blank Layer</h2>
        <span className={styles.toolBadge}>Transparent</span>
      </div>

      {/* Layer Name Input */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Layer Name</label>
        <input
          type="text"
          value={selectedLayer.name || 'Layer'}
          onChange={(e) => onUpdateLayer(selectedLayer.id, { name: e.target.value }, true)}
          className={styles.textInput}
          placeholder="Layer name..."
          data-testid="prop-layer-name"
        />
      </div>

      {/* Opacity Slider */}
      <div className={styles.fieldGroup}>
        <div className={styles.sliderHeader}>
          <label className={styles.fieldLabel}>Opacity</label>
          <span className={styles.sliderValue}>{selectedLayer.opacity ?? 100}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={selectedLayer.opacity ?? 100}
          onChange={(e) =>
            onUpdateLayer(selectedLayer.id, { opacity: parseInt(e.target.value, 10) }, true)
          }
          className={styles.sliderInput}
        />
      </div>

      {/* Lock / Unlock Toggle */}
      <LayerLockSection layer={selectedLayer} onUpdateLayer={onUpdateLayer} />

      {/* Layer Actions */}
      <div className={styles.layerActionButtonsRow}>
        {onDuplicateLayer && (
          <button
            type="button"
            className={styles.secondaryActionBtn}
            onClick={() => onDuplicateLayer(selectedLayer.id)}
          >
            <Copy size={13} />
            <span>Duplicate Layer</span>
          </button>
        )}
        {onDeleteLayer && (
          <button
            type="button"
            className={`${styles.secondaryActionBtn} ${styles.deleteActionBtn}`}
            onClick={() => onDeleteLayer(selectedLayer.id)}
          >
            <Trash2 size={13} />
            <span>Delete Layer</span>
          </button>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // 12. RENDER: MOVE TOOL / CANVAS DOCUMENT PROPERTIES
  // ---------------------------------------------------------------------------
  const renderCanvasDocumentSection = () => {
    const cW = currentWidth || 0;
    const cH = currentHeight || 0;
    const totalPixels = cW * cH;
    const megapixels = totalPixels > 0 ? (totalPixels / 1000000).toFixed(2) : '0';
    const totalLayers = (layers ? layers.length : 0) + (hasImage ? 1 : 0);
    const zoomPct = Math.round((zoom || 1) * 100);

    let aspectLabel = 'Custom';
    if (cW > 0 && cH > 0) {
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const d = gcd(cW, cH);
      const simpW = cW / d;
      const simpH = cH / d;
      if (simpW <= 21 && simpH <= 21) {
        aspectLabel = `${simpW}:${simpH}`;
      } else {
        const ratio = cW / cH;
        if (Math.abs(ratio - 1) < 0.02) aspectLabel = '1:1 Square';
        else if (Math.abs(ratio - 16 / 9) < 0.03) aspectLabel = '16:9 Landscape';
        else if (Math.abs(ratio - 9 / 16) < 0.03) aspectLabel = '9:16 Story';
        else if (Math.abs(ratio - 4 / 3) < 0.03) aspectLabel = '4:3 Standard';
        else if (Math.abs(ratio - 3 / 2) < 0.03) aspectLabel = '3:2 Photo';
        else aspectLabel = `${ratio.toFixed(2)}:1`;
      }
    }

    return (
      <div className={styles.sectionScroll}>
        <div className={styles.panelTitleRow}>
          <h2 className={styles.panelHeading} data-panel-heading="true">Canvas Document</h2>
        </div>

        {/* Document Dimensions Card */}
        <div className={styles.docCard}>
          <div className={styles.labelWithActionRow}>
            <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>
              Document Dimensions
            </label>
            <span className={styles.docStatMeta}>{aspectLabel}</span>
          </div>

          <div className={styles.docStatGrid}>
            <div className={styles.docStatBox}>
              <span className={styles.docStatLabel}>Width</span>
              <span className={styles.docStatValue}>{cW} <small style={{ fontSize: '0.7rem', fontWeight: 500 }}>px</small></span>
            </div>
            <div className={styles.docStatBox}>
              <span className={styles.docStatLabel}>Height</span>
              <span className={styles.docStatValue}>{cH} <small style={{ fontSize: '0.7rem', fontWeight: 500 }}>px</small></span>
            </div>
          </div>

          <div className={styles.docStatGrid}>
            <div className={styles.docStatBox}>
              <span className={styles.docStatLabel}>Resolution</span>
              <span className={styles.docStatValue}>{megapixels} <small style={{ fontSize: '0.7rem', fontWeight: 500 }}>MP</small></span>
            </div>
            <div className={styles.docStatBox}>
              <span className={styles.docStatLabel}>Zoom Level</span>
              <span className={styles.docStatValue}>{zoomPct}%</span>
            </div>
          </div>
        </div>

        {/* Canvas & Layers Status Card */}
        <div className={styles.docCard}>
          <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>
            Canvas & Layers
          </label>
          <div className={styles.docStatGrid}>
            <div className={styles.docStatBox}>
              <span className={styles.docStatLabel}>Layers</span>
              <span className={styles.docStatValue}>{totalLayers} <small style={{ fontSize: '0.7rem', fontWeight: 500 }}>total</small></span>
            </div>
            <div className={styles.docStatBox}>
              <span className={styles.docStatLabel}>Background</span>
              <div className={styles.bgStatValueRow}>
                {canvasBgOption === 'transparent' ? (
                  <>
                    <span className={styles.checkerThumbSmall} aria-hidden="true" />
                    <span className={styles.docStatValue} style={{ fontSize: '0.8125rem' }}>Transparent</span>
                  </>
                ) : (
                  <span className={styles.docStatValue} style={{ fontSize: '0.8125rem' }}>
                    {canvasBgOption === 'white' ? 'White' : 'Solid Color'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Document Background Options */}
        <div className={styles.docCard} data-testid="doc-bg-card">
          <div className={styles.labelWithActionRow}>
            <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>
              Document Background
            </label>
            <span className={styles.docStatMeta}>Underlying Canvas</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className={`${styles.cropPresetBtn} ${canvasBgOption === 'transparent' ? styles.cropPresetBtnActive : ''}`}
              onClick={() => onCanvasBgOptionChange?.('transparent')}
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <span className={styles.checkerThumbSmall} style={{ width: 10, height: 10 }} />
              Transparent
            </button>
            <button
              type="button"
              className={`${styles.cropPresetBtn} ${canvasBgOption === 'white' ? styles.cropPresetBtnActive : ''}`}
              onClick={() => onCanvasBgOptionChange?.('white')}
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
            >
              White
            </button>
            <button
              type="button"
              className={`${styles.cropPresetBtn} ${canvasBgOption === 'custom' || canvasBgOption === 'color' ? styles.cropPresetBtnActive : ''}`}
              onClick={() => onCanvasBgOptionChange?.('custom')}
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: canvasCustomColor || '#7c3aed', border: '1px solid rgba(0,0,0,0.15)' }} />
              Color
            </button>
          </div>

          {(canvasBgOption === 'custom' || canvasBgOption === 'color') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="color"
                value={canvasCustomColor || '#ffffff'}
                onChange={(e) => onCanvasCustomColorChange?.(e.target.value)}
                style={{ width: 32, height: 26, padding: 0, border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569' }}>{canvasCustomColor}</span>
            </div>
          )}
        </div>

        {/* Selection Guidance Info Box — Sleek matching mockup */}
        <div className={styles.docInfoBanner} data-testid="doc-no-selection-banner">
          <Info size={15} className={styles.docInfoIcon} />
          <span className={styles.docInfoTitle}>No Layer Selected</span>
        </div>
      </div>
    );
  };

  // ===========================================================================
  // TOP-LEVEL DYNAMIC PROPERTIES ROUTER
  // Single source of truth: active tool & selected object
  // ===========================================================================

  // Case 0: No document open
  if (!hasImage) {
    return (
      <div className={styles.propertiesContainer}>
        <div className={styles.emptyPropertiesState} data-testid="properties-empty">
          <SlidersHorizontal size={40} className={styles.emptyPropertiesIcon} />
          <h3 className={styles.emptyPropertiesTitle}>No Document Open</h3>
          <p className={styles.emptyPropertiesSubtext}>
            Create a new canvas or open an image to view and edit document properties.
          </p>
        </div>
      </div>
    );
  }

  // Case 1: Crop Tool
  if (effectiveTool === 'crop') {
    return <div className={styles.propertiesContainer}>{renderCropSection()}</div>;
  }

  // Case 2: Resize Tool
  if (effectiveTool === 'resize') {
    return <div className={styles.propertiesContainer}>{renderResizeSection()}</div>;
  }

  // Case 3: Rotate Tool
  if (effectiveTool === 'rotate') {
    return <div className={styles.propertiesContainer}>{renderRotateSection()}</div>;
  }

  // Case 4: Canvas Size Tool
  if (effectiveTool === 'canvas') {
    return <div className={styles.propertiesContainer}>{renderCanvasSection()}</div>;
  }

  // Case 5: Brush Painting Tool
  if (effectiveTool === 'brush') {
    return <div className={styles.propertiesContainer}>{renderBrushSection()}</div>;
  }

  // Case 6: Eraser Tool
  if (effectiveTool === 'eraser') {
    return <div className={styles.propertiesContainer}>{renderEraserSection()}</div>;
  }

  // Case 7: Shape Tools (rect, circle, triangle, line, star, shapes)
  if (isShapeToolActive) {
    if (isSelectedLayerReal && selectedLayer.type === 'shape') {
      return <div className={styles.propertiesContainer}>{renderShapeLayerSection()}</div>;
    }
    return <div className={styles.propertiesContainer}>{renderShapeToolSettingsSection()}</div>;
  }

  // Case 8: Text Tool
  if (effectiveTool === 'text') {
    if (isSelectedLayerReal && selectedLayer.type === 'text') {
      return <div className={styles.propertiesContainer}>{renderTextLayerSection()}</div>;
    }
    return <div className={styles.propertiesContainer}>{renderTextToolSettingsSection()}</div>;
  }

  // Case 9: Move Tool with Object Selected
  if (isSelectedLayerReal) {
    if (selectedLayer.type === 'text') {
      return <div className={styles.propertiesContainer}>{renderTextLayerSection()}</div>;
    }
    if (selectedLayer.type === 'shape') {
      return <div className={styles.propertiesContainer}>{renderShapeLayerSection()}</div>;
    }
    if (selectedLayer.type === 'image') {
      return <div className={styles.propertiesContainer}>{renderImageLayerSection()}</div>;
    }
    if (selectedLayer.type === 'blank') {
      return <div className={styles.propertiesContainer}>{renderBlankLayerSection()}</div>;
    }
  }

  // Case 10: Move Tool with No Object Selected (or Background selected)
  return <div className={styles.propertiesContainer}>{renderCanvasDocumentSection()}</div>;
}

export default PropertiesPanel;
