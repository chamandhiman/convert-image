import styles from './CleanContent.module.css';

function CleanContent() {
  const features = [
    {
      title: 'Remove EXIF Data',
      desc: 'Strip all standard EXIF metadata blocks, including timestamps, exposure settings, camera make/model, and editing software tags.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
    },
    {
      title: 'GPS Location Removal',
      desc: 'Remove precise latitude, longitude, and altitude coordinates embedded by smartphones and GPS-enabled cameras.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="12" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      title: 'Device Info Stripping',
      desc: 'Clean hidden device identifiers, serial numbers, firmware versions, lens specifications, and camera settings.',
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
    {
      title: 'Clean Copies',
      desc: 'Generate a fresh, privacy-safe copy of your image locally in your browser. No uploads, no cloud processing.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Upload images',
      desc: 'Drag and drop or browse to select the images you want to inspect and clean.',
    },
    {
      step: '02',
      title: 'Inspect metadata',
      desc: 'Review detected EXIF, GPS, device info, timestamps, and camera settings before cleaning.',
    },
    {
      step: '03',
      title: 'Download cleaned',
      desc: 'Get a fresh, metadata-free copy of your image instantly. No server uploads required.',
    },
  ];

  const removals = [
    {
      title: 'EXIF Metadata',
      desc: 'Standard EXIF blocks including timestamps, exposure settings, camera make/model, lens info, and editing software tags.',
      color: '#6366f1',
    },
    {
      title: 'GPS Coordinates',
      desc: 'Precise latitude, longitude, and altitude coordinates embedded by smartphones and GPS-enabled cameras.',
      color: '#06b6d4',
    },
    {
      title: 'Camera Information',
      desc: 'Device serial numbers, firmware versions, lens specifications, and camera settings hidden in image headers.',
      color: '#8b5cf6',
    },
    {
      title: 'Thumbnails',
      desc: 'Embedded low-resolution preview copies and hidden preview images stored inside the file header.',
      color: '#f59e0b',
    },
    {
      title: 'Orientation & Timestamps',
      desc: 'Image rotation flags, creation dates, digitization timestamps, and modification history.',
      color: '#10b981',
    },
    {
      title: 'Maker Notes',
      desc: 'Proprietary manufacturer binary blobs and non-standard hidden metadata blocks are discarded by fresh re-encoding.',
      color: '#ef4444',
    },
  ];

  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-label="Image Privacy Cleaner banner">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>Privacy & Security</div>
          <h2 className={styles.heroTitle}>Image Privacy Cleaner</h2>
          <p className={styles.heroLead}>
            Remove hidden metadata from your images instantly. Strip EXIF, GPS, and device information locally in your browser.
          </p>
          <div className={styles.heroCtas}>
            <a href="#tool" className={styles.heroPrimary}>Clean Images</a>
            <a href="#what-gets-removed" className={styles.heroSecondary}>Learn More</a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Features Grid                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} id="features" aria-labelledby="features-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="features-heading" className={styles.sectionTitle}>Privacy-first image cleaning</h2>
            <p className={styles.sectionLead}>
              Remove sensitive metadata from your images with powerful, browser-based tools designed for privacy.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {features.map((feature) => (
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
      {/*  What Gets Removed — Full Width                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.sectionAlt} id="what-gets-removed" aria-labelledby="removals-heading">
        <div className="container contentFullWidth">
          <div className={styles.sectionHeader}>
            <h2 id="removals-heading" className={styles.sectionTitle}>What Gets Removed</h2>
            <p className={styles.sectionLead}>
              Our cleaner strips all hidden metadata from your images, ensuring your privacy is fully protected.
            </p>
          </div>

          <div className={styles.removalGrid}>
            {removals.map((item) => (
              <div key={item.title} className={styles.removalCard}>
                <div className={styles.removalAccent} style={{ backgroundColor: item.color }} />
                <h3 className={styles.removalTitle}>{item.title}</h3>
                <p className={styles.removalDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  How It Works — Three Steps                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} id="how-it-works" aria-labelledby="how-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="how-heading" className={styles.sectionTitle}>How it works</h2>
            <p className={styles.sectionLead}>
              Clean your images in three simple steps. No account required.
            </p>
          </div>

          <div className={styles.stepGrid}>
            {steps.map((item) => (
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
      {/*  FAQ                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.sectionAlt} id="faq" aria-labelledby="faq-heading">
        <div className={styles.faqInner}>
          <div className={styles.sectionHeader}>
            <h2 id="faq-heading" className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={styles.sectionLead}>
              Learn more about image metadata, privacy, and how our cleaner protects your information.
            </p>
          </div>

          <div className={styles.faqList}>
            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>What is image metadata?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Image metadata is hidden information embedded inside a picture file by cameras, phones, and software.
                It commonly includes the date and time taken, camera model, GPS coordinates, and editing software names.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Can photos contain my location?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Yes. If location services were active when the picture was taken on a phone or camera, exact latitude,
                longitude, and altitude coordinates are frequently embedded in the file's EXIF GPS block.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Does every image contain GPS data?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                No. Screenshots, downloaded web images, and photos taken with location permissions disabled generally
                do not contain GPS data. The inspector clearly identifies whether location data is detected in your file.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Does this tool upload my image?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                No. All inspection, decoding, and clean copy generation execute entirely on your device using client-side
                JavaScript and the HTML5 Canvas API. Nothing is uploaded to any server.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Does cleaning metadata reduce image quality?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                If you choose PNG, the clean copy is 100% lossless. If you choose JPEG or WebP, a high quality setting
                (90%) is applied by default, keeping the picture visually identical to the original while ensuring all
                metadata headers are discarded.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Does this remove GPS information?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Yes. Generating a new canvas image copy leaves behind all original EXIF segments, including GPS coordinates,
                location names, and elevation data.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Does this remove camera information?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Yes. Camera make, model, lens parameters, serial numbers, and exposure settings are not included in the
                newly encoded clean image.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Can every type of metadata be detected?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Our inspector scans standard EXIF, GPS, camera, timestamp, and container text blocks. Proprietary encrypted
                camera manufacturer tags may not be individually decipherable, but the cleaning process removes them
                regardless by re-encoding a fresh image.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Does cleaning an image change its dimensions?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                No. The clean copy retains the exact native width and height in pixels of your original image.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>What formats are supported?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                You can inspect and clean JPEG, PNG, WebP, AVIF, and GIF files.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CleanContent;
