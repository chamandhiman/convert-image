import { useState, useMemo, useEffect } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import ImagePreview from '@/components/ui/ImagePreview';
import { Button } from '@/components/ui/Button';
import { IconDownload, IconImagePlus } from '@/components/ui/Icons/Icons';
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

/* ---------------------------------------------------------------------- */
/*  State machine phases                                                  */
/* ---------------------------------------------------------------------- */
const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  OPTIMIZING: 'optimizing',
  DONE: 'done',
  ERROR: 'error',
};

function OptimizePage() {
  useDocumentTitle('Smart Image Optimizer — Reduce Image Size Easily');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  /* User's selected goal */
  const [selectedGoal, setSelectedGoal] = useState(DEFAULT_GOAL_ID);

  /* Advanced settings toggle & overrides */
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customFormat, setCustomFormat] = useState('auto');
  const [customQuality, setCustomQuality] = useState(null);
  const [customMaxWidth, setCustomMaxWidth] = useState('');
  const [customMaxHeight, setCustomMaxHeight] = useState('');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  /* Supported formats list */
  const outputFormats = useMemo(() => getSupportedOutputFormats(), []);

  /* Result */
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  /* -------------------------------------------------------------------- */
  /*  Cleanup helper                                                      */
  /* -------------------------------------------------------------------- */
  const cleanup = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setImg(null);
    setOriginalMeta(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    setSelectedGoal(DEFAULT_GOAL_ID);
    setShowAdvanced(false);
    setCustomFormat('auto');
    setCustomQuality(null);
    setCustomMaxWidth('');
    setCustomMaxHeight('');
    setLockAspectRatio(true);
    setPhase(PHASE.IDLE);
  };

  /* -------------------------------------------------------------------- */
  /*  File selection                                                      */
  /* -------------------------------------------------------------------- */
  const handleFileSelect = async (f) => {
    cleanup();
    setFile(f);
    setError('');

    try {
      const image = await loadImage(f);
      const meta = getImageMeta(image, f);
      setImg(image);
      setOriginalMeta(meta);
      setPreviewUrl(image.src);
      setPhase(PHASE.LOADED);
    } catch (err) {
      setError(err?.message || 'Could not load the image file.');
      setPhase(PHASE.ERROR);
    }
  };

  const handleClear = () => {
    cleanup();
  };

  /* Consume staged tool input on mount if navigated from Analyzer */
  useEffect(() => {
    const { file: stagedFile, goal: stagedGoal } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        if (stagedGoal) setSelectedGoal(stagedGoal);
        handleFileSelect(stagedFile);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------- */
  /*  Deterministic Recommendation Calculation                            */
  /* -------------------------------------------------------------------- */
  const recommendation = useMemo(() => {
    if (!originalMeta) return null;

    const parsedMaxWidth = customMaxWidth ? parseInt(customMaxWidth, 10) : null;
    const parsedMaxHeight = customMaxHeight ? parseInt(customMaxHeight, 10) : null;

    return getOptimizationRecommendation(originalMeta, selectedGoal, {
      format: customFormat,
      quality: customQuality !== null ? customQuality : undefined,
      maxWidth: parsedMaxWidth,
      maxHeight: parsedMaxHeight,
    });
  }, [originalMeta, selectedGoal, customFormat, customQuality, customMaxWidth, customMaxHeight]);

  /* -------------------------------------------------------------------- */
  /*  Optimize action                                                     */
  /* -------------------------------------------------------------------- */
  const handleOptimize = async () => {
    if (!img || !originalMeta || !recommendation) return;

    // Check if target format is AVIF and verify browser support
    if (recommendation.targetFormat === 'image/avif') {
      const avifFormat = outputFormats.find((f) => f.value === 'image/avif');
      if (!avifFormat?.isSupported) {
        setError("AVIF output isn't supported by this browser. Choose WebP or JPG instead.");
        return;
      }
    }

    // Safety checks
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

    try {
      const output = await resizeImage(img, {
        width: recommendation.targetWidth,
        height: recommendation.targetHeight,
        outputType: recommendation.targetFormat,
        quality: recommendation.targetQuality / 100,
      });

      setResult(output);
      setPhase(PHASE.DONE);
    } catch (err) {
      setError(err?.message || 'Failed to optimize the image.');
      setPhase(PHASE.ERROR);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Download action                                                     */
  /* -------------------------------------------------------------------- */
  const handleDownload = () => {
    if (!result?.blob || !originalMeta || !recommendation) return;
    const filename = buildOptimizedFilename(
      originalMeta.name,
      result.outputType || recommendation.targetFormat,
      selectedGoal,
    );
    downloadBlob(result.blob, filename);
  };

  /* -------------------------------------------------------------------- */
  /*  Result comparison calculation                                       */
  /* -------------------------------------------------------------------- */
  const _resultComparison = useMemo(() => {
    if (!result || !originalMeta) return null;

    const diffBytes = originalMeta.size - result.blob.size;
    const isSmaller = diffBytes > 0;
    const isLarger = diffBytes < 0;
    const absDiff = Math.abs(diffBytes);
    const percentage = Math.round((absDiff / originalMeta.size) * 100);

    let summaryText = 'Visual quality preserved';
    if (isLarger) {
      summaryText =
        'This version is already smaller in this format. Try another format or stronger optimization.';
    } else if (percentage >= 50) {
      summaryText = 'Significant size reduction · Visual quality preserved';
    } else {
      summaryText = 'Optimized with selected settings';
    }

    return {
      isSmaller,
      isLarger,
      isEqual: diffBytes === 0,
      percentage,
      diffFormatted: formatFileSize(absDiff),
      summaryText,
      badgeLabel: isSmaller
        ? `${percentage}% smaller`
        : isLarger
          ? `${percentage}% larger`
          : 'Same file size',
    };
  }, [result, originalMeta]);

  return (
    <ToolPageLayout
      badge="Smart & Private"
      title="Smart Image Optimizer"
      subtitle="Optimize images based on how you plan to use them. Sensible recommendations, zero complex guesswork."
      content={<OptimizeContent />}
    >
      {/* ================================================================ */}
      {/*  Privacy banner                                                  */}
      {/* ================================================================ */}
      <div className={styles.privacyBanner} role="note">
        <svg
          className={styles.privacyIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>
          Your image stays on your device. Processing happens locally in your browser.
        </span>
      </div>

      {/* ================================================================ */}
      {/*  IDLE — File Uploader                                            */}
      {/* ================================================================ */}
      {phase === PHASE.IDLE && (
        <FileUploader
          onFileSelect={handleFileSelect}
          file={file}
          onClear={handleClear}
          accept={CONVERT_ACCEPT_STRING}
          acceptedTypes={CONVERT_INPUT_TYPES}
          hint="JPG, PNG, WebP, AVIF, GIF, SVG — up to 50 MB"
        />
      )}

      {/* ================================================================ */}
      {/*  ERROR — Message & Retry                                         */}
      {/* ================================================================ */}
      {phase === PHASE.ERROR && (
        <div className={styles.errorBlock} role="alert">
          <p className={styles.errorTitle}>Optimization Error</p>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.btnSecondary} onClick={handleClear}>
            Try another image
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/*  LOADED — Goal selection & Smart recommendations                 */}
      {/* ================================================================ */}
      {phase === PHASE.LOADED && originalMeta && recommendation && (
        <div className={styles.optimizerWorkspace}>
          {/* Section 1: Original Image Overview */}
          <div className={styles.imageHeaderCard}>
            <div className={styles.imageThumbnailWrap}>
              <ImagePreview
                src={previewUrl}
                alt={originalMeta.name}
                className={styles.compactPreview}
              />
            </div>
            <div className={styles.imageDetails}>
              <div className={styles.titleRow}>
                <h2 className={styles.imageFileName} title={originalMeta.name}>
                  {originalMeta.name}
                </h2>
                <button
                  type="button"
                  className={styles.changeImageLink}
                  onClick={handleClear}
                >
                  Change image
                </button>
              </div>
              <div className={styles.badgeRow}>
                <span className={styles.infoPill}>
                  {getFormatLabel(originalMeta.type, originalMeta.name)}
                </span>
                <span className={styles.infoPill}>
                  {originalMeta.width} × {originalMeta.height} px
                </span>
                <span className={styles.infoPill}>
                  {formatFileSize(originalMeta.size)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Ask the user's goal */}
          <section className={styles.goalSection} aria-labelledby="goal-prompt">
            <h3 id="goal-prompt" className={styles.sectionHeading}>
              What are you using this image for?
            </h3>
            <div className={styles.goalsGrid} role="radiogroup" aria-label="Image use case">
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
          </section>

          {/* Section 3: Smart Recommendation Card */}
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

            {/* Parameter chips */}
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
                  {recommendation.targetWidth} × {recommendation.targetHeight} px
                </strong>
              </div>
            </div>

            {/* Pre-optimization Estimate Comparison */}
            <div className={styles.estimateBox}>
              <div className={styles.estimateItem}>
                <span className={styles.estimateLabel}>Original</span>
                <span className={styles.estimateValue}>
                  {formatFileSize(originalMeta.size)}
                </span>
                <span className={styles.estimateSub}>
                  {originalMeta.width} × {originalMeta.height} px
                </span>
              </div>
              <span className={styles.estimateArrow} aria-hidden="true">
                →
              </span>
              <div className={styles.estimateItem}>
                <span className={styles.estimateLabel}>Estimated size</span>
                <span className={styles.estimateValueHighlight}>
                  ~{formatFileSize(recommendation.estimatedBytes)}
                </span>
                <span className={styles.estimateSub}>
                  {recommendation.targetWidth} × {recommendation.targetHeight} px
                </span>
              </div>
            </div>

            {/* Context notices */}
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

            {/* Primary Optimize CTA */}
            <button
              type="button"
              className={styles.btnPrimaryLg}
              onClick={handleOptimize}
              aria-label={`Optimize image for ${recommendation.goalLabel}`}
            >
              Optimize Image
            </button>
          </div>

          {/* Section 4: Advanced settings toggle */}
          <div className={styles.advancedToggleRow}>
            <button
              type="button"
              className={styles.advancedToggleBtn}
              onClick={() => setShowAdvanced((prev) => !prev)}
              aria-expanded={showAdvanced}
              aria-controls="advanced-settings-panel"
            >
              <span>Want more control?</span>
              <strong>{showAdvanced ? 'Hide advanced settings ▴' : 'Advanced settings ▾'}</strong>
            </button>
          </div>

          {/* Section 5: Advanced Settings Panel */}
          {showAdvanced && (
            <div id="advanced-settings-panel" className={styles.advancedPanel}>
              <h4 className={styles.advancedTitle}>Custom Optimization Overrides</h4>

              <div className={styles.advancedGrid}>
                {/* Format selection */}
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
                      Automatic ({getFormatLabel(recommendation.targetFormat)})
                    </option>
                    {outputFormats.map((f) => (
                      <option key={f.value} value={f.value} disabled={!f.isSupported}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quality slider */}
                <div className={styles.controlField}>
                  <div className={styles.sliderHeader}>
                    <label htmlFor="adv-quality" className={styles.fieldLabel}>
                      Quality
                    </label>
                    <span className={styles.qualityNumber}>
                      {recommendation.isTargetLossless
                        ? 'Lossless'
                        : `${customQuality !== null ? customQuality : recommendation.targetQuality}%`}
                    </span>
                  </div>
                  <input
                    id="adv-quality"
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={customQuality !== null ? customQuality : recommendation.targetQuality}
                    onChange={(e) => setCustomQuality(Number(e.target.value))}
                    disabled={recommendation.isTargetLossless}
                    className={styles.rangeInput}
                  />
                  {recommendation.isTargetLossless && (
                    <span className={styles.fieldHint}>
                      PNG quality is always lossless.
                    </span>
                  )}
                </div>

                {/* Maximum Width */}
                <div className={styles.controlField}>
                  <label htmlFor="adv-max-width" className={styles.fieldLabel}>
                    Maximum width (px)
                  </label>
                  <input
                    id="adv-max-width"
                    type="number"
                    min="1"
                    max={MAX_CANVAS_DIMENSION}
                    placeholder={`Auto (${recommendation.targetWidth})`}
                    value={customMaxWidth}
                    onChange={(e) => setCustomMaxWidth(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                {/* Maximum Height */}
                <div className={styles.controlField}>
                  <label htmlFor="adv-max-height" className={styles.fieldLabel}>
                    Maximum height (px)
                  </label>
                  <input
                    id="adv-max-height"
                    type="number"
                    min="1"
                    max={MAX_CANVAS_DIMENSION}
                    placeholder={`Auto (${recommendation.targetHeight})`}
                    value={customMaxHeight}
                    onChange={(e) => setCustomMaxHeight(e.target.value)}
                    className={styles.textInput}
                  />
                </div>
              </div>

              {/* Maintain aspect ratio checkbox */}
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
      )}

      {/* ================================================================ */}
      {/*  OPTIMIZING — spinner                                            */}
      {/* ================================================================ */}
      {phase === PHASE.OPTIMIZING && (
        <div className={styles.spinner} role="status">
          <span className={styles.spinnerDot} />
          <span className={styles.spinnerDot} />
          <span className={styles.spinnerDot} />
          <span className="visually-hidden">Optimizing image…</span>
        </div>
      )}

      {/* ================================================================ */}
      {/*  DONE — results                                                  */}
      {/* ================================================================ */}
      {phase === PHASE.DONE && result && originalMeta && (
        <div className={styles.results}>
          {/* Stats bar */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Original</span>
              <span className={styles.statValue}>{formatFileSize(originalMeta.size)}</span>
            </div>
            <div className={styles.statArrow} aria-hidden="true">
              →
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Optimized</span>
              <span className={styles.statValue}>{formatFileSize(result.blob.size)}</span>
            </div>
            <div
              className={`${styles.statCard} ${reduction > 0 ? styles.statCardSuccess : styles.statCardWarn}`}
            >
              <span className={styles.statLabel}>Reduction</span>
              <span className={styles.statValue}>
                {reduction > 0 ? `${reduction}%` : 'No reduction'}
              </span>
            </div>
          </div>

          {/* Comparison grid */}
          <div className={styles.comparisonGrid}>
            <div className={styles.comparisonCard}>
              <h3 className={styles.cardTitle}>Original</h3>
              <ImagePreview
                src={previewUrl}
                alt={`Original: ${originalMeta.name}`}
                caption={originalMeta.name}
              />
              <dl className={styles.cardMeta}>
                <div className={styles.metaItem}>
                  <dt>Format</dt>
                  <dd>{getFormatLabel(originalMeta.type, originalMeta.name)}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Dimensions</dt>
                  <dd>
                    {originalMeta.width} × {originalMeta.height} px
                  </dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Size</dt>
                  <dd>{formatFileSize(originalMeta.size)}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.comparisonCard}>
              <h3 className={styles.cardTitle}>Optimized</h3>
              <ImagePreview
                src={result.url}
                alt={`Optimized: ${buildOptimizedFilename(originalMeta.name, selectedGoalId, resolvedOutputType)}`}
                caption={buildOptimizedFilename(originalMeta.name, selectedGoalId, resolvedOutputType)}
              />
              <dl className={styles.cardMeta}>
                <div className={styles.metaItem}>
                  <dt>Format</dt>
                  <dd>{getFormatLabel(resolvedOutputType)}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Dimensions</dt>
                  <dd>
                    {result.width} × {result.height} px
                  </dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Size</dt>
                  <dd className={styles.sizeHighlight}>
                    {formatFileSize(result.blob.size)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.actionsRow}>
            <Button
              variant="secondary"
              icon={<IconImagePlus />}
              onClick={handleClear}
              aria-label="Optimize another image"
            >
              Optimize Another Image
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon={<IconDownload />}
              onClick={handleDownload}
              aria-label="Download optimized image"
            >
              Download Image
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}

export default OptimizePage;
