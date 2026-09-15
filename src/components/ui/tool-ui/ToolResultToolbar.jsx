import { Button } from '@/components/ui/Button';
import { IconDownload, IconImagePlus } from '@/components/ui/Icons/Icons';
import styles from './ToolResultToolbar.module.css';

export function ToolResultToolbar({ completedCount, totalCount, totalSize, onDownloadAll, onDownloadZip, onStartAgain, startAgainLabel = 'Start Again', downloadAllLabel, downloadZipLabel }) {
  return (
    <div className={styles.header}>
      <div>
        <h3 className={styles.title}>
          {completedCount} of {totalCount} completed
        </h3>
        <p className={styles.meta}>
          Total size: {totalSize}
        </p>
      </div>
      <div className={styles.actions}>
        {completedCount > 0 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<IconDownload />}
              onClick={onDownloadAll}
            >
              {downloadAllLabel || `Download All (${completedCount})`}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<IconDownload />}
              onClick={onDownloadZip}
            >
              {downloadZipLabel || 'Download All as ZIP'}
            </Button>
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          icon={<IconImagePlus />}
          onClick={onStartAgain}
        >
          {startAgainLabel}
        </Button>
      </div>
    </div>
  );
}
