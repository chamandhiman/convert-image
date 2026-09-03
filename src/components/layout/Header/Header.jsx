import { useState, useCallback, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { site } from '@/config/site';
import { ROUTES } from '@/routes/paths';

import styles from './Header.module.css';

/**
 * Site header with brand mark, navigation, and responsive mobile menu.
 *
 * Keyboard-accessible: the mobile toggle is a proper `<button>`, the nav is
 * contained in a `<nav>` landmark, and focus is trapped visually via scroll
 * lock on the body when the drawer is open.
 */
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  /* Close menu on Escape key. */
  useEffect(() => {
    if (!menuOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  /* Lock body scroll when mobile menu is open. */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const navLinks = [
    { to: ROUTES.home, label: 'Home' },
    { to: ROUTES.objectRemover, label: 'Erase' },
    { to: ROUTES.upscaler, label: 'Upscale' },
    { to: ROUTES.removeBackground, label: 'Remove BG' },
    { to: ROUTES.optimize, label: 'Optimize' },
    { to: ROUTES.compress, label: 'Compress' },
    { to: ROUTES.convert, label: 'Convert' },
    { to: ROUTES.resize, label: 'Resize' },
  ];

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Brand */}
        <Link to={ROUTES.home} className={styles.brand} aria-label={`${site.name} — home`}>
          <svg
            className={styles.logo}
            width="28"
            height="28"
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

        {/* Desktop navigation */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <ul className={styles.navList} role="list">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile toggle */}
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

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <nav
        id="mobile-nav"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ''}`}
        aria-label="Mobile navigation"
      >
        <ul className={styles.mobileNavList} role="list">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                onClick={closeMenu}
                className={({ isActive }) =>
                  `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
