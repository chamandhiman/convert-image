import styles from './ConvertContent.module.css';

/**
 * Educational / SEO content for the Image Converter page.
 *
 * Provides genuine, practical advice on image formats, trade-offs, rasterization,
 * browser-based privacy, and common questions.
 */
function ConvertContent() {
  return (
    <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>What is an Image Converter?</h2>
      <p>
        An image converter transforms a digital picture from one file encoding into
        another. Different file formats use different mathematical methods to store
        pixels, palettes, compression tables, and transparency. Converting an image
        allows you to adapt your files to specific platform requirements, optimize
        loading speeds on web pages, reduce storage footprints, or ensure compatibility
        with older software.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Convert JPG, PNG, WebP and More</h2>
      <p>
        Modern digital imaging relies on a diverse set of standard formats. This tool
        allows you to interchange between universal raster formats (JPEG and PNG),
        modern web formats (WebP and AVIF), animated GIF frames, and scalable vector
        graphics (SVG).
      </p>
      <dl className={styles.formatList}>
        <div className={styles.formatEntry}>
          <dt>JPG / JPEG</dt>
          <dd>
            The world standard for photographic imagery since 1992. It uses discrete
            cosine transform (DCT) lossy compression to discard subtle color variations
            that human vision rarely notices. It does not support transparency.
          </dd>
        </div>
        <div className={styles.formatEntry}>
          <dt>PNG</dt>
          <dd>
            Portable Network Graphics is a lossless format featuring 8-bit alpha
            transparency. It preserves sharp contrast and exact pixel values, making it
            the benchmark for user interfaces, typography, logos, and technical diagrams.
          </dd>
        </div>
        <div className={styles.formatEntry}>
          <dt>WebP</dt>
          <dd>
            Created specifically for the modern web, WebP supports both lossy and lossless
            compression, transparent alpha channels, and animation. WebP images typically
            weigh 25% to 35% less than equivalent JPEGs without visible loss in quality.
          </dd>
        </div>
        <div className={styles.formatEntry}>
          <dt>AVIF</dt>
          <dd>
            An advanced open-source format derived from the AV1 video codec. It provides
            industry-leading compression efficiency, especially at low bitrates. Encoding
            support depends on browser capabilities.
          </dd>
        </div>
        <div className={styles.formatEntry}>
          <dt>SVG (Vector Input)</dt>
          <dd>
            Scalable Vector Graphics use XML coordinates instead of pixel matrices.
            Converting an SVG to JPG, PNG, or WebP renders the vector artwork into fixed
            pixel dimensions (rasterization).
          </dd>
        </div>
      </dl>

      {/* ------------------------------------------------------------------ */}
      <h2>JPG vs PNG vs WebP</h2>
      <p>
        Comparing these formats comes down to three factors: compression method,
        transparency support, and browser adoption.
      </p>
      <ul>
        <li>
          <strong>Compression:</strong> JPG is lossy; PNG is lossless; WebP supports both.
        </li>
        <li>
          <strong>Transparency:</strong> PNG and WebP support full alpha transparency; JPG
          replaces transparent areas with a solid background color (white in this tool).
        </li>
        <li>
          <strong>File Size:</strong> For complex photos, WebP is smallest, followed by JPG,
          with PNG typically being largest. For simple illustrations or icons, PNG and
          lossless WebP are often smaller and sharper than JPG.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>When Should You Use WebP?</h2>
      <p>
        Use WebP whenever you are publishing pictures to the web, mobile applications,
        or email newsletters. All modern browsers (Chrome, Safari, Firefox, Edge) now
        fully support WebP decoding. Switching from JPG or PNG to WebP is one of the
        easiest ways to improve Core Web Vitals and page load times.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>When Should You Use PNG?</h2>
      <p>
        Use PNG when you require transparency or when your image contains fine lines,
        geometric icons, typography, or UI screenshots. Because PNG is lossless, text
        remains sharp and colors stay true across repeated saves.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>When Should You Use JPG?</h2>
      <p>
        Use JPG when maximum backwards compatibility is necessary. Legacy software,
        older embedded systems, specialized photo printing services, and office
        productivity suites often work most reliably with standard JPEG files.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>What Happens When an Image is Converted?</h2>
      <p>
        When you convert an image, your browser decodes the source file into raw pixel
        data (RGB/RGBA channels). Next, the target encoder rebuilds that pixel grid into
        the requested container format. If the source had transparent areas and the target
        is JPG, a white background is automatically applied beneath the artwork to
        prevent dark artifacts. If the target is WebP or JPG, the selected quality factor
        governs how much detail is preserved during mathematical quantization.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Image Quality and Compression</h2>
      <p>
        When selecting a quality level for lossy conversions (JPG, WebP, or AVIF), keep
        the intended destination in mind:
      </p>
      <ul>
        <li>
          <strong>80% to 90%:</strong> The sweet spot for high-resolution web banners and
          hero graphics. Virtually indistinguishable from original source photos.
        </li>
        <li>
          <strong>70% to 80%:</strong> Excellent for blog illustrations, ecommerce catalogs,
          and content feeds where saving bandwidth is important.
        </li>
        <li>
          <strong>PNG (Lossless):</strong> Quality sliders do not apply to PNG because PNG
          stores every pixel losslessly. The file size is determined entirely by the image's
          dimensions and color entropy.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Why Browser-Based Conversion is Private</h2>
      <p>
        Traditional online converters transmit your files across the internet to a remote
        cloud server, convert them in a container, and send them back. This introduces
        several risks:
      </p>
      <ul>
        <li>
          <strong>Zero Cloud Exposure:</strong> Your photos, documents, and sensitive
          designs never travel over the network. They never touch a remote hard drive.
        </li>
        <li>
          <strong>Instant Speed:</strong> Because there is zero upload and zero download
          latency, processing completes in milliseconds using your local device CPU.
        </li>
        <li>
          <strong>No Third-Party Tracking:</strong> No metadata, location tags, or file
          contents are cataloged, analyzed, or shared.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Frequently Asked Questions</h2>

      <details className={styles.faq}>
        <summary>Is my image uploaded to any server?</summary>
        <p>
          No. All conversion and rendering happens directly in your browser using the
          HTML5 Canvas API. Your files never leave your computer or phone.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Which formats can I convert?</summary>
        <p>
          You can upload JPG, JPEG, PNG, WebP, AVIF, GIF, and SVG files. You can convert
          them into JPG, PNG, WebP, and AVIF (on supported browsers).
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does converting an image reduce quality?</summary>
        <p>
          Converting to PNG is 100% lossless and retains all pixel details. Converting to
          JPG or WebP uses lossy compression, but at default settings (80%–85%), visual
          degradation is virtually invisible to the human eye while producing substantially
          smaller files.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can I convert PNG to JPG?</summary>
        <p>
          Yes. When converting a transparent PNG to JPG, the transparent areas are
          automatically rendered with a crisp white background, as JPG does not support
          transparency.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can I convert JPG to WebP?</summary>
        <p>
          Yes. Converting JPG to WebP is one of the most popular conversions for web
          developers, often yielding a 25% to 35% file size reduction with no perceptible
          drop in image clarity.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Why is AVIF unavailable in my browser?</summary>
        <p>
          While most modern browsers can display (decode) AVIF images, client-side
          encoding through the Canvas API is only implemented in certain browsers and
          operating system builds. If your browser does not yet support canvas AVIF
          encoding, the option is clearly marked and disabled, allowing you to choose WebP
          or JPG instead.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can I convert SVG to PNG?</summary>
        <p>
          Yes. Uploading an SVG allows you to rasterize your vector artwork into a high-quality
          PNG, JPG, or WebP pixel graphic at its native resolution.
        </p>
      </details>
    </div>
  );
}

export default ConvertContent;
