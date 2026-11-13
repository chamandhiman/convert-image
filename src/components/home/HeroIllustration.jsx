import styles from './HeroIllustration.module.css';

export function HeroIllustration() {
  const formatBadges = [
    { label: 'JPG', bg: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.35)' },
    { label: 'PNG', bg: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.35)' },
    { label: 'WEBP', bg: '#10b981', shadow: 'rgba(16, 185, 129, 0.35)' },
    { label: 'GIF', bg: '#a855f7', shadow: 'rgba(168, 85, 247, 0.35)' },
    { label: 'SVG', bg: '#ec4899', shadow: 'rgba(236, 72, 153, 0.35)' },
  ];

  return (
    <div className={styles.illustrationCard} aria-hidden="true">
      {/* Soft ambient background glow */}
      <div className={styles.ambientGlow} />

      <div className={styles.innerStage}>
        {/* Left Side: 3D Layered Image Preview Cards */}
        <div className={styles.cardStack}>
          {/* Back card (subtle depth) */}
          <div className={styles.backCard} />
          {/* Middle card (rotated) */}
          <div className={styles.midCard} />
          {/* Front active photo card */}
          <div className={styles.frontCard}>
            <div className={styles.photoFrame}>
              <svg
                viewBox="0 0 240 160"
                className={styles.landscapeSvg}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="60%" stopColor="#93c5fd" />
                    <stop offset="100%" stopColor="#e0e7ff" />
                  </linearGradient>
                  <linearGradient id="mtnBack" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4338ca" />
                    <stop offset="100%" stopColor="#312e81" />
                  </linearGradient>
                  <linearGradient id="mtnFront" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4338ca" />
                  </linearGradient>
                  <linearGradient id="snowCap" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e0e7ff" />
                  </linearGradient>
                  <linearGradient id="sunGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#fde047" />
                  </linearGradient>
                </defs>
                {/* Sky */}
                <rect width="240" height="160" rx="14" fill="url(#skyGrad)" />
                {/* Sun */}
                <circle cx="190" cy="45" r="18" fill="url(#sunGlow)" opacity="0.9" />
                {/* Back Mountain */}
                <polygon points="20,160 110,65 190,160" fill="url(#mtnBack)" />
                {/* Snow Cap Back */}
                <polygon points="98,82 110,65 124,82 116,88 110,84 104,88" fill="url(#snowCap)" />
                {/* Front Mountain */}
                <polygon points="70,160 160,50 240,160" fill="url(#mtnFront)" />
                {/* Snow Cap Front */}
                <polygon points="146,72 160,50 178,72 168,80 160,75 152,80" fill="url(#snowCap)" />
                {/* Foreground Hill */}
                <path
                  d="M0,160 Q60,130 130,145 T240,150 L240,160 L0,160 Z"
                  fill="#1e1b4b"
                  opacity="0.4"
                />
              </svg>
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.fileIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
              <span className={styles.fileName}>landscape.raw</span>
            </div>
          </div>
        </div>

        {/* Center: Dynamic Curved Conversion Arrow */}
        <div className={styles.arrowWrap}>
          <svg
            className={styles.swoopArrowSvg}
            viewBox="0 0 120 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 48 C 45 48, 65 18, 98 22"
              stroke="url(#arrowGrad)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Arrowhead */}
            <path
              d="M88 12 L106 22 L92 34"
              stroke="url(#arrowGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Right Side: Staggered Format Badge Stack */}
        <div className={styles.badgeColumn}>
          {formatBadges.map((badge, idx) => (
            <div
              key={badge.label}
              className={styles.formatBadgePill}
              style={{
                backgroundColor: badge.bg,
                boxShadow: `0 4px 14px ${badge.shadow}`,
                animationDelay: `${idx * 0.12}s`,
              }}
            >
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HeroIllustration;

