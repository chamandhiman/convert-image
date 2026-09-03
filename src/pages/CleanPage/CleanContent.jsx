import styles from './CleanContent.module.css';

/**
 * Educational / SEO content for the Image Privacy Cleaner tool.
 *
 * Explains EXIF metadata, GPS geotagging, browser-based clean rasterization,
 * security trade-offs, limitations of metadata inspection, and includes
 * an accessible FAQ accordion.
 */
function CleanContent() {
  return (
    <div className={styles.prose}>
      {/* ------------------------------------------------------------------ */}
      <h2>What Information Can Images Contain?</h2>
      <p>
        Digital photos are more than just an arrangement of colored pixels. When you snap a
        picture with a smartphone, digital camera, or drone, the recording device automatically
        embeds hidden diagnostic and contextual data directly into the file headers. This
        invisible payload can include precise GPS coordinates showing where you stood, the exact
        second the shutter clicked, your device's unique model and serial numbers, lens
        specifications, camera settings, and the editing software used.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>What is Image Metadata?</h2>
      <p>
        Metadata literally means "data about data." In photography, it serves as a digital index
        card attached to the image file. While useful for professional cataloging, photo
        management software, and copyright registries, metadata presents serious privacy
        vulnerabilities when personal photos are uploaded to public forums, shared in direct
        messages, or posted online without sanitization.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>What is EXIF Data?</h2>
      <p>
        Exchangeable Image File Format (EXIF) is the international standard governing how digital
        cameras record metadata inside JPEG, TIFF, and WebP containers. Established in 1998, EXIF
        specifies standardized tags for:
      </p>
      <ul>
        <li>
          <strong>Device Details:</strong> Camera manufacturer, specific model, lens type, and
          firmware version.
        </li>
        <li>
          <strong>Capture Timestamps:</strong> The exact date, hour, minute, and second the photo
          was taken and digitized.
        </li>
        <li>
          <strong>Exposure Settings:</strong> Focal length, aperture (f-stop), shutter speed,
          ISO sensitivity, and flash status.
        </li>
        <li>
          <strong>Embedded Thumbnails:</strong> Low-resolution preview copies of the original
          photo stored inside the header.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Why Photos Can Contain Location Information</h2>
      <p>
        Modern smartphones and mobile devices feature built-in GPS receivers. Unless location
        permissions are explicitly disabled in your device's camera settings, your phone writes
        high-precision latitude, longitude, and altitude coordinates directly into the EXIF GPS
        sub-directory of every photograph you take. Anyone who downloads the raw file can read
        these coordinates to identify your home address, your workplace, or your children's
        schools with pinpoint accuracy.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>What Happens When You Remove Image Metadata?</h2>
      <p>
        This tool creates a fresh, clean rasterized copy of your image locally in your browser.
        By decoding the raw pixel matrix onto an isolated HTML5 Canvas and re-encoding it into a
        new file, the standard browser encoding pipeline generates completely new container
        headers containing only the necessary pixel dimensions and color profile. The old EXIF
        block, GPS tags, device serials, and author entries are completely discarded.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>When Should You Clean Image Metadata?</h2>
      <p>
        You should sanitize image metadata prior to:
      </p>
      <ul>
        <li>Posting photos of your home, vehicle, or family on social media or public forums.</li>
        <li>Selling personal belongings on classified marketplaces or auction websites.</li>
        <li>Sharing sensitive work screenshots or client design deliverables.</li>
        <li>Submitting photos to public bug trackers or open-source repositories.</li>
        <li>Sending confidential images via email or unencrypted chat applications.</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Does Removing Metadata Change the Image?</h2>
      <p>
        The visible picture itself remains unchanged: its visual composition, colors, and
        physical pixel dimensions are preserved. However, because creating a clean copy involves
        re-encoding the pixel grid, the final file size may vary slightly based on the chosen
        output format and quality setting. If you select PNG, the re-encoding is strictly
        lossless. If you select JPEG or WebP, a high quality setting (such as 90%) ensures that
        no humanly perceptible compression artifacts are introduced.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Why Browser-Based Processing is Useful for Private Images</h2>
      <p>
        Sending sensitive photographs to a remote cloud-based metadata scrubber defeats the
        purpose of privacy:
      </p>
      <ul>
        <li>
          <strong>Zero Server Uploads:</strong> Your files never travel across the internet and
          never touch an external server or database.
        </li>
        <li>
          <strong>Complete Offline Operation:</strong> All inspection, canvas decoding, and
          re-encoding run entirely within your local browser sandbox.
        </li>
        <li>
          <strong>No Retention Risk:</strong> Once you close the tab, all in-memory buffers are
          instantly cleared by your browser.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      <h2>Limitations of Browser-Based Metadata Inspection</h2>
      <p>
        While this tool inspects standard EXIF markers (including GPS, camera make/model,
        timestamps, and orientation) from JPEG, PNG, and WebP containers, it does not claim to
        perform forensic reverse-engineering of proprietary manufacturer binary blobs
        ("MakerNotes"), obscure steganographic watermarks, or non-standard container formats.
        However, because the cleaning step generates a completely new canvas raster file rather
        than simply editing header tags, non-standard hidden metadata blocks are naturally
        excluded by the browser's fresh encoder.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Frequently Asked Questions</h2>

      <details className={styles.faq}>
        <summary>What is image metadata?</summary>
        <p>
          Image metadata is hidden information embedded inside a picture file by cameras, phones,
          and software. It commonly includes the date and time taken, camera model, GPS coordinates,
          and editing software names.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can photos contain my location?</summary>
        <p>
          Yes. If location services were active when the picture was taken on a phone or camera,
          exact latitude, longitude, and altitude coordinates are frequently embedded in the
          file's EXIF GPS block.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does every image contain GPS data?</summary>
        <p>
          No. Screenshots, downloaded web images, and photos taken with location permissions
          disabled generally do not contain GPS data. The inspector above clearly identifies
          whether location data is detected in your specific file.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does this tool upload my image?</summary>
        <p>
          No. All inspection, decoding, and clean copy generation execute entirely on your device
          using client-side JavaScript and the HTML5 Canvas API. Nothing is uploaded to any server.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does cleaning metadata reduce image quality?</summary>
        <p>
          If you choose PNG, the clean copy is 100% lossless. If you choose JPEG or WebP, a high
          quality setting (90%) is applied by default, keeping the picture visually identical to the
          original while ensuring all metadata headers are discarded.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does this remove GPS information?</summary>
        <p>
          Yes. Generating a new canvas image copy leaves behind all original EXIF segments,
          including GPS coordinates, location names, and elevation data.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does this remove camera information?</summary>
        <p>
          Yes. Camera make, model, lens parameters, serial numbers, and exposure settings are not
          included in the newly encoded clean image.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Can every type of metadata be detected?</summary>
        <p>
          Our inspector scans standard EXIF, GPS, camera, timestamp, and container text blocks.
          Proprietary encrypted camera manufacturer tags may not be individually decipherable, but
          the cleaning process removes them regardless by re-encoding a fresh image.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>Does cleaning an image change its dimensions?</summary>
        <p>
          No. The clean copy retains the exact native width and height in pixels of your original
          image.
        </p>
      </details>

      <details className={styles.faq}>
        <summary>What formats are supported?</summary>
        <p>
          You can inspect and clean JPEG, PNG, WebP, AVIF, and GIF files.
        </p>
      </details>
    </div>
  );
}

export default CleanContent;
