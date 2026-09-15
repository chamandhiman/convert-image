/**
 * MultiImageUploader
 *
 * Reusable multi-image upload component with:
 * - drag & drop
 * - multiple file selection
 */

import { useCallback, useRef } from 'react';

import { IconUpload } from '@/components/ui/Icons/Icons';

import styles from './MultiImageUploader.module.css';

export default function MultiImageUploader({
  onFilesChange,
  onFileSelect,
  accept,
  acceptedTypes: _acceptedTypes,
  hint,
  maxFileSize: _maxFileSize,
  triggerLabel = 'Choose Images',
  dropLabel = 'Drop your images here',
  compact = false,
}) {
  const inputRef = useRef(null);

  const handleInputChange = useCallback(
    (e) => {
      const selected = e.target.files;
      if (selected && selected.length > 0) {
        onFilesChange?.(selected);
        Array.from(selected).forEach((file) => onFileSelect?.(file));
      }
      e.target.value = '';
    },
    [onFilesChange, onFileSelect],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropped = e.dataTransfer?.files;
      if (dropped && dropped.length > 0) {
        onFilesChange?.(dropped);
        Array.from(dropped).forEach((file) => onFileSelect?.(file));
      }
    },
    [onFilesChange, onFileSelect],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (compact) {
    return (
      <div className={styles.root}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleInputChange}
          className={styles.hiddenInput}
          tabIndex={-1}
          aria-hidden="true"
        />

        <button
          type="button"
          className={styles.addMoreBtn}
          onClick={() => inputRef.current?.click()}
          aria-label="Add more images"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleInputChange}
        className={styles.hiddenInput}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div
        className={styles.dropZone}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Upload images. Drag and drop here or press Enter to browse."
      >
        <div className={styles.dropIcon} aria-hidden="true">
          <IconUpload size={32} />
        </div>
        <p className={styles.dropText}>
          <span className={styles.dropTextPrimary}>{dropLabel}</span>
          <span className={styles.dropTextSecondary}>or {triggerLabel}</span>
        </p>
        {hint && <p className={styles.hint}>{hint}</p>}
      </div>
    </div>
  );
}
