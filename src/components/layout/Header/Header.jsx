import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import Logo from '@/components/ui/Logo';
import { ROUTES } from '@/routes/paths';
import { NAV_ITEMS } from '@/config/navigation';
import HamburgerNavDrawer from '@/components/layout/HamburgerNavDrawer';
import styles from './Header.module.css';

export { NAV_ITEMS };

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

        {/* Center / Right: Desktop Main Navigation Bar */}
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

      {/* Responsive Hamburger Overlay Drawer: Single source of truth */}
      <HamburgerNavDrawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </header>
  );
}

export default Header;
