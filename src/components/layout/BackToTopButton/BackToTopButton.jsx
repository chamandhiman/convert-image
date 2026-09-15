/**
 * BackToTopButton
 *
 * Global floating button fixed to the bottom-right of the viewport.
 * Appears after the user scrolls ~400 px down; smoothly scrolls back
 * to the top on click. Hidden at top.
 *
 * Single instance lives in AppLayout so it works across ALL routes
 * without being duplicated in individual pages.
 *
 * Performance notes:
 * - Uses a passive scroll listener to avoid blocking the main thread.
 * - Debounced with requestAnimationFrame to prevent excess re-renders.
 * - Cleans up its event listener on unmount.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './BackToTopButton.module.css';

const SCROLL_THRESHOLD = 400; // px before button appears

function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  const rafId = useRef(null);

  const onScroll = useCallback(() => {
    // Throttle via rAF — avoids hammering setState on every scroll pixel
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [onScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`${styles.button} ${visible ? styles.visible : ''}`}
      aria-label="Scroll to top"
      tabIndex={visible ? 0 : -1}
      title="Back to top"
    >
      {/* Upward chevron icon — consistent with existing icon library style */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}

export default BackToTopButton;
