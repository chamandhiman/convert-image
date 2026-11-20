import { useState, useEffect } from 'react';
import {
  FilePlus,
  X,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';
import styles from './NewProjectModal.module.css';

// Legacy export for backwards compatibility
export const POPULAR_PRESETS = [];

export function NewProjectModal({ isOpen, onClose, onCreate, initialPreset = null }) {
  const [docName, setDocName] = useState('Untitled-1');
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [unit, setUnit] = useState('px'); // 'px' | 'in' | 'cm'
  const [dpi, setDpi] = useState(72); // 72 | 150 | 300
  const [lockAspect, setLockAspect] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [bgType, setBgType] = useState('white'); // 'white' | 'transparent' | 'custom'
  const [customColor, setCustomColor] = useState('#F5F3FF');

  // Sync initial preset if passed from outside
  useEffect(() => {
    if (initialPreset) {
      if (initialPreset.width && initialPreset.height) {
        setWidth(initialPreset.width);
        setHeight(initialPreset.height);
        setAspectRatio(initialPreset.width / initialPreset.height);
      }
      if (initialPreset.label) {
        setDocName(initialPreset.label);
      }
    }
  }, [initialPreset, isOpen]);

  // Close on Escape or confirm on Enter
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        const tag = document.activeElement?.tagName;
        if (tag === 'TEXTAREA') return;
        e.preventDefault();
        handleSubmit(e);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, width, height, unit, dpi, bgType, customColor, docName, onCreate]);

  if (!isOpen) return null;

  const handleWidthChange = (val) => {
    const num = parseFloat(val) || 0;
    setWidth(val);
    if (lockAspect && aspectRatio > 0 && num > 0) {
      const nextH = Math.round(num / aspectRatio);
      setHeight(nextH);
    } else if (num > 0 && height > 0) {
      setAspectRatio(num / height);
    }
  };

  const handleHeightChange = (val) => {
    const num = parseFloat(val) || 0;
    setHeight(val);
    if (lockAspect && aspectRatio > 0 && num > 0) {
      const nextW = Math.round(num * aspectRatio);
      setWidth(nextW);
    } else if (num > 0 && width > 0) {
      setAspectRatio(width / num);
    }
  };

  const handleToggleLockAspect = () => {
    const next = !lockAspect;
    setLockAspect(next);
    if (next) {
      const w = parseFloat(width) || 1;
      const h = parseFloat(height) || 1;
      setAspectRatio(w / h);
    }
  };

  const handleUnitChange = (newUnit) => {
    if (newUnit === unit) return;
    const curW = parseFloat(width) || 1080;
    const curH = parseFloat(height) || 1080;

    // Convert current width/height to px first
    let pxW = curW;
    let pxH = curH;
    if (unit === 'in') {
      pxW = curW * dpi;
      pxH = curH * dpi;
    } else if (unit === 'cm') {
      pxW = (curW / 2.54) * dpi;
      pxH = (curH / 2.54) * dpi;
    }

    // Convert from px to newUnit
    if (newUnit === 'px') {
      setWidth(Math.round(pxW));
      setHeight(Math.round(pxH));
    } else if (newUnit === 'in') {
      setWidth(Math.round((pxW / dpi) * 100) / 100);
      setHeight(Math.round((pxH / dpi) * 100) / 100);
    } else if (newUnit === 'cm') {
      setWidth(Math.round(((pxW / dpi) * 2.54) * 100) / 100);
      setHeight(Math.round(((pxH / dpi) * 2.54) * 100) / 100);
    }
    setUnit(newUnit);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert to final pixel values
    const rawW = parseFloat(width) || 1080;
    const rawH = parseFloat(height) || 1080;

    let finalW = rawW;
    let finalH = rawH;

    if (unit === 'in') {
      finalW = Math.round(rawW * dpi);
      finalH = Math.round(rawH * dpi);
    } else if (unit === 'cm') {
      finalW = Math.round((rawW / 2.54) * dpi);
      finalH = Math.round((rawH / 2.54) * dpi);
    } else {
      finalW = Math.round(rawW);
      finalH = Math.round(rawH);
    }

    finalW = Math.max(10, Math.min(10000, finalW));
    finalH = Math.max(10, Math.min(10000, finalH));

    const isTransparent = bgType === 'transparent';
    const bgColor = bgType === 'white' ? '#FFFFFF' : bgType === 'custom' ? customColor : 'transparent';
    const cleanName = docName.trim() || 'Untitled-1';

    onCreate({
      name: cleanName,
      width: finalW,
      height: finalH,
      bgColor,
      isTransparent,
      dpi,
      unit,
    });
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose} data-testid="new-project-modal-backdrop">
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="new-project-title"
        data-testid="new-project-modal"
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}>
              <FilePlus size={18} />
            </div>
            <div>
              <h3 id="new-project-title" className={styles.modalTitle}>
                New Project
              </h3>
              <p className={styles.modalSubtitle}>Create a custom canvas with your exact dimensions</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            data-testid="new-project-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {/* Document Name */}
          <div className={styles.formSection}>
            <label className={styles.sectionLabel} htmlFor="doc-name-input">
              Document Name
            </label>
            <input
              id="doc-name-input"
              type="text"
              className={styles.nameInput}
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Untitled-1"
              data-testid="input-doc-name"
            />
          </div>

          {/* Canvas Dimensions, Lock & Unit Selector */}
          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Canvas Dimensions</label>
            <div className={styles.dimensionsGrid}>
              {/* Width */}
              <div className={styles.dimGroup}>
                <span className={styles.dimSubLabel}>Width</span>
                <div className={styles.dimInputWrap}>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    step={unit === 'px' ? '1' : '0.01'}
                    className={styles.dimInput}
                    value={width}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    id="canvas-custom-width"
                    data-testid="input-canvas-width"
                  />
                  <span className={styles.dimUnitSuffix}>{unit}</span>
                </div>
              </div>

              {/* Aspect Ratio Lock */}
              <button
                type="button"
                className={`${styles.lockAspectBtn} ${lockAspect ? styles.lockAspectBtnActive : ''}`}
                onClick={handleToggleLockAspect}
                title={lockAspect ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                data-testid="btn-lock-aspect"
              >
                {lockAspect ? <Lock size={15} /> : <Unlock size={15} />}
              </button>

              {/* Height */}
              <div className={styles.dimGroup}>
                <span className={styles.dimSubLabel}>Height</span>
                <div className={styles.dimInputWrap}>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    step={unit === 'px' ? '1' : '0.01'}
                    className={styles.dimInput}
                    value={height}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    id="canvas-custom-height"
                    data-testid="input-canvas-height"
                  />
                  <span className={styles.dimUnitSuffix}>{unit}</span>
                </div>
              </div>

              <div style={{ width: '4px' }} />

              {/* Unit Selector */}
              <div className={styles.unitSelectWrap}>
                <span className={styles.dimSubLabel}>Unit</span>
                <select
                  className={styles.unitSelect}
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  data-testid="select-canvas-unit"
                >
                  <option value="px">Pixels (px)</option>
                  <option value="in">Inches (in)</option>
                  <option value="cm">Centimeters (cm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resolution / DPI */}
          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Resolution (DPI)</label>
            <div className={styles.resolutionRow}>
              {[72, 150, 300].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`${styles.dpiChip} ${dpi === r ? styles.dpiChipActive : ''}`}
                  onClick={() => setDpi(r)}
                  data-testid={`dpi-chip-${r}`}
                >
                  {r} DPI {r === 72 ? '(Screen/Web)' : r === 300 ? '(High Print)' : '(Medium)'}
                </button>
              ))}
            </div>
          </div>

          {/* Background Fill */}
          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Background Fill</label>
            <div className={styles.bgOptionsRow}>
              <div
                className={`${styles.bgOptionCard} ${bgType === 'white' ? styles.bgOptionCardActive : ''}`}
                onClick={() => setBgType('white')}
                data-testid="bg-option-white"
              >
                <div className={`${styles.bgSwatchPreview} ${styles.bgSwatchWhite}`} />
                <span className={styles.bgOptionTitle}>White</span>
              </div>

              <div
                className={`${styles.bgOptionCard} ${bgType === 'transparent' ? styles.bgOptionCardActive : ''}`}
                onClick={() => setBgType('transparent')}
                data-testid="bg-option-transparent"
              >
                <div className={`${styles.bgSwatchPreview} ${styles.bgSwatchTransparent}`} />
                <span className={styles.bgOptionTitle}>Transparent</span>
              </div>

              <div
                className={`${styles.bgOptionCard} ${bgType === 'custom' ? styles.bgOptionCardActive : ''}`}
                onClick={() => setBgType('custom')}
                data-testid="bg-option-custom"
              >
                <div
                  className={styles.bgSwatchPreview}
                  style={{ backgroundColor: customColor }}
                />
                <span className={styles.bgOptionTitle}>Custom Color</span>
              </div>
            </div>

            {bgType === 'custom' && (
              <div className={styles.customColorPickerRow}>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className={styles.customColorInput}
                  data-testid="input-custom-bg-color"
                />
                <span className={styles.customColorHex}>{customColor.toUpperCase()}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pick canvas background color</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              data-testid="new-project-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.createBtn}
              id="confirm-create-canvas-btn"
              data-testid="new-project-submit-btn"
            >
              <Sparkles size={15} />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectModal;
