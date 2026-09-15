import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './PhotoRestorerContent.module.css';

const FAQS = [
  {
    q: 'How does AI Photo Restoration work?',
    a: 'AI Photo Restoration combines histogram dynamic range equalization with a deep convolutional neural network (Real-ESRGAN General). The model analyzes blurred, compressed, or faded photo regions and synthesizes sharp edges, natural facial features, and true-to-life textures.',
  },
  {
    q: 'What is the difference between Balanced and Strong restoration?',
    a: 'Balanced restoration removes general lens blur, reduces noise, and restores faded colors naturally while preserving vintage character. Strong restoration runs a deeper neural pass to reconstruct heavily degraded, blurry, or low-resolution historical photographs.',
  },
  {
    q: 'Are my personal photos uploaded to a cloud server?',
    a: 'No. The restoration engine runs 100% inside your web browser using WebGPU hardware acceleration and multi-threaded WebAssembly. Your photos remain completely private on your own device.',
  },
  {
    q: 'What types of photos work best for restoration?',
    a: 'The tool works exceptionally well on old family portraits, vintage scans with faded contrast, blurry smartphone photos, JPEG compression artifacted images, and soft scanned documents.',
  },
  {
    q: 'Which image formats are supported?',
    a: 'You can upload JPG, PNG, and WebP images. Restored photos can be downloaded as lossless PNG or compressed JPG.',
  },
];

function PhotoRestorerContent() {
  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-label="AI Photo Restorer banner">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>AI Restoration</div>
          <h2 className={styles.heroTitle}>AI Photo Restorer</h2>
          <p className={styles.heroLead}>
            Restore old, damaged, blurry, or faded photos directly in your browser. 100% private with WebGPU acceleration.
          </p>
          <div className={styles.heroCtas}>
            <a href="#tool" className={styles.heroPrimary}>Start Restoring</a>
            <a href="#how-it-works" className={styles.heroSecondary}>Learn More</a>
          </div>
        </div>
      </section>

      <section className={styles.contentSection} aria-label="About AI Photo Restoration">
      <article className={styles.article}>
        <h2 className={styles.headingPrimary}>What AI Photo Restoration Does</h2>
        <p className={styles.paragraph}>
          AI Photo Restoration utilizes advanced machine learning to revive old, damaged, 
          blurry, and faded photographs. Rather than applying simple contrast filters, 
          a deep neural network trained on millions of real-world degradation patterns 
          identifies optical defocus, sensor grain, compression artifacts, and color 
          fading to reconstruct realistic high-frequency details.
        </p>

        <h2 className={styles.headingSecondary}>Restore Old &amp; Faded Photos Online</h2>
        <p className={styles.paragraph}>
          Vintage photos often suffer from loss of contrast, yellowed discoloration, 
          and optical softness. Our in-browser restoration engine automatically:
        </p>
        <ul className={styles.highlightList}>
          <li className={styles.highlightItem}>
            <strong>Recovers Dynamic Range &amp; Tone:</strong> Rebalances faded contrast and eliminates aging color casts to bring vibrancy back to vintage prints.
          </li>
          <li className={styles.highlightItem}>
            <strong>Sharpens Blurred Faces &amp; Textures:</strong> Neural deblurring reconstructs eyes, hair, clothing textures, and fine background elements.
          </li>
          <li className={styles.highlightItem}>
            <strong>Eliminates Compression &amp; Noise:</strong> Suppresses JPEG blockiness and high-ISO sensor grain while preserving genuine structural detail.
          </li>
          <li className={styles.highlightItem}>
            <strong>100% Private In-Browser Processing:</strong> Executes completely on your local computer or phone with WebGPU shaders—no photos ever leave your machine.
          </li>
        </ul>

        <h2 className={styles.headingSecondary}>How Photo Restoration Works</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>1</span>
            <h3 className={styles.stepTitle}>Upload Photo</h3>
            <p className={styles.stepDesc}>
              Select any JPG, PNG, or WebP photo from your computer or phone.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>2</span>
            <h3 className={styles.stepTitle}>Choose Strength</h3>
            <p className={styles.stepDesc}>
              Select <strong>Balanced</strong> for natural recovery or <strong>Strong</strong> for heavy degradation.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>3</span>
            <h3 className={styles.stepTitle}>Restore with AI</h3>
            <p className={styles.stepDesc}>
              Click <strong>Restore Photo</strong> to run the local neural restoration pipeline.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>4</span>
            <h3 className={styles.stepTitle}>Compare &amp; Save</h3>
            <p className={styles.stepDesc}>
              Inspect the side-by-side comparison and download your high-resolution restored image.
            </p>
          </div>
        </div>

        <h2 className={styles.headingSecondary}>Best Photos for Restoration</h2>
        <ul className={styles.highlightList}>
          <li className={styles.highlightItem}>
            <strong>Vintage Scans &amp; Historical Portraits:</strong> Revive faded black-and-white or sepia photographs with enhanced clarity and balanced exposure.
          </li>
          <li className={styles.highlightItem}>
            <strong>Blurry &amp; Out-of-Focus Memories:</strong> Correct camera motion blur and focus softness from older phone cameras.
          </li>
          <li className={styles.highlightItem}>
            <strong>Low-Resolution Social Media Downloads:</strong> Clean up pixelation, artifacting, and heavy compression blur.
          </li>
        </ul>

        <h2 className={styles.headingSecondary}>Photo Restoration vs Standard Upscaling</h2>
        <div className={styles.tableWrap}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>AI Photo Restorer</th>
                <th>Standard Image Upscaler</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Fading &amp; Tone Correction</strong></td>
                <td>Dynamic histogram &amp; color cast recovery</td>
                <td>Pixel enlargement only</td>
              </tr>
              <tr>
                <td><strong>Noise &amp; Artifact Removal</strong></td>
                <td>Multi-stage neural de-noising &amp; de-blurring</td>
                <td>Standard resolution multiplier</td>
              </tr>
              <tr>
                <td><strong>Facial &amp; Edge Reconstruction</strong></td>
                <td>Trained for degraded &amp; vintage patterns</td>
                <td>Optimized for clean modern imagery</td>
              </tr>
              <tr>
                <td><strong>Privacy</strong></td>
                <td>100% Local In-Browser Processing</td>
                <td>100% Local In-Browser Processing</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className={styles.headingSecondary}>Frequently Asked Questions</h2>
        <div className={styles.faqSection}>
          <div className={styles.faqInner}>
            {FAQS.map((faq, idx) => (
              <div key={idx} className={styles.faqItem}>
                <details>
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
              </div>
            ))}
          </div>
        </div>

        <h2 className={styles.headingSecondary}>Related Image Tools</h2>
        <div className={styles.relatedTools}>
          <Link to={ROUTES.upscaler} className={styles.toolCard}>
            <span className={styles.toolName}>AI Image Upscaler</span>
            <span className={styles.toolDesc}>Enlarge photos up to 4× with neural super-resolution.</span>
          </Link>
          <Link to={ROUTES.objectRemover} className={styles.toolCard}>
            <span className={styles.toolName}>AI Object Remover</span>
            <span className={styles.toolDesc}>Erase unwanted people, text, and objects cleanly.</span>
          </Link>
          <Link to={ROUTES.imageExtender} className={styles.toolCard}>
            <span className={styles.toolName}>AI Image Extender</span>
            <span className={styles.toolDesc}>Expand image boundaries into widescreen, square, or story ratios.</span>
          </Link>
          <Link to={ROUTES.removeBackground} className={styles.toolCard}>
            <span className={styles.toolName}>Background Remover</span>
            <span className={styles.toolDesc}>Isolate foreground subjects with instant transparent PNG output.</span>
          </Link>
        </div>
      </article>
    </section>
    </div>
  );
}

export default PhotoRestorerContent;
