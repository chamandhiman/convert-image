import { useState, useEffect, useCallback } from 'react';
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

  // Sync to query param if it changes dynamically
  useEffect(() => {
    const toParam = searchParams.get('to')?.toLowerCase();
    if (toParam === 'png') setOutputFormat('image/png');
    else if (toParam === 'jpg' || toParam === 'jpeg') setOutputFormat('image/jpeg');
    else if (toParam === 'webp') setOutputFormat('image/webp');
    else if (toParam === 'gif') setOutputFormat('image/gif');
    else if (toParam === 'pdf') setOutputFormat('application/pdf');
  }, [searchParams]);

  // Clean up ObjectURLs on unmount
  useEffect(() => {
    return () => {
      queueItems.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      });
    };
  }, [queueItems]);

  // Add files to workspace queue
  const handleAddFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    setError('');

    const items = await Promise.all(
      Array.from(files)
        .filter(
          (file) =>
            file.type.startsWith('image/') ||
            file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg|heic|tiff)$/i),
        )
        .map(async (file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          const item = {
            id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            previewUrl,
            status: 'ready',
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
            // Fallback
          }
          return item;
        }),
    );

    if (items.length > 0) {
      setQueueItems((prev) => [...prev, ...items]);
      setPhase(PHASE.LOADED);
      trackImageUpload({ tool: 'convert_image', count: items.length });
    }
  }, []);

  // Consume staged file from toolStateBridge (e.g. from homepage hero or other tool)
  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        handleAddFiles([stagedFile]);
      });
    }
  }, [handleAddFiles]);

  // Remove single item
  const handleRemoveItem = useCallback((id) => {
    setQueueItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        if (target.result?.url) URL.revokeObjectURL(target.result.url);
      }
      const updated = prev.filter((i) => i.id !== id);
      if (updated.length === 0) {
        setPhase(PHASE.IDLE);
      }
      return updated;
    });
  }, []);

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

  // Execute image conversions sequentially
  const handleConvert = useCallback(async () => {
    if (queueItems.length === 0) return;

    setPhase(PHASE.CONVERTING);
    setError('');

    const updatedQueue = [...queueItems];

    for (let i = 0; i < updatedQueue.length; i++) {
      setConvertingIndex(i);
      const item = updatedQueue[i];

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
      count: updatedQueue.length,
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
            onOutputFormatChange={setOutputFormat}
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
