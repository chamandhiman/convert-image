import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ROUTES } from '@/routes/paths';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import ImagePreview from '@/components/ui/ImagePreview';
import { Button } from '@/components/ui/Button';
import { IconDownload, IconImagePlus } from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  loadImage,
  getImageMeta,
  downloadBlob,
} from '@/utils/imageProcessor';
import {
  upscaleImage,
  cancelUpscaling,
  checkImageSafety,
  buildUpscaledFilename,
} from '@/tools/upscaler/imageUpscaler';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import sampleMountainImg from '@/assets/images/sample-mountain.jpg';
import ImageUpscalerContent from './ImageUpscalerContent';
import styles from './ImageUpscalerPage.module.css';

/* ---------------------------------------------------------------------- */
/*  Supported input types                                                 */
/* ---------------------------------------------------------------------- */
const UPSCALER_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPSCALER_ACCEPT_STRING = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/* ---------------------------------------------------------------------- */
/*  State machine phases                                                  */
/* ---------------------------------------------------------------------- */
const PHASE = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  PROCESSING: 'processing',
  SAFETY_BLOCK: 'safety_block',
  DONE: 'done',
  ERROR: 'error',
};

function ImageUpscalerPage({ embedded, embeddedOnly }) {
  useDocumentTitle('Image Upscaler — AI Super-Resolution 2× & 4× | Convert Image');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [imgElement, setImgElement] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  /* Upscaler Options: default is 2x (Recommended) */
  const [scaleFactor, setScaleFactor] = useState(2);

  /* Safety & Large image details */
  const [safetyInfo, setSafetyInfo] = useState(null);

  /* Progress status */
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  /* Results */
  const [upscaledBlob, setUpscaledBlob] = useState(null);
  const [upscaledUrl, setUpscaledUrl] = useState('');
  const [upscaledDims, setUpscaledDims] = useState(null);
  const [executionBackend, setExecutionBackend] = useState('');
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  /* Interactive Before/After Split Slider position for Result (0 to 100%) */
  const [sliderPos, setSliderPos] = useState(50);
  const isDraggingRef = useRef(false);
  const comparisonWrapRef = useRef(null);

  /* Interactive Before/After Split Slider position for Empty State (0 to 100%) */
  const [emptySliderPos, setEmptySliderPos] = useState(50);
  const isEmptyDraggingRef = useRef(false);
  const emptyViewerRef = useRef(null);

  /* Drag & Drop UI State */
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [error, setError] = useState('');

  /* -------------------------------------------------------------------- */
  /*  Cleanup helper                                                      */
  /* -------------------------------------------------------------------- */
  const cleanup = () => {
    cancelUpscaling();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (upscaledUrl) URL.revokeObjectURL(upscaledUrl);

    setFile(null);
    setImgElement(null);
    setOriginalMeta(null);
    setPreviewUrl('');
    setSafetyInfo(null);
    setUpscaledBlob(null);
    setUpscaledUrl('');
    setUpscaledDims(null);
    setExecutionBackend('');
    setProcessingTimeMs(0);
    setProgressPercent(0);
    setProgressMessage('');
    setError('');
    setPhase(PHASE.IDLE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Cancel active in-flight upscale                                     */
  /* -------------------------------------------------------------------- */
  const handleCancel = () => {
    cleanup();
  };

  /* -------------------------------------------------------------------- */
  /*  Handle File Selection                                               */
  /* -------------------------------------------------------------------- */
  const handleFileSelect = async (f) => {
    if (!f) return;

    // File format check
    const isValidType = UPSCALER_INPUT_TYPES.includes(f.type) ||
      /\.(jpe?g|png|webp)$/i.test(f.name);
    if (!isValidType) {
      setError('Please select a valid image file (JPG, PNG, or WebP).');
      setPhase(PHASE.ERROR);
      return;
    }

    // File size check (50 MB limit)
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError('File size exceeds the 50 MB limit. Please select a smaller image.');
      setPhase(PHASE.ERROR);
      return;
    }

    cleanup();
    setFile(f);
    setError('');

    try {
      const image = await loadImage(f);
      const meta = getImageMeta(image, f);
      setImgElement(image);
      setOriginalMeta(meta);
      setPreviewUrl(image.src);

      // Check safety before starting inference
      const safety = checkImageSafety(meta.width, meta.height, scaleFactor);
      setSafetyInfo(safety);

      if (!safety.isSafe) {
        setPhase(PHASE.SAFETY_BLOCK);
        return;
      }

      await runUpscale(image, f, scaleFactor);
    } catch (err) {
      console.error('[Upscaler Page Error]:', err);
      setError(err?.message || "Upscaling couldn't be completed.");
      setPhase(PHASE.ERROR);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Run Upscale Processing                                              */
  /* -------------------------------------------------------------------- */
  const runUpscale = async (image, sourceFile, factor) => {
    // Safety verification
    const safety = checkImageSafety(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      factor
    );
    setSafetyInfo(safety);

    if (!safety.isSafe) {
      setPhase(PHASE.SAFETY_BLOCK);
      return;
    }

    setPhase(PHASE.PREPARING);
    setProgressPercent(0);
    setProgressMessage('Preparing neural upscaler in your browser…');

    try {
      const outputType = sourceFile.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';

      const result = await upscaleImage(image, {
        scale: factor,
        outputType,
        quality: 0.92,
        onProgress: ({ stage, percent, message }) => {
          if (stage === 'loading-model') {
            setPhase(PHASE.PREPARING);
          } else {
            setPhase(PHASE.PROCESSING);
          }
          setProgressPercent(percent);
          setProgressMessage(message);
        },
      });

      const url = URL.createObjectURL(result.blob);
      setUpscaledBlob(result.blob);
      setUpscaledUrl(url);
      setUpscaledDims({ width: result.width, height: result.height });
      setExecutionBackend(result.executionProvider);
      setProcessingTimeMs(result.processingTimeMs);
      setSliderPos(50);
      setPhase(PHASE.DONE);
    } catch (err) {
      console.error('[Upscaler Inference Error]:', err);
      setError(
        err?.message ||
          "Upscaling couldn't be completed. Please check device memory and try again."
      );
      setPhase(PHASE.ERROR);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Change scale factor on already loaded image                         */
  /* -------------------------------------------------------------------- */
  const handleScaleChange = async (newFactor) => {
    if (newFactor === scaleFactor) return;
    setScaleFactor(newFactor);

    if (imgElement && file) {
      if (upscaledUrl) URL.revokeObjectURL(upscaledUrl);
      setUpscaledBlob(null);
      setUpscaledUrl('');
      await runUpscale(imgElement, file, newFactor);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Consume staged input on mount if navigated from another tool        */
  /* -------------------------------------------------------------------- */
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
  /*  Interactive Before / After Slider Drag Handling for Result View     */
  /* -------------------------------------------------------------------- */
  const updateSliderPos = useCallback((clientX) => {
    if (!comparisonWrapRef.current) return;
    const rect = comparisonWrapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  }, []);

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    updateSliderPos(e.clientX);
  };

  /* -------------------------------------------------------------------- */
  /*  Interactive Before / After Slider Drag Handling for Empty State     */
  /* -------------------------------------------------------------------- */
  const updateEmptySliderPos = useCallback((clientX) => {
    if (!emptyViewerRef.current) return;
    const rect = emptyViewerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setEmptySliderPos(percent);
  }, []);

  const handleEmptyPointerDown = (e) => {
    isEmptyDraggingRef.current = true;
    updateEmptySliderPos(e.clientX);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (isDraggingRef.current) updateSliderPos(e.clientX);
      if (isEmptyDraggingRef.current) updateEmptySliderPos(e.clientX);
    };
    const onUp = () => {
      isDraggingRef.current = false;
      isEmptyDraggingRef.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updateSliderPos, updateEmptySliderPos]);

  /* -------------------------------------------------------------------- */
  /*  File Picker Trigger & Drag-and-Drop Handlers                        */
  /* -------------------------------------------------------------------- */
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer?.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Download Result                                                     */
  /* -------------------------------------------------------------------- */
  const handleDownload = () => {
    if (!upscaledBlob || !originalMeta) return;
    const outputType = file?.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const filename = buildUpscaledFilename(originalMeta.name, scaleFactor, outputType);
    downloadBlob(upscaledBlob, filename);
  };

  /* -------------------------------------------------------------------- */
  /*  Result metadata                                                     */
  /* -------------------------------------------------------------------- */
  const resultMeta = useMemo(() => {
    if (!upscaledBlob || !upscaledDims) return null;
    return {
      sizeFormatted: formatFileSize(upscaledBlob.size),
      width: upscaledDims.width,
      height: upscaledDims.height,
      timeFormatted: (processingTimeMs / 1000).toFixed(1) + 's',
      backend: executionBackend,
    };
  }, [upscaledBlob, upscaledDims, processingTimeMs, executionBackend]);

  return (
    <ToolPageLayout
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      content={<ImageUpscalerContent />}
      contentFullWidth
      showHero={false}
    >
      <div id="tool" className={styles.upscalerRoot} data-testid="upscaler-container">
        {/* ================================================================ */}
        {/*  CUSTOM HERO HEADER — Icon, Title, Subtitle, and 4 Pill Badges   */}
        {/* ================================================================ */}
        <header className={styles.heroHeader}>
          <div className={styles.titleRow}>
            <div className={styles.appIconBadge} aria-hidden="true" data-testid="app-icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="3" ry="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-4-4-5 5" />
                <path d="M14 6l3-3 3 3" />
                <path d="M17 3v7" />
              </svg>
            </div>
            <h1 className={styles.heroTitle} data-testid="upscaler-heading">
              <span className={styles.heroTitleDark}>Image </span>
              <span className={styles.heroTitleGradient}>Upscaler</span>
            </h1>
          </div>
          <p className={styles.heroSubtitle}>
            Increase image resolution and recover sharper details directly in your browser.
          </p>

          <div className={styles.pillRow} role="list" aria-label="Tool benefits">
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">⚡</span>
              <span>Higher Resolution</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">✨</span>
              <span>Restore Details</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">🛡️</span>
              <span>100% Private</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">💻</span>
              <span>Runs in Browser</span>
            </div>
          </div>
        </header>

        {/* ================================================================ */}
        {/*  PREMIUM MAIN WORKSPACE CARD (Two-Column Layout)                 */}
        {/* ================================================================ */}
        <div className={styles.workspaceCard} data-testid="workspace-card">
          {/* ============================================================== */}
          {/*  LEFT COLUMN — Interactive Before/After Preview                */}
          {/* ============================================================== */}
          <div className={styles.previewCol} data-testid="preview-column">
            {/* Sparkle burst decoration above the preview frame */}
            <div className={styles.sparkleAccent} aria-hidden="true" data-testid="sparkle-accent">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="2" x2="12" y2="8" />
                <line x1="4" y1="5" x2="8" y2="10" />
                <line x1="20" y1="5" x2="16" y2="10" />
              </svg>
            </div>

            {/* EMPTY STATE / IDLE: Interactive Mountain Comparison */}
            {phase === PHASE.IDLE && (
              <div
                ref={emptyViewerRef}
                className={styles.splitViewer}
                onPointerDown={handleEmptyPointerDown}
                data-testid="sample-split-viewer"
                title="Drag divider to compare original and upscaled"
              >
                {/* Background: Upscaled (Sharp, full width) */}
                <img
                  src={sampleMountainImg}
                  alt="Upscaled Preview (Sample)"
                  className={styles.upscaledLayer}
                />
                <span className={styles.badgeRight} data-testid="badge-upscaled">
                  Upscaled (4×)
                </span>

                {/* Foreground: Original (Simulated softer original, clipped by slider) */}
                <img
                  src={sampleMountainImg}
                  alt="Original Preview (Sample)"
                  className={styles.originalLayerSoft}
                  style={{
                    clipPath: `inset(0 ${100 - emptySliderPos}% 0 0)`,
                    WebkitClipPath: `inset(0 ${100 - emptySliderPos}% 0 0)`,
                  }}
                />
                <span
                  className={styles.badgeLeft}
                  data-testid="badge-original"
                  style={{ opacity: emptySliderPos > 12 ? 1 : 0 }}
                >
                  Original
                </span>

                {/* Draggable Divider Handle */}
                <div
                  className={styles.sliderHandle}
                  style={{ left: `${emptySliderPos}%` }}
                  aria-label="Drag before and after divider"
                  data-testid="slider-handle"
                >
                  <div className={styles.handleLine} />
                  <div className={styles.handleButton}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* PREPARING & PROCESSING: Uploaded Image Preview */}
            {(phase === PHASE.PREPARING || phase === PHASE.PROCESSING) && originalMeta && (
              <div className={styles.processingPreviewWrap}>
                <span className={styles.badgeOriginalStatic}>Original Photo</span>
                <ImagePreview
                  src={previewUrl}
                  alt={originalMeta.name}
                  className={styles.uploadedPreviewImg}
                />
              </div>
            )}

            {/* DONE: Real Interactive Before/After Split Comparison */}
            {phase === PHASE.DONE && upscaledUrl && originalMeta && (
              <div
                ref={comparisonWrapRef}
                className={styles.splitViewer}
                onPointerDown={handlePointerDown}
                data-testid="result-split-viewer"
                title="Drag divider to inspect AI enhancement"
              >
                {/* Background: Upscaled (Full width) */}
                <img
                  src={upscaledUrl}
                  alt={`AI Upscaled: ${originalMeta.name}`}
                  className={styles.upscaledLayer}
                />
                <span className={styles.badgeRight} data-testid="badge-upscaled-real">
                  {scaleFactor}&times; AI Upscaled
                </span>

                {/* Foreground: Original (Clipped by slider) */}
                <img
                  src={previewUrl}
                  alt={`Original: ${originalMeta.name}`}
                  className={styles.originalLayer}
                  style={{
                    clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                    WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                  }}
                />
                <span
                  className={styles.badgeLeft}
                  data-testid="badge-original-real"
                  style={{ opacity: sliderPos > 12 ? 1 : 0 }}
                >
                  Original
                </span>

                {/* Draggable Divider Handle */}
                <div
                  className={styles.sliderHandle}
                  style={{ left: `${sliderPos}%` }}
                  aria-label="Drag before and after divider"
                >
                  <div className={styles.handleLine} />
                  <div className={styles.handleButton}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* SAFETY BLOCK OR ERROR: Compact fallback preview */}
            {(phase === PHASE.SAFETY_BLOCK || phase === PHASE.ERROR) && previewUrl && (
              <div className={styles.processingPreviewWrap}>
                <ImagePreview
                  src={previewUrl}
                  alt="Selected Image"
                  className={styles.uploadedPreviewImg}
                />
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/*  RIGHT COLUMN — Upload Area, Status, or Result Controls        */}
          {/* ============================================================== */}
          <div className={styles.actionCol} data-testid="action-column">
            {/* ------------------------------------------------------------ */}
            {/*  IDLE STATE: Upload Dropzone & Upscale Factor Selection      */}
            {/* ------------------------------------------------------------ */}
            {phase === PHASE.IDLE && (
              <div className={styles.idleRightWrap}>
                {/* Upload Area (Dashed Box) */}
                <div
                  className={`${styles.uploadDropzone} ${isDragOver ? styles.uploadDropzoneActive : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={openFileDialog}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openFileDialog();
                    }
                  }}
                  data-testid="upload-dropzone"
                  aria-label="Upload your image: Drag & drop your file here or click to browse"
                >
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={UPSCALER_ACCEPT_STRING}
                    onChange={handleFileInputChange}
                    className={styles.hiddenFileInput}
                    data-testid="file-input"
                  />

                  {/* Cloud Upload Icon */}
                  <div className={styles.cloudIconWrap} aria-hidden="true" data-testid="cloud-icon">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                      <path d="M12 12v9" />
                      <path d="m16 16-4-4-4 4" />
                    </svg>
                  </div>

                  {/* Upload Heading */}
                  <h2 className={styles.uploadTitle}>Upload your image</h2>

                  {/* Supporting text */}
                  <p className={styles.uploadSubtitle}>
                    Drag &amp; drop your file here or{' '}
                    <span className={styles.browseLink}>click to browse</span>
                  </p>

                  {/* Choose Image Primary Gradient Button */}
                  <button
                    type="button"
                    className={styles.chooseImageBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileDialog();
                    }}
                    data-testid="choose-image-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                    <span>Choose Image</span>
                  </button>

                  {/* Format and restriction note */}
                  <span className={styles.formatHint} data-testid="format-hint">
                    JPG, PNG, WebP &bull; Up to 3000 px &bull; Max 50 MB
                  </span>
                </div>

                {/* Upscale Factor Selection Row */}
                <div className={styles.factorSection}>
                  <span className={styles.factorLabel}>Upscale Factor:</span>
                  <div className={styles.factorCardsRow} role="radiogroup" aria-label="Upscale Factor">
                    {/* 2x Factor Card */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={scaleFactor === 2}
                      className={`${styles.factorCard} ${scaleFactor === 2 ? styles.factorCardActive : ''}`}
                      onClick={() => handleScaleChange(2)}
                      data-testid="factor-card-2x"
                    >
                      {scaleFactor === 2 && (
                        <div className={styles.factorCheckmark} aria-hidden="true" data-testid="factor-2x-check">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      <span className={styles.factorCardTitle}>2×</span>
                      <span className={styles.factorCardSubtitle}>Recommended</span>
                    </button>

                    {/* 4x Factor Card */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={scaleFactor === 4}
                      className={`${styles.factorCard} ${scaleFactor === 4 ? styles.factorCardActive : ''}`}
                      onClick={() => handleScaleChange(4)}
                      data-testid="factor-card-4x"
                    >
                      {scaleFactor === 4 && (
                        <div className={styles.factorCheckmark} aria-hidden="true" data-testid="factor-4x-check">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      <span className={styles.factorCardTitle}>4×</span>
                      <span className={styles.factorCardSubtitle}>Maximum detail, slower</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/*  PREPARING & PROCESSING: Live Progress Card                  */}
            {/* ------------------------------------------------------------ */}
            {(phase === PHASE.PREPARING || phase === PHASE.PROCESSING) && originalMeta && (
              <div className={styles.statusCard} role="status" aria-live="polite" data-testid="processing-status-card">
                <div className={styles.spinnerWrap}>
                  <div className={styles.spinner} />
                </div>

                <div className={styles.statusTextWrap}>
                  <h3 className={styles.statusTitle}>
                    {phase === PHASE.PREPARING ? 'Preparing AI Upscaler' : 'Upscaling Image with AI'}
                  </h3>
                  <p className={styles.statusMessage}>
                    {progressMessage || 'Processing neural enhancement…'}
                  </p>
                  {phase === PHASE.PREPARING && (
                    <p className={styles.firstTimeNote}>
                      Downloading AI weights (4.6 MB). Cached locally in your browser for fast future use.
                    </p>
                  )}
                  {safetyInfo?.isLarge && phase === PHASE.PROCESSING && (
                    <div className={styles.largeImageNotice} role="note">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>Large image — AI processing may take longer.</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {progressPercent > 0 && (
                  <div className={styles.progressBarWrap} aria-hidden="true">
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={handleCancel}
                  aria-label="Cancel upscaling"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/*  SAFETY BLOCK: Large resolution alert                        */}
            {/* ------------------------------------------------------------ */}
            {phase === PHASE.SAFETY_BLOCK && originalMeta && (
              <div className={styles.safetyBlock} role="alert" data-testid="safety-block">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" aria-hidden="true">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className={styles.safetyTitle}>
                  Image too large to safely upscale at {scaleFactor}&times; in browser
                </p>
                <p className={styles.safetyText}>
                  At {scaleFactor}&times; scale, the output would be {originalMeta.width * scaleFactor} &times; {originalMeta.height * scaleFactor} px ({((originalMeta.width * scaleFactor * originalMeta.height * scaleFactor) / 1000000).toFixed(1)} megapixels).
                  Processing this size could cause tab unresponsiveness.
                </p>
                <div className={styles.safetyActionsRow}>
                  {safetyInfo?.canTry2x && (
                    <button
                      type="button"
                      className={styles.safetyBtnPrimary}
                      onClick={() => handleScaleChange(2)}
                    >
                      Try 2× instead
                    </button>
                  )}
                  <Link to={ROUTES.resize} className={styles.safetyBtnSecondary}>
                    Resize image first
                  </Link>
                  <button
                    type="button"
                    className={styles.safetyBtnSecondary}
                    onClick={cleanup}
                  >
                    Choose another image
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/*  ERROR STATE: Error alert & retry options                     */}
            {/* ------------------------------------------------------------ */}
            {phase === PHASE.ERROR && (
              <div className={styles.errorBlock} role="alert" data-testid="error-block">
                <p className={styles.errorTitle}>Upscaling couldn&apos;t be completed.</p>
                <p className={styles.errorText}>{error}</p>
                <div className={styles.errorActionsRow}>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => {
                      setError('');
                      if (imgElement && file) {
                        runUpscale(imgElement, file, scaleFactor);
                      } else {
                        cleanup();
                      }
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={cleanup}
                  >
                    Choose Another Image
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/*  DONE STATE: Super-Resolution Details & Primary Actions       */}
            {/* ------------------------------------------------------------ */}
            {phase === PHASE.DONE && upscaledUrl && originalMeta && resultMeta && (
              <div className={styles.doneRightWrap} data-testid="done-action-wrap">
                <div className={styles.doneHeader}>
                  <span className={styles.successBadge}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Super-Resolution Complete
                  </span>
                  <h3 className={styles.doneFileName}>{originalMeta.name}</h3>

                  <div className={styles.statsGrid}>
                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Original</span>
                      <span className={styles.statBoxValue}>{originalMeta.width} &times; {originalMeta.height} px</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Upscaled</span>
                      <span className={styles.statBoxValuePrimary}>{resultMeta.width} &times; {resultMeta.height} px</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>File Size</span>
                      <span className={styles.statBoxValue}>{resultMeta.sizeFormatted}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Speed</span>
                      <span className={styles.statBoxValue}>
                        {resultMeta.timeFormatted}
                        {resultMeta.backend ? ` · ${resultMeta.backend.toUpperCase()}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Factor switch on result view */}
                <div className={styles.factorSectionDone}>
                  <span className={styles.factorLabel}>Change Factor:</span>
                  <div className={styles.factorCardsRowDone}>
                    <button
                      type="button"
                      className={`${styles.factorCardMini} ${scaleFactor === 2 ? styles.factorCardMiniActive : ''}`}
                      onClick={() => handleScaleChange(2)}
                      data-testid="done-factor-2x"
                    >
                      2×
                    </button>
                    <button
                      type="button"
                      className={`${styles.factorCardMini} ${scaleFactor === 4 ? styles.factorCardMiniActive : ''}`}
                      onClick={() => handleScaleChange(4)}
                      data-testid="done-factor-4x"
                    >
                      4×
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className={styles.doneActionsRow}>
                  <button
                    type="button"
                    className={styles.downloadPrimaryBtn}
                    onClick={handleDownload}
                    data-testid="download-upscaled-btn"
                  >
                    <IconDownload />
                    <span>Download Image</span>
                  </button>
                  <Button
                    variant="secondary"
                    icon={<IconImagePlus />}
                    onClick={cleanup}
                    data-testid="upscale-another-btn"
                  >
                    Upscale Another Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}

export default ImageUpscalerPage;
