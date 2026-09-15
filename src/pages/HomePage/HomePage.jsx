import { Link } from 'react-router-dom';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ROUTES } from '@/routes/paths';

import ConvertPage from '@/pages/ConvertPage/ConvertPage';
import BeforeAfterSlider from '@/components/home/BeforeAfterSlider';
import PricingToggle from '@/components/home/PricingToggle';

import styles from './HomePage.module.css';

const FREE_TOOLS = [
  {
    to: ROUTES.convert,
    title: 'Convert',
    desc: 'JPG, PNG, WebP, AVIF, GIF, SVG, HEIC, BMP, TIFF.',
    featured: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    to: ROUTES.compress,
    title: 'Compress',
    desc: 'Reduce file size while preserving image quality.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="4 14 10 14 10 20" />
        <polyline points="20 10 14 10 14 4" />
        <line x1="14" y1="10" x2="21" y2="3" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
    ),
  },
  {
    to: ROUTES.resize,
    title: 'Resize',
    desc: 'Change dimensions by exact pixels or percentage.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
    ),
  },
  {
    to: ROUTES.optimize,
    title: 'Smart Optimizer',
    desc: 'Optimize based on how you plan to use the image.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    to: ROUTES.clean,
    title: 'Privacy Cleaner',
    desc: 'Remove metadata and sensitive image data.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const PREMIUM_TOOLS = [
  {
    to: ROUTES.removeBackground,
    title: 'Background Remover',
    desc: 'Instantly isolate subjects and export transparent PNG cutouts.',
    featured: true,
    gradient: 'linear-gradient(135deg, #3B5FE0 0%, #8B5CF6 100%)',
  },
  {
    to: ROUTES.objectRemover,
    title: 'Object Remover',
    desc: 'Erase unwanted objects, photobombers, text, or clutter.',
  },
  {
    to: ROUTES.upscaler,
    title: 'Image Upscaler',
    desc: 'Upscale images 2x or 4x with super-resolution.',
  },
  {
    to: ROUTES.imageExtender,
    title: 'Image Extender',
    desc: 'Expand borders with outpainting.',
  },
  {
    to: ROUTES.photoRestorer,
    title: 'Photo Restorer',
    desc: 'Restore old, blurry, damaged, or faded photos.',
  },
];

const SECURITY_ITEMS = [
  { title: 'Local-first processing', desc: 'Images never leave your device during processing.' },
  { title: 'Encrypted connections', desc: 'All network traffic uses TLS encryption.' },
  { title: 'Automatic deletion', desc: 'Temporary files are removed after each session.' },
  { title: 'Secured checkout', desc: 'Payments processed by trusted providers.' },
  { title: 'No data resale', desc: 'Your images are never sold or shared.' },
  { title: 'Cancel anytime', desc: 'No contracts or commitments required.' },
];

const TESTIMONIALS = [
  {
    quote: 'Convert Image is now my go-to tool for batch resizing and format conversion. The privacy-first approach is exactly what our team needs.',
    name: 'Sarah Chen',
    role: 'Product Designer, Stripe',
    initials: 'SC',
  },
  {
    quote: 'Background Remover works shockingly well for a browser tool. No uploads, no waiting, no quality loss. I use it daily for client mockups.',
    name: 'Marcus Johnson',
    role: 'Freelance Photographer',
    initials: 'MJ',
  },
  {
    quote: 'Finally, an image tool that respects privacy and doesn\'t require an account. The Smart Optimizer alone saved me hours of manual work.',
    name: 'Aisha Patel',
    role: 'Marketing Lead, Shopify',
    initials: 'AP',
  },
  {
    quote: 'We switched our entire agency workflow to Convert Image. The API access and batch processing on Pro are game changers.',
    name: 'David Kim',
    role: 'CTO, Larkspur',
    initials: 'DK',
  },
  {
    quote: 'The best part is that everything happens in the browser. No uploads, no waiting, and the quality is outstanding.',
    name: 'Emma Wilson',
    role: 'E-commerce Manager, HolloweCo',
    initials: 'EW',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Are my images really never uploaded?',
    a: 'For the free tools — convert, compress, resize, and the privacy cleaner — everything happens in your browser using WebAssembly. Nothing is sent anywhere. The AI-powered Pro tools process on our servers because they need more compute, and those files are deleted automatically within one hour.',
  },
  {
    q: 'Do I need an account to use the free tools?',
    a: 'No. Every tool on this page works without signing up. Creating an account just saves your history and raises your limits.',
  },
  {
    q: 'Can I cancel Pro or Team at any time?',
    a: 'Yes. Cancel from your billing settings in one click — you\'ll keep access until the end of the period you already paid for, and there\'s a 14-day money-back guarantee on your first payment.',
  },
  {
    q: 'What happens if I go over my plan\'s file size limit?',
    a: 'We\'ll tell you before you burn a conversion — the tool flags oversized files and offers to compress first, or you can upgrade on the spot without losing your work.',
  },
  {
    q: 'Is there a discount for annual billing?',
    a: 'Yes — switching to yearly billing on Pro or Team saves 20% compared to paying monthly, billed as a single annual charge.',
  },
];

const TRUST_ITEMS = [
  { value: '2,400+', label: 'Paying teams' },
  { value: '41M+', label: 'Images processed monthly' },
  { value: '0', label: 'Images stored on our servers' },
  { value: '4.9 / 5', label: 'Average customer rating' },
];

function HomePage() {
  useDocumentTitle('Convert Image — Free Online Image Tools');

  return (
    <>
      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}
      <section className={`section ${styles.hero}`} aria-labelledby="hero-heading">
        <div className="container">
          <div className={styles.heroInner}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Files never leave your device
            </span>

            <h1 id="hero-heading" className={styles.heroTitle}>
              Image tools your team will actually use twice.
            </h1>

            <p className={styles.heroLede}>
              Compress, convert, resize, and edit images — all in your browser. No uploads, no accounts, no waiting.
              Free forever for personal use.
            </p>

            <div className={styles.heroActions}>
              <Link to={ROUTES.convert} className={styles.btnPrimary}>
                Start free
              </Link>
              <Link to="#tools" className={styles.btnGhost}>
                Browse all tools
              </Link>
            </div>

            <div className={styles.trustLine}>
              {[
                'No account required',
                '100% browser-based',
                'GDPR compliant',
              ].map((item) => (
                <span key={item} className={styles.trustItem}>
                  <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8.5L6.5 12 13 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HERO TOOL PANEL — real Convert widget                            */}
      {/* ================================================================== */}
      <section className={styles.heroToolSection} aria-label="Interactive converter">
        <div className="container">
          <ConvertPage embeddedOnly />
        </div>
      </section>

      {/* ================================================================== */}
      {/* STATS BAND                                                        */}
      {/* ================================================================== */}
      <section className={styles.statsBand} aria-label="Trust statistics">
        <div className="container">
          <div className={styles.statsGrid}>
            {TRUST_ITEMS.map((item) => (
              <div key={item.label} className={styles.statItem}>
                <span className={styles.statValue}>{item.value}</span>
                <span className={styles.statLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FREE TOOLS                                                        */}
      {/* ================================================================== */}
      <section className={`section ${styles.toolsSection}`} id="tools" aria-labelledby="free-tools-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="free-tools-heading" className={styles.sectionTitle}>
              Ready the moment you land here
            </h2>
            <p className={styles.sectionLead}>
              Powerful image utilities that work offline in your browser.
            </p>
          </div>

          <div className={styles.toolGrid}>
            {FREE_TOOLS.map((tool) => (
              <Link
                key={tool.title}
                to={tool.to}
                className={`${styles.toolCard} ${tool.featured ? styles.toolCardFeatured : ''}`}
              >
                <span className={styles.toolIcon} aria-hidden="true">{tool.icon}</span>
                <div className={styles.toolBody}>
                  <span className={styles.toolName}>{tool.title}</span>
                  <span className={styles.toolDesc}>{tool.desc}</span>
                </div>
                <svg className={styles.toolArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PREMIUM AI TOOLS                                                  */}
      {/* ================================================================== */}
      <section className={`section ${styles.premiumSection}`} aria-labelledby="premium-tools-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="premium-tools-heading" className={styles.sectionTitle}>
              Heavier edits, still processed on your device
            </h2>
            <p className={styles.sectionLead}>
              AI-powered tools that run locally — upgrade for full power, or try the free tier.
            </p>
          </div>

          <div className={styles.premiumGrid}>
            {PREMIUM_TOOLS.map((tool) => (
              <Link
                key={tool.title}
                to={tool.to}
                className={`${styles.premiumCard} ${tool.featured ? styles.premiumCardFeatured : ''}`}
                style={tool.gradient ? { background: tool.gradient } : undefined}
              >
                {tool.featured && <span className={styles.proBadge}>PRO</span>}
                <div className={styles.premiumCardBody}>
                  <h3 className={styles.premiumCardTitle}>{tool.title}</h3>
                  <p className={styles.premiumCardDesc}>{tool.desc}</p>
                </div>
                <svg className={styles.premiumCardArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SHOWCASE SLIDER                                                   */}
      {/* ================================================================== */}
      <section className={`section ${styles.showcaseSection}`} aria-labelledby="showcase-heading">
        <div className="container">
          <div className={styles.showcaseGrid}>
            <div className={styles.showcaseText}>
              <p className={styles.kicker}>See it work</p>
              <h2 className={styles.showcaseTitle}>Drag the slider — that's the background remover.</h2>
              <p className={styles.showcaseLead}>
                One click removes any background and hands you a clean transparent cutout, ready to drop into another design.
              </p>
              <ul className={styles.checkList}>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Works on people, products, and pets
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Exports a true transparent PNG
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Unlimited use on Pro and Team plans
                </li>
              </ul>
            </div>
            <div className={styles.showcaseCard}>
              <BeforeAfterSlider
                beforeSrc="/demo-before.svg"
                afterSrc="/demo-after.svg"
                beforeLabel="Original"
                afterLabel="Background removed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TRUST / SECURITY                                                   */}
      {/* ================================================================== */}
      <section className={`section ${styles.trustSection}`} aria-labelledby="trust-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="trust-heading" className={styles.sectionTitle}>
              Trust built into every pixel
            </h2>
            <p className={styles.sectionLead}>
              Your privacy and security are not afterthoughts — they are the foundation.
            </p>
          </div>

          <div className={styles.trustGrid}>
            {SECURITY_ITEMS.map((item) => (
              <div key={item.title} className={styles.trustCard}>
                <svg className={styles.trustIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <div>
                  <h4 className={styles.trustTitle}>{item.title}</h4>
                  <p className={styles.trustDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TESTIMONIALS                                                       */}
      {/* ================================================================== */}
      <section className={`section ${styles.testimonialsSection}`} aria-labelledby="testimonials-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="testimonials-heading" className={styles.sectionTitle}>
              Trusted by thousands of teams
            </h2>
            <p className={styles.sectionLead}>
              Join designers, marketers, and developers who rely on Convert Image daily.
            </p>
          </div>

          <div className={styles.testimonialGrid}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className={styles.testimonialCard}>
                <svg className={styles.quoteIcon} width="28" height="28" viewBox="0 0 24 24" fill="var(--color-accent-tint)" aria-hidden="true">
                  <path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l.002.003zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.768-.695-1.327-.825-.55-.13-1.07-.14-1.54-.03-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.5 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l-.007.003z" />
                </svg>
                <p className={styles.quoteText}>{t.quote}</p>
                <div className={styles.quoteAuthor}>
                  <div className={styles.avatar}>{t.initials}</div>
                  <div>
                    <div className={styles.authorName}>{t.name}</div>
                    <div className={styles.authorRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRICING                                                           */}
      {/* ================================================================== */}
      <section className={`section ${styles.pricingSection}`} id="pricing" aria-labelledby="pricing-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="pricing-heading" className={styles.sectionTitle}>
              Simple, transparent pricing
            </h2>
            <p className={styles.sectionLead}>
              Free covers a lot. Pro and Team remove the limits.
            </p>
          </div>

          <PricingToggle />

          <div className={styles.plansGrid}>
            {/* Free */}
            <div className={styles.planCard}>
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>FREE</h3>
                <p className={styles.planDesc}>For occasional edits</p>
                <div className={styles.planPrice}>
                  <span className={styles.planAmount}>$0</span>
                </div>
              </div>
              <Link to={ROUTES.convert} className={`${styles.planBtn} ${styles.planBtnGhost}`}>
                Start for free
              </Link>
              <ul className={styles.planFeatures} role="list">
                {['Unlimited convert, compress, resize', '3 AI edits per month', '10MB file size limit', 'No account required'].map((f) => (
                  <li key={f}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" stroke="var(--color-success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className={`${styles.planCard} ${styles.planCardFeatured}`}>
              <div className={styles.planBadge}>MOST POPULAR</div>
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>PRO</h3>
                <p className={styles.planDesc}>For freelancers and small studios</p>
                <div className={styles.planPrice}>
                  <span className={styles.planAmount} id="proPrice">$19</span>
                  <span className={styles.planPeriod}>/ month</span>
                </div>
              </div>
              <button className={`${styles.planBtn} ${styles.planBtnPrimary}`}>Start 14-day free trial</button>
              <ul className={styles.planFeatures} role="list">
                {['Unlimited AI edits', 'Batch processing, up to 500 files', '500MB file size limit', 'Priority AI processing queue', 'Watermark-free exports'].map((f) => (
                  <li key={f}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" stroke="var(--color-success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Team */}
            <div className={styles.planCard}>
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>TEAM</h3>
                <p className={styles.planDesc}>For agencies and product teams</p>
                <div className={styles.planPrice}>
                  <span className={styles.planAmount} id="teamPrice">$49</span>
                  <span className={styles.planPeriod}>/ month</span>
                </div>
              </div>
              <button className={`${styles.planBtn} ${styles.planBtnDark}`}>Talk to sales</button>
              <ul className={styles.planFeatures} role="list">
                {['Everything in Pro, for 5 seats', 'API access for automation', 'Shared brand presets', 'Centralized billing and roles', 'Dedicated support channel'].map((f) => (
                  <li key={f}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" stroke="var(--color-success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.paymentTrust}>
            <div className={styles.payGroup}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
              </svg>
              Secured checkout
            </div>
            <div className={styles.cardIcons}>
              <span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>PAYPAL</span>
            </div>
            <div className={styles.payGroup}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11Z"/>
              </svg>
              14-day money-back guarantee
            </div>
            <div className={styles.payGroup}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>
              </svg>
              Cancel anytime, no forms
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FAQ                                                               */}
      {/* ================================================================== */}
      <section className={`section ${styles.faqSection}`} id="faq" aria-labelledby="faq-heading">
        <div className={`container ${styles.faqInner}`}>
          <div className={styles.sectionHeader}>
            <h2 id="faq-heading" className={styles.sectionTitle}>
              Frequently asked questions
            </h2>
          </div>

          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className={styles.faqItem}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA BAND                                                    */}
      {/* ================================================================== */}
      <section className={`container ${styles.finalCta}`} aria-labelledby="cta-heading">
        <div className={styles.ctaInner}>
          <h2 id="cta-heading" className={styles.ctaTitle}>
            Try the tool. Trust the process.<br />Upgrade when you're ready.
          </h2>
          <div className={styles.ctaActions}>
            <Link to={ROUTES.convert} className={styles.ctaBtnPrimary}>
              Start free
            </Link>
            <Link to="#pricing" className={styles.ctaBtnGhost}>
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
