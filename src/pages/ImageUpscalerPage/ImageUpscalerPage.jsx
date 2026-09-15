import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ROUTES } from '@/routes/paths';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
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

import ImageUpscalerContent from './ImageUpscalerContent';
import styles from './ImageUpscalerPage.module.css';

/* ---------------------------------------------------------------------- */
/*  Supported input types                                                 */
/* ---------------------------------------------------------------------- */
const UPSCALER_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPSCALER_ACCEPT_STRING = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

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
  useDocumentTitle('AI Image Upscaler — Upscale Images 2× & 4× Free | Convert Image');

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

  /* Interactive Before/After Split Slider position (0 to 100%) */
  const [sliderPos, setSliderPos] = useState(50);
  const isDraggingRef = useRef(false);
  const comparisonWrapRef = useRef(null);

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
    const safety = checkImageSafety(image.naturalWidth || image.width, image.naturalHeight || image.height, factor);
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
  /*  Interactive Before / After Slider Drag Handling                     */
  /* -------------------------------------------------------------------- */
  const updateSliderPos = useCallback((clientX) => {
    if (!comparisonWrapRef.current) return;
    const rect = comparisonWrapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  }, []);

  const handlePointerDown = () => {
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    updateSliderPos(e.clientX);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const onMove = (e) => {
      if (isDraggingRef.current) updateSliderPos(e.clientX);
    };
    const onUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updateSliderPos]);

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
    };
  }, [upscaledBlob, upscaledDims, processingTimeMs]);

  return (
    <ToolPageLayout
      badge="Flagship Neural Super-Resolution"
      title="AI Image Upscaler"
      subtitle="Increase image resolution and recover sharper detail directly in your browser. 100% private, executed locally."
      content={<ImageUpscalerContent />}
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {phase === PHASE.IDLE && (
          <div className={styles.idleWrap}>
            <div className={styles.uploadHeader}>
              <h2 className={styles.uploadTitle}>Upscale your images</h2>
              <p className={styles.uploadDesc}>
                Increase image resolution and recover sharper detail directly in your browser.
              </p>
            </div>
            <div className={styles.scaleSelectorBar}>
            <span className={styles.scaleSelectorLabel}>Upscale Factor:</span>
            <div className={styles.scaleButtonGroup} role="radiogroup" aria-label="Upscale factor">
              <button
                type="button"
                role="radio"
                aria-checked={scaleFactor === 2}
                className={`${styles.scaleBtn} ${scaleFactor === 2 ? styles.scaleBtnActive : ''}`}
                onClick={() => setScaleFactor(2)}
              >
                <span className={styles.scaleBtnTitle}>2×</span>
                <span className={styles.scaleBtnSubtitle}>Recommended</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={scaleFactor === 4}
                className={`${styles.scaleBtn} ${scaleFactor === 4 ? styles.scaleBtnActive : ''}`}
                onClick={() => setScaleFactor(4)}
              >
                <span className={styles.scaleBtnTitle}>4×</span>
                <span className={styles.scaleBtnSubtitle}>Maximum detail, slower</span>
              </button>
            </div>
          </div>

          <FileUploader
            onFileSelect={handleFileSelect}
            file={file}
            onClear={cleanup}
            accept={UPSCALER_ACCEPT_STRING}
            acceptedTypes={UPSCALER_INPUT_TYPES}
            hint="JPG, PNG, or WebP photo up to 3000 px"
          />
        </div>
      )}

      {/* ================================================================ */}
      {/*  SAFETY BLOCK — Output resolution exceeds browser limit          */}
      {/* ================================================================ */}
      {phase === PHASE.SAFETY_BLOCK && originalMeta && (
        <div className={styles.safetyBlock} role="alert">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className={styles.safetyTitle}>
            This image is too large to safely process at this scale in your browser.
          </p>
          <p className={styles.safetyText}>
            At {scaleFactor}&times; scale, the output would be {originalMeta.width * scaleFactor} &times; {originalMeta.height * scaleFactor} px ({((originalMeta.width * scaleFactor * originalMeta.height * scaleFactor) / 1000000).toFixed(1)} megapixels).
            Processing images of this magnitude could cause browser tab unresponsiveness.
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

      {/* ================================================================ */}
      {/*  PREPARING & PROCESSING — Model loading and tile progress        */}
      {/* ================================================================ */}
      {(phase === PHASE.PREPARING || phase === PHASE.PROCESSING) && originalMeta && (
        <div className={styles.processingWorkspace}>
          <div className={styles.sourceThumbnailWrap}>
            <span className={styles.previewLabel}>Original Image</span>
            <div className={styles.previewImageWrap}>
              <ImagePreview
                src={previewUrl}
                alt={originalMeta.name}
                className={styles.previewImage}
              />
            </div>
          </div>

          <div className={styles.statusCard} role="status" aria-live="polite">
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

            {/* Real Progress bar */}
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
        </div>
      )}

      {/* ================================================================ */}
      {/*  ERROR — Error message, Try Again & Cancel                       */}
      {/* ================================================================ */}
      {phase === PHASE.ERROR && (
        <div className={styles.errorBlock} role="alert">
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

      {/* ================================================================ */}
      {/*  DONE — Interactive Before/After Comparison Split Slider         */}
      {/* ================================================================ */}
      {phase === PHASE.DONE && upscaledUrl && originalMeta && resultMeta && (
        <div className={styles.resultWorkspace}>
          {/* Header row: Title, factor switch, and metadata flow */}
          <div className={styles.resultHeader}>
            <div className={styles.resultHeadingWrap}>
              <span className={styles.successBadge}>✓ Super-Resolution Complete</span>
              <h2 className={styles.resultTitle}>{originalMeta.name}</h2>
              <p className={styles.dimensionFlow}>
                <span className={styles.dimOriginal}>{originalMeta.width} &times; {originalMeta.height} px</span>
                <span className={styles.dimArrow}>&rarr;</span>
                <span className={styles.dimUpscaled}>{resultMeta.width} &times; {resultMeta.height} px</span>
                <span className={styles.dimDivider}>&middot;</span>
                <span className={styles.dimSize}>{resultMeta.sizeFormatted}</span>
                <span className={styles.dimDivider}>&middot;</span>
                <span className={styles.dimTime}>{resultMeta.timeFormatted}</span>
                {executionBackend && (
                  <span className={styles.backendBadge}>{executionBackend.toUpperCase()}</span>
                )}
              </p>
            </div>

            {/* Secondary factor switch in result view */}
            <div className={styles.scaleSwitchInline}>
              <span className={styles.inlineScaleLabel}>Scale:</span>
              <button
                type="button"
                className={`${styles.inlineScaleBtn} ${scaleFactor === 2 ? styles.inlineScaleBtnActive : ''}`}
                onClick={() => handleScaleChange(2)}
              >
                2×
              </button>
              <button
                type="button"
                className={`${styles.inlineScaleBtn} ${scaleFactor === 4 ? styles.inlineScaleBtnActive : ''}`}
                onClick={() => handleScaleChange(4)}
              >
                4×
              </button>
            </div>
          </div>

          {/* Interactive Split Comparison Slider */}
          <div
            ref={comparisonWrapRef}
            className={styles.splitViewer}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Background: Upscaled (Right side) */}
            <img
              src={upscaledUrl}
              alt={`AI Upscaled: ${originalMeta.name}`}
              className={styles.enhancedLayer}
            />
            <span className={styles.badgeRight}>{scaleFactor}&times; AI Upscaled</span>

            {/* Foreground: Original (Left side, clipped) */}
            <div
              className={styles.originalLayerClip}
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={previewUrl}
                alt={`Original: ${originalMeta.name}`}
                className={styles.originalLayer}
              />
              <span className={styles.badgeLeft}>Original</span>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className={styles.sliderHandle}
              style={{ left: `${sliderPos}%` }}
              aria-label="Drag before and after divider"
            >
              <div className={styles.handleLine} />
              <div className={styles.handleButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.actionsRow}>
            <Button
              variant="secondary"
              icon={<IconImagePlus />}
              onClick={cleanup}
              aria-label="Upload a new photo"
            >
              Upscale Another Image
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon={<IconDownload />}
              onClick={handleDownload}
              aria-label="Download Upscaled Image"
            >
              Download Image
            </Button>
          </div>
        </div>
      )}
      </div>
    </ToolPageLayout>
  );
}

export default ImageUpscalerPage;
