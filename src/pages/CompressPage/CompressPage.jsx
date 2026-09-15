import { useState, useEffect, useCallback, useMemo } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import MultiImageUploader from '@/components/ui/MultiImageUploader';
import {
  ToolTopBar,
  ToolImageGrid,
  ToolImageCard,
  ToolResultGrid,
  ToolResultCard,
  ToolProcessingState,
  ToolResultToolbar,
} from '@/components/ui/tool-ui';
import { Button } from '@/components/ui/Button';
import { IconCompress } from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  OUTPUT_FORMATS,
  ACCEPT_STRING,
  ACCEPTED_INPUT_TYPES,
  loadImage,
  getImageMeta,
  compressImage,
  buildOutputFilename,
  downloadBlob,
} from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import CompressContent from './CompressContent';
import styles from './CompressPage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  COMPRESSING: 'compressing',
  DONE: 'done',
  ERROR: 'error',
};

function CompressPage({ embedded, embeddedOnly }) {
  useDocumentTitle('Compress Images Online — Fast & Private');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [queueItems, setQueueItems] = useState([]);
  const [quality, setQuality] = useState(80);
  const [outputFormat, setOutputFormat] = useState(OUTPUT_FORMATS[0].value);
  const [error, setError] = useState('');
  const [processingIndex, setProcessingIndex] = useState(0);

  const hasImages = queueItems.length > 0;
  const completedCount = queueItems.filter((i) => i.status === 'complete').length;

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
    setProcessingIndex(0);
  }, [queueItems]);

  const handleFilesChange = useCallback((files) => {
    if (!files || files.length === 0) return;

    const accepted = [];
    Array.from(files).forEach((file) => {
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
    });

    setQueueItems((prev) => [...prev, ...accepted]);
    setPhase(PHASE.LOADED);
    setError('');
  }, []);

  const handleFileSelect = useCallback(
    async (file) => {
      setError('');
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
    [],
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

  const handleCompress = useCallback(async () => {
    const readyItems = queueItems.filter((item) => item.img && item.meta);
    if (readyItems.length === 0) return;

    setPhase(PHASE.COMPRESSING);
    setError('');
    setProcessingIndex(0);

    for (let i = 0; i < readyItems.length; i++) {
      const item = readyItems[i];
      setProcessingIndex(i + 1);

      try {
        const output = await compressImage(item.img, {
          outputType: outputFormat,
          quality: quality / 100,
        });

        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, result: output, status: 'complete' } : qItem,
          ),
        );
      } catch (err) {
        const errMsg = err?.message || 'Failed to compress this image.';
        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, status: 'failed', error: errMsg } : qItem,
          ),
        );
      }
    }

    setPhase(PHASE.DONE);
  }, [queueItems, outputFormat, quality]);

  const handleDownload = useCallback((item) => {
    if (!item.result?.blob || !item.meta) return;
    const filename = buildOutputFilename(item.meta.name, outputFormat, quality / 100);
    downloadBlob(item.result.blob, filename);
  }, [outputFormat, quality]);

  const handleDownloadAll = useCallback(async () => {
    const completedItems = queueItems.filter((item) => item.status === 'complete' && item.result);
    if (completedItems.length === 0) return;

    for (const item of completedItems) {
      const filename = buildOutputFilename(item.meta.name, outputFormat, quality / 100);
      downloadBlob(item.result.blob, filename);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }, [queueItems, outputFormat, quality]);

  const handleStartAgain = useCallback(() => {
    cleanup();
    setQuality(80);
    setOutputFormat(OUTPUT_FORMATS[0].value);
  }, [cleanup]);

  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        handleFilesChange([stagedFile]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLossy = outputFormat !== 'image/png';

  return (
    <ToolPageLayout
      badge="Free · No upload"
      title="Compress Image"
      subtitle="Reduce image file size without uploading. Everything runs locally in your browser."
      content={<CompressContent />}
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {!hasImages ? (
          <div className={styles.uploadSurface}>
            <div className={styles.uploadHeader}>
              <div>
                <h2 className={styles.uploadTitle}>Compress your images</h2>
                <p className={styles.uploadDesc}>
                  Select images and reduce their file size while keeping quality.
                </p>
              </div>
            </div>

            <MultiImageUploader
              onFilesChange={handleFilesChange}
              onFileSelect={handleFileSelect}
              accept={ACCEPT_STRING}
              acceptedTypes={ACCEPTED_INPUT_TYPES}
              hint="JPG, PNG, WebP, AVIF — up to 50 MB"
            />

            {error && (
              <p className={styles.emptyError} role="status">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className={styles.workspaceSurface}>
            {phase === PHASE.DONE ? (
              <ToolResultToolbar
                completedCount={completedCount}
                totalCount={queueItems.length}
                totalSize={formatFileSize(totalSize)}
                onDownloadAll={handleDownloadAll}
                onDownloadZip={handleDownloadAll}
                onStartAgain={handleStartAgain}
                startAgainLabel="Compress Another"
                downloadZipLabel="Download All"
              />
            ) : (
              <ToolTopBar
                itemCount={queueItems.length}
                totalSize={totalSize}
                onAddMore={handleFilesChange}
                onClearAll={handleClear}
                addMoreAccept={ACCEPT_STRING}
              />
            )}

            {phase !== PHASE.DONE && (
              <div className={styles.controlBar}>
                <div className={styles.controlBarLeft}>
                  <div className={styles.controlGroup}>
                    <label className={styles.controlLabel} htmlFor="output-format">
                      Output format
                    </label>
                    <select
                      id="output-format"
                      className={styles.select}
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                    >
                      {OUTPUT_FORMATS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.controlGroup}>
                    <div className={styles.sliderHeader}>
                      <label className={styles.controlLabel} htmlFor="quality-slider">
                        Quality
                      </label>
                      <output className={styles.qualityValue}>{quality}%</output>
                    </div>
                    <input
                      id="quality-slider"
                      type="range"
                      min="10"
                      max="100"
                      step="1"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className={styles.slider}
                      disabled={!isLossy}
                    />
                    {!isLossy && (
                      <p className={styles.controlHint}>
                        PNG is lossless — quality setting does not apply.
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.controlBarRight}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<IconCompress />}
                    onClick={handleCompress}
                    disabled={phase === PHASE.COMPRESSING}
                  >
                    {phase === PHASE.COMPRESSING ? 'Compressing…' : 'Compress Images'}
                  </Button>
                </div>
              </div>
            )}

            {phase === PHASE.COMPRESSING && (
              <ToolProcessingState label="Compressing your images" current={processingIndex} total={queueItems.length} />
            )}

            {phase === PHASE.ERROR && error && (
              <div className={styles.errorBlock} role="alert">
                <p className={styles.errorTitle}>Compression Error</p>
                <p className={styles.errorText}>{error}</p>
                <button type="button" className={styles.btnSecondary} onClick={handleClear}>
                  Try another image
                </button>
              </div>
            )}

            {phase !== PHASE.DONE && (
              <ToolImageGrid>
                {queueItems.map((item) => (
                  <ToolImageCard
                    key={item.id}
                    previewUrl={item.previewUrl}
                    fileName={item.file.name}
                    fileSize={`${(item.file.size / (1024 * 1024)).toFixed(1)} MB`}
                    status={item.status}
                    error={item.error}
                    onRemove={() => handleRemoveItem(item.id)}
                  />
                ))}
              </ToolImageGrid>
            )}

            {phase === PHASE.DONE && (
              <ToolResultGrid>
                {queueItems.map((item) => (
                  <ToolResultCard
                    key={item.id}
                    previewUrl={item.status === 'complete' && item.result ? item.result.url : item.previewUrl}
                    fileName={item.file.name}
                    fileSize={item.meta ? formatFileSize(item.meta.size) : ''}
                    status={item.status}
                    error={item.error}
                    onDownload={() => handleDownload(item)}
                  />
                ))}
              </ToolResultGrid>
            )}
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}

export default CompressPage;
