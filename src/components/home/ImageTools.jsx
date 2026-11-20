import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  Maximize2,
  Crop,
  Layers,
  RotateCw,
  Wand2,
  Sliders,
  Sparkles,
  ArrowRight,
  Search,
  Type,
  Shapes,
  Shield,
} from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import styles from './ImageTools.module.css';

// 4 Primary Popular Tools from Mockup Top-Left
const POPULAR_TOOLS = [
  {
    id: 'convert',
    name: 'Convert Image',
    desc: 'Change image format',
    to: ROUTES.convert,
    icon: ImageIcon,
    iconBg: '#E6FFFA',
    iconColor: '#0D9488',
  },
  {
    id: 'resize',
    name: 'Resize Image',
    desc: 'Change width & height',
    to: ROUTES.resize,
    icon: Maximize2,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: 'crop',
    name: 'Crop Image',
    desc: 'Crop to desired area',
    to: ROUTES.crop,
    icon: Crop,
    iconBg: '#FDF2F8',
    iconColor: '#DB2777',
  },
  {
    id: 'compress',
    name: 'Compress Image',
    desc: 'Reduce file size',
    to: ROUTES.compress,
    icon: Layers,
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
  },
];

// All Tools Directory from Mockup Bottom-Right
const ALL_DIRECTORY_TOOLS = [
  {
    id: 'smart-editor',
    name: 'Smart Image Editor',
    desc: 'Photoshop-style online photo editor with layers',
    to: ROUTES.edit,
    category: 'Edit',
    icon: Sliders,
    iconBg: '#F3E8FF',
    iconColor: '#7C3AED',
    badge: 'PRO',
  },
  {
    id: 'convert-all',
    name: 'Convert Image',
    desc: 'Convert to JPG, PNG, WEBP, GIF, SVG, etc.',
    to: ROUTES.convert,
    category: 'Convert',
    icon: ImageIcon,
    iconBg: '#E6FFFA',
    iconColor: '#0D9488',
  },
  {
    id: 'resize-all',
    name: 'Resize Image',
    desc: 'Change image dimensions with exact pixels',
    to: ROUTES.resize,
    category: 'Edit',
    icon: Maximize2,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: 'crop-all',
    name: 'Crop Image',
    desc: 'Crop and remove unwanted outer areas',
    to: ROUTES.crop,
    category: 'Edit',
    icon: Crop,
    iconBg: '#FDF2F8',
    iconColor: '#DB2777',
  },
  {
    id: 'rotate-all',
    name: 'Rotate Image',
    desc: 'Rotate 90°, 180° or flip horizontally and vertically',
    to: ROUTES.rotate,
    category: 'Adjust',
    icon: RotateCw,
    iconBg: '#F0F9FF',
    iconColor: '#0284C7',
  },
  {
    id: 'compress-all',
    name: 'Compress Image',
    desc: 'Reduce image file size with smart quality loss protection',
    to: ROUTES.compress,
    category: 'Optimize',
    icon: Layers,
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
  },
  {
    id: 'remove-bg',
    name: 'Remove Background',
    desc: 'Automatic 1-click cutout with transparent output',
    to: ROUTES.removeBackground,
    category: 'Create',
    icon: Wand2,
    iconBg: '#FAF5FF',
    iconColor: '#9333EA',
  },
  {
    id: 'add-text',
    name: 'Add Text to Image',
    desc: 'Add custom text, fonts, colors and shadow styles',
    to: `${ROUTES.edit}?tab=text`,
    category: 'Create',
    icon: Type,
    iconBg: '#F5EEFF',
    iconColor: '#7C3AED',
  },
  {
    id: 'add-shapes',
    name: 'Add Shapes',
    desc: 'Draw rectangles, circles, arrows, stars and lines',
    to: `${ROUTES.edit}?tab=shapes`,
    category: 'Create',
    icon: Shapes,
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
  },
  {
    id: 'privacy-cleaner',
    name: 'Privacy Cleaner',
    desc: 'Remove GPS, EXIF and camera metadata',
    to: ROUTES.clean,
    category: 'Adjust',
    icon: Shield,
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
];

const CATEGORIES = ['All Tools', 'Convert', 'Edit', 'Optimize', 'Adjust', 'Create'];

export function ImageTools() {
  const [selectedCat, setSelectedCat] = useState('All Tools');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTools, setShowAllTools] = useState(false);

  const filteredTools = useMemo(() => {
    return ALL_DIRECTORY_TOOLS.filter((tool) => {
      const matchCat = selectedCat === 'All Tools' || tool.category === selectedCat;
      const matchQuery =
        !searchQuery.trim() ||
        `${tool.name} ${tool.desc} ${tool.category}`.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchQuery;
    });
  }, [selectedCat, searchQuery]);

  const handleToggleAllTools = (e) => {
    e.preventDefault();
    setShowAllTools((prev) => !prev);
    if (!showAllTools) {
      setTimeout(() => {
        const el = document.getElementById('all-tools-directory');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <section className={styles.section} id="image-tools" aria-labelledby="popular-tools-heading">
      <div className={`container ${styles.container}`}>
        {/* Popular Image Tools Section (Mockup Top-Left) */}
        <div className={styles.popularHeader}>
          <h2 id="popular-tools-heading" className={styles.popularTitle}>
            Popular Image Tools
          </h2>
          <button
            type="button"
            className={styles.viewAllBtn}
            onClick={handleToggleAllTools}
            aria-expanded={showAllTools}
          >
            <span>{showAllTools ? 'Hide All Tools' : 'View All Tools'}</span>
            <ArrowRight size={15} className={`${styles.arrowIcon} ${showAllTools ? styles.arrowRotated : ''}`} />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className={styles.popularGrid}>
          {POPULAR_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                to={tool.to}
                className={styles.popularCard}
                title={`Open ${tool.name}`}
              >
                <div
                  className={styles.popularIconWrap}
                  style={{ backgroundColor: tool.iconBg, color: tool.iconColor }}
                >
                  <Icon size={22} />
                </div>
                <div className={styles.popularMeta}>
                  <h3 className={styles.popularName}>{tool.name}</h3>
                  <p className={styles.popularDesc}>{tool.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Complete Tools Directory (Mockup Bottom-Right) */}
        {showAllTools && (
          <div className={styles.directorySection} id="all-tools-directory">
            <div className={styles.directoryHeader}>
              <div>
                <h3 className={styles.directoryTitle}>Image Tools</h3>
                <p className={styles.directorySubtitle}>
                  A complete collection of free online image tools for editing, converting and optimizing images.
                </p>
              </div>

              {/* Search Bar */}
              <div className={styles.searchBar}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search image tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className={styles.categoryPills}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.catPill} ${selectedCat === cat ? styles.catPillActive : ''}`}
                  onClick={() => setSelectedCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Filtered Tools Grid */}
            <div className={styles.directoryGrid}>
              {filteredTools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <Link
                    key={tool.id}
                    to={tool.to}
                    className={styles.directoryCard}
                    title={`Open ${tool.name}`}
                  >
                    <div
                      className={styles.directoryIconWrap}
                      style={{ backgroundColor: tool.iconBg, color: tool.iconColor }}
                    >
                      <ToolIcon size={20} />
                    </div>
                    <div className={styles.directoryMeta}>
                      <div className={styles.titleRow}>
                        <h4 className={styles.directoryName}>{tool.name}</h4>
                        {tool.badge && <span className={styles.toolBadge}>{tool.badge}</span>}
                      </div>
                      <p className={styles.directoryDesc}>{tool.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default ImageTools;
