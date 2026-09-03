import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import ImagePreview from '@/components/ui/ImagePreview';
import { Button } from '@/components/ui/Button';
import {
  CONVERT_INPUT_TYPES,
  CONVERT_ACCEPT_STRING,
  loadImage,
  getFormatLabel,
} from '@/utils/imageProcessor';
import { analyzeImage } from '@/tools/analyzer/imageAnalyzer';
import { USE_CASES, calculateReadinessScore } from '@/tools/analyzer/imageScore';
import { getUseRecommendations } from '@/tools/analyzer/imageRecommendations';
import { setPendingToolInput } from '@/utils/toolStateBridge';

import AnalyzeContent from './AnalyzeContent';
import styles from './AnalyzePage.module.css';

/* ---------------------------------------------------------------------- */
/*  State machine phases                                                  */
/* ---------------------------------------------------------------------- */
const PHASE = {
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  LOADED: 'loaded',
  ERROR: 'error',
};

function AnalyzePage() {
  useDocumentTitle('Image Quality Analyzer — Check Size, Format & Resolution');
  const navigate = useNavigate();

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState('website');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  /* -------------------------------------------------------------------- */
  /*  Cleanup helper                                                      */
  /* -------------------------------------------------------------------- */
  const cleanup = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setAnalysis(null);
    setSelectedGoal('website');
    setShowAdvanced(false);
    setError('');
    setPhase(PHASE.IDLE);
  };

  /* -------------------------------------------------------------------- */
  /*  File selection & client-side analysis                               */
  /* -------------------------------------------------------------------- */
  const handleFileSelect = async (f) => {
    cleanup();
    setFile(f);
    setError('');
    setPhase(PHASE.ANALYZING);

    try {
      const img = await loadImage(f);
      setPreviewUrl(img.src);

      // Perform deterministic analysis
      const result = analyzeImage(f, img);
      setAnalysis(result);
      setPhase(PHASE.LOADED);
    } catch (err) {
      setError(err?.message || 'Could not analyze this image file.');
      setPhase(PHASE.ERROR);
    }
  };

  const handleClear = () => {
    cleanup();
  };

  /* -------------------------------------------------------------------- */
  /*  Computed readiness score & recommendations                          */
  /* -------------------------------------------------------------------- */
  const readiness = useMemo(() => {
    if (!analysis) return null;
    return calculateReadinessScore(analysis, selectedGoal);
  }, [analysis, selectedGoal]);

  const recommendations = useMemo(() => {
    if (!analysis) return null;
    return getUseRecommendations(analysis, selectedGoal);
  }, [analysis, selectedGoal]);

  /* -------------------------------------------------------------------- */
  /*  Action navigation with in-memory image staging                      */
  /* -------------------------------------------------------------------- */
  const handleActionNavigate = (route, goal = null) => {
    if (!file) return;
    setPendingToolInput(file, goal);
    navigate(route);
  };

  return (
    <ToolPageLayout
      badge="Technical Diagnostics"
      title="Image Quality Analyzer"
      subtitle="Inspect image dimensions, resolution, file weight, and format efficiency. Get practical, honest recommendations without automated AI guesswork."
      content={<AnalyzeContent />}
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
          Your image stays on your device. Analysis happens locally in your browser.
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
          hint="JPG, PNG, WebP, AVIF, GIF, SVG — up to 50 MB"
        />
      )}

      {/* ================================================================ */}
      {/*  ANALYZING — Progress state                                      */}
      {/* ================================================================ */}
      {phase === PHASE.ANALYZING && (
        <div className={styles.analyzingState} role="status" aria-live="polite">
          <div className={styles.spinner}>
            <span className={styles.spinnerDot} />
            <span className={styles.spinnerDot} />
            <span className={styles.spinnerDot} />
          </div>
          <p className={styles.analyzingText}>
            Measuring image dimensions, file data, and pixel channels…
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/*  ERROR — Error message & retry                                   */}
      {/* ================================================================ */}
      {phase === PHASE.ERROR && (
        <div className={styles.errorBlock} role="alert">
          <p className={styles.errorTitle}>Analysis Error</p>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.btnSecondary} onClick={handleClear}>
            Try another image
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/*  LOADED — Analysis Report Workspace                              */}
      {/* ================================================================ */}
      {phase === PHASE.LOADED && analysis && readiness && recommendations && (
        <div className={styles.analyzerWorkspace}>
          {/* Header Card: Original Image Snapshot */}
          <div className={styles.imageHeaderCard}>
            <div className={styles.imageThumbnailWrap}>
              <ImagePreview
                src={previewUrl}
                alt={analysis.file.name}
                className={styles.compactPreview}
              />
            </div>
            <div className={styles.imageDetails}>
              <div className={styles.titleRow}>
                <h2 className={styles.imageFileName} title={analysis.file.name}>
                  {analysis.file.name}
                </h2>
                <button
                  type="button"
                  className={styles.changeImageLink}
                  onClick={handleClear}
                >
                  Analyze another
                </button>
              </div>
              <div className={styles.badgeRow}>
                <span className={styles.infoPill}>
                  {getFormatLabel(analysis.file.mimeType, analysis.file.name)}
                </span>
                <span className={styles.infoPill}>
                  {analysis.dimensions.width} × {analysis.dimensions.height} px
                </span>
                <span className={styles.infoPill}>
                  {analysis.dimensions.megapixels} MP
                </span>
                <span className={styles.infoPill}>
                  {analysis.dimensions.aspectRatioLabel}
                </span>
                <span className={styles.infoPill}>
                  {analysis.file.sizeFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Use-Case Selector */}
          <section className={styles.goalSection} aria-labelledby="goal-prompt">
            <h3 id="goal-prompt" className={styles.sectionHeading}>
              What are you using this image for?
            </h3>
            <div className={styles.goalsGrid} role="radiogroup" aria-label="Use case options">
              {USE_CASES.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.goalCard} ${isSelected ? styles.goalCardActive : ''}`}
                    onClick={() => setSelectedGoal(goal.id)}
                  >
                    <span className={styles.goalLabel}>{goal.label}</span>
                    <span className={styles.goalDesc}>{goal.desc}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Practical Readiness Estimate & Takeaway */}
          <div className={styles.readinessCard}>
            <div className={styles.readinessHeader}>
              <div className={styles.scoreCircle}>
                <strong className={styles.scoreNumber}>{readiness.score}</strong>
                <span className={styles.scoreMax}>/ 100</span>
              </div>
              <div className={styles.readinessTitleWrap}>
                <span className={styles.readinessLabel}>{readiness.label}</span>
                <h4 className={styles.readinessGoal}>
                  For {USE_CASES.find((g) => g.id === selectedGoal)?.label}
                </h4>
                <p className={styles.readinessSummary}>
                  {recommendations.summary}
                </p>
              </div>
            </div>

            {/* Breakdown Factors */}
            <div className={styles.factorsList}>
              {readiness.factors.map((factor, idx) => (
                <div key={idx} className={styles.factorItem}>
                  <span
                    className={`${styles.factorIcon} ${
                      factor.status === 'pass'
                        ? styles.factorPass
                        : factor.status === 'caution'
                          ? styles.factorCaution
                          : styles.factorFail
                    }`}
                    aria-hidden="true"
                  >
                    {factor.status === 'pass' ? '✓' : factor.status === 'caution' ? '⚠' : '✕'}
                  </span>
                  <div className={styles.factorContent}>
                    <strong className={styles.factorName}>{factor.name}</strong>
                    <span className={styles.factorMsg}>{factor.message}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Contextual Action recommendation */}
            {recommendations.primaryAction && (
              <div className={styles.primaryActionBox}>
                <div className={styles.actionTextWrap}>
                  <strong className={styles.actionPrompt}>Recommended next step:</strong>
                  <span className={styles.actionReason}>{recommendations.primaryAction.reason}</span>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() =>
                    handleActionNavigate(
                      recommendations.primaryAction.route,
                      recommendations.primaryAction.goal,
                    )
                  }
                >
                  {recommendations.primaryAction.label} →
                </Button>
              </div>
            )}
          </div>

          {/* Section 3: Technical Metrics Report Grid */}
          <div className={styles.metricsGrid}>
            {/* Dimensions Metric Card */}
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                <h4 className={styles.metricTitle}>Dimensions & Resolution</h4>
              </div>
              <dl className={styles.metricDl}>
                <div className={styles.metricRow}>
                  <dt>Width × Height</dt>
                  <dd>
                    {analysis.dimensions.width} × {analysis.dimensions.height} px
                  </dd>
                </div>
                <div className={styles.metricRow}>
                  <dt>Total Megapixels</dt>
                  <dd>{analysis.dimensions.megapixels} MP</dd>
                </div>
                <div className={styles.metricRow}>
                  <dt>Aspect Ratio</dt>
                  <dd>{analysis.dimensions.aspectRatioLabel}</dd>
                </div>
              </dl>
            </div>

            {/* File & Compression Card */}
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <h4 className={styles.metricTitle}>File & Compression</h4>
              </div>
              <dl className={styles.metricDl}>
                <div className={styles.metricRow}>
                  <dt>Format Type</dt>
                  <dd>{getFormatLabel(analysis.file.type, analysis.file.name)}</dd>
                </div>
                <div className={styles.metricRow}>
                  <dt>File Size</dt>
                  <dd>{analysis.file.sizeFormatted}</dd>
                </div>
                <div className={styles.metricRow}>
                  <dt>Compression Profile</dt>
                  <dd>{analysis.characteristics.compressionType}</dd>
                </div>
              </dl>
            </div>

            {/* Color & Transparency Card */}
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor" opacity="0.3" />
                </svg>
                <h4 className={styles.metricTitle}>Color & Transparency</h4>
              </div>
              <dl className={styles.metricDl}>
                <div className={styles.metricRow}>
                  <dt>Alpha Transparency</dt>
                  <dd>
                    {analysis.characteristics.hasAlphaChannel
                      ? 'Detected (Alpha Channel present)'
                      : 'None (Opaque background)'}
                  </dd>
                </div>
                <div className={styles.metricRow}>
                  <dt>Color Space / Format</dt>
                  <dd>{analysis.characteristics.isLossless ? 'Lossless RGB(A)' : 'Standard RGB'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section 4: Deep Technical Data details */}
          <div className={styles.advancedToggleRow}>
            <Button
              variant="text"
              onClick={() => setShowAdvanced((prev) => !prev)}
              aria-expanded={showAdvanced}
            >
              {showAdvanced ? 'Hide technical encoding metrics' : 'Show technical encoding metrics'}
            </Button>
          </div>

          {showAdvanced && (
            <div className={styles.advancedPanel}>
              <p className={styles.advancedText}>
                <strong>Pixel density / Megapixels:</strong> {analysis.dimensions.megapixels} MP (
                {analysis.dimensions.totalPixels.toLocaleString()} total pixels)
              </p>
              <p className={styles.advancedText}>
                <strong>Encoding profile:</strong>{' '}
                {analysis.characteristics.isLossless
                  ? 'Lossless compression matrix'
                  : 'Lossy discrete cosine transform (DCT) or block-based encoding'}
              </p>
              <p className={styles.advancedText}>
                <strong>Aspect ratio decimal:</strong> {analysis.dimensions.aspectRatioDecimal} (
                {analysis.dimensions.width} / {analysis.dimensions.height})
              </p>
            </div>
          )}

          {/* Section 5: Direct Action Links to existing tools */}
          <div className={styles.toolActionsSection}>
            <h4 className={styles.actionsHeading}>Available actions with this image:</h4>
            <div className={styles.toolActionButtons}>
              {recommendations.secondaryActions.map((act, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  onClick={() => handleActionNavigate(act.route)}
                >
                  {act.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}

export default AnalyzePage;
