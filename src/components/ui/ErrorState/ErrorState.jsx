/**
 * ErrorState
 *
 * Centralised error display used across all tool pages.
 * Replaces per-page ad-hoc error block implementations.
 *
 * Props:
 *  - message:      string          — error message to display.
 *  - onRetry?:     () => void      — optional retry handler.
 *  - retryLabel?:  string          — button label. Defaults to 'Try another image'.
 */
import { Button } from '@/components/ui/Button';
import styles from './ErrorState.module.css';

function ErrorState({ message, onRetry, retryLabel = 'Try another image' }) {
  return (
    <div className={styles.root} role="alert">
      {/* Error icon */}
      <div className={styles.iconWrap} aria-hidden="true">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>

      <p className={styles.message}>{message}</p>

      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
