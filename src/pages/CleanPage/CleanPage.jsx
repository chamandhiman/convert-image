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
import { IconShield } from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  CONVERT_INPUT_TYPES,
  CONVERT_ACCEPT_STRING,
  getSupportedOutputFormats,
  loadImage,
  getImageMeta,
  downloadBlob,
} from '@/utils/imageProcessor';
import { inspectImageMetadata } from '@/tools/privacy/metadataInspector';
import { cleanImageMetadata, buildCleanFilename } from '@/tools/privacy/metadataCleaner';

import { consumePendingToolInput } from '@/utils/toolStateBridge';
import CleanContent from './CleanContent';
import styles from './CleanPage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  CLEANING: 'cleaning',
  DONE: 'done',
  ERROR: 'error',
};

function CleanPage({ embedded }) {
  useDocumentTitle('Remove Image Metadata Online — Clean Photos Privately');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [queueItems, setQueueItems] = useState([]);
  const [outputFormat, setOutputFormat] = useState('keep');
  const [quality, setQuality] = useState(90);
  const [error, setError] = useState('');
  const [processingIndex, setProcessingIndex] = useState(0);

  const outputFormats = useMemo(() => getSupportedOutputFormats(), []);
  const hasImages = queueItems.length > 0;
  const completedCount = queueItems.filter((i) => i.status === 'complete').length;

  const totalSize = useMemo(
    () => queueItems.reduce((sum, item) => sum + (item.file?.size || 0), 0),
    [queueItems],
  );

  const getResolvedType = useCallback(
    (meta) => {
      if (outputFormat === 'keep' && meta) {
        if (meta.isSvg) return 'image/png';
        const match = outputFormats.find((f) => f.value === meta.type && f.isSupported);
        if (match) return match.value;
        return 'image/jpeg';
      }
      return outputFormat;
    },
    [outputFormat, outputFormats],
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
    setOutputFormat('keep');
    setQuality(90);
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
        inspection: null,
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
        const findings = await inspectImageMetadata(file);

        setQueueItems((prev) =>
          prev.map((item) =>
            item.file === file
              ? { ...item, img: image, meta, inspection: findings, status: 'ready' }
              : item,
          ),
        );
      } catch (err) {
        setError(err?.message || 'Could not load or inspect the image file.');
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

  const handleStartAgain = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const selectedFormatObj = outputFormats.find((f) => f.value === outputFormat);
  const isLossy = selectedFormatObj ? selectedFormatObj.lossy : outputFormat !== 'image/png';

  const handleClean = useCallback(async () => {
    const readyItems = queueItems.filter((item) => item.img && item.meta);
    if (readyItems.length === 0) return;

    if (outputFormat === 'image/avif') {
      const avif = outputFormats.find((f) => f.value === 'image/avif');
      if (!avif?.isSupported) {
        setError("AVIF output isn't supported by this browser. Please select JPG, PNG, or WebP.");
        return;
      }
    }

    setPhase(PHASE.CLEANING);
    setError('');
    setProcessingIndex(0);

    for (let i = 0; i < readyItems.length; i++) {
      const item = readyItems[i];
      setProcessingIndex(i + 1);

      try {
        const resolvedType = getResolvedType(item.meta);
        const cleanResult = await cleanImageMetadata(item.img, {
          outputType: resolvedType,
          quality: quality / 100,
        });

        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, result: cleanResult, status: 'complete' } : qItem,
          ),
        );
      } catch (err) {
        const errMsg = err?.message || 'Failed to create a clean image copy.';
        setQueueItems((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, status: 'failed', error: errMsg } : qItem,
          ),
        );
      }
    }

    setPhase(PHASE.DONE);
  }, [queueItems, outputFormat, quality, outputFormats, getResolvedType]);

  const handleDownload = useCallback(
    (item) => {
      if (!item.result?.blob || !item.meta) return;
      const resolvedType = getResolvedType(item.meta);
      const filename = buildCleanFilename(item.meta.name, resolvedType);
      downloadBlob(item.result.blob, filename);
    },
    [getResolvedType],
  );

  const handleDownloadAll = useCallback(async () => {
    const completedItems = queueItems.filter((item) => item.status === 'complete' && item.result);
    if (completedItems.length === 0) return;

    for (const item of completedItems) {
      const resolvedType = getResolvedType(item.meta);
      const filename = buildCleanFilename(item.meta.name, resolvedType);
      downloadBlob(item.result.blob, filename);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }, [queueItems, getResolvedType]);

  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        handleFilesChange([stagedFile]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToolPageLayout
      badge="Privacy & Security"
      title="Image Privacy Cleaner"
      subtitle="Remove hidden EXIF, GPS location tags, and device information from your photos before sharing. 100% private in your browser."
      content={<CleanContent />}
      contentFullWidth
      embedded={embedded}
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {!hasImages ? (
          <div className={styles.uploadSurface}>
            <div className={styles.uploadHeader}>
              <div>
                <h2 className={styles.uploadTitle}>Clean your images</h2>
                <p className={styles.uploadDesc}>
                  Select images and we&apos;ll remove all hidden metadata including GPS location, camera details, and timestamps.
                </p>
              </div>
            </div>

            <MultiImageUploader
              onFilesChange={handleFilesChange}
              onFileSelect={handleFileSelect}
              accept={CONVERT_ACCEPT_STRING}
              acceptedTypes={CONVERT_INPUT_TYPES}
              hint="JPG, PNG, WebP, AVIF, GIF — up to 50 MB"
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
                startAgainLabel="Clean Another"
                downloadZipLabel="Download All"
              />
            ) : (
              <ToolTopBar
                itemCount={queueItems.length}
                totalSize={totalSize}
                onAddMore={handleFilesChange}
                onClearAll={handleClear}
                addMoreAccept={CONVERT_ACCEPT_STRING}
              />
            )}

            {phase !== PHASE.DONE && (
              <div className={styles.controlBar}>
                <div className={styles.controlBarLeft}>
                  <div className={styles.controlGroup}>
                    <label className={styles.controlLabel} htmlFor="clean-output-format">
                      Save clean copy as
                    </label>
                    <select
                      id="clean-output-format"
                      className={styles.select}
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                    >
                      <option value="keep">Keep format</option>
                      {outputFormats.map((f) => (
                        <option key={f.value} value={f.value} disabled={!f.isSupported}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.controlGroup}>
                    <div className={styles.sliderHeader}>
                      <label className={styles.controlLabel} htmlFor="clean-quality">
                        Image Quality
                      </label>
                      <output className={styles.qualityValue}>{quality}%</output>
                    </div>
                    <input
                      id="clean-quality"
                      type="range"
                      min="60"
                      max="100"
                      step="1"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className={styles.slider}
                      disabled={!isLossy}
                    />
                    {!isLossy && (
                      <p className={styles.controlHint}>
                        PNG output is strictly lossless.
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.controlBarRight}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<IconShield />}
                    onClick={handleClean}
                    disabled={phase === PHASE.CLEANING}
                  >
                    {phase === PHASE.CLEANING ? 'Cleaning…' : 'Remove Private Data'}
                  </Button>
                </div>
              </div>
            )}

            {phase === PHASE.CLEANING && (
              <ToolProcessingState
                label="Creating a privacy-clean image copy"
                current={processingIndex}
                total={queueItems.length}
              />
            )}

            {phase === PHASE.ERROR && error && (
              <div className={styles.errorBlock} role="alert">
                <p className={styles.errorTitle}>Cleaning Error</p>
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
                    previewUrl={
                      item.status === 'complete' && item.result ? item.result.url : item.previewUrl
                    }
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

export default CleanPage;
