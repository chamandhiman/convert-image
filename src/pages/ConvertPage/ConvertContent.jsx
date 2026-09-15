import React, { useState } from 'react';

import styles from './ConvertContent.module.css';

const convertFormats = [
  { name: 'JPG / JPEG', color: '#3b82f6', description: 'Best for photos and realistic images with millions of colors.' },
  { name: 'PNG', color: '#10b981', description: 'Ideal for graphics, logos, and images requiring transparency.' },
  { name: 'WebP', color: '#8b5cf6', description: 'Modern format with excellent compression and quality balance.' },
  { name: 'GIF', color: '#f59e0b', description: 'Supports animations and is widely compatible across platforms.' },
  { name: 'SVG', color: '#ec4899', description: 'Scalable vector format perfect for logos and illustrations.' },
  { name: 'AVIF', color: '#ef4444', description: 'Next-generation format with superior compression efficiency.' },
  { name: 'ICO', color: '#6366f1', description: 'Windows icon format for favicons and desktop shortcuts.' },
  { name: 'BMP', color: '#14b8a6', description: 'Uncompressed bitmap format with simple, wide compatibility.' },
];

const features = [
  { title: '100% Private', description: 'All conversions happen in your browser. Your images never leave your device.', icon: '🔒' },
  { title: 'Lightning Fast', description: 'Convert images in milliseconds using optimized browser APIs with no server uploads.', icon: '⚡' },
  { title: 'Batch Support', description: 'Upload multiple images and convert them all at once with consistent settings.', icon: '📦' },
  { title: 'Free Forever', description: 'No hidden charges, watermarks, or account required. Unlimited conversions.', icon: '💸' },
];

const steps = [
  { number: '01', title: 'Upload', description: 'Drag and drop your images or click to browse. We support JPG, PNG, WebP, GIF, SVG, and more.' },
  { number: '02', title: 'Convert', description: 'Choose your target format and settings. Adjust quality, resize, or apply basic edits if needed.' },
  { number: '03', title: 'Download', description: 'Get your converted images instantly. Download individually or as a ZIP archive.' },
];

const faqs = [
  { question: 'Is this image converter really free?', answer: 'Yes, absolutely. There are no hidden fees, subscription tiers, or usage limits. All conversions are processed locally in your browser, so we don\'t incur server costs that we\'d need to pass on to you.' },
  { question: 'Are my images private and secure?', answer: 'Completely. All image processing happens in your browser using client-side JavaScript. Your files are never uploaded to any server, ensuring complete privacy and security.' },
  { question: 'What image formats are supported?', answer: 'We support JPG, PNG, WebP, GIF, SVG, AVIF, ICO, and BMP. You can convert between any of these formats, though some conversions may have limitations based on format capabilities (e.g., vector formats like SVG can\'t be converted to raster formats).' },
  { question: 'How can I convert multiple images at once?', answer: 'Simply select or drag multiple files into the upload area. The converter will process all images with the same settings and allow you to download them individually or as a ZIP archive.' },
  { question: 'Does converting affect image quality?', answer: 'Lossless conversions (like PNG to PNG or WebP to WebP) maintain original quality. Lossy conversions (like JPG to WebP) allow quality adjustment. We use optimized algorithms to preserve as much quality as possible.' },
  { question: 'Can I use this on mobile devices?', answer: 'Yes, the converter works on all modern mobile browsers. The interface is responsive and optimized for touch interaction, so you can convert images on your phone or tablet.' },
];

const relatedTools = [
  { name: 'Resize Images', description: 'Resize and crop images while maintaining aspect ratio and quality.', href: '/resize' },
  { name: 'Compress Images', description: 'Reduce file size without noticeable quality loss for faster loading.', href: '/compress' },
  { name: 'Image Editor', description: 'Basic editing tools including filters, adjustments, and annotations.', href: '/edit' },
];

export default function ConvertContent() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className={styles.page}>
      <section className={styles.heroBanner} aria-labelledby="convert-heading">
        <div className="container">
          <div className={styles.heroInner}>
            <span className={styles.heroBadge}>Free · In-Browser</span>
            <h1 id="convert-heading" className={styles.heroTitle}>Convert Images Online</h1>
            <p className={styles.heroLead}>
              Convert JPG, PNG, WebP, GIF and SVG images locally in your browser. Fast, free and completely private.
            </p>
            <div className={styles.heroCtas}>
              <a href="#top" className={styles.heroPrimary}>Start Converting</a>
              <a href="#how-it-works" className={styles.heroSecondary}>See How It Works</a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="formats-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="formats-heading" className={styles.sectionTitle}>Supported Formats</h2>
            <p className={styles.sectionLead}>Convert between all popular image formats with support for transparency, animation, and vector graphics.</p>
          </header>
          <div className={styles.formatGrid}>
            {convertFormats.map((format) => (
              <div key={format.name} className={styles.formatCard}>
                <div className={styles.formatAccent} style={{ backgroundColor: format.color }} />
                <h3 className={styles.formatTitle}>{format.name}</h3>
                <p className={styles.formatDesc}>{format.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt} aria-labelledby="features-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="features-heading" className={styles.sectionTitle}>Why Choose Our Converter</h2>
            <p className={styles.sectionLead}>Built for speed, privacy, and simplicity. No uploads, no waiting, no compromises.</p>
          </header>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div className={styles.featureIcon} aria-hidden="true">{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="how-it-works" aria-labelledby="how-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="how-heading" className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionLead}>Convert your images in three simple steps. No registration or software installation required.</p>
          </header>
          <div className={styles.stepGrid}>
            {steps.map((step) => (
              <div key={step.number} className={styles.stepCard}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-heading">
        <div className="container">
          <div className={styles.faqInner}>
            <header className={styles.sectionHeader}>
              <h2 id="faq-heading" className={styles.sectionTitle}>Frequently Asked Questions</h2>
              <p className={styles.sectionLead}>Everything you need to know about converting images online.</p>
            </header>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <details
                  key={faq.question}
                  className={styles.faqItem}
                  open={openIndex === index}
                  onToggle={(e) => setOpenIndex(e.currentTarget.open ? index : null)}
                >
                  <summary>
                    <span className={styles.faqQuestion}>{faq.question}</span>
                    <span className={styles.faqIcon} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.relatedSection} aria-labelledby="related-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="related-heading" className={styles.sectionTitle}>Related Tools</h2>
            <p className={styles.sectionLead}>More free image tools to enhance your workflow.</p>
          </header>
          <div className={styles.relatedGrid}>
            {relatedTools.map((tool) => (
              <a key={tool.name} href={tool.href} className={styles.relatedCard}>
                <div className={styles.relatedIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" />
                    <path d="m8 11 4 4 4-4" />
                    <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
                  </svg>
                </div>
                <div className={styles.relatedBody}>
                  <span className={styles.relatedName}>{tool.name}</span>
                  <span className={styles.relatedDesc}>{tool.description}</span>
                </div>
                <span className={styles.relatedArrow} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
