const fs = require('fs');
const path = require('path');

const srcPath = path.resolve('src/pages/EditImagePage/components/PropertiesPanel.jsx');
const originalCode = fs.readFileSync(srcPath, 'utf8');
const lines = originalCode.split('\n');

// Extract specific slices from original
// Lines 329 to 379: Crop body
const cropBody = lines.slice(328, 379).join('\n');

// Lines 381 to 986: Text layer inner (before LayerRotationSection & action buttons)
const textLayerPre = lines.slice(380, 986).join('\n');

// Lines 1014 to 1208: Shape layer inner (before LayerRotationSection)
const shapeLayerPre = lines.slice(1013, 1208).join('\n');

// Lines 1216 to 1318: Image layer inner (before LayerRotationSection)
const imageLayerPre = lines.slice(1215, 1318).join('\n');

// Lines 1373 to 1443: Resize body
const resizeBody = lines.slice(1372, 1443).join('\n');

// Lines 1448 to 1508: Rotate body
const rotateBody = lines.slice(1447, 1508).join('\n');

// Lines 1513 to 1591: Canvas body
const canvasBody = lines.slice(1512, 1591).join('\n');

// Lines 1 to 245: Header, constants, and LayerRotationSection
const headerAndRotationSection = lines.slice(0, 245).join('\n');

// Build the updated PropertiesPanel.jsx
const newFileContent = `import { useState, useRef, useEffect } from 'react';
import {
  Sliders,
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
  Image as ImageIcon,
  Trash2,
  Copy,
  FoldHorizontal,
  MousePointer,
  Paintbrush,
  Eraser,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Info,
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
              className={\`\${styles.anglePresetPill} \${isActive ? styles.anglePresetActive : ''}\`}
              onClick={() => {
                onUpdateLayer(layer.id, { rotation: angle }, true);
                setInputValue(String(angle));
              }}
              title={\`Rotate to \${angle}°\`}
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
        className={\`\${styles.lockToggleBtn} \${isLocked ? styles.lockToggleBtnLocked : ''}\`}
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
  onAddTextLayer,
  hasImage = false,
  currentWidth = 0,
  currentHeight = 0,
  zoom = 1,
  foregroundColor = '#7C3AED',
  onForegroundColorChange,
  backgroundColor = '#FFFFFF',
  onBackgroundColorChange,
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
  const isSelectedLayerReal = Boolean(selectedLayer && selectedLayerId && selectedLayerId !== 'background');

  // ---------------------------------------------------------------------------
  // 1. RENDER: CROP TOOL
  // ---------------------------------------------------------------------------
  const renderCropSection = () => (
    ${cropBody}
  );

  // ---------------------------------------------------------------------------
  // 2. RENDER: RESIZE TOOL
  // ---------------------------------------------------------------------------
  const renderResizeSection = () => (
    ${resizeBody}
  );

  // ---------------------------------------------------------------------------
  // 3. RENDER: ROTATE TOOL
  // ---------------------------------------------------------------------------
  const renderRotateSection = () => (
    ${rotateBody}
  );

  // ---------------------------------------------------------------------------
  // 4. RENDER: CANVAS EXPANSION TOOL
  // ---------------------------------------------------------------------------
  const renderCanvasSection = () => (
    ${canvasBody}
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
                className={\`\${styles.brushPresetBtn} \${brushSize === sz ? styles.brushPresetBtnActive : ''}\`}
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
                className={\`\${styles.brushPresetBtn} \${brushSize === sz ? styles.brushPresetBtnActive : ''}\`}
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
                className={\`\${styles.quickSizePill} \${defaultFontSize === sz ? styles.quickSizePillActive : ''}\`}
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
                className={\`\${styles.formatBtn} \${defaultFontWeight === 'bold' ? styles.formatBtnActive : ''}\`}
                onClick={() => setDefaultFontWeight((prev) => (prev === 'bold' ? 'normal' : 'bold'))}
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                className={\`\${styles.formatBtn} \${defaultFontStyle === 'italic' ? styles.formatBtnActive : ''}\`}
                onClick={() => setDefaultFontStyle((prev) => (prev === 'italic' ? 'normal' : 'italic'))}
                title="Italic"
              >
                <Italic size={13} />
              </button>
            </div>
            <div className={styles.btnGroupThree}>
              <button
                type="button"
                className={\`\${styles.alignBtn} \${defaultTextAlign === 'left' ? styles.alignBtnActive : ''}\`}
                onClick={() => setDefaultTextAlign('left')}
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                className={\`\${styles.alignBtn} \${defaultTextAlign === 'center' ? styles.alignBtnActive : ''}\`}
                onClick={() => setDefaultTextAlign('center')}
                title="Align Center"
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                className={\`\${styles.alignBtn} \${defaultTextAlign === 'right' ? styles.alignBtnActive : ''}\`}
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

        {/* Action Button: Add Text to Canvas */}
        {onAddTextLayer && (
          <button
            type="button"
            className={styles.primaryActionBtn}
            onClick={onAddTextLayer}
          >
            <Plus size={15} />
            <span>Add Text Layer to Canvas</span>
          </button>
        )}

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
                  className={\`\${styles.shapeOptionBtn} \${active ? styles.shapeOptionActive : ''}\`}
                  onClick={() => onAddShape?.(sh.id)}
                  title={\`Draw \${sh.label}\`}
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
              className={\`\${styles.colorSwatchPreview} \${defaultShapeFill === 'transparent' ? styles.checkerPattern : ''}\`}
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
    ${textLayerPre}
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
                className={\`\${styles.secondaryActionBtn} \${styles.deleteActionBtn}\`}
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
    ${shapeLayerPre}
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
                className={\`\${styles.secondaryActionBtn} \${styles.deleteActionBtn}\`}
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
    ${imageLayerPre}
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
                className={\`\${styles.secondaryActionBtn} \${styles.deleteActionBtn}\`}
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
        aspectLabel = \`\${simpW}:\${simpH}\`;
      } else {
        const ratio = cW / cH;
        if (Math.abs(ratio - 1) < 0.02) aspectLabel = '1:1 Square';
        else if (Math.abs(ratio - 16 / 9) < 0.03) aspectLabel = '16:9 Landscape';
        else if (Math.abs(ratio - 9 / 16) < 0.03) aspectLabel = '9:16 Story';
        else if (Math.abs(ratio - 4 / 3) < 0.03) aspectLabel = '4:3 Standard';
        else if (Math.abs(ratio - 3 / 2) < 0.03) aspectLabel = '3:2 Photo';
        else aspectLabel = \`\${ratio.toFixed(2)}:1\`;
      }
    }

    return (
      <div className={styles.sectionScroll}>
        <div className={styles.panelTitleRow}>
          <h2 className={styles.panelHeading} data-panel-heading="true">Canvas Document</h2>
          <span className={styles.docTitleBadge}>
            <MousePointer size={11} />
            <span>Move Tool (V)</span>
          </span>
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
              <span className={styles.docStatValue} style={{ fontSize: '0.8125rem' }}>
                {canvasBgOption === 'transparent' ? 'Transparent' : 'Solid Color'}
              </span>
            </div>
          </div>
        </div>

        {/* Selection Guidance Info Box */}
        <div className={styles.docInfoBanner}>
          <Info size={16} className={styles.docInfoIcon} />
          <div className={styles.docInfoTextWrap}>
            <h4 className={styles.docInfoTitle}>No Layer Selected</h4>
            <p className={styles.docInfoDesc}>
              Click any text or shape layer directly on the canvas to inspect, move, resize, or rotate it. Drag with Spacebar or Middle Mouse to pan.
            </p>
          </div>
        </div>

        {/* Quick Creation Actions */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Quick Create</label>
          <div className={styles.docActionsRow}>
            {onAddTextLayer && (
              <button
                type="button"
                className={styles.docActionBtn}
                onClick={onAddTextLayer}
                title="Add a new text layer"
              >
                <Type size={13} />
                <span>+ Add Text</span>
              </button>
            )}
            {onAddShape && (
              <button
                type="button"
                className={styles.docActionBtn}
                onClick={() => onAddShape('rect')}
                title="Add a new rectangle shape"
              >
                <Square size={13} />
                <span>+ Add Shape</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===========================================================================
  // TOP-LEVEL DYNAMIC PROPERTIES ROUTER
  // Single source of truth: active tool & selected object
  // ===========================================================================

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
  }

  // Case 10: Move Tool with No Object Selected (or Background selected)
  return <div className={styles.propertiesContainer}>{renderCanvasDocumentSection()}</div>;
}

export default PropertiesPanel;
`;

fs.writeFileSync(srcPath, newFileContent, 'utf8');
console.log('Successfully generated PropertiesPanel.jsx with dynamic active-tool routing!');
