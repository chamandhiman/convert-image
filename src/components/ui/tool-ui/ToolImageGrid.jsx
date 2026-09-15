import styles from './ToolImageGrid.module.css';

export function ToolImageGrid({ children }) {
  return <div className={styles.grid}>{children}</div>;
}
