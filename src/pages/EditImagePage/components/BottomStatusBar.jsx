import { useState, useRef, useEffect } from 'react';
import { Minus, Plus, Maximize, ChevronDown } from 'lucide-react';
import styles from './BottomStatusBar.module.css';

export function BottomStatusBar({
  currentWidth = 0,
  currentHeight = 0,
  zoom = 1,
  onZoomChange,
  onFitScreen,
}) {
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const zoomMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target)) {
        setZoomMenuOpen(false);
      }
    }
    if (zoomMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [zoomMenuOpen]);

  const totalPixels = (currentWidth || 0) * (currentHeight || 0);
  const megapixels = totalPixels > 0 ? (totalPixels / 1000000).toFixed(2) : '0.00';
  const zoomPct = Math.round((zoom || 1) * 100);

  const ZOOM_PRESETS = [0.25, 0.45, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

  const handleZoomOut = () => {
    onZoomChange?.(Math.max(0.1, Number((zoom - 0.1).toFixed(2))));
  };

  const handleZoomIn = () => {
    onZoomChange?.(Math.min(5, Number((zoom + 0.1).toFixed(2))));
  };

  return (
    <footer className={styles.statusBar} data-testid="bottom-status-bar" role="contentinfo">
      {/* Left: Dimensions and Megapixels */}
      <div className={styles.leftStats} data-testid="status-bar-dimensions">
        <span className={styles.statItem}>
          {currentWidth || 0} × {currentHeight || 0} px
        </span>
        <span className={styles.statDivider}>|</span>
        <span className={styles.statItem}>{megapixels} MP</span>
      </div>

      {/* Right: Zoom Out, Zoom Percentage Dropdown, Zoom In, Fullscreen */}
      <div className={styles.rightControls} data-testid="status-bar-controls">
        {/* Zoom Out Button */}
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={handleZoomOut}
          title="Zoom Out (Ctrl -)"
          aria-label="Zoom Out"
          data-testid="status-zoom-out"
        >
          <Minus size={13} />
        </button>

        {/* Zoom Percentage Dropdown */}
        <div className={styles.zoomDropdownWrap} ref={zoomMenuRef}>
          <button
            type="button"
            className={styles.zoomDisplayBtn}
            onClick={() => setZoomMenuOpen((p) => !p)}
            title="Choose Zoom Level"
            aria-expanded={zoomMenuOpen}
            data-testid="status-zoom-display"
          >
            <span>{zoomPct}%</span>
            <ChevronDown size={11} />
          </button>

          {zoomMenuOpen && (
            <div className={styles.zoomDropdownMenu} role="menu">
              {ZOOM_PRESETS.map((z) => (
                <button
                  key={z}
                  type="button"
                  className={`${styles.zoomMenuItem} ${
                    Math.round(z * 100) === zoomPct ? styles.zoomMenuItemActive : ''
                  }`}
                  onClick={() => {
                    onZoomChange?.(z);
                    setZoomMenuOpen(false);
                  }}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
              <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }} />
              <button
                type="button"
                className={styles.zoomMenuItem}
                onClick={() => {
                  onFitScreen?.();
                  setZoomMenuOpen(false);
                }}
              >
                Fit Screen
              </button>
            </div>
          )}
        </div>

        {/* Zoom In Button */}
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={handleZoomIn}
          title="Zoom In (Ctrl +)"
          aria-label="Zoom In"
          data-testid="status-zoom-in"
        >
          <Plus size={13} />
        </button>

        {/* Fullscreen / Fit Screen Button */}
        <button
          type="button"
          className={styles.fullscreenBtn}
          onClick={onFitScreen}
          title="Fit Canvas to Screen (Ctrl 0)"
          aria-label="Fit Canvas to Screen"
          data-testid="status-fullscreen-btn"
        >
          <Maximize size={13} />
        </button>
      </div>
    </footer>
  );
}

export default BottomStatusBar;

