import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { isExternalFileDrag } from '@/utils/dragDropHelpers';

const DragContext = createContext(null);

export function DragProvider({ children }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e) => {
    // Only respond to actual external file drags
    if (!isExternalFileDrag(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!isExternalFileDrag(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    if (!isExternalFileDrag(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, []);

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
