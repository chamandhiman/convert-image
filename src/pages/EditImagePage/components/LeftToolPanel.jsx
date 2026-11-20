import { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  Square,
  Circle,
  Triangle,
  Minus,
  Star,
  Crop,
  Scaling,
  RotateCw,
  Layout,
  Pipette,
  Bandage,
  Eraser,
  Paintbrush,
  PaintBucket,
  PenTool,
  Type,
  Hand,
  ZoomIn,
  Wand2,
  Scissors,
  ArrowLeftRight,
  Rows,
  Columns,
  Hexagon,
  ArrowRight,
  Heart,
  Spline,
  Sparkles,
  Pen,
} from 'lucide-react';
import styles from './LeftToolPanel.module.css';

export const MarqueeRectIcon = ({ size = 18, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <rect
      x="3.5"
      y="3.5"
      width="17"
      height="17"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeDasharray="3 2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function LeftToolPanel({
  activeTool = 'move',
  onToolSelect,
  foregroundColor = '#7C3AED',
  backgroundColor = '#FFFFFF',
  onForegroundColorChange,
  onBackgroundColorChange,
  onSwapColors,
  hasImage = false,
  onResetColors,
}) {
  const [openFlyoutSlot, setOpenFlyoutSlot] = useState(null);
  const panelRef = useRef(null);
  const fgInputRef = useRef(null);
  const bgInputRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // Close flyouts on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpenFlyoutSlot(null);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpenFlyoutSlot(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // System Eyedropper handler
  const handleEyedropper = async () => {
    if (!hasImage) return;
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onForegroundColorChange?.(result.sRGBHex);
        }
      } catch {
        // User cancelled
      }
    } else {
      if (fgInputRef.current) fgInputRef.current.click();
    }
  };

  const handleSelectTool = (toolId) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setOpenFlyoutSlot(null);
    if (!hasImage && toolId !== 'move') return;

    if (toolId === 'eyedropper') {
      handleEyedropper();
      onToolSelect?.('eyedropper');
      return;
    }

    onToolSelect?.(toolId);
  };

  const handlePointerDown = (slotId, hasMultipleTools) => {
    if (!hasMultipleTools) return;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setOpenFlyoutSlot(slotId);
      longPressTimerRef.current = null;
    }, 400);
  };

  const handlePointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Tool Slots Definitions organized into 5 Photoshop tool groups
  const TOOL_SLOTS = [
    // GROUP 1: Selection & Navigation
    {
      groupId: 'group-selection',
      slots: [
        {
          id: 'slot-move',
          defaultTool: 'move',
          tools: [
            { id: 'move', label: 'Move Tool', shortcut: 'V', icon: MousePointer },
          ],
        },
        {
          id: 'slot-marquee',
          defaultTool: 'marquee-rect',
          tools: [
            { id: 'marquee-rect', label: 'Rectangular Marquee', shortcut: 'M', icon: MarqueeRectIcon },
            { id: 'marquee-ellipse', label: 'Elliptical Marquee', shortcut: 'Shift+M', icon: Circle },
            { id: 'single-row-marquee', label: 'Single Row Marquee', shortcut: '', icon: Rows },
            { id: 'single-column-marquee', label: 'Single Column Marquee', shortcut: '', icon: Columns },
          ],
        },
        {
          id: 'slot-lasso',
          defaultTool: 'lasso',
          tools: [
            { id: 'lasso', label: 'Lasso Tool', shortcut: 'L', icon: Scissors },
            { id: 'polygonal-lasso', label: 'Polygonal Lasso', shortcut: 'L', icon: Scissors },
            { id: 'magnetic-lasso', label: 'Magnetic Lasso', shortcut: 'L', icon: Spline },
            { id: 'magic-wand', label: 'Magic Wand Tool', shortcut: 'W', icon: Wand2 },
            { id: 'object-selection', label: 'Object Selection Tool', shortcut: 'W', icon: Sparkles },
          ],
        },
      ],
    },

    // GROUP 2: Image Editing & Retouch
    {
      groupId: 'group-edit',
      slots: [
        {
          id: 'slot-crop',
          defaultTool: 'crop',
          tools: [
            { id: 'crop', label: 'Crop Tool', shortcut: 'C', icon: Crop },
            { id: 'perspective-crop', label: 'Perspective Crop', shortcut: 'C', icon: Crop },
            { id: 'resize', label: 'Image Size...', shortcut: 'Ctrl+Alt+I', icon: Scaling },
            { id: 'canvas', label: 'Canvas Size...', shortcut: 'Ctrl+Alt+C', icon: Layout },
            { id: 'rotate', label: 'Rotate & Flip...', shortcut: '', icon: RotateCw },
          ],
        },
        {
          id: 'slot-retouch',
          defaultTool: 'eyedropper',
          tools: [
            { id: 'eyedropper', label: 'Eyedropper Tool', shortcut: 'I', icon: Pipette },
            { id: 'patch', label: 'Patch Tool', shortcut: 'J', icon: Bandage },
            { id: 'spot-healing', label: 'Spot Healing Brush', shortcut: 'J', icon: Bandage },
          ],
        },
      ],
    },

    // GROUP 3: Drawing & Painting
    {
      groupId: 'group-paint',
      slots: [
        {
          id: 'slot-brush',
          defaultTool: 'brush',
          tools: [
            { id: 'brush', label: 'Brush Tool', shortcut: 'B', icon: Paintbrush },
            { id: 'pencil', label: 'Pencil Tool', shortcut: 'B', icon: Pen },
            { id: 'color-replacement', label: 'Color Replacement Tool', shortcut: 'B', icon: Paintbrush },
            { id: 'fill', label: 'Paint Bucket Tool', shortcut: 'G', icon: PaintBucket },
          ],
        },
        {
          id: 'slot-eraser',
          defaultTool: 'eraser',
          tools: [
            { id: 'eraser', label: 'Eraser Tool', shortcut: 'E', icon: Eraser },
            { id: 'background-eraser', label: 'Background Eraser', shortcut: 'E', icon: Eraser },
            { id: 'magic-eraser', label: 'Magic Eraser', shortcut: 'E', icon: Wand2 },
          ],
        },
      ],
    },

    // GROUP 4: Vector & Shapes
    {
      groupId: 'group-vector',
      slots: [
        {
          id: 'slot-pen',
          defaultTool: 'pen',
          tools: [
            { id: 'pen', label: 'Pen Tool', shortcut: 'P', icon: PenTool },
            { id: 'freeform-pen', label: 'Freeform Pen Tool', shortcut: 'P', icon: Spline },
            { id: 'curvature-pen', label: 'Curvature Pen Tool', shortcut: 'P', icon: PenTool },
          ],
        },
        {
          id: 'slot-shape',
          defaultTool: 'rect',
          tools: [
            { id: 'rect', label: 'Rectangle Tool', shortcut: 'U', icon: Square },
            { id: 'rounded-rect', label: 'Rounded Rectangle', shortcut: 'U', icon: Square },
            { id: 'circle', label: 'Ellipse Tool', shortcut: 'Shift+U', icon: Circle },
            { id: 'triangle', label: 'Triangle Tool', shortcut: 'U', icon: Triangle },
            { id: 'polygon', label: 'Polygon Tool (Hexagon)', shortcut: 'U', icon: Hexagon },
            { id: 'star', label: 'Star Tool', shortcut: 'U', icon: Star },
            { id: 'line', label: 'Line Tool', shortcut: 'U', icon: Minus },
            { id: 'arrow', label: 'Arrow Tool', shortcut: 'U', icon: ArrowRight },
            { id: 'custom-shape', label: 'Custom Shape Tool', shortcut: 'U', icon: Heart },
          ],
        },
      ],
    },

    // GROUP 5: Typography & View Navigation
    {
      groupId: 'group-text-view',
      slots: [
        {
          id: 'slot-text',
          defaultTool: 'text',
          tools: [
            { id: 'text', label: 'Horizontal Type Tool', shortcut: 'T', icon: Type },
            { id: 'text-vertical', label: 'Vertical Type Tool', shortcut: 'T', icon: Type },
          ],
        },
        {
          id: 'slot-view',
          defaultTool: 'hand',
          tools: [
            { id: 'hand', label: 'Hand Tool', shortcut: 'H', icon: Hand },
            { id: 'zoom', label: 'Zoom Tool', shortcut: 'Z', icon: ZoomIn },
          ],
        },
      ],
    },
  ];

  return (
    <aside
      className={styles.leftToolPanel}
      ref={panelRef}
      aria-label="Photoshop Tools Palette"
      data-testid="left-tool-panel"
    >
      {/* Scrollable Tool Groups */}
      <div className={styles.toolsScrollContainer}>
        {TOOL_SLOTS.map((group, groupIdx) => (
          <div key={group.groupId} className={styles.toolGroup}>
            {groupIdx > 0 && <div className={styles.groupDivider} aria-hidden="true" />}

            {group.slots.map((slot) => {
              // Find if activeTool is one of this slot's tools
              const activeSubTool = slot.tools.find((t) => t.id === activeTool);
              // Representative tool for the slot icon: active subtool or first tool
              const currentTool = activeSubTool || slot.tools[0];
              const Icon = currentTool.icon;
              const isSlotActive = Boolean(activeSubTool);
              const hasMultipleTools = slot.tools.length > 1;
              const isFlyoutOpen = openFlyoutSlot === slot.id;

              return (
                <div key={slot.id} className={styles.toolSlot}>
                  <button
                    type="button"
                    className={`${styles.toolBtn} ${isSlotActive ? styles.toolBtnActive : ''}`}
                    onClick={() => handleSelectTool(currentTool.id)}
                    onPointerDown={() => handlePointerDown(slot.id, hasMultipleTools)}
                    onPointerUp={handlePointerUpOrLeave}
                    onPointerLeave={handlePointerUpOrLeave}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (hasMultipleTools) {
                        setOpenFlyoutSlot((p) => (p === slot.id ? null : slot.id));
                      }
                    }}
                    title={
                      hasImage
                        ? `${currentTool.label}${currentTool.shortcut ? ` (${currentTool.shortcut})` : ''}`
                        : 'Open an image or create a canvas to use tools'
                    }
                    data-testid={`tool-${currentTool.id}`}
                    data-tool-id={currentTool.id}
                    data-tool-active={isSlotActive ? 'true' : 'false'}
                    disabled={!hasImage && currentTool.id !== 'move'}
                    aria-label={currentTool.label}
                  >
                    <Icon size={18} className={styles.toolIcon} />

                    {/* Small corner triangle glyph for grouped tools with dedicated hit zone */}
                    {hasMultipleTools && (
                      <span
                        className={styles.cornerIndicatorZone}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenFlyoutSlot((p) => (p === slot.id ? null : slot.id));
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        onContextMenu={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenFlyoutSlot((p) => (p === slot.id ? null : slot.id));
                        }}
                        title="Click or right-click to show more tools in this group"
                        data-testid={`corner-trigger-${slot.id}`}
                      >
                        <span className={styles.cornerIndicator} />
                      </span>
                    )}
                  </button>

                  {/* Flyout Popover for Grouped Tools */}
                  {hasMultipleTools && isFlyoutOpen && (
                    <div
                      className={styles.flyoutMenu}
                      role="menu"
                      data-testid={`flyout-${slot.id}`}
                    >
                      {slot.tools.map((subTool) => {
                        const SubIcon = subTool.icon;
                        const isSubActive = activeTool === subTool.id;
                        return (
                          <button
                            key={subTool.id}
                            type="button"
                            className={`${styles.flyoutItem} ${isSubActive ? styles.flyoutItemActive : ''
                              }`}
                            onClick={() => handleSelectTool(subTool.id)}
                            data-testid={`tool-${subTool.id}`}
                          >
                            <div className={styles.flyoutLeft}>
                              <SubIcon size={15} className={styles.flyoutIcon} />
                              <span>{subTool.label}</span>
                            </div>
                            {subTool.shortcut && (
                              <span className={styles.flyoutShortcut}>
                                {subTool.shortcut}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* -------------------------------------------------------------
          BOTTOM: Foreground / Background Color Swatches & Swap Tool
          ------------------------------------------------------------- */}
      <div className={styles.colorPaletteSection} data-testid="color-palette-section">
        <div className={styles.swatchStack}>
          {/* Background Swatch (Bottom Right) */}
          <button
            type="button"
            className={styles.bgSwatchBtn}
            style={{ backgroundColor: backgroundColor || '#FFFFFF' }}
            onClick={() => bgInputRef.current?.click()}
            title={`Background Color: ${backgroundColor} (Ctrl+Delete to fill)`}
            aria-label="Background Color Swatch"
            data-testid="bg-color-swatch"
          />

          {/* Foreground Swatch (Top Left) */}
          <button
            type="button"
            className={styles.fgSwatchBtn}
            style={{ backgroundColor: foregroundColor || '#7C3AED' }}
            onClick={() => fgInputRef.current?.click()}
            title={`Foreground Color: ${foregroundColor} (Alt+Delete to fill)`}
            aria-label="Foreground Color Swatch"
            data-testid="fg-color-swatch"
          />

          {/* Hidden Color Inputs */}
          <input
            ref={fgInputRef}
            type="color"
            value={foregroundColor || '#7C3AED'}
            onChange={(e) => onForegroundColorChange?.(e.target.value)}
            className={styles.hiddenColorInput}
            aria-hidden="true"
          />
          <input
            ref={bgInputRef}
            type="color"
            value={backgroundColor || '#FFFFFF'}
            onChange={(e) => onBackgroundColorChange?.(e.target.value)}
            className={styles.hiddenColorInput}
            aria-hidden="true"
          />
        </div>

        {/* Color Swap & Reset Row */}
        <div className={styles.colorControlsRow}>
          {/* Swap FG / BG */}
          <button
            type="button"
            className={styles.swapBtn}
            onClick={onSwapColors}
            title="Switch Foreground and Background Colors (X)"
            aria-label="Swap Colors"
            data-testid="btn-swap-colors"
          >
            <ArrowLeftRight size={11} />
          </button>

          {/* Reset Default (Black/White) */}
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              if (onResetColors) onResetColors();
              else {
                onForegroundColorChange?.('#000000');
                onBackgroundColorChange?.('#FFFFFF');
              }
            }}
            title="Default Colors (Black & White - D)"
            aria-label="Default Colors"
            data-testid="btn-reset-colors"
          >
            <span style={{ fontSize: '10px', fontWeight: 800 }}>D</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default LeftToolPanel;
