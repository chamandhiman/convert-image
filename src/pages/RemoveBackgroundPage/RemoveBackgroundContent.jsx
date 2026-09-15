import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './RemoveBackgroundContent.module.css';

function RemoveBackgroundContent() {
  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-label="Remove backgrounds banner">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>Free · In-Browser</div>
          <h2 className={styles.heroTitle}>Remove backgrounds from images</h2>
          <p className={styles.heroLead}>
            Automatically remove backgrounds from your images and create clean, transparent cutouts directly in your browser.
          </p>
          <div className={styles.heroCtas}>
            <a href="#tool" className={styles.heroPrimary}>Start Removing</a>
            <a href="#how-it-works" className={styles.heroSecondary}>Learn More</a>
          </div>
        </div>
      </section>

      <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>Common uses for background removal</h2>
      <p>
        Removing a background is one of the most versatile photo editing tasks. Here are
        some of the most common ways people use a background remover:
      </p>
      <ul>
        <li>
          <strong>Product photography:</strong> Create clean product shots with a transparent
          background for e-commerce listings, catalogs, and print materials.
        </li>
        <li>
          <strong>Profile photos:</strong> Remove distracting backgrounds from headshots for
          LinkedIn, company directories, and professional websites.
        </li>
        <li>
          <strong>E-commerce listings:</strong> Standardize product images across Amazon,
          eBay, Shopify, and other marketplaces by removing messy backgrounds.
        </li>
        <li>
          <strong>Marketing graphics:</strong> Place cutouts onto banners, flyers, and ads
          without worrying about the original background clashing with your design.
        </li>
        <li>
          <strong>Social media content:</strong> Create eye-catching thumbnails, profile
          images, and post graphics by isolating subjects from their backgrounds.
        </li>
        <li>
          <strong>Presentations:</strong> Drop cutouts into slides and pitch decks that
          need a transparent subject over any background color.
        </li>
        <li>
          <strong>Logos and brand assets:</strong> Isolate logos and icons on a transparent
          background for use across different media and brand applications.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Transparent PNG vs. images with backgrounds</h2>
      <p>
        Transparent PNGs are the universal format for digital graphics that need to sit on
        any background. The PNG format supports alpha transparency, which means parts of the
        image can be fully or partially see-through — something JPG and WebP cannot do.
      </p>
      <p>
        A transparent background is ideal when you need to layer your cutout onto different
        backgrounds later. For example, a product cutout with transparency can be placed on
        white, colored, or photographic backgrounds without any visible edge artifacts.
      </p>
      <p>
        If you don't need transparency, you can also download your result with a solid white
        or black background. This is useful when you need a quick contrast background for
        printing or when working with tools that don't support transparency.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Why use a browser-based background remover?</h2>
      <p>
        Most online background removal tools require you to upload your photos to a remote
        server. This means your personal photos — including portraits, sensitive documents,
        and private moments — are transmitted and stored on third-party servers you don't
        control.
      </p>
      <p>
        Our background remover runs entirely in your browser using local processing. Your
        images never leave your device. This means:
      </p>
      <ul>
        <li>
          <strong>Complete privacy:</strong> Your photos are processed locally and are never
          sent to any external server.
        </li>
        <li>
          <strong>No upload limits:</strong> Work with images up to 25 MB directly on your
          machine, with no bandwidth concerns.
        </li>
        <li>
          <strong>Fast results:</strong> No upload or download waiting times. Once the
          processing model is cached, removals happen in seconds.
        </li>
        <li>
          <strong>Free forever:</strong> No account required, no paywalls, no usage limits.
        </li>
      </ul>

      <section className={styles.faqSection} id="faq" aria-labelledby="faq-heading">
        <div className={styles.faqInner}>
          <h2 id="faq-heading" className={styles.sectionTitle}>Frequently Asked Questions</h2>

          <div className={styles.faqList}>
            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>How does background removal work?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                When you upload an image, our tool uses a machine-learning model that runs directly
                in your browser. The model identifies which pixels belong to the main subject and
                which belong to the background, then removes the background while keeping the
                subject intact with smooth, clean edges.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Is my image uploaded to a server?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                No. Your image is processed entirely in your browser and is never uploaded to any
                server. All processing happens locally on your device.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>What image formats are supported?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                You can upload JPG, PNG, and WebP images up to 25 MB. The result is always
                exported as a PNG file to preserve transparency.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Can I download the result with a transparent background?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Yes. After the background is removed, you can download the result as a transparent
                PNG. You can also choose to add a solid white or black background before
                downloading if you prefer.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Can I remove backgrounds from photos with people?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Yes. The tool works well with photos of people, animals, products, and objects.
                Photos with a clear distinction between the subject and the background produce the
                cleanest edge cutouts.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Is the background remover free?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Yes. The tool is completely free to use with no account required, no hidden costs,
                and no usage limits.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Does it work on mobile devices?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Yes. The tool works on desktop and mobile browsers. On mobile, the processing may
                take slightly longer depending on your device's capabilities, but the results are
                the same quality.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Related Tools                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.moreToolsSection}>
        <h3 className={styles.moreToolsHeading}>Related Tools</h3>
        <p className={styles.moreToolsDesc}>
          Try these other free, browser-based AI image tools:
        </p>
        <div className={styles.toolsLinksGrid}>
          <Link to={ROUTES.removeBackground} className={styles.toolLinkCard}>
            <strong>AI Background Remover</strong>
            <span>Remove image backgrounds automatically with AI.</span>
          </Link>
          <Link to={ROUTES.upscaler} className={styles.toolLinkCard}>
            <strong>AI Image Upscaler</strong>
            <span>Enhance and enlarge your images with AI.</span>
          </Link>
          <Link to={ROUTES.imageExtender} className={styles.toolLinkCard}>
            <strong>AI Image Extender</strong>
            <span>Extend image boundaries and expand your canvas.</span>
          </Link>
          <Link to={ROUTES.generativeFill} className={styles.toolLinkCard}>
            <strong>AI Generative Fill</strong>
            <span>Fill or replace parts of an image with AI.</span>
          </Link>
          <Link to={ROUTES.convert} className={styles.toolLinkCard}>
            <strong>Image Converter</strong>
            <span>Convert between JPG, PNG, WebP, and AVIF formats.</span>
          </Link>
          <Link to={ROUTES.compress} className={styles.toolLinkCard}>
            <strong>Image Compressor</strong>
            <span>Shrink file size while preserving visual quality.</span>
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}

export default RemoveBackgroundContent;
