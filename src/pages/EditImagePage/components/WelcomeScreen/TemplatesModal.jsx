import { useState, useEffect } from 'react';
import { LayoutGrid, X } from 'lucide-react';
import styles from './TemplatesModal.module.css';

export const TEMPLATES = [
  {
    id: 'insta-post',
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    category: 'Social Media',
    aspect: '1:1',
    boxW: 56,
    boxH: 56,
  },
  {
    id: 'insta-story',
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    category: 'Social Media',
    aspect: '9:16',
    boxW: 36,
    boxH: 64,
  },
  {
    id: 'insta-portrait',
    name: 'Instagram Portrait',
    width: 1080,
    height: 1350,
    category: 'Social Media',
    aspect: '4:5',
    boxW: 46,
    boxH: 58,
  },
  {
    id: 'yt-thumb',
    name: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    category: 'Social Media',
    aspect: '16:9',
    boxW: 72,
    boxH: 40,
  },
  {
    id: 'yt-cover',
    name: 'YouTube Cover',
    width: 2560,
    height: 1440,
    category: 'Social Media',
    aspect: '16:9',
    boxW: 74,
    boxH: 42,
  },
  {
    id: 'fb-cover',
    name: 'Facebook Cover',
    width: 1640,
    height: 664,
    category: 'Social Media',
    aspect: '2.5:1',
    boxW: 80,
    boxH: 32,
  },
  {
    id: 'fb-post',
    name: 'Facebook Post',
    width: 1200,
    height: 630,
    category: 'Social Media',
    aspect: '1.91:1',
    boxW: 74,
    boxH: 38,
  },
  {
    id: 'linkedin-banner',
    name: 'LinkedIn Banner',
    width: 1584,
    height: 396,
    category: 'Social Media',
    aspect: '4:1',
    boxW: 84,
    boxH: 22,
  },
  {
    id: 'a4-doc',
    name: 'A4 Document',
    width: 2480,
    height: 3508,
    category: 'Print',
    aspect: '1:1.41',
    boxW: 44,
    boxH: 62,
  },
  {
    id: 'photo-4x6',
    name: 'Photo 4×6 Standard',
    width: 1800,
    height: 1200,
    category: 'Photo',
    aspect: '3:2',
    boxW: 66,
    boxH: 44,
  },
  {
    id: 'web-fhd',
    name: 'Web Full HD',
    width: 1920,
    height: 1080,
    category: 'Web',
    aspect: '16:9',
    boxW: 72,
    boxH: 40,
  },
  {
    id: 'custom-card',
    name: 'Standard Card',
    width: 800,
    height: 600,
    category: 'Custom',
    aspect: '4:3',
    boxW: 60,
    boxH: 45,
  },
];

const CATEGORIES = ['All', 'Social Media', 'Print', 'Photo', 'Web', 'Custom'];

export function TemplatesModal({ isOpen, onClose, onSelectTemplate }) {
  const [activeCategory, setActiveCategory] = useState('All');

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTemplates =
    activeCategory === 'All'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleCardClick = (tmpl) => {
    onSelectTemplate({
      name: `${tmpl.name}.png`,
      width: tmpl.width,
      height: tmpl.height,
      bgColor: '#FFFFFF',
      isTransparent: false,
    });
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose} data-testid="templates-modal-backdrop">
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="templates-modal-title"
        data-testid="templates-modal"
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}>
              <LayoutGrid size={19} />
            </div>
            <div>
              <h3 id="templates-modal-title" className={styles.modalTitle}>
                Design Templates & Canvas Presets
              </h3>
              <p className={styles.modalSubtitle}>
                Select a ready-to-use canvas preset to start editing immediately
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            data-testid="templates-close-btn"
          >
            <X size={17} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.filterChip} ${activeCategory === cat ? styles.filterChipActive : ''}`}
              onClick={() => setActiveCategory(cat)}
              data-testid={`filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className={styles.templatesGrid}>
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className={styles.templateCard}
              onClick={() => handleCardClick(tmpl)}
              data-testid={`template-card-${tmpl.id}`}
            >
              <div className={styles.previewBox}>
                <div
                  className={styles.wireframeCanvas}
                  style={{ width: `${tmpl.boxW}px`, height: `${tmpl.boxH}px` }}
                >
                  {tmpl.aspect}
                </div>
              </div>

              <div className={styles.templateDetails}>
                <span className={styles.categoryBadge}>{tmpl.category}</span>
                <h4 className={styles.templateName}>{tmpl.name}</h4>
                <span className={styles.templateDimensions}>
                  {tmpl.width} × {tmpl.height} px
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <span>Click any preset to create a document with exact dimensions.</span>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            data-testid="templates-cancel-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplatesModal;

