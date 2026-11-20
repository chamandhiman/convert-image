import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  MousePointer,
  Crop,
  Scaling,
  RotateCw,
  Layout,
  Type,
  LayoutGrid,
  Undo2,
  Redo2,
  Maximize,
  Hand,
  ImagePlus,
  Download,
  ChevronDown,
  Upload,
  FolderOpen,
  Square,
  FileImage,
  RotateCcw,
  X,
  SlidersHorizontal,
  PenTool,
  Bandage,
  Wand2,
  LassoSelect,
  Scissors,
  Check,
} from 'lucide-react';
import styles from './EditorTopBar.module.css';

export const FILTER_ITEMS = [
  { category: 'BLUR', id: 'blur-gaussian', label: 'Gaussian Blur...', paramName: 'Radius', min: 1, max: 40, defaultVal: 6, unit: 'px', type: 'gaussian' },
  { category: 'BLUR', id: 'blur-motion', label: 'Motion Blur...', paramName: 'Distance', min: 2, max: 50, defaultVal: 15, unit: 'px', type: 'motion' },
  { category: 'BLUR', id: 'blur-radial', label: 'Radial Zoom Blur...', paramName: 'Amount', min: 2, max: 30, defaultVal: 10, unit: '%', type: 'radial' },
  { category: 'BLUR', id: 'blur-box', label: 'Box Blur...', paramName: 'Radius', min: 1, max: 30, defaultVal: 5, unit: 'px', type: 'box' },

  { category: 'SHARPEN', id: 'sharpen-basic', label: 'Sharpen...', paramName: 'Amount', min: 10, max: 100, defaultVal: 45, unit: '%', type: 'sharpen' },
  { category: 'SHARPEN', id: 'sharpen-unsharp', label: 'Unsharp Mask...', paramName: 'Amount', min: 10, max: 100, defaultVal: 60, unit: '%', type: 'unsharp' },

  { category: 'NOISE & TEXTURE', id: 'noise-add', label: 'Add Noise...', paramName: 'Amount', min: 5, max: 80, defaultVal: 25, unit: '%', type: 'noise' },
  { category: 'NOISE & TEXTURE', id: 'noise-grain', label: 'Film Grain...', paramName: 'Intensity', min: 5, max: 70, defaultVal: 30, unit: '%', type: 'grain' },
  { category: 'NOISE & TEXTURE', id: 'texture-pixelate', label: 'Pixelate...', paramName: 'Cell Size', min: 4, max: 60, defaultVal: 16, unit: 'px', type: 'pixelate' },

  { category: 'STYLIZE', id: 'stylize-emboss', label: 'Emboss...', paramName: 'Depth', min: 10, max: 100, defaultVal: 50, unit: '%', type: 'emboss' },
  { category: 'STYLIZE', id: 'stylize-find-edges', label: 'Find Edges', paramName: 'Sensitivity', min: 10, max: 100, defaultVal: 50, unit: '%', type: 'find-edges' },
  { category: 'STYLIZE', id: 'stylize-solarize', label: 'Solarize...', paramName: 'Threshold', min: 10, max: 90, defaultVal: 50, unit: '%', type: 'solarize' },
  { category: 'STYLIZE', id: 'stylize-posterize', label: 'Posterize...', paramName: 'Levels', min: 20, max: 90, defaultVal: 40, unit: '%', type: 'posterize' },

  { category: 'ADJUSTMENTS', id: 'adj-brightness', label: 'Brightness / Contrast...', paramName: 'Brightness', min: 0, max: 100, defaultVal: 65, unit: '', type: 'brightness' },
  { category: 'ADJUSTMENTS', id: 'adj-contrast', label: 'High Contrast...', paramName: 'Contrast', min: 10, max: 90, defaultVal: 60, unit: '', type: 'contrast' },
  { category: 'ADJUSTMENTS', id: 'adj-grayscale', label: 'Grayscale (Black & White)', paramName: 'Fade', min: 0, max: 100, defaultVal: 100, unit: '%', type: 'grayscale' },
  { category: 'ADJUSTMENTS', id: 'adj-sepia', label: 'Sepia Vintage Tone', paramName: 'Warmth', min: 0, max: 100, defaultVal: 100, unit: '%', type: 'sepia' },
  { category: 'ADJUSTMENTS', id: 'adj-invert', label: 'Invert Colors', paramName: 'Amount', min: 0, max: 100, defaultVal: 100, unit: '%', type: 'invert' },
];

export function EditorTopBar({
  hasImage = false,
  activeTool = 'move',
  onToolSelect,
  onCloseDocument,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  zoom = 1,
  onZoomChange,
  onFitScreen,
  isPanActive = false,
  onTogglePan,
  onOpenFile,
  onTriggerUpload,
  onNewBlankCanvas,
  onAddImageLayer,
  onDownload,
  onResetOriginal,
  canReset = false,
  onOpenFilter,
  activeSelection = null,
  onInvertSelection,
  onDeselect,
  onSelectAll,
  onDeleteSelectedPixels,
  onConvertSelectionToMask,
  onFeatherSelection,
}) {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [filtersMenuOpen, setFiltersMenuOpen] = useState(false);
  const [selectionMenuOpen, setSelectionMenuOpen] = useState(false);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);

  const fileMenuRef = useRef(null);
  const filtersMenuRef = useRef(null);
  const selectionMenuRef = useRef(null);
  const zoomMenuRef = useRef(null);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
        setFileMenuOpen(false);
      }
      if (filtersMenuRef.current && !filtersMenuRef.current.contains(e.target)) {
        setFiltersMenuOpen(false);
      }
      if (selectionMenuRef.current && !selectionMenuRef.current.contains(e.target)) {
        setSelectionMenuOpen(false);
      }
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target)) {
        setZoomMenuOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setFileMenuOpen(false);
        setFiltersMenuOpen(false);
        setSelectionMenuOpen(false);
        setZoomMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const ZOOM_PRESETS = [0.25, 0.45, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

  // Helper to check tool active state
  const isSelectActive = hasImage && (activeTool === 'move' || !activeTool);
  const isSelectionToolActive = [
    'marquee-rect',
    'marquee-ellipse',
    'lasso',
    'polygonal-lasso',
    'magic-wand',
  ].includes(activeTool);
  const isCropActive = hasImage && activeTool === 'crop';
  const isResizeActive = hasImage && activeTool === 'resize';
  const isRotateActive = hasImage && activeTool === 'rotate';
  const isCanvasActive = hasImage && activeTool === 'canvas';
  const isTextActive = hasImage && activeTool === 'text';
  const isPenActive = hasImage && activeTool === 'pen';
  const isPatchActive = hasImage && activeTool === 'patch';
  const isShapesActive =
    hasImage &&
    [
      'rect',
      'rounded-rect',
      'circle',
      'ellipse',
      'triangle',
      'line',
      'star',
      'polygon',
      'arrow',
      'shapes',
    ].includes(activeTool);

  const handleToolClick = (toolId) => {
    if (!hasImage && toolId !== 'move') return;
    onToolSelect?.(toolId);
  };

  return (
    <div className={styles.topSectionWrapper} data-testid="editor-top-bar">
      <div className={styles.subToolbar} data-testid="sub-toolbar">
        {/* Horizontal Tools Track */}
        <div className={styles.toolsTrack}>
          {/* 1. File Dropdown */}
          <div className={styles.dropdownContainer} ref={fileMenuRef}>
            <button
              type="button"
              data-file-btn="true"
              data-testid="file-menu-btn"
              className={`${styles.toolbarItemBtn} ${styles.fileBtn} ${
                fileMenuOpen ? styles.itemBtnActive : ''
              }`}
              onClick={() => {
                setFileMenuOpen((prev) => !prev);
                setFiltersMenuOpen(false);
                setSelectionMenuOpen(false);
              }}
              aria-expanded={fileMenuOpen}
              title="File Operations"
            >
              <FileText size={14} className={styles.btnIcon} />
              <span>File</span>
              <ChevronDown size={11} className={styles.chevron} />
            </button>

            {fileMenuOpen && (
              <div className={styles.menuDropdown} role="menu" data-testid="file-dropdown-menu">
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onNewBlankCanvas?.();
                  }}
                  data-testid="file-new-canvas"
                >
                  <Square size={14} />
                  <span>New Blank Canvas...</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onOpenFile ? onOpenFile() : onTriggerUpload?.();
                  }}
                  data-testid="file-open-file"
                >
                  <FolderOpen size={14} />
                  <span>Open File...</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!hasImage}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onAddImageLayer?.();
                  }}
                  data-testid="file-add-layer"
                >
                  <ImagePlus size={14} />
                  <span>Add Image as Layer...</span>
                </button>

                <div className={styles.menuDivider} />

                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!hasImage}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onDownload?.('image/png');
                  }}
                  data-testid="file-export-png"
                >
                  <FileImage size={14} />
                  <span>Export as PNG</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!hasImage}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onDownload?.('image/jpeg');
                  }}
                  data-testid="file-export-jpg"
                >
                  <FileImage size={14} />
                  <span>Export as JPG</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!hasImage}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onDownload?.('image/webp');
                  }}
                  data-testid="file-export-webp"
                >
                  <FileImage size={14} />
                  <span>Export as WebP</span>
                </button>

                <div className={styles.menuDivider} />

                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!canUndo}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onUndo?.();
                  }}
                >
                  <Undo2 size={14} />
                  <span>Undo (Ctrl+Z)</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!canRedo}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onRedo?.();
                  }}
                >
                  <Redo2 size={14} />
                  <span>Redo (Ctrl+Y)</span>
                </button>

                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!canReset || !hasImage}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onResetOriginal?.();
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Reset to Original</span>
                </button>
                {hasImage && (
                  <>
                    <div className={styles.menuDivider} />
                    <button
                      type="button"
                      data-close-doc-btn="true"
                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                      onClick={() => {
                        setFileMenuOpen(false);
                        onCloseDocument?.();
                      }}
                    >
                      <X size={14} />
                      <span>Close Document</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 2. Filters Dropdown (Requirement #9) */}
          <div className={styles.dropdownContainer} ref={filtersMenuRef}>
            <button
              type="button"
              data-testid="filters-menu-btn"
              disabled={!hasImage}
              className={`${styles.toolbarItemBtn} ${styles.fileBtn} ${
                filtersMenuOpen ? styles.itemBtnActive : ''
              }`}
              onClick={() => {
                setFiltersMenuOpen((prev) => !prev);
                setFileMenuOpen(false);
                setSelectionMenuOpen(false);
              }}
              aria-expanded={filtersMenuOpen}
              title="Filter Effects & Adjustments"
            >
              <SlidersHorizontal size={14} className={styles.btnIcon} />
              <span>Filters</span>
              <ChevronDown size={11} className={styles.chevron} />
            </button>

            {filtersMenuOpen && (
              <div className={styles.menuDropdown} role="menu" data-testid="filters-dropdown-menu">
                {['BLUR', 'SHARPEN', 'NOISE & TEXTURE', 'STYLIZE', 'ADJUSTMENTS'].map((cat, idx) => (
                  <div key={cat}>
                    {idx > 0 && <div className={styles.menuDivider} />}
                    <div className={styles.menuSectionTitle}>{cat}</div>
                    {FILTER_ITEMS.filter((f) => f.category === cat).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={styles.menuItem}
                        onClick={() => {
                          setFiltersMenuOpen(false);
                          onOpenFilter?.(item);
                        }}
                        data-testid={`filter-item-${item.id}`}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.vDivider} aria-hidden="true" />

          {/* 3. Select / Move Tool */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isSelectActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('move')}
            title="Move & Select Tool (V)"
            aria-label="Select Tool"
            data-testid="tool-select"
          >
            <MousePointer size={14} className={styles.btnIcon} />
            <span>Select</span>
          </button>

          {/* 4. Selection Tools Dropdown (Requirement #6) */}
          <div className={styles.dropdownContainer} ref={selectionMenuRef}>
            <button
              type="button"
              data-testid="selection-tools-btn"
              disabled={!hasImage}
              className={`${styles.toolbarItemBtn} ${
                isSelectionToolActive ? styles.itemBtnActive : ''
              }`}
              onClick={() => {
                setSelectionMenuOpen((prev) => !prev);
                setFileMenuOpen(false);
                setFiltersMenuOpen(false);
              }}
              title="Marquee & Lasso Selection Tools (M, L, W)"
            >
              <LassoSelect size={14} className={styles.btnIcon} />
              <span>Marquee</span>
              <ChevronDown size={11} className={styles.chevron} />
            </button>

            {selectionMenuOpen && (
              <div
                className={styles.menuDropdown}
                role="menu"
                data-testid="selection-dropdown-menu"
              >
                <div className={styles.menuSectionTitle}>MARQUEE SELECTION</div>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    handleToolClick('marquee-rect');
                    setSelectionMenuOpen(false);
                  }}
                  data-testid="tool-marquee-rect"
                >
                  <Square size={14} />
                  <span>Rectangular Marquee (M)</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    handleToolClick('marquee-ellipse');
                    setSelectionMenuOpen(false);
                  }}
                  data-testid="tool-marquee-ellipse"
                >
                  <span style={{ fontSize: 13, fontWeight: 700 }}>◯</span>
                  <span>Elliptical Marquee</span>
                </button>

                <div className={styles.menuSectionTitle}>FREEFORM SELECTION</div>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    handleToolClick('lasso');
                    setSelectionMenuOpen(false);
                  }}
                  data-testid="tool-lasso"
                >
                  <LassoSelect size={14} />
                  <span>Lasso Tool (L)</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    handleToolClick('polygonal-lasso');
                    setSelectionMenuOpen(false);
                  }}
                  data-testid="tool-polygonal-lasso"
                >
                  <Scissors size={14} />
                  <span>Polygonal Lasso</span>
                </button>

                <div className={styles.menuSectionTitle}>COLOR SELECTION</div>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    handleToolClick('magic-wand');
                    setSelectionMenuOpen(false);
                  }}
                  data-testid="tool-magic-wand"
                >
                  <Wand2 size={14} />
                  <span>Magic Wand (W)</span>
                </button>

                <div className={styles.menuDivider} />

                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!activeSelection}
                  onClick={() => {
                    onInvertSelection?.();
                    setSelectionMenuOpen(false);
                  }}
                >
                  <span>Invert Selection (Ctrl+Shift+I)</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!activeSelection}
                  onClick={() => {
                    onDeselect?.();
                    setSelectionMenuOpen(false);
                  }}
                >
                  <span>Deselect (Ctrl+D)</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    onSelectAll?.();
                    setSelectionMenuOpen(false);
                  }}
                >
                  <span>Select All (Ctrl+A)</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!activeSelection}
                  onClick={() => {
                    onFeatherSelection?.(5);
                    setSelectionMenuOpen(false);
                  }}
                >
                  <span>Feather Selection (5px)</span>
                </button>

                <div className={styles.menuDivider} />

                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!activeSelection}
                  onClick={() => {
                    onDeleteSelectedPixels?.();
                    setSelectionMenuOpen(false);
                  }}
                  data-testid="delete-selection-pixels-btn"
                >
                  <span style={{ color: '#ef4444' }}>Delete Selected Pixels</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!activeSelection}
                  onClick={() => {
                    onConvertSelectionToMask?.();
                    setSelectionMenuOpen(false);
                  }}
                  data-testid="convert-selection-mask-btn"
                >
                  <span>Convert to Layer Mask</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Crop Tool */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isCropActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('crop')}
            disabled={!hasImage}
            title="Crop Image (C)"
            aria-label="Crop Tool"
            data-testid="tool-crop"
          >
            <Crop size={14} className={styles.btnIcon} />
            <span>Crop</span>
          </button>

          {/* 6. Resize Tool */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isResizeActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('resize')}
            disabled={!hasImage}
            title="Resize Dimensions"
            aria-label="Resize Tool"
            data-testid="tool-resize"
          >
            <Scaling size={14} className={styles.btnIcon} />
            <span>Resize</span>
          </button>

          {/* 7. Rotate Tool */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isRotateActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('rotate')}
            disabled={!hasImage}
            title="Rotate & Flip Image"
            aria-label="Rotate Tool"
            data-testid="tool-rotate"
          >
            <RotateCw size={14} className={styles.btnIcon} />
            <span>Rotate</span>
          </button>

          {/* 8. Canvas Tool */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isCanvasActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('canvas')}
            disabled={!hasImage}
            title="Canvas Size & Background"
            aria-label="Canvas Tool"
            data-testid="tool-canvas"
          >
            <Layout size={14} className={styles.btnIcon} />
            <span>Canvas</span>
          </button>

          {/* 9. Text Tool */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isTextActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('text')}
            disabled={!hasImage}
            title="Horizontal Type Tool (T)"
            aria-label="Text Tool"
            data-testid="tool-text"
          >
            <Type size={14} className={styles.btnIcon} />
            <span>Text</span>
          </button>

          {/* 10. Shapes Tool */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isShapesActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('shapes')}
            disabled={!hasImage}
            title="Shapes & Drawing Tools (U)"
            aria-label="Shapes Tool"
            data-testid="tool-shapes"
          >
            <LayoutGrid size={14} className={styles.btnIcon} />
            <span>Shapes</span>
          </button>

          {/* 11. Pen Tool (Requirement #7) */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isPenActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('pen')}
            disabled={!hasImage}
            title="Pen Tool (P) — Vector paths & Bézier curves"
            aria-label="Pen Tool"
            data-testid="tool-pen"
          >
            <PenTool size={14} className={styles.btnIcon} />
            <span>Pen</span>
          </button>

          {/* 12. Patch Tool (Requirement #8) */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isPatchActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('patch')}
            disabled={!hasImage}
            title="Patch Tool (J) — Seamless content-aware patch"
            aria-label="Patch Tool"
            data-testid="tool-patch"
          >
            <Bandage size={14} className={styles.btnIcon} />
            <span>Patch</span>
          </button>

          <div className={styles.vDivider} aria-hidden="true" />

          {/* 13. Undo */}
          <button
            type="button"
            className={styles.squareIconBtn}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            data-testid="undo-btn"
          >
            <Undo2 size={14} />
          </button>

          {/* 14. Redo */}
          <button
            type="button"
            className={styles.squareIconBtn}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            data-testid="redo-btn"
          >
            <Redo2 size={14} />
          </button>

          {/* 15. Zoom Dropdown */}
          <div className={styles.dropdownContainer} ref={zoomMenuRef}>
            <button
              type="button"
              data-testid="zoom-dropdown-btn"
              className={styles.zoomDropdownBtn}
              onClick={() => setZoomMenuOpen((prev) => !prev)}
              aria-label="Zoom percentage"
              title="Zoom Level"
            >
              <span>{Math.round(zoom * 100)}%</span>
              <ChevronDown size={11} className={styles.chevron} />
            </button>

            {zoomMenuOpen && (
              <div className={styles.zoomMenuDropdown} role="menu">
                {ZOOM_PRESETS.map((z) => (
                  <button
                    key={z}
                    type="button"
                    className={`${styles.zoomMenuItem} ${
                      Math.abs(zoom - z) < 0.01 ? styles.zoomMenuItemActive : ''
                    }`}
                    onClick={() => {
                      onZoomChange(z);
                      setZoomMenuOpen(false);
                    }}
                  >
                    {Math.round(z * 100)}%
                  </button>
                ))}
                <div className={styles.menuDivider} />
                <button
                  type="button"
                  className={styles.zoomMenuItem}
                  onClick={() => {
                    onFitScreen?.();
                    setZoomMenuOpen(false);
                  }}
                >
                  Fit to Screen
                </button>
              </div>
            )}
          </div>

          {/* 16. Fullscreen / Fit Screen */}
          <button
            type="button"
            className={styles.squareIconBtn}
            onClick={onFitScreen}
            title="Fit Canvas to Screen (Ctrl+0)"
            aria-label="Fit to Screen"
            data-testid="fit-screen-btn"
          >
            <Maximize size={14} />
          </button>

          {/* 17. Hand / Pan Tool */}
          <button
            type="button"
            className={`${styles.squareIconBtn} ${
              isPanActive ? styles.squareIconBtnActive : ''
            }`}
            onClick={onTogglePan}
            title="Hand / Pan Tool (Spacebar + Drag)"
            aria-label="Hand Tool"
            data-testid="pan-tool-btn"
          >
            <Hand size={14} />
          </button>
        </div>

        {/* Right Action Controls: Add Image & Download */}
        <div className={styles.rightActions}>
          {/* Add Image */}
          <button
            type="button"
            className={styles.addImageBtn}
            onClick={hasImage ? onAddImageLayer : onTriggerUpload}
            title="Add image as a layer"
            data-testid="add-image-btn"
          >
            <ImagePlus size={15} />
            <span>Add Image</span>
          </button>

          {/* Download */}
          <button
            type="button"
            className={styles.downloadPrimaryBtn}
            onClick={() => {
              if (hasImage) onDownload?.('image/png');
            }}
            disabled={!hasImage}
            title="Download image as PNG"
            data-testid="download-btn"
          >
            <Download size={15} />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditorTopBar;
