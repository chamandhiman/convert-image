import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import styles from './ObjectRemoverContent.module.css';

/**
 * Educational / SEO content for the AI Object Remover page.
 */
function ObjectRemoverContent() {
  return (
    <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>What is an AI Object Remover?</h2>
      <p>
        An <strong>AI Object Remover</strong> (also called a <em>Magic Eraser</em> or neural inpainting tool)
        lets you remove unwanted people, tourists, wires, text, watermarks, or background clutter from your photos.
        Unlike traditional clone stamp or blur brushes that simply smear nearby pixels across the gap, our AI tool
        uses deep neural inpainting powered by <strong>LaMa (Large Mask Inpainting with Fast Fourier Convolutions)</strong>.
        It analyzes the broader composition of the image, understands perspective, geometry, and textures, and
        synthesizes a natural, plausible background that fills in the missing area seamlessly.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>How to Remove an Object from a Photo</h2>
      <ol>
        <li>
          <strong>Upload Your Image:</strong> Drag and drop any JPG, PNG, or WebP photo into the upload area.
        </li>
        <li>
          <strong>Brush Over the Object:</strong> Use the brush tool to paint generously over the unwanted subject.
          Make sure to cover the object completely, including any cast shadows or reflections on the ground.
        </li>
        <li>
          <strong>Click &ldquo;Remove Object&rdquo;:</strong> The AI inpainting neural network evaluates the surrounding
          context and regenerates the covered pixels locally in your browser.
        </li>
        <li>
          <strong>Review &amp; Download:</strong> Drag the interactive comparison divider to inspect the before-and-after
          result, then download your clean, object-free photo in high quality.
        </li>
      </ol>

      {/* ------------------------------------------------------------------ */}
      <h2>How It Works: Neural Inpainting with Fourier Convolutions</h2>
      <p>
        Traditional convolutional neural networks (CNNs) have limited receptive fields, making it difficult for them
        to fill in large missing holes or maintain repetitive patterns like brick walls, horizons, or ocean waves.
        <strong>LaMa</strong> resolves this by utilizing Fast Fourier Convolutions (FFCs):
      </p>
      <ul>
        <li>
          <strong>Global Receptive Field:</strong> Fourier transformations convert spatial pixel data into frequency
          domain representations, allowing the model to perceive the entire image context in early layers.
        </li>
        <li>
          <strong>Periodic Pattern Continuity:</strong> LaMa excels at repeating natural textures—such as grass, sky
          gradients, water ripples, and architectural lines—without creating blurry or muddy spots.
        </li>
        <li>
          <strong>High-Resolution Detail Preservation:</strong> Our engine crops a focused context window around
          the selected object, performs 512×512 neural restoration, and feathers the inpainted patch back onto your
          full-resolution original photograph so surrounding pixels remain 100% untouched.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Common Use Cases</h2>
      <ul>
        <li>
          <strong>Vacation &amp; Travel Photography:</strong> Erase photobombers, strangers, cars, and trash cans from
          iconic travel spots.
        </li>
        <li>
          <strong>Real Estate &amp; Architecture:</strong> Clean up power cables, utility poles, construction signs, or
          stray garden hoses from property listings.
        </li>
        <li>
          <strong>Portrait Retouching:</strong> Smoothly erase temporary blemishes, skin flare, lint on clothing, or
          distracting background elements.
        </li>
        <li>
          <strong>E-Commerce Listings:</strong> Remove price tags, labels, packaging smudges, or camera stand reflections
          from professional product photographs.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Complete Privacy with Local Inpainting</h2>
      <p>
        Many online magic eraser tools upload your personal photographs to remote cloud servers.
        With <strong>Convert Image</strong>, all inpainting computations execute locally in your web browser
        using WebAssembly and WebGPU. Your photos never leave your device, ensuring total privacy for sensitive
        documents, personal media, and private family moments.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Frequently Asked Questions</h2>

      <details className={styles.faq}>
        <summary>Will my photos be uploaded to an external server?</summary>
        <p>
          No. All inpainting calculations are performed directly on your device via client-side WebAssembly.
          Your images are never sent over the internet or stored anywhere.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Why is painting the cast shadow important?</summary>
        <p>
          If you remove a person or object but leave their shadow on the ground, the photo will look unnatural.
          Brushing over both the object and its cast shadow allows the AI to reconstruct the ground or floor surface
          naturally.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What should I do if a faint outline of the object remains?</summary>
        <p>
          You can simply paint over the faint outline again and click &ldquo;Remove Object&rdquo; for a second pass.
          Iterative inpainting is a great technique for challenging subjects.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does it work with transparent PNG files?</summary>
        <p>
          Yes. If your original image contains alpha transparency, transparency channels outside the painted mask
          are preserved throughout the export.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What image file formats are supported?</summary>
        <p>
          You can upload JPG, JPEG, PNG, and WebP images. Photos up to 4000 pixels in dimension are supported.
        </p>
      </details>

      {/* ------------------------------------------------------------------ */}
      {/*  Internal Tool Links                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.moreToolsSection}>
        <h3 className={styles.moreToolsHeading}>More Image Tools</h3>
        <p className={styles.moreToolsDesc}>
          Explore our suite of private, browser-based photo utilities:
        </p>
        <div className={styles.toolsLinksGrid}>
          <Link to={ROUTES.removeBackground} className={styles.toolLinkCard}>
            <strong>Remove Background</strong>
            <span>Isolate subjects and export transparent PNG cutouts instantly.</span>
          </Link>
          <Link to={ROUTES.upscaler} className={styles.toolLinkCard}>
            <strong>AI Image Upscaler</strong>
            <span>Increase resolution 2× or 4× with neural super-resolution.</span>
          </Link>
          <Link to={ROUTES.compress} className={styles.toolLinkCard}>
            <strong>Compress Image</strong>
            <span>Shrink file sizes while maintaining visual quality.</span>
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

export default ObjectRemoverContent;
