/**
 * RouteScrollReset
 *
 * Resets the window scroll position to the top on every route change.
 * Placed inside <AppLayout> so it wraps the <Outlet> and reacts to
 * React Router's location changes at the app-shell level.
 *
 * No smooth scroll — instant reset is intentional so the user arrives
 * at the top of the new page without a jarring animation.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function RouteScrollReset() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant jump — no smooth scroll on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default RouteScrollReset;
