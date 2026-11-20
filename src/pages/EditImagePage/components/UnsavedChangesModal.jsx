import { useEffect } from 'react';
import { AlertTriangle, Save, Trash2, X } from 'lucide-react';
import styles from './UnsavedChangesModal.module.css';

export function UnsavedChangesModal({
  isOpen,
  documentName = 'Document',
  onSaveAndClose,
  onDiscardAndClose,
  onCancel,
}) {
  // Close on Escape, Save & Close on Enter
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSaveAndClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onSaveAndClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalBackdrop}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
      data-testid="unsaved-changes-modal"
    >
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.iconCircle}>
            <AlertTriangle size={20} className={styles.alertIcon} />
          </div>
          <div className={styles.titleColumn}>
            <h3 id="unsaved-modal-title" className={styles.modalTitle}>
              Save changes before closing?
            </h3>
            <p className={styles.modalDesc}>
              The document <strong className={styles.docHighlight}>&ldquo;{documentName}&rdquo;</strong> has unsaved modifications.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onCancel}
            aria-label="Close dialog"
            title="Cancel"
            data-testid="btn-cancel-unsaved-close"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.bodyText}>
            If you close without saving, any edits, layer changes, and adjustments made to this document will be lost permanently.
          </p>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            data-testid="btn-unsaved-cancel"
          >
            Cancel
          </button>
          <div className={styles.actionButtonGroup}>
            <button
              type="button"
              className={styles.discardBtn}
              onClick={onDiscardAndClose}
              data-testid="btn-unsaved-discard"
            >
              <Trash2 size={14} />
              <span>Don&apos;t Save</span>
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={onSaveAndClose}
              data-testid="btn-unsaved-save"
            >
              <Save size={14} />
              <span>Save &amp; Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesModal;

