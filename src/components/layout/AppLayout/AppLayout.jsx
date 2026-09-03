import { Outlet, useNavigation } from 'react-router-dom';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

import styles from './AppLayout.module.css';

/**
 * Application shell.
 *
 * Owns the page frame every route shares: skip link, sticky header, the main
 * landmark, and the footer. Route content renders through <Outlet />.
 *
 * The CSS grid keeps the footer pinned to the bottom on short pages.
 */
function AppLayout() {
  const navigation = useNavigation();
  const isNavigating = navigation.state === 'loading';

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Header />

      <main
        id="main-content"
        className={`${styles.main} ${isNavigating ? styles.mainLoading : ''}`}
      >
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default AppLayout;
