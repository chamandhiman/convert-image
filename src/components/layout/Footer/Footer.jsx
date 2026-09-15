import { Link } from 'react-router-dom';

import { site } from '@/config/site';
import { ROUTES } from '@/routes/paths';

import styles from './Footer.module.css';

const FOOTER_COLUMNS = [
  {
    title: 'IMAGE TOOLS',
    links: [
      { to: ROUTES.convert, label: 'Convert Image' },
      { to: ROUTES.compress, label: 'Compress Image' },
      { to: ROUTES.resize, label: 'Resize Image' },
      { to: ROUTES.optimize, label: 'Smart Optimizer' },
      { to: ROUTES.clean, label: 'Privacy Cleaner' },
      { to: ROUTES.analyze, label: 'Quality Analyzer' },
    ],
  },
  {
    title: 'AI TOOLS',
    links: [
      { to: ROUTES.removeBackground, label: 'Background Remover' },
      { to: ROUTES.objectRemover, label: 'Object Remover' },
      { to: ROUTES.upscaler, label: 'Image Upscaler' },
      { to: ROUTES.imageExtender, label: 'Image Extender' },
      { to: ROUTES.photoRestorer, label: 'Photo Restorer' },
      { to: ROUTES.generativeFill, label: 'Generative Fill' },
    ],
  },
  {
    title: 'RESOURCES',
    links: [
      { to: ROUTES.licenses, label: 'AI Models & Licenses' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { to: '#', label: 'About' },
      { to: '#', label: 'Privacy Policy' },
      { to: '#', label: 'Terms' },
      { to: '#', label: 'Contact' },
    ],
  },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        {/* Brand column */}
        <div className={styles.brandCol}>
          <Link to={ROUTES.home} className={styles.brandLink} aria-label={`${site.name} — home`}>
            <svg
              className={styles.logo}
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="28" height="28" rx="7" fill="var(--color-accent)" />
              <path
                d="M8 18l4-8 3 5 2-3 3 6H8z"
                fill="var(--color-text-on-brand)"
                fillRule="evenodd"
              />
              <circle cx="18" cy="11" r="2" fill="var(--color-text-on-brand)" />
            </svg>
            <span className={styles.brandName}>{site.name}</span>
          </Link>
          <p className={styles.tagline}>
            Free online image tools for compressing, converting, resizing, and editing.
          </p>
        </div>

        {/* Link columns */}
        {FOOTER_COLUMNS.map((col) => (
          <div className={styles.linkGroup} key={col.title}>
            <p className={styles.linkGroupTitle}>{col.title}</p>
            <ul className={styles.linkList} role="list">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link className={styles.link} to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>
            &copy; {year} {site.name}. All rights reserved.
          </p>
          <button type="button" className={styles.langButton}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            English
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
