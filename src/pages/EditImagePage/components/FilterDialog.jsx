import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './FilterDialog.module.css';

export function FilterDialog({
  filter,
  onClose,
  onApply,
  onLivePreview,
}) {
  const [val, setVal] = useState(filter?.defaultVal ?? 5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  useEffect(() => {
    if (filter) {
      setVal(filter.defaultVal ?? 5);
    }
  }, [filter]);

  // Support Enter to Apply, Escape to Cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onApply(filter, val);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filter, val, onApply, onClose]);

  if (!filter) return null;

  const handleChange = (newVal) => {
    setVal(newVal);
    if (previewEnabled) {
      onLivePreview?.(filter, newVal);
    }
  };

  const handleTogglePreview = (checked) => {
    setPreviewEnabled(checked);
    if (checked) {
      onLivePreview?.(filter, val);
    } else {
      // Revert to 0 / no effect in preview
      onLivePreview?.(filter, null);
    }
  };

  return (
    <div className={styles.filterBackdrop} onClick={onClose} data-testid="filter-dialog-backdrop">
      <div className={styles.filterDialog} onClick={(e) => e.stopPropagation()} data-testid="filter-dialog">
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>{filter.label}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.filterBody}>
          <div className={styles.paramRow}>
            <div className={styles.paramHeader}>
              <span className={styles.paramLabel}>{filter.paramName || 'Amount'}</span>
              <span className={styles.paramValue}>
                {val} {filter.unit || ''}
              </span>
            </div>
            <input
              type="range"
              min={filter.min ?? 1}
              max={filter.max ?? 100}
              step={filter.step ?? 1}
              value={val}
              onChange={(e) => handleChange(Number(e.target.value))}
              className={styles.paramSlider}
              data-testid="filter-param-slider"
            />
          </div>

          <label className={styles.previewCheckboxRow}>
            <input
              type="checkbox"
              checked={previewEnabled}
              onChange={(e) => handleTogglePreview(e.target.checked)}
              className={styles.previewCheckbox}
            />
            <span>Live Preview</span>
          </label>
        </div>

        <div className={styles.filterFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnApply}
            onClick={() => onApply(filter, val)}
            data-testid="filter-apply-btn"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterDialog;

