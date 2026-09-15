import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './GenerativeFillContent.module.css';

const FAQS = [
  {
    q: 'What is AI Generative Fill?',
    a: 'AI Generative Fill is a smart image editing feature that lets you brush over any part of an image and generate new, context-aware visual content inside that area from your description.',
  },
  {
    q: 'How does in-browser generative fill work?',
    a: 'The tool extracts a context-window patch around your brushed selection, processes it through a deep neural synthesis engine using WebGPU hardware acceleration, and blends the synthesized result seamlessly with your original photo.',
  },
  {
    q: 'Are my images uploaded to external servers?',
    a: 'No. All neural synthesis and image compositing happen 100% inside your web browser. Your images and prompts are completely private and never sent to cloud servers.',
  },
  {
    q: 'What selection tools can I use?',
    a: 'You can use the Brush with adjustable size and hardness, the Eraser to refine your mask, the Lasso tool for freehand selections, and the Rectangle tool for geometric areas.',
  },
  {
    q: 'What image formats can I edit?',
    a: 'You can upload JPG, PNG, and WebP images. Your edited results can be downloaded in lossless PNG or compressed JPG.',
  },
];

function GenerativeFillContent() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero Banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-label="AI Generative Fill banner">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>AI Creative Tool</div>
          <h2 className={styles.heroTitle}>AI Generative Fill</h2>
          <p className={styles.heroLead}>
            Describe what you&apos;d like to change — then let AI create it. 100% private, runs in your browser.
          </p>
          <div className={styles.heroCtas}>
            <a href="#tool" className={styles.heroPrimary}>Start Creating</a>
            <a href="#how-it-works" className={styles.heroSecondary}>Learn More</a>
          </div>
        </div>
      </section>

      <section className={styles.contentSection} aria-label="About AI Generative Fill">
      <article className={styles.article}>
        <h2 className={styles.headingPrimary}>What Is AI Generative Fill?</h2>
        <p className={styles.paragraph}>
          AI Generative Fill is an intelligent image synthesis tool that empowers you to 
          reimagine any portion of a photo. By painting a selection over objects, backgrounds, 
          or empty space, our in-browser neural engine synthesizes new textures, lighting, and 
          details that blend naturally into the surrounding environment.
        </p>

        <h2 className={styles.headingSecondary}>How Generative Fill Works</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>1</span>
            <h3 className={styles.stepTitle}>Upload Image</h3>
            <p className={styles.stepDesc}>
              Drag and drop any JPG, PNG, or WebP photo into the editor.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>2</span>
            <h3 className={styles.stepTitle}>Select Area</h3>
            <p className={styles.stepDesc}>
              Use the Brush, Lasso, or Rectangle tool to mark the area you want to replace.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>3</span>
            <h3 className={styles.stepTitle}>Describe Your Edit</h3>
            <p className={styles.stepDesc}>
              Enter a prompt describing what you want to generate in the selected region.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>4</span>
            <h3 className={styles.stepTitle}>Generate &amp; Save</h3>
            <p className={styles.stepDesc}>
              Click <strong>Generate</strong>, inspect the side-by-side result, and download.
            </p>
          </div>
        </div>

        <h2 className={styles.headingSecondary}>Add Objects and Replace Backgrounds</h2>
        <ul className={styles.highlightList}>
          <li className={styles.highlightItem}>
            <strong>Insert New Scenery &amp; Objects:</strong> Paint over an empty table to add flowers, or select the sky to add dramatic clouds and lighting.
          </li>
          <li className={styles.highlightItem}>
            <strong>Preserve Untouched Pixels:</strong> Every pixel outside your brushed mask is kept at 100% native quality with zero compression artifacts.
          </li>
          <li className={styles.highlightItem}>
            <strong>Seamless Feathered Blending:</strong> Soft alpha transitions ensure zero harsh lines or unnatural cutouts between generated content and the original scene.
          </li>
          <li className={styles.highlightItem}>
            <strong>100% Private In-Browser Execution:</strong> Computed locally on your device via WebGPU and WebAssembly.
          </li>
        </ul>

        <h2 className={styles.headingSecondary}>Tips for Better AI Generations</h2>
        <ul className={styles.highlightList}>
          <li className={styles.highlightItem}>
            <strong>Leave Breathing Room:</strong> Brush slightly outside the object boundary so the neural network has surrounding context to sample lighting and textures from.
          </li>
          <li className={styles.highlightItem}>
            <strong>Use Specific Prompts:</strong> Describe the material, lighting, and style (e.g. <em>&quot;A rustic wooden chair in warm sunlight&quot;</em>).
          </li>
          <li className={styles.highlightItem}>
            <strong>Refine with Eraser:</strong> Use the Eraser tool to fine-tune complex mask shapes before generating.
          </li>
        </ul>

        <h2 className={styles.headingSecondary}>Frequently Asked Questions</h2>
        <div className={styles.faqSection}>
          {FAQS.map((faq, idx) => (
            <div key={idx} className={styles.faqItem}>
              <button
                type="button"
                className={styles.faqQuestion}
                onClick={() => toggleFaq(idx)}
                aria-expanded={openFaq === idx}
              >
                <span>{faq.q}</span>
                <span aria-hidden="true">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && <div className={styles.faqAnswer}>{faq.a}</div>}
            </div>
          ))}
        </div>

        <h2 className={styles.headingSecondary}>Related Image Tools</h2>
        <div className={styles.relatedTools}>
          <Link to={ROUTES.objectRemover} className={styles.toolCard}>
            <span className={styles.toolName}>AI Object Remover</span>
            <span className={styles.toolDesc}>Erase unwanted people, text, and objects cleanly.</span>
          </Link>
          <Link to={ROUTES.imageExtender} className={styles.toolCard}>
            <span className={styles.toolName}>AI Image Extender</span>
            <span className={styles.toolDesc}>Expand image borders into 16:9, square, or custom aspect ratios.</span>
          </Link>
          <Link to={ROUTES.photoRestorer} className={styles.toolCard}>
            <span className={styles.toolName}>AI Photo Restorer</span>
            <span className={styles.toolDesc}>Revive old, blurry, or faded photographs.</span>
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

export default GenerativeFillContent;
