import { useState, useRef, useEffect } from 'react';
import {
  FileImage,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Layers,
} from 'lucide-react';
import { isExternalFileDrag, extractFilesFromEvent } from '@/utils/dragDropHelpers';
import styles from './DocumentTabsBar.module.css';

export function DocumentTabsBar({
  documents = [],
  activeDocumentId,
  onSelectDocument,
  onSelectTab,
  onCloseDocument,
  onCloseTab,
  onCloseAllDocuments,
  onCloseAll,
  onNewBlankCanvas,
  onNewDocument,
  onOpenFile,
  onOpenImage,
  onReorderDocuments,
  onReorderTabs,
  onDropLayerOnTab,
  onDropFiles,
}) {
  const handleSelectDoc = onSelectDocument || onSelectTab;
  const handleCloseDoc = onCloseDocument || onCloseTab;
  const handleCloseAllDocs = onCloseAllDocuments || onCloseAll;
  const handleNewDoc = onNewBlankCanvas || onNewDocument;
  const handleReorderDocs = onReorderDocuments || onReorderTabs;

  const [draggedTabIndex, setDraggedTabIndex] = useState(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState(null);
  const [dragOverLayerTabId, setDragOverLayerTabId] = useState(null);
  const [showNewMenu, setShowNewMenu] = useState(false);

  const tabsTrackRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const newMenuRef = useRef(null);

  // Close new doc menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target)) {
        setShowNewMenu(false);
      }
    }
    if (showNewMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNewMenu]);

  // Clean up hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Horizontal scroll controls
  const handleScroll = (direction) => {
    if (tabsTrackRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Tab Drag and Drop (Reordering)
  const handleTabDragStart = (e, index) => {
    e.stopPropagation();
    // Do not interfere if user is dragging an internal layer
    if (typeof window !== 'undefined' && window.__draggedLayerPayload) {
      return;
    }
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `doc-tab:${index}`);
  };

  const handleTabDragOver = (e, index, docId) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if dragging external files from OS
    if (isExternalFileDrag(e)) {
      e.dataTransfer.dropEffect = 'copy';
      return;
    }

    // Check if dragging a layer across documents
    const isLayerDrag =
      (typeof window !== 'undefined' && Boolean(window.__draggedLayerPayload)) ||
      e.dataTransfer.types.includes('application/x-image-convert-layer');

    if (isLayerDrag) {
      e.dataTransfer.dropEffect = 'copy';
      if (dragOverLayerTabId !== docId) {
        setDragOverLayerTabId(docId);
        // Clear previous timer
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        // Auto-switch to target tab after 350ms of hovering
        hoverTimerRef.current = setTimeout(() => {
          if (activeDocumentId !== docId) {
            onSelectDocument?.(docId);
          }
        }, 350);
      }
      return;
    }

    // Normal Tab Reordering
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTabIndex !== index) {
      setDragOverTabIndex(index);
    }
  };

  const handleTabDragLeave = (e, docId) => {
    if (dragOverLayerTabId === docId) {
      setDragOverLayerTabId(null);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    }
  };

  const handleTabDrop = (e, index, docId) => {
    e.preventDefault();
    e.stopPropagation();

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setDragOverLayerTabId(null);

    // External files dropped directly onto a document tab
    if (isExternalFileDrag(e)) {
      const files = extractFilesFromEvent(e);
      if (files && files.length > 0) {
        onDropFiles?.(files);
      }
      setDraggedTabIndex(null);
      setDragOverTabIndex(null);
      return;
    }

    // 1. Layer dropped onto this tab
    const layerPayload =
      typeof window !== 'undefined' && window.__draggedLayerPayload
        ? window.__draggedLayerPayload
        : null;

    if (layerPayload && (layerPayload.layers || layerPayload.layer)) {
      onDropLayerOnTab?.(docId, layerPayload.layers || layerPayload.layer);
      handleSelectDoc?.(docId);
      if (typeof window !== 'undefined') {
        window.__draggedLayerPayload = null;
        window.__isInternalLayerDrag = false;
      }
      return;
    }

    // 2. Tab reordering dropped
    if (draggedTabIndex !== null && draggedTabIndex !== index) {
      handleReorderDocs?.(draggedTabIndex, index);
    }

    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
  };

  const handleTabDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
    setDragOverLayerTabId(null);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.documentTabsBar}
      role="tablist"
      aria-label="Open Documents"
      data-testid="document-tabs-bar"
      onDragOver={(e) => {
        if (isExternalFileDrag(e)) {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(e) => {
        if (isExternalFileDrag(e)) {
          e.preventDefault();
          e.stopPropagation();
          const files = extractFilesFromEvent(e);
          if (files && files.length > 0) {
            onDropFiles?.(files);
          }
        }
      }}
    >
      {/* Scroll Left Button */}
      <button
        type="button"
        className={styles.navScrollBtn}
        onClick={() => handleScroll('left')}
        aria-label="Scroll Tabs Left"
        title="Scroll Tabs Left"
        tabIndex={-1}
      >
        <ChevronLeft size={13} />
      </button>

      {/* Tabs Track */}
      <div ref={tabsTrackRef} className={styles.tabsTrack}>
        {documents.map((doc, index) => {
          const isActive = doc.id === activeDocumentId;
          const isLayerHoverTarget = dragOverLayerTabId === doc.id;
          const tooltip = `${doc.name} (${doc.width} × ${doc.height} px)${doc.isDirty ? ' • Unsaved Changes (*)' : ''
            }`;

          return (
            <div
              key={doc.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.docTab} ${isActive ? styles.docTabActive : ''} ${isLayerHoverTarget ? styles.docTabLayerHover : ''
                } ${dragOverTabIndex === index ? styles.docTabReorderTarget : ''}`}
              title={tooltip}
              data-testid={`document-tab-${doc.id}`}
              data-doc-id={doc.id}
              data-doc-active={isActive ? 'true' : 'false'}
              data-doc-dirty={doc.isDirty ? 'true' : 'false'}
              draggable={true}
              onDragStart={(e) => handleTabDragStart(e, index)}
              onDragOver={(e) => handleTabDragOver(e, index, doc.id)}
              onDragLeave={(e) => handleTabDragLeave(e, doc.id)}
              onDrop={(e) => handleTabDrop(e, index, doc.id)}
              onDragEnd={handleTabDragEnd}
              onClick={() => {
                if (!isActive) handleSelectDoc?.(doc.id);
              }}
              onMouseDown={(e) => {
                // Middle click closes the document
                if (e.button === 1) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCloseDoc?.(doc.id, e);
                }
              }}
            >
              {/* Document Icon */}
              <FileImage size={13} className={styles.tabIcon} />

              {/* Document Filename */}
              <span className={styles.tabTitle}>{doc.name}</span>

              {/* Unsaved Changes Indicator Dot / Asterisk */}
              {doc.isDirty && (
                <span
                  className={styles.dirtyIndicator}
                  data-testid={`dirty-indicator-${doc.id}`}
                  title="Unsaved changes"
                >
                  *
                </span>
              )}

              {/* Close Tab Button */}
              <button
                type="button"
                className={styles.tabCloseBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseDoc?.(doc.id, e);
                }}
                title={`Close ${doc.name}`}
                aria-label={`Close ${doc.name}`}
                data-testid={`close-doc-btn-${doc.id}`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        type="button"
        className={styles.navScrollBtn}
        onClick={() => handleScroll('right')}
        aria-label="Scroll Tabs Right"
        title="Scroll Tabs Right"
        tabIndex={-1}
      >
        <ChevronRight size={13} />
      </button>

      {/* New Document Button (+) and Dropdown */}
      <div className={styles.newDocWrap} ref={newMenuRef}>
        <button
          type="button"
          className={styles.newTabBtn}
          onClick={() => setShowNewMenu((p) => !p)}
          title="New Document or Open File"
          aria-label="New Document or Open File"
          data-testid="btn-new-document-tab"
        >
          <Plus size={14} />
        </button>

        {showNewMenu && (
          <div className={styles.newDocMenu} role="menu">
            <button
              type="button"
              className={styles.newDocMenuItem}
              onClick={() => {
                setShowNewMenu(false);
                handleNewDoc?.();
              }}
              data-testid="menu-new-blank-tab"
            >
              <Plus size={13} className={styles.menuItemIcon} />
              <span>New Blank Canvas...</span>
            </button>
            <button
              type="button"
              className={styles.newDocMenuItem}
              onClick={() => {
                setShowNewMenu(false);
                if (onOpenFile) onOpenFile();
                else onOpenImage?.();
              }}
              data-testid="menu-open-file-tab"
            >
              <FolderOpen size={13} className={styles.menuItemIcon} />
              <span>Open File...</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Actions: Document Count & Close All */}
      <div className={styles.rightSection}>
        <span className={styles.docCountBadge} title={`${documents.length} open documents`}>
          {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
        </span>
        {documents.length > 1 && (
          <button
            type="button"
            className={styles.closeAllBtn}
            onClick={handleCloseAllDocs}
            title="Close All Documents"
            data-testid="btn-close-all-docs"
          >
            Close All
          </button>
        )}
      </div>
    </div>
  );
}

export default DocumentTabsBar;
