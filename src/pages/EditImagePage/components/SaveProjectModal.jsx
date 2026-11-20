import { useState, useEffect, useRef } from 'react';
import { Files, X, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import styles from './SaveProjectModal.module.css';

export function SaveProjectModal({
  isOpen,
  onClose,
  onSave,
  defaultFileName = 'Untitled-1.psd',
  documentStats = null,
  isSaving = false,
  error = null,
}) {
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      let initialName = defaultFileName || 'Untitled-1.psd';
      if (!initialName.toLowerCase().endsWith('.psd')) {
        initialName = `${initialName.replace(/\.[^/.]+$/, '')}.psd`;
      }
      setFileName(initialName);
      // Focus and highlight name excluding extension
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const dotIdx = initialName.lastIndexOf('.');
          if (dotIdx > 0) {
            inputRef.current.setSelectionRange(0, dotIdx);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, defaultFileName]);

  // Handle Enter to Save, Escape to Cancel
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen || isSaving) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, fileName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    let sanitized = (fileName || 'Untitled-1.psd').trim();
    if (!sanitized) sanitized = 'Untitled-1.psd';
    if (!sanitized.toLowerCase().endsWith('.psd')) {
      sanitized = `${sanitized}.psd`;
    }
    onSave?.(sanitized);
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={!isSaving ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-project-title"
      data-testid="save-project-modal"
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleRow}>
            <div className={styles.iconCircle}>
              <Files size={20} className={styles.headerIcon} />
            </div>
            <div>
              <h2 id="save-project-title" className={styles.modalTitle}>
                Save Project As
              </h2>
              <p className={styles.modalSubtitle}>
                Export genuine layered Adobe Photoshop (.psd) project
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close dialog"
            data-testid="btn-cancel-save-project"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && (
            <div className={styles.errorAlert} role="alert" data-testid="save-project-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="psd-filename-input" className={styles.inputLabel}>
              File Name
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="psd-filename-input"
                ref={inputRef}
                type="text"
                className={styles.textInput}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                disabled={isSaving}
                placeholder="MyProject.psd"
                data-testid="input-project-filename"
              />
              <span className={styles.extBadge}>.psd</span>
            </div>
            <p className={styles.hintText}>
              Default format: Adobe Photoshop Document (*.psd)
            </p>
          </div>

          <div className={styles.featuresCard}>
            <h4 className={styles.featuresTitle}>Preserved Project Structure</h4>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <CheckCircle2 size={14} className={styles.checkIcon} />
                <span>All independent layers (images, text, shapes, blanks)</span>
              </div>
              <div className={styles.featureItem}>
                <CheckCircle2 size={14} className={styles.checkIcon} />
                <span>Editable text layers &amp; vector shape metadata</span>
              </div>
              <div className={styles.featureItem}>
                <CheckCircle2 size={14} className={styles.checkIcon} />
                <span>Layer effects: Drop Shadow, Stroke, Overlay, Glow</span>
              </div>
              <div className={styles.featureItem}>
                <CheckCircle2 size={14} className={styles.checkIcon} />
                <span>Photoshop blend modes, layer opacity &amp; visibility</span>
              </div>
              <div className={styles.featureItem}>
                <CheckCircle2 size={14} className={styles.checkIcon} />
                <span>Layer masks, clipping masks &amp; group hierarchy</span>
              </div>
            </div>

            {documentStats && (
              <div className={styles.statsSummary}>
                <span>Canvas: {documentStats.width} × {documentStats.height} px</span>
                <span>•</span>
                <span>{documentStats.layersCount} layer{documentStats.layersCount === 1 ? '' : 's'}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isSaving || !fileName.trim()}
              data-testid="btn-confirm-save-project"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className={styles.spinnerIcon} />
                  <span>Exporting PSD...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

