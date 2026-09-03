import { useState, useEffect } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import ImagePreview from '@/components/ui/ImagePreview';
import { Button } from '@/components/ui/Button';
import { IconCompress, IconDownload, IconImagePlus } from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  OUTPUT_FORMATS,
  loadImage,
  getImageMeta,
  compressImage,
  buildOutputFilename,
  downloadBlob,
} from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';

import CompressContent from './CompressContent';
import styles from './CompressPage.module.css';

/* ---------------------------------------------------------------------- */
/*  State machine phases                                                  */
/* ---------------------------------------------------------------------- */
const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  COMPRESSING: 'compressing',
  DONE: 'done',
  ERROR: 'error',
};

/* ---------------------------------------------------------------------- */
/*  Page component                                                        */
/* ---------------------------------------------------------------------- */
function CompressPage() {
  useDocumentTitle('Compress Images Online — Fast & Private');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  /* Compression controls */
  const [quality, setQuality] = useState(80);
  const [outputFormat, setOutputFormat] = useState(OUTPUT_FORMATS[0].value);

  /* Result */
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  /* -------------------------------------------------------------------- */
  /*  Clear / reset                                                       */
  /* -------------------------------------------------------------------- */
  const cleanup = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setImg(null);
    setOriginalMeta(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    setPhase(PHASE.IDLE);
  };

  /* -------------------------------------------------------------------- */
  /*  File selection                                                       */
  /* -------------------------------------------------------------------- */
  const handleFileSelect = async (f) => {
    cleanup();
    setFile(f);
    setError('');

    try {
      const image = await loadImage(f);
      const meta = getImageMeta(image, f);
      setImg(image);
      setOriginalMeta(meta);
      setPreviewUrl(image.src);
      setPhase(PHASE.LOADED);
    } catch (err) {
      setError(err.message);
      setPhase(PHASE.ERROR);
    }
  };

  const handleClear = () => {
    cleanup();
  };

  /* Consume staged tool input on mount if navigated from Analyzer */
  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        handleFileSelect(stagedFile);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------- */
  /*  Compress                                                            */
  /* -------------------------------------------------------------------- */
  const handleCompress = async () => {
    if (!img) return;

    setPhase(PHASE.COMPRESSING);
    setError('');

    try {
      const output = await compressImage(img, {
        outputType: outputFormat,
        quality: quality / 100,
      });
      setResult(output);
      setPhase(PHASE.DONE);
    } catch (err) {
      setError(err.message);
      setPhase(PHASE.ERROR);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Download                                                            */
  /* -------------------------------------------------------------------- */
  const handleDownload = () => {
    if (!result?.blob || !originalMeta) return;
    const filename = buildOutputFilename(originalMeta.name, outputFormat, quality / 100);
    downloadBlob(result.blob, filename);
  };

  /* -------------------------------------------------------------------- */
  /*  Render helpers                                                      */
  /* -------------------------------------------------------------------- */
  const reduction =
    result && originalMeta
      ? Math.round((1 - result.blob.size / originalMeta.size) * 100)
      : 0;

  const isLossy = outputFormat !== 'image/png';

  return (
    <ToolPageLayout
      badge="Free · No upload"
      title="Compress Image"
      subtitle="Reduce image file size without uploading. Everything runs locally in your browser."
      content={<CompressContent />}
    >
      {/* ================================================================ */}
      {/*  IDLE — file uploader                                            */}
      {/* ================================================================ */}
      {phase === PHASE.IDLE && (
        <FileUploader onFileSelect={handleFileSelect} file={file} onClear={handleClear} />
      )}

      {/* ================================================================ */}
      {/*  ERROR — show message + retry                                    */}
      {/* ================================================================ */}
      {phase === PHASE.ERROR && (
        <div className={styles.errorBlock} role="alert">
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.btnSecondary} onClick={handleClear}>
            Try another image
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/*  LOADED — controls                                               */}
      {/* ================================================================ */}
      {phase === PHASE.LOADED && originalMeta && (
        <div className={styles.workspace}>
          {/* Original info */}
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Original</h2>
            <div className={styles.metaGrid}>
              <FileUploader file={file} onClear={handleClear} onFileSelect={handleFileSelect} />
              <dl className={styles.metaList}>
                <div className={styles.metaItem}>
                  <dt>Dimensions</dt>
                  <dd>
                    {originalMeta.width} × {originalMeta.height} px
                  </dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>File size</dt>
                  <dd>{formatFileSize(originalMeta.size)}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Format</dt>
                  <dd>{originalMeta.type}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Compression Settings</h2>

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
                <output className={styles.qualityValue} htmlFor="quality-slider">
                  {quality}%
                </output>
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

            <Button
              variant="primary"
              size="lg"
              icon={<IconCompress />}
              onClick={handleCompress}
              aria-label="Compress image"
            >
              Compress Image
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  COMPRESSING — spinner                                           */}
      {/* ================================================================ */}
      {phase === PHASE.COMPRESSING && (
        <div className={styles.spinner} role="status">
          <span className={styles.spinnerDot} />
          <span className={styles.spinnerDot} />
          <span className={styles.spinnerDot} />
          <span className="visually-hidden">Compressing image…</span>
        </div>
      )}

      {/* ================================================================ */}
      {/*  DONE — results                                                  */}
      {/* ================================================================ */}
      {phase === PHASE.DONE && result && originalMeta && (
        <div className={styles.results}>
          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Original</span>
              <span className={styles.statValue}>{formatFileSize(originalMeta.size)}</span>
            </div>
            <div className={styles.statArrow} aria-hidden="true">
              →
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Compressed</span>
              <span className={styles.statValue}>{formatFileSize(result.blob.size)}</span>
            </div>
            <div
              className={`${styles.statCard} ${reduction > 0 ? styles.statCardSuccess : styles.statCardWarn}`}
            >
              <span className={styles.statLabel}>Reduction</span>
              <span className={styles.statValue}>
                {reduction > 0 ? `${reduction}%` : 'No reduction'}
              </span>
            </div>
          </div>

          {/* Meta table */}
          <dl className={styles.resultMeta}>
            <div className={styles.metaItem}>
              <dt>Dimensions</dt>
              <dd>
                {result.width} × {result.height} px
              </dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Output format</dt>
              <dd>{OUTPUT_FORMATS.find((f) => f.value === outputFormat)?.label ?? outputFormat}</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>Quality</dt>
              <dd>{isLossy ? `${quality}%` : 'Lossless'}</dd>
            </div>
          </dl>

          {/* Preview */}
          <ImagePreview
            src={result.url}
            alt="Compressed image preview"
            caption={`${formatFileSize(result.blob.size)} · ${result.width}×${result.height}`}
            className={styles.resultPreview}
          />

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              variant="secondary"
              icon={<IconImagePlus />}
              onClick={handleClear}
              aria-label="Compress another image"
            >
              Compress Another
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon={<IconDownload />}
              onClick={handleDownload}
              aria-label="Download compressed image"
            >
              Download Image
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}

export default CompressPage;
