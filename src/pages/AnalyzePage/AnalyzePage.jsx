import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import MultiImageUploader from '@/components/ui/MultiImageUploader';
import { Button } from '@/components/ui/Button';
import {
  ToolTopBar,
  ToolImageGrid,
  ToolImageCard,
  ToolResultToolbar,
  ToolProcessingState,
} from '@/components/ui/tool-ui';
import {
  CONVERT_INPUT_TYPES,
  CONVERT_ACCEPT_STRING,
  loadImage,
  getFormatLabel,
} from '@/utils/imageProcessor';
import { analyzeImage } from '@/tools/analyzer/imageAnalyzer';
import { USE_CASES, calculateReadinessScore } from '@/tools/analyzer/imageScore';
import { getUseRecommendations } from '@/tools/analyzer/imageRecommendations';
import { setPendingToolInput, consumePendingToolInput } from '@/utils/toolStateBridge';
import { formatFileSize } from '@/utils/formatFileSize';

import AnalyzeContent from './AnalyzeContent';
import styles from './AnalyzePage.module.css';

const PHASE = {
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  LOADED: 'loaded',
  ERROR: 'error',
};

function AnalyzePage({ embedded }) {
  useDocumentTitle('Image Quality Analyzer — Check Size, Format & Resolution');
  const navigate = useNavigate();

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [queueItems, setQueueItems] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState('website');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const activeItem = queueItems.find((item) => item.id === activeItemId) || null;
  const activeAnalysis = activeItem?.analysis || null;

  const hasImages = queueItems.length > 0;
  const isAnalyzed = activeItem?.analysis != null;

  const totalSize = useMemo(
    () => queueItems.reduce((sum, item) => sum + (item.file?.size || 0), 0),
    [queueItems],
  );

  const analyzedCount = useMemo(
    () => queueItems.filter((item) => item.analysis).length,
    [queueItems],
  );

  const readiness = useMemo(() => {
    if (!activeAnalysis) return null;
    return calculateReadinessScore(activeAnalysis, selectedGoal);
  }, [activeAnalysis, selectedGoal]);

  const recommendations = useMemo(() => {
    if (!activeAnalysis) return null;
    return getUseRecommendations(activeAnalysis, selectedGoal);
  }, [activeAnalysis, selectedGoal]);

  const cleanup = useCallback(() => {
    queueItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setQueueItems([]);
    setActiveItemId(null);
    setError('');
    setPhase(PHASE.IDLE);
    setSelectedGoal('website');
    setShowAdvanced(false);
  }, [queueItems]);

  const handleStartAgain = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const handleFilesChange = useCallback((files) => {
    if (!files || files.length === 0) return;

    const newItems = [];
    Array.from(files).forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl,
        status: 'ready',
        error: '',
        analysis: null,
      });
    });

    setQueueItems((prev) => [...prev, ...newItems]);
    setPhase(PHASE.LOADED);
    setActiveItemId(newItems[0].id);
  }, []);

  const handleFileSelect = useCallback(
    async (file) => {
      setError('');
      setPhase(PHASE.ANALYZING);

      try {
        const img = await loadImage(file);
        const result = analyzeImage(file, img);

        setQueueItems((prev) =>
          prev.map((item) =>
            item.file === file ? { ...item, analysis: result } : item,
          ),
        );
        setPhase(PHASE.LOADED);
      } catch (err) {
        setError(err?.message || 'Could not analyze this image file.');
        setPhase(PHASE.ERROR);
      }
    },
    [],
  );

  const handleCardClick = useCallback(
    (item) => {
      setActiveItemId(item.id);
      if (!item.analysis) {
        handleFileSelect(item.file);
      }
    },
    [handleFileSelect],
  );

  const handleRemoveItem = useCallback((id) => {
    setQueueItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleClear = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const handleActionNavigate = (route, goal = null) => {
    if (!activeItem?.file) return;
    setPendingToolInput(activeItem.file, goal);
    navigate(route);
  };

  useEffect(() => {
    const { file: stagedFile, goal: stagedGoal } = consumePendingToolInput();
    if (stagedFile) {
      Promise.resolve().then(() => {
        if (stagedGoal) setSelectedGoal(stagedGoal);
        handleFilesChange([stagedFile]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!queueItems.find((item) => item.id === activeItemId)) {
      setActiveItemId(queueItems.length > 0 ? queueItems[0].id : null);
    }
  }, [queueItems, activeItemId]);

  return (
    <ToolPageLayout
      badge="Technical Diagnostics"
      title="Image Quality Analyzer"
      subtitle="Inspect image dimensions, resolution, file weight, and format efficiency. Get practical, honest recommendations without automated AI guesswork."
      content={<AnalyzeContent />}
      embedded={embedded}
      contentFullWidth
      showHero={false}
    >
      <div className={styles.converterSurface}>
        {!hasImages ? (
          <div className={styles.uploadSurface}>
            <div className={styles.uploadHeader}>
              <div>
                <h2 className={styles.uploadTitle}>Analyze your images</h2>
                <p className={styles.uploadDesc}>
                  Upload an image to inspect its dimensions, file size, format efficiency, and get practical recommendations.
                </p>
              </div>
            </div>

          <MultiImageUploader
            onFilesChange={handleFilesChange}
            onFileSelect={handleFileSelect}
            accept={CONVERT_ACCEPT_STRING}
            acceptedTypes={CONVERT_INPUT_TYPES}
            hint="JPG, PNG, WebP, AVIF, GIF, SVG — up to 50 MB"
          />

          {error && (
            <p className={styles.emptyError} role="status">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className={styles.workspaceSurface}>
          {isAnalyzed ? (
            <ToolResultToolbar
              completedCount={analyzedCount}
              totalCount={queueItems.length}
              totalSize={formatFileSize(totalSize)}
              onStartAgain={handleStartAgain}
              startAgainLabel="Analyze Another"
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

          {phase === PHASE.ANALYZING && (
            <ToolProcessingState label="Analyzing your image" current={1} total={1} />
          )}

          {phase === PHASE.ERROR && error && (
            <div className={styles.errorBlock} role="alert">
              <p className={styles.errorTitle}>Analysis Error</p>
              <p className={styles.errorText}>{error}</p>
              <button type="button" className={styles.btnSecondary} onClick={handleClear}>
                Try another image
              </button>
            </div>
          )}

          {!isAnalyzed && (
            <div className={styles.controlBar}>
              <div className={styles.controlBarLeft}>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel} htmlFor="use-case">
                    What are you using this image for?
                  </label>
                  <select
                    id="use-case"
                    className={styles.select}
                    value={selectedGoal}
                    onChange={(e) => setSelectedGoal(e.target.value)}
                  >
                    {USE_CASES.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.controlBarRight}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => activeItem && handleFileSelect(activeItem.file)}
                  disabled={!activeItem || phase === PHASE.ANALYZING}
                >
                  {phase === PHASE.ANALYZING ? 'Analyzing…' : 'Analyze Image'}
                </Button>
              </div>
            </div>
          )}

          {isAnalyzed && activeAnalysis && readiness && recommendations && (
            <div className={styles.analysisPanels}>
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

              <div className={styles.metricsGrid}>
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
                        {activeAnalysis.dimensions.width} × {activeAnalysis.dimensions.height} px
                      </dd>
                    </div>
                    <div className={styles.metricRow}>
                      <dt>Total Megapixels</dt>
                      <dd>{activeAnalysis.dimensions.megapixels} MP</dd>
                    </div>
                    <div className={styles.metricRow}>
                      <dt>Aspect Ratio</dt>
                      <dd>{activeAnalysis.dimensions.aspectRatioLabel}</dd>
                    </div>
                  </dl>
                </div>

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
                      <dd>{getFormatLabel(activeAnalysis.file.type, activeAnalysis.file.name)}</dd>
                    </div>
                    <div className={styles.metricRow}>
                      <dt>File Size</dt>
                      <dd>{activeAnalysis.file.sizeFormatted}</dd>
                    </div>
                    <div className={styles.metricRow}>
                      <dt>Compression Profile</dt>
                      <dd>{activeAnalysis.characteristics.compressionType}</dd>
                    </div>
                  </dl>
                </div>

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
                        {activeAnalysis.characteristics.hasAlphaChannel
                          ? 'Detected (Alpha Channel present)'
                          : 'None (Opaque background)'}
                      </dd>
                    </div>
                    <div className={styles.metricRow}>
                      <dt>Color Space / Format</dt>
                      <dd>{activeAnalysis.characteristics.isLossless ? 'Lossless RGB(A)' : 'Standard RGB'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

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
                    <strong>Pixel density / Megapixels:</strong> {activeAnalysis.dimensions.megapixels} MP (
                    {activeAnalysis.dimensions.totalPixels.toLocaleString()} total pixels)
                  </p>
                  <p className={styles.advancedText}>
                    <strong>Encoding profile:</strong>{' '}
                    {activeAnalysis.characteristics.isLossless
                      ? 'Lossless compression matrix'
                      : 'Lossy discrete cosine transform (DCT) or block-based encoding'}
                  </p>
                  <p className={styles.advancedText}>
                    <strong>Aspect ratio decimal:</strong> {activeAnalysis.dimensions.aspectRatioDecimal} (
                    {activeAnalysis.dimensions.width} / {activeAnalysis.dimensions.height})
                  </p>
                </div>
              )}

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

          <ToolImageGrid>
            {queueItems.map((item) => (
              <ToolImageCard
                key={item.id}
                previewUrl={item.previewUrl}
                fileName={item.file.name}
                fileSize={formatFileSize(item.file.size)}
                status={item.analysis ? 'complete' : 'ready'}
                error={item.error}
                onRemove={() => handleRemoveItem(item.id)}
                onClick={() => handleCardClick(item)}
              />
            ))}
          </ToolImageGrid>
        </div>
      )}
      </div>
    </ToolPageLayout>
  );
}

export default AnalyzePage;
