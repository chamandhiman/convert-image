import { useState, useEffect, useRef, useCallback } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import { Button } from '@/components/ui/Button';
import {
  IconDownload,
  IconEdit,
  IconSparkles,
  IconImagePlus,
  IconZap,
} from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import { loadImage, getImageMeta, downloadBlob } from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';
import {
  trackImageUpload,
  trackImageConvert,
} from '@/utils/analytics';
import {
  RESTORATION_STRENGTHS,
  restorePhoto,
  cancelRestoration,
  buildRestoredFilename,
} from '@/tools/photoRestorer/photoRestorer';

import samplePortraitImg from '@/assets/images/sample-restore-portrait.jpg';
import sample1Img from '@/assets/images/sample-restore-1.jpg';
import sample2Img from '@/assets/images/sample-restore-2.jpg';
import sample3Img from '@/assets/images/sample-restore-3.jpg';
import sample4Img from '@/assets/images/sample-restore-4.jpg';

import PhotoRestorerContent from './PhotoRestorerContent';
import styles from './PhotoRestorerPage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  RESTORING: 'restoring',
  RESULT: 'result',
  ERROR: 'error',
};

const SAMPLE_PHOTOS = [
  { id: 'sample-1', name: 'vintage-family.jpg', title: 'Vintage Family', src: sample1Img },
  { id: 'sample-2', name: 'vintage-portrait.jpg', title: 'Vintage Portrait', src: sample2Img },
  { id: 'sample-3', name: 'vintage-classic-car.jpg', title: 'Classic Car', src: sample3Img },
  { id: 'sample-4', name: 'vintage-architecture.jpg', title: 'Architecture', src: sample4Img },
];

function PhotoRestorerPage({ embedded }) {
  useDocumentTitle('Photo Restorer — Restore Old & Damaged Photos with AI | Convert Image');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [imgElement, setImgElement] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Restoration settings
  const [strength, setStrength] = useState('balanced');

  // Processing state
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('Preparing your photo…');
  const [error, setError] = useState('');

  // Result state
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState('sidebyside');
  const [splitPos, setSplitPos] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [downloadFormat, setDownloadFormat] = useState('png');

  // Empty state before/after comparison slider
  const [emptySliderPos, setEmptySliderPos] = useState(50);
  const isEmptyDraggingRef = useRef(false);
  const emptyViewerRef = useRef(null);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const rotatingTimerRef = useRef(null);

  // Rotating reassuring messages during processing
  const startRotatingMessages = useCallback(() => {
    const messages = [
      'Preparing your photo…',
      'Analyzing image details and contrast…',
      'Restoring damaged areas and deblurring…',
      'Enhancing fine textures and edges…',
      'Refining colors and dynamic range…',
      'Almost there…',
    ];
    let idx = 0;
    rotatingTimerRef.current = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setProgressMsg(messages[idx]);
    }, 3200);
  }, []);

  const stopRotatingMessages = useCallback(() => {
    if (rotatingTimerRef.current) {
      clearInterval(rotatingTimerRef.current);
      rotatingTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRotatingMessages();
      cancelRestoration();
    };
  }, [stopRotatingMessages]);

  // Handle incoming file selection
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    try {
      const img = await loadImage(selectedFile);
      const meta = getImageMeta(img, selectedFile);
      const url = URL.createObjectURL(selectedFile);

      setFile(selectedFile);
      setImgElement(img);
      setImageMeta(meta);
      setPreviewUrl(url);
      setPhase(PHASE.LOADED);
      setError('');

      trackImageUpload({
        tool: 'photo-restorer',
        format: selectedFile.type,
      });
    } catch (err) {
      setError(err?.message || 'Failed to load photo.');
      setPhase(PHASE.ERROR);
    }
  }, []);

  // Handle loading sample images
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

  // Check state bridge on mount
  useEffect(() => {
    const pending = consumePendingToolInput();
    if (pending?.file) {
      Promise.resolve().then(() => handleFileSelect(pending.file));
    }
  }, [handleFileSelect]);

  // Empty state slider dragging
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

  // File picker trigger & drag-and-drop
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

  // Run AI Photo Restoration
  const handleRestore = async () => {
    if (!imgElement || !file) return;

    try {
      setPhase(PHASE.RESTORING);
      setProgressPercent(10);
      setProgressMsg('Preparing your photo…');
      startRotatingMessages();

      const outResult = await restorePhoto(imgElement, file, {
        strength,
        onProgress: (prog) => {
          if (prog.percent) {
            setProgressPercent(prog.percent);
          }
          if (prog.message) {
            setProgressMsg(prog.message);
          }
        },
      });

      stopRotatingMessages();
      setResult(outResult);
      setViewMode('sidebyside');
      setPhase(PHASE.RESULT);

      trackImageConvert({
        tool: 'photo-restorer',
        inputFormat: file?.type,
        outputFormat: downloadFormat,
      });
    } catch (err) {
      stopRotatingMessages();
      console.error('[PhotoRestorerPage] Restoration Error:', err);
      setError(err?.message || 'Something went wrong while restoring this photo. Please try again.');
      setPhase(PHASE.ERROR);
    }
  };

  // Cancel processing
  const handleCancel = () => {
    cancelRestoration();
    stopRotatingMessages();
    setPhase(PHASE.LOADED);
  };

  // Cleanup & start fresh
  const handleClear = () => {
    cancelRestoration();
    stopRotatingMessages();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);

    setFile(null);
    setImgElement(null);
    setImageMeta(null);
    setPreviewUrl('');
    setResult(null);
    setPhase(PHASE.IDLE);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Return to editor
  const handleEditAgain = () => {
    setPhase(PHASE.LOADED);
  };

  // Download final result
  const handleDownload = () => {
    if (!result?.blob || !file) return;

    if (downloadFormat === 'jpg' || downloadFormat === 'jpeg') {
      const canvas = document.createElement('canvas');
      canvas.width = result.width;
      canvas.height = result.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, result.width, result.height);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          downloadBlob(blob, buildRestoredFilename(file.name, 'jpg'));
        }, 'image/jpeg', 0.95);
      };
      img.src = result.url;
    } else {
      downloadBlob(result.blob, buildRestoredFilename(file.name, 'png'));
    }
  };

  return (
    <ToolPageLayout
      embedded={embedded}
      contentFullWidth
      content={<PhotoRestorerContent />}
      showHero={false}
    >
      <div id="tool" className={styles.restorerRoot} data-testid="restorer-container">
        {/* ================================================================ */}
        {/*  CUSTOM HERO HEADER — Icon, Title, Subtitle, 5 Feature Badges    */}
        {/* ================================================================ */}
        <header className={styles.heroHeader} data-testid="restorer-hero">
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
            <h1 className={styles.heroTitle} data-testid="restorer-heading">
              <span className={styles.heroTitleDark}>Photo </span>
              <span className={styles.heroTitleGradient}>Restorer</span>
            </h1>
          </div>
          <p className={styles.heroSubtitle}>
            Restore old, blurry, or damaged photos and bring back lost details with AI.
          </p>

          <div className={styles.pillRow} role="list" aria-label="Tool benefits">
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">🖼️</span>
              <span>Repair Old Photos</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">🩹</span>
              <span>Remove Scratches</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">✨</span>
              <span>Enhance Clarity</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">💧</span>
              <span>Restore Colors</span>
            </div>
            <div className={styles.pillItem} role="listitem" data-testid="pill-item">
              <span className={styles.pillIcon} aria-hidden="true">🛡️</span>
              <span>100% Private</span>
            </div>
          </div>
        </header>

        {/* ================================================================ */}
        {/*  IDLE PHASE — Premium Two-Column Workspace Card                  */}
        {/* ================================================================ */}
        {phase === PHASE.IDLE && (
          <div className={styles.workspaceCard} data-testid="workspace-card">
            {/* ------------------------------------------------------------ */}
            {/*  LEFT COLUMN — Before & After Interactive Preview            */}
            {/* ------------------------------------------------------------ */}
            <div className={styles.previewCol} data-testid="preview-column">
              <div
                ref={emptyViewerRef}
                className={styles.splitViewer}
                onPointerDown={handleEmptyPointerDown}
                data-testid="sample-split-viewer"
                title="Drag divider to compare original and restored"
              >
                {/* Background: Restored (Sharp, full-color portrait) */}
                <img
                  src={samplePortraitImg}
                  alt="Restored Portrait (Sample)"
                  className={styles.restoredLayer}
                />
                <span className={styles.badgeRight} data-testid="badge-restored">
                  Restored
                </span>

                {/* Foreground: Original (Sepia, scratched & aged photo) */}
                <div
                  className={styles.originalLayerWrap}
                  style={{
                    clipPath: `inset(0 ${100 - emptySliderPos}% 0 0)`,
                    WebkitClipPath: `inset(0 ${100 - emptySliderPos}% 0 0)`,
                  }}
                >
                  <img
                    src={samplePortraitImg}
                    alt="Original Damaged Photo (Sample)"
                    className={styles.originalLayerSepia}
                  />
                  {/* Authentic vintage cracked emulsion / scratch overlay */}
                  <svg className={styles.scratchOverlay} viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M40 10 L120 180 L180 260 M220 20 L270 140 L310 280 M340 50 L280 180 M80 220 L160 290" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" fill="none" />
                    <path d="M42 12 L122 182 L182 262 M222 22 L272 142 L312 282" stroke="rgba(0,0,0,0.2)" strokeWidth="0.6" fill="none" />
                    <circle cx="100" cy="80" r="1.5" fill="rgba(255,255,255,0.35)" />
                    <circle cx="250" cy="190" r="1.2" fill="rgba(255,255,255,0.35)" />
                    <circle cx="180" cy="110" r="1.8" fill="rgba(255,255,255,0.25)" />
                    <circle cx="320" cy="90" r="1.2" fill="rgba(255,255,255,0.35)" />
                    <circle cx="70" cy="240" r="1.5" fill="rgba(255,255,255,0.3)" />
                  </svg>
                </div>

                <span
                  className={styles.badgeLeft}
                  data-testid="badge-before"
                  style={{ opacity: emptySliderPos > 12 ? 1 : 0 }}
                >
                  Before
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
            </div>

            {/* ------------------------------------------------------------ */}
            {/*  RIGHT COLUMN — Upload Dropzone & Sample Photos Picker       */}
            {/* ------------------------------------------------------------ */}
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
                aria-label="Upload your photo: Drag & drop your file here or click to browse"
              >
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className={styles.hiddenFileInput}
                  data-testid="file-input"
                />

                {/* Cloud Upload Icon with Glowing Gradient Badge */}
                <div className={styles.cloudIconWrap} aria-hidden="true" data-testid="cloud-icon">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m16 16-4-4-4 4" />
                  </svg>
                </div>

                {/* Upload Heading */}
                <h2 className={styles.uploadTitle}>Upload your photo</h2>

                {/* Supporting Text */}
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

                {/* Format and Size Note */}
                <span className={styles.formatHint} data-testid="format-hint">
                  JPG, PNG, WebP, AVIF &bull; Up to 50 MB
                </span>
              </div>

              {/* Sample Photos Row */}
              <div className={styles.sampleSection} data-testid="sample-section">
                <span className={styles.sampleLabel}>Try with a sample:</span>
                <div className={styles.sampleThumbnailsRow} role="group" aria-label="Sample vintage photos">
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

            {/* ------------------------------------------------------------ */}
            {/*  BOTTOM ROW — 4 Core Feature Highlights                      */}
            {/* ------------------------------------------------------------ */}
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
                  <h4 className={styles.featureItemTitle} data-testid="feature-item-title">Remove Scratches</h4>
                  <p className={styles.featureItemDesc} data-testid="feature-item-desc">Repair cracks and damaged areas</p>
                </div>
              </div>

              <div className={styles.featureItem} data-testid="feature-item">
                <div className={`${styles.featureIconBox} ${styles.featureIconPalette}`} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
                  </svg>
                </div>
                <div className={styles.featureTextBox}>
                  <h4 className={styles.featureItemTitle} data-testid="feature-item-title">Fix Colors</h4>
                  <p className={styles.featureItemDesc} data-testid="feature-item-desc">Restore faded and dull colors</p>
                </div>
              </div>

              <div className={styles.featureItem} data-testid="feature-item">
                <div className={`${styles.featureIconBox} ${styles.featureIconPicture}`} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                <div className={styles.featureTextBox}>
                  <h4 className={styles.featureItemTitle} data-testid="feature-item-title">Sharpen Details</h4>
                  <p className={styles.featureItemDesc} data-testid="feature-item-desc">Recover missing details and clarity</p>
                </div>
              </div>

              <div className={styles.featureItem} data-testid="feature-item">
                <div className={`${styles.featureIconBox} ${styles.featureIconNoise}`} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" /><circle cx="20" cy="4" r="1.5" />
                    <circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="20" cy="12" r="1.5" />
                    <circle cx="4" cy="20" r="1.5" /><circle cx="12" cy="20" r="1.5" /><circle cx="20" cy="20" r="1.5" />
                  </svg>
                </div>
                <div className={styles.featureTextBox}>
                  <h4 className={styles.featureItemTitle} data-testid="feature-item-title">Reduce Noise</h4>
                  <p className={styles.featureItemDesc} data-testid="feature-item-desc">Clean and enhance image quality</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  HOW IT WORKS SECTION (Shown in IDLE Phase)                      */}
        {/* ================================================================ */}
        {phase === PHASE.IDLE && (
          <section className={styles.howItWorksSection} aria-label="How photo restoration works" data-testid="how-it-works-section">
            <h3 className={styles.howItWorksHeading}>How Photo Restoration Works</h3>
            <p className={styles.howItWorksSubtext}>
              Transform scratched, faded historical memories into vibrant photographs in three simple steps.
            </p>
            <div className={styles.stepsGrid}>
              <div className={styles.stepCard} data-testid="step-card">
                <span className={styles.stepNumberBadge} data-testid="step-num">01</span>
                <h4 className={styles.stepTitle} data-testid="step-title">Upload your old photo</h4>
                <p className={styles.stepDesc}>
                  Select or drag &amp; drop any vintage, blurry, scratched, or discolored photograph in JPG, PNG, or WebP format up to 50 MB.
                </p>
              </div>

              <div className={styles.stepCard} data-testid="step-card">
                <span className={styles.stepNumberBadge} data-testid="step-num">02</span>
                <h4 className={styles.stepTitle} data-testid="step-title">Apply restoration</h4>
                <p className={styles.stepDesc}>
                  Choose your preferred restoration strength and let the neural engine repair physical scratches, sharpen facial details, and revitalize colors locally.
                </p>
              </div>

              <div className={styles.stepCard} data-testid="step-card">
                <span className={styles.stepNumberBadge} data-testid="step-num">03</span>
                <h4 className={styles.stepTitle} data-testid="step-title">Preview and download</h4>
                <p className={styles.stepDesc}>
                  Inspect every detail with the interactive before-and-after comparison slider, then download your restored photo in full high definition.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/*  LOADED PHASE — Preview & Restoration Settings                   */}
        {/* ================================================================ */}
        {phase === PHASE.LOADED && imageMeta && file && (
          <div className={styles.editorWorkspace} data-testid="editor-workspace">
            {/* Image Preview Card */}
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileDim}>
                  {imageMeta.width} &times; {imageMeta.height} px ({formatFileSize(file.size)})
                </span>
              </div>
              <div className={styles.imageWorkspace}>
                <img
                  src={previewUrl}
                  alt="Source Photo to Restore"
                  className={styles.previewImg}
                />
              </div>
            </div>

            {/* Controls Card */}
            <div className={styles.controlsCard} data-testid="controls-card">
              <div className={styles.controlsHeader}>
                <h3 className={styles.sectionTitle}>Restoration Strength</h3>
              </div>

              {/* Strength Option Selector */}
              <div className={styles.strengthGrid} role="radiogroup" aria-label="Restoration Strength">
                {RESTORATION_STRENGTHS.map((s) => (
                  <div
                    key={s.id}
                    className={`${styles.strengthCard} ${strength === s.id ? styles.strengthCardActive : ''}`}
                    onClick={() => setStrength(s.id)}
                    role="radio"
                    aria-checked={strength === s.id}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') setStrength(s.id);
                    }}
                  >
                    <span className={styles.strengthLabel}>{s.label}</span>
                    <p className={styles.strengthDesc}>{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className={styles.editorActionRow}>
                <Button
                  variant="secondary"
                  icon={<IconImagePlus />}
                  onClick={handleClear}
                >
                  Change Photo
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  icon={<IconSparkles />}
                  onClick={handleRestore}
                  aria-label="Restore Photo with AI"
                >
                  Restore Photo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  RESTORING PHASE — Reassuring Processing Overlay                 */}
        {/* ================================================================ */}
        {phase === PHASE.RESTORING && (
          <div className={styles.processingOverlay} role="dialog" aria-modal="true" aria-label="Restoring photo" data-testid="processing-overlay">
            <div className={styles.processingCard}>
              <div className={styles.spinnerHalo} aria-hidden="true" />
              <h3 className={styles.processingHeadline}>Restoring your photo</h3>
              <p className={styles.processingSubtext}>
                We&apos;re enhancing details and repairing damaged areas. This runs locally in your browser.
              </p>
              <div className={styles.progressMessage}>
                {progressMsg}
              </div>

              {progressPercent > 0 && (
                <div className={styles.progressBarWrap} aria-hidden="true">
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                aria-label="Cancel photo restoration"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  RESULT PHASE — Side-by-Side Comparison & Action Bar             */}
        {/* ================================================================ */}
        {phase === PHASE.RESULT && result && imageMeta && (
          <div className={styles.resultWorkspace} data-testid="result-workspace">
            {/* View Mode Segmented Control */}
            <div className={styles.viewModeNav}>
              <div className={styles.viewModeToggle} role="group" aria-label="Comparison View Mode">
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${viewMode === 'sidebyside' ? styles.toggleBtnActive : ''}`}
                  onClick={() => setViewMode('sidebyside')}
                >
                  Side by Side
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${viewMode === 'split' ? styles.toggleBtnActive : ''}`}
                  onClick={() => setViewMode('split')}
                >
                  Split
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${viewMode === 'overlay' ? styles.toggleBtnActive : ''}`}
                  onClick={() => setViewMode('overlay')}
                >
                  Overlay
                </button>
              </div>
            </div>

            {/* Mode 1: SIDE BY SIDE (DEFAULT) */}
            {viewMode === 'sidebyside' && (
              <div className={styles.sideBySideGrid}>
                {/* Original Card */}
                <div className={styles.comparisonCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTag}>Original Photo</span>
                    <span className={styles.cardDim}>{imageMeta.width} &times; {imageMeta.height} px</span>
                  </div>
                  <div className={styles.cardPreviewBox}>
                    <img
                      src={previewUrl}
                      alt="Original"
                      className={styles.resultImg}
                    />
                  </div>
                </div>

                {/* Restored Card */}
                <div className={styles.comparisonCard}>
                  <div className={styles.cardHeader}>
                    <span className={`${styles.cardTag} ${styles.cardTagResult}`}>Restored Result</span>
                    <span className={styles.cardDim}>{result.width} &times; {result.height} px ({formatFileSize(result.blob.size)})</span>
                  </div>
                  <div className={styles.cardPreviewBox}>
                    <img
                      src={result.url}
                      alt="Restored Result"
                      className={styles.resultImg}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: SPLIT SLIDER */}
            {viewMode === 'split' && (
              <div className={styles.splitBox}>
                <img src={result.url} alt="Restored Result" className={styles.splitImgAfter} />
                <div
                  className={styles.splitImgBeforeWrap}
                  style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                >
                  <img src={previewUrl} alt="Original" className={styles.splitImgBefore} />
                </div>
                <div className={styles.splitDivider} style={{ left: `${splitPos}%` }}>
                  <div className={styles.splitHandle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={splitPos}
                  onChange={(e) => setSplitPos(Number(e.target.value))}
                  className={styles.splitRangeInput}
                  aria-label="Split comparison position"
                />
              </div>
            )}

            {/* Mode 3: OVERLAY */}
            {viewMode === 'overlay' && (
              <div>
                <div className={styles.overlayBox}>
                  <img
                    src={previewUrl}
                    alt="Original"
                    style={{ position: 'absolute', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                  <img
                    src={result.url}
                    alt="Restored Result"
                    style={{
                      position: 'absolute',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      opacity: overlayOpacity,
                    }}
                  />
                </div>
                <div className={styles.overlayControls}>
                  <label htmlFor="overlay-slider" className={styles.inputLabel}>
                    Restored Overlay: {Math.round(overlayOpacity * 100)}%
                  </label>
                  <input
                    id="overlay-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className={styles.overlaySlider}
                  />
                </div>
              </div>
            )}

            {/* Result Action Bar */}
            <div className={styles.resultActionBar}>
              <div className={styles.actionGroupLeft}>
                <Button
                  variant="secondary"
                  icon={<IconEdit />}
                  onClick={handleEditAgain}
                  aria-label="Edit again"
                >
                  Edit Again
                </Button>

                <Button
                  variant="secondary"
                  icon={<IconZap />}
                  onClick={handleEditAgain}
                  aria-label="Adjust restoration settings"
                >
                  Adjust Restoration
                </Button>

                <Button
                  variant="tertiary"
                  icon={<IconImagePlus />}
                  onClick={handleClear}
                  aria-label="Upload a new photo"
                >
                  New Photo
                </Button>
              </div>

              <div className={styles.actionGroupRight}>
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className={styles.formatSelect}
                  aria-label="Download format"
                >
                  <option value="png">PNG (Lossless)</option>
                  <option value="jpg">JPG (Compressed)</option>
                </select>

                <Button
                  variant="primary"
                  size="lg"
                  icon={<IconDownload />}
                  onClick={handleDownload}
                  aria-label="Download Restored Photo"
                >
                  Download Image
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  ERROR PHASE                                                     */}
        {/* ================================================================ */}
        {phase === PHASE.ERROR && (
          <div className={styles.errorBlock} role="alert" data-testid="error-block">
            <h3 className={styles.errorTitle}>Something went wrong</h3>
            <p className={styles.errorText}>{error || "We couldn't restore this photo. Please try again."}</p>
            <div className={styles.errorActionsRow}>
              <Button
                variant="primary"
                onClick={() => {
                  setError('');
                  if (imgElement && file) {
                    handleRestore();
                  } else {
                    handleClear();
                  }
                }}
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setError('');
                  setPhase(PHASE.LOADED);
                }}
              >
                Edit Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}

export default PhotoRestorerPage;
