import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  SplitSquareVertical,
  Layers,
  AlertTriangle,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { formatFileSize } from '@/utils/formatFileSize';
import styles from './ResizePage.module.css';

/**
 * Interactive Studio Preview component with Zoom, Fit, Before/After comparison, and Thumbnails strip.
 */
export default function ResizePreview({
  activeItem,
  targetWidth,
  targetHeight,
  origWidth,
  origHeight,
  lockAspectRatio,
  queueItems = [],
  activeId,
  onSelectActive,
  onRemoveItem,
  onAddMore,
  isResizing = false,
}) {
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' or 'custom'
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'compare'
  const [sliderPos, setSliderPos] = useState(50); // percentage for before/after split slider
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const containerRef = useRef(null);
  const addInputRef = useRef(null);

  // Aspect ratio distortion check
  const origRatio = origWidth && origHeight ? origWidth / origHeight : 1;
  const targetRatio = targetWidth && targetHeight ? targetWidth / targetHeight : origRatio;
  const isRatioDistorted = !lockAspectRatio && Math.abs(origRatio - targetRatio) > 0.03;

  // Zoom controls
  const handleZoomIn = () => {
    setZoomMode('custom');
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleFit = () => {
    setZoomMode('fit');
    setZoomLevel(1);
  };

  const handleResetZoom = () => {
    setZoomMode('fit');
    setZoomLevel(1);
  };

  // Compare slider drag logic
  const handleSliderMove = useCallback(
    (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (relativeX / rect.width) * 100));
      setSliderPos(pct);
    },
    [],
  );

  const handleMouseDownSlider = (e) => {
    e.preventDefault();
    setIsDraggingSlider(true);
  };

  const handleTouchStartSlider = () => {
    setIsDraggingSlider(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      }
    };
    const handleTouchMove = (e) => {
      if (isDraggingSlider && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    };
    const handleMouseUp = () => {
      if (isDraggingSlider) setIsDraggingSlider(false);
    };

    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingSlider, handleSliderMove]);

  const handleAddMoreFiles = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddMore?.(e.target.files);
      e.target.value = '';
    }
  };

  if (!activeItem) {
    return (
      <div className={styles.previewEmpty}>
        <p>No image selected for preview.</p>
      </div>
    );
  }

  const previewSrc = activeItem.previewUrl;

  return (
    <div className={styles.previewContainer}>
      {/* Top Preview Toolbar */}
      <div className={styles.previewToolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.viewTabs}>
            <button
              type="button"
              className={`${styles.viewTabBtn} ${viewMode === 'preview' ? styles.viewTabBtnActive : ''}`}
              onClick={() => setViewMode('preview')}
              title="Single output preview"
            >
              <Layers size={15} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              className={`${styles.viewTabBtn} ${viewMode === 'compare' ? styles.viewTabBtnActive : ''}`}
              onClick={() => setViewMode('compare')}
              title="Interactive Before / After comparison"
            >
              <SplitSquareVertical size={15} />
              <span>Before / After</span>
            </button>
          </div>

          <div className={styles.dimPill} title="Original ➔ Output dimensions">
            <span className={styles.dimPillOrig}>{origWidth || 0}×{origHeight || 0}</span>
            <span className={styles.dimPillArrow}>➔</span>
            <span className={styles.dimPillNew}>{targetWidth || 0}×{targetHeight || 0} px</span>
          </div>

          {isRatioDistorted && (
            <div className={styles.distortionBadge} title="Image aspect ratio differs from original">
              <AlertTriangle size={13} />
              <span>Ratio Altered</span>
            </div>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.zoomControlGroup}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleZoomOut}
              disabled={zoomMode === 'custom' && zoomLevel <= 0.25}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={15} />
            </button>
            <span className={styles.zoomLabel}>
              {zoomMode === 'fit' ? 'Fit' : `${Math.round(zoomLevel * 100)}%`}
            </span>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleZoomIn}
              disabled={zoomMode === 'custom' && zoomLevel >= 3}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              className={`${styles.iconBtn} ${zoomMode === 'fit' ? styles.iconBtnActive : ''}`}
              onClick={handleFit}
              title="Fit to viewport"
              aria-label="Fit to viewport"
            >
              <Maximize2 size={15} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleResetZoom}
              title="Reset 100%"
              aria-label="Reset zoom"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div className={styles.stageViewport} ref={containerRef}>
        <div className={styles.stageBackdrop} />

        {viewMode === 'preview' ? (
          /* Standard Live Resized Preview */
          <div
            className={styles.previewCanvasWrapper}
            style={{
              transform: zoomMode === 'custom' ? `scale(${zoomLevel})` : undefined,
              aspectRatio: targetWidth && targetHeight ? `${targetWidth} / ${targetHeight}` : undefined,
            }}
          >
            <img
              src={previewSrc}
              alt="Live resized preview"
              className={styles.previewImage}
              style={{
                objectFit: isRatioDistorted ? 'fill' : 'contain',
              }}
            />
            {isResizing && (
              <div className={styles.stageOverlayProcessing}>
                <div className={styles.spinner} />
                <span>Processing high-res canvas…</span>
              </div>
            )}
          </div>
        ) : (
          /* Interactive Before / After Split Slider */
          <div
            className={styles.compareContainer}
            style={{
              transform: zoomMode === 'custom' ? `scale(${zoomLevel})` : undefined,
            }}
          >
            {/* Base layer: Resized / Target Preview */}
            <div className={styles.compareLayerResized}>
              <img
                src={previewSrc}
                alt="Resized output preview"
                className={styles.compareImg}
                style={{
                  aspectRatio: targetWidth && targetHeight ? `${targetWidth} / ${targetHeight}` : undefined,
                  objectFit: isRatioDistorted ? 'fill' : 'contain',
                }}
              />
              <span className={styles.compareBadgeResized}>
                Resized ({targetWidth}×{targetHeight})
              </span>
            </div>

            {/* Overlaid clipped layer: Original Image */}
            <div
              className={styles.compareLayerOriginal}
              style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
            >
              <img
                src={previewSrc}
                alt="Original image preview"
                className={styles.compareImg}
                style={{
                  aspectRatio: origWidth && origHeight ? `${origWidth} / ${origHeight}` : undefined,
                  objectFit: 'contain',
                }}
              />
              <span className={styles.compareBadgeOriginal}>
                Original ({origWidth}×{origHeight})
              </span>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className={styles.compareHandle}
              style={{ left: `${sliderPos}%` }}
              onMouseDown={handleMouseDownSlider}
              onTouchStart={handleTouchStartSlider}
              role="slider"
              aria-valuenow={sliderPos}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Before / After comparison divider"
              tabIndex={0}
            >
              <div className={styles.handleKnob}>
                <SplitSquareVertical size={14} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Multi-Image Carousel / Thumbnails Strip */}
      {queueItems.length > 0 && (
        <div className={styles.thumbnailsStripContainer}>
          <div className={styles.thumbnailsStripHeader}>
            <span className={styles.stripTitle}>
              Queue ({queueItems.length} {queueItems.length === 1 ? 'image' : 'images'})
            </span>
            <span className={styles.stripHint}>Select to inspect or edit</span>
          </div>

          <div className={styles.thumbnailsList}>
            {queueItems.map((item) => {
              const isActive = item.id === activeId;
              const w = item.meta?.width;
              const h = item.meta?.height;
              const sizeStr = item.file ? formatFileSize(item.file.size) : '';

              return (
                <div
                  key={item.id}
                  className={`${styles.thumbCard} ${isActive ? styles.thumbCardActive : ''}`}
                  onClick={() => onSelectActive?.(item.id)}
                  title={`${item.file?.name} — ${w}×${h} px`}
                >
                  <div className={styles.thumbImageWrap}>
                    <img src={item.previewUrl} alt={item.file?.name} className={styles.thumbImage} />
                    {isActive && (
                      <div className={styles.thumbActiveBadge}>
                        <Check size={11} />
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.thumbRemoveBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem?.(item.id);
                      }}
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className={styles.thumbMeta}>
                    <p className={styles.thumbName}>{item.file?.name}</p>
                    <p className={styles.thumbSub}>
                      {w && h ? `${w}×${h}` : sizeStr}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Add More Images Button */}
            <button
              type="button"
              className={styles.thumbAddCard}
              onClick={() => addInputRef.current?.click()}
              title="Add more images"
            >
              <div className={styles.thumbAddIconWrap}>
                <Plus size={20} />
              </div>
              <span className={styles.thumbAddText}>Add More</span>
              <input
                ref={addInputRef}
                type="file"
                multiple
                accept="image/*,.svg"
                className={styles.hiddenInput}
                onChange={handleAddMoreFiles}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
