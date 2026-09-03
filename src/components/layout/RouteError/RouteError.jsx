import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { ROUTES } from '@/routes/paths';

import styles from './RouteError.module.css';

/**
 * Router-level error boundary.
 *
 * Rendered by the data router when a route throws during render or data
 * loading. Keeps the app on a real page instead of a blank screen, and shows
 * the underlying message in development only.
 */
function RouteError() {
  const error = useRouteError();

  let status = 'Error';
  let message = 'Something went wrong while loading this page.';

  if (isRouteErrorResponse(error)) {
    status = String(error.status);
    message = error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className={styles.wrapper} role="alert">
      <p className={styles.status}>{status}</p>
      <h1 className={styles.title}>This page hit a problem</h1>
      <p className={styles.message}>{message}</p>
      <Link className={styles.action} to={ROUTES.home}>
        Back to home
      </Link>
    </div>
  );
}

export default RouteError;
