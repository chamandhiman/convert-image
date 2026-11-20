import { useState, useEffect, useRef } from 'react';
import { Layout, Scaling, Lock, Unlock, X, Check } from 'lucide-react';
import styles from './CanvasResizeModals.module.css';

const ANCHOR_POINTS = [
  { id: 'tl', label: 'Top Left', glyph: '↖' },
  { id: 'tc', label: 'Top Center', glyph: '↑' },
  { id: 'tr', label: 'Top Right', glyph: '↗' },
  { id: 'ml', label: 'Middle Left', glyph: '←' },
  { id: 'mc', label: 'Middle Center', glyph: '•' },
  { id: 'mr', label: 'Middle Right', glyph: '→' },
  { id: 'bl', label: 'Bottom Left', glyph: '↙' },
  { id: 'bc', label: 'Bottom Center', glyph: '↓' },
  { id: 'br', label: 'Bottom Right', glyph: '↘' },
];

const RESAMPLING_OPTIONS = [
  { id: 'bicubic', label: 'Bicubic (Best for smooth gradients)' },
  { id: 'bilinear', label: 'Bilinear (Standard scaling)' },
  { id: 'nearest', label: 'Nearest Neighbor (Preserve hard edges)' },
];

/**
 * Compact Photoshop-Style Canvas Size Floating Modal
 */
export function CanvasSizeModal({
  isOpen,
  onClose,
  currentWidth = 800,
  currentHeight = 600,
  currentBgOption = 'transparent',
  currentBgColor = '#ffffff',
  currentAnchor = 'mc',
  onApply,
}) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [lockAspect, setLockAspect] = useState(false);
  const [anchor, setAnchor] = useState(currentAnchor || 'mc');
  const [bgOption, setBgOption] = useState(currentBgOption || 'transparent');
  const [customColor, setCustomColor] = useState(currentBgColor || '#ffffff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customColorInputRef = useRef(null);

  // Sync state whenever modal opens with fresh document dimensions
  useEffect(() => {
    if (isOpen) {
      setWidth(currentWidth);
      setHeight(currentHeight);
      setLockAspect(false);
      setAnchor(currentAnchor || 'mc');
      setBgOption(currentBgOption || 'transparent');
      setCustomColor(currentBgColor || '#ffffff');
      setIsSubmitting(false);
    }
  }, [isOpen, currentWidth, currentHeight, currentBgOption, currentBgColor, currentAnchor]);

  // Global keydown (Enter to Apply, Escape to Cancel)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      } else if (e.key === 'Enter') {
        // Don't intercept if inside textarea or select dropdown
        if (e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'SELECT') return;
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, width, height, lockAspect, anchor, bgOption, customColor]);

  if (!isOpen) return null;

  const handleWidthChange = (val) => {
    const num = parseInt(val, 10);
    setWidth(val);
    if (lockAspect && currentWidth > 0 && currentHeight > 0 && !isNaN(num) && num > 0) {
      const ratio = currentWidth / currentHeight;
      setHeight(Math.max(1, Math.round(num / ratio)));
    }
  };

  const handleHeightChange = (val) => {
    const num = parseInt(val, 10);
    setHeight(val);
    if (lockAspect && currentWidth > 0 && currentHeight > 0 && !isNaN(num) && num > 0) {
      const ratio = currentWidth / currentHeight;
      setWidth(Math.max(1, Math.round(num * ratio)));
    }
  };

  const handleToggleLock = () => {
    setLockAspect((prev) => {
      const next = !prev;
      if (next && currentWidth > 0 && currentHeight > 0) {
        const curW = parseInt(width, 10);
        if (!isNaN(curW) && curW > 0) {
          const ratio = currentWidth / currentHeight;
          setHeight(Math.max(1, Math.round(curW / ratio)));
        }
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const targetW = parseInt(width, 10);
    const targetH = parseInt(height, 10);
    if (isNaN(targetW) || isNaN(targetH) || targetW <= 0 || targetH <= 0) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    onApply?.({
      width: targetW,
      height: targetH,
      anchor,
      bgOption,
      customColor,
    });
    onClose?.();
  };

  const diffW = (parseInt(width, 10) || 0) - currentWidth;
  const diffH = (parseInt(height, 10) || 0) - currentHeight;

  return (
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      data-testid="modal-canvas-size"
      role="dialog"
      aria-modal="true"
      aria-label="Canvas Size Dialog"
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconBadge}>
              <Layout size={16} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Canvas Size</h3>
              <p className={styles.modalSubtitle}>Change document boundaries without scaling content</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            data-testid="btn-close-canvas-modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Current Dimensions */}
          <div className={styles.currentDimsBanner}>
            <span>Current Dimensions:</span>
            <span className={styles.dimsValue}>
              {currentWidth} × {currentHeight} px
            </span>
          </div>

          {/* Width, Aspect Lock, Height */}
          <div className={styles.dimensionRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="canvas-modal-width">
                Width:
              </label>
              <div className={styles.inputWithSuffix}>
                <input
                  id="canvas-modal-width"
                  type="number"
                  min="1"
                  max="16384"
                  value={width}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className={styles.numberInput}
                  data-testid="input-canvas-modal-width"
                  autoFocus
                />
                <span className={styles.suffix}>px</span>
              </div>
            </div>

            <button
              type="button"
              className={`${styles.lockBtn} ${lockAspect ? styles.lockBtnActive : ''}`}
              onClick={handleToggleLock}
              title={lockAspect ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
              aria-label="Toggle Aspect Ratio Lock"
              data-testid="btn-canvas-modal-lock"
            >
              {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
            </button>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="canvas-modal-height">
                Height:
              </label>
              <div className={styles.inputWithSuffix}>
                <input
                  id="canvas-modal-height"
                  type="number"
                  min="1"
                  max="16384"
                  value={height}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className={styles.numberInput}
                  data-testid="input-canvas-modal-height"
                />
                <span className={styles.suffix}>px</span>
              </div>
            </div>
          </div>

          {/* Anchor Selector */}
          <div>
            <label className={styles.inputLabel} style={{ marginBottom: '6px', display: 'block' }}>
              Anchor Point:
            </label>
            <div className={styles.anchorRow}>
              <div className={styles.anchorGrid} data-testid="grid-canvas-anchor">
                {ANCHOR_POINTS.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    className={`${styles.anchorCell} ${anchor === pt.id ? styles.anchorCellActive : ''}`}
                    onClick={() => setAnchor(pt.id)}
                    title={pt.label}
                    data-testid={`anchor-${pt.id}`}
                  >
                    {pt.glyph}
                  </button>
                ))}
              </div>
              <div className={styles.anchorLegend}>
                Existing canvas is anchored at{' '}
                <strong>{ANCHOR_POINTS.find((a) => a.id === anchor)?.label || 'Center'}</strong>.
                {diffW !== 0 || diffH !== 0 ? (
                  <div style={{ marginTop: '2px', color: '#7c3aed', fontWeight: 600 }}>
                    Change: {diffW >= 0 ? `+${diffW}` : diffW} px W, {diffH >= 0 ? `+${diffH}` : diffH} px H
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Canvas Background Choice */}
          <div>
            <label className={styles.inputLabel} style={{ marginBottom: '6px', display: 'block' }}>
              Extension Canvas Fill:
            </label>
            <div className={styles.bgChoiceRow}>
              {[
                { id: 'transparent', label: 'Transparent' },
                { id: 'white', label: 'White' },
                { id: 'custom', label: 'Custom' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`${styles.bgOptionCard} ${bgOption === opt.id ? styles.bgOptionCardActive : ''}`}
                  onClick={() => setBgOption(opt.id)}
                >
                  <input
                    type="radio"
                    name="canvasModalBg"
                    checked={bgOption === opt.id}
                    onChange={() => setBgOption(opt.id)}
                    className={styles.bgOptionRadio}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {bgOption === 'custom' && (
              <div className={styles.customColorWrap}>
                <button
                  type="button"
                  className={styles.customColorSwatch}
                  style={{ backgroundColor: customColor }}
                  onClick={() => customColorInputRef.current?.click()}
                  aria-label="Pick Custom Color"
                />
                <span className={styles.customColorHex}>{customColor.toUpperCase()}</span>
                <input
                  ref={customColorInputRef}
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            data-testid="btn-cancel-canvas-modal"
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnApply}
            onClick={handleSubmit}
            disabled={isSubmitting || !width || !height}
            data-testid="btn-apply-canvas-modal"
          >
            <Check size={14} />
            <span>Apply Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Photoshop-Style Image Resize Floating Modal
 */
export function ImageResizeModal({
  isOpen,
  onClose,
  currentWidth = 800,
  currentHeight = 600,
  onApply,
}) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [lockAspect, setLockAspect] = useState(true);
  const [resampling, setResampling] = useState('bicubic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWidth(currentWidth);
      setHeight(currentHeight);
      setLockAspect(true);
      setResampling('bicubic');
      setIsSubmitting(false);
    }
  }, [isOpen, currentWidth, currentHeight]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      } else if (e.key === 'Enter') {
        if (e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'SELECT') return;
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, width, height, lockAspect, resampling]);

  if (!isOpen) return null;

  const handleWidthChange = (val) => {
    const num = parseInt(val, 10);
    setWidth(val);
    if (lockAspect && currentWidth > 0 && currentHeight > 0 && !isNaN(num) && num > 0) {
      const ratio = currentWidth / currentHeight;
      setHeight(Math.max(1, Math.round(num / ratio)));
    }
  };

  const handleHeightChange = (val) => {
    const num = parseInt(val, 10);
    setHeight(val);
    if (lockAspect && currentWidth > 0 && currentHeight > 0 && !isNaN(num) && num > 0) {
      const ratio = currentWidth / currentHeight;
      setWidth(Math.max(1, Math.round(num * ratio)));
    }
  };

  const handleToggleLock = () => {
    setLockAspect((prev) => {
      const next = !prev;
      if (next && currentWidth > 0 && currentHeight > 0) {
        const curW = parseInt(width, 10);
        if (!isNaN(curW) && curW > 0) {
          const ratio = currentWidth / currentHeight;
          setHeight(Math.max(1, Math.round(curW / ratio)));
        }
      }
      return next;
    });
  };

  const handlePresetSelect = (factor) => {
    if (!currentWidth || !currentHeight) return;
    const newW = Math.max(1, Math.round(currentWidth * factor));
    const newH = Math.max(1, Math.round(currentHeight * factor));
    setWidth(newW);
    setHeight(newH);
  };

  const handleSubmit = () => {
    const targetW = parseInt(width, 10);
    const targetH = parseInt(height, 10);
    if (isNaN(targetW) || isNaN(targetH) || targetW <= 0 || targetH <= 0) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    onApply?.({
      width: targetW,
      height: targetH,
      resampling,
    });
    onClose?.();
  };

  const origMp = ((currentWidth * currentHeight) / 1000000).toFixed(2);
  const numW = parseInt(width, 10) || 0;
  const numH = parseInt(height, 10) || 0;
  const newMp = ((numW * numH) / 1000000).toFixed(2);

  return (
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      data-testid="modal-image-resize"
      role="dialog"
      aria-modal="true"
      aria-label="Image Resize Dialog"
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconBadge}>
              <Scaling size={16} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Image Size</h3>
              <p className={styles.modalSubtitle}>Resample image & scale layers proportionally</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            data-testid="btn-close-resize-modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Current Dimensions */}
          <div className={styles.currentDimsBanner}>
            <span>Original Size:</span>
            <span className={styles.dimsValue}>
              {currentWidth} × {currentHeight} px ({origMp} MP)
            </span>
          </div>

          {/* Scale Presets: 25%, 50%, 75%, 100%, 200% */}
          <div>
            <label className={styles.inputLabel} style={{ marginBottom: '5px', display: 'block' }}>
              Quick Scale Presets:
            </label>
            <div className={styles.presetRow}>
              {[
                { label: '25%', factor: 0.25 },
                { label: '50%', factor: 0.5 },
                { label: '75%', factor: 0.75 },
                { label: '100%', factor: 1.0 },
                { label: '200%', factor: 2.0 },
              ].map((p) => {
                const isSelected =
                  numW === Math.round(currentWidth * p.factor) &&
                  numH === Math.round(currentHeight * p.factor);
                return (
                  <button
                    key={p.label}
                    type="button"
                    className={`${styles.presetPill} ${isSelected ? styles.presetPillActive : ''}`}
                    onClick={() => handlePresetSelect(p.factor)}
                    title={`Scale to ${p.label}`}
                    data-testid={`preset-resize-${p.label.replace('%', '')}`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Width, Aspect Lock, Height */}
          <div className={styles.dimensionRow}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="resize-modal-width">
                Width:
              </label>
              <div className={styles.inputWithSuffix}>
                <input
                  id="resize-modal-width"
                  type="number"
                  min="1"
                  max="16384"
                  value={width}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className={styles.numberInput}
                  data-testid="input-resize-modal-width"
                  autoFocus
                />
                <span className={styles.suffix}>px</span>
              </div>
            </div>

            <button
              type="button"
              className={`${styles.lockBtn} ${lockAspect ? styles.lockBtnActive : ''}`}
              onClick={handleToggleLock}
              title={lockAspect ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio (Constrain Proportions)'}
              aria-label="Toggle Aspect Ratio Lock"
              data-testid="btn-resize-modal-lock"
            >
              {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
            </button>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="resize-modal-height">
                Height:
              </label>
              <div className={styles.inputWithSuffix}>
                <input
                  id="resize-modal-height"
                  type="number"
                  min="1"
                  max="16384"
                  value={height}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className={styles.numberInput}
                  data-testid="input-resize-modal-height"
                />
                <span className={styles.suffix}>px</span>
              </div>
            </div>
          </div>

          {/* Resampling Option */}
          <div>
            <label className={styles.inputLabel} htmlFor="resize-modal-resampling" style={{ marginBottom: '5px', display: 'block' }}>
              Resampling Method:
            </label>
            <select
              id="resize-modal-resampling"
              value={resampling}
              onChange={(e) => setResampling(e.target.value)}
              className={styles.selectDropdown}
              data-testid="select-resize-modal-resampling"
            >
              {RESAMPLING_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* New Size Summary */}
          <div className={styles.currentDimsBanner}>
            <span>Resampled Result:</span>
            <span className={styles.dimsValue} style={{ color: '#7c3aed' }}>
              {numW} × {numH} px ({newMp} MP)
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            data-testid="btn-cancel-resize-modal"
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnApply}
            onClick={handleSubmit}
            disabled={isSubmitting || !width || !height}
            data-testid="btn-apply-resize-modal"
          >
            <Check size={14} />
            <span>Apply Resize</span>
          </button>
        </div>
      </div>
    </div>
  );
}

