/**
 * RouteScrollReset
 *
 * Resets the window scroll position to the top on every route change,
 * or smoothly scrolls to the target anchor when a hash is present in the URL.
 * Accounts for the floating sticky header offset.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function RouteScrollReset() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      const scrollToTarget = () => {
        const el = document.getElementById(targetId);
        if (el) {
          const headerOffset = 100;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth',
          });
          return true;
        }
        return false;
      };

      // Try immediately, or retry after initial render if on route transition
      if (!scrollToTarget()) {
        const timer = setTimeout(scrollToTarget, 120);
        return () => clearTimeout(timer);
      }
    } else {
      // Instant jump to top if no hash
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
}

export default RouteScrollReset;
