import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
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
import { trackImageUpload, trackImageConvert, trackImageDownload } from '@/utils/analytics';

import sampleOriginalImg from '@/assets/images/sample-bg-original.jpg';
import sampleCutoutImg from '@/assets/images/sample-bg-cutout.jpg';
import sampleProductImg from '@/assets/images/sample-bg-product.jpg';
import samplePetImg from '@/assets/images/sample-bg-pet.jpg';
import sampleCarImg from '@/assets/images/sample-bg-car.jpg';

import RemoveBackgroundContent from './RemoveBackgroundContent';
import styles from './RemoveBackgroundPage.module.css';

/* ---------------------------------------------------------------------- */
/*  Supported input types for background removal                          */
/* ---------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------- */
/*  4 Sample Photos for 1-click testing                                    */
/* ---------------------------------------------------------------------- */
const SAMPLE_PHOTOS = [
  { id: 'sample-1', name: 'sample-portrait.jpg', title: 'Portrait', src: sampleOriginalImg },
  { id: 'sample-2', name: 'sample-sneaker.jpg', title: 'Product', src: sampleProductImg },
  { id: 'sample-3', name: 'sample-dog.jpg', title: 'Pet', src: samplePetImg },
  { id: 'sample-4', name: 'sample-car.jpg', title: 'Car', src: sampleCarImg },
];

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

  // Empty state before/after split slider
  const [emptySliderPos, setEmptySliderPos] = useState(50);
  const isEmptyDraggingRef = useRef(false);
  const emptyViewerRef = useRef(null);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  /* -------------------------------------------------------------------- */
  /*  Cleanup helper                                                      */
  /* -------------------------------------------------------------------- */
  const cleanup = useCallback(() => {
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
  }, [previewUrl, transparentUrl, displayedUrl]);

  /* -------------------------------------------------------------------- */
  /*  Empty state slider dragging logic                                   */
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
      if (isEmptyDraggingRef.current) updateEmptySliderPos(e.clientX);
    };
    const onUp = () => {
      isEmptyDraggingRef.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updateEmptySliderPos]);

  /* -------------------------------------------------------------------- */
  /*  File selection & background removal execution                       */
  /* -------------------------------------------------------------------- */
  const handleFileSelect = useCallback(async (f) => {
    if (!f) return;
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

      trackImageUpload({ tool: 'remove_background', format: f?.type });

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
      trackImageConvert({
        tool: 'remove_background',
        inputFormat: f?.type,
        outputFormat: 'image/png',
      });
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
  }, [cleanup]);

  /* -------------------------------------------------------------------- */
  /*  Sample photo click handler                                          */
  /* -------------------------------------------------------------------- */
  const handleSampleClick = async (sampleSrc, sampleName) => {
    try {
      const res = await fetch(sampleSrc);
      const blob = await res.blob();
      const sampleFile = new File([blob], sampleName, { type: blob.type || 'image/jpeg' });
      await handleFileSelect(sampleFile);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Drag & drop event handlers                                          */
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
  }, [handleFileSelect]);

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
    trackImageDownload({
      tool: 'remove_background',
      outputFormat: bgChoice === 'transparent' ? 'image/png' : 'image/jpeg',
    });
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
  /*  Render: Empty upload state (Premium Two-Column Workspace)           */
  /* -------------------------------------------------------------------- */
  const renderEmptyState = () => (
    <div className={styles.workspaceCard} data-testid="workspace-card">
      {/* -------------------------------------------------------------- */}
      {/*  LEFT COLUMN — Before & After Interactive Preview              */}
      {/* -------------------------------------------------------------- */}
      <div className={styles.previewCol} data-testid="preview-column">
        <div
          ref={emptyViewerRef}
          className={styles.splitViewer}
          onPointerDown={handleEmptyPointerDown}
          data-testid="sample-split-viewer"
          title="Drag divider to compare original image and transparent cutout"
        >
          {/* Background Layer: Cutout with transparent checkerboard */}
          <img
            src={sampleCutoutImg}
            alt="Cutout with Transparent Background (Sample)"
            className={styles.cutoutLayer}
          />
          <span className={styles.badgeRight} data-testid="badge-removed">
            Background Removed
          </span>

          {/* Foreground Layer: Original image with full background */}
          <div
            className={styles.originalLayerWrap}
            style={{
              clipPath: `inset(0 ${100 - emptySliderPos}% 0 0)`,
              WebkitClipPath: `inset(0 ${100 - emptySliderPos}% 0 0)`,
            }}
          >
            <img
              src={sampleOriginalImg}
              alt="Original Photo (Sample)"
              className={styles.originalLayer}
            />
          </div>

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
            aria-label="Drag original and cutout divider"
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
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  RIGHT COLUMN — Upload Dropzone & Sample Photos Picker         */}
      {/* -------------------------------------------------------------- */}
      <div className={styles.actionCol} data-testid="action-column">
        {/* Dashed Upload Dropzone */}
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
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={BG_ACCEPT_STRING}
            onChange={handleFileInputChange}
            className={styles.hiddenFileInput}
            data-testid="file-input"
          />

          {/* Glowing Cloud Upload Icon */}
          <div className={styles.cloudIconWrap} aria-hidden="true" data-testid="cloud-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m16 16-4-4-4 4" />
            </svg>
          </div>

          {/* Upload Heading & Subtitle */}
          <h2 className={styles.uploadTitle}>Upload your image</h2>
          <p className={styles.uploadSubtitle}>
            Drag &amp; drop your file here or{' '}
            <span className={styles.browseLink}>click to browse</span>
          </p>

          {/* Upload Image Primary Gradient Button */}
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload Image</span>
          </button>

          {/* Format and Size Note */}
          <span className={styles.formatHint} data-testid="format-hint">
            JPG, PNG, WebP &bull; Up to 25 MB
          </span>
        </div>

        {/* Quick Sample Photos Picker */}
        <div className={styles.sampleSection} data-testid="sample-section">
          <span className={styles.sampleLabel}>Try with a sample:</span>
          <div className={styles.sampleThumbnailsRow} role="group" aria-label="Sample photos for background removal">
            {SAMPLE_PHOTOS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className={styles.sampleThumbBtn}
                onClick={() => handleSampleClick(sample.src, sample.name)}
                title={`Try with ${sample.title}`}
                data-testid={`sample-thumb-${sample.id}`}
              >
                <img src={sample.src} alt={sample.title} className={styles.sampleThumbImg} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  BOTTOM ROW — 3 Core Feature Highlights                        */}
      {/* -------------------------------------------------------------- */}
      <div className={styles.featuresRow} data-testid="features-row">
        <div className={styles.featureItem} data-testid="feature-item">
          <div className={`${styles.featureIconBox} ${styles.featureIconWand}`} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
              <path d="m14 7 3 3" />
              <path d="M5 6v4" /><path d="M19 14v4" />
            </svg>
          </div>
          <div className={styles.featureTextBox}>
            <h4 className={styles.featureItemTitle} data-testid="feature-item-title">Automatic Background Removal</h4>
            <p className={styles.featureItemDesc} data-testid="feature-item-desc">Instant subject detection with sub-pixel neural edge matting</p>
          </div>
        </div>

        <div className={styles.featureItem} data-testid="feature-item">
          <div className={`${styles.featureIconBox} ${styles.featureIconTransparent}`} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          </div>
          <div className={styles.featureTextBox}>
            <h4 className={styles.featureItemTitle} data-testid="feature-item-title">Transparent PNG Export</h4>
            <p className={styles.featureItemDesc} data-testid="feature-item-desc">Download crisp 32-bit RGBA cutouts with full alpha transparency</p>
          </div>
        </div>

        <div className={styles.featureItem} data-testid="feature-item">
          <div className={`${styles.featureIconBox} ${styles.featureIconShield}`} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className={styles.featureTextBox}>
            <h4 className={styles.featureItemTitle} data-testid="feature-item-title">In-Browser Processing</h4>
            <p className={styles.featureItemDesc} data-testid="feature-item-desc">100% private, files processed locally on your device via WebAssembly</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* -------------------------------------------------------------------- */
  /*  Render: Two-column processing workspace                             */
  /* -------------------------------------------------------------------- */
  const renderProcessingWorkspace = () => (
    <div className={styles.processingWorkspace} data-testid="processing-workspace">
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
          <div className={styles.spinnerHalo} aria-hidden="true" />
          <h3 className={styles.processingTitle}>
            {phase === PHASE.PREPARING ? 'Loading AI Model' : 'Removing the background'}
          </h3>
          <p className={styles.processingSubtitle}>
            Separating the foreground subject from the background using client-side AI.
          </p>
        </div>

        <div className={styles.progressArea}>
          <div className={styles.progressBarWrap} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className={styles.progressInfoRow}>
            <p className={styles.statusMessage}>
              {progressMessage || 'Processing your image…'}
            </p>
            <span className={styles.progressPercentText}>{Math.min(progressPercent, 100)}%</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.cancelBtn}
          onClick={handleClear}
          data-testid="cancel-btn"
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
    <div className={styles.errorBlock} role="alert" data-testid="error-block">
      <div className={styles.errorIconWrap} aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className={styles.errorTitle}>Couldn&apos;t remove the background.</p>
      <p className={styles.errorText}>{error}</p>
      <div className={styles.errorActionsRow}>
        {file && (
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => handleFileSelect(file)}
            data-testid="retry-btn"
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
    <div className={styles.resultWorkspace} data-testid="result-workspace">
      <div className={styles.resultHeader}>
        <div>
          <span className={styles.successBadge}>✓ Background Removed</span>
          <h2 className={styles.resultTitle}>{originalMeta?.name}</h2>
        </div>
        <button
          type="button"
          className={styles.changeImageBtn}
          onClick={handleClear}
          data-testid="change-image-btn"
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
              data-testid={`backdrop-${opt.value}`}
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
                {originalMeta?.width} &times; {originalMeta?.height} px &bull; {formatFileSize(originalMeta?.size)}
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
                {resultMeta?.width} &times; {resultMeta?.height} px &bull; {resultMeta?.sizeFormatted}
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
          onClick={() => setCompareMode((prev) => (prev === 'side-by-side' ? 'overlay' : 'side-by-side'))}
          aria-label="Toggle comparison view"
          data-testid="toggle-view-btn"
        >
          {compareMode === 'side-by-side' ? 'Overlay View' : 'Side by Side'}
        </Button>
        <Button
          variant="primary"
          size="lg"
          icon={<IconDownload />}
          onClick={handleDownload}
          aria-label="Download PNG with background removed"
          data-testid="download-btn"
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
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      contentFullWidth
      content={<RemoveBackgroundContent />}
      showHero={false}
    >
      <div id="tool" className={styles.removebgRoot} data-testid="removebg-container">
        {/* ================================================================ */}
        {/*  CUSTOM HERO HEADER — Icon, Title, Subtitle, 5 Feature Badges    */}
        {/* ================================================================ */}
        <header className={styles.heroHeader} data-testid="removebg-hero">
          <div className={styles.titleRow}>
            <div className={styles.appIconBadge} aria-hidden="true" data-testid="app-icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </div>
            <h1 className={styles.heroTitle} data-testid="removebg-heading">
              <span className={styles.heroTitleDark}>Remove Image </span>
              <span className={styles.heroTitleGradient}>Background</span>
            </h1>
          </div>
          <p className={styles.heroSubtitle}>
            Upload your image and get a clean, transparent background in seconds.
          </p>

          <div className={styles.pillRow} role="list" aria-label="Tool benefits">
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">✨</span>
              <span>Auto Subject Detection</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">🏁</span>
              <span>Transparent PNG</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">🔒</span>
              <span>100% Client-Side Private</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">⚡</span>
              <span>Runs in Browser</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">🎯</span>
              <span>Full Resolution Export</span>
            </div>
          </div>
        </header>

        {/* ================================================================ */}
        {/*  IDLE PHASE — Premium Two-Column Workspace Card                  */}
        {/* ================================================================ */}
        {phase === PHASE.IDLE && renderEmptyState()}

        {/* ================================================================ */}
        {/*  HOW IT WORKS SECTION (Shown in IDLE Phase)                      */}
        {/* ================================================================ */}
        {phase === PHASE.IDLE && (
          <section className={styles.howItWorksSection} aria-label="How background removal works" data-testid="how-it-works-section">
            <h3 className={styles.howItWorksHeading}>How Background Removal Works</h3>
            <p className={styles.howItWorksSubtext}>
              Transform ordinary photos into professional transparent cutouts in three simple steps.
            </p>
            <div className={styles.stepsGrid}>
              <div className={styles.stepCard} data-testid="step-card">
                <span className={styles.stepNumberBadge} data-testid="step-num">01</span>
                <h4 className={styles.stepTitle} data-testid="step-title">Upload your image</h4>
                <p className={styles.stepDesc}>
                  Select or drag &amp; drop any JPG, PNG, or WebP photo up to 25 MB from your computer, tablet, or phone.
                </p>
              </div>

              <div className={styles.stepCard} data-testid="step-card">
                <span className={styles.stepNumberBadge} data-testid="step-num">02</span>
                <h4 className={styles.stepTitle} data-testid="step-title">Instant AI segmentation</h4>
                <p className={styles.stepDesc}>
                  Our client-side deep neural network detects your subject and creates a high-precision alpha mask directly in your browser.
                </p>
              </div>

              <div className={styles.stepCard} data-testid="step-card">
                <span className={styles.stepNumberBadge} data-testid="step-num">03</span>
                <h4 className={styles.stepTitle} data-testid="step-title">Preview &amp; download PNG</h4>
                <p className={styles.stepDesc}>
                  Inspect the result on a transparent checkerboard, solid white, or black backdrop, then download your 32-bit PNG.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/*  PREPARING & PROCESSING PHASES                                   */}
        {/* ================================================================ */}
        {isBusy && originalMeta && renderProcessingWorkspace()}

        {/* ================================================================ */}
        {/*  ERROR PHASE                                                     */}
        {/* ================================================================ */}
        {phase === PHASE.ERROR && renderError()}

        {/* ================================================================ */}
        {/*  DONE / RESULT PHASE                                             */}
        {/* ================================================================ */}
        {phase === PHASE.DONE && displayedUrl && originalMeta && resultMeta && renderResult()}
      </div>
    </ToolPageLayout>
  );
}

export default RemoveBackgroundPage;
