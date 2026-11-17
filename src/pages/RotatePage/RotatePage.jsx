import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  Download,
  Trash2,
} from 'lucide-react';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import { formatFileSize } from '@/utils/formatFileSize';
import { downloadBlob } from '@/utils/imageProcessor';
import { trackImageUpload, trackImageConvert, trackImageDownload } from '@/utils/analytics';
import RotateContent from './RotateContent';
import styles from './RotatePage.module.css';

export function RotatePage({ embedded, embeddedOnly }) {
  const [file, setFile] = useState(null);
  const [imageEl, setImageEl] = useState(null);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [outputFormat, setOutputFormat] = useState('image/png');
  const [isExporting, setIsExporting] = useState(false);

  const previewCanvasRef = useRef(null);

  // Load image when file changes
  useEffect(() => {
    if (!file) {
      setImageEl(null);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') {
      setOutputFormat('image/jpeg');
    } else if (ext === 'webp') {
      setOutputFormat('image/webp');
    } else {
      setOutputFormat('image/png');
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      trackImageUpload({ tool: 'rotate_image', format: file.type });
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Render live preview on canvas
  useEffect(() => {
    if (!imageEl || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isSwapped = rotation === 90 || rotation === 270;
    const w = isSwapped ? imageEl.height : imageEl.width;
    const h = isSwapped ? imageEl.width : imageEl.height;

    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(imageEl, -imageEl.width / 2, -imageEl.height / 2);
    ctx.restore();
  }, [imageEl, rotation, flipH, flipV]);

  // Rotate actions
  const handleRotateCw = () => setRotation((r) => (r + 90) % 360);
  const handleRotateCcw = () => setRotation((r) => (r + 270) % 360);
  const handleRotate180 = () => setRotation((r) => (r + 180) % 360);
  const handleFlipH = () => setFlipH((f) => !f);
  const handleFlipV = () => setFlipV((f) => !f);
  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  // Export and download
  const handleDownload = useCallback(async () => {
    if (!imageEl || !file) return;

    setIsExporting(true);
    try {
      const isSwapped = rotation === 90 || rotation === 270;
      const exportWidth = isSwapped ? imageEl.height : imageEl.width;
      const exportHeight = isSwapped ? imageEl.width : imageEl.height;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;

      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not create export canvas context.');

      ctx.save();
      ctx.translate(exportWidth / 2, exportHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(imageEl, -imageEl.width / 2, -imageEl.height / 2);
      ctx.restore();

      const blob = await new Promise((resolve) =>
        exportCanvas.toBlob(resolve, outputFormat, 0.92),
      );

      if (!blob) throw new Error('Blob generation failed.');

      const dotIdx = file.name.lastIndexOf('.');
      const baseName = dotIdx > 0 ? file.name.slice(0, dotIdx) : file.name;
      const ext = outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/webp' ? 'webp' : 'png';
      const filename = `${baseName}-rotated.${ext}`;

      downloadBlob(blob, filename);
      trackImageConvert({
        tool: 'rotate_image',
        inputFormat: file.type,
        outputFormat: outputFormat,
      });
      trackImageDownload({
        tool: 'rotate_image',
        outputFormat: outputFormat,
      });
    } catch (err) {
      console.error('Rotate download failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [imageEl, file, rotation, flipH, flipV, outputFormat]);

  const isSwapped = rotation === 90 || rotation === 270;
  const currentWidth = imageEl ? (isSwapped ? imageEl.height : imageEl.width) : 0;
  const currentHeight = imageEl ? (isSwapped ? imageEl.width : imageEl.height) : 0;

  return (
    <ToolPageLayout
      badge="Free · In-Browser"
      title="Rotate Image Online"
      subtitle="Rotate photos 90°, 180°, 270° or flip horizontally and vertically in your browser. 100% free, fast, and completely private."
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      contentFullWidth
      content={!embeddedOnly ? <RotateContent /> : null}
      showHero={true}
    >
      <div id="tool" className={styles.converterSurface}>
        {!file || !imageEl ? (
          <div className={styles.uploadSurface}>
            
            <FileUploader
              onFileSelect={(selectedFile) => setFile(selectedFile)}
              accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
              maxSize={50 * 1024 * 1024}
              hint="JPG, PNG, WebP, GIF, BMP — up to 50 MB"
            />
          </div>
        ) : (
          <div className={styles.workspace}>
            {/* Top Toolbar */}
            <div className={styles.topBar}>
              <div className={styles.imageInfo}>
                <span className={styles.fileName} title={file.name}>
                  {file.name}
                </span>
                <span className={styles.infoBadge}>
                  {currentWidth} × {currentHeight} px
                </span>
                <span>{formatFileSize(file.size)}</span>
              </div>

              <div className={styles.controlGroup}>
                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={handleRotateCcw}
                  title="Rotate 90° Counter-Clockwise"
                >
                  <RotateCcw size={14} />
                  <span>90° Left</span>
                </button>
                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={handleRotateCw}
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw size={14} />
                  <span>90° Right</span>
                </button>
                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={handleRotate180}
                  title="Rotate 180°"
                >
                  <RefreshCw size={14} />
                  <span>180°</span>
                </button>
                <button
                  type="button"
                  className={`${styles.controlBtn} ${flipH ? styles.controlBtnActive : ''}`}
                  onClick={handleFlipH}
                  title="Flip Horizontally (Mirror)"
                >
                  <FlipHorizontal size={14} />
                  <span>Flip H</span>
                </button>
                <button
                  type="button"
                  className={`${styles.controlBtn} ${flipV ? styles.controlBtnActive : ''}`}
                  onClick={handleFlipV}
                  title="Flip Vertically"
                >
                  <FlipVertical size={14} />
                  <span>Flip V</span>
                </button>
                {(rotation !== 0 || flipH || flipV) && (
                  <button
                    type="button"
                    className={styles.controlBtn}
                    onClick={handleReset}
                    title="Reset to Original"
                  >
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Canvas Preview Viewport */}
            <div className={styles.previewArea}>
              <div className={styles.previewCanvasWrapper}>
                <canvas ref={previewCanvasRef} className={styles.previewCanvas} />
              </div>

              <div className={styles.statusOverlay}>
                <span className={styles.statusItem}>
                  <strong>Angle:</strong> {rotation}°
                </span>
                {flipH && (
                  <span className={styles.statusItem}>
                    <strong>Flipped:</strong> Horizontal
                  </span>
                )}
                {flipV && (
                  <span className={styles.statusItem}>
                    <strong>Flipped:</strong> Vertical
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className={styles.bottomBar}>
              <div className={styles.bottomLeft}>
                <label htmlFor="output-format" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                  Format:
                </label>
                <select
                  id="output-format"
                  className={styles.formatSelect}
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                >
                  <option value="image/png">PNG (Preserves Transparency)</option>
                  <option value="image/jpeg">JPG (Lightweight)</option>
                  <option value="image/webp">WebP (Modern & Compact)</option>
                </select>
              </div>

              <div className={styles.bottomRight}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <Trash2 size={14} />
                  <span>Change Image</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isExporting}
                >
                  <Download size={14} />
                  <span>{isExporting ? 'Exporting...' : 'Download Rotated Image'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}

export default RotatePage;
