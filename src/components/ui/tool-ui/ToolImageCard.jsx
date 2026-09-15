import styles from './ToolImageCard.module.css';

export function ToolImageCard({ previewUrl, fileName, fileSize, status, error, onRemove, onClick }) {
  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={styles.card}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.thumbWrap}>
        <img src={previewUrl} alt={fileName} className={styles.thumb} />
        <button
          type="button"
          className={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={`Remove ${fileName}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className={`${styles.status} ${styles[status]}`}>
          {status === 'complete' && 'Done'}
          {status === 'failed' && 'Failed'}
          {status === 'ready' && 'Ready'}
          {status === 'processing' && 'Processing'}
        </div>
      </div>
      <div className={styles.info}>
        <span className={styles.name} title={fileName}>{fileName}</span>
        <span className={styles.size}>{fileSize}</span>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </div>
  );
}
