import styles from './HeroTool.module.css';

const FORMATS = ['JPG', 'PNG', 'WEBP', 'AVIF', 'GIF', 'SVG', 'HEIC', 'BMP', 'TIFF'];

function HeroTool() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerLeft}>
          <span className={styles.bracket}>{'<'}</span>
          <span className={styles.headerLabel}>convert-image.tool</span>
          <span className={styles.bracket}>{'/>'}</span>
        </span>
        <span className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          RUNS ON YOUR DEVICE
        </span>
      </div>

      <div className={styles.grid}>
        {/* Left: Dropzone */}
        <div className={styles.dropzone}>
          <div className={styles.dropzoneInner}>
            <svg className={styles.dropzoneIcon} width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="1.75" />
              <circle cx="18" cy="24" r="4" stroke="currentColor" strokeWidth="1.75" />
              <path d="M8 32l10-10 6 6 8-8 8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className={styles.dropzoneText}>
              Drop an image here, or drop up to 20 at once
            </p>
            <p className={styles.dropzoneOr}>or choose files — up to 50MB each</p>
          </div>
        </div>

        {/* Right: Format selectors + specs */}
        <div className={styles.controls}>
          <div className={styles.formatRow}>
            <div className={styles.formatSelect}>
              <label className={styles.formatLabel}>FROM</label>
              <div className={styles.formatPill}>JPG</div>
            </div>
            <svg className={styles.arrowIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <div className={styles.formatSelect}>
              <label className={styles.formatLabel}>TO</label>
              <div className={styles.formatPill}>PNG</div>
            </div>
          </div>

          <div className={styles.specs}>
            <div className={styles.spec}>
              <span className={styles.specLabel}>Estimated size</span>
              <span className={styles.specValue}>~ 245 KB</span>
            </div>
            <div className={styles.spec}>
              <span className={styles.specLabel}>Dimensions</span>
              <span className={styles.specValue}>1920 × 1080</span>
            </div>
            <div className={styles.spec}>
              <span className={styles.specLabel}>Processing time</span>
              <span className={styles.specValue}>~ 0.8s</span>
            </div>
          </div>

          <button className={styles.convertBtn}>Convert image</button>
        </div>
      </div>

      {/* Format strip */}
      <div className={styles.formatStrip}>
        {FORMATS.map((fmt) => (
          <span key={fmt} className={styles.formatChip}>{fmt}</span>
        ))}
      </div>
    </div>
  );
}

export default HeroTool;
