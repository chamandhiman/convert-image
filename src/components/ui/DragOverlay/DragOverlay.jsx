import { useState, useEffect } from 'react';

import { useDragOverlay } from '@/hooks/useDragOverlay';
import { IconUpload } from '@/components/ui/Icons/Icons';

import styles from './DragOverlay.module.css';

export default function DragOverlay() {
  const { isDragging } = useDragOverlay();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isDragging) {
      setVisible(true);
    } else if (visible) {
      const timer = setTimeout(() => setVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isDragging, visible]);

  if (!visible) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.content}>
        <div className={styles.iconWrap} aria-hidden="true">
          <IconUpload size={48} />
        </div>
        <p className={styles.title}>Drop your images anywhere</p>
        <p className={styles.subtitle}>Release to add them to Convert Image</p>
      </div>
    </div>
  );
}
