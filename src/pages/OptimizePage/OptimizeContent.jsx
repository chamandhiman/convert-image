import styles from './OptimizeContent.module.css';

function OptimizeContent() {
  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-label="Smart image optimizer banner">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>Smart & Private</div>
          <h2 className={styles.heroTitle}>Smart Image Optimizer</h2>
          <p className={styles.heroLead}>
            Optimize images for the web, social media, email, and print — all in your browser.
            Faster loads, smaller files, and total privacy.
          </p>
          <div className={styles.heroCtas}>
            <a href="#tool" className={styles.heroPrimary}>Start Optimizing</a>
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
            <h2 id="features-heading" className={styles.sectionTitle}>Powerful optimization, zero uploads</h2>
            <p className={styles.sectionLead}>
              Smart presets, format recommendations, and quality control that help you get the best
              file size without sacrificing visual quality.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {[
              {
                title: 'Smart Recommendations',
                desc: 'Automatically suggests the best format, quality, and dimensions based on your goal.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                ),
              },
              {
                title: 'Format Selection',
                desc: 'Choose from WebP, JPG, PNG, and AVIF — or let the tool pick the optimal format for you.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                ),
              },
              {
                title: 'Quality Control',
                desc: 'Fine-tune compression levels to balance file size and visual clarity with live previews.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.24-4.24l-4.24 4.24M6.34 6.34l-4.24-4.24" />
                  </svg>
                ),
              },
              {
                title: 'Web Optimization',
                desc: 'Reduce file sizes and improve load times for websites, blogs, and e-commerce stores.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
      {/*  Optimization Goals — Two Column                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.sectionAlt} id="goals" aria-labelledby="goals-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="goals-heading" className={styles.sectionTitle}>Optimization goals</h2>
            <p className={styles.sectionLead}>
              Different destinations require different settings. Choose the goal that matches your use case.
            </p>
          </div>

          <div className={styles.goalGrid}>
            {[
              {
                title: 'Web',
                desc: 'Fast-loading images for websites, blogs, and landing pages. Optimized for Core Web Vitals and mobile performance.',
              },
              {
                title: 'Social',
                desc: 'Pre-optimized for LinkedIn, X, Facebook, and Instagram. Prevents harsh platform re-compression and preserves detail.',
              },
              {
                title: 'Email',
                desc: 'Legacy-compatible JPEG and PNG files that display correctly in every major email client and avoid spam filters.',
              },
              {
                title: 'Print',
                desc: 'High-resolution exports suitable for physical printing. Retain detail and color fidelity when moving from screen to paper.',
              },
            ].map((goal) => (
              <div key={goal.title} className={styles.goalCard}>
                <h3 className={styles.goalTitle}>{goal.title}</h3>
                <p className={styles.goalDesc}>{goal.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  How It Works — Three Column                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} id="how-it-works" aria-labelledby="how-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="how-heading" className={styles.sectionTitle}>How it works</h2>
            <p className={styles.sectionLead}>
              Optimize your images in three simple steps. No account required.
            </p>
          </div>

          <div className={styles.stepGrid}>
            {[
              {
                step: '01',
                title: 'Upload images',
                desc: 'Drag and drop or browse to upload your images. Supports JPG, PNG, WebP, GIF, and AVIF.',
              },
              {
                step: '02',
                title: 'Get recommendations',
                desc: 'Choose a smart preset or manually select format, quality, and dimensions to match your goal.',
              },
              {
                step: '03',
                title: 'Download optimized',
                desc: 'Download optimized images individually or grab all results as a ZIP. Fast and free.',
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
      {/*  FAQ                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.sectionAlt} id="faq" aria-labelledby="faq-heading">
        <div className={styles.faqInner}>
          <div className={styles.sectionHeader}>
            <h2 id="faq-heading" className={styles.sectionTitle}>Frequently asked questions</h2>
            <p className={styles.sectionLead}>
              Everything you need to know about smart image optimization.
            </p>
          </div>

          <div className={styles.faqList}>
            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>What does image optimization do?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Image optimization tailors an image&apos;s resolution, dimensions, and encoding algorithms to
                match your specific goal (such as website publishing, email, or social sharing) so that
                the picture loads fast without looking compressed or pixelated.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Which image format should I use?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                For websites, WebP is the recommended modern format. For emails and universal legacy
                compatibility, use JPG. For screenshots and transparent logos, use PNG.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Will optimization reduce image quality?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                When using smart presets (such as Website or Social Media), the reduction in data is
                visually lossless—meaning the human eye cannot distinguish the optimized version from the
                original at normal viewing distances.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Should I use WebP or JPG?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                WebP is superior for modern websites and web applications, offering smaller file sizes
                with built-in transparency support. JPG remains the best choice for email templates and
                older software.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Is a smaller image always better?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                No. Reducing a file size too aggressively introduces blocky digital artifacts and
                smearing. Smart optimization aims for the optimal sweet spot between speed and visual
                clarity.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Why didn&apos;t my image become smaller?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                If your original image was already heavily compressed or if you converted a small JPEG
                into a lossless PNG, the resulting file might be similar in size or slightly larger. The
                tool alerts you when an image is already compact.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Are my images uploaded to any server?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                No. All resizing, format conversion, and compression occur 100% locally inside your web
                browser using the HTML5 Canvas API. Your files never leave your computer or phone.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Why is AVIF unavailable in my browser?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                While most modern browsers can display AVIF pictures, client-side Canvas encoding of AVIF
                is only supported by select browser engines. If your browser does not support AVIF
                encoding, the tool recommends WebP or JPG instead.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Can I control the optimization settings?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                Yes. While smart presets make automatic recommendations based on your goal, you can click
                &quot;Advanced settings&quot; at any time to customize the target format, quality percentage, and
                dimensions.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>
                <span className={styles.faqQuestion}>Does optimization change image dimensions?</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </summary>
              <p>
                If an image is unnecessarily large (such as a 6000 × 4000 px camera photo), the smart
                preset will gently downscale it to a practical resolution (e.g. 1600 px wide for websites)
                while keeping the aspect ratio locked. You can also disable dimension scaling in Advanced
                settings.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OptimizeContent;
