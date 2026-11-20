import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import {
  loadImage,
  getImageMeta,
  convertImage,
  buildConvertedFilename,
  getFormatLabel,
} from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';
import { trackImageUpload, trackImageConvert } from '@/utils/analytics';
import {
  OUTPUT_FORMAT_CONFIG,
  checkFileCompatibility,
} from './convertValidation';

import ConvertWorkspace from './ConvertWorkspace';
import ConvertResults from './ConvertResults';
import ConvertContent from './ConvertContent';
import styles from './ConvertPage.module.css';

const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  CONVERTING: 'converting',
  DONE: 'done',
};

export function ConvertPage({
  embedded,
  embeddedOnly,
  title = 'Convert Image',
  subtitle = 'Change your image to JPG, PNG, WEBP, GIF, PDF and more formats.',
  documentTitle = 'Convert Image Online — Fast & Free Multi-Format Converter',
  _initialSourceFormat = 'image/jpeg',
  initialOutputFormat = 'image/jpeg',
  contentComponent: ContentComponent = ConvertContent,
}) {
  useDocumentTitle(documentTitle);
  const [searchParams] = useSearchParams();

  const [outputFormat, setOutputFormat] = useState(() => {
    const toParam = searchParams.get('to')?.toLowerCase();
    if (toParam === 'png') return 'image/png';
    if (toParam === 'jpg' || toParam === 'jpeg') return 'image/jpeg';
    if (toParam === 'webp') return 'image/webp';
    if (toParam === 'gif') return 'image/gif';
    if (toParam === 'pdf') return 'application/pdf';
    return initialOutputFormat;
  });

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [queueItems, setQueueItems] = useState([]);
  const [quality, setQuality] = useState(90);
  const [keepOriginalSize, setKeepOriginalSize] = useState(true);
  const [removeMetadata, setRemoveMetadata] = useState(false);
  const [sameFormatAll, setSameFormatAll] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [error, setError] = useState('');
  const [convertingIndex, setConvertingIndex] = useState(0);

  // Revalidate files whenever output format changes
  const handleOutputFormatChange = useCallback((newFormat) => {
    setOutputFormat(newFormat);

    const targetConfig =
      OUTPUT_FORMAT_CONFIG[newFormat] || OUTPUT_FORMAT_CONFIG['image/jpeg'];
    const targetLabel = targetConfig.label;

    setQueueItems((prevItems) => {
      if (prevItems.length === 0) return prevItems;

      let validCount = 0;
      let incompatibleCount = 0;

      const updated = prevItems.map((item) => {
        const check = checkFileCompatibility(item.file, newFormat);
        if (check.compatible) {
          validCount++;
          return {
            ...item,
            status: 'ready',
            incompatibleReason: '',
          };
        } else {
          incompatibleCount++;
          return {
            ...item,
            status: 'incompatible',
            incompatibleReason: check.reason,
          };
        }
      });

      if (validCount === 0) {
        setError(
          `All uploaded files are already ${targetLabel}. Please choose another output format or upload different files.`,
        );
      } else if (incompatibleCount > 0) {
        setError(
          `${incompatibleCount} file${incompatibleCount > 1 ? 's were' : ' was'} skipped because ${
            incompatibleCount > 1 ? 'they are' : 'it is'
          } already ${targetLabel}. Ready files can still be converted.`,
        );
      } else {
        setError('');
      }

      return updated;
    });
  }, []);

  const lastParamRef = useRef(searchParams.get('to'));

  // Sync to query param if it changes dynamically
  useEffect(() => {
    const toParam = searchParams.get('to')?.toLowerCase();
    if (toParam !== lastParamRef.current) {
      lastParamRef.current = toParam;
      let newMime = null;
      if (toParam === 'png') newMime = 'image/png';
      else if (toParam === 'jpg' || toParam === 'jpeg') newMime = 'image/jpeg';
      else if (toParam === 'webp') newMime = 'image/webp';
      else if (toParam === 'gif') newMime = 'image/gif';
      else if (toParam === 'pdf') newMime = 'application/pdf';

      if (newMime && newMime !== outputFormat) {
        queueMicrotask(() => {
          handleOutputFormatChange(newMime);
        });
      }
    }
  }, [searchParams, outputFormat, handleOutputFormatChange]);

  // Clean up ObjectURLs on unmount
  useEffect(() => {
    return () => {
      queueItems.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      });
    };
  }, [queueItems]);

  // Add files to workspace queue with dynamic format validation
  const handleAddFiles = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;

      const rawList = Array.from(files);
      const fileList = rawList.filter(
        (file) =>
          file.type.startsWith('image/') ||
          file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg|heic|tiff|pdf)$/i),
      );

      if (fileList.length === 0) return;

      const targetConfig =
        OUTPUT_FORMAT_CONFIG[outputFormat] || OUTPUT_FORMAT_CONFIG['image/jpeg'];
      const targetLabel = targetConfig.label;

      let newIncompatibleCount = 0;
      let singleIncompatibleMessage = '';

      const newItems = await Promise.all(
        fileList.map(async (file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          const check = checkFileCompatibility(file, outputFormat);

          if (!check.compatible) {
            newIncompatibleCount++;
            singleIncompatibleMessage = check.errorMessage;
          }

          const item = {
            id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            previewUrl,
            status: check.compatible ? 'ready' : 'incompatible',
            incompatibleReason: check.compatible ? '' : check.reason,
            img: null,
            meta: null,
            result: null,
            error: '',
          };

          try {
            const img = await loadImage(file);
            item.img = img;
            item.meta = getImageMeta(img, file);
          } catch {
            item.meta = getImageMeta(null, file);
          }
          return item;
        }),
      );

      setQueueItems((prev) => {
        const combined = [...prev, ...newItems];
        const validTotal = combined.filter((i) => i.status === 'ready').length;
        const totalIncompatible = combined.filter((i) => i.status === 'incompatible').length;

        if (validTotal === 0) {
          if (prev.length === 0 && fileList.length === 1 && singleIncompatibleMessage) {
            setError(singleIncompatibleMessage);
          } else if (
            prev.length === 0 &&
            newIncompatibleCount === fileList.length &&
            singleIncompatibleMessage
          ) {
            setError(singleIncompatibleMessage);
          } else {
            setError(
              `All uploaded files are already ${targetLabel}. Please choose another output format or upload different files.`,
            );
          }
        } else if (totalIncompatible > 0) {
          setError(
            `${totalIncompatible} file${totalIncompatible > 1 ? 's were' : ' was'} skipped because ${
              totalIncompatible > 1 ? 'they are' : 'it is'
            } already ${targetLabel}. Ready files can still be converted.`,
          );
        } else {
          setError('');
        }

        return combined;
      });

      setPhase(PHASE.LOADED);
      trackImageUpload({ tool: 'convert_image', count: newItems.length });
    },
    [outputFormat],
  );

  // Consume staged file from toolStateBridge (e.g. from homepage hero or other tool)
  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        handleAddFiles([stagedFile]);
      });
    }
  }, [handleAddFiles]);

  // Remove single item and update queue validation state
  const handleRemoveItem = useCallback(
    (id) => {
      setQueueItems((prev) => {
        const target = prev.find((i) => i.id === id);
        if (target) {
          if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
          if (target.result?.url) URL.revokeObjectURL(target.result.url);
        }
        const updated = prev.filter((i) => i.id !== id);
        if (updated.length === 0) {
          setPhase(PHASE.IDLE);
          setError('');
        } else {
          const targetConfig =
            OUTPUT_FORMAT_CONFIG[outputFormat] || OUTPUT_FORMAT_CONFIG['image/jpeg'];
          const validTotal = updated.filter((i) => i.status === 'ready').length;
          const totalIncompatible = updated.filter((i) => i.status === 'incompatible').length;

          if (validTotal === 0) {
            setError(
              `All uploaded files are already ${targetConfig.label}. Please choose another output format or upload different files.`,
            );
          } else if (totalIncompatible > 0) {
            setError(
              `${totalIncompatible} file${totalIncompatible > 1 ? 's were' : ' was'} skipped because ${
                totalIncompatible > 1 ? 'they are' : 'it is'
              } already ${targetConfig.label}. Ready files can still be converted.`,
            );
          } else {
            setError('');
          }
        }
        return updated;
      });
    },
    [outputFormat],
  );

  // Clear all items / reset
  const handleClearAll = useCallback(() => {
    queueItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    });
    setQueueItems([]);
    setPhase(PHASE.IDLE);
    setConvertingIndex(0);
    setError('');
  }, [queueItems]);

  // Execute image conversions sequentially for ready items only
  const handleConvert = useCallback(async () => {
    const readyItems = queueItems.filter((item) => item.status === 'ready');
    if (readyItems.length === 0) return;

    setPhase(PHASE.CONVERTING);
    setError('');

    const updatedQueue = [...queueItems];
    let convertedCount = 0;

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (item.status !== 'ready') {
        continue;
      }
      setConvertingIndex(convertedCount);

      try {
        let img = item.img;
        if (!img) {
          img = await loadImage(item.file);
          updatedQueue[i].img = img;
          updatedQueue[i].meta = getImageMeta(img, item.file);
        }

        const output = await convertImage(img, {
          outputType: outputFormat,
          quality: quality / 100,
          backgroundColor: backgroundColor || '#ffffff',
        });

        const targetFormatLabel = getFormatLabel(outputFormat, '');
        const filename = buildConvertedFilename(item.file.name, outputFormat);

        updatedQueue[i] = {
          ...item,
          status: 'success',
          result: {
            blob: output.blob,
            url: output.url,
            filename,
            width: output.width || item.meta?.width || img.naturalWidth,
            height: output.height || item.meta?.height || img.naturalHeight,
            targetFormat: targetFormatLabel,
          },
        };
        convertedCount++;
      } catch (err) {
        updatedQueue[i] = {
          ...item,
          status: 'failed',
          error: err?.message || 'Conversion failed',
        };
      }
    }

    setQueueItems(updatedQueue);
    setPhase(PHASE.DONE);
    trackImageConvert({
      tool: 'convert_image',
      outputFormat,
      count: convertedCount,
    });
  }, [queueItems, outputFormat, quality, backgroundColor]);

  return (
    <ToolPageLayout
      badge="Free · In-Browser"
      title={title}
      subtitle={subtitle}
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      contentFullWidth
      content={!embeddedOnly && ContentComponent ? <ContentComponent /> : null}
      showHero={false}
    >
      <div id="tool" className={styles.converterSurface}>
        {phase === PHASE.DONE ? (
          <ConvertResults
            queueItems={queueItems}
            onReset={handleClearAll}
            onRemoveItem={handleRemoveItem}
            title={title}
            subtitle={subtitle}
          />
        ) : (
          <ConvertWorkspace
            queueItems={queueItems}
            onAddFiles={handleAddFiles}
            onRemoveItem={handleRemoveItem}
            onClearAll={handleClearAll}
            outputFormat={outputFormat}
            onOutputFormatChange={handleOutputFormatChange}
            quality={quality}
            onQualityChange={setQuality}
            keepOriginalSize={keepOriginalSize}
            onKeepOriginalSizeChange={setKeepOriginalSize}
            removeMetadata={removeMetadata}
            onRemoveMetadataChange={setRemoveMetadata}
            sameFormatAll={sameFormatAll}
            onSameFormatAllChange={setSameFormatAll}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            onConvert={handleConvert}
            isConverting={phase === PHASE.CONVERTING}
            convertingIndex={convertingIndex}
            error={error}
            title={title}
            subtitle={subtitle}
          />
        )}
      </div>
    </ToolPageLayout>
  );
}

export default ConvertPage;
