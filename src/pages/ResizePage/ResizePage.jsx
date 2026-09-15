import { useState, useEffect, useCallback, useMemo } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import MultiImageUploader from '@/components/ui/MultiImageUploader';
import {
  ToolTopBar,
  ToolImageGrid,
  ToolImageCard,
  ToolResultGrid,
  ToolResultCard,
  ToolProcessingState,
  ToolResultToolbar,
} from '@/components/ui/tool-ui';
import { Button } from '@/components/ui/Button';
import { IconCrop } from '@/components/ui/Icons/Icons';
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

import ResizeContent from './ResizeContent';
import styles from './ResizePage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  RESIZING: 'resizing',
  DONE: 'done',
  ERROR: 'error',
};

const PERCENTAGE_PRESETS = [25, 50, 75, 100, 125, 150, 200];

function ResizePage({ embedded, embeddedOnly }) {
  useDocumentTitle('Resize Images Online — Change Image Dimensions');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [queueItems, setQueueItems] = useState([]);
  const [mode, setMode] = useState('dimensions');
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [percentage, setPercentage] = useState(100);
  const outputFormats = useMemo(() => getSupportedOutputFormats(), []);
  const [outputFormat, setOutputFormat] = useState('original');
  const [quality, setQuality] = useState(85);
  const [error, setError] = useState('');
  const [processingIndex, setProcessingIndex] = useState(0);

  const hasImages = queueItems.length > 0;
  const completedCount = queueItems.filter((i) => i.status === 'complete').length;

  const totalSize = useMemo(
    () => queueItems.reduce((sum, item) => sum + (item.file?.size || 0), 0),
    [queueItems],
  );

  const cleanup = useCallback(() => {
    queueItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    });
    setQueueItems([]);
    setError('');
    setPhase(PHASE.IDLE);
    setProcessingIndex(0);
  }, [queueItems]);

  const handleFilesChange = useCallback((files) => {
    if (!files || files.length === 0) return;

    const accepted = [];
    Array.from(files).forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl,
        status: 'ready',
        error: '',
        img: null,
        meta: null,
        result: null,
      });
    });

    setQueueItems((prev) => [...prev, ...accepted]);
    setPhase(PHASE.LOADED);
    setError('');
  }, []);

  const handleFileSelect = useCallback(
    async (file) => {
      setError('');
      try {
        const image = await loadImage(file);
        const meta = getImageMeta(image, file);

        setQueueItems((prev) =>
          prev.map((item) =>
            item.file === file ? { ...item, img: image, meta, status: 'ready' } : item,
          ),
        );
      } catch (err) {
        setError(err?.message || 'Could not load the image file.');
      }
    },
    [],
  );

  const handleRemoveItem = useCallback((id) => {
    setQueueItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleClear = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const handleStartAgain = useCallback(() => {
    cleanup();
    setMode('dimensions');
    setTargetWidth(0);
    setTargetHeight(0);
    setLockAspectRatio(true);
    setPercentage(100);
    setOutputFormat('original');
    setQuality(85);
  }, [cleanup]);

  const handleResize = useCallback(async () => {
    const readyItems = queueItems.filter((item) => item.img && item.meta);
    if (readyItems.length === 0) return;

    if (mode === 'dimensions') {
      if (targetWidth <= 0 || targetHeight <= 0) {
        setError('Width and height must be greater than 0 pixels.');
        return;
      }
      if (targetWidth > MAX_CANVAS_DIMENSION || targetHeight > MAX_CANVAS_DIMENSION) {
        setError(`Maximum dimension is ${MAX_CANVAS_DIMENSION.toLocaleString()} pixels.`);
        return;
      }
      if (targetWidth * targetHeight > MAX_CANVAS_PIXELS) {
        setError('Total image area exceeds the safe browser limit of 100 megapixels.');
        return;
      }
    }

    setPhase(PHASE.RESIZING);
    setError('');
    setProcessingIndex(0);

    for (let i = 0; i < readyItems.length; i++) {
      const item = readyItems[i];
      setProcessingIndex(i + 1);

      let width = targetWidth;
      let height = targetHeight;

      if (mode === 'percentage') {
        width = Math.round(item.meta.width * (percentage / 100));
        height = Math.round(item.meta.height * (percentage / 100));
      }

      try {
        const output = await resizeImage(item.img, {
          width,
          height,
          outputType: outputFormat === 'original' ? undefined : outputFormat,
          quality: quality / 100,
        });

        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, result: output, status: 'complete' } : qItem,
          ),
        );
      } catch (err) {
        const errMsg = err?.message || 'Failed to resize this image.';
        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, status: 'failed', error: errMsg } : qItem,
          ),
        );
      }
    }

    setPhase(PHASE.DONE);
  }, [queueItems, mode, targetWidth, targetHeight, percentage, outputFormat, quality]);

  const handleDownload = useCallback((item) => {
    if (!item.result?.blob || !item.meta) return;
    const resolvedType = outputFormat === 'original'
      ? (item.meta.isSvg ? 'image/png' : item.meta.type)
      : outputFormat;
    const filename = buildResizedFilename(
      item.meta.name,
      resolvedType,
      item.result.width,
      item.result.height,
    );
    downloadBlob(item.result.blob, filename);
  }, [outputFormat]);

  const handleDownloadAll = useCallback(async () => {
    const completedItems = queueItems.filter((item) => item.status === 'complete' && item.result);
    if (completedItems.length === 0) return;

    for (const item of completedItems) {
      const resolvedType = outputFormat === 'original'
        ? (item.meta.isSvg ? 'image/png' : item.meta.type)
        : outputFormat;
      const filename = buildResizedFilename(
        item.meta.name,
        resolvedType,
        item.result.width,
        item.result.height,
      );
      downloadBlob(item.result.blob, filename);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }, [queueItems, outputFormat]);

  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        handleFilesChange([stagedFile]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedOutputType = useMemo(() => {
    const firstReady = queueItems.find((i) => i.meta);
    if (outputFormat === 'original') {
      if (firstReady?.meta?.isSvg) return 'image/png';
      const match = outputFormats.find((f) => f.value === firstReady?.meta?.type && f.isSupported);
      if (match) return match.value;
      return 'image/jpeg';
    }
    return outputFormat;
  }, [outputFormat, queueItems, outputFormats]);

  const selectedFormatObj = outputFormats.find((f) => f.value === resolvedOutputType);
  const isLossy = selectedFormatObj ? selectedFormatObj.lossy : resolvedOutputType !== 'image/png';

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
      <div className={styles.converterSurface}>
        {!hasImages ? (
          <div className={styles.uploadSurface}>
            <div className={styles.uploadHeader}>
              <div>
                <h2 className={styles.uploadTitle}>Resize your images</h2>
                <p className={styles.uploadDesc}>
                  Upload images and resize by exact pixels or percentage. Everything stays in your browser.
                </p>
              </div>
            </div>

          <MultiImageUploader
            onFilesChange={handleFilesChange}
            onFileSelect={handleFileSelect}
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
      ) : (
        <div className={styles.workspaceSurface}>
          {phase === PHASE.DONE ? (
            <ToolResultToolbar
              completedCount={completedCount}
              totalCount={queueItems.length}
              totalSize={formatFileSize(totalSize)}
              onDownloadAll={handleDownloadAll}
              onDownloadZip={handleDownloadAll}
              onStartAgain={handleStartAgain}
              startAgainLabel="Resize Another"
              downloadZipLabel="Download All"
            />
          ) : (
            <ToolTopBar
              itemCount={queueItems.length}
              totalSize={totalSize}
              onAddMore={handleFilesChange}
              onClearAll={handleClear}
              addMoreAccept={CONVERT_ACCEPT_STRING}
            />
          )}

          {phase !== PHASE.DONE && (
            <div className={styles.controlBar}>
              <div className={styles.controlBarLeft}>
                <div className={styles.modeTabs} role="tablist" aria-label="Resize mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'dimensions'}
                    className={`${styles.modeTab} ${mode === 'dimensions' ? styles.modeTabActive : ''}`}
                    onClick={() => setMode('dimensions')}
                  >
                    Custom Dimensions (px)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'percentage'}
                    className={`${styles.modeTab} ${mode === 'percentage' ? styles.modeTabActive : ''}`}
                    onClick={() => setMode('percentage')}
                  >
                    Percentage (%)
                  </button>
                </div>

                {mode === 'dimensions' && (
                  <div className={styles.dimensionsRow}>
                    <div className={styles.dimensionField}>
                      <label className={styles.controlLabel} htmlFor="resize-width">
                        Width (px)
                      </label>
                      <div className={styles.inputWithSuffix}>
                        <input
                          id="resize-width"
                          type="number"
                          min="1"
                          max={MAX_CANVAS_DIMENSION}
                          value={targetWidth || ''}
                          onChange={(e) => setTargetWidth(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className={styles.numberInput}
                        />
                        <span className={styles.inputSuffix}>px</span>
                      </div>
                    </div>

                    <div className={styles.lockContainer}>
                      <button
                        type="button"
                        onClick={() => setLockAspectRatio((prev) => !prev)}
                        className={`${styles.lockBtn} ${lockAspectRatio ? styles.lockBtnActive : ''}`}
                        title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                        aria-label={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                        aria-pressed={lockAspectRatio}
                      >
                        {lockAspectRatio ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className={styles.dimensionField}>
                      <label className={styles.controlLabel} htmlFor="resize-height">
                        Height (px)
                      </label>
                      <div className={styles.inputWithSuffix}>
                        <input
                          id="resize-height"
                          type="number"
                          min="1"
                          max={MAX_CANVAS_DIMENSION}
                          value={targetHeight || ''}
                          onChange={(e) => setTargetHeight(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className={styles.numberInput}
                        />
                        <span className={styles.inputSuffix}>px</span>
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'percentage' && (
                  <div className={styles.presetGrid} role="group" aria-label="Scale presets">
                    {PERCENTAGE_PRESETS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className={`${styles.presetBtn} ${percentage === pct ? styles.presetBtnActive : ''}`}
                        onClick={() => setPercentage(pct)}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                )}

                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel} htmlFor="output-format-select">
                    Output Format
                  </label>
                  <select
                    id="output-format-select"
                    className={styles.select}
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  >
                    <option value="original">Keep original</option>
                    {outputFormats.map((f) => (
                      <option key={f.value} value={f.value} disabled={!f.isSupported}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.controlGroup}>
                  <div className={styles.sliderHeader}>
                    <label className={styles.controlLabel} htmlFor="resize-quality-slider">
                      Quality
                    </label>
                    <output className={styles.qualityValue} htmlFor="resize-quality-slider">
                      {isLossy ? `${quality}%` : 'Lossless'}
                    </output>
                  </div>
                  <input
                    id="resize-quality-slider"
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className={styles.slider}
                    disabled={!isLossy}
                  />
                  {!isLossy && (
                    <p className={styles.controlHint}>
                      PNG uses lossless compression — quality setting does not apply.
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.controlBarRight}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<IconCrop />}
                  onClick={handleResize}
                  disabled={phase === PHASE.RESIZING}
                >
                  {phase === PHASE.RESIZING ? 'Resizing…' : 'Resize Images'}
                </Button>
              </div>
            </div>
          )}

          {phase === PHASE.RESIZING && (
            <ToolProcessingState label="Resizing your images" current={processingIndex} total={queueItems.length} />
          )}

          {phase === PHASE.ERROR && error && (
            <div className={styles.errorBlock} role="alert">
              <p className={styles.errorTitle}>Error</p>
              <p className={styles.errorText}>{error}</p>
              <button type="button" className={styles.btnSecondary} onClick={handleClear}>
                Try another image
              </button>
            </div>
          )}

          {phase !== PHASE.DONE && (
            <ToolImageGrid>
              {queueItems.map((item) => (
                <ToolImageCard
                  key={item.id}
                  previewUrl={item.previewUrl}
                  fileName={item.file.name}
                  fileSize={`${(item.file.size / (1024 * 1024)).toFixed(1)} MB`}
                  status={item.status}
                  error={item.error}
                  onRemove={() => handleRemoveItem(item.id)}
                />
              ))}
            </ToolImageGrid>
          )}

          {phase === PHASE.DONE && (
            <ToolResultGrid>
              {queueItems.map((item) => (
                <ToolResultCard
                  key={item.id}
                  previewUrl={item.status === 'complete' && item.result ? item.result.url : item.previewUrl}
                  fileName={item.file.name}
                  fileSize={item.meta ? formatFileSize(item.meta.size) : ''}
                  status={item.status}
                  error={item.error}
                  onDownload={() => handleDownload(item)}
                />
              ))}
            </ToolResultGrid>
          )}
        </div>
      )}
      </div>
    </ToolPageLayout>
  );
}

export default ResizePage;
