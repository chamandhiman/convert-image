/**
 * PrivacyBanner
 *
 * A small informational banner reassuring the user that their image never
 * leaves their device. Used across all tool pages that process images locally.
 *
 * Props:
 *  - message?  string  — override the default message text.
 */
import styles from './PrivacyBanner.module.css';

function PrivacyBanner({
  message = '100% private — your image is processed locally and never uploaded to any server.',
}) {
  return (
    <div className={styles.banner} role="note">
      {/* Shield / lock icon */}
      <svg
        className={styles.icon}
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export default PrivacyBanner;
