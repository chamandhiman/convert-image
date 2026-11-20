import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import {
  downloadBlob,
  ACCEPT_STRING,
  ACCEPTED_INPUT_TYPES,
  MAX_CANVAS_DIMENSION,
  MAX_CANVAS_PIXELS,
} from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';
import { trackImageUpload, trackImageConvert, trackImageDownload } from '@/utils/analytics';
import { isExternalFileDrag, extractFilesFromEvent } from '@/utils/dragDropHelpers';
import { ApplicationMenuBar } from './components/ApplicationMenuBar';
import { HamburgerNavDrawer } from './components/HamburgerNavDrawer';
import { LeftToolPanel } from './components/LeftToolPanel';
import { DocumentTabsBar } from './components/DocumentTabsBar';
import { UnsavedChangesModal } from './components/UnsavedChangesModal';
import {
  generateDocId,
  generateLayerId,
  cloneLayerData,
  createDocumentModel,
  transferLayerToDocument,
  copyLayersToClipboard,
  pasteClipboardIntoDocument,
} from './utils/documentManager';
import { EditorTopBar } from './components/EditorTopBar';
import { CanvasRulers } from './components/CanvasRulers';
import { ContextualToolbar } from './components/ContextualToolbar';
import { RightWorkspace } from './components/RightWorkspace';
import { BottomStatusBar } from './components/BottomStatusBar';
import { EditorStartScreen, CanvasSetupModal } from './components/EditorStartScreen';
import {
  parsePsdFile,
  createPsdDocumentModel,
  isPsdFile,
  isPsdSignature,
  isSupportedImageFile,
} from './utils/psdImporter';
import { calculateTextDimensions, computeTextWrapLines } from './utils/textLayout';
import { BlendingOptionsModal } from './components/BlendingOptionsModal';
import { FilterDialog } from './components/FilterDialog';
import { applyFilter } from './utils/filterUtils';
import {
  deletePixelsInsideSelection,
  extractPixelsFromSelection,
  magicWandSelect,
} from './utils/selectionUtils';
import { applyPatchBlend } from './utils/patchUtils';
import { exportDocumentAsPsd, triggerFileDownload } from './utils/psdExporter';
import { SaveProjectModal } from './components/SaveProjectModal';
import {
  ImageInfoModal,
  ImageResolutionModal,
  CanvasBackgroundModal,
} from './components/ImageOperationsModals';
import { CanvasSizeModal, ImageResizeModal } from './components/CanvasResizeModals';
import { VectorPathOverlay } from './components/VectorPathOverlay';
import {
  generateSvgPath,
  samplePolygonFromPoints,
  findClosestSegment,
  convertShapeLayerToVectorPoints,
} from './utils/vectorPathUtils';
import { FileImportLoadingModal } from './components/FileImportLoadingModal/FileImportLoadingModal';
import styles from './EditImagePage.module.css';

const SHAPE_TYPES = [
  { id: 'rect', label: 'Rectangle' },
  { id: 'rounded-rect', label: 'Rounded Rect' },
  { id: 'circle', label: 'Ellipse' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'star', label: 'Star' },
  { id: 'line', label: 'Line' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'custom-shape', label: 'Custom Shape' },
];

export const CROP_PRESETS = [
  { id: 'free', label: 'Freeform', ratio: null },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '16:9', label: '16:9 Landscape', ratio: 16 / 9 },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3 },
  { id: '9:16', label: '9:16 Story', ratio: 9 / 16 },
  { id: '3:2', label: '3:2 Photo', ratio: 3 / 2 },
  { id: 'custom', label: 'Custom', ratio: 'custom' },
];

// High-fidelity SVG Pen Tool Cursors (Standard Pen Nib, Add Anchor, Delete Anchor, Close Path)
const PEN_CURSORS = {
  pen: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M2 2l7 3-3 4-4-7z' fill='%23ffffff' stroke='%230f172a' stroke-width='1.2' stroke-linejoin='round'/%3E%3Cpath d='M9 5l11 11c.7.7.7 1.8 0 2.5l-.5.5c-.7.7-1.8.7-2.5 0L6 8' fill='%23ffffff' stroke='%230f172a' stroke-width='1.2' stroke-linejoin='round'/%3E%3Cline x1='2' y1='2' x2='7.5' y2='7.5' stroke='%230f172a' stroke-width='1.2'/%3E%3Ccircle cx='7.5' cy='7.5' r='1' fill='%230f172a'/%3E%3C/svg%3E") 2 2, crosshair`,
  add: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M2 2l7 3-3 4-4-7z' fill='%23ffffff' stroke='%230f172a' stroke-width='1.2' stroke-linejoin='round'/%3E%3Cpath d='M9 5l11 11c.7.7.7 1.8 0 2.5l-.5.5c-.7.7-1.8.7-2.5 0L6 8' fill='%23ffffff' stroke='%230f172a' stroke-width='1.2' stroke-linejoin='round'/%3E%3Cline x1='2' y1='2' x2='7.5' y2='7.5' stroke='%230f172a' stroke-width='1.2'/%3E%3Ccircle cx='7.5' cy='7.5' r='1' fill='%230f172a'/%3E%3Ccircle cx='18' cy='18' r='4.5' fill='%237c3aed'/%3E%3Cline x1='18' y1='15.5' x2='18' y2='20.5' stroke='%23ffffff' stroke-width='1.5' stroke-linecap='round'/%3E%3Cline x1='15.5' y1='18' x2='20.5' y2='18' stroke='%23ffffff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") 2 2, crosshair`,
  delete: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M2 2l7 3-3 4-4-7z' fill='%23ffffff' stroke='%230f172a' stroke-width='1.2' stroke-linejoin='round'/%3E%3Cpath d='M9 5l11 11c.7.7.7 1.8 0 2.5l-.5.5c-.7.7-1.8.7-2.5 0L6 8' fill='%23ffffff' stroke='%230f172a' stroke-width='1.2' stroke-linejoin='round'/%3E%3Cline x1='2' y1='2' x2='7.5' y2='7.5' stroke='%230f172a' stroke-width='1.2'/%3E%3Ccircle cx='7.5' cy='7.5' r='1' fill='%230f172a'/%3E%3Ccircle cx='18' cy='18' r='4.5' fill='%23dc2626'/%3E%3Cline x1='15.5' y1='18' x2='20.5' y2='18' stroke='%23ffffff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") 2 2, crosshair`,
  close: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M2 2l7 3-3 4-4-7z' fill='%23ffffff' stroke='%230f172a' stroke-width='1.2' stroke-linejoin='round'/%3E%3Cpath d='M9 5l11 11c.7.7.7 1.8 0 2.5l-.5.5c-.7.7-1.8.7-2.5 0L6 8' fill='%23ffffff' stroke='%230f172a' stroke-width='1.2' stroke-linejoin='round'/%3E%3Cline x1='2' y1='2' x2='7.5' y2='7.5' stroke='%230f172a' stroke-width='1.2'/%3E%3Ccircle cx='7.5' cy='7.5' r='1' fill='%230f172a'/%3E%3Ccircle cx='18' cy='18' r='3.5' fill='%23ffffff' stroke='%237c3aed' stroke-width='1.5'/%3E%3C/svg%3E") 2 2, crosshair`,
};

export function EditImagePage({ embedded, embeddedOnly }) {
  useDocumentTitle('Smart Image Editor — Complete Online Photo & Image Suite');

  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['resize', 'crop', 'rotate', 'canvas', 'text', 'erase', 'shapes'];
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    initialTab && validTabs.includes(initialTab) ? initialTab : null
  );

  // Active Left Toolbar tool (null in empty state)
  const [activeTool, setActiveTool] = useState(null);
  const [penHoverMode, setPenHoverMode] = useState('pen');
  const penCursor = PEN_CURSORS[penHoverMode] || PEN_CURSORS.pen;
  const [foregroundColor, setForegroundColor] = useState('#7C3AED');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [isPanActive, setIsPanActive] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [showRulers, setShowRulers] = useState(true);

  const handleResetColors = useCallback(() => {
    setForegroundColor('#000000');
    setBackgroundColor('#FFFFFF');
  }, []);

  // Photoshop Draggable Canvas Guides state
  const [guides, setGuides] = useState([]);
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [showGuides, setShowGuides] = useState(true);

  const handleAddGuide = useCallback((newGuide) => {
    setGuides((prev) => [...prev, newGuide]);
    setSelectedGuideId(newGuide.id);
  }, []);

  const handleUpdateGuide = useCallback((guideId, updates) => {
    setGuides((prev) =>
      prev.map((g) => (g.id === guideId ? { ...g, ...updates } : g))
    );
  }, []);

  const handleDeleteGuide = useCallback((guideId) => {
    setGuides((prev) => prev.filter((g) => g.id !== guideId));
    setSelectedGuideId((cur) => (cur === guideId ? null : cur));
  }, []);

  const handleClearGuides = useCallback(() => {
    setGuides([]);
    setSelectedGuideId(null);
  }, []);

  // Shape drawing state and refs
  const [drawingShapePreview, setDrawingShapePreview] = useState(null);
  const drawingShapePreviewRef = useRef(null);
  drawingShapePreviewRef.current = drawingShapePreview;
  const shapeDrawRef = useRef({ active: false });
  const cropDrawRef = useRef(null);
  const penDragRef = useRef(null);
  const textDrawRef = useRef(null);
  const [textDragBox, setTextDragBox] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidePanelTab('properties');
    setSearchParams({ tab });
    if (tab === 'crop') {
      setActiveTool('crop');
      const boxW = activeCanvas?.width || currentWidth || 800;
      const boxH = activeCanvas?.height || currentHeight || 600;
      setCropBox({
        x: 0,
        y: 0,
        width: boxW,
        height: boxH,
      });
      setCropPreset('free');
    } else if (tab === 'resize') {
      setActiveTool('resize');
    } else if (tab === 'rotate') {
      setActiveTool('rotate');
    } else if (tab === 'canvas') {
      setActiveTool('canvas');
    } else if (tab === 'text') {
      setActiveTool('text');
    } else if (tab === 'shapes') {
      setActiveTool('rect');
    } else if (tab === 'brush') {
      setActiveTool('brush');
    } else if (tab === 'erase') {
      setActiveTool('eraser');
    } else if (tab === 'move') {
      setActiveTool('move');
    }
  };

  const handleToolSelect = (toolId) => {
    if (toolId !== 'text' && toolId !== 'text-vertical') {
      commitOrDiscardDraftRef.current?.();
      finishEditingTextRef.current?.();
    }
    if (toolId === 'canvas') {
      setShowCanvasSizeModal(true);
      return;
    }
    if (toolId === 'resize') {
      setShowImageResizeModal(true);
      return;
    }
    setActiveTool(toolId);
    if (toolId === 'crop') {
      setActiveTab('crop');
      setSidePanelTab('properties');
      const boxW = activeCanvas?.width || currentWidth || 800;
      const boxH = activeCanvas?.height || currentHeight || 600;
      setCropBox({
        x: 0,
        y: 0,
        width: boxW,
        height: boxH,
      });
      setCropPreset('free');
    } else if (['rotate', 'text'].includes(toolId)) {
      setActiveTab(toolId);
      setSidePanelTab('properties');
    } else if (['rect', 'circle', 'ellipse', 'triangle', 'line', 'star', 'shapes'].includes(toolId)) {
      setActiveTab('shapes');
      setSidePanelTab('properties');
    } else if (toolId === 'brush') {
      setActiveTab('brush');
      setSidePanelTab('properties');
    } else if (toolId === 'eraser') {
      setActiveTab('erase');
      setSidePanelTab('properties');
    } else if (toolId === 'move') {
      setActiveTab('move');
      setSidePanelTab('properties');
    }
  };

  const handleSwapColors = () => {
    setForegroundColor((prevFg) => {
      setBackgroundColor(prevFg);
      return backgroundColor;
    });
  };

  // ===========================================================================
  // MULTI-DOCUMENT WORKSPACE STATE
  // ===========================================================================
  const [documents, setDocuments] = useState([]);
  const [activeDocumentId, setActiveDocumentId] = useState(null);
  const documentStoreRef = useRef(new Map());
  const clipboardRef = useRef(null);
  const [pendingCloseDoc, setPendingCloseDoc] = useState(null);
  const [isDraggingLayerOverCanvas, setIsDraggingLayerOverCanvas] = useState(false);

  // Original file state
  const [originalFile, setOriginalFile] = useState(null);
  const [origWidth, setOrigWidth] = useState(0);
  const [origHeight, setOrigHeight] = useState(0);
  const [origSize, setOrigSize] = useState(0);

  // Non-destructive History Stack:
  // Each entry stores { canvas, width, height, layers, label, timestamp }
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Active document data URL
  const [currentDataUrl, setCurrentDataUrl] = useState('');

  // Overlay Layers: Array of TextLayer | ShapeLayer
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState([]);
  const [activeMaskLayerId, setActiveMaskLayerId] = useState(null);

  // Selection tools state
  const [activeSelection, setActiveSelection] = useState(null);
  const [selectionFeather, setSelectionFeather] = useState(0);
  const [selectionTolerance, setSelectionTolerance] = useState(32);
  const selectionDrawRef = useRef(null);
  const selectionMoveRef = useRef(null);
  const [showImageInfoModal, setShowImageInfoModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showCanvasBgModal, setShowCanvasBgModal] = useState(false);

  // Pen Tool state
  const [penPath, setPenPath] = useState(null);
  const [selectedVectorNodeIndex, setSelectedVectorNodeIndex] = useState(null);
  const [penCursorPos, setPenCursorPos] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [penFillColor, setPenFillColor] = useState('#c084fc');
  const [penStrokeColor, setPenStrokeColor] = useState('#7c3aed');
  const [penStrokeWidth, setPenStrokeWidth] = useState(2);

  // Patch Tool state
  const [patchState, setPatchState] = useState({
    selection: null,
    sourceOffset: { x: 0, y: 0 },
    isDragging: false,
  });
  const [patchMode, setPatchMode] = useState('source');
  const [patchFeather, setPatchFeather] = useState(4);
  const patchDrawRef = useRef(null);
  const patchDragRef = useRef(null);

  // Canvas marquee box (drag on empty canvas stage in move tool)
  const [canvasMarquee, setCanvasMarquee] = useState(null);
  const canvasMarqueeRef = useRef(null);

  // Filter dialog state
  const [activeFilterDialog, setActiveFilterDialog] = useState(null);

  // Blending Options modal state
  const [activeBlendingLayer, setActiveBlendingLayer] = useState(null);

  const [editingTextLayerId, setEditingTextLayerId] = useState(null);
  const editingOriginalTextRef = useRef({});
  const justCreatedTextIdRef = useRef(null);
  const layerPointerDownTimeRef = useRef(0);
  const textEditorRef = useRef(null);
  const [activeTextDraft, setActiveTextDraft] = useState(null);
  const activeTextDraftRef = useRef(null);
  activeTextDraftRef.current = activeTextDraft;
  const commitOrDiscardDraftRef = useRef(null);
  const finishEditingTextRef = useRef(null);
  const [textSettings, setTextSettings] = useState({
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
  });
  const [rotatingLayerId, setRotatingLayerId] = useState(null);
  const [rotatingAngle, setRotatingAngle] = useState(null);

  // Side Panel Tab: 'properties' | 'layers'
  const [sidePanelTab, setSidePanelTab] = useState('properties');

  // Layers panel inline rename & drag reorder states
  const [renamingLayerId, setRenamingLayerId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggedLayerIndex, setDraggedLayerIndex] = useState(null);
  const [dragOverLayerIndex, setDragOverLayerIndex] = useState(null);
  const touchDragStartRef = useRef(null);

  // Viewport Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const isSpacePressedRef = useRef(false);
  const [isSpaceHandActive, setIsSpaceHandActive] = useState(false);
  const prevToolBeforeSpaceRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const viewportRef = useRef(null);
  const stageRef = useRef(null);

  // Floating Photoshop-Style Modals for Canvas Size & Image Resize
  const [showCanvasSizeModal, setShowCanvasSizeModal] = useState(false);
  const [showImageResizeModal, setShowImageResizeModal] = useState(false);

  // Keep ref to layers & zoom for window pointer event handlers
  const layersRef = useRef(layers);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // ---------------------------------------------------------------------------
  // TAB 1: RESIZE CONTROLS STATE
  // ---------------------------------------------------------------------------
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // ---------------------------------------------------------------------------
  // TAB 2: CROP CONTROLS STATE
  // ---------------------------------------------------------------------------
  const [cropPreset, setCropPreset] = useState('free');
  const [customRatioW, setCustomRatioW] = useState(1);
  const [customRatioH, setCustomRatioH] = useState(1);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const cropDragRef = useRef(null);

  // ---------------------------------------------------------------------------
  // TAB 3: ROTATE CONTROLS STATE
  // ---------------------------------------------------------------------------
  const [rotateAngle, setRotateAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // ---------------------------------------------------------------------------
  // TAB 4: CANVAS CONTROLS STATE
  // ---------------------------------------------------------------------------
  const [canvasWidth, setCanvasWidth] = useState('');
  const [canvasHeight, setCanvasHeight] = useState('');
  const [canvasAnchor, setCanvasAnchor] = useState('mc');
  const [canvasBgOption, setCanvasBgOption] = useState('transparent');
  const [canvasCustomColor, setCanvasCustomColor] = useState('#7C3AED');

  // ---------------------------------------------------------------------------
  // TAB 6: ERASE CONTROLS STATE
  // ---------------------------------------------------------------------------
  const [brushSize, setBrushSize] = useState(36);
  const [brushHardness, setBrushHardness] = useState(80);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [isErasing, setIsErasing] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, visible: false });
  const eraseLastPointRef = useRef(null);

  // Global UI state
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isBlankModalOpen, setIsBlankModalOpen] = useState(false);
  const [isImportingPsd, setIsImportingPsd] = useState(false);
  const [psdImportStatus, setPsdImportStatus] = useState('');
  const [importLoading, setImportLoading] = useState(null);
  const cancelImportRef = useRef(false);

  const handleCancelImport = useCallback(() => {
    cancelImportRef.current = true;
    setImportLoading(null);
    setIsImportingPsd(false);
    setPsdImportStatus('');
  }, []);

  const [isSaveProjectModalOpen, setIsSaveProjectModalOpen] = useState(false);
  const [isSavingPsd, setIsSavingPsd] = useState(false);
  const [psdSaveError, setPsdSaveError] = useState(null);
  const handleSaveProjectRef = useRef(null);
  const handleSaveProjectAsRef = useRef(null);
  const fileInputRef = useRef(null);
  const layerImageInputRef = useRef(null);

  // Upload trigger helpers
  const handleTriggerUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  // Active Canvas from History (Protected against index out of bounds)
  const safeHistoryIndex =
    history.length > 0
      ? Math.max(0, Math.min(history.length - 1, historyIndex >= 0 ? historyIndex : 0))
      : -1;
  const activeCanvas = safeHistoryIndex >= 0 ? history[safeHistoryIndex]?.canvas || null : null;
  const currentWidth = safeHistoryIndex >= 0 ? history[safeHistoryIndex]?.width || 0 : 0;
  const currentHeight = safeHistoryIndex >= 0 ? history[safeHistoryIndex]?.height || 0 : 0;
  const hasImage = Boolean(activeCanvas);

  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const historyIndexRef = useRef(historyIndex);
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  // Ensure Crop Box is initialized when switching into Crop Tool
  useEffect(() => {
    if (activeTool === 'crop' && !cropDrawRef.current?.active) {
      setCropBox((prev) => {
        if (prev.width === 0 || prev.height === 0) {
          const w = activeCanvas?.width || currentWidth || 800;
          const h = activeCanvas?.height || currentHeight || 600;
          if (w > 0 && h > 0) {
            return { x: 0, y: 0, width: w, height: h };
          }
        }
        return prev;
      });
    }
  }, [activeTool, activeCanvas, currentWidth, currentHeight]);

  // Live Display Dimensions for Canvas Stage
  const displayWidth = currentWidth;
  const displayHeight = currentHeight;

  // Selected Layer
  const selectedLayer = useMemo(() => {
    return layers.find((l) => l.id === selectedLayerId) || null;
  }, [layers, selectedLayerId]);

  const selectedLayersList = useMemo(() => {
    if (selectedLayerIds.length <= 1) return [];
    return layers.filter((l) => selectedLayerIds.includes(l.id));
  }, [layers, selectedLayerIds]);

  const multiSelectBounds = useMemo(() => {
    if (selectedLayersList.length <= 1) return null;
    const minX = Math.min(...selectedLayersList.map((l) => l.x || 0));
    const minY = Math.min(...selectedLayersList.map((l) => l.y || 0));
    const maxX = Math.max(...selectedLayersList.map((l) => (l.x || 0) + (l.width || 0)));
    const maxY = Math.max(...selectedLayersList.map((l) => (l.y || 0) + (l.height || 0)));
    return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
  }, [selectedLayersList]);

  // Sync controls whenever active history entry changes
  useEffect(() => {
    if (!activeCanvas) return;

    // Convert canvas to displayable data URL
    const dataUrl = activeCanvas.toDataURL('image/png');
    setCurrentDataUrl(dataUrl);

    // Sync dimensions for Resize & Canvas tabs
    setResizeWidth(activeCanvas.width);
    setResizeHeight(activeCanvas.height);
    setCanvasWidth(activeCanvas.width);
    setCanvasHeight(activeCanvas.height);

    // Sync document store dimensions
    if (activeDocumentId) {
      const existing = documentStoreRef.current.get(activeDocumentId);
      if (existing) {
        existing.width = activeCanvas.width;
        existing.height = activeCanvas.height;
        documentStoreRef.current.set(activeDocumentId, existing);
      }
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === activeDocumentId
            ? { ...d, width: activeCanvas.width, height: activeCanvas.height }
            : d
        )
      );
    }

    // Sync layers from history snapshot
    const entryLayers = history[historyIndex]?.layers;
    if (entryLayers) {
      setLayers(entryLayers.map((l) => ({ ...l })));
      layersRef.current = entryLayers.map((l) => ({ ...l }));
    }
  }, [activeCanvas, historyIndex, activeDocumentId]);

  // Calculate optimal zoom to fit an image inside the visible canvas workspace
  const calculateFitZoom = useCallback((imgWidth, imgHeight) => {
    if (!imgWidth || !imgHeight) return 1;
    const vp = viewportRef.current;
    const rulerOffset = 24;
    const margin = 48; // comfortable margin around canvas stage
    const availW = Math.max(100, (vp?.clientWidth || (window.innerWidth - 370)) - rulerOffset - margin);
    const availH = Math.max(100, (vp?.clientHeight || (window.innerHeight - 110)) - rulerOffset - margin);

    const scale = Math.min(availW / imgWidth, availH / imgHeight, 1);
    return Math.max(0.05, Math.min(1, Math.round(scale * 100) / 100));
  }, []);

  // Mark current active document as dirty (unsaved modifications)
  const markActiveDocDirty = useCallback(() => {
    if (!activeDocumentId) return;
    const existing = documentStoreRef.current.get(activeDocumentId);
    if (existing && !existing.isDirty) {
      existing.isDirty = true;
      documentStoreRef.current.set(activeDocumentId, existing);
      setDocuments((prev) =>
        prev.map((d) => (d.id === activeDocumentId ? { ...d, isDirty: true } : d))
      );
    }
  }, [activeDocumentId]);

  // Push new state to History Stack
  const pushHistory = useCallback(
    (newCanvas, newLayers = null, label = 'Edit') => {
      const targetCanvas = newCanvas || activeCanvas;
      const targetLayers = newLayers !== null ? newLayers : layersRef.current;
      if (!targetCanvas) return;

      const entry = {
        canvas: targetCanvas,
        width: targetCanvas.width,
        height: targetCanvas.height,
        layers: targetLayers.map((l) => ({ ...l })),
        label,
        timestamp: Date.now(),
      };

      const curIdx = historyIndexRef.current;
      const curHistory = historyRef.current;
      const sliced = curHistory.slice(0, Math.max(0, curIdx + 1));
      const nextHistory = [...sliced, entry];
      const nextIndex = nextHistory.length - 1;

      historyRef.current = nextHistory;
      historyIndexRef.current = nextIndex;
      setHistory(nextHistory);
      setHistoryIndex(nextIndex);
      setError('');
      markActiveDocDirty();
    },
    [activeCanvas, markActiveDocDirty]
  );

  // Snapshot active document's full editor state into documentStore
  const saveActiveDocumentToStore = useCallback(() => {
    if (!activeDocumentId) return;
    const existing = documentStoreRef.current.get(activeDocumentId);
    if (!existing) return;

    const snapshot = {
      ...existing,
      layers: (layersRef.current || []).map((l) => ({ ...l })),
      selectedLayerId,
      selectedLayerIds: [...selectedLayerIds],
      activeMaskLayerId,
      activeTool,
      zoom: zoomRef.current,
      pan: { ...pan },
      activeSelection: activeSelection ? { ...activeSelection } : null,
      selectionFeather,
      selectionTolerance,
      penPath,
      patchState,
      guides: [...guides],
      selectedGuideId,
      showGuides,
      resizeWidth,
      resizeHeight,
      cropPreset,
      cropBox: { ...cropBox },
      rotateAngle,
      flipH,
      flipV,
      canvasWidth,
      canvasHeight,
      canvasBgOption,
      canvasCustomColor,
      history: (historyRef.current || []).map((h) => ({ ...h })),
      historyIndex: historyIndexRef.current,
      width: currentWidth,
      height: currentHeight,
      originalFile,
      origWidth,
      origHeight,
      origSize,
    };
    documentStoreRef.current.set(activeDocumentId, snapshot);
  }, [
    activeDocumentId,
    selectedLayerId,
    selectedLayerIds,
    activeMaskLayerId,
    activeTool,
    pan,
    activeSelection,
    selectionFeather,
    selectionTolerance,
    penPath,
    patchState,
    guides,
    selectedGuideId,
    showGuides,
    resizeWidth,
    resizeHeight,
    cropPreset,
    cropBox,
    rotateAngle,
    flipH,
    flipV,
    canvasWidth,
    canvasHeight,
    canvasBgOption,
    canvasCustomColor,
    currentWidth,
    currentHeight,
    originalFile,
    origWidth,
    origHeight,
    origSize,
  ]);

  // Load a document from store into active editor states
  const loadDocumentFromStore = useCallback((targetDocId) => {
    const doc = documentStoreRef.current.get(targetDocId);
    if (!doc) return;

    const docLayers = (doc.layers || []).map((l) => ({ ...l }));
    setLayers(docLayers);
    layersRef.current = docLayers;
    setSelectedLayerId(doc.selectedLayerId || (docLayers[0] ? docLayers[0].id : null));
    setSelectedLayerIds(doc.selectedLayerIds || (docLayers[0] ? [docLayers[0].id] : []));
    setActiveMaskLayerId(doc.activeMaskLayerId || null);
    setActiveTool(doc.activeTool || 'move');
    setZoom(doc.zoom || 1);
    zoomRef.current = doc.zoom || 1;
    setPan(doc.pan || { x: 0, y: 0 });
    setActiveSelection(doc.activeSelection || null);
    setGuides(doc.guides || []);
    setSelectedGuideId(doc.selectedGuideId || null);
    setShowGuides(doc.showGuides !== undefined ? doc.showGuides : true);
    setResizeWidth(doc.resizeWidth || '');
    setResizeHeight(doc.resizeHeight || '');
    setCropPreset(doc.cropPreset || 'free');
    setCropBox(doc.cropBox || { x: 0, y: 0, width: 0, height: 0 });
    setRotateAngle(doc.rotateAngle || 0);
    setFlipH(doc.flipH || false);
    setFlipV(doc.flipV || false);
    setCanvasWidth(doc.canvasWidth || '');
    setCanvasHeight(doc.canvasHeight || '');
    setCanvasBgOption(doc.canvasBgOption || (doc.isTransparent ? 'transparent' : 'white'));
    setCanvasCustomColor(doc.canvasCustomColor || '#7C3AED');
    setOriginalFile(doc.originalFile || null);
    setOrigWidth(doc.origWidth || doc.width || 800);
    setOrigHeight(doc.origHeight || doc.height || 600);
    setOrigSize(doc.origSize || 0);
    const docHistory = (doc.history || []).map((h) => ({ ...h }));
    setHistory(docHistory);
    historyRef.current = docHistory;
    const nextIdx = doc.historyIndex >= 0 ? doc.historyIndex : Math.max(0, docHistory.length - 1);
    setHistoryIndex(nextIdx);
    historyIndexRef.current = nextIdx;
    if (docHistory[nextIdx]?.canvas) {
      setCurrentDataUrl(docHistory[nextIdx].canvas.toDataURL('image/png'));
    }
  }, []);

  // Switch between open document tabs
  const handleSwitchDocument = useCallback(
    (targetDocId) => {
      if (!targetDocId || targetDocId === activeDocumentId) return;
      saveActiveDocumentToStore();
      setActiveDocumentId(targetDocId);
      loadDocumentFromStore(targetDocId);
    },
    [activeDocumentId, saveActiveDocumentToStore, loadDocumentFromStore]
  );

  // Reorder tabs
  const handleReorderDocuments = useCallback((fromIndex, toIndex) => {
    setDocuments((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  // Permanently close a document
  const executeCloseDocument = useCallback(
    (docId) => {
      documentStoreRef.current.delete(docId);
      setDocuments((prev) => {
        const next = prev.filter((d) => d.id !== docId);

        if (docId === activeDocumentId) {
          if (next.length > 0) {
            const closedIdx = prev.findIndex((d) => d.id === docId);
            const nextIdx = Math.max(
              0,
              Math.min(next.length - 1, closedIdx === prev.length - 1 ? closedIdx - 1 : closedIdx)
            );
            const targetDoc = next[nextIdx];
            setActiveDocumentId(targetDoc.id);
            loadDocumentFromStore(targetDoc.id);
          } else {
            setActiveDocumentId(null);
            setHistory([]);
            historyRef.current = [];
            setHistoryIndex(-1);
            historyIndexRef.current = -1;
            setLayers([]);
            layersRef.current = [];
            setSelectedLayerId(null);
            setSelectedLayerIds([]);
            setOriginalFile(null);
            setOrigWidth(0);
            setOrigHeight(0);
            setOrigSize(0);
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setCurrentDataUrl('');
          }
        }
        return next;
      });
      setPendingCloseDoc(null);
    },
    [activeDocumentId, loadDocumentFromStore]
  );

  // Request to close a document (checks dirty status)
  const handleRequestCloseDocument = useCallback(
    (docId, e) => {
      if (e) e.stopPropagation();
      if (docId === activeDocumentId) {
        saveActiveDocumentToStore();
      }
      const doc = documentStoreRef.current.get(docId);
      if (!doc) return;

      if (doc.isDirty || (doc.historyIndex > 0 && doc.history && doc.history.length > 1)) {
        setPendingCloseDoc(doc);
      } else {
        executeCloseDocument(docId);
      }
    },
    [activeDocumentId, saveActiveDocumentToStore, executeCloseDocument]
  );

  // Close all documents
  const handleCloseAllDocuments = useCallback(() => {
    saveActiveDocumentToStore();
    const dirtyDoc = Array.from(documentStoreRef.current.values()).find((d) => d.isDirty);
    if (dirtyDoc) {
      setPendingCloseDoc(dirtyDoc);
      return;
    }
    documentStoreRef.current.clear();
    setDocuments([]);
    setActiveDocumentId(null);
    setHistory([]);
    historyRef.current = [];
    setHistoryIndex(-1);
    historyIndexRef.current = -1;
    setLayers([]);
    layersRef.current = [];
    setSelectedLayerId(null);
    setSelectedLayerIds([]);
    setOriginalFile(null);
    setOrigWidth(0);
    setOrigHeight(0);
    setOrigSize(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCurrentDataUrl('');
  }, [saveActiveDocumentToStore]);

  // Drop layer(s) on a document tab
  const handleDropLayerOnTab = useCallback(
    (targetDocId, sourceLayersOrLayer) => {
      if (!targetDocId || !sourceLayersOrLayer) return;
      const incoming = Array.isArray(sourceLayersOrLayer)
        ? sourceLayersOrLayer
        : [sourceLayersOrLayer];

      if (targetDocId === activeDocumentId) {
        const clonedList = incoming.map((l, idx) => {
          const newLayer = cloneLayerData(l);
          newLayer.x = Math.max(10, Math.round((currentWidth - (newLayer.width || 100)) / 2) + idx * 20);
          newLayer.y = Math.max(10, Math.round((currentHeight - (newLayer.height || 100)) / 2) + idx * 20);
          return newLayer;
        });

        const nextLayers = [...layersRef.current, ...clonedList];
        layersRef.current = nextLayers;
        setLayers(nextLayers);
        const last = clonedList[clonedList.length - 1];
        setSelectedLayerId(last.id);
        setSelectedLayerIds(clonedList.map((c) => c.id));
        pushHistory(null, nextLayers, `Transfer ${clonedList.length} Layer(s)`);
        markActiveDocDirty();
      } else {
        const targetDoc = documentStoreRef.current.get(targetDocId);
        if (targetDoc) {
          let updatedDoc = targetDoc;
          incoming.forEach((l) => {
            updatedDoc = transferLayerToDocument(updatedDoc, l);
          });
          documentStoreRef.current.set(targetDocId, updatedDoc);
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === targetDocId
                ? { ...d, isDirty: true, layersCount: updatedDoc.layers.length }
                : d
            )
          );
        }
      }
    },
    [activeDocumentId, currentWidth, currentHeight, pushHistory, markActiveDocDirty]
  );

  // Transfer layer(s) directly into active document (from Layers panel drop or Canvas drop)
  const handleTransferLayerToActiveDoc = useCallback(
    (sourceLayersOrLayer, targetIndex = null, dropX = null, dropY = null) => {
      if (!sourceLayersOrLayer) return;
      const incoming = Array.isArray(sourceLayersOrLayer)
        ? sourceLayersOrLayer
        : [sourceLayersOrLayer];

      const clonedList = incoming.map((l, idx) => {
        const newLayer = cloneLayerData(l);
        if (dropX !== null && dropY !== null) {
          newLayer.x = Math.max(0, dropX - Math.round((newLayer.width || 100) / 2) + idx * 20);
          newLayer.y = Math.max(0, dropY - Math.round((newLayer.height || 100) / 2) + idx * 20);
        } else {
          newLayer.x = Math.max(10, Math.round((currentWidth - (newLayer.width || 100)) / 2) + idx * 20);
          newLayer.y = Math.max(10, Math.round((currentHeight - (newLayer.height || 100)) / 2) + idx * 20);
        }
        return newLayer;
      });

      let nextLayers = [...layersRef.current];
      if (targetIndex !== null && targetIndex >= 0 && targetIndex <= nextLayers.length) {
        nextLayers.splice(targetIndex, 0, ...clonedList);
      } else {
        nextLayers.push(...clonedList);
      }
      layersRef.current = nextLayers;
      setLayers(nextLayers);
      const last = clonedList[clonedList.length - 1];
      setSelectedLayerId(last.id);
      setSelectedLayerIds(clonedList.map((c) => c.id));
      pushHistory(null, nextLayers, `Transfer ${clonedList.length} Layer(s)`);
      markActiveDocDirty();
    },
    [currentWidth, currentHeight, pushHistory, markActiveDocDirty]
  );

  // Delete Selected Pixels inside Active Selection
  const handleDeleteSelectedPixels = useCallback(async () => {
    if (!activeSelection || !selectedLayerId) return;
    const layer = layersRef.current.find((l) => l.id === selectedLayerId);
    const dataUrl = layer?.dataUrl || (layer?.id === 'background' ? currentDataUrl : null);
    if (!dataUrl) return;

    const layerPos = { x: layer.x || 0, y: layer.y || 0 };
    const layerSize = {
      width: layer.width || currentWidth || 800,
      height: layer.height || currentHeight || 600,
    };

    const updatedDataUrl = await deletePixelsInsideSelection(
      dataUrl,
      activeSelection,
      layerPos,
      layerSize,
      selectionFeather
    );

    const nextLayers = layersRef.current.map((l) =>
      l.id === selectedLayerId ? { ...l, type: 'image', dataUrl: updatedDataUrl } : l
    );
    if (selectedLayerId === 'background') {
      setCurrentDataUrl(updatedDataUrl);
    }
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    pushHistory(null, nextLayers, 'Clear Selected Pixels');
  }, [activeSelection, selectedLayerId, currentDataUrl, currentWidth, currentHeight, selectionFeather, pushHistory]);

  // Cross-Document Copy & Paste Operations
  const handleCopyLayers = useCallback(async () => {
    // 1. Pixel Selection Copy takes priority if active selection exists on a raster layer
    if (activeSelection && activeSelection.width > 0 && activeSelection.height > 0 && selectedLayerId) {
      const curLayer = layersRef.current.find((l) => l.id === selectedLayerId);
      const dataUrl = curLayer?.dataUrl || (curLayer?.id === 'background' ? currentDataUrl : null);
      if (dataUrl && (curLayer?.type === 'image' || curLayer?.type === 'blank' || curLayer?.id === 'background')) {
        const pixelData = await extractPixelsFromSelection(
          dataUrl,
          activeSelection,
          { x: curLayer.x || 0, y: curLayer.y || 0 },
          { width: curLayer.width || currentWidth || 800, height: curLayer.height || currentHeight || 600 }
        );
        if (pixelData) {
          clipboardRef.current = {
            type: 'pixel-selection',
            sourceDocId: activeDocumentId,
            ...pixelData,
          };
          return;
        }
      }
    }

    // 2. Otherwise copy selected layer(s)
    const ids = selectedLayerIds.length > 0 ? selectedLayerIds : selectedLayerId ? [selectedLayerId] : [];
    if (ids.length === 0) return;

    const layersToCopy = layersRef.current.filter((l) => ids.includes(l.id));
    if (layersToCopy.length === 0) return;

    clipboardRef.current = copyLayersToClipboard(layersToCopy, activeDocumentId);
  }, [activeSelection, selectedLayerId, selectedLayerIds, activeDocumentId, currentDataUrl, currentWidth, currentHeight]);

  const handleCutLayers = useCallback(async () => {
    // 1. Pixel Selection Cut
    if (activeSelection && activeSelection.width > 0 && activeSelection.height > 0 && selectedLayerId) {
      const curLayer = layersRef.current.find((l) => l.id === selectedLayerId);
      const dataUrl = curLayer?.dataUrl || (curLayer?.id === 'background' ? currentDataUrl : null);
      if (dataUrl && (curLayer?.type === 'image' || curLayer?.type === 'blank' || curLayer?.id === 'background')) {
        const pixelData = await extractPixelsFromSelection(
          dataUrl,
          activeSelection,
          { x: curLayer.x || 0, y: curLayer.y || 0 },
          { width: curLayer.width || currentWidth || 800, height: curLayer.height || currentHeight || 600 }
        );
        if (pixelData) {
          clipboardRef.current = {
            type: 'pixel-selection',
            sourceDocId: activeDocumentId,
            ...pixelData,
          };
          await handleDeleteSelectedPixels();
          return;
        }
      }
    }

    // 2. Otherwise cut selected layer(s)
    const ids = selectedLayerIds.length > 0 ? selectedLayerIds : selectedLayerId ? [selectedLayerId] : [];
    if (ids.length === 0) return;

    const layersToCut = layersRef.current.filter((l) => ids.includes(l.id) && !l.isBackground);
    if (layersToCut.length === 0) return;

    clipboardRef.current = copyLayersToClipboard(layersToCut, activeDocumentId);

    const nextLayers = layersRef.current.filter((l) => !ids.includes(l.id) || l.isBackground);
    layersRef.current = nextLayers;
    setLayers(nextLayers);
    setSelectedLayerId(nextLayers[0] ? nextLayers[0].id : null);
    setSelectedLayerIds(nextLayers[0] ? [nextLayers[0].id] : []);
    pushHistory(null, nextLayers, `Cut ${layersToCut.length} Layer(s)`);
    markActiveDocDirty();
  }, [activeSelection, selectedLayerId, selectedLayerIds, activeDocumentId, currentDataUrl, currentWidth, currentHeight, handleDeleteSelectedPixels, pushHistory, markActiveDocDirty]);

  const handlePasteLayers = useCallback(() => {
    if (!clipboardRef.current) return;

    // A. Paste Pixel Selection
    if (clipboardRef.current.type === 'pixel-selection') {
      const isSameDoc = clipboardRef.current.sourceDocId === activeDocumentId;
      const targetW = currentWidth || 800;
      const targetH = currentHeight || 600;
      const newLayer = {
        id: 'layer_' + Date.now(),
        name: 'Pasted Selection',
        type: 'image',
        dataUrl: clipboardRef.current.dataUrl,
        width: clipboardRef.current.width,
        height: clipboardRef.current.height,
        x: isSameDoc ? clipboardRef.current.x + 16 : Math.max(0, Math.round((targetW - clipboardRef.current.width) / 2)),
        y: isSameDoc ? clipboardRef.current.y + 16 : Math.max(0, Math.round((targetH - clipboardRef.current.height) / 2)),
        opacity: 100,
        blendMode: 'normal',
        visible: true,
      };

      const nextLayers = [...layersRef.current, newLayer];
      layersRef.current = nextLayers;
      setLayers(nextLayers);
      setSelectedLayerId(newLayer.id);
      setSelectedLayerIds([newLayer.id]);
      pushHistory(null, nextLayers, 'Paste Pixel Selection');
      markActiveDocDirty();
      return;
    }

    // B. Paste Layers
    if (!clipboardRef.current.layers) return;
    const isSameDoc = clipboardRef.current.sourceDocId === activeDocumentId;
    const targetW = currentWidth || 800;
    const targetH = currentHeight || 600;

    const pastedLayers = clipboardRef.current.layers.map((srcL, idx) => {
      const newL = cloneLayerData(srcL);
      if (isSameDoc) {
        newL.x = (newL.x || 0) + 24;
        newL.y = (newL.y || 0) + 24;
      } else {
        const w = newL.width || 100;
        const h = newL.height || 100;
        newL.x = Math.max(10, Math.round((targetW - w) / 2) + idx * 10);
        newL.y = Math.max(10, Math.round((targetH - h) / 2) + idx * 10);
      }
      return newL;
    });

    const nextLayers = [...layersRef.current, ...pastedLayers];
    layersRef.current = nextLayers;
    setLayers(nextLayers);
    setSelectedLayerId(pastedLayers[pastedLayers.length - 1].id);
    setSelectedLayerIds(pastedLayers.map((l) => l.id));
    pushHistory(null, nextLayers, `Paste ${pastedLayers.length} Layer(s)`);
    markActiveDocDirty();
  }, [activeDocumentId, currentWidth, currentHeight, pushHistory, markActiveDocDirty]);

  const handleCopyMerged = useCallback(() => {
    if (!activeCanvas) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = currentWidth;
    offscreen.height = currentHeight;
    const ctx = offscreen.getContext('2d');
    ctx.drawImage(activeCanvas, 0, 0);

    const mergedLayer = {
      id: generateLayerId(),
      name: 'Merged Copy',
      type: 'image',
      dataUrl: offscreen.toDataURL('image/png'),
      x: 0,
      y: 0,
      width: currentWidth,
      height: currentHeight,
      origWidth: currentWidth,
      origHeight: currentHeight,
      opacity: 100,
      rotation: 0,
      locked: false,
      hidden: false,
      isBackground: false,
    };

    clipboardRef.current = {
      type: 'layers',
      sourceDocId: activeDocumentId,
      layers: [mergedLayer],
    };
  }, [activeCanvas, currentWidth, currentHeight, activeDocumentId]);

  // Text Draft Lifecycle Helpers
  const commitOrDiscardDraft = useCallback(() => {
    const draft = activeTextDraftRef.current;
    if (!draft) return null;
    activeTextDraftRef.current = null;
    setActiveTextDraft(null);

    const trimmed = (draft.text || '').trim();
    if (!trimmed) {
      // Discard: User entered no text or whitespace only. Do NOT create layer.
      return null;
    }

    const newId = 'text_' + Date.now();
    const firstLine = trimmed.split('\n')[0].trim();
    const layerName = firstLine.length > 25 ? firstLine.slice(0, 25) + '...' : firstLine;
    const newTextLayer = {
      id: newId,
      name: layerName,
      type: 'text',
      text: draft.text,
      placeholder: '',
      x: draft.x,
      y: draft.y,
      width: draft.width,
      height: draft.height,
      autoWidth: draft.autoWidth,
      fontFamily: draft.fontFamily,
      fontSize: draft.fontSize,
      fontWeight: draft.fontWeight,
      fontStyle: draft.fontStyle,
      underline: draft.underline,
      color: draft.color,
      align: draft.align,
      bgColor: draft.bgColor,
      strokeColor: draft.strokeColor,
      strokeWidth: draft.strokeWidth,
      shadowColor: draft.shadowColor,
      shadowBlur: draft.shadowBlur,
      shadowOffsetX: draft.shadowOffsetX,
      shadowOffsetY: draft.shadowOffsetY,
      letterSpacing: draft.letterSpacing,
      lineHeight: draft.lineHeight,
      locked: false,
      hidden: false,
      opacity: draft.opacity,
      rotation: draft.rotation,
    };

    const current = layersRef.current || [];
    const nextLayers = [...current, newTextLayer];
    layersRef.current = nextLayers;
    setLayers(nextLayers);
    setSelectedLayerId(newId);
    setSelectedLayerIds([newId]);
    pushHistory(null, nextLayers, draft.isParagraph ? 'Create Paragraph Text' : 'Create Text Layer');
    return newId;
  }, [pushHistory]);

  const discardDraft = useCallback(() => {
    activeTextDraftRef.current = null;
    setActiveTextDraft(null);
  }, []);

  const handleUpdateDraftText = useCallback((val) => {
    setActiveTextDraft((prev) => {
      if (!prev) return null;
      const textDims = calculateTextDimensions(val || 'M', {
        fontSize: prev.fontSize,
        fontFamily: prev.fontFamily,
        fontWeight: prev.fontWeight,
        fontStyle: prev.fontStyle,
        letterSpacing: prev.letterSpacing,
        lineHeight: prev.lineHeight,
        width: prev.width,
        autoWidth: prev.autoWidth,
        maxCanvasWidth: Math.max(100, (currentWidth || 1000) - prev.x - 20),
      });
      const updated = {
        ...prev,
        text: val,
        width: prev.autoWidth ? Math.max(textDims.width, 24) : prev.width,
        height: Math.max(textDims.height, Math.round(prev.fontSize * 1.2)),
      };
      activeTextDraftRef.current = updated;
      return updated;
    });
  }, [currentWidth]);

  const handleUpdateTextSettings = useCallback((updater) => {
    setTextSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (activeTextDraftRef.current) {
        setActiveTextDraft((d) => (d ? { ...d, ...next } : null));
        activeTextDraftRef.current = activeTextDraftRef.current ? { ...activeTextDraftRef.current, ...next } : null;
      }
      return next;
    });
  }, []);

  const handleUpdateLayer = useCallback(
    (id, updates, commitHistory = false) => {
      if (activeTextDraftRef.current && (!id || id === 'draft' || id === activeTextDraftRef.current.id)) {
        setActiveTextDraft((d) => (d ? { ...d, ...updates } : null));
        activeTextDraftRef.current = activeTextDraftRef.current ? { ...activeTextDraftRef.current, ...updates } : null;
        return;
      }

      const current = layersRef.current || [];
      const targetLayer = current.find((l) => l.id === id);

      let finalUpdates = { ...updates };
      if (targetLayer && targetLayer.type === 'text') {
        const merged = { ...targetLayer, ...updates };
        const textToMeasure = (merged.text !== undefined ? merged.text : targetLayer.text) || '';
        const maxCanvasWidth = Math.max(100, (currentWidth || 1000) - (merged.x || 0) - 20);
        const textDims = calculateTextDimensions(textToMeasure || 'M', {
          fontSize: merged.fontSize,
          fontFamily: merged.fontFamily,
          fontWeight: merged.fontWeight,
          fontStyle: merged.fontStyle,
          letterSpacing: merged.letterSpacing,
          lineHeight: merged.lineHeight,
          width: merged.width,
          autoWidth: merged.autoWidth,
          maxCanvasWidth,
        });

        if (merged.autoWidth) {
          finalUpdates.width = Math.max(textDims.width, 24);
        }
        finalUpdates.height = updates.height !== undefined ? Math.max(textDims.height, updates.height) : textDims.height;
      }

      const nextLayers = current.map((l) =>
        l.id === id ? { ...l, ...finalUpdates } : l
      );
      layersRef.current = nextLayers;
      setLayers(nextLayers);
      if (commitHistory) {
        pushHistory(null, nextLayers, 'Update Layer');
      }
    },
    [pushHistory, currentWidth]
  );

  // Text Editing lifecycle helpers
  const startEditingText = useCallback((layerId) => {
    if (!layerId) return;
    commitOrDiscardDraft();

    const current = layersRef.current || [];
    const layer = current.find((l) => l.id === layerId);
    if (layer) {
      editingOriginalTextRef.current[layerId] = layer.text ?? '';
      setSelectedLayerId(layerId);
      setSelectedLayerIds([layerId]);
      setEditingTextLayerId(layerId);
    }
  }, [commitOrDiscardDraft]);

  const finishEditingText = useCallback(
    (layerId) => {
      commitOrDiscardDraft();

      setEditingTextLayerId((currentEditingId) => {
        const targetId = layerId || currentEditingId;
        if (!targetId) return null;
        const current = layersRef.current || [];
        const layer = current.find((l) => l.id === targetId);
        if (layer) {
          const trimmed = (layer.text || '').trim();
          if (!trimmed) {
            // Delete empty layer!
            const nextLayers = current.filter((l) => l.id !== targetId);
            layersRef.current = nextLayers;
            setLayers(nextLayers);
            setSelectedLayerId(null);
            setSelectedLayerIds([]);
            pushHistory(null, nextLayers, 'Delete Empty Text Layer');
            return null;
          }

          const origText = editingOriginalTextRef.current[targetId];
          if (layer.text !== origText) {
            const firstLine = trimmed.split('\n')[0].trim();
            const layerName = firstLine.length > 25 ? firstLine.slice(0, 25) + '...' : firstLine;
            const updated = current.map((l) => (l.id === targetId ? { ...l, name: layerName } : l));
            layersRef.current = updated;
            setLayers(updated);
            pushHistory(null, updated, 'Edit Text');
          }
        }
        return null;
      });
    },
    [commitOrDiscardDraft, pushHistory]
  );

  const cancelEditingText = useCallback(
    (layerId) => {
      discardDraft();

      const targetId = layerId || editingTextLayerId;
      if (!targetId) {
        setEditingTextLayerId(null);
        return;
      }
      const origText = editingOriginalTextRef.current[targetId];
      const current = layersRef.current || [];
      const layer = current.find((l) => l.id === targetId);
      if (origText !== undefined) {
        const trimmedOrig = (origText || '').trim();
        const trimmedCurrent = (layer?.text || '').trim();
        if (!trimmedOrig && !trimmedCurrent) {
          // If empty text was cancelled without typing, remove it cleanly
          const nextLayers = current.filter((l) => l.id !== targetId);
          layersRef.current = nextLayers;
          setLayers(nextLayers);
          setSelectedLayerId(null);
          setSelectedLayerIds([]);
        } else if (layer && origText !== layer.text) {
          handleUpdateLayer(targetId, { text: origText });
        }
      }
      setEditingTextLayerId(null);
    },
    [discardDraft, editingTextLayerId, handleUpdateLayer]
  );

  commitOrDiscardDraftRef.current = commitOrDiscardDraft;
  finishEditingTextRef.current = finishEditingText;

  useEffect(() => {
    if (editingTextLayerId || activeTextDraft) {
      const timer = setTimeout(() => {
        const el =
          textEditorRef.current || document.querySelector('[data-text-editor="true"]');
        if (el) {
          el.focus();
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      }, 15);
      return () => clearTimeout(timer);
    }
  }, [editingTextLayerId, activeTextDraft]);

  // Cleanup any legacy empty text layers from broken placeholder workflow
  useEffect(() => {
    const current = layersRef.current || [];
    const hasEmptyTextLayers = current.some(
      (l) =>
        l.type === 'text' &&
        l.id !== editingTextLayerId &&
        (!l.text ||
          !l.text.trim() ||
          l.text === 'Type text here...' ||
          l.text === 'Type your text here' ||
          l.text === 'Type paragraph text here...')
    );
    if (hasEmptyTextLayers) {
      const cleaned = current.filter(
        (l) =>
          !(
            l.type === 'text' &&
            l.id !== editingTextLayerId &&
            (!l.text ||
              !l.text.trim() ||
              l.text === 'Type text here...' ||
              l.text === 'Type your text here' ||
              l.text === 'Type paragraph text here...')
          )
      );
      layersRef.current = cleaned;
      setLayers(cleaned);
      if (selectedLayerId && !cleaned.some((l) => l.id === selectedLayerId)) {
        const nextId = cleaned[cleaned.length - 1]?.id || null;
        setSelectedLayerId(nextId);
        setSelectedLayerIds(nextId ? [nextId] : []);
      }
    }
  }, [layers, editingTextLayerId, selectedLayerId]);

  const handleSelectLayers = useCallback((ids) => {
    setSelectedLayerIds(ids);
    setSelectedLayerId(ids[ids.length - 1] || null);
  }, []);

  const handleSelectLayer = useCallback((layerId, isMulti = false, isRange = false) => {
    if (!layerId) {
      setSelectedLayerId(null);
      setSelectedLayerIds([]);
      return;
    }
    if (isRange && selectedLayerId) {
      const list = layersRef.current;
      const idx1 = list.findIndex((l) => l.id === selectedLayerId);
      const idx2 = list.findIndex((l) => l.id === layerId);
      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        const rangeIds = list.slice(start, end + 1).map((l) => l.id);
        setSelectedLayerIds(rangeIds);
        setSelectedLayerId(layerId);
        return;
      }
    }
    if (isMulti) {
      setSelectedLayerIds((prev) => {
        if (prev.includes(layerId)) {
          const next = prev.filter((id) => id !== layerId);
          setSelectedLayerId(next[next.length - 1] || null);
          return next;
        } else {
          const next = [...prev, layerId];
          setSelectedLayerId(layerId);
          return next;
        }
      });
      return;
    }
    setSelectedLayerId(layerId);
    setSelectedLayerIds([layerId]);
  }, [selectedLayerId]);

  const handleDeleteLayer = useCallback(
    (id) => {
      const nextLayers = layersRef.current.filter((l) => l.id !== id);
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      pushHistory(null, nextLayers, 'Delete Layer');
      setSelectedLayerId((cur) => (cur === id ? null : cur));
      setSelectedLayerIds((cur) => cur.filter((x) => x !== id));
    },
    [pushHistory]
  );

  const handleDeleteSelectedLayers = useCallback(() => {
    const ids = selectedLayerIds.length > 0 ? selectedLayerIds : selectedLayerId ? [selectedLayerId] : [];
    if (ids.length === 0) return;
    const nextLayers = layersRef.current.filter((l) => !ids.includes(l.id));
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerIds([]);
    setSelectedLayerId(null);
    pushHistory(null, nextLayers, `Delete ${ids.length} Layers`);
  }, [selectedLayerIds, selectedLayerId, pushHistory]);

  const handleDuplicateLayer = useCallback(
    (id) => {
      const layer = layersRef.current.find((l) => l.id === id);
      if (!layer) return;

      const idx = layersRef.current.findIndex((l) => l.id === id);
      const newLayer = {
        ...layer,
        id: (layer.type || 'layer') + '_' + Date.now(),
        name: `${layer.name || 'Layer'} (Copy)`,
        x: Math.round(layer.x + 24),
        y: Math.round(layer.y + 24),
      };

      const nextLayers = [...layersRef.current];
      nextLayers.splice(idx + 1, 0, newLayer);
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      setSelectedLayerId(newLayer.id);
      setSelectedLayerIds([newLayer.id]);
      pushHistory(null, nextLayers, 'Duplicate Layer');
    },
    [pushHistory]
  );

  const handleDuplicateSelectedLayers = useCallback(() => {
    const ids = selectedLayerIds.length > 0 ? selectedLayerIds : selectedLayerId ? [selectedLayerId] : [];
    if (ids.length === 0) return;
    const newLayers = [];
    const newIds = [];
    layersRef.current.forEach((layer) => {
      newLayers.push(layer);
      if (ids.includes(layer.id)) {
        const dupId = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const dup = {
          ...layer,
          id: dupId,
          name: `${layer.name || 'Layer'} Copy`,
          x: (layer.x || 0) + 20,
          y: (layer.y || 0) + 20,
        };
        newLayers.push(dup);
        newIds.push(dupId);
      }
    });
    setLayers(newLayers);
    layersRef.current = newLayers;
    setSelectedLayerIds(newIds);
    setSelectedLayerId(newIds[newIds.length - 1] || null);
    pushHistory(null, newLayers, `Duplicate ${ids.length} Layers`);
  }, [selectedLayerIds, selectedLayerId, pushHistory]);

  const handleAlignSelectedLayers = useCallback((mode) => {
    const ids = selectedLayerIds.length > 0 ? selectedLayerIds : selectedLayerId ? [selectedLayerId] : [];
    if (ids.length === 0) return;
    const currentLayers = layersRef.current;
    const targetLayers = currentLayers.filter((l) => ids.includes(l.id));
    if (targetLayers.length === 0) return;

    if (targetLayers.length === 1) {
      const layer = targetLayers[0];
      const lW = layer.width || 100;
      const lH = layer.height || 100;
      const cW = currentWidth || 800;
      const cH = currentHeight || 600;
      let newX = layer.x;
      let newY = layer.y;
      if (mode === 'left') newX = 0;
      else if (mode === 'center-h') newX = Math.round((cW - lW) / 2);
      else if (mode === 'right') newX = Math.round(cW - lW);
      else if (mode === 'top') newY = 0;
      else if (mode === 'middle-v') newY = Math.round((cH - lH) / 2);
      else if (mode === 'bottom') newY = Math.round(cH - lH);
      handleUpdateLayer(layer.id, { x: newX, y: newY }, true);
      return;
    }

    const minX = Math.min(...targetLayers.map((l) => l.x || 0));
    const minY = Math.min(...targetLayers.map((l) => l.y || 0));
    const maxX = Math.max(...targetLayers.map((l) => (l.x || 0) + (l.width || 0)));
    const maxY = Math.max(...targetLayers.map((l) => (l.y || 0) + (l.height || 0)));
    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    const nextLayers = currentLayers.map((layer) => {
      if (!ids.includes(layer.id) || layer.locked) return layer;
      const lW = layer.width || 0;
      const lH = layer.height || 0;
      let newX = layer.x;
      let newY = layer.y;
      if (mode === 'left') newX = minX;
      else if (mode === 'center-h') newX = Math.round(centerX - lW / 2);
      else if (mode === 'right') newX = Math.round(maxX - lW);
      else if (mode === 'top') newY = minY;
      else if (mode === 'middle-v') newY = Math.round(centerY - lH / 2);
      else if (mode === 'bottom') newY = Math.round(maxY - lH);
      return { ...layer, x: newX, y: newY };
    });

    setLayers(nextLayers);
    layersRef.current = nextLayers;
    pushHistory(null, nextLayers, `Align Layers (${mode})`);
  }, [selectedLayerIds, selectedLayerId, currentWidth, currentHeight, handleUpdateLayer, pushHistory]);

  const handleDistributeSelectedLayers = useCallback((axis) => {
    const ids = selectedLayerIds.length > 1 ? selectedLayerIds : [];
    if (ids.length < 3) return;
    const currentLayers = layersRef.current;
    const targetLayers = currentLayers.filter((l) => ids.includes(l.id));
    if (targetLayers.length < 3) return;

    if (axis === 'horizontal') {
      const sorted = [...targetLayers].sort((a, b) => (a.x || 0) - (b.x || 0));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalDist = (last.x || 0) + (last.width || 0) - (first.x || 0);
      const sumWidths = sorted.reduce((sum, l) => sum + (l.width || 0), 0);
      const remainingSpace = totalDist - sumWidths;
      const gap = remainingSpace / (sorted.length - 1);

      let curX = first.x || 0;
      const newPositions = {};
      sorted.forEach((l, i) => {
        if (i === 0) {
          newPositions[l.id] = curX;
          curX += (l.width || 0) + gap;
        } else {
          newPositions[l.id] = Math.round(curX);
          curX += (l.width || 0) + gap;
        }
      });

      const nextLayers = currentLayers.map((l) =>
        newPositions[l.id] !== undefined ? { ...l, x: newPositions[l.id] } : l
      );
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      pushHistory(null, nextLayers, 'Distribute Layers Horizontally');
    }
  }, [selectedLayerIds, pushHistory]);

  const handleMergeLayers = useCallback(async () => {
    let ids = selectedLayerIds.length > 1 ? [...selectedLayerIds] : selectedLayerId ? [selectedLayerId] : [];
    if (ids.length < 2) {
      if (ids.length === 1) {
        const idx = layersRef.current.findIndex((l) => l.id === ids[0]);
        if (idx > 0) {
          ids = [layersRef.current[idx - 1].id, ids[0]];
        } else {
          return;
        }
      } else {
        return;
      }
    }

    const currentLayers = layersRef.current;
    const targetLayers = currentLayers.filter((l) => ids.includes(l.id));
    if (targetLayers.length < 2) return;

    const minX = Math.min(...targetLayers.map((l) => l.x || 0));
    const minY = Math.min(...targetLayers.map((l) => l.y || 0));
    const maxX = Math.max(...targetLayers.map((l) => (l.x || 0) + (l.width || 0)));
    const maxY = Math.max(...targetLayers.map((l) => (l.y || 0) + (l.height || 0)));
    const mergeW = Math.max(1, maxX - minX);
    const mergeH = Math.max(1, maxY - minY);

    const mergeCanvas = document.createElement('canvas');
    mergeCanvas.width = mergeW;
    mergeCanvas.height = mergeH;
    const mCtx = mergeCanvas.getContext('2d');

    const loaded = await Promise.all(
      targetLayers.map((l) => {
        const dataUrl = l.dataUrl || (l.id === 'background' ? currentDataUrl : null);
        if (dataUrl) {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ id: l.id, img });
            img.onerror = () => resolve({ id: l.id, img: null });
            img.src = dataUrl;
          });
        }
        return Promise.resolve(null);
      })
    );
    const imgMap = {};
    loaded.forEach((item) => {
      if (item && item.img) imgMap[item.id] = item.img;
    });

    targetLayers.forEach((layer) => {
      mCtx.save();
      const lx = (layer.x || 0) - minX;
      const ly = (layer.y || 0) - minY;
      const lw = layer.width || mergeW;
      const lh = layer.height || mergeH;
      mCtx.translate(lx + lw / 2, ly + lh / 2);
      if (layer.rotation) mCtx.rotate((layer.rotation * Math.PI) / 180);
      mCtx.globalAlpha = (layer.opacity || 100) / 100;
      if (layer.blendMode && layer.blendMode !== 'normal') {
        mCtx.globalCompositeOperation = layer.blendMode;
      }
      if (layer.type === 'shape') {
        drawShapeOnCanvas(mCtx, layer, -lw / 2, -lh / 2, lw, lh);
      } else if (layer.type === 'text') {
        drawTextOnCanvas(mCtx, layer, -lw / 2, -lh / 2, lw, lh);
      } else if (imgMap[layer.id]) {
        mCtx.drawImage(imgMap[layer.id], -lw / 2, -lh / 2, lw, lh);
      }
      mCtx.restore();
    });

    const mergedDataUrl = mergeCanvas.toDataURL('image/png');
    const mergedId = `layer-${Date.now()}`;
    const mergedLayer = {
      id: mergedId,
      name: 'Merged Layer',
      type: 'image',
      x: minX,
      y: minY,
      width: mergeW,
      height: mergeH,
      dataUrl: mergedDataUrl,
      opacity: 100,
      locked: false,
      hidden: false,
    };

    const lowestIdx = Math.min(...targetLayers.map((l) => currentLayers.indexOf(l)));
    const nextLayers = currentLayers.filter((l) => !ids.includes(l.id));
    nextLayers.splice(lowestIdx, 0, mergedLayer);

    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerIds([mergedId]);
    setSelectedLayerId(mergedId);
    pushHistory(null, nextLayers, 'Merge Layers');
  }, [selectedLayerIds, selectedLayerId, currentDataUrl, pushHistory]);

  const handleToggleClippingMask = useCallback((layerOrId) => {
    const layerId = typeof layerOrId === 'object' && layerOrId !== null ? layerOrId.id : layerOrId;
    const idx = layersRef.current.findIndex((l) => l.id === layerId);
    if (idx <= 0) return;
    const nextLayers = layersRef.current.map((l) =>
      l.id === layerId ? { ...l, clippingMask: !l.clippingMask } : l
    );
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    const isClipped = nextLayers[idx].clippingMask;
    pushHistory(null, nextLayers, isClipped ? 'Create Clipping Mask' : 'Release Clipping Mask');
  }, [pushHistory]);

  const handleSelectMaskTarget = useCallback((layerId, target) => {
    if (target === 'mask') {
      setActiveMaskLayerId(layerId);
      setSelectedLayerId(layerId);
      setSelectedLayerIds([layerId]);
    } else {
      setActiveMaskLayerId(null);
    }
  }, []);

  const handleAddLayerMask = useCallback((layerOrId, mode = 'reveal-all') => {
    const layerId = typeof layerOrId === 'object' && layerOrId !== null ? layerOrId.id : layerOrId;
    const layer = layersRef.current.find((l) => l.id === layerId);
    if (!layer) return;
    const w = layer.width || currentWidth || 800;
    const h = layer.height || currentHeight || 600;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const mCtx = maskCanvas.getContext('2d');

    if (mode === 'hide-all') {
      mCtx.fillStyle = '#000000';
      mCtx.fillRect(0, 0, w, h);
    } else if (mode === 'reveal-selection' && activeSelection) {
      mCtx.fillStyle = '#000000';
      mCtx.fillRect(0, 0, w, h);
      mCtx.fillStyle = '#ffffff';
      const relX = activeSelection.x - (layer.x || 0);
      const relY = activeSelection.y - (layer.y || 0);
      if (activeSelection.type === 'rect') {
        mCtx.fillRect(relX, relY, activeSelection.width, activeSelection.height);
      } else if (activeSelection.type === 'ellipse') {
        mCtx.beginPath();
        mCtx.ellipse(
          relX + activeSelection.width / 2,
          relY + activeSelection.height / 2,
          activeSelection.width / 2,
          activeSelection.height / 2,
          0,
          0,
          Math.PI * 2
        );
        mCtx.fill();
      } else if (activeSelection.points) {
        mCtx.beginPath();
        activeSelection.points.forEach((pt, i) => {
          const px = pt.x - (layer.x || 0);
          const py = pt.y - (layer.y || 0);
          if (i === 0) mCtx.moveTo(px, py);
          else mCtx.lineTo(px, py);
        });
        mCtx.closePath();
        mCtx.fill();
      }
    } else if (mode === 'hide-selection' && activeSelection) {
      mCtx.fillStyle = '#ffffff';
      mCtx.fillRect(0, 0, w, h);
      mCtx.fillStyle = '#000000';
      const relX = activeSelection.x - (layer.x || 0);
      const relY = activeSelection.y - (layer.y || 0);
      if (activeSelection.type === 'rect') {
        mCtx.fillRect(relX, relY, activeSelection.width, activeSelection.height);
      } else if (activeSelection.type === 'ellipse') {
        mCtx.beginPath();
        mCtx.ellipse(
          relX + activeSelection.width / 2,
          relY + activeSelection.height / 2,
          activeSelection.width / 2,
          activeSelection.height / 2,
          0,
          0,
          Math.PI * 2
        );
        mCtx.fill();
      }
    } else {
      mCtx.fillStyle = '#ffffff';
      mCtx.fillRect(0, 0, w, h);
    }

    const maskDataUrl = maskCanvas.toDataURL('image/png');
    const nextLayers = layersRef.current.map((l) =>
      l.id === layerId ? { ...l, mask: { enabled: true, dataUrl: maskDataUrl } } : l
    );
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setActiveMaskLayerId(layerId);
    pushHistory(null, nextLayers, 'Add Layer Mask');
  }, [currentWidth, currentHeight, activeSelection, pushHistory]);

  const handleDeleteLayerMask = useCallback((layerId) => {
    const nextLayers = layersRef.current.map((l) =>
      l.id === layerId ? { ...l, mask: null } : l
    );
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    if (activeMaskLayerId === layerId) {
      setActiveMaskLayerId(null);
    }
    pushHistory(null, nextLayers, 'Delete Layer Mask');
  }, [activeMaskLayerId, pushHistory]);

  const handleOpenBlendingOptions = useCallback((layerOrId) => {
    const id = typeof layerOrId === 'object' && layerOrId !== null ? layerOrId.id : layerOrId;
    const layer = layersRef.current.find((l) => l.id === id) || (typeof layerOrId === 'object' ? layerOrId : null);
    if (layer) {
      setActiveBlendingLayer(layer);
    }
  }, []);

  const handleCloseBlendingOptions = useCallback(() => {
    setActiveBlendingLayer(null);
  }, []);

  const handleApplyBlendingOptions = useCallback((newStyles) => {
    if (!activeBlendingLayer) return;
    const layerId = activeBlendingLayer.id;
    const nextLayers = layersRef.current.map((l) =>
      l.id === layerId
        ? {
          ...l,
          blendMode: newStyles.blendMode || l.blendMode || 'normal',
          opacity: newStyles.opacity ?? l.opacity ?? 100,
          fillOpacity: newStyles.fillOpacity ?? 100,
          styles: { ...l.styles, ...newStyles },
        }
        : l
    );
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setActiveBlendingLayer(null);
    pushHistory(null, nextLayers, 'Blending Options');
  }, [activeBlendingLayer, pushHistory]);

  const handleLivePreviewBlending = useCallback((newStyles) => {
    if (!activeBlendingLayer) return;
    const layerId = activeBlendingLayer.id;
    const nextLayers = layersRef.current.map((l) =>
      l.id === layerId
        ? {
          ...l,
          blendMode: newStyles.blendMode || l.blendMode || 'normal',
          opacity: newStyles.opacity ?? l.opacity ?? 100,
          fillOpacity: newStyles.fillOpacity ?? 100,
          styles: { ...l.styles, ...newStyles },
        }
        : l
    );
    setLayers(nextLayers);
    layersRef.current = nextLayers;
  }, [activeBlendingLayer]);

  const handleOpenFilter = useCallback((filterItem) => {
    if (!selectedLayerId) {
      setError('Please select an image layer first to apply filters.');
      return;
    }
    const layer = layersRef.current.find((l) => l.id === selectedLayerId);
    const dataUrl = layer?.dataUrl || (layer?.id === 'background' ? currentDataUrl : null);
    if (!dataUrl) {
      setError('Filters can only be applied to image or raster layers.');
      return;
    }
    setActiveFilterDialog(filterItem);
  }, [selectedLayerId, currentDataUrl]);

  const handleCloseFilter = useCallback(() => {
    setActiveFilterDialog(null);
  }, []);

  const handleApplyFilter = useCallback(async (filterItem, paramVal) => {
    if (!selectedLayerId || !activeFilterDialog) return;
    const layer = layersRef.current.find((l) => l.id === selectedLayerId);
    const originalUrl = layer?.dataUrl || (layer?.id === 'background' ? currentDataUrl : null);
    if (!originalUrl) return;

    const filteredUrl = await applyFilter(originalUrl, filterItem.type, paramVal);
    const nextLayers = layersRef.current.map((l) =>
      l.id === selectedLayerId ? { ...l, type: 'image', dataUrl: filteredUrl } : l
    );
    if (selectedLayerId === 'background') {
      setCurrentDataUrl(filteredUrl);
    }
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setActiveFilterDialog(null);
    pushHistory(null, nextLayers, `Filter: ${filterItem.label}`);
  }, [selectedLayerId, activeFilterDialog, currentDataUrl, pushHistory]);

  const handleLivePreviewFilter = useCallback(async (filterItem, paramVal) => {
    if (!selectedLayerId) return;
    const layer = layersRef.current.find((l) => l.id === selectedLayerId);
    const originalUrl = layer?.dataUrl || (layer?.id === 'background' ? currentDataUrl : null);
    if (!originalUrl) return;

    if (paramVal === null) return;
    const filteredUrl = await applyFilter(originalUrl, filterItem.type, paramVal);
    const nextLayers = layersRef.current.map((l) =>
      l.id === selectedLayerId ? { ...l, dataUrl: filteredUrl } : l
    );
    if (selectedLayerId === 'background') {
      setCurrentDataUrl(filteredUrl);
    }
    setLayers(nextLayers);
    layersRef.current = nextLayers;
  }, [selectedLayerId, currentDataUrl]);

  const handleDeselect = useCallback(() => {
    setActiveSelection(null);
  }, []);

  const handleInvertSelection = useCallback(() => {
    if (!activeSelection) return;
    setActiveSelection((prev) => ({
      ...prev,
      inverted: !prev.inverted,
    }));
  }, [activeSelection]);

  const handleSelectAll = useCallback(() => {
    setActiveSelection({
      type: 'rect',
      x: 0,
      y: 0,
      width: currentWidth || 800,
      height: currentHeight || 600,
      feather: selectionFeather,
    });
  }, [currentWidth, currentHeight, selectionFeather]);

  const handleConvertSelectionToMask = useCallback(() => {
    if (!activeSelection || !selectedLayerId) return;
    handleAddLayerMask(selectedLayerId, 'reveal-selection');
  }, [activeSelection, selectedLayerId, handleAddLayerMask]);

  const handleMagicWandClick = useCallback(async (clickX, clickY) => {
    if (!selectedLayerId) return;
    const layer = layersRef.current.find((l) => l.id === selectedLayerId);
    const dataUrl = layer?.dataUrl || (layer?.id === 'background' ? currentDataUrl : null);
    if (!dataUrl) return;

    const layerW = Math.round(layer.width || currentWidth || 800);
    const layerH = Math.round(layer.height || currentHeight || 600);
    const relX = clickX - (layer.x || 0);
    const relY = clickY - (layer.y || 0);

    if (relX < 0 || relY < 0 || relX >= layerW || relY >= layerH) return;

    const off = document.createElement('canvas');
    off.width = layerW;
    off.height = layerH;
    const ctx = off.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, layerW, layerH);
      const sel = magicWandSelect(ctx, relX, relY, selectionTolerance);
      if (sel && sel.points && sel.points.length > 2) {
        const canvasPoints = sel.points.map((p) => ({
          x: p.x + (layer.x || 0),
          y: p.y + (layer.y || 0),
        }));
        setActiveSelection({
          type: 'polygon',
          points: canvasPoints,
          x: sel.x + (layer.x || 0),
          y: sel.y + (layer.y || 0),
          width: sel.width,
          height: sel.height,
          feather: selectionFeather,
        });
      }
    };
    img.src = dataUrl;
  }, [selectedLayerId, currentDataUrl, currentWidth, currentHeight, selectionTolerance, selectionFeather]);

  const penPathRef = useRef(null);
  penPathRef.current = penPath;
  const selectedLayerRef = useRef(null);
  selectedLayerRef.current = selectedLayer;
  const selectedVectorNodeIndexRef = useRef(null);
  selectedVectorNodeIndexRef.current = selectedVectorNodeIndex;
  const handleMakeSelectionFromPenRef = useRef(null);
  const handleDeleteVectorNodeRef = useRef(null);
  const handleConvertNodeTypeRef = useRef(null);

  const handleMakeSelectionFromPen = useCallback(() => {
    let pts = [];
    const curPen = penPathRef.current;
    const curLayer = selectedLayerRef.current;
    if (curPen?.points?.length >= 3) {
      pts = samplePolygonFromPoints(curPen.points, true, 8);
      setPenPath(null);
    } else if (curLayer?.type === 'shape') {
      const shapePoints = curLayer.points || convertShapeLayerToVectorPoints(curLayer);
      const ox = curLayer.x || 0;
      const oy = curLayer.y || 0;
      const docPoints = shapePoints.map((p) => ({
        x: ox + p.x,
        y: oy + p.y,
        cp1: p.cp1 ? { x: ox + p.cp1.x, y: oy + p.cp1.y } : undefined,
        cp2: p.cp2 ? { x: ox + p.cp2.x, y: oy + p.cp2.y } : undefined,
      }));
      pts = samplePolygonFromPoints(docPoints, true, 8);
    } else {
      return;
    }

    if (!pts || pts.length < 3) return;

    const minX = Math.min(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxX = Math.max(...pts.map((p) => p.x));
    const maxY = Math.max(...pts.map((p) => p.y));

    setActiveSelection({
      type: 'polygon',
      points: pts,
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      feather: 0,
    });
  }, []);

  const handleClosePenPath = useCallback((customPoints = null) => {
    const rawPoints = customPoints || penPath?.points;
    if (!rawPoints || rawPoints.length < 3) return;

    const minX = Math.min(...rawPoints.map((p) => p.x));
    const minY = Math.min(...rawPoints.map((p) => p.y));
    const maxX = Math.max(...rawPoints.map((p) => p.x));
    const maxY = Math.max(...rawPoints.map((p) => p.y));
    const shapeW = Math.max(10, maxX - minX);
    const shapeH = Math.max(10, maxY - minY);

    const layerPoints = rawPoints.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
      cp1: p.cp1 ? { x: p.cp1.x - minX, y: p.cp1.y - minY } : undefined,
      cp2: p.cp2 ? { x: p.cp2.x - minX, y: p.cp2.y - minY } : undefined,
      type: p.type || (p.cp1 && p.cp2 ? 'smooth' : 'corner'),
    }));

    const pathData = generateSvgPath(layerPoints, true);
    const newShapeId = `layer-${Date.now()}`;
    const newShape = {
      id: newShapeId,
      name: `Vector Shape ${layersRef.current.filter((l) => l.type === 'shape').length + 1}`,
      type: 'shape',
      shapeType: 'custom-path',
      pathData,
      points: layerPoints,
      closed: true,
      x: minX,
      y: minY,
      width: shapeW,
      height: shapeH,
      fillColor: penFillColor || foregroundColor || '#c084fc',
      strokeColor: penStrokeColor || '#7c3aed',
      strokeWidth: penStrokeWidth ?? 2,
      opacity: 100,
      blendMode: 'normal',
      locked: false,
      hidden: false,
    };

    const nextLayers = [...layersRef.current, newShape];
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newShapeId);
    setSelectedLayerIds([newShapeId]);
    setPenPath(null);
    setSelectedVectorNodeIndex(0);
    setPenHoverMode('pen');
    pushHistory(null, nextLayers, 'Create Vector Shape');
  }, [penPath, penFillColor, foregroundColor, penStrokeColor, penStrokeWidth, pushHistory]);

  const handleMakeShapeFromPen = useCallback(() => {
    if (penPath && penPath.points && penPath.points.length >= 3) {
      handleClosePenPath(penPath.points);
    }
  }, [penPath, handleClosePenPath]);

  const handleConvertNodeType = useCallback((nodeIdx, newType) => {
    const curLayer = selectedLayerRef.current;
    if (!curLayer || curLayer.type !== 'shape') return;
    const currentPoints = curLayer.points ? [...curLayer.points] : convertShapeLayerToVectorPoints(curLayer);
    if (!currentPoints[nodeIdx]) return;

    const pt = currentPoints[nodeIdx];
    const prevPt = currentPoints[(nodeIdx - 1 + currentPoints.length) % currentPoints.length];
    const nextPt = currentPoints[(nodeIdx + 1) % currentPoints.length];

    if (newType === 'corner') {
      currentPoints[nodeIdx] = {
        x: pt.x,
        y: pt.y,
        type: 'corner',
      };
    } else if (newType === 'smooth' || newType === 'symmetric') {
      const dx = nextPt.x - prevPt.x;
      const dy = nextPt.y - prevPt.y;
      const dist = Math.hypot(dx, dy) || 1;
      const handleLen = Math.max(15, Math.min(60, dist * 0.25));
      const nx = (dx / dist) * handleLen;
      const ny = (dy / dist) * handleLen;

      currentPoints[nodeIdx] = {
        x: pt.x,
        y: pt.y,
        type: newType,
        cp1: { x: Math.round(pt.x - nx), y: Math.round(pt.y - ny) },
        cp2: { x: Math.round(pt.x + nx), y: Math.round(pt.y + ny) },
      };
    }

    const pathData = generateSvgPath(currentPoints, true);
    const updated = { ...curLayer, points: currentPoints, pathData };
    const nextLayers = layersRef.current.map((l) => (l.id === curLayer.id ? updated : l));
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    pushHistory(null, nextLayers, `Convert Node to ${newType}`);
  }, [pushHistory]);

  const handleDeleteVectorNode = useCallback((nodeIdx) => {
    const curLayer = selectedLayerRef.current;
    if (!curLayer || curLayer.type !== 'shape') return;
    const currentPoints = curLayer.points ? [...curLayer.points] : convertShapeLayerToVectorPoints(curLayer);
    if (currentPoints.length <= 3) return;

    const targetIdx = nodeIdx !== undefined && nodeIdx !== null ? nodeIdx : selectedVectorNodeIndexRef.current;
    if (targetIdx === null || targetIdx === undefined || targetIdx < 0 || targetIdx >= currentPoints.length) return;

    const nextPoints = currentPoints.filter((_, i) => i !== targetIdx);
    const pathData = generateSvgPath(nextPoints, true);
    const updated = { ...curLayer, points: nextPoints, pathData };
    const nextLayers = layersRef.current.map((l) => (l.id === curLayer.id ? updated : l));
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedVectorNodeIndex(Math.min(targetIdx, nextPoints.length - 1));
    pushHistory(null, nextLayers, 'Delete Vector Node');
  }, [pushHistory]);

  const handleMakeMaskFromPen = useCallback(() => {
    if (!penPath || !penPath.points || penPath.points.length < 3 || !selectedLayerId) return;
    handleMakeSelectionFromPen();
    setTimeout(() => {
      handleAddLayerMask(selectedLayerId, 'reveal-selection');
    }, 50);
  }, [penPath, selectedLayerId, handleMakeSelectionFromPen, handleAddLayerMask]);

  const handleStrokePenPath = useCallback(() => {
    if (!penPath || !penPath.points || penPath.points.length < 2 || !selectedLayerId) return;
    const layer = layersRef.current.find((l) => l.id === selectedLayerId);
    const dataUrl = layer?.dataUrl || (layer?.id === 'background' ? currentDataUrl : null);
    if (!dataUrl) return;

    const w = layer.width || currentWidth || 800;
    const h = layer.height || currentHeight || 600;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      ctx.beginPath();
      penPath.points.forEach((pt, i) => {
        const rx = pt.x - (layer.x || 0);
        const ry = pt.y - (layer.y || 0);
        if (i === 0) ctx.moveTo(rx, ry);
        else if (pt.cp1 && pt.cp2) {
          ctx.bezierCurveTo(
            pt.cp1.x - (layer.x || 0),
            pt.cp1.y - (layer.y || 0),
            pt.cp2.x - (layer.x || 0),
            pt.cp2.y - (layer.y || 0),
            rx,
            ry
          );
        } else {
          ctx.lineTo(rx, ry);
        }
      });
      if (penPath.closed) ctx.closePath();
      ctx.strokeStyle = foregroundColor || '#7C3AED';
      ctx.lineWidth = brushSize ? Math.min(20, Math.max(2, brushSize / 2)) : 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      const resultUrl = off.toDataURL('image/png');
      const nextLayers = layersRef.current.map((l) =>
        l.id === selectedLayerId ? { ...l, type: 'image', dataUrl: resultUrl } : l
      );
      if (selectedLayerId === 'background') setCurrentDataUrl(resultUrl);
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      pushHistory(null, nextLayers, 'Stroke Pen Path');
    };
    img.src = dataUrl;
  }, [penPath, selectedLayerId, currentDataUrl, currentWidth, currentHeight, foregroundColor, brushSize, pushHistory]);

  const handleFillPenPath = useCallback(() => {
    if (!penPath || !penPath.points || penPath.points.length < 3 || !selectedLayerId) return;
    const layer = layersRef.current.find((l) => l.id === selectedLayerId);
    const dataUrl = layer?.dataUrl || (layer?.id === 'background' ? currentDataUrl : null);
    if (!dataUrl) return;

    const w = layer.width || currentWidth || 800;
    const h = layer.height || currentHeight || 600;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      ctx.beginPath();
      penPath.points.forEach((pt, i) => {
        const rx = pt.x - (layer.x || 0);
        const ry = pt.y - (layer.y || 0);
        if (i === 0) ctx.moveTo(rx, ry);
        else if (pt.cp1 && pt.cp2) {
          ctx.bezierCurveTo(
            pt.cp1.x - (layer.x || 0),
            pt.cp1.y - (layer.y || 0),
            pt.cp2.x - (layer.x || 0),
            pt.cp2.y - (layer.y || 0),
            rx,
            ry
          );
        } else {
          ctx.lineTo(rx, ry);
        }
      });
      ctx.closePath();
      ctx.fillStyle = foregroundColor || '#7C3AED';
      ctx.fill();

      const resultUrl = off.toDataURL('image/png');
      const nextLayers = layersRef.current.map((l) =>
        l.id === selectedLayerId ? { ...l, type: 'image', dataUrl: resultUrl } : l
      );
      if (selectedLayerId === 'background') setCurrentDataUrl(resultUrl);
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      pushHistory(null, nextLayers, 'Fill Pen Path');
    };
    img.src = dataUrl;
  }, [penPath, selectedLayerId, currentDataUrl, currentWidth, currentHeight, foregroundColor, pushHistory]);

  const handleClearPenPath = useCallback(() => {
    setPenPath(null);
    setSelectedVectorNodeIndex(null);
    setHoveredSegment(null);
    setPenHoverMode('pen');
  }, []);

  const handleApplyPatch = useCallback(async () => {
    if (!patchState.selection || !selectedLayerId) return;
    const layer = layersRef.current.find((l) => l.id === selectedLayerId);
    const dataUrl = layer?.dataUrl || (layer?.id === 'background' ? currentDataUrl : null);
    if (!dataUrl) return;

    const patchedDataUrl = await applyPatchBlend(
      dataUrl,
      patchState.selection,
      patchState.sourceOffset,
      patchMode,
      patchFeather
    );

    const nextLayers = layersRef.current.map((l) =>
      l.id === selectedLayerId ? { ...l, type: 'image', dataUrl: patchedDataUrl } : l
    );
    if (selectedLayerId === 'background') {
      setCurrentDataUrl(patchedDataUrl);
    }
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setPatchState({ selection: null, sourceOffset: { x: 0, y: 0 }, isDragging: false });
    pushHistory(null, nextLayers, 'Patch Tool');
  }, [patchState, selectedLayerId, currentDataUrl, patchMode, patchFeather, pushHistory]);

  const handleCancelPatch = useCallback(() => {
    setPatchState({ selection: null, sourceOffset: { x: 0, y: 0 }, isDragging: false });
  }, []);

  const handleMoveLayer = useCallback(
    (layerId, direction) => {
      const idx = layersRef.current.findIndex((l) => l.id === layerId);
      if (idx === -1) return;
      const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= layersRef.current.length) return;

      const nextLayers = [...layersRef.current];
      const [moved] = nextLayers.splice(idx, 1);
      nextLayers.splice(targetIdx, 0, moved);
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      pushHistory(null, nextLayers, 'Reorder Layer');
    },
    [pushHistory]
  );

  const handleReorderLayers = useCallback(
    (sourceIdx, destIdx) => {
      if (
        sourceIdx === destIdx ||
        sourceIdx === null ||
        destIdx === null ||
        sourceIdx < 0 ||
        destIdx < 0 ||
        sourceIdx >= layersRef.current.length ||
        destIdx >= layersRef.current.length
      )
        return;

      const nextLayers = [...layersRef.current];
      const [moved] = nextLayers.splice(sourceIdx, 1);
      nextLayers.splice(destIdx, 0, moved);
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      pushHistory(null, nextLayers, 'Reorder Layers');
    },
    [pushHistory]
  );

  const handleBringToFront = useCallback(
    (layerId) => {
      const idx = layersRef.current.findIndex((l) => l.id === layerId);
      if (idx === -1 || idx === layersRef.current.length - 1) return;
      const nextLayers = [...layersRef.current];
      const [moved] = nextLayers.splice(idx, 1);
      nextLayers.push(moved);
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      pushHistory(null, nextLayers, 'Bring to Front');
    },
    [pushHistory]
  );

  const handleSendToBack = useCallback(
    (layerId) => {
      const idx = layersRef.current.findIndex((l) => l.id === layerId);
      if (idx <= 0) return;
      const nextLayers = [...layersRef.current];
      const [moved] = nextLayers.splice(idx, 1);
      nextLayers.unshift(moved);
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      pushHistory(null, nextLayers, 'Send to Back');
    },
    [pushHistory]
  );

  const handleRenameLayer = useCallback(
    (layerId, newName) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      handleUpdateLayer(layerId, { name: trimmed }, true);
    },
    [handleUpdateLayer]
  );

  const handleToggleHideLayer = useCallback(
    (layerId) => {
      const layer = layersRef.current.find((l) => l.id === layerId);
      if (!layer) return;
      handleUpdateLayer(layerId, { hidden: !layer.hidden }, true);
    },
    [handleUpdateLayer]
  );

  const handleToggleLockLayer = useCallback(
    (layerId) => {
      const layer = layersRef.current.find((l) => l.id === layerId);
      if (!layer) return;
      handleUpdateLayer(layerId, { locked: !layer.locked }, true);
    },
    [handleUpdateLayer]
  );

  // Load multiple files into independent document tabs
  const handleLoadFiles = useCallback(
    async (fileList) => {
      if (!fileList || fileList.length === 0) return;

      const rawFiles = Array.from(fileList);
      const psdFiles = [];
      const imageFiles = [];
      const unsupportedFiles = [];

      for (const f of rawFiles) {
        if (isPsdFile(f)) {
          psdFiles.push(f);
        } else if (
          (!f.type || f.type === 'application/octet-stream') &&
          f.size >= 26 &&
          (await isPsdSignature(f))
        ) {
          psdFiles.push(f);
        } else if (isSupportedImageFile(f)) {
          imageFiles.push(f);
        } else {
          unsupportedFiles.push(f);
        }
      }

      // If all files are unsupported, show clear message and stop
      if (psdFiles.length === 0 && imageFiles.length === 0) {
        const names = unsupportedFiles.map((f) => f.name || 'Unknown file').join(', ');
        setError(
          `Unsupported file format: ${names}. Supported formats are PSD, JPG, PNG, WEBP, GIF, SVG, AVIF, BMP, ICO.`
        );
        return;
      }

      // Reset cancellation ref before starting load
      cancelImportRef.current = false;

      // Save currently active document before loading new files
      saveActiveDocumentToStore();

      const newDocs = [];
      const loadErrors = [];

      // 1. Process Photoshop PSD files directly via ag-psd
      for (const psdFile of psdFiles) {
        if (cancelImportRef.current) break;
        setIsImportingPsd(true);
        setPsdImportStatus(`Importing Photoshop file "${psdFile.name}"... Parsing layers...`);
        setImportLoading({
          fileName: psdFile.name,
          fileType: 'PSD',
          progress: 20,
          status: 'Reading file...',
        });

        try {
          const psdResult = await parsePsdFile(psdFile, {
            onProgress: (pct, statusText) => {
              if (cancelImportRef.current) return;
              setImportLoading({
                fileName: psdFile.name,
                fileType: 'PSD',
                progress: pct,
                status: statusText || 'Parsing layers...',
              });
            },
          });

          if (cancelImportRef.current) break;

          const docModel = createPsdDocumentModel(psdResult, calculateFitZoom);
          documentStoreRef.current.set(docModel.id, docModel);
          newDocs.push({
            id: docModel.id,
            name: docModel.name,
            isDirty: false,
            width: docModel.width,
            height: docModel.height,
            layersCount: docModel.layers.length,
          });
          trackImageUpload({ tool: 'edit_image', format: 'image/vnd.adobe.photoshop' });
          if (psdResult.warnings && psdResult.warnings.length > 0) {
            console.info(`[PSD Import] Notes for "${psdFile.name}":`, psdResult.warnings);
          }
        } catch (psdErr) {
          if (!cancelImportRef.current) {
            console.error('Error importing PSD file:', psdFile.name, psdErr);
            loadErrors.push(
              `Failed to import Photoshop file "${psdFile.name}": ${psdErr.message || 'Corrupted or unsupported format'}`
            );
          }
        } finally {
          setIsImportingPsd(false);
          setPsdImportStatus('');
          setImportLoading(null);
        }
      }

      // 2. Process Standard Image Files (JPG, PNG, WEBP, GIF, etc.)
      for (const selectedFile of imageFiles) {
        if (cancelImportRef.current) break;
        setImportLoading({
          fileName: selectedFile.name,
          fileType: selectedFile.type || selectedFile.name.split('.').pop() || 'IMG',
          progress: 30,
          status: 'Reading image data...',
        });

        try {
          // Brief tick to ensure smooth display of centered modal
          await new Promise((r) => setTimeout(r, 60));
          if (cancelImportRef.current) break;

          setImportLoading((prev) =>
            prev ? { ...prev, progress: 65, status: 'Decoding image...' } : null
          );

          const objectUrl = URL.createObjectURL(selectedFile);
          const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Decode failed'));
            image.src = objectUrl;
          });

          if (cancelImportRef.current) {
            URL.revokeObjectURL(objectUrl);
            break;
          }

          setImportLoading((prev) =>
            prev ? { ...prev, progress: 90, status: 'Preparing canvas...' } : null
          );

          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;

          const baseCanvas = document.createElement('canvas');
          baseCanvas.width = w;
          baseCanvas.height = h;
          const ctx = baseCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const bgDataUrl = baseCanvas.toDataURL('image/png');
          const bgLayer = {
            id: 'background',
            name: 'Background',
            type: 'image',
            dataUrl: bgDataUrl,
            x: 0,
            y: 0,
            width: w,
            height: h,
            origWidth: w,
            origHeight: h,
            opacity: 100,
            rotation: 0,
            locked: false,
            hidden: false,
            isBackground: true,
          };

          const fitZoom = calculateFitZoom(w, h);
          const docId = generateDocId();
          const docModel = createDocumentModel({
            id: docId,
            name: selectedFile.name,
            width: w,
            height: h,
            zoom: fitZoom,
            pan: { x: 0, y: 0 },
            originalFile: selectedFile,
            origWidth: w,
            origHeight: h,
            origSize: selectedFile.size,
            layers: [bgLayer],
            selectedLayerId: 'background',
            selectedLayerIds: ['background'],
            history: [
              {
                canvas: baseCanvas,
                width: w,
                height: h,
                layers: [bgLayer],
                label: 'Original',
                timestamp: Date.now(),
              },
            ],
            historyIndex: 0,
            isDirty: false,
          });

          documentStoreRef.current.set(docId, docModel);
          newDocs.push({
            id: docId,
            name: selectedFile.name,
            isDirty: false,
            width: w,
            height: h,
            layersCount: 1,
          });

          URL.revokeObjectURL(objectUrl);
          trackImageUpload({ tool: 'edit_image', format: selectedFile.type });
        } catch (err) {
          if (!cancelImportRef.current) {
            console.error('Error loading image file:', selectedFile.name, err);
            loadErrors.push(`Failed to open image "${selectedFile.name}": Could not decode image data.`);
          }
        } finally {
          setImportLoading(null);
        }
      }

      setImportLoading(null);

      if (cancelImportRef.current) {
        return;
      }

      if (newDocs.length > 0) {
        setDocuments((prev) => [...prev, ...newDocs]);
        const targetDocId = newDocs[newDocs.length - 1].id;
        setActiveDocumentId(targetDocId);
        loadDocumentFromStore(targetDocId);

        const errorParts = [...loadErrors];
        if (unsupportedFiles.length > 0) {
          errorParts.push(
            `Skipped unsupported file(s): ${unsupportedFiles
              .map((f) => f.name || 'Unknown file')
              .join(', ')}`
          );
        }
        if (errorParts.length > 0) {
          setError(`Opened ${newDocs.length} document(s). ${errorParts.join(' ')}`);
        } else {
          setError('');
        }
      } else {
        const errorParts = [...loadErrors];
        if (unsupportedFiles.length > 0) {
          errorParts.push(
            `Unsupported file(s): ${unsupportedFiles.map((f) => f.name || 'Unknown file').join(', ')}`
          );
        }
        setError(errorParts.join(' ') || 'Could not decode selected file(s).');
      }
    },
    [calculateFitZoom, saveActiveDocumentToStore, loadDocumentFromStore]
  );

  // Single-file load wrapper
  const handleLoadFile = useCallback(
    (selectedFile) => {
      if (selectedFile) {
        handleLoadFiles([selectedFile]);
      }
    },
    [handleLoadFiles]
  );

  // Handle direct import result from PsdImportModal
  const handleImportPsdResult = useCallback(
    (psdResult) => {
      if (!psdResult) return;
      saveActiveDocumentToStore();
      const docModel = createPsdDocumentModel(psdResult, calculateFitZoom);
      documentStoreRef.current.set(docModel.id, docModel);
      const newDoc = {
        id: docModel.id,
        name: docModel.name,
        isDirty: false,
        width: docModel.width,
        height: docModel.height,
        layersCount: docModel.layers.length,
      };
      setDocuments((prev) => [...prev, newDoc]);
      setActiveDocumentId(docModel.id);
      loadDocumentFromStore(docModel.id);
      setError('');
      trackImageUpload({ tool: 'edit_image', format: 'image/vnd.adobe.photoshop' });
    },
    [calculateFitZoom, saveActiveDocumentToStore, loadDocumentFromStore]
  );

  // Create blank canvas as a new independent document
  const handleCreateBlankCanvas = useCallback(
    ({ width, height, bgColor, isTransparent, name }) => {
      saveActiveDocumentToStore();

      const w = Math.max(10, width || 400);
      const h = Math.max(10, height || 300);

      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = w;
      blankCanvas.height = h;
      const ctx = blankCanvas.getContext('2d');

      if (!isTransparent && bgColor && bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
      }

      const existingUntitled = Array.from(documentStoreRef.current.values()).filter((d) =>
        d.name.startsWith('Untitled')
      );
      const docName = name
        ? (name.endsWith('.png') ? name : `${name}.png`)
        : `Untitled-${existingUntitled.length + 1}.png`;

      const syntheticFile = {
        name: docName,
        type: 'image/png',
        size: 0,
      };

      const bgDataUrl = blankCanvas.toDataURL('image/png');
      const bgLayer = {
        id: 'background',
        name: 'Background',
        type: isTransparent ? 'blank' : 'image',
        dataUrl: bgDataUrl,
        x: 0,
        y: 0,
        width: w,
        height: h,
        origWidth: w,
        origHeight: h,
        opacity: 100,
        rotation: 0,
        locked: false,
        hidden: false,
        isBackground: true,
      };

      const fitZoom = calculateFitZoom(w, h);
      const docId = generateDocId();
      const docModel = createDocumentModel({
        id: docId,
        name: docName,
        width: w,
        height: h,
        zoom: fitZoom,
        pan: { x: 0, y: 0 },
        originalFile: syntheticFile,
        origWidth: w,
        origHeight: h,
        origSize: 0,
        layers: [bgLayer],
        selectedLayerId: 'background',
        selectedLayerIds: ['background'],
        history: [
          {
            canvas: blankCanvas,
            width: w,
            height: h,
            layers: [bgLayer],
            label: `New Canvas (${w}×${h})`,
            timestamp: Date.now(),
          },
        ],
        historyIndex: 0,
        isDirty: false,
      });

      documentStoreRef.current.set(docId, docModel);
      setDocuments((prev) => [
        ...prev,
        {
          id: docId,
          name: docName,
          isDirty: false,
          width: w,
          height: h,
          layersCount: 1,
        },
      ]);
      setActiveDocumentId(docId);
      loadDocumentFromStore(docId);
      setError('');
      setIsBlankModalOpen(false);

      trackImageUpload({ tool: 'edit_image', format: 'canvas/blank' });
    },
    [calculateFitZoom, saveActiveDocumentToStore, loadDocumentFromStore]
  );

  // Trigger layer image picker
  const handleTriggerAddImageLayer = useCallback(() => {
    if (layerImageInputRef.current) {
      layerImageInputRef.current.value = '';
      layerImageInputRef.current.click();
    }
  }, []);

  // Load and insert image as layer
  const handleAddImageLayerFile = useCallback((file) => {
    if (!file) return;

    const isValidType =
      ACCEPTED_INPUT_TYPES.includes(file.type) ||
      /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico)$/i.test(file.name);

    if (!isValidType) {
      setError('Please select a valid image file (JPG, PNG, WebP, SVG, GIF, AVIF).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const imgW = img.naturalWidth || img.width || 100;
      const imgH = img.naturalHeight || img.height || 100;

      // Draw onto temporary canvas to convert to persistent dataURL
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgW;
      tempCanvas.height = imgH;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.drawImage(img, 0, 0);
      const persistentDataUrl = tempCanvas.toDataURL('image/png');
      URL.revokeObjectURL(objectUrl);

      // Fit into canvas with max 80% boundary
      const canvasW = currentWidth || 400;
      const canvasH = currentHeight || 300;
      const maxAllowedW = Math.max(50, Math.round(canvasW * 0.8));
      const maxAllowedH = Math.max(50, Math.round(canvasH * 0.8));

      const scale = Math.min(maxAllowedW / imgW, maxAllowedH / imgH, 1);
      const finalW = Math.max(20, Math.round(imgW * scale));
      const finalH = Math.max(20, Math.round(imgH * scale));

      const posX = Math.max(0, Math.round((canvasW - finalW) / 2));
      const posY = Math.max(0, Math.round((canvasH - finalH) / 2));

      const newId = 'image_' + Date.now();
      const cleanName = file.name.replace(/\.[^.]+$/, '') || 'Image Layer';

      const newImageLayer = {
        id: newId,
        name: cleanName,
        type: 'image',
        dataUrl: persistentDataUrl,
        x: posX,
        y: posY,
        width: finalW,
        height: finalH,
        origWidth: imgW,
        origHeight: imgH,
        opacity: 100,
        rotation: 0,
        locked: false,
        hidden: false,
      };

      const nextLayers = [...layersRef.current, newImageLayer];
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      setSelectedLayerId(newId);
      pushHistory(null, nextLayers, `Add Image Layer (${cleanName})`);
    };

    img.onerror = () => {
      setError('Could not decode image file to add as layer.');
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  }, [currentWidth, currentHeight, pushHistory]);

  // Consume staged file if bridged from another tool
  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      handleLoadFile(stagedFile);
    }
  }, [handleLoadFile]);

  // ---------------------------------------------------------------------------
  // HISTORY ACTIONS: UNDO, REDO, RESET
  // ---------------------------------------------------------------------------
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canReset = historyIndex > 0 || layers.length > 0;

  const handleUndo = useCallback(() => {
    if (canUndo) setHistoryIndex((prev) => prev - 1);
  }, [canUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo) setHistoryIndex((prev) => prev + 1);
  }, [canRedo]);

  // Fit canvas into visible workspace
  const handleFitScreen = useCallback(() => {
    if (!currentWidth || !currentHeight) return;
    const fitZoom = calculateFitZoom(currentWidth, currentHeight);
    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  }, [calculateFitZoom, currentWidth, currentHeight]);

  // ---------------------------------------------------------------------------
  // NATIVE NON-PASSIVE WHEEL LISTENER FOR CANVAS VIEWPORT
  // - Ctrl + Wheel: Zoom toward mouse cursor position
  // - Shift + Wheel: Horizontal pan
  // - Normal Wheel: Natural vertical and horizontal workspace scrolling
  // - Prevents page scroll & browser zoom while hovering over canvas
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const handleWheel = (e) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const zoomMultiplier = e.deltaY < 0 ? 1.15 : (1 / 1.15);

        setZoom((prevZoom) => {
          const nextZoom = Math.max(0.05, Math.min(10, Math.round(prevZoom * zoomMultiplier * 100) / 100));
          if (nextZoom === prevZoom) return prevZoom;

          // Stable cursor-centered zoom:
          const rect = vp.getBoundingClientRect();
          const cursorX = e.clientX - (rect.left + rect.width / 2);
          const cursorY = e.clientY - (rect.top + rect.height / 2);

          setPan((prevPan) => ({
            x: Math.round(cursorX - (cursorX - prevPan.x) * (nextZoom / prevZoom)),
            y: Math.round(cursorY - (cursorY - prevPan.y) * (nextZoom / prevZoom)),
          }));

          return nextZoom;
        });
      } else if (e.shiftKey) {
        setPan((prevPan) => ({
          ...prevPan,
          x: prevPan.x - e.deltaY,
        }));
      } else {
        setPan((prevPan) => ({
          x: prevPan.x - (e.deltaX || 0),
          y: prevPan.y - e.deltaY,
        }));
      }
    };

    vp.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      vp.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // PHOTOSHOP-STYLE FOREGROUND & BACKGROUND COLOR FILL (Alt+Del / Ctrl+Del)
  // ---------------------------------------------------------------------------
  const handleFillColor = useCallback(
    (color, fillType = 'Foreground') => {
      if (!color) return;

      // 1. If no layer is selected: fill the document background
      if (!selectedLayerId) {
        setCanvasBgOption('custom');
        setCanvasCustomColor(color);
        pushHistory(null, layersRef.current, `Fill Document Background (${fillType})`);
        return;
      }

      const layer = layersRef.current.find((l) => l.id === selectedLayerId);
      if (!layer) return;

      // Respect layer locking: if locked, ignore
      if (layer.locked) {
        return;
      }

      // 2. Shape Layer: update fillColor
      if (layer.type === 'shape') {
        const nextLayers = layersRef.current.map((l) =>
          l.id === layer.id ? { ...l, fillColor: color } : l
        );
        setLayers(nextLayers);
        layersRef.current = nextLayers;
        pushHistory(null, nextLayers, `Fill Shape (${fillType})`);
        return;
      }

      // 3. Text Layer: update text color
      if (layer.type === 'text') {
        const nextLayers = layersRef.current.map((l) =>
          l.id === layer.id ? { ...l, color } : l
        );
        setLayers(nextLayers);
        layersRef.current = nextLayers;
        pushHistory(null, nextLayers, `Fill Text (${fillType})`);
        return;
      }

      // 4. Pixel Layer (Image or Blank): fill pixels
      const hasActiveSelection = Boolean(
        activeSelection && (
          (activeSelection.width > 0 && activeSelection.height > 0) ||
          (activeSelection.type === 'polygon' && activeSelection.points?.length >= 3)
        )
      );

      const hasCropSelection =
        activeTool === 'crop' &&
        cropBox &&
        cropBox.width > 0 &&
        cropBox.height > 0;

      const layerW = Math.round(layer.width || currentWidth || 800);
      const layerH = Math.round(layer.height || currentHeight || 600);

      const offCanvas = document.createElement('canvas');
      offCanvas.width = layerW;
      offCanvas.height = layerH;
      const ctx = offCanvas.getContext('2d');

      const applyFillToLayer = (sourceImg = null) => {
        if (sourceImg) {
          ctx.drawImage(sourceImg, 0, 0, layerW, layerH);
        }

        ctx.save();
        if (hasActiveSelection) {
          ctx.beginPath();
          const ox = layer.x || 0;
          const oy = layer.y || 0;
          if (activeSelection.type === 'rect') {
            const rx = Math.round(activeSelection.x - ox);
            const ry = Math.round(activeSelection.y - oy);
            ctx.rect(rx, ry, Math.round(activeSelection.width), Math.round(activeSelection.height));
          } else if (activeSelection.type === 'ellipse') {
            const cx = Math.round(activeSelection.x + activeSelection.width / 2 - ox);
            const cy = Math.round(activeSelection.y + activeSelection.height / 2 - oy);
            ctx.ellipse(cx, cy, Math.abs(activeSelection.width / 2), Math.abs(activeSelection.height / 2), 0, 0, Math.PI * 2);
          } else if ((activeSelection.type === 'polygon' || activeSelection.type === 'lasso') && activeSelection.points) {
            activeSelection.points.forEach((pt, i) => {
              const px = Math.round(pt.x - ox);
              const py = Math.round(pt.y - oy);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.closePath();
          }
          ctx.clip();
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, layerW, layerH);
        } else if (hasCropSelection) {
          // Fill only selected bounds relative to this layer, preserving outside pixels/transparency
          const selX = Math.round(cropBox.x - (layer.x || 0));
          const selY = Math.round(cropBox.y - (layer.y || 0));
          const selW = Math.round(cropBox.width);
          const selH = Math.round(cropBox.height);
          ctx.fillStyle = color;
          ctx.fillRect(selX, selY, selW, selH);
        } else {
          // Fill the entire active layer
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, layerW, layerH);
        }
        ctx.restore();

        const filledDataUrl = offCanvas.toDataURL('image/png');
        const nextLayers = layersRef.current.map((l) =>
          l.id === layer.id
            ? {
              ...l,
              type: 'image',
              dataUrl: filledDataUrl,
              origWidth: layerW,
              origHeight: layerH,
            }
            : l
        );

        setLayers(nextLayers);
        layersRef.current = nextLayers;
        pushHistory(null, nextLayers, `Fill Layer (${fillType})`);
      };

      const existingDataUrl = layer.dataUrl || (layer.id === 'background' ? currentDataUrl : null);
      if (existingDataUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => applyFillToLayer(img);
        img.onerror = () => applyFillToLayer(null);
        img.src = existingDataUrl;
      } else {
        applyFillToLayer(null);
      }
    },
    [
      selectedLayerId,
      activeTool,
      activeSelection,
      cropBox,
      currentWidth,
      currentHeight,
      currentDataUrl,
      pushHistory,
    ]
  );

  const handleFillForeground = useCallback(() => {
    handleFillColor(foregroundColor || '#7C3AED', 'Foreground');
  }, [handleFillColor, foregroundColor]);

  const handleFillBackground = useCallback(() => {
    handleFillColor(backgroundColor || '#FFFFFF', 'Background');
  }, [handleFillColor, backgroundColor]);

  // ---------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS: Undo, Redo, Zoom Fit, 100% Zoom, Delete, Spacebar Pan,
  // Enter (Apply Crop, Apply Resize, Apply Rotate, Apply Canvas, Dialogs),
  // Escape (Cancel Crop, Cancel Tools)
  // ---------------------------------------------------------------------------
  const handleApplyCropRef = useRef(null);
  const handleCancelCropRef = useRef(null);
  const handleApplyResizeRef = useRef(null);
  const handleApplyRotateRef = useRef(null);
  const handleApplyCanvasRef = useRef(null);
  const handleApplyPatchRef = useRef(null);
  const handleCancelPatchRef = useRef(null);
  const handleToolSelectRef = useRef(null);
  const handleTrimTransparentRef = useRef(null);
  const handleRotateRight90Ref = useRef(null);
  const handleRotateLeft90Ref = useRef(null);
  const handleFlipHRef = useRef(null);
  const handleFlipVRef = useRef(null);
  handleToolSelectRef.current = handleToolSelect;
  handleApplyPatchRef.current = handleApplyPatch;
  handleCancelPatchRef.current = handleCancelPatch;
  handleMakeSelectionFromPenRef.current = handleMakeSelectionFromPen;
  handleDeleteVectorNodeRef.current = handleDeleteVectorNode;
  handleConvertNodeTypeRef.current = handleConvertNodeType;

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toUpperCase();

      // -----------------------------------------------------------------------
      // ENTER KEY: Centralized Apply / Confirm across the entire editor
      // -----------------------------------------------------------------------
      if (e.key === 'Enter') {
        // Ctrl+Enter / Cmd+Enter: Finish text editing
        if ((e.ctrlKey || e.metaKey) && (editingTextLayerId || activeTextDraftRef.current)) {
          e.preventDefault();
          if (activeTextDraftRef.current) {
            commitOrDiscardDraftRef.current?.();
          }
          if (editingTextLayerId) {
            finishEditingTextRef.current?.(editingTextLayerId);
          }
          return;
        }

        // Ctrl+Enter / Cmd+Enter: Convert Pen path or selected Vector shape to Selection
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
          const curPen = penPathRef.current;
          const curSel = selectedLayerRef.current;
          if (
            (curPen?.points?.length >= 3) ||
            (curSel?.type === 'shape' && (curSel.points || curSel.shapeType === 'custom-path'))
          ) {
            e.preventDefault();
            handleMakeSelectionFromPenRef.current?.();
            return;
          }
        }

        // 1. Multiline textarea: preserve standard newline
        if (tag === 'TEXTAREA') return;

        // 2. Select dropdown: preserve standard option selection
        if (tag === 'SELECT') return;

        // 3. Canvas text layer inline editing: preserve text editing
        if (editingTextLayerId || activeTextDraftRef.current) return;

        // 4. Modals / Dialogs:
        if (activeFilterDialog) {
          const filterBtn = document.querySelector('[data-testid="filter-apply-btn"]');
          if (filterBtn) {
            e.preventDefault();
            filterBtn.click();
            return;
          }
        }

        if (activeBlendingLayer) {
          const blendBtn = document.querySelector('[data-testid="blending-apply-btn"]');
          if (blendBtn) {
            e.preventDefault();
            blendBtn.click();
            return;
          }
        }

        // 5. Tool-specific Apply actions:
        if (activeTool === 'crop' || activeTab === 'crop') {
          e.preventDefault();
          activeEl?.blur?.();
          handleApplyCropRef.current?.();
          return;
        }

        if (activeTool === 'resize' || activeTab === 'resize') {
          e.preventDefault();
          activeEl?.blur?.();
          handleApplyResizeRef.current?.();
          return;
        }

        if (activeTool === 'rotate' || activeTab === 'rotate') {
          e.preventDefault();
          activeEl?.blur?.();
          handleApplyRotateRef.current?.();
          return;
        }

        if (activeTool === 'canvas' || activeTab === 'canvas') {
          e.preventDefault();
          activeEl?.blur?.();
          handleApplyCanvasRef.current?.();
          return;
        }

        if (activeTool === 'patch' && patchState?.selection) {
          e.preventDefault();
          activeEl?.blur?.();
          handleApplyPatchRef.current?.();
          return;
        }
      }

      // -----------------------------------------------------------------------
      // ESCAPE KEY: Cancel active tool mode / dialog
      // -----------------------------------------------------------------------
      if (e.key === 'Escape') {
        if (penPath) {
          e.preventDefault();
          setPenPath(null);
          setHoveredSegment(null);
          setPenHoverMode('pen');
          return;
        }
        if (selectedVectorNodeIndex !== null) {
          e.preventDefault();
          setSelectedVectorNodeIndex(null);
          return;
        }
        if (activeTextDraftRef.current) {
          e.preventDefault();
          discardDraft();
          return;
        }
        if (editingTextLayerId) {
          e.preventDefault();
          cancelEditingText(editingTextLayerId);
          return;
        }
        if (activeTool === 'crop' || activeTab === 'crop') {
          e.preventDefault();
          handleCancelCropRef.current?.();
          return;
        }
        if (activeTool === 'patch' && patchState?.selection) {
          e.preventDefault();
          handleCancelPatchRef.current?.();
          return;
        }
        if (shapeDrawRef.current?.active) {
          shapeDrawRef.current = { active: false };
          setDrawingShapePreview(null);
          return;
        }
        if (['rect', 'circle', 'ellipse', 'triangle', 'line', 'star', 'rounded-rect'].includes(activeTool)) {
          setActiveTool('move');
          return;
        }
        setSelectedLayerId(null);
        setSelectedGuideId(null);
        return;
      }

      // Don't intercept when user is typing in input or textarea
      const isInput =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        activeEl?.isContentEditable ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInput || editingTextLayerId || activeTextDraftRef.current) return;

      // Spacebar: Temporary Hand Tool (Photoshop behavior)
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isSpacePressedRef.current) {
          isSpacePressedRef.current = true;
          setIsSpaceHandActive(true);
          if (prevToolBeforeSpaceRef.current === null) {
            prevToolBeforeSpaceRef.current = activeTool;
          }
        }
        return;
      }

      // Undo: Ctrl + Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl + Y or Ctrl + Shift + Z
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.key === 'y' || e.key === 'Y') || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Fill Background: Ctrl + Alt (or Ctrl + Alt + Delete)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.altKey &&
        (e.key === 'Delete' || e.key === 'Backspace' || e.code === 'Delete' || e.code === 'Backspace' || e.key === 'Alt' || e.key === 'Control')
      ) {
        e.preventDefault();
        handleFillBackground();
        return;
      }

      // Fill Foreground: Ctrl + Delete or Alt + Delete / Backspace
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'Delete' || e.key === 'Backspace') && !e.altKey) ||
        (e.altKey && (e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey)
      ) {
        e.preventDefault();
        handleFillForeground();
        return;
      }

      // Layer Reordering Shortcuts
      // Ctrl + ] : Move layer up
      if ((e.ctrlKey || e.metaKey) && (e.key === ']' || e.code === 'BracketRight') && !e.shiftKey) {
        e.preventDefault();
        if (selectedLayerId) handleMoveLayer(selectedLayerId, 'up');
        return;
      }
      // Ctrl + [ : Move layer down
      if ((e.ctrlKey || e.metaKey) && (e.key === '[' || e.code === 'BracketLeft') && !e.shiftKey) {
        e.preventDefault();
        if (selectedLayerId) handleMoveLayer(selectedLayerId, 'down');
        return;
      }
      // Ctrl + Shift + ] : Bring to front
      if ((e.ctrlKey || e.metaKey) && (e.key === ']' || e.code === 'BracketRight') && e.shiftKey) {
        e.preventDefault();
        if (selectedLayerId) handleBringToFront(selectedLayerId);
        return;
      }
      // Ctrl + Shift + [ : Send to back
      if ((e.ctrlKey || e.metaKey) && (e.key === '[' || e.code === 'BracketLeft') && e.shiftKey) {
        e.preventDefault();
        if (selectedLayerId) handleSendToBack(selectedLayerId);
        return;
      }

      // Copy: Ctrl + C
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C') && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleCopyLayers();
        return;
      }

      // Cut: Ctrl + X
      if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X') && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleCutLayers();
        return;
      }

      // Paste: Ctrl + V
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V') && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handlePasteLayers();
        return;
      }

      // Copy Merged: Ctrl + Shift + C
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C') && e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleCopyMerged();
        return;
      }

      // Duplicate Layer(s): Ctrl + J
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J') && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (selectedLayerIds.length > 1) {
          handleDuplicateSelectedLayers();
        } else if (selectedLayerId) {
          handleDuplicateLayer(selectedLayerId);
        }
        return;
      }

      // Tab Navigation: Ctrl + Tab / Ctrl + PageDown (Next Tab)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'PageDown' || (e.key === 'Tab' && !e.shiftKey))) {
        if (documents.length > 1) {
          e.preventDefault();
          const curIdx = documents.findIndex((d) => d.id === activeDocumentId);
          const nextIdx = (curIdx + 1) % documents.length;
          handleSwitchDocument(documents[nextIdx].id);
          return;
        }
      }

      // Tab Navigation: Ctrl + Shift + Tab / Ctrl + PageUp (Prev Tab)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'PageUp' || (e.key === 'Tab' && e.shiftKey))) {
        if (documents.length > 1) {
          e.preventDefault();
          const curIdx = documents.findIndex((d) => d.id === activeDocumentId);
          const prevIdx = (curIdx - 1 + documents.length) % documents.length;
          handleSwitchDocument(documents[prevIdx].id);
          return;
        }
      }

      // Close Document: Ctrl + W
      if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W') && !e.shiftKey) {
        e.preventDefault();
        if (activeDocumentId) {
          handleRequestCloseDocument(activeDocumentId);
        }
        return;
      }

      // Open Image: Ctrl + O
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O') && !e.shiftKey) {
        e.preventDefault();
        handleTriggerUpload();
        return;
      }

      // New Document: Ctrl + N
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N') && !e.shiftKey) {
        e.preventDefault();
        setIsBlankModalOpen(true);
        return;
      }

      // Save Project: Ctrl + S (or Cmd + S on macOS)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && !e.shiftKey) {
        e.preventDefault();
        handleSaveProjectRef.current?.();
        return;
      }

      // Save Project As: Ctrl + Shift + S (or Cmd + Shift + S on macOS)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && e.shiftKey) {
        e.preventDefault();
        handleSaveProjectAsRef.current?.();
        return;
      }

      // Deselect: Ctrl + D
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D') && !e.shiftKey) {
        e.preventDefault();
        handleDeselect();
        return;
      }

      // Invert Selection: Ctrl + Shift + I
      if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I') && e.shiftKey) {
        e.preventDefault();
        handleInvertSelection();
        return;
      }

      // Select All: Ctrl + A
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A') && !e.shiftKey) {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Delete selected guide if a guide is currently selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGuideId) {
        e.preventDefault();
        handleDeleteGuide(selectedGuideId);
        return;
      }

      // Delete selected anchor point if editing vector path
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        selectedVectorNodeIndexRef.current !== null &&
        selectedLayerRef.current?.type === 'shape'
      ) {
        e.preventDefault();
        handleDeleteVectorNodeRef.current?.(selectedVectorNodeIndexRef.current);
        return;
      }

      // Delete selected pixels or layers
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        // If active selection exists on a raster layer: delete pixels!
        if (activeSelection && selectedLayerId) {
          const l = layersRef.current.find((x) => x.id === selectedLayerId);
          if (l && (l.type === 'image' || l.type === 'blank' || l.id === 'background')) {
            handleDeleteSelectedPixels();
            return;
          }
        }
        if (selectedLayerIds.length > 1) {
          handleDeleteSelectedLayers();
          return;
        }
        if (selectedLayerId) {
          handleDeleteLayer(selectedLayerId);
          return;
        }
      }

      // Swap Foreground / Background colors: X
      if ((e.key === 'x' || e.key === 'X') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleSwapColors();
        return;
      }

      // Reset colors to default: D
      if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setForegroundColor('#000000');
        setBackgroundColor('#FFFFFF');
        return;
      }

      // Ctrl + 0: Fit canvas to screen
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        handleFitScreen();
        return;
      }

      // Ctrl + 1: 100% zoom
      if ((e.ctrlKey || e.metaKey) && (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1')) {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      // Photoshop-style Opacity Shortcuts (1 - 0): 1=10%, 2=20%, ..., 9=90%, 0=100%
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey &&
        !isInput &&
        !editingTextLayerId &&
        !activeTextDraftRef.current
      ) {
        const digitMap = {
          '1': 10,
          '2': 20,
          '3': 30,
          '4': 40,
          '5': 50,
          '6': 60,
          '7': 70,
          '8': 80,
          '9': 90,
          '0': 100,
        };
        if (e.key in digitMap) {
          e.preventDefault();
          const targetOpacity = digitMap[e.key];
          if (selectedLayerId) {
            handleUpdateLayer(selectedLayerId, { opacity: targetOpacity }, true);
          }
          return;
        }
      }

      // Alt + Ctrl + I: Image Size / Resize
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        handleToolSelectRef.current?.('resize');
        return;
      }

      // Alt + Ctrl + C: Canvas Size
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleToolSelectRef.current?.('canvas');
        return;
      }

      // Alt + Ctrl + T: Trim Transparent Pixels
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        handleTrimTransparentRef.current?.();
        return;
      }

      // Alt + Ctrl + Right: Rotate Canvas 90 CW
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'ArrowRight' || e.code === 'ArrowRight')) {
        e.preventDefault();
        handleRotateRight90Ref.current?.();
        return;
      }

      // Alt + Ctrl + Left: Rotate Canvas 90 CCW
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'ArrowLeft' || e.code === 'ArrowLeft')) {
        e.preventDefault();
        handleRotateLeft90Ref.current?.();
        return;
      }

      // Alt + Ctrl + H: Flip Canvas Horizontal
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        handleFlipHRef.current?.();
        return;
      }

      // Alt + Ctrl + V: Flip Canvas Vertical
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        handleFlipVRef.current?.();
        return;
      }

      // Shift + M: Elliptical Marquee
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        handleToolSelectRef.current?.('marquee-ellipse');
        return;
      }

      // Shift + U: Ellipse Shape Tool
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        handleToolSelectRef.current?.('circle');
        return;
      }

      // Single Key Desktop Photoshop Tool Shortcuts (when not in typing mode)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'v') { handleToolSelectRef.current?.('move'); return; }
        if (k === 'm') { handleToolSelectRef.current?.('marquee-rect'); return; }
        if (k === 'l') { handleToolSelectRef.current?.('lasso'); return; }
        if (k === 'w') { handleToolSelectRef.current?.('magic-wand'); return; }
        if (k === 'c') { handleToolSelectRef.current?.('crop'); return; }
        if (k === 'i') { handleToolSelectRef.current?.('eyedropper'); return; }
        if (k === 'j') { handleToolSelectRef.current?.('patch'); return; }
        if (k === 'b') { handleToolSelectRef.current?.('brush'); return; }
        if (k === 'e') { handleToolSelectRef.current?.('eraser'); return; }
        if (k === 'p') { handleToolSelectRef.current?.('pen'); return; }
        if (k === 'u') { handleToolSelectRef.current?.('rect'); return; }
        if (k === 't') { handleToolSelectRef.current?.('text'); return; }
        if (k === 'h') { handleToolSelectRef.current?.('hand'); setIsPanActive(true); return; }
        if (k === 'z') { handleToolSelectRef.current?.('zoom'); return; }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsSpaceHandActive(false);
        setIsPanning(false);
        if (prevToolBeforeSpaceRef.current !== null) {
          const restoredTool = prevToolBeforeSpaceRef.current;
          prevToolBeforeSpaceRef.current = null;
          setActiveTool(restoredTool);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    handleUndo,
    handleRedo,
    handleFitScreen,
    selectedLayerId,
    handleDeleteLayer,
    handleFillForeground,
    handleFillBackground,
    selectedGuideId,
    handleDeleteGuide,
    handleSwapColors,
    activeTool,
    editingTextLayerId,
    activeSelection,
    layers,
    patchState,
    cropPreset,
    rotateAngle,
    currentWidth,
    currentHeight,
    handleMoveLayer,
    handleBringToFront,
    handleSendToBack,
    handleDeselect,
    handleInvertSelection,
    handleSelectAll,
    handleDeleteSelectedPixels,
    handleDeleteSelectedLayers,
    selectedLayerIds,
    handleCopyLayers,
    handleCutLayers,
    handlePasteLayers,
    handleCopyMerged,
    handleDuplicateLayer,
    handleDuplicateSelectedLayers,
    handleSwitchDocument,
    handleRequestCloseDocument,
    handleTriggerUpload,
    documents,
    activeDocumentId,
  ]);

  // Window blur listener so temporary Spacebar Hand tool never gets stuck
  useEffect(() => {
    const handleBlur = () => {
      if (isSpacePressedRef.current || isSpaceHandActive) {
        isSpacePressedRef.current = false;
        setIsSpaceHandActive(false);
        setIsPanning(false);
        if (prevToolBeforeSpaceRef.current !== null) {
          const restored = prevToolBeforeSpaceRef.current;
          prevToolBeforeSpaceRef.current = null;
          setActiveTool(restored);
        }
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isSpaceHandActive]);

  // Global mousemove/mouseup listener while canvas panning (for window-wide and fast tracking)
  useEffect(() => {
    if (!isPanning) return;
    const handleGlobalMouseMove = (e) => {
      const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
      const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;
      if (clientX === undefined || clientY === undefined || !panStartRef.current) return;
      const dx = clientX - panStartRef.current.startX;
      const dy = clientY - panStartRef.current.startY;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    };
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalMouseMove, { passive: true });
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isPanning]);

  const handleResetToOriginal = () => {
    if (canReset && history.length > 0) {
      setHistoryIndex(0);
      setLayers([]);
      setSelectedLayerId(null);
      setActiveTab('move');
      setActiveTool('move');
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotateAngle(0);
      setFlipH(false);
      setFlipV(false);
    }
  };

  const handleJumpToHistory = (index) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
    }
  };

  const handleDuplicateBaseImage = () => {
    if (!activeCanvas) return;
    const newLayer = {
      id: 'layer_' + Date.now(),
      name: 'Image Copy',
      type: 'image',
      x: 30,
      y: 30,
      width: currentWidth,
      height: currentHeight,
      dataUrl: currentDataUrl,
      opacity: 100,
      locked: false,
      hidden: false,
    };
    const nextLayers = [...layersRef.current, newLayer];
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newLayer.id);
    pushHistory(null, nextLayers, 'Duplicate Image');
  };

  const handleDeleteBaseImage = () => {
    if (activeDocumentId) {
      handleRequestCloseDocument(activeDocumentId);
    } else {
      setOriginalFile(null);
      setOrigWidth(0);
      setOrigHeight(0);
      setOrigSize(0);
      setHistory([]);
      setHistoryIndex(-1);
      setCurrentDataUrl('');
      setLayers([]);
      layersRef.current = [];
      setSelectedLayerId(null);
      setActiveTool(null);
      setActiveTab(null);
      setError('');
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 1: APPLY RESIZE
  // ---------------------------------------------------------------------------
  const handleApplyResize = (options = {}) => {
    if (!activeCanvas) return;

    const targetW = parseInt(options.width !== undefined ? options.width : resizeWidth, 10);
    const targetH = parseInt(options.height !== undefined ? options.height : resizeHeight, 10);
    const resampling = options.resampling || 'bicubic';

    if (isNaN(targetW) || isNaN(targetH) || targetW <= 0 || targetH <= 0) {
      setError('Width and height must be positive pixels.');
      return;
    }

    if (targetW > MAX_CANVAS_DIMENSION || targetH > MAX_CANVAS_DIMENSION) {
      setError(`Maximum dimension is ${MAX_CANVAS_DIMENSION.toLocaleString()} px.`);
      return;
    }

    if (targetW * targetH > MAX_CANVAS_PIXELS) {
      setError('Total image area exceeds the safe browser limit of 100 megapixels.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const newCanvas = document.createElement('canvas');
        newCanvas.width = targetW;
        newCanvas.height = targetH;
        const ctx = newCanvas.getContext('2d');
        if (resampling === 'nearest') {
          ctx.imageSmoothingEnabled = false;
        } else {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = resampling === 'bicubic' ? 'high' : 'medium';
        }
        ctx.drawImage(activeCanvas, 0, 0, targetW, targetH);

        // Scale layers proportionally
        const scaleX = targetW / (currentWidth || targetW);
        const scaleY = targetH / (currentHeight || targetH);
        const scaledLayers = layers.map((l) => ({
          ...l,
          x: Math.round(l.x * scaleX),
          y: Math.round(l.y * scaleY),
          width: l.width ? Math.round(l.width * scaleX) : l.width,
          height: l.height ? Math.round(l.height * scaleY) : l.height,
          fontSize: l.fontSize ? Math.round(l.fontSize * Math.min(scaleX, scaleY)) : l.fontSize,
        }));

        setResizeWidth(targetW);
        setResizeHeight(targetH);
        setCanvasWidth(targetW);
        setCanvasHeight(targetH);

        setLayers(scaledLayers);
        pushHistory(newCanvas, scaledLayers, `Resize (${targetW}×${targetH})`);
        setIsProcessing(false);

        trackImageConvert({
          tool: 'edit_image',
          action: 'resize',
          width: targetW,
          height: targetH,
        });
      } catch (err) {
        setIsProcessing(false);
        setError(err?.message || 'Failed to resize image.');
      }
    }, 20);
  };

  const handleResizeWidthChange = (e) => {
    const val = typeof e === 'object' && e?.target ? e.target.value : e;
    setResizeWidth(val);
    const num = parseInt(val, 10);
    if (lockAspectRatio && currentWidth > 0 && currentHeight > 0 && !isNaN(num) && num > 0) {
      const ratio = currentWidth / currentHeight;
      setResizeHeight(Math.max(1, Math.round(num / ratio)));
    }
  };

  const handleResizeHeightChange = (e) => {
    const val = typeof e === 'object' && e?.target ? e.target.value : e;
    setResizeHeight(val);
    const num = parseInt(val, 10);
    if (lockAspectRatio && currentWidth > 0 && currentHeight > 0 && !isNaN(num) && num > 0) {
      const ratio = currentWidth / currentHeight;
      setResizeWidth(Math.max(1, Math.round(num * ratio)));
    }
  };

  const toggleResizeLock = () => {
    setLockAspectRatio((prev) => {
      const next = !prev;
      if (next && currentWidth > 0 && currentHeight > 0) {
        const curW = parseInt(resizeWidth, 10);
        if (!isNaN(curW) && curW > 0) {
          const ratio = currentWidth / currentHeight;
          setResizeHeight(Math.max(1, Math.round(curW / ratio)));
        }
      }
      return next;
    });
  };

  const handleScalePreset = (percent) => {
    if (!currentWidth || !currentHeight) return;
    const factor = percent / 100;
    const newW = Math.max(1, Math.round(currentWidth * factor));
    const newH = Math.max(1, Math.round(currentHeight * factor));
    setResizeWidth(newW);
    setResizeHeight(newH);
  };

  // ---------------------------------------------------------------------------
  // TAB 2: APPLY CROP
  // ---------------------------------------------------------------------------
  const handleApplyCrop = () => {
    if (!activeCanvas) return;

    const cropX = Math.max(0, Math.round(cropBox.x));
    const cropY = Math.max(0, Math.round(cropBox.y));
    const cropW = Math.max(1, Math.min(currentWidth - cropX, Math.round(cropBox.width)));
    const cropH = Math.max(1, Math.min(currentHeight - cropY, Math.round(cropBox.height)));

    if (cropW <= 0 || cropH <= 0) {
      setError('Please select a valid crop region.');
      return;
    }

    if (cropX === 0 && cropY === 0 && cropW === currentWidth && cropH === currentHeight) {
      setActiveTool('move');
      setActiveTab('move');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const bgLayer = layersRef.current.find((l) => l.id === 'background' || l.isBackground);
        const sourceUrl = bgLayer?.dataUrl || currentDataUrl;

        const finalizeCrop = (sourceImgOrCanvas) => {
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const ctx = cropCanvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(sourceImgOrCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

          const croppedDataUrl = cropCanvas.toDataURL('image/png');

          // Adjust layers offset and crop background layer to the exact new boundaries
          const shiftedLayers = layersRef.current.map((l) => {
            if (l.id === 'background' || l.isBackground) {
              return {
                ...l,
                x: 0,
                y: 0,
                width: cropW,
                height: cropH,
                origWidth: cropW,
                origHeight: cropH,
                dataUrl: croppedDataUrl,
              };
            }
            return {
              ...l,
              x: (l.x || 0) - cropX,
              y: (l.y || 0) - cropY,
            };
          });

          // Multi-document state synchronization
          if (activeDocumentId) {
            const existing = documentStoreRef.current.get(activeDocumentId);
            if (existing) {
              existing.width = cropW;
              existing.height = cropH;
              existing.origWidth = cropW;
              existing.origHeight = cropH;
              existing.isDirty = true;
              documentStoreRef.current.set(activeDocumentId, existing);
            }
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === activeDocumentId
                  ? { ...d, width: cropW, height: cropH, origWidth: cropW, origHeight: cropH, isDirty: true }
                  : d
              )
            );
          }

          // Clear active selection and shift guides to relative cropped space
          setActiveSelection(null);
          setGuides((prev) =>
            prev
              .map((g) => ({
                ...g,
                position: g.orientation === 'vertical' ? g.position - cropX : g.position - cropY,
              }))
              .filter((g) =>
                g.orientation === 'vertical'
                  ? g.position >= 0 && g.position <= cropW
                  : g.position >= 0 && g.position <= cropH
              )
          );

          setLayers(shiftedLayers);
          layersRef.current = shiftedLayers;
          setCurrentDataUrl(croppedDataUrl);
          setResizeWidth(cropW);
          setResizeHeight(cropH);
          setCanvasWidth(cropW);
          setCanvasHeight(cropH);

          pushHistory(cropCanvas, shiftedLayers, `Crop (${cropW}×${cropH})`);

          // Calculate and apply optimal fit zoom for the new cropped canvas
          const fitZoom = calculateFitZoom(cropW, cropH);
          setZoom(fitZoom);
          setPan({ x: 0, y: 0 });

          // Exit crop mode completely and return to Move mode
          setActiveTool('move');
          setActiveTab('move');
          setCropBox({ x: 0, y: 0, width: cropW, height: cropH });
          setCropPreset('free');
          setIsProcessing(false);

          trackImageConvert({
            tool: 'edit_image',
            action: 'crop',
            width: cropW,
            height: cropH,
          });
        };

        if (sourceUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => finalizeCrop(img);
          img.onerror = () => finalizeCrop(activeCanvas);
          img.src = sourceUrl;
        } else {
          finalizeCrop(activeCanvas);
        }
      } catch (err) {
        setIsProcessing(false);
        setError(err?.message || 'Failed to crop image.');
      }
    }, 20);
  };

  const handleCancelCrop = () => {
    setActiveTool('move');
    setActiveTab('move');
    if (activeCanvas) {
      setCropBox({
        x: 0,
        y: 0,
        width: activeCanvas.width,
        height: activeCanvas.height,
      });
    } else {
      setCropBox({ x: 0, y: 0, width: 0, height: 0 });
    }
    setCropPreset('free');
  };

  const handleSelectCropPreset = (presetId) => {
    setCropPreset(presetId);
    if (!currentWidth || !currentHeight) return;
    if (presetId === 'free') return;

    let targetRatio = 1;
    if (presetId === 'custom') {
      const rw = Math.max(1, customRatioW);
      const rh = Math.max(1, customRatioH);
      targetRatio = rw / rh;
    } else {
      const found = CROP_PRESETS.find((p) => p.id === presetId);
      if (found && found.ratio) targetRatio = found.ratio;
    }

    const imgRatio = currentWidth / currentHeight;
    let boxW, boxH;

    if (targetRatio > imgRatio) {
      boxW = currentWidth;
      boxH = Math.max(1, Math.round(currentWidth / targetRatio));
    } else {
      boxH = currentHeight;
      boxW = Math.max(1, Math.round(currentHeight * targetRatio));
    }

    const boxX = Math.round((currentWidth - boxW) / 2);
    const boxY = Math.round((currentHeight - boxH) / 2);

    setCropBox({
      x: Math.max(0, boxX),
      y: Math.max(0, boxY),
      width: Math.min(currentWidth, boxW),
      height: Math.min(currentHeight, boxH),
    });
  };

  // ---------------------------------------------------------------------------
  // TAB 3: ROTATE ENGINE
  // ---------------------------------------------------------------------------
  const handleRotateLeft90 = () => {
    setRotateAngle((prev) => {
      const next = prev - 90;
      return next < -180 ? next + 360 : next;
    });
  };

  const handleRotateRight90 = () => {
    setRotateAngle((prev) => {
      const next = prev + 90;
      return next > 180 ? next - 360 : next;
    });
  };

  const handleRotate180 = () => {
    setRotateAngle((prev) => (prev >= 0 ? prev - 180 : prev + 180));
  };

  const handleResetRotation = () => {
    setRotateAngle(0);
    setFlipH(false);
    setFlipV(false);
  };

  const handleFlipH = () => setFlipH((prev) => !prev);
  const handleFlipV = () => setFlipV((prev) => !prev);

  // ---------------------------------------------------------------------------
  // ADVANCED IMAGE & CANVAS OPERATIONS (Image Menu)
  // ---------------------------------------------------------------------------
  const applyDocumentCrop = useCallback((cropX, cropY, cropW, cropH, historyLabel = 'Crop Image') => {
    if (!activeCanvas) return;
    cropX = Math.max(0, Math.round(cropX));
    cropY = Math.max(0, Math.round(cropY));
    cropW = Math.max(1, Math.min(currentWidth - cropX, Math.round(cropW)));
    cropH = Math.max(1, Math.min(currentHeight - cropY, Math.round(cropH)));

    if (cropW <= 0 || cropH <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const bgLayer = layersRef.current.find((l) => l.id === 'background' || l.isBackground);
        const sourceUrl = bgLayer?.dataUrl || currentDataUrl;

        const finalizeCrop = (sourceImgOrCanvas) => {
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const ctx = cropCanvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(sourceImgOrCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

          const croppedDataUrl = cropCanvas.toDataURL('image/png');

          const shiftedLayers = layersRef.current.map((l) => {
            if (l.id === 'background' || l.isBackground) {
              return {
                ...l,
                x: 0,
                y: 0,
                width: cropW,
                height: cropH,
                origWidth: cropW,
                origHeight: cropH,
                dataUrl: croppedDataUrl,
              };
            }
            return {
              ...l,
              x: (l.x || 0) - cropX,
              y: (l.y || 0) - cropY,
            };
          });

          if (activeDocumentId) {
            const existing = documentStoreRef.current.get(activeDocumentId);
            if (existing) {
              existing.width = cropW;
              existing.height = cropH;
              existing.origWidth = cropW;
              existing.origHeight = cropH;
              existing.isDirty = true;
              documentStoreRef.current.set(activeDocumentId, existing);
            }
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === activeDocumentId
                  ? { ...d, width: cropW, height: cropH, origWidth: cropW, origHeight: cropH, isDirty: true }
                  : d
              )
            );
          }

          setActiveSelection(null);
          setGuides((prev) =>
            prev
              .map((g) => ({
                ...g,
                position: g.orientation === 'vertical' ? g.position - cropX : g.position - cropY,
              }))
              .filter((g) =>
                g.orientation === 'vertical'
                  ? g.position >= 0 && g.position <= cropW
                  : g.position >= 0 && g.position <= cropH
              )
          );

          setLayers(shiftedLayers);
          layersRef.current = shiftedLayers;
          setCurrentDataUrl(croppedDataUrl);
          setResizeWidth(cropW);
          setResizeHeight(cropH);
          setCanvasWidth(cropW);
          setCanvasHeight(cropH);

          pushHistory(cropCanvas, shiftedLayers, `${historyLabel} (${cropW}×${cropH})`);

          const fitZoom = calculateFitZoom(cropW, cropH);
          setZoom(fitZoom);
          setPan({ x: 0, y: 0 });

          setActiveTool('move');
          setActiveTab('move');
          setCropBox({ x: 0, y: 0, width: cropW, height: cropH });
          setCropPreset('free');
          setIsProcessing(false);
        };

        if (sourceUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => finalizeCrop(img);
          img.onerror = () => finalizeCrop(activeCanvas);
          img.src = sourceUrl;
        } else {
          finalizeCrop(activeCanvas);
        }
      } catch (err) {
        setIsProcessing(false);
        setError(err?.message || 'Failed to process crop.');
      }
    }, 20);
  }, [activeCanvas, currentWidth, currentHeight, currentDataUrl, activeDocumentId, calculateFitZoom, pushHistory]);

  const handleCropToSelection = useCallback(() => {
    if (!activeSelection) {
      setError('Please create a selection with the Marquee or Lasso tool first.');
      return;
    }
    const { x, y, width, height } = activeSelection;
    if (width > 0 && height > 0) {
      applyDocumentCrop(x, y, width, height, 'Crop to Selection');
    }
  }, [activeSelection, applyDocumentCrop]);

  const handleCropToDocumentBounds = useCallback(() => {
    applyDocumentCrop(0, 0, currentWidth, currentHeight, 'Crop to Document Bounds');
  }, [currentWidth, currentHeight, applyDocumentCrop]);

  const handleTrimTransparent = useCallback(() => {
    if (!activeCanvas || !currentWidth || !currentHeight) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = currentWidth;
    tempCanvas.height = currentHeight;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(activeCanvas, 0, 0);

    const imgData = ctx.getImageData(0, 0, currentWidth, currentHeight);
    const data = imgData.data;

    let minX = currentWidth, minY = currentHeight, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < currentHeight; y++) {
      for (let x = 0; x < currentWidth; x++) {
        const alpha = data[(y * currentWidth + x) * 4 + 3];
        if (alpha > 5) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) {
      setError('Document canvas is completely transparent. Nothing to trim.');
      return;
    }

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    applyDocumentCrop(minX, minY, w, h, 'Trim Transparent Pixels');
  }, [activeCanvas, currentWidth, currentHeight, applyDocumentCrop]);

  const handleTrimWhite = useCallback(() => {
    if (!activeCanvas || !currentWidth || !currentHeight) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = currentWidth;
    tempCanvas.height = currentHeight;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(activeCanvas, 0, 0);

    const imgData = ctx.getImageData(0, 0, currentWidth, currentHeight);
    const data = imgData.data;

    let minX = currentWidth, minY = currentHeight, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < currentHeight; y++) {
      for (let x = 0; x < currentWidth; x++) {
        const idx = (y * currentWidth + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        const isWhite = a > 200 && r > 240 && g > 240 && b > 240;
        const isTransparent = a <= 10;
        if (!isWhite && !isTransparent) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) {
      setError('Document is entirely white. Nothing to trim.');
      return;
    }

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    applyDocumentCrop(minX, minY, w, h, 'Trim White Pixels');
  }, [activeCanvas, currentWidth, currentHeight, applyDocumentCrop]);

  const handleTrimTopLeft = useCallback(() => {
    if (!activeCanvas || !currentWidth || !currentHeight) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = currentWidth;
    tempCanvas.height = currentHeight;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(activeCanvas, 0, 0);

    const imgData = ctx.getImageData(0, 0, currentWidth, currentHeight);
    const data = imgData.data;

    const baseR = data[0];
    const baseG = data[1];
    const baseB = data[2];
    const baseA = data[3];

    let minX = currentWidth, minY = currentHeight, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < currentHeight; y++) {
      for (let x = 0; x < currentWidth; x++) {
        const idx = (y * currentWidth + x) * 4;
        const diff = Math.hypot(
          data[idx] - baseR,
          data[idx + 1] - baseG,
          data[idx + 2] - baseB,
          data[idx + 3] - baseA
        );
        if (diff > 18) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) {
      setError('Document is uniform color matching top-left pixel. Nothing to trim.');
      return;
    }

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    applyDocumentCrop(minX, minY, w, h, 'Trim Based on Top-Left');
  }, [activeCanvas, currentWidth, currentHeight, applyDocumentCrop]);

  const handleFitCanvasToContent = useCallback(() => {
    if (!layersRef.current.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    layersRef.current.forEach((l) => {
      if (l.hidden) return;
      const lx = l.x || 0;
      const ly = l.y || 0;
      const lw = l.width || 100;
      const lh = l.height || 100;
      if (lx < minX) minX = lx;
      if (ly < minY) minY = ly;
      if (lx + lw > maxX) maxX = lx + lw;
      if (ly + lh > maxY) maxY = ly + lh;
    });

    if (minX === Infinity) return;

    minX = Math.round(minX);
    minY = Math.round(minY);
    const newW = Math.max(10, Math.round(maxX - minX));
    const newH = Math.max(10, Math.round(maxY - minY));

    const shiftedLayers = layersRef.current.map((l) => ({
      ...l,
      x: (l.x || 0) - minX,
      y: (l.y || 0) - minY,
    }));

    setCanvasWidth(newW);
    setCanvasHeight(newH);
    setResizeWidth(newW);
    setResizeHeight(newH);
    setLayers(shiftedLayers);
    layersRef.current = shiftedLayers;

    if (activeDocumentId) {
      const existing = documentStoreRef.current.get(activeDocumentId);
      if (existing) {
        existing.width = newW;
        existing.height = newH;
        existing.isDirty = true;
        documentStoreRef.current.set(activeDocumentId, existing);
      }
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === activeDocumentId
            ? { ...d, width: newW, height: newH, isDirty: true }
            : d
        )
      );
    }

    pushHistory(null, shiftedLayers, `Fit Canvas to Content (${newW}×${newH})`);
  }, [activeDocumentId, pushHistory]);

  const handleDuplicateDocument = useCallback(() => {
    if (!activeDocumentId) return;
    const currentDoc = documents.find((d) => d.id === activeDocumentId);
    if (!currentDoc) return;

    const newId = generateDocId();
    const clonedLayers = (currentDoc.layers || layersRef.current).map((l) => cloneLayerData(l));
    const newDoc = {
      ...currentDoc,
      id: newId,
      name: `${currentDoc.name || 'Document'} copy`,
      layers: clonedLayers,
      isDirty: false,
    };

    documentStoreRef.current.set(newId, newDoc);
    setDocuments((prev) => [...prev, newDoc]);
    handleSwitchDocument(newId);
  }, [activeDocumentId, documents, handleSwitchDocument]);

  const handleFlattenImage = useCallback(() => {
    if (!activeCanvas || !currentWidth || !currentHeight) return;

    const flattenCanvas = document.createElement('canvas');
    flattenCanvas.width = currentWidth;
    flattenCanvas.height = currentHeight;
    const ctx = flattenCanvas.getContext('2d');

    const bgLayer = layersRef.current.find((l) => l.id === 'background' || l.isBackground);
    if (bgLayer?.dataUrl) {
      const img = new Image();
      img.src = bgLayer.dataUrl;
      if (img.complete) {
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
      }
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, currentWidth, currentHeight);
    }

    ctx.drawImage(activeCanvas, 0, 0);

    const flattenedUrl = flattenCanvas.toDataURL('image/png');
    const flatLayer = {
      id: 'background',
      name: 'Background',
      type: 'image',
      isBackground: true,
      x: 0,
      y: 0,
      width: currentWidth,
      height: currentHeight,
      origWidth: currentWidth,
      origHeight: currentHeight,
      dataUrl: flattenedUrl,
      opacity: 100,
      rotation: 0,
      locked: true,
      hidden: false,
    };

    const nextLayers = [flatLayer];
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId('background');
    setSelectedLayerIds(['background']);
    setCurrentDataUrl(flattenedUrl);

    pushHistory(flattenCanvas, nextLayers, 'Flatten Image');
  }, [activeCanvas, currentWidth, currentHeight, pushHistory]);

  const handleOpenAdjustment = useCallback((adjType) => {
    let targetLayerId = selectedLayerId;
    if (!targetLayerId) {
      const bg = layersRef.current.find((l) => l.id === 'background' || l.isBackground) || layersRef.current[0];
      if (bg) {
        targetLayerId = bg.id;
        setSelectedLayerId(bg.id);
        setSelectedLayerIds([bg.id]);
      }
    }

    if (!targetLayerId) {
      setError('Please open an image or select a layer to adjust.');
      return;
    }

    const targetLayer = layersRef.current.find((l) => l.id === targetLayerId);
    const sourceDataUrl = targetLayer?.dataUrl || currentDataUrl;

    if (!sourceDataUrl) {
      setError('Adjustments can only be applied to image or raster layers.');
      return;
    }

    const ADJ_MAP = {
      brightness: { category: 'ADJUSTMENTS', id: 'adj-brightness', label: 'Brightness / Contrast', paramName: 'Brightness', min: 0, max: 100, defaultVal: 50, unit: '', type: 'brightness' },
      contrast: { category: 'ADJUSTMENTS', id: 'adj-contrast', label: 'Contrast', paramName: 'Contrast', min: 0, max: 100, defaultVal: 50, unit: '', type: 'contrast' },
      exposure: { category: 'ADJUSTMENTS', id: 'adj-exposure', label: 'Exposure', paramName: 'Exposure', min: 0, max: 100, defaultVal: 50, unit: '', type: 'exposure' },
      hue: { category: 'ADJUSTMENTS', id: 'adj-hue', label: 'Hue / Saturation', paramName: 'Hue Shift', min: 0, max: 100, defaultVal: 50, unit: '', type: 'hue' },
      saturation: { category: 'ADJUSTMENTS', id: 'adj-saturation', label: 'Saturation', paramName: 'Saturation', min: 0, max: 100, defaultVal: 50, unit: '%', type: 'saturation' },
      levels: { category: 'ADJUSTMENTS', id: 'adj-levels', label: 'Levels', paramName: 'Gamma', min: 0, max: 100, defaultVal: 50, unit: '', type: 'levels' },
      grayscale: { category: 'ADJUSTMENTS', id: 'adj-grayscale', label: 'Grayscale', paramName: 'Fade', min: 0, max: 100, defaultVal: 100, unit: '%', type: 'grayscale' },
      invert: { category: 'ADJUSTMENTS', id: 'adj-invert', label: 'Invert Colors', paramName: 'Amount', min: 0, max: 100, defaultVal: 100, unit: '%', type: 'invert' },
      threshold: { category: 'ADJUSTMENTS', id: 'adj-threshold', label: 'Threshold', paramName: 'Threshold', min: 0, max: 100, defaultVal: 50, unit: '%', type: 'threshold' },
    };

    const item = ADJ_MAP[adjType] || { category: 'ADJUSTMENTS', id: `adj-${adjType}`, label: adjType, paramName: 'Amount', min: 0, max: 100, defaultVal: 50, unit: '', type: adjType };
    setActiveFilterDialog(item);
  }, [selectedLayerId, currentDataUrl]);

  const handleApplyCanvasBg = useCallback((opt, color) => {
    setCanvasBgOption(opt);
    if (color) setCanvasCustomColor(color);
    pushHistory(null, layersRef.current, `Set Canvas Background (${opt})`);
  }, [pushHistory]);

  handleTrimTransparentRef.current = handleTrimTransparent;
  handleRotateRight90Ref.current = handleRotateRight90;
  handleRotateLeft90Ref.current = handleRotateLeft90;
  handleFlipHRef.current = handleFlipH;
  handleFlipVRef.current = handleFlipV;

  // Calculate live bounding dimensions when rotated
  const rotatedDimensions = useMemo(() => {
    if (!currentWidth || !currentHeight) return { width: 0, height: 0 };
    const rad = (rotateAngle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const w = Math.max(1, Math.round(currentWidth * cos + currentHeight * sin));
    const h = Math.max(1, Math.round(currentWidth * sin + currentHeight * cos));
    return { width: w, height: h };
  }, [currentWidth, currentHeight, rotateAngle]);

  const handleApplyRotate = () => {
    if (!activeCanvas) return;
    if (rotateAngle === 0 && !flipH && !flipV) return;

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const rad = (rotateAngle * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const newW = Math.max(1, Math.round(currentWidth * cos + currentHeight * sin));
        const newH = Math.max(1, Math.round(currentWidth * sin + currentHeight * cos));

        const rotCanvas = document.createElement('canvas');
        rotCanvas.width = newW;
        rotCanvas.height = newH;
        const ctx = rotCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.translate(newW / 2, newH / 2);
        ctx.rotate(rad);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(activeCanvas, -currentWidth / 2, -currentHeight / 2);

        // Transform layers around image center
        const transformedLayers = layers.map((l) => {
          const cx = l.x + (l.width || 50) / 2 - currentWidth / 2;
          const cy = l.y + (l.height || 20) / 2 - currentHeight / 2;
          // Apply flip
          const fx = flipH ? -cx : cx;
          const fy = flipV ? -cy : cy;
          // Apply rotation
          const rx = fx * Math.cos(rad) - fy * Math.sin(rad);
          const ry = fx * Math.sin(rad) + fy * Math.cos(rad);
          // New position relative to new canvas center
          const newCenterX = rx + newW / 2;
          const newCenterY = ry + newH / 2;
          return {
            ...l,
            x: Math.round(newCenterX - (l.width || 50) / 2),
            y: Math.round(newCenterY - (l.height || 20) / 2),
            rotation: (l.rotation || 0) + rotateAngle,
          };
        });

        setLayers(transformedLayers);
        pushHistory(
          rotCanvas,
          transformedLayers,
          `Rotate (${rotateAngle}°, ${newW}×${newH})`
        );

        setRotateAngle(0);
        setFlipH(false);
        setFlipV(false);
        setIsProcessing(false);

        trackImageConvert({
          tool: 'edit_image',
          action: 'rotate',
          width: newW,
          height: newH,
        });
      } catch (err) {
        setIsProcessing(false);
        setError(err?.message || 'Failed to rotate image.');
      }
    }, 20);
  };

  // ---------------------------------------------------------------------------
  // TAB 4: APPLY CANVAS
  // ---------------------------------------------------------------------------
  const handleApplyCanvas = (options = {}) => {
    if (!activeCanvas) return;

    const newW = parseInt(options.width !== undefined ? options.width : canvasWidth, 10);
    const newH = parseInt(options.height !== undefined ? options.height : canvasHeight, 10);
    const anchor = options.anchor !== undefined ? options.anchor : canvasAnchor;
    const bgOption = options.bgOption !== undefined ? options.bgOption : canvasBgOption;
    const customColor = options.customColor !== undefined ? options.customColor : canvasCustomColor;

    if (isNaN(newW) || isNaN(newH) || newW <= 0 || newH <= 0) {
      setError('Canvas width and height must be positive numbers.');
      return;
    }

    if (newW > MAX_CANVAS_DIMENSION || newH > MAX_CANVAS_DIMENSION) {
      setError(`Maximum dimension is ${MAX_CANVAS_DIMENSION.toLocaleString()} px.`);
      return;
    }

    if (newW * newH > MAX_CANVAS_PIXELS) {
      setError('Total canvas area exceeds safe browser limit of 100 megapixels.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const newCanvas = document.createElement('canvas');
        newCanvas.width = newW;
        newCanvas.height = newH;
        const ctx = newCanvas.getContext('2d');

        const resolvedBg =
          bgOption === 'custom' ? customColor : bgOption;
        if (resolvedBg !== 'transparent') {
          ctx.fillStyle = resolvedBg;
          ctx.fillRect(0, 0, newW, newH);
        }

        let offsetX = 0;
        let offsetY = 0;

        if (anchor.includes('l')) offsetX = 0;
        else if (anchor.includes('r')) offsetX = newW - currentWidth;
        else offsetX = Math.round((newW - currentWidth) / 2);

        if (anchor.startsWith('t')) offsetY = 0;
        else if (anchor.startsWith('b')) offsetY = newH - currentHeight;
        else offsetY = Math.round((newH - currentHeight) / 2);

        ctx.drawImage(activeCanvas, offsetX, offsetY);

        // Adjust layers offset
        const shiftedLayers = layers.map((l) => ({
          ...l,
          x: l.x + offsetX,
          y: l.y + offsetY,
        }));

        setCanvasWidth(newW);
        setCanvasHeight(newH);
        setResizeWidth(newW);
        setResizeHeight(newH);
        setCanvasAnchor(anchor);
        setCanvasBgOption(bgOption);
        setCanvasCustomColor(customColor);

        setLayers(shiftedLayers);
        pushHistory(newCanvas, shiftedLayers, `Canvas (${newW}×${newH})`);
        setIsProcessing(false);

        trackImageConvert({
          tool: 'edit_image',
          action: 'canvas',
          width: newW,
          height: newH,
        });
      } catch (err) {
        setIsProcessing(false);
        setError(err?.message || 'Failed to resize canvas.');
      }
    }, 20);
  };

  // Synchronize refs for keyboard apply shortcuts
  handleApplyCropRef.current = handleApplyCrop;
  handleCancelCropRef.current = handleCancelCrop;
  handleApplyResizeRef.current = handleApplyResize;
  handleApplyRotateRef.current = handleApplyRotate;
  handleApplyCanvasRef.current = handleApplyCanvas;

  // ---------------------------------------------------------------------------
  // TAB 5: ADD TEXT ENGINE
  // ---------------------------------------------------------------------------
  const handleAddTextLayer = () => {
    if (!currentWidth || !currentHeight) return;

    if (activeTextDraftRef.current) {
      commitOrDiscardDraft();
    }
    if (editingTextLayerId) {
      finishEditingText(editingTextLayerId);
    }

    const defaultFontSize = textSettings.fontSize || 32;
    const defaultWidth = Math.min(220, Math.max(120, currentWidth - 40));
    const dims = calculateTextDimensions('', {
      fontSize: defaultFontSize,
      fontFamily: textSettings.fontFamily || 'Poppins',
      fontWeight: textSettings.fontWeight || 'bold',
      width: defaultWidth,
      autoWidth: true,
    });

    const draft = {
      isParagraph: false,
      text: '',
      x: Math.max(20, Math.round((currentWidth - defaultWidth) / 2)),
      y: Math.max(20, Math.round(currentHeight / 3)),
      width: defaultWidth,
      height: Math.max(dims.height, Math.round(defaultFontSize * 1.3)),
      autoWidth: true,
      fontSize: defaultFontSize,
      fontFamily: textSettings.fontFamily || 'Poppins',
      fontWeight: textSettings.fontWeight || 'bold',
      fontStyle: textSettings.fontStyle || 'normal',
      underline: Boolean(textSettings.underline),
      color: foregroundColor || '#1e293b',
      align: textSettings.align || 'left',
      bgColor: textSettings.bgColor || 'transparent',
      strokeColor: textSettings.strokeColor || '#000000',
      strokeWidth: textSettings.strokeWidth || 0,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 0,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      opacity: 100,
      rotation: 0,
      letterSpacing: textSettings.letterSpacing || 0,
      lineHeight: textSettings.lineHeight || 1.2,
      locked: false,
      hidden: false,
    };

    setActiveTextDraft(draft);
    activeTextDraftRef.current = draft;
    setEditingTextLayerId(null);
    setSelectedLayerId(null);
    setSelectedLayerIds([]);
    setActiveTab('text');
  };

  const handleStagePointerDown = (e) => {
    if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive || e.button === 1) {
      handleMouseDownViewport(e);
      return;
    }
    if (justCreatedTextIdRef.current) {
      return;
    }
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const effZoom = zoomRef.current || 1;
    const clickX = Math.round((e.clientX - rect.left) / effZoom);
    const clickY = Math.round((e.clientY - rect.top) / effZoom);

    // Selection tools
    if (['marquee-rect', 'marquee-ellipse', 'single-row-marquee', 'single-column-marquee', 'lasso', 'polygonal-lasso'].includes(activeTool)) {
      e.stopPropagation();

      // Check if clicking inside existing selection to move the selection boundary
      if (
        activeSelection &&
        activeSelection.width > 0 &&
        activeSelection.height > 0 &&
        clickX >= activeSelection.x &&
        clickX <= activeSelection.x + activeSelection.width &&
        clickY >= activeSelection.y &&
        clickY <= activeSelection.y + activeSelection.height &&
        !['single-row-marquee', 'single-column-marquee', 'polygonal-lasso'].includes(activeTool)
      ) {
        selectionMoveRef.current = {
          startX: clickX,
          startY: clickY,
          origX: activeSelection.x,
          origY: activeSelection.y,
          active: true,
        };
        return;
      }

      if (activeTool === 'single-row-marquee') {
        setActiveSelection({
          type: 'rect',
          x: 0,
          y: Math.max(0, Math.min(currentHeight - 1, clickY)),
          width: currentWidth,
          height: 1,
          feather: 0,
        });
        return;
      }

      if (activeTool === 'single-column-marquee') {
        setActiveSelection({
          type: 'rect',
          x: Math.max(0, Math.min(currentWidth - 1, clickX)),
          y: 0,
          width: 1,
          height: currentHeight,
          feather: 0,
        });
        return;
      }

      if (activeTool === 'polygonal-lasso') {
        const points = selectionDrawRef.current?.points ? [...selectionDrawRef.current.points] : [];
        if (points.length >= 3) {
          const first = points[0];
          const dist = Math.hypot(clickX - first.x, clickY - first.y);
          if (dist < 12) {
            const minX = Math.min(...points.map((p) => p.x));
            const minY = Math.min(...points.map((p) => p.y));
            const maxX = Math.max(...points.map((p) => p.x));
            const maxY = Math.max(...points.map((p) => p.y));
            setActiveSelection({
              type: 'polygon',
              points,
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
              feather: selectionFeather,
            });
            selectionDrawRef.current = null;
            return;
          }
        }
        points.push({ x: clickX, y: clickY });
        selectionDrawRef.current = { type: 'polygonal-lasso', points, active: true };
        return;
      }

      selectionDrawRef.current = {
        type: activeTool,
        startX: clickX,
        startY: clickY,
        currentX: clickX,
        currentY: clickY,
        points: [{ x: clickX, y: clickY }],
        active: true,
      };
      return;
    }

    if (activeTool === 'magic-wand') {
      e.stopPropagation();
      handleMagicWandClick(clickX, clickY);
      return;
    }

    // Pen tool
    if (activeTool === 'pen') {
      e.stopPropagation();

      // Case 1: Active drawing in progress
      if (penPath?.points?.length > 0) {
        // Check if clicking near first anchor point to close path
        if (penPath.points.length >= 3) {
          const first = penPath.points[0];
          const dist = Math.hypot(clickX - first.x, clickY - first.y);
          if (dist < 14) {
            handleClosePenPath();
            return;
          }
        }

        // Check if clicking an existing anchor point to select/move or delete it
        const existingIdx = penPath.points.findIndex(
          (pt) => Math.hypot(clickX - pt.x, clickY - pt.y) < 12
        );
        if (existingIdx !== -1) {
          if (e.altKey || penHoverMode === 'delete') {
            if (penPath.points.length > 2) {
              const nextPts = penPath.points.filter((_, i) => i !== existingIdx);
              setPenPath({ ...penPath, points: nextPts });
            }
            return;
          }
          penDragRef.current = {
            type: 'move-anchor',
            pointIndex: existingIdx,
            startX: clickX,
            startY: clickY,
            active: true,
          };
          return;
        }

        // Check if clicking near segment to insert node
        if (hoveredSegment) {
          const newPts = [...penPath.points];
          newPts.splice(hoveredSegment.insertIndex, 0, {
            x: hoveredSegment.projectedX,
            y: hoveredSegment.projectedY,
            type: 'corner',
          });
          setPenPath({ ...penPath, points: newPts });
          return;
        }

        // Otherwise append new anchor point and initiate Bézier handle dragging
        const currentPoints = [...penPath.points, { x: clickX, y: clickY, type: 'corner' }];
        setPenPath({ points: currentPoints, closed: false });
        penDragRef.current = {
          type: 'drag-bezier',
          pointIndex: currentPoints.length - 1,
          anchorX: clickX,
          anchorY: clickY,
          active: true,
        };
        return;
      }

      // Case 2: A vector shape layer is selected in editing mode
      const curShapeLayer = layersRef.current.find((l) => l.id === (selectedLayerId || selectedLayer?.id)) || selectedLayer;
      if (curShapeLayer && curShapeLayer.type === 'shape') {
        const shapePoints = curShapeLayer.points ? [...curShapeLayer.points] : convertShapeLayerToVectorPoints(curShapeLayer);
        const ox = curShapeLayer.x || 0;
        const oy = curShapeLayer.y || 0;
        const localX = clickX - ox;
        const localY = clickY - oy;

        // Check if clicking near anchor point
        const nodeIdx = shapePoints.findIndex((pt) => Math.hypot(localX - pt.x, localY - pt.y) < 14);
        if (nodeIdx >= 0) {
          if (e.altKey || penHoverMode === 'delete') {
            handleDeleteVectorNode(nodeIdx);
            return;
          }
          setSelectedVectorNodeIndex(nodeIdx);
          penDragRef.current = {
            type: 'move-vector-node',
            pointIndex: nodeIdx,
            startX: clickX,
            startY: clickY,
            anchorOrigX: shapePoints[nodeIdx].x,
            anchorOrigY: shapePoints[nodeIdx].y,
            active: true,
          };
          return;
        }

        // Check if clicking near segment to add node
        let segToAdd = hoveredSegment;
        if (!segToAdd) {
          const docPoints = shapePoints.map((p) => ({
            x: ox + p.x,
            y: oy + p.y,
            cp1: p.cp1 ? { x: ox + p.cp1.x, y: oy + p.cp1.y } : undefined,
            cp2: p.cp2 ? { x: ox + p.cp2.x, y: oy + p.cp2.y } : undefined,
          }));
          segToAdd = findClosestSegment(docPoints, clickX, clickY, true, 20);
        }

        if (segToAdd) {
          const localProjX = segToAdd.projectedX - ox;
          const localProjY = segToAdd.projectedY - oy;
          shapePoints.splice(segToAdd.insertIndex, 0, {
            x: localProjX,
            y: localProjY,
            type: 'corner',
          });
          const pathData = generateSvgPath(shapePoints, true);
          const updated = { ...curShapeLayer, points: shapePoints, pathData };
          const nextLayers = layersRef.current.map((l) => (l.id === curShapeLayer.id ? updated : l));
          setLayers(nextLayers);
          layersRef.current = nextLayers;
          setSelectedVectorNodeIndex(segToAdd.insertIndex);
          pushHistory(null, nextLayers, 'Add Anchor Point');
          return;
        }

        // Clicked outside existing shape: deselect and start new pen path
        setSelectedLayerId(null);
        setSelectedLayerIds([]);
        setSelectedVectorNodeIndex(null);
      }

      // Case 3: Start brand new pen path
      const currentPoints = [{ x: clickX, y: clickY, type: 'corner' }];
      setPenPath({ points: currentPoints, closed: false });
      penDragRef.current = {
        type: 'drag-bezier',
        pointIndex: 0,
        anchorX: clickX,
        anchorY: clickY,
        active: true,
      };
      return;
    }

    // Patch tool
    if (activeTool === 'patch') {
      e.stopPropagation();
      if (!patchState.selection) {
        patchDrawRef.current = {
          points: [{ x: clickX, y: clickY }],
          active: true,
        };
      } else {
        patchDragRef.current = {
          startX: clickX,
          startY: clickY,
          baseOffset: { ...patchState.sourceOffset },
          active: true,
        };
      }
      return;
    }

    // Freeform Crop drawing from any point on the canvas
    if (activeTool === 'crop') {
      e.stopPropagation();
      cropDrawRef.current = {
        startX: Math.max(0, Math.min(currentWidth, clickX)),
        startY: Math.max(0, Math.min(currentHeight, clickY)),
        active: true,
      };
      setCropBox({
        x: Math.max(0, Math.min(currentWidth, clickX)),
        y: Math.max(0, Math.min(currentHeight, clickY)),
        width: 0,
        height: 0,
      });
      return;
    }

    if (activeTool === 'text' || activeTool === 'text-vertical') {
      e.stopPropagation();
      if (activeTextDraftRef.current) {
        commitOrDiscardDraft();
      }
      if (editingTextLayerId) {
        finishEditingText(editingTextLayerId);
      }
      textDrawRef.current = {
        startX: clickX,
        startY: clickY,
        currentX: clickX,
        currentY: clickY,
        active: true,
      };
      return;
    }

    // Select tool on canvas: Hit-test layers first before empty stage marquee
    if (activeTool === 'move' || !activeTool) {
      const hitLayer = [...layersRef.current].reverse().find((l) => {
        if (l.hidden || l.locked) return false;
        if (l.id === 'background' && layersRef.current.length > 1) return false;
        const lx = l.x ?? 0;
        const ly = l.y ?? 0;
        const lw = l.width ?? 0;
        const lh = l.height ?? 0;
        return clickX >= lx && clickX <= lx + lw && clickY >= ly && clickY <= ly + lh;
      });

      if (hitLayer) {
        e.stopPropagation();
        handleLayerPointerDown(e, hitLayer.id, 'move');
        return;
      }

      canvasMarqueeRef.current = {
        startX: clickX,
        startY: clickY,
        currentX: clickX,
        currentY: clickY,
        active: true,
      };
      setCanvasMarquee({
        startX: clickX,
        startY: clickY,
        currentX: clickX,
        currentY: clickY,
        active: true,
      });
    }
  };

  const handleStagePointerMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const effZoom = zoomRef.current || 1;
    const curX = Math.round((e.clientX - rect.left) / effZoom);
    const curY = Math.round((e.clientY - rect.top) / effZoom);

    // Moving existing selection boundary
    if (selectionMoveRef.current?.active) {
      const dx = curX - selectionMoveRef.current.startX;
      const dy = curY - selectionMoveRef.current.startY;
      setActiveSelection((prev) =>
        prev
          ? {
              ...prev,
              x: Math.round(selectionMoveRef.current.origX + dx),
              y: Math.round(selectionMoveRef.current.origY + dy),
            }
          : null
      );
      return;
    }

    if (selectionDrawRef.current?.active) {
      if (selectionDrawRef.current.type === 'lasso') {
        selectionDrawRef.current.points.push({ x: curX, y: curY });
        setActiveSelection({
          type: 'lasso',
          points: [...selectionDrawRef.current.points],
          x: Math.min(...selectionDrawRef.current.points.map((p) => p.x)),
          y: Math.min(...selectionDrawRef.current.points.map((p) => p.y)),
          width: Math.max(...selectionDrawRef.current.points.map((p) => p.x)) - Math.min(...selectionDrawRef.current.points.map((p) => p.x)),
          height: Math.max(...selectionDrawRef.current.points.map((p) => p.y)) - Math.min(...selectionDrawRef.current.points.map((p) => p.y)),
          feather: selectionFeather,
        });
      } else {
        selectionDrawRef.current.currentX = curX;
        selectionDrawRef.current.currentY = curY;
        const sX = selectionDrawRef.current.startX;
        const sY = selectionDrawRef.current.startY;

        let rawW = Math.abs(curX - sX);
        let rawH = Math.abs(curY - sY);

        if (e.shiftKey) {
          const side = Math.max(rawW, rawH);
          rawW = side;
          rawH = side;
        }

        let minX, minY, w, h;
        if (e.altKey) {
          minX = sX - rawW;
          minY = sY - rawH;
          w = rawW * 2;
          h = rawH * 2;
        } else {
          minX = curX >= sX ? sX : sX - rawW;
          minY = curY >= sY ? sY : sY - rawH;
          w = rawW;
          h = rawH;
        }

        setActiveSelection({
          type: selectionDrawRef.current.type === 'marquee-rect' ? 'rect' : 'ellipse',
          x: Math.round(minX),
          y: Math.round(minY),
          width: Math.round(w),
          height: Math.round(h),
          feather: selectionFeather,
        });
      }
      return;
    }

    // Pen tool Bézier handle drag / anchor point move
    if (activeTool === 'pen') {
      setPenCursorPos({ x: curX, y: curY });

      if (penDragRef.current?.active) {
        const idx = penDragRef.current.pointIndex;
        if (penDragRef.current.type === 'drag-bezier') {
          const dx = curX - penDragRef.current.anchorX;
          const dy = curY - penDragRef.current.anchorY;
          setPenPath((prev) => {
            if (!prev?.points || !prev.points[idx]) return prev;
            const nextPoints = [...prev.points];
            nextPoints[idx] = {
              ...nextPoints[idx],
              type: 'smooth',
              cp1: { x: Math.round(nextPoints[idx].x - dx), y: Math.round(nextPoints[idx].y - dy) },
              cp2: { x: Math.round(nextPoints[idx].x + dx), y: Math.round(nextPoints[idx].y + dy) },
            };
            return { ...prev, points: nextPoints };
          });
        } else if (penDragRef.current.type === 'move-anchor') {
          setPenPath((prev) => {
            if (!prev?.points || !prev.points[idx]) return prev;
            const nextPoints = [...prev.points];
            const old = nextPoints[idx];
            const dx = curX - old.x;
            const dy = curY - old.y;
            nextPoints[idx] = {
              ...old,
              x: curX,
              y: curY,
              cp1: old.cp1 ? { x: old.cp1.x + dx, y: old.cp1.y + dy } : undefined,
              cp2: old.cp2 ? { x: old.cp2.x + dx, y: old.cp2.y + dy } : undefined,
            };
            return { ...prev, points: nextPoints };
          });
        } else if (penDragRef.current.type === 'move-vector-node') {
          if (selectedLayer && selectedLayer.type === 'shape' && selectedLayer.points) {
            const ox = selectedLayer.x || 0;
            const oy = selectedLayer.y || 0;
            const currentPoints = [...selectedLayer.points];
            const old = currentPoints[idx];
            if (old) {
              const newLocalX = curX - ox;
              const newLocalY = curY - oy;
              const dLocalX = newLocalX - old.x;
              const dLocalY = newLocalY - old.y;
              currentPoints[idx] = {
                ...old,
                x: newLocalX,
                y: newLocalY,
                cp1: old.cp1 ? { x: old.cp1.x + dLocalX, y: old.cp1.y + dLocalY } : undefined,
                cp2: old.cp2 ? { x: old.cp2.x + dLocalX, y: old.cp2.y + dLocalY } : undefined,
              };
              const pathData = generateSvgPath(currentPoints, true);
              const updated = { ...selectedLayer, points: currentPoints, pathData };
              setLayers((prev) => prev.map((l) => (l.id === selectedLayer.id ? updated : l)));
              layersRef.current = layersRef.current.map((l) => (l.id === selectedLayer.id ? updated : l));
            }
          }
        } else if (penDragRef.current.type === 'drag-handle') {
          if (selectedLayer && selectedLayer.type === 'shape' && selectedLayer.points) {
            const ox = selectedLayer.x || 0;
            const oy = selectedLayer.y || 0;
            const handleName = penDragRef.current.handleName;
            const currentPoints = [...selectedLayer.points];
            const pt = currentPoints[idx];
            if (pt) {
              const newHx = curX - ox;
              const newHy = curY - oy;
              const updatedPt = { ...pt, [handleName]: { x: Math.round(newHx), y: Math.round(newHy) } };
              if (pt.type === 'smooth' || pt.type === 'symmetric') {
                const opp = handleName === 'cp1' ? 'cp2' : 'cp1';
                const dx = newHx - pt.x;
                const dy = newHy - pt.y;
                const dist = Math.hypot(dx, dy) || 1;
                const oppDist = pt.type === 'symmetric'
                  ? dist
                  : (pt[opp] ? Math.hypot(pt[opp].x - pt.x, pt[opp].y - pt.y) : dist);
                updatedPt[opp] = {
                  x: Math.round(pt.x - (dx / dist) * oppDist),
                  y: Math.round(pt.y - (dy / dist) * oppDist),
                };
              }
              currentPoints[idx] = updatedPt;
              const pathData = generateSvgPath(currentPoints, true);
              const updated = { ...selectedLayer, points: currentPoints, pathData };
              setLayers((prev) => prev.map((l) => (l.id === selectedLayer.id ? updated : l)));
              layersRef.current = layersRef.current.map((l) => (l.id === selectedLayer.id ? updated : l));
            }
          }
        }
        return;
      }

      // Dynamic hover detection when NOT dragging:
      // Case A: Hovering while drawing unclosed penPath
      if (penPath?.points?.length) {
        if (penPath.points.length >= 3 && !penPath.closed) {
          const first = penPath.points[0];
          if (Math.hypot(curX - first.x, curY - first.y) < 14) {
            setPenHoverMode('close');
            setHoveredSegment(null);
            return;
          }
        }
        const nearPt = penPath.points.some((pt) => Math.hypot(curX - pt.x, curY - pt.y) < 12);
        if (nearPt) {
          setPenHoverMode('delete');
          setHoveredSegment(null);
          return;
        }
        const closestSeg = findClosestSegment(penPath.points, curX, curY, false, 8);
        if (closestSeg) {
          setPenHoverMode('add');
          setHoveredSegment(closestSeg);
          return;
        }
        setHoveredSegment(null);
        setPenHoverMode('pen');
        return;
      }

      // Case B: Hovering while editing existing vector shape layer
      if (selectedLayer && selectedLayer.type === 'shape') {
        const shapePoints = selectedLayer.points || convertShapeLayerToVectorPoints(selectedLayer);
        const ox = selectedLayer.x || 0;
        const oy = selectedLayer.y || 0;
        const docPoints = shapePoints.map((p) => ({
          x: ox + p.x,
          y: oy + p.y,
          cp1: p.cp1 ? { x: ox + p.cp1.x, y: oy + p.cp1.y } : undefined,
          cp2: p.cp2 ? { x: ox + p.cp2.x, y: oy + p.cp2.y } : undefined,
        }));
        const nearPt = docPoints.some((pt) => Math.hypot(curX - pt.x, curY - pt.y) < 12);
        if (nearPt) {
          setPenHoverMode('delete');
          setHoveredSegment(null);
          return;
        }
        const closestSeg = findClosestSegment(docPoints, curX, curY, true, 16);
        if (closestSeg) {
          setPenHoverMode('add');
          setHoveredSegment(closestSeg);
          return;
        }
        setHoveredSegment(null);
        setPenHoverMode('pen');
        return;
      }

      setHoveredSegment(null);
      setPenHoverMode('pen');
    }

    // Freeform Crop drawing move
    if (cropDrawRef.current?.active) {
      const sX = cropDrawRef.current.startX;
      const sY = cropDrawRef.current.startY;
      const cX = Math.max(0, Math.min(currentWidth, curX));
      const cY = Math.max(0, Math.min(currentHeight, curY));

      let newX = Math.min(sX, cX);
      let newY = Math.min(sY, cY);
      let newW = Math.abs(cX - sX);
      let newH = Math.abs(cY - sY);

      let targetRatio = null;
      if (cropPreset === 'custom') {
        targetRatio = Math.max(1, customRatioW) / Math.max(1, customRatioH);
      } else if (cropPreset !== 'free') {
        const preset = CROP_PRESETS.find((p) => p.id === cropPreset);
        if (preset?.ratio) targetRatio = preset.ratio;
      }

      if (targetRatio && newW > 0) {
        newH = Math.round(newW / targetRatio);
        if (newY + newH > currentHeight) {
          newH = currentHeight - newY;
          newW = Math.round(newH * targetRatio);
        }
      }

      setCropBox({
        x: Math.max(0, Math.min(currentWidth - 1, newX)),
        y: Math.max(0, Math.min(currentHeight - 1, newY)),
        width: Math.max(1, newW),
        height: Math.max(1, newH),
      });
      return;
    }

    // Text Tool drag move (showing live paragraph frame box)
    if (textDrawRef.current?.active) {
      textDrawRef.current.currentX = curX;
      textDrawRef.current.currentY = curY;
      setTextDragBox({
        x: Math.min(textDrawRef.current.startX, curX),
        y: Math.min(textDrawRef.current.startY, curY),
        width: Math.abs(curX - textDrawRef.current.startX),
        height: Math.abs(curY - textDrawRef.current.startY),
      });
      return;
    }

    if (canvasMarqueeRef.current?.active) {
      canvasMarqueeRef.current.currentX = curX;
      canvasMarqueeRef.current.currentY = curY;
      setCanvasMarquee({
        startX: canvasMarqueeRef.current.startX,
        startY: canvasMarqueeRef.current.startY,
        currentX: curX,
        currentY: curY,
        active: true,
      });
      return;
    }

    if (patchDrawRef.current?.active) {
      patchDrawRef.current.points.push({ x: curX, y: curY });
      const pts = patchDrawRef.current.points;
      const minX = Math.min(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const maxX = Math.max(...pts.map((p) => p.x));
      const maxY = Math.max(...pts.map((p) => p.y));
      setPatchState({
        selection: {
          type: 'lasso',
          points: [...pts],
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
        sourceOffset: { x: 0, y: 0 },
        isDragging: false,
      });
      return;
    }

    if (patchDragRef.current?.active) {
      const dx = curX - patchDragRef.current.startX;
      const dy = curY - patchDragRef.current.startY;
      setPatchState((prev) => ({
        ...prev,
        sourceOffset: {
          x: (patchDragRef.current.baseOffset?.x || 0) + dx,
          y: (patchDragRef.current.baseOffset?.y || 0) + dy,
        },
        isDragging: true,
      }));
    }
  };

  const handleStagePointerUp = () => {
    if (selectionMoveRef.current?.active) {
      selectionMoveRef.current.active = false;
      selectionMoveRef.current = null;
    }

    if (penDragRef.current?.active) {
      const dragType = penDragRef.current.type;
      penDragRef.current.active = false;
      penDragRef.current = null;
      if (dragType === 'move-vector-node' || dragType === 'drag-handle') {
        pushHistory(null, layersRef.current, 'Edit Vector Shape');
      }
      return;
    }

    if (selectionDrawRef.current?.active) {
      selectionDrawRef.current.active = false;
    }

    if (cropDrawRef.current?.active) {
      cropDrawRef.current.active = false;
      cropDrawRef.current = null;
      setCropBox((prev) => {
        if (prev.width < 10 || prev.height < 10) {
          return {
            x: 0,
            y: 0,
            width: currentWidth,
            height: currentHeight,
          };
        }
        return prev;
      });
      return;
    }

    if (textDrawRef.current?.active) {
      const { startX, startY, currentX, currentY } = textDrawRef.current;
      textDrawRef.current = null;
      setTextDragBox(null);

      const dragDist = Math.hypot(currentX - startX, currentY - startY);
      const isParagraph = dragDist > 20;

      const minX = Math.min(startX, currentX);
      const minY = Math.min(startY, currentY);
      const w = Math.max(20, Math.abs(currentX - startX));
      const h = Math.max(20, Math.abs(currentY - startY));

      const defaultFontSize = textSettings.fontSize || (isParagraph ? 16 : 32);
      const defaultWidth = isParagraph ? Math.max(120, w) : 260;
      const defaultHeight = isParagraph ? Math.max(60, h) : Math.round(defaultFontSize * 1.5);

      const posX = Math.max(0, Math.min(Math.max(0, (currentWidth || 800) - 40), minX));
      const posY = Math.max(0, Math.min(Math.max(0, (currentHeight || 600) - 20), minY));

      const draft = {
        isParagraph,
        text: '',
        x: posX,
        y: posY,
        width: defaultWidth,
        height: defaultHeight,
        autoWidth: !isParagraph,
        fontFamily: textSettings.fontFamily || 'Poppins',
        fontSize: defaultFontSize,
        fontWeight: textSettings.fontWeight || (isParagraph ? 'normal' : 'bold'),
        fontStyle: textSettings.fontStyle || 'normal',
        underline: Boolean(textSettings.underline),
        color: foregroundColor || '#1e293b',
        align: textSettings.align || 'left',
        bgColor: textSettings.bgColor || 'transparent',
        strokeColor: textSettings.strokeColor || '#000000',
        strokeWidth: textSettings.strokeWidth || 0,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowBlur: 0,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        letterSpacing: textSettings.letterSpacing || 0,
        lineHeight: textSettings.lineHeight || 1.2,
        locked: false,
        hidden: false,
        opacity: textSettings.opacity !== undefined ? textSettings.opacity : 100,
        rotation: 0,
      };

      setActiveTextDraft(draft);
      activeTextDraftRef.current = draft;
      setEditingTextLayerId(null);
      setSelectedLayerId(null);
      setSelectedLayerIds([]);
      return;
    }

    if (canvasMarqueeRef.current?.active) {
      const sX = canvasMarqueeRef.current.startX;
      const sY = canvasMarqueeRef.current.startY;
      const cX = canvasMarqueeRef.current.currentX;
      const cY = canvasMarqueeRef.current.currentY;
      const bX = Math.min(sX, cX);
      const bY = Math.min(sY, cY);
      const bW = Math.abs(cX - sX);
      const bH = Math.abs(cY - sY);

      canvasMarqueeRef.current = null;
      setCanvasMarquee(null);

      if (bW > 8 && bH > 8) {
        const intersecting = layersRef.current.filter((l) => {
          if (l.hidden) return false;
          const lx = l.x || 0;
          const ly = l.y || 0;
          const lw = l.width || 100;
          const lh = l.height || 100;
          return !(lx + lw < bX || lx > bX + bW || ly + lh < bY || ly > bY + bH);
        });
        if (intersecting.length > 0) {
          const ids = intersecting.map((l) => l.id);
          setSelectedLayerIds(ids);
          setSelectedLayerId(ids[ids.length - 1]);
        }
      }
    }

    if (patchDrawRef.current?.active) {
      patchDrawRef.current.active = false;
    }

    if (patchDragRef.current?.active) {
      patchDragRef.current.active = false;
    }
  };

  const handleStageClick = (e) => {
    if (activeTool === 'crop' || activeTab === 'crop') return;
    if (justCreatedTextIdRef.current) {
      return;
    }
    if (activeTool === 'text' || activeTool === 'text-vertical') {
      return;
    }
    if (activeTextDraftRef.current) {
      commitOrDiscardDraft();
    }
    if (editingTextLayerId) {
      finishEditingText(editingTextLayerId);
      return;
    }
    if (Date.now() - layerPointerDownTimeRef.current < 400) {
      return;
    }
    if (e.target === viewportRef.current || e.target === stageRef.current) {
      setSelectedLayerId(null);
      setSelectedLayerIds([]);
      setEditingTextLayerId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 6: ERASE ENGINE (Real pixel erasure revealing transparency)
  // ---------------------------------------------------------------------------
  const handleEraseStart = (e) => {
    if (activeTab !== 'erase' || !activeCanvas || !stageRef.current) return;
    setIsErasing(true);

    const rect = stageRef.current.getBoundingClientRect();
    const effZoom = zoom || 1;
    const imgX = (e.clientX - rect.left) / effZoom;
    const imgY = (e.clientY - rect.top) / effZoom;

    eraseLastPointRef.current = { x: imgX, y: imgY };
    applyEraseStamp(imgX, imgY);
  };

  const applyEraseStamp = (x, y) => {
    if (!activeCanvas) return;
    const ctx = activeCanvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const radius = Math.max(1, brushSize / 2);

    if (brushHardness < 95) {
      const grad = ctx.createRadialGradient(
        x,
        y,
        radius * (brushHardness / 100),
        x,
        y,
        radius
      );
      grad.addColorStop(0, `rgba(0, 0, 0, ${brushOpacity / 100})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = `rgba(0, 0, 0, ${brushOpacity / 100})`;
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    setCurrentDataUrl(activeCanvas.toDataURL('image/png'));
  };

  const handleEraseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const effZoom = zoom || 1;
    const imgX = (e.clientX - rect.left) / effZoom;
    const imgY = (e.clientY - rect.top) / effZoom;

    // Track cursor ring position
    setCursorPos({ x: e.clientX, y: e.clientY, visible: true });

    if (!isErasing || !eraseLastPointRef.current) return;

    // Interpolate points along stroke for smoothness
    const p1 = eraseLastPointRef.current;
    const dist = Math.hypot(imgX - p1.x, imgY - p1.y);
    const step = Math.max(1, brushSize / 5);
    const numSteps = Math.ceil(dist / step);

    for (let i = 1; i <= numSteps; i++) {
      const t = i / numSteps;
      const interpX = p1.x + (imgX - p1.x) * t;
      const interpY = p1.y + (imgY - p1.y) * t;
      applyEraseStamp(interpX, interpY);
    }

    eraseLastPointRef.current = { x: imgX, y: imgY };
  };

  const handleEraseEnd = () => {
    if (!isErasing) return;
    setIsErasing(false);
    eraseLastPointRef.current = null;
    pushHistory(activeCanvas, layers, 'Erase Stroke');
  };

  const handleClearEraserChanges = () => {
    if (history.length === 0) return;
    const originalCanvas = history[0].canvas;
    const newCanvas = document.createElement('canvas');
    newCanvas.width = originalCanvas.width;
    newCanvas.height = originalCanvas.height;
    const ctx = newCanvas.getContext('2d');
    ctx.drawImage(originalCanvas, 0, 0);

    pushHistory(newCanvas, layersRef.current, 'Clear Eraser Changes');
  };

  // ---------------------------------------------------------------------------
  // PHOTOSHOP-STYLE BLANK LAYER CREATION & STACK OPERATIONS
  // ---------------------------------------------------------------------------
  const handleAddBlankLayer = useCallback(() => {
    // Determine next automatic layer name: Layer 1, Layer 2, Layer 3...
    let maxNum = 0;
    layersRef.current.forEach((l) => {
      const match = (l.name || '').match(/^Layer\s+(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const layerName = `Layer ${maxNum + 1}`;

    const newLayer = {
      id: 'layer_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: layerName,
      type: 'blank',
      x: 0,
      y: 0,
      width: currentWidth || 800,
      height: currentHeight || 600,
      opacity: 100,
      rotation: 0,
      hidden: false,
      locked: false,
    };

    const nextLayers = [...layersRef.current];
    let insertIdx = nextLayers.length;
    if (selectedLayerId) {
      const foundIdx = nextLayers.findIndex((l) => l.id === selectedLayerId);
      if (foundIdx !== -1) {
        insertIdx = foundIdx + 1; // Insert directly above currently selected layer
      }
    }
    nextLayers.splice(insertIdx, 0, newLayer);

    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newLayer.id);
    setActiveTool('move');
    pushHistory(null, nextLayers, `Add ${layerName}`);
  }, [currentWidth, currentHeight, selectedLayerId, pushHistory]);

  const handleAddBlankLayerAbove = useCallback((targetId) => {
    let maxNum = 0;
    layersRef.current.forEach((l) => {
      const match = (l.name || '').match(/^Layer\s+(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const layerName = `Layer ${maxNum + 1}`;

    const newLayer = {
      id: 'layer_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: layerName,
      type: 'blank',
      x: 0,
      y: 0,
      width: currentWidth || 800,
      height: currentHeight || 600,
      opacity: 100,
      rotation: 0,
      hidden: false,
      locked: false,
    };

    const nextLayers = [...layersRef.current];
    const targetIdx = targetId ? nextLayers.findIndex((l) => l.id === targetId) : -1;
    const insertIdx = targetIdx !== -1 ? targetIdx + 1 : nextLayers.length;
    nextLayers.splice(insertIdx, 0, newLayer);

    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newLayer.id);
    setActiveTool('move');
    pushHistory(null, nextLayers, `Add ${layerName}`);
  }, [currentWidth, currentHeight, pushHistory]);

  const handleAddBlankLayerBelow = useCallback((targetId) => {
    let maxNum = 0;
    layersRef.current.forEach((l) => {
      const match = (l.name || '').match(/^Layer\s+(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const layerName = `Layer ${maxNum + 1}`;

    const newLayer = {
      id: 'layer_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: layerName,
      type: 'blank',
      x: 0,
      y: 0,
      width: currentWidth || 800,
      height: currentHeight || 600,
      opacity: 100,
      rotation: 0,
      hidden: false,
      locked: false,
    };

    const nextLayers = [...layersRef.current];
    const targetIdx = targetId ? nextLayers.findIndex((l) => l.id === targetId) : -1;
    const insertIdx = targetIdx !== -1 ? Math.max(0, targetIdx) : 0;
    nextLayers.splice(insertIdx, 0, newLayer);

    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newLayer.id);
    setActiveTool('move');
    pushHistory(null, nextLayers, `Add ${layerName}`);
  }, [currentWidth, currentHeight, pushHistory]);

  const handleAddShapeLayer = useCallback((shapeType = 'rect') => {
    if (!currentWidth || !currentHeight) return;
    const w = 220;
    const h = 140;
    const shapeLabel = shapeType === 'circle' ? 'Circle' : shapeType === 'rounded-rect' ? 'Rounded Rect' : 'Rectangle';
    const newShape = {
      id: 'shape_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: `${shapeLabel} Layer`,
      type: 'shape',
      shapeType,
      x: Math.max(20, Math.round((currentWidth - w) / 2)),
      y: Math.max(20, Math.round((currentHeight - h) / 2)),
      width: w,
      height: h,
      fillColor: foregroundColor || '#7c3aed',
      strokeColor: '#000000',
      strokeWidth: 2,
      borderRadius: shapeType === 'rounded-rect' ? 16 : 0,
      opacity: 100,
      rotation: 0,
      hidden: false,
      locked: false,
    };
    const nextLayers = [...layersRef.current, newShape];
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newShape.id);
    setSelectedLayerIds([newShape.id]);
    setActiveTool('move');
    pushHistory(null, nextLayers, `Add ${newShape.name}`);
  }, [currentWidth, currentHeight, foregroundColor, pushHistory]);

  const handleAddGroup = useCallback(() => {
    let maxNum = 0;
    layersRef.current.forEach((l) => {
      const match = (l.name || '').match(/^Group\s+(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const groupName = `Group ${maxNum + 1}`;

    const newGroup = {
      id: 'group_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: groupName,
      type: 'group',
      x: 0,
      y: 0,
      width: currentWidth || 800,
      height: currentHeight || 600,
      opacity: 100,
      rotation: 0,
      hidden: false,
      locked: false,
    };

    const nextLayers = [...layersRef.current];
    let insertIdx = nextLayers.length;
    if (selectedLayerIds.length > 0) {
      const topSelectedIdx = Math.max(
        ...selectedLayerIds.map((id) => nextLayers.findIndex((l) => l.id === id))
      );
      if (topSelectedIdx >= 0) {
        insertIdx = topSelectedIdx + 1;
      }
    } else if (selectedLayerId) {
      const foundIdx = nextLayers.findIndex((l) => l.id === selectedLayerId);
      if (foundIdx !== -1) {
        insertIdx = foundIdx + 1;
      }
    }
    nextLayers.splice(insertIdx, 0, newGroup);

    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newGroup.id);
    setSelectedLayerIds([newGroup.id]);
    setActiveTool('move');
    pushHistory(null, nextLayers, `Create ${groupName}`);
  }, [currentWidth, currentHeight, selectedLayerId, selectedLayerIds, pushHistory]);

  const handleApplyTextPreset = useCallback(
    (preset) => {
      if (!preset) return;
      const effWidth = Math.min(
        Math.max(120, preset.autoWidth ? 320 : 450),
        Math.max(120, (currentWidth || 800) - 40)
      );
      const effHeight = preset.autoWidth ? Math.round(preset.fontSize * 1.5) : 140;

      // If an existing text layer is currently selected, apply typography to it non-destructively
      const curSelected = layersRef.current.find((l) => l.id === selectedLayerId);
      if (curSelected && curSelected.type === 'text') {
        const updated = {
          fontSize: preset.fontSize,
          fontWeight: preset.fontWeight,
          lineHeight: preset.lineHeight,
          letterSpacing: preset.letterSpacing,
          align: preset.align || curSelected.align || 'left',
          autoWidth: Boolean(preset.autoWidth),
          text: preset.sampleText || curSelected.text,
          width: effWidth,
          height: effHeight,
        };
        handleUpdateLayer(curSelected.id, updated, true);
        setEditingTextLayerId(curSelected.id);
        return;
      }

      // Otherwise create a new text layer with preset values
      const newId = 'text_' + Date.now();
      const newLayer = {
        id: newId,
        name: preset.label || 'Text Layer',
        type: 'text',
        text: preset.sampleText || 'Lorem Ipsum Dolor Sit Amet',
        placeholder: 'Type your text here',
        x: Math.max(20, Math.round(((currentWidth || 800) - effWidth) / 2)),
        y: Math.max(20, Math.round(((currentHeight || 600) - effHeight) / 2)),
        width: effWidth,
        height: effHeight,
        autoWidth: Boolean(preset.autoWidth),
        fontSize: preset.fontSize,
        fontFamily: textSettings.fontFamily || 'Poppins',
        fontWeight: preset.fontWeight,
        fontStyle: 'normal',
        underline: false,
        color: foregroundColor || '#1e293b',
        align: preset.align || 'left',
        bgColor: 'transparent',
        strokeColor: '#000000',
        strokeWidth: 0,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowBlur: 0,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        opacity: 100,
        rotation: 0,
        letterSpacing: preset.letterSpacing,
        lineHeight: preset.lineHeight,
        hidden: false,
        locked: false,
      };

      const nextLayers = [...layersRef.current, newLayer];
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      setSelectedLayerId(newId);
      setSelectedLayerIds([newId]);
      setEditingTextLayerId(newId);
      pushHistory(null, nextLayers, `Apply Preset (${preset.label})`);
    },
    [currentWidth, currentHeight, selectedLayerId, textSettings, foregroundColor, handleUpdateLayer, pushHistory]
  );

  // ---------------------------------------------------------------------------
  // TAB 7: SHAPES ENGINE
  // ---------------------------------------------------------------------------
  const handleAddShape = (shapeType) => {
    if (!currentWidth || !currentHeight) return;

    const shapeLabel = SHAPE_TYPES.find((s) => s.id === shapeType)?.label || 'Shape';
    const baseDim = Math.max(60, Math.round(Math.min(currentWidth, currentHeight) * 0.22));
    const newShape = {
      id: 'shape_' + Date.now(),
      name: shapeLabel,
      type: 'shape',
      shapeType,
      x: Math.max(20, Math.round((currentWidth - baseDim) / 2)),
      y: Math.max(20, Math.round((currentHeight - baseDim) / 2)),
      width: shapeType === 'line' ? Math.round(baseDim * 1.5) : baseDim,
      height: shapeType === 'line' ? 24 : baseDim,
      fillColor: shapeType === 'line' ? 'transparent' : (foregroundColor || '#7C3AED'),
      strokeColor: backgroundColor || '#FFFFFF',
      strokeWidth: 3,
      borderRadius: 16,
      opacity: 100,
      rotation: 0,
      hidden: false,
      locked: false,
    };

    const nextLayers = [...layersRef.current, newShape];
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newShape.id);
    setSelectedLayerIds([newShape.id]);
    setActiveTool('move');
    pushHistory(null, nextLayers, `Add ${shapeLabel}`);
  };

  useEffect(() => {
    window.__editorAddShape = handleAddShape;
    window.__editorUpdateLayer = handleUpdateLayer;
    window.__editorGetLayers = () => layersRef.current;
    // Test helper: add anchor node directly on the currently selected vector shape
    window.__editorAddAnchorNode = (docX, docY) => {
      const curLayer = layersRef.current.find((l) => l.id === selectedLayerId && l.type === 'shape');
      if (!curLayer || !curLayer.points) return false;
      const shapePoints = [...curLayer.points];
      const ox = curLayer.x || 0;
      const oy = curLayer.y || 0;
      const docPoints = shapePoints.map((p) => ({
        x: ox + p.x, y: oy + p.y,
        cp1: p.cp1 ? { x: ox + p.cp1.x, y: oy + p.cp1.y } : undefined,
        cp2: p.cp2 ? { x: ox + p.cp2.x, y: oy + p.cp2.y } : undefined,
      }));
      const seg = findClosestSegment(docPoints, docX, docY, true, 9999);
      if (!seg) return false;
      const localProjX = seg.projectedX - ox;
      const localProjY = seg.projectedY - oy;
      shapePoints.splice(seg.insertIndex, 0, { x: localProjX, y: localProjY, type: 'corner' });
      const pathData = generateSvgPath(shapePoints, true);
      const updated = { ...curLayer, points: shapePoints, pathData };
      const nextLayers = layersRef.current.map((l) => (l.id === curLayer.id ? updated : l));
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      setSelectedVectorNodeIndex(seg.insertIndex);
      return true;
    };
    return () => {
      delete window.__editorAddShape;
      delete window.__editorUpdateLayer;
      delete window.__editorGetLayers;
      delete window.__editorAddAnchorNode;
    };
  }, [handleAddShape, handleUpdateLayer, selectedLayerId]);

  // ---------------------------------------------------------------------------
  // INTERACTIVE PHOTOSHOP-STYLE SHAPE DRAWING (Pointer Down, Drag, Up)
  // ---------------------------------------------------------------------------
  const isShapeDrawingTool = Boolean(
    hasImage && ['rect', 'circle', 'ellipse', 'triangle', 'line', 'star', 'rounded-rect'].includes(activeTool)
  );

  const handleShapeDrawStart = (e) => {
    if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive || e.button === 1) {
      handleMouseDownViewport(e);
      return;
    }
    if (!stageRef.current) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    e.stopPropagation();

    const rect = stageRef.current.getBoundingClientRect();
    const effZoom = zoomRef.current || 1;
    const rawX = Math.round((e.clientX - rect.left) / effZoom);
    const rawY = Math.round((e.clientY - rect.top) / effZoom);

    const startX = Math.max(0, Math.min(displayWidth, rawX));
    const startY = Math.max(0, Math.min(displayHeight, rawY));

    shapeDrawRef.current = {
      active: true,
      startX,
      startY,
      shapeType: activeTool,
      pointerId: e.pointerId,
    };

    if (e.currentTarget?.setPointerCapture && e.pointerId !== undefined) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch { }
    }

    setDrawingShapePreview({
      active: true,
      shapeType: activeTool,
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      startX,
      startY,
      endX: startX,
      endY: startY,
      fillColor: (activeTool === 'line' || activeTool === 'arrow') ? 'transparent' : (foregroundColor || '#7C3AED'),
      strokeColor: (activeTool === 'line' || activeTool === 'arrow') ? (foregroundColor || '#7C3AED') : (backgroundColor || '#FFFFFF'),
      strokeWidth: (activeTool === 'line' || activeTool === 'arrow') ? 3 : 2,
      shiftKey: Boolean(e.shiftKey),
      altKey: Boolean(e.altKey),
    });
  };

  const handleShapeDrawMove = (e) => {
    if (!shapeDrawRef.current?.active) return;
    if (!stageRef.current) return;

    const rect = stageRef.current.getBoundingClientRect();
    const effZoom = zoomRef.current || 1;
    const rawX = Math.round((e.clientX - rect.left) / effZoom);
    const rawY = Math.round((e.clientY - rect.top) / effZoom);

    const currentX = Math.max(0, Math.min(displayWidth, rawX));
    const currentY = Math.max(0, Math.min(displayHeight, rawY));

    const { startX, startY, shapeType } = shapeDrawRef.current;
    const shiftKey = Boolean(e.shiftKey);
    const altKey = Boolean(e.altKey);

    let left, top, width, height;

    if (shapeType === 'line' || shapeType === 'arrow') {
      let endX = currentX;
      let endY = currentY;

      if (shiftKey) {
        // Constrain line/arrow to 45-degree angle increments
        const dx = endX - startX;
        const dy = endY - startY;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        endX = Math.max(0, Math.min(displayWidth, Math.round(startX + dist * Math.cos(snapAngle))));
        endY = Math.max(0, Math.min(displayHeight, Math.round(startY + dist * Math.sin(snapAngle))));
      }

      left = Math.min(startX, endX);
      top = Math.min(startY, endY);
      width = Math.max(4, Math.abs(endX - startX));
      height = Math.max(4, Math.abs(endY - startY));

      const previewObj = {
        active: true,
        shapeType,
        left,
        top,
        width,
        height,
        startX,
        startY,
        endX,
        endY,
        fillColor: shapeType === 'arrow' ? (foregroundColor || '#7C3AED') : 'transparent',
        strokeColor: foregroundColor || '#7C3AED',
        strokeWidth: 3,
        shiftKey,
        altKey,
      };
      shapeDrawRef.current.preview = previewObj;
      setDrawingShapePreview(previewObj);
      return;
    }

    // Shapes: rect, circle, ellipse, triangle, star, rounded-rect
    let rawW = Math.abs(currentX - startX);
    let rawH = Math.abs(currentY - startY);

    if (shiftKey) {
      // Shift: 1:1 square / perfect circle
      const side = Math.max(rawW, rawH);
      rawW = side;
      rawH = side;
    }

    if (altKey) {
      // Alt: Draw from center
      left = startX - rawW;
      top = startY - rawH;
      width = rawW * 2;
      height = rawH * 2;
      if (left < 0) { width += left * 2; left = 0; }
      if (top < 0) { height += top * 2; top = 0; }
      if (left + width > displayWidth) width = displayWidth - left;
      if (top + height > displayHeight) height = displayHeight - top;
    } else {
      left = currentX >= startX ? startX : startX - rawW;
      top = currentY >= startY ? startY : startY - rawH;
      width = rawW;
      height = rawH;
      if (left < 0) { width += left; left = 0; }
      if (top < 0) { height += top; top = 0; }
      if (left + width > displayWidth) width = displayWidth - left;
      if (top + height > displayHeight) height = displayHeight - top;
    }

    const previewObj = {
      active: true,
      shapeType,
      left: Math.round(left),
      top: Math.round(top),
      width: Math.round(width),
      height: Math.round(height),
      fillColor: foregroundColor || '#7C3AED',
      strokeColor: backgroundColor || '#FFFFFF',
      strokeWidth: 2,
      shiftKey,
      altKey,
    };
    shapeDrawRef.current.preview = previewObj;
    setDrawingShapePreview(previewObj);
  };

  const handleShapeDrawEnd = (e) => {
    if (!shapeDrawRef.current?.active) return;
    const preview = shapeDrawRef.current.preview || drawingShapePreviewRef.current;
    shapeDrawRef.current = { active: false, preview: null };

    if (e.currentTarget?.releasePointerCapture && e.pointerId !== undefined) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch { }
    }

    setDrawingShapePreview(null);

    // Ignore accidental clicks that produce zero-size or near-zero shapes (< 5px)
    if (!preview || (preview.width < 5 && preview.height < 5)) {
      return;
    }

    const shapeType = preview.shapeType;
    const shapeLabel = SHAPE_TYPES.find((s) => s.id === shapeType)?.label || 'Shape';

    const newShape = {
      id: 'shape_' + Date.now(),
      name: shapeLabel,
      type: 'shape',
      shapeType,
      x: preview.left,
      y: preview.top,
      width: Math.max(10, preview.width),
      height: Math.max(10, preview.height),
      fillColor: preview.fillColor,
      strokeColor: preview.strokeColor,
      strokeWidth: preview.strokeWidth,
      borderRadius: 16,
      opacity: 100,
      rotation: 0,
      hidden: false,
      locked: false,
    };

    const nextLayers = [...layersRef.current, newShape];
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newShape.id);
    setSelectedLayerIds([newShape.id]);
    pushHistory(null, nextLayers, `Draw ${shapeLabel}`);

    // Switch to move tool so user can immediately transform / position the shape
    setActiveTool('move');
    setActiveTab('shapes');
  };

  const handleCancelShapeDraw = () => {
    if (shapeDrawRef.current?.active) {
      shapeDrawRef.current = { active: false };
      setDrawingShapePreview(null);
    }
  };

  // ---------------------------------------------------------------------------
  // INTERACTIVE OBJECT (TEXT & SHAPE) DRAG, RESIZE & ROTATE (Mouse + Touch)
  // ---------------------------------------------------------------------------
  const handleLayerPointerDown = (e, layerId, action = 'move') => {
    layerPointerDownTimeRef.current = Date.now();
    if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive || e.button === 1) {
      handleMouseDownViewport(e);
      return;
    }
    if (activeTool === 'crop' || activeTab === 'crop') return;
    if (activeTool === 'text' || activeTool === 'text-vertical') {
      const layer = layersRef.current.find((l) => l.id === layerId);
      if (layer && layer.type === 'text') {
        e.stopPropagation();
        startEditingText(layerId);
        return;
      }
      // Clicked on a non-text layer with Text tool: let event bubble to stage to create new text layer
      return;
    }
    e.stopPropagation();
    if (activeTab === 'erase') return;
    if (editingTextLayerId === layerId && action === 'move') return;

    const layer = layersRef.current.find((l) => l.id === layerId);
    if (!layer || layer.hidden || layer.locked) return;

    if (e.ctrlKey || e.metaKey) {
      handleSelectLayer(layerId, true, false);
    } else if (e.shiftKey) {
      handleSelectLayer(layerId, false, true);
    } else {
      handleSelectLayer(layerId, false, false);
    }

    const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
    const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return;

    const startX = clientX;
    const startY = clientY;
    const startLayer = { ...layer };
    const effZoom = zoomRef.current || 1;

    const isGroupMove = selectedLayerIds.length > 1 && selectedLayerIds.includes(layerId);
    const startGroupPositions = isGroupMove
      ? layersRef.current
        .filter((l) => selectedLayerIds.includes(l.id))
        .map((l) => ({ id: l.id, x: l.x, y: l.y }))
      : [];

    let centerScreenX = 0;
    let centerScreenY = 0;
    let startAngleRad = 0;
    const startRotation = startLayer.rotation || 0;

    if (action === 'rotate' && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const layerCenterX = startLayer.x + (startLayer.width || 50) / 2;
      const layerCenterY = startLayer.y + (startLayer.height || 20) / 2;
      centerScreenX = rect.left + layerCenterX * effZoom;
      centerScreenY = rect.top + layerCenterY * effZoom;
      startAngleRad = Math.atan2(startY - centerScreenY, startX - centerScreenX);

      setRotatingLayerId(layerId);
      setRotatingAngle(startRotation);
    }

    let hasMoved = false;

    const handlePointerMove = (moveEvt) => {
      const curX = moveEvt.clientX !== undefined ? moveEvt.clientX : moveEvt.touches?.[0]?.clientX;
      const curY = moveEvt.clientY !== undefined ? moveEvt.clientY : moveEvt.touches?.[0]?.clientY;
      if (curX === undefined || curY === undefined) return;

      if (moveEvt.cancelable) moveEvt.preventDefault();
      hasMoved = true;

      const dx = (curX - startX) / effZoom;
      const dy = (curY - startY) / effZoom;

      if (action === 'move') {
        if (isGroupMove) {
          const nextLayers = layersRef.current.map((l) => {
            const orig = startGroupPositions.find((item) => item.id === l.id);
            if (orig) {
              return { ...l, x: Math.round(orig.x + dx), y: Math.round(orig.y + dy) };
            }
            return l;
          });
          setLayers(nextLayers);
          layersRef.current = nextLayers;
        } else {
          handleUpdateLayer(
            layerId,
            {
              x: Math.round(startLayer.x + dx),
              y: Math.round(startLayer.y + dy),
            },
            false
          );
        }
      } else if (action === 'resize-e') {
        const newW = Math.max(30, Math.round(startLayer.width + dx));
        if (layer.type === 'text') {
          handleUpdateLayer(layerId, { width: newW, autoWidth: false }, false);
        } else {
          handleUpdateLayer(layerId, { width: newW }, false);
        }
      } else if (action === 'resize-w') {
        const newW = Math.max(30, Math.round(startLayer.width - dx));
        const newX = Math.round(startLayer.x + (startLayer.width - newW));
        if (layer.type === 'text') {
          handleUpdateLayer(layerId, { width: newW, x: newX, autoWidth: false }, false);
        } else {
          handleUpdateLayer(layerId, { width: newW, x: newX }, false);
        }
      } else if (action === 'resize-s') {
        const newH = Math.max(20, Math.round(startLayer.height + dy));
        handleUpdateLayer(layerId, { height: newH }, false);
      } else if (action === 'resize-n') {
        const newH = Math.max(20, Math.round(startLayer.height - dy));
        const newY = Math.round(startLayer.y + dy);
        handleUpdateLayer(layerId, { height: newH, y: newY }, false);
      } else if (action === 'resize-se') {
        const newW = Math.max(30, Math.round(startLayer.width + dx));
        if (layer.type === 'text') {
          const fontScale = Math.max(0.15, newW / (startLayer.width || 1));
          const newFontSize = Math.max(6, Math.min(300, Math.round((startLayer.fontSize || 32) * fontScale)));
          handleUpdateLayer(
            layerId,
            {
              width: newW,
              fontSize: newFontSize,
              autoWidth: false,
            },
            false
          );
        } else {
          const newH = Math.max(20, Math.round(startLayer.height + dy));
          handleUpdateLayer(layerId, { width: newW, height: newH }, false);
        }
      } else if (action === 'resize-ne') {
        const newW = Math.max(30, Math.round(startLayer.width + dx));
        if (layer.type === 'text') {
          const fontScale = Math.max(0.15, newW / (startLayer.width || 1));
          const newFontSize = Math.max(6, Math.min(300, Math.round((startLayer.fontSize || 32) * fontScale)));
          const textDims = calculateTextDimensions(layer.text || layer.placeholder || 'Type your text here', {
            ...layer,
            fontSize: newFontSize,
            width: newW,
            autoWidth: false,
          });
          const newY = Math.round(startLayer.y + (startLayer.height - textDims.height));
          handleUpdateLayer(
            layerId,
            {
              width: newW,
              height: textDims.height,
              y: newY,
              fontSize: newFontSize,
              autoWidth: false,
            },
            false
          );
        } else {
          const newH = Math.max(20, Math.round(startLayer.height - dy));
          const newY = Math.round(startLayer.y + dy);
          handleUpdateLayer(layerId, { width: newW, height: newH, y: newY }, false);
        }
      } else if (action === 'resize-sw') {
        const newW = Math.max(30, Math.round(startLayer.width - dx));
        const newX = Math.round(startLayer.x + (startLayer.width - newW));
        if (layer.type === 'text') {
          const fontScale = Math.max(0.15, newW / (startLayer.width || 1));
          const newFontSize = Math.max(6, Math.min(300, Math.round((startLayer.fontSize || 32) * fontScale)));
          handleUpdateLayer(
            layerId,
            {
              width: newW,
              x: newX,
              fontSize: newFontSize,
              autoWidth: false,
            },
            false
          );
        } else {
          const newH = Math.max(20, Math.round(startLayer.height + dy));
          handleUpdateLayer(layerId, { width: newW, height: newH, x: newX }, false);
        }
      } else if (action === 'resize-nw') {
        const newW = Math.max(30, Math.round(startLayer.width - dx));
        const newX = Math.round(startLayer.x + (startLayer.width - newW));
        if (layer.type === 'text') {
          const fontScale = Math.max(0.15, newW / (startLayer.width || 1));
          const newFontSize = Math.max(6, Math.min(300, Math.round((startLayer.fontSize || 32) * fontScale)));
          const textDims = calculateTextDimensions(layer.text || layer.placeholder || 'Type your text here', {
            ...layer,
            fontSize: newFontSize,
            width: newW,
            autoWidth: false,
          });
          const newY = Math.round(startLayer.y + (startLayer.height - textDims.height));
          handleUpdateLayer(
            layerId,
            {
              width: newW,
              height: textDims.height,
              x: newX,
              y: newY,
              fontSize: newFontSize,
              autoWidth: false,
            },
            false
          );
        } else {
          const newH = Math.max(20, Math.round(startLayer.height - dy));
          const newX = Math.round(startLayer.x + dx);
          const newY = Math.round(startLayer.y + dy);
          handleUpdateLayer(layerId, { width: newW, height: newH, x: newX, y: newY }, false);
        }
      } else if (action === 'rotate') {
        const curAngleRad = Math.atan2(curY - centerScreenY, curX - centerScreenX);
        let deltaDeg = ((curAngleRad - startAngleRad) * 180) / Math.PI;
        let newDeg = startRotation + deltaDeg;

        // Shift key snaps to 15-degree increments
        if (moveEvt.shiftKey) {
          newDeg = Math.round(newDeg / 15) * 15;
        } else {
          newDeg = Math.round(newDeg);
        }

        const normalized = ((newDeg % 360) + 360) % 360;
        handleUpdateLayer(layerId, { rotation: normalized }, false);
        setRotatingAngle(normalized);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      if (action === 'rotate') {
        setRotatingLayerId(null);
        setRotatingAngle(null);
      }

      if (hasMoved) {
        pushHistory(
          null,
          layersRef.current,
          action === 'move'
            ? isGroupMove
              ? `Move ${selectedLayerIds.length} Layers`
              : 'Move Layer'
            : action === 'rotate'
              ? 'Rotate Layer'
              : 'Resize Layer'
        );
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  // Canvas drawing helper for Shapes
  const drawShapeOnCanvas = (ctx, shape, x, y, w, h) => {
    const { shapeType, fillColor, strokeColor, strokeWidth, borderRadius, pathData } = shape;
    const effectiveFill = shape.styles?.colorOverlay?.enabled
      ? shape.styles.colorOverlay.color
      : fillColor;

    if (shapeType === 'custom-path' && pathData) {
      try {
        ctx.save();
        if (x !== 0 || y !== 0) {
          ctx.translate(x, y);
        }
        const p = new Path2D(pathData);
        if (effectiveFill && effectiveFill !== 'transparent') {
          ctx.fillStyle = effectiveFill;
          ctx.fill(p);
        }
        if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke(p);
        }
        ctx.restore();
        return;
      } catch (err) {
        ctx.restore();
        // Fallback
      }
    }

    ctx.beginPath();

    if (shapeType === 'rect') {
      const r = Math.min(borderRadius || 0, w / 2, h / 2);
      if (r > 0 && ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    } else if (shapeType === 'rounded-rect') {
      const r = Math.min(borderRadius || 16, w / 2, h / 2);
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    } else if (shapeType === 'circle') {
      const radius = Math.min(w, h) / 2;
      ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
    } else if (shapeType === 'ellipse') {
      ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
    } else if (shapeType === 'line') {
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w, y + h / 2);
    } else if (shapeType === 'arrow') {
      const arrowHeadSize = Math.max(12, strokeWidth * 3);
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w - arrowHeadSize, y + h / 2);
      ctx.moveTo(x + w - arrowHeadSize, y + h / 2 - arrowHeadSize * 0.6);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w - arrowHeadSize, y + h / 2 + arrowHeadSize * 0.6);
      ctx.closePath();
    } else if (shapeType === 'triangle') {
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    } else if (shapeType === 'star') {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.45;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    if (effectiveFill && effectiveFill !== 'transparent') {
      ctx.fillStyle = effectiveFill;
      ctx.fill();
    }

    if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  // Canvas drawing helper for Text
  const drawTextOnCanvas = (ctx, layer, x, y, w, h) => {
    const {
      text,
      placeholder,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      color,
      align,
      bgColor,
      strokeColor,
      strokeWidth,
      shadowColor,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY,
      lineHeight,
      letterSpacing,
    } = layer;

    const effectiveColor = layer.styles?.colorOverlay?.enabled
      ? layer.styles.colorOverlay.color
      : color || '#FFFFFF';

    // Optional background rect
    if (bgColor && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);
    }

    ctx.font = `${fontStyle || 'normal'} ${fontWeight || 'normal'} ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.textBaseline = 'top';

    let textAnchorX = x;
    if (align === 'center') {
      ctx.textAlign = 'center';
      textAnchorX = x + w / 2;
    } else if (align === 'right') {
      ctx.textAlign = 'right';
      textAnchorX = x + w;
    } else {
      ctx.textAlign = 'left';
      textAnchorX = x;
    }

    if (shadowBlur > 0) {
      ctx.shadowColor = shadowColor || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX || 2;
      ctx.shadowOffsetY = shadowOffsetY || 2;
    } else {
      ctx.shadowColor = 'transparent';
    }

    const content = text || '';
    if (!content.trim()) return;
    const rawLines = content.split('\n');
    const lineH = Math.round(fontSize * (lineHeight || 1.2));
    const pad = 4;
    const maxTextW = Math.max(10, w - pad * 2);

    const wrappedLines = [];
    rawLines.forEach((raw) => {
      if (!raw) {
        wrappedLines.push('');
        return;
      }
      const words = raw.split(' ');
      let cur = '';
      for (let i = 0; i < words.length; i++) {
        const test = cur ? `${cur} ${words[i]}` : words[i];
        if (ctx.measureText(test).width <= maxTextW) {
          cur = test;
        } else {
          if (cur) wrappedLines.push(cur);
          cur = words[i];
        }
      }
      if (cur) wrappedLines.push(cur);
    });

    wrappedLines.forEach((line, idx) => {
      const lineY = y + 4 + idx * lineH;
      if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(line, textAnchorX, lineY);
      }
      ctx.fillStyle = effectiveColor;
      ctx.fillText(line, textAnchorX, lineY);

      if (layer.underline) {
        const m = ctx.measureText(line);
        let startX = textAnchorX;
        if (align === 'center') startX = textAnchorX - m.width / 2;
        else if (align === 'right') startX = textAnchorX - m.width;
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, Math.round(fontSize / 16));
        ctx.strokeStyle = effectiveColor;
        ctx.moveTo(startX, lineY + fontSize + 2);
        ctx.lineTo(startX + m.width, lineY + fontSize + 2);
        ctx.stroke();
      }
    });
  };

  // ---------------------------------------------------------------------------
  // DOWNLOAD / EXPORT ENGINE (Flattens raster base + image layers + text & shapes)
  // ---------------------------------------------------------------------------
  const handleDownload = async (targetFormat = null) => {
    if (!activeCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = currentWidth;
    exportCanvas.height = currentHeight;
    const ctx = exportCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw Document Background if not transparent
    if (canvasBgOption !== 'transparent') {
      ctx.save();
      ctx.fillStyle =
        canvasBgOption === 'custom' || canvasBgOption === 'color'
          ? canvasCustomColor
          : canvasBgOption === 'white'
            ? '#ffffff'
            : canvasBgOption;
      ctx.fillRect(0, 0, currentWidth, currentHeight);
      ctx.restore();
    }

    // 2. Pre-load all image layers & layer masks
    const loadedImageElements = await Promise.all(
      layers.map((layer) => {
        const dataUrl = layer.dataUrl || (layer.id === 'background' ? currentDataUrl : null);
        if (dataUrl && (layer.type === 'image' || layer.type === 'blank')) {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ id: layer.id, img });
            img.onerror = () => resolve({ id: layer.id, img: null });
            img.src = dataUrl;
          });
        }
        return Promise.resolve(null);
      })
    );

    const loadedMaskElements = await Promise.all(
      layers.map((layer) => {
        if (layer.mask?.enabled && layer.mask.dataUrl) {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ id: `mask_${layer.id}`, img });
            img.onerror = () => resolve({ id: `mask_${layer.id}`, img: null });
            img.src = layer.mask.dataUrl;
          });
        }
        return Promise.resolve(null);
      })
    );

    const imgMap = {};
    loadedImageElements.forEach((item) => {
      if (item && item.img) imgMap[item.id] = item.img;
    });
    loadedMaskElements.forEach((item) => {
      if (item && item.img) imgMap[item.id] = item.img;
    });

    const renderLayerItem = (targetCtx, layer) => {
      if (layer.hidden) return;
      const lW = Math.max(1, layer.width || currentWidth || 50);
      const lH = Math.max(1, layer.height || currentHeight || 20);

      // Create an offscreen buffer for the layer content so styles can be applied accurately
      const layerBuffer = document.createElement('canvas');
      layerBuffer.width = lW;
      layerBuffer.height = lH;
      const bCtx = layerBuffer.getContext('2d');
      if (!bCtx) return;

      const fillOp = (layer.fillOpacity ?? 100) / 100;
      bCtx.globalAlpha = fillOp;

      if (layer.type === 'shape') {
        drawShapeOnCanvas(bCtx, layer, 0, 0, lW, lH);
      } else if (layer.type === 'text') {
        drawTextOnCanvas(bCtx, layer, 0, 0, lW, lH);
      } else if ((layer.type === 'image' || layer.type === 'blank') && imgMap[layer.id]) {
        if (layer.mask?.enabled && imgMap[`mask_${layer.id}`]) {
          bCtx.drawImage(imgMap[layer.id], 0, 0, lW, lH);
          bCtx.globalCompositeOperation = 'destination-in';
          bCtx.drawImage(imgMap[`mask_${layer.id}`], 0, 0, lW, lH);
        } else {
          bCtx.drawImage(imgMap[layer.id], 0, 0, lW, lH);
        }
      }

      // 1. Color Overlay style
      if (layer.styles?.colorOverlay?.enabled) {
        const col = layer.styles.colorOverlay.color || '#7c3aed';
        const colOp = (layer.styles.colorOverlay.opacity ?? 80) / 100;
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = lW;
        colorCanvas.height = lH;
        const cCtx = colorCanvas.getContext('2d');
        cCtx.drawImage(layerBuffer, 0, 0);
        cCtx.globalCompositeOperation = 'source-in';
        cCtx.fillStyle = col;
        cCtx.fillRect(0, 0, lW, lH);

        bCtx.save();
        bCtx.globalAlpha = colOp;
        if (layer.styles.colorOverlay.blendMode && layer.styles.colorOverlay.blendMode !== 'normal') {
          bCtx.globalCompositeOperation = layer.styles.colorOverlay.blendMode;
        } else {
          bCtx.globalCompositeOperation = 'source-atop';
        }
        bCtx.drawImage(colorCanvas, 0, 0);
        bCtx.restore();
      }

      // 2. Gradient Overlay style
      if (layer.styles?.gradientOverlay?.enabled) {
        const go = layer.styles.gradientOverlay;
        const gradOp = (go.opacity ?? 85) / 100;
        const angle = go.angle ?? 90;
        const rad = (angle * Math.PI) / 180;
        const gradCanvas = document.createElement('canvas');
        gradCanvas.width = lW;
        gradCanvas.height = lH;
        const gCtx = gradCanvas.getContext('2d');
        gCtx.drawImage(layerBuffer, 0, 0);
        gCtx.globalCompositeOperation = 'source-in';

        const cx0 = lW / 2;
        const cy0 = lH / 2;
        const r0 = Math.max(lW, lH) / 2;
        const x1 = cx0 - Math.cos(rad) * r0;
        const y1 = cy0 - Math.sin(rad) * r0;
        const x2 = cx0 + Math.cos(rad) * r0;
        const y2 = cy0 + Math.sin(rad) * r0;
        const linGrad = gCtx.createLinearGradient(x1, y1, x2, y2);
        linGrad.addColorStop(0, go.color1 || '#7c3aed');
        linGrad.addColorStop(1, go.color2 || '#ec4899');
        gCtx.fillStyle = linGrad;
        gCtx.fillRect(0, 0, lW, lH);

        bCtx.save();
        bCtx.globalAlpha = gradOp;
        bCtx.globalCompositeOperation = 'source-atop';
        bCtx.drawImage(gradCanvas, 0, 0);
        bCtx.restore();
      }

      // 3. Stroke style
      if (layer.styles?.stroke?.enabled) {
        const st = layer.styles.stroke;
        const sz = Math.min(20, Math.max(1, st.size ?? 3));
        const col = st.color || '#000000';
        const stOp = (st.opacity ?? 100) / 100;
        const strokeCanvas = document.createElement('canvas');
        strokeCanvas.width = lW;
        strokeCanvas.height = lH;
        const sCtx = strokeCanvas.getContext('2d');
        for (let dx = -sz; dx <= sz; dx++) {
          for (let dy = -sz; dy <= sz; dy++) {
            if (dx * dx + dy * dy <= sz * sz && (dx !== 0 || dy !== 0)) {
              sCtx.drawImage(layerBuffer, dx, dy);
            }
          }
        }
        sCtx.globalCompositeOperation = 'source-in';
        sCtx.fillStyle = col;
        sCtx.fillRect(0, 0, lW, lH);
        sCtx.globalCompositeOperation = 'destination-out';
        sCtx.drawImage(layerBuffer, 0, 0);

        bCtx.save();
        bCtx.globalAlpha = stOp;
        bCtx.drawImage(strokeCanvas, 0, 0);
        bCtx.restore();
      }

      // Draw onto targetCtx with transforms, opacity, blendMode, outerGlow, dropShadow
      targetCtx.save();
      const cx = (layer.x || 0) + lW / 2;
      const cy = (layer.y || 0) + lH / 2;
      targetCtx.translate(cx, cy);
      if (layer.rotation) targetCtx.rotate((layer.rotation * Math.PI) / 180);
      targetCtx.globalAlpha = (layer.opacity || 100) / 100;

      if (layer.blendMode && layer.blendMode !== 'normal') {
        targetCtx.globalCompositeOperation = layer.blendMode;
      }

      // Outer Glow
      if (layer.styles?.outerGlow?.enabled) {
        const og = layer.styles.outerGlow;
        targetCtx.save();
        targetCtx.shadowColor = og.color || '#ffd700';
        targetCtx.shadowBlur = og.blur ?? 15;
        targetCtx.shadowOffsetX = 0;
        targetCtx.shadowOffsetY = 0;
        targetCtx.drawImage(layerBuffer, -lW / 2, -lH / 2, lW, lH);
        targetCtx.restore();
      }

      // Drop Shadow
      if (layer.styles?.dropShadow?.enabled) {
        const ds = layer.styles.dropShadow;
        const rad = ((ds.angle ?? 90) * Math.PI) / 180;
        targetCtx.save();
        targetCtx.shadowColor = ds.color || 'rgba(0,0,0,0.5)';
        targetCtx.shadowBlur = ds.blur ?? 10;
        targetCtx.shadowOffsetX = Math.round(Math.cos(rad) * (ds.distance ?? 5));
        targetCtx.shadowOffsetY = Math.round(Math.sin(rad) * (ds.distance ?? 5));
        targetCtx.drawImage(layerBuffer, -lW / 2, -lH / 2, lW, lH);
        targetCtx.restore();
      }

      // Main Layer Draw
      targetCtx.drawImage(layerBuffer, -lW / 2, -lH / 2, lW, lH);
      targetCtx.restore();
    };

    // 3. Draw Layers with Clipping Mask and Layer Style Composite pipeline (Strict Document Bounds Clipping)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, currentWidth, currentHeight);
    ctx.clip();

    let i = 0;
    while (i < layers.length) {
      const baseLayer = layers[i];
      if (baseLayer.hidden) {
        i++;
        continue;
      }

      const clippedChain = [];
      let j = i + 1;
      while (j < layers.length && layers[j].clippingMask) {
        if (!layers[j].hidden) clippedChain.push(layers[j]);
        j++;
      }

      if (clippedChain.length === 0) {
        renderLayerItem(ctx, baseLayer);
      } else {
        const groupCanvas = document.createElement('canvas');
        groupCanvas.width = currentWidth;
        groupCanvas.height = currentHeight;
        const gCtx = groupCanvas.getContext('2d');
        gCtx.imageSmoothingEnabled = true;
        gCtx.imageSmoothingQuality = 'high';

        renderLayerItem(gCtx, baseLayer);

        gCtx.save();
        gCtx.globalCompositeOperation = 'source-atop';
        clippedChain.forEach((cl) => {
          renderLayerItem(gCtx, cl);
        });
        gCtx.restore();

        ctx.save();
        if (baseLayer.blendMode && baseLayer.blendMode !== 'normal') {
          ctx.globalCompositeOperation = baseLayer.blendMode;
        }
        ctx.drawImage(groupCanvas, 0, 0);
        ctx.restore();
      }

      i = j;
    }
    ctx.restore();

    const originalType = originalFile?.type || 'image/png';
    const isTransparent = canvasBgOption === 'transparent';
    let exportType = targetFormat;
    if (!exportType) {
      exportType =
        isTransparent || originalType === 'image/svg+xml' ? 'image/png' : originalType;
    }

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Failed to generate export file.');
          return;
        }
        const rawName = originalFile?.name ? originalFile.name.replace(/\.[^.]+$/, '') : 'canvas-export';
        const baseName = rawName || 'edited-image';
        const ext =
          exportType === 'image/jpeg' ? '.jpg' : exportType === 'image/webp' ? '.webp' : '.png';
        const filename = `${baseName}-smart-edited-${currentWidth}x${currentHeight}${ext}`;

        downloadBlob(blob, filename);

        // Mark active document as saved
        if (activeDocumentId) {
          const doc = documentStoreRef.current.get(activeDocumentId);
          if (doc) {
            doc.isDirty = false;
            documentStoreRef.current.set(activeDocumentId, doc);
          }
          setDocuments((prev) =>
            prev.map((d) => (d.id === activeDocumentId ? { ...d, isDirty: false } : d))
          );
        }

        trackImageDownload({
          tool: 'edit_image',
          outputFormat: exportType,
          isBatch: false,
        });
      },
      exportType,
      0.95
    );
  };

  // ---------------------------------------------------------------------------
  // SAVE AS LAYERED PHOTOSHOP PSD
  // ---------------------------------------------------------------------------
  const executeSavePsd = useCallback(
    async (chosenFileName) => {
      if (!activeDocumentId) return;
      const currentDoc =
        documentStoreRef.current.get(activeDocumentId) ||
        documents.find((d) => d.id === activeDocumentId);
      if (!currentDoc) return;

      setIsSavingPsd(true);
      setPsdSaveError(null);

      try {
        const activeLayers = layersRef.current || [];
        const result = await exportDocumentAsPsd(
          {
            ...currentDoc,
            width: currentWidth,
            height: currentHeight,
            canvas: activeCanvas,
            canvasBgOption,
            canvasCustomColor,
          },
          activeLayers,
          { filename: chosenFileName }
        );

        // Trigger browser download
        triggerFileDownload(result.blob, result.filename);

        // Update document name and clear dirty flag
        const updatedDocName = result.filename;
        currentDoc.name = updatedDocName;
        currentDoc.isDirty = false;
        documentStoreRef.current.set(activeDocumentId, { ...currentDoc });

        setDocuments((prevDocs) =>
          prevDocs.map((d) =>
            d.id === activeDocumentId ? { ...d, name: updatedDocName, isDirty: false } : d
          )
        );

        setIsSaveProjectModalOpen(false);
        setIsSavingPsd(false);

        trackImageDownload({
          tool: 'edit_image',
          outputFormat: 'image/vnd.adobe.photoshop',
          isBatch: false,
        });
      } catch (err) {
        console.error('[Save PSD Error]:', err);
        setPsdSaveError(`Failed to save PSD project: ${err.message || 'Unknown error'}`);
        setIsSavingPsd(false);
        // DO NOT mark document as saved if export fails!
      }
    },
    [activeDocumentId, documents, currentWidth, currentHeight, activeCanvas, canvasBgOption, canvasCustomColor]
  );

  const handleSaveProjectAs = useCallback(() => {
    if (!activeDocumentId) return;
    const currentDoc =
      documentStoreRef.current.get(activeDocumentId) ||
      documents.find((d) => d.id === activeDocumentId);
    if (!currentDoc) return;
    setPsdSaveError(null);
    setIsSaveProjectModalOpen(true);
  }, [activeDocumentId, documents]);

  const handleSaveProject = useCallback(() => {
    if (!activeDocumentId) return;
    const currentDoc =
      documentStoreRef.current.get(activeDocumentId) ||
      documents.find((d) => d.id === activeDocumentId);
    if (!currentDoc) return;

    const docName = (currentDoc.name || '').trim();
    // If the document is untitled or doesn't have a .psd extension, prompt with Save As modal
    if (!docName || docName.startsWith('Untitled') || !docName.toLowerCase().endsWith('.psd')) {
      handleSaveProjectAs();
    } else {
      executeSavePsd(docName);
    }
  }, [activeDocumentId, documents, handleSaveProjectAs, executeSavePsd]);

  const handleExportPsd = useCallback(() => {
    handleSaveProjectAs();
  }, [handleSaveProjectAs]);

  handleSaveProjectRef.current = handleSaveProject;
  handleSaveProjectAsRef.current = handleSaveProjectAs;

  // Save document and then close it
  const handleSaveAndClose = useCallback(
    async (docId) => {
      const doc = documentStoreRef.current.get(docId) || documents.find((d) => d.id === docId);
      if (!doc) {
        executeCloseDocument(docId);
        return;
      }
      try {
        const layersToSave = docId === activeDocumentId ? layersRef.current : doc.layers || [];
        const result = await exportDocumentAsPsd(
          {
            ...doc,
            canvas: docId === activeDocumentId ? activeCanvas : doc.canvas,
            canvasBgOption: docId === activeDocumentId ? canvasBgOption : doc.canvasBgOption,
            canvasCustomColor: docId === activeDocumentId ? canvasCustomColor : doc.canvasCustomColor,
          },
          layersToSave,
          { filename: doc.name || 'Untitled-1.psd' }
        );
        triggerFileDownload(result.blob, result.filename);
        doc.isDirty = false;
        documentStoreRef.current.set(docId, { ...doc });
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, isDirty: false } : d))
        );
        executeCloseDocument(docId);
      } catch (err) {
        console.error('[Save and close error]:', err);
        setError(`Failed to save project before closing: ${err.message}`);
      }
    },
    [activeDocumentId, documents, activeCanvas, canvasBgOption, canvasCustomColor, executeCloseDocument]
  );

  // ---------------------------------------------------------------------------
  // VIEWPORT ZOOM & PAN
  // ---------------------------------------------------------------------------
  const handleZoomIn = () => setZoom((z) => Math.min(4, +(z * 1.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.15, +(z / 1.25).toFixed(2)));
  const handleZoom100 = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDownViewport = (e) => {
    const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
    const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;
    if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        startX: clientX ?? 0,
        startY: clientY ?? 0,
        panX: pan.x,
        panY: pan.y,
      };
    } else if (activeTab === 'erase') {
      handleEraseStart(e);
    } else {
      // Clicked on empty canvas background: deselect
      if (activeTextDraftRef.current) {
        commitOrDiscardDraft();
      }
      if (editingTextLayerId) {
        finishEditingText(editingTextLayerId);
      }
      if (Date.now() - layerPointerDownTimeRef.current < 400) {
        return;
      }
      if (e.target === viewportRef.current || e.target === stageRef.current) {
        setSelectedLayerId(null);
      }
    }
  };

  const handleMouseMoveViewport = (e) => {
    if (isPanning) {
      const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
      const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;
      if (clientX === undefined || clientY === undefined || !panStartRef.current) return;
      const dx = clientX - panStartRef.current.startX;
      const dy = clientY - panStartRef.current.startY;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    } else if (activeTab === 'erase') {
      handleEraseMove(e);
    }
  };

  const handleMouseUpViewport = () => {
    if (isPanning) setIsPanning(false);
    if (activeTab === 'erase') handleEraseEnd();
  };

  // ---------------------------------------------------------------------------
  // CROP BOX DRAG HANDLERS
  // ---------------------------------------------------------------------------
  const handleCropMouseDown = (mode, e) => {
    if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive || e.button === 1) {
      handleMouseDownViewport(e);
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    const stageRect = stageRef.current ? stageRef.current.getBoundingClientRect() : null;
    const effZoom = zoomRef.current || zoom || 1;
    const startCanvasX = stageRect
      ? Math.max(0, Math.min(currentWidth, Math.round((e.clientX - stageRect.left) / effZoom)))
      : 0;
    const startCanvasY = stageRect
      ? Math.max(0, Math.min(currentHeight, Math.round((e.clientY - stageRect.top) / effZoom)))
      : 0;

    const isFullCanvas =
      cropBox.width >= (currentWidth - 2) &&
      cropBox.height >= (currentHeight - 2);

    cropDragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...cropBox },
      isFullCanvas,
      startCanvasX,
      startCanvasY,
      hasDragged: false,
    };

    const handleWindowMouseMove = (moveEvt) => {
      if (!cropDragRef.current || !currentWidth || !currentHeight) return;
      const { mode: dragMode, startX, startY, startBox, isFullCanvas: isFull, startCanvasX: sX, startCanvasY: sY } = cropDragRef.current;
      const currentEffZoom = zoomRef.current || zoom || 1;
      const dx = (moveEvt.clientX - startX) / currentEffZoom;
      const dy = (moveEvt.clientY - startY) / currentEffZoom;

      if (!cropDragRef.current.hasDragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        cropDragRef.current.hasDragged = true;
      }

      let targetRatio = null;
      if (cropPreset === 'custom') {
        targetRatio = Math.max(1, customRatioW) / Math.max(1, customRatioH);
      } else if (cropPreset !== 'free') {
        const preset = CROP_PRESETS.find((p) => p.id === cropPreset);
        if (preset?.ratio) targetRatio = preset.ratio;
      }

      // If user starts dragging on the full canvas overlay, draw a new crop box from start click position
      if (dragMode === 'move' && isFull) {
        if (!cropDragRef.current.hasDragged) return;

        const currentStageRect = stageRef.current ? stageRef.current.getBoundingClientRect() : null;
        const curCanvasX = currentStageRect
          ? Math.max(0, Math.min(currentWidth, Math.round((moveEvt.clientX - currentStageRect.left) / currentEffZoom)))
          : Math.max(0, Math.min(currentWidth, sX + dx));
        const curCanvasY = currentStageRect
          ? Math.max(0, Math.min(currentHeight, Math.round((moveEvt.clientY - currentStageRect.top) / currentEffZoom)))
          : Math.max(0, Math.min(currentHeight, sY + dy));

        let newX = Math.min(sX, curCanvasX);
        let newY = Math.min(sY, curCanvasY);
        let newW = Math.abs(curCanvasX - sX);
        let newH = Math.abs(curCanvasY - sY);

        if (targetRatio && newW > 0) {
          newH = Math.round(newW / targetRatio);
          if (newY + newH > currentHeight) {
            newH = currentHeight - newY;
            newW = Math.round(newH * targetRatio);
          }
        }

        setCropBox({
          x: Math.max(0, Math.min(currentWidth - 10, newX)),
          y: Math.max(0, Math.min(currentHeight - 10, newY)),
          width: Math.max(10, Math.min(currentWidth - newX, newW)),
          height: Math.max(10, Math.min(currentHeight - newY, newH)),
        });
        return;
      }

      let newX = startBox.x;
      let newY = startBox.y;
      let newW = startBox.width;
      let newH = startBox.height;

      if (dragMode === 'move') {
        newX = Math.max(0, Math.min(currentWidth - startBox.width, startBox.x + dx));
        newY = Math.max(0, Math.min(currentHeight - startBox.height, startBox.y + dy));
        setCropBox({ x: newX, y: newY, width: startBox.width, height: startBox.height });
        return;
      }

      if (dragMode.includes('e')) newW = Math.max(20, Math.min(currentWidth - startBox.x, startBox.width + dx));
      if (dragMode.includes('s')) newH = Math.max(20, Math.min(currentHeight - startBox.y, startBox.height + dy));
      if (dragMode.includes('w')) {
        const potW = startBox.width - dx;
        if (potW >= 20 && startBox.x + dx >= 0) {
          newX = startBox.x + dx;
          newW = potW;
        }
      }
      if (dragMode.includes('n')) {
        const potH = startBox.height - dy;
        if (potH >= 20 && startBox.y + dy >= 0) {
          newY = startBox.y + dy;
          newH = potH;
        }
      }

      if (targetRatio && ['se', 'ne', 'sw', 'nw'].includes(dragMode)) {
        newH = Math.max(20, Math.round(newW / targetRatio));
        if (newY + newH > currentHeight) {
          newH = currentHeight - newY;
          newW = Math.max(20, Math.round(newH * targetRatio));
        }
      }

      setCropBox({
        x: Math.max(0, Math.min(currentWidth - 20, Math.round(newX))),
        y: Math.max(0, Math.min(currentHeight - 20, Math.round(newY))),
        width: Math.max(20, Math.min(currentWidth - newX, Math.round(newW))),
        height: Math.max(20, Math.min(currentHeight - newY, Math.round(newH))),
      });
    };

    const handleWindowMouseUp = () => {
      cropDragRef.current = null;
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const handleDragOver = (e) => {
    if (
      window.__draggedLayerPayload ||
      (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('application/x-image-convert-layer'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      setIsDraggingLayerOverCanvas(true);
      return;
    }
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setIsDraggingLayerOverCanvas(false);
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    const rawLayerData = e.dataTransfer?.getData('application/x-image-convert-layer');
    let layerPayload = null;
    if (rawLayerData) {
      try {
        layerPayload = JSON.parse(rawLayerData);
      } catch (err) {
        // ignore JSON parse error
      }
    }
    if (!layerPayload && window.__draggedLayerPayload) {
      layerPayload = window.__draggedLayerPayload;
    }

    if (layerPayload && (layerPayload.layers || layerPayload.layer)) {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingLayerOverCanvas(false);
      window.__draggedLayerPayload = null;

      let dropX = null;
      let dropY = null;
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        dropX = Math.round((e.clientX - rect.left) / zoom);
        dropY = Math.round((e.clientY - rect.top) / zoom);
      }

      handleTransferLayerToActiveDoc(layerPayload.layers || layerPayload.layer, null, dropX, dropY);
      return;
    }

    setIsDraggingLayerOverCanvas(false);

    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = extractFilesFromEvent(e);
    if (droppedFiles && droppedFiles.length > 0) {
      handleLoadFiles(droppedFiles);
    }
  };

  const estimatedCurrentBytes = useMemo(() => {
    if (!origSize || !origWidth || !origHeight || !currentWidth || !currentHeight) {
      return origSize || 0;
    }
    const ratio = (currentWidth * currentHeight) / (origWidth * origHeight);
    return Math.round(origSize * Math.pow(ratio, 0.9));
  }, [origSize, origWidth, origHeight, currentWidth, currentHeight]);

  // Dedicated Tool Overlay State Disambiguation
  const isCropTool = activeTool === 'crop' || activeTab === 'crop';
  const isMoveTool = !isCropTool && (activeTool === 'move' || (!activeTool && (activeTab === 'move' || !activeTab)));
  const isTextTool = !isCropTool && (activeTool === 'text' || activeTab === 'text');
  const isPenTool = !isCropTool && activeTool === 'pen';
  const isSelectionTool = !isCropTool && ['marquee-rect', 'marquee-ellipse', 'single-row-marquee', 'single-column-marquee', 'lasso', 'polygonal-lasso', 'magic-wand'].includes(activeTool);

  return (
    <ToolPageLayout embeddedOnly>
      <div
        id="tool"
        className={styles.editorRoot}
        onDragEnter={(e) => {
          if (isExternalFileDrag(e)) {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }
        }}
        onDragOver={(e) => {
          if (isExternalFileDrag(e)) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
            return;
          }
          if (isExternalFileDrag(e)) {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          if (isExternalFileDrag(e)) {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            const droppedFiles = extractFilesFromEvent(e);
            if (droppedFiles && droppedFiles.length > 0) {
              handleLoadFiles(droppedFiles);
            }
          }
        }}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          data-testid="main-file-input"
          accept={`${ACCEPT_STRING},.svg,.avif,.bmp,.ico,.psd,image/vnd.adobe.photoshop`}
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleLoadFiles(Array.from(e.target.files));
            }
          }}
          style={{ display: 'none' }}
        />

        {/* Hidden File Input for Image Layers */}
        <input
          ref={layerImageInputRef}
          type="file"
          data-testid="layer-image-input"
          accept={`${ACCEPT_STRING},.svg,.avif,.bmp,.ico,.psd,image/vnd.adobe.photoshop`}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleAddImageLayerFile(e.target.files[0]);
            }
          }}
          style={{ display: 'none' }}
        />

        {/* Canvas Setup Modal for "New Blank Canvas" triggered from menu */}
        <CanvasSetupModal
          isOpen={isBlankModalOpen}
          onClose={() => setIsBlankModalOpen(false)}
          onCreateCanvas={handleCreateBlankCanvas}
        />

        {/* 1. Hamburger Overlay Navigation Drawer */}
        <HamburgerNavDrawer
          isOpen={isNavDrawerOpen}
          onClose={() => setIsNavDrawerOpen(false)}
        />

        {/* =================================================================
           MAIN PHOTOSHOP-INSPIRED WORKSPACE (Full Viewport Application Shell)
           ================================================================= */}
        <div className={styles.workspaceContainer}>
          {/* 2. Compact Application Menu Bar (48-52px) */}
          <ApplicationMenuBar
            hasImage={hasImage}
            onOpenNavDrawer={() => setIsNavDrawerOpen(true)}
            onNewBlankCanvas={() => setIsBlankModalOpen(true)}
            onOpenFile={handleTriggerUpload}
            onTriggerUpload={handleTriggerUpload}
            onSaveProject={handleSaveProject}
            onSaveProjectAs={handleSaveProjectAs}
            onExportPsd={handleExportPsd}
            onAddImageLayer={handleTriggerAddImageLayer}
            onDownload={handleDownload}
            onResetOriginal={handleResetToOriginal}
            canReset={canReset}
            onCloseDocument={handleDeleteBaseImage}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onCut={handleCutLayers}
            onCopy={handleCopyLayers}
            onCopyMerged={handleCopyMerged}
            onPaste={handlePasteLayers}
            canCopy={Boolean(selectedLayerId || selectedLayerIds.length > 0)}
            canPaste={Boolean(clipboardRef.current && (clipboardRef.current.layers || clipboardRef.current.type === 'pixel-selection'))}
            zoom={zoom}
            onZoomChange={setZoom}
            onFitScreen={handleFitScreen}
            isPanActive={isPanActive}
            onTogglePan={() => setIsPanActive((p) => !p)}
            onToolSelect={handleToolSelect}
            onAddBlankLayer={handleAddBlankLayer}
            onAddTextLayer={handleAddTextLayer}
            onAddShapeLayer={handleAddShapeLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onDeleteLayer={handleDeleteLayer}
            onBringToFront={handleBringToFront}
            onMoveUp={handleMoveLayer}
            onMoveDown={handleMoveLayer}
            onSendToBack={handleSendToBack}
            onToggleClippingMask={handleToggleClippingMask}
            onAddLayerMask={handleAddLayerMask}
            onOpenBlendingOptions={handleOpenBlendingOptions}
            onMergeLayers={handleMergeLayers}
            activeSelection={activeSelection}
            onSelectAll={handleSelectAll}
            onDeselect={handleDeselect}
            onInvertSelection={handleInvertSelection}
            onDeleteSelectedPixels={handleDeleteSelectedPixels}
            onConvertSelectionToMask={handleConvertSelectionToMask}
            onOpenFilter={handleOpenFilter}
            showRulers={showRulers}
            onToggleRulers={() => setShowRulers((p) => !p)}
            showGuides={showGuides}
            onToggleGuides={() => setShowGuides((p) => !p)}
            onRotate90CW={handleRotateRight90}
            onRotate90CCW={handleRotateLeft90}
            onRotate180={handleRotate180}
            onFlipH={handleFlipH}
            onFlipV={handleFlipV}
            // Canvas operations
            onCanvasBackground={() => setShowCanvasBgModal(true)}
            onFlipCanvasH={handleFlipH}
            onFlipCanvasV={handleFlipV}
            onFitCanvasToContent={handleFitCanvasToContent}
            // Image operations
            onImageResolution={() => setShowResolutionModal(true)}
            // Processing operations
            onTrimTransparent={handleTrimTransparent}
            onTrimWhite={handleTrimWhite}
            onTrimTopLeft={handleTrimTopLeft}
            onCropToSelection={handleCropToSelection}
            onCropToDocumentBounds={handleCropToDocumentBounds}
            // Adjustments
            onOpenAdjustment={handleOpenAdjustment}
            // Other operations
            onShowImageInfo={() => setShowImageInfoModal(true)}
            onDuplicateDocument={handleDuplicateDocument}
            onFlattenImage={handleFlattenImage}
          />

          {/* 2.5 Multi-Document Tabs Bar (Immediately below ApplicationMenuBar) */}
          {documents.length > 0 && (
            <DocumentTabsBar
              documents={documents}
              activeDocumentId={activeDocumentId}
              onSelectDocument={handleSwitchDocument}
              onCloseDocument={handleRequestCloseDocument}
              onReorderDocuments={handleReorderDocuments}
              onNewBlankCanvas={() => setIsBlankModalOpen(true)}
              onOpenFile={handleTriggerUpload}
              onOpenImage={handleTriggerUpload}
              onCloseAllDocuments={handleCloseAllDocuments}
              onDropLayerOnTab={handleDropLayerOnTab}
              onDropFiles={handleLoadFiles}
            />
          )}

          {/* 3. Horizontal Contextual Options Toolbar directly below ApplicationMenuBar */}
          {hasImage && (
            <ContextualToolbar
              activeTool={activeTool}
              onSelectTool={handleToolSelect}
              selectedLayer={activeTextDraft ? { ...activeTextDraft, id: 'draft', type: 'text' } : selectedLayer}
              selectedLayerIds={selectedLayerIds}
              onUpdateLayer={handleUpdateLayer}
              currentWidth={currentWidth}
              currentHeight={currentHeight}
              zoom={zoom}
              lockAspectRatio={lockAspectRatio}
              onToggleLockAspect={() => setLockAspectRatio((p) => !p)}
              onAlignLayers={handleAlignSelectedLayers}
              onDistributeLayers={handleDistributeSelectedLayers}
              onMergeLayers={handleMergeLayers}
              onDeleteSelectedLayers={handleDeleteSelectedLayers}
              activeSelection={activeSelection}
              selectionFeather={selectionFeather}
              onSelectionFeatherChange={setSelectionFeather}
              selectionTolerance={selectionTolerance}
              onSelectionToleranceChange={setSelectionTolerance}
              onDeselect={handleDeselect}
              onInvertSelection={handleInvertSelection}
              onSelectAll={handleSelectAll}
              onDeleteSelectedPixels={handleDeleteSelectedPixels}
              onConvertSelectionToMask={handleConvertSelectionToMask}
              penPath={penPath}
              penFillColor={penFillColor}
              onPenFillColorChange={setPenFillColor}
              penStrokeColor={penStrokeColor}
              onPenStrokeColorChange={setPenStrokeColor}
              penStrokeWidth={penStrokeWidth}
              onPenStrokeWidthChange={setPenStrokeWidth}
              onMakeSelectionFromPen={handleMakeSelectionFromPen}
              onMakeShapeFromPen={handleMakeShapeFromPen}
              onMakeMaskFromPen={handleMakeMaskFromPen}
              onStrokePenPath={handleStrokePenPath}
              onFillPenPath={handleFillPenPath}
              onClearPenPath={handleClearPenPath}
              patchMode={patchMode}
              onPatchModeChange={setPatchMode}
              patchFeather={patchFeather}
              onPatchFeatherChange={setPatchFeather}
              hasPatchSelection={Boolean(patchState?.selection)}
              onApplyPatch={handleApplyPatch}
              onCancelPatch={handleCancelPatch}
              cropPreset={cropPreset}
              onSelectCropPreset={handleSelectCropPreset}
              cropBox={cropBox}
              onApplyCrop={handleApplyCrop}
              onCancelCrop={handleCancelCrop}
              resizeWidth={resizeWidth}
              resizeHeight={resizeHeight}
              onResizeWidthChange={handleResizeWidthChange}
              onResizeHeightChange={handleResizeHeightChange}
              onScalePreset={handleScalePreset}
              onApplyResize={handleApplyResize}
              rotateAngle={rotateAngle}
              onAngleChange={setRotateAngle}
              onFlipH={handleFlipH}
              onFlipV={handleFlipV}
              onResetRotation={handleResetRotation}
              onApplyRotate={handleApplyRotate}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onCanvasWidthChange={setCanvasWidth}
              onCanvasHeightChange={setCanvasHeight}
              canvasBgOption={canvasBgOption}
              onCanvasBgOptionChange={setCanvasBgOption}
              canvasCustomColor={canvasCustomColor}
              onCanvasCustomColorChange={setCanvasCustomColor}
              onApplyCanvas={handleApplyCanvas}
              textSettings={textSettings}
              onUpdateTextSettings={handleUpdateTextSettings}
              onApplyTextPreset={handleApplyTextPreset}
              activeShapeType={
                ['rect', 'rounded-rect', 'circle', 'ellipse', 'triangle', 'line', 'star', 'polygon', 'arrow', 'custom-shape'].includes(activeTool)
                  ? activeTool
                  : 'rect'
              }
              onSelectShapeType={(shapeId) => {
                setActiveTool(shapeId);
                setActiveTab('shapes');
              }}
              foregroundColor={foregroundColor}
              onForegroundColorChange={setForegroundColor}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
              onSwapColors={handleSwapColors}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              brushHardness={brushHardness}
              onBrushHardnessChange={setBrushHardness}
              brushOpacity={brushOpacity}
              onBrushOpacityChange={setBrushOpacity}
              onClearEraser={handleClearEraserChanges}
            />
          )}



          {/* Error Banner */}
          {error && (
            <div
              className={styles.workspaceAlert}
              role="alert"
              data-testid="workspace-alert"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className={styles.alertCloseBtn}
                data-testid="alert-close-btn"
              >
                ✕
              </button>
            </div>
          )}

          {/* -------------------------------------------------------------
              MAIN BODY: Left Tools Panel + Central Viewport + Right Workspace
              ------------------------------------------------------------- */}
          <div className={styles.editorMainArea}>
            {/* 4. Left Vertical Tools Panel (Photoshop style) */}
            <LeftToolPanel
              activeTool={activeTool}
              onToolSelect={handleToolSelect}
              foregroundColor={foregroundColor}
              backgroundColor={backgroundColor}
              onForegroundColorChange={setForegroundColor}
              onBackgroundColorChange={setBackgroundColor}
              onSwapColors={handleSwapColors}
              hasImage={hasImage}
              onResetColors={handleResetColors}
            />

            {/* Central Canvas Viewport */}
            <div
              ref={viewportRef}
              data-testid="canvas-viewport"
              className={`${styles.canvasViewport} ${activeTab === 'erase' ? styles.viewportEraser : ''
                } ${isPanActive || activeTool === 'hand' || isSpaceHandActive ? (isPanning ? styles.viewportPanning : styles.viewportPan) : ''}`}
              onMouseDown={handleMouseDownViewport}
              onMouseMove={handleMouseMoveViewport}
              onMouseUp={handleMouseUpViewport}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Dragged Layer Visual Overlay Feedback */}
              {isDraggingLayerOverCanvas && (
                <div className={styles.canvasLayerDropOverlay}>
                  <div className={styles.canvasLayerDropBadge}>
                    Drop layer to transfer to canvas
                  </div>
                </div>
              )}

              {/* Pixel Coordinate Rulers with Draggable Guides (Toggleable via View Menu) */}
              {showRulers && (
                <CanvasRulers
                  width={currentWidth || 1200}
                  height={currentHeight || 800}
                  zoom={hasImage ? zoom : 1}
                  pan={hasImage ? pan : { x: 0, y: 0 }}
                  guides={guides}
                  selectedGuideId={selectedGuideId}
                  showGuides={showGuides}
                  onAddGuide={handleAddGuide}
                  onUpdateGuide={handleUpdateGuide}
                  onDeleteGuide={handleDeleteGuide}
                  onSelectGuide={setSelectedGuideId}
                  viewportRef={viewportRef}
                  stageRef={stageRef}
                />
              )}

              {!hasImage ? (
                /* Empty Initial Start Screen: Create Blank Canvas or Open Image */
                <EditorStartScreen
                  onOpenFile={handleTriggerUpload}
                  onOpenImage={handleTriggerUpload}
                  onCreateBlankCanvas={handleCreateBlankCanvas}
                  onLoadFiles={handleLoadFiles}
                  onImportPsdResult={handleImportPsdResult}
                  isDragOver={isDragOver}
                />
              ) : (
                /* Loaded State — Active Canvas Stage */
                <div
                  ref={stageRef}
                  data-canvas-stage="true"
                  className={`${styles.imageStage} ${activeTool === 'text' ? styles.stageTextTool : ''
                    } ${isShapeDrawingTool ? styles.stageShapeTool : ''} ${isPenTool ? styles.stagePenTool : ''}`}
                  style={{
                    width: displayWidth,
                    height: displayHeight,
                    minWidth: displayWidth,
                    minHeight: displayHeight,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    flexShrink: 0,
                    flexGrow: 0,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    overflow: 'visible',
                    cursor: isPenTool
                      ? penCursor
                      : (isSelectionTool || isCropTool)
                        ? 'crosshair'
                        : (activeTool === 'text' || activeTool === 'text-vertical')
                          ? 'text'
                          : isMoveTool
                            ? 'default'
                            : undefined,
                  }}
                  onClick={handleStageClick}
                  onMouseDown={handleStagePointerDown}
                  onMouseMove={handleStagePointerMove}
                  onMouseUp={handleStagePointerUp}
                  onPointerDown={handleStagePointerDown}
                  onPointerMove={handleStagePointerMove}
                  onPointerUp={handleStagePointerUp}
                >
                  {/* =========================================================
                      LAYER 1: Document Viewport (Fixed Document Clipping Boundary)
                      ========================================================= */}
                  <div
                    className={styles.documentViewport}
                    data-testid="document-viewport"
                    data-document-viewport="true"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      backgroundColor:
                        canvasBgOption === 'white'
                          ? '#ffffff'
                          : canvasBgOption === 'black'
                            ? '#000000'
                            : canvasBgOption === 'custom' || canvasBgOption === 'color'
                              ? canvasCustomColor
                              : undefined,
                      backgroundImage:
                        canvasBgOption !== 'transparent' ? 'none' : undefined,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                      pointerEvents: 'auto',
                    }}
                  >
                    {/* SVG ClipPaths and Style Gradients */}
                    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
                    <defs>
                      {layers.map((l) => (
                        <g key={`styles-defs-${l.id}`}>
                          {l.type === 'shape' && (
                            <clipPath id={`clip-${l.id}`} clipPathUnits="userSpaceOnUse">
                              {l.shapeType === 'rect' && <rect x={l.x || 0} y={l.y || 0} width={l.width || 100} height={l.height || 100} />}
                              {l.shapeType === 'rounded-rect' && <rect x={l.x || 0} y={l.y || 0} width={l.width || 100} height={l.height || 100} rx={l.borderRadius || 16} />}
                              {l.shapeType === 'circle' && <circle cx={(l.x || 0) + (l.width || 100) / 2} cy={(l.y || 0) + (l.height || 100) / 2} r={Math.min(l.width || 100, l.height || 100) / 2} />}
                              {l.shapeType === 'triangle' && <polygon points={`${(l.x || 0) + (l.width || 100) / 2},${l.y || 0} ${(l.x || 0) + (l.width || 100)},${(l.y || 0) + (l.height || 100)} ${l.x || 0},${(l.y || 0) + (l.height || 100)}`} />}
                              {l.shapeType === 'custom-path' && l.pathData && <path d={l.pathData} transform={`translate(${l.x || 0}, ${l.y || 0})`} />}
                            </clipPath>
                          )}
                          {l.styles?.gradientOverlay?.enabled && (
                            <linearGradient
                              id={`grad-style-${l.id}`}
                              gradientTransform={`rotate(${l.styles.gradientOverlay.angle ?? 90} 0.5 0.5)`}
                            >
                              <stop offset="0%" stopColor={l.styles.gradientOverlay.color1 || '#7c3aed'} />
                              <stop offset="100%" stopColor={l.styles.gradientOverlay.color2 || '#ec4899'} />
                            </linearGradient>
                          )}
                        </g>
                      ))}
                    </defs>
                  </svg>

                  {/* =======================================================
                      Unified Layers Stack (Rendered in Natural Bottom-to-Top Order)
                      ======================================================= */}
                  {layers.map((layer, index) => {
                    if (layer.hidden) return null;
                    const isSelected = selectedLayerIds.includes(layer.id) || layer.id === selectedLayerId;
                    const baseClipLayer =
                      layer.clippingMask && index > 0
                        ? layers.slice(0, index).reverse().find((l) => !l.clippingMask)
                        : null;

                    const filterParts = [];
                    if (layer.styles?.dropShadow?.enabled) {
                      const ds = layer.styles.dropShadow;
                      const rad = ((ds.angle ?? 90) * Math.PI) / 180;
                      const dx = Math.round(Math.cos(rad) * (ds.distance ?? 5));
                      const dy = Math.round(Math.sin(rad) * (ds.distance ?? 5));
                      filterParts.push(`drop-shadow(${dx}px ${dy}px ${ds.blur ?? 10}px ${ds.color || 'rgba(0,0,0,0.5)'})`);
                    }
                    if (layer.styles?.outerGlow?.enabled) {
                      const og = layer.styles.outerGlow;
                      filterParts.push(`drop-shadow(0px 0px ${og.blur ?? 15}px ${og.color || '#ffd700'})`);
                    }
                    if (layer.styles?.stroke?.enabled) {
                      const st = layer.styles.stroke;
                      const sz = Math.min(20, Math.max(1, st.size ?? 3));
                      const col = st.color || '#000000';
                      filterParts.push(`drop-shadow(${sz}px 0 0 ${col}) drop-shadow(-${sz}px 0 0 ${col}) drop-shadow(0 ${sz}px 0 ${col}) drop-shadow(0 -${sz}px 0 ${col})`);
                    }
                    const effectiveFilter = filterParts.length > 0 ? filterParts.join(' ') : undefined;

                    return (
                      <div
                        key={layer.id}
                        data-layer-id={layer.id}
                        data-layer-type={layer.type}
                        data-layer-selected={isSelected ? 'true' : 'false'}
                        className={`${styles.stageLayerWrapper} ${isSelected && isMoveTool ? styles.stageLayerSelected : ''} ${layer.locked ? styles.stageLayerLocked : ''}`}
                        style={{
                          left: layer.x ?? 0,
                          top: layer.y ?? 0,
                          width: layer.width ?? displayWidth,
                          height: layer.height ?? displayHeight,
                          transform:
                            activeTab === 'rotate' && layer.id === 'background'
                              ? `rotate(${rotateAngle}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`
                              : layer.rotation
                                ? `rotate(${layer.rotation}deg)`
                                : 'none',
                          opacity: (layer.opacity || 100) / 100,
                          mixBlendMode: layer.blendMode && layer.blendMode !== 'normal' ? layer.blendMode : undefined,
                          filter: effectiveFilter,
                          maskImage: layer.mask?.enabled && layer.mask.dataUrl ? `url(${layer.mask.dataUrl})` : undefined,
                          WebkitMaskImage: layer.mask?.enabled && layer.mask.dataUrl ? `url(${layer.mask.dataUrl})` : undefined,
                          maskSize: '100% 100%',
                          WebkitMaskSize: '100% 100%',
                          clipPath: layer.clippingMask && baseClipLayer ? `url(#clip-${baseClipLayer.id})` : undefined,
                          WebkitClipPath: layer.clippingMask && baseClipLayer ? `url(#clip-${baseClipLayer.id})` : undefined,
                          cursor: activeTab === 'erase'
                            ? 'none'
                            : isCropTool
                              ? 'crosshair'
                              : isPenTool
                                ? penCursor
                                : isSelectionTool
                                  ? 'crosshair'
                                  : layer.locked
                                    ? 'default'
                                    : 'move',
                          pointerEvents: (activeTab === 'erase' || isCropTool || isPenTool || isSelectionTool) ? 'none' : 'auto',
                        }}
                        onClick={(e) => {
                          if (isCropTool || isSpacePressedRef.current || isSpaceHandActive || activeTool === 'hand' || isPanning) return;
                          if (justCreatedTextIdRef.current) {
                            e.stopPropagation();
                            return;
                          }
                          if (activeTool === 'text' || activeTool === 'text-vertical') {
                            if (layer.type === 'text') {
                              e.stopPropagation();
                              if (activeTextDraftRef.current) {
                                commitOrDiscardDraft();
                              }
                              startEditingText(layer.id);
                            }
                            return;
                          }
                          if (activeTextDraftRef.current) {
                            commitOrDiscardDraft();
                          }
                          if (editingTextLayerId) {
                            if (editingTextLayerId !== layer.id) {
                              finishEditingText(editingTextLayerId);
                            }
                            return;
                          }
                          e.stopPropagation();
                          setSelectedLayerId(layer.id);
                          setSelectedLayerIds([layer.id]);
                        }}
                        onDoubleClick={(e) => {
                          if (layer.type === 'text') {
                            e.stopPropagation();
                            if (activeTextDraftRef.current) {
                              commitOrDiscardDraft();
                            }
                            startEditingText(layer.id);
                          }
                        }}
                        onPointerDown={(e) => {
                          if (isCropTool || isPenTool || isSelectionTool) return;
                          if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive || e.button === 1) return;
                          if (isTextTool && layer.type !== 'text') return;
                          e.stopPropagation();
                          handleLayerPointerDown(e, layer.id, 'move');
                        }}
                        onMouseDown={(e) => {
                          if (isCropTool || isPenTool || isSelectionTool) return;
                          if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive || e.button === 1) return;
                          if (isTextTool && layer.type !== 'text') return;
                          e.stopPropagation();
                          handleLayerPointerDown(e, layer.id, 'move');
                        }}
                        onTouchStart={(e) => {
                          if (isCropTool || isPenTool || isSelectionTool) return;
                          if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive) return;
                          if (isTextTool && layer.type !== 'text') return;
                          e.stopPropagation();
                          handleLayerPointerDown(e, layer.id, 'move');
                        }}
                      >
                        {/* Layer Visual Content (Strictly Clipped by Document Viewport) */}
                        <div
                          className={styles.layerVisualContent}
                          style={{
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                          }}
                        >
                          {/* Render Image or filled Blank Layer */}
                          {(layer.type === 'image' || (layer.type === 'blank' && layer.dataUrl)) && (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                              <img
                                src={layer.dataUrl || (layer.id === 'background' ? currentDataUrl : '')}
                                alt={layer.name || 'Layer'}
                                draggable={false}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'fill',
                                  pointerEvents: 'none',
                                  display: 'block',
                                  userSelect: 'none',
                                }}
                              />
                              {layer.styles?.colorOverlay?.enabled && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: layer.styles.colorOverlay.color || '#7c3aed',
                                    opacity: (layer.styles.colorOverlay.opacity ?? 80) / 100,
                                    mixBlendMode: layer.styles.colorOverlay.blendMode && layer.styles.colorOverlay.blendMode !== 'normal'
                                      ? layer.styles.colorOverlay.blendMode
                                      : 'source-atop',
                                    maskImage: `url(${layer.dataUrl || (layer.id === 'background' ? currentDataUrl : '')})`,
                                    WebkitMaskImage: `url(${layer.dataUrl || (layer.id === 'background' ? currentDataUrl : '')})`,
                                    maskSize: '100% 100%',
                                    WebkitMaskSize: '100% 100%',
                                    pointerEvents: 'none',
                                  }}
                                />
                              )}
                              {layer.styles?.gradientOverlay?.enabled && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: `linear-gradient(${layer.styles.gradientOverlay.angle ?? 90}deg, ${layer.styles.gradientOverlay.color1 || '#7c3aed'}, ${layer.styles.gradientOverlay.color2 || '#ec4899'})`,
                                    opacity: (layer.styles.gradientOverlay.opacity ?? 85) / 100,
                                    maskImage: `url(${layer.dataUrl || (layer.id === 'background' ? currentDataUrl : '')})`,
                                    WebkitMaskImage: `url(${layer.dataUrl || (layer.id === 'background' ? currentDataUrl : '')})`,
                                    maskSize: '100% 100%',
                                    WebkitMaskSize: '100% 100%',
                                    pointerEvents: 'none',
                                  }}
                                />
                              )}
                            </div>
                          )}
                        {/* Render Shape */}
                        {layer.type === 'shape' && (() => {
                          const effectiveShapeFill = layer.styles?.colorOverlay?.enabled
                            ? layer.styles.colorOverlay.color
                            : layer.styles?.gradientOverlay?.enabled
                              ? `url(#grad-style-${layer.id})`
                              : layer.fillColor === 'transparent' ? 'none' : layer.fillColor;
                          return (
                            <svg
                              width="100%"
                              height="100%"
                              viewBox={`0 0 ${layer.width} ${layer.height}`}
                              style={{ overflow: 'visible', pointerEvents: 'none' }}
                            >
                              {layer.shapeType === 'rect' && (
                                <rect
                                  x="0"
                                  y="0"
                                  width={layer.width}
                                  height={layer.height}
                                  rx={layer.borderRadius || 0}
                                  fill={effectiveShapeFill}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth}
                                />
                              )}
                              {layer.shapeType === 'rounded-rect' && (
                                <rect
                                  x="0"
                                  y="0"
                                  width={layer.width}
                                  height={layer.height}
                                  rx={layer.borderRadius || 16}
                                  fill={effectiveShapeFill}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth}
                                />
                              )}
                              {layer.shapeType === 'circle' && (
                                <circle
                                  cx={layer.width / 2}
                                  cy={layer.height / 2}
                                  r={Math.min(layer.width, layer.height) / 2 - (layer.strokeWidth || 0) / 2}
                                  fill={effectiveShapeFill}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth}
                                />
                              )}
                              {layer.shapeType === 'ellipse' && (
                                <ellipse
                                  cx={layer.width / 2}
                                  cy={layer.height / 2}
                                  rx={Math.max(1, layer.width / 2 - (layer.strokeWidth || 0) / 2)}
                                  ry={Math.max(1, layer.height / 2 - (layer.strokeWidth || 0) / 2)}
                                  fill={effectiveShapeFill}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth}
                                />
                              )}
                              {layer.shapeType === 'line' && (
                                <line
                                  x1="0"
                                  y1={layer.height / 2}
                                  x2={layer.width}
                                  y2={layer.height / 2}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth || 3}
                                  strokeLinecap="round"
                                />
                              )}
                              {layer.shapeType === 'arrow' && (
                                <g>
                                  <line
                                    x1="0"
                                    y1={layer.height / 2}
                                    x2={layer.width - 14}
                                    y2={layer.height / 2}
                                    stroke={layer.strokeColor}
                                    strokeWidth={layer.strokeWidth || 3}
                                    strokeLinecap="round"
                                  />
                                  <polygon
                                    points={`${layer.width - 16},${layer.height / 2 - 8} ${layer.width},${layer.height / 2} ${layer.width - 16},${layer.height / 2 + 8}`}
                                    fill={layer.strokeColor}
                                  />
                                </g>
                              )}
                              {layer.shapeType === 'triangle' && (
                                <polygon
                                  points={`${layer.width / 2},0 ${layer.width},${layer.height} 0,${layer.height}`}
                                  fill={effectiveShapeFill}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth}
                                  strokeLinejoin="round"
                                />
                              )}
                              {layer.shapeType === 'star' && (
                                <polygon
                                  points={Array.from({ length: 10 }, (_, i) => {
                                    const r = i % 2 === 0 ? layer.width / 2 : layer.width * 0.22;
                                    const a = (i * Math.PI) / 5 - Math.PI / 2;
                                    return `${layer.width / 2 + r * Math.cos(a)},${layer.height / 2 + r * Math.sin(a)}`;
                                  }).join(' ')}
                                  fill={effectiveShapeFill}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth}
                                  strokeLinejoin="round"
                                />
                              )}
                              {layer.shapeType === 'polygon' && (
                                <polygon
                                  points={Array.from({ length: 6 }, (_, i) => {
                                    const a = (i * Math.PI) / 3 - Math.PI / 2;
                                    return `${layer.width / 2 + (layer.width / 2) * Math.cos(a)},${layer.height / 2 + (layer.height / 2) * Math.sin(a)}`;
                                  }).join(' ')}
                                  fill={effectiveShapeFill}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth}
                                  strokeLinejoin="round"
                                />
                              )}
                              {layer.shapeType === 'custom-shape' && (
                                <path
                                  d={`M ${layer.width / 2} ${layer.height * 0.8} C ${layer.width * 0.1} ${layer.height * 0.5}, 0 ${layer.height * 0.25}, ${layer.width * 0.25} ${layer.height * 0.1} C ${layer.width * 0.4} 0, ${layer.width / 2} ${layer.height * 0.2}, ${layer.width / 2} ${layer.height * 0.2} C ${layer.width / 2} ${layer.height * 0.2}, ${layer.width * 0.6} 0, ${layer.width * 0.75} ${layer.height * 0.1} C ${layer.width} ${layer.height * 0.25}, ${layer.width * 0.9} ${layer.height * 0.5}, ${layer.width / 2} ${layer.height * 0.8} Z`}
                                  fill={effectiveShapeFill}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth}
                                />
                              )}
                              {layer.shapeType === 'custom-path' && layer.pathData && (
                                <path
                                  d={layer.pathData}
                                  fill={effectiveShapeFill}
                                  stroke={layer.strokeColor}
                                  strokeWidth={layer.strokeWidth || 2}
                                />
                              )}
                            </svg>
                          );
                        })()}

                        {/* Render Text */}
                        {layer.type === 'text' && (
                          editingTextLayerId === layer.id ? (
                            <textarea
                              ref={(el) => {
                                textEditorRef.current = el;
                                if (el && document.activeElement !== el) {
                                  el.focus();
                                }
                              }}
                              autoFocus
                              data-text-editor="true"
                              data-testid="inline-text-editor"
                              value={layer.text || ''}
                              placeholder=""
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateLayer(layer.id, {
                                  text: val,
                                  name: val.trim() ? val.slice(0, 30) : 'Text Layer',
                                });
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={(e) => {
                                const rel = e.relatedTarget;
                                if (
                                  rel &&
                                  (rel.closest('[data-testid="contextual-toolbar"]') ||
                                    rel.closest('[data-testid="properties-panel"]') ||
                                    rel.closest('[class*="contextualToolbar"]') ||
                                    rel.closest('[class*="propertiesPanel"]'))
                                ) {
                                  return;
                                }
                                finishEditingText(layer.id);
                              }}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                  e.preventDefault();
                                  finishEditingText(layer.id);
                                  return;
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelEditingText(layer.id);
                                  return;
                                }
                              }}
                              className={styles.inlineEditTextarea}
                              style={{
                                fontFamily: layer.fontFamily,
                                fontSize: `${layer.fontSize}px`,
                                fontWeight: layer.fontWeight,
                                fontStyle: layer.fontStyle,
                                color: layer.styles?.colorOverlay?.enabled ? layer.styles.colorOverlay.color : layer.color,
                                textAlign: layer.align,
                                backgroundColor:
                                  layer.bgColor && layer.bgColor !== 'transparent'
                                    ? layer.bgColor
                                    : 'transparent',
                                letterSpacing: `${layer.letterSpacing || 0}px`,
                                lineHeight: layer.lineHeight || 1.2,
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                              }}
                            />
                          ) : (
                            <div
                              data-text-content="true"
                              className={styles.stageTextContent}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                startEditingText(layer.id);
                              }}
                              style={{
                                fontFamily: layer.fontFamily,
                                fontSize: `${layer.fontSize}px`,
                                fontWeight: layer.fontWeight,
                                fontStyle: layer.fontStyle,
                                color: layer.styles?.colorOverlay?.enabled ? layer.styles.colorOverlay.color : layer.color,
                                textAlign: layer.align,
                                backgroundColor:
                                  layer.bgColor && layer.bgColor !== 'transparent'
                                    ? layer.bgColor
                                    : 'transparent',
                                WebkitTextStroke:
                                  layer.strokeWidth > 0
                                    ? `${layer.strokeWidth}px ${layer.strokeColor}`
                                    : 'none',
                                textShadow:
                                  layer.shadowBlur > 0
                                    ? `${layer.shadowOffsetX}px ${layer.shadowOffsetY}px ${layer.shadowBlur}px ${layer.shadowColor}`
                                    : 'none',
                                textDecoration: layer.underline ? 'underline' : 'none',
                                letterSpacing: `${layer.letterSpacing || 0}px`,
                                lineHeight: layer.lineHeight || 1.2,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                userSelect: 'none',
                                ...(layer.styles?.gradientOverlay?.enabled ? {
                                  background: `linear-gradient(${layer.styles.gradientOverlay.angle ?? 90}deg, ${layer.styles.gradientOverlay.color1 || '#7c3aed'}, ${layer.styles.gradientOverlay.color2 || '#ec4899'})`,
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                } : {}),
                              }}
                            >
                              {layer.text || ''}
                            </div>
                          )
                        )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Active Text Draft - Created on canvas click without polluting layers until text is typed */}
                  {activeTextDraft && (
                    <div
                      data-text-draft-container="true"
                      data-testid="text-draft-container"
                      style={{
                        position: 'absolute',
                        left: activeTextDraft.x ?? 0,
                        top: activeTextDraft.y ?? 0,
                        width: activeTextDraft.width ?? 200,
                        minHeight: activeTextDraft.height ?? 40,
                        border: '1.5px dashed #7c3aed',
                        borderRadius: '2px',
                        boxShadow: '0 0 0 1px rgba(124, 58, 237, 0.2)',
                        background: 'transparent',
                        zIndex: 60,
                        boxSizing: 'border-box',
                        padding: 0,
                        display: 'flex',
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <textarea
                        ref={(el) => {
                          textEditorRef.current = el;
                          if (el && document.activeElement !== el) {
                            el.focus();
                          }
                        }}
                        autoFocus
                        data-text-editor="true"
                        data-testid="inline-text-editor"
                        data-text-draft-editor="true"
                        value={activeTextDraft.text || ''}
                        placeholder=""
                        onChange={(e) => {
                          handleUpdateDraftText(e.target.value);
                        }}
                        onBlur={(e) => {
                          const rel = e.relatedTarget;
                          if (
                            rel &&
                            (rel.closest('[data-testid="contextual-toolbar"]') ||
                              rel.closest('[data-testid="properties-panel"]') ||
                              rel.closest('[class*="contextualToolbar"]') ||
                              rel.closest('[class*="propertiesPanel"]'))
                          ) {
                            return;
                          }
                          commitOrDiscardDraft();
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            commitOrDiscardDraft();
                            return;
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            discardDraft();
                            return;
                          }
                        }}
                        className={styles.inlineEditTextarea}
                        style={{
                          width: '100%',
                          minHeight: '100%',
                          fontFamily: activeTextDraft.fontFamily,
                          fontSize: `${activeTextDraft.fontSize}px`,
                          fontWeight: activeTextDraft.fontWeight,
                          fontStyle: activeTextDraft.fontStyle,
                          color: activeTextDraft.color,
                          textAlign: activeTextDraft.align,
                          backgroundColor:
                            activeTextDraft.bgColor && activeTextDraft.bgColor !== 'transparent'
                              ? activeTextDraft.bgColor
                              : 'transparent',
                          letterSpacing: `${activeTextDraft.letterSpacing || 0}px`,
                          lineHeight: activeTextDraft.lineHeight || 1.2,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          outline: 'none',
                          border: 'none',
                          resize: 'none',
                          margin: 0,
                          padding: '2px 4px',
                          caretColor: '#7c3aed',
                        }}
                      />
                    </div>
                  )}

                  {/* Live Text Frame Dragging Preview */}
                  {textDragBox && (
                    <div
                      data-text-drag-box="true"
                      style={{
                        position: 'absolute',
                        left: textDragBox.x,
                        top: textDragBox.y,
                        width: textDragBox.width,
                        height: textDragBox.height,
                        border: '1.5px dashed #7c3aed',
                        background: 'rgba(124, 58, 237, 0.08)',
                        pointerEvents: 'none',
                        zIndex: 50,
                      }}
                    />
                  )}

                  {/* Live Proposed Canvas Boundary Indicator (in Canvas Tab) */}
                  {activeTab === 'canvas' &&
                    (parseInt(canvasWidth, 10) !== currentWidth ||
                      parseInt(canvasHeight, 10) !== currentHeight) && (
                      <div
                        className={styles.canvasProposedGuide}
                        style={{
                          width: parseInt(canvasWidth, 10) || currentWidth,
                          height: parseInt(canvasHeight, 10) || currentHeight,
                        }}
                      />
                    )}

                  {/* Interactive Shape Drawing Surface Overlay */}
                  {isShapeDrawingTool && (
                    <div
                      className={styles.shapeDrawingSurface}
                      data-shape-drawing-surface="true"
                      onPointerDown={handleShapeDrawStart}
                      onPointerMove={handleShapeDrawMove}
                      onPointerUp={handleShapeDrawEnd}
                      onPointerCancel={handleCancelShapeDraw}
                    />
                  )}

                  {/* Live Shape Dragging Preview */}
                  {drawingShapePreview?.active && (
                    <div
                      className={styles.shapePreviewContainer}
                      data-shape-preview="true"
                      style={{
                        position: 'absolute',
                        left: drawingShapePreview.left,
                        top: drawingShapePreview.top,
                        width: Math.max(1, drawingShapePreview.width),
                        height: Math.max(1, drawingShapePreview.height),
                        pointerEvents: 'none',
                        zIndex: 130,
                      }}
                    >
                      <svg
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${Math.max(1, drawingShapePreview.width)} ${Math.max(1, drawingShapePreview.height)}`}
                        style={{ overflow: 'visible' }}
                      >
                        {drawingShapePreview.shapeType === 'rect' && (
                          <rect
                            x="0"
                            y="0"
                            width={drawingShapePreview.width}
                            height={drawingShapePreview.height}
                            fill={drawingShapePreview.fillColor === 'transparent' ? 'none' : drawingShapePreview.fillColor}
                            stroke={drawingShapePreview.strokeColor}
                            strokeWidth={drawingShapePreview.strokeWidth}
                          />
                        )}
                        {drawingShapePreview.shapeType === 'rounded-rect' && (
                          <rect
                            x="0"
                            y="0"
                            width={drawingShapePreview.width}
                            height={drawingShapePreview.height}
                            rx="16"
                            fill={drawingShapePreview.fillColor === 'transparent' ? 'none' : drawingShapePreview.fillColor}
                            stroke={drawingShapePreview.strokeColor}
                            strokeWidth={drawingShapePreview.strokeWidth}
                          />
                        )}
                        {drawingShapePreview.shapeType === 'circle' && (
                          <circle
                            cx={drawingShapePreview.width / 2}
                            cy={drawingShapePreview.height / 2}
                            r={Math.max(1, Math.min(drawingShapePreview.width, drawingShapePreview.height) / 2 - (drawingShapePreview.strokeWidth || 0) / 2)}
                            fill={drawingShapePreview.fillColor === 'transparent' ? 'none' : drawingShapePreview.fillColor}
                            stroke={drawingShapePreview.strokeColor}
                            strokeWidth={drawingShapePreview.strokeWidth}
                          />
                        )}
                        {drawingShapePreview.shapeType === 'ellipse' && (
                          <ellipse
                            cx={drawingShapePreview.width / 2}
                            cy={drawingShapePreview.height / 2}
                            rx={Math.max(1, drawingShapePreview.width / 2 - (drawingShapePreview.strokeWidth || 0) / 2)}
                            ry={Math.max(1, drawingShapePreview.height / 2 - (drawingShapePreview.strokeWidth || 0) / 2)}
                            fill={drawingShapePreview.fillColor === 'transparent' ? 'none' : drawingShapePreview.fillColor}
                            stroke={drawingShapePreview.strokeColor}
                            strokeWidth={drawingShapePreview.strokeWidth}
                          />
                        )}
                        {drawingShapePreview.shapeType === 'line' && (
                          <line
                            x1="0"
                            y1={drawingShapePreview.height / 2}
                            x2={drawingShapePreview.width}
                            y2={drawingShapePreview.height / 2}
                            stroke={drawingShapePreview.strokeColor}
                            strokeWidth={drawingShapePreview.strokeWidth || 3}
                            strokeLinecap="round"
                          />
                        )}
                        {drawingShapePreview.shapeType === 'triangle' && (
                          <polygon
                            points={`${drawingShapePreview.width / 2},0 ${drawingShapePreview.width},${drawingShapePreview.height} 0,${drawingShapePreview.height}`}
                            fill={drawingShapePreview.fillColor === 'transparent' ? 'none' : drawingShapePreview.fillColor}
                            stroke={drawingShapePreview.strokeColor}
                            strokeWidth={drawingShapePreview.strokeWidth}
                            strokeLinejoin="round"
                          />
                        )}
                        {drawingShapePreview.shapeType === 'star' && (
                          <polygon
                            points={Array.from({ length: 10 }, (_, i) => {
                              const r = i % 2 === 0 ? drawingShapePreview.width / 2 : drawingShapePreview.width * 0.22;
                              const a = (i * Math.PI) / 5 - Math.PI / 2;
                              return `${drawingShapePreview.width / 2 + r * Math.cos(a)},${drawingShapePreview.height / 2 + r * Math.sin(a)}`;
                            }).join(' ')}
                            fill={drawingShapePreview.fillColor === 'transparent' ? 'none' : drawingShapePreview.fillColor}
                            stroke={drawingShapePreview.strokeColor}
                            strokeWidth={drawingShapePreview.strokeWidth}
                            strokeLinejoin="round"
                          />
                        )}
                        {drawingShapePreview.shapeType === 'arrow' && (
                          <g>
                            <line
                              x1="0"
                              y1={drawingShapePreview.height / 2}
                              x2={Math.max(0, drawingShapePreview.width - 16)}
                              y2={drawingShapePreview.height / 2}
                              stroke={drawingShapePreview.strokeColor}
                              strokeWidth={drawingShapePreview.strokeWidth || 3}
                              strokeLinecap="round"
                            />
                            <polygon
                              points={`${Math.max(0, drawingShapePreview.width - 16)},${drawingShapePreview.height / 2 - 8} ${drawingShapePreview.width},${drawingShapePreview.height / 2} ${Math.max(0, drawingShapePreview.width - 16)},${drawingShapePreview.height / 2 + 8}`}
                              fill={drawingShapePreview.strokeColor}
                            />
                          </g>
                        )}
                        {drawingShapePreview.shapeType === 'polygon' && (
                          <polygon
                            points={Array.from({ length: 6 }, (_, i) => {
                              const a = (i * Math.PI) / 3 - Math.PI / 2;
                              return `${drawingShapePreview.width / 2 + (drawingShapePreview.width / 2) * Math.cos(a)},${drawingShapePreview.height / 2 + (drawingShapePreview.height / 2) * Math.sin(a)}`;
                            }).join(' ')}
                            fill={drawingShapePreview.fillColor === 'transparent' ? 'none' : drawingShapePreview.fillColor}
                            stroke={drawingShapePreview.strokeColor}
                            strokeWidth={drawingShapePreview.strokeWidth}
                            strokeLinejoin="round"
                          />
                        )}
                        {drawingShapePreview.shapeType === 'custom-shape' && (
                          <path
                            d={`M ${drawingShapePreview.width / 2} ${drawingShapePreview.height * 0.8} C ${drawingShapePreview.width * 0.1} ${drawingShapePreview.height * 0.5}, 0 ${drawingShapePreview.height * 0.25}, ${drawingShapePreview.width * 0.25} ${drawingShapePreview.height * 0.1} C ${drawingShapePreview.width * 0.4} 0, ${drawingShapePreview.width / 2} ${drawingShapePreview.height * 0.2}, ${drawingShapePreview.width / 2} ${drawingShapePreview.height * 0.2} C ${drawingShapePreview.width / 2} ${drawingShapePreview.height * 0.2}, ${drawingShapePreview.width * 0.6} 0, ${drawingShapePreview.width * 0.75} ${drawingShapePreview.height * 0.1} C ${drawingShapePreview.width} ${drawingShapePreview.height * 0.25}, ${drawingShapePreview.width * 0.9} ${drawingShapePreview.height * 0.5}, ${drawingShapePreview.width / 2} ${drawingShapePreview.height * 0.8} Z`}
                            fill={drawingShapePreview.fillColor === 'transparent' ? 'none' : drawingShapePreview.fillColor}
                            stroke={drawingShapePreview.strokeColor}
                            strokeWidth={drawingShapePreview.strokeWidth}
                          />
                        )}
                      </svg>

                      {/* Bounding Guide Box */}
                      <div className={styles.shapePreviewBoundingBox} />

                      {/* Live Dimensions Tooltip */}
                      <div className={styles.shapeDimensionBadge} data-shape-dimension-badge="true">
                        {Math.round(drawingShapePreview.width)} × {Math.round(drawingShapePreview.height)} px
                        {drawingShapePreview.shiftKey ? ' (1:1)' : ''}
                        {drawingShapePreview.altKey ? ' (Center)' : ''}
                      </div>
                    </div>
                  )}
                  </div>

                  {/* =========================================================
                      LAYER 2: Editor Selection Overlay (Unclipped Selection Controls)
                      ========================================================= */}
                  <div
                    className={styles.selectionOverlay}
                    data-testid="selection-overlay"
                    data-selection-overlay="true"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      overflow: 'visible',
                      pointerEvents: 'none',
                      zIndex: 40,
                    }}
                  >
                    {/* 1. LAYER TRANSFORM CONTROLS: Selection Frame and 8 Transform Handles (Move Tool Only) */}
                    {isMoveTool &&
                      layers
                        .filter(
                          (l) =>
                            (selectedLayerIds.includes(l.id) || l.id === selectedLayerId) &&
                            !l.locked &&
                            !l.hidden
                        )
                        .map((layer) => {
                        const isEditingThisText = editingTextLayerId === layer.id;
                        return (
                          <div
                            key={`transform-${layer.id}`}
                            data-testid={`transform-box-${layer.id}`}
                            data-transform-box="true"
                            className={styles.stageTransformBox}
                            style={{
                              position: 'absolute',
                              left: layer.x ?? 0,
                              top: layer.y ?? 0,
                              width: layer.width ?? displayWidth,
                              height: layer.height ?? displayHeight,
                              transform:
                                activeTab === 'rotate' && layer.id === 'background'
                                  ? `rotate(${rotateAngle}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`
                                  : layer.rotation
                                    ? `rotate(${layer.rotation}deg)`
                                    : 'none',
                              transformOrigin: 'center center',
                              display: isEditingThisText ? 'none' : 'block',
                              pointerEvents: isEditingThisText || (layer.id === 'background' && layers.length > 1) ? 'none' : 'auto',
                              cursor: activeTab === 'erase' ? 'none' : 'move',
                            }}
                            onDoubleClick={(e) => {
                              if (layer.type === 'text') {
                                e.stopPropagation();
                                startEditingText(layer.id);
                              }
                            }}
                            onPointerDown={(e) => {
                              if (isEditingThisText) return;
                              handleLayerPointerDown(e, layer.id, 'move');
                            }}
                            onMouseDown={(e) => {
                              if (isEditingThisText) return;
                              handleLayerPointerDown(e, layer.id, 'move');
                            }}
                            onTouchStart={(e) => {
                              if (isEditingThisText) return;
                              handleLayerPointerDown(e, layer.id, 'move');
                            }}
                          >
                            {/* 8 Bounding & Resize Handles */}
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleNW}`}
                              data-handle-pos="nw"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-nw')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-nw')}
                              title="Resize Top-Left"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleN}`}
                              data-handle-pos="n"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-n')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-n')}
                              title="Resize Top"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleNE}`}
                              data-handle-pos="ne"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-ne')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-ne')}
                              title="Resize Top-Right"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleE}`}
                              data-handle-pos="e"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-e')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-e')}
                              title="Adjust Box Width (Right)"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleSE}`}
                              data-handle-pos="se"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-se')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-se')}
                              title="Resize Bottom-Right"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleS}`}
                              data-handle-pos="s"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-s')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-s')}
                              title="Resize Bottom"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleSW}`}
                              data-handle-pos="sw"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-sw')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-sw')}
                              title="Resize Bottom-Left"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleW}`}
                              data-handle-pos="w"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-w')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-w')}
                              title="Adjust Box Width (Left)"
                            />

                            {/* Rotation Stalk Handle (Top) */}
                            <div
                              className={`${styles.layerRotateStalk} ${rotatingLayerId === layer.id ? styles.layerRotateStalkGrabbing : ''}`}
                              data-rotation-handle="true"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'rotate')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'rotate')}
                              title="Drag to rotate (Hold Shift to snap to 15°)"
                            >
                              <div
                                className={styles.layerRotateKnob}
                                data-rotation-knob="true"
                                onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'rotate')}
                                onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'rotate')}
                              >
                                <RotateCw className={styles.rotateKnobIcon} />
                              </div>
                              {rotatingLayerId === layer.id && (
                                <div className={styles.rotationAngleTooltip} data-rotation-tooltip="true">
                                  {rotatingAngle ?? layer.rotation ?? 0}°
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {/* 2. TEXT TOOL: Dedicated Text Frame & Width Handles (Text Tool Only, for Selected Text Layer) */}
                    {isTextTool &&
                      layers
                        .filter(
                          (l) =>
                            l.type === 'text' &&
                            (selectedLayerIds.includes(l.id) || l.id === selectedLayerId) &&
                            editingTextLayerId !== l.id &&
                            !l.locked &&
                            !l.hidden
                        )
                        .map((layer) => (
                          <div
                            key={`text-frame-${layer.id}`}
                            data-testid={`text-frame-box-${layer.id}`}
                            data-text-frame="true"
                            className={styles.stageTextFrameBox}
                            style={{
                              position: 'absolute',
                              left: layer.x ?? 0,
                              top: layer.y ?? 0,
                              width: layer.width ?? displayWidth,
                              height: layer.height ?? displayHeight,
                              transform: layer.rotation ? `rotate(${layer.rotation}deg)` : 'none',
                              transformOrigin: 'center center',
                              pointerEvents: 'auto',
                              cursor: 'text',
                            }}
                            onMouseDown={(e) => {
                              if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive || e.button === 1) {
                                handleMouseDownViewport(e);
                                return;
                              }
                              e.stopPropagation();
                              setEditingTextLayerId(layer.id);
                            }}
                            onDoubleClick={(e) => {
                              if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || isSpaceHandActive || e.button === 1) return;
                              e.stopPropagation();
                              setEditingTextLayerId(layer.id);
                            }}
                          >
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleW}`}
                              data-handle-pos="w"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-w')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-w')}
                              title="Adjust Text Box Width (Left)"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleE}`}
                              data-handle-pos="e"
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-e')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-e')}
                              title="Adjust Text Box Width (Right)"
                            />
                          </div>
                        ))}

                    {/* 3. CROP TOOL: Interactive Crop Overlay (Activated strictly in Crop Tool) */}
                    {isCropTool && cropBox.width > 0 && cropBox.height > 0 && (
                      <div
                        data-crop-overlay="true"
                        className={styles.cropOverlay}
                        style={{
                          left: cropBox.x,
                          top: cropBox.y,
                          width: cropBox.width,
                          height: cropBox.height,
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={(e) => handleCropMouseDown('move', e)}
                      >
                        {/* Rule-of-Thirds Grid */}
                        <div className={styles.gridLineH1} />
                        <div className={styles.gridLineH2} />
                        <div className={styles.gridLineV1} />
                        <div className={styles.gridLineV2} />

                        {/* Live Crop Dimensions Badge */}
                        <div data-crop-badge="true" className={styles.cropDimensionsBadge}>
                          {Math.round(cropBox.width)} × {Math.round(cropBox.height)} px
                        </div>

                        {/* Corner Handles */}
                        <div
                          data-crop-handle="true"
                          data-crop-handle-pos="nw"
                          className={`${styles.cropHandle} ${styles.handleNW}`}
                          onMouseDown={(e) => handleCropMouseDown('nw', e)}
                        />
                        <div
                          data-crop-handle="true"
                          data-crop-handle-pos="ne"
                          className={`${styles.cropHandle} ${styles.handleNE}`}
                          onMouseDown={(e) => handleCropMouseDown('ne', e)}
                        />
                        <div
                          data-crop-handle="true"
                          data-crop-handle-pos="se"
                          className={`${styles.cropHandle} ${styles.handleSE}`}
                          onMouseDown={(e) => handleCropMouseDown('se', e)}
                        />
                        <div
                          data-crop-handle="true"
                          data-crop-handle-pos="sw"
                          className={`${styles.cropHandle} ${styles.handleSW}`}
                          onMouseDown={(e) => handleCropMouseDown('sw', e)}
                        />

                        {/* Edge Handles */}
                        <div
                          data-crop-handle="true"
                          data-crop-handle-pos="n"
                          className={`${styles.edgeHandle} ${styles.edgeN}`}
                          onMouseDown={(e) => handleCropMouseDown('n', e)}
                        />
                        <div
                          data-crop-handle="true"
                          data-crop-handle-pos="s"
                          className={`${styles.edgeHandle} ${styles.edgeS}`}
                          onMouseDown={(e) => handleCropMouseDown('s', e)}
                        />
                        <div
                          data-crop-handle="true"
                          data-crop-handle-pos="w"
                          className={`${styles.edgeHandle} ${styles.edgeW}`}
                          onMouseDown={(e) => handleCropMouseDown('w', e)}
                        />
                        <div
                          data-crop-handle="true"
                          data-crop-handle-pos="e"
                          className={`${styles.edgeHandle} ${styles.edgeE}`}
                          onMouseDown={(e) => handleCropMouseDown('e', e)}
                        />
                      </div>
                    )}

                  {/* 4. MOVE TOOL: Multi-Layer Selection Combined Bounding Box */}
                  {isMoveTool && multiSelectBounds && (
                    <div
                      className={styles.multiSelectionBounds}
                      style={{
                        left: multiSelectBounds.x,
                        top: multiSelectBounds.y,
                        width: multiSelectBounds.width,
                        height: multiSelectBounds.height,
                      }}
                    >
                      <div className={styles.multiSelectionLabel}>
                        {selectedLayersList.length} Layers Selected
                      </div>
                    </div>
                  )}

                  {/* 5. MOVE TOOL: Canvas Selection Marquee Box (Empty stage drag) */}
                  {isMoveTool && canvasMarquee && canvasMarquee.active && (
                    <div
                      className={styles.canvasMarqueeBox}
                      style={{
                        left: Math.min(canvasMarquee.startX, canvasMarquee.currentX),
                        top: Math.min(canvasMarquee.startY, canvasMarquee.currentY),
                        width: Math.abs(canvasMarquee.currentX - canvasMarquee.startX),
                        height: Math.abs(canvasMarquee.currentY - canvasMarquee.startY),
                      }}
                    />
                  )}

                  {/* 6. SELECTION TOOLS: Active Selection Animated Marching Ants SVG Overlay */}
                  {!isCropTool && activeSelection && (
                    <svg
                      data-testid="marching-ants-overlay"
                      className={styles.marchingAntsSvg}
                      aria-label="Active selection marching ants"
                    >
                      {activeSelection.type === 'rect' && (
                        <>
                          <rect
                            x={activeSelection.x}
                            y={activeSelection.y}
                            width={activeSelection.width}
                            height={activeSelection.height}
                            className={styles.marchingAntsOutline}
                          />
                          <rect
                            x={activeSelection.x}
                            y={activeSelection.y}
                            width={activeSelection.width}
                            height={activeSelection.height}
                            className={styles.marchingAntsOutlineDark}
                          />
                        </>
                      )}
                      {activeSelection.type === 'ellipse' && (
                        <>
                          <ellipse
                            cx={activeSelection.x + activeSelection.width / 2}
                            cy={activeSelection.y + activeSelection.height / 2}
                            rx={activeSelection.width / 2}
                            ry={activeSelection.height / 2}
                            className={styles.marchingAntsOutline}
                          />
                          <ellipse
                            cx={activeSelection.x + activeSelection.width / 2}
                            cy={activeSelection.y + activeSelection.height / 2}
                            rx={activeSelection.width / 2}
                            ry={activeSelection.height / 2}
                            className={styles.marchingAntsOutlineDark}
                          />
                        </>
                      )}
                      {(activeSelection.type === 'lasso' || activeSelection.type === 'polygon') && activeSelection.points && (
                        <>
                          <polygon
                            points={activeSelection.points.map((p) => `${p.x},${p.y}`).join(' ')}
                            className={styles.marchingAntsOutline}
                          />
                          <polygon
                            points={activeSelection.points.map((p) => `${p.x},${p.y}`).join(' ')}
                            className={styles.marchingAntsOutlineDark}
                          />
                        </>
                      )}
                    </svg>
                  )}

                  {/* High-Fidelity Vector Path Canvas Overlay (Photoshop-style Pen & Node Editing) */}
                  {activeTool === 'pen' && (
                    <VectorPathOverlay
                      activeTool={activeTool}
                      penPath={penPath}
                      penHoverMode={penHoverMode}
                      penCursorPos={penCursorPos}
                      selectedLayer={selectedLayer}
                      selectedNodeIndex={selectedVectorNodeIndex}
                      onSelectNode={setSelectedVectorNodeIndex}
                      onConvertNodeType={handleConvertNodeType}
                      onDeleteNode={handleDeleteVectorNode}
                      onAnchorPointerDown={(idx) => {
                        setSelectedVectorNodeIndex(idx);
                        if (penHoverMode === 'delete') {
                          handleDeleteVectorNode(idx);
                          return;
                        }
                        const curShape = selectedLayer?.type === 'shape' ? selectedLayer : null;
                        if (curShape) {
                          const pts = curShape.points || [];
                          penDragRef.current = {
                            type: 'move-vector-node',
                            pointIndex: idx,
                            startX: penCursorPos?.x || 0,
                            startY: penCursorPos?.y || 0,
                            anchorOrigX: pts[idx]?.x || 0,
                            anchorOrigY: pts[idx]?.y || 0,
                            active: true,
                          };
                        }
                      }}
                      onHandlePointerDown={(idx, handleName) => {
                        penDragRef.current = {
                          type: 'drag-handle',
                          pointIndex: idx,
                          handleName,
                          active: true,
                        };
                      }}
                      hoveredSegment={hoveredSegment}
                    />
                  )}

                  {/* Patch Tool Preview Overlay */}
                  {activeTool === 'patch' && patchState?.selection && (
                    <div
                      className={styles.patchOverlay}
                      style={{
                        left: patchState.selection.x + (patchState.sourceOffset?.x || 0),
                        top: patchState.selection.y + (patchState.sourceOffset?.y || 0),
                        width: patchState.selection.width,
                        height: patchState.selection.height,
                      }}
                    />
                  )}
                  </div>
                </div>
              )}

              {/* Floating Circular Eraser Cursor */}
              {activeTab === 'erase' && cursorPos.visible && (
                <div
                  className={styles.eraserCursorRing}
                  style={{
                    left: cursorPos.x,
                    top: cursorPos.y,
                    width: brushSize * zoom,
                    height: brushSize * zoom,
                  }}
                />
              )}

            </div>

            {/* Right Workspace (Docked Tabbed Panels: Properties, Layers, History) */}
            <RightWorkspace
              hasImage={hasImage}
              currentWidth={currentWidth}
              currentHeight={currentHeight}
              zoom={zoom}
              layers={layers}
              selectedLayer={selectedLayer}
              selectedLayerId={selectedLayerId}
              selectedLayerIds={selectedLayerIds}
              onSelectLayers={handleSelectLayers}
              onSelectLayer={handleSelectLayer}
              onUpdateLayer={handleUpdateLayer}
              activeMaskLayerId={activeMaskLayerId}
              onSelectMaskTarget={handleSelectMaskTarget}
              onAddBlankLayer={handleAddBlankLayer}
              onAddBlankLayerAbove={handleAddBlankLayerAbove}
              onAddBlankLayerBelow={handleAddBlankLayerBelow}
              onAddGroup={handleAddGroup}
              onDuplicateLayer={handleDuplicateLayer}
              onDuplicateLayers={handleDuplicateSelectedLayers}
              onDeleteLayer={handleDeleteLayer}
              onDeleteLayers={handleDeleteSelectedLayers}
              onMoveLayer={handleMoveLayer}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
              onToggleLock={handleToggleLockLayer}
              onToggleHide={handleToggleHideLayer}
              onRenameLayer={handleRenameLayer}
              onReorderLayers={handleReorderLayers}
              onOpenBlendingOptions={handleOpenBlendingOptions}
              onToggleClippingMask={handleToggleClippingMask}
              onAddLayerMask={handleAddLayerMask}
              onDeleteLayerMask={handleDeleteLayerMask}
              onMergeLayers={handleMergeLayers}
              history={history}
              historyIndex={historyIndex}
              onJumpToHistory={handleJumpToHistory}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onResetOriginal={handleResetToOriginal}
              canReset={canReset}
              activeTool={activeTool}
              foregroundColor={foregroundColor}
              backgroundColor={backgroundColor}
              lockAspectRatio={lockAspectRatio}
              onToggleLockAspect={() => setLockAspectRatio((p) => !p)}
              onScalePreset={handleScalePreset}
              resizeWidth={resizeWidth}
              resizeHeight={resizeHeight}
              onResizeWidthChange={handleResizeWidthChange}
              onResizeHeightChange={handleResizeHeightChange}
              onApplyResize={handleApplyResize}
              onOpenResizeModal={() => setShowImageResizeModal(true)}
              cropPreset={cropPreset}
              onSelectCropPreset={handleSelectCropPreset}
              cropBox={cropBox}
              onApplyCrop={handleApplyCrop}
              onCancelCrop={handleCancelCrop}
              rotateAngle={rotateAngle}
              flipH={flipH}
              flipV={flipV}
              onAngleChange={setRotateAngle}
              onFlipH={handleFlipH}
              onFlipV={handleFlipV}
              onResetRotation={handleResetRotation}
              onApplyRotate={handleApplyRotate}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onCanvasWidthChange={setCanvasWidth}
              onCanvasHeightChange={setCanvasHeight}
              canvasBgOption={canvasBgOption}
              onCanvasBgOptionChange={setCanvasBgOption}
              canvasCustomColor={canvasCustomColor}
              onCanvasCustomColorChange={setCanvasCustomColor}
              onApplyCanvas={handleApplyCanvas}
              onOpenCanvasModal={() => setShowCanvasSizeModal(true)}
              textSettings={textSettings}
              onUpdateTextSettings={handleUpdateTextSettings}
              onApplyTextPreset={handleApplyTextPreset}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              brushHardness={brushHardness}
              onBrushHardnessChange={setBrushHardness}
              brushOpacity={brushOpacity}
              onBrushOpacityChange={setBrushOpacity}
              sourceDocId={activeDocumentId}
              onTransferLayer={handleTransferLayerToActiveDoc}
            />
          </div>

          {/* Bottom Status Bar */}
          {hasImage && (
            <BottomStatusBar
              currentWidth={currentWidth}
              currentHeight={currentHeight}
              zoom={zoom}
              onZoomChange={setZoom}
              onFitScreen={handleFitScreen}
            />
          )}
        </div>
      </div>

      {/* Photoshop Blending Options Dialog Modal */}
      {activeBlendingLayer && (
        <BlendingOptionsModal
          isOpen={Boolean(activeBlendingLayer)}
          layer={activeBlendingLayer}
          onClose={handleCloseBlendingOptions}
          onApply={handleApplyBlendingOptions}
          onLiveChange={handleLivePreviewBlending}
        />
      )}

      {/* Photoshop Filter Parameter Adjustment Dialog */}
      {activeFilterDialog && (
        <FilterDialog
          filter={activeFilterDialog}
          onClose={handleCloseFilter}
          onApply={(val) => handleApplyFilter(activeFilterDialog, val)}
          onLivePreview={(f, val) => handleLivePreviewFilter(f, val)}
        />
      )}

      {/* Photoshop Unsaved Changes Confirmation Modal */}
      {pendingCloseDoc && (
        <UnsavedChangesModal
          isOpen={Boolean(pendingCloseDoc)}
          filename={pendingCloseDoc.name}
          onSaveAndClose={() => handleSaveAndClose(pendingCloseDoc.id)}
          onDiscardAndClose={() => executeCloseDocument(pendingCloseDoc.id)}
          onCancel={() => setPendingCloseDoc(null)}
        />
      )}

      {/* Save Project As (Photoshop PSD) Dialog Modal */}
      <SaveProjectModal
        isOpen={isSaveProjectModalOpen}
        onClose={() => {
          setIsSaveProjectModalOpen(false);
          setPsdSaveError(null);
        }}
        onSave={executeSavePsd}
        defaultFileName={
          documents.find((d) => d.id === activeDocumentId)?.name || 'Untitled-1.psd'
        }
        documentStats={{
          width: currentWidth,
          height: currentHeight,
          layersCount: layers.length,
        }}
        isSaving={isSavingPsd}
        error={psdSaveError}
      />

      {/* Image Information Modal */}
      <ImageInfoModal
        isOpen={showImageInfoModal}
        onClose={() => setShowImageInfoModal(false)}
        documentInfo={{
          name: documents.find((d) => d.id === activeDocumentId)?.name || 'Untitled Document',
          width: currentWidth,
          height: currentHeight,
          layersCount: layers.length,
          colorSpace: 'sRGB',
          bitDepth: '8-bit',
        }}
      />

      {/* Image Resolution Modal */}
      <ImageResolutionModal
        isOpen={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
        currentWidth={currentWidth}
        currentHeight={currentHeight}
      />

      {/* Canvas Background Modal */}
      <CanvasBackgroundModal
        isOpen={showCanvasBgModal}
        onClose={() => setShowCanvasBgModal(false)}
        currentOption={canvasBgOption}
        currentColor={canvasCustomColor}
        onApply={handleApplyCanvasBg}
      />

      {/* Photoshop-Style Floating Canvas Size Modal */}
      <CanvasSizeModal
        isOpen={showCanvasSizeModal}
        onClose={() => setShowCanvasSizeModal(false)}
        currentWidth={currentWidth}
        currentHeight={currentHeight}
        currentBgOption={canvasBgOption}
        currentBgColor={canvasCustomColor}
        currentAnchor={canvasAnchor}
        onApply={(opts) => {
          handleApplyCanvas(opts);
        }}
      />

      {/* Photoshop-Style Floating Image Resize Modal */}
      <ImageResizeModal
        isOpen={showImageResizeModal}
        onClose={() => setShowImageResizeModal(false)}
        currentWidth={currentWidth}
        currentHeight={currentHeight}
        onApply={(opts) => {
          handleApplyResize(opts);
        }}
      />

      {/* Centered Minimal File Import Loading Modal */}
      <FileImportLoadingModal
        isOpen={Boolean(importLoading)}
        fileName={importLoading?.fileName || ''}
        fileType={importLoading?.fileType || ''}
        progress={importLoading?.progress ?? 0}
        status={importLoading?.status || 'Parsing layers...'}
        onCancel={handleCancelImport}
      />
    </ToolPageLayout>
  );
}

export default EditImagePage;
