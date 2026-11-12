import { useState } from 'react';
import {
  Download,
  Archive,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatFileSize } from '@/utils/formatFileSize';
import { createZipBlob } from '@/utils/zip';
import { downloadBlob, buildResizedFilename } from '@/utils/imageProcessor';
import styles from './ResizePage.module.css';

export default function ResizeResultsView({
  queueItems = [],
  onDownloadItem,
  onStartAgain,
  outputFormat = 'original',
  customSuffix = '',
}) {
  const [isZipping, setIsZipping] = useState(false);

  const completedItems = queueItems.filter(
    (item) => item.status === 'complete' && item.result?.blob,
  );
  const totalCount = queueItems.length;
  const completedCount = completedItems.length;

  const totalOrigSize = queueItems.reduce((acc, it) => acc + (it.file?.size || 0), 0);
  const totalOutputSize = completedItems.reduce(
    (acc, it) => acc + (it.result?.blob?.size || 0),
    0,
  );

  const bytesSaved = Math.max(0, totalOrigSize - totalOutputSize);
  const percentSaved =
    totalOrigSize > 0 ? Math.round((bytesSaved / totalOrigSize) * 100) : 0;

  // Handle Download All as ZIP
  const handleDownloadZip = async () => {
    if (completedItems.length === 0) return;
    setIsZipping(true);
    try {
      const filesForZip = completedItems.map((item) => {
        const resolvedType =
          outputFormat === 'original'
            ? (item.meta?.isSvg ? 'image/png' : item.meta?.type || 'image/jpeg')
            : outputFormat;
        const filename = buildResizedFilename(
          item.meta?.name || item.file?.name || 'image',
          resolvedType,
          item.result.width,
          item.result.height,
          customSuffix,
        );
        return {
          name: filename,
          blob: item.result.blob,
        };
      });

      const zipBlob = await createZipBlob(filesForZip, 'resized-images.zip');
      downloadBlob(zipBlob, 'resized-images.zip');
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className={styles.resultsContainer}>
      {/* Top Hero Banner */}
      <div className={styles.resultsBanner}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIconWrap}>
            <CheckCircle2 size={28} className={styles.successIcon} />
          </div>
          <div>
            <h2 className={styles.bannerTitle}>
              {completedCount === 1
                ? 'Image Resized Successfully!'
                : `All ${completedCount} Images Resized Successfully!`}
            </h2>
            <p className={styles.bannerDesc}>
              High-resolution resampling complete with exact pixel precision.
            </p>
          </div>
        </div>

        <div className={styles.bannerActions}>
          {completedItems.length > 1 && (
            <button
              type="button"
              className={styles.bannerZipBtn}
              onClick={handleDownloadZip}
              disabled={isZipping}
            >
              <Archive size={17} />
              <span>{isZipping ? 'Creating ZIP…' : 'Download All as ZIP'}</span>
            </button>
          )}

          <button
            type="button"
            className={styles.bannerStartAgainBtn}
            onClick={onStartAgain}
          >
            <RotateCcw size={16} />
            <span>Resize Another</span>
          </button>
        </div>
      </div>

      {/* Savings & Metrics Strip */}
      <div className={styles.metricsStrip}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Resized</span>
          <span className={styles.metricValue}>
            {completedCount} / {totalCount} files
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Original Size</span>
          <span className={styles.metricValue}>{formatFileSize(totalOrigSize)}</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>New Output Size</span>
          <span className={styles.metricValue}>{formatFileSize(totalOutputSize)}</span>
        </div>

        <div className={`${styles.metricCard} ${styles.metricCardSavings}`}>
          <span className={styles.metricLabel}>Storage Saved</span>
          <div className={styles.savingsWrap}>
            <Sparkles size={14} className={styles.sparkleIcon} />
            <span className={styles.metricSavingsValue}>
              {formatFileSize(bytesSaved)} ({percentSaved}%)
            </span>
          </div>
        </div>
      </div>

      {/* Result Cards Grid */}
      <div className={styles.resultsGrid}>
        {queueItems.map((item) => {
          const isDone = item.status === 'complete' && item.result;
          const isFailed = item.status === 'failed';
          const origSize = item.file?.size || 0;
          const newSize = item.result?.blob?.size || 0;
          const itemSaved = Math.max(0, origSize - newSize);
          const itemPct = origSize > 0 ? Math.round((itemSaved / origSize) * 100) : 0;

          return (
            <div key={item.id} className={styles.resultCard}>
              <div className={styles.resultThumbWrap}>
                <img
                  src={isDone ? item.result.url : item.previewUrl}
                  alt={item.file?.name}
                  className={styles.resultThumbImg}
                />
              </div>

              <div className={styles.resultDetails}>
                <div className={styles.resultDetailsTop}>
                  <h4 className={styles.resultFileName} title={item.file?.name}>
                    {item.file?.name}
                  </h4>
                  {isDone && (
                    <span className={styles.resultBadgeDone}>Ready</span>
                  )}
                  {isFailed && (
                    <span className={styles.resultBadgeFailed}>Failed</span>
                  )}
                </div>

                {isDone && (
                  <>
                    <div className={styles.resultTransitionRow}>
                      <span className={styles.transBefore}>
                        {item.meta?.width}×{item.meta?.height} px
                      </span>
                      <ArrowRight size={13} className={styles.transArrow} />
                      <span className={styles.transAfter}>
                        {item.result.width}×{item.result.height} px
                      </span>
                    </div>

                    <div className={styles.resultSizeRow}>
                      <span className={styles.sizeBefore}>
                        {formatFileSize(origSize)}
                      </span>
                      <ArrowRight size={13} className={styles.transArrow} />
                      <span className={styles.sizeAfter}>
                        {formatFileSize(newSize)}
                      </span>
                      {itemPct > 0 && (
                        <span className={styles.itemSavingsBadge}>
                          -{itemPct}%
                        </span>
                      )}
                    </div>
                  </>
                )}

                {isFailed && (
                  <div className={styles.resultErrorRow}>
                    <AlertCircle size={14} />
                    <span>{item.error || 'Failed to resize this image.'}</span>
                  </div>
                )}
              </div>

              <div className={styles.resultActions}>
                {isDone && (
                  <button
                    type="button"
                    className={styles.resultDownloadBtn}
                    onClick={() => onDownloadItem?.(item)}
                    title={`Download ${item.file?.name}`}
                  >
                    <Download size={15} />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

