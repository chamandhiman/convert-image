import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  ChevronDown,
  Undo2,
  Redo2,
  Maximize,
  Maximize2,
  Minimize2,
  Hand,
  ImagePlus,
  Download,
  Square,
  Upload,
  FolderOpen,
  FileImage,
  RotateCcw,
  X,
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  Sliders,
  Sparkles,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  Layers,
  Type,
  Eye,
  Crop,
  Scaling,
  RotateCw,
  Palette,
  Check,
  Files,
  Save,
  Info,
} from 'lucide-react';
import { FILTER_ITEMS } from './EditorTopBar';
import styles from './ApplicationMenuBar.module.css';

export function ApplicationMenuBar({
  hasImage = false,
  onOpenNavDrawer,
  onNewBlankCanvas,
  onTriggerUpload,
  onOpenFile,
  onSaveProject,
  onSaveProjectAs,
  onExportPsd,
  onAddImageLayer,
  onDownload,
  onResetOriginal,
  canReset = false,
  onCloseDocument,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onCopyMerged,
  onPaste,
  canCopy = false,
  canPaste = false,
  zoom = 1,
  onZoomChange,
  onFitScreen,
  isPanActive = false,
  onTogglePan,
  onToolSelect,
  // Layer callbacks
  onAddBlankLayer,
  onAddTextLayer,
  onAddShapeLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onBringToFront,
  onMoveUp,
  onMoveDown,
  onSendToBack,
  onToggleClippingMask,
  onAddLayerMask,
  onOpenBlendingOptions,
  onMergeLayers,
  // Selection callbacks
  activeSelection,
  onSelectAll,
  onDeselect,
  onInvertSelection,
  onDeleteSelectedPixels,
  onConvertSelectionToMask,
  // Filter callback
  onOpenFilter,
  // View toggles
  showRulers = true,
  onToggleRulers,
  showGuides = true,
  onToggleGuides,
  // Rotation / Transform callbacks
  onRotate90CW,
  onRotate90CCW,
  onRotate180,
  onFlipH,
  onFlipV,
  // Canvas / Image specific callbacks
  onCanvasBackground,
  onFlipCanvasH,
  onFlipCanvasV,
  onFitCanvasToContent,
  onImageResolution,
  onTrimTransparent,
  onTrimWhite,
  onTrimTopLeft,
  onCropToSelection,
  onCropToDocumentBounds,
  onOpenAdjustment,
  onShowImageInfo,
  onDuplicateDocument,
  onFlattenImage,
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const menuBarRef = useRef(null);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // Close menus on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setActiveMenu(null);
        setZoomMenuOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setActiveMenu(null);
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

  const handleToggleMenu = (menuKey) => {
    setActiveMenu((prev) => (prev === menuKey ? null : menuKey));
  };

  const handleItemClick = (action) => {
    setActiveMenu(null);
    if (typeof action === 'function') action();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

  // Group filter items by category
  const filterCategories = ['BLUR', 'SHARPEN', 'NOISE & TEXTURE', 'STYLIZE', 'ADJUSTMENTS'];

  return (
    <header className={styles.menuBar} ref={menuBarRef} data-testid="application-menu-bar">
      {/* -------------------------------------------------------------
          LEFT SECTION: Hamburger, Logo, Desktop Text Menus
          ------------------------------------------------------------- */}
      <div className={styles.leftSection}>
        {/* 1. Hamburger button */}
        <button
          type="button"
          className={styles.hamburgerBtn}
          onClick={onOpenNavDrawer}
          title="Open Navigation Menu"
          aria-label="Application Menu"
          data-testid="hamburger-menu-btn"
        >
          <Menu size={18} />
        </button>

        {/* 2. WebToolOcean Image Convert Logo */}
        <Link to="/" className={styles.brandLogoWrap} title="Image Convert by WebToolOcean">
          <img src="/logo.png" alt="Logo" className={styles.brandLogoImg} />
          <div className={styles.brandTextColumn}>
            <span className={styles.brandMainText}>Image Convert</span>
            <span className={styles.brandSubText}>Desktop Studio</span>
          </div>
        </Link>

        {/* 3. Vertical Separator */}
        <div className={styles.vSeparator} aria-hidden="true" />

        {/* 4. Desktop Text Menus Track */}
        <nav className={styles.menusTrack} aria-label="Desktop Menu Bar">
          {/* FILE MENU */}
          <div className={styles.menuItemContainer}>
            <button
              type="button"
              className={`${styles.menuButton} ${activeMenu === 'file' ? styles.menuButtonActive : ''}`}
              onClick={() => handleToggleMenu('file')}
              data-testid="menu-btn-file"
              aria-expanded={activeMenu === 'file'}
            >
              <span>File</span>
              <ChevronDown size={11} className={styles.menuChevron} />
            </button>

            {activeMenu === 'file' && (
              <div className={styles.dropdownPopover} role="menu" data-testid="dropdown-menu-file">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleItemClick(onNewBlankCanvas)}
                  data-testid="menu-file-new"
                >
                  <div className={styles.itemLabelGroup}>
                    <Square size={13} className={styles.itemIcon} />
                    <span>New Document...</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+N</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleItemClick(onOpenFile || onTriggerUpload)}
                  data-testid="menu-file-open"
                >
                  <div className={styles.itemLabelGroup}>
                    <FolderOpen size={13} className={styles.itemIcon} />
                    <span>Open File...</span>
                  </div>
                  <span className={styles.shortcutBadge}>{isMac ? '⌘O' : 'Ctrl+O'}</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onAddImageLayer)}
                  data-testid="menu-file-add-layer"
                >
                  <div className={styles.itemLabelGroup}>
                    <ImagePlus size={13} className={styles.itemIcon} />
                    <span>Add Image Layer...</span>
                  </div>
                </button>

                <div className={styles.dropdownDivider} />

                {/* SAVE PROJECT & SAVE PROJECT AS */}
                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onSaveProject)}
                  data-testid="menu-file-save-project"
                >
                  <div className={styles.itemLabelGroup}>
                    <Save size={13} className={styles.itemIcon} />
                    <span>Save Project</span>
                  </div>
                  <span className={styles.shortcutBadge}>{isMac ? '⌘S' : 'Ctrl+S'}</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onSaveProjectAs)}
                  data-testid="menu-file-save-project-as"
                >
                  <div className={styles.itemLabelGroup}>
                    <Save size={13} className={styles.itemIcon} />
                    <span>Save Project As...</span>
                  </div>
                  <span className={styles.shortcutBadge}>{isMac ? '⇧⌘S' : 'Ctrl+Shift+S'}</span>
                </button>

                <div className={styles.dropdownDivider} />

                {/* EXPORT OPTIONS */}
                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onExportPsd || onSaveProjectAs)}
                  data-testid="menu-file-export-psd"
                >
                  <div className={styles.itemLabelGroup}>
                    <Files size={13} className={styles.itemIcon} />
                    <span>Export as PSD</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onDownload?.('image/png'))}
                  data-testid="menu-file-export-png"
                >
                  <div className={styles.itemLabelGroup}>
                    <FileImage size={13} className={styles.itemIcon} />
                    <span>Export as PNG</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onDownload?.('image/jpeg'))}
                  data-testid="menu-file-export-jpeg"
                >
                  <div className={styles.itemLabelGroup}>
                    <FileImage size={13} className={styles.itemIcon} />
                    <span>Export as JPEG</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onDownload?.('image/webp'))}
                  data-testid="menu-file-export-webp"
                >
                  <div className={styles.itemLabelGroup}>
                    <FileImage size={13} className={styles.itemIcon} />
                    <span>Export as WEBP</span>
                  </div>
                </button>

                <div className={styles.dropdownDivider} />

                {canReset && (
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handleItemClick(onResetOriginal)}
                  >
                    <div className={styles.itemLabelGroup}>
                      <RotateCcw size={13} className={styles.itemIcon} />
                      <span>Reset to Original</span>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onCloseDocument)}
                  data-testid="menu-file-close"
                >
                  <div className={styles.itemLabelGroup}>
                    <X size={13} className={styles.itemIcon} />
                    <span>Close Document</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+W</span>
                </button>
              </div>
            )}
          </div>

          {/* EDIT MENU */}
          <div className={styles.menuItemContainer}>
            <button
              type="button"
              className={`${styles.menuButton} ${activeMenu === 'edit' ? styles.menuButtonActive : ''}`}
              onClick={() => handleToggleMenu('edit')}
              data-testid="menu-btn-edit"
              aria-expanded={activeMenu === 'edit'}
            >
              <span>Edit</span>
              <ChevronDown size={11} className={styles.menuChevron} />
            </button>

            {activeMenu === 'edit' && (
              <div className={styles.dropdownPopover} role="menu" data-testid="dropdown-menu-edit">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!canUndo}
                  onClick={() => handleItemClick(onUndo)}
                  data-testid="menu-edit-undo"
                >
                  <div className={styles.itemLabelGroup}>
                    <Undo2 size={13} className={styles.itemIcon} />
                    <span>Undo</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+Z</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!canRedo}
                  onClick={() => handleItemClick(onRedo)}
                  data-testid="menu-edit-redo"
                >
                  <div className={styles.itemLabelGroup}>
                    <Redo2 size={13} className={styles.itemIcon} />
                    <span>Redo</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+Y</span>
                </button>

                <div className={styles.dropdownDivider} />

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage || !canCopy}
                  onClick={() => handleItemClick(onCut)}
                  data-testid="menu-edit-cut"
                >
                  <div className={styles.itemLabelGroup}>
                    <Scissors size={13} className={styles.itemIcon} />
                    <span>Cut</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+X</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage || !canCopy}
                  onClick={() => handleItemClick(onCopy)}
                  data-testid="menu-edit-copy"
                >
                  <div className={styles.itemLabelGroup}>
                    <Copy size={13} className={styles.itemIcon} />
                    <span>Copy</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+C</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onCopyMerged)}
                  data-testid="menu-edit-copy-merged"
                >
                  <div className={styles.itemLabelGroup}>
                    <Copy size={13} className={styles.itemIcon} />
                    <span>Copy Merged</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+Shift+C</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!canPaste}
                  onClick={() => handleItemClick(onPaste)}
                  data-testid="menu-edit-paste"
                >
                  <div className={styles.itemLabelGroup}>
                    <Clipboard size={13} className={styles.itemIcon} />
                    <span>Paste</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+V</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onDuplicateLayer)}
                  data-testid="menu-edit-duplicate"
                >
                  <div className={styles.itemLabelGroup}>
                    <Copy size={13} className={styles.itemIcon} />
                    <span>Duplicate Layer</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+J</span>
                </button>

                <div className={styles.dropdownDivider} />

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage || !activeSelection}
                  onClick={() => handleItemClick(onDeleteSelectedPixels)}
                  data-testid="menu-edit-clear"
                >
                  <div className={styles.itemLabelGroup}>
                    <Trash2 size={13} className={styles.itemIcon} />
                    <span>Clear Selection</span>
                  </div>
                  <span className={styles.shortcutBadge}>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* SELECT MENU */}
          <div className={styles.menuItemContainer}>
            <button
              type="button"
              className={`${styles.menuButton} ${activeMenu === 'select' ? styles.menuButtonActive : ''}`}
              onClick={() => handleToggleMenu('select')}
              data-testid="menu-btn-select"
              aria-expanded={activeMenu === 'select'}
            >
              <span>Select</span>
              <ChevronDown size={11} className={styles.menuChevron} />
            </button>

            {activeMenu === 'select' && (
              <div className={styles.dropdownPopover} role="menu" data-testid="dropdown-menu-select">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onSelectAll)}
                  data-testid="menu-select-all"
                >
                  <span>Select All</span>
                  <span className={styles.shortcutBadge}>Ctrl+A</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage || !activeSelection}
                  onClick={() => handleItemClick(onDeselect)}
                  data-testid="menu-select-deselect"
                >
                  <span>Deselect</span>
                  <span className={styles.shortcutBadge}>Ctrl+D</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage || !activeSelection}
                  onClick={() => handleItemClick(onInvertSelection)}
                  data-testid="menu-select-invert"
                >
                  <span>Inverse</span>
                  <span className={styles.shortcutBadge}>Ctrl+Shift+I</span>
                </button>

                <div className={styles.dropdownDivider} />

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage || !activeSelection}
                  onClick={() => handleItemClick(onConvertSelectionToMask)}
                  data-testid="menu-select-mask"
                >
                  <span>Create Mask from Selection</span>
                </button>
              </div>
            )}
          </div>

          {/* VIEW MENU */}
          <div className={styles.menuItemContainer}>
            <button
              type="button"
              className={`${styles.menuButton} ${activeMenu === 'view' ? styles.menuButtonActive : ''}`}
              onClick={() => handleToggleMenu('view')}
              data-testid="menu-btn-view"
              aria-expanded={activeMenu === 'view'}
            >
              <span>View</span>
              <ChevronDown size={11} className={styles.menuChevron} />
            </button>

            {activeMenu === 'view' && (
              <div className={styles.dropdownPopover} role="menu" data-testid="dropdown-menu-view">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleItemClick(() => onZoomChange?.(Math.min(zoom * 1.25, 5)))}
                  data-testid="menu-view-zoomin"
                >
                  <span>Zoom In</span>
                  <span className={styles.shortcutBadge}>Ctrl++</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleItemClick(() => onZoomChange?.(Math.max(zoom / 1.25, 0.1)))}
                  data-testid="menu-view-zoomout"
                >
                  <span>Zoom Out</span>
                  <span className={styles.shortcutBadge}>Ctrl+-</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleItemClick(onFitScreen)}
                  data-testid="menu-view-fitscreen"
                >
                  <span>Fit on Screen</span>
                  <span className={styles.shortcutBadge}>Ctrl+0</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleItemClick(() => onZoomChange?.(1))}
                  data-testid="menu-view-100"
                >
                  <span>100% Zoom</span>
                  <span className={styles.shortcutBadge}>Ctrl+1</span>
                </button>

                <div className={styles.dropdownDivider} />

                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleItemClick(onToggleRulers)}
                  data-testid="menu-view-rulers"
                >
                  <div className={styles.itemLabelGroup}>
                    {showRulers && <Check size={12} className={styles.itemIcon} />}
                    <span style={{ marginLeft: showRulers ? 0 : 20 }}>Rulers</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+R</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleItemClick(onToggleGuides)}
                  data-testid="menu-view-guides"
                >
                  <div className={styles.itemLabelGroup}>
                    {showGuides && <Check size={12} className={styles.itemIcon} />}
                    <span style={{ marginLeft: showGuides ? 0 : 20 }}>Guides</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+;</span>
                </button>
              </div>
            )}
          </div>

          {/* IMAGE MENU */}
          <div className={styles.menuItemContainer}>
            <button
              type="button"
              className={`${styles.menuButton} ${activeMenu === 'image' ? styles.menuButtonActive : ''}`}
              onClick={() => handleToggleMenu('image')}
              data-testid="menu-btn-image"
              aria-expanded={activeMenu === 'image'}
            >
              <span>Image</span>
              <ChevronDown size={11} className={styles.menuChevron} />
            </button>

            {activeMenu === 'image' && (
              <div className={styles.dropdownPopover} role="menu" data-testid="dropdown-menu-image">
                {/* 1. CANVAS SECTION */}
                <div className={styles.subCategoryHeader} data-category-header="true">Canvas</div>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onToolSelect?.('canvas'))}
                  data-testid="menu-image-canvas-size"
                >
                  <div className={styles.itemLabelGroup}>
                    <Crop size={13} className={styles.itemIcon} />
                    <span>Canvas Size...</span>
                  </div>
                  <span className={styles.shortcutBadge}>{isMac ? 'Option+Cmd+C' : 'Ctrl+Alt+C'}</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onCanvasBackground)}
                  data-testid="menu-image-canvas-bg"
                >
                  <div className={styles.itemLabelGroup}>
                    <Palette size={13} className={styles.itemIcon} />
                    <span>Canvas Background...</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onRotate90CW)}
                  data-testid="menu-image-canvas-rot90cw"
                >
                  <div className={styles.itemLabelGroup}>
                    <RotateCw size={13} className={styles.itemIcon} />
                    <span>Rotate Canvas 90° Clockwise</span>
                  </div>
                  <span className={styles.shortcutBadge}>{isMac ? 'Option+Cmd+Right' : 'Ctrl+Alt+Right'}</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onRotate90CCW)}
                  data-testid="menu-image-canvas-rot90ccw"
                >
                  <div className={styles.itemLabelGroup}>
                    <RotateCcw size={13} className={styles.itemIcon} />
                    <span>Rotate Canvas 90° Counter-CW</span>
                  </div>
                  <span className={styles.shortcutBadge}>{isMac ? 'Option+Cmd+Left' : 'Ctrl+Alt+Left'}</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onRotate180)}
                  data-testid="menu-image-canvas-rot180"
                >
                  <div className={styles.itemLabelGroup}>
                    <RotateCw size={13} className={styles.itemIcon} />
                    <span>Rotate Canvas 180°</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onFlipCanvasH)}
                  data-testid="menu-image-flip-canvas-h"
                >
                  <span>Flip Canvas Horizontal</span>
                  <span className={styles.shortcutBadge}>{isMac ? 'Option+Cmd+H' : 'Ctrl+Alt+H'}</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onFlipCanvasV)}
                  data-testid="menu-image-flip-canvas-v"
                >
                  <span>Flip Canvas Vertical</span>
                  <span className={styles.shortcutBadge}>{isMac ? 'Option+Cmd+V' : 'Ctrl+Alt+V'}</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onFitCanvasToContent)}
                  data-testid="menu-image-fit-canvas"
                >
                  <span>Fit Canvas to Content</span>
                </button>

                <div className={styles.dropdownDivider} />

                {/* 2. IMAGE SECTION */}
                <div className={styles.subCategoryHeader} data-category-header="true">Image</div>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onToolSelect?.('resize'))}
                  data-testid="menu-image-resize"
                >
                  <div className={styles.itemLabelGroup}>
                    <Scaling size={13} className={styles.itemIcon} />
                    <span>Image Size...</span>
                  </div>
                  <span className={styles.shortcutBadge}>{isMac ? 'Option+Cmd+I' : 'Ctrl+Alt+I'}</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onImageResolution)}
                  data-testid="menu-image-resolution"
                >
                  <span>Image Resolution...</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onRotate90CW)}
                  data-testid="menu-image-rot90cw"
                >
                  <div className={styles.itemLabelGroup}>
                    <RotateCw size={13} className={styles.itemIcon} />
                    <span>Rotate Image 90° Clockwise</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onRotate90CCW)}
                  data-testid="menu-image-rot90ccw"
                >
                  <div className={styles.itemLabelGroup}>
                    <RotateCcw size={13} className={styles.itemIcon} />
                    <span>Rotate Image 90° Counter-CW</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onRotate180)}
                  data-testid="menu-image-rot180"
                >
                  <span>Rotate Image 180°</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onFlipH)}
                  data-testid="menu-image-fliph"
                >
                  <span>Flip Image Horizontal</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onFlipV)}
                  data-testid="menu-image-flipv"
                >
                  <span>Flip Image Vertical</span>
                </button>

                <div className={styles.dropdownDivider} />

                {/* 3. IMAGE PROCESSING SECTION */}
                <div className={styles.subCategoryHeader} data-category-header="true">Image Processing</div>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onTrimTransparent)}
                  data-testid="menu-image-trim-transparent"
                >
                  <span>Trim Transparent Pixels</span>
                  <span className={styles.shortcutBadge}>{isMac ? 'Option+Cmd+T' : 'Ctrl+Alt+T'}</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onTrimWhite)}
                  data-testid="menu-image-trim-white"
                >
                  <span>Trim White Pixels</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onTrimTopLeft)}
                  data-testid="menu-image-trim-topleft"
                >
                  <span>Trim Based on Top-Left Pixel</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage || !activeSelection}
                  onClick={() => handleItemClick(onCropToSelection)}
                  data-testid="menu-image-crop-selection"
                >
                  <span>Crop to Selection</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onCropToDocumentBounds)}
                  data-testid="menu-image-crop-bounds"
                >
                  <span>Crop to Document Bounds</span>
                </button>

                <div className={styles.dropdownDivider} />

                {/* 4. ADJUSTMENTS SECTION */}
                <div className={styles.subCategoryHeader} data-category-header="true">Adjustments</div>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onOpenAdjustment?.('brightness'))}
                  data-testid="menu-image-adj-brightness"
                >
                  <span>Brightness / Contrast...</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onOpenAdjustment?.('hue'))}
                  data-testid="menu-image-adj-hue"
                >
                  <span>Hue / Saturation...</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onOpenAdjustment?.('exposure'))}
                  data-testid="menu-image-adj-exposure"
                >
                  <span>Exposure...</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onOpenAdjustment?.('levels'))}
                  data-testid="menu-image-adj-levels"
                >
                  <span>Levels...</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onOpenAdjustment?.('grayscale'))}
                  data-testid="menu-image-adj-grayscale"
                >
                  <span>Grayscale</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onOpenAdjustment?.('invert'))}
                  data-testid="menu-image-adj-invert"
                >
                  <span>Invert</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onOpenAdjustment?.('threshold'))}
                  data-testid="menu-image-adj-threshold"
                >
                  <span>Threshold...</span>
                </button>

                <div className={styles.dropdownDivider} />

                {/* 5. OTHER OPERATIONS SECTION */}
                <div className={styles.subCategoryHeader} data-category-header="true">Other Operations</div>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onShowImageInfo)}
                  data-testid="menu-image-info"
                >
                  <div className={styles.itemLabelGroup}>
                    <Info size={13} className={styles.itemIcon} />
                    <span>Image Information...</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onDuplicateDocument)}
                  data-testid="menu-image-duplicate"
                >
                  <div className={styles.itemLabelGroup}>
                    <Copy size={13} className={styles.itemIcon} />
                    <span>Duplicate Image</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onFlattenImage)}
                  data-testid="menu-image-flatten"
                >
                  <div className={styles.itemLabelGroup}>
                    <Layers size={13} className={styles.itemIcon} />
                    <span>Flatten Image</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* LAYER MENU */}
          <div className={styles.menuItemContainer}>
            <button
              type="button"
              className={`${styles.menuButton} ${activeMenu === 'layer' ? styles.menuButtonActive : ''}`}
              onClick={() => handleToggleMenu('layer')}
              data-testid="menu-btn-layer"
              aria-expanded={activeMenu === 'layer'}
            >
              <span>Layer</span>
              <ChevronDown size={11} className={styles.menuChevron} />
            </button>

            {activeMenu === 'layer' && (
              <div className={styles.dropdownPopover} role="menu" data-testid="dropdown-menu-layer">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onAddBlankLayer)}
                  data-testid="menu-layer-new"
                >
                  <div className={styles.itemLabelGroup}>
                    <Square size={13} className={styles.itemIcon} />
                    <span>New Blank Layer</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+Shift+N</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onAddTextLayer)}
                  data-testid="menu-layer-add-text"
                >
                  <div className={styles.itemLabelGroup}>
                    <Type size={13} className={styles.itemIcon} />
                    <span>New Text Layer</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onAddShapeLayer?.('rect'))}
                  data-testid="menu-layer-add-shape"
                >
                  <div className={styles.itemLabelGroup}>
                    <Square size={13} className={styles.itemIcon} />
                    <span>New Shape Layer</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onDuplicateLayer)}
                  data-testid="menu-layer-duplicate"
                >
                  <div className={styles.itemLabelGroup}>
                    <Copy size={13} className={styles.itemIcon} />
                    <span>Duplicate Layer</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+J</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onDeleteLayer)}
                  data-testid="menu-layer-delete"
                >
                  <div className={styles.itemLabelGroup}>
                    <Trash2 size={13} className={styles.itemIcon} />
                    <span>Delete Layer</span>
                  </div>
                  <span className={styles.shortcutBadge}>Delete</span>
                </button>

                <div className={styles.dropdownDivider} />

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onBringToFront)}
                  data-testid="menu-layer-front"
                >
                  <span>Bring to Front</span>
                  <span className={styles.shortcutBadge}>Ctrl+Shift+]</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onMoveUp)}
                  data-testid="menu-layer-up"
                >
                  <span>Move Up</span>
                  <span className={styles.shortcutBadge}>Ctrl+]</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onMoveDown)}
                  data-testid="menu-layer-down"
                >
                  <span>Move Down</span>
                  <span className={styles.shortcutBadge}>Ctrl+[</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onSendToBack)}
                  data-testid="menu-layer-back"
                >
                  <span>Send to Back</span>
                  <span className={styles.shortcutBadge}>Ctrl+Shift+[</span>
                </button>

                <div className={styles.dropdownDivider} />

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onToggleClippingMask)}
                  data-testid="menu-layer-clipping"
                >
                  <span>Create Clipping Mask</span>
                  <span className={styles.shortcutBadge}>Ctrl+Alt+G</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onAddLayerMask)}
                  data-testid="menu-layer-mask"
                >
                  <span>Add Layer Mask</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onOpenBlendingOptions)}
                  data-testid="menu-layer-blending"
                >
                  <span>Blending Options...</span>
                </button>

                <div className={styles.dropdownDivider} />

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onMergeLayers)}
                  data-testid="menu-layer-merge"
                >
                  <span>Merge Layers</span>
                  <span className={styles.shortcutBadge}>Ctrl+E</span>
                </button>
              </div>
            )}
          </div>

          {/* TYPE MENU */}
          <div className={styles.menuItemContainer}>
            <button
              type="button"
              className={`${styles.menuButton} ${activeMenu === 'type' ? styles.menuButtonActive : ''}`}
              onClick={() => handleToggleMenu('type')}
              data-testid="menu-btn-type"
              aria-expanded={activeMenu === 'type'}
            >
              <span>Type</span>
              <ChevronDown size={11} className={styles.menuChevron} />
            </button>

            {activeMenu === 'type' && (
              <div className={styles.dropdownPopover} role="menu" data-testid="dropdown-menu-type">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(() => onToolSelect?.('text'))}
                  data-testid="menu-type-tool"
                >
                  <div className={styles.itemLabelGroup}>
                    <Type size={13} className={styles.itemIcon} />
                    <span>Horizontal Type Tool</span>
                  </div>
                  <span className={styles.shortcutBadge}>T</span>
                </button>

                <button
                  type="button"
                  className={styles.dropdownItem}
                  disabled={!hasImage}
                  onClick={() => handleItemClick(onAddTextLayer)}
                  data-testid="menu-type-add-text"
                >
                  <div className={styles.itemLabelGroup}>
                    <Type size={13} className={styles.itemIcon} />
                    <span>Add Text Layer</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* FILTERS MENU */}
          <div className={styles.menuItemContainer}>
            <button
              type="button"
              className={`${styles.menuButton} ${activeMenu === 'filters' ? styles.menuButtonActive : ''}`}
              onClick={() => handleToggleMenu('filters')}
              data-testid="menu-btn-filters"
              aria-expanded={activeMenu === 'filters'}
            >
              <span>Filters</span>
              <ChevronDown size={11} className={styles.menuChevron} />
            </button>

            {activeMenu === 'filters' && (
              <div
                className={styles.dropdownPopover}
                style={{ maxHeight: '420px', overflowY: 'auto', minWidth: '240px' }}
                role="menu"
                data-testid="dropdown-menu-filters"
              >
                {filterCategories.map((cat, idx) => (
                  <div key={cat}>
                    {idx > 0 && <div className={styles.dropdownDivider} />}
                    <div className={styles.subCategoryHeader}>{cat}</div>
                    {FILTER_ITEMS.filter((f) => f.category === cat).map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={styles.dropdownItem}
                        disabled={!hasImage}
                        onClick={() => handleItemClick(() => onOpenFilter?.(filter))}
                        data-testid={`menu-filter-${filter.id}`}
                      >
                        <span>{filter.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HELP MENU */}
          <div className={styles.menuItemContainer}>
            <button
              type="button"
              className={`${styles.menuButton} ${activeMenu === 'help' ? styles.menuButtonActive : ''}`}
              onClick={() => handleToggleMenu('help')}
              data-testid="menu-btn-help"
              aria-expanded={activeMenu === 'help'}
            >
              <span>Help</span>
              <ChevronDown size={11} className={styles.menuChevron} />
            </button>

            {activeMenu === 'help' && (
              <div className={styles.dropdownPopover} role="menu" data-testid="dropdown-menu-help">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() =>
                    handleItemClick(() => {
                      alert(
                        'Keyboard Shortcuts:\n' +
                          'V: Move Tool\n' +
                          'M: Marquee Selection\n' +
                          'L: Lasso Tool\n' +
                          'W: Magic Wand\n' +
                          'C: Crop Tool\n' +
                          'I: Eyedropper\n' +
                          'J: Patch Tool\n' +
                          'B: Brush Tool\n' +
                          'E: Eraser Tool\n' +
                          'U: Shape Tools\n' +
                          'T: Text Tool\n' +
                          'H: Hand / Pan Tool\n' +
                          'Ctrl+0: Fit on Screen\n' +
                          'Ctrl+1: 100% Zoom\n' +
                          'Ctrl+Z / Ctrl+Y: Undo / Redo'
                      );
                    })
                  }
                >
                  <div className={styles.itemLabelGroup}>
                    <HelpCircle size={13} className={styles.itemIcon} />
                    <span>Keyboard Shortcuts...</span>
                  </div>
                  <span className={styles.shortcutBadge}>Ctrl+/</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* -------------------------------------------------------------
          RIGHT SECTION: Undo, Redo, Zoom %, Fit, Fullscreen, Pan, Add Image, Download
          ------------------------------------------------------------- */}
      <div className={styles.rightSection}>
        {/* Undo */}
        <button
          type="button"
          className={styles.iconBtn}
          disabled={!hasImage || !canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          data-testid="top-undo-btn"
        >
          <Undo2 size={15} />
        </button>

        {/* Redo */}
        <button
          type="button"
          className={styles.iconBtn}
          disabled={!hasImage || !canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          data-testid="top-redo-btn"
        >
          <Redo2 size={15} />
        </button>

        <div className={styles.vSeparator} aria-hidden="true" style={{ margin: '0 4px' }} />

        {/* Zoom Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.zoomDropdownTrigger}
            onClick={() => setZoomMenuOpen((p) => !p)}
            title="Zoom percentage"
            data-testid="top-zoom-trigger"
          >
            <span>{Math.round(zoom * 100)}%</span>
            <ChevronDown size={11} />
          </button>

          {zoomMenuOpen && (
            <div className={styles.zoomDropdownMenu} role="menu" data-testid="top-zoom-menu">
              {ZOOM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`${styles.zoomMenuItem} ${
                    Math.round(zoom * 100) === Math.round(preset * 100) ? styles.zoomMenuActive : ''
                  }`}
                  onClick={() => {
                    onZoomChange?.(preset);
                    setZoomMenuOpen(false);
                  }}
                >
                  <span>{Math.round(preset * 100)}%</span>
                  {Math.round(zoom * 100) === Math.round(preset * 100) && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fit to Screen */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onFitScreen}
          title="Fit on Screen (Ctrl+0)"
          aria-label="Fit on Screen"
          data-testid="top-fit-screen-btn"
        >
          <Maximize size={15} />
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
          data-testid="top-fullscreen-btn"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* Hand / Pan Toggle */}
        <button
          type="button"
          className={`${styles.iconBtn} ${isPanActive ? styles.iconBtnActive : ''}`}
          onClick={onTogglePan}
          title="Hand Tool / Pan View (Space+Drag)"
          aria-label="Hand Tool"
          data-testid="top-hand-tool-btn"
        >
          <Hand size={15} />
        </button>

        <div className={styles.vSeparator} aria-hidden="true" style={{ margin: '0 4px' }} />

        {/* Add Image Layer */}
        <button
          type="button"
          className={styles.addImageBtn}
          disabled={!hasImage}
          onClick={onAddImageLayer}
          title="Add image as new layer"
          data-testid="top-add-image-btn"
        >
          <ImagePlus size={15} />
          <span>Add Image</span>
        </button>

        {/* Download Button */}
        <button
          type="button"
          className={styles.downloadBtn}
          disabled={!hasImage}
          onClick={() => onDownload?.('image/png')}
          title="Download edited image"
          data-testid="top-download-btn"
        >
          <Download size={15} />
          <span>Download</span>
        </button>
      </div>
    </header>
  );
}

export default ApplicationMenuBar;

