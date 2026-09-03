/**
 * Format a byte count into a human-readable string.
 *
 * @param {number} bytes  Raw byte count.
 * @param {number} [decimals=2] Decimal places to show.
 * @returns {string} e.g. "1.45 MB", "320 KB", "0 B".
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['B', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))} ${sizes[index]}`;
}

export default formatFileSize;
