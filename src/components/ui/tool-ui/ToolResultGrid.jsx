import styles from './ToolResultGrid.module.css';

export function ToolResultGrid({ children }) {
  return <div className={styles.grid}>{children}</div>;
}
