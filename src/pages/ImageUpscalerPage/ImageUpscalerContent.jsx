import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './ImageUpscalerContent.module.css';

/**
 * Educational / SEO content for the AI Image Upscaler page.
 *
 * Covers neural super-resolution concepts, 2x vs 4x comparison,
 * format compatibility, accessible FAQ accordion, and internal tool links.
 */
function ImageUpscalerContent() {
  return (
    <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>What is AI Image Upscaling?</h2>
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

      {/* ------------------------------------------------------------------ */}
      <h2>How Does an AI Image Upscaler Work?</h2>
      <p>
        The super-resolution neural network analyzes patterns across adjacent pixels and compares them
        against deep features learned from millions of high-resolution photographic structures. Our
        engine executes the following steps entirely in your browser:
      </p>
      <ol>
        <li>
          <strong>Tiled Feature Extraction:</strong> For large images, the photo is divided into
          overlapping tiles with boundary padding, ensuring stable memory consumption.
        </li>
        <li>
          <strong>Deep Convolutional Enhancement:</strong> The neural network processes each tile,
          predicting realistic sub-pixel details and recovering sharpness.
        </li>
        <li>
          <strong>Seamless Reassembly:</strong> The enhanced tiles are blended and stitched together,
          eliminating visible boundary seams.
        </li>
      </ol>

      {/* ------------------------------------------------------------------ */}
      <h2>How to Upscale an Image</h2>
      <ol>
        <li>
          <strong>Upload your photo:</strong> Drag and drop any JPG, PNG, or WebP image into the
          upload area above.
        </li>
        <li>
          <strong>Select upscale factor:</strong> Choose between <strong>2× (Faster)</strong> for
          quick enhancements or <strong>4× (Maximum Resolution)</strong> for larger print or display outputs.
        </li>
        <li>
          <strong>Compare & Download:</strong> Inspect the interactive Before/After comparison slider
          to see the recovered detail, then download your high-resolution result.
        </li>
      </ol>

      {/* ------------------------------------------------------------------ */}
      <h2>2× vs 4× Image Upscaling</h2>
      <p>
        Selecting the right scale factor depends on your intended use:
      </p>
      <ul>
        <li>
          <strong>2× Upscale (Faster):</strong> Doubles width and height (4× total pixels). Ideal for
          web graphics, digital banners, social media posts, and fast previews. Offers the quickest
          processing time with excellent clarity.
        </li>
        <li>
          <strong>4× Upscale (Maximum Detail):</strong> Quadruples width and height (16× total pixels).
          Best for preparing photos for physical printing (e.g. 300 DPI canvas prints), cropping into
          fine details, or restoring low-resolution archival photos.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Can I Upscale JPG, PNG, and WebP Images?</h2>
      <p>
        Yes. The AI upscaler supports all standard modern digital image formats:
      </p>
      <ul>
        <li>
          <strong>JPG / JPEG:</strong> The neural network actively reduces blocky compression
          artifacts and ringing noise while sharpening edges.
        </li>
        <li>
          <strong>PNG:</strong> Preserves crisp digital illustrations, screenshots, and alpha
          transparency channels.
        </li>
        <li>
          <strong>WebP:</strong> High-efficiency web captures are processed with full color fidelity.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Does Upscaling Improve Image Quality?</h2>
      <p>
        AI upscaling significantly improves perceived sharpness, edge clarity, and display resolution.
        However, it cannot invent completely lost information (such as illegible distant text or
        features hidden in extreme shadows). For best results, use source images that are in focus and
        have reasonable lighting.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Frequently Asked Questions</h2>

      <details className={styles.faq}>
        <summary>Are my images uploaded to any remote server?</summary>
        <p>
          No. The neural network runs entirely inside your web browser using WebAssembly and WebGPU.
          Your personal photos never leave your device.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Why is the first upscale slightly slower?</summary>
        <p>
          On the first run, your browser downloads the compact 4.6 MB AI model weights into its local
          cache. Subsequent upscales load the cached model instantly from memory.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What is the maximum image resolution I can upscale?</summary>
        <p>
          Because our engine uses overlapping tile processing, it can comfortably process images up
          to 3000–4000 pixels on most desktop devices without running out of browser memory.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>How does 2× upscaling work if the neural model is 4×?</summary>
        <p>
          The neural network reconstructs high-frequency details at full 4× resolution, which is then
          downsampled with high-quality bicubic filtering to 2×. This creates an exceptionally clean,
          razor-sharp 2× output with no interpolation blur.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Is there any watermark or subscription fee?</summary>
        <p>
          No. Convert Image tools are completely free, private, and unlimited. Output files have no
          watermarks or restrictions.
        </p>
      </details>

      {/* ------------------------------------------------------------------ */}
      {/*  More Image Tools                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.moreToolsSection}>
        <h3 className={styles.moreToolsHeading}>More Image Tools</h3>
        <p className={styles.moreToolsDesc}>
          Explore our other free, browser-based utilities for preparing and optimizing your photos:
        </p>
        <div className={styles.toolsLinksGrid}>
          <Link to={ROUTES.removeBackground} className={styles.toolLinkCard}>
            <strong>Remove Background</strong>
            <span>Isolate subjects and export transparent PNG cutouts with browser AI.</span>
          </Link>
          <Link to={ROUTES.compress} className={styles.toolLinkCard}>
            <strong>Compress Image</strong>
            <span>Shrink file size while preserving high visual quality.</span>
          </Link>
          <Link to={ROUTES.resize} className={styles.toolLinkCard}>
            <strong>Resize Image</strong>
            <span>Change pixel dimensions or percentage with aspect ratio lock.</span>
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

export default ImageUpscalerContent;
