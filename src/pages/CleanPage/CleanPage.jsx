import { useState, useMemo } from 'react';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import ImagePreview from '@/components/ui/ImagePreview';
import { Button } from '@/components/ui/Button';
import { IconShield, IconDownload, IconImagePlus } from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  CONVERT_INPUT_TYPES,
  CONVERT_ACCEPT_STRING,
  getSupportedOutputFormats,
  getFormatLabel,
  loadImage,
  getImageMeta,
  downloadBlob,
} from '@/utils/imageProcessor';
import { inspectImageMetadata } from '@/tools/privacy/metadataInspector';
import { cleanImageMetadata, buildCleanFilename } from '@/tools/privacy/metadataCleaner';

import CleanContent from './CleanContent';
import styles from './CleanPage.module.css';

/* ---------------------------------------------------------------------- */
/*  State machine phases                                                  */
/* ---------------------------------------------------------------------- */
const PHASE = {
  IDLE: 'idle',
  LOADED: 'loaded',
  CLEANING: 'cleaning',
  DONE: 'done',
  ERROR: 'error',
};

function CleanPage() {
  useDocumentTitle('Remove Image Metadata Online — Clean Photos Privately');

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  /* Inspection findings for the uploaded file */
  const [inspection, setInspection] = useState(null);

  /* Output format & quality settings */
  const outputFormats = useMemo(() => getSupportedOutputFormats(), []);
  const [outputFormat, setOutputFormat] = useState('keep');
  const [quality, setQuality] = useState(90);

  /* Cleaning result */
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  /* -------------------------------------------------------------------- */
  /*  Cleanup helper                                                      */
  /* -------------------------------------------------------------------- */
  const cleanup = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setImg(null);
    setOriginalMeta(null);
    setPreviewUrl('');
    setInspection(null);
    setOutputFormat('keep');
    setQuality(90);
    setResult(null);
    setError('');
    setPhase(PHASE.IDLE);
  };

  /* -------------------------------------------------------------------- */
  /*  File selection & inspection                                         */
  /* -------------------------------------------------------------------- */
  const handleFileSelect = async (f) => {
    cleanup();
    setFile(f);
    setError('');

    try {
      // 1. Load image for preview & canvas processing
      const image = await loadImage(f);
      const meta = getImageMeta(image, f);
      setImg(image);
      setOriginalMeta(meta);
      setPreviewUrl(image.src);

      // 2. Perform deep client-side metadata inspection
      const findings = await inspectImageMetadata(f);
      setInspection(findings);

      setPhase(PHASE.LOADED);
    } catch (err) {
      setError(err?.message || 'Could not load or inspect the image file.');
      setPhase(PHASE.ERROR);
    }
  };

  const handleClear = () => {
    cleanup();
  };

  /* -------------------------------------------------------------------- */
  /*  Resolved output MIME type                                           */
  /* -------------------------------------------------------------------- */
  const resolvedOutputType = useMemo(() => {
    if (outputFormat === 'keep' && originalMeta) {
      if (originalMeta.isSvg) return 'image/png';
      const match = outputFormats.find((f) => f.value === originalMeta.type && f.isSupported);
      if (match) return match.value;
      return 'image/jpeg';
    }
    return outputFormat;
  }, [outputFormat, originalMeta, outputFormats]);

  const selectedFormatObj = outputFormats.find((f) => f.value === resolvedOutputType);
  const isLossy = selectedFormatObj ? selectedFormatObj.lossy : resolvedOutputType !== 'image/png';

  /* -------------------------------------------------------------------- */
  /*  Remove Private Data action                                          */
  /* -------------------------------------------------------------------- */
  const handleClean = async () => {
    if (!img || !originalMeta) return;

    // Verify AVIF support if requested
    if (resolvedOutputType === 'image/avif') {
      const avif = outputFormats.find((f) => f.value === 'image/avif');
      if (!avif?.isSupported) {
        setError("AVIF output isn't supported by this browser. Please select JPG, PNG, or WebP.");
        return;
      }
    }

    setPhase(PHASE.CLEANING);
    setError('');

    try {
      const cleanResult = await cleanImageMetadata(img, {
        outputType: resolvedOutputType,
        quality: quality / 100,
      });

      setResult(cleanResult);
      setPhase(PHASE.DONE);
    } catch (err) {
      setError(err?.message || 'Failed to create a clean image copy.');
      setPhase(PHASE.ERROR);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Download action                                                     */
  /* -------------------------------------------------------------------- */
  const handleDownload = () => {
    if (!result?.blob || !originalMeta) return;
    const filename = buildCleanFilename(originalMeta.name, resolvedOutputType);
    downloadBlob(result.blob, filename);
  };

  return (
    <ToolPageLayout
      badge="Privacy & Security"
      title="Image Privacy Cleaner"
      subtitle="Remove hidden EXIF, GPS location tags, and device information from your photos before sharing. 100% private in your browser."
      content={<CleanContent />}
    >
      {/* ================================================================ */}
      {/*  Privacy banner                                                  */}
      {/* ================================================================ */}
      <div className={styles.privacyBanner} role="note">
        <svg
          className={styles.privacyIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>
          Your image never leaves your device. Processing happens locally in your browser.
        </span>
      </div>

      {/* ================================================================ */}
      {/*  IDLE — File Uploader                                            */}
      {/* ================================================================ */}
      {phase === PHASE.IDLE && (
        <FileUploader
          onFileSelect={handleFileSelect}
          file={file}
          onClear={handleClear}
          accept={CONVERT_ACCEPT_STRING}
          acceptedTypes={CONVERT_INPUT_TYPES}
          hint="JPG, PNG, WebP, AVIF, GIF — up to 50 MB"
        />
      )}

      {/* ================================================================ */}
      {/*  ERROR — Error message & Retry                                   */}
      {/* ================================================================ */}
      {phase === PHASE.ERROR && (
        <div className={styles.errorBlock} role="alert">
          <p className={styles.errorTitle}>Error</p>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.btnSecondary} onClick={handleClear}>
            Try another image
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/*  LOADED — Inspection & Cleaning Workspace                        */}
      {/* ================================================================ */}
      {phase === PHASE.LOADED && originalMeta && inspection && (
        <div className={styles.cleanerWorkspace}>
          {/* Simple Privacy Explanation */}
          <div className={styles.explanationBox}>
            <h3 className={styles.explanationTitle}>
              Images can contain information that isn't visible in the picture itself.
            </h3>
            <p className={styles.explanationSub}>
              We'll create a new image copy locally in your browser without original metadata headers.
            </p>
          </div>

          <div className={styles.workspaceGrid}>
            {/* Left Column: Image Overview & Settings */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Original Image</h3>
                <button
                  type="button"
                  className={styles.replaceBtn}
                  onClick={handleClear}
                >
                  Change image
                </button>
              </div>

              <div className={styles.previewBox}>
                <ImagePreview
                  src={previewUrl}
                  alt={originalMeta.name}
                  className={styles.sourcePreview}
                />
              </div>

              <dl className={styles.metaList}>
                <div className={styles.metaItem}>
                  <dt>File name</dt>
                  <dd className={styles.truncateText} title={originalMeta.name}>
                    {originalMeta.name}
                  </dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Format</dt>
                  <dd>
                    <span className={styles.formatBadge}>
                      {getFormatLabel(originalMeta.type, originalMeta.name)}
                    </span>
                  </dd>
                </div>
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
              </dl>

              {/* Output Settings */}
              <div className={styles.settingsSection}>
                <h4 className={styles.settingsHeading}>Output Settings</h4>

                <div className={styles.controlField}>
                  <label htmlFor="clean-output-format" className={styles.fieldLabel}>
                    Save clean copy as
                  </label>
                  <select
                    id="clean-output-format"
                    className={styles.selectInput}
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  >
                    <option value="keep">
                      Keep format ({getFormatLabel(originalMeta.type, originalMeta.name)})
                    </option>
                    {outputFormats.map((f) => (
                      <option key={f.value} value={f.value} disabled={!f.isSupported}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isLossy && (
                  <div className={styles.controlField}>
                    <div className={styles.sliderHeader}>
                      <label htmlFor="clean-quality" className={styles.fieldLabel}>
                        Image Quality
                      </label>
                      <span className={styles.qualityNum}>{quality}%</span>
                    </div>
                    <input
                      id="clean-quality"
                      type="range"
                      min="60"
                      max="100"
                      step="1"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className={styles.rangeInput}
                    />
                    <span className={styles.fieldHint}>
                      90% preserves near-lossless clarity while purging all metadata.
                    </span>
                  </div>
                )}

                {!isLossy && (
                  <p className={styles.losslessHint}>
                    PNG output is strictly lossless.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Metadata Inspection Findings */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Privacy Inspection</h3>
                <span
                  className={`${styles.findingsSummaryBadge} ${
                    inspection.hasMetadata ? styles.badgeWarning : styles.badgeClean
                  }`}
                >
                  {inspection.hasMetadata ? 'Metadata Detected' : 'No EXIF Detected'}
                </span>
              </div>

              {/* Categories list */}
              <div className={styles.categoryList}>
                {/* 1. Location / GPS */}
                <div className={styles.categoryItem}>
                  <div className={styles.categoryTop}>
                    <div className={styles.categoryHeader}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className={styles.categoryName}>Location & GPS</span>
                    </div>
                    <span
                      className={`${styles.statusBadge} ${
                        inspection.categories.gps.status === 'detected'
                          ? styles.statusDetected
                          : styles.statusNotDetected
                      }`}
                    >
                      {inspection.categories.gps.status === 'detected' ? 'Detected' : 'Not detected'}
                    </span>
                  </div>
                  {inspection.categories.gps.details.length > 0 ? (
                    <ul className={styles.detailsList}>
                      {inspection.categories.gps.details.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.categoryEmptyText}>
                      No GPS coordinates or geographical tags found in this file.
                    </p>
                  )}
                </div>

                {/* 2. Camera & Device */}
                <div className={styles.categoryItem}>
                  <div className={styles.categoryTop}>
                    <div className={styles.categoryHeader}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span className={styles.categoryName}>Camera & Device</span>
                    </div>
                    <span
                      className={`${styles.statusBadge} ${
                        inspection.categories.camera.status === 'detected'
                          ? styles.statusDetected
                          : styles.statusNotDetected
                      }`}
                    >
                      {inspection.categories.camera.status === 'detected' ? 'Detected' : 'Not detected'}
                    </span>
                  </div>
                  {inspection.categories.camera.details.length > 0 ? (
                    <ul className={styles.detailsList}>
                      {inspection.categories.camera.details.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.categoryEmptyText}>
                      No camera make, model, or lens identifiers detected.
                    </p>
                  )}
                </div>

                {/* 3. Date & Time */}
                <div className={styles.categoryItem}>
                  <div className={styles.categoryTop}>
                    <div className={styles.categoryHeader}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className={styles.categoryName}>Date & Time</span>
                    </div>
                    <span
                      className={`${styles.statusBadge} ${
                        inspection.categories.dateTime.status === 'detected'
                          ? styles.statusDetected
                          : styles.statusNotDetected
                      }`}
                    >
                      {inspection.categories.dateTime.status === 'detected' ? 'Detected' : 'Not detected'}
                    </span>
                  </div>
                  {inspection.categories.dateTime.details.length > 0 ? (
                    <ul className={styles.detailsList}>
                      {inspection.categories.dateTime.details.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.categoryEmptyText}>
                      No embedded camera capture timestamps detected.
                    </p>
                  )}
                </div>

                {/* 4. Software & Author */}
                <div className={styles.categoryItem}>
                  <div className={styles.categoryTop}>
                    <div className={styles.categoryHeader}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className={styles.categoryName}>Software & Author</span>
                    </div>
                    <span
                      className={`${styles.statusBadge} ${
                        inspection.categories.software.status === 'detected'
                          ? styles.statusDetected
                          : styles.statusNotDetected
                      }`}
                    >
                      {inspection.categories.software.status === 'detected' ? 'Detected' : 'Not detected'}
                    </span>
                  </div>
                  {inspection.categories.software.details.length > 0 ? (
                    <ul className={styles.detailsList}>
                      {inspection.categories.software.details.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.categoryEmptyText}>
                      No software signatures, creator tags, or copyright notes detected.
                    </p>
                  )}
                </div>
              </div>

              {/* Main Action Button */}
              <div className={styles.actionWrap}>
                <Button
                  variant="primary"
                  size="lg"
                  icon={<IconShield />}
                  onClick={handleClean}
                  aria-label="Remove private data from image"
                >
                  Remove Private Data
                </Button>
                <p className={styles.actionDisclaimer}>
                  Creates a new image copy without metadata preserved by the browser's image encoding process.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  CLEANING — Progress indicator                                   */}
      {/* ================================================================ */}
      {phase === PHASE.CLEANING && (
        <div className={styles.cleaningState} role="status" aria-live="polite">
          <div className={styles.spinner}>
            <span className={styles.spinnerDot} />
            <span className={styles.spinnerDot} />
            <span className={styles.spinnerDot} />
          </div>
          <p className={styles.cleaningText}>
            Creating a privacy-clean image copy in your browser…
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/*  DONE — Clean Copy Result                                        */}
      {/* ================================================================ */}
      {phase === PHASE.DONE && result && originalMeta && (
        <div className={styles.resultsWrapper} aria-label="Privacy cleaner results">
          {/* Result Banner */}
          <div className={styles.resultBanner}>
            <div className={styles.resultHeader}>
              <div className={styles.checkIconWrap} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className={styles.resultTitle}>Clean copy created</h3>
                <p className={styles.resultSubtitle}>
                  {result.verificationStatement}
                </p>
              </div>
            </div>

            {/* Verification confirmation tag */}
            <div className={styles.verifiedTag}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Verified: 0 private metadata tags found in clean copy</span>
            </div>
          </div>

          {/* Comparison Grid */}
          <div className={styles.comparisonGrid}>
            {/* Before Card */}
            <div className={styles.comparisonCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>Original</span>
                <h3 className={styles.cardTitle}>With Metadata</h3>
              </div>
              <ImagePreview
                src={previewUrl}
                alt={`Original: ${originalMeta.name}`}
                className={styles.comparisonImg}
              />
              <dl className={styles.cardMetaList}>
                <div className={styles.cardMetaItem}>
                  <dt>Privacy Status</dt>
                  <dd className={styles.warnStatus}>Contains Exif / GPS Tags</dd>
                </div>
                <div className={styles.cardMetaItem}>
                  <dt>File size</dt>
                  <dd>{formatFileSize(originalMeta.size)}</dd>
                </div>
              </dl>
            </div>

            {/* After Card */}
            <div className={styles.comparisonCard}>
              <div className={styles.cardHeader}>
                <span className={`${styles.cardBadge} ${styles.cardBadgeActive}`}>Cleaned</span>
                <h3 className={styles.cardTitle}>Metadata Stripped</h3>
              </div>
              <ImagePreview
                src={result.url}
                alt={`Cleaned: ${buildCleanFilename(originalMeta.name, outputFormat)}`}
                className={styles.comparisonImg}
              />
              <dl className={styles.cardMetaList}>
                <div className={styles.cardMetaItem}>
                  <dt>Privacy Status</dt>
                  <dd className={styles.successStatus}>100% Private (No Exif)</dd>
                </div>
                <div className={styles.cardMetaItem}>
                  <dt>File size</dt>
                  <dd className={styles.cleanSize}>
                    {formatFileSize(result.blob.size)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionsRow}>
            <Button
              variant="secondary"
              icon={<IconImagePlus />}
              onClick={handleClear}
              aria-label="Clean another image"
            >
              Clean Another Image
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon={<IconDownload />}
              onClick={handleDownload}
              aria-label="Download clean image copy"
            >
              Download Clean Image
            </Button>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}

export default CleanPage;
