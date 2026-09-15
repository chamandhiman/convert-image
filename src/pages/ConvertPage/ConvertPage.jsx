import { useState, useMemo, useEffect, useCallback } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import MultiImageUploader from '@/components/ui/MultiImageUploader';
import { Button } from '@/components/ui/Button';
import { IconDownload, IconImagePlus, IconUpload, IconTrash } from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  ALL_OUTPUT_FORMATS,
  getSupportedOutputFormats,
  loadImage,
  getImageMeta,
  convertImage,
  buildConvertedFilename,
  downloadBlob,
} from '@/utils/imageProcessor';
import { createZipBlob } from '@/utils/zip';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import ConvertContent from '@/pages/ConvertPage/ConvertContent';
import styles from './ConvertPage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  CONVERTING: 'converting',
  DONE: 'done',
  ERROR: 'error',
};

const SOURCE_FORMATS = [
  { value: 'image/jpeg', label: 'JPG', accept: '.jpg,.jpeg', mimeTypes: ['image/jpeg'] },
  { value: 'image/png', label: 'PNG', accept: '.png', mimeTypes: ['image/png'] },
  { value: 'image/webp', label: 'WebP', accept: '.webp', mimeTypes: ['image/webp'] },
  { value: 'image/gif', label: 'GIF', accept: '.gif', mimeTypes: ['image/gif'] },
  { value: 'image/svg+xml', label: 'SVG', accept: '.svg', mimeTypes: ['image/svg+xml'] },
];

function ConvertPage({ embedded, embeddedOnly }) {
  useDocumentTitle('Convert Images Online — JPG, PNG, WebP & More');

  const [sourceFormat, setSourceFormat] = useState('image/jpeg');
  const [outputFormat, setOutputFormat] = useState('image/png');
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [queueItems, setQueueItems] = useState([]);
  const [quality, setQuality] = useState(85);
  const [error, setError] = useState('');
  const [convertingIndex, setConvertingIndex] = useState(0);

  const outputFormats = useMemo(() => getSupportedOutputFormats(), []);
  const hasImages = queueItems.length > 0;

  const sourceFormatObj = useMemo(
    () => SOURCE_FORMATS.find((f) => f.value === sourceFormat) || SOURCE_FORMATS[0],
    [sourceFormat],
  );

  const selectedFormatObj = outputFormats.find((f) => f.value === outputFormat);
  const isLossy = selectedFormatObj ? selectedFormatObj.lossy : outputFormat !== 'image/png';
  const isSameFormat = sourceFormat === outputFormat;

  const totalSize = useMemo(
    () => queueItems.reduce((sum, item) => sum + (item.file?.size || 0), 0),
    [queueItems],
  );

  const cleanup = useCallback(() => {
    queueItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    });
    setQueueItems([]);
    setError('');
    setPhase(PHASE.IDLE);
    setConvertingIndex(0);
  }, [queueItems]);

  const validateFile = useCallback(
    (file) => {
      if (!file || !(file instanceof File)) return false;
      const mime = file.type || '';
      const name = file.name || '';
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const acceptedMimes = sourceFormatObj?.mimeTypes || [];
      const acceptedExts = (sourceFormatObj?.accept || '').split(',').map((s) => s.trim().replace('.', ''));

      const mimeOk = acceptedMimes.length === 0 || acceptedMimes.includes(mime);
      const extOk = acceptedExts.length === 0 || acceptedExts.includes(ext);

      return mimeOk || extOk;
    },
    [sourceFormatObj],
  );

  const handleFilesChange = useCallback(
    (files) => {
      if (!files || files.length === 0) return;

      const accepted = [];
      let skipped = 0;

      Array.from(files).forEach((file) => {
        if (validateFile(file)) {
          const previewUrl = URL.createObjectURL(file);
          accepted.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            previewUrl,
            status: 'ready',
            error: '',
            img: null,
            meta: null,
            result: null,
          });
        } else {
          skipped += 1;
        }
      });

      if (accepted.length > 0) {
        setQueueItems((prev) => [...prev, ...accepted]);
        setPhase(PHASE.LOADED);
      }

      if (skipped > 0) {
        setError(`${skipped} file${skipped > 1 ? 's' : ''} skipped because they aren't ${sourceFormatObj?.label || ''} images.`);
      } else {
        setError('');
      }
    },
    [validateFile, sourceFormatObj],
  );

  const handleFileSelect = useCallback(
    async (file) => {
      setError('');
      if (!validateFile(file)) {
        setError(`Only ${sourceFormatObj?.label || ''} files can be added for this conversion.`);
        return;
      }

      try {
        const image = await loadImage(file);
        const meta = getImageMeta(image, file);

        setQueueItems((prev) =>
          prev.map((item) =>
            item.file === file ? { ...item, img: image, meta, status: 'ready' } : item,
          ),
        );
      } catch (err) {
        setError(err?.message || 'Could not load the image file.');
      }
    },
    [validateFile, sourceFormatObj],
  );

  const handleRemoveItem = useCallback((id) => {
    setQueueItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleClear = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const handleResetWorkspace = useCallback(() => {
    cleanup();
    setSourceFormat('image/jpeg');
    setOutputFormat('image/png');
    setQuality(85);
  }, [cleanup]);

  const handleSourceFormatChange = useCallback(
    (e) => {
      const newSource = e.target.value;
      setSourceFormat(newSource);
      setOutputFormat((prev) => {
        if (prev === newSource) {
          const nextTarget = ALL_OUTPUT_FORMATS.find((f) => f.value !== newSource);
          return nextTarget ? nextTarget.value : prev;
        }
        return prev;
      });

      setQueueItems((prev) => {
        const incompatible = prev.filter((item) => !validateFile(item.file));
        if (incompatible.length > 0) {
          setError(`Your selected files don't match the new source format. Please upload ${SOURCE_FORMATS.find((f) => f.value === newSource)?.label || ''} images.`);
        } else {
          setError('');
        }
        return prev.filter((item) => validateFile(item.file));
      });
    },
    [validateFile],
  );

  const handleTargetFormatChange = useCallback((e) => {
    setOutputFormat(e.target.value);
  }, []);

  const handleConvert = useCallback(async () => {
    const readyItems = queueItems.filter((item) => item.img && item.meta);
    if (readyItems.length === 0) return;

    if (isSameFormat) {
      setError('Choose a different output format.');
      return;
    }

    setPhase(PHASE.CONVERTING);
    setError('');
    setConvertingIndex(0);

    for (let i = 0; i < readyItems.length; i++) {
      const item = readyItems[i];
      setConvertingIndex(i);

      try {
        const output = await convertImage(item.img, {
          outputType: outputFormat,
          quality: quality / 100,
        });

        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, result: output, status: 'complete' } : qItem,
          ),
        );
      } catch (err) {
        const errMsg = err?.message || 'Failed to convert this image.';
        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, status: 'failed', error: errMsg } : qItem,
          ),
        );
      }
    }

    setPhase(PHASE.DONE);
  }, [queueItems, outputFormat, quality, isSameFormat]);

  const handleDownload = useCallback((item) => {
    if (!item.result?.blob || !item.meta) return;
    const filename = buildConvertedFilename(item.meta.name, outputFormat);
    downloadBlob(item.result.blob, filename);
  }, [outputFormat]);

  const handleDownloadAll = useCallback(async () => {
    const completedItems = queueItems.filter((item) => item.status === 'complete' && item.result);
    if (completedItems.length === 0) return;

    for (const item of completedItems) {
      const filename = buildConvertedFilename(item.meta.name, outputFormat);
      downloadBlob(item.result.blob, filename);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }, [queueItems, outputFormat]);

  const handleDownloadZip = useCallback(async () => {
    const completedItems = queueItems.filter((item) => item.status === 'complete' && item.result);
    if (completedItems.length === 0) return;

    try {
      const files = completedItems.map((item) => ({
        name: buildConvertedFilename(item.meta.name, outputFormat),
        blob: item.result.blob,
      }));
      const zipBlob = await createZipBlob(files, 'converted-images.zip');
      downloadBlob(zipBlob, 'converted-images.zip');
    } catch {
      setError('Could not create ZIP file. Please download individually.');
    }
  }, [queueItems, outputFormat]);

  /* Consume staged tool input on mount */
  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        handleFilesChange([stagedFile]);
      });
    }
  }, [handleFilesChange]);

  const completedCount = queueItems.filter((i) => i.status === 'complete').length;

  const renderEmptyState = () => (
    <div className={styles.uploadSurface}>
      <div className={styles.uploadHeader}>
        <div>
          <h2 className={styles.uploadTitle}>Convert your images</h2>
          <p className={styles.uploadDesc}>
            Select images and choose the format you want to convert to.
          </p>
        </div>
      </div>

      <div className={`${styles.uploadControls}`}>
        <div className={`control_convert ${styles.controlGroup} ${styles.sourceGroup}`}>
          <label className={styles.controlLabel} htmlFor="convert-source-empty">
            Convert from
          </label>
          <select
            id="convert-source-empty"
            className={styles.select}
            value={sourceFormat}
            onChange={handleSourceFormatChange}
          >
            {SOURCE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className={`control_convert ${styles.controlGroup}`}>
          <label className={styles.controlLabel} htmlFor="convert-target-empty">
            Convert to
          </label>
          <select
            id="convert-target-empty"
            className={styles.select}
            value={outputFormat}
            onChange={handleTargetFormatChange}
          >
            {outputFormats.map((f) => (
              <option key={f.value} value={f.value} disabled={!f.isSupported}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <MultiImageUploader
        onFilesChange={handleFilesChange}
        onFileSelect={handleFileSelect}
        accept={sourceFormatObj.accept}
        acceptedTypes={sourceFormatObj.mimeTypes}
        hint={`Upload ${sourceFormatObj.label} images only. Up to 50 MB.`}
      />

      {error && (
        <p className={styles.emptyError} role="status">
          {error}
        </p>
      )}
    </div>
  );

  const renderWorkspace = () => {
    const isConverted = phase === PHASE.DONE;

    if (isConverted) {
      return (
        <div className={`p-3 ${styles.resultsSection}`}>
          <div className={styles.resultsHeader}>
            <div>
              <h3 className={styles.resultsTitle}>
                {completedCount} of {queueItems.length} converted
              </h3>
              <p className={styles.resultsMeta}>
                Total size: {formatFileSize(totalSize)}
              </p>
            </div>
            <div className={`p-2 ${styles.resultsActions}`}>
              {completedCount > 0 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<IconDownload />}
                    onClick={handleDownloadAll}
                  >
                    Download All ({completedCount})
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<IconDownload />}
                    onClick={handleDownloadZip}
                  >
                    Download All as ZIP
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={<IconImagePlus />}
                onClick={handleResetWorkspace}
              >
                Convert Again
              </Button>
            </div>
          </div>

          <div className={styles.resultsGrid}>
            {queueItems.map((item) => (
              <div key={item.id} className={`${styles.resultCard} ${item.status === 'complete' ? styles.resultCardSuccess : ''} ${item.status === 'failed' ? styles.resultCardFailed : ''}`}>
                <div className={styles.resultThumbWrap}>
                  <img 
                    src={item.status === 'complete' && item.result ? item.result.url : item.previewUrl} 
                    alt={item.file.name} 
                    className={styles.resultThumb} 
                  />
                  {item.status === 'complete' && (
                    <div className={styles.resultOverlay}>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<IconDownload />}
                        onClick={() => handleDownload(item)}
                      >
                        Download
                      </Button>
                    </div>
                  )}
                  {item.status === 'complete' && (
                    <div className={styles.resultBadge}>Done</div>
                  )}
                  {item.status === 'failed' && (
                    <div className={`${styles.resultBadge} ${styles.resultBadgeError}`}>Failed</div>
                  )}
                </div>
                <div className={styles.resultInfo}>
                  <span className={styles.resultName} title={item.file.name}>
                    {item.file.name}
                  </span>
                  <span className={styles.resultSize}>
                    {item.meta ? formatFileSize(item.meta.size) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className={`p-3 radius-0 ${styles.topBar}`}>
          <div className={styles.topBarLeft}>
            <span className={styles.topBarIcon} aria-hidden="true">
              <IconUpload size={18} />
            </span>
            <div>
              <div className={styles.topBarTitle}>
                {queueItems.length} image{queueItems.length > 1 ? 's' : ''} selected
              </div>
              <div className={styles.topBarMeta}>
                Total size: {formatFileSize(totalSize)}
              </div>
            </div>
          </div>
          <div className={styles.topBarRight}>
            {isLossy && (
              <div className={styles.topBarQuality}>
                <div className={styles.sliderHeader}>
                  <label className={styles.controlLabel} htmlFor="convert-quality-top">Quality</label>
                  <output className={styles.qualityValue}>{quality}%</output>
                </div>
                <input
                  id="convert-quality-top"
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<IconDownload />}
              onClick={handleConvert}
              disabled={phase === PHASE.CONVERTING || isSameFormat}
            >
              {phase === PHASE.CONVERTING ? 'Converting…' : 'Convert Images'}
            </Button>
            <input
              id="add-more-input"
              type="file"
              accept={sourceFormatObj.accept}
              multiple
              onChange={(e) => {
                const selected = e.target.files;
                if (selected && selected.length > 0) {
                  handleFilesChange(selected);
                }
                e.target.value = '';
              }}
              className={styles.hiddenInput}
              tabIndex={-1}
              aria-hidden="true"
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<IconImagePlus />}
              onClick={() => document.getElementById('add-more-input')?.click()}
            >
              + Add New
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<IconTrash />}
              onClick={handleClear}
              className={styles.clearAllBtn}
            >
              Clear All
            </Button>
          </div>
        </div>

        {!hasImages && (
          <div className={`p-3 radius-0 ${styles.controlBar}`}>
            <div className={styles.controlBarLeft}>
              <div className={`control_convert ${styles.controlGroup}`}>
                <label className={styles.controlLabel} htmlFor="convert-source">
                  Convert from
                </label>
                <div className={styles.selectWrap}>
                  <span className={styles.selectIcon} aria-hidden="true">
                    <IconUpload size={16} />
                  </span>
                  <select
                    id="convert-source"
                    className={styles.select}
                    value={sourceFormat}
                    onChange={handleSourceFormatChange}
                  >
                    {SOURCE_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <span className={styles.arrowIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>

              <div className={`control_convert ${styles.controlGroup}`}>
                <label className={styles.controlLabel} htmlFor="convert-target">
                  Convert to
                </label>
                <div className={styles.selectWrap}>
                  <span className={styles.selectIcon} aria-hidden="true">
                    <IconDownload size={16} />
                  </span>
                  <select
                    id="convert-target"
                    className={styles.select}
                    value={outputFormat}
                    onChange={handleTargetFormatChange}
                  >
                    {outputFormats.map((f) => (
                      <option key={f.value} value={f.value} disabled={!f.isSupported}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isSameFormat && (
                <div className={styles.formatWarning}>Choose a different output format.</div>
              )}
            </div>
          </div>
        )}

        <div className={`p-3 ${styles.imageGrid}`}>
          {queueItems.map((item) => (
            <div key={item.id} className={styles.imageCard}>
              <div className={styles.imageThumbWrap}>
                <img src={item.previewUrl} alt={item.file.name} className={styles.imageThumb} />
                <button
                  type="button"
                  className={styles.imageRemoveBtn}
                  onClick={() => handleRemoveItem(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className={`${styles.imageStatus} ${styles[item.status]}`}>
                  {item.status === 'complete' && 'Done'}
                  {item.status === 'failed' && 'Failed'}
                  {item.status === 'ready' && convertingIndex > 0 && convertingIndex <= queueItems.indexOf(item) && 'Converting'}
                  {item.status === 'ready' && (convertingIndex === 0 || convertingIndex > queueItems.indexOf(item)) && 'Ready'}
                </div>
              </div>
              <div className={styles.imageInfo}>
                <span className={styles.imageName} title={item.file.name}>
                  {item.file.name}
                </span>
                <span className={styles.imageSize}>
                  {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <ToolPageLayout
      badge="Free · In-Browser"
      title="Convert Images Online"
      subtitle="Convert JPG, PNG, WebP, GIF and SVG images locally in your browser. Fast, free and completely private."
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      contentFullWidth
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {!hasImages ? renderEmptyState() : renderWorkspace()}
      </div>
      {!embeddedOnly && <ConvertContent />}
    </ToolPageLayout>
  );
}

export default ConvertPage;
