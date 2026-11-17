import { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  FileText,
  Check,
  X,
  Plus,
  Trash2,
  Maximize2,
  RefreshCw,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { formatFileSize } from '@/utils/formatFileSize';
import { getFormatLabel } from '@/utils/imageProcessor';
import styles from './ConvertWorkspace.module.css';

const FORMAT_CARDS = [
  {
    id: 'jpg',
    value: 'image/jpeg',
    label: 'JPG',
    color: '#7c3aed',
    bg: '#f5f3ff',
    icon: ImageIcon,
  },
  {
    id: 'png',
    value: 'image/png',
    label: 'PNG',
    color: '#0284c7',
    bg: '#f0f9ff',
    icon: ImageIcon,
  },
  {
    id: 'webp',
    value: 'image/webp',
    label: 'WEBP',
    color: '#059669',
    bg: '#ecfdf5',
    icon: ImageIcon,
  },
  {
    id: 'gif',
    value: 'image/gif',
    label: 'GIF',
    color: '#ea580c',
    bg: '#fff7ed',
    icon: ImageIcon,
  },
  {
    id: 'pdf',
    value: 'application/pdf',
    label: 'PDF',
    color: '#dc2626',
    bg: '#fef2f2',
    icon: FileText,
  },
];

function UploadIllustration() {
  return (
    <div className={styles.illustrationWrap} aria-hidden="true">
      <svg
        width="136"
        height="92"
        viewBox="0 0 136 92"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.illustrationSvg}
      >
        {/* Left Tilted Card */}
        <g transform="translate(18, 14) rotate(-11)">
          <rect
            width="62"
            height="44"
            rx="8"
            fill="url(#cardGradLeft)"
            stroke="#e9d5ff"
            strokeWidth="1.5"
          />
          <path
            d="M8 36 L22 22 L34 32 L46 20 L54 34"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.65"
          />
        </g>

        {/* Right Tilted Card */}
        <g transform="translate(66, 6) rotate(12)">
          <rect
            width="62"
            height="44"
            rx="8"
            fill="url(#cardGradRight)"
            stroke="#ddd6fe"
            strokeWidth="1.5"
          />
          <path
            d="M8 36 L20 24 L32 34 L44 22 L54 34"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.65"
          />
        </g>

        {/* Center Main Card */}
        <g transform="translate(32, 14)">
          <rect
            width="72"
            height="52"
            rx="10"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="2.5"
            filter="url(#centerShadow)"
          />
          <rect x="2" y="2" width="68" height="48" rx="8" fill="url(#skyGradient)" />
          {/* Golden Sun */}
          <circle cx="50" cy="16" r="6" fill="#fbbf24" />
          {/* Distant Mountain */}
          <path
            d="M6 50 L26 27 L42 41 L66 50 Z"
            fill="#93c5fd"
            opacity="0.85"
          />
          {/* Near Mountain */}
          <path
            d="M18 50 L36 32 L54 46 L68 50 Z"
            fill="#60a5fa"
          />
          {/* Mountain Snow Peak */}
          <path
            d="M26 27 L30 31 L26 33 L22 31 Z"
            fill="#ffffff"
            opacity="0.9"
          />
        </g>

        <defs>
          <linearGradient id="skyGradient" x1="0" y1="0" x2="68" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#bfdbfe" />
            <stop offset="1" stopColor="#93c5fd" />
          </linearGradient>
          <linearGradient id="cardGradLeft" x1="0" y1="0" x2="62" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f5f3ff" />
            <stop offset="1" stopColor="#ede9fe" />
          </linearGradient>
          <linearGradient id="cardGradRight" x1="0" y1="0" x2="62" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#faf5ff" />
            <stop offset="1" stopColor="#f3e8ff" />
          </linearGradient>
          <filter id="centerShadow" x="-10" y="-6" width="92" height="74" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#7c3aed" floodOpacity="0.16" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

export function ConvertWorkspace({
  queueItems = [],
  onAddFiles,
  onRemoveItem,
  onClearAll,
  outputFormat,
  onOutputFormatChange,
  _quality,
  _onQualityChange,
  keepOriginalSize,
  onKeepOriginalSizeChange,
  _removeMetadata,
  _onRemoveMetadataChange,
  sameFormatAll,
  onSameFormatAllChange,
  _backgroundColor,
  _onBackgroundColorChange,
  onConvert,
  isConverting,
  convertingIndex,
  error,
  title = 'Convert Image',
  subtitle = 'Change your image to JPG, PNG, WEBP, GIF, PDF and more formats.',
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const totalFiles = queueItems.length;

  // Drag & drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const droppedFiles = e.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        onAddFiles(droppedFiles);
      }
    },
    [onAddFiles],
  );

  const handleFileInputChange = useCallback(
    (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onAddFiles(files);
      }
      e.target.value = '';
    },
    [onAddFiles],
  );

  const handleTriggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const progressPercent =
    totalFiles > 0 ? Math.round(((convertingIndex + 1) / totalFiles) * 100) : 0;

  return (
    <div className={styles.workspaceWrapper}>
      {/* 1. Page Header — Center Aligned */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.pageSubtitle}>{subtitle}</p>
      </div>

      {/* 2. Main 2-Column Grid (60% / 40%) */}
      <div className={styles.mainGrid}>
        {/* Left Column: Upload Images Card */}
        <div className={styles.leftCard}>
          {totalFiles === 0 ? (
            /* Empty State: Large Clean Dashed Upload Area */
            <div
              className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleTriggerBrowse}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleTriggerBrowse();
              }}
              aria-label="Upload images drop area"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.heic,.tiff"
                onChange={handleFileInputChange}
                className={styles.hiddenFileInput}
                tabIndex={-1}
              />

              <div className={styles.dropZoneContent}>
                <UploadIllustration />

                <h2 className={styles.dropHeading}>Drop images here or click to upload</h2>
                <p className={styles.dropSubtext}>Convert your images to any format in seconds.</p>

                <button
                  type="button"
                  className={styles.chooseImagesBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerBrowse();
                  }}
                >
                  <UploadCloud size={18} />
                  <span>Choose Images</span>
                </button>

                <div className={styles.supportMetaRow}>
                  <span>Supports: JPG, PNG, WEBP, GIF, BMP, HEIC, TIFF</span>
                  <span className={styles.metaSeparator}>|</span>
                  <span>Max file size: 50 MB each</span>
                </div>
              </div>
            </div>
          ) : (
            /* Uploaded State: File Cards with Add More and Clear All */
            <div className={styles.uploadedContainer}>
              <div className={styles.uploadedHeader}>
                <div className={styles.uploadedCountWrap}>
                  <h2 className={styles.uploadedTitle}>Uploaded Images</h2>
                  <span className={styles.fileCountPill}>{totalFiles}</span>
                </div>

                <div className={styles.uploadedActions}>
                  <button
                    type="button"
                    className={styles.addMoreBtn}
                    onClick={handleTriggerBrowse}
                    title="Add more images"
                  >
                    <Plus size={15} />
                    <span>Add More</span>
                  </button>

                  <button
                    type="button"
                    className={styles.clearAllBtn}
                    onClick={onClearAll}
                    title="Remove all uploaded images"
                  >
                    <Trash2 size={14} />
                    <span>Clear All</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.heic,.tiff"
                  onChange={handleFileInputChange}
                  className={styles.hiddenFileInput}
                  tabIndex={-1}
                />
              </div>

              {/* Uploaded Files Cards List */}
              <div className={styles.fileCardsList}>
                {queueItems.map((item) => {
                  const name = item.file?.name || 'Image';
                  const size = item.file?.size ? formatFileSize(item.file.size) : '';
                  const dimensions = item.meta
                    ? `${item.meta.width} × ${item.meta.height}`
                    : '';
                  const format = getFormatLabel(item.file?.type || '', name);

                  return (
                    <div key={item.id} className={styles.fileCard}>
                      <div className={styles.cardThumbWrap}>
                        <img
                          src={item.previewUrl}
                          alt={name}
                          className={styles.cardThumb}
                          loading="lazy"
                        />
                      </div>

                      <div className={styles.cardInfo}>
                        <div className={styles.cardNameRow}>
                          <span className={styles.cardFileName} title={name}>
                            {name}
                          </span>
                          <span className={styles.cardFormatTag}>{format}</span>
                        </div>

                        <div className={styles.cardMetaRow}>
                          {dimensions && <span className={styles.cardMeta}>{dimensions}</span>}
                          {dimensions && size && <span className={styles.metaDot}>•</span>}
                          {size && <span className={styles.cardMeta}>{size}</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.removeCardBtn}
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${name}`}
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Compact mini-dropzone at bottom */}
              <div
                className={`${styles.miniDropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleTriggerBrowse}
                role="button"
                tabIndex={0}
              >
                <span>Drop additional images here or click to browse</span>
              </div>
            </div>
          )}

          {/* Validation Error Alert */}
          {error && (
            <div className={styles.errorAlert} role="alert">
              <span className={styles.errorIcon}>!</span>
              <p className={styles.errorMsg}>{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Conversion Settings Card */}
        <div className={styles.rightCard}>
          {/* Section: Convert To */}
          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>Convert To</span>

            {/* Five Selectable Format Cards */}
            <div className={styles.formatCardsRow}>
              {FORMAT_CARDS.map((card) => {
                const CardIcon = card.icon;
                const isSelected = outputFormat === card.value;

                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`${styles.formatCard} ${isSelected ? styles.formatCardSelected : ''
                      }`}
                    onClick={() => onOutputFormatChange(card.value)}
                    disabled={isConverting}
                    aria-label={`Convert to ${card.label}`}
                    aria-pressed={isSelected}
                  >
                    {isSelected && (
                      <span className={styles.selectedCheckBadge}>
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}

                    <div
                      className={styles.formatIconBadge}
                      style={{ backgroundColor: card.bg, color: card.color }}
                    >
                      <CardIcon size={18} />
                    </div>

                    <span className={styles.formatName}>{card.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Options */}
          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>Options</span>

            <div className={styles.optionsList}>
              {/* Option 1: Keep original dimensions */}
              <label className={styles.toggleRow}>
                <div className={styles.toggleIconWrap}>
                  <Maximize2 size={16} className={styles.toggleIcon} />
                </div>
                <div className={styles.toggleText}>
                  <strong className={styles.toggleTitle}>Keep original dimensions</strong>
                  <span className={styles.toggleSub}>Maintain the same width and height</span>
                </div>
                <div className={styles.switchWrap}>
                  <input
                    type="checkbox"
                    checked={keepOriginalSize}
                    onChange={(e) => onKeepOriginalSizeChange(e.target.checked)}
                    className={styles.hiddenCheckbox}
                    disabled={isConverting}
                  />
                  <span
                    className={`${styles.switchSlider} ${keepOriginalSize ? styles.switchChecked : ''
                      }`}
                  />
                </div>
              </label>

              {/* Option 2: Convert all images to the same format */}
              <label className={styles.toggleRow}>
                <div className={styles.toggleIconWrap}>
                  <RefreshCw size={16} className={styles.toggleIcon} />
                </div>
                <div className={styles.toggleText}>
                  <strong className={styles.toggleTitle}>Convert all images to the same format</strong>
                  <span className={styles.toggleSub}>Apply the selected format to all uploaded images</span>
                </div>
                <div className={styles.switchWrap}>
                  <input
                    type="checkbox"
                    checked={sameFormatAll}
                    onChange={(e) => onSameFormatAllChange(e.target.checked)}
                    className={styles.hiddenCheckbox}
                    disabled={isConverting}
                  />
                  <span
                    className={`${styles.switchSlider} ${sameFormatAll ? styles.switchChecked : ''
                      }`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Progress Indicator when converting */}
          {isConverting && (
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>
                  Converting image {convertingIndex + 1} of {totalFiles}...
                </span>
                <span className={styles.progressPercentText}>{progressPercent}%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Primary Action Button: Convert Images -> */}
          <button
            type="button"
            className={styles.convertBtn}
            onClick={onConvert}
            disabled={totalFiles === 0 || isConverting}
          >
            {isConverting ? (
              <>
                <Loader2 size={18} className={styles.spinnerIcon} />
                <span>Converting Images...</span>
              </>
            ) : (
              <>
                <RefreshCw size={17} className={styles.btnIcon} />
                <span>Convert Images</span>
                <ArrowRight size={17} className={styles.btnArrow} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConvertWorkspace;
