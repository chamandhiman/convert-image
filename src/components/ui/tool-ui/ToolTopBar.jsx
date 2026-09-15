import { Button } from '@/components/ui/Button';
import { IconUpload, IconImagePlus, IconTrash } from '@/components/ui/Icons/Icons';
import { formatFileSize } from '@/utils/formatFileSize';
import styles from './ToolTopBar.module.css';

export function ToolTopBar({ itemCount, totalSize, onAddMore, onClearAll, addMoreAccept }) {
  return (
    <div className={styles.topBar}>
      <div className={styles.left}>
        <span className={styles.icon} aria-hidden="true">
          <IconUpload size={18} />
        </span>
        <div>
          <div className={styles.title}>
            {itemCount} image{itemCount !== 1 ? 's' : ''} selected
          </div>
          <div className={styles.meta}>
            Total size: {formatFileSize(totalSize)}
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <input
          id="tool-add-more-input"
          type="file"
          accept={addMoreAccept}
          multiple
          onChange={(e) => {
            const selected = e.target.files;
            if (selected && selected.length > 0 && onAddMore) {
              onAddMore(selected);
            }
            e.target.value = '';
          }}
          className={styles.hiddenInput}
          tabIndex={-1}
          aria-hidden="true"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={<IconImagePlus />}
          onClick={() => document.getElementById('tool-add-more-input')?.click()}
        >
          + Add New
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<IconTrash />}
          onClick={onClearAll}
          className={styles.clearBtn}
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}
