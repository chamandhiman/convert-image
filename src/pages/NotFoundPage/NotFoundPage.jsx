import { Link } from 'react-router-dom';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ROUTES } from '@/routes/paths';

import styles from './NotFoundPage.module.css';

/**
 * 404 catch-all route.
 *
 * Shown for any URL that does not match a registered route. Offers a clear
 * message and a single action to return home.
 */
function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <section className={`container ${styles.page}`} aria-labelledby="nf-heading">
      <div className={styles.content}>
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <h1 id="nf-heading" className={styles.title}>
          Page not found
        </h1>
        <p className={styles.message}>
          The page you are looking for does not exist, has been moved, or is
          temporarily unavailable.
        </p>
        <Link className={styles.action} to={ROUTES.home}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to home
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;
