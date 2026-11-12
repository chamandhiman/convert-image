import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import logoImg from '@/assets/images/logo.png';
import styles from './Logo.module.css';

/**
 * Image Convert Logo
 * Matches the reference branding:
 * - Geometric bird / origami gradient logo mark
 * - "Image Convert" in bold dark text
 * - "By WebToolOcean" in clean subtitle
 */
export function Logo({ className = '', to = ROUTES.home, onClick }) {
  const content = (
    <div className={`${styles.logoContainer} ${className}`}>
      <span className={styles.iconWrap} aria-hidden="true">
        <img
          src={logoImg}
          alt=""
          className={styles.markImg}
          width="32"
          height="32"
        />
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
