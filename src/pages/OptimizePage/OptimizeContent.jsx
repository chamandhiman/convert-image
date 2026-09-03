import styles from './OptimizeContent.module.css';

/**
 * Educational / SEO content for the Smart Image Optimizer page.
 *
 * Explains goal-based optimization, format trade-offs, sizing considerations,
 * privacy advantages, and includes an accessible FAQ accordion.
 */
function OptimizeContent() {
  return (
    <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>What Image Optimization Actually Means</h2>
      <p>
        Image optimization is the process of preparing a graphic for its specific real-world
        destination with the highest possible visual fidelity at the lowest necessary file weight.
        Rather than merely cranking up compression dials or stripping metadata indiscriminately,
        true optimization considers three factors together: container dimensions, display pixel
        density, and encoding algorithms.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>How to Choose the Right Image Format</h2>
      <p>
        The ideal file format depends entirely on the content of your picture and where your
        audience will see it:
      </p>
      <ul>
        <li>
          <strong>WebP:</strong> The modern universal standard for websites. It supports both
          rich photographs and transparent graphics with 25% to 35% smaller file sizes than
          equivalent JPEGs.
        </li>
        <li>
          <strong>JPG / JPEG:</strong> The most reliable choice for email newsletters and legacy
          software where maximum cross-client compatibility is non-negotiable.
        </li>
        <li>
          <strong>PNG:</strong> Reserved for cases requiring strict lossless fidelity, such as
          screenshots with fine text, UI diagrams, and transparent logos.
        </li>
        <li>
          <strong>AVIF:</strong> An ultra-modern format with exceptional compression efficiency,
          ideal for modern web delivery where supported by browser encoders.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Why Smaller is Not Always Better</h2>
      <p>
        Aggressively shrinking a photo until blocky quantization noise or color banding appears
        harms your brand and user experience. Over-compression degrades the credibility of
        ecommerce stores, portfolios, and marketing pages. The goal of smart optimization is
        not to hit the absolute lowest byte count, but to find the point where further
        compression yields invisible savings while preserving natural clarity.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Image Quality vs. File Size</h2>
      <p>
        In digital imaging, visual quality and file size follow a curve of diminishing returns:
      </p>
      <ul>
        <li>
          Moving from 100% quality to 85% typically reduces file size by 60% with zero visible
          difference to human eyes.
        </li>
        <li>
          Moving from 85% to 75% cuts size by another 20% to 30%, which is ideal for mobile
          data connections and responsive layouts.
        </li>
        <li>
          Dropping below 65% quality begins to introduce visible compression artifacts around high-contrast
          edges, so it should only be used when extreme bandwidth constraints require it.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Choosing an Image for a Website</h2>
      <p>
        Web images should load in under one second over mobile 4G networks. To achieve excellent
        Core Web Vitals scores without blurry visuals, scale wide hero banners to a maximum of
        1600 to 1920 pixels wide and encode them in WebP at 80% to 85% quality. For inline blog
        images and card thumbnails, 800 to 1200 pixels is more than sufficient.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Choosing an Image for Email</h2>
      <p>
        Email environments are fragmented. Major corporate email clients still rely on legacy HTML
        rendering engines that struggle with newer formats. For email newsletters and promotional
        blasts, standard JPEG or PNG formatted to 600 to 1200 pixels wide ensures every recipient
        sees the image correctly without exceeding attachment or spam filter limits.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Choosing an Image for Social Media</h2>
      <p>
        Social platforms like LinkedIn, X, Facebook, and Instagram automatically re-compress
        uploaded images to save server space. If you upload a massive 30 MB raw photograph, the
        platform's harsh automated compression will often mangle the details. Pre-optimizing
        your images to standard 1080p or 2K resolutions (around 1920 pixels wide) at 84% quality
        prevents platforms from applying destructive re-compression.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>When You Should NOT Optimize an Image</h2>
      <p>
        There are several scenarios where running an optimizer is unnecessary or counter-productive:
      </p>
      <ul>
        <li>
          <strong>Archival & Fine Art Printing:</strong> Always retain your full-resolution,
          uncompressed RAW or TIFF masters for physical paper prints.
        </li>
        <li>
          <strong>Already Optimized Assets:</strong> If an image is already under 50 KB, running
          it through another lossy compression cycle can degrade quality without noticeable size
          benefits.
        </li>
        <li>
          <strong>Repeated Saves:</strong> Do not repeatedly compress the same JPEG file multiple
          times, as generational loss compounds artifacts over time.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Why Local Browser Processing Matters</h2>
      <p>
        Most online optimization services upload your pictures to remote cloud servers to run
        automated scripts. Client-side browser processing offers distinct advantages:
      </p>
      <ul>
        <li>
          <strong>Absolute Privacy:</strong> Confidential documents, client previews, and personal
          photos never travel across the internet.
        </li>
        <li>
          <strong>Zero Network Delay:</strong> Processing occurs instantly on your device hardware
          without upload or download wait times.
        </li>
        <li>
          <strong>Unlimited Offline Usage:</strong> The tool runs smoothly even without an active
          internet connection once the web application is loaded.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Frequently Asked Questions</h2>

      <details className={styles.faq}>
        <summary>What does image optimization do?</summary>
        <p>
          Image optimization tailors an image's resolution, dimensions, and encoding algorithms to
          match your specific goal (such as website publishing, email, or social sharing) so that
          the picture loads fast without looking compressed or pixelated.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Which image format should I use?</summary>
        <p>
          For websites, WebP is the recommended modern format. For emails and universal legacy
          compatibility, use JPG. For screenshots and transparent logos, use PNG.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Will optimization reduce image quality?</summary>
        <p>
          When using smart presets (such as Website or Social Media), the reduction in data is
          visually lossless—meaning the human eye cannot distinguish the optimized version from the
          original at normal viewing distances.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Should I use WebP or JPG?</summary>
        <p>
          WebP is superior for modern websites and web applications, offering smaller file sizes
          with built-in transparency support. JPG remains the best choice for email templates and
          older software.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Is a smaller image always better?</summary>
        <p>
          No. Reducing a file size too aggressively introduces blocky digital artifacts and
          smearing. Smart optimization aims for the optimal sweet spot between speed and visual
          clarity.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Why didn't my image become smaller?</summary>
        <p>
          If your original image was already heavily compressed or if you converted a small JPEG
          into a lossless PNG, the resulting file might be similar in size or slightly larger. The
          tool alerts you when an image is already compact.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Are my images uploaded to any server?</summary>
        <p>
          No. All resizing, format conversion, and compression occur 100% locally inside your web
          browser using the HTML5 Canvas API. Your files never leave your computer or phone.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Why is AVIF unavailable in my browser?</summary>
        <p>
          While most modern browsers can display AVIF pictures, client-side Canvas encoding of AVIF
          is only supported by select browser engines. If your browser does not support AVIF
          encoding, the tool recommends WebP or JPG instead.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can I control the optimization settings?</summary>
        <p>
          Yes. While smart presets make automatic recommendations based on your goal, you can click
          "Advanced settings" at any time to customize the target format, quality percentage, and
          dimensions.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does optimization change image dimensions?</summary>
        <p>
          If an image is unnecessarily large (such as a 6000 × 4000 px camera photo), the smart
          preset will gently downscale it to a practical resolution (e.g. 1600 px wide for websites)
          while keeping the aspect ratio locked. You can also disable dimension scaling in Advanced
          settings.
        </p>
      </details>
    </div>
  );
}

export default OptimizeContent;
