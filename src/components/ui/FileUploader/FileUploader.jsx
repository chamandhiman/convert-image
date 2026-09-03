import { useState, useRef, useCallback } from 'react';

import { formatFileSize } from '@/utils/formatFileSize';
import { ACCEPT_STRING, ACCEPTED_INPUT_TYPES, MAX_FILE_SIZE } from '@/utils/imageProcessor';

import styles from './FileUploader.module.css';

/**
 * Drag-and-drop + click-to-browse file uploader.
 *
 * Props:
 *  - onFileSelect(file: File) — called when a valid file is chosen.
 *  - accept?: string          — override the default accept string.
 *  - acceptedTypes?: string[] — override the accepted MIME types.
 *  - maxSize?: number         — override the default max file size in bytes.
 *  - file?: File | null       — currently selected file (controlled).
 *  - onClear?()               — called when the user removes the file.
 *  - hint?: string            — custom helper text shown below the drop zone.
 */
function FileUploader({
  onFileSelect,
  accept = ACCEPT_STRING,
  acceptedTypes = ACCEPTED_INPUT_TYPES,
  maxSize = MAX_FILE_SIZE,
  file = null,
  onClear,
  hint,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validate = useCallback(
    (f) => {
      const isTypeAccepted =
        acceptedTypes.includes(f.type) ||
        (f.name &&
          accept
            .split(',')
            .some((ext) => f.name.toLowerCase().endsWith(ext.trim().toLowerCase())));

      if (!isTypeAccepted) {
        return `"${f.name}" is not a supported image format.`;
      }
      if (f.size > maxSize) {
        return `"${f.name}" is ${formatFileSize(f.size)}, which exceeds the ${formatFileSize(maxSize)} limit.`;
      }
      return '';
    },
    [acceptedTypes, accept, maxSize],
  );

  const handleFile = useCallback(
    (f) => {
      const err = validate(f);
      if (err) {
        setError(err);
        return;
      }
      setError('');
      onFileSelect(f);
    },
    [validate, onFileSelect],
  );

  /* -- Drag events -- */
  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const dropped = e.dataTransfer?.files?.[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  /* -- Click / input -- */
  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onInputChange = useCallback(
    (e) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
      /* Reset so the same file can be re-selected after clear. */
      e.target.value = '';
    },
    [handleFile],
  );

  /* -- Keyboard -- */
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPicker();
      }
    },
    [openPicker],
  );

  /* -- Clear -- */
  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      setError('');
      onClear?.();
    },
    [onClear],
  );

  /* If a file is selected, show the file info instead of the drop zone. */
  if (file) {
    return (
      <div className={styles.selected}>
        <div className={styles.fileInfo}>
          <svg
            className={styles.fileIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <div className={styles.fileMeta}>
            <span className={styles.fileName}>{file.name}</span>
            <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
          </div>
        </div>
        {onClear && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Remove selected file"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload an image. Drag and drop here or press Enter to browse."
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onInputChange}
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        <svg
          className={styles.uploadIcon}
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <p className={styles.dropText}>
          <span className={styles.dropTextPrimary}>Drop your image here</span>
          <span className={styles.dropTextSecondary}>or click to browse</span>
        </p>

        <p className={styles.hint}>
          {hint ?? `JPG, PNG, WebP, AVIF — up to ${formatFileSize(maxSize)}`}
        </p>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default FileUploader;
