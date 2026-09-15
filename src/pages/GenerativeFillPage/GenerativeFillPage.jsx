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
import { buildGenerativeFillFilename } from '@/tools/generativeFill/generativeFillUtils';
import { generateInpaint } from '@/tools/generativeFill/generativeFillApi';

import GenerativeFillCanvas from './GenerativeFillCanvas';
import GenerativeFillContent from './GenerativeFillContent';
import styles from './GenerativeFillPage.module.css';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Phase Constants                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */
const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  GENERATING: 'generating',
  RESULT: 'result',
  ERROR: 'error',
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Example Prompts                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */
const EXAMPLE_PROMPTS = [
  'Change the shirt color',
  'Make the sky a sunset',
  'Replace the background',
  'Add sunglasses',
  'Make it look cinematic',
  'Change day to night',
  'Add a plant',
  'Remove background clutter',
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Quick Action Categories                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Add Object', prompt: 'Add a ' },
  { label: 'Change Color', prompt: 'Change the color of the ' },
  { label: 'Change Background', prompt: 'Replace the background with ' },
  { label: 'Change Sky', prompt: 'Change the sky to ' },
  { label: 'Change Lighting', prompt: 'Make the lighting ' },
  { label: 'Remove Element', prompt: 'Remove the ' },
  { label: 'Enhance Style', prompt: 'Make the image look ' },
  { label: 'Change Time of Day', prompt: 'Turn this into a ' },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Processing Messages                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
const PROCESSING_MESSAGES = [
  'Preparing your image…',
  'Understanding your selection…',
  'Creating the new scene…',
  'Blending the result…',
  'Almost ready…',
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
function GenerativeFillPage({ embedded, embeddedOnly }) {
  useDocumentTitle('AI Generative Fill');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [imgElement, setImgElement] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Working image for iterative editing
  const [workingImgElement, setWorkingImgElement] = useState(null);
  const [editIteration, setEditIteration] = useState(0);

  // Tool settings
  const [refineEnabled, setRefineEnabled] = useState(false);
  const [activeTool, setActiveTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(32);
  const [brushHardness] = useState(80);
  const [prompt, setPrompt] = useState('');
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [validationError, setValidationError] = useState('');

  // Processing state
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('Creating your edit…');
  const [error, setError] = useState('');

  // Result state
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState('sidebyside');
  const [splitPos, setSplitPos] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [downloadFormat, setDownloadFormat] = useState('png');

  const canvasRef = useRef(null);
  const rotatingTimerRef = useRef(null);
  const promptInputRef = useRef(null);

  /* ── Rotating messages ── */
  const startRotatingMessages = useCallback(() => {
    let idx = 0;
    setProgressMsg(PROCESSING_MESSAGES[0]);
    rotatingTimerRef.current = setInterval(() => {
      idx = (idx + 1) % PROCESSING_MESSAGES.length;
      setProgressMsg(PROCESSING_MESSAGES[idx]);
    }, 2800);
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
    };
  }, [stopRotatingMessages]);

  /* ── File select ── */
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    try {
      const img = await loadImage(selectedFile);
      const meta = getImageMeta(img, selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setFile(selectedFile);
      setImgElement(img);
      setWorkingImgElement(img);
      setImageMeta(meta);
      setPreviewUrl(url);
      setPhase(PHASE.LOADED);
      setError('');
      setValidationError('');
      setRefineEnabled(false);
      setEditIteration(0);
      setResult(null);
      setPrompt('');
    } catch (err) {
      setError(err?.message || 'Failed to load image.');
      setPhase(PHASE.ERROR);
    }
  }, []);

  // State bridge
  useEffect(() => {
    const pending = consumePendingToolInput();
    if (pending?.file) {
      Promise.resolve().then(() => handleFileSelect(pending.file));
    }
  }, [handleFileSelect]);

  /* ── Example prompt chip ── */
  const handleChipClick = (chipText) => {
    setPrompt(chipText);
    setValidationError('');
    promptInputRef.current?.focus();
  };

  /* ── Quick action pill ── */
  const handleQuickAction = (actionPrompt) => {
    setPrompt(actionPrompt);
    setValidationError('');
    promptInputRef.current?.focus();
  };

  /* ── Generate ── */
  const handleGenerate = useCallback(async () => {
    if (!workingImgElement || !file) return;

    if (!prompt.trim()) {
      setValidationError("Please describe what you'd like to change.");
      promptInputRef.current?.focus();
      return;
    }

    setValidationError('');

    // Determine mask — use user-drawn mask if refine is enabled and has content
    let maskCanvas = null;
    if (refineEnabled && canvasRef.current) {
      const hasMask = canvasRef.current.hasMask();
      maskCanvas = hasMask ? canvasRef.current.getMaskCanvas() : null;
    }
    // If no mask, create a full-image mask so the API generates the entire image
    const effectiveMask = maskCanvas || (() => {
      const c = document.createElement('canvas');
      c.width = workingImgElement.naturalWidth || workingImgElement.width;
      c.height = workingImgElement.naturalHeight || workingImgElement.height;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      return c;
    })();

    try {
      setPhase(PHASE.GENERATING);
      setProgressPercent(5);
      startRotatingMessages();

      // Convert image to blob
      const imageBlob = await new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = workingImgElement.naturalWidth || workingImgElement.width;
        canvas.height = workingImgElement.naturalHeight || workingImgElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(workingImgElement, 0, 0);
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      // Convert mask to blob
      const maskBlob = await new Promise((resolve) => {
        effectiveMask.toBlob((b) => resolve(b), 'image/png');
      });

      const outBlob = await generateInpaint({
        imageBlob,
        maskBlob,
        prompt: prompt.trim(),
        onProgress: (prog) => {
          if (prog.percent) setProgressPercent(prog.percent);
          if (prog.message) setProgressMsg(prog.message);
        },
      });

      stopRotatingMessages();

      const outUrl = URL.createObjectURL(outBlob);
      const outResult = {
        blob: outBlob,
        url: outUrl,
        width: workingImgElement.naturalWidth || workingImgElement.width,
        height: workingImgElement.naturalHeight || workingImgElement.height,
      };

      // The result image becomes the working image for next iteration
      const newImg = new Image();
      newImg.src = outUrl;
      await new Promise((res) => {
        newImg.onload = res;
      });

      setWorkingImgElement(newImg);
      setResult(outResult);
      setViewMode('sidebyside');
      setEditIteration((n) => n + 1);
      setPhase(PHASE.RESULT);
    } catch (err) {
      stopRotatingMessages();
      console.error('[GenerativeFillPage] Generation Error:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
      setPhase(PHASE.ERROR);
    }
  }, [workingImgElement, file, prompt, refineEnabled, startRotatingMessages, stopRotatingMessages]);

  /* ── Cancel ── */
  const handleCancel = () => {
    stopRotatingMessages();
    setPhase(PHASE.LOADED);
  };

  /* ── Edit Again (keeps working image = last result for iteration) ── */
  const handleEditAgain = () => {
    setRefineEnabled(false);
    setPhase(PHASE.LOADED);
    // Keep workingImgElement = last result so next edit iterates from there
  };

  /* ── Refine Area from result screen ── */
  const handleRefineArea = () => {
    setRefineEnabled(true);
    setPhase(PHASE.LOADED);
  };

  /* ── New Photo ── */
  const handleClear = () => {
    stopRotatingMessages();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setImgElement(null);
    setWorkingImgElement(null);
    setImageMeta(null);
    setPreviewUrl('');
    setResult(null);
    setPrompt('');
    setRefineEnabled(false);
    setEditIteration(0);
    setPhase(PHASE.IDLE);
    setError('');
    setValidationError('');
  };

  /* ── Download ── */
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
        canvas.toBlob(
          (blob) => downloadBlob(blob, buildGenerativeFillFilename(file.name, 'jpg')),
          'image/jpeg',
          0.95
        );
      };
      img.src = result.url;
    } else {
      downloadBlob(result.blob, buildGenerativeFillFilename(file.name, 'png'));
    }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  Render                                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <ToolPageLayout
      title="AI Generative Fill"
      description="Describe what you'd like to change — then let AI create it. 100% private, runs in your browser."
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {phase === PHASE.IDLE && (
          <div>
            <div className={styles.uploadHeader}>
              <h2 className={styles.uploadTitle}>Edit your images with AI</h2>
              <p className={styles.uploadDesc}>
                Describe what you&apos;d like to change — then let AI create it.
              </p>
            </div>
            <FileUploader
              onFileSelect={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              maxSizeMb={50}
              dropLabel="Drag & drop an image to edit with AI"
              browseLabel="or choose a JPG, PNG, or WebP file"
            />
          </div>
        )}

        {/* ================================================================ */}
        {/*  LOADED PHASE — Prompt-First Editor                              */}
        {/* ================================================================ */}
        {phase === PHASE.LOADED && imageMeta && (
          <div className={styles.editorWorkspace}>
            {/* Iteration badge */}
            {editIteration > 0 && (
              <div className={styles.iterationBadge}>
                <IconSparkles />
                <span>Edit #{editIteration} — continuing from your last result</span>
              </div>
            )}

            {/* ── Image Preview Card ── */}
            <div className={styles.imagePreviewCard}>
              <div className={styles.previewImageWrap}>
                <img
                  src={editIteration > 0 ? result?.url : previewUrl}
                  alt="Image to edit"
                  className={styles.previewImage}
                  draggable={false}
                />
              </div>

              {/* Refine Area Canvas Overlay */}
              {refineEnabled && (
                <div className={styles.refineOverlay}>
                  <GenerativeFillCanvas
                    ref={canvasRef}
                    imageSrc={editIteration > 0 ? result?.url : previewUrl}
                    originalWidth={imageMeta.width}
                    originalHeight={imageMeta.height}
                    activeTool={activeTool}
                    brushSize={brushSize}
                    brushHardness={brushHardness}
                    onHistoryChange={setHistoryState}
                  />
                </div>
              )}
            </div>

            {/* Refine Area Toolbar (only when enabled) */}
            {refineEnabled && (
              <div className={styles.refineToolbar} role="toolbar" aria-label="Precision painting tools">
                <div className={styles.refineToolbarInner}>
                  <div className={styles.refineLabel}>
                    <IconCrop />
                    <span>Paint the area to edit</span>
                  </div>

                  <div className={styles.toolGroup}>
                    {[
                      { id: 'brush', label: 'Brush', icon: (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m9.06 11.9 8.04-8.05a2.85 2.85 0 0 1 4.03 4.03l-8.04 8.04" />
                          <path d="M7.07 14.94c-1.66 0-3 1.34-3 3 0 1.25.77 2.32 1.86 2.76.35.14.64.44.75.8.31 1.05 1.31 1.74 2.45 1.5 1.34-.28 2.07-1.74 1.44-2.94-.39-.75-.32-1.68.22-2.36l.91-.91-4.63-1.85z" />
                        </svg>
                      )},
                      { id: 'eraser', label: 'Eraser', icon: (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                          <path d="M22 21H7" />
                          <path d="m5 11 9 9" />
                        </svg>
                      )},
                      { id: 'lasso', label: 'Lasso', icon: (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 22a5 5 0 0 1-2-4" />
                          <path d="M3.3 14A6.8 6.8 0 0 1 2 10c0-4.4 4.5-8 10-8s10 3.6 10 8-4.5 8-10 8a12 12 0 0 1-5-1" />
                          <path d="M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                        </svg>
                      )},
                      { id: 'rect', label: 'Rectangle', icon: (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 3" />
                        </svg>
                      )},
                    ].map(({ id, label, icon }) => (
                      <button
                        key={id}
                        type="button"
                        className={`${styles.toolBtn} ${activeTool === id ? styles.toolBtnActive : ''}`}
                        onClick={() => setActiveTool(id)}
                        title={label}
                      >
                        {icon}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

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

                  <div className={styles.toolGroup}>
                    <button
                      type="button"
                      className={styles.toolBtn}
                      onClick={() => canvasRef.current?.undo()}
                      disabled={!historyState.canUndo}
                      title="Undo (Ctrl+Z)"
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
                    >
                      <IconRedo />
                      <span>Redo</span>
                    </button>
                    <button
                      type="button"
                      className={styles.toolBtn}
                      onClick={() => canvasRef.current?.clearMask()}
                      title="Clear Selection"
                    >
                      <IconTrash />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Hero Prompt Section ── */}
            <div className={styles.promptHero}>
              {/* Quick Action Categories */}
              <div className={styles.quickActions}>
                {QUICK_ACTIONS.map(({ label, prompt: actionPrompt }) => (
                  <button
                    key={label}
                    type="button"
                    className={styles.quickActionPill}
                    onClick={() => handleQuickAction(actionPrompt)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Main Prompt Input */}
              <div className={styles.promptInputRow}>
                <div className={styles.promptInputWrap}>
                  <svg
                    className={styles.promptIcon}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2a9.96 9.96 0 0 1 6.29 2.226 1 1 0 0 1-.033 1.515l-1.98 1.557A5.5 5.5 0 1 0 12 17.5V19a7 7 0 1 1 0-14v-.5" />
                    <path d="M12 6h.01" />
                    <path d="m15.536 11.293-4.536 1.207 1.207-4.536 7.5-7.5 3.329 3.329z" />
                  </svg>
                  <input
                    ref={promptInputRef}
                    type="text"
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGenerate();
                    }}
                    placeholder="Describe what you'd like to change… (e.g. Make the sky a sunset)"
                    className={styles.promptInput}
                    maxLength={160}
                    aria-label="Describe the edit you want"
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  icon={<IconSparkles />}
                  onClick={handleGenerate}
                  aria-label="Generate Edit with AI"
                  id="generate-edit-btn"
                >
                  Generate Edit
                </Button>
              </div>

              {/* Validation error */}
              {validationError && (
                <div className={styles.validationError} role="alert">
                  {validationError}
                </div>
              )}

              {/* Example Prompt Chips */}
              <div className={styles.exampleChipsRow}>
                <span className={styles.exampleChipsLabel}>Try:</span>
                <div className={styles.exampleChips}>
                  {EXAMPLE_PROMPTS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={styles.exampleChip}
                      onClick={() => handleChipClick(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Refine Area Toggle */}
              <div className={styles.refineToggleRow}>
                <button
                  type="button"
                  className={`${styles.refineToggleBtn} ${refineEnabled ? styles.refineToggleBtnActive : ''}`}
                  onClick={() => setRefineEnabled((v) => !v)}
                  aria-pressed={refineEnabled}
                  id="refine-area-toggle"
                >
                  <IconCrop />
                  <span>{refineEnabled ? 'Refine Area: On' : 'Refine Area (Optional)'}</span>
                  {refineEnabled && (
                    <span className={styles.refineBadge}>Paint to focus the edit on a specific region</span>
                  )}
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className={styles.editorActionBar}>
              <Button
                variant="tertiary"
                size="sm"
                icon={<IconImagePlus />}
                onClick={handleClear}
                aria-label="Upload a new photo"
              >
                New Photo
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  GENERATING PHASE                                                */}
        {/* ================================================================ */}
        {phase === PHASE.GENERATING && (
          <div className={styles.processingOverlay} role="dialog" aria-modal="true" aria-label="Creating your edit">
            <div className={styles.processingCard}>
              <div className={styles.spinnerRing} aria-hidden="true">
                <div className={styles.spinnerOrb} />
              </div>
              <h3 className={styles.processingHeadline}>Creating your edit</h3>
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
              <Button variant="secondary" size="sm" onClick={handleCancel} aria-label="Cancel generation">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  RESULT PHASE — Before / After Comparison                       */}
        {/* ================================================================ */}
        {phase === PHASE.RESULT && result && imageMeta && (
          <div className={styles.resultWorkspace}>
            {/* Edit Iteration Badge */}
            <div className={styles.resultMeta}>
              <div className={styles.resultIterationBadge}>
                <IconSparkles />
                <span>Edit #{editIteration}</span>
              </div>
              {prompt && (
                <div className={styles.resultPromptBadge}>
                  &ldquo;{prompt}&rdquo;
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className={styles.viewModeNav}>
              <div className={styles.viewModeToggle} role="group" aria-label="Comparison View Mode">
                {[
                  { id: 'sidebyside', label: 'Side by Side' },
                  { id: 'split', label: 'Split' },
                  { id: 'overlay', label: 'Overlay' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.toggleBtn} ${viewMode === id ? styles.toggleBtnActive : ''}`}
                    onClick={() => setViewMode(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Side by Side (default) ── */}
            {viewMode === 'sidebyside' && (
              <div className={styles.sideBySideGrid}>
                <div className={styles.comparisonCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTag}>Before</span>
                    <span className={styles.cardDim}>{imageMeta.width} × {imageMeta.height} px</span>
                  </div>
                  <div className={styles.cardPreviewBox}>
                    <img src={previewUrl} alt="Original" className={styles.resultImg} />
                  </div>
                </div>
                <div className={styles.comparisonCard}>
                  <div className={styles.cardHeader}>
                    <span className={`${styles.cardTag} ${styles.cardTagResult}`}>After</span>
                    <span className={styles.cardDim}>
                      {result.width} × {result.height} px ({formatFileSize(result.blob.size)})
                    </span>
                  </div>
                  <div className={styles.cardPreviewBox}>
                    <img src={result.url} alt="Generated Result" className={styles.resultImg} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Split Slider ── */}
            {viewMode === 'split' && (
              <div className={styles.splitBox}>
                <img src={result.url} alt="After" className={styles.splitImgAfter} />
                <div
                  className={styles.splitImgBeforeWrap}
                  style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                >
                  <img src={previewUrl} alt="Before" className={styles.splitImgBefore} />
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
                <div className={styles.splitLabels}>
                  <span>Before</span>
                  <span>After</span>
                </div>
              </div>
            )}

            {/* ── Overlay ── */}
            {viewMode === 'overlay' && (
              <div>
                <div className={styles.overlayBox}>
                  <img
                    src={previewUrl}
                    alt="Before"
                    style={{ position: 'absolute', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                  <img
                    src={result.url}
                    alt="After"
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
                  <label htmlFor="overlay-slider" className={styles.overlayLabel}>
                    After opacity: {Math.round(overlayOpacity * 100)}%
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

            {/* ── Result Action Bar ── */}
            <div className={styles.resultActionBar}>
              <div className={styles.actionGroupLeft}>
                <Button
                  variant="secondary"
                  icon={<IconEdit />}
                  onClick={handleEditAgain}
                  aria-label="Edit again"
                  id="edit-again-btn"
                >
                  Edit Again
                </Button>
                <Button
                  variant="secondary"
                  icon={<IconCrop />}
                  onClick={handleRefineArea}
                  aria-label="Refine area with precision brush"
                  id="refine-area-btn"
                >
                  Refine Area
                </Button>
                <Button
                  variant="tertiary"
                  icon={<IconImagePlus />}
                  onClick={handleClear}
                  aria-label="Upload a new photo"
                  id="new-photo-btn"
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
                  id="download-image-btn"
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
            <p className={styles.errorText}>
              {error || 'Something went wrong while creating your edit. Please try again.'}
            </p>
            <div className={styles.errorActionsRow}>
              <Button
                variant="primary"
                onClick={() => {
                  setError('');
                  if (workingImgElement && file) {
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
                  setPhase(imgElement ? PHASE.LOADED : PHASE.IDLE);
                }}
              >
                Go Back
              </Button>
            </div>
          </div>
        )}

        {/* Editorial & SEO Section */}
        <GenerativeFillContent />
      </div>
    </ToolPageLayout>
  );
}

export default GenerativeFillPage;
