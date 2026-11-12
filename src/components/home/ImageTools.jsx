import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  Maximize2,
  Layers,
  Crop,
  RotateCw,
  LayoutGrid,
  ArrowRight,
  X,
  Sparkles,
  Shield,
  Sliders,
  Scissors,
} from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import styles from './ImageTools.module.css';

const TOOLS = [
  {
    id: 'converter',
    name: 'Image Converter',
    desc: 'Convert images between JPG, PNG, WebP, GIF, BMP and more.',
    to: ROUTES.convert,
    type: 'icon',
    icon: ImageIcon,
    iconBg: '#F3E8FF',
    iconColor: '#7C3AED',
  },
  {
    id: 'resize',
    name: 'Resize Image',
    desc: 'Change image dimensions instantly.',
    to: ROUTES.resize,
    type: 'icon',
    icon: Maximize2,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: 'compress',
    name: 'Compress Image',
    desc: 'Reduce image file size without losing quality.',
    to: ROUTES.compress,
    type: 'icon',
    icon: Layers,
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
  },
  {
    id: 'crop',
    name: 'Crop Image',
    desc: 'Crop your image to the perfect size.',
    to: ROUTES.crop,
    type: 'icon',
    icon: Crop,
    iconBg: '#FDF2F8',
    iconColor: '#DB2777',
  },
  {
    id: 'rotate',
    name: 'Rotate Image',
    desc: 'Rotate or flip images horizontally or vertically.',
    to: ROUTES.rotate,
    type: 'icon',
    icon: RotateCw,
    iconBg: '#F0F9FF',
    iconColor: '#0284C7',
  },
  {
    id: 'webp',
    name: 'Image to WebP',
    desc: 'Convert any image to lightweight WebP.',
    to: ROUTES.imageToWebp,
    type: 'badge-box',
    badgeText: 'WEBP',
    badgeBg: '#F5F3FF',
    badgeColor: '#7C3AED',
  },
  {
    id: 'jpg-to-png',
    name: 'JPG to PNG',
    desc: 'Convert JPG images to PNG format.',
    to: ROUTES.jpgToPng,
    type: 'badge-pair',
    from: 'JPG',
    toFmt: 'PNG',
    pairBg: '#F5EEFF',
    pairColor: '#7C3AED',
  },
  {
    id: 'png-to-jpg',
    name: 'PNG to JPG',
    desc: 'Convert PNG images to JPG format.',
    to: ROUTES.pngToJpg,
    type: 'badge-pair',
    from: 'PNG',
    toFmt: 'JPG',
    pairBg: '#FDF2F8',
    pairColor: '#DB2777',
  },
  {
    id: 'more',
    name: 'More Image Tools',
    desc: 'Explore 20+ free image tools for everyday tasks.',
    isAction: true,
    type: 'icon',
    icon: LayoutGrid,
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
  },
];

const ADDITIONAL_TOOLS = [
  { title: 'Background Remover', desc: 'Isolate subjects and export transparent cutouts', to: ROUTES.removeBackground, icon: Scissors, cat: 'AI Tools' },
  { title: 'Image Upscaler', desc: 'Enhance image quality 2x & 4x with super-resolution', to: ROUTES.upscaler, icon: Sparkles, cat: 'AI Tools' },
  { title: 'Object Remover', desc: 'Erase unwanted objects, photobombers and clutter', to: ROUTES.objectRemover, icon: Sparkles, cat: 'AI Tools' },
  { title: 'Photo Restorer', desc: 'Restore old, scratched, blurry and faded photos', to: ROUTES.photoRestorer, icon: Sparkles, cat: 'AI Tools' },
  { title: 'Generative Fill', desc: 'AI inpainting & expansion for custom canvas borders', to: ROUTES.generativeFill, icon: Sparkles, cat: 'AI Tools' },
  { title: 'Privacy Cleaner', desc: 'Remove sensitive EXIF, GPS and camera metadata', to: ROUTES.clean, icon: Shield, cat: 'Privacy' },
  { title: 'Smart Optimizer', desc: 'Optimize imagery based on specific target platforms', to: ROUTES.optimize, icon: Sliders, cat: 'Optimization' },
  { title: 'Quality Analyzer', desc: 'Inspect compression artifacts and format efficiency', to: ROUTES.analyze, icon: Layers, cat: 'Analytics' },
];

export function ImageTools() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className={styles.section} id="image-tools" aria-labelledby="tools-heading">
      <div className="container">
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.kicker}>IMAGE TOOLS</span>
          <h2 id="tools-heading" className={styles.title}>
            All Essential Image Tools at <span className={styles.gradientTitle}>One Place</span>
          </h2>
          <p className={styles.subtitle}>
            Free online tools to convert, edit, optimize and manage your images — all in your browser.
          </p>
        </div>

        {/* 3-Column Tool Cards Grid */}
        <div className={styles.grid}>
          {TOOLS.map((tool) => {
            const cardContent = (
              <>
                <div className={styles.cardLeft}>
                  {tool.type === 'icon' && (
                    <div
                      className={styles.iconBox}
                      style={{ backgroundColor: tool.iconBg, color: tool.iconColor }}
                    >
                      <tool.icon size={22} />
                    </div>
                  )}

                  {tool.type === 'badge-box' && (
                    <div
                      className={styles.badgeBox}
                      style={{ backgroundColor: tool.badgeBg, color: tool.badgeColor }}
                    >
                      <span>{tool.badgeText}</span>
                    </div>
                  )}

                  {tool.type === 'badge-pair' && (
                    <div
                      className={styles.badgePair}
                      style={{ backgroundColor: tool.pairBg, color: tool.pairColor }}
                    >
                      <span>{tool.from}</span>
                      <span className={styles.pairArrow}>→</span>
                      <span>{tool.toFmt}</span>
                    </div>
                  )}

                  <div className={styles.cardText}>
                    <h3 className={styles.toolName}>{tool.name}</h3>
                    <p className={styles.toolDesc}>{tool.desc}</p>
                  </div>
                </div>

                <div className={styles.arrowCircle}>
                  <ArrowRight size={14} className={styles.arrowIcon} />
                </div>
              </>
            );

            if (tool.isAction) {
              return (
                <button
                  key={tool.id}
                  type="button"
                  className={`${styles.card} ${styles.actionCard}`}
                  onClick={() => setModalOpen(true)}
                  aria-haspopup="dialog"
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <Link
                key={tool.id}
                to={tool.to}
                className={styles.card}
                title={`Open ${tool.name}`}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Additional Tools Modal */}
      {modalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalKicker}>ALL FREE IMAGE TOOLS</span>
                <h3 className={styles.modalTitle}>More Image Tools by WebToolOcean</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalGrid}>
              {ADDITIONAL_TOOLS.map((t) => {
                const ToolIcon = t.icon;
                return (
                  <Link
                    key={t.title}
                    to={t.to}
                    className={styles.additionalCard}
                    onClick={() => setModalOpen(false)}
                  >
                    <div className={styles.additionalIconBox}>
                      <ToolIcon size={18} />
                    </div>
                    <div>
                      <div className={styles.additionalTitleRow}>
                        <span className={styles.additionalTitle}>{t.title}</span>
                        <span className={styles.additionalCat}>{t.cat}</span>
                      </div>
                      <p className={styles.additionalDesc}>{t.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ImageTools;

