import { useState, useEffect, useRef, useCallback } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
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
  RESTORATION_STRENGTHS,
  restorePhoto,
  cancelRestoration,
  buildRestoredFilename,
} from '@/tools/photoRestorer/photoRestorer';

import PhotoRestorerContent from './PhotoRestorerContent';
import styles from './PhotoRestorerPage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  RESTORING: 'restoring',
  RESULT: 'result',
  ERROR: 'error',
};

function PhotoRestorerPage() {
  useDocumentTitle('AI Photo Restorer');

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
    } catch (err) {
      setError(err?.message || 'Failed to load photo.');
      setPhase(PHASE.ERROR);
    }
  }, []);

  // Check state bridge on mount
  useEffect(() => {
    const pending = consumePendingToolInput();
    if (pending?.file) {
      Promise.resolve().then(() => handleFileSelect(pending.file));
    }
  }, [handleFileSelect]);

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
      title="AI Photo Restorer"
      description="Restore old, damaged, blurry, or faded photos directly in your browser. 100% private with WebGPU acceleration."
    >
      <div className={styles.pageWrap}>
        {/* ================================================================ */}
        {/*  IDLE PHASE — File Upload                                        */}
        {/* ================================================================ */}
        {phase === PHASE.IDLE && (
          <div>
            <div className={styles.privacyBadge} role="note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Your image is processed locally in your browser.</span>
            </div>

            <FileUploader
              onFileSelect={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              maxSizeMb={50}
              dropLabel="Drag & drop a photo to restore with AI"
              browseLabel="or choose a JPG, PNG, or WebP file"
            />
          </div>
        )}

        {/* ================================================================ */}
        {/*  LOADED PHASE — Preview & Restoration Controls                   */}
        {/* ================================================================ */}
        {phase === PHASE.LOADED && imageMeta && (
          <div className={styles.editorWorkspace}>
            {/* Image Preview Card */}
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileDim}>
                  {imageMeta.width} × {imageMeta.height} px ({formatFileSize(file.size)})
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
            <div className={styles.controlsCard}>
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
          <div className={styles.processingOverlay} role="dialog" aria-modal="true" aria-label="Restoring photo">
            <div className={styles.processingCard}>
              <div className={styles.spinnerHalo} aria-hidden="true" />
              <h3 className={styles.processingHeadline}>Restoring your photo</h3>
              <p className={styles.processingSubtext}>
                We&apos;re enhancing the details and repairing damaged areas. This may take a moment.
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
          <div className={styles.resultWorkspace}>
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
                    <span className={styles.cardDim}>{imageMeta.width} × {imageMeta.height} px</span>
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
                    <span className={styles.cardDim}>{result.width} × {result.height} px ({formatFileSize(result.blob.size)})</span>
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
          <div className={styles.errorBlock} role="alert">
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

        {/* Editorial & SEO Section Below Tool */}
        <PhotoRestorerContent />
      </div>
    </ToolPageLayout>
  );
}

export default PhotoRestorerPage;
