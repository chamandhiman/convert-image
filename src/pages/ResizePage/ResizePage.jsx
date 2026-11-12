import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import MultiImageUploader from '@/components/ui/MultiImageUploader';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  CONVERT_INPUT_TYPES,
  CONVERT_ACCEPT_STRING,
  MAX_CANVAS_DIMENSION,
  MAX_CANVAS_PIXELS,
  getSupportedOutputFormats,
  loadImage,
  getImageMeta,
  resizeImage,
  buildResizedFilename,
  downloadBlob,
} from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import { detectColorModeAndAlpha } from './resizeHelpers';
import { trackImageUpload, trackImageConvert, trackImageDownload } from '@/utils/analytics';
import ResizePreview from './ResizePreview';
import ResizeSettingsPanel from './ResizeSettingsPanel';
import ResizeResultsView from './ResizeResultsView';
import ResizeContent from './ResizeContent';
import styles from './ResizePage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  RESIZING: 'resizing',
  DONE: 'done',
  ERROR: 'error',
};

function ResizePage({ embedded, embeddedOnly }) {
  useDocumentTitle('Resize Images Online — Change Image Dimensions');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [queueItems, setQueueItems] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Resize settings state
  const [mode, setMode] = useState('dimensions'); // 'dimensions' | 'percentage'
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [percentage, setPercentage] = useState(100);

  // Format & Quality settings
  const outputFormats = useMemo(() => getSupportedOutputFormats(), []);
  const [outputFormat, setOutputFormat] = useState('original');
  const [quality, setQuality] = useState(85);

  // Advanced options
  const [preventEnlargement, setPreventEnlargement] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [customSuffix, setCustomSuffix] = useState('');

  const [error, setError] = useState('');
  const [isResizing, setIsResizing] = useState(false);

  const hasImages = queueItems.length > 0;
  const totalSize = useMemo(
    () => queueItems.reduce((sum, item) => sum + (item.file?.size || 0), 0),
    [queueItems],
  );

  // Active item in workspace
  const activeItem = useMemo(() => {
    if (!queueItems.length) return null;
    return queueItems.find((i) => i.id === activeId) || queueItems[0];
  }, [queueItems, activeId]);

  // Clean up object URLs on unmount or reset
  const cleanup = useCallback(() => {
    queueItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    });
    setQueueItems([]);
    setActiveId(null);
    setError('');
    setPhase(PHASE.IDLE);
    setIsResizing(false);
  }, [queueItems]);

  // Load single image metadata and color mode
  const processUploadedFile = useCallback(async (file, id) => {
    try {
      const image = await loadImage(file);
      const meta = getImageMeta(image, file);
      const colorMode = detectColorModeAndAlpha(image);

      setQueueItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, img: image, meta, colorMode, status: 'ready' }
            : item,
        ),
      );

      // If dimensions are not yet initialized, initialize with this image's dimensions
      setTargetWidth((prevW) => (prevW > 0 ? prevW : meta.width));
      setTargetHeight((prevH) => (prevH > 0 ? prevH : meta.height));
    } catch (err) {
      setQueueItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'failed',
                error: err?.message || 'Could not load image file.',
              }
            : item,
        ),
      );
    }
  }, []);

  // Handle files dropped or selected
  const handleFilesChange = useCallback(
    (files) => {
      if (!files || files.length === 0) return;

      const newItems = [];
      const fileList = Array.from(files);

      fileList.forEach((file) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);
        newItems.push({
          id,
          file,
          previewUrl,
          status: 'loading',
          error: '',
          img: null,
          meta: null,
          colorMode: 'RGB (24-bit)',
          result: null,
        });

        // Trigger asynchronous processing
        processUploadedFile(file, id);
      });

      setQueueItems((prev) => {
        const combined = [...prev, ...newItems];
        if (!activeId && combined.length > 0) {
          setActiveId(combined[0].id);
        }
        return combined;
      });

      setPhase(PHASE.LOADED);
      setError('');
      trackImageUpload({ tool: 'resize_image', count: newItems.length });
    },
    [activeId, processUploadedFile],
  );

  // Switch active item and sync dimensions if still unedited
  const handleSelectActive = useCallback((id) => {
    setActiveId(id);
  }, []);

  // Remove single item from queue
  const handleRemoveItem = useCallback(
    (id) => {
      setQueueItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (item) {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
          if (item.result?.url) URL.revokeObjectURL(item.result.url);
        }
        const filtered = prev.filter((i) => i.id !== id);
        if (filtered.length === 0) {
          setPhase(PHASE.IDLE);
          setActiveId(null);
        } else if (activeId === id) {
          setActiveId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeId],
  );

  // Clear all
  const handleClearAll = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Start again / reset
  const handleStartAgain = useCallback(() => {
    cleanup();
    setMode('dimensions');
    setTargetWidth(0);
    setTargetHeight(0);
    setLockAspectRatio(true);
    setPercentage(100);
    setOutputFormat('original');
    setQuality(85);
    setPreventEnlargement(false);
    setBackgroundColor('#FFFFFF');
    setCustomSuffix('');
  }, [cleanup]);

  // Execute Resizing
  const handleResize = useCallback(async () => {
    const readyItems = queueItems.filter((item) => item.img && item.meta);
    if (readyItems.length === 0) {
      setError('Please upload at least one valid image.');
      return;
    }

    if (mode === 'dimensions') {
      if (targetWidth <= 0 || targetHeight <= 0) {
        setError('Width and height must be greater than 0 pixels.');
        return;
      }
      if (
        targetWidth > MAX_CANVAS_DIMENSION ||
        targetHeight > MAX_CANVAS_DIMENSION
      ) {
        setError(`Maximum dimension is ${MAX_CANVAS_DIMENSION.toLocaleString()} pixels.`);
        return;
      }
      if (targetWidth * targetHeight > MAX_CANVAS_PIXELS) {
        setError('Total image area exceeds the safe browser limit of 100 megapixels.');
        return;
      }
    }

    setPhase(PHASE.RESIZING);
    setIsResizing(true);
    setError('');

    for (let i = 0; i < readyItems.length; i++) {
      const item = readyItems[i];

      let w = targetWidth;
      let h = targetHeight;

      if (mode === 'percentage') {
        const scale = percentage / 100;
        w = Math.max(1, Math.round(item.meta.width * scale));
        h = Math.max(1, Math.round(item.meta.height * scale));
      } else if (readyItems.length > 1 && lockAspectRatio) {
        // Multi-image batch resizing: fit within bounding box preserving each item's natural ratio
        const scale = Math.min(
          targetWidth / item.meta.width,
          targetHeight / item.meta.height,
        );
        w = Math.max(1, Math.round(item.meta.width * scale));
        h = Math.max(1, Math.round(item.meta.height * scale));
      }

      // Prevent enlargement if option is checked
      if (preventEnlargement) {
        if (w > item.meta.width) w = item.meta.width;
        if (h > item.meta.height) h = item.meta.height;
      }

      try {
        const resolvedType =
          outputFormat === 'original'
            ? item.meta.isSvg
              ? 'image/png'
              : item.meta.type
            : outputFormat;

        const output = await resizeImage(item.img, {
          width: w,
          height: h,
          outputType: resolvedType,
          quality: quality / 100,
          backgroundColor: resolvedType === 'image/jpeg' ? backgroundColor : undefined,
        });

        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id
              ? { ...qItem, result: output, status: 'complete' }
              : qItem,
          ),
        );
      } catch (err) {
        const errMsg = err?.message || 'Failed to resize this image.';
        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id
              ? { ...qItem, status: 'failed', error: errMsg }
              : qItem,
          ),
        );
      }
    }

    setIsResizing(false);
    setPhase(PHASE.DONE);
    trackImageConvert({
      tool: 'resize_image',
      outputFormat: outputFormat,
      count: readyItems.length,
    });
  }, [
    queueItems,
    mode,
    targetWidth,
    targetHeight,
    percentage,
    lockAspectRatio,
    preventEnlargement,
    outputFormat,
    quality,
    backgroundColor,
  ]);

  // Download single item
  const handleDownloadItem = useCallback(
    (item) => {
      if (!item.result?.blob || !item.meta) return;
      const resolvedType =
        outputFormat === 'original'
          ? item.meta.isSvg
            ? 'image/png'
            : item.meta.type
          : outputFormat;
      const filename = buildResizedFilename(
        item.meta.name,
        resolvedType,
        item.result.width,
        item.result.height,
        customSuffix,
      );
      downloadBlob(item.result.blob, filename);
      trackImageDownload({
        tool: 'resize_image',
        outputFormat: resolvedType,
        isBatch: false,
      });
    },
    [outputFormat, customSuffix],
  );

  // Consume staged file if bridged from another tool
  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        handleFilesChange([stagedFile]);
      });
    }
  }, [handleFilesChange]);

  return (
    <ToolPageLayout
      badge="Free · In-Browser"
      title="Resize Images Online"
      subtitle="Change image dimensions by exact pixels or percentage while maintaining aspect ratio. 100% private in your browser."
      content={<ResizeContent />}
      contentFullWidth
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      showHero={false}
    >
      <div id="tool" className={styles.converterSurface}>
        {!hasImages ? (
          /* Empty State: Multi-Image Drag & Drop Upload Zone */
          <div className={styles.uploadSurface}>
            <div className={styles.uploadHeader}>
              <h2 className={styles.uploadTitle}>Resize your images</h2>
              <p className={styles.uploadDesc}>
                Upload images and resize by exact pixels or percentage. Fast, high-quality, and 100% private in your browser.
              </p>
            </div>

            <MultiImageUploader
              onFilesChange={handleFilesChange}
              onFileSelect={(file) => {
                if (file) handleFilesChange([file]);
              }}
              accept={CONVERT_ACCEPT_STRING}
              acceptedTypes={CONVERT_INPUT_TYPES}
              hint="JPG, PNG, WebP, AVIF, GIF, SVG — up to 50 MB"
            />

            {error && (
              <p className={styles.emptyError} role="status">
                {error}
              </p>
            )}
          </div>
        ) : phase === PHASE.DONE ? (
          /* Post-Resize State: High-Precision Results View */
          <ResizeResultsView
            queueItems={queueItems}
            onDownloadItem={handleDownloadItem}
            onStartAgain={handleStartAgain}
            outputFormat={outputFormat}
            customSuffix={customSuffix}
          />
        ) : (
          /* Active Editing State: Studio Interface */
          <div className={styles.workspaceSurface}>
            {/* Top Workspace Bar */}
            <div className={styles.workspaceTopBar}>
              <div className={styles.topBarLeft}>
                <span className={styles.itemCountBadge}>
                  {queueItems.length} {queueItems.length === 1 ? 'image' : 'images'}
                </span>
                <span className={styles.totalSizeText}>
                  Total: {formatFileSize(totalSize)}
                </span>
              </div>
              <div className={styles.topBarRight}>
                <button
                  type="button"
                  className={styles.clearAllBtn}
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              </div>
            </div>

            {error && (
              <p className={styles.emptyError} role="status">
                {error}
              </p>
            )}

            {/* Studio Workspace: Preview on left, Settings on right */}
            <div className={styles.studioLayout}>
              <ResizePreview
                activeItem={activeItem}
                targetWidth={targetWidth}
                targetHeight={targetHeight}
                origWidth={activeItem?.meta?.width || 0}
                origHeight={activeItem?.meta?.height || 0}
                lockAspectRatio={lockAspectRatio}
                queueItems={queueItems}
                activeId={activeId}
                onSelectActive={handleSelectActive}
                onRemoveItem={handleRemoveItem}
                onAddMore={handleFilesChange}
                isResizing={isResizing}
              />

              <ResizeSettingsPanel
                activeItem={activeItem}
                mode={mode}
                setMode={setMode}
                targetWidth={targetWidth}
                setTargetWidth={setTargetWidth}
                targetHeight={targetHeight}
                setTargetHeight={setTargetHeight}
                lockAspectRatio={lockAspectRatio}
                setLockAspectRatio={setLockAspectRatio}
                percentage={percentage}
                setPercentage={setPercentage}
                outputFormat={outputFormat}
                setOutputFormat={setOutputFormat}
                quality={quality}
                setQuality={setQuality}
                preventEnlargement={preventEnlargement}
                setPreventEnlargement={setPreventEnlargement}
                backgroundColor={backgroundColor}
                setBackgroundColor={setBackgroundColor}
                customSuffix={customSuffix}
                setCustomSuffix={setCustomSuffix}
                onResize={handleResize}
                isResizing={isResizing}
                totalCount={queueItems.length}
                outputFormats={outputFormats}
              />
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}

export default ResizePage;
