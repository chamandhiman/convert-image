import { useState, useId } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  getAspectRatioLabel,
  calculateEstimatedSize,
  DIMENSION_PRESETS,
  PERCENTAGE_PRESETS,
  QUALITY_PRESETS,
} from './resizeHelpers';
import styles from './ResizePage.module.css';

export default function ResizeSettingsPanel({
  activeItem,
  mode,
  setMode,
  targetWidth,
  setTargetWidth,
  targetHeight,
  setTargetHeight,
  lockAspectRatio,
  setLockAspectRatio,
  percentage,
  setPercentage,
  outputFormat,
  setOutputFormat,
  quality,
  setQuality,
  preventEnlargement,
  setPreventEnlargement,
  backgroundColor,
  setBackgroundColor,
  customSuffix,
  setCustomSuffix,
  onResize,
  isResizing,
  totalCount = 1,
  outputFormats = [],
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const widthInputId = useId();
  const heightInputId = useId();
  const qualitySliderId = useId();
  const formatSelectId = useId();
  const suffixInputId = useId();

  const origWidth = activeItem?.meta?.width || 0;
  const origHeight = activeItem?.meta?.height || 0;
  const origSize = activeItem?.file?.size || 0;
  const origType = activeItem?.meta?.type || 'image/jpeg';
  const origRatio = origWidth && origHeight ? origWidth / origHeight : 1;
  const origRatioLabel = getAspectRatioLabel(origWidth, origHeight);

  // Target ratio and distortion
  const currentTargetRatio = targetWidth && targetHeight ? targetWidth / targetHeight : origRatio;
  const isRatioDistorted = !lockAspectRatio && Math.abs(origRatio - currentTargetRatio) > 0.03;
  const targetRatioLabel = getAspectRatioLabel(targetWidth, targetHeight);

  // Format resolution
  const resolvedFormat = outputFormat === 'original' ? origType : outputFormat;
  const isLossy = resolvedFormat !== 'image/png';

  // Output format label
  const getFormatName = (mime) => {
    switch (mime) {
      case 'image/jpeg': return 'JPG';
      case 'image/png': return 'PNG';
      case 'image/webp': return 'WebP';
      case 'image/avif': return 'AVIF';
      default: return 'Image';
    }
  };

  // Estimated Output Size
  const estimatedBytes = calculateEstimatedSize({
    originalSize: origSize,
    origWidth,
    origHeight,
    newWidth: targetWidth,
    newHeight: targetHeight,
    outputFormat,
    origType,
    quality,
  });

  const sizeDiffPct =
    estimatedBytes && origSize
      ? Math.round(((estimatedBytes - origSize) / origSize) * 100)
      : 0;

  // Width change handler with aspect ratio lock
  const handleWidthChange = (val) => {
    const newW = Math.max(0, parseInt(val, 10) || 0);
    setTargetWidth(newW);
    if (lockAspectRatio && origRatio > 0 && newW > 0) {
      setTargetHeight(Math.max(1, Math.round(newW / origRatio)));
    }
  };

  // Height change handler with aspect ratio lock
  const handleHeightChange = (val) => {
    const newH = Math.max(0, parseInt(val, 10) || 0);
    setTargetHeight(newH);
    if (lockAspectRatio && origRatio > 0 && newH > 0) {
      setTargetWidth(Math.max(1, Math.round(newH * origRatio)));
    }
  };

  // Toggle Aspect Ratio Lock
  const handleToggleLock = () => {
    const nextLocked = !lockAspectRatio;
    setLockAspectRatio(nextLocked);
    if (nextLocked && origRatio > 0 && targetWidth > 0) {
      // Re-align height to match natural original aspect ratio
      setTargetHeight(Math.max(1, Math.round(targetWidth / origRatio)));
    }
  };

  // Preset dimension click
  const handleApplyPresetDim = (preset) => {
    if (lockAspectRatio) {
      // If locked, scale dimension to fit within preset box while preserving ratio
      const scale = Math.min(preset.width / origWidth, preset.height / origHeight);
      setTargetWidth(Math.max(1, Math.round(origWidth * scale)));
      setTargetHeight(Math.max(1, Math.round(origHeight * scale)));
    } else {
      setTargetWidth(preset.width);
      setTargetHeight(preset.height);
    }
  };

  // Reset to original dimensions
  const handleResetToOriginal = () => {
    setTargetWidth(origWidth);
    setTargetHeight(origHeight);
  };

  // Percentage change
  const handlePercentageChange = (pct) => {
    setPercentage(pct);
    if (origWidth && origHeight) {
      const scale = pct / 100;
      setTargetWidth(Math.max(1, Math.round(origWidth * scale)));
      setTargetHeight(Math.max(1, Math.round(origHeight * scale)));
    }
  };

  return (
    <div className={styles.settingsPanel}>
      {/* 1. Uploaded Image Information Inspector */}
      <div className={styles.panelSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Image Properties</h3>
          <span className={styles.formatBadge}>
            {getFormatName(origType)}
          </span>
        </div>

        <div className={styles.inspectorGrid}>
          <div className={styles.inspectorItem}>
            <span className={styles.inspectorLabel}>Dimensions</span>
            <span className={styles.inspectorValue}>
              {origWidth} × {origHeight} px
            </span>
          </div>

          <div className={styles.inspectorItem}>
            <span className={styles.inspectorLabel}>File Size</span>
            <span className={styles.inspectorValue}>
              {formatFileSize(origSize)}
            </span>
          </div>

          <div className={styles.inspectorItem}>
            <span className={styles.inspectorLabel}>Aspect Ratio</span>
            <span className={styles.inspectorValue}>
              {origRatioLabel}
            </span>
          </div>

          <div className={styles.inspectorItem}>
            <span className={styles.inspectorLabel}>Color Mode</span>
            <span className={styles.inspectorValue}>
              {activeItem?.colorMode || 'RGB (24-bit)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Resize Mode Selector */}
      <div className={styles.panelSection}>
        <label className={styles.controlLabel}>Resize Mode</label>
        <div className={styles.modeTabs} role="tablist" aria-label="Resize mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'dimensions'}
            className={`${styles.modeTab} ${mode === 'dimensions' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('dimensions')}
          >
            Custom Dimensions (px)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'percentage'}
            className={`${styles.modeTab} ${mode === 'percentage' ? styles.modeTabActive : ''}`}
            onClick={() => {
              setMode('percentage');
              handlePercentageChange(percentage);
            }}
          >
            Percentage (%)
          </button>
        </div>
      </div>

      {/* 3. Dimension Controls */}
      {mode === 'dimensions' ? (
        <div className={styles.panelSection}>
          <div className={styles.dimensionsFormRow}>
            {/* Width Input */}
            <div className={styles.dimInputWrap}>
              <label htmlFor={widthInputId} className={styles.controlLabel}>
                Width
              </label>
              <div className={styles.inputWithSuffix}>
                <input
                  id={widthInputId}
                  type="number"
                  min="1"
                  max="30000"
                  value={targetWidth || ''}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className={styles.numberInput}
                />
                <span className={styles.inputSuffix}>px</span>
              </div>
              <span className={styles.refDim}>Orig: {origWidth}px</span>
            </div>

            {/* Aspect Ratio Lock Toggle */}
            <div className={styles.lockBtnWrapper}>
              <button
                type="button"
                onClick={handleToggleLock}
                className={`${styles.lockToggleBtn} ${lockAspectRatio ? styles.lockToggleActive : ''}`}
                title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                aria-label={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                aria-pressed={lockAspectRatio}
              >
                {lockAspectRatio ? <Lock size={15} /> : <Unlock size={15} />}
              </button>
              <span className={styles.lockCaption}>
                {lockAspectRatio ? 'Locked' : 'Unlocked'}
              </span>
            </div>

            {/* Height Input */}
            <div className={styles.dimInputWrap}>
              <label htmlFor={heightInputId} className={styles.controlLabel}>
                Height
              </label>
              <div className={styles.inputWithSuffix}>
                <input
                  id={heightInputId}
                  type="number"
                  min="1"
                  max="30000"
                  value={targetHeight || ''}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className={styles.numberInput}
                />
                <span className={styles.inputSuffix}>px</span>
              </div>
              <span className={styles.refDim}>Orig: {origHeight}px</span>
            </div>
          </div>

          {/* Aspect Ratio Distortion Warning */}
          {isRatioDistorted && (
            <div className={styles.warningAlert} role="alert">
              <AlertTriangle size={15} className={styles.warningIcon} />
              <p className={styles.warningText}>
                Aspect ratio altered. Image will stretch or compress to fit {targetRatioLabel}.
              </p>
            </div>
          )}

          {/* Quick Resolution Presets */}
          <div className={styles.presetsBlock}>
            <div className={styles.presetsLabelRow}>
              <span className={styles.subLabel}>Quick Presets</span>
              <button
                type="button"
                className={styles.resetPresetBtn}
                onClick={handleResetToOriginal}
              >
                Match Original
              </button>
            </div>
            <div className={styles.presetPillsGrid}>
              {DIMENSION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={styles.presetPill}
                  onClick={() => handleApplyPresetDim(preset)}
                  title={`${preset.width} × ${preset.height} px (${preset.ratio})`}
                >
                  <span className={styles.presetPillLabel}>{preset.label}</span>
                  <span className={styles.presetPillSub}>{preset.width}×{preset.height}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Percentage Mode Controls */
        <div className={styles.panelSection}>
          <div className={styles.percentageControls}>
            <div className={styles.sliderHeader}>
              <label className={styles.controlLabel}>Scale Factor</label>
              <span className={styles.percentageValue}>{percentage}%</span>
            </div>

            {/* Quick Percentage Presets */}
            <div className={styles.pctPresetsRow}>
              {PERCENTAGE_PRESETS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`${styles.pctPresetBtn} ${percentage === pct ? styles.pctPresetBtnActive : ''}`}
                  onClick={() => handlePercentageChange(pct)}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={percentage}
              onChange={(e) => handlePercentageChange(Number(e.target.value))}
              className={styles.slider}
            />

            <div className={styles.pctResultBox}>
              <span className={styles.pctResultLabel}>Resulting Dimensions:</span>
              <span className={styles.pctResultVal}>
                {targetWidth} × {targetHeight} px
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Live Two-Column Comparison */}
      <div className={styles.panelSection}>
        <h4 className={styles.comparisonHeader}>
          <Sparkles size={14} className={styles.sparkleIcon} />
          <span>Live Comparison</span>
        </h4>

        <div className={styles.twoColComparison}>
          <div className={styles.compCol}>
            <span className={styles.compColTitle}>Original</span>
            <div className={styles.compRows}>
              <div className={styles.compRow}>
                <span>Size:</span>
                <strong>{origWidth}×{origHeight}</strong>
              </div>
              <div className={styles.compRow}>
                <span>Format:</span>
                <strong>{getFormatName(origType)}</strong>
              </div>
              <div className={styles.compRow}>
                <span>Ratio:</span>
                <strong>{origRatioLabel}</strong>
              </div>
              <div className={styles.compRow}>
                <span>Weight:</span>
                <strong>{formatFileSize(origSize)}</strong>
              </div>
            </div>
          </div>

          <div className={`${styles.compCol} ${styles.compColTarget}`}>
            <span className={styles.compColTitle}>Resized</span>
            <div className={styles.compRows}>
              <div className={styles.compRow}>
                <span>Size:</span>
                <strong className={styles.highlightText}>{targetWidth}×{targetHeight}</strong>
              </div>
              <div className={styles.compRow}>
                <span>Format:</span>
                <strong>{outputFormat === 'original' ? getFormatName(origType) : getFormatName(outputFormat)}</strong>
              </div>
              <div className={styles.compRow}>
                <span>Ratio:</span>
                <strong>{targetRatioLabel}</strong>
              </div>
              <div className={styles.compRow}>
                <span>Est. Weight:</span>
                <div className={styles.estWeightWrap}>
                  <strong>~{formatFileSize(estimatedBytes || 0)}</strong>
                  {sizeDiffPct !== 0 && (
                    <span
                      className={`${styles.sizeDiffBadge} ${sizeDiffPct < 0 ? styles.diffGreen : styles.diffAmber}`}
                    >
                      {sizeDiffPct > 0 ? `+${sizeDiffPct}%` : `${sizeDiffPct}%`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Output Format & Quality Settings */}
      <div className={styles.panelSection}>
        <div className={styles.controlGroup}>
          <label htmlFor={formatSelectId} className={styles.controlLabel}>
            Output Format
          </label>
          <select
            id={formatSelectId}
            className={styles.select}
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
          >
            <option value="original">Keep Original ({getFormatName(origType)})</option>
            {outputFormats.map((f) => (
              <option key={f.value} value={f.value} disabled={!f.isSupported}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quality Controls */}
        <div className={styles.controlGroup}>
          <div className={styles.sliderHeader}>
            <label htmlFor={qualitySliderId} className={styles.controlLabel}>
              Output Quality
            </label>
            <span className={styles.qualityValue}>
              {isLossy ? `${quality}%` : 'Lossless'}
            </span>
          </div>

          {isLossy ? (
            <>
              <div className={styles.qualityPills}>
                {QUALITY_PRESETS.map((qp) => (
                  <button
                    key={qp.value}
                    type="button"
                    className={`${styles.qualityPill} ${quality === qp.value ? styles.qualityPillActive : ''}`}
                    onClick={() => setQuality(qp.value)}
                  >
                    {qp.label} ({qp.value}%)
                  </button>
                ))}
              </div>
              <input
                id={qualitySliderId}
                type="range"
                min="10"
                max="100"
                step="1"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className={styles.slider}
              />
            </>
          ) : (
            <p className={styles.controlHint}>
              <Info size={13} />
              <span>PNG compression is lossless; quality setting does not apply.</span>
            </p>
          )}
        </div>
      </div>

      {/* 6. Advanced Options Accordion */}
      <div className={styles.advancedAccordion}>
        <button
          type="button"
          className={styles.accordionToggle}
          onClick={() => setAdvancedOpen(!advancedOpen)}
          aria-expanded={advancedOpen}
        >
          <span>Advanced Settings</span>
          {advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {advancedOpen && (
          <div className={styles.accordionContent}>
            {/* Prevent enlargement checkbox */}
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={preventEnlargement}
                onChange={(e) => setPreventEnlargement(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                Prevent enlargement (don&apos;t upscale smaller images)
              </span>
            </label>

            {/* Background Color Fill for Transparent -> JPG conversion */}
            {resolvedFormat === 'image/jpeg' && (
              <div className={styles.advancedSubSection}>
                <span className={styles.controlSubLabel}>
                  Background fill (for transparent PNG/WebP)
                </span>
                <div className={styles.colorSwatches}>
                  {[
                    { label: 'White', color: '#FFFFFF' },
                    { label: 'Black', color: '#000000' },
                    { label: 'Gray', color: '#F3F4F6' },
                  ].map((sw) => (
                    <button
                      key={sw.color}
                      type="button"
                      className={`${styles.colorSwatch} ${backgroundColor === sw.color ? styles.colorSwatchActive : ''}`}
                      style={{ backgroundColor: sw.color }}
                      onClick={() => setBackgroundColor(sw.color)}
                      title={sw.label}
                    >
                      {backgroundColor === sw.color && (
                        <Check size={12} color={sw.color === '#FFFFFF' ? '#000' : '#fff'} />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={backgroundColor || '#FFFFFF'}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className={styles.customColorInput}
                    title="Custom color"
                  />
                </div>
              </div>
            )}

            {/* Custom Output Suffix */}
            <div className={styles.advancedSubSection}>
              <label htmlFor={suffixInputId} className={styles.controlSubLabel}>
                Filename suffix
              </label>
              <input
                id={suffixInputId}
                type="text"
                value={customSuffix}
                onChange={(e) => setCustomSuffix(e.target.value)}
                placeholder="-resized"
                className={styles.textInput}
              />
            </div>
          </div>
        )}
      </div>

      {/* 7. Action CTA Button */}
      <div className={styles.actionBlock}>
        <button
          type="button"
          className={styles.primaryResizeBtn}
          onClick={onResize}
          disabled={isResizing || targetWidth <= 0 || targetHeight <= 0}
        >
          {isResizing ? (
            <>
              <div className={styles.btnSpinner} />
              <span>Resizing Images…</span>
            </>
          ) : (
            <>
              <span>
                {totalCount > 1
                  ? `Resize All ${totalCount} Images`
                  : 'Resize Image'}
              </span>
              <span className={styles.btnSub}>
                {targetWidth} × {targetHeight} px
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

