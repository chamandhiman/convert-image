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
  getSupportedOutputFormats,
  getFormatLabel,
  loadImage,
  getImageMeta,
  convertImage,
  buildConvertedFilename,
  downloadBlob,
} from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import ConvertContent from './ConvertContent';
import styles from './ConvertPage.module.css';

/* ---------------------------------------------------------------------- */
/*  State machine phases                                                  */
/* ---------------------------------------------------------------------- */
const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  CONVERTING: 'converting',
  DONE: 'done',
  ERROR: 'error',
};

function ConvertPage() {
  useDocumentTitle('Convert Images Online — JPG, PNG, WebP & More');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  /* Supported output formats detected from browser */
  const outputFormats = useMemo(() => getSupportedOutputFormats(), []);

  /* Conversion settings */
  const [outputFormat, setOutputFormat] = useState('image/webp');
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

      // Default target format: if source is already WebP, suggest JPG; otherwise WebP
      const isSourceWebp = f.type === 'image/webp' || f.name.toLowerCase().endsWith('.webp');
      setOutputFormat(isSourceWebp ? 'image/jpeg' : 'image/webp');

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
  /*  Convert action                                                      */
  /* -------------------------------------------------------------------- */
  const handleConvert = async () => {
    if (!img) return;

    setPhase(PHASE.CONVERTING);
    setError('');

    try {
      const output = await convertImage(img, {
        outputType: outputFormat,
        quality: quality / 100,
      });
      setResult(output);
      setPhase(PHASE.DONE);
    } catch (err) {
      setError(err?.message || 'Failed to convert the image.');
      setPhase(PHASE.ERROR);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Download action                                                     */
  /* -------------------------------------------------------------------- */
  const handleDownload = () => {
    if (!result?.blob || !originalMeta) return;
    const filename = buildConvertedFilename(originalMeta.name, outputFormat);
    downloadBlob(result.blob, filename);
  };

  /* -------------------------------------------------------------------- */
  /*  Computed properties                                                 */
  /* -------------------------------------------------------------------- */
  const selectedFormatObj = outputFormats.find((f) => f.value === outputFormat);
  const isLossy = selectedFormatObj ? selectedFormatObj.lossy : outputFormat !== 'image/png';

  /* Comparison stats */
  let sizeComparison = null;
  if (result && originalMeta) {
    const diff = result.blob.size - originalMeta.size;
    const isSmaller = diff < 0;
    const absDiff = Math.abs(diff);
    const percentage = Math.abs(Math.round((diff / originalMeta.size) * 100));

    sizeComparison = {
      isSmaller,
      isEqual: diff === 0,
      percentage,
      diffFormatted: formatFileSize(absDiff),
      label:
        diff === 0
          ? 'Same size'
          : isSmaller
            ? `${percentage}% smaller (-${formatFileSize(absDiff)})`
            : `${percentage}% larger (+${formatFileSize(absDiff)})`,
    };
  }

  return (
    <ToolPageLayout
      badge="Free · In-Browser"
      title="Convert Images Online"
      subtitle="Convert JPG, PNG, WebP, AVIF, GIF and SVG images locally in your browser. Fast, free and completely private."
      content={<ConvertContent />}
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
        <span>Your image stays on your device. Conversion happens in your browser.</span>
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
          <p className={styles.errorTitle}>Conversion Error</p>
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
          {/* Original Preview & Details */}
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
                <dt>Input format</dt>
                <dd>
                  <span className={styles.formatBadge}>
                    {getFormatLabel(originalMeta.type, originalMeta.name)}
                  </span>
                </dd>
              </div>
              <div className={styles.metaItem}>
                <dt>File size</dt>
                <dd>{formatFileSize(originalMeta.size)}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>Dimensions</dt>
                <dd>
                  {originalMeta.width} × {originalMeta.height} px
                </dd>
              </div>
            </dl>

            {/* SVG Notice */}
            {originalMeta.isSvg && (
              <div className={styles.svgNotice}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>
                  Converting SVG to a raster format (JPG, PNG, WebP) will render the vector artwork
                  into fixed pixels.
                </span>
              </div>
            )}
          </div>

          {/* Conversion Settings */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Conversion Settings</h2>
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="target-format">
                Target Format
              </label>
              <select
                id="target-format"
                className={styles.select}
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
              >
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
                <label className={styles.controlLabel} htmlFor="convert-quality-slider">
                  Quality
                </label>
                <output className={styles.qualityValue} htmlFor="convert-quality-slider">
                  {isLossy ? `${quality}%` : 'Lossless'}
                </output>
              </div>

              <input
                id="convert-quality-slider"
                type="range"
                min="10"
                max="100"
                step="1"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className={styles.slider}
                disabled={!isLossy}
                aria-describedby={!isLossy ? 'png-quality-note' : undefined}
              />

              {!isLossy && (
                <p id="png-quality-note" className={styles.controlHint}>
                  PNG uses lossless compression — quality setting does not apply.
                </p>
              )}
            </div>

            {/* Format Info Note */}
            <div className={styles.formatSummary}>
              <p className={styles.formatSummaryText}>
                Converting <strong>{getFormatLabel(originalMeta.type, originalMeta.name)}</strong> to{' '}
                <strong>{getFormatLabel(outputFormat)}</strong>
                {outputFormat === 'image/jpeg' &&
                  originalMeta.type !== 'image/jpeg' &&
                  ' (transparent backgrounds will be filled with white).'}
              </p>
            </div>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleConvert}
              aria-label={`Convert image to ${getFormatLabel(outputFormat)}`}
            >
              Convert Image
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  CONVERTING — progress indicator                                 */}
      {/* ================================================================ */}
      {phase === PHASE.CONVERTING && (
        <div className={styles.convertingState} role="status" aria-live="polite">
          <div className={styles.spinner}>
            <span className={styles.spinnerDot} />
            <span className={styles.spinnerDot} />
            <span className={styles.spinnerDot} />
          </div>
          <p className={styles.convertingText}>
            Converting image to {getFormatLabel(outputFormat)}…
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/*  DONE — before / after comparison results                        */}
      {/* ================================================================ */}
      {phase === PHASE.DONE && result && originalMeta && (
        <div className={styles.resultsWrapper} aria-label="Conversion results">
          {/* Summary Card */}
          {sizeComparison && (
            <div className={styles.summaryBar}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Original</span>
                <span className={styles.summaryValue}>
                  {formatFileSize(originalMeta.size)} ({getFormatLabel(originalMeta.type, originalMeta.name)})
                </span>
              </div>
              <span className={styles.summaryArrow} aria-hidden="true">
                →
              </span>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Converted</span>
                <span className={styles.summaryValue}>
                  {formatFileSize(result.blob.size)} ({getFormatLabel(outputFormat)})
                </span>
              </div>
              <div
                className={`${styles.reductionBadge} ${
                  sizeComparison.isSmaller ? styles.badgeSuccess : styles.badgeWarn
                }`}
              >
                {sizeComparison.label}
              </div>
            </div>
          )}

          {/* Before & After Comparison Grid */}
          <div className={styles.comparisonGrid}>
            {/* Before Card */}
            {/* Original Card */}
            <div className={styles.card}>
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
                  <dt>Size</dt>
                  <dd>{formatFileSize(originalMeta.size)}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Dimensions</dt>
                  <dd>
                    {originalMeta.width} × {originalMeta.height} px
                  </dd>
                </div>
              </dl>
            </div>

            {/* Converted Card */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Converted</h3>
              <ImagePreview
                src={result.url}
                alt={`Converted: ${buildConvertedFilename(originalMeta.name, outputFormat)}`}
                caption={buildConvertedFilename(originalMeta.name, outputFormat)}
              />
              <dl className={styles.cardMeta}>
                <div className={styles.metaItem}>
                  <dt>Format</dt>
                  <dd>{getFormatLabel(outputFormat)}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Size</dt>
                  <dd>{formatFileSize(result.blob.size)}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Dimensions</dt>
                  <dd>
                    {result.width} × {result.height} px
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
              aria-label="Convert another image"
            >
              Convert Another Image
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon={<IconDownload />}
              onClick={handleDownload}
              aria-label={`Download ${buildConvertedFilename(originalMeta.name, outputFormat)}`}
            >
              Download Image
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}

export default ConvertPage;
