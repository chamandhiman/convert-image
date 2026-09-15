import styles from './ResizeContent.module.css';

function ResizeContent() {
  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-label="Resize images online banner">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>Free · In-Browser</div>
          <h2 className={styles.heroTitle}>Resize Images Online</h2>
          <p className={styles.heroLead}>
            Resize JPG, PNG, WebP, GIF and SVG images by exact pixels or percentage.
            Fast, free and completely private — your photos never leave your device.
          </p>
          <div className={styles.heroCtas}>
            <a href="#tool" className={styles.heroPrimary}>Start Resizing</a>
            <a href="#how-it-works" className={styles.heroSecondary}>Learn More</a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Features Grid                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} id="features" aria-labelledby="features-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="features-heading" className={styles.sectionTitle}>Everything you need to resize images</h2>
            <p className={styles.sectionLead}>
              Resize by exact dimensions, percentage, or batch process multiple images with powerful controls built for everyday workflows.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {[
              {
                title: 'Exact Dimensions',
                desc: 'Set precise pixel width and height to match hero banners, thumbnails, or any fixed layout slot.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                  </svg>
                ),
              },
              {
                title: 'Aspect Ratio Lock',
                desc: 'Lock width and height proportions so images never stretch, squash, or distort during resizing.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
              },
              {
                title: 'Percentage Resize',
                desc: 'Quickly downscale or upscale images by percentage — perfect for reducing large camera captures for email or web.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                ),
              },
              {
                title: 'Batch Processing',
                desc: 'Upload and resize multiple images at once. Download individually or grab all results as a ZIP.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                    <line x1="12" y1="9" x2="12" y2="15" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <span className={styles.featureIcon} aria-hidden="true">{feature.icon}</span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  How It Works — Two Column                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.sectionAlt} id="how-it-works" aria-labelledby="how-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="how-heading" className={styles.sectionTitle}>How it works</h2>
            <p className={styles.sectionLead}>
              Resize your images in three simple steps. No account required.
            </p>
          </div>

          <div className={styles.stepGrid}>
            {[
              {
                step: '01',
                title: 'Upload images',
                desc: 'Drag and drop or browse to upload your images. We support JPG, PNG, WebP, AVIF, GIF and SVG.',
              },
              {
                step: '02',
                title: 'Choose dimensions',
                desc: 'Enter exact pixel width and height or select a percentage scale. Lock aspect ratio to prevent distortion.',
              },
              {
                step: '03',
                title: 'Download resized',
                desc: 'Resized images are ready instantly. Download individually or grab all results as a ZIP archive.',
              },
            ].map((item) => (
              <div key={item.step} className={styles.stepCard}>
                <span className={styles.stepNumber}>{item.step}</span>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Use Cases                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} id="use-cases" aria-labelledby="usecases-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="usecases-heading" className={styles.sectionTitle}>Common use cases</h2>
            <p className={styles.sectionLead}>
              From web performance to social media and print, resizing is essential for every image workflow.
            </p>
          </div>

          <div className={styles.useCaseGrid}>
            {[
              {
                title: 'Web',
                desc: 'Resize hero banners, blog images, and card thumbnails to exact pixel widths for fast page loads and zero layout shift.',
                color: '#345ef8',
              },
              {
                title: 'Social Media',
                desc: 'Crop and resize cover photos, posts, and story assets to match platform-specific dimensions for LinkedIn, Instagram, and X.',
                color: '#8b5cf6',
              },
              {
                title: 'Print',
                desc: 'Prepare high-resolution images for posters, flyers, and marketing materials at the exact physical dimensions required.',
                color: '#06b6d4',
              },
              {
                title: 'Thumbnails',
                desc: 'Generate consistent small previews for galleries, video players, ecommerce catalogs, and document management systems.',
                color: '#f59e0b',
              },
            ].map((useCase) => (
              <div key={useCase.title} className={styles.useCaseCard}>
                <div className={styles.useCaseAccent} style={{ backgroundColor: useCase.color }} />
                <h3 className={styles.useCaseTitle}>{useCase.title}</h3>
                <p className={styles.useCaseDesc}>{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FAQ                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.sectionAlt} id="faq" aria-labelledby="faq-heading">
        <div className={styles.faqInner}>
          <div className={styles.sectionHeader}>
            <h2 id="faq-heading" className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={styles.sectionLead}>
              Answers to common questions about resizing images online.
            </p>
          </div>

          <div className={styles.faqList}>
            {[
              {
                q: 'Can I resize an image without losing quality?',
                a: 'When downscaling, modern interpolation algorithms blend pixels seamlessly, preserving sharp details. When upscaling, the browser must extrapolate new pixels, which can cause slight softness.',
              },
              {
                q: 'What happens when I lock the aspect ratio?',
                a: 'Locking the aspect ratio preserves the exact width-to-height proportion. Changing the width automatically updates the height to match, preventing distortion or stretching.',
              },
              {
                q: 'What is the difference between resizing and compressing?',
                a: 'Resizing changes pixel dimensions (width × height). Compressing optimizes how pixel data is stored without changing dimensions. Combining both yields the smallest file sizes.',
              },
              {
                q: 'Can I make an image larger?',
                a: 'Yes. Enter larger pixel dimensions or select percentages above 100%. Keep in mind that enlarging raster images cannot add original detail, so slight softness is natural.',
              },
              {
                q: 'Does resizing change the image file size?',
                a: 'Yes, dramatically. Reducing dimensions directly reduces the number of pixels stored, so downscaling typically results in significant file size reductions.',
              },
              {
                q: 'Are my images uploaded to any server?',
                a: 'No. Everything executes client-side in your browser via the Canvas API. Your images never leave your device.',
              },
            ].map((item) => (
              <details key={item.q} className={styles.faqItem}>
                <summary>
                  <span className={styles.faqQuestion}>{item.q}</span>
                  <span className={styles.faqIcon} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ResizeContent;
