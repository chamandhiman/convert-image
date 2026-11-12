import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import Logo from '@/components/ui/Logo';
import FloatingImageCard from '@/components/ui/FloatingImageCard';
import { ROUTES } from '@/routes/paths';

import styles from './Footer.module.css';

const TOOLS_LINKS = [
  { label: 'Image Converter', to: ROUTES.convert },
  { label: 'Resize Image', to: ROUTES.resize },
  { label: 'Compress Image', to: ROUTES.compress },
  { label: 'Crop Image', to: ROUTES.crop },
  { label: 'Rotate Image', to: ROUTES.rotate },
  { label: 'Remove Background', to: ROUTES.removeBackground },
];

const RESOURCES_LINKS = [
  { label: 'All Image Tools', to: '/#image-tools' },
  { label: 'Image Formats', to: `${ROUTES.convert}#what-is` },
  { label: 'Image Guidelines', to: ROUTES.licenses },
  { label: 'Blog', to: 'https://webtoolocean.com', external: true },
  { label: 'WebToolOcean.com', to: 'https://webtoolocean.com', external: true },
];

const SUPPORT_LINKS = [
  { label: 'Help Center', to: ROUTES.contact },
  { label: 'Contact Us', to: ROUTES.contact },
  { label: 'Report an Issue', to: ROUTES.contact },
  { label: 'Feedback', to: ROUTES.contact },
  { label: 'webtoolocean@gmail.com', to: 'mailto:webtoolocean@gmail.com', external: true },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleOpenCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
  };

  return (
    <footer className={styles.footer} id="resources">
      {/* Background soft watermark illustration */}
      <div className={styles.watermarkWrap} aria-hidden="true">
        <FloatingImageCard watermark />
      </div>

      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <Logo />
            <p className={styles.brandDesc}>
              Free online image converter and editing tools. Convert, resize, compress, crop, and optimize images easily and securely.
            </p>

            {/* Social Icons */}
            <div className={styles.socialRow}>
              {/* X / Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className={styles.socialBtn}
                aria-label="X (Twitter)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className={styles.socialBtn}
                aria-label="Facebook"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className={styles.socialBtn}
                aria-label="YouTube"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className={styles.socialBtn}
                aria-label="LinkedIn"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Tools Column */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Tools</h4>
            <ul className={styles.linksList}>
              {TOOLS_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className={styles.footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Resources</h4>
            <ul className={styles.linksList}>
              {RESOURCES_LINKS.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.to}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.footerLink}
                    >
                      {link.label}
                      <ArrowUpRight size={13} className={styles.extIcon} />
                    </a>
                  ) : (
                    <Link to={link.to} className={styles.footerLink}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Support</h4>
            <ul className={styles.linksList}>
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a href={link.to} className={styles.footerLink}>
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.to} className={styles.footerLink}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright on Left, Legal on Right */}
        <div className={styles.bottomBar}>
          <div className={styles.copyrightText}>
            © {currentYear} WebToolOcean. All rights reserved.
          </div>
          <div className={styles.legalLinks}>
            <Link to={ROUTES.privacy} className={styles.legalLink}>Privacy</Link>
            <Link to={ROUTES.terms} className={styles.legalLink}>Terms</Link>
            <Link to={ROUTES.cookies} className={styles.legalLink}>Cookies</Link>
            <button
              type="button"
              className={styles.cookiePrefsBtn}
              onClick={handleOpenCookiePreferences}
              title="Change your cookie settings"
            >
              Cookie Preferences
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
