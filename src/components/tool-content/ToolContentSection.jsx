import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import styles from './ToolContentSection.module.css';

/**
 * ToolContentSection
 * Universal rich content component for Image Convert tool pages.
 * Recreates the exact multi-section structure from the reference mockup:
 * Hero, What is, 4-step process, Why choose, Use cases, Privacy banner,
 * interactive FAQs, and Related tools.
 */
export function ToolContentSection({
  badge,
  title,
  lead,
  primaryCtaText = 'Start Now',
  primaryCtaHref = '#tool',
  secondaryCtaText = 'Learn More',
  secondaryCtaHref = '#how-it-works',
  whatIsTitle,
  whatIsLead,
  whatIsContent,
  whatIsVisual,
  stepsTitle = 'How It Works in 4 Steps',
  stepsLead = 'Follow these simple steps to get high-quality results in seconds.',
  steps = [],
  featuresTitle = 'Why Choose This Tool',
  featuresLead = 'Built for speed, convenience, and complete local privacy.',
  features = [],
  useCasesTitle = 'Common Use Cases',
  useCasesLead = 'Practical workflows where this tool excels.',
  useCases = [],
  privacyTitle = 'Complete Privacy with Local In-Browser Processing',
  privacyText,
  faqsTitle = 'Frequently Asked Questions',
  faqsLead = 'Everything you need to know about this tool.',
  faqs = [],
  relatedTitle = 'Related Image Tools',
  relatedLead = 'Explore more free browser-based tools in our suite.',
  relatedTools = [],
}) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className={styles.page}>
      {/* ------------------------------------------------------------------ */}
      {/*  1. Secondary Hero Banner                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.heroBanner} aria-label={`${title} introduction`}>
        <div className={styles.heroInner}>
          {badge && <div className={styles.heroBadge}>{badge}</div>}
          <h2 className={styles.heroTitle}>{title}</h2>
          {lead && <p className={styles.heroLead}>{lead}</p>}
          <div className={styles.heroCtas}>
            <a href={primaryCtaHref} className={styles.heroPrimary}>
              {primaryCtaText}
            </a>
            <a href={secondaryCtaHref} className={styles.heroSecondary}>
              {secondaryCtaText}
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  2. What Is Section — 2-Column with Visual                         */}
      {/* ------------------------------------------------------------------ */}
      {(whatIsTitle || whatIsContent) && (
        <section className={styles.whatIsSection} id="what-is" aria-labelledby="what-is-heading">
          <div className="container">
            <div className={styles.whatIsGrid}>
              <div className={styles.whatIsText}>
                {whatIsTitle && (
                  <h3 id="what-is-heading" className={styles.sectionTitle}>
                    {whatIsTitle}
                  </h3>
                )}
                {whatIsLead && <p className={styles.sectionLead}>{whatIsLead}</p>}
                <div className={styles.proseBlock}>
                  {Array.isArray(whatIsContent) ? (
                    whatIsContent.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))
                  ) : (
                    whatIsContent
                  )}
                </div>
              </div>
              <div className={styles.whatIsVisual} aria-hidden="true">
                <div className={styles.visualCard}>
                  {whatIsVisual}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  3. How It Works (4 Steps)                                         */}
      {/* ------------------------------------------------------------------ */}
      {steps.length > 0 && (
        <section className={styles.section} id="how-it-works" aria-labelledby="steps-heading">
          <div className="container">
            <header className={styles.sectionHeader}>
              <h3 id="steps-heading" className={styles.sectionTitle}>
                {stepsTitle}
              </h3>
              <p className={styles.sectionLead}>{stepsLead}</p>
            </header>
            <div className={styles.stepGrid}>
              {steps.map((step, idx) => (
                <div key={idx} className={styles.stepCard}>
                  <span className={styles.stepNumber}>0{idx + 1}</span>
                  <h4 className={styles.stepTitle}>{step.title}</h4>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  4. Why Choose / Key Features (4 Cards)                            */}
      {/* ------------------------------------------------------------------ */}
      {features.length > 0 && (
        <section className={styles.sectionAlt} aria-labelledby="features-heading">
          <div className="container">
            <header className={styles.sectionHeader}>
              <h3 id="features-heading" className={styles.sectionTitle}>
                {featuresTitle}
              </h3>
              <p className={styles.sectionLead}>{featuresLead}</p>
            </header>
            <div className={styles.featureGrid}>
              {features.map((feat, idx) => (
                <div key={idx} className={styles.featureCard}>
                  <div className={styles.featureIcon} aria-hidden="true">
                    {feat.icon}
                  </div>
                  <h4 className={styles.featureTitle}>{feat.title}</h4>
                  <p className={styles.featureDesc}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  5. Common Use Cases (Cards with Gradient Accent)                  */}
      {/* ------------------------------------------------------------------ */}
      {useCases.length > 0 && (
        <section className={styles.section} aria-labelledby="usecases-heading">
          <div className="container">
            <header className={styles.sectionHeader}>
              <h3 id="usecases-heading" className={styles.sectionTitle}>
                {useCasesTitle}
              </h3>
              <p className={styles.sectionLead}>{useCasesLead}</p>
            </header>
            <div className={styles.formatGrid}>
              {useCases.map((uc, idx) => (
                <div key={idx} className={styles.formatCard}>
                  <div className={styles.formatAccent} />
                  <h4 className={styles.formatTitle}>{uc.title}</h4>
                  <p className={styles.formatDesc}>{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  6. Complete Privacy Banner (Full-Width Deep Blue/Purple Gradient) */}
      {/* ------------------------------------------------------------------ */}
      <section className={styles.privacySection} aria-labelledby="privacy-banner-heading">
        <div className={styles.privacyInner}>
          <h3 id="privacy-banner-heading" className={styles.privacyTitle}>
            {privacyTitle}
          </h3>
          <p className={styles.privacyParagraph}>
            {privacyText || (
              <>
                Unlike other tools that upload your files to remote cloud servers, <strong>Image Convert</strong> processes
                your photos directly in your web browser using HTML5 Canvas, WebAssembly, and WebGPU. Your media stays safely
                on your device at all times.
              </>
            )}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  7. FAQ Accordion                                                  */}
      {/* ------------------------------------------------------------------ */}
      {faqs.length > 0 && (
        <section className={styles.faqSection} id="faq" aria-labelledby="faq-heading">
          <div className="container">
            <div className={styles.faqInner}>
              <header className={styles.sectionHeader}>
                <h3 id="faq-heading" className={styles.sectionTitle}>
                  {faqsTitle}
                </h3>
                <p className={styles.sectionLead}>{faqsLead}</p>
              </header>
              <div className={styles.faqList}>
                {faqs.map((faq, index) => (
                  <details
                    key={index}
                    className={styles.faqItem}
                    open={openIndex === index}
                    onToggle={(e) => {
                      if (e.currentTarget.open) {
                        setOpenIndex(index);
                      } else if (openIndex === index) {
                        setOpenIndex(null);
                      }
                    }}
                  >
                    <summary className={styles.faqSummary}>
                      <span className={styles.faqQuestion}>{faq.q}</span>
                      <span className={styles.faqIcon} aria-hidden="true">
                        <Plus size={16} />
                      </span>
                    </summary>
                    <p className={styles.faqAnswer}>{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  8. Related Tools Grid                                             */}
      {/* ------------------------------------------------------------------ */}
      {relatedTools.length > 0 && (
        <section className={styles.relatedSection} aria-labelledby="related-heading">
          <div className="container">
            <header className={styles.sectionHeader}>
              <h3 id="related-heading" className={styles.sectionTitle}>
                {relatedTitle}
              </h3>
              <p className={styles.sectionLead}>{relatedLead}</p>
            </header>
            <div className={styles.relatedGrid}>
              {relatedTools.map((tool, idx) => (
                <Link key={idx} to={tool.href} className={styles.relatedCard}>
                  <div className={styles.relatedIcon} aria-hidden="true">
                    {tool.icon || (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    )}
                  </div>
                  <div className={styles.relatedBody}>
                    <span className={styles.relatedName}>{tool.name}</span>
                    <span className={styles.relatedDesc}>{tool.description}</span>
                  </div>
                  <span className={styles.relatedArrow} aria-hidden="true">
                    <ArrowRight size={18} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ToolContentSection;

