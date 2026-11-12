import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Image,
  Images,
  Sparkles,
  BookOpen,
  Search,
  Grid3x3,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  Crop,
  Layers,
  RotateCw,
  Wand2,
  FileText,
  HelpCircle,
  BookMarked,
  Newspaper,
} from 'lucide-react';

import Logo from '@/components/ui/Logo';
import { ROUTES } from '@/routes/paths';
import styles from './Header.module.css';

const IMAGE_TOOLS_LIST = [
  {
    to: ROUTES.resize,
    label: 'Resize Image',
    desc: 'Change dimensions and scale with exact pixels or %',
    icon: Layers,
  },
  {
    to: ROUTES.compress,
    label: 'Compress Image',
    desc: 'Reduce file size while preserving high visual quality',
    icon: Sparkles,
  },
  {
    to: ROUTES.crop,
    label: 'Crop Image',
    desc: 'Crop to exact dimensions or social media ratios',
    icon: Crop,
  },
  {
    to: ROUTES.rotate,
    label: 'Rotate Image',
    desc: 'Rotate 90°, 180°, 270° or flip horizontally/vertically',
    icon: RotateCw,
  },
  {
    to: ROUTES.removeBackground,
    label: 'Remove Background',
    desc: 'Automatic 1-click cutout with transparent PNG output',
    icon: Wand2,
  },
  {
    to: ROUTES.photoRestorer,
    label: 'Photo Restorer',
    desc: 'Enhance vintage photos and restore face details',
    icon: Sparkles,
  },
  {
    to: ROUTES.upscaler,
    label: 'Image Upscaler',
    desc: '2x & 4x super-resolution with bicubic & AI upsampling',
    icon: Layers,
  },
];

const RESOURCES_LIST = [
  {
    to: '/image-formats',
    label: 'Image Formats',
    desc: 'Learn differences between JPG, PNG, WebP, AVIF, and SVG',
    icon: FileText,
  },
  {
    to: '/image-guidelines',
    label: 'Image Guidelines',
    desc: 'Recommended dimensions & specs for web and social media',
    icon: BookMarked,
  },
  {
    to: 'https://webtoolocean.com',
    label: 'Blog',
    desc: 'Guides, tutorials, and latest image optimization tips',
    icon: Newspaper,
    external: true,
  },
  {
    to: ROUTES.contact,
    label: 'Help Center',
    desc: 'FAQs, contact support, and report browser issues',
    icon: HelpCircle,
  },
];

const SEARCHABLE_TOOLS = [
  { title: 'Convert Image', path: ROUTES.convert, category: 'Convert', keywords: 'convert format jpg png webp gif bmp svg heic' },
  { title: 'Resize Image', path: ROUTES.resize, category: 'Edit', keywords: 'resize dimensions width height scale pixels aspect ratio' },
  { title: 'Compress Image', path: ROUTES.compress, category: 'Optimize', keywords: 'compress shrink size mb kb optimize quality' },
  { title: 'Crop Image', path: ROUTES.crop, category: 'Edit', keywords: 'crop trim aspect ratio cut square' },
  { title: 'Rotate Image', path: ROUTES.rotate, category: 'Edit', keywords: 'rotate flip orientation turn 90 180' },
  { title: 'JPG to PNG', path: ROUTES.jpgToPng, category: 'Convert', keywords: 'jpg to png convert jpeg raster transparent' },
  { title: 'PNG to JPG', path: ROUTES.pngToJpg, category: 'Convert', keywords: 'png to jpg convert jpeg photo shrink' },
  { title: 'Image to WebP', path: ROUTES.imageToWebp, category: 'Convert', keywords: 'webp convert modern google format lcp' },
  { title: 'Remove Background', path: ROUTES.removeBackground, category: 'AI Tools', keywords: 'remove background transparent cutout png' },
  { title: 'Image Upscaler', path: ROUTES.upscaler, category: 'AI Tools', keywords: 'upscale enhance 2x 4x super resolution hd' },
  { title: 'Photo Restorer', path: ROUTES.photoRestorer, category: 'AI Tools', keywords: 'photo restorer old vintage scratched face sharpen' },
  { title: 'Object Remover', path: ROUTES.objectRemover, category: 'AI Tools', keywords: 'object remover erase inpaint clean watermark' },
  { title: 'Privacy Cleaner', path: ROUTES.clean, category: 'Privacy', keywords: 'clean metadata exif gps location privacy' },
  { title: 'Smart Optimizer', path: ROUTES.optimize, category: 'Optimize', keywords: 'smart optimizer web preset compression' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toolsDropdownRef = useRef(null);
  const resourcesDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Close menus on route change
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setMenuOpen(false);
      setToolsDropdownOpen(false);
      setResourcesDropdownOpen(false);
      setSearchOpen(false);
    }
  }, [location.pathname]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target)) {
        setToolsDropdownOpen(false);
      }
      if (resourcesDropdownRef.current && !resourcesDropdownRef.current.contains(e.target)) {
        setResourcesDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setToolsDropdownOpen(false);
        setResourcesDropdownOpen(false);
        setSearchOpen(false);
        setMenuOpen(false);
      }
      if (e.key === '/' && !searchOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Focus search input
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  // Body scroll lock on mobile
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Global anchor navigation handler that works from ANY page without appending to current URL
  const handleAnchorNav = (targetId) => {
    setMenuOpen(false);
    setToolsDropdownOpen(false);
    setResourcesDropdownOpen(false);

    if (location.pathname === ROUTES.home) {
      const el = document.getElementById(targetId);
      if (el) {
        const headerOffset = 100;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
        return;
      }
    }
    // Navigate to homepage with target hash
    navigate(`${ROUTES.home}#${targetId}`);
  };

  const filteredSearchTools = searchQuery.trim()
    ? SEARCHABLE_TOOLS.filter((t) =>
        `${t.title} ${t.category} ${t.keywords}`.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      )
    : SEARCHABLE_TOOLS.slice(0, 8);

  const isConvertActive = location.pathname === ROUTES.convert;

  return (
    <header className={styles.headerWrapper}>
      <div className={styles.headerContainer}>
        {/* Left: Brand Logo */}
        <div className={styles.logoCol}>
          <Logo />
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <ul className={styles.navList}>
            {/* 1. Convert Image */}
            <li>
              <Link
                to={ROUTES.convert}
                className={`${styles.navLink} ${isConvertActive ? styles.navLinkActive : ''}`}
              >
                <Image size={15} className={styles.navIcon} />
                <span>Convert Image</span>
              </Link>
            </li>

            {/* 2. Image Tools (Dropdown) */}
            <li className={styles.dropdownWrap} ref={toolsDropdownRef}>
              <button
                type="button"
                className={`${styles.navLink} ${styles.dropdownTrigger} ${
                  toolsDropdownOpen ? styles.dropdownActive : ''
                }`}
                onClick={() => {
                  setToolsDropdownOpen((prev) => !prev);
                  setResourcesDropdownOpen(false);
                }}
                aria-expanded={toolsDropdownOpen}
                aria-haspopup="true"
              >
                <Images size={15} className={styles.navIcon} />
                <span>Image Tools</span>
                <ChevronDown
                  size={14}
                  className={`${styles.dropdownChevron} ${
                    toolsDropdownOpen ? styles.dropdownChevronOpen : ''
                  }`}
                />
              </button>

              {toolsDropdownOpen && (
                <div className={styles.toolsDropdownMenu} role="menu">
                  <div className={styles.toolsGrid}>
                    {IMAGE_TOOLS_LIST.map((tool) => {
                      const ToolIcon = tool.icon;
                      return (
                        <Link
                          key={tool.label}
                          to={tool.to}
                          className={styles.toolItem}
                          onClick={() => setToolsDropdownOpen(false)}
                        >
                          <div className={styles.toolIconWrap}>
                            <ToolIcon size={16} />
                          </div>
                          <div className={styles.toolMeta}>
                            <strong className={styles.toolTitle}>{tool.label}</strong>
                            <span className={styles.toolDesc}>{tool.desc}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className={styles.dropdownFooter}>
                    <span>100% Free · In-Browser Processing · No Installation</span>
                    <button
                      type="button"
                      className={styles.viewAllToolsLink}
                      onClick={() => handleAnchorNav('image-tools')}
                    >
                      All Tools <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </li>

            {/* 3. Features */}
            <li>
              <button
                type="button"
                className={styles.navLink}
                onClick={() => handleAnchorNav('why-choose-us')}
              >
                <Sparkles size={15} className={styles.navIcon} />
                <span>Features</span>
              </button>
            </li>

            {/* 4. Resources (Dropdown) */}
            <li className={styles.dropdownWrap} ref={resourcesDropdownRef}>
              <button
                type="button"
                className={`${styles.navLink} ${styles.dropdownTrigger} ${
                  resourcesDropdownOpen ? styles.dropdownActive : ''
                }`}
                onClick={() => {
                  setResourcesDropdownOpen((prev) => !prev);
                  setToolsDropdownOpen(false);
                }}
                aria-expanded={resourcesDropdownOpen}
                aria-haspopup="true"
              >
                <BookOpen size={15} className={styles.navIcon} />
                <span>Resources</span>
                <ChevronDown
                  size={14}
                  className={`${styles.dropdownChevron} ${
                    resourcesDropdownOpen ? styles.dropdownChevronOpen : ''
                  }`}
                />
              </button>

              {resourcesDropdownOpen && (
                <div className={styles.resourcesDropdownMenu} role="menu">
                  <div className={styles.resourcesList}>
                    {RESOURCES_LIST.map((res) => {
                      const ResIcon = res.icon;
                      return res.external ? (
                        <a
                          key={res.label}
                          href={res.to}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.resourceItem}
                          onClick={() => setResourcesDropdownOpen(false)}
                        >
                          <div className={styles.resIconWrap}>
                            <ResIcon size={15} />
                          </div>
                          <div className={styles.toolMeta}>
                            <div className={styles.resTitleRow}>
                              <strong className={styles.toolTitle}>{res.label}</strong>
                              <ArrowUpRight size={12} className={styles.extIcon} />
                            </div>
                            <span className={styles.toolDesc}>{res.desc}</span>
                          </div>
                        </a>
                      ) : (
                        <Link
                          key={res.label}
                          to={res.to}
                          className={styles.resourceItem}
                          onClick={() => setResourcesDropdownOpen(false)}
                        >
                          <div className={styles.resIconWrap}>
                            <ResIcon size={15} />
                          </div>
                          <div className={styles.toolMeta}>
                            <strong className={styles.toolTitle}>{res.label}</strong>
                            <span className={styles.toolDesc}>{res.desc}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className={styles.dropdownFooter}>
                    <button
                      type="button"
                      className={styles.footerResourcesBtn}
                      onClick={() => handleAnchorNav('resources')}
                    >
                      Browse Resource Hub <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          </ul>
        </nav>

        {/* Right Side: Search & All Tools CTA */}
        <div className={styles.rightActions}>
          <button
            type="button"
            className={styles.searchButton}
            onClick={() => setSearchOpen(true)}
            aria-label="Search image tools"
            title="Search tools (Press /)"
          >
            <Search size={16} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Quick Search Modal */}
      {searchOpen && (
        <div className={styles.searchBackdrop} onClick={() => setSearchOpen(false)}>
          <div className={styles.searchModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.searchHeader}>
              <Search size={18} className={styles.searchModalIcon} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tools, formats (e.g. JPG, Resize, WebP, PNG)..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className={styles.searchCloseBtn}
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.searchResults}>
              <div className={styles.resultsLabel}>
                {searchQuery.trim() ? `Search Results (${filteredSearchTools.length})` : 'Popular Tools'}
              </div>
              <ul className={styles.resultsList}>
                {filteredSearchTools.length > 0 ? (
                  filteredSearchTools.map((tool) => (
                    <li key={tool.title}>
                      <Link
                        to={tool.path}
                        className={styles.resultItem}
                        onClick={() => setSearchOpen(false)}
                      >
                        <div className={styles.resultMain}>
                          <span className={styles.resultTitle}>{tool.title}</span>
                          <span className={styles.resultBadge}>{tool.category}</span>
                        </div>
                        <ArrowRight size={14} className={styles.resultArrow} />
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className={styles.noResults}>No image tools found for "{searchQuery}"</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className={styles.mobileDrawer}>
          <div className={styles.mobileDrawerInner}>
            {/* Quick Search trigger on mobile */}
            <div className={styles.mobileSearchWrap}>
              <Search size={16} className={styles.mobileSearchIcon} />
              <input
                type="text"
                placeholder="Search image tools..."
                className={styles.mobileSearchInput}
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                readOnly
              />
            </div>

            {/* Mobile Navigation Links */}
            <div className={styles.mobileNavLinks}>
              <Link
                to={ROUTES.convert}
                className={styles.mobileNavLink}
                onClick={() => setMenuOpen(false)}
              >
                <Image size={18} className={styles.mobileNavIcon} />
                <span>Convert Image</span>
              </Link>

              <div className={styles.mobileSectionHeader}>Image Tools</div>
              <div className={styles.mobileToolsGrid}>
                {IMAGE_TOOLS_LIST.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.label}
                      to={tool.to}
                      className={styles.mobileToolItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ToolIcon size={15} className={styles.mobileToolIcon} />
                      <span>{tool.label}</span>
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                className={styles.mobileNavLink}
                onClick={() => handleAnchorNav('why-choose-us')}
              >
                <Sparkles size={18} className={styles.mobileNavIcon} />
                <span>Features</span>
              </button>

              <div className={styles.mobileSectionHeader}>Resources</div>
              <div className={styles.mobileToolsGrid}>
                {RESOURCES_LIST.map((res) => {
                  const ResIcon = res.icon;
                  return res.external ? (
                    <a
                      key={res.label}
                      href={res.to}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.mobileToolItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ResIcon size={15} className={styles.mobileToolIcon} />
                      <span>{res.label}</span>
                    </a>
                  ) : (
                    <Link
                      key={res.label}
                      to={res.to}
                      className={styles.mobileToolItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ResIcon size={15} className={styles.mobileToolIcon} />
                      <span>{res.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className={styles.mobileDrawerFooter}>
              <button
                type="button"
                className={styles.mobileAllToolsBtn}
                onClick={() => handleAnchorNav('image-tools')}
              >
                <Grid3x3 size={16} />
                <span>Explore All Tools</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
