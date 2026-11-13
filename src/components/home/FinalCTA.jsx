import { Link } from 'react-router-dom';
import { ArrowRight, Sliders } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import styles from './FinalCTA.module.css';

export function FinalCTA() {
  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      <div className={`container ${styles.container}`}>
        <div className={styles.banner}>
          {/* Ambient gradient glow in background */}
          <div className={styles.ambientGlow} aria-hidden="true" />

          <div className={styles.content}>
            <span className={styles.kicker}>START CONVERTING TODAY</span>
            <h2 id="cta-heading" className={styles.title}>
              Ready to Convert Your{' '}
              <span className={styles.gradientWord}>Images?</span>
            </h2>

            <p className={styles.desc}>
              Fast, high-quality, and 100% private in-browser image processing. No software to install, no registration required.
            </p>

            <div className={styles.buttonGroup}>
              <Link to={ROUTES.convert} className={styles.primaryBtn}>
                <span>Convert Image Now</span>
                <ArrowRight size={17} className={styles.btnArrow} />
              </Link>

              <Link to={ROUTES.edit} className={styles.secondaryBtn}>
                <Sliders size={16} />
                <span>Smart Image Editor</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
