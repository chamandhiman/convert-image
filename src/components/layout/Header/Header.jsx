import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sliders,
  RefreshCw,
  Wand2,
  Minimize2,
  Sparkles,
  Maximize2,
  Menu,
  X,
} from 'lucide-react';

import Logo from '@/components/ui/Logo';
import { ROUTES } from '@/routes/paths';
import styles from './Header.module.css';

/**
 * The exact six canonical navigation items for the website header.
 */
const NAV_ITEMS = [
  {
    to: ROUTES.edit,
    label: 'Edit Image',
    icon: Sliders,
    isActive: (pathname) => pathname === ROUTES.edit || pathname === '/edit',
  },
  {
    to: ROUTES.convert,
    label: 'Convert Image',
    icon: RefreshCw,
    isActive: (pathname) => pathname === ROUTES.convert || pathname === '/convert',
  },
  {
    to: ROUTES.removeBackground,
    label: 'Remove Background',
    icon: Wand2,
    isActive: (pathname) =>
      pathname === ROUTES.removeBackground || pathname === '/remove-background',
  },
  {
    to: ROUTES.compress,
    label: 'Compress Image',
    icon: Minimize2,
    isActive: (pathname) =>
      pathname === ROUTES.compress || pathname === '/compress' || pathname === '/compress-image',
  },
  {
    to: ROUTES.photoRestorer,
    label: 'Photo Restorer',
    icon: Sparkles,
    isActive: (pathname) =>
      pathname === ROUTES.photoRestorer || pathname === '/photo-restorer',
  },
  {
    to: ROUTES.upscaler,
    label: 'Image Upscaler',
    icon: Maximize2,
    isActive: (pathname) =>
      pathname === ROUTES.upscaler || pathname === '/image-upscaler' || pathname === '/upscaler',
  },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // On the home page, no menu should be active; only explicitly selected menu should be active
  const isHome = location.pathname === '/' || location.pathname === ROUTES.home;

  // Close mobile drawer on route navigation
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setMenuOpen(false);
    }
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  return (
    <header className={styles.headerWrapper} data-testid="global-header">
      <div className={styles.headerContainer} data-testid="header-container">
        {/* Left: Image Convert Logo & WebToolOcean Branding */}
        <div className={styles.logoCol}>
          <Logo />
        </div>

        {/* Center / Right: Desktop Main Navigation Bar with EXACT 6 Items */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = !isHome && item.isActive(location.pathname);

              return (
                <li key={item.label} className={styles.navItem}>
                  <Link
                    to={item.to}
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={15} className={styles.navIcon} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Hamburger Menu Toggle Button */}
        <div className={styles.mobileToggleWrap}>
          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer Menu (Contains EXACT same 6 links) */}
      {menuOpen && (
        <div className={styles.mobileDrawer} onClick={() => setMenuOpen(false)}>
          <div
            className={styles.mobileDrawerInner}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile Navigation Menu"
          >
            <nav className={styles.mobileNavLinks} aria-label="Mobile Navigation Links">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = !isHome && item.isActive(location.pathname);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`${styles.mobileNavLink} ${active ? styles.mobileNavLinkActive : ''}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} className={styles.mobileNavIcon} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
