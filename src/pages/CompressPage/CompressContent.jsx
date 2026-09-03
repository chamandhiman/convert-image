import styles from './CompressContent.module.css';

/**
 * Educational / SEO content for the image compression page.
 *
 * Written as genuine, useful reference material — not keyword stuffing.
 */
function CompressContent() {
  return (
    <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>Compress Images Online</h2>
      <p>
        Image compression reduces file size so images load faster on websites,
        take up less storage, and are quicker to share. This tool runs entirely
        in your browser — your images are never uploaded to a server, which
        means your files stay private and results appear instantly.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>How Image Compression Works</h2>
      <p>
        Digital images store colour information for every pixel, which adds up
        quickly. A 4000 × 3000 pixel photo has twelve million pixels, and each
        one needs several bytes of data. Compression algorithms reduce this
        data by finding patterns, removing redundancy, or selectively
        discarding details the human eye is unlikely to notice.
      </p>
      <p>
        When you adjust the quality slider in this tool, you control how
        aggressively those details are discarded. Lower values produce smaller
        files but may introduce visible artefacts. Higher values preserve more
        detail at the cost of larger output.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Lossy vs Lossless Compression</h2>
      <p>
        <strong>Lossy compression</strong> permanently removes some image data
        to achieve smaller files. JPEG and WebP both use lossy encoding by
        default. At moderate quality levels (70–85 %), the difference is
        usually imperceptible for photographs, while file sizes can drop by
        60–80 %.
      </p>
      <p>
        <strong>Lossless compression</strong> reduces file size without losing
        any image data. PNG uses lossless encoding, which is why it tends to
        produce larger files than JPEG for photographs but is ideal for
        graphics, screenshots, and images with text where every pixel matters.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Choosing the Right Quality Level</h2>
      <p>
        There is no single correct quality setting — the right value depends on
        how the image will be used.
      </p>
      <ul>
        <li>
          <strong>90–100 %</strong> — Archival or print work where maximum
          fidelity is essential. File size reduction is modest.
        </li>
        <li>
          <strong>75–85 %</strong> — A reliable default for web images. Good
          balance between visual quality and file size.
        </li>
        <li>
          <strong>50–70 %</strong> — Thumbnails, social media previews, or
          bandwidth-constrained contexts. Artefacts may be visible on close
          inspection.
        </li>
        <li>
          <strong>Below 50 %</strong> — Useful when file size matters more
          than appearance, such as email attachments with strict limits.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Supported Image Formats</h2>
      <dl className={styles.formatList}>
        <div className={styles.formatEntry}>
          <dt>JPEG</dt>
          <dd>
            The most widely supported image format. Best for photographs and
            images with gradual colour transitions. Supports lossy compression
            with adjustable quality.
          </dd>
        </div>
        <div className={styles.formatEntry}>
          <dt>PNG</dt>
          <dd>
            A lossless format well suited to graphics, screenshots, and images
            with sharp edges or text. Does not support quality-based
            compression — file size depends on image complexity.
          </dd>
        </div>
        <div className={styles.formatEntry}>
          <dt>WebP</dt>
          <dd>
            A modern format developed by Google that supports both lossy and
            lossless compression. Typically produces files 25–35 % smaller than
            JPEG at comparable quality. Supported in all modern browsers.
          </dd>
        </div>
        <div className={styles.formatEntry}>
          <dt>AVIF</dt>
          <dd>
            A newer format based on the AV1 video codec. Offers excellent
            compression efficiency but browser encoding support varies. This
            tool accepts AVIF as input; output support depends on your browser.
          </dd>
        </div>
      </dl>

      {/* ------------------------------------------------------------------ */}
      <h2>Why Local Browser Processing Is Useful</h2>
      <p>
        Most online image tools upload your files to a remote server for
        processing. That approach introduces privacy concerns, depends on
        server availability, and adds network latency. Client-side processing
        avoids all of those issues:
      </p>
      <ul>
        <li>
          Your images never leave your device — there is nothing to intercept,
          store, or leak.
        </li>
        <li>
          Processing is instant because there is no upload or download step.
        </li>
        <li>
          The tool works offline once the page has loaded. No internet
          connection is required for compression.
        </li>
        <li>
          Large files are not constrained by upload limits or server timeouts.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Frequently Asked Questions</h2>

      <details className={styles.faq}>
        <summary>Is there a file size limit?</summary>
        <p>
          The tool accepts images up to 50 MB. Because processing runs locally,
          the practical limit depends on your device's available memory rather
          than a server constraint.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Will compression reduce image quality?</summary>
        <p>
          Lossy formats like JPEG and WebP discard some detail to reduce file
          size. At quality settings of 75 % or higher, the difference is
          usually not noticeable for photographs. PNG output is always
          lossless — no quality is lost.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can I compress multiple images at once?</summary>
        <p>
          This version handles one image at a time. Batch processing may be
          added in a future update.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Are my images uploaded anywhere?</summary>
        <p>
          No. Everything happens inside your browser using the Canvas API. Your
          images are never sent to a server, stored remotely, or shared with
          third parties.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Why did the file get larger after compression?</summary>
        <p>
          This can happen when converting from a highly optimised format to a
          less efficient one — for example, converting a small, optimised JPEG
          to PNG. It can also occur at very high quality settings. Try lowering
          the quality or choosing a different output format.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does this work offline?</summary>
        <p>
          Yes. Once the page has loaded, no internet connection is needed. The
          compression logic runs entirely in your browser.
        </p>
      </details>
    </div>
  );
}

export default CompressContent;
