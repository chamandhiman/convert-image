import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RefreshCw, Scissors } from 'lucide-react';
import ToolPageLayout from '@/components/layout/ToolPageLayout';
import FileUploader from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import { formatFileSize } from '@/utils/formatFileSize';
import { trackImageUpload, trackImageConvert, trackImageDownload } from '@/utils/analytics';
import CropContent from './CropContent';
import styles from './CropPage.module.css';

const RATIOS = [
  { label: 'Freeform', value: 0 },
  { label: '1:1 Square', value: 1 / 1 },
  { label: '16:9 Landscape', value: 16 / 9 },
  { label: '4:3 Standard', value: 4 / 3 },
  { label: '9:16 Story', value: 9 / 16 },
  { label: '3:2 Photo', value: 3 / 2 },
];

export function CropPage({ embedded, embeddedOnly }) {
  const [file, setFile] = useState(null);
  const [imageEl, setImageEl] = useState(null);
  const [ratio, setRatio] = useState(0); // 0 = freeform
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [isCropping, setIsCropping] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultDims, setResultDims] = useState({ w: 0, h: 0 });

  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef('move'); // 'move', 'nw', 'ne', 'se', 'sw'
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startCropRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Load image when file changes
  useEffect(() => {
    if (!file) {
      setImageEl(null);
      setResultUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      // Initialize centered crop
      setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
      trackImageUpload({ tool: 'crop_image', format: file.type });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Adjust crop when aspect ratio preset changes
  useEffect(() => {
    if (!imageEl) return;
    if (ratio === 0) return; // Freeform

    const imgAspect = imageEl.width / imageEl.height;
    let newW, newH;

    if (ratio > imgAspect) {
      newW = 0.8;
      newH = (newW * imgAspect) / ratio;
    } else {
      newH = 0.8;
      newW = (newH * ratio) / imgAspect;
    }

    setCrop({
      x: Math.max(0, (1 - newW) / 2),
      y: Math.max(0, (1 - newH) / 2),
      w: Math.min(1, newW),
      h: Math.min(1, newH),
    });
  }, [ratio, imageEl]);

  // Draw crop preview on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageEl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Display sizing
    const maxW = 800;
    const maxH = 500;
    const scale = Math.min(maxW / imageEl.width, maxH / imageEl.height, 1);
    const w = Math.round(imageEl.width * scale);
    const h = Math.round(imageEl.height * scale);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    // 1. Draw base image
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imageEl, 0, 0, w, h);

    // 2. Dark translucent backdrop outside crop
    const cx = crop.x * w;
    const cy = crop.y * h;
    const cw = crop.w * w;
    const ch = crop.h * h;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, w, cy); // top
    ctx.fillRect(0, cy, cx, ch); // left
    ctx.fillRect(cx + cw, cy, w - (cx + cw), ch); // right
    ctx.fillRect(0, cy + ch, w, h - (cy + ch)); // bottom

    // 3. Crop box border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // 4. Rule of Thirds Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Vertical third lines
    ctx.beginPath();
    ctx.moveTo(cx + cw / 3, cy);
    ctx.lineTo(cx + cw / 3, cy + ch);
    ctx.moveTo(cx + (cw * 2) / 3, cy);
    ctx.lineTo(cx + (cw * 2) / 3, cy + ch);

    // Horizontal third lines
    ctx.moveTo(cx, cy + ch / 3);
    ctx.lineTo(cx + cw, cy + ch / 3);
    ctx.moveTo(cx, cy + (ch * 2) / 3);
    ctx.lineTo(cx + cw, cy + (ch * 2) / 3);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Corner Handles
    const handleSize = 10;
    ctx.fillStyle = '#7C3AED';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    const corners = [
      [cx, cy],
      [cx + cw, cy],
      [cx + cw, cy + ch],
      [cx, cy + ch],
    ];

    corners.forEach(([hx, hy]) => {
      ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    });
  }, [imageEl, crop]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Handle pointer interactions on the canvas
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const handleDist = 0.05;
    const isNW = Math.hypot(px - crop.x, py - crop.y) < handleDist;
    const isNE = Math.hypot(px - (crop.x + crop.w), py - crop.y) < handleDist;
    const isSE = Math.hypot(px - (crop.x + crop.w), py - (crop.y + crop.h)) < handleDist;
    const isSW = Math.hypot(px - crop.x, py - (crop.y + crop.h)) < handleDist;

    isDraggingRef.current = true;
    dragStartRef.current = { x: px, y: py };
    startCropRef.current = { ...crop };

    if (isSE) dragModeRef.current = 'se';
    else if (isSW) dragModeRef.current = 'sw';
    else if (isNE) dragModeRef.current = 'ne';
    else if (isNW) dragModeRef.current = 'nw';
    else if (px >= crop.x && px <= crop.x + crop.w && py >= crop.y && py <= crop.y + crop.h) {
      dragModeRef.current = 'move';
    } else {
      dragModeRef.current = 'new';
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const dx = px - dragStartRef.current.x;
    const dy = py - dragStartRef.current.y;
    const s = startCropRef.current;

    if (dragModeRef.current === 'move') {
      const nextX = Math.max(0, Math.min(1 - s.w, s.x + dx));
      const nextY = Math.max(0, Math.min(1 - s.h, s.y + dy));
      setCrop({ x: nextX, y: nextY, w: s.w, h: s.h });
    } else if (dragModeRef.current === 'se') {
      let nextW = Math.max(0.08, Math.min(1 - s.x, s.w + dx));
      let nextH = Math.max(0.08, Math.min(1 - s.y, s.h + dy));
      if (ratio > 0 && imageEl) {
        const imgAspect = imageEl.width / imageEl.height;
        nextH = (nextW * imgAspect) / ratio;
      }
      setCrop({ x: s.x, y: s.y, w: Math.min(1 - s.x, nextW), h: Math.min(1 - s.y, nextH) });
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Perform canvas crop
  const handleCrop = () => {
    if (!imageEl) return;
    setIsCropping(true);

    const sx = Math.round(crop.x * imageEl.width);
    const sy = Math.round(crop.y * imageEl.height);
    const sw = Math.round(crop.w * imageEl.width);
    const sh = Math.round(crop.h * imageEl.height);

    const offscreen = document.createElement('canvas');
    offscreen.width = sw;
    offscreen.height = sh;
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      setIsCropping(false);
      return;
    }

    ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, sw, sh);

    offscreen.toBlob(
      (blob) => {
        setIsCropping(false);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setResultBlob(blob);
          setResultUrl(url);
          setResultDims({ w: sw, h: sh });
          trackImageConvert({
            tool: 'crop_image',
            inputFormat: file?.type,
            outputFormat: file?.type === 'image/png' ? 'image/png' : 'image/jpeg',
          });
        }
      },
      file?.type === 'image/png' ? 'image/png' : 'image/jpeg',
      0.95,
    );
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}-cropped.${ext}`;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackImageDownload({ tool: 'crop_image', outputFormat: ext });
  };

  const handleReset = () => {
    setFile(null);
    setImageEl(null);
    setResultUrl(null);
    setResultBlob(null);
  };

  return (
    <ToolPageLayout
      badge="Free · In-Browser Cropper"
      title="Crop Image Online Free"
      subtitle="Trim and frame photos to 1:1, 16:9, 4:3, or custom aspect ratios with a rule-of-thirds grid. 100% private in your browser."
      content={<CropContent />}
      contentFullWidth
      embedded={embedded}
      embeddedOnly={embeddedOnly}
      showHero={false}
    >
      <div id="tool" className={styles.converterSurface}>
        {!file && (
          <div className={styles.uploadSurface}>
            <div className={styles.uploadHeader}>
              <h2 className={styles.uploadTitle}>Crop your image</h2>
              <p className={styles.uploadDesc}>
                Select an image and crop to standard aspect ratios or custom pixel dimensions. Everything stays private on your device.
              </p>
            </div>
            <FileUploader
              onFileSelect={(selectedFile) => setFile(selectedFile)}
              accept="image/jpeg,image/png,image/webp,image/gif"
              maxSizeMb={50}
            />
          </div>
        )}

        {file && !resultUrl && (
          <div className={styles.workspace}>
            <div className={styles.topBar}>
              <div className={styles.ratioGroup}>
                {RATIOS.map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    className={`${styles.ratioBtn} ${ratio === r.value ? styles.ratioBtnActive : ''}`}
                    onClick={() => setRatio(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className={styles.actionsGroup}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw size={14} />}
                  onClick={handleReset}
                >
                  Change Image
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Scissors size={14} />}
                  onClick={handleCrop}
                  disabled={isCropping}
                >
                  {isCropping ? 'Cropping…' : 'Crop Image'}
                </Button>
              </div>
            </div>

            <div
              className={styles.canvasContainer}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <canvas ref={canvasRef} className={styles.cropCanvas} />
            </div>
          </div>
        )}

        {resultUrl && (
          <div className={styles.resultSurface}>
            <div className={styles.resultPreviewWrap}>
              <img src={resultUrl} alt="Cropped result" className={styles.resultImg} />
            </div>
            <div className={styles.resultMeta}>
              <span>
                <strong>Dimensions:</strong> {resultDims.w} × {resultDims.h} px
              </span>
              <span>•</span>
              <span>
                <strong>File size:</strong> {formatFileSize(resultBlob.size)}
              </span>
            </div>
            <div className={styles.resultActions}>
              <Button
                variant="primary"
                size="md"
                icon={<Download size={16} />}
                onClick={handleDownload}
              >
                Download Cropped Image
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<RefreshCw size={16} />}
                onClick={handleReset}
              >
                Crop Another Photo
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}

export default CropPage;
