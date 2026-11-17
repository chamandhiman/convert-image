import styles from './ToolPageLayout.module.css';

/**
 * Shared page layout for every tool (compress, convert, resize, etc.).
 *
 * Renders a standardized centered page header, the interactive tool workspace,
 * and an optional content section below (SEO copy, FAQs, etc.).
 *
 * Props:
 *  - title:    string   — visible h1 page heading.
 *  - subtitle: string   — short description below the heading.
 *  - badge?:   string   — small label above the title (e.g. "Free tool").
 *  - children: node     — the tool workspace.
 *  - content?: node     — SEO / educational content rendered below the tool.
 */
function ToolPageLayout({
  title,
  subtitle,
  badge,
  children,
  content,
  embedded,
  contentFullWidth,
  embeddedOnly,
  showHero = true,
  workspaceFullWidth = false,
}) {
  if (embeddedOnly) {
    return (
      <section
        className={`${workspaceFullWidth ? styles.workspaceFullWidth : ''} ${styles.workspace}`}
        aria-label="Tool workspace"
        style={{
          padding: 0,
          margin: 0,
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        {children}
      </section>
    );
  }

  if (embedded) {
    return (
      <div className={styles.embeddedRoot}>
        <section
          className={`${workspaceFullWidth ? styles.workspaceFullWidth : ''} ${styles.workspace} ${styles.workspaceEmbedded}`}
          aria-label="Tool workspace"
        >
          {children}
        </section>
        {content && (
          <section className={styles.content} aria-label="About this tool">
            {content}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className={styles.toolPageRoot}>
      {/* Tool workspace */}
      <section
        className={`${workspaceFullWidth ? styles.workspaceFullWidth : ''} ${styles.workspace}`}
        aria-label="Tool workspace"
      >
        {showHero && title && (
          <header className={styles.pageHeader}>
            {badge && <span className={styles.badge}>{badge}</span>}
            <h1 id="tool-heading" className={styles.pageTitle}>
              {title}
            </h1>
            {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
          </header>
        )}
        {children}
      </section>

      {/* Content / SEO */}
      {content && (
        <section
          className={
            contentFullWidth ? styles.contentFullWidth : styles.content
          }
          aria-label="About this tool"
        >
          {content}
        </section>
      )}
    </div>
  );
}

export default ToolPageLayout;
