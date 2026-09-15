import { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { site } from '@/config/site';
import { ROUTES } from '@/routes/paths';

import styles from './Header.module.css';

const CHIP_TOOLS = [
  { to: ROUTES.convert, label: 'Convert', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/><path d="M9 21v-6h6v6"/></svg>
  ) },
  { to: ROUTES.compress, label: 'Compress', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M4 21l7-7"/></svg>
  ) },
  { to: ROUTES.resize, label: 'Resize', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="4" width="10" height="16" rx="1"/><rect x="16" y="9" width="4" height="11" rx="1"/></svg>
  ) },
  { to: ROUTES.removeBackground, label: 'Background remover', pro: true, icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
  ) },
  { to: ROUTES.objectRemover, label: 'Object remover', pro: true, icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4M2 12a10 10 0 1 0 5-8.6"/></svg>
  ) },
  { to: ROUTES.upscaler, label: 'Upscaler', pro: true, icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
  ) },
  { to: ROUTES.photoRestorer, label: 'Photo restorer', pro: true, icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>
  ) },
  { to: '#tools', label: 'All tools', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  ) },
];

const TOP_NAV = [
  { to: '#tools', label: 'Tools' },
  { to: '#security', label: 'Security' },
  { to: '#pricing', label: 'Pricing' },
  { to: '#customers', label: 'Customers' },
  { to: '#faq', label: 'FAQ' },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to={ROUTES.home} className={styles.brand} aria-label={`${site.name} — home`}>
          <span className={styles.brandMark}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2"/><path d="M12 3v3.2M12 17.8V21M21 12h-3.2M6.2 12H3M18.4 5.6l-2.3 2.3M8 15.8l-2.3 2.3M18.4 18.4l-2.3-2.3M8 8l-2.3-2.3"/>
            </svg>
          </span>
          <span className={styles.brandName}>{site.name}</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          <ul className={styles.topNav} role="list">
            {TOP_NAV.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className={styles.topNavLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.desktopRight}>
          <Link to={ROUTES.home} className={styles.loginLink}>Log in</Link>
          <Link to={ROUTES.convert} className={styles.btnPrimary}>Start free</Link>
        </div>

        <button
          className={styles.menuToggle}
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <div className={styles.chipBar}>
        <div className={`container ${styles.chipInner}`}>
          <div className={styles.chipScroll} role="tablist" aria-label="Tool categories">
            {CHIP_TOOLS.map((tool) => {
              const active = isActive(tool.to);
              return (
                <Link
                  key={tool.label}
                  to={tool.to}
                  aria-current={active ? 'page' : undefined}
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                >
                  {tool.icon}
                  {tool.label}
                  {tool.pro && <span className={styles.proBadge} aria-hidden="true">Pro</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <nav
        id="mobile-nav"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ''}`}
        aria-label="Mobile navigation"
      >
        <ul className={styles.mobileNavList} role="list">
          {TOP_NAV.map((item) => (
            <li key={item.label}>
              <Link to={item.to} className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
          <li className={styles.mobileDivider} />
          {CHIP_TOOLS.filter(t => t.to !== '#tools').map((tool) => (
            <li key={tool.label}>
              <Link to={tool.to} className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>
                {tool.label}
                {tool.pro && <span className={styles.mobileProBadge}>Pro</span>}
              </Link>
            </li>
          ))}
          <li className={styles.mobileDivider} />
          <li>
            <Link to={ROUTES.home} className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>Log in</Link>
          </li>
          <li>
            <Link to={ROUTES.convert} className={styles.mobileNavPrimary} onClick={() => setMenuOpen(false)}>
              Start free
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
