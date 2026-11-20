import { useState } from 'react';
import { Info, Sliders, Palette, X, Check } from 'lucide-react';
import styles from './UnsavedChangesModal.module.css';

/**
 * Image Information Modal
 */
export function ImageInfoModal({ isOpen, onClose, documentInfo }) {
  if (!isOpen || !documentInfo) return null;

  const { name, width, height, layersCount, colorSpace = 'sRGB', bitDepth = '8-bit' } = documentInfo;
  const megaPixels = ((width * height) / 1000000).toFixed(2);
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const div = gcd(width, height) || 1;
  const aspect = `${Math.round(width / div)}:${Math.round(height / div)}`;

  return (
    <div className={styles.modalBackdrop} onClick={onClose} data-testid="modal-image-info">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className={styles.modalHeader} style={{ alignItems: 'center' }}>
          <div className={styles.iconCircle} style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <Info size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Image Information
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              Document properties & specifications
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0.75rem 1.25rem 1.25rem 1.25rem' }}>
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Document Name:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{name || 'Untitled Document'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Dimensions:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{width} × {height} pixels</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Megapixels:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{megaPixels} MP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Aspect Ratio:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{aspect}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Layers:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{layersCount} layer(s)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Color Mode:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>RGB / {bitDepth}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Color Profile:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{colorSpace} IEC61966-2.1</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              data-testid="btn-close-image-info"
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 18px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Image Resolution Modal
 */
export function ImageResolutionModal({ isOpen, onClose, currentWidth, currentHeight }) {
  const [resolution, setResolution] = useState(72);

  if (!isOpen) return null;

  const widthInches = (currentWidth / resolution).toFixed(2);
  const heightInches = (currentHeight / resolution).toFixed(2);
  const widthCm = (parseFloat(widthInches) * 2.54).toFixed(2);
  const heightCm = (parseFloat(heightInches) * 2.54).toFixed(2);

  return (
    <div className={styles.modalBackdrop} onClick={onClose} data-testid="modal-image-resolution">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className={styles.modalHeader} style={{ alignItems: 'center' }}>
          <div className={styles.iconCircle} style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <Sliders size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Image Resolution
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              Pixel density & physical print dimensions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0.75rem 1.25rem 1.25rem 1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Resolution (Pixels / Inch):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: '72 PPI (Screen / Web)', val: 72 },
                { label: '150 PPI (Medium Print)', val: 150 },
                { label: '300 PPI (High-Res Print)', val: 300 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setResolution(opt.val)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: resolution === opt.val ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                    backgroundColor: resolution === opt.val ? '#f5f3ff' : '#ffffff',
                    color: resolution === opt.val ? '#7c3aed' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: resolution === opt.val ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {opt.val} PPI
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Pixel Dimensions:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{currentWidth} × {currentHeight} px</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Print Size (Inches):</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{widthInches}″ × {heightInches}″</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Print Size (Centimeters):</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{widthCm} cm × {heightCm} cm</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              data-testid="btn-close-resolution"
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 18px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Canvas Background Color Selection Modal
 */
export function CanvasBackgroundModal({
  isOpen,
  onClose,
  currentOption = 'transparent',
  currentColor = '#7C3AED',
  onApply,
}) {
  const [selectedOpt, setSelectedOpt] = useState(currentOption);
  const [customColor, setCustomColor] = useState(currentColor || '#7C3AED');

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose} data-testid="modal-canvas-background">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className={styles.modalHeader} style={{ alignItems: 'center' }}>
          <div className={styles.iconCircle} style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <Palette size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Canvas Background
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              Choose document canvas backdrop
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0.75rem 1.25rem 1.25rem 1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
            {[
              { id: 'transparent', label: 'Transparent (Checkerboard)' },
              { id: 'white', label: 'White (#FFFFFF)' },
              { id: 'black', label: 'Black (#000000)' },
              { id: 'custom', label: 'Custom Color' },
            ].map((opt) => (
              <label
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: selectedOpt === opt.id ? '1px solid #7c3aed' : '1px solid #e2e8f0',
                  background: selectedOpt === opt.id ? '#f5f3ff' : '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: selectedOpt === opt.id ? 600 : 400,
                  color: selectedOpt === opt.id ? '#7c3aed' : '#334155',
                }}
              >
                <input
                  type="radio"
                  name="canvasBgOpt"
                  checked={selectedOpt === opt.id}
                  onChange={() => setSelectedOpt(opt.id)}
                  style={{ accentColor: '#7c3aed' }}
                />
                <span>{opt.label}</span>
              </label>
            ))}

            {selectedOpt === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', paddingLeft: '8px' }}>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  style={{ width: '40px', height: '32px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    width: '100px',
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(selectedOpt, customColor);
                onClose();
              }}
              data-testid="btn-apply-canvas-bg"
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 18px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

