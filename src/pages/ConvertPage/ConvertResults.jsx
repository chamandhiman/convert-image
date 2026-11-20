import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  Download,
  RotateCcw,
  Check,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { formatFileSize } from '@/utils/formatFileSize';
import { getFormatLabel, downloadBlob } from '@/utils/imageProcessor';
import { createZipBlob } from '@/utils/zip';
import styles from './ConvertResults.module.css';

export function ConvertResults({
  queueItems = [],
  onReset,
  onRemoveItem,
  title = 'Convert Image',
  subtitle = 'Change your image to JPG, PNG, WEBP, GIF, PDF and more formats.',
}) {
  // Track selected rows for batch actions
  const [selectedIds, setSelectedIds] = useState(() =>
    queueItems.map((item) => item.id),
  );

  // Active item for centered preview modal
  const [modalItem, setModalItem] = useState(null);

  // ZIP packaging state & error message
  const [isZipping, setIsZipping] = useState(false);
  const [zipError, setZipError] = useState(null);

  // Successful items
  const successItems = useMemo(
    () => queueItems.filter((item) => item.status === 'success' && item.result?.blob),
    [queueItems],
  );

  const isAllSelected =
    queueItems.length > 0 && selectedIds.length === queueItems.length;

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queueItems.map((item) => item.id));
    }
  }, [isAllSelected, queueItems]);

  const toggleSelectRow = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setModalItem(null);
      }
    }
    if (modalItem) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [modalItem]);

  // Download single item
  const handleDownloadSingle = useCallback((item) => {
    if (!item?.result?.blob) return;
    const filename = item.result.filename || 'converted-image';
    downloadBlob(item.result.blob, filename);
  }, []);

  // Download all as ZIP
  const handleDownloadAllZip = useCallback(async () => {
    if (successItems.length === 0 || isZipping) return;
    setZipError(null);

    // If only one converted item exists, download directly as an individual image file
    if (successItems.length === 1) {
      handleDownloadSingle(successItems[0]);
      return;
    }

    setIsZipping(true);
    try {
      const files = successItems.map((item) => ({
        name: item.result.filename || `converted-${item.id}`,
        blob: item.result.blob,
      }));
      const zipBlob = await createZipBlob(files, 'converted-images.zip');
      downloadBlob(zipBlob, 'converted-images.zip');
    } catch (err) {
      console.error('[ConvertResults] Download All ZIP failed:', err);
      setZipError(err?.message || 'Failed to generate ZIP archive. Please try downloading files individually.');
    } finally {
      setIsZipping(false);
    }
  }, [successItems, isZipping, handleDownloadSingle]);

  // Download selected items
  const handleDownloadSelected = useCallback(async () => {
    if (isZipping) return;
    setZipError(null);

    const selectedSuccess = queueItems.filter(
      (item) =>
        selectedIds.includes(item.id) &&
        item.status === 'success' &&
        item.result?.blob,
    );

    if (selectedSuccess.length === 0) return;

    // If only one file is selected, download directly as an individual image file
    if (selectedSuccess.length === 1) {
      handleDownloadSingle(selectedSuccess[0]);
      return;
    }

    setIsZipping(true);
    try {
      const files = selectedSuccess.map((item) => ({
        name: item.result.filename || `converted-${item.id}`,
        blob: item.result.blob,
      }));
      const zipBlob = await createZipBlob(files, 'converted-images-selected.zip');
      downloadBlob(zipBlob, 'converted-images-selected.zip');
    } catch (err) {
      console.error('[ConvertResults] Download Selected ZIP failed:', err);
      setZipError(err?.message || 'Failed to create ZIP archive for selected files. Please try again.');
    } finally {
      setIsZipping(false);
    }
  }, [queueItems, selectedIds, isZipping, handleDownloadSingle]);

  // Delete selected items
  const handleDeleteSelected = useCallback(() => {
    selectedIds.forEach((id) => onRemoveItem(id));
    setSelectedIds([]);
  }, [selectedIds, onRemoveItem]);

  return (
    <div className={styles.resultsWrapper}>
      {/* 1. Page Header — Center Aligned */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.pageSubtitle}>{subtitle}</p>
      </div>

      {/* 2. Error Notification Banner (if any) */}
      {zipError && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={18} className={styles.errorIcon} />
          <span className={styles.errorText}>{zipError}</span>
          <button
            type="button"
            className={styles.errorDismissBtn}
            onClick={() => setZipError(null)}
            aria-label="Dismiss error notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 3. Success Alert Banner */}
      <div className={styles.successBanner}>
        <div className={styles.bannerLeft}>
          <div className={styles.successIconBadge}>
            <CheckCircle2 size={22} className={styles.checkIcon} />
          </div>
          <div className={styles.bannerText}>
            <h2 className={styles.bannerTitle}>Conversion Complete!</h2>
            <p className={styles.bannerSub}>
              {successItems.length} {successItems.length === 1 ? 'image' : 'images'} converted successfully.
            </p>
          </div>
        </div>

        <div className={styles.bannerActions}>
          <button
            type="button"
            className={styles.convertMoreBtn}
            onClick={onReset}
            title="Convert more images"
          >
            <RotateCcw size={15} />
            <span>Convert More</span>
          </button>

          <button
            type="button"
            className={styles.downloadAllBtn}
            onClick={handleDownloadAllZip}
            disabled={successItems.length === 0 || isZipping}
            title="Download all converted files as a ZIP archive"
          >
            {isZipping ? (
              <>
                <Loader2 size={15} className={styles.spinning} />
                <span>Preparing ZIP...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Download All (ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Single Full-Width Results Card */}
      <div className={styles.resultsCard}>
        <div className={styles.tableResponsiveWrap}>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th className={styles.thCheckbox}>
                  <label className={styles.customCheckLabel} title="Select all">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className={styles.hiddenCheckInput}
                    />
                    <span
                      className={`${styles.customCheck} ${isAllSelected ? styles.customCheckChecked : ''
                        }`}
                    >
                      {isAllSelected && <Check size={11} strokeWidth={3} />}
                    </span>
                  </label>
                </th>
                <th className={styles.thPreview}>Preview</th>
                <th className={styles.thSize}>Size</th>
                <th className={styles.thFormat}>Format</th>
                <th className={styles.thStatus}>Status</th>
                <th className={styles.thAction}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {queueItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const origName = item.file?.name || 'Image';
                const newName = item.result?.filename || origName;
                const origSize = item.file?.size ? formatFileSize(item.file.size) : '—';
                const newSize = item.result?.blob?.size
                  ? formatFileSize(item.result.blob.size)
                  : '—';
                const format =
                  item.result?.targetFormat ||
                  getFormatLabel(item.file?.type || '', origName);
                const isSuccess = item.status === 'success';

                return (
                  <tr
                    key={item.id}
                    className={`${styles.tableRow} ${isSelected ? styles.tableRowSelected : ''
                      }`}
                    title={newName}
                  >
                    <td
                      className={styles.tdCheckbox}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className={styles.customCheckLabel}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          className={styles.hiddenCheckInput}
                        />
                        <span
                          className={`${styles.customCheck} ${isSelected ? styles.customCheckChecked : ''
                            }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </span>
                      </label>
                    </td>

                    <td className={styles.tdPreview}>
                      <button
                        type="button"
                        className={styles.rowThumbBtn}
                        onClick={() => setModalItem(item)}
                        title={`Click to preview ${newName}`}
                        aria-label={`Preview ${newName}`}
                      >
                        <img
                          src={item.result?.url || item.previewUrl}
                          alt={newName}
                          className={styles.rowThumb}
                          loading="lazy"
                        />
                      </button>
                    </td>

                    <td className={styles.tdSize}>
                      <div className={styles.mergedSizeCell}>
                        <span className={styles.origSizeText}>{origSize}</span>
                        <span className={styles.sizeArrow}>→</span>
                        <span className={styles.newSizeText}>{newSize}</span>
                      </div>
                    </td>

                    <td className={styles.tdFormat}>
                      <span className={styles.formatBadge}>{format}</span>
                    </td>

                    <td className={styles.tdStatus}>
                      {isSuccess ? (
                        <span className={styles.statusSuccessPill}>
                          <Check size={11} strokeWidth={3} />
                          <span>Converted</span>
                        </span>
                      ) : item.status === 'incompatible' ? (
                        <span className={styles.statusSkippedPill}>
                          <span>{item.incompatibleReason || 'Skipped'}</span>
                        </span>
                      ) : (
                        <span className={styles.statusErrorPill}>
                          <AlertTriangle size={11} strokeWidth={3} />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>

                    <td
                      className={styles.tdAction}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.rowActionBtns}>
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => handleDownloadSingle(item)}
                          disabled={!isSuccess}
                          title="Download image"
                          aria-label={`Download ${newName}`}
                        >
                          <Download size={14} />
                        </button>

                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => setModalItem(item)}
                          title="Preview image"
                          aria-label={`Preview ${newName}`}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Batch Controls */}
        <div className={styles.tableFooter}>
          <div className={styles.footerLeft}>
            <label className={styles.footerSelectAllLabel}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className={styles.hiddenCheckInput}
              />
              <span
                className={`${styles.customCheck} ${isAllSelected ? styles.customCheckChecked : ''
                  }`}
              >
                {isAllSelected && <Check size={11} strokeWidth={3} />}
              </span>
              <span className={styles.footerSelectText}>Select All</span>
            </label>

            <button
              type="button"
              className={styles.deleteSelectedBtn}
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
              title="Delete selected images from list"
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>
          </div>

          <div className={styles.footerRight}>
            <button
              type="button"
              className={styles.downloadSelectedBtn}
              onClick={handleDownloadSelected}
              disabled={selectedIds.length === 0 || isZipping}
              title="Download all checked images"
            >
              {isZipping ? (
                <>
                  <Loader2 size={14} className={styles.spinning} />
                  <span>Preparing ZIP...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download Selected ({selectedIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Simple Centered Preview Modal */}
      {modalItem && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setModalItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image Preview"
        >
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <h3 className={styles.modalTitle}>
                  {modalItem.result?.filename || modalItem.file?.name || 'Image Preview'}
                </h3>
                <span className={styles.modalFormatBadge}>
                  {modalItem.result?.targetFormat ||
                    getFormatLabel(modalItem.file?.type || '', modalItem.file?.name || '')}
                </span>
              </div>

              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setModalItem(null)}
                aria-label="Close preview"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className={styles.modalBody}>
              <img
                src={modalItem.result?.url || modalItem.previewUrl}
                alt={modalItem.result?.filename || modalItem.file?.name || 'Preview'}
                className={styles.modalImage}
              />
            </div>

            {/* Modal Footer with Metadata & Download */}
            <div className={styles.modalFooter}>
              <div className={styles.modalMeta}>
                <span className={styles.modalMetaItem}>
                  <strong>Dimensions:</strong>{' '}
                  {modalItem.result?.width && modalItem.result?.height
                    ? `${modalItem.result.width} × ${modalItem.result.height} px`
                    : modalItem.meta?.width && modalItem.meta?.height
                      ? `${modalItem.meta.width} × ${modalItem.meta.height} px`
                      : '—'}
                </span>
                <span className={styles.modalMetaDivider}>•</span>
                <span className={styles.modalMetaItem}>
                  <strong>Size:</strong>{' '}
                  <span className={styles.modalSizeGreen}>
                    {modalItem.result?.blob?.size
                      ? formatFileSize(modalItem.result.blob.size)
                      : modalItem.file?.size
                        ? formatFileSize(modalItem.file.size)
                        : '—'}
                  </span>
                </span>
              </div>

              <button
                type="button"
                className={styles.modalDownloadBtn}
                onClick={() => handleDownloadSingle(modalItem)}
                disabled={modalItem.status !== 'success'}
              >
                <Download size={14} />
                <span>Download Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConvertResults;
