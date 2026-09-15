import { useState, useRef } from 'react';

import styles from './BeforeAfterSlider.module.css';

function BeforeAfterSlider({ beforeSrc, afterSrc, beforeLabel = 'Original', afterLabel = 'After' }) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX);
  };
  const handleTouchMove = (e) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  return (
    <div
      className={styles.root}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Before image (bottom layer, full width) */}
      <div className={styles.imageLayer}>
        <img src={beforeSrc} alt={beforeLabel} className={styles.image} draggable={false} />
      </div>

      {/* After image (top layer, clipped from right) */}
      <div className={styles.imageLayer} style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        <img src={afterSrc} alt={afterLabel} className={styles.image} draggable={false} />
      </div>

      {/* Labels */}
      <span className={styles.labelLeft}>{beforeLabel}</span>
      <span className={styles.labelRight}>{afterLabel}</span>

      {/* Handle */}
      <div
        className={styles.handle}
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        role="slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Image comparison position"
        tabIndex={0}
      >
        <div className={styles.handleLine} />
        <div className={styles.handleKnob}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4 2l-2 5 2 5M8 2l2 5-2 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className={styles.handleLine} />
      </div>
    </div>
  );
}

export default BeforeAfterSlider;
