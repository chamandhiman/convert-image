import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Upload,
  Lock,
  Unlock,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import { formatFileSize } from '@/utils/formatFileSize';
import {
  resizeImage,
  buildResizedFilename,
  downloadBlob,
  MAX_CANVAS_DIMENSION,
  MAX_CANVAS_PIXELS,
  ACCEPT_STRING,
  ACCEPTED_INPUT_TYPES,
} from '@/utils/imageProcessor';
import { consumePendingToolInput } from '@/utils/toolStateBridge';
import { trackImageUpload, trackImageConvert, trackImageDownload } from '@/utils/analytics';
import { calculateEstimatedSize } from './resizeHelpers';
import ResizeContent from './ResizeContent';
import styles from './ResizePage.module.css';

export function ResizePage({ embedded, embeddedOnly }) {
  useDocumentTitle('Resize Image Online — Simple & Free');

  // File and original image state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgElement, setImgElement] = useState(null);
  const [origWidth, setOrigWidth] = useState(0);
  const [origHeight, setOrigHeight] = useState(0);
  const [origSize, setOrigSize] = useState(0);

  // Resize controls state
  const [targetWidth, setTargetWidth] = useState('');
  const [targetHeight, setTargetHeight] = useState('');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // Processing & result state
  const [isResizing, setIsResizing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Clean up object URLs on reset or unmount
  const cleanupUrls = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [previewUrl, result]);

  useEffect(() => {
    return () => {
      cleanupUrls();
    };
  }, [cleanupUrls]);

  // Load and initialize an uploaded image file
  const handleLoadFile = useCallback((selectedFile) => {
    if (!selectedFile) return;

    // Validate image format
    const isValidType =
      ACCEPTED_INPUT_TYPES.includes(selectedFile.type) ||
      /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico)$/i.test(selectedFile.name);

    if (!isValidType) {
      setError('Please select a valid image file (JPG, PNG, WebP, SVG, GIF, AVIF).');
      return;
    }

    // Clean up previous URLs
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);

    const objectUrl = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setOrigSize(selectedFile.size);
    setPreviewUrl(objectUrl);
    setResult(null);
    setError('');

    // Load Image element to read native dimensions
    const img = new Image();
    img.onload = () => {
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      setImgElement(img);
      setOrigWidth(naturalW);
      setOrigHeight(naturalH);
      setTargetWidth(naturalW);
      setTargetHeight(naturalH);
      setLockAspectRatio(true);

      trackImageUpload({ tool: 'resize_image', format: selectedFile.type });
    };
    img.onerror = () => {
      setError('Could not decode image. The file may be corrupted.');
    };
    img.src = objectUrl;
  }, [previewUrl, result]);

  // Consume staged file if bridged from another tool
  useEffect(() => {
    const { file: stagedFile } = consumePendingToolInput();
    if (stagedFile) {
      handleLoadFile(stagedFile);
    }
  }, [handleLoadFile]);

  // Toggle Aspect Ratio Lock
  const toggleLock = () => {
    setLockAspectRatio((prevLock) => {
      const nextLock = !prevLock;
      // If re-enabling lock and we have valid numbers, sync height to match width
      if (nextLock && origWidth > 0 && origHeight > 0) {
        const currentW = parseInt(targetWidth, 10);
        if (!isNaN(currentW) && currentW > 0) {
          const ratio = origWidth / origHeight;
          const syncedH = Math.max(1, Math.round(currentW / ratio));
          setTargetHeight(syncedH);
        }
      }
      return nextLock;
    });
  };

  // Handle Width Input Change
  const handleWidthChange = (e) => {
    const val = e.target.value;
    setTargetWidth(val);
    setResult(null); // Invalidate previous result when dimensions change

    const num = parseInt(val, 10);
    if (lockAspectRatio && origWidth > 0 && origHeight > 0 && !isNaN(num) && num > 0) {
      const ratio = origWidth / origHeight;
      const syncedH = Math.max(1, Math.round(num / ratio));
      setTargetHeight(syncedH);
    }
  };

  // Handle Height Input Change
  const handleHeightChange = (e) => {
    const val = e.target.value;
    setTargetHeight(val);
    setResult(null); // Invalidate previous result when dimensions change

    const num = parseInt(val, 10);
    if (lockAspectRatio && origWidth > 0 && origHeight > 0 && !isNaN(num) && num > 0) {
      const ratio = origWidth / origHeight;
      const syncedW = Math.max(1, Math.round(num * ratio));
      setTargetWidth(syncedW);
    }
  };

  // Calculate dynamic estimated output file size
  const estimatedBytes = useMemo(() => {
    const w = parseInt(targetWidth, 10);
    const h = parseInt(targetHeight, 10);
    if (!origSize || !origWidth || !origHeight || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return null;
    }

    return calculateEstimatedSize({
      originalSize: origSize,
      origWidth,
      origHeight,
      newWidth: w,
      newHeight: h,
      origType: file?.type || 'image/jpeg',
    });
  }, [origSize, origWidth, origHeight, targetWidth, targetHeight, file]);

  // Execute Resizing
  const handleResize = async () => {
    if (!imgElement || !file) {
      setError('Please upload an image first.');
      return;
    }

    const w = parseInt(targetWidth, 10);
    const h = parseInt(targetHeight, 10);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      setError('Please enter valid positive width and height dimensions.');
      return;
    }

    if (w > MAX_CANVAS_DIMENSION || h > MAX_CANVAS_DIMENSION) {
      setError(`Maximum supported dimension is ${MAX_CANVAS_DIMENSION.toLocaleString()} px.`);
      return;
    }

    if (w * h > MAX_CANVAS_PIXELS) {
      setError('Total image area exceeds the safe browser limit of 100 megapixels.');
      return;
    }

    setError('');
    setIsResizing(true);

    try {
      // Preserve original format (convert SVGs to PNG for raster scaling)
      const outputType = file.type === 'image/svg+xml' ? 'image/png' : (file.type || 'image/jpeg');

      const resized = await resizeImage(imgElement, {
        width: w,
        height: h,
        outputType,
        quality: 0.92,
      });

      // Clean up previous result URL if any
      if (result?.url) URL.revokeObjectURL(result.url);

      setResult(resized);
      setIsResizing(false);

      trackImageConvert({
        tool: 'resize_image',
        outputFormat: resized.outputType,
        count: 1,
      });
    } catch (err) {
      setIsResizing(false);
      setError(err?.message || 'Failed to resize the image. Please try again.');
    }
  };

  // Download Resized Image
  const handleDownload = () => {
    if (!result?.blob || !file) return;

    const filename = buildResizedFilename(
      file.name,
      result.outputType,
      result.width,
      result.height
    );

    downloadBlob(result.blob, filename);

    trackImageDownload({
      tool: 'resize_image',
      outputFormat: result.outputType,
      isBatch: false,
    });
  };

  // Change / Replace Image
  const handleSelectNewImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLoadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleLoadFile(e.target.files[0]);
    }
  };

  const hasImage = Boolean(file && imgElement);
  const activeDisplayUrl = result?.url || previewUrl;

  return (
    <ToolPageLayout
      badge="Free · In-Browser"
      title="Resize Images Online"
      subtitle="Change image dimensions with instant aspect ratio lock. 100% private in your browser."
      content={<ResizeContent />}
      contentFullWidth
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      showHero={true}
    >
      <div id="tool" className={styles.toolContainer}>
        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {!hasImage ? (
          /* =========================================================
             A. IMAGE UPLOAD: Simple Drag-and-Drop Upload Area
             ========================================================= */
          <div
            className={`${styles.uploadBox} ${isDragOver ? styles.uploadBoxDragOver : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleSelectNewImage}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectNewImage();
              }
            }}
          >
            <div className={styles.uploadIconCircle}>
              <Upload size={32} className={styles.uploadIcon} />
            </div>
            <p className={styles.uploadPrompt}>Drag and drop an image here, or browse from your device</p>
            <span className={styles.uploadHint}>
              Supports JPG, PNG, WebP, SVG, GIF, AVIF up to 50 MB
            </span>
            <button
              type="button"
              className={styles.chooseFileButton}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectNewImage();
              }}
            >
              Choose Image
            </button>

            {error && (
              <div className={styles.errorAlert} role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================
             TWO-COLUMN RESIZE WORKSPACE (LEFT & RIGHT)
             ========================================================= */
          <div className={styles.workspaceGrid}>
            {/* -------------------------------------------------------
                LEFT COLUMN: Uploaded Preview & Original Info ONLY
                ------------------------------------------------------- */}
            <div className={styles.leftCard}>
              <div className={styles.cardHeaderRow}>
                <span className={styles.cardHeaderTitle}>
                  {result ? 'Resized Preview' : 'Uploaded Image'}
                </span>
                <button
                  type="button"
                  onClick={handleSelectNewImage}
                  className={styles.changeImageButton}
                  title="Upload a different image"
                >
                  <RefreshCw size={14} />
                  <span>Change Image</span>
                </button>
              </div>

              {/* Uploaded / Resized Image Preview */}
              <div className={styles.previewContainer}>
                {activeDisplayUrl && (
                  <img
                    src={activeDisplayUrl}
                    alt="Image Preview"
                    className={styles.previewImage}
                  />
                )}
              </div>

              {/* B. Original Image Information: Show ONLY Dimensions and File Size */}
              <div className={styles.originalInfoCard}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Original Dimensions:</span>
                  <span className={styles.infoValue}>
                    {origWidth} × {origHeight} px
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Original File Size:</span>
                  <span className={styles.infoValue}>
                    {formatFileSize(origSize)}
                  </span>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------
                RIGHT COLUMN: Resize Controls, Resized Info, Actions
                ------------------------------------------------------- */}
            <div className={styles.rightCard}>
              <h2 className={styles.panelTitle}>Resize Image</h2>

              {error && (
                <div className={styles.errorAlert} role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* C. Resize Controls: Width (px), Lock Icon, Height (px) */}
              <div className={styles.controlsSection}>
                <div className={styles.dimensionsRow}>
                  {/* Width Input */}
                  <div className={styles.inputGroup}>
                    <label htmlFor="resize-width" className={styles.fieldLabel}>
                      Width (px)
                    </label>
                    <div className={styles.inputBox}>
                      <input
                        id="resize-width"
                        type="number"
                        min="1"
                        max={MAX_CANVAS_DIMENSION}
                        value={targetWidth}
                        onChange={handleWidthChange}
                        placeholder="Width"
                        className={styles.numericInput}
                      />
                      <span className={styles.unitSuffix}>px</span>
                    </div>
                  </div>

                  {/* Aspect Ratio Lock Toggle */}
                  <div className={styles.lockBox}>
                    <button
                      type="button"
                      onClick={toggleLock}
                      className={
                        lockAspectRatio ? styles.lockButtonActive : styles.lockButtonInactive
                      }
                      title={
                        lockAspectRatio
                          ? 'Aspect ratio locked: maintains original proportion'
                          : 'Aspect ratio unlocked: allows independent width and height'
                      }
                      aria-label={
                        lockAspectRatio
                          ? 'Unlock aspect ratio'
                          : 'Lock aspect ratio'
                      }
                    >
                      {lockAspectRatio ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                  </div>

                  {/* Height Input */}
                  <div className={styles.inputGroup}>
                    <label htmlFor="resize-height" className={styles.fieldLabel}>
                      Height (px)
                    </label>
                    <div className={styles.inputBox}>
                      <input
                        id="resize-height"
                        type="number"
                        min="1"
                        max={MAX_CANVAS_DIMENSION}
                        value={targetHeight}
                        onChange={handleHeightChange}
                        placeholder="Height"
                        className={styles.numericInput}
                      />
                      <span className={styles.unitSuffix}>px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* D. Resized Image Information */}
              <div className={styles.resizedInfoCard}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>New Dimensions:</span>
                  <span className={styles.infoValue}>
                    {result
                      ? `${result.width} × ${result.height} px`
                      : `${targetWidth || 0} × ${targetHeight || 0} px`}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    {result ? 'Output File Size:' : 'Estimated Output Size:'}
                  </span>
                  <span
                    className={
                      result ? styles.realOutputValue : styles.estimatedOutputValue
                    }
                  >
                    {result
                      ? formatFileSize(result.blob.size)
                      : estimatedBytes
                        ? `${formatFileSize(estimatedBytes)} (Estimated)`
                        : '—'}
                  </span>
                </div>
              </div>

              {/* E. Main Action / Download Section */}
              <div className={styles.actionsSection}>
                {result ? (
                  <div className={styles.downloadGroup}>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className={styles.downloadButton}
                    >
                      <Download size={19} />
                      <span>Download Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className={styles.resizeAgainButton}
                    >
                      Adjust Dimensions
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResize}
                    disabled={
                      isResizing ||
                      !targetWidth ||
                      !targetHeight ||
                      parseInt(targetWidth, 10) <= 0 ||
                      parseInt(targetHeight, 10) <= 0
                    }
                    className={styles.resizeButton}
                  >
                    {isResizing ? (
                      <>
                        <Loader2 size={19} className={styles.spinner} />
                        <span>Resizing Image...</span>
                      </>
                    ) : (
                      'Resize Image'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}

export default ResizePage;
