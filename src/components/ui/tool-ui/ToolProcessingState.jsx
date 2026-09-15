import Spinner from '@/components/ui/Spinner';
import styles from './ToolProcessingState.module.css';

export function ToolProcessingState({ label, current, total }) {
  const message = current != null && total != null
    ? `${label} ${current} of ${total}...`
    : `${label}...`;

  return (
    <div className={styles.surface}>
      <Spinner label={message} />
    </div>
  );
}
