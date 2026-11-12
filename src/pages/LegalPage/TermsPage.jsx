import { FileText } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { ROUTES } from '@/routes/paths';
import styles from './LegalPage.module.css';

export function TermsPage() {
  const lastUpdated = 'November 12, 2026';

  return (
    <div className={styles.legalPage}>
      <SeoHead
        title="Terms of Service — Image Convert by WebToolOcean"
        description="Review the Terms of Service governing your use of Image Convert by WebToolOcean. Free, unrestricted, and transparent terms for online image editing."
        canonicalPath={ROUTES.terms}
      />
      <div className="container">
        <header className={styles.legalHeader}>
          <div className={styles.legalBadge}>
            <FileText size={14} style={{ marginRight: '6px' }} /> Terms of Service
          </div>
          <h1 className={styles.legalTitle}>Terms of Service</h1>
          <p className={styles.legalMeta}>Last updated: {lastUpdated} • Image Convert by WebToolOcean</p>
        </header>

        <div className={styles.legalCard}>
          <div className={styles.callout}>
            <p>
              <strong>Key Point:</strong> Image Convert is a free online tool suite provided by WebToolOcean.
              You retain <strong>100% intellectual property ownership</strong> of every photograph and graphic you process.
              We do not claim any copyright, license, or right to your images.
            </p>
          </div>

          <div className={styles.legalContent}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using <strong>Image Convert</strong> (the "Service"), you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms,
              you should discontinue use of the Service immediately.
            </p>

            <h2>2. Permitted Use &amp; Intellectual Property Ownership</h2>
            <p>
              We grant you a free, non-exclusive, revocable license to use Image Convert for personal, educational, and commercial purposes.
            </p>
            <ul>
              <li><strong>Your Images:</strong> You retain complete ownership, copyright, and all intellectual property rights to any original images uploaded, processed, converted, or generated via our tools.</li>
              <li><strong>Our Platform:</strong> The code, user interface, brand name ("Image Convert"), logos, visual designs, and software architecture are the intellectual property of WebToolOcean and are protected by applicable copyright and trademark laws.</li>
            </ul>

            <h2>3. User Responsibilities &amp; Acceptable Use</h2>
            <p>You agree not to use Image Convert to:</p>
            <ul>
              <li>Process content that is illegal, defamatory, harmful, infringing on third-party trademarks or copyrights, or in violation of privacy laws.</li>
              <li>Attempt to disrupt, reverse engineer, overload, or compromise the technical infrastructure, servers, or networks supporting the website.</li>
              <li>Circumvent or manipulate any advertising or analytics integrations deployed on the site.</li>
            </ul>

            <h2>4. Free Service &amp; Modifications</h2>
            <p>
              Image Convert is provided completely free of charge. We reserve the right to modify, enhance, suspend, or discontinue
              any feature or tool within the suite at any time without prior notice or liability.
            </p>

            <h2>5. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind,
              either express or implied. WebToolOcean does not warrant that the tools will be uninterrupted, error-free, or compatible
              with every historical browser version or obscure image codec.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, WebToolOcean, its contributors, and affiliates shall not be liable
              for any direct, indirect, incidental, consequential, or punitive damages resulting from your access to or inability
              to use the Service, including any loss of data, corrupt image files, or hardware failures.
            </p>

            <h2>7. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which WebToolOcean operates,
              without regard to conflict of law principles.
            </p>

            <h2>8. Contact Us</h2>
            <p>
              Questions regarding these Terms of Service should be directed to:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:webtoolocean@gmail.com" style={{ color: 'var(--color-primary)' }}>webtoolocean@gmail.com</a></li>
              <li><strong>Website:</strong> <a href="https://webtoolocean.com" target="_blank" rel="noreferrer">webtoolocean.com</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;

