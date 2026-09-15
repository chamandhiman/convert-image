import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import {
  IconDownload,
  IconEdit,
  IconSelection,
  IconImagePlus,
} from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  loadImage,
  getImageMeta,
  downloadBlob,
} from '@/utils/imageProcessor';
import {
  removeObject,
  cancelInpainting,
} from '@/tools/objectRemover/lamaInpainting';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import MaskCanvas from './MaskCanvas';
import ObjectRemoverContent from './ObjectRemoverContent';
import styles from './ObjectRemoverPage.module.css';

/* ---------------------------------------------------------------------- */
/*  Accepted file types                                                    */
/* ---------------------------------------------------------------------- */
const OBJECT_REMOVER_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const OBJECT_REMOVER_ACCEPT_STRING = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

/* ---------------------------------------------------------------------- */
/*  Phase state machine                                                    */
/* ---------------------------------------------------------------------- */
const PHASE = {
  IDLE:       'idle',
  EDITING:    'editing',
  PROCESSING: 'processing',
  RESULT:     'result',
  ERROR:      'error',
};

/* ---------------------------------------------------------------------- */
/*  Comparison view modes (Default: Side by Side)                           */
/* ---------------------------------------------------------------------- */
const VIEW_MODES = [
  { id: 'sidebyside', label: 'Side by Side' },
  { id: 'split',     label: 'Split' },
  { id: 'overlay',   label: 'Overlay' },
];

/* ---------------------------------------------------------------------- */
/*  Consumer-friendly progress copy — no model/tech names ever            */
/* ---------------------------------------------------------------------- */
const STAGE_COPY = {
  preparing:          'Preparing your image\u2026',
  'loading-model':    'Getting things ready\u2026',
  downloading:        'Setting up \u2014 just a moment\u2026',
  compiling:          'Setting up \u2014 just a moment\u2026',
  processing:         'Analyzing the selected area\u2026',
  'running-inference':'Rebuilding the background\u2026',
  finalizing:         'Blending the details\u2026',
  finishing:          'Blending the details\u2026',
};

/* ---------------------------------------------------------------------- */
/*  Trim filename for display                                              */
/* ---------------------------------------------------------------------- */
function trimFilename(name, maxLen = 36) {
  if (!name || name.length <= maxLen) return name;
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  return name.slice(0, maxLen - ext.length - 1) + '\u2026' + ext;
}

/* ---------------------------------------------------------------------- */
/*  Component                                                              */
/* ---------------------------------------------------------------------- */
function ObjectRemoverPage({ embedded, embeddedOnly }) {
  useDocumentTitle('AI Object Remover \u2014 Remove Objects From Photos Free | Convert Image');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [imgElement, setImgElement] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);

  /* The very first upload URL — never overwritten, used for before/after */
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState('');

  /* Working image URL (updated to result on Edit Again) */
  const [workingPreviewUrl, setWorkingPreviewUrl] = useState('');

  /* Progress */
  const [progressStage, setProgressStage] = useState('preparing');
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const processingStartRef = useRef(null);
  const elapsedTimerRef = useRef(null);

  /* Results */
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState('');
  const [resultDims, setResultDims] = useState(null);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  /* Comparison (Default: Side by Side) */
  const [viewMode, setViewMode] = useState('sidebyside');
  const [sliderPos, setSliderPos] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const isDraggingRef = useRef(false);
  const comparisonWrapRef = useRef(null);

  /* Validation / error */
  const [validationNotice, setValidationNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const maskCanvasRef = useRef(null);

  /* Preserve mask data-URL across Edit Again cycles */
  const savedMaskDataURLRef = useRef(null);

  /* -------------------------------------------------------------------- */
  /*  Full cleanup — go back to IDLE                                       */
  /* -------------------------------------------------------------------- */
  const cleanup = useCallback(() => {
    cancelInpainting();
    clearInterval(elapsedTimerRef.current);
    if (workingPreviewUrl && workingPreviewUrl !== originalPreviewUrl) {
      URL.revokeObjectURL(workingPreviewUrl);
    }
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setFile(null);
    setImgElement(null);
    setOriginalMeta(null);
    setOriginalPreviewUrl('');
    setWorkingPreviewUrl('');
    setResultBlob(null);
    setResultUrl('');
    setResultDims(null);
    setProcessingTimeMs(0);
    setProgressStage('preparing');
    setProgressPercent(0);
    setElapsedSecs(0);
    setValidationNotice('');
    setErrorMsg('');
    savedMaskDataURLRef.current = null;
    setPhase(PHASE.IDLE);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------- */
  /*  File Selection                                                       */
  /* -------------------------------------------------------------------- */
  const handleFileSelect = async (f) => {
    cleanup();
    setFile(f);
    try {
      const image = await loadImage(f);
      const meta = { ...getImageMeta(image, f), sizeFormatted: formatFileSize(f.size) };
      setImgElement(image);
      setOriginalMeta(meta);
      setOriginalPreviewUrl(image.src);
      setWorkingPreviewUrl(image.src);
      setPhase(PHASE.EDITING);
    } catch (err) {
      console.error('[Object Remover] load error:', err);
      setErrorMsg('We could not open that image. Please try a different file.');
      setPhase(PHASE.ERROR);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Remove Object (trigger AI inpainting)                               */
  /* -------------------------------------------------------------------- */
  const handleRemoveObject = async () => {
    if (!imgElement || !maskCanvasRef.current) return;
    const maskCanvas = maskCanvasRef.current.getMaskCanvas();
    if (!maskCanvas) return;

    setValidationNotice('');

    /* Save the current mask so we can restore it if the user comes back to edit */
    try {
      savedMaskDataURLRef.current = maskCanvasRef.current.getMaskDataURL();
    } catch { /* ignore */ }

    setPhase(PHASE.PROCESSING);
    setProgressPercent(5);
    setProgressStage('preparing');
    setElapsedSecs(0);
    processingStartRef.current = Date.now();
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - processingStartRef.current) / 1000));
    }, 1000);

    try {
      const outputType = file?.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      const result = await removeObject(imgElement, maskCanvas, {
        outputType,
        quality: 0.95,
        onProgress: ({ stage, percent }) => {
          setProgressStage(stage || 'processing');
          setProgressPercent(percent);
        },
      });

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(result.blob);
      setResultBlob(result.blob);
      setResultUrl(url);
      setResultDims({ width: result.width, height: result.height });
      setProcessingTimeMs(result.processingTimeMs);
      setSliderPos(50);
      setOverlayOpacity(0);
      setViewMode('sidebyside');
      setPhase(PHASE.RESULT);
    } catch (err) {
      if (err?.message?.includes('Paint over the object')) {
        setValidationNotice('Paint over the object you want to remove before proceeding.');
        setPhase(PHASE.EDITING);
        return;
      }
      console.error('[Object Remover] inference error:', err);
      setErrorMsg('processing_failed');
      setPhase(PHASE.ERROR);
    } finally {
      clearInterval(elapsedTimerRef.current);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Cancel — return to editor, preserve mask                            */
  /* -------------------------------------------------------------------- */
  const handleCancel = useCallback(() => {
    clearInterval(elapsedTimerRef.current);
    cancelInpainting();
    setProgressPercent(0);
    setElapsedSecs(0);
    setPhase(PHASE.EDITING);
  }, []);

  /* -------------------------------------------------------------------- */
  /*  Edit Again — load result as new working image, restore mask         */
  /* -------------------------------------------------------------------- */
  const handleEditAgain = async () => {
    if (!resultBlob) return;
    try {
      const newImg = await loadImage(resultBlob);
      const newFile = new File(
        [resultBlob],
        originalMeta?.name || 'edited.png',
        { type: resultBlob.type }
      );
      const newMeta = {
        ...getImageMeta(newImg, newFile),
        sizeFormatted: formatFileSize(resultBlob.size),
      };

      /* Revoke old working URL only if it differs from the original */
      if (workingPreviewUrl && workingPreviewUrl !== originalPreviewUrl) {
        URL.revokeObjectURL(workingPreviewUrl);
      }

      setImgElement(newImg);
      setOriginalMeta(newMeta);
      setWorkingPreviewUrl(newImg.src);

      /* Keep the original first image URL for before/after comparison */
      /* (don't overwrite originalPreviewUrl) */

      /* Discard the result we just showed */
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(null);
      setResultUrl('');
      setValidationNotice('');
      setPhase(PHASE.EDITING);

      /* Restore the saved mask on the next tick after canvas re-init */
      if (savedMaskDataURLRef.current) {
        const maskURL = savedMaskDataURLRef.current;
        requestAnimationFrame(() => {
          setTimeout(() => {
            maskCanvasRef.current?.restoreMaskFromDataURL(
              maskURL,
              newMeta.width,
              newMeta.height
            );
          }, 80);
        });
      }
    } catch (err) {
      console.error('[Object Remover] Edit Again error:', err);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Return to editor from result without reloading (no Edit Again)      */
  /* -------------------------------------------------------------------- */
  const handleGoBackToEditor = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultBlob(null);
    setResultUrl('');
    setValidationNotice('');
    setPhase(PHASE.EDITING);
    /* Restore saved mask */
    if (savedMaskDataURLRef.current && originalMeta) {
      const maskURL = savedMaskDataURLRef.current;
      requestAnimationFrame(() => {
        setTimeout(() => {
          maskCanvasRef.current?.restoreMaskFromDataURL(
            maskURL,
            originalMeta.width,
            originalMeta.height
          );
        }, 80);
      });
    }
  }, [resultUrl, originalMeta]);

  /* -------------------------------------------------------------------- */
  /*  Download                                                             */
  /* -------------------------------------------------------------------- */
  const handleDownload = useCallback(() => {
    if (!resultBlob || !originalMeta) return;
    const outputType = file?.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const filename = buildObjectRemovedFilename(originalMeta.name, outputType);
    downloadBlob(resultBlob, filename);
  }, [resultBlob, originalMeta, file]);

  /* -------------------------------------------------------------------- */
  /*  Staged input from other tools                                        */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => handleFileSelect(stagedFile));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------- */
  /*  Split Slider — mouse + touch + pointer                              */
  /* -------------------------------------------------------------------- */
  const updateSliderPos = useCallback((clientX) => {
    if (!comparisonWrapRef.current) return;
    const rect = comparisonWrapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos(Math.round((x / rect.width) * 100));
  }, []);

  const handleSliderPointerDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    updateSliderPos(e.clientX);
  }, [updateSliderPos]);

  useEffect(() => {
    const onMove = (e) => { if (isDraggingRef.current) updateSliderPos(e.clientX); };
    const onUp   = ()  => { isDraggingRef.current = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    };
  }, [updateSliderPos]);

  /* Touch events for the split slider */
  const handleSliderTouchStart = useCallback((e) => {
    isDraggingRef.current = true;
    if (e.touches.length > 0) updateSliderPos(e.touches[0].clientX);
  }, [updateSliderPos]);

  const handleSliderTouchMove = useCallback((e) => {
    if (!isDraggingRef.current || e.touches.length === 0) return;
    e.preventDefault();
    updateSliderPos(e.touches[0].clientX);
  }, [updateSliderPos]);

  const handleSliderTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  /* -------------------------------------------------------------------- */
  /*  Result summary (memoised)                                            */
  /* -------------------------------------------------------------------- */
  const resultSummary = useMemo(() => {
    if (!resultBlob || !resultDims) return null;
    return {
      sizeFormatted: formatFileSize(resultBlob.size),
      width: resultDims.width,
      height: resultDims.height,
      timeFormatted: (processingTimeMs / 1000).toFixed(1) + 's',
    };
  }, [resultBlob, resultDims, processingTimeMs]);

  /* -------------------------------------------------------------------- */
  /*  Render                                                               */
  /* -------------------------------------------------------------------- */
  return (
    <ToolPageLayout
      badge="Object Remover"
      title="AI Object Remover"
      subtitle="Erase unwanted objects, people, or clutter from photos naturally — all in your browser."
      content={<ObjectRemoverContent />}
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {phase === PHASE.IDLE && (
          <div className={`${styles.idleWrap} ${styles.phaseIn}`}>
            <div className={styles.uploadHeader}>
              <h2 className={styles.uploadTitle}>Remove object from your image</h2>
              <p className={styles.uploadDesc}>
                Upload an image and paint over the object you want to remove. AI will erase it naturally.
              </p>
            </div>
            <FileUploader
            onFileSelect={handleFileSelect}
            file={file}
            onClear={cleanup}
            accept={OBJECT_REMOVER_ACCEPT_STRING}
            acceptedTypes={OBJECT_REMOVER_INPUT_TYPES}
            hint="JPG, PNG, or WebP — up to 4000 px on each side"
          />
        </div>
      )}

      {/* ============================================================== */}
      {/*  EDITING — premium mask editor                                  */}
      {/* ============================================================== */}
      {phase === PHASE.EDITING && imgElement && originalMeta && (
        <div className={`${styles.editorWorkspace} ${styles.phaseIn}`}>
          {/* Top bar */}
          <div className={styles.editorTopBar}>
            <div className={styles.metaInfo}>
              <span className={styles.photoName}>{trimFilename(originalMeta.name)}</span>
              <span className={styles.photoDims}>
                {originalMeta.width}&times;{originalMeta.height}px
                &nbsp;&middot;&nbsp;{originalMeta.sizeFormatted}
              </span>
            </div>
            <button
              type="button"
              className={styles.btnChangeImage}
              onClick={cleanup}
              aria-label="Upload a different photo"
            >
              Change Photo
            </button>
          </div>

          {/* Validation notice */}
          {validationNotice && (
            <div className={styles.validationBanner} role="alert" aria-live="assertive">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{validationNotice}</span>
            </div>
          )}

          {/* Mask Canvas (contains top toolbar with primary action) */}
          <MaskCanvas
            ref={maskCanvasRef}
            imageSrc={workingPreviewUrl}
            imageWidth={originalMeta.width}
            imageHeight={originalMeta.height}
            onMaskChange={() => setValidationNotice('')}
            onRemoveObject={handleRemoveObject}
            isProcessing={phase === PHASE.PROCESSING}
          />

          {/* Editor secondary action row */}
          <div className={styles.editorActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => maskCanvasRef.current?.clearMask()}
              aria-label="Clear the painted mask"
            >
              Clear Selection
            </button>
            <button
              type="button"
              className={`${styles.btnSecondary} ${styles.btnSecondarySubtle}`}
              onClick={cleanup}
              aria-label="Upload a different photo"
            >
              New Photo
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/*  PROCESSING — frosted overlay on top of image preview           */}
      {/* ============================================================== */}
      {phase === PHASE.PROCESSING && originalMeta && imgElement && (
        <div className={`${styles.processingEditorWrap} ${styles.phaseIn}`}>
          {/* Dimmed image behind the card */}
          <div className={styles.processingEditorDim} aria-hidden="true">
            <div className={styles.editorTopBar}>
              <div className={styles.metaInfo}>
                <span className={styles.photoName}>{trimFilename(originalMeta.name)}</span>
              </div>
            </div>
            <div className={styles.processingPreviewImg}>
              <img src={workingPreviewUrl} alt="" draggable={false} />
            </div>
          </div>

          {/* Floating processing card */}
          <div
            className={styles.processingOverlayCard}
            role="status"
            aria-live="polite"
            aria-label="Removing the object, please wait"
          >
            {/* Animated SVG ring */}
            <div className={styles.processingRingWrap} aria-hidden="true">
              <svg className={styles.processingRing} viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.12)" strokeWidth="3"/>
                <circle
                  cx="28" cy="28" r="24"
                  stroke="url(#proc-grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="150"
                  strokeDashoffset="40"
                />
                <defs>
                  <linearGradient id="proc-grad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="var(--color-primary)"/>
                    <stop offset="100%" stopColor="hsl(270,70%,70%)"/>
                  </linearGradient>
                </defs>
              </svg>
              {progressPercent > 0 && (
                <span className={styles.processingRingPercent}>{progressPercent}%</span>
              )}
            </div>

            <div className={styles.processingTextWrap}>
              <h3 className={styles.processingHeadline}>
                {elapsedSecs >= 18 ? 'Still working on it\u2026' : 'Removing the object'}
              </h3>
              <p className={styles.processingSubtext}>
                {elapsedSecs >= 25
                  ? 'Your image is being processed. Please keep this tab open.'
                  : elapsedSecs >= 12
                    ? 'Almost there \u2014 this area needs extra attention.'
                    : (STAGE_COPY[progressStage] || 'Preparing your image\u2026')
                }
              </p>
              {elapsedSecs < 12 && (
                <p className={styles.processingHint}>
                  {originalMeta.width > 2000 || originalMeta.height > 2000
                    ? 'Larger images may take a little longer.'
                    : 'We\u2019re carefully rebuilding the area you selected.'
                  }
                </p>
              )}
            </div>

            {/* Progress track */}
            <div className={styles.processingTrack} aria-hidden="true">
              <div
                className={styles.processingTrackFill}
                style={progressPercent > 0 ? { width: `${progressPercent}%` } : undefined}
              />
            </div>

            <button
              type="button"
              className={styles.btnCancelOverlay}
              onClick={handleCancel}
              aria-label="Cancel and return to the editor"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/*  ERROR                                                           */}
      {/* ============================================================== */}
      {phase === PHASE.ERROR && (
        <div className={`${styles.errorBlock} ${styles.phaseIn}`} role="alert">
          <div className={styles.errorIconWrap} aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>
          <div className={styles.errorTextWrap}>
            <p className={styles.errorTitle}>Something went wrong</p>
            <p className={styles.errorText}>
              {errorMsg === 'processing_failed' || !errorMsg
                ? "We couldn't complete the removal this time. Your original image and selection are still safe."
                : errorMsg}
            </p>
          </div>
          <div className={styles.errorActionsRow}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => { setErrorMsg(''); setPhase(PHASE.EDITING); }}
              aria-label="Try removing the object again"
            >
              Try Again
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => { setErrorMsg(''); setPhase(PHASE.EDITING); }}
              aria-label="Go back and adjust your selection"
            >
              Edit Selection
            </button>
            <button
              type="button"
              className={`${styles.btnSecondary} ${styles.btnSecondarySubtle}`}
              onClick={cleanup}
              aria-label="Start with a different photo"
            >
              New Photo
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/*  RESULT                                                          */}
      {/* ============================================================== */}
      {phase === PHASE.RESULT && resultUrl && originalMeta && resultSummary && (
        <div className={`${styles.resultWorkspace} ${styles.phaseIn}`}>
          {/* Header */}
          <div className={styles.resultHeader}>
            <div className={styles.resultHeadingWrap}>
              <span className={styles.successBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Object removed
              </span>
              <h2 className={styles.resultTitle}>{trimFilename(originalMeta.name, 48)}</h2>
              <p className={styles.dimensionFlow}>
                <span className={styles.dimOriginal}>{resultSummary.width}&times;{resultSummary.height}px</span>
                <span className={styles.dimDivider}>&middot;</span>
                <span className={styles.dimResult}>{resultSummary.sizeFormatted}</span>
                <span className={styles.dimDivider}>&middot;</span>
                <span className={styles.dimTime}>Done in {resultSummary.timeFormatted}</span>
              </p>
            </div>

            {/* View mode toggle */}
            <div className={styles.viewModeToggle} role="tablist" aria-label="Comparison view mode">
              {VIEW_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={viewMode === m.id}
                  className={`${styles.viewModeBtn} ${viewMode === m.id ? styles.viewModeBtnActive : ''}`}
                  onClick={() => setViewMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/*  Split slider                                               */}
          {/* ---------------------------------------------------------- */}
          {viewMode === 'split' && (
            <div
              ref={comparisonWrapRef}
              className={styles.splitViewer}
              onPointerDown={handleSliderPointerDown}
              onTouchStart={handleSliderTouchStart}
              onTouchMove={handleSliderTouchMove}
              onTouchEnd={handleSliderTouchEnd}
              aria-label="Drag to compare original and result"
              role="slider"
              aria-valuenow={sliderPos}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {/* Result (right/bottom) */}
              <img
                src={resultUrl}
                alt={`Result: ${originalMeta.name}`}
                className={styles.enhancedLayer}
                draggable={false}
              />
              <span className={styles.badgeRight}>After</span>

              {/* Original (left clip) */}
              <div
                className={styles.originalLayerClip}
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={originalPreviewUrl}
                  alt={`Original: ${originalMeta.name}`}
                  className={styles.originalLayer}
                  draggable={false}
                />
                <span className={styles.badgeLeft}>Before</span>
              </div>

              {/* Divider handle */}
              <div
                className={styles.sliderHandle}
                style={{ left: `${sliderPos}%` }}
                aria-hidden="true"
              >
                <div className={styles.handleLine} />
                <div className={styles.handleButton}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/*  Side by Side                                               */}
          {/* ---------------------------------------------------------- */}
          {viewMode === 'sidebyside' && (
            <div className={styles.sideBySideWrap}>
              <div className={styles.sideBySidePanel}>
                <img src={originalPreviewUrl} alt="Original photo" className={styles.sideBySideImg} draggable={false} />
                <span className={styles.sideLabel}>Before</span>
              </div>
              <div className={styles.sideBySidePanel}>
                <img src={resultUrl} alt="Object removed result" className={styles.sideBySideImg} draggable={false} />
                <span className={styles.sideLabel}>After</span>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/*  Overlay blend                                              */}
          {/* ---------------------------------------------------------- */}
          {viewMode === 'overlay' && (
            <div className={styles.overlayWrap}>
              <div className={styles.overlayImgStack}>
                <img src={resultUrl} alt="Object removed result" className={styles.overlayBase} draggable={false} />
                <img
                  src={originalPreviewUrl}
                  alt=""
                  aria-hidden="true"
                  className={styles.overlayTop}
                  style={{ opacity: overlayOpacity / 100 }}
                  draggable={false}
                />
              </div>
              <div className={styles.overlaySliderRow}>
                <span className={styles.overlaySliderLabel}>After</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseInt(e.target.value, 10))}
                  className={styles.overlaySlider}
                  aria-label="Blend original over result (0 = result, 100 = original)"
                />
                <span className={styles.overlaySliderLabel}>Before</span>
              </div>
              <p className={styles.overlayHint}>Drag the slider to reveal the original underneath.</p>
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/*  Action bar                                                 */}
          {/* ---------------------------------------------------------- */}
          <div className={styles.resultActionBar}>
            <div className={styles.actionGroupLeft}>
              <Button
                variant="secondary"
                icon={<IconEdit />}
                onClick={handleEditAgain}
                aria-label="Edit the result — continue removing more objects"
              >
                Edit Again
              </Button>
              <Button
                variant="secondary"
                icon={<IconSelection />}
                onClick={handleGoBackToEditor}
                aria-label="Go back to the editor to adjust the selection"
              >
                Adjust Selection
              </Button>
              <Button
                variant="tertiary"
                icon={<IconImagePlus />}
                onClick={cleanup}
                aria-label="Start with a new photo"
              >
                New Photo
              </Button>
            </div>

            <div className={styles.actionGroupRight}>
              <Button
                variant="primary"
                size="lg"
                icon={<IconDownload />}
                onClick={handleDownload}
                aria-label="Download the finished image"
              >
                Download Image
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ToolPageLayout>
  );
}

export default ObjectRemoverPage;
