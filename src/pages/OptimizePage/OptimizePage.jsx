import { useState, useMemo, useEffect, useCallback } from 'react';

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
import { IconSparkles } from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  CONVERT_INPUT_TYPES,
  CONVERT_ACCEPT_STRING,
  MAX_CANVAS_DIMENSION,
  MAX_CANVAS_PIXELS,
  getSupportedOutputFormats,
  getFormatLabel,
  loadImage,
  getImageMeta,
  resizeImage,
  downloadBlob,
} from '@/utils/imageProcessor';
import { OPTIMIZER_GOALS, DEFAULT_GOAL_ID } from '@/tools/optimizer/optimizerPresets';
import {
  getOptimizationRecommendation,
  buildOptimizedFilename,
} from '@/tools/optimizer/optimizerRecommendations';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import OptimizeContent from './OptimizeContent';
import styles from './OptimizePage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  OPTIMIZING: 'optimizing',
  DONE: 'done',
  ERROR: 'error',
};

function OptimizePage({ embedded }) {
  useDocumentTitle('Smart Image Optimizer — Reduce Image Size Easily');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [queueItems, setQueueItems] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(DEFAULT_GOAL_ID);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customFormat, setCustomFormat] = useState('auto');
  const [customQuality, setCustomQuality] = useState(null);
  const [customMaxWidth, setCustomMaxWidth] = useState('');
  const [customMaxHeight, setCustomMaxHeight] = useState('');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const outputFormats = useMemo(() => getSupportedOutputFormats(), []);
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
    setSelectedGoal(DEFAULT_GOAL_ID);
    setShowAdvanced(false);
    setCustomFormat('auto');
    setCustomQuality(null);
    setCustomMaxWidth('');
    setCustomMaxHeight('');
    setLockAspectRatio(true);
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

  const readyItems = queueItems.filter((item) => item.img && item.meta);

  const firstReadyMeta = readyItems.length > 0 ? readyItems[0].meta : null;

  const recommendation = useMemo(() => {
    if (!firstReadyMeta) return null;

    const parsedMaxWidth = customMaxWidth ? parseInt(customMaxWidth, 10) : null;
    const parsedMaxHeight = customMaxHeight ? parseInt(customMaxHeight, 10) : null;

    return getOptimizationRecommendation(firstReadyMeta, selectedGoal, {
      format: customFormat,
      quality: customQuality !== null ? customQuality : undefined,
      maxWidth: parsedMaxWidth,
      maxHeight: parsedMaxHeight,
    });
  }, [firstReadyMeta, selectedGoal, customFormat, customQuality, customMaxWidth, customMaxHeight]);

  const handleOptimize = useCallback(async () => {
    if (!recommendation || readyItems.length === 0) return;

    if (recommendation.targetFormat === 'image/avif') {
      const avifFormat = outputFormats.find((f) => f.value === 'image/avif');
      if (!avifFormat?.isSupported) {
        setError("AVIF output isn't supported by this browser. Choose WebP or JPG instead.");
        return;
      }
    }

    if (
      recommendation.targetWidth > MAX_CANVAS_DIMENSION ||
      recommendation.targetHeight > MAX_CANVAS_DIMENSION
    ) {
      setError(`Dimensions exceed the maximum limit of ${MAX_CANVAS_DIMENSION.toLocaleString()} pixels.`);
      return;
    }

    if (recommendation.targetWidth * recommendation.targetHeight > MAX_CANVAS_PIXELS) {
      setError('Target dimensions exceed the safe browser memory limit of 100 megapixels.');
      return;
    }

    setPhase(PHASE.OPTIMIZING);
    setError('');
    setProcessingIndex(0);

    for (let i = 0; i < readyItems.length; i++) {
      const item = readyItems[i];
      setProcessingIndex(i + 1);

      try {
        const output = await resizeImage(item.img, {
          width: recommendation.targetWidth,
          height: recommendation.targetHeight,
          outputType: recommendation.targetFormat,
          quality: recommendation.targetQuality / 100,
        });

        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, result: output, status: 'complete' } : qItem,
          ),
        );
      } catch (err) {
        const errMsg = err?.message || 'Failed to optimize this image.';
        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, status: 'failed', error: errMsg } : qItem,
          ),
        );
      }
    }

    setPhase(PHASE.DONE);
  }, [readyItems, recommendation, outputFormats]);

  const handleDownload = useCallback(
    (item) => {
      if (!item.result?.blob || !item.meta) return;
      const rec = getOptimizationRecommendation(item.meta, selectedGoal, {});
      const filename = buildOptimizedFilename(
        item.meta.name,
        item.result.outputType || rec.targetFormat,
        selectedGoal,
      );
      downloadBlob(item.result.blob, filename);
    },
    [selectedGoal],
  );

  const handleDownloadAll = useCallback(async () => {
    const completedItems = queueItems.filter((item) => item.status === 'complete' && item.result);
    if (completedItems.length === 0) return;

    for (const item of completedItems) {
      const rec = getOptimizationRecommendation(item.meta, selectedGoal, {});
      const filename = buildOptimizedFilename(
        item.meta.name,
        item.result.outputType || rec.targetFormat,
        selectedGoal,
      );
      downloadBlob(item.result.blob, filename);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }, [queueItems, selectedGoal]);

  const handleStartAgain = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    const { file: stagedFile, goal: stagedGoal } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        if (stagedGoal) setSelectedGoal(stagedGoal);
        handleFilesChange([stagedFile]);
      });
    }
  }, [handleFilesChange]);

  return (
    <ToolPageLayout
      badge="Smart & Private"
      title="Smart Image Optimizer"
      subtitle="Optimize images based on how you plan to use them. Sensible recommendations, zero complex guesswork."
      content={<OptimizeContent />}
      contentFullWidth
      embedded={embedded}
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {!hasImages ? (
          <div className={styles.uploadSurface}>
            <div className={styles.uploadHeader}>
              <div>
                <h2 className={styles.uploadTitle}>Optimize your images</h2>
                <p className={styles.uploadDesc}>
                  Select images and we&rsquo;ll recommend the best format, size, and quality based on your goal.
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
                startAgainLabel="Optimize Another"
                downloadAllLabel="Download All"
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
                  <div className={styles.controlGroup}>
                    <label className={styles.controlLabel} id="goal-prompt">
                      What are you using this image for?
                    </label>
                    <div className={styles.goalsGrid} role="radiogroup" aria-labelledby="goal-prompt">
                      {OPTIMIZER_GOALS.map((goal) => {
                        const isSelected = selectedGoal === goal.id;
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`${styles.goalCard} ${isSelected ? styles.goalCardActive : ''}`}
                            onClick={() => setSelectedGoal(goal.id)}
                          >
                            <div className={styles.goalCardTop}>
                              <span className={styles.goalLabel}>{goal.label}</span>
                              {goal.badge && (
                                <span className={styles.goalBadge}>{goal.badge}</span>
                              )}
                            </div>
                            <p className={styles.goalSummary}>{goal.summary}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {recommendation && (
                    <div className={styles.recommendationCard}>
                      <div className={styles.recHeader}>
                        <div className={styles.recIconWrap} aria-hidden="true">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={styles.recTitle}>
                            Recommended for {recommendation.goalLabel}
                          </h4>
                          <p className={styles.recRationale}>{recommendation.goalRationale}</p>
                        </div>
                      </div>

                      <div className={styles.recPillGroup}>
                        <div className={styles.recPill}>
                          <span className={styles.recPillLabel}>Format:</span>
                          <strong>{getFormatLabel(recommendation.targetFormat)}</strong>
                        </div>
                        {!recommendation.isTargetLossless && (
                          <div className={styles.recPill}>
                            <span className={styles.recPillLabel}>Quality:</span>
                            <strong>{recommendation.targetQuality}%</strong>
                          </div>
                        )}
                        <div className={styles.recPill}>
                          <span className={styles.recPillLabel}>Resolution:</span>
                          <strong>
                            {recommendation.targetWidth} &times; {recommendation.targetHeight} px
                          </strong>
                        </div>
                      </div>

                      <div className={styles.estimateBox}>
                        <div className={styles.estimateItem}>
                          <span className={styles.estimateLabel}>Original</span>
                          <span className={styles.estimateValue}>
                            {firstReadyMeta ? formatFileSize(firstReadyMeta.size) : '—'}
                          </span>
                          <span className={styles.estimateSub}>
                            {firstReadyMeta
                              ? `${firstReadyMeta.width} &times; ${firstReadyMeta.height} px`
                              : ''}
                          </span>
                        </div>
                        <span className={styles.estimateArrow} aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </span>
                        <div className={styles.estimateItem}>
                          <span className={styles.estimateLabel}>Estimated size</span>
                          <span className={styles.estimateValueHighlight}>
                            ~{formatFileSize(recommendation.estimatedBytes)}
                          </span>
                          <span className={styles.estimateSub}>
                            {recommendation.targetWidth} &times; {recommendation.targetHeight} px
                          </span>
                        </div>
                      </div>

                      {recommendation.notices.length > 0 && (
                        <div className={styles.noticesWrap}>
                          {recommendation.notices.map((notice, idx) => (
                            <p key={idx} className={styles.noticeText}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                              <span>{notice.message}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="primary"
                        size="lg"
                        icon={<IconSparkles />}
                        onClick={handleOptimize}
                        disabled={phase === PHASE.OPTIMIZING}
                      >
                        {phase === PHASE.OPTIMIZING ? 'Optimizing…' : 'Optimize Images'}
                      </Button>
                    </div>
                  )}

                  <div className={styles.advancedToggleRow}>
                    <button
                      type="button"
                      className={styles.advancedToggleBtn}
                      onClick={() => setShowAdvanced((prev) => !prev)}
                      aria-expanded={showAdvanced}
                      aria-controls="advanced-settings-panel"
                    >
                      <span>Want more control?</span>
                      <strong>{showAdvanced ? 'Hide advanced settings ▲' : 'Advanced settings ▼'}</strong>
                    </button>
                  </div>

                  {showAdvanced && (
                    <div id="advanced-settings-panel" className={styles.advancedPanel}>
                      <h4 className={styles.advancedTitle}>Custom Optimization Overrides</h4>
                      <div className={styles.advancedGrid}>
                        <div className={styles.controlField}>
                          <label htmlFor="adv-format" className={styles.fieldLabel}>
                            Output format
                          </label>
                          <select
                            id="adv-format"
                            className={styles.selectInput}
                            value={customFormat}
                            onChange={(e) => setCustomFormat(e.target.value)}
                          >
                            <option value="auto">
                              Automatic ({recommendation ? getFormatLabel(recommendation.targetFormat) : 'recommended'})
                            </option>
                            {outputFormats.map((f) => (
                              <option key={f.value} value={f.value} disabled={!f.isSupported}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.controlField}>
                          <div className={styles.sliderHeader}>
                            <label htmlFor="adv-quality" className={styles.fieldLabel}>
                              Quality
                            </label>
                            <span className={styles.qualityNumber}>
                              {recommendation && recommendation.isTargetLossless
                                ? 'Lossless'
                                : `${customQuality !== null ? customQuality : (recommendation?.targetQuality ?? 82)}%`}
                            </span>
                          </div>
                          <input
                            id="adv-quality"
                            type="range"
                            min="10"
                            max="100"
                            step="1"
                            value={customQuality !== null ? customQuality : (recommendation?.targetQuality ?? 82)}
                            onChange={(e) => setCustomQuality(Number(e.target.value))}
                            disabled={recommendation ? recommendation.isTargetLossless : false}
                            className={styles.rangeInput}
                          />
                          {recommendation?.isTargetLossless && (
                            <span className={styles.fieldHint}>
                              PNG quality is always lossless.
                            </span>
                          )}
                        </div>

                        <div className={styles.controlField}>
                          <label htmlFor="adv-max-width" className={styles.fieldLabel}>
                            Maximum width (px)
                          </label>
                          <input
                            id="adv-max-width"
                            type="number"
                            min="1"
                            max={MAX_CANVAS_DIMENSION}
                            placeholder={recommendation ? `Auto (${recommendation.targetWidth})` : 'Auto'}
                            value={customMaxWidth}
                            onChange={(e) => setCustomMaxWidth(e.target.value)}
                            className={styles.textInput}
                          />
                        </div>

                        <div className={styles.controlField}>
                          <label htmlFor="adv-max-height" className={styles.fieldLabel}>
                            Maximum height (px)
                          </label>
                          <input
                            id="adv-max-height"
                            type="number"
                            min="1"
                            max={MAX_CANVAS_DIMENSION}
                            placeholder={recommendation ? `Auto (${recommendation.targetHeight})` : 'Auto'}
                            value={customMaxHeight}
                            onChange={(e) => setCustomMaxHeight(e.target.value)}
                            className={styles.textInput}
                          />
                        </div>
                      </div>

                      <div className={styles.checkboxRow}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={lockAspectRatio}
                            onChange={(e) => setLockAspectRatio(e.target.checked)}
                            className={styles.checkbox}
                          />
                          <span>Maintain aspect ratio</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {phase === PHASE.OPTIMIZING && (
                  <ToolProcessingState
                    label="Optimizing your images"
                    current={processingIndex}
                    total={queueItems.length}
                  />
                )}

                {phase === PHASE.ERROR && error && (
                  <div className={styles.errorBlock} role="alert">
                    <p className={styles.errorTitle}>Optimization Error</p>
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
        )}
      </div>
    </ToolPageLayout>
  );
}

export default OptimizePage;
