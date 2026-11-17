import { Undo2, Redo2, RotateCcw, Clock, CheckCircle } from 'lucide-react';
import styles from './HistoryPanel.module.css';

export function HistoryPanel({
  history = [],
  historyIndex = -1,
  onJumpToHistory,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetOriginal,
  canReset,
}) {
  return (
    <div className={styles.historyContainer}>
      {/* Header Bar */}
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <span className={styles.panelTitle}>History</span>
          <span className={styles.historyBadge}>{history.length}</span>
        </div>

        <div className={styles.historyActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo Last Action (Ctrl+Z)"
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={13} />
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={onResetOriginal}
            disabled={!canReset}
            title="Reset to Original Image"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* History Timeline List */}
      <div className={styles.historyList}>
        {history.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={24} className={styles.emptyIcon} />
            <p>No actions performed yet</p>
          </div>
        ) : (
          history.map((entry, idx) => {
            const isCurrent = idx === historyIndex;
            const isFuture = idx > historyIndex;

            return (
              <button
                key={`${entry.timestamp || idx}-${idx}`}
                type="button"
                className={`${styles.historyItem} ${isCurrent ? styles.itemCurrent : ''} ${
                  isFuture ? styles.itemFuture : ''
                }`}
                onClick={() => onJumpToHistory(idx)}
                title={`Jump to step ${idx + 1}`}
              >
                <div className={styles.stepIndicator}>
                  {isCurrent ? (
                    <div className={styles.activeDot} />
                  ) : (
                    <span className={styles.stepNum}>{idx + 1}</span>
                  )}
                </div>

                <div className={styles.itemMeta}>
                  <strong className={styles.itemLabel}>{entry.label || 'Edit'}</strong>
                  <span className={styles.itemDimensions}>
                    {entry.width} × {entry.height} px
                  </span>
                </div>

                {isCurrent && <CheckCircle size={14} className={styles.currentCheck} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default HistoryPanel;

