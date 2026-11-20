import { Outlet, useNavigation, useLocation } from 'react-router-dom';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RouteScrollReset from '@/components/layout/RouteScrollReset';
import BackToTopButton from '@/components/layout/BackToTopButton';
import { DragProvider } from '@/hooks/useDragOverlay';
import DragOverlay from '@/components/ui/DragOverlay';
import CookieConsentModal from '@/components/ui/CookieConsentModal';
import { ROUTES } from '@/routes/paths';

import styles from './AppLayout.module.css';

function AppLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const isNavigating = navigation.state === 'loading';
  const isFullBleedEditor =
    location.pathname === ROUTES.edit || location.pathname === ROUTES.editOld;

  return (
    <DragProvider>
      <div
        className={`${styles.shell} ${
          isFullBleedEditor ? styles.shellEditor : ''
        }`}
      >
        <RouteScrollReset />

        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>

        {!isFullBleedEditor && <Header />}

        <main
          id="main-content"
          className={`${styles.main} ${isNavigating ? styles.mainLoading : ''} ${
            isFullBleedEditor ? styles.mainEditor : ''
          }`}
        >
          <Outlet />
        </main>

        {!isFullBleedEditor && <Footer />}

        <BackToTopButton />
        {!isFullBleedEditor && <DragOverlay />}
        <CookieConsentModal />
      </div>
    </DragProvider>
  );
}

export default AppLayout;
