import styles from './AnalyzeContent.module.css';

/**
 * Educational / SEO content for the Image Quality Analyzer tool.
 *
 * Explains technical image properties, resolution vs. file size, format selection,
 * suitability guidelines for web and print, and includes an accessible FAQ accordion.
 */
function AnalyzeContent() {
  return (
    <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>What Does Image Quality Actually Mean?</h2>
      <p>
        In digital media, "quality" is frequently conflated with sheer file weight or massive pixel
        counts. In technical terms, true image quality is a composite of three distinct
        characteristics: resolution (the raw pixel grid width and height), fidelity (the
        preservation of subtle gradients and high-contrast edges without compression artifacts),
        and efficiency (how compactly that visual data is encoded). An image that is sharp,
        appropriately scaled for its container, and encoded in a modern format delivers far higher
        practical quality than a bloated 25 MB camera raw file that takes ten seconds to load.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Resolution vs. File Size</h2>
      <p>
        Resolution refers to the total number of pixels that make up an image (for example, 4000
        horizontal pixels by 3000 vertical pixels equals 12 megapixels). File size refers to the
        volume of digital storage the file consumes (such as 4.5 megabytes). While higher
        resolutions naturally require more data, file size is heavily dictated by encoding methods:
      </p>
      <ul>
        <li>
          A 4K uncompressed image can consume over 24 megabytes of disk space.
        </li>
        <li>
          The exact same 4K photo encoded with modern WebP or JPEG compression can look visually
          indistinguishable at just 1.2 megabytes—a 95% reduction with zero noticeable difference
          on screen.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>How Image Dimensions Affect Quality</h2>
      <p>
        Displaying an image larger than its native pixel dimensions forces the browser to stretch
        and interpolate pixels, causing blurriness and pixelation. Conversely, feeding a massive
        5000-pixel-wide photo into a 600-pixel blog column wastes user bandwidth, degrades mobile
        battery life, and slows down browser rendering engines. Matching image dimensions closely
        to real-world display requirements is the single most impactful optimization step.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Why a Large File Isn't Always a Better Image</h2>
      <p>
        Many users assume that a bigger file size guarantees superior quality. In reality, large
        files often indicate inefficient legacy containers (such as uncompressed 24-bit PNGs used
        for photographs) or redundant hidden metadata headers (such as camera manufacturer logs
        and embedded preview thumbnails). Removing redundant headers and switching to modern
        lossy codecs preserves the visual picture while cutting the byte footprint drastically.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Choosing Image Formats</h2>
      <p>
        Selecting the right container format is critical for balancing clarity and performance:
      </p>
      <ul>
        <li>
          <strong>WebP:</strong> The optimal default for modern websites and web applications,
          supporting both rich photography and transparency at 25%–35% lower weight than JPEG.
        </li>
        <li>
          <strong>JPEG / JPG:</strong> The universal standard for newsletters, legacy email
          software, and archival compatibility.
        </li>
        <li>
          <strong>PNG:</strong> Reserved for lossless graphics, screenshots with fine text, and
          digital logos requiring sharp, uncompressed edges.
        </li>
        <li>
          <strong>AVIF:</strong> An advanced next-generation codec providing outstanding data
          density for supported modern browser environments.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>What Makes an Image Suitable for a Website?</h2>
      <p>
        To achieve high Google Lighthouse and Core Web Vitals scores:
      </p>
      <ul>
        <li>Hero banners should rarely exceed 1600 to 1920 pixels in width.</li>
        <li>Inline content and article images should generally be kept under 1200 pixels wide.</li>
        <li>Individual file weight should ideally remain under 350 KB, and never exceed 1 MB.</li>
        <li>Images should be served in modern WebP format whenever possible.</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>What Makes an Image Suitable for Print?</h2>
      <p>
        Physical paper printing relies on dots per inch (DPI) rather than screen pixels. Quality
        commercial print requires 300 DPI:
      </p>
      <ul>
        <li>A standard 4 × 6 inch snapshot requires 1200 × 1800 pixels (roughly 2.2 MP).</li>
        <li>An 8 × 10 inch photo requires 2400 × 3000 pixels (roughly 7.2 MP).</li>
        <li>
          For physical print, preserve full camera dimensions, avoid heavy compression, and keep
          uncompressed PNG or high-quality JPEG masters.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>When Should You Compress, Resize, or Convert?</h2>
      <ul>
        <li>
          <strong>Resize:</strong> When the pixel dimensions exceed your display container (e.g.
          a 4000px camera photo intended for a website column).
        </li>
        <li>
          <strong>Compress:</strong> When dimensions are correct, but the byte size is too heavy
          for fast loading or email attachments.
        </li>
        <li>
          <strong>Convert:</strong> When the container is inefficient (e.g. converting a large
          photographic PNG to WebP).
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Why Browser-Based Analysis is Private</h2>
      <p>
        Traditional image analysis tools upload your pictures to remote cloud servers to run
        automated scripts. Client-side browser analysis offers complete confidentiality:
      </p>
      <ul>
        <li>
          <strong>Zero Server Uploads:</strong> Your files never travel across the internet.
        </li>
        <li>
          <strong>Instant Hardware Inspection:</strong> Dimensions, pixel channels, and metadata
          are read directly from local system memory in milliseconds.
        </li>
        <li>
          <strong>Complete Offline Availability:</strong> The analyzer functions perfectly even
          without an active network connection.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Limitations of Technical Image Analysis</h2>
      <p>
        This tool measures objective, deterministic data: byte count, width, height, aspect ratio,
        megapixels, alpha transparency, and format efficiency. It deliberately does not make
        unsubstantiated claims about subjective artistic beauty or composition. Technical readiness
        scores represent practical guidelines for real-world delivery, not rigid scientific rules.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Frequently Asked Questions</h2>

      <details className={styles.faq}>
        <summary>What does the Image Quality Analyzer check?</summary>
        <p>
          It measures exact pixel dimensions, aspect ratio, total megapixels, file byte weight,
          MIME format, alpha transparency presence, and evaluates readiness for specific uses like
          websites, email, social media, and print.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can it tell whether an image looks good?</summary>
        <p>
          No automated tool can judge artistic merit. Instead, this analyzer provides honest
          technical metrics—telling you whether the resolution is high enough, whether the file is
          too heavy, and what practical steps will optimize it.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What is image resolution?</summary>
        <p>
          Resolution describes the total number of pixels in the image matrix (width multiplied by
          height). More pixels allow an image to be displayed larger or printed clearer without
          looking fuzzy.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Is a larger image always better?</summary>
        <p>
          No. Having more pixels than your destination requires wastes device memory, slows page
          loading, and burns mobile data without providing any visual benefit on screen.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What file size is good for a website?</summary>
        <p>
          As a general rule, aim for under 350 KB for large hero images, and under 150 KB for
          standard content photos and thumbnails.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Should I use JPG or WebP?</summary>
        <p>
          WebP is superior for websites and web apps, delivering 25%–35% smaller files with built-in
          transparency support. JPEG remains best for email templates and legacy software.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does analyzing an image upload it?</summary>
        <p>
          Never. All processing and measurements occur 100% locally on your computer or phone using
          standard client-side browser APIs.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can the analyzer fix my image?</summary>
        <p>
          The analyzer diagnoses your image and provides direct 1-click action buttons that carry
          your image into our specialized Optimizer, Compressor, Resizer, or Converter tools.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What should I do if my image is too large?</summary>
        <p>
          Click the "Optimize for Website" or "Compress Image" button. Our tools will downscale the
          dimensions and apply modern lossy encoding to reduce the file size.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can I optimize the image after analyzing it?</summary>
        <p>
          Yes. Clicking any of the recommended action buttons transfers your active image into the
          corresponding tool in browser memory without requiring you to re-upload.
        </p>
      </details>
    </div>
  );
}

export default AnalyzeContent;
