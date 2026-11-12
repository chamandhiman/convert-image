import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './Logo.module.css';

/**
 * Image Convert Logo
 * Matches the reference mockup branding:
 * - Temporary folded ribbon/origami gradient logo mark (blue, purple, pink, orange)
 * - "Image Convert" in bold dark text
 * - "By WebToolOcean" in clean subtitle
 */
export function Logo({ className = '', to = ROUTES.home, onClick }) {
  const content = (
    <div className={`${styles.logoContainer} ${className}`}>
      <span className={styles.iconWrap} aria-hidden="true">
        <svg
          className={styles.markSvg}
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoFacetBlue" x1="4" y1="6" x2="18" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="60%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="logoFacetPurple" x1="16" y1="4" x2="28" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="60%" stopColor="#C026D3" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="logoFacetCoral" x1="20" y1="12" x2="16" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="65%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
            <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#7C3AED" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Left triangle facet */}
          <path
            d="M5 8.5C4.5 7.6 5.2 6.5 6.3 6.6L18 8.2L14.2 26.2C13.9 27.2 12.6 27.4 12 26.5L5 8.5Z"
            fill="url(#logoFacetBlue)"
          />
          {/* Top-right polygon facet */}
          <path
            d="M18 8.2L26.4 12.8C27.3 13.3 27.2 14.6 26.3 15.1L14.2 26.2L18 8.2Z"
            fill="url(#logoFacetPurple)"
          />
          {/* Bottom-right folded facet */}
          <path
            d="M26.3 15.1L21.2 22.4C20.6 23.2 19.5 23.4 18.7 22.8L14.2 26.2L26.3 15.1Z"
            fill="url(#logoFacetCoral)"
          />
        </svg>
      </span>

      <div className={styles.textWrap}>
        <span className={styles.brandTitle}>
          <span className={styles.brandGradient}>Image Convert</span>
        </span>
        <span className={styles.brandSub}>By WebToolOcean</span>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={styles.logoLink} onClick={onClick} aria-label="Image Convert by WebToolOcean">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
