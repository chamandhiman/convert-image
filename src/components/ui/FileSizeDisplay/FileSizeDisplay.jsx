import { formatFileSize } from '@/utils/formatFileSize';

/**
 * Renders a human-readable file size with an optional label.
 *
 * @param {{ bytes: number, label?: string, className?: string }} props
 */
function FileSizeDisplay({ bytes, label, className }) {
  return (
    <span className={className}>
      {label && <>{label} </>}
      {formatFileSize(bytes)}
    </span>
  );
}

export default FileSizeDisplay;
