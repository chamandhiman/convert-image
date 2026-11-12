import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/routes/paths';

import FloatingImageCard from '@/components/ui/FloatingImageCard';
import styles from './FinalCTA.module.css';

export function FinalCTA() {
  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      <div className="container">
        <div className={styles.banner}>
          {/* Subtle sunburst rays in background */}
          <div className={styles.bannerRays} aria-hidden="true" />

          {/* Left: Floating Graphic */}
          <div className={styles.graphicWrap}>
            <FloatingImageCard />
          </div>

          {/* Right/Center: Headline, Subtitle, CTA Button */}
          <div className={styles.content}>
            <h2 id="cta-heading" className={styles.title}>
              Convert Your Images{' '}
              <span className={styles.burstWord}>
                Now
                <svg
                  className={styles.burstRays}
                  width="28"
                  height="20"
                  viewBox="0 0 28 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <line x1="6" y1="16" x2="2" y2="8" stroke="#D946EF" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="14" y1="14" x2="14" y2="4" stroke="#A855F7" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="22" y1="16" x2="26" y2="8" stroke="#EC4899" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </span>
            </h2>

            <p className={styles.desc}>
              Fast, free and easy online image conversion — no signup required.
            </p>

            <Link to={ROUTES.convert} className={styles.ctaButton}>
              <span>Convert Image</span>
              <ArrowRight size={17} className={styles.btnArrow} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
