import { useState, useMemo, useEffect } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import ImagePreview from '@/components/ui/ImagePreview';
import { Button } from '@/components/ui/Button';
import { IconCrop, IconDownload, IconImagePlus } from '@/components/ui/Icons/Icons';
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
  calculateDimensions,
  resizeImage,
  buildResizedFilename,
  downloadBlob,
} from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import ResizeContent from './ResizeContent';
import styles from './ResizePage.module.css';

/* ---------------------------------------------------------------------- */
/*  State machine phases                                                  */
/* ---------------------------------------------------------------------- */
const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  RESIZING: 'resizing',
  DONE: 'done',
  ERROR: 'error',
};

const PERCENTAGE_PRESETS = [25, 50, 75, 100, 125, 150, 200];

function ResizePage() {
  useDocumentTitle('Resize Images Online — Change Image Dimensions');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  /* Resize mode: 'dimensions' or 'percentage' */
  const [mode, setMode] = useState('dimensions');

  /* Dimension mode states */
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  /* Percentage mode states */
  const [percentage, setPercentage] = useState(100);

  /* Output format & quality */
  const outputFormats = useMemo(() => getSupportedOutputFormats(), []);
  const [outputFormat, setOutputFormat] = useState('original');
  const [quality, setQuality] = useState(85);

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

      // Initialize dimensions to original values
      setTargetWidth(meta.width);
      setTargetHeight(meta.height);
      setPercentage(100);
      setLockAspectRatio(true);
      setOutputFormat('original');
      setMode('dimensions');

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
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        handleFileSelect(stagedFile);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------- */
  /*  Dimension changes (Mode A)                                          */
  /* -------------------------------------------------------------------- */
  const handleWidthChange = (value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setTargetWidth(num);

    if (lockAspectRatio && originalMeta && num > 0) {
      const dims = calculateDimensions(originalMeta.width, originalMeta.height, {
        mode: 'dimensions',
        width: num,
        lockAspectRatio: true,
        changedField: 'width',
      });
      setTargetHeight(dims.height);
    }
  };

  const handleHeightChange = (value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setTargetHeight(num);

    if (lockAspectRatio && originalMeta && num > 0) {
      const dims = calculateDimensions(originalMeta.width, originalMeta.height, {
        mode: 'dimensions',
        height: num,
        lockAspectRatio: true,
        changedField: 'height',
      });
      setTargetWidth(dims.width);
    }
  };

  const handleToggleLock = () => {
    setLockAspectRatio((prev) => {
      const next = !prev;
      // When locking again, snap height to width aspect ratio
      if (next && originalMeta && targetWidth > 0) {
        const dims = calculateDimensions(originalMeta.width, originalMeta.height, {
          mode: 'dimensions',
          width: targetWidth,
          lockAspectRatio: true,
          changedField: 'width',
        });
        setTargetHeight(dims.height);
      }
      return next;
    });
  };

  /* -------------------------------------------------------------------- */
  /*  Percentage changes (Mode B)                                         */
  /* -------------------------------------------------------------------- */
  const handlePercentageSelect = (pct) => {
    setPercentage(pct);
    if (originalMeta) {
      const dims = calculateDimensions(originalMeta.width, originalMeta.height, {
        mode: 'percentage',
        percentage: pct,
      });
      setTargetWidth(dims.width);
      setTargetHeight(dims.height);
    }
  };

  const handleCustomPercentageChange = (value) => {
    const num = Math.max(1, Math.min(1000, parseInt(value, 10) || 1));
    handlePercentageSelect(num);
  };

  /* -------------------------------------------------------------------- */
  /*  Mode Switcher                                                       */
  /* -------------------------------------------------------------------- */
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    if (newMode === 'percentage' && originalMeta) {
      // Sync percentage to current targetWidth if proportional
      const calculatedPct = Math.round((targetWidth / originalMeta.width) * 100);
      setPercentage(calculatedPct > 0 ? calculatedPct : 100);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Reset dimensions to original                                        */
  /* -------------------------------------------------------------------- */
  const handleResetDimensions = () => {
    if (originalMeta) {
      setTargetWidth(originalMeta.width);
      setTargetHeight(originalMeta.height);
      setPercentage(100);
      setLockAspectRatio(true);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Resolved MIME type for export                                       */
  /* -------------------------------------------------------------------- */
  const resolvedOutputType = useMemo(() => {
    if (outputFormat === 'original' && originalMeta) {
      // If original is SVG, canvas must export to PNG (lossless) or user can choose format
      if (originalMeta.isSvg) return 'image/png';
      // If original format is supported by browser, use it
      const match = outputFormats.find((f) => f.value === originalMeta.type && f.isSupported);
      if (match) return match.value;
      // Default to WebP or JPEG
      return 'image/jpeg';
    }
    return outputFormat;
  }, [outputFormat, originalMeta, outputFormats]);

  const selectedFormatObj = outputFormats.find((f) => f.value === resolvedOutputType);
  const isLossy = selectedFormatObj ? selectedFormatObj.lossy : resolvedOutputType !== 'image/png';

  /* -------------------------------------------------------------------- */
  /*  Resize action                                                       */
  /* -------------------------------------------------------------------- */
  const handleResize = async () => {
    if (!img || !originalMeta) return;

    // Validation
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

    setPhase(PHASE.RESIZING);
    setError('');

    try {
      const output = await resizeImage(img, {
        width: targetWidth,
        height: targetHeight,
        outputType: resolvedOutputType,
        quality: quality / 100,
      });
      setResult(output);
      setPhase(PHASE.DONE);
    } catch (err) {
      setError(err?.message || 'Failed to resize the image.');
      setPhase(PHASE.ERROR);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Download action                                                     */
  /* -------------------------------------------------------------------- */
  const handleDownload = () => {
    if (!result?.blob || !originalMeta) return;
    const filename = buildResizedFilename(
      originalMeta.name,
      resolvedOutputType,
      result.width,
      result.height,
    );
    downloadBlob(result.blob, filename);
  };

  /* -------------------------------------------------------------------- */
  /*  Comparison computations                                             */
  /* -------------------------------------------------------------------- */
  let _dimensionComparison = null;
  if (result && originalMeta) {
    const origArea = originalMeta.width * originalMeta.height;
    const newArea = result.width * result.height;
    const areaRatio = newArea / origArea;
    const isSmaller = newArea < origArea;
    const percentageChange = Math.abs(Math.round((1 - areaRatio) * 100));

    _dimensionComparison = {
      isSmaller,
      isEqual: newArea === origArea,
      percentageChange,
      label:
        newArea === origArea
          ? 'Identical dimensions'
          : isSmaller
            ? `${percentageChange}% smaller area`
            : `${Math.round((areaRatio - 1) * 100)}% larger area`,
    };
  }

  return (
    <ToolPageLayout
      badge="Free · In-Browser"
      title="Resize Images Online"
      subtitle="Change image dimensions by exact pixels or percentage while maintaining aspect ratio. 100% private in your browser."
      content={<ResizeContent />}
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
        <span>Your image stays on your device. Resizing happens in your browser.</span>
      </div>

      {/* ================================================================ */}
      {/*  IDLE — file uploader                                            */}
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
      {/*  ERROR — show message + retry                                    */}
      {/* ================================================================ */}
      {phase === PHASE.ERROR && (
        <div className={styles.errorBlock} role="alert">
          <p className={styles.errorTitle}>Error</p>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.btnSecondary} onClick={handleClear}>
            Try another image
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/*  LOADED — workspace                                              */}
      {/* ================================================================ */}
      {phase === PHASE.LOADED && originalMeta && (
        <div className={styles.workspace}>
          {/* Original Preview & Info */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Original Image</h2>
              <button
                type="button"
                className={styles.replaceBtn}
                onClick={handleClear}
                aria-label="Remove and replace image"
              >
                Change image
              </button>
            </div>

            <div className={styles.previewBox}>
              <ImagePreview
                src={previewUrl}
                alt={originalMeta.name}
                className={styles.sourcePreview}
              />
            </div>

            <dl className={styles.metaList}>
              <div className={styles.metaItem}>
                <dt>File name</dt>
                <dd className={styles.truncateText} title={originalMeta.name}>
                  {originalMeta.name}
                </dd>
              </div>
              <div className={styles.metaItem}>
                <dt>Original dimensions</dt>
                <dd className={styles.dimensionBadge}>
                  {originalMeta.width} × {originalMeta.height} px
                </dd>
              </div>
              <div className={styles.metaItem}>
                <dt>File size</dt>
                <dd>{formatFileSize(originalMeta.size)}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>Format</dt>
                <dd>
                  <span className={styles.formatBadge}>
                    {getFormatLabel(originalMeta.type, originalMeta.name)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Resize Controls */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Resize Controls</h2>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleResetDimensions}
                title="Reset to original dimensions"
              >
                Reset
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className={styles.modeTabs} role="tablist" aria-label="Resize mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'dimensions'}
                className={`${styles.modeTab} ${mode === 'dimensions' ? styles.modeTabActive : ''}`}
                onClick={() => handleModeSwitch('dimensions')}
              >
                Custom Dimensions (px)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'percentage'}
                className={`${styles.modeTab} ${mode === 'percentage' ? styles.modeTabActive : ''}`}
                onClick={() => handleModeSwitch('percentage')}
              >
                Percentage (%)
              </button>
            </div>

            {/* MODE A: Exact Dimensions */}
            {mode === 'dimensions' && (
              <div className={styles.controlsGroup}>
                <div className={styles.dimensionsRow}>
                  <div className={styles.dimensionField}>
                    <label className={styles.fieldLabel} htmlFor="resize-width">
                      Width (px)
                    </label>
                    <div className={styles.inputWithSuffix}>
                      <input
                        id="resize-width"
                        type="number"
                        min="1"
                        max={MAX_CANVAS_DIMENSION}
                        value={targetWidth || ''}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        className={styles.numberInput}
                      />
                      <span className={styles.inputSuffix}>px</span>
                    </div>
                  </div>

                  {/* Aspect ratio lock button */}
                  <div className={styles.lockContainer}>
                    <button
                      type="button"
                      onClick={handleToggleLock}
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
                    <span className={styles.lockText}>
                      {lockAspectRatio ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>

                  <div className={styles.dimensionField}>
                    <label className={styles.fieldLabel} htmlFor="resize-height">
                      Height (px)
                    </label>
                    <div className={styles.inputWithSuffix}>
                      <input
                        id="resize-height"
                        type="number"
                        min="1"
                        max={MAX_CANVAS_DIMENSION}
                        value={targetHeight || ''}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        className={styles.numberInput}
                      />
                      <span className={styles.inputSuffix}>px</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODE B: Percentage */}
            {mode === 'percentage' && (
              <div className={styles.controlsGroup}>
                <label className={styles.fieldLabel} htmlFor="custom-percentage">
                  Scale Percentage
                </label>

                {/* Preset Chips */}
                <div className={styles.presetGrid} role="group" aria-label="Scale presets">
                  {PERCENTAGE_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className={`${styles.presetBtn} ${
                        percentage === pct ? styles.presetBtnActive : ''
                      }`}
                      onClick={() => handlePercentageSelect(pct)}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <div className={styles.customPctRow}>
                  <div className={styles.inputWithSuffix}>
                    <input
                      id="custom-percentage"
                      type="number"
                      min="1"
                      max="1000"
                      value={percentage}
                      onChange={(e) => handleCustomPercentageChange(e.target.value)}
                      className={styles.numberInput}
                    />
                    <span className={styles.inputSuffix}>%</span>
                  </div>
                  <span className={styles.pctResultPreview}>
                    Result: <strong>{targetWidth} × {targetHeight} px</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Output Format Settings */}
            <div className={styles.controlGroup}>
              <label className={styles.fieldLabel} htmlFor="output-format-select">
                Output Format
              </label>
              <select
                id="output-format-select"
                className={styles.select}
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
              >
                <option value="original">
                  Keep original ({getFormatLabel(originalMeta.type, originalMeta.name)})
                </option>
                {outputFormats.map((f) => (
                  <option key={f.value} value={f.value} disabled={!f.isSupported}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Slider (Lossy formats) */}
            <div className={styles.controlGroup}>
              <div className={styles.sliderHeader}>
                <label className={styles.fieldLabel} htmlFor="resize-quality-slider">
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
                aria-describedby={!isLossy ? 'lossless-quality-note' : undefined}
              />

              {!isLossy && (
                <p id="lossless-quality-note" className={styles.controlHint}>
                  PNG uses lossless compression — quality setting does not apply.
                </p>
              )}
            </div>

            {/* Action Button */}
            <Button
              variant="primary"
              size="lg"
              icon={<IconCrop />}
              onClick={handleResize}
              aria-label={`Resize image to ${targetWidth} by ${targetHeight} pixels`}
            >
              Resize Image
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  RESIZING — progress indicator                                   */}
      {/* ================================================================ */}
      {phase === PHASE.RESIZING && (
        <div className={styles.resizingState} role="status" aria-live="polite">
          <div className={styles.spinner}>
            <span className={styles.spinnerDot} />
            <span className={styles.spinnerDot} />
            <span className={styles.spinnerDot} />
          </div>
          <p className={styles.resizingText}>Resizing image…</p>
        </div>
      )}

      {/* ================================================================ */}
      {/*  DONE — result comparison & download                              */}
      {/* ================================================================ */}
      {phase === PHASE.DONE && result && originalMeta && (
        <div className={styles.results}>
          <div className={styles.comparisonGrid}>
            {/* Before Card */}
            <div className={styles.comparisonCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>Before</span>
                <h3 className={styles.cardTitle}>Original</h3>
              </div>
              <div className={styles.comparisonPreviewBox}>
                <ImagePreview
                  src={previewUrl}
                  alt={`Original: ${originalMeta.name}`}
                  className={styles.comparisonImg}
                />
              </div>
              <dl className={styles.cardMetaList}>
                <div className={styles.cardMetaItem}>
                  <dt>Dimensions</dt>
                  <dd>
                    {originalMeta.width} × {originalMeta.height} px
                  </dd>
                </div>
                <div className={styles.cardMetaItem}>
                  <dt>File size</dt>
                  <dd>{formatFileSize(originalMeta.size)}</dd>
                </div>
                <div className={styles.cardMetaItem}>
                  <dt>Format</dt>
                  <dd>{getFormatLabel(originalMeta.type, originalMeta.name)}</dd>
                </div>
              </dl>
            </div>

            {/* After Card */}
            <div className={styles.comparisonCard}>
              <div className={styles.cardHeader}>
                <span className={`${styles.cardBadge} ${styles.cardBadgeActive}`}>After</span>
                <h3 className={styles.cardTitle}>Resized</h3>
              </div>
              <div className={styles.comparisonPreviewBox}>
                <ImagePreview
                  src={result.url}
                  alt={`Resized: ${buildResizedFilename(originalMeta.name, result.width, result.height, resolvedOutputType)}`}
                  className={styles.comparisonImg}
                />
              </div>
              <dl className={styles.cardMetaList}>
                <div className={styles.cardMetaItem}>
                  <dt>Dimensions</dt>
                  <dd className={styles.highlightedDim}>
                    {result.width} × {result.height} px
                  </dd>
                </div>
                <div className={styles.cardMetaItem}>
                  <dt>File size</dt>
                  <dd>{formatFileSize(result.blob.size)}</dd>
                </div>
                <div className={styles.cardMetaItem}>
                  <dt>Format</dt>
                  <dd>
                    <span className={styles.formatBadge}>{getFormatLabel(resolvedOutputType)}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <Button
              variant="secondary"
              icon={<IconImagePlus />}
              onClick={handleClear}
              aria-label="Resize another image"
            >
              Resize Another Image
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon={<IconDownload />}
              onClick={handleDownload}
              aria-label={`Download resized image ${result.width} by ${result.height}`}
            >
              Download Image
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}

export default ResizePage;
