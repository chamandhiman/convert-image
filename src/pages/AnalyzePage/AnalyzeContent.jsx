import styles from './AnalyzeContent.module.css';

function AnalyzeContent() {
  const features = [
    {
      title: 'Dimension Check',
      desc: 'Inspect exact pixel width, height, aspect ratio, and total megapixels to ensure your image fits its intended display context.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="3" y1="9" x2="21" y2="9" />
        </svg>
      ),
    },
    {
      title: 'Format Analysis',
      desc: 'Detect MIME type, compression profile, and container efficiency. Know whether your image is saved in the optimal format.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      title: 'Quality Metrics',
      desc: 'Evaluate file size, alpha transparency, lossless vs lossy encoding, and color space to judge practical quality at a glance.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor" opacity="0.3" />
        </svg>
      ),
    },
    {
      title: 'Smart Recommendations',
      desc: 'Get actionable next steps — optimize, compress, resize, or convert — with direct links to the right tool for your image.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Upload image',
      desc: 'Drag and drop or browse to upload any image. We accept JPG, PNG, WebP, AVIF, GIF, and SVG up to 50 MB.',
    },
    {
      step: '02',
      title: 'Analyze quality',
      desc: 'The tool inspects dimensions, file size, format, transparency, and compression profile in milliseconds.',
    },
    {
      step: '03',
      title: 'Get recommendations',
      desc: 'Receive a readiness score and suggested next steps — optimize, compress, resize, or convert — with one click.',
    },
  ];

  const whatWeAnalyze = [
    { title: 'Dimensions & Resolution', desc: 'Width, height, aspect ratio, and total megapixels to confirm the image matches its display or print requirements.' },
    { title: 'File Size', desc: 'Exact byte count and formatted size to evaluate load-time impact and bandwidth consumption.' },
    { title: 'Format & MIME Type', desc: 'Container format detection (JPG, PNG, WebP, AVIF, GIF, SVG) with guidance on format suitability.' },
    { title: 'Compression Profile', desc: 'Whether the image uses lossless or lossy encoding, and how efficiently the data is packed.' },
    { title: 'Color & Transparency', desc: 'Alpha channel presence, color space, and whether transparency is preserved or wasted.' },
    { title: 'Use-Case Readiness', desc: 'A practical score for websites, email, social media, or print with specific thresholds and recommendations.' },
  ];

  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-label="Image Quality Analyzer banner">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>Technical Diagnostics</div>
          <h2 className={styles.heroTitle}>Image Quality Analyzer</h2>
          <p className={styles.heroLead}>
            Inspect image dimensions, resolution, file weight, and format efficiency.
            Get practical, honest recommendations without automated guesswork.
          </p>
          <div className={styles.heroCtas}>
            <a href="#tool" className={styles.heroPrimary}>Analyze an Image</a>
            <a href="#features" className={styles.heroSecondary}>Learn More</a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Features Grid                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} id="features" aria-labelledby="features-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="features-heading" className={styles.sectionTitle}>Everything you need to diagnose your images</h2>
            <p className={styles.sectionLead}>
              Accurate measurements, format insights, and practical recommendations built for everyday image workflows.
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
      {/*  What We Analyze                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.sectionAlt} id="what-we-analyze" aria-labelledby="analyze-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="analyze-heading" className={styles.sectionTitle}>What we analyze</h2>
            <p className={styles.sectionLead}>
              A complete technical inspection of every image you upload.
            </p>
          </div>

          <div className={styles.formatGrid}>
            {whatWeAnalyze.map((item) => (
              <div key={item.title} className={styles.formatCard}>
                <div className={styles.formatAccent} />
                <h3 className={styles.formatTitle}>{item.title}</h3>
                <p className={styles.formatDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  How It Works                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} id="how-it-works" aria-labelledby="how-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="how-heading" className={styles.sectionTitle}>How it works</h2>
            <p className={styles.sectionLead}>
              Diagnose your images in three simple steps. No account required.
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
              Everything you need to know about technical image analysis.
            </p>
          </div>

          <div className={styles.faqList}>
            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>What does the Image Quality Analyzer check?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                It measures exact pixel dimensions, aspect ratio, total megapixels, file byte weight,
                MIME format, alpha transparency presence, and evaluates readiness for specific uses like
                websites, email, social media, and print.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Can it tell whether an image looks good?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                No automated tool can judge artistic merit. Instead, this analyzer provides honest
                technical metrics—telling you whether the resolution is high enough, whether the file is
                too heavy, and what practical steps will optimize it.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>What is image resolution?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Resolution describes the total number of pixels in the image matrix (width multiplied by
                height). More pixels allow an image to be displayed larger or printed clearer without
                looking fuzzy.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Is a larger image always better?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                No. Having more pixels than your destination requires wastes device memory, slows page
                loading, and burns mobile data without providing any visual benefit on screen.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>What file size is good for a website?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                As a general rule, aim for under 350 KB for large hero images, and under 150 KB for
                standard content photos and thumbnails.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Should I use JPG or WebP?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                WebP is superior for websites and web apps, delivering 25%–35% smaller files with built-in
                transparency support. JPEG remains best for email templates and legacy software.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Does analyzing an image upload it?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Never. All processing and measurements occur 100% locally on your computer or phone using
                standard client-side browser APIs.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Can the analyzer fix my image?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                The analyzer diagnoses your image and provides direct 1-click action buttons that carry
                your image into our specialized Optimizer, Compressor, Resizer, or Converter tools.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>What should I do if my image is too large?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Click the &quot;Optimize for Website&quot; or &quot;Compress Image&quot; button. Our tools will downscale the
                dimensions and apply modern lossy encoding to reduce the file size.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Can I optimize the image after analyzing it?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Yes. Clicking any of the recommended action buttons transfers your active image into the
                corresponding tool in browser memory without requiring you to re-upload.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AnalyzeContent;
