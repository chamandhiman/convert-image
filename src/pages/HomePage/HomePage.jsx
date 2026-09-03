import { Link } from 'react-router-dom';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { site } from '@/config/site';
import { ROUTES } from '@/routes/paths';

import styles from './HomePage.module.css';

/**
 * Landing page.
 *
 * Introduces the product value proposition and highlights the three core
 * benefits: privacy, speed, and broad format support. No image-tool UI here —
 * individual converters will be added as separate routes.
 */
function HomePage() {
  useDocumentTitle(null); /* site name only */

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={`container ${styles.heroInner}`}>
          <span className={styles.badge}>100 % client-side</span>

          <h1 id="hero-heading" className={styles.heroTitle}>
            Convert images,{' '}
            <span className={styles.heroAccent}>right in your browser</span>
          </h1>

          <p className={styles.heroLead}>{site.description}</p>

          <div className={styles.heroCta}>
            <span className={styles.pill}>PNG</span>
            <span className={styles.pill}>JPEG</span>
            <span className={styles.pill}>WebP</span>
            <span className={styles.pill}>AVIF</span>
            <span className={styles.pill}>SVG</span>
            <span className={styles.pill}>GIF</span>
            <span className={styles.pillMore}>+ more</span>
          </div>
        </div>

        {/* Decorative gradient blob */}
        <div className={styles.heroBg} aria-hidden="true" />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Tools                                                              */}
      {/* ------------------------------------------------------------------ */}
      <section className={`section ${styles.tools}`} aria-labelledby="tools-heading">
        <div className="container">
          <h2 id="tools-heading" className={styles.sectionTitle}>
            Tools
          </h2>
          <p className={styles.sectionLead}>
            Choose a tool to get started — more coming soon.
          </p>

          <ul className={styles.toolGrid} role="list">
            <li>
              <Link to={ROUTES.objectRemover} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
                    <path d="m5 2 5 5" />
                    <path d="M2 13h15" />
                    <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>AI Object Remover</h3>
                  <p className={styles.toolDesc}>
                    Erase unwanted objects, photobombers, text, or clutter naturally
                    using deep neural inpainting directly in your browser.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.upscaler} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>AI Image Upscaler</h3>
                  <p className={styles.toolDesc}>
                    Upscale images 2× or 4× with neural super-resolution to increase
                    resolution and enhance fine details.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.imageExtender} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6" />
                    <path d="M9 21H3v-6" />
                    <path d="M21 3l-7 7" />
                    <path d="M3 21l7-7" />
                    <rect x="7" y="7" width="10" height="10" rx="1" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>AI Image Extender</h3>
                  <p className={styles.toolDesc}>
                    Expand borders into 16:9, 4:5, or custom canvas sizes with neural
                    outpainting running locally in your browser.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.photoRestorer} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>AI Photo Restorer</h3>
                  <p className={styles.toolDesc}>
                    Restore old, blurry, damaged, or faded photos with neural deblurring
                    and dynamic range recovery.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.generativeFill} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9.06 11.9 8.04-8.05a2.85 2.85 0 0 1 4.03 4.03l-8.04 8.04" />
                    <path d="M7.07 14.94c-1.66 0-3 1.34-3 3 0 1.25.77 2.32 1.86 2.76.35.14.64.44.75.8.31 1.05 1.31 1.74 2.45 1.5 1.34-.28 2.07-1.74 1.44-2.94-.39-.75-.32-1.68.22-2.36l.91-.91-4.63-1.85z" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>AI Generative Fill</h3>
                  <p className={styles.toolDesc}>
                    Select an area and generate new context-aware content from text
                    descriptions directly in your browser.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.removeBackground} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>Remove Background</h3>
                  <p className={styles.toolDesc}>
                    Instantly isolate subjects and export clean transparent PNG cutouts
                    directly in your browser.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.analyze} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>Image Quality Analyzer</h3>
                  <p className={styles.toolDesc}>
                    Understand your image and get practical recommendations before
                    you upload or share it.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.optimize} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>Smart Image Optimizer</h3>
                  <p className={styles.toolDesc}>
                    Optimize an image based on how you plan to use it. Smart
                    settings, simple controls.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.compress} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>Compress Image</h3>
                  <p className={styles.toolDesc}>
                    Reduce file size while keeping quality. Adjust compression
                    level and output format.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.convert} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>Convert Image</h3>
                  <p className={styles.toolDesc}>
                    Convert between JPG, PNG, WebP, AVIF, GIF, and SVG formats
                    directly in your browser.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.resize} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>Resize Image</h3>
                  <p className={styles.toolDesc}>
                    Change image dimensions by exact pixels or percentage with aspect
                    ratio lock.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link to={ROUTES.clean} className={styles.toolCard}>
                <div className={styles.toolIcon} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.toolTitle}>Image Privacy Cleaner</h3>
                  <p className={styles.toolDesc}>
                    Create a cleaner copy of an image before sharing it.
                  </p>
                </div>
                <span className={styles.toolArrow} aria-hidden="true">→</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Features                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className={`section ${styles.features}`} aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="visually-hidden">
            Why Convert Image
          </h2>

          <ul className={styles.featureGrid} role="list">
            <li className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Completely private</h3>
              <p className={styles.featureDesc}>
                Your images never leave your device. No uploads, no servers, no
                third-party access — conversion happens entirely in your browser.
              </p>
            </li>

            <li className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Instant results</h3>
              <p className={styles.featureDesc}>
                Powered by modern browser APIs, conversions complete in
                milliseconds. No waiting for uploads or server processing.
              </p>
            </li>

            <li className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Every format you need</h3>
              <p className={styles.featureDesc}>
                Convert between PNG, JPEG, WebP, AVIF, SVG, GIF and more.
                Fine-tune quality, dimensions and metadata before downloading.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  How it works                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={`section ${styles.howItWorks}`} aria-labelledby="how-heading">
        <div className={`container ${styles.howInner}`}>
          <h2 id="how-heading" className={styles.sectionTitle}>
            How it works
          </h2>
          <p className={styles.sectionLead}>
            Three steps. No account required.
          </p>

          <ol className={styles.steps} role="list">
            <li className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <h3 className={styles.stepTitle}>Drop your image</h3>
                <p className={styles.stepDesc}>
                  Drag and drop a file or use the file picker — we accept all
                  common raster and vector formats.
                </p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <h3 className={styles.stepTitle}>Choose your output</h3>
                <p className={styles.stepDesc}>
                  Select the target format and adjust quality or size settings
                  to fit your needs.
                </p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <h3 className={styles.stepTitle}>Download instantly</h3>
                <p className={styles.stepDesc}>
                  Your converted image is ready immediately — download it with
                  one click.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}

export default HomePage;
