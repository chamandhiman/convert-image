import styles from './ResizeContent.module.css';

/**
 * Educational / SEO content for the Image Resizer tool.
 *
 * Provides practical guidance on image scaling, pixel dimensions, aspect ratio
 * preservation, website optimization guidelines, and common FAQs.
 */
function ResizeContent() {
  return (
    <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>What Does Image Resizing Do?</h2>
      <p>
        Image resizing alters the physical pixel dimensions (width and height) of a digital
        picture. When you downscale an image, the browser recalculates the pixel grid using
        interpolation algorithms, blending adjacent pixels into a smaller matrix. Unlike
        pure compression—which reduces file size by altering how color data is stored—resizing
        directly removes excess pixels that your target screen or layout may never display.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Resize Images by Width and Height</h2>
      <p>
        Specifying exact pixel dimensions is crucial when designing for defined container
        slots, such as hero banners (e.g., 1920 × 1080 px), blog thumbnails (e.g., 1200 × 630 px),
        or product avatars (e.g., 400 × 400 px). Setting explicit width and height eliminates
        browser layout shifts (Cumulative Layout Shift) and ensures images fit their designated
        spaces precisely.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Resize Images Without Changing Aspect Ratio</h2>
      <p>
        An image's aspect ratio is the proportional relationship between its width and
        height. Keeping the aspect ratio locked guarantees that your subject does not appear
        stretched, squashed, or distorted. When the aspect ratio lock is enabled in this
        tool, adjusting the width automatically calculates the matching height (and vice
        versa), preserving natural geometry. Unlocking the aspect ratio allows you to skew or
        stretch the image to custom proportions when needed.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Pixels vs. Percentage Resizing</h2>
      <p>
        Depending on your goal, one resizing method is often more convenient than the other:
      </p>
      <ul>
        <li>
          <strong>Exact Pixels (px):</strong> Best when targeting strict platform requirements,
          such as social media header specifications, print layouts, or specific web layout
          breakpoints.
        </li>
        <li>
          <strong>Percentage (%):</strong> Ideal for quick, uniform downscaling—for example,
          reducing a massive 24-megapixel camera capture to 50% or 25% of its original size
          to send via email or message without worrying about exact pixel math.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>When Should You Resize an Image?</h2>
      <p>
        Modern cameras and smartphones routinely capture photographs at resolutions of
        4000 × 3000 pixels or higher. While ideal for large prints, displaying such images on a
        phone or laptop screen wastes bandwidth and processing power. You should resize images:
      </p>
      <ul>
        <li>Before publishing to a blog, portfolio, or ecommerce store.</li>
        <li>To prepare responsive `srcset` image sizes (e.g., desktop, tablet, and mobile versions).</li>
        <li>When uploading profile pictures or avatars that only display in small circles or squares.</li>
        <li>To reduce memory consumption in mobile apps and digital presentations.</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>How Image Dimensions Affect File Size</h2>
      <p>
        File size scales quadratically with image dimensions. Reducing an image's width and
        height by 50% (e.g., from 2000 × 2000 px to 1000 × 1000 px) does not just cut the file
        size in half—it reduces the total pixel count from 4,000,000 to 1,000,000 pixels (a 75%
        reduction in raw pixel data). Consequently, resizing is one of the most effective ways
        to achieve dramatic file size savings before applying compression.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Choosing the Right Image Dimensions for Websites</h2>
      <p>
        Standard web guidelines recommend sizing images to match the maximum resolution at
        which they will be viewed:
      </p>
      <ul>
        <li>
          <strong>Full-width Hero Banners:</strong> 1920 to 2560 px wide (covers full HD and QHD desktop screens).
        </li>
        <li>
          <strong>Standard Blog & Article Images:</strong> 1200 to 1400 px wide.
        </li>
        <li>
          <strong>Card & Grid Thumbnails:</strong> 600 to 800 px wide.
        </li>
        <li>
          <strong>Profile Photos & Icons:</strong> 200 to 400 px wide.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Image Quality After Resizing</h2>
      <p>
        This tool uses high-quality bicubic interpolation built into modern browser Canvas
        engines (`imageSmoothingQuality: 'high'`). Downscaling maintains crisp edges and smooth
        gradients. However, upscaling an image significantly beyond its native resolution
        cannot invent missing detail and may result in softness or pixelation. For best
        results, downscale from higher-resolution sources whenever possible.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Why Browser-Based Resizing is Private</h2>
      <p>
        Unlike cloud services that upload your personal or business imagery to remote servers,
        this tool performs every calculation entirely inside your local web browser:
      </p>
      <ul>
        <li>Your files are never transmitted over the internet or stored on a remote server.</li>
        <li>Processing is instantaneous because there is no upload or download queue.</li>
        <li>The tool functions completely offline once the page is loaded.</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Frequently Asked Questions</h2>

      <details className={styles.faq}>
        <summary>Can I resize an image without losing quality?</summary>
        <p>
          When downscaling (making an image smaller), modern interpolation algorithms blend
          pixels seamlessly, preserving sharp details and color balance. When upscaling (making
          an image larger), the browser must extrapolate new pixels, which can cause slight
          blurriness or softness.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What happens when I lock the aspect ratio?</summary>
        <p>
          Locking the aspect ratio preserves the exact width-to-height proportion of your
          original image. When you change the width, the height automatically updates to match,
          preventing distortion or unnatural stretching.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What is the difference between resizing and compressing?</summary>
        <p>
          Resizing changes the pixel dimensions (width × height) of the image. Compressing
          optimizes how color and pixel data are mathematically stored without changing the
          pixel count. Combining both techniques yields the smallest possible file sizes for
          the web.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can I make an image larger?</summary>
        <p>
          Yes. You can enter larger pixel dimensions or select percentages above 100% (such as
          150% or 200%). Keep in mind that enlarging raster images cannot add original optical
          detail, so slight softness is natural.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can I resize JPG, PNG, and WebP images?</summary>
        <p>
          Yes. You can upload JPG, PNG, WebP, AVIF, GIF, or SVG images and output them as
          JPG, PNG, WebP, or AVIF (where browser support allows), or simply keep the original
          format.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does resizing change the image file size?</summary>
        <p>
          Yes, dramatically. Because reducing image dimensions directly reduces the number of
          pixels that need to be stored, downscaling typically results in significant file size
          reductions.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Are my images uploaded to any server?</summary>
        <p>
          No. Everything executes client-side in your web browser via the Canvas API. Your
          images never leave your device.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What dimensions should I use for a website?</summary>
        <p>
          For full-screen background banners, 1920 × 1080 px is standard. For blog content and
          social share cards, 1200 × 630 px is recommended. For product thumbnails, 600 × 600 px
          or 800 × 800 px works best.
        </p>
      </details>
    </div>
  );
}

export default ResizeContent;
