import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './SupportedFormats.module.css';

const FORMATS = [
  { name: 'JPG', bg: '#F1E4FE', color: '#8A35E9', border: '#E4CDFD', param: 'jpeg' },
  { name: 'PNG', bg: '#FEE3F2', color: '#D93690', border: '#FCC7E5', param: 'png' },
  { name: 'WEBP', bg: '#E0E8FB', color: '#3B62DF', border: '#C4D4F7', param: 'webp' },
  { name: 'GIF', bg: '#E0FAF7', color: '#0D9488', border: '#B8F3EC', param: 'gif' },
  { name: 'BMP', bg: '#FCEFE9', color: '#D97706', border: '#F8DACB', param: 'bmp' },
  { name: 'TIFF', bg: '#F5EEFF', color: '#7C3AED', border: '#E8D9FE', param: 'tiff' },
  { name: 'SVG', bg: '#FAE2F0', color: '#DB2777', border: '#F6C2E2', param: 'svg' },
  { name: 'HEIC', bg: '#DFE7FC', color: '#2563EB', border: '#C1D2F9', param: 'heic' },
];

export function SupportedFormats() {
  return (
    <section className={styles.section} aria-label="Supported image formats">
      <div className={`container ${styles.container}`}>
        {/* Title with lines on both sides */}
        <div className={styles.titleDivider}>
          <div className={styles.line} />
          <span className={styles.titleText}>Supports All Popular Image Formats</span>
          <div className={styles.line} />
        </div>

        {/* Format Badges Row */}
        <div className={styles.badgesRow}>
          {FORMATS.map((fmt) => (
            <Link
              key={fmt.name}
              to={`${ROUTES.convert}?to=${fmt.param}`}
              className={styles.formatBadge}
              style={{
                backgroundColor: fmt.bg,
                color: fmt.color,
                borderColor: fmt.border,
              }}
              title={`Convert to or from ${fmt.name}`}
            >
              {fmt.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SupportedFormats;

