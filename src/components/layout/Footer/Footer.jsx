import { Link } from 'react-router-dom';

import { site } from '@/config/site';
import { ROUTES } from '@/routes/paths';

import styles from './Footer.module.css';

/**
 * Site footer.
 *
 * Displays the product tagline, navigation shortcuts, and copyright. Designed
 * to sit at the bottom of the AppLayout grid regardless of content height.
 */
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        {/* Brand column */}
        <div className={styles.brandCol}>
          <Link to={ROUTES.home} className={styles.brandLink}>
            <svg
              className={styles.logo}
              width="22"
              height="22"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="28" height="28" rx="7" fill="currentColor" />
              <path
                d="M8 18l4-8 3 5 2-3 3 6H8z"
                fill="var(--color-text-on-brand)"
                fillRule="evenodd"
              />
              <circle cx="18" cy="11" r="2" fill="var(--color-text-on-brand)" />
            </svg>
            <span className={styles.brandName}>{site.name}</span>
          </Link>
          <p className={styles.tagline}>{site.tagline}</p>
        </div>

        {/* Link columns */}
        <nav className={styles.linkGroup} aria-label="Footer navigation">
          <h2 className={styles.linkGroupTitle}>Product</h2>
          <ul className={styles.linkList} role="list">
            <li>
              <Link className={styles.link} to={ROUTES.home}>
                Home
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.removeBackground}>
                Background Remover
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.objectRemover}>
                AI Object Remover
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.upscaler}>
                AI Image Upscaler
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.imageExtender}>
                AI Image Extender
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.photoRestorer}>
                AI Photo Restorer
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.generativeFill}>
                AI Generative Fill
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.optimize}>
                Smart Optimizer
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.clean}>
                Privacy Cleaner
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.compress}>
                Compress Image
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.convert}>
                Convert Image
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={ROUTES.resize}>
                Resize Image
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.linkGroup}>
          <h2 className={styles.linkGroupTitle}>Resources</h2>
          <ul className={styles.linkList} role="list">
            <li>
              <a
                className={styles.link}
                href="https://webtoolocean.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                WebToolOcean
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>
            &copy; {year} {site.name}. All rights reserved.
          </p>
          <Link to={ROUTES.licenses} className={styles.licensesLink}>
            AI Models &amp; Licenses
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
