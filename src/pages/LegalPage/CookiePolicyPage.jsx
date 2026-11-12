import { Cookie } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { ROUTES } from '@/routes/paths';
import styles from './LegalPage.module.css';

export function CookiePolicyPage() {
  const lastUpdated = 'November 12, 2026';

  return (
    <div className={styles.legalPage}>
      <SeoHead
        title="Cookie Policy — Image Convert by WebToolOcean"
        description="Learn about the cookie and local storage policies of Image Convert by WebToolOcean. Understand essential, analytical, and advertising cookies."
        canonicalPath={ROUTES.cookies}
      />
      <div className="container">
        <header className={styles.legalHeader}>
          <div className={styles.legalBadge}>
            <Cookie size={14} style={{ marginRight: '6px' }} /> Cookie Policy
          </div>
          <h1 className={styles.legalTitle}>Cookie Policy</h1>
          <p className={styles.legalMeta}>Last updated: {lastUpdated} • Image Convert by WebToolOcean</p>
        </header>

        <div className={styles.legalCard}>
          <div className={styles.callout}>
            <p>
              <strong>Summary:</strong> We use minimal cookies and local browser storage to keep the website functional,
              remember your preferred settings, and display non-intrusive advertisements that help keep this tool 100% free.
            </p>
          </div>

          <div className={styles.legalContent}>
            <h2>1. What Are Cookies?</h2>
            <p>
              A cookie is a small text file stored on your browser or hard drive when you visit a website. Cookies allow websites
              to identify your device, remember user preferences across sessions, and assist in serving relevant advertisements.
            </p>

            <h2>2. Types of Cookies We Use</h2>
            <p>Our website utilizes the following categories of cookies and web storage mechanisms:</p>

            <h3>A. Essential &amp; Functional Web Storage</h3>
            <p>
              These are necessary for the website to function properly. We use browser LocalStorage to save your chosen
              UI options (such as default image format preferences, crop ratios, or dark/light themes). LocalStorage does not
              transmit data over the network and remains confined to your browser.
            </p>

            <h3>B. Advertising Cookies (Google AdSense)</h3>
            <p>
              To maintain Image Convert as a free utility without subscription charges, we partner with Google AdSense to display
              advertisements. Google and its third-party advertising partners use cookies to serve ads based on your prior visits
              to our website and other sites across the internet.
            </p>
            <ul>
              <li>These cookies help present ads that are relevant to your interests while preventing the same advertisement from appearing repeatedly.</li>
              <li>Google uses the <em>DoubleClick</em> cookie and similar identifiers to facilitate interest-based advertising.</li>
            </ul>

            <h3>C. Performance &amp; Analytics Cookies</h3>
            <p>
              We may utilize aggregate analytics tools to observe general traffic patterns, popular tools, browser compatibility,
              and error rates. These cookies do not identify you personally.
            </p>

            <h2>3. Managing &amp; Disabling Cookies</h2>
            <p>
              You have full control over your cookie preferences at any time. You can customize which cookies you allow on Image Convert:
            </p>
            <div style={{ margin: '16px 0 24px 0' }}>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(90deg, #8929c0 0%, #d84697 52%, #f27e4b 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(137, 41, 192, 0.3)',
                }}
              >
                Manage Cookie Preferences
              </button>
            </div>
            <p>
              Additionally, most web browsers allow you to modify your browser settings to decline cookies if you prefer:
            </p>
            <ul>
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Third-party cookies.</li>
              <li><strong>Firefox:</strong> Settings → Privacy &amp; Security → Enhanced Tracking Protection.</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Block all cookies.</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions.</li>
            </ul>
            <p>
              To opt out of personalized Google advertising specifically, visit the{' '}
              <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">Google Ads Settings</a> page.
            </p>

            <h2>4. Updates to This Cookie Policy</h2>
            <p>
              We may update this policy periodically to align with operational or regulatory changes. The date at the top of this
              page will always indicate when it was last revised.
            </p>

            <h2>5. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please email us at:
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

export default CookiePolicyPage;

