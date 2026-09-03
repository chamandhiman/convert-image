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
  IconCrop,
  IconUndo,
  IconRedo,
  IconTrash,
} from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import { loadImage, getImageMeta, downloadBlob } from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';
import {
  executeGenerativeFill,
  cancelGenerativeFill,
  buildGenerativeFillFilename,
} from '@/tools/generativeFill/generativeFill';

import GenerativeFillCanvas from './GenerativeFillCanvas';
import GenerativeFillContent from './GenerativeFillContent';
import styles from './GenerativeFillPage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  GENERATING: 'generating',
  RESULT: 'result',
  ERROR: 'error',
};

function GenerativeFillPage() {
  useDocumentTitle('AI Generative Fill');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [imgElement, setImgElement] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Tool settings
  const [activeTool, setActiveTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(32);
  const [brushHardness] = useState(80);
  const [prompt, setPrompt] = useState('');
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [validationError, setValidationError] = useState('');

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

  const canvasRef = useRef(null);
  const rotatingTimerRef = useRef(null);

  // Rotating reassuring messages during processing
  const startRotatingMessages = useCallback(() => {
    const messages = [
      'Preparing your image…',
      'Understanding your selection…',
      'Creating the new content…',
      'Blending natural textures and lighting…',
      'Refining the details…',
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
      cancelGenerativeFill();
    };
  }, [stopRotatingMessages]);

  // Handle file select
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
      setValidationError('');
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

  // Run Generative Fill
  const handleGenerate = async () => {
    if (!imgElement || !file || !canvasRef.current) return;

    // Validation
    const maskCanvas = canvasRef.current.getMaskCanvas();
    const hasMask = canvasRef.current.hasMask();

    if (!hasMask) {
      setValidationError('Select an area of the image first using the brush tool.');
      return;
    }

    if (!prompt.trim()) {
      setValidationError("Describe what you'd like to add in the prompt box.");
      return;
    }

    setValidationError('');

    try {
      setPhase(PHASE.GENERATING);
      setProgressPercent(10);
      setProgressMsg('Preparing your image…');
      startRotatingMessages();

      const outResult = await executeGenerativeFill(imgElement, file, maskCanvas, {
        prompt: prompt.trim(),
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
      console.error('[GenerativeFillPage] Generation Error:', err);
      setError(err?.message || 'Something went wrong while creating your edit. Please try again.');
      setPhase(PHASE.ERROR);
    }
  };

  // Cancel processing
  const handleCancel = () => {
    cancelGenerativeFill();
    stopRotatingMessages();
    setPhase(PHASE.LOADED);
  };

  // Cleanup & start fresh
  const handleClear = () => {
    cancelGenerativeFill();
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
    setValidationError('');
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
          downloadBlob(blob, buildGenerativeFillFilename(file.name, 'jpg'));
        }, 'image/jpeg', 0.95);
      };
      img.src = result.url;
    } else {
      downloadBlob(result.blob, buildGenerativeFillFilename(file.name, 'png'));
    }
  };

  return (
    <ToolPageLayout
      title="AI Generative Fill"
      description="Select an area and generate new content from your description with in-browser AI. 100% private."
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
              dropLabel="Drag & drop an image to edit with Generative Fill"
              browseLabel="or choose a JPG, PNG, or WebP file"
            />
          </div>
        )}

        {/* ================================================================ */}
        {/*  LOADED PHASE — Selection Canvas & Prompt Bar                    */}
        {/* ================================================================ */}
        {phase === PHASE.LOADED && imageMeta && (
          <div className={styles.editorWorkspace}>
            {/* Top Toolbar */}
            <div className={styles.topToolbar} role="toolbar" aria-label="Selection and mask tools">
              {/* Tool Selector Group */}
              <div className={styles.toolGroup}>
                <button
                  type="button"
                  className={`${styles.toolBtn} ${activeTool === 'brush' ? styles.toolBtnActive : ''}`}
                  onClick={() => setActiveTool('brush')}
                  title="Brush (B)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9.06 11.9 8.04-8.05a2.85 2.85 0 0 1 4.03 4.03l-8.04 8.04" />
                    <path d="M7.07 14.94c-1.66 0-3 1.34-3 3 0 1.25.77 2.32 1.86 2.76.35.14.64.44.75.8.31 1.05 1.31 1.74 2.45 1.5 1.34-.28 2.07-1.74 1.44-2.94-.39-.75-.32-1.68.22-2.36l.91-.91-4.63-1.85z" />
                  </svg>
                  <span>Brush</span>
                </button>

                <button
                  type="button"
                  className={`${styles.toolBtn} ${activeTool === 'eraser' ? styles.toolBtnActive : ''}`}
                  onClick={() => setActiveTool('eraser')}
                  title="Eraser (E)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                    <path d="M22 21H7" />
                    <path d="m5 11 9 9" />
                  </svg>
                  <span>Eraser</span>
                </button>

                <button
                  type="button"
                  className={`${styles.toolBtn} ${activeTool === 'lasso' ? styles.toolBtnActive : ''}`}
                  onClick={() => setActiveTool('lasso')}
                  title="Lasso"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 22a5 5 0 0 1-2-4" />
                    <path d="M3.3 14A6.8 6.8 0 0 1 2 10c0-4.4 4.5-8 10-8s10 3.6 10 8-4.5 8-10 8a12 12 0 0 1-5-1" />
                    <path d="M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  </svg>
                  <span>Lasso</span>
                </button>

                <button
                  type="button"
                  className={`${styles.toolBtn} ${activeTool === 'rect' ? styles.toolBtnActive : ''}`}
                  onClick={() => setActiveTool('rect')}
                  title="Rectangle Selection"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 3" />
                  </svg>
                  <span>Rectangle</span>
                </button>
              </div>

              {/* Brush Size Slider */}
              <div className={styles.brushSizeControl}>
                <label htmlFor="brush-size">Size: {brushSize}px</label>
                <input
                  id="brush-size"
                  type="range"
                  min="8"
                  max="120"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className={styles.sizeSlider}
                />
              </div>

              <span className={styles.divider} aria-hidden="true" />

              {/* History Controls */}
              <div className={styles.toolGroup}>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => canvasRef.current?.undo()}
                  disabled={!historyState.canUndo}
                  title="Undo (Ctrl+Z)"
                  aria-label="Undo"
                >
                  <IconUndo />
                  <span>Undo</span>
                </button>

                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => canvasRef.current?.redo()}
                  disabled={!historyState.canRedo}
                  title="Redo (Ctrl+Y)"
                  aria-label="Redo"
                >
                  <IconRedo />
                  <span>Redo</span>
                </button>

                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => canvasRef.current?.clearMask()}
                  title="Clear Selection"
                  aria-label="Clear Selection"
                >
                  <IconTrash />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Interactive Canvas */}
            <GenerativeFillCanvas
              ref={canvasRef}
              imageSrc={previewUrl}
              originalWidth={imageMeta.width}
              originalHeight={imageMeta.height}
              activeTool={activeTool}
              brushSize={brushSize}
              brushHardness={brushHardness}
              onHistoryChange={setHistoryState}
            />

            {/* Inline Validation Alert */}
            {validationError && (
              <div className={styles.progressMessage} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                {validationError}
              </div>
            )}

            {/* Prominent Prompt Input Bar */}
            <div className={styles.promptBar}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (validationError) setValidationError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
                placeholder="Describe what you want to add... (e.g. Add a modern floor lamp, green plants, wooden table)"
                className={styles.promptInput}
                maxLength={140}
                aria-label="Generative fill prompt"
              />

              <Button
                variant="primary"
                size="lg"
                icon={<IconSparkles />}
                onClick={handleGenerate}
                aria-label="Generate with AI"
              >
                Generate
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  GENERATING PHASE — Processing Overlay                           */}
        {/* ================================================================ */}
        {phase === PHASE.GENERATING && (
          <div className={styles.processingOverlay} role="dialog" aria-modal="true" aria-label="Generating edit">
            <div className={styles.processingCard}>
              <div className={styles.spinnerHalo} aria-hidden="true" />
              <h3 className={styles.processingHeadline}>Creating your edit</h3>
              <p className={styles.processingSubtext}>
                We&apos;re generating new content inside the selected area. This runs locally on your device.
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
                aria-label="Cancel generation"
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

                {/* Generated Result Card */}
                <div className={styles.comparisonCard}>
                  <div className={styles.cardHeader}>
                    <span className={`${styles.cardTag} ${styles.cardTagResult}`}>Generated Result</span>
                    <span className={styles.cardDim}>{result.width} × {result.height} px ({formatFileSize(result.blob.size)})</span>
                  </div>
                  <div className={styles.cardPreviewBox}>
                    <img
                      src={result.url}
                      alt="Generated Result"
                      className={styles.resultImg}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: SPLIT SLIDER */}
            {viewMode === 'split' && (
              <div className={styles.splitBox}>
                <img src={result.url} alt="Generated Result" className={styles.splitImgAfter} />
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
                    alt="Generated Result"
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
                    Generated Overlay: {Math.round(overlayOpacity * 100)}%
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
                  icon={<IconCrop />}
                  onClick={handleEditAgain}
                  aria-label="Adjust selection"
                >
                  Adjust Selection
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
                  aria-label="Download Generated Image"
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
            <p className={styles.errorText}>{error || 'Something went wrong while creating your edit. Please try again.'}</p>
            <div className={styles.errorActionsRow}>
              <Button
                variant="primary"
                onClick={() => {
                  setError('');
                  if (imgElement && file) {
                    handleGenerate();
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
        <GenerativeFillContent />
      </div>
    </ToolPageLayout>
  );
}

export default GenerativeFillPage;
