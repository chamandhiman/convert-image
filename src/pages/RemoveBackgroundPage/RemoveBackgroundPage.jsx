import { useState, useMemo, useEffect } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import ImagePreview from '@/components/ui/ImagePreview';
import { Button } from '@/components/ui/Button';
import { IconDownload, IconImagePlus } from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  loadImage,
  getImageMeta,
  getFormatLabel,
  downloadBlob,
} from '@/utils/imageProcessor';
import {
  removeImageBackground,
  applyBackgroundColor,
  buildNoBgFilename,
} from '@/tools/backgroundRemoval/backgroundRemoval';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import RemoveBackgroundContent from './RemoveBackgroundContent';
import styles from './RemoveBackgroundPage.module.css';

/* ---------------------------------------------------------------------- */
/*  Supported input types for background removal                          */
/* ---------------------------------------------------------------------- */
const BG_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BG_ACCEPT_STRING = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

/* ---------------------------------------------------------------------- */
/*  State machine phases                                                  */
/* ---------------------------------------------------------------------- */
const PHASE = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error',
};

function RemoveBackgroundPage() {
  useDocumentTitle('Remove Image Background Online Free | Convert Image');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  /* Progress status */
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  /* Background removal results */
  const [transparentBlob, setTransparentBlob] = useState(null);
  const [transparentUrl, setTransparentUrl] = useState('');

  /* Background color selection: 'transparent' | 'white' | 'black' */
  const [bgChoice, setBgChoice] = useState('transparent');
  const [displayedBlob, setDisplayedBlob] = useState(null);
  const [displayedUrl, setDisplayedUrl] = useState('');

  const [error, setError] = useState('');

  /* -------------------------------------------------------------------- */
  /*  Cleanup helper                                                      */
  /* -------------------------------------------------------------------- */
  const cleanup = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (transparentUrl) URL.revokeObjectURL(transparentUrl);
    if (displayedUrl && displayedUrl !== transparentUrl) {
      URL.revokeObjectURL(displayedUrl);
    }

    setFile(null);
    setOriginalMeta(null);
    setPreviewUrl('');
    setTransparentBlob(null);
    setTransparentUrl('');
    setDisplayedBlob(null);
    setDisplayedUrl('');
    setBgChoice('transparent');
    setProgressPercent(0);
    setProgressMessage('');
    setError('');
    setPhase(PHASE.IDLE);
  };

  /* -------------------------------------------------------------------- */
  /*  File selection & processing start                                   */
  /* -------------------------------------------------------------------- */
  const handleFileSelect = async (f) => {
    cleanup();
    setFile(f);
    setError('');

    try {
      const image = await loadImage(f);
      const meta = getImageMeta(image, f);
      setOriginalMeta(meta);
      setPreviewUrl(image.src);

      setPhase(PHASE.PREPARING);
      setProgressPercent(0);
      setProgressMessage('Initializing local AI model in your browser…');

      // Start client-side background removal
      const resultBlob = await removeImageBackground(f, {
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

      const resultUrl = URL.createObjectURL(resultBlob);
      setTransparentBlob(resultBlob);
      setTransparentUrl(resultUrl);
      setDisplayedBlob(resultBlob);
      setDisplayedUrl(resultUrl);
      setBgChoice('transparent');
      setPhase(PHASE.DONE);
    } catch (err) {
      console.error('[BackgroundRemoval Page Error]:', err);
      const isModelError =
        err?.message?.toLowerCase().includes('model') ||
        err?.message?.toLowerCase().includes('timeout') ||
        err?.message?.toLowerCase().includes('fetch') ||
        err?.message?.toLowerCase().includes('resource');

      setError(
        isModelError
          ? "Couldn't load the background-removal model. Please check your network connection and retry."
          : err?.message || "Couldn't load the background-removal model."
      );
      setPhase(PHASE.ERROR);
    }
  };

  const handleClear = () => {
    cleanup();
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
  /*  Handle background color selection (Transparent, White, Black)       */
  /* -------------------------------------------------------------------- */
  const handleBgColorChange = async (color) => {
    if (!transparentBlob) return;
    setBgChoice(color);

    if (color === 'transparent') {
      if (displayedUrl && displayedUrl !== transparentUrl) {
        URL.revokeObjectURL(displayedUrl);
      }
      setDisplayedBlob(transparentBlob);
      setDisplayedUrl(transparentUrl);
      return;
    }

    try {
      const coloredBlob = await applyBackgroundColor(transparentBlob, color);
      const newUrl = URL.createObjectURL(coloredBlob);

      if (displayedUrl && displayedUrl !== transparentUrl) {
        URL.revokeObjectURL(displayedUrl);
      }
      setDisplayedBlob(coloredBlob);
      setDisplayedUrl(newUrl);
    } catch {
      // Fall back to transparent on composite error
      setBgChoice('transparent');
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Download action                                                     */
  /* -------------------------------------------------------------------- */
  const handleDownload = () => {
    if (!displayedBlob || !originalMeta) return;
    const filename = buildNoBgFilename(originalMeta.name, bgChoice);
    downloadBlob(displayedBlob, filename);
  };

  /* -------------------------------------------------------------------- */
  /*  Result comparison metadata                                          */
  /* -------------------------------------------------------------------- */
  const resultMeta = useMemo(() => {
    if (!displayedBlob || !originalMeta) return null;
    return {
      size: displayedBlob.size,
      sizeFormatted: formatFileSize(displayedBlob.size),
      format: 'PNG (Transparent)',
      width: originalMeta.width,
      height: originalMeta.height,
    };
  }, [displayedBlob, originalMeta]);

  return (
    <ToolPageLayout
      badge="Flagship AI Utility"
      title="Remove Image Background"
      subtitle="Instantly isolate your subject and export a crisp, transparent PNG cutout. 100% private, executed locally in your browser."
      content={<RemoveBackgroundContent />}
    >
      {/* ================================================================ */}
      {/*  Privacy Banner                                                  */}
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
          Your image is processed in your browser. Your image is not uploaded to our server.
        </span>
      </div>

      {/* ================================================================ */}
      {/*  IDLE — Upload Area                                              */}
      {/* ================================================================ */}
      {phase === PHASE.IDLE && (
        <FileUploader
          onFileSelect={handleFileSelect}
          file={file}
          onClear={handleClear}
          accept={BG_ACCEPT_STRING}
          acceptedTypes={BG_INPUT_TYPES}
          hint="JPG, PNG, or WebP photo — up to 25 MB"
        />
      )}

      {/* ================================================================ */}
      {/*  PREPARING & PROCESSING — Model loading and segmentation state   */}
      {/* ================================================================ */}
      {(phase === PHASE.PREPARING || phase === PHASE.PROCESSING) && originalMeta && (
        <div className={styles.processingWorkspace}>
          <div className={styles.sourceThumbnailWrap}>
            <ImagePreview
              src={previewUrl}
              alt={originalMeta.name}
              className={styles.sourceThumbnail}
            />
          </div>

          <div className={styles.statusCard} role="status" aria-live="polite">
            <div className={styles.spinnerWrap}>
              <div className={styles.spinner} />
            </div>

            <div className={styles.statusTextWrap}>
              <h3 className={styles.statusTitle}>
                {phase === PHASE.PREPARING ? 'Loading AI Model' : 'Removing Background'}
              </h3>
              <p className={styles.statusMessage}>
                {progressMessage || 'Processing your image…'}
              </p>
              {phase === PHASE.PREPARING && (
                <p className={styles.firstTimeNote}>
                  The AI model assets are downloaded once and cached in your browser for fast future use.
                </p>
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
              onClick={handleClear}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  ERROR — Error message, Retry & Cancel                           */}
      {/* ================================================================ */}
      {phase === PHASE.ERROR && (
        <div className={styles.errorBlock} role="alert">
          <p className={styles.errorTitle}>Couldn&apos;t load the background-removal model.</p>
          <p className={styles.errorText}>{error}</p>
          <div className={styles.errorActionsRow}>
            {file && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => handleFileSelect(file)}
              >
                Retry
              </button>
            )}
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleClear}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  DONE — Large Before/After Presentation & Background Options     */}
      {/* ================================================================ */}
      {phase === PHASE.DONE && displayedUrl && originalMeta && resultMeta && (
        <div className={styles.resultWorkspace}>
          {/* Header Action Row */}
          <div className={styles.resultHeader}>
            <div className={styles.resultHeadingWrap}>
              <span className={styles.successBadge}>✓ Background Removed</span>
              <h2 className={styles.resultTitle}>{originalMeta.name}</h2>
            </div>
            <button
              type="button"
              className={styles.changeImageBtn}
              onClick={handleClear}
            >
              Remove another background
            </button>
          </div>

          {/* Simple Background Selector */}
          <div className={styles.backdropSelectorCard}>
            <span className={styles.backdropLabel}>Backdrop:</span>
            <div className={styles.backdropOptions} role="radiogroup" aria-label="Backdrop color">
              <button
                type="button"
                role="radio"
                aria-checked={bgChoice === 'transparent'}
                className={`${styles.backdropBtn} ${
                  bgChoice === 'transparent' ? styles.backdropBtnActive : ''
                }`}
                onClick={() => handleBgColorChange('transparent')}
              >
                <span className={`${styles.swatch} ${styles.swatchTransparent}`} />
                <span>Transparent (Default)</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={bgChoice === 'white'}
                className={`${styles.backdropBtn} ${
                  bgChoice === 'white' ? styles.backdropBtnActive : ''
                }`}
                onClick={() => handleBgColorChange('white')}
              >
                <span className={`${styles.swatch} ${styles.swatchWhite}`} />
                <span>White</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={bgChoice === 'black'}
                className={`${styles.backdropBtn} ${
                  bgChoice === 'black' ? styles.backdropBtnActive : ''
                }`}
                onClick={() => handleBgColorChange('black')}
              >
                <span className={`${styles.swatch} ${styles.swatchBlack}`} />
                <span>Black</span>
              </button>
            </div>
          </div>

          {/* Large Before & After Comparison */}
          <div className={styles.comparisonContainer}>
            {/* Left: Original */}
            <div className={styles.comparisonCard}>
              <div className={styles.cardTop}>
                <span className={styles.cardTag}>Original</span>
                <span className={styles.cardMetaPill}>
                  {originalMeta.width} × {originalMeta.height} px · {formatFileSize(originalMeta.size)}
                </span>
              </div>
              <div className={styles.imageStageOriginal}>
                <ImagePreview
                  src={previewUrl}
                  alt={`Original: ${originalMeta.name}`}
                  className={styles.stageImage}
                />
              </div>
              <p className={styles.stageCaption}>
                Format: {getFormatLabel(originalMeta.type, originalMeta.name)}
              </p>
            </div>

            {/* Right: Background Removed (with Checkerboard) */}
            <div className={styles.comparisonCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.cardTag} ${styles.cardTagActive}`}>
                  Background Removed
                </span>
                <span className={styles.cardMetaPill}>
                  {resultMeta.width} × {resultMeta.height} px · {resultMeta.sizeFormatted}
                </span>
              </div>
              <div
                className={`${styles.imageStageCutout} ${
                  bgChoice === 'transparent'
                    ? styles.checkerboard
                    : bgChoice === 'white'
                      ? styles.bgWhite
                      : styles.bgBlack
                }`}
              >
                <ImagePreview
                  src={displayedUrl}
                  alt={`Background removed: ${originalMeta.name}`}
                  className={styles.stageImage}
                />
              </div>
              <p className={styles.stageCaption}>
                Format: PNG ({bgChoice === 'transparent' ? 'Alpha Transparency' : `${bgChoice} background`})
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className={styles.actionsRow}>
            <Button
              variant="secondary"
              icon={<IconImagePlus />}
              onClick={handleClear}
              aria-label="Remove background from another image"
            >
              Remove Another Background
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon={<IconDownload />}
              onClick={handleDownload}
              aria-label="Download PNG with background removed"
            >
              Download PNG
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}

export default RemoveBackgroundPage;
