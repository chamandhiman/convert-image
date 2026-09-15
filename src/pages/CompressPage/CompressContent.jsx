import styles from './CompressContent.module.css';

function CompressContent() {
  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-label="Compress images online banner">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>Free · In-Browser</div>
          <h2 className={styles.heroTitle}>Compress Images Online</h2>
          <p className={styles.heroLead}>
            Reduce image file size instantly while preserving visual quality.
            Fast, free and completely private — your photos never leave your device.
          </p>
          <div className={styles.heroCtas}>
            <a href="#tool" className={styles.heroPrimary}>Start Compressing</a>
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
            <h2 id="features-heading" className={styles.sectionTitle}>Why compress images with us</h2>
            <p className={styles.sectionLead}>
              Powerful compression that respects your privacy and your time.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {[
              {
                title: 'Reduce File Size',
                desc: 'Shrink JPEG, PNG, WebP and more without noticeable quality loss.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3v18M3 12h18" />
                  </svg>
                ),
              },
              {
                title: 'Fast & Private',
                desc: 'All compression happens locally in your browser. No uploads, no servers.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
              },
              {
                title: 'Batch Processing',
                desc: 'Compress multiple images at once and download them individually or as a ZIP.',
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
                title: 'Maintain Quality',
                desc: 'Fine-tune compression levels to balance file size and visual fidelity.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
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
      {/*  How It Works                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.sectionAlt} id="how-it-works" aria-labelledby="how-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="how-heading" className={styles.sectionTitle}>How it works</h2>
            <p className={styles.sectionLead}>
              Compress your images in three simple steps. No account required.
            </p>
          </div>

          <div className={styles.stepGrid}>
            {[
              {
                step: '01',
                title: 'Upload images',
                desc: 'Drag and drop or browse to upload your images. We support JPEG, PNG, WebP, GIF and SVG.',
              },
              {
                step: '02',
                title: 'Choose settings',
                desc: 'Select your desired output format and adjust the quality level to balance size and clarity.',
              },
              {
                step: '03',
                title: 'Download compressed',
                desc: 'Download your optimized images individually or grab all results as a ZIP archive.',
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
      {/*  Supported Formats                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} id="formats" aria-labelledby="formats-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="formats-heading" className={styles.sectionTitle}>Supported image formats</h2>
            <p className={styles.sectionLead}>
              Compress and convert between the most common web and print formats.
            </p>
          </div>

          <div className={styles.formatGrid}>
            {[
              {
                title: 'JPEG',
                desc: 'Best for photographs and general-purpose images. Widely compatible and efficient with lossy compression.',
                color: '#6366f1',
              },
              {
                title: 'PNG',
                desc: 'Ideal for graphics, screenshots, and images requiring transparency or lossless quality.',
                color: '#8b5cf6',
              },
              {
                title: 'WebP',
                desc: 'A modern web-friendly format with excellent compression ratios and quality.',
                color: '#06b6d4',
              },
              {
                title: 'GIF',
                desc: 'Commonly used for simple animations and short looping visuals.',
                color: '#f59e0b',
              },
              {
                title: 'SVG',
                desc: 'Vector-based format ideal for logos, icons, and scalable graphics.',
                color: '#10b981',
              },
            ].map((format) => (
              <div key={format.title} className={styles.formatCard}>
                <div className={styles.formatAccent} style={{ backgroundColor: format.color }} />
                <h3 className={styles.formatTitle}>{format.title}</h3>
                <p className={styles.formatDesc}>{format.desc}</p>
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
              Answers to common questions about image compression.
            </p>
          </div>

          <div className={styles.faqList}>
            {[
              {
                q: 'Is there a file size limit?',
                a: 'The tool accepts images up to 50 MB. Because processing runs locally, the practical limit depends on your device\'s available memory rather than a server constraint.',
              },
              {
                q: 'Will compression reduce image quality?',
                a: 'Lossy formats like JPEG and WebP discard some detail to reduce file size. At quality settings of 75% or higher, the difference is usually not noticeable for photographs. PNG output is always lossless — no quality is lost.',
              },
              {
                q: 'Can I compress multiple images at once?',
                a: 'Yes, you can upload and compress multiple images at once. Download them individually or grab all results as a ZIP.',
              },
              {
                q: 'Are my images uploaded anywhere?',
                a: 'No. Everything happens inside your browser using the Canvas API. Your images are never sent to a server, stored remotely, or shared with third parties.',
              },
              {
                q: 'Why did the file get larger after compression?',
                a: 'This can happen when converting from a highly optimised format to a less efficient one — for example, converting a small, optimised JPEG to PNG. It can also occur at very high quality settings. Try lowering the quality or choosing a different output format.',
              },
              {
                q: 'Does this work offline?',
                a: 'Yes. Once the page has loaded, no internet connection is needed. The compression logic runs entirely in your browser.',
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

export default CompressContent;
