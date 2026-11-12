import styles from './FloatingImageCard.module.css';

/**
 * Floating Image Card graphic matching the reference mockup:
 * - Tilted white photo frame
 * - Purple gradient landscape with two mountain peaks and a sun
 * - Circular sync/arrows badge attached at bottom-right
 * - Supports `watermark` mode for the footer!
 */
export function FloatingImageCard({ watermark = false, className = '' }) {
  return (
    <div className={`${styles.cardContainer} ${watermark ? styles.watermarkMode : ''} ${className}`}>
      <div className={styles.outerFrame}>
        <div className={styles.photoCanvas}>
          {/* Sun */}
          <div className={styles.sun} />

          {/* Mountains SVG */}
          <svg
            className={styles.mountainsSvg}
            viewBox="0 0 140 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* Back Mountain */}
            <path
              d="M50 35 L95 90 L5 90 Z"
              fill="rgba(255, 255, 255, 0.45)"
            />
            {/* Front Mountain */}
            <path
              d="M85 20 L135 90 L35 90 Z"
              fill="rgba(255, 255, 255, 0.85)"
            />
          </svg>
        </div>

        {/* Sync badge on bottom-right (not shown in watermark mode) */}
        {!watermark && (
          <div className={styles.syncBadge} aria-hidden="true">
            <svg
              className={styles.syncIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default FloatingImageCard;

