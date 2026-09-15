/**
 * Spinner
 *
 * Centralised loading indicator used across all tool pages.
 * Replaces per-page ad-hoc dot-spinner implementations.
 *
 * Props:
 *  - label?  string  — accessible text shown below the dots. Defaults to 'Processing…'
 *  - size?   'sm' | 'md' | 'lg'  — dot size. Defaults to 'md'
 */
import styles from './Spinner.module.css';

function Spinner({ label = 'Processing…', size = 'md' }) {
  return (
    <div className={`${styles.root} ${styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`]}`} role="status" aria-label={label}>
      <div className={styles.dots} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}

export default Spinner;
