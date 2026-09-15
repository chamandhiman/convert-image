import { useState, useMemo, useEffect } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import MultiImageUploader from '@/components/ui/MultiImageUploader';
import ImagePreview from '@/components/ui/ImagePreview';
import { Button } from '@/components/ui/Button';
import {
  IconDownload,
  IconImagePlus,
  IconSelection,
} from '@/components/ui/Icons/Icons';
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

function RemoveBackgroundPage({ embedded, embeddedOnly }) {
  useDocumentTitle('Remove Image Background Online Free | Convert Image');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const [transparentBlob, setTransparentBlob] = useState(null);
  const [transparentUrl, setTransparentUrl] = useState('');

  const [bgChoice, setBgChoice] = useState('transparent');
  const [displayedBlob, setDisplayedBlob] = useState(null);
  const [displayedUrl, setDisplayedUrl] = useState('');

  const [error, setError] = useState('');
  const [compareMode, setCompareMode] = useState('side-by-side');

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

  /* -------------------------------------------------------------------- */
  /*  MultiImageUploader file-change handler — accept first file only     */
  /* -------------------------------------------------------------------- */
  const handleFilesChange = (files) => {
    if (!files || files.length === 0) return;
    const first = files[0];
    if (first) {
      handleFileSelect(first);
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
  /*  Handle background color selection                                   */
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

  /* -------------------------------------------------------------------- */
  /*  Render: Empty upload state                                          */
  /* -------------------------------------------------------------------- */
  const renderEmptyState = () => (
    <div className={styles.uploadSurface}>
      <div className={styles.uploadHeader}>
        <h2 className={styles.uploadTitle}>Remove background from your image</h2>
        <p className={styles.uploadDesc}>
          Upload an image and we&apos;ll automatically remove the background. Supports JPG, PNG, and WebP.
        </p>
      </div>

      <MultiImageUploader
        onFilesChange={handleFilesChange}
        onFileSelect={handleFileSelect}
        accept={BG_ACCEPT_STRING}
        acceptedTypes={BG_INPUT_TYPES}
        hint="JPG, PNG, or WebP — up to 25 MB"
      />

      {error && (
        <p className={styles.emptyError} role="status">
          {error}
        </p>
      )}
    </div>
  );

  /* -------------------------------------------------------------------- */
  /*  Render: Two-column processing workspace                             */
  /* -------------------------------------------------------------------- */
  const renderProcessingWorkspace = () => (
    <div className={styles.processingWorkspace}>
      <div className={styles.previewPane}>
        <span className={styles.previewLabel}>Original image</span>
        <div className={styles.previewImageWrap}>
          <ImagePreview
            src={previewUrl}
            alt={originalMeta?.name || 'Original image'}
            className={styles.previewImage}
          />
        </div>
      </div>

      <div className={styles.processingPanel}>
        <div className={styles.processingHeader}>
          <h3 className={styles.processingTitle}>
            {phase === PHASE.PREPARING ? 'Loading AI Model' : 'Removing the background'}
          </h3>
          <p className={styles.processingSubtitle}>
            We're carefully separating the subject from the background. This may take a moment.
          </p>
        </div>

        <div className={styles.progressArea}>
          <div className={styles.progressRing} aria-hidden="true" />
          <div className={styles.progressBarWrap} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <p className={styles.statusMessage}>
            {progressMessage || 'Processing your image…'}
          </p>
        </div>

        <button
          type="button"
          className={styles.cancelBtn}
          onClick={handleClear}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  /* -------------------------------------------------------------------- */
  /*  Render: Error state                                                 */
  /* -------------------------------------------------------------------- */
  const renderError = () => (
    <div className={styles.errorBlock} role="alert">
      <p className={styles.errorTitle}>Couldn&apos;t remove the background.</p>
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
  );

  /* -------------------------------------------------------------------- */
  /*  Render: Result workspace                                            */
  /* -------------------------------------------------------------------- */
  const renderResult = () => (
    <div className={styles.resultWorkspace}>
      <div className={styles.resultHeader}>
        <div>
          <span className={styles.successBadge}>✓ Background Removed</span>
          <h2 className={styles.resultTitle}>{originalMeta?.name}</h2>
        </div>
        <button
          type="button"
          className={styles.changeImageBtn}
          onClick={handleClear}
        >
          Remove another background
        </button>
      </div>

      <div className={styles.backdropSelectorCard}>
        <span className={styles.backdropLabel}>Backdrop:</span>
        <div className={styles.backdropOptions} role="radiogroup" aria-label="Backdrop color">
          {[
            { value: 'transparent', label: 'Transparent (Default)', swatchClass: styles.swatchTransparent },
            { value: 'white', label: 'White', swatchClass: styles.swatchWhite },
            { value: 'black', label: 'Black', swatchClass: styles.swatchBlack },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={bgChoice === opt.value}
              className={`${styles.backdropBtn} ${bgChoice === opt.value ? styles.backdropBtnActive : ''}`}
              onClick={() => handleBgColorChange(opt.value)}
            >
              <span className={`${styles.swatch} ${opt.swatchClass}`} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {compareMode === 'side-by-side' ? (
        <div className={styles.comparisonContainer}>
          <div className={styles.comparisonCard}>
            <div className={styles.cardTop}>
              <span className={styles.cardTag}>Original</span>
              <span className={styles.cardMetaPill}>
                {originalMeta?.width} × {originalMeta?.height} px · {formatFileSize(originalMeta?.size)}
              </span>
            </div>
            <div className={styles.imageStageOriginal}>
              <ImagePreview
                src={previewUrl}
                alt={`Original: ${originalMeta?.name}`}
                className={styles.stageImage}
              />
            </div>
            <p className={styles.stageCaption}>
              Format: {getFormatLabel(originalMeta?.type, originalMeta?.name)}
            </p>
          </div>

          <div className={styles.comparisonCard}>
            <div className={styles.cardTop}>
              <span className={`${styles.cardTag} ${styles.cardTagActive}`}>Background Removed</span>
              <span className={styles.cardMetaPill}>
                {resultMeta?.width} × {resultMeta?.height} px · {resultMeta?.sizeFormatted}
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
                alt={`Background removed: ${originalMeta?.name}`}
                className={styles.stageImage}
              />
            </div>
            <p className={styles.stageCaption}>
              Format: PNG ({bgChoice === 'transparent' ? 'Alpha Transparency' : `${bgChoice} background`})
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.overlayComparison}>
          <div className={styles.overlayStage}>
            <ImagePreview
              src={previewUrl}
              alt={`Original: ${originalMeta?.name}`}
              className={`${styles.stageImage} ${styles.overlayBase}`}
            />
            <ImagePreview
              src={displayedUrl}
              alt={`Background removed: ${originalMeta?.name}`}
              className={`${styles.stageImage} ${styles.overlayTop}`}
            />
            <div className={styles.overlayLabel}>Original</div>
            <div className={`${styles.overlayLabel} ${styles.overlayLabelRight}`}>Result</div>
          </div>
        </div>
      )}

      <div className={styles.actionsRow}>
        <Button
          variant="secondary"
          icon={<IconImagePlus />}
          onClick={handleClear}
          aria-label="Remove background from another image"
        >
          Edit Again
        </Button>
        <Button
          variant="secondary"
          icon={<IconSelection />}
          onClick={() => setCompareMode((prev) => prev === 'side-by-side' ? 'overlay' : 'side-by-side')}
          aria-label="Toggle comparison view"
        >
          {compareMode === 'side-by-side' ? 'Overlay' : 'Side by Side'}
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
  );

  /* -------------------------------------------------------------------- */
  /*  Main render                                                         */
  /* -------------------------------------------------------------------- */
  const isBusy = phase === PHASE.PREPARING || phase === PHASE.PROCESSING;

  return (
    <ToolPageLayout
      badge="Free · In-Browser"
      title="Remove backgrounds from images"
      subtitle="Automatically remove backgrounds from your images and create clean, transparent cutouts directly in your browser."
      contentFullWidth
      content={<RemoveBackgroundContent />}
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {phase === PHASE.IDLE && renderEmptyState()}

        {isBusy && originalMeta && renderProcessingWorkspace()}

        {phase === PHASE.ERROR && renderError()}

        {phase === PHASE.DONE && displayedUrl && originalMeta && resultMeta && renderResult()}
      </div>
    </ToolPageLayout>
  );
}

export default RemoveBackgroundPage;
