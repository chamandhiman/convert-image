import styles from './ToolPageLayout.module.css';

/**
 * Shared page layout for every tool (compress, convert, resize, etc.).
 *
 * Renders a hero/intro area, the interactive tool workspace, and an optional
 * content section below (SEO copy, FAQs, etc.).
 *
 * Props:
 *  - title:    string   — visible h1 page heading.
 *  - subtitle: string   — short description below the heading.
 *  - badge?:   string   — small label above the title (e.g. "Free tool").
 *  - children: node     — the tool workspace.
 *  - content?: node     — SEO / educational content rendered below the tool.
 */
function ToolPageLayout({ title, subtitle, badge, children, content, embedded, contentFullWidth, embeddedOnly, showHero = true }) {
  if (embeddedOnly) {
    return (
      <section className={styles.workspace} aria-label="Tool workspace">
        {children}
      </section>
    );
  }

  if (embedded) {
    return (
      <>
        <section className={`container ${styles.workspace}`} aria-label="Tool workspace">
          {children}
        </section>
        {content && (
          <section className={`container ${styles.content}`} aria-label="About this tool">
            {content}
          </section>
        )}
      </>
    );
  }

  return (
    <>
      {showHero && (
        <section className={styles.hero} aria-labelledby="tool-heading">
          <div className={`container ${styles.heroInner}`}>
            {badge && <span className={styles.badge}>{badge}</span>}
            <h1 id="tool-heading" className={styles.title}>
              {title}
            </h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
        </section>
      )}

      {/* Tool workspace */}
      <section className={`container p-3 ${styles.workspace}`} aria-label="Tool workspace">
        {children}
      </section>

      {/* Content / SEO */}
      {content && (
        <section
          className={
            contentFullWidth
              ? `${styles.contentFullWidth}`
              : `container p-3 ${styles.content}`
          }
          aria-label="About this tool"
        >
          {content}
        </section>
      )}
    </>
  );
}

export default ToolPageLayout;
