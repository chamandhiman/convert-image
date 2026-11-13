import { Link } from 'react-router-dom';
import { ArrowRight, Sliders } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import HeroIllustration from './HeroIllustration';
import styles from './HeroSection.module.css';

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      {/* Soft ambient background glow */}
      <div className={styles.heroAmbientGlow} aria-hidden="true" />

      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroGrid}>
          {/* Left Column: Heading, Subtitle, Actions */}
          <div className={styles.heroContent}>
            <h1 id="hero-heading" className={styles.heroTitle}>
              Convert Images to{' '}
              <span className={styles.gradientHeading}>Any Format</span>
            </h1>

            <p className={styles.heroDesc}>
              Fast, free and high-quality image conversion. Convert, edit and optimize your images online — no software required.
            </p>

            <div className={styles.actionsRow}>
              <Link to={ROUTES.convert} className={styles.primaryCta}>
                <span>Convert Image Now</span>
                <ArrowRight size={18} className={styles.ctaArrow} />
              </Link>

              <Link to={ROUTES.edit} className={styles.secondaryCta}>
                <Sliders size={16} className={styles.secondaryIcon} />
                <span>Edit Image</span>
              </Link>
            </div>
          </div>

          {/* Right Column: High Fidelity 3D Hero Illustration */}
          <div className={styles.heroVisualWrap}>
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
