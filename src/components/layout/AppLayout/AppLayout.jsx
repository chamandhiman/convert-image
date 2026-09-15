import { Outlet, useNavigation } from 'react-router-dom';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RouteScrollReset from '@/components/layout/RouteScrollReset';
import BackToTopButton from '@/components/layout/BackToTopButton';
import { DragProvider } from '@/hooks/useDragOverlay';
import DragOverlay from '@/components/ui/DragOverlay';

import styles from './AppLayout.module.css';

function AppLayout() {
  const navigation = useNavigation();
  const isNavigating = navigation.state === 'loading';

  return (
    <DragProvider>
      <div className={styles.shell}>
        <RouteScrollReset />

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

        <BackToTopButton />
        <DragOverlay />
      </div>
    </DragProvider>
  );
}

export default AppLayout;
