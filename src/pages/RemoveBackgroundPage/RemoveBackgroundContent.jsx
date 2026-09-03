import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './RemoveBackgroundContent.module.css';

/**
 * Educational / SEO content for the Image Background Remover page.
 *
 * Covers subject isolation, transparent PNG use-cases, format support,
 * accessible FAQ accordion, and internal navigation to other core tools.
 */
function RemoveBackgroundContent() {
  return (
    <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>What is an Image Background Remover?</h2>
      <p>
        An image background remover is an automated utility that isolates the primary subject of a
        photograph—such as a person, product, vehicle, pet, or graphic icon—from everything behind
        it. Rather than requiring tedious manual lassoing or pen-tool tracing in complex desktop
        photo editors, our background remover employs client-side neural network segmentation
        models that identify foreground boundaries and erase background pixels instantly.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>How to Remove a Background from an Image</h2>
      <p>
        Creating a clean transparent cutout requires just three simple steps:
      </p>
      <ol>
        <li>
          <strong>Upload your photo:</strong> Drag and drop any JPG, PNG, or WebP image into the
          upload area above.
        </li>
        <li>
          <strong>Automatic AI isolation:</strong> Our local browser engine identifies the subject
          and cuts away the background with fine edge precision.
        </li>
        <li>
          <strong>Download transparent PNG:</strong> Download your transparent cutout, or optionally
          switch to a clean solid white or black backdrop.
        </li>
      </ol>

      {/* ------------------------------------------------------------------ */}
      <h2>Why Use a Transparent Background?</h2>
      <p>
        Transparent cutouts provide immense creative flexibility across marketing, design, and
        ecommerce workflows:
      </p>
      <ul>
        <li>
          <strong>Ecommerce Product Listings:</strong> Major retail platforms (Amazon, eBay,
          Shopify) require clean product presentations without distracting background clutter.
        </li>
        <li>
          <strong>Graphic & Web Design:</strong> Transparent PNGs can be seamlessly placed over any
          color background, hero banner, pattern, or slide deck without awkward white square borders.
        </li>
        <li>
          <strong>Professional Headshots:</strong> Replace messy office or home backgrounds with a
          clean, neutral canvas for LinkedIn profiles, team directories, and resumes.
        </li>
        <li>
          <strong>Social Media Thumbnails:</strong> Layer your subject over YouTube video covers,
          Instagram graphics, and promotional flyers with professional pop.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Supported Image Formats</h2>
      <p>
        You can upload photos in standard digital formats:
      </p>
      <ul>
        <li>
          <strong>JPG / JPEG:</strong> Standard smartphone photos, DSLR captures, and stock
          photography.
        </li>
        <li>
          <strong>PNG:</strong> Screenshots, digital illustrations, and pre-existing graphics.
        </li>
        <li>
          <strong>WebP:</strong> Modern web photos and compressed captures.
        </li>
      </ul>
      <p>
        The final cutout is always exported as a high-fidelity <strong>PNG</strong> to preserve 8-bit
        alpha transparency.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Frequently Asked Questions</h2>

      <details className={styles.faq}>
        <summary>How does the background remover work?</summary>
        <p>
          It runs a lightweight deep-learning segmentation model directly inside your browser via
          WebAssembly and the ONNX runtime. The model analyzes pixel contrast, colors, and subject
          shapes to cleanly separate the foreground from the background.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Are my photos uploaded to any server?</summary>
        <p>
          No. Unlike most online background removal services that send your personal photos to
          remote cloud servers, our tool processes everything 100% locally on your device. Your
          images never leave your browser.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Why is the first image slower to process?</summary>
        <p>
          The very first time you use the tool, your browser downloads the AI model assets into local
          cache. Subsequent removals are significantly faster because the model is already cached in
          your browser memory.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What format is the downloaded image?</summary>
        <p>
          The cutout is exported as a transparent PNG. PNG is the universal standard for digital
          graphics that require true alpha transparency.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can I add a solid background color instead?</summary>
        <p>
          Yes. After the background is removed, you can toggle between Transparent, Solid White, or
          Solid Black backgrounds before downloading.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What types of images work best?</summary>
        <p>
          Photos with a clear distinction between the subject and the background (such as portraits,
          products, animals, and objects with good contrast) produce the cleanest edge cutouts.
        </p>
      </details>

      {/* ------------------------------------------------------------------ */}
      {/*  Internal Links to Other Core Image Tools                          */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.moreToolsSection}>
        <h3 className={styles.moreToolsHeading}>More Image Tools</h3>
        <p className={styles.moreToolsDesc}>
          Explore our other free, browser-based utilities for preparing your photos:
        </p>
        <div className={styles.toolsLinksGrid}>
          <Link to={ROUTES.optimize} className={styles.toolLinkCard}>
            <strong>Smart Image Optimizer</strong>
            <span>Optimize images for websites, email, and social sharing.</span>
          </Link>
          <Link to={ROUTES.compress} className={styles.toolLinkCard}>
            <strong>Compress Image</strong>
            <span>Shrink file size while preserving high visual quality.</span>
          </Link>
          <Link to={ROUTES.resize} className={styles.toolLinkCard}>
            <strong>Resize Image</strong>
            <span>Change pixel dimensions or scale percentage with aspect ratio lock.</span>
          </Link>
          <Link to={ROUTES.convert} className={styles.toolLinkCard}>
            <strong>Convert Image</strong>
            <span>Convert between JPG, PNG, WebP, and AVIF formats locally.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RemoveBackgroundContent;
