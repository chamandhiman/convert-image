import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './ObjectRemoverContent.module.css';

const steps = [
  { title: 'Upload Your Image', desc: 'Drag and drop any JPG, PNG, or WebP photo into the upload area.' },
  { title: 'Brush Over the Object', desc: 'Use the brush tool to paint generously over the unwanted subject. Cover the object completely, including any cast shadows or reflections on the ground.' },
  { title: 'Click "Remove Object"', desc: 'The AI inpainting neural network evaluates the surrounding context and regenerates the covered pixels locally in your browser.' },
  { title: 'Review & Download', desc: 'Drag the interactive comparison divider to inspect the before-and-after result, then download your clean, object-free photo in high quality.' },
];

const features = [
  { title: '100% Private', desc: 'All inpainting runs in your browser via WebAssembly and WebGPU. Your photos never leave your device.', icon: '🔒' },
  { title: 'Neural Inpainting', desc: 'Powered by LaMa with Fast Fourier Convolutions for natural, context-aware background reconstruction.', icon: '🧠' },
  { title: 'Iterative Refinement', desc: 'Paint and remove multiple times for challenging objects. The AI improves with each pass.', icon: '🔄' },
  { title: 'Free Forever', desc: 'No uploads, no cloud costs, no subscriptions. Unlimited object removal in your browser.', icon: '💸' },
];

const useCases = [
  { title: 'Travel Photography', desc: 'Erase photobombers, strangers, cars, and trash cans from iconic travel spots.' },
  { title: 'Real Estate', desc: 'Clean up power cables, utility poles, construction signs, or stray garden hoses from property listings.' },
  { title: 'Portrait Retouching', desc: 'Smoothly erase temporary blemishes, skin flare, lint on clothing, or distracting background elements.' },
  { title: 'E-Commerce', desc: 'Remove price tags, labels, packaging smudges, or camera stand reflections from product photos.' },
];

const faqs = [
  { q: 'Will my photos be uploaded to an external server?', a: 'No. All inpainting calculations are performed directly on your device via client-side WebAssembly. Your images are never sent over the internet or stored anywhere.' },
  { q: 'Why is painting the cast shadow important?', a: 'If you remove a person or object but leave their shadow on the ground, the photo will look unnatural. Brushing over both the object and its cast shadow allows the AI to reconstruct the ground or floor surface naturally.' },
  { q: 'What should I do if a faint outline of the object remains?', a: 'You can simply paint over the faint outline again and click "Remove Object" for a second pass. Iterative inpainting is a great technique for challenging subjects.' },
  { q: 'Does it work with transparent PNG files?', a: 'Yes. If your original image contains alpha transparency, transparency channels outside the painted mask are preserved throughout the export.' },
  { q: 'What image file formats are supported?', a: 'You can upload JPG, JPEG, PNG, and WebP images. Photos up to 4000 pixels in dimension are supported.' },
];

const relatedTools = [
  { name: 'Remove Background', description: 'Isolate subjects and export transparent PNG cutouts instantly.', href: ROUTES.removeBackground },
  { name: 'AI Image Upscaler', description: 'Increase resolution 2× or 4× with neural super-resolution.', href: ROUTES.upscaler },
  { name: 'Compress Image', description: 'Shrink file sizes while maintaining visual quality.', href: ROUTES.compress },
];

function ObjectRemoverContent() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-labelledby="object-remover-heading">
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroBadge}>Object Remover</div>
            <h1 id="object-remover-heading" className={styles.heroTitle}>AI Object Remover</h1>
            <p className={styles.heroLead}>
              Erase unwanted objects, people, or clutter from photos naturally — all in your browser.
            </p>
            <div className={styles.heroCtas}>
              <a href="#how-it-works" className={styles.heroPrimary}>Start Removing</a>
              <a href="#how-it-works" className={styles.heroSecondary}>Learn More</a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  What is AI Object Remover? — Full-width with image                 */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.whatIsSection} aria-labelledby="what-heading">
        <div className="container">
          <div className={styles.whatIsGrid}>
            <div className={styles.whatIsText}>
              <h2 id="what-heading" className={styles.sectionTitle}>What is an AI Object Remover?</h2>
              <p className={styles.sectionLead}>
                Remove unwanted people, wires, text, watermarks, or background clutter using deep neural inpainting.
              </p>
              <div className={styles.prose}>
                <p>
                  An <strong>AI Object Remover</strong> (also called a <em>Magic Eraser</em> or neural inpainting tool)
                  lets you remove unwanted people, tourists, wires, text, watermarks, or background clutter from your photos.
                  Unlike traditional clone stamp or blur brushes that simply smear nearby pixels across the gap, our AI tool
                  uses deep neural inpainting powered by <strong>LaMa (Large Mask Inpainting with Fast Fourier Convolutions)</strong>.
                  It analyzes the broader composition of the image, understands perspective, geometry, and textures, and
                  synthesizes a natural, plausible background that fills in the missing area seamlessly.
                </p>
              </div>
            </div>
            <div className={styles.whatIsVisual} aria-hidden="true">
              <div className={styles.visualPlaceholder}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="m8 11 4 4 4-4" />
                  <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
                </svg>
                <span>Before / After</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  How to Remove an Object                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} aria-labelledby="steps-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="steps-heading" className={styles.sectionTitle}>How to Remove an Object from a Photo</h2>
            <p className={styles.sectionLead}>Remove unwanted elements in four simple steps.</p>
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
      {/*  Why Choose Our Remover                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} aria-labelledby="features-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="features-heading" className={styles.sectionTitle}>Why Choose Our Object Remover</h2>
            <p className={styles.sectionLead}>Built for speed, privacy, and natural-looking results.</p>
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
      {/*  Common Use Cases                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.section} aria-labelledby="usecases-heading">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 id="usecases-heading" className={styles.sectionTitle}>Common Use Cases</h2>
            <p className={styles.sectionLead}>From travel photos to real estate listings.</p>
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
      {/*  Complete Privacy — Full-width gradient                            */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.privacySection} aria-labelledby="privacy-heading">
        <div className="container">
          <div className={styles.prose}>
            <h2 id="privacy-heading" className={styles.headingPrimary}>Complete Privacy with Local Inpainting</h2>
            <p className={styles.paragraph}>
              Many online magic eraser tools upload your personal photographs to remote cloud servers.
              With <strong>Convert Image</strong>, all inpainting computations execute locally in your web browser
              using WebAssembly and WebGPU. Your photos never leave your device, ensuring total privacy for sensitive
              documents, personal media, and private family moments.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FAQ — Left-aligned with icons                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.faqSection} aria-labelledby="faq-heading">
        <div className="container">
          <div className={styles.faqInner}>
            <header className={styles.sectionHeader}>
              <h2 id="faq-heading" className={styles.sectionTitle}>Frequently Asked Questions</h2>
              <p className={styles.sectionLead}>Everything you need to know about removing objects from photos.</p>
            </header>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <details
                  key={faq.q}
                  className={styles.faqItem}
                  open={openIndex === index}
                  onToggle={(e) => setOpenIndex(e.currentTarget.open ? index : null)}
                >
                  <summary>
                    <span className={styles.faqQuestion}>{faq.q}</span>
                    <span className={styles.faqIcon} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </span>
                  </summary>
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

export default ObjectRemoverContent;
