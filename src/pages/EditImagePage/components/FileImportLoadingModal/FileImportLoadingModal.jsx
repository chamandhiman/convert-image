import { useEffect, useMemo } from 'react';
import styles from './FileImportLoadingModal.module.css';

/**
 * Clean Folded-Document Icon matching the minimal mockup
 * Purple outline with folded top-right corner and centered badge.
 */
function DocumentBadgeIcon({ ext = 'PSD' }) {
  const displayExt = (ext || 'PSD').toUpperCase().slice(0, 4);

  return (
    <svg
      className={styles.fileIconSvg}
      width="44"
      height="52"
      viewBox="0 0 44 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Document outline with folded corner */}
      <path
        d="M8 2H28L40 14V46C40 48.2091 38.2091 50 36 50H8C5.79086 50 4 48.2091 4 46V6C4 3.79086 5.79086 2 8 2Z"
        fill="#FFFFFF"
        stroke="#7C3AED"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fold corner path */}
      <path
        d="M28 2V14H40"
        stroke="#7C3AED"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Centered file type pill badge */}
      <rect x="11" y="24" width="22" height="12" rx="3.5" fill="#7C3AED" />
      <text
        x="22"
        y="33"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.4"
      >
        {displayExt}
      </text>
    </svg>
  );
}

/**
 * Minimal File Import Loading Modal
 * - Displays centered white card on dimmed background
 * - File badge icon, "Importing File", and filename
 * - Progress bar with percentage
 * - Single short status line (e.g. "Parsing layers...")
 * - Cancel button
 */
export function FileImportLoadingModal({
  isOpen,
  fileName = '',
  fileType = '',
  progress = 0,
  status = 'Parsing layers...',
  onCancel,
}) {
  // ESC key support to cancel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Determine file extension for badge
  const fileExt = useMemo(() => {
    if (fileType) {
      if (fileType.includes('psd') || fileType.includes('photoshop')) return 'PSD';
      if (fileType.includes('png')) return 'PNG';
      if (fileType.includes('jpeg') || fileType.includes('jpg')) return 'JPG';
      if (fileType.includes('webp')) return 'WEBP';
      if (fileType.includes('svg')) return 'SVG';
      if (fileType.includes('gif')) return 'GIF';
    }
    if (fileName && fileName.includes('.')) {
      const ext = fileName.split('.').pop();
      if (ext && ext.length <= 4) return ext.toUpperCase();
    }
    return 'PSD';
  }, [fileType, fileName]);

  if (!isOpen) return null;

  const validPercent = typeof progress === 'number' && !isNaN(progress) && progress >= 0 ? Math.min(100, Math.round(progress)) : 0;
  const isIndeterminate = validPercent === 0;

  return (
    <div
      className={styles.modalOverlay}
      data-testid="file-import-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div
        className={styles.modalCard}
        data-testid="file-import-loading-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* File Icon */}
        <div className={styles.fileIconWrap} data-testid="import-file-icon">
          <DocumentBadgeIcon ext={fileExt} />
        </div>

        {/* Title */}
        <h2 id="import-modal-title" className={styles.modalTitle}>
          Importing File
        </h2>

        {/* Filename */}
        <p className={styles.fileName} title={fileName || 'file'}>
          {fileName || 'document.psd'}
        </p>

        {/* Progress Bar & Percentage */}
        <div className={styles.progressRow} data-testid="import-progress-row">
          <div className={styles.progressTrack} role="progressbar" aria-valuenow={validPercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`${styles.progressFill} ${isIndeterminate ? styles.progressFillIndeterminate : ''}`}
              style={{ width: isIndeterminate ? '40%' : `${validPercent}%` }}
            />
          </div>
          <span className={styles.progressPercentage} data-testid="import-percentage">
            {isIndeterminate ? '...' : `${validPercent}%`}
          </span>
        </div>

        {/* Short Status Line */}
        <p className={styles.statusText} data-testid="import-status-text">
          {status || 'Parsing layers...'}
        </p>

        {/* Cancel Button */}
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          data-testid="import-cancel-button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default FileImportLoadingModal;

