import { useState, useRef, useEffect } from 'react';
import { Copy, Trash2, MoreHorizontal, Lock, Unlock, ArrowUp, ArrowDown } from 'lucide-react';
import styles from './ContextualToolbar.module.css';

export function ContextualToolbar({
  layer,
  isNearBottom = false,
  onDuplicate,
  onDelete,
  onToggleLock,
  onMoveUp,
  onMoveDown,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  if (!layer) return null;

  return (
    <div
      className={`${styles.contextualPill} ${isNearBottom ? styles.positionTop : ''}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={styles.pillBtn}
        onClick={() => onDuplicate(layer.id)}
        title="Duplicate Object"
        aria-label="Duplicate Object"
      >
        <Copy size={13} />
      </button>

      <button
        type="button"
        className={`${styles.pillBtn} ${styles.deleteBtn}`}
        onClick={() => onDelete(layer.id)}
        title="Delete Object"
        aria-label="Delete Object"
      >
        <Trash2 size={13} />
      </button>

      <div className={styles.moreWrap} ref={menuRef}>
        <button
          type="button"
          className={`${styles.pillBtn} ${menuOpen ? styles.pillBtnActive : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          title="More options"
          aria-label="More options"
        >
          <MoreHorizontal size={13} />
        </button>

        {menuOpen && (
          <div className={styles.dropdownMenu}>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => {
                setMenuOpen(false);
                onToggleLock(layer.id);
              }}
            >
              {layer.locked ? <Unlock size={13} /> : <Lock size={13} />}
              <span>{layer.locked ? 'Unlock Layer' : 'Lock Layer'}</span>
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => {
                setMenuOpen(false);
                onMoveUp(layer.id, 'up');
              }}
            >
              <ArrowUp size={13} />
              <span>Bring Forward</span>
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => {
                setMenuOpen(false);
                onMoveDown(layer.id, 'down');
              }}
            >
              <ArrowDown size={13} />
              <span>Send Backward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContextualToolbar;

