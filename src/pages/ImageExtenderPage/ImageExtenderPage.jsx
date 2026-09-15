import { useState, useEffect, useRef, useCallback } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import {
  IconDownload,
  IconEdit,
  IconCrop,
  IconImagePlus,
  IconSparkles,
} from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import { loadImage, getImageMeta, downloadBlob } from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';
import {
  EXTENSION_RATIOS,
  calculatePaddingForRatio,
  extendImage,
  cancelExtension,
  buildExtendedFilename,
} from '@/tools/imageExtender/imageExtender';
import ImageExtenderCanvas from './ImageExtenderCanvas';
import ImageExtenderContent from './ImageExtenderContent';
import styles from './ImageExtenderPage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  EXTENDING: 'extending',
  RESULT: 'result',
  ERROR: 'error',
};

function ImageExtenderPage({ embedded }) {
  useDocumentTitle('AI Image Extender');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [imgElement, setImgElement] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Extension settings
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [padding, setPadding] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const [prompt, setPrompt] = useState('');

  // Processing state
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('Preparing your image…');
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
      'Preparing your image…',
      'Analyzing the scene context…',
      'Creating the extended background area…',
      'Blending natural lighting and textures…',
      'Finalizing high-resolution output…',
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
      cancelExtension();
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

      // Default to 16:9 ratio calculation
      const initialPad = calculatePaddingForRatio(meta.width, meta.height, '16:9');
      setPadding({
        left: initialPad.left,
        right: initialPad.right,
        top: initialPad.top,
        bottom: initialPad.bottom,
      });
      setSelectedRatio('16:9');
      setPhase(PHASE.LOADED);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to load image.');
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

  // Handle ratio preset change
  const handleRatioSelect = (ratioId) => {
    setSelectedRatio(ratioId);
    if (!imageMeta) return;

    if (ratioId === 'custom') {
      // Keep existing padding or default to 100px each side
      if (padding.left === 0 && padding.right === 0 && padding.top === 0 && padding.bottom === 0) {
        setPadding({ left: 100, right: 100, top: 0, bottom: 0 });
      }
    } else {
      const calculated = calculatePaddingForRatio(imageMeta.width, imageMeta.height, ratioId);
      setPadding({
        left: calculated.left,
        right: calculated.right,
        top: calculated.top,
        bottom: calculated.bottom,
      });
    }
  };

  // Handle manual padding changes
  const handlePaddingChange = (side, value) => {
    const val = Math.max(0, parseInt(value, 10) || 0);
    setSelectedRatio('custom');
    setPadding((prev) => ({
      ...prev,
      [side]: val,
    }));
  };

  // Run AI Extension
  const handleExtend = async () => {
    if (!imgElement || !file) return;

    try {
      setPhase(PHASE.EXTENDING);
      setProgressPercent(10);
      setProgressMsg('Preparing your image…');
      startRotatingMessages();

      const outResult = await extendImage(imgElement, file, padding, {
        prompt,
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
      console.error('[ImageExtenderPage] Extension Error:', err);
      setError(err?.message || "We couldn't extend this image. Please try again.");
      setPhase(PHASE.ERROR);
    }
  };

  // Cancel processing
  const handleCancel = () => {
    cancelExtension();
    stopRotatingMessages();
    setPhase(PHASE.LOADED);
  };

  // Cleanup & start fresh
  const handleClear = () => {
    cancelExtension();
    stopRotatingMessages();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);

    setFile(null);
    setImgElement(null);
    setImageMeta(null);
    setPreviewUrl('');
    setResult(null);
    setPrompt('');
    setPhase(PHASE.IDLE);
    setError('');
  };

  // Re-edit workflow (returns to extension setup preserving current state)
  const handleEditAgain = () => {
    setPhase(PHASE.LOADED);
  };

  // Download final result
  const handleDownload = () => {
    if (!result?.blob || !file) return;

    if (downloadFormat === 'jpg' || downloadFormat === 'jpeg') {
      // Convert to high quality JPG
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
          downloadBlob(blob, buildExtendedFilename(file.name, 'jpg'));
        }, 'image/jpeg', 0.95);
      };
      img.src = result.url;
    } else {
      downloadBlob(result.blob, buildExtendedFilename(file.name, 'png'));
    }
  };

  const targetWidth = imageMeta ? imageMeta.width + padding.left + padding.right : 0;
  const targetHeight = imageMeta ? imageMeta.height + padding.top + padding.bottom : 0;

  return (
    <ToolPageLayout
      title="AI Image Extender"
      description="Expand image borders into 16:9, 4:5, or custom aspect ratios with neural outpainting. 100% private in your browser."
      embedded={embedded}
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {phase === PHASE.IDLE && (
          <div>
            <div className={styles.uploadHeader}>
              <h2 className={styles.uploadTitle}>Extend your images</h2>
              <p className={styles.uploadDesc}>
                Expand image borders into 16:9, 4:5, or custom aspect ratios with AI.
              </p>
            </div>
            <FileUploader
              onFileSelect={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              maxSizeMb={50}
              dropLabel="Drag & drop a photo to expand with AI"
              browseLabel="or choose a JPG, PNG, or WebP file"
            />
          </div>
        )}

        {/* ================================================================ */}
        {/*  LOADED PHASE — Extension Canvas & Settings                      */}
        {/* ================================================================ */}
        {phase === PHASE.LOADED && imageMeta && (
          <div className={styles.editorWorkspace}>
            {/* Interactive Canvas Preview */}
            <ImageExtenderCanvas
              imageSrc={previewUrl}
              originalWidth={imageMeta.width}
              originalHeight={imageMeta.height}
              padding={padding}
            />

            {/* Controls Panel */}
            <div className={styles.controlsCard}>
              <div className={styles.controlsHeader}>
                <h3 className={styles.sectionTitle}>Expansion Aspect Ratio</h3>
                <span className={styles.dimSummary}>
                  Target: <strong>{targetWidth} × {targetHeight} px</strong> ({imageMeta.width} × {imageMeta.height} original)
                </span>
              </div>

              {/* Preset Ratios */}
              <div className={styles.presetsBar} role="group" aria-label="Aspect Ratio Presets">
                {EXTENSION_RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`${styles.presetBtn} ${selectedRatio === r.id ? styles.presetBtnActive : ''}`}
                    onClick={() => handleRatioSelect(r.id)}
                    title={r.desc}
                  >
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>

              {/* Directional Padding Inputs */}
              <div className={styles.paddingInputsGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="pad-left" className={styles.inputLabel}>
                    Left (+px)
                  </label>
                  <input
                    id="pad-left"
                    type="number"
                    min="0"
                    max="3000"
                    step="10"
                    value={padding.left}
                    onChange={(e) => handlePaddingChange('left', e.target.value)}
                    className={styles.numberInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="pad-right" className={styles.inputLabel}>
                    Right (+px)
                  </label>
                  <input
                    id="pad-right"
                    type="number"
                    min="0"
                    max="3000"
                    step="10"
                    value={padding.right}
                    onChange={(e) => handlePaddingChange('right', e.target.value)}
                    className={styles.numberInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="pad-top" className={styles.inputLabel}>
                    Top (+px)
                  </label>
                  <input
                    id="pad-top"
                    type="number"
                    min="0"
                    max="3000"
                    step="10"
                    value={padding.top}
                    onChange={(e) => handlePaddingChange('top', e.target.value)}
                    className={styles.numberInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="pad-bottom" className={styles.inputLabel}>
                    Bottom (+px)
                  </label>
                  <input
                    id="pad-bottom"
                    type="number"
                    min="0"
                    max="3000"
                    step="10"
                    value={padding.bottom}
                    onChange={(e) => handlePaddingChange('bottom', e.target.value)}
                    className={styles.numberInput}
                  />
                </div>
              </div>

              {/* Optional Prompt Field */}
              <div className={styles.promptRow}>
                <label htmlFor="extender-prompt" className={styles.inputLabel}>
                  Describe what should appear in the expanded area (optional)
                </label>
                <input
                  id="extender-prompt"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Continue the beach and sky naturally"
                  className={styles.promptInput}
                  maxLength={120}
                />
              </div>

              {/* Action Trigger */}
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
                  onClick={handleExtend}
                  aria-label="Extend Image with AI"
                >
                  Extend Image
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  EXTENDING PHASE — Reassuring Processing Overlay                 */}
        {/* ================================================================ */}
        {phase === PHASE.EXTENDING && (
          <div className={styles.processingOverlay} role="dialog" aria-modal="true" aria-label="Extending image">
            <div className={styles.processingCard}>
              <div className={styles.spinnerHalo} aria-hidden="true" />
              <h3 className={styles.processingHeadline}>Extending your image</h3>
              <p className={styles.processingSubtext}>
                We’re creating a natural continuation of your photo. This runs locally on your hardware.
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
                aria-label="Cancel image extension"
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
                      className={styles.previewImg}
                    />
                  </div>
                </div>

                {/* Extended Card */}
                <div className={styles.comparisonCard}>
                  <div className={styles.cardHeader}>
                    <span className={`${styles.cardTag} ${styles.cardTagResult}`}>Extended Canvas</span>
                    <span className={styles.cardDim}>{result.width} × {result.height} px ({formatFileSize(result.blob.size)})</span>
                  </div>
                  <div className={styles.cardPreviewBox}>
                    <img
                      src={result.url}
                      alt="Extended Result"
                      className={styles.previewImg}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: SPLIT SLIDER */}
            {viewMode === 'split' && (
              <div className={styles.splitBox}>
                <img src={result.url} alt="Extended Result" className={styles.splitImgAfter} />
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
                    alt="Extended Result"
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
                    Extended Overlay: {Math.round(overlayOpacity * 100)}%
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

            {/* Result Action Bar following Global Button Hierarchy */}
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
                  icon={<IconCrop />}
                  onClick={handleEditAgain}
                  aria-label="Adjust extension settings"
                >
                  Adjust Extension
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
                  aria-label="Download Extended Image"
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
            <p className={styles.errorText}>{error || "We couldn't extend this image. Please try again."}</p>
            <div className={styles.errorActionsRow}>
              <Button
                variant="primary"
                onClick={() => {
                  setError('');
                  if (imgElement && file) {
                    handleExtend();
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
        <ImageExtenderContent />
      </div>
    </ToolPageLayout>
  );
}

export default ImageExtenderPage;
