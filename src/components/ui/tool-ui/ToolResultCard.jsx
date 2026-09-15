import { Button } from '@/components/ui/Button';
import { IconDownload } from '@/components/ui/Icons/Icons';
import styles from './ToolResultCard.module.css';

export function ToolResultCard({ previewUrl, fileName, fileSize, status, error, onDownload }) {
  return (
    <div className={`${styles.card} ${status === 'complete' ? styles.success : ''} ${status === 'failed' ? styles.failed : ''}`}>
      <div className={styles.thumbWrap}>
        <img src={previewUrl} alt={fileName} className={styles.thumb} />
        {status === 'complete' && (
          <div className={styles.overlay}>
            <Button variant="primary" size="sm" icon={<IconDownload />} onClick={onDownload}>
              Download
            </Button>
          </div>
        )}
        {status === 'complete' && (
          <div className={styles.badge}>Done</div>
        )}
        {status === 'failed' && (
          <div className={`${styles.badge} ${styles.badgeError}`}>Failed</div>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.name} title={fileName}>{fileName}</span>
        <span className={styles.size}>{fileSize}</span>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </div>
  );
}
