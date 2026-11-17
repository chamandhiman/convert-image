import { useState } from 'react';
import {
  Palette,
  Upload,
  Square,
  Plus,
  Check,
  X,
} from 'lucide-react';
import styles from './EditorStartScreen.module.css';

export const CANVAS_PRESETS = [
  { label: '400 × 300 px', w: 400, h: 300, sub: 'Standard Card' },
  { label: '600 × 400 px', w: 600, h: 400, sub: 'Classic 3:2' },
  { label: '800 × 600 px', w: 800, h: 600, sub: 'Desktop 4:3' },
  { label: '1080 × 1080 px', w: 1080, h: 1080, sub: 'Square / Social' },
  { label: '1920 × 1080 px', w: 1920, h: 1080, sub: 'Full HD 16:9' },
  { label: 'Custom Size', w: null, h: null, sub: 'Custom dimensions' },
];

export const COLOR_SWATCHES = [
  { label: 'White', color: '#FFFFFF' },
  { label: 'Soft Gray', color: '#F8FAFC' },
  { label: 'Lavender', color: '#F5F3FF' },
  { label: 'Dark Navy', color: '#1E293B' },
  { label: 'Pure Black', color: '#000000' },
];

/**
 * Reusable Canvas Setup Dialog Modal
 */
export function CanvasSetupModal({ isOpen, onClose, onCreateCanvas }) {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [isTransparent, setIsTransparent] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (index) => {
    setSelectedPresetIndex(index);
    const preset = CANVAS_PRESETS[index];
    if (preset.w && preset.h) {
      setWidth(preset.w);
      setHeight(preset.h);
    }
  };

  const handleCreateConfirm = (e) => {
    e.preventDefault();
    const finalW = Math.max(20, Math.min(8000, parseInt(width, 10) || 400));
    const finalH = Math.max(20, Math.min(8000, parseInt(height, 10) || 300));
    onCreateCanvas({
      width: finalW,
      height: finalH,
      bgColor,
      isTransparent,
    });
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="canvas-modal-title"
      >
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.smallModalIcon}>
              <Palette size={18} />
            </div>
            <div>
              <h3 id="canvas-modal-title" className={styles.modalTitle}>
                Create Blank Canvas
              </h3>
              <p className={styles.modalSubtitle}>
                Choose preset dimensions or set custom width & height
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleCreateConfirm} className={styles.modalBody}>
          {/* Presets Grid */}
          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Canvas Size Presets</label>
            <div className={styles.presetsGrid}>
              {CANVAS_PRESETS.map((preset, idx) => {
                const isSelected = selectedPresetIndex === idx;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`${styles.presetBtn} ${isSelected ? styles.presetBtnActive : ''}`}
                    onClick={() => handleSelectPreset(idx)}
                  >
                    <span className={styles.presetLabel}>{preset.label}</span>
                    <span className={styles.presetSub}>{preset.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Width & Height Inputs */}
          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Dimensions (Pixels)</label>
            <div className={styles.dimInputsRow}>
              <div className={styles.dimInputGroup}>
                <span className={styles.inputPrefix}>Width</span>
                <input
                  type="number"
                  min="20"
                  max="8000"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className={styles.numInput}
                  id="canvas-custom-width"
                />
                <span className={styles.inputSuffix}>px</span>
              </div>

              <span className={styles.dimTimes}>×</span>

              <div className={styles.dimInputGroup}>
                <span className={styles.inputPrefix}>Height</span>
                <input
                  type="number"
                  min="20"
                  max="8000"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={styles.numInput}
                  id="canvas-custom-height"
                />
                <span className={styles.inputSuffix}>px</span>
              </div>
            </div>
          </div>

          {/* Background Options */}
          <div className={styles.formSection}>
            <label className={styles.sectionLabel}>Background Color</label>

            <div className={styles.transparencyCheckRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isTransparent}
                  onChange={(e) => setIsTransparent(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxText}>Transparent Canvas (Alpha background)</span>
              </label>
            </div>

            {!isTransparent && (
              <div className={styles.swatchesRow}>
                {COLOR_SWATCHES.map((sw) => (
                  <button
                    key={sw.label}
                    type="button"
                    className={`${styles.colorChip} ${bgColor.toLowerCase() === sw.color.toLowerCase() ? styles.colorChipActive : ''
                      }`}
                    style={{ backgroundColor: sw.color }}
                    onClick={() => setBgColor(sw.color)}
                    title={sw.label}
                  >
                    {bgColor.toLowerCase() === sw.color.toLowerCase() && (
                      <Check
                        size={12}
                        color={sw.color === '#FFFFFF' || sw.color === '#F8FAFC' || sw.color === '#F5F3FF' ? '#7C3AED' : '#FFFFFF'}
                      />
                    )}
                  </button>
                ))}

                <div className={styles.customColorWrap}>
                  <span className={styles.customColorLabel}>Custom:</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className={styles.colorInput}
                  />
                  <span className={styles.hexCode}>{bgColor.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              id="confirm-create-canvas-btn"
              onClick={handleCreateConfirm}
            >
              <Square size={15} />
              <span>Create Canvas ({width} × {height})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Photoshop-Inspired White Starter Screen for Edit Image
 * Two compact cards side by side: Blank Canvas & Open Image matching reference design
 */
export function EditorStartScreen({
  onOpenImage,
  onCreateBlankCanvas,
  isDragOver,
}) {
  const [showSetupModal, setShowSetupModal] = useState(false);

  return (
    <div className={styles.startScreenWrapper}>
      {/* Two Starter Cards Side by Side */}
      <div className={styles.cardsGrid}>
        {/* Card 1: Blank Canvas */}
        <div className={styles.optionCard}>
          <div className={styles.cardTop}>
            {/* Soft Purple Organic Glow & Canvas Vector Art */}
            <div className={styles.iconBlobContainer}>
              <div className={styles.blobGlow} />
              <svg width="48" height="42" viewBox="0 0 48 42" fill="none" className={styles.blobSvg}>
                {/* Canvas dashed frame */}
                <rect
                  x="7"
                  y="7"
                  width="34"
                  height="28"
                  rx="2"
                  stroke="#7C3AED"
                  strokeWidth="2.2"
                  strokeDasharray="4 3"
                />
                {/* 4 corner square handles */}
                <rect x="4" y="4" width="6" height="6" fill="#7C3AED" rx="1" />
                <rect x="38" y="4" width="6" height="6" fill="#7C3AED" rx="1" />
                <rect x="4" y="32" width="6" height="6" fill="#7C3AED" rx="1" />
                <rect x="38" y="32" width="6" height="6" fill="#7C3AED" rx="1" />
              </svg>
            </div>

            <h2 className={styles.cardHeading}>Blank Canvas</h2>
            <p className={styles.cardDesc}>Start with a custom canvas size.</p>
            <div className={styles.cardPillBadge}>Presets and custom dimensions</div>
          </div>

          <button
            type="button"
            className={styles.primaryActionBtn}
            onClick={() => setShowSetupModal(true)}
            id="start-blank-canvas-btn"
          >
            <Plus size={15} />
            <span>Create Canvas</span>
          </button>
        </div>

        {/* Card 2: Open Image */}
        <div
          className={`${styles.optionCard} ${isDragOver ? styles.optionCardDrag : ''}`}
        >
          <div className={styles.cardTop}>
            {/* Soft Purple Organic Glow & Open Image Vector Art */}
            <div className={styles.iconBlobContainer}>
              <div className={styles.blobGlowAlt} />
              <svg width="52" height="46" viewBox="0 0 52 46" fill="none" className={styles.blobSvg}>
                {/* Landscape photo frame */}
                <rect x="6" y="5" width="34" height="28" rx="6" stroke="#7C3AED" strokeWidth="2.2" fill="#FFFFFF" />
                <circle cx="16" cy="13" r="2.5" fill="#A855F7" />
                <path d="M10 27L17 18L25 26" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 27L28 21L36 28" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Upload badge overlapping bottom right */}
                <circle cx="36" cy="30" r="12" fill="#7C3AED" />
                <path d="M36 35V25M36 25L32.5 28.5M36 25L39.5 28.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 className={styles.cardHeading}>Open Image</h2>
            <p className={styles.cardDesc}>Upload an image to start editing.</p>
            <div className={styles.cardPillBadge}>JPG, PNG, WEBP and other formats</div>
          </div>

          <button
            type="button"
            className={styles.primaryActionBtn}
            onClick={onOpenImage}
            id="start-open-image-btn"
          >
            <Upload size={14} />
            <span>Choose Image</span>
          </button>
        </div>
      </div>

      {/* Reusable Canvas Setup Dialog Modal */}
      <CanvasSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onCreateCanvas={(config) => {
          setShowSetupModal(false);
          onCreateBlankCanvas(config);
        }}
      />
    </div>
  );
}

export default EditorStartScreen;
