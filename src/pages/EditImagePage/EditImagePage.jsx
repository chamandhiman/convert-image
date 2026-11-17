import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Upload,
  AlertCircle,
  Sliders,
  RotateCw,
  Type,
  Eraser,
  Shapes as ShapesIcon,
} from 'lucide-react';
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
import { isExternalFileDrag } from '@/utils/dragDropHelpers';
import EditImageContent from './EditImageContent';
import { EditorTopBar } from './components/EditorTopBar';
import { CanvasRulers } from './components/CanvasRulers';
import { ContextualToolbar } from './components/ContextualToolbar';
import { RightWorkspace } from './components/RightWorkspace';
import { EditorStartScreen, CanvasSetupModal } from './components/EditorStartScreen';
import { calculateTextDimensions, computeTextWrapLines } from './utils/textLayout';
import styles from './EditImagePage.module.css';

const SHAPE_TYPES = [
  { id: 'rect', label: 'Rectangle' },
  { id: 'rounded-rect', label: 'Rounded Rect' },
  { id: 'circle', label: 'Circle' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'line', label: 'Line' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'star', label: 'Star' },
];

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
  const [foregroundColor, setForegroundColor] = useState('#7C3AED');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [isPanActive, setIsPanActive] = useState(false);

  // Shape drawing state and refs
  const [drawingShapePreview, setDrawingShapePreview] = useState(null);
  const drawingShapePreviewRef = useRef(null);
  drawingShapePreviewRef.current = drawingShapePreview;
  const shapeDrawRef = useRef({ active: false });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidePanelTab('properties');
    setSearchParams({ tab });
    if (tab === 'crop') {
      setActiveTool('crop');
      if (activeCanvas) {
        setCropBox({
          x: 0,
          y: 0,
          width: activeCanvas.width,
          height: activeCanvas.height,
        });
        setCropPreset('free');
      }
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
    setActiveTool(toolId);
    if (toolId === 'crop') {
      setActiveTab('crop');
      setSidePanelTab('properties');
      if (activeCanvas) {
        setCropBox({
          x: 0,
          y: 0,
          width: activeCanvas.width,
          height: activeCanvas.height,
        });
        setCropPreset('free');
      }
    } else if (['resize', 'rotate', 'canvas', 'text'].includes(toolId)) {
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
  const [editingTextLayerId, setEditingTextLayerId] = useState(null);
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
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const viewportRef = useRef(null);
  const stageRef = useRef(null);

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
  const fileInputRef = useRef(null);
  const layerImageInputRef = useRef(null);

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

  // Live Display Dimensions for Canvas Stage (Synchronized with Resize inputs & handles)
  const displayWidth = parseInt(resizeWidth, 10) || currentWidth;
  const displayHeight = parseInt(resizeHeight, 10) || currentHeight;

  // Selected Layer
  const selectedLayer = useMemo(() => {
    return layers.find((l) => l.id === selectedLayerId) || null;
  }, [layers, selectedLayerId]);

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

    // Sync layers from history snapshot
    const entryLayers = history[historyIndex]?.layers;
    if (entryLayers) {
      setLayers(entryLayers.map((l) => ({ ...l })));
      layersRef.current = entryLayers.map((l) => ({ ...l }));
    }
  }, [activeCanvas, historyIndex]);

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
    },
    [activeCanvas]
  );

  const handleUpdateLayer = useCallback(
    (id, updates, commitHistory = false) => {
      const current = layersRef.current || [];
      const targetLayer = current.find((l) => l.id === id);

      let finalUpdates = { ...updates };
      if (targetLayer && targetLayer.type === 'text') {
        const merged = { ...targetLayer, ...updates };
        const textToMeasure = (merged.text !== undefined ? merged.text : targetLayer.text) || targetLayer.placeholder || 'Type your text here';
        const maxCanvasWidth = Math.max(100, (currentWidth || 1000) - (merged.x || 0) - 20);
        const textDims = calculateTextDimensions(textToMeasure, {
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
          finalUpdates.width = textDims.width;
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

  const handleDeleteLayer = useCallback(
    (id) => {
      if (id === 'background') return;
      const nextLayers = layersRef.current.filter((l) => l.id !== id);
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      pushHistory(null, nextLayers, 'Delete Layer');
      setSelectedLayerId((cur) => (cur === id ? null : cur));
    },
    [pushHistory]
  );

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
      pushHistory(null, nextLayers, 'Duplicate Layer');
    },
    [pushHistory]
  );

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

  // Load and initialize uploaded file
  const handleLoadFile = useCallback((selectedFile) => {
    if (!selectedFile) return;

    const isValidType =
      ACCEPTED_INPUT_TYPES.includes(selectedFile.type) ||
      /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico)$/i.test(selectedFile.name);

    if (!isValidType) {
      setError('Please select a valid image file (JPG, PNG, WebP, SVG, GIF, AVIF).');
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    const img = new Image();

    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      // Base Canvas
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = w;
      baseCanvas.height = h;
      const ctx = baseCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      setOriginalFile(selectedFile);
      setOrigWidth(w);
      setOrigHeight(h);
      setOrigSize(selectedFile.size);

      // Initialize history with Original
      setHistory([
        {
          canvas: baseCanvas,
          width: w,
          height: h,
          layers: [],
          label: 'Original',
          timestamp: Date.now(),
        },
      ]);
      setHistoryIndex(0);
      setLayers([]);
      setSelectedLayerId(null);
      setActiveTab('move');
      setActiveTool('move');

      // Auto-fit image to workspace on upload (never overflows, maintains aspect ratio)
      const initialZoom = calculateFitZoom(w, h);
      setZoom(initialZoom);
      setPan({ x: 0, y: 0 });
      setRotateAngle(0);
      setFlipH(false);
      setFlipV(false);
      setError('');

      URL.revokeObjectURL(objectUrl);
      trackImageUpload({ tool: 'edit_image', format: selectedFile.type });
    };

    img.onerror = () => {
      setError('Could not decode image file.');
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  }, [calculateFitZoom]);

  // Create blank canvas
  const handleCreateBlankCanvas = useCallback(({ width, height, bgColor, isTransparent }) => {
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

    const syntheticFile = {
      name: 'blank-canvas.png',
      type: 'image/png',
      size: 0,
    };

    setOriginalFile(syntheticFile);
    setOrigWidth(w);
    setOrigHeight(h);
    setOrigSize(0);

    setHistory([
      {
        canvas: blankCanvas,
        width: w,
        height: h,
        layers: [],
        label: `New Canvas (${w}×${h})`,
        timestamp: Date.now(),
      },
    ]);
    setHistoryIndex(0);
    setLayers([]);
    layersRef.current = [];
    setSelectedLayerId(null);
    setActiveTab('resize');
    setActiveTool('move');

    const initialZoom = calculateFitZoom(w, h);
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
    setRotateAngle(0);
    setFlipH(false);
    setFlipV(false);
    setError('');
    setIsBlankModalOpen(false);

    trackImageUpload({ tool: 'edit_image', format: 'canvas/blank' });
  }, [calculateFitZoom]);

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
  // KEYBOARD SHORTCUTS: Undo, Redo, Zoom Fit, 100% Zoom, Delete, Spacebar Pan
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in input or textarea
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName;
      const isInput =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        activeEl?.isContentEditable ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      if (e.code === 'Space' && !isSpacePressedRef.current) {
        isSpacePressedRef.current = true;
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

      // Delete selected layer
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        e.preventDefault();
        handleDeleteLayer(selectedLayerId);
        return;
      }

      if (e.key === 'Escape') {
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
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo, handleFitScreen, selectedLayerId, handleDeleteLayer]);

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
  };

  const handleBaseResizeStart = (e, handleType) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentWidth || !currentHeight) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = parseInt(resizeWidth, 10) || currentWidth;
    const startH = parseInt(resizeHeight, 10) || currentHeight;
    const ratio = (currentWidth && currentHeight) ? currentWidth / currentHeight : (startW / startH);

    const onPointerMove = (moveEvt) => {
      const z = zoomRef.current || 1;
      const dx = (moveEvt.clientX - startX) / z;
      const dy = (moveEvt.clientY - startY) / z;

      let newW = startW;
      let newH = startH;

      if (handleType === 'e') {
        newW = Math.max(20, Math.round(startW + dx));
        newH = lockAspectRatio ? Math.max(20, Math.round(newW / ratio)) : startH;
      } else if (handleType === 'w') {
        newW = Math.max(20, Math.round(startW - dx));
        newH = lockAspectRatio ? Math.max(20, Math.round(newW / ratio)) : startH;
      } else if (handleType === 's') {
        newH = Math.max(20, Math.round(startH + dy));
        newW = lockAspectRatio ? Math.max(20, Math.round(newH * ratio)) : startW;
      } else if (handleType === 'n') {
        newH = Math.max(20, Math.round(startH - dy));
        newW = lockAspectRatio ? Math.max(20, Math.round(newH * ratio)) : startW;
      } else if (handleType === 'se') {
        if (lockAspectRatio) {
          const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy * ratio;
          newW = Math.max(20, Math.round(startW + delta));
          newH = Math.max(20, Math.round(newW / ratio));
        } else {
          newW = Math.max(20, Math.round(startW + dx));
          newH = Math.max(20, Math.round(startH + dy));
        }
      } else if (handleType === 'sw') {
        if (lockAspectRatio) {
          const delta = Math.abs(-dx) > Math.abs(dy) ? -dx : dy * ratio;
          newW = Math.max(20, Math.round(startW + delta));
          newH = Math.max(20, Math.round(newW / ratio));
        } else {
          newW = Math.max(20, Math.round(startW - dx));
          newH = Math.max(20, Math.round(startH + dy));
        }
      } else if (handleType === 'ne') {
        if (lockAspectRatio) {
          const delta = Math.abs(dx) > Math.abs(-dy) ? dx : -dy * ratio;
          newW = Math.max(20, Math.round(startW + delta));
          newH = Math.max(20, Math.round(newW / ratio));
        } else {
          newW = Math.max(20, Math.round(startW + dx));
          newH = Math.max(20, Math.round(startH - dy));
        }
      } else if (handleType === 'nw') {
        if (lockAspectRatio) {
          const delta = Math.abs(-dx) > Math.abs(-dy) ? -dx : -dy * ratio;
          newW = Math.max(20, Math.round(startW + delta));
          newH = Math.max(20, Math.round(newW / ratio));
        } else {
          newW = Math.max(20, Math.round(startW - dx));
          newH = Math.max(20, Math.round(startH - dy));
        }
      }

      setResizeWidth(newW);
      setResizeHeight(newH);
    };

    const onPointerUp = () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
  };

  // ---------------------------------------------------------------------------
  // TAB 1: APPLY RESIZE
  // ---------------------------------------------------------------------------
  const handleApplyResize = () => {
    if (!activeCanvas) return;

    const targetW = parseInt(resizeWidth, 10);
    const targetH = parseInt(resizeHeight, 10);

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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
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

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const ctx = cropCanvas.getContext('2d');
        ctx.drawImage(activeCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // Adjust layers offset
        const shiftedLayers = layers
          .map((l) => ({
            ...l,
            x: l.x - cropX,
            y: l.y - cropY,
          }))
          .filter((l) => {
            // Keep layers that overlap the cropped canvas
            const w = l.width || 100;
            const h = l.height || 40;
            return l.x + w > 0 && l.x < cropW && l.y + h > 0 && l.y < cropH;
          });

        setLayers(shiftedLayers);
        layersRef.current = shiftedLayers;
        pushHistory(cropCanvas, shiftedLayers, `Crop (${cropW}×${cropH})`);

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
  const handleApplyCanvas = () => {
    if (!activeCanvas) return;

    const newW = parseInt(canvasWidth, 10);
    const newH = parseInt(canvasHeight, 10);

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
          canvasBgOption === 'custom' ? canvasCustomColor : canvasBgOption;
        if (resolvedBg !== 'transparent') {
          ctx.fillStyle = resolvedBg;
          ctx.fillRect(0, 0, newW, newH);
        }

        let offsetX = 0;
        let offsetY = 0;

        if (canvasAnchor.includes('l')) offsetX = 0;
        else if (canvasAnchor.includes('r')) offsetX = newW - currentWidth;
        else offsetX = Math.round((newW - currentWidth) / 2);

        if (canvasAnchor.startsWith('t')) offsetY = 0;
        else if (canvasAnchor.startsWith('b')) offsetY = newH - currentHeight;
        else offsetY = Math.round((newH - currentHeight) / 2);

        ctx.drawImage(activeCanvas, offsetX, offsetY);

        // Adjust layers offset
        const shiftedLayers = layers.map((l) => ({
          ...l,
          x: l.x + offsetX,
          y: l.y + offsetY,
        }));

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

  // ---------------------------------------------------------------------------
  // TAB 5: ADD TEXT ENGINE
  // ---------------------------------------------------------------------------
  const handleAddTextLayer = () => {
    if (!currentWidth || !currentHeight) return;

    const defaultFontSize = 32;
    const defaultWidth = Math.min(180, Math.max(100, currentWidth - 40));
    const dims = calculateTextDimensions('Type your text here', {
      fontSize: defaultFontSize,
      fontFamily: 'Poppins',
      fontWeight: 'bold',
      width: defaultWidth,
      autoWidth: false,
    });

    const newText = {
      id: 'text_' + Date.now(),
      name: 'Text Layer',
      type: 'text',
      text: '',
      placeholder: 'Type your text here',
      x: Math.max(20, Math.round((currentWidth - defaultWidth) / 2)),
      y: Math.max(20, Math.round(currentHeight / 3)),
      width: defaultWidth,
      height: dims.height,
      autoWidth: false,
      fontSize: defaultFontSize,
      fontFamily: 'Poppins',
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: foregroundColor || '#1e293b',
      align: 'left',
      bgColor: 'transparent',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 0,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      opacity: 100,
      rotation: 0,
      letterSpacing: 0,
      lineHeight: 1.2,
      hidden: false,
      locked: false,
    };

    const nextLayers = [...layersRef.current, newText];
    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newText.id);
    setEditingTextLayerId(newText.id);
    setActiveTool('move');
    setActiveTab('text');
    pushHistory(null, nextLayers, 'Add Text');
  };

  const handleStageClick = (e) => {
    if (activeTool === 'text') {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const effZoom = zoomRef.current || 1;
      const clickX = Math.round((e.clientX - rect.left) / effZoom);
      const clickY = Math.round((e.clientY - rect.top) / effZoom);

      const newId = 'text_' + Date.now();
      const defaultColor = foregroundColor || '#1e293b';
      const defaultFontSize = 32;
      const defaultWidth = Math.min(180, Math.max(100, displayWidth - clickX - 20));
      const dims = calculateTextDimensions('Type your text here', {
        fontSize: defaultFontSize,
        fontFamily: 'Poppins',
        fontWeight: 'bold',
        width: defaultWidth,
        autoWidth: false,
      });

      const newTextLayer = {
        id: newId,
        name: 'Text Layer',
        type: 'text',
        text: '',
        placeholder: 'Type your text here',
        x: Math.max(0, Math.min(Math.max(0, displayWidth - 100), clickX)),
        y: Math.max(0, Math.min(Math.max(0, displayHeight - 40), clickY)),
        width: defaultWidth,
        height: dims.height,
        autoWidth: false,
        fontFamily: 'Poppins',
        fontSize: defaultFontSize,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: defaultColor,
        align: 'left',
        bgColor: 'transparent',
        strokeColor: '#000000',
        strokeWidth: 0,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowBlur: 0,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        letterSpacing: 0,
        lineHeight: 1.2,
        locked: false,
        hidden: false,
        opacity: 100,
      };

      const nextLayers = [...layersRef.current, newTextLayer];
      setLayers(nextLayers);
      layersRef.current = nextLayers;
      setSelectedLayerId(newId);
      setEditingTextLayerId(newId);
      setActiveTool('move');
      setActiveTab('text');
      pushHistory(null, nextLayers, 'Add Text');
      return;
    }

    setSelectedLayerId(null);
    setEditingTextLayerId(null);
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
  // PHOTOSHOP-STYLE BLANK LAYER CREATION
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
    if (selectedLayerId && selectedLayerId !== 'background') {
      const foundIdx = nextLayers.findIndex((l) => l.id === selectedLayerId);
      if (foundIdx !== -1) {
        insertIdx = foundIdx + 1; // Insert directly above currently selected layer
      }
    } else if (selectedLayerId === 'background') {
      insertIdx = 0;
    }
    nextLayers.splice(insertIdx, 0, newLayer);

    setLayers(nextLayers);
    layersRef.current = nextLayers;
    setSelectedLayerId(newLayer.id);
    setActiveTool('move');
    pushHistory(null, nextLayers, `Add ${layerName}`);
  }, [currentWidth, currentHeight, selectedLayerId, pushHistory]);

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
    pushHistory(null, nextLayers, `Add ${shapeLabel}`);
  };

  // ---------------------------------------------------------------------------
  // INTERACTIVE PHOTOSHOP-STYLE SHAPE DRAWING (Pointer Down, Drag, Up)
  // ---------------------------------------------------------------------------
  const isShapeDrawingTool = Boolean(
    hasImage && ['rect', 'circle', 'ellipse', 'triangle', 'line', 'star', 'rounded-rect'].includes(activeTool)
  );

  const handleShapeDrawStart = (e) => {
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
      } catch {}
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
      fillColor: activeTool === 'line' ? 'transparent' : (foregroundColor || '#7C3AED'),
      strokeColor: activeTool === 'line' ? (foregroundColor || '#7C3AED') : (backgroundColor || '#FFFFFF'),
      strokeWidth: activeTool === 'line' ? 3 : 2,
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

    if (shapeType === 'line') {
      let endX = currentX;
      let endY = currentY;

      if (shiftKey) {
        // Constrain line to 45-degree angle increments
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
      width = Math.max(2, Math.abs(endX - startX));
      height = Math.max(2, Math.abs(endY - startY));

    const previewObj = {
      active: true,
      shapeType: 'line',
      left,
      top,
      width,
      height,
      startX,
      startY,
      endX,
      endY,
      fillColor: 'transparent',
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
      } catch {}
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
    if (activeTool === 'text' && layerId === 'background') {
      return;
    }
    e.stopPropagation();
    if (activeTab === 'erase') return;
    if (editingTextLayerId === layerId && action === 'move') return;

    const layer = layersRef.current.find((l) => l.id === layerId);
    if (!layer || layer.hidden || layer.locked) return;

    setSelectedLayerId(layerId);

    const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
    const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return;

    const startX = clientX;
    const startY = clientY;
    const startLayer = { ...layer };
    const effZoom = zoomRef.current || 1;

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
        handleUpdateLayer(
          layerId,
          {
            x: Math.round(startLayer.x + dx),
            y: Math.round(startLayer.y + dy),
          },
          false
        );
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
            ? 'Move Layer'
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

    // 1. Draw base raster image
    ctx.drawImage(activeCanvas, 0, 0);

    // 2. Pre-load any image layers
    const loadedImageElements = await Promise.all(
      layers.map((layer) => {
        if (layer.type === 'image' && layer.dataUrl) {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ id: layer.id, img });
            img.onerror = () => resolve({ id: layer.id, img: null });
            img.src = layer.dataUrl;
          });
        }
        return Promise.resolve(null);
      })
    );

    const imgMap = {};
    loadedImageElements.forEach((item) => {
      if (item && item.img) imgMap[item.id] = item.img;
    });

    // 3. Draw Layers (Shapes, Image Layers, Text) in order (bottom to top)
    layers.forEach((layer) => {
      if (layer.hidden) return;
      ctx.save();
      const cx = layer.x + (layer.width || 50) / 2;
      const cy = layer.y + (layer.height || 20) / 2;

      ctx.translate(cx, cy);
      if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.globalAlpha = (layer.opacity || 100) / 100;

      const halfW = (layer.width || 50) / 2;
      const halfH = (layer.height || 20) / 2;

      if (layer.type === 'shape') {
        drawShapeOnCanvas(ctx, layer, -halfW, -halfH, layer.width, layer.height);
      } else if (layer.type === 'text') {
        drawTextOnCanvas(ctx, layer, -halfW, -halfH, layer.width, layer.height);
      } else if (layer.type === 'image' && imgMap[layer.id]) {
        ctx.drawImage(imgMap[layer.id], -halfW, -halfH, layer.width, layer.height);
      }

      ctx.restore();
    });

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

  // Canvas drawing helper for Shapes
  const drawShapeOnCanvas = (ctx, shape, x, y, w, h) => {
    ctx.beginPath();
    const { shapeType, fillColor, strokeColor, strokeWidth, borderRadius } = shape;

    if (shapeType === 'rect') {
      ctx.rect(x, y, w, h);
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

    if (fillColor && fillColor !== 'transparent') {
      ctx.fillStyle = fillColor;
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

    // Optional background rect
    if (bgColor && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);
    }

    ctx.font = `${fontStyle || 'normal'} ${fontWeight || 'normal'} ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = align || 'left';
    if (letterSpacing && ctx.letterSpacing !== undefined) {
      ctx.letterSpacing = `${letterSpacing}px`;
    }

    if (shadowBlur > 0) {
      ctx.shadowColor = shadowColor || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX || 2;
      ctx.shadowOffsetY = shadowOffsetY || 2;
    }

    const { wrappedLines } = computeTextWrapLines(text || placeholder || '', {
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      letterSpacing,
      width: w,
      padding: 8,
    });

    const lineH = Math.round(fontSize * (lineHeight || 1.2));

    let textAnchorX = x + 4;
    if (align === 'center') textAnchorX = x + w / 2;
    else if (align === 'right') textAnchorX = x + w - 4;

    wrappedLines.forEach((line, idx) => {
      const lineY = y + 4 + idx * lineH;
      if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(line, textAnchorX, lineY);
      }
      ctx.fillStyle = color || '#FFFFFF';
      ctx.fillText(line, textAnchorX, lineY);

      if (layer.underline) {
        const m = ctx.measureText(line);
        let startX = textAnchorX;
        if (align === 'center') startX = textAnchorX - m.width / 2;
        else if (align === 'right') startX = textAnchorX - m.width;
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, Math.round(fontSize / 16));
        ctx.strokeStyle = color || '#FFFFFF';
        ctx.moveTo(startX, lineY + fontSize + 2);
        ctx.lineTo(startX + m.width, lineY + fontSize + 2);
        ctx.stroke();
      }
    });
  };

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
    if (isPanActive || activeTool === 'hand' || isSpacePressedRef.current || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    } else if (activeTab === 'erase') {
      handleEraseStart(e);
    } else {
      // Clicked on empty canvas background: deselect
      if (e.target === viewportRef.current || e.target === stageRef.current) {
        setSelectedLayerId(null);
      }
    }
  };

  const handleMouseMoveViewport = (e) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
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
    e.stopPropagation();
    e.preventDefault();
    cropDragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...cropBox },
    };

    const handleWindowMouseMove = (moveEvt) => {
      if (!cropDragRef.current || !currentWidth || !currentHeight) return;
      const { mode: dragMode, startX, startY, startBox } = cropDragRef.current;
      const effZoom = zoom || 1;
      const dx = (moveEvt.clientX - startX) / effZoom;
      const dy = (moveEvt.clientY - startY) / effZoom;

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

      let targetRatio = null;
      if (cropPreset === 'custom') {
        targetRatio = Math.max(1, customRatioW) / Math.max(1, customRatioH);
      } else if (cropPreset !== 'free') {
        const preset = CROP_PRESETS.find((p) => p.id === cropPreset);
        if (preset?.ratio) targetRatio = preset.ratio;
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

  // Upload trigger helpers
  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLoadFile(e.dataTransfer.files[0]);
    }
  };

  const estimatedCurrentBytes = useMemo(() => {
    if (!origSize || !origWidth || !origHeight || !currentWidth || !currentHeight) {
      return origSize || 0;
    }
    const ratio = (currentWidth * currentHeight) / (origWidth * origHeight);
    return Math.round(origSize * Math.pow(ratio, 0.9));
  }, [origSize, origWidth, origHeight, currentWidth, currentHeight]);

  return (
    <ToolPageLayout embeddedOnly>
      <div
        id="tool"
        className={styles.editorRoot}
        onDragOver={(e) => {
          if (isExternalFileDrag(e)) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDrop={(e) => {
          if (isExternalFileDrag(e)) {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleLoadFile(e.dataTransfer.files[0]);
            }
          }
        }}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleLoadFile(e.target.files[0]);
            }
          }}
          style={{ display: 'none' }}
        />

        {/* Hidden File Input for Image Layers */}
        <input
          ref={layerImageInputRef}
          type="file"
          data-testid="layer-image-input"
          accept={ACCEPT_STRING}
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

        {/* =================================================================
           MAIN PHOTOSHOP-INSPIRED WORKSPACE (Always Visible)
           ================================================================= */}
        <div className={styles.workspaceContainer}>
          <EditorTopBar
            hasImage={hasImage}
            activeTool={hasImage ? activeTool : null}
            onToolSelect={handleToolSelect}
            onCloseDocument={handleDeleteBaseImage}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            zoom={zoom}
            onZoomChange={setZoom}
            onFitScreen={handleFitScreen}
            isPanActive={isPanActive}
            onTogglePan={() => setIsPanActive((p) => !p)}
            onTriggerUpload={handleTriggerUpload}
            onDownload={handleDownload}
            onResetOriginal={handleResetToOriginal}
            canReset={canReset}
            onNewBlankCanvas={() => setIsBlankModalOpen(true)}
            onAddImageLayer={handleTriggerAddImageLayer}
          />

          {/* Error Banner */}
          {error && (
            <div className={styles.workspaceAlert} role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className={styles.alertCloseBtn}
              >
                ✕
              </button>
            </div>
          )}

          {/* -------------------------------------------------------------
              MAIN BODY: Central Viewport + Right Workspace
              ------------------------------------------------------------- */}
          <div className={styles.editorMainArea}>

            {/* Central Canvas Viewport */}
            <div
              ref={viewportRef}
              data-testid="canvas-viewport"
              className={`${styles.canvasViewport} ${
                activeTab === 'erase' ? styles.viewportEraser : ''
              } ${isPanActive || activeTool === 'hand' ? styles.viewportPan : ''}`}
              onMouseDown={handleMouseDownViewport}
              onMouseMove={handleMouseMoveViewport}
              onMouseUp={handleMouseUpViewport}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Pixel Coordinate Rulers (Always Visible) */}
              <CanvasRulers
                width={currentWidth || 1200}
                height={currentHeight || 800}
                zoom={hasImage ? zoom : 1}
                pan={hasImage ? pan : { x: 0, y: 0 }}
              />

              {!hasImage ? (
                /* Empty Initial Start Screen: Create Blank Canvas or Open Image */
                <EditorStartScreen
                  onOpenImage={handleTriggerUpload}
                  onCreateBlankCanvas={handleCreateBlankCanvas}
                  isDragOver={isDragOver}
                />
              ) : (
                /* Loaded State — Active Canvas Stage */
                <div
                  ref={stageRef}
                  data-canvas-stage="true"
                  className={`${styles.imageStage} ${
                    activeTool === 'text' ? styles.stageTextTool : ''
                  } ${isShapeDrawingTool ? styles.stageShapeTool : ''}`}
                  style={{
                    width: displayWidth,
                    height: displayHeight,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                  onClick={handleStageClick}
                >
                  {/* The Active Base Image */}
                  <img
                    src={currentDataUrl}
                    alt="Active Canvas"
                    className={styles.stageImage}
                    draggable={false}
                    data-layer-id="background"
                    onClick={(e) => {
                      if (activeTool === 'text') {
                        handleStageClick(e);
                        return;
                      }
                      e.stopPropagation();
                      setSelectedLayerId('background');
                      setEditingTextLayerId(null);
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'fill',
                      transform:
                        activeTab === 'rotate'
                          ? `rotate(${rotateAngle}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`
                          : 'none',
                      transition: activeTab === 'rotate' ? 'transform 0.1s ease' : 'none',
                    }}
                  />

                  {/* Base Image Selection Box and 8 Handles when base image is selected */}
                  {selectedLayerId === 'background' && activeTab !== 'crop' && (
                    <div className={styles.baseSelectionFrame} data-layer-id="background" data-selection-frame="background">
                      {/* 8 Bounding / Resize Handles */}
                      <div
                        className={`${styles.baseHandle} ${styles.baseHandleNW}`}
                        title="Resize Top-Left"
                        onMouseDown={(e) => handleBaseResizeStart(e, 'nw')}
                      />
                      <div
                        className={`${styles.baseHandle} ${styles.baseHandleN}`}
                        title="Resize Top"
                        onMouseDown={(e) => handleBaseResizeStart(e, 'n')}
                      />
                      <div
                        className={`${styles.baseHandle} ${styles.baseHandleNE}`}
                        title="Resize Top-Right"
                        onMouseDown={(e) => handleBaseResizeStart(e, 'ne')}
                      />
                      <div
                        className={`${styles.baseHandle} ${styles.baseHandleE}`}
                        title="Resize Right"
                        onMouseDown={(e) => handleBaseResizeStart(e, 'e')}
                      />
                      <div
                        className={`${styles.baseHandle} ${styles.baseHandleSE}`}
                        title="Resize Bottom-Right"
                        onMouseDown={(e) => handleBaseResizeStart(e, 'se')}
                      />
                      <div
                        className={`${styles.baseHandle} ${styles.baseHandleS}`}
                        title="Resize Bottom"
                        onMouseDown={(e) => handleBaseResizeStart(e, 's')}
                      />
                      <div
                        className={`${styles.baseHandle} ${styles.baseHandleSW}`}
                        title="Resize Bottom-Left"
                        onMouseDown={(e) => handleBaseResizeStart(e, 'sw')}
                      />
                      <div
                        className={`${styles.baseHandle} ${styles.baseHandleW}`}
                        title="Resize Left"
                        onMouseDown={(e) => handleBaseResizeStart(e, 'w')}
                      />

                      {/* Floating Quick Action Toolbar above the image */}
                      <ContextualToolbar
                        layer={{ id: 'background', name: 'Background', locked: false }}
                        onDuplicate={handleDuplicateBaseImage}
                        onDelete={handleDeleteBaseImage}
                        onToggleLock={() => {}}
                        onMoveUp={() => {}}
                        onMoveDown={() => {}}
                      />
                    </div>
                  )}

                  {/* =======================================================
                      OVERLAY: Vector & Image Layers
                      ======================================================= */}
                  {layers.map((layer) => {
                    if (layer.hidden) return null;
                    const isSelected = layer.id === selectedLayerId;

                    return (
                      <div
                        key={layer.id}
                        data-layer-id={layer.id}
                        data-layer-type={layer.type}
                        data-layer-selected={isSelected ? 'true' : 'false'}
                        className={`${styles.stageLayerWrapper} ${isSelected && layer.type !== 'blank' ? styles.stageLayerSelected : ''} ${layer.locked ? styles.stageLayerLocked : ''}`}
                        style={{
                          left: layer.x,
                          top: layer.y,
                          width: layer.width,
                          height: layer.height,
                          transform: layer.rotation ? `rotate(${layer.rotation}deg)` : 'none',
                          opacity: (layer.opacity || 100) / 100,
                          cursor: activeTab === 'erase' ? 'none' : layer.locked ? 'default' : 'move',
                          pointerEvents: activeTab === 'erase' || layer.type === 'blank' ? 'none' : 'auto',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLayerId(layer.id);
                          if (layer.type !== 'text') {
                            setEditingTextLayerId(null);
                          }
                        }}
                        onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'move')}
                        onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'move')}
                      >
                        {/* Render Image Layer */}
                        {layer.type === 'image' && (
                          <img
                            src={layer.dataUrl}
                            alt={layer.name || 'Image Layer'}
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
                        )}
                        {/* Render Shape */}
                        {layer.type === 'shape' && (
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
                                fill={layer.fillColor === 'transparent' ? 'none' : layer.fillColor}
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
                                fill={layer.fillColor === 'transparent' ? 'none' : layer.fillColor}
                                stroke={layer.strokeColor}
                                strokeWidth={layer.strokeWidth}
                              />
                            )}
                            {layer.shapeType === 'circle' && (
                              <circle
                                cx={layer.width / 2}
                                cy={layer.height / 2}
                                r={Math.min(layer.width, layer.height) / 2 - (layer.strokeWidth || 0) / 2}
                                fill={layer.fillColor === 'transparent' ? 'none' : layer.fillColor}
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
                                fill={layer.fillColor === 'transparent' ? 'none' : layer.fillColor}
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
                                fill={layer.fillColor === 'transparent' ? 'none' : layer.fillColor}
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
                                fill={layer.fillColor === 'transparent' ? 'none' : layer.fillColor}
                                stroke={layer.strokeColor}
                                strokeWidth={layer.strokeWidth}
                                strokeLinejoin="round"
                              />
                            )}
                          </svg>
                        )}

                        {/* Render Text */}
                        {layer.type === 'text' && (
                          editingTextLayerId === layer.id ? (
                            <textarea
                              autoFocus
                              data-text-editor="true"
                              value={layer.text}
                              placeholder={layer.placeholder || 'Type your text here'}
                              onChange={(e) => handleUpdateLayer(layer.id, { text: e.target.value })}
                              onBlur={() => {
                                setEditingTextLayerId(null);
                                if (!layer.text || !layer.text.trim()) {
                                  handleUpdateLayer(layer.id, { text: 'Type your text here' }, false);
                                }
                                pushHistory(null, layersRef.current, 'Edit Text');
                              }}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Escape') {
                                  setEditingTextLayerId(null);
                                  if (!layer.text || !layer.text.trim()) {
                                    handleUpdateLayer(layer.id, { text: 'Type your text here' }, false);
                                  }
                                  pushHistory(null, layersRef.current, 'Edit Text');
                                }
                              }}
                              className={styles.inlineEditTextarea}
                              style={{
                                fontFamily: layer.fontFamily,
                                fontSize: `${layer.fontSize}px`,
                                fontWeight: layer.fontWeight,
                                fontStyle: layer.fontStyle,
                                color: layer.color,
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
                                setEditingTextLayerId(layer.id);
                              }}
                              style={{
                                fontFamily: layer.fontFamily,
                                fontSize: `${layer.fontSize}px`,
                                fontWeight: layer.fontWeight,
                                fontStyle: layer.fontStyle,
                                color: layer.color,
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
                              }}
                            >
                              {layer.text || (
                                <span className={styles.emptyTextPlaceholder}>
                                  {layer.placeholder || 'Type your text here'}
                                </span>
                              )}
                            </div>
                          )
                        )}

                        {/* Interactive Selection Frame & Handles */}
                        {isSelected && !layer.locked && layer.type !== 'blank' && (
                          <>
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

                            {/* Floating Contextual Quick Actions (Duplicate, Delete, More) */}
                            {rotatingLayerId !== layer.id && (
                              <ContextualToolbar
                                layer={layer}
                                isNearBottom={(layer.y + (layer.height || 40)) > (displayHeight - 50)}
                                onDuplicate={handleDuplicateLayer}
                                onDelete={handleDeleteLayer}
                                onToggleLock={handleToggleLockLayer}
                                onMoveUp={(id) => handleMoveLayer(id, 'up')}
                                onMoveDown={(id) => handleMoveLayer(id, 'down')}
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Interactive Crop Overlay (Activated in Crop Tab & Tool) */}
                  {activeTab === 'crop' && activeTool === 'crop' && cropBox.width > 0 && cropBox.height > 0 && (
                    <div
                      data-crop-overlay="true"
                      className={styles.cropOverlay}
                      style={{
                        left: cropBox.x,
                        top: cropBox.y,
                        width: cropBox.width,
                        height: cropBox.height,
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
                        className={`${styles.cropHandle} ${styles.handleNW}`}
                        onMouseDown={(e) => handleCropMouseDown('nw', e)}
                      />
                      <div
                        className={`${styles.cropHandle} ${styles.handleNE}`}
                        onMouseDown={(e) => handleCropMouseDown('ne', e)}
                      />
                      <div
                        className={`${styles.cropHandle} ${styles.handleSE}`}
                        onMouseDown={(e) => handleCropMouseDown('se', e)}
                      />
                      <div
                        className={`${styles.cropHandle} ${styles.handleSW}`}
                        onMouseDown={(e) => handleCropMouseDown('sw', e)}
                      />

                      {/* Edge Handles */}
                      <div
                        className={`${styles.edgeHandle} ${styles.edgeN}`}
                        onMouseDown={(e) => handleCropMouseDown('n', e)}
                      />
                      <div
                        className={`${styles.edgeHandle} ${styles.edgeS}`}
                        onMouseDown={(e) => handleCropMouseDown('s', e)}
                      />
                      <div
                        className={`${styles.edgeHandle} ${styles.edgeW}`}
                        onMouseDown={(e) => handleCropMouseDown('w', e)}
                      />
                      <div
                        className={`${styles.edgeHandle} ${styles.edgeE}`}
                        onMouseDown={(e) => handleCropMouseDown('e', e)}
                      />
                    </div>
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

              {/* Right Workspace (Properties, Docked Layers, History) - Always Visible */}
              <RightWorkspace
                activeTab={activeTab}
                activeTool={activeTool}
                selectedLayer={selectedLayer}
                onUpdateLayer={handleUpdateLayer}
                layers={layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={(id) => setSelectedLayerId(id)}
                onAddBlankLayer={handleAddBlankLayer}
                onAddTextLayer={handleAddTextLayer}
                onAddShape={handleAddShape}
                onAddImageLayer={handleTriggerAddImageLayer}
                onDuplicateLayer={handleDuplicateLayer}
                onDeleteLayer={handleDeleteLayer}
                onMoveLayer={handleMoveLayer}
                onToggleLock={handleToggleLockLayer}
                onToggleHide={handleToggleHideLayer}
                onRenameLayer={handleRenameLayer}
                onReorderLayers={handleReorderLayers}
                backgroundThumbnail={currentDataUrl}
                history={history}
                historyIndex={historyIndex}
                onJumpToHistory={handleJumpToHistory}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onResetOriginal={handleResetToOriginal}
                canReset={canReset}
                resizeWidth={resizeWidth}
                resizeHeight={resizeHeight}
                onResizeWidthChange={handleResizeWidthChange}
                onResizeHeightChange={handleResizeHeightChange}
                lockAspectRatio={lockAspectRatio}
                onToggleLockAspect={() => setLockAspectRatio((p) => !p)}
                onScalePreset={handleScalePreset}
                onApplyResize={handleApplyResize}
                hasImage={hasImage}
                currentWidth={currentWidth}
                currentHeight={currentHeight}
                cropPreset={cropPreset}
                onSelectCropPreset={handleSelectCropPreset}
                cropBox={cropBox}
                onApplyCrop={handleApplyCrop}
                onCancelCrop={handleCancelCrop}
                rotateAngle={rotateAngle}
                flipH={flipH}
                flipV={flipV}
                onRotateLeft90={handleRotateLeft90}
                onRotateRight90={handleRotateRight90}
                onRotate180={handleRotate180}
                onResetRotation={handleResetRotation}
                onFlipH={handleFlipH}
                onFlipV={handleFlipV}
                onAngleChange={setRotateAngle}
                onApplyRotate={handleApplyRotate}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                onCanvasWidthChange={setCanvasWidth}
                onCanvasHeightChange={setCanvasHeight}
                canvasAnchor={canvasAnchor}
                onCanvasAnchorChange={setCanvasAnchor}
                canvasBgOption={canvasBgOption}
                onCanvasBgOptionChange={setCanvasBgOption}
                canvasCustomColor={canvasCustomColor}
                onCanvasCustomColorChange={setCanvasCustomColor}
                onApplyCanvas={handleApplyCanvas}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                brushHardness={brushHardness}
                onBrushHardnessChange={setBrushHardness}
                brushOpacity={brushOpacity}
                onBrushOpacityChange={setBrushOpacity}
                onClearEraser={handleClearEraserChanges}
                zoom={zoom}
                foregroundColor={foregroundColor}
                onForegroundColorChange={setForegroundColor}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
              />
            </div>
          </div>
        </div>
    </ToolPageLayout>
  );
}

export default EditImagePage;
