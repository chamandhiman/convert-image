import { ShieldCheck } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { ROUTES } from '@/routes/paths';
import styles from './LegalPage.module.css';

export function PrivacyPolicyPage() {
  const lastUpdated = 'November 12, 2026';

  return (
    <div className={styles.legalPage}>
      <SeoHead
        title="Privacy Policy — Image Convert by WebToolOcean"
        description="Read the Privacy Policy for Image Convert by WebToolOcean. Understand how our client-side architecture guarantees your photos never leave your device."
        canonicalPath={ROUTES.privacy}
      />
      <div className="container">
        <header className={styles.legalHeader}>
          <div className={styles.legalBadge}>
            <ShieldCheck size={14} style={{ marginRight: '6px' }} /> Privacy Policy
          </div>
          <h1 className={styles.legalTitle}>Privacy Policy</h1>
          <p className={styles.legalMeta}>Last updated: {lastUpdated} • Image Convert by WebToolOcean</p>
        </header>

        <div className={styles.legalCard}>
          <div className={styles.callout}>
            <p>
              <strong>Summary in Plain English:</strong> Image Convert is built with a strict <em>local-first</em> philosophy.
              When you convert, compress, resize, restore, crop, or remove backgrounds from images, all processing happens entirely
              inside your web browser using HTML5 Canvas, WebAssembly, and WebGPU. <strong>Your photos are never uploaded to our servers,
              never stored in cloud databases, and never seen by anyone.</strong>
            </p>
          </div>

          <div className={styles.legalContent}>
            <h2>1. Introduction</h2>
            <p>
              This Privacy Policy explains how WebToolOcean ("we", "us", or "our") collects, uses, and safeguards information
              when you visit and use our web application, <strong>Image Convert</strong> (accessible at{' '}
              <a href="https://image.webtoolocean.com">image.webtoolocean.com</a>).
            </p>
            <p>
              We respect your right to privacy and are committed to protecting it through our client-side technology architecture.
              Please read this document carefully to understand our privacy practices.
            </p>

            <h2>2. Image Processing &amp; Zero-Upload Guarantee</h2>
            <p>
              Unlike conventional online image utilities that send your image files across the internet to remote cloud servers,
              Image Convert executes all computer vision algorithms, neural models, transformations, and compression codecs
              locally within your device’s browser sandbox.
            </p>
            <ul>
              <li><strong>No File Uploads:</strong> Your image files (JPG, PNG, WebP, GIF, SVG, etc.) never leave your computer or phone.</li>
              <li><strong>No Image Storage:</strong> We do not operate server-side storage, caches, or temporary directories for your media.</li>
              <li><strong>Local Memory Only:</strong> Files are held temporarily in your browser's local RAM and are instantly discarded when you close or reload the browser tab.</li>
            </ul>

            <h2>3. Information We Collect Automatically</h2>
            <p>
              When you browse our website, minimal standard technical information may be collected automatically by our hosting infrastructure or analytics providers:
            </p>
            <ul>
              <li><strong>Log Data:</strong> Standard HTTP server request logs such as IP address, browser type, operating system, referring URL, and timestamp.</li>
              <li><strong>Performance Metrics:</strong> Aggregate, anonymized performance metrics (e.g., page load speeds, WebAssembly initialization status) to diagnose technical bugs.</li>
              <li><strong>Local Storage:</strong> We use HTML5 LocalStorage solely to remember your tool preferences (such as preferred compression level or theme settings) directly on your device.</li>
            </ul>

            <h2>4. Cookies &amp; Third-Party Advertising (Google AdSense)</h2>
            <p>
              We may display advertisements provided by Google AdSense and its advertising partners to support the free operation of this service.
            </p>
            <ul>
              <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites on the internet.</li>
              <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visits to our site and/or other sites on the Internet.</li>
              <li>Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">Google Ads Settings</a>.</li>
              <li>Alternatively, you can opt out of third-party vendor use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">aboutads.info</a>.</li>
            </ul>

            <h2>5. Third-Party Links &amp; Content Delivery Networks (CDNs)</h2>
            <p>
              Our application loads static open-source AI weights and scripts from public content delivery networks (such as JSDelivr and cdnjs).
              When your browser retrieves these public files, the CDN provider may record standard access logs according to their own respective privacy policies.
            </p>

            <h2>6. Children's Online Privacy Protection Act (COPPA)</h2>
            <p>
              Our website does not knowingly collect personally identifiable information from children under the age of 13.
              Because our tools require no user accounts or registrations, no child data is ever requested or retained.
            </p>

            <h2>7. Data Protection Rights (GDPR &amp; CCPA)</h2>
            <p>
              Under regulations like the European General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA),
              individuals hold rights regarding access, deletion, and portability of personal information. Because Image Convert does
              not require registration or transmit personal image files to any database, we do not possess identifiable personal records.
            </p>

            <h2>8. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in legal requirements or website features.
              The "Last updated" date at the top of this page indicates the most recent revision.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have any questions or feedback regarding this Privacy Policy, please reach out to our team:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:webtoolocean@gmail.com" style={{ color: 'var(--color-primary)' }}>webtoolocean@gmail.com</a></li>
              <li><strong>Website:</strong> <a href="https://webtoolocean.com" target="_blank" rel="noreferrer">webtoolocean.com</a></li>
              <li><strong>Feedback Form:</strong> Visit our <a href={ROUTES.contact}>Contact &amp; Feedback</a> page.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;

