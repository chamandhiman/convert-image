import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './ImageUpscalerContent.module.css';

const steps = [
  { title: 'Upload your photo', desc: 'Drag and drop any JPG, PNG, or WebP image into the upload area.' },
  { title: 'Select upscale factor', desc: 'Choose 2× for faster results or 4× for maximum detail and print-quality output.' },
  { title: 'Compare & Download', desc: 'Inspect the interactive Before/After comparison slider, then download your high-resolution result.' },
];

const features = [
  { title: 'Neural Super-Resolution', desc: 'Powered by Real-ESRGAN to reconstruct realistic fine details and sharpen edges.', icon: '🧠' },
  { title: '100% Private', desc: 'All processing runs in your browser via WebAssembly and WebGPU. Your photos never leave your device.', icon: '🔒' },
  { title: 'Tiled Processing', desc: 'Overlapping tile processing ensures stable memory usage even for large images.', icon: '🧩' },
  { title: 'Free Forever', desc: 'No watermarks, no subscriptions, no uploads. Unlimited AI upscaling in your browser.', icon: '💸' },
];

const useCases = [
  { title: 'Web Graphics', desc: '2× upscale for digital banners, social media posts, and fast previews with excellent clarity.' },
  { title: 'Print Preparation', desc: '4× upscale for preparing photos for physical printing at 300 DPI canvas prints.' },
  { title: 'Archival Restoration', desc: 'Restore low-resolution historical photographs and scanned documents with neural detail synthesis.' },
  { title: 'Digital Art', desc: 'Enhance pixel art, screenshots, and digital illustrations with sharp edges and clean textures.' },
];

const faqs = [
  { q: 'Are my images uploaded to any remote server?', a: 'No. The neural network runs entirely inside your web browser using WebAssembly and WebGPU. Your personal photos never leave your device.' },
  { q: 'Why is the first upscale slightly slower?', a: 'On the first run, your browser downloads the compact 4.6 MB AI model weights into its local cache. Subsequent upscales load the cached model instantly from memory.' },
  { q: 'What is the maximum image resolution I can upscale?', a: 'Because our engine uses overlapping tile processing, it can comfortably process images up to 3000–4000 pixels on most desktop devices without running out of browser memory.' },
  { q: 'How does 2× upscaling work if the neural model is 4×?', a: 'The neural network reconstructs high-frequency details at full 4× resolution, which is then downsampled with high-quality bicubic filtering to 2×. This creates an exceptionally clean, razor-sharp 2× output with no interpolation blur.' },
  { q: 'Is there any watermark or subscription fee?', a: 'No. Convert Image tools are completely free, private, and unlimited. Output files have no watermarks or restrictions.' },
];

const relatedTools = [
  { name: 'Remove Background', description: 'Isolate subjects and export transparent PNG cutouts with browser AI.', href: ROUTES.removeBackground },
  { name: 'Compress Image', description: 'Shrink file size while preserving high visual quality.', href: ROUTES.compress },
  { name: 'Resize Image', description: 'Change pixel dimensions or percentage with aspect ratio lock.', href: ROUTES.resize },
];

function ImageUpscalerContent() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-labelledby="upscaler-heading">
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroBadge}>Flagship Neural Super-Resolution</div>
            <h1 id="upscaler-heading" className={styles.heroTitle}>AI Image Upscaler</h1>
            <p className={styles.heroLead}>
              Increase image resolution and recover sharper detail directly in your browser. 100% private, executed locally.
            </p>
            <div className={styles.heroCtas}>
              <a href="#tool" className={styles.heroPrimary}>Start Upscaling</a>
              <a href="#how-it-works" className={styles.heroSecondary}>Learn More</a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  What is AI Image Upscaling?                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} aria-labelledby="what-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="what-heading" className={styles.sectionTitle}>What is AI Image Upscaling?</h2>
            <p className={styles.sectionLead}>
              Traditional image enlarging stretches pixels using basic interpolation. AI upscaling uses a trained neural network to infer realistic details.
            </p>
          </header>
          <div className={styles.prose}>
            <p>
              Traditional image enlarging stretches existing pixels using basic mathematical interpolation
              such as nearest-neighbor, bilinear, or bicubic scaling. While these methods increase pixel
              dimensions, they inevitably produce soft, blurry edges and pixelated artifacts because they
              cannot reconstruct missing visual information.
            </p>
            <p>
              <strong>AI image upscaling</strong> (deep-learning super-resolution) uses a trained convolutional
              neural network—specifically <em>Real-ESRGAN</em>—to infer realistic fine details, sharpen
              soft contours, suppress JPEG compression noise, and generate high-frequency textures that
              were absent in the lower-resolution source.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  How to Upscale an Image                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} aria-labelledby="steps-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="steps-heading" className={styles.sectionTitle}>How to Upscale an Image</h2>
            <p className={styles.sectionLead}>Increase resolution in three simple steps.</p>
          </header>
          <div className={styles.stepGrid}>
            {steps.map((step, idx) => (
              <div key={idx} className={styles.stepCard}>
                <span className={styles.stepNumber}>0{idx + 1}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Why Choose Our Upscaler                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} aria-labelledby="features-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="features-heading" className={styles.sectionTitle}>Why Choose Our AI Upscaler</h2>
            <p className={styles.sectionLead}>Built for speed, privacy, and exceptional detail preservation.</p>
          </header>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div className={styles.featureIcon} aria-hidden="true">{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  2× vs 4× Upscaling                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} aria-labelledby="compare-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="compare-heading" className={styles.sectionTitle}>2× vs 4× Image Upscaling</h2>
            <p className={styles.sectionLead}>Choose the right scale factor for your intended use.</p>
          </header>
          <div className={styles.formatGrid}>
            <div className={styles.formatCard}>
              <div className={styles.formatAccent} style={{ backgroundColor: 'var(--color-primary)' }} />
              <h3 className={styles.formatTitle}>2× Upscale (Faster)</h3>
              <p className={styles.formatDesc}>
                Doubles width and height (4× total pixels). Ideal for web graphics, digital banners, social media posts, and fast previews. Offers the quickest processing time with excellent clarity.
              </p>
            </div>
            <div className={styles.formatCard}>
              <div className={styles.formatAccent} style={{ backgroundColor: 'var(--color-accent)' }} />
              <h3 className={styles.formatTitle}>4× Upscale (Maximum Detail)</h3>
              <p className={styles.formatDesc}>
                Quadruples width and height (16× total pixels). Best for preparing photos for physical printing (e.g. 300 DPI canvas prints), cropping into fine details, or restoring low-resolution archival photos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Common Use Cases                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} aria-labelledby="usecases-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="usecases-heading" className={styles.sectionTitle}>Common Use Cases</h2>
            <p className={styles.sectionLead}>From web graphics to print preparation.</p>
          </header>
          <div className={styles.formatGrid}>
            {useCases.map((item) => (
              <div key={item.title} className={styles.formatCard}>
                <div className={styles.formatAccent} style={{ backgroundColor: 'var(--color-primary)' }} />
                <h3 className={styles.formatTitle}>{item.title}</h3>
                <p className={styles.formatDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FAQ                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.faqSection} aria-labelledby="faq-heading">
        <div className="container">
          <div className={styles.faqInner}>
            <header className={styles.sectionHeader}>
              <h2 id="faq-heading" className={styles.sectionTitle}>Frequently Asked Questions</h2>
              <p className={styles.sectionLead}>Everything you need to know about AI image upscaling.</p>
            </header>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <details
                  key={faq.q}
                  className={styles.faqItem}
                  open={openIndex === index}
                  onToggle={(e) => setOpenIndex(e.currentTarget.open ? index : null)}
                >
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Related Tools                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.relatedSection} aria-labelledby="related-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="related-heading" className={styles.sectionTitle}>Related Tools</h2>
            <p className={styles.sectionLead}>More free image tools to enhance your workflow.</p>
          </header>
          <div className={styles.relatedGrid}>
            {relatedTools.map((tool) => (
              <Link key={tool.name} to={tool.href} className={styles.relatedCard}>
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
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ImageUpscalerContent;
