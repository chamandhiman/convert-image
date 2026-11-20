import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { NAV_ITEMS } from '@/config/navigation';
import styles from './HamburgerNavDrawer.module.css';

/**
 * HamburgerNavDrawer
 *
 * Full-height slide-in overlay drawer containing ONLY the same four
 * product navigation links displayed in the main header:
 * 1. Edit Image
 * 2. Convert Image
 * 3. Remove Background
 * 4. Compress Image
 *
 * Single source of truth: NAV_ITEMS from @/config/navigation.
 */
export function HamburgerNavDrawer({ isOpen, onClose }) {
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/home';

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
        data-testid="nav-drawer-backdrop"
      />

      {/* Drawer */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        aria-label="Application Navigation"
        data-testid="hamburger-nav-drawer"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <Link to="/" className={styles.brandGroup} onClick={onClose} title="Image Convert Home">
            <img src="/logo.png" alt="WebToolOcean Logo" className={styles.brandLogo} />
            <div className={styles.brandTextGroup}>
              <span className={styles.brandTitle}>Image Convert</span>
              <span className={styles.brandSub}>by WebToolOcean</span>
            </div>
          </Link>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close Navigation"
            data-testid="drawer-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Content: Exactly the four canonical products */}
        <nav className={styles.drawerNav} aria-label="Sidebar Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = !isHome && item.isActive(location.pathname);

            return (
              <Link
                key={item.label}
                to={item.to}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon size={18} className={styles.navIcon} aria-hidden="true" />
                <span className={styles.navText}>{item.label}</span>
                {active && <span className={styles.activeBadge}>Current</span>}
              </Link>
            );
          })}
        </nav>

        {/* Minimal Footer */}
        <div className={styles.drawerFooter}>
          <span className={styles.footerBrand}>WebToolOcean</span>
          <span>100% In-Browser Privacy</span>
        </div>
      </aside>
    </>
  );
}

export default HamburgerNavDrawer;

