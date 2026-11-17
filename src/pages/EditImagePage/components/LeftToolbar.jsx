import { useRef } from 'react';
import {
  MousePointer,
  Crop,
  Scaling,
  RotateCw,
  Layout,
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  Star,
  Paintbrush,
  Eraser,
  Pipette,
  PaintBucket,
  ArrowLeftRight,
} from 'lucide-react';
import styles from './LeftToolbar.module.css';

export function LeftToolbar({
  activeTool,
  onToolSelect,
  foregroundColor = '#7C3AED',
  backgroundColor = '#FFFFFF',
  onForegroundColorChange,
  onBackgroundColorChange,
  onSwapColors,
  hasImage = false,
}) {
  const fgInputRef = useRef(null);
  const bgInputRef = useRef(null);

  const handleEyedropper = async () => {
    if (!hasImage) return;
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onForegroundColorChange(result.sRGBHex);
        }
      } catch {
        // User cancelled eyedropper
      }
    } else {
      if (fgInputRef.current) fgInputRef.current.click();
    }
  };

  const handleToolClick = (toolId) => {
    if (!hasImage) return;

    if (toolId === 'eyedropper') {
      handleEyedropper();
      return;
    }

    onToolSelect?.(toolId);
  };

  // Group 1: Selection & Canvas Geometry
  const SELECTION_TOOLS = [
    { id: 'move', label: 'Move Tool (V)', icon: MousePointer },
    { id: 'crop', label: 'Crop Tool (C)', icon: Crop },
    { id: 'resize', label: 'Resize Image', icon: Scaling },
    { id: 'rotate', label: 'Rotate & Flip', icon: RotateCw },
    { id: 'canvas', label: 'Canvas Size', icon: Layout },
  ];

  // Group 2: Vector Shapes & Text
  const VECTOR_SHAPE_TOOLS = [
    { id: 'text', label: 'Horizontal Type Tool (T)', icon: Type },
    { id: 'rect', label: 'Rectangle Tool (U)', icon: Square },
    { id: 'circle', label: 'Ellipse / Circle Tool', icon: Circle },
    { id: 'triangle', label: 'Triangle Tool', icon: Triangle },
    { id: 'line', label: 'Line Tool', icon: Minus },
    { id: 'star', label: 'Polygon & Star Tool', icon: Star },
  ];

  // Group 3: Painting, Retouch & Color
  const DRAWING_PAINT_TOOLS = [
    { id: 'brush', label: 'Brush Tool (B)', icon: Paintbrush },
    { id: 'eraser', label: 'Eraser Tool (E)', icon: Eraser },
    { id: 'eyedropper', label: 'Eyedropper Tool (I)', icon: Pipette },
    { id: 'fill', label: 'Paint Bucket Tool (G)', icon: PaintBucket },
  ];

  const isCurrentActive = (id) => {
    if (!hasImage) return false;
    return Boolean(activeTool && activeTool === id);
  };

  const renderToolButton = (tool) => {
    const Icon = tool.icon;
    const active = isCurrentActive(tool.id);
    return (
      <button
        key={tool.id}
        type="button"
        data-tool-id={tool.id}
        data-tool-active={active ? 'true' : 'false'}
        disabled={!hasImage}
        className={`${styles.toolButton} ${active ? styles.toolButtonActive : ''} ${
          !hasImage ? styles.toolButtonDisabled : ''
        }`}
        onClick={() => handleToolClick(tool.id)}
        title={
          hasImage
            ? `${tool.label}`
            : 'Create a canvas or open an image to start editing.'
        }
        aria-label={tool.label}
      >
        <Icon size={17} className={styles.toolIcon} />
      </button>
    );
  };

  return (
    <aside className={styles.leftToolbar} aria-label="Editing Tools">
      <div className={styles.toolsScrollArea} data-tools-scroll-area="true">
        {/* Group 1: Transformation & Geometry */}
        <div className={styles.toolGroup}>
          {SELECTION_TOOLS.map(renderToolButton)}
        </div>

        <div className={styles.groupDivider} data-toolbar-divider="true" />

        {/* Group 2: Vector Shapes & Typography */}
        <div className={styles.toolGroup}>
          {VECTOR_SHAPE_TOOLS.map(renderToolButton)}
        </div>

        <div className={styles.groupDivider} data-toolbar-divider="true" />

        {/* Group 3: Raster, Painting & Color */}
        <div className={styles.toolGroup}>
          {DRAWING_PAINT_TOOLS.map(renderToolButton)}
        </div>
      </div>

      {/* Bottom Color Swatches & Swap Tool */}
      <div className={`${styles.colorPaletteSection} ${!hasImage ? styles.colorSectionDisabled : ''}`}>
        <div className={styles.swatchStack}>
          {/* Background Swatch (lower right) */}
          <button
            type="button"
            disabled={!hasImage}
            className={`${styles.swatchBox} ${styles.swatchBg}`}
            style={{ backgroundColor: backgroundColor }}
            onClick={() => hasImage && bgInputRef.current?.click()}
            title={hasImage ? `Background Color: ${backgroundColor}` : 'Create a canvas or open an image to start editing.'}
            aria-label="Background Color"
          />

          {/* Foreground Swatch (upper left) */}
          <button
            type="button"
            disabled={!hasImage}
            className={`${styles.swatchBox} ${styles.swatchFg}`}
            style={{ backgroundColor: foregroundColor }}
            onClick={() => hasImage && fgInputRef.current?.click()}
            title={hasImage ? `Foreground Color: ${foregroundColor}` : 'Create a canvas or open an image to start editing.'}
            aria-label="Foreground Color"
          />

          {/* Swap Arrow Button */}
          <button
            type="button"
            disabled={!hasImage}
            className={styles.swapColorsBtn}
            onClick={() => hasImage && onSwapColors?.()}
            title={hasImage ? 'Switch Foreground and Background Colors (X)' : 'Create a canvas or open an image to start editing.'}
            aria-label="Swap Colors"
          >
            <ArrowLeftRight size={10} />
          </button>
        </div>

        {/* Hidden Native Color Inputs */}
        <input
          ref={fgInputRef}
          type="color"
          value={foregroundColor}
          onChange={(e) => onForegroundColorChange?.(e.target.value)}
          className={styles.hiddenColorInput}
        />
        <input
          ref={bgInputRef}
          type="color"
          value={backgroundColor}
          onChange={(e) => onBackgroundColorChange?.(e.target.value)}
          className={styles.hiddenColorInput}
        />
      </div>
    </aside>
  );
}

export default LeftToolbar;
