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
  Square,
  Circle,
  Triangle,
  Minus,
  Star,
  Paintbrush,
  Eraser,
  PaintBucket,
  Undo2,
  Redo2,
  Maximize,
  Hand,
  ImagePlus,
  Download,
  ChevronDown,
  Upload,
  FileImage,
  RotateCcw,
  X,
} from 'lucide-react';
import styles from './EditorTopBar.module.css';

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
  onTriggerUpload,
  onNewBlankCanvas,
  onAddImageLayer,
  onDownload,
  onResetOriginal,
  canReset = false,
}) {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  const fileMenuRef = useRef(null);
  const shapesMenuRef = useRef(null);
  const zoomMenuRef = useRef(null);
  const downloadMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
        setFileMenuOpen(false);
      }
      if (shapesMenuRef.current && !shapesMenuRef.current.contains(e.target)) {
        setShapesMenuOpen(false);
      }
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target)) {
        setZoomMenuOpen(false);
      }
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setDownloadMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

  // Helper to check tool active state
  const isSelectActive = !hasImage || activeTool === 'move';
  const isCropActive = hasImage && activeTool === 'crop';
  const isResizeActive = hasImage && activeTool === 'resize';
  const isRotateActive = hasImage && activeTool === 'rotate';
  const isCanvasActive = hasImage && activeTool === 'canvas';
  const isTextActive = hasImage && activeTool === 'text';
  const isShapesActive =
    hasImage &&
    [
      'rect',
      'circle',
      'ellipse',
      'triangle',
      'line',
      'star',
      'brush',
      'eraser',
      'fill',
      'shapes',
    ].includes(activeTool);

  const handleToolClick = (toolId) => {
    if (!hasImage && toolId !== 'move') return;
    onToolSelect?.(toolId);
  };

  const handleShapeSelect = (shapeToolId) => {
    setShapesMenuOpen(false);
    if (!hasImage) return;
    onToolSelect?.(shapeToolId);
  };

  return (
    <div className={styles.topSectionWrapper} data-testid="editor-top-bar">
      <div className={styles.subToolbar} data-testid="sub-toolbar">
        {/* Horizontal Tools Scroll Track */}
        <div className={styles.toolsTrack}>
          {/* 1. File Dropdown */}
          <div className={styles.dropdownContainer} ref={fileMenuRef}>
            <button
              type="button"
              data-file-btn="true"
              className={`${styles.toolbarItemBtn} ${styles.fileBtn} ${
                fileMenuOpen ? styles.itemBtnActive : ''
              }`}
              onClick={() => setFileMenuOpen((prev) => !prev)}
              aria-expanded={fileMenuOpen}
              title="File Operations"
            >
              <FileText size={14} className={styles.btnIcon} />
              <span>File</span>
              <ChevronDown size={11} className={styles.chevron} />
            </button>

            {fileMenuOpen && (
              <div className={styles.menuDropdown} role="menu">
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onNewBlankCanvas?.();
                  }}
                >
                  <Square size={14} />
                  <span>New Blank Canvas...</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onTriggerUpload?.();
                  }}
                >
                  <Upload size={14} />
                  <span>Open Image...</span>
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={!hasImage}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onAddImageLayer?.();
                  }}
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
                >
                  <FileImage size={14} />
                  <span>Export as WebP</span>
                </button>

                <div className={styles.menuDivider} />

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

          {/* 2. Select Tool */}
          <button
            type="button"
            className={`${styles.toolbarItemBtn} ${isSelectActive ? styles.itemBtnActive : ''}`}
            onClick={() => handleToolClick('move')}
            title="Select & Move Tool (V)"
            aria-label="Select Tool"
            data-testid="tool-select"
          >
            <MousePointer size={14} className={styles.btnIcon} />
            <span>Select</span>
          </button>

          {/* 3. Crop Tool */}
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

          {/* 4. Resize Tool */}
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

          {/* 5. Rotate Tool */}
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

          {/* 6. Canvas Tool */}
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

          {/* 7. Text Tool */}
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

          {/* 8. Shapes Dropdown */}
          <div className={styles.dropdownContainer} ref={shapesMenuRef}>
            <button
              type="button"
              className={`${styles.toolbarItemBtn} ${
                isShapesActive || shapesMenuOpen ? styles.itemBtnActive : ''
              }`}
              onClick={() => {
                if (hasImage) setShapesMenuOpen((prev) => !prev);
              }}
              disabled={!hasImage}
              aria-expanded={shapesMenuOpen}
              title="Shapes & Drawing Tools"
              data-testid="tool-shapes-dropdown"
            >
              <LayoutGrid size={14} className={styles.btnIcon} />
              <span>Shapes</span>
              <ChevronDown size={11} className={styles.chevron} />
            </button>

            {shapesMenuOpen && (
              <div className={styles.shapesDropdownMenu} role="menu" data-testid="shapes-menu">
                <button
                  type="button"
                  className={`${styles.shapeMenuItem} ${
                    activeTool === 'rect' ? styles.shapeMenuItemActive : ''
                  }`}
                  onClick={() => handleShapeSelect('rect')}
                >
                  <Square size={14} />
                  <span>Rectangle</span>
                </button>
                <button
                  type="button"
                  className={`${styles.shapeMenuItem} ${
                    activeTool === 'circle' ? styles.shapeMenuItemActive : ''
                  }`}
                  onClick={() => handleShapeSelect('circle')}
                >
                  <Circle size={14} />
                  <span>Ellipse</span>
                </button>
                <button
                  type="button"
                  className={`${styles.shapeMenuItem} ${
                    activeTool === 'triangle' ? styles.shapeMenuItemActive : ''
                  }`}
                  onClick={() => handleShapeSelect('triangle')}
                >
                  <Triangle size={14} />
                  <span>Triangle</span>
                </button>
                <button
                  type="button"
                  className={`${styles.shapeMenuItem} ${
                    activeTool === 'line' ? styles.shapeMenuItemActive : ''
                  }`}
                  onClick={() => handleShapeSelect('line')}
                >
                  <Minus size={14} />
                  <span>Line</span>
                </button>
                <button
                  type="button"
                  className={`${styles.shapeMenuItem} ${
                    activeTool === 'star' ? styles.shapeMenuItemActive : ''
                  }`}
                  onClick={() => handleShapeSelect('star')}
                >
                  <Star size={14} />
                  <span>Star</span>
                </button>

                <div className={styles.menuDivider} />

                <button
                  type="button"
                  className={`${styles.shapeMenuItem} ${
                    activeTool === 'brush' ? styles.shapeMenuItemActive : ''
                  }`}
                  onClick={() => handleShapeSelect('brush')}
                >
                  <Paintbrush size={14} />
                  <span>Brush</span>
                </button>
                <button
                  type="button"
                  className={`${styles.shapeMenuItem} ${
                    activeTool === 'eraser' ? styles.shapeMenuItemActive : ''
                  }`}
                  onClick={() => handleShapeSelect('eraser')}
                >
                  <Eraser size={14} />
                  <span>Eraser</span>
                </button>
                <button
                  type="button"
                  className={`${styles.shapeMenuItem} ${
                    activeTool === 'fill' ? styles.shapeMenuItemActive : ''
                  }`}
                  onClick={() => handleShapeSelect('fill')}
                >
                  <PaintBucket size={14} />
                  <span>Fill</span>
                </button>
              </div>
            )}
          </div>

          <div className={styles.vDivider} aria-hidden="true" />

          {/* 9. Undo */}
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

          {/* 10. Redo */}
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

          {/* 11. Zoom Dropdown */}
          <div className={styles.dropdownContainer} ref={zoomMenuRef}>
            <button
              type="button"
              data-testid="zoom-dropdown-btn"
              className={styles.zoomDropdownBtn}
              onClick={() => setZoomMenuOpen((prev) => !prev)}
              aria-label="Zoom percentage"
              title="Canvas Zoom"
            >
              <span>{Math.round(zoom * 100)}%</span>
              <ChevronDown size={11} className={styles.chevron} />
            </button>

            {zoomMenuOpen && (
              <div className={styles.zoomDropdownMenu} role="menu">
                {ZOOM_PRESETS.map((z) => (
                  <button
                    key={z}
                    type="button"
                    className={`${styles.zoomMenuItem} ${
                      Math.round(zoom * 100) === Math.round(z * 100)
                        ? styles.zoomMenuItemActive
                        : ''
                    }`}
                    onClick={() => {
                      onZoomChange?.(z);
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

          {/* 12. Fullscreen / Fit Screen */}
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

          {/* 13. Hand / Pan Tool */}
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
          {/* 14. Add Image */}
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

          {/* 15. Download (with format dropdown) */}
          <div className={styles.dropdownContainer} ref={downloadMenuRef}>
            <div className={styles.downloadSplitGroup}>
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
              <button
                type="button"
                className={styles.downloadChevronBtn}
                onClick={() => {
                  if (hasImage) setDownloadMenuOpen((prev) => !prev);
                }}
                disabled={!hasImage}
                title="Download formats (PNG, JPG, WebP)"
                aria-label="Download format options"
              >
                <ChevronDown size={12} />
              </button>
            </div>

            {downloadMenuOpen && (
              <div className={styles.exportDropdownMenu} role="menu">
                <button
                  type="button"
                  className={styles.exportItem}
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownload?.('image/png');
                  }}
                >
                  <div className={styles.exportMeta}>
                    <strong>PNG Image</strong>
                    <span>Best quality with transparency</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={styles.exportItem}
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownload?.('image/jpeg');
                  }}
                >
                  <div className={styles.exportMeta}>
                    <strong>JPG / JPEG</strong>
                    <span>Optimized file size for web</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={styles.exportItem}
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownload?.('image/webp');
                  }}
                >
                  <div className={styles.exportMeta}>
                    <strong>WebP Modern</strong>
                    <span>Ultra-fast modern compression</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorTopBar;
