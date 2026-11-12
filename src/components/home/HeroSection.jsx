import { Link } from 'react-router-dom';
import { ArrowRight, Zap, ShieldCheck, Lock, Monitor } from 'lucide-react';
import { ROUTES } from '@/routes/paths';

import heroDashboardFull2x from '@/assets/images/extracted/hero-dashboard-full@2x.png';
import heroDashboardFull1x from '@/assets/images/extracted/hero-dashboard-full.png';

import styles from './HeroSection.module.css';

export function HeroSection() {
  const handleExploreClick = (e) => {
    e.preventDefault();
    const el = document.getElementById('image-tools');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      {/* Soft purple radial ambiance in background */}
      <div className={styles.heroAmbientGlow} aria-hidden="true" />

      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroGrid}>
          {/* Left Column: Headline, CTAs, Feature Badges */}
          <div className={styles.heroContent}>
            {/* Pill Badge */}
            <div className={styles.badgeWrap}>
              <span className={styles.heroBadge}>
                Free Online Image Converter
              </span>
            </div>

            {/* Main Headline */}
            <h1 id="hero-heading" className={styles.heroTitle}>
              Convert Images
              <br />
              Online for <span className={styles.gradientFree}>Free.</span>
            </h1>

            {/* Subtitle / Description */}
            <p className={styles.heroDesc}>
              Quickly convert, resize, compress, and optimize your images. Supports JPG, PNG, WebP, GIF, BMP and more — fast, secure, and 100% free.
            </p>

            {/* Action Buttons */}
            <div className={styles.actionsRow}>
              <Link to={ROUTES.convert} className={styles.primaryCta}>
                <span>Convert Image Now</span>
                <ArrowRight size={17} className={styles.ctaArrow} />
              </Link>

              <button
                type="button"
                className={styles.secondaryCta}
                onClick={handleExploreClick}
              >
                Explore Image Tools
              </button>
            </div>

            {/* Feature Badges */}
            <div className={styles.featureBadgesRow}>
              <div className={styles.featureBadge}>
                <Zap size={15} className={styles.featureIcon} />
                <span>Fast & Easy</span>
              </div>
              <div className={styles.featureBadge}>
                <ShieldCheck size={15} className={styles.featureIcon} />
                <span>100% Free</span>
              </div>
              <div className={styles.featureBadge}>
                <Lock size={15} className={styles.featureIcon} />
                <span>Secure & Private</span>
              </div>
              <div className={styles.featureBadge}>
                <Monitor size={15} className={styles.featureIcon} />
                <span>No Sign Up</span>
              </div>
            </div>
          </div>

          {/* Right Column: Reference Mockup Illustration */}
          <div className={styles.heroVisualWrap}>
            <div className={styles.visualCardGlow} aria-hidden="true" />
            <Link
              to={ROUTES.convert}
              className={styles.mockupLink}
              title="Click to start converting images online"
            >
              <picture>
                <source srcSet={`${heroDashboardFull2x} 2x, ${heroDashboardFull1x} 1x`} />
                <img
                  src={heroDashboardFull1x}
                  alt="Image Convert online dashboard interface showing drag & drop upload, sidebar tools and JPG to PNG conversion"
                  className={styles.mockupImage}
                  width="780"
                  height="470"
                  loading="eager"
                  fetchPriority="high"
                />
              </picture>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
