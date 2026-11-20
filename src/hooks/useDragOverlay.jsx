import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { isExternalFileDrag } from '@/utils/dragDropHelpers';

const DragContext = createContext(null);

export function DragProvider({ children }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const shouldSuppressDragOverlay = useCallback((e) => {
    // 1. Suppress generic overlay completely on editor routes
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname || '';
      if (
        pathname === '/edit-image' ||
        pathname === '/edit' ||
        pathname.startsWith('/edit')
      ) {
        return true;
      }
    }

    // 2. Suppress generic overlay if dragging Photoshop files
    if (e && e.dataTransfer && e.dataTransfer.items) {
      const hasPsdItem = Array.from(e.dataTransfer.items).some((item) => {
        const type = (item.type || '').toLowerCase();
        return (
          type === 'image/vnd.adobe.photoshop' ||
          type === 'image/x-photoshop' ||
          type === 'image/psd' ||
          type.includes('photoshop')
        );
      });
      if (hasPsdItem) {
        return true;
      }
    }

    return false;
  }, []);

  const handleDragEnter = useCallback((e) => {
    // Only respond to actual external file drags
    if (!isExternalFileDrag(e) || shouldSuppressDragOverlay(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  }, [shouldSuppressDragOverlay]);

  const handleDragLeave = useCallback((e) => {
    if (!isExternalFileDrag(e)) {
      return;
    }
    if (shouldSuppressDragOverlay(e)) {
      dragCounterRef.current = 0;
      setIsDragging(false);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, [shouldSuppressDragOverlay]);

  const handleDragOver = useCallback((e) => {
    if (!isExternalFileDrag(e) || shouldSuppressDragOverlay(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, [shouldSuppressDragOverlay]);

  const handleDrop = useCallback((e) => {
    if (!isExternalFileDrag(e)) {
      return;
    }
    // Dismiss overlay on drop
    setIsDragging(false);
    dragCounterRef.current = 0;
  }, []);

  useEffect(() => {
    const handleWindowDragEnd = () => {
      if (typeof window !== 'undefined') {
        window.__isInternalLayerDrag = false;
      }
      setIsDragging(false);
      dragCounterRef.current = 0;
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    window.addEventListener('dragend', handleWindowDragEnd);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragend', handleWindowDragEnd);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <DragContext.Provider value={{ isDragging }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDragOverlay() {
  const context = useContext(DragContext);
  if (!context) {
    return { isDragging: false };
  }
  return context;
}
