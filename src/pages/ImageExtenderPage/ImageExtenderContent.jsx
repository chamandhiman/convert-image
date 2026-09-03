import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './ImageExtenderContent.module.css';

const FAQS = [
  {
    q: 'What is AI Image Extension (Outpainting)?',
    a: 'AI Image Extension—also known as outpainting or uncropping—is a neural vision technique that analyzes the visual structure, textures, and lighting of an existing image and generates realistic new scenery beyond its original boundaries.',
  },
  {
    q: 'Does extending an image reduce the quality of my original photo?',
    a: 'No. Your original photo is preserved at 100% full pixel resolution. The AI only synthesizes new pixels in the added canvas borders and seamlessly blends the edges.',
  },
  {
    q: 'Are my images uploaded to a cloud server?',
    a: 'No. All neural inference and image synthesis execute directly inside your web browser via WebGPU and WebAssembly. Your photos never leave your device.',
  },
  {
    q: 'Can I extend an image into popular social media aspect ratios?',
    a: 'Yes. You can choose one-click presets like 16:9 Landscape for wallpapers and YouTube thumbnails, 4:5 Portrait for Instagram feeds, 9:16 for Stories and Reels, 1:1 Square, or enter custom pixel amounts.',
  },
  {
    q: 'What image formats are supported?',
    a: 'You can upload JPG, PNG, and WebP images. Results can be downloaded as high-quality PNG or standard JPG.',
  },
];

function ImageExtenderContent() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <section className={styles.contentSection} aria-label="About AI Image Extension">
      <article className={styles.article}>
        <h2 className={styles.headingPrimary}>What Is AI Image Extension?</h2>
        <p className={styles.paragraph}>
          AI Image Extension (also known as <strong>outpainting</strong> or <strong>canvas uncropping</strong>) 
          is a deep learning technique that intelligently expands the canvas of any photograph. Rather than 
          stretching pixels or adding artificial letterbox bars, an advanced Fast Fourier Convolution neural 
          network learns the context, colors, lighting, and repeating textures of your image to generate 
          plausible new content that blends naturally with the original scene.
        </p>

        <h2 className={styles.headingSecondary}>How AI Image Extender Works</h2>
        <p className={styles.paragraph}>
          When you upload an image and choose a target aspect ratio or directional padding, the tool:
        </p>
        <ul className={styles.highlightList}>
          <li className={styles.highlightItem}>
            <strong>Preserves Native Pixels:</strong> Keeps every pixel of your original photo intact without lossy scaling.
          </li>
          <li className={styles.highlightItem}>
            <strong>Synthesizes Surrounding Context:</strong> Deep neural layers sample surrounding environment cues—such as sky gradients, foliage, indoor walls, or floor patterns—to extrapolate new visual details.
          </li>
          <li className={styles.highlightItem}>
            <strong>Feathered Edge Blending:</strong> Seamlessly blends the transition boundary to ensure zero visible seams or harsh line artifacts.
          </li>
          <li className={styles.highlightItem}>
            <strong>100% Private In-Browser Execution:</strong> Utilizes hardware-accelerated WebGPU shaders and multi-threaded WebAssembly to compute the result locally on your computer or mobile phone.
          </li>
        </ul>

        <h2 className={styles.headingSecondary}>How to Extend an Image</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>1</span>
            <h3 className={styles.stepTitle}>Upload Photo</h3>
            <p className={styles.stepDesc}>
              Drag and drop any JPG, PNG, or WebP photo into the browser editor.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>2</span>
            <h3 className={styles.stepTitle}>Choose Aspect Ratio</h3>
            <p className={styles.stepDesc}>
              Select a preset (16:9, 4:5, 1:1, 9:16) or manually configure left, right, top, and bottom pixel padding.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>3</span>
            <h3 className={styles.stepTitle}>Extend with AI</h3>
            <p className={styles.stepDesc}>
              Click <strong>Extend Image</strong> to let the neural network synthesize the new background.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>4</span>
            <h3 className={styles.stepTitle}>Compare &amp; Download</h3>
            <p className={styles.stepDesc}>
              Inspect the side-by-side comparison, fine-tune the canvas if needed, and save your high-resolution image.
            </p>
          </div>
        </div>

        <h2 className={styles.headingSecondary}>Best Uses for Image Extension</h2>
        <ul className={styles.highlightList}>
          <li className={styles.highlightItem}>
            <strong>Adapting Vertical Photos to Widescreen:</strong> Convert 4:5 or 9:16 smartphone photos into 16:9 landscape headers, YouTube thumbnails, or desktop wallpapers.
          </li>
          <li className={styles.highlightItem}>
            <strong>Fixing Tight Framing:</strong> Add breathing room around subjects where the camera was framed too closely to borders or heads were clipped.
          </li>
          <li className={styles.highlightItem}>
            <strong>E-Commerce &amp; Social Banners:</strong> Expand product photography backgrounds to fit varied banner ratios across marketplaces.
          </li>
        </ul>

        <h2 className={styles.headingSecondary}>Image Extension vs Image Resizing</h2>
        <div className={styles.tableWrap}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>AI Image Extender</th>
                <th>Standard Resizing / Cropping</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Subject Preservation</strong></td>
                <td>100% preserved at original size</td>
                <td>Distorted if stretched or lost if cropped</td>
              </tr>
              <tr>
                <td><strong>Canvas Boundary</strong></td>
                <td>Expands to new aspect ratio</td>
                <td>Locked to existing pixel aspect ratio</td>
              </tr>
              <tr>
                <td><strong>Content Generation</strong></td>
                <td>Synthesizes realistic new surroundings</td>
                <td>No new content created</td>
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
          <Link to={ROUTES.upscaler} className={styles.toolCard}>
            <span className={styles.toolName}>AI Image Upscaler</span>
            <span className={styles.toolDesc}>Enlarge photos up to 4× with neural super-resolution.</span>
          </Link>
          <Link to={ROUTES.objectRemover} className={styles.toolCard}>
            <span className={styles.toolName}>AI Object Remover</span>
            <span className={styles.toolDesc}>Erase unwanted people, text, and objects cleanly.</span>
          </Link>
          <Link to={ROUTES.removeBackground} className={styles.toolCard}>
            <span className={styles.toolName}>Background Remover</span>
            <span className={styles.toolDesc}>Isolate foreground subjects with instant transparent PNG output.</span>
          </Link>
          <Link to={ROUTES.convert} className={styles.toolCard}>
            <span className={styles.toolName}>Image Converter</span>
            <span className={styles.toolDesc}>Convert between JPG, PNG, WebP, and AVIF formats.</span>
          </Link>
        </div>
      </article>
    </section>
  );
}

export default ImageExtenderContent;
