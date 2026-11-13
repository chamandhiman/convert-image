import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Upload,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  Sliders,
  Crop as CropIcon,
  RotateCw,
  Layout,
  Type,
  Eraser,
  Shapes as ShapesIcon,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Check,
  AlertCircle,
  FlipHorizontal,
  FlipVertical,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  Plus,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Triangle,
  Star,
  Info,
  Layers,
  Eye,
  EyeOff,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import { formatFileSize } from '@/utils/formatFileSize';
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
import styles from './EditImagePage.module.css';

// -----------------------------------------------------------------------------
// FONT SIZE INPUT (Smooth arrow-key stepping, non-blocking, typed input support)
// -----------------------------------------------------------------------------
function FontSizeInput({ value, onChange, onCommit, className }) {
  const [localVal, setLocalVal] = useState(String(value || 24));

  useEffect(() => {
    setLocalVal(String(value || 24));
  }, [value]);

  const stepVal = (delta) => {
    const current = parseInt(localVal, 10) || 24;
    const next = Math.max(8, Math.min(240, current + delta));
    setLocalVal(String(next));
    onChange(next);
  };

  const handleKeyDown = (e) => {
    // Stop propagation so global editor shortcuts (e.g. undo, delete, spacebar) do not intercept
    e.stopPropagation();

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      stepVal(step);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? -5 : -1;
      stepVal(step);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const num = parseInt(localVal, 10);
      const clamped = Math.max(8, Math.min(240, isNaN(num) ? 24 : num));
      setLocalVal(String(clamped));
      onChange(clamped);
      if (onCommit) onCommit(clamped);
      e.currentTarget.blur();
    }
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setLocalVal(text);
    const num = parseInt(text, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(8, Math.min(240, num));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    const num = parseInt(localVal, 10);
    const clamped = Math.max(8, Math.min(240, isNaN(num) ? 24 : num));
    setLocalVal(String(clamped));
    onChange(clamped);
    if (onCommit) onCommit(clamped);
  };

  return (
    <input
      type="number"
      min="8"
      max="240"
      value={localVal}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={className}
    />
  );
}

// -----------------------------------------------------------------------------
// CONSTANTS & PRESETS
// -----------------------------------------------------------------------------
const CROP_PRESETS = [
  { id: 'free', label: 'Freeform', ratio: null },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '16:9', label: '16:9 Landscape', ratio: 16 / 9 },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3 },
  { id: '9:16', label: '9:16 Story', ratio: 9 / 16 },
  { id: '3:2', label: '3:2 Photo', ratio: 3 / 2 },
  { id: 'custom', label: 'Custom', ratio: 'custom' },
];

const ANCHORS = [
  { id: 'tl', label: '↖ Top-Left' },
  { id: 'tc', label: '↑ Top-Center' },
  { id: 'tr', label: '↗ Top-Right' },
  { id: 'ml', label: '← Middle-Left' },
  { id: 'mc', label: '• Center' },
  { id: 'mr', label: '→ Middle-Right' },
  { id: 'bl', label: '↙ Bottom-Left' },
  { id: 'bc', label: '↓ Bottom-Center' },
  { id: 'br', label: '↘ Bottom-Right' },
];

const CANVAS_BG_OPTIONS = [
  { id: 'transparent', label: 'Transparent' },
  { id: '#FFFFFF', label: 'White' },
  { id: '#000000', label: 'Black' },
  { id: 'custom', label: 'Custom Color' },
];

const FONT_FAMILIES = [
  { id: 'Instrument Sans', label: 'Instrument Sans' },
  { id: 'IBM Plex Mono', label: 'IBM Plex Mono' },
  { id: 'Arial', label: 'Arial' },
  { id: 'Inter', label: 'Inter' },
  { id: 'Helvetica', label: 'Helvetica' },
  { id: 'Georgia', label: 'Georgia' },
  { id: 'Times New Roman', label: 'Times New Roman' },
  { id: 'Impact', label: 'Impact' },
  { id: 'Courier New', label: 'Courier New' },
  { id: 'Trebuchet MS', label: 'Trebuchet MS' },
  { id: 'Verdana', label: 'Verdana' },
];

const PRESET_COLORS = [
  '#FFFFFF',
  '#000000',
  '#7C3AED',
  '#D84697',
  '#F27E4B',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#64748B',
];

const SHAPE_TYPES = [
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'rounded-rect', label: 'Rounded Rect', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'ellipse', label: 'Ellipse', icon: Circle },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'arrow', label: 'Arrow', icon: ArrowRight },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'star', label: 'Star', icon: Star },
];

export function EditImagePage({ embedded, embeddedOnly }) {
  useDocumentTitle('Smart Image Editor — Complete Online Photo & Image Suite');

  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['resize', 'crop', 'rotate', 'canvas', 'text', 'erase', 'shapes'];
  const initialTab = searchParams.get('tab') || 'resize';
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(initialTab) ? initialTab : 'resize'
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidePanelTab('properties');
    setSearchParams({ tab });
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
  const fileInputRef = useRef(null);

  // Active Canvas from History
  const activeCanvas = history[historyIndex]?.canvas || null;
  const currentWidth = history[historyIndex]?.width || 0;
  const currentHeight = history[historyIndex]?.height || 0;

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

    // Reset crop box
    setCropBox({
      x: 0,
      y: 0,
      width: activeCanvas.width,
      height: activeCanvas.height,
    });

    // Sync layers from history snapshot
    const entryLayers = history[historyIndex]?.layers;
    if (entryLayers) {
      setLayers(entryLayers.map((l) => ({ ...l })));
    }
  }, [activeCanvas, history, historyIndex]);

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

      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, entry];
      });
      setHistoryIndex((prev) => prev + 1);
      setError('');
    },
    [activeCanvas, historyIndex]
  );

  const handleUpdateLayer = useCallback(
    (id, updates, commitHistory = false) => {
      setLayers((prev) => {
        const next = prev.map((l) => (l.id === id ? { ...l, ...updates } : l));
        layersRef.current = next;
        return next;
      });
      if (commitHistory) {
        pushHistory(null, layersRef.current, 'Update Layer');
      }
    },
    [pushHistory]
  );

  const handleDeleteLayer = useCallback(
    (id) => {
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
      setZoom(1);
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
  }, []);

  // Consume staged file if bridged from another tool
  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      handleLoadFile(stagedFile);
    }
  }, [handleLoadFile]);

  // Keyboard Shortcuts: Undo, Redo, Delete, Spacebar Pan
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in input or textarea
      const tag = document.activeElement?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.code === 'Space' && !isInput && !isSpacePressedRef.current) {
        isSpacePressedRef.current = true;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          if (historyIndex < history.length - 1) setHistoryIndex((p) => p + 1);
        } else {
          // Undo
          if (historyIndex > 0) setHistoryIndex((p) => p - 1);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (historyIndex < history.length - 1) setHistoryIndex((p) => p + 1);
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && selectedLayerId) {
        e.preventDefault();
        handleDeleteLayer(selectedLayerId);
      }

      if (e.key === 'Escape') {
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
  }, [historyIndex, history.length, selectedLayerId, handleDeleteLayer]);

  // ---------------------------------------------------------------------------
  // HISTORY ACTIONS: UNDO, REDO, RESET
  // ---------------------------------------------------------------------------
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canReset = historyIndex > 0 || layers.length > 0;

  const handleUndo = () => {
    if (canUndo) setHistoryIndex((prev) => prev - 1);
  };

  const handleRedo = () => {
    if (canRedo) setHistoryIndex((prev) => prev + 1);
  };

  const handleResetToOriginal = () => {
    if (canReset && history.length > 0) {
      setHistoryIndex(0);
      setLayers([]);
      setSelectedLayerId(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotateAngle(0);
      setFlipH(false);
      setFlipV(false);
    }
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
        const scaleX = targetW / currentWidth;
        const scaleY = targetH / currentHeight;
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
    const val = e.target.value;
    setResizeWidth(val);
    const num = parseInt(val, 10);
    if (lockAspectRatio && currentWidth > 0 && currentHeight > 0 && !isNaN(num) && num > 0) {
      const ratio = currentWidth / currentHeight;
      setResizeHeight(Math.max(1, Math.round(num / ratio)));
    }
  };

  const handleResizeHeightChange = (e) => {
    const val = e.target.value;
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
        pushHistory(cropCanvas, shiftedLayers, `Crop (${cropW}×${cropH})`);
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
    if (!activeCanvas) return;
    setCropBox({
      x: 0,
      y: 0,
      width: activeCanvas.width,
      height: activeCanvas.height,
    });
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

    const defaultFontSize = Math.max(24, Math.round(currentWidth / 24));
    const newText = {
      id: 'text_' + Date.now(),
      name: 'Text – Heading',
      type: 'text',
      text: 'Add your text here',
      x: Math.max(20, Math.round(currentWidth / 4)),
      y: Math.max(20, Math.round(currentHeight / 3)),
      width: Math.min(currentWidth - 40, Math.round(currentWidth * 0.5)),
      height: Math.max(50, Math.round(defaultFontSize * 1.5)),
      fontSize: defaultFontSize,
      fontFamily: 'Instrument Sans',
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      align: 'center',
      bgColor: 'transparent',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.6)',
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
    pushHistory(null, nextLayers, 'Add Text');
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
      fillColor: shapeType === 'line' ? 'transparent' : '#7C3AED',
      strokeColor: '#FFFFFF',
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
  // INTERACTIVE OBJECT (TEXT & SHAPE) DRAG, RESIZE & ROTATE (Mouse + Touch)
  // ---------------------------------------------------------------------------
  const handleLayerPointerDown = (e, layerId, action = 'move') => {
    e.stopPropagation();
    if (activeTab === 'erase') return;

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
      } else if (action === 'resize-se') {
        const newW = Math.max(20, Math.round(startLayer.width + dx));
        const newH = Math.max(20, Math.round(startLayer.height + dy));
        if (layer.type === 'text') {
          const fontScale = newW / (startLayer.width || 1);
          handleUpdateLayer(
            layerId,
            {
              width: newW,
              height: newH,
              fontSize: Math.max(8, Math.min(240, Math.round((startLayer.fontSize || 24) * fontScale))),
            },
            false
          );
        } else {
          handleUpdateLayer(layerId, { width: newW, height: newH }, false);
        }
      } else if (action === 'resize-ne') {
        const newW = Math.max(20, Math.round(startLayer.width + dx));
        const newH = Math.max(20, Math.round(startLayer.height - dy));
        const newY = Math.round(startLayer.y + dy);
        if (layer.type === 'text') {
          const fontScale = newW / (startLayer.width || 1);
          handleUpdateLayer(
            layerId,
            {
              width: newW,
              height: newH,
              y: newY,
              fontSize: Math.max(8, Math.min(240, Math.round((startLayer.fontSize || 24) * fontScale))),
            },
            false
          );
        } else {
          handleUpdateLayer(layerId, { width: newW, height: newH, y: newY }, false);
        }
      } else if (action === 'resize-sw') {
        const newW = Math.max(20, Math.round(startLayer.width - dx));
        const newH = Math.max(20, Math.round(startLayer.height + dy));
        const newX = Math.round(startLayer.x + dx);
        if (layer.type === 'text') {
          const fontScale = newW / (startLayer.width || 1);
          handleUpdateLayer(
            layerId,
            {
              width: newW,
              height: newH,
              x: newX,
              fontSize: Math.max(8, Math.min(240, Math.round((startLayer.fontSize || 24) * fontScale))),
            },
            false
          );
        } else {
          handleUpdateLayer(layerId, { width: newW, height: newH, x: newX }, false);
        }
      } else if (action === 'resize-nw') {
        const newW = Math.max(20, Math.round(startLayer.width - dx));
        const newH = Math.max(20, Math.round(startLayer.height - dy));
        const newX = Math.round(startLayer.x + dx);
        const newY = Math.round(startLayer.y + dy);
        if (layer.type === 'text') {
          const fontScale = newW / (startLayer.width || 1);
          handleUpdateLayer(
            layerId,
            {
              width: newW,
              height: newH,
              x: newX,
              y: newY,
              fontSize: Math.max(8, Math.min(240, Math.round((startLayer.fontSize || 24) * fontScale))),
            },
            false
          );
        } else {
          handleUpdateLayer(layerId, { width: newW, height: newH, x: newX, y: newY }, false);
        }
      } else if (action === 'rotate') {
        if (!stageRef.current) return;
        const rect = stageRef.current.getBoundingClientRect();
        const centerScreenX = rect.left + (startLayer.x + (startLayer.width || 50) / 2) * effZoom;
        const centerScreenY = rect.top + (startLayer.y + (startLayer.height || 20) / 2) * effZoom;
        const angleRad = Math.atan2(curY - centerScreenY, curX - centerScreenX);
        const deg = Math.round((angleRad * 180) / Math.PI + 90);
        handleUpdateLayer(layerId, { rotation: deg }, false);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

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
  // DOWNLOAD / EXPORT ENGINE (Flattens raster base + text & shapes)
  // ---------------------------------------------------------------------------
  const handleDownload = () => {
    if (!activeCanvas || !originalFile) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = currentWidth;
    exportCanvas.height = currentHeight;
    const ctx = exportCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw base raster image
    ctx.drawImage(activeCanvas, 0, 0);

    // 2. Draw Vector Layers (Shapes & Text) in order (bottom to top)
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
      }

      ctx.restore();
    });

    const originalType = originalFile.type || 'image/png';
    const isTransparent = canvasBgOption === 'transparent';
    const exportType =
      isTransparent || originalType === 'image/svg+xml' ? 'image/png' : originalType;

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Failed to generate export file.');
          return;
        }
        const baseName = originalFile.name.replace(/\.[^.]+$/, '') || 'edited-image';
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

    const lines = (text || '').split('\n');
    const lineH = fontSize * (lineHeight || 1.2);

    let textAnchorX = x;
    if (align === 'center') textAnchorX = x + w / 2;
    else if (align === 'right') textAnchorX = x + w;

    lines.forEach((line, idx) => {
      const lineY = y + idx * lineH;
      if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(line, textAnchorX, lineY);
      }
      ctx.fillStyle = color || '#FFFFFF';
      ctx.fillText(line, textAnchorX, lineY);
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
  const handleFitScreen = () => {
    if (!viewportRef.current || !currentWidth || !currentHeight) return;
    const vpW = viewportRef.current.clientWidth - 64;
    const vpH = viewportRef.current.clientHeight - 64;
    const scale = Math.min(vpW / currentWidth, vpH / currentHeight, 1);
    setZoom(+scale.toFixed(2));
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDownViewport = (e) => {
    if (isSpacePressedRef.current || e.button === 1 || e.shiftKey || e.altKey) {
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

  const hasImage = Boolean(activeCanvas && originalFile);

  return (
    <ToolPageLayout
      badge="Smart Image Editor · All-in-One Studio"
      title="Smart Image Editor Online"
      subtitle="Complete in-browser image editor: Resize, Crop, Rotate, Canvas, Add Text, Erase & Shapes. 100% private."
      content={<EditImageContent />}
      contentFullWidth
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      showHero={false}
    >
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

        {!hasImage ? (
          /* =================================================================
             COMPACT INTRODUCTORY HERO + UPLOAD BOX
             ================================================================= */
          <div className={styles.compactUploadHero}>
            <div
              className={`${styles.compactUploadBox} ${isDragOver ? styles.compactUploadBoxDrag : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <h1 className={styles.compactHeading}>
                Smart Image Editor – <span className={styles.titleGradient}>Edit Images Your Way</span>
              </h1>
              <p className={styles.compactDesc}>
                Resize, crop, rotate, add text and erase image areas — all in one place.
              </p>

              {/* Compact feature strip pills */}
              <div className={styles.compactFeatureStrip}>
                <span className={styles.compactPill}>
                  <Sliders size={12} className={styles.pillIcon} /> Resize
                </span>
                <span className={styles.compactPill}>
                  <RotateCw size={12} className={styles.pillIcon} /> Crop & Rotate
                </span>
                <span className={styles.compactPill}>
                  <Type size={12} className={styles.pillIcon} /> Add Text
                </span>
                <span className={styles.compactPill}>
                  <Eraser size={12} className={styles.pillIcon} /> Erase Objects
                </span>
                <span className={styles.compactPill}>
                  <ShapesIcon size={12} className={styles.pillIcon} /> Create Shapes
                </span>
              </div>

              {/* Upload Actions inside box */}
              <div className={styles.compactActionRow}>
                <button
                  type="button"
                  className={styles.compactUploadBtn}
                  onClick={handleTriggerUpload}
                >
                  <Upload size={18} />
                  <span>Upload Image</span>
                </button>
                <span className={styles.compactDropText}>or drag and drop image here</span>
              </div>

              <p className={styles.compactFormats}>
                Supports JPG, PNG, WebP, SVG, GIF, AVIF up to 50 MB · 100% Client-Side Private
              </p>

              {error && (
                <div className={styles.errorAlert} role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* =================================================================
             MAIN PHOTOSHOP-INSPIRED WORKSPACE
             ================================================================= */
          <div className={styles.workspaceContainer}>
            {/* -------------------------------------------------------------
                TOP TOOLBAR: 7 Main Tools Tabs + Actions + Download
                ------------------------------------------------------------- */}
            <header className={styles.topToolbar}>
              <div className={styles.toolbarLeft}>
                <div className={styles.editorBrand}>
                  <Sliders size={16} className={styles.brandIcon} />
                  <span className={styles.editorHeading}>Smart Image Editor</span>
                </div>

                {/* 7 Main Tool Tabs */}
                <nav className={styles.tabsNav} aria-label="Editor Modes">
                  <button
                    type="button"
                    onClick={() => handleTabChange('resize')}
                    className={`${styles.tabButton} ${activeTab === 'resize' ? styles.tabButtonActive : ''}`}
                    title="Resize Dimensions"
                  >
                    <Sliders size={15} />
                    <span>Resize</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('crop')}
                    className={`${styles.tabButton} ${activeTab === 'crop' ? styles.tabButtonActive : ''}`}
                    title="Crop Composition"
                  >
                    <CropIcon size={15} />
                    <span>Crop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('rotate')}
                    className={`${styles.tabButton} ${activeTab === 'rotate' ? styles.tabButtonActive : ''}`}
                    title="Rotate & Flip"
                  >
                    <RotateCw size={15} />
                    <span>Rotate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('canvas')}
                    className={`${styles.tabButton} ${activeTab === 'canvas' ? styles.tabButtonActive : ''}`}
                    title="Canvas Boundary"
                  >
                    <Layout size={15} />
                    <span>Canvas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('text')}
                    className={`${styles.tabButton} ${activeTab === 'text' ? styles.tabButtonActive : ''}`}
                    title="Add Text Layers"
                  >
                    <Type size={15} />
                    <span>Add Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('erase')}
                    className={`${styles.tabButton} ${activeTab === 'erase' ? styles.tabButtonActive : ''}`}
                    title="Erase Brush"
                  >
                    <Eraser size={15} />
                    <span>Erase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('shapes')}
                    className={`${styles.tabButton} ${activeTab === 'shapes' ? styles.tabButtonActive : ''}`}
                    title="Shapes & Elements"
                  >
                    <ShapesIcon size={15} />
                    <span>Shapes</span>
                  </button>
                </nav>
              </div>

              {/* History & Action Buttons */}
              <div className={styles.toolbarRight}>
                <button
                  type="button"
                  onClick={handleTriggerUpload}
                  className={styles.toolBtn}
                  title="Upload another image"
                >
                  <Upload size={14} />
                  <span>Change Image</span>
                </button>

                <div className={styles.divider} />

                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={styles.iconBtn}
                  title="Undo (Ctrl+Z)"
                  aria-label="Undo"
                >
                  <Undo2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={styles.iconBtn}
                  title="Redo (Ctrl+Y)"
                  aria-label="Redo"
                >
                  <Redo2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  disabled={!canReset}
                  className={styles.toolBtn}
                  title="Reset to Original Image"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>

                <div className={styles.divider} />

                <button
                  type="button"
                  onClick={handleDownload}
                  className={styles.downloadBtn}
                  title="Download Edited Image"
                >
                  <Download size={15} />
                  <span>Download Image</span>
                </button>
              </div>
            </header>

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
                MAIN BODY: Central Dark Viewport + Right Contextual Panel
                ------------------------------------------------------------- */}
            <div className={styles.editorMainArea}>
              {/* Central Dark Viewport */}
              <div
                ref={viewportRef}
                className={`${styles.canvasViewport} ${activeTab === 'erase' ? styles.viewportEraser : ''
                  }`}
                onMouseDown={handleMouseDownViewport}
                onMouseMove={handleMouseMoveViewport}
                onMouseUp={handleMouseUpViewport}
              >
                <div
                  ref={stageRef}
                  className={styles.imageStage}
                  style={{
                    width: currentWidth,
                    height: currentHeight,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                >
                  {/* The Active Base Image */}
                  <img
                    src={currentDataUrl}
                    alt="Active Canvas"
                    className={styles.stageImage}
                    draggable={false}
                    style={{
                      transform:
                        activeTab === 'rotate'
                          ? `rotate(${rotateAngle}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`
                          : 'none',
                      transition: activeTab === 'rotate' ? 'transform 0.1s ease' : 'none',
                    }}
                  />

                  {/* =======================================================
                      OVERLAY: Vector Layers (Shapes & Text)
                      ======================================================= */}
                  {layers.map((layer) => {
                    if (layer.hidden) return null;
                    const isSelected = layer.id === selectedLayerId;

                    return (
                      <div
                        key={layer.id}
                        className={`${styles.stageLayerWrapper} ${isSelected ? styles.stageLayerSelected : ''} ${layer.locked ? styles.stageLayerLocked : ''}`}
                        style={{
                          left: layer.x,
                          top: layer.y,
                          width: layer.width,
                          height: layer.height,
                          transform: layer.rotation ? `rotate(${layer.rotation}deg)` : 'none',
                          opacity: (layer.opacity || 100) / 100,
                          cursor: activeTab === 'erase' ? 'none' : layer.locked ? 'default' : 'move',
                          pointerEvents: activeTab === 'erase' ? 'none' : 'auto',
                        }}
                        onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'move')}
                        onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'move')}
                      >
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
                          <div
                            className={styles.stageTextContent}
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
                              letterSpacing: `${layer.letterSpacing || 0}px`,
                              lineHeight: layer.lineHeight || 1.2,
                              whiteSpace: 'pre-wrap',
                              userSelect: 'none',
                            }}
                          >
                            {layer.text}
                          </div>
                        )}

                        {/* Interactive Selection Frame & Handles */}
                        {isSelected && !layer.locked && (
                          <>
                            {/* 4 Corner Handles for Smooth Grabbing */}
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleNW}`}
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-nw')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-nw')}
                              title="Resize Top-Left"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleNE}`}
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-ne')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-ne')}
                              title="Resize Top-Right"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleSW}`}
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-sw')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-sw')}
                              title="Resize Bottom-Left"
                            />
                            <div
                              className={`${styles.layerHandle} ${styles.layerHandleSE}`}
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'resize-se')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'resize-se')}
                              title="Resize Bottom-Right"
                            />

                            {/* Rotation Stalk Handle (Top) */}
                            <div
                              className={styles.layerRotateStalk}
                              onMouseDown={(e) => handleLayerPointerDown(e, layer.id, 'rotate')}
                              onTouchStart={(e) => handleLayerPointerDown(e, layer.id, 'rotate')}
                              title="Drag to rotate"
                            >
                              <div className={styles.layerRotateKnob} />
                            </div>

                            {/* Floating Quick Action Badge */}
                            <div className={styles.layerActionBadge}>
                              <button
                                type="button"
                                className={styles.layerBadgeBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateLayer(layer.id);
                                }}
                                title="Duplicate Layer"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                type="button"
                                className={styles.layerBadgeBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLockLayer(layer.id);
                                }}
                                title="Lock Layer"
                              >
                                <Lock size={12} />
                              </button>
                              <button
                                type="button"
                                className={styles.layerBadgeBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLayer(layer.id);
                                }}
                                title="Delete Layer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Interactive Crop Overlay (Activated in Crop Tab) */}
                  {activeTab === 'crop' && (
                    <div
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
                      <div className={styles.cropDimensionsBadge}>
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
                </div>

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

                {/* Floating Zoom Controls Bar */}
                <div className={styles.floatingZoomBar}>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className={styles.zoomBtn}
                    title="Zoom Out"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <span className={styles.zoomBadge}>{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className={styles.zoomBtn}
                    title="Zoom In"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleFitScreen}
                    className={styles.zoomTextBtn}
                    title="Fit to Screen"
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={handleZoom100}
                    className={styles.zoomTextBtn}
                    title="100% Actual Size"
                  >
                    100%
                  </button>
                </div>
              </div>

              {/* -----------------------------------------------------------
                  RIGHT CONTEXTUAL SETTINGS PANEL (Tab-specific)
                  ----------------------------------------------------------- */}
              <aside className={styles.contextualPanel}>
                {/* Side Panel Tabs: Properties vs Layers */}
                <div className={styles.sidePanelTabs}>
                  <button
                    type="button"
                    className={`${styles.sidePanelTabBtn} ${sidePanelTab === 'properties' ? styles.sidePanelTabActive : ''}`}
                    onClick={() => setSidePanelTab('properties')}
                  >
                    <Sliders size={14} />
                    <span>Properties</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.sidePanelTabBtn} ${sidePanelTab === 'layers' ? styles.sidePanelTabActive : ''}`}
                    onClick={() => setSidePanelTab('layers')}
                  >
                    <Layers size={14} />
                    <span>Layers</span>
                    <span className={styles.layersTabBadge}>{layers.length + 1}</span>
                  </button>
                </div>

                {sidePanelTab === 'layers' ? (
                  <div className={styles.panelContent}>
                    <div className={styles.panelHeaderRow}>
                      <div>
                        <h2 className={styles.panelTitle}>Layers</h2>
                        <p className={styles.panelDesc}>
                          Stacking order, visibility and locking.
                        </p>
                      </div>
                      <div className={styles.layersQuickAddGroup}>
                        <button
                          type="button"
                          className={styles.layersAddBtn}
                          onClick={() => {
                            handleAddTextLayer();
                            setSidePanelTab('properties');
                            setActiveTab('text');
                          }}
                          title="Add Text Layer"
                        >
                          <Type size={13} /> Text
                        </button>
                        <button
                          type="button"
                          className={styles.layersAddBtn}
                          onClick={() => {
                            handleAddShape('rect');
                            setSidePanelTab('properties');
                            setActiveTab('shapes');
                          }}
                          title="Add Shape Layer"
                        >
                          <Square size={13} /> Shape
                        </button>
                      </div>
                    </div>

                    <div
                      className={styles.layersList}
                      onDragOver={(e) => {
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {layers.length === 0 ? (
                        <div className={styles.emptyLayersState}>
                          <p>No overlay layers yet</p>
                          <span className={styles.emptyLayersHint}>
                            Add text or shapes from the top toolbar to create editable layers.
                          </span>
                        </div>
                      ) : (
                        [...layers]
                          .map((layer, index) => ({ layer, index }))
                          .reverse()
                          .map(({ layer, index }) => {
                            const isSelected = layer.id === selectedLayerId;
                            const isTop = index === layers.length - 1;
                            const isBottom = index === 0;

                            return (
                              <div
                                key={layer.id}
                                data-layer-index={index}
                                className={`${styles.layerRowItem} ${isSelected ? styles.layerRowSelected : ''} ${layer.hidden ? styles.layerRowHidden : ''} ${layer.locked ? styles.layerRowLocked : ''} ${dragOverLayerIndex === index ? styles.layerRowDragOver : ''}`}
                                draggable={!layer.locked}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  if (typeof window !== 'undefined') {
                                    window.__isInternalLayerDrag = true;
                                  }
                                  e.dataTransfer.effectAllowed = 'move';
                                  e.dataTransfer.setData('application/x-image-editor-layer', String(index));
                                  e.dataTransfer.setData('text/plain', String(index));
                                  setDraggedLayerIndex(index);
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation();
                                  if (typeof window !== 'undefined') {
                                    window.__isInternalLayerDrag = false;
                                  }
                                  setDraggedLayerIndex(null);
                                  setDragOverLayerIndex(null);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.dataTransfer.dropEffect = 'move';
                                  if (dragOverLayerIndex !== index) {
                                    setDragOverLayerIndex(index);
                                  }
                                }}
                                onDragEnter={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (dragOverLayerIndex !== index) {
                                    setDragOverLayerIndex(index);
                                  }
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (typeof window !== 'undefined') {
                                    window.__isInternalLayerDrag = false;
                                  }
                                  const rawIdx =
                                    e.dataTransfer.getData('application/x-image-editor-layer') ||
                                    e.dataTransfer.getData('text/plain');
                                  const srcIdx =
                                    rawIdx !== '' ? parseInt(rawIdx, 10) : draggedLayerIndex;
                                  if (srcIdx !== null && !isNaN(srcIdx) && srcIdx !== index) {
                                    handleReorderLayers(srcIdx, index);
                                  }
                                  setDraggedLayerIndex(null);
                                  setDragOverLayerIndex(null);
                                }}
                                onClick={() => setSelectedLayerId(layer.id)}
                              >
                                {/* Drag Grip Handle (Mouse HTML5 drag + Touch Drag Support) */}
                                <div
                                  className={styles.layerDragGrip}
                                  title="Drag to reorder layer"
                                  onTouchStart={(e) => {
                                    if (layer.locked) return;
                                    touchDragStartRef.current = {
                                      startIndex: index,
                                      startY: e.touches[0].clientY,
                                    };
                                    setDraggedLayerIndex(index);
                                  }}
                                  onTouchMove={(e) => {
                                    if (!touchDragStartRef.current) return;
                                    const touch = e.touches[0];
                                    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                                    const rowEl = targetEl?.closest('[data-layer-index]');
                                    if (rowEl) {
                                      const targetIdx = parseInt(rowEl.getAttribute('data-layer-index'), 10);
                                      if (!isNaN(targetIdx) && targetIdx !== dragOverLayerIndex) {
                                        setDragOverLayerIndex(targetIdx);
                                      }
                                    }
                                  }}
                                  onTouchEnd={() => {
                                    if (touchDragStartRef.current) {
                                      const srcIdx = touchDragStartRef.current.startIndex;
                                      if (dragOverLayerIndex !== null && dragOverLayerIndex !== srcIdx) {
                                        handleReorderLayers(srcIdx, dragOverLayerIndex);
                                      }
                                      touchDragStartRef.current = null;
                                      setDraggedLayerIndex(null);
                                      setDragOverLayerIndex(null);
                                    }
                                  }}
                                >
                                  <GripVertical size={14} />
                                </div>

                                {/* Layer Type Icon */}
                                <div className={styles.layerTypeIconWrap}>
                                  {layer.type === 'text' ? (
                                    <Type size={14} className={styles.layerTypeIcon} />
                                  ) : (
                                    <Square size={14} className={styles.layerTypeIcon} />
                                  )}
                                </div>

                                {/* Layer Title / Inline Rename */}
                                <div className={styles.layerNameCol}>
                                  {renamingLayerId === layer.id ? (
                                    <input
                                      type="text"
                                      value={renameValue}
                                      autoFocus
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter') {
                                          handleRenameLayer(layer.id, renameValue);
                                          setRenamingLayerId(null);
                                        } else if (e.key === 'Escape') {
                                          setRenamingLayerId(null);
                                        }
                                      }}
                                      onBlur={() => {
                                        handleRenameLayer(layer.id, renameValue);
                                        setRenamingLayerId(null);
                                      }}
                                      className={styles.layerRenameInput}
                                    />
                                  ) : (
                                    <span
                                      className={styles.layerNameText}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setRenamingLayerId(layer.id);
                                        setRenameValue(layer.name || (layer.type === 'text' ? 'Text' : 'Shape'));
                                      }}
                                      title="Double-click to rename"
                                    >
                                      {layer.name || (layer.type === 'text' ? (layer.text?.slice(0, 16) || 'Text') : 'Shape')}
                                    </span>
                                  )}
                                </div>

                                {/* Layer Actions: Move Up, Move Down, Hide, Lock, Duplicate, Delete */}
                                <div className={styles.layerActionsCol} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className={styles.layerMiniBtn}
                                    disabled={isTop}
                                    onClick={() => handleMoveLayer(layer.id, 'up')}
                                    title="Move layer up (higher in stack)"
                                  >
                                    <ChevronUp size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.layerMiniBtn}
                                    disabled={isBottom}
                                    onClick={() => handleMoveLayer(layer.id, 'down')}
                                    title="Move layer down (lower in stack)"
                                  >
                                    <ChevronDown size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.layerMiniBtn} ${layer.hidden ? styles.layerMiniBtnOff : ''}`}
                                    onClick={() => handleToggleHideLayer(layer.id)}
                                    title={layer.hidden ? 'Show layer' : 'Hide layer'}
                                  >
                                    {layer.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.layerMiniBtn} ${layer.locked ? styles.layerMiniBtnActive : ''}`}
                                    onClick={() => handleToggleLockLayer(layer.id)}
                                    title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                                  >
                                    {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.layerMiniBtn}
                                    onClick={() => handleDuplicateLayer(layer.id)}
                                    title="Duplicate layer"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.layerMiniBtn} ${styles.layerMiniBtnDanger}`}
                                    onClick={() => handleDeleteLayer(layer.id)}
                                    title="Delete layer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                      )}

                      {/* Base Layer: Original Image (Always at bottom) */}
                      <div className={styles.baseLayerRow}>
                        <div className={styles.baseLayerIconWrap}>
                          <ImageIcon size={14} />
                        </div>
                        <div className={styles.baseLayerInfo}>
                          <strong className={styles.baseLayerTitle}>Original Image</strong>
                          <span className={styles.baseLayerSub}>
                            {currentWidth} × {currentHeight} px · Base Layer
                          </span>
                        </div>
                        <div className={styles.baseLayerLockedBadge} title="Base image layer is locked at the bottom">
                          <Lock size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* =========================================================
                    TAB 1: RESIZE SETTINGS
                    ========================================================= */}
                    {activeTab === 'resize' && (
                      <div className={styles.panelContent}>
                        <h2 className={styles.panelTitle}>Resize Dimensions</h2>
                        <p className={styles.panelDesc}>
                          Scale actual pixel dimensions while maintaining sharpness.
                        </p>

                        <div className={styles.controlsBlock}>
                          <div className={styles.dimensionInputsRow}>
                            <div className={styles.inputField}>
                              <label htmlFor="edit-resize-w" className={styles.fieldLabel}>
                                Width (px)
                              </label>
                              <div className={styles.inputWrapper}>
                                <input
                                  id="edit-resize-w"
                                  type="number"
                                  min="1"
                                  max={MAX_CANVAS_DIMENSION}
                                  value={resizeWidth}
                                  onChange={handleResizeWidthChange}
                                  className={styles.numInput}
                                />
                                <span className={styles.unitTag}>px</span>
                              </div>
                            </div>

                            <div className={styles.lockButtonWrap}>
                              <button
                                type="button"
                                onClick={toggleResizeLock}
                                className={lockAspectRatio ? styles.lockActive : styles.lockInactive}
                                title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                              >
                                {lockAspectRatio ? <Lock size={16} /> : <Unlock size={16} />}
                              </button>
                            </div>

                            <div className={styles.inputField}>
                              <label htmlFor="edit-resize-h" className={styles.fieldLabel}>
                                Height (px)
                              </label>
                              <div className={styles.inputWrapper}>
                                <input
                                  id="edit-resize-h"
                                  type="number"
                                  min="1"
                                  max={MAX_CANVAS_DIMENSION}
                                  value={resizeHeight}
                                  onChange={handleResizeHeightChange}
                                  className={styles.numInput}
                                />
                                <span className={styles.unitTag}>px</span>
                              </div>
                            </div>
                          </div>

                          <div className={styles.presetButtonsRow}>
                            <span className={styles.presetLabel}>Scale:</span>
                            {[25, 50, 75, 100, 200].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => handleScalePreset(pct)}
                                className={styles.scalePresetBtn}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.statsBox}>
                          <div className={styles.statRow}>
                            <span className={styles.statKey}>Original Size:</span>
                            <span className={styles.statVal}>
                              {origWidth} × {origHeight} px
                            </span>
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statKey}>New Dimensions:</span>
                            <span className={styles.statValHighlight}>
                              {resizeWidth || 0} × {resizeHeight || 0} px
                            </span>
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statKey}>Estimated File:</span>
                            <span className={styles.statVal}>
                              ~{formatFileSize(estimatedCurrentBytes)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyResize}
                          disabled={isProcessing || !resizeWidth || !resizeHeight}
                          className={styles.applyBtn}
                        >
                          <Check size={16} />
                          <span>Apply Resize</span>
                        </button>
                      </div>
                    )}

                    {/* =========================================================
                    TAB 2: CROP SETTINGS
                    ========================================================= */}
                    {activeTab === 'crop' && (
                      <div className={styles.panelContent}>
                        <h2 className={styles.panelTitle}>Crop Composition</h2>
                        <p className={styles.panelDesc}>
                          Drag the box or corner handles to re-frame your image.
                        </p>

                        <div className={styles.presetGroup}>
                          <label className={styles.fieldLabel}>Aspect Ratio Presets</label>
                          <div className={styles.presetPillsGrid}>
                            {CROP_PRESETS.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelectCropPreset(p.id)}
                                className={`${styles.presetPill} ${cropPreset === p.id ? styles.presetPillActive : ''}`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>

                          {cropPreset === 'custom' && (
                            <div className={styles.customRatioRow}>
                              <input
                                type="number"
                                min="1"
                                value={customRatioW}
                                onChange={(e) => {
                                  setCustomRatioW(e.target.value);
                                  handleSelectCropPreset('custom');
                                }}
                                className={styles.ratioInput}
                                placeholder="W"
                              />
                              <span>:</span>
                              <input
                                type="number"
                                min="1"
                                value={customRatioH}
                                onChange={(e) => {
                                  setCustomRatioH(e.target.value);
                                  handleSelectCropPreset('custom');
                                }}
                                className={styles.ratioInput}
                                placeholder="H"
                              />
                            </div>
                          )}
                        </div>

                        <div className={styles.statsBox}>
                          <div className={styles.statRow}>
                            <span className={styles.statKey}>Crop Width:</span>
                            <span className={styles.statValHighlight}>
                              {Math.round(cropBox.width)} px
                            </span>
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statKey}>Crop Height:</span>
                            <span className={styles.statValHighlight}>
                              {Math.round(cropBox.height)} px
                            </span>
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statKey}>Position (X, Y):</span>
                            <span className={styles.statVal}>
                              {Math.round(cropBox.x)}, {Math.round(cropBox.y)}
                            </span>
                          </div>
                        </div>

                        <div className={styles.buttonStack}>
                          <button
                            type="button"
                            onClick={handleApplyCrop}
                            disabled={isProcessing}
                            className={styles.applyBtn}
                          >
                            <Check size={16} />
                            <span>Apply Crop</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelCrop}
                            className={styles.secondaryBtn}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* =========================================================
                    TAB 3: ROTATE SETTINGS
                    ========================================================= */}
                    {activeTab === 'rotate' && (
                      <div className={styles.panelContent}>
                        <h2 className={styles.panelTitle}>Rotate & Flip</h2>
                        <p className={styles.panelDesc}>
                          Rotate by exact degrees, snap 90° intervals, or mirror horizontally and vertically.
                        </p>

                        {/* 90-degree Snap Buttons */}
                        <div className={styles.rotateActionsGroup}>
                          <label className={styles.fieldLabel}>Quick Rotations</label>
                          <div className={styles.rotateBtnGrid}>
                            <button
                              type="button"
                              onClick={handleRotateLeft90}
                              className={styles.quickToolBtn}
                              title="Rotate Left 90°"
                            >
                              <RotateCcw size={16} />
                              <span>-90° Left</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRotateRight90}
                              className={styles.quickToolBtn}
                              title="Rotate Right 90°"
                            >
                              <RotateCw size={16} />
                              <span>+90° Right</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRotate180}
                              className={styles.quickToolBtn}
                              title="Rotate 180°"
                            >
                              <RotateCw size={16} />
                              <span>180°</span>
                            </button>
                          </div>
                        </div>

                        {/* Flip Controls */}
                        <div className={styles.rotateActionsGroup}>
                          <label className={styles.fieldLabel}>Flip / Mirror</label>
                          <div className={styles.flipBtnRow}>
                            <button
                              type="button"
                              onClick={() => setFlipH((prev) => !prev)}
                              className={`${styles.flipBtn} ${flipH ? styles.flipBtnActive : ''}`}
                            >
                              <FlipHorizontal size={16} />
                              <span>Flip Horizontal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFlipV((prev) => !prev)}
                              className={`${styles.flipBtn} ${flipV ? styles.flipBtnActive : ''}`}
                            >
                              <FlipVertical size={16} />
                              <span>Flip Vertical</span>
                            </button>
                          </div>
                        </div>

                        {/* Custom Rotation Angle Slider */}
                        <div className={styles.sliderGroup}>
                          <div className={styles.sliderHeaderRow}>
                            <label className={styles.fieldLabel}>Custom Angle</label>
                            <div className={styles.angleInputWrap}>
                              <input
                                type="number"
                                min="-180"
                                max="180"
                                value={rotateAngle}
                                onChange={(e) =>
                                  setRotateAngle(Math.min(180, Math.max(-180, parseInt(e.target.value, 10) || 0)))
                                }
                                className={styles.angleNumInput}
                              />
                              <span className={styles.unitTag}>°</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={rotateAngle}
                            onChange={(e) => setRotateAngle(parseInt(e.target.value, 10))}
                            className={styles.rangeSlider}
                          />
                          <div className={styles.rangeLabelsRow}>
                            <span>-180°</span>
                            <span onClick={() => setRotateAngle(0)} className={styles.rangeCenterTick}>
                              0°
                            </span>
                            <span>+180°</span>
                          </div>
                        </div>

                        {/* Rotation Output Dimensions Stats */}
                        <div className={styles.statsBox}>
                          <div className={styles.statRow}>
                            <span className={styles.statKey}>Current Angle:</span>
                            <span className={styles.statValHighlight}>{rotateAngle}°</span>
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statKey}>New Bounding Box:</span>
                            <span className={styles.statVal}>
                              {rotatedDimensions.width} × {rotatedDimensions.height} px
                            </span>
                          </div>
                          <div className={styles.statRow}>
                            <span className={styles.statKey}>Background:</span>
                            <span className={styles.statVal}>Transparent (No Clipping)</span>
                          </div>
                        </div>

                        <div className={styles.buttonStack}>
                          <button
                            type="button"
                            onClick={handleApplyRotate}
                            disabled={isProcessing || (rotateAngle === 0 && !flipH && !flipV)}
                            className={styles.applyBtn}
                          >
                            <Check size={16} />
                            <span>Apply Rotation</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleResetRotation}
                            className={styles.secondaryBtn}
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    )}

                    {/* =========================================================
                    TAB 4: CANVAS SETTINGS
                    ========================================================= */}
                    {activeTab === 'canvas' && (
                      <div className={styles.panelContent}>
                        <h2 className={styles.panelTitle}>Canvas Size</h2>
                        <p className={styles.panelDesc}>
                          Expand or trim workspace area without stretching the subject.
                        </p>

                        <div className={styles.controlsBlock}>
                          <div className={styles.dimensionInputsRow}>
                            <div className={styles.inputField}>
                              <label htmlFor="edit-canvas-w" className={styles.fieldLabel}>
                                Canvas Width
                              </label>
                              <div className={styles.inputWrapper}>
                                <input
                                  id="edit-canvas-w"
                                  type="number"
                                  min="1"
                                  max={MAX_CANVAS_DIMENSION}
                                  value={canvasWidth}
                                  onChange={(e) => setCanvasWidth(e.target.value)}
                                  className={styles.numInput}
                                />
                                <span className={styles.unitTag}>px</span>
                              </div>
                            </div>

                            <div className={styles.inputField}>
                              <label htmlFor="edit-canvas-h" className={styles.fieldLabel}>
                                Canvas Height
                              </label>
                              <div className={styles.inputWrapper}>
                                <input
                                  id="edit-canvas-h"
                                  type="number"
                                  min="1"
                                  max={MAX_CANVAS_DIMENSION}
                                  value={canvasHeight}
                                  onChange={(e) => setCanvasHeight(e.target.value)}
                                  className={styles.numInput}
                                />
                                <span className={styles.unitTag}>px</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={styles.anchorSection}>
                          <label className={styles.fieldLabel}>Anchor Position</label>
                          <p className={styles.fieldSubtext}>
                            Determines where the existing image stays when canvas size changes.
                          </p>
                          <div className={styles.anchorGrid}>
                            {ANCHORS.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => setCanvasAnchor(a.id)}
                                className={`${styles.anchorBtn} ${canvasAnchor === a.id ? styles.anchorBtnActive : ''}`}
                                title={a.label}
                              >
                                <span className={styles.anchorIcon}>
                                  {a.id === 'tl' && '↖'}
                                  {a.id === 'tc' && '↑'}
                                  {a.id === 'tr' && '↗'}
                                  {a.id === 'ml' && '←'}
                                  {a.id === 'mc' && '•'}
                                  {a.id === 'mr' && '→'}
                                  {a.id === 'bl' && '↙'}
                                  {a.id === 'bc' && '↓'}
                                  {a.id === 'br' && '↘'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.bgSection}>
                          <label className={styles.fieldLabel}>Canvas Background</label>
                          <div className={styles.bgOptionsRow}>
                            {CANVAS_BG_OPTIONS.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setCanvasBgOption(opt.id)}
                                className={`${styles.bgOptionBtn} ${canvasBgOption === opt.id ? styles.bgOptionActive : ''}`}
                              >
                                {opt.id === 'transparent' ? (
                                  <span className={styles.checkerThumb} />
                                ) : opt.id === 'custom' ? (
                                  <span
                                    className={styles.colorThumb}
                                    style={{ backgroundColor: canvasCustomColor }}
                                  />
                                ) : (
                                  <span
                                    className={styles.colorThumb}
                                    style={{ backgroundColor: opt.id }}
                                  />
                                )}
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </div>

                          {canvasBgOption === 'custom' && (
                            <div className={styles.colorPickerRow}>
                              <input
                                type="color"
                                value={canvasCustomColor}
                                onChange={(e) => setCanvasCustomColor(e.target.value)}
                                className={styles.colorInput}
                              />
                              <input
                                type="text"
                                value={canvasCustomColor}
                                onChange={(e) => setCanvasCustomColor(e.target.value)}
                                className={styles.hexInput}
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyCanvas}
                          disabled={isProcessing || !canvasWidth || !canvasHeight}
                          className={styles.applyBtn}
                        >
                          <Check size={16} />
                          <span>Apply Canvas</span>
                        </button>
                      </div>
                    )}

                    {/* =========================================================
                    TAB 5: ADD TEXT SETTINGS
                    ========================================================= */}
                    {activeTab === 'text' && (
                      <div className={styles.panelContent}>
                        <div className={styles.panelHeaderRow}>
                          <div>
                            <h2 className={styles.panelTitle}>Add Text</h2>
                            <p className={styles.panelDesc}>
                              Add multiple typographic layers with fonts, colors, stroke, and shadow.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddTextLayer}
                            className={styles.addLayerBtn}
                          >
                            <Plus size={15} />
                            <span>Add Text</span>
                          </button>
                        </div>

                        {/* Text Layers Selector */}
                        {layers.filter((l) => l.type === 'text').length > 0 && (
                          <div className={styles.layerSelectorWrap}>
                            <label className={styles.fieldLabel}>Text Layers</label>
                            <div className={styles.layersPillList}>
                              {layers
                                .filter((l) => l.type === 'text')
                                .map((tl, idx) => (
                                  <button
                                    key={tl.id}
                                    type="button"
                                    onClick={() => setSelectedLayerId(tl.id)}
                                    className={`${styles.layerPill} ${tl.id === selectedLayerId ? styles.layerPillActive : ''}`}
                                  >
                                    <span>{tl.text.slice(0, 14) || `Text ${idx + 1}`}</span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {selectedLayer && selectedLayer.type === 'text' ? (
                          <div className={styles.layerEditorBlock}>
                            {/* Text Content */}
                            <div className={styles.inputField}>
                              <label className={styles.fieldLabel}>Text Content</label>
                              <textarea
                                rows={3}
                                value={selectedLayer.text}
                                onChange={(e) =>
                                  handleUpdateLayer(selectedLayer.id, { text: e.target.value })
                                }
                                className={styles.textAreaInput}
                                placeholder="Type text here..."
                              />
                            </div>

                            {/* Font Family */}
                            <div className={styles.inputField}>
                              <label className={styles.fieldLabel}>Font Family</label>
                              <select
                                value={selectedLayer.fontFamily}
                                onChange={(e) =>
                                  handleUpdateLayer(selectedLayer.id, { fontFamily: e.target.value }, true)
                                }
                                className={styles.selectInput}
                              >
                                {FONT_FAMILIES.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Font Size & Weight / Style */}
                            <div className={styles.twoColRow}>
                              <div className={styles.inputField}>
                                <label className={styles.fieldLabel}>Size (px)</label>
                                <FontSizeInput
                                  value={selectedLayer.fontSize || 24}
                                  onChange={(newSize) => {
                                    handleUpdateLayer(selectedLayer.id, { fontSize: newSize }, false);
                                  }}
                                  onCommit={(finalSize) => {
                                    handleUpdateLayer(selectedLayer.id, { fontSize: finalSize }, true);
                                  }}
                                  className={styles.numInput}
                                />
                              </div>

                              <div className={styles.inputField}>
                                <label className={styles.fieldLabel}>Style & Align</label>
                                <div className={styles.formatBtnGroup}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateLayer(
                                        selectedLayer.id,
                                        {
                                          fontWeight:
                                            selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold',
                                        },
                                        true
                                      )
                                    }
                                    className={`${styles.formatIconBtn} ${selectedLayer.fontWeight === 'bold' ? styles.formatBtnActive : ''}`}
                                    title="Bold"
                                  >
                                    <Bold size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateLayer(
                                        selectedLayer.id,
                                        {
                                          fontStyle:
                                            selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic',
                                        },
                                        true
                                      )
                                    }
                                    className={`${styles.formatIconBtn} ${selectedLayer.fontStyle === 'italic' ? styles.formatBtnActive : ''}`}
                                    title="Italic"
                                  >
                                    <Italic size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateLayer(selectedLayer.id, { align: 'left' }, true)
                                    }
                                    className={`${styles.formatIconBtn} ${selectedLayer.align === 'left' ? styles.formatBtnActive : ''}`}
                                    title="Align Left"
                                  >
                                    <AlignLeft size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateLayer(selectedLayer.id, { align: 'center' }, true)
                                    }
                                    className={`${styles.formatIconBtn} ${selectedLayer.align === 'center' ? styles.formatBtnActive : ''}`}
                                    title="Align Center"
                                  >
                                    <AlignCenter size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateLayer(selectedLayer.id, { align: 'right' }, true)
                                    }
                                    className={`${styles.formatIconBtn} ${selectedLayer.align === 'right' ? styles.formatBtnActive : ''}`}
                                    title="Align Right"
                                  >
                                    <AlignRight size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Text Color Picker & Presets */}
                            <div className={styles.inputField}>
                              <label className={styles.fieldLabel}>Text Color</label>
                              <div className={styles.colorPickerRow}>
                                <input
                                  type="color"
                                  value={selectedLayer.color}
                                  onChange={(e) =>
                                    handleUpdateLayer(selectedLayer.id, { color: e.target.value })
                                  }
                                  className={styles.colorInput}
                                />
                                <input
                                  type="text"
                                  value={selectedLayer.color}
                                  onChange={(e) =>
                                    handleUpdateLayer(selectedLayer.id, { color: e.target.value })
                                  }
                                  className={styles.hexInput}
                                />
                                <div className={styles.miniColorSwatches}>
                                  {PRESET_COLORS.slice(0, 5).map((col) => (
                                    <button
                                      key={col}
                                      type="button"
                                      onClick={() => handleUpdateLayer(selectedLayer.id, { color: col }, true)}
                                      className={styles.miniSwatchBtn}
                                      style={{ backgroundColor: col }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Stroke & Outline */}
                            <div className={styles.sliderGroup}>
                              <div className={styles.sliderHeaderRow}>
                                <label className={styles.fieldLabel}>Text Stroke / Outline</label>
                                <span className={styles.sliderValBadge}>
                                  {selectedLayer.strokeWidth} px
                                </span>
                              </div>
                              <div className={styles.strokeControlRow}>
                                <input
                                  type="color"
                                  value={selectedLayer.strokeColor || '#000000'}
                                  onChange={(e) =>
                                    handleUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })
                                  }
                                  className={styles.colorInputMini}
                                />
                                <input
                                  type="range"
                                  min="0"
                                  max="24"
                                  value={selectedLayer.strokeWidth || 0}
                                  onChange={(e) =>
                                    handleUpdateLayer(selectedLayer.id, {
                                      strokeWidth: parseInt(e.target.value, 10),
                                    })
                                  }
                                  className={styles.rangeSlider}
                                />
                              </div>
                            </div>

                            {/* Opacity */}
                            <div className={styles.sliderGroup}>
                              <div className={styles.sliderHeaderRow}>
                                <label className={styles.fieldLabel}>Opacity</label>
                                <span className={styles.sliderValBadge}>
                                  {selectedLayer.opacity}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="5"
                                max="100"
                                value={selectedLayer.opacity || 100}
                                onChange={(e) =>
                                  handleUpdateLayer(selectedLayer.id, {
                                    opacity: parseInt(e.target.value, 10),
                                  })
                                }
                                className={styles.rangeSlider}
                              />
                            </div>

                            {/* Action buttons */}
                            <div className={styles.layerActionFooter}>
                              <button
                                type="button"
                                onClick={() => handleDuplicateLayer(selectedLayer.id)}
                                className={styles.secondaryBtn}
                              >
                                <Copy size={14} /> Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLayer(selectedLayer.id)}
                                className={styles.deleteLayerBtn}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.emptyLayerPrompt}>
                            <Type size={32} className={styles.promptIcon} />
                            <p>Click "Add Text" or select a layer on the canvas to configure typography.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* =========================================================
                    TAB 6: ERASE SETTINGS (Real pixel eraser)
                    ========================================================= */}
                    {activeTab === 'erase' && (
                      <div className={styles.panelContent}>
                        <h2 className={styles.panelTitle}>Erase Tool</h2>
                        <p className={styles.panelDesc}>
                          Erase pixels directly on the image to reveal true transparency (checkerboard).
                        </p>

                        {/* Brush Size */}
                        <div className={styles.sliderGroup}>
                          <div className={styles.sliderHeaderRow}>
                            <label className={styles.fieldLabel}>Brush Size</label>
                            <span className={styles.sliderValBadge}>{brushSize} px</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="200"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                            className={styles.rangeSlider}
                          />
                        </div>

                        {/* Brush Hardness */}
                        <div className={styles.sliderGroup}>
                          <div className={styles.sliderHeaderRow}>
                            <label className={styles.fieldLabel}>Brush Hardness</label>
                            <span className={styles.sliderValBadge}>{brushHardness}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={brushHardness}
                            onChange={(e) => setBrushHardness(parseInt(e.target.value, 10))}
                            className={styles.rangeSlider}
                          />
                          <div className={styles.rangeLabelsRow}>
                            <span>Soft Feathered</span>
                            <span>Hard Edge</span>
                          </div>
                        </div>

                        {/* Brush Opacity */}
                        <div className={styles.sliderGroup}>
                          <div className={styles.sliderHeaderRow}>
                            <label className={styles.fieldLabel}>Brush Opacity</label>
                            <span className={styles.sliderValBadge}>{brushOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={brushOpacity}
                            onChange={(e) => setBrushOpacity(parseInt(e.target.value, 10))}
                            className={styles.rangeSlider}
                          />
                        </div>

                        {/* Info Card */}
                        <div className={styles.tipCard}>
                          <Info size={16} className={styles.tipIcon} />
                          <div className={styles.tipText}>
                            <strong>Live Transparent Erasure</strong>
                            <span>
                              Drag over any image area. Removed pixels reveal the transparency checkerboard.
                              Every stroke is undoable via Ctrl+Z.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleClearEraserChanges}
                          className={styles.secondaryBtn}
                        >
                          Clear Eraser Changes
                        </button>
                      </div>
                    )}

                    {/* =========================================================
                    TAB 7: SHAPES SETTINGS
                    ========================================================= */}
                    {activeTab === 'shapes' && (
                      <div className={styles.panelContent}>
                        <h2 className={styles.panelTitle}>Shapes & Elements</h2>
                        <p className={styles.panelDesc}>
                          Insert vector design shapes with customizable fill, border, and opacity.
                        </p>

                        {/* Shape Types Grid */}
                        <div className={styles.shapeTypesGrid}>
                          {SHAPE_TYPES.map((st) => {
                            const IconComponent = st.icon;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleAddShape(st.id)}
                                className={styles.shapeAddCard}
                                title={`Add ${st.label}`}
                              >
                                <IconComponent size={18} />
                                <span>{st.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Shapes Layer Selector */}
                        {layers.filter((l) => l.type === 'shape').length > 0 && (
                          <div className={styles.layerSelectorWrap}>
                            <label className={styles.fieldLabel}>Shape Layers</label>
                            <div className={styles.layersPillList}>
                              {layers
                                .filter((l) => l.type === 'shape')
                                .map((sl, idx) => (
                                  <button
                                    key={sl.id}
                                    type="button"
                                    onClick={() => setSelectedLayerId(sl.id)}
                                    className={`${styles.layerPill} ${sl.id === selectedLayerId ? styles.layerPillActive : ''}`}
                                  >
                                    <span>{`${sl.shapeType} #${idx + 1}`}</span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {selectedLayer && selectedLayer.type === 'shape' ? (
                          <div className={styles.layerEditorBlock}>
                            {/* Fill Color */}
                            <div className={styles.inputField}>
                              <div className={styles.labelWithAction}>
                                <label className={styles.fieldLabel}>Fill Color</label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateLayer(
                                      selectedLayer.id,
                                      {
                                        fillColor:
                                          selectedLayer.fillColor === 'transparent'
                                            ? '#7C3AED'
                                            : 'transparent',
                                      },
                                      true
                                    )
                                  }
                                  className={styles.miniToggleBtn}
                                >
                                  {selectedLayer.fillColor === 'transparent' ? 'Enable Fill' : 'No Fill'}
                                </button>
                              </div>
                              {selectedLayer.fillColor !== 'transparent' && (
                                <div className={styles.colorPickerRow}>
                                  <input
                                    type="color"
                                    value={selectedLayer.fillColor || '#7C3AED'}
                                    onChange={(e) =>
                                      handleUpdateLayer(selectedLayer.id, { fillColor: e.target.value })
                                    }
                                    className={styles.colorInput}
                                  />
                                  <input
                                    type="text"
                                    value={selectedLayer.fillColor || '#7C3AED'}
                                    onChange={(e) =>
                                      handleUpdateLayer(selectedLayer.id, { fillColor: e.target.value })
                                    }
                                    className={styles.hexInput}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Border / Stroke Color & Width */}
                            <div className={styles.inputField}>
                              <label className={styles.fieldLabel}>Border Color & Width</label>
                              <div className={styles.colorPickerRow}>
                                <input
                                  type="color"
                                  value={selectedLayer.strokeColor || '#FFFFFF'}
                                  onChange={(e) =>
                                    handleUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })
                                  }
                                  className={styles.colorInput}
                                />
                                <input
                                  type="text"
                                  value={selectedLayer.strokeColor || '#FFFFFF'}
                                  onChange={(e) =>
                                    handleUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })
                                  }
                                  className={styles.hexInput}
                                />
                              </div>
                            </div>

                            <div className={styles.sliderGroup}>
                              <div className={styles.sliderHeaderRow}>
                                <label className={styles.fieldLabel}>Border Thickness</label>
                                <span className={styles.sliderValBadge}>
                                  {selectedLayer.strokeWidth} px
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="32"
                                value={selectedLayer.strokeWidth || 0}
                                onChange={(e) =>
                                  handleUpdateLayer(selectedLayer.id, {
                                    strokeWidth: parseInt(e.target.value, 10),
                                  })
                                }
                                className={styles.rangeSlider}
                              />
                            </div>

                            {/* Border Radius (For Rounded Rect) */}
                            {selectedLayer.shapeType === 'rounded-rect' && (
                              <div className={styles.sliderGroup}>
                                <div className={styles.sliderHeaderRow}>
                                  <label className={styles.fieldLabel}>Corner Radius</label>
                                  <span className={styles.sliderValBadge}>
                                    {selectedLayer.borderRadius} px
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="80"
                                  value={selectedLayer.borderRadius || 16}
                                  onChange={(e) =>
                                    handleUpdateLayer(selectedLayer.id, {
                                      borderRadius: parseInt(e.target.value, 10),
                                    })
                                  }
                                  className={styles.rangeSlider}
                                />
                              </div>
                            )}

                            {/* Opacity */}
                            <div className={styles.sliderGroup}>
                              <div className={styles.sliderHeaderRow}>
                                <label className={styles.fieldLabel}>Opacity</label>
                                <span className={styles.sliderValBadge}>
                                  {selectedLayer.opacity}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="5"
                                max="100"
                                value={selectedLayer.opacity || 100}
                                onChange={(e) =>
                                  handleUpdateLayer(selectedLayer.id, {
                                    opacity: parseInt(e.target.value, 10),
                                  })
                                }
                                className={styles.rangeSlider}
                              />
                            </div>

                            {/* Action buttons */}
                            <div className={styles.layerActionFooter}>
                              <button
                                type="button"
                                onClick={() => handleDuplicateLayer(selectedLayer.id)}
                                className={styles.secondaryBtn}
                              >
                                <Copy size={14} /> Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLayer(selectedLayer.id)}
                                className={styles.deleteLayerBtn}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.emptyLayerPrompt}>
                            <ShapesIcon size={32} className={styles.promptIcon} />
                            <p>Click any shape above to insert it onto the canvas.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </aside>
            </div>

            {/* -------------------------------------------------------------
                BOTTOM STATUS BAR: Dimensions & File Size
                ------------------------------------------------------------- */}
            <footer className={styles.bottomStatusBar}>
              <div className={styles.statusSection}>
                <span className={styles.statusLabel}>Original:</span>
                <span className={styles.statusValue}>
                  {origWidth} × {origHeight} px ({formatFileSize(origSize)})
                </span>
              </div>

              <div className={styles.statusHistory}>
                <span className={styles.historyStepBadge}>
                  Step {historyIndex + 1} of {history.length}: {history[historyIndex]?.label || 'Original'}
                </span>
                {layers.length > 0 && (
                  <span className={styles.layersCountBadge}>
                    {layers.length} {layers.length === 1 ? 'Layer' : 'Layers'}
                  </span>
                )}
              </div>

              <div className={styles.statusSection}>
                <span className={styles.statusLabel}>Current Document:</span>
                <span className={styles.statusValueHighlight}>
                  {currentWidth} × {currentHeight} px (~{formatFileSize(estimatedCurrentBytes)})
                </span>
              </div>
            </footer>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}

export default EditImagePage;
