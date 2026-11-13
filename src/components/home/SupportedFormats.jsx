import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './SupportedFormats.module.css';

const FORMATS = [
  { name: 'JPG', fullName: 'JPEG Image', badge: 'Standard', color: '#3B82F6', bg: '#EFF6FF', param: 'jpeg' },
  { name: 'PNG', fullName: 'Portable Network', badge: 'Lossless', color: '#8B5CF6', bg: '#F5F3FF', param: 'png' },
  { name: 'WEBP', fullName: 'Google WebP', badge: 'Modern Web', color: '#10B981', bg: '#ECFDF5', param: 'webp' },
  { name: 'GIF', fullName: 'Graphics Interchange', badge: 'Animated', color: '#A855F7', bg: '#FAF5FF', param: 'gif' },
  { name: 'SVG', fullName: 'Scalable Vector', badge: 'Vector', color: '#EC4899', bg: '#FDF2F8', param: 'svg' },
  { name: 'BMP', fullName: 'Bitmap Image', badge: 'Raw Pixel', color: '#F59E0B', bg: '#FFFBEB', param: 'bmp' },
  { name: 'TIFF', fullName: 'Tagged Image', badge: 'Print High-Res', color: '#6366F1', bg: '#EEF2FF', param: 'tiff' },
  { name: 'HEIC', fullName: 'High Efficiency', badge: 'Apple Photo', color: '#0EA5E9', bg: '#F0F9FF', param: 'heic' },
];

export function SupportedFormats() {
  return (
    <section className={styles.section} aria-labelledby="formats-heading">
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <span className={styles.kicker}>COMPREHENSIVE FORMAT SUPPORT</span>
          <h2 id="formats-heading" className={styles.title}>
            Supported <span className={styles.gradientTitle}>Image Formats</span>
          </h2>
          <p className={styles.subtitle}>
            Convert seamlessly between standard, lossless, vector, and high-efficiency image types.
          </p>
        </div>

        <div className={styles.formatsGrid}>
          {FORMATS.map((fmt) => (
            <Link
              key={fmt.name}
              to={`${ROUTES.convert}?to=${fmt.param}`}
              className={styles.formatCard}
              title={`Convert to or from ${fmt.name}`}
            >
              <div
                className={styles.formatBadge}
                style={{ backgroundColor: fmt.bg, color: fmt.color }}
              >
                <span>{fmt.name}</span>
              </div>
              <div className={styles.formatMeta}>
                <div className={styles.topMeta}>
                  <span className={styles.formatName}>{fmt.name}</span>
                  <span className={styles.formatTag}>{fmt.badge}</span>
                </div>
                <span className={styles.fullName}>{fmt.fullName}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SupportedFormats;
