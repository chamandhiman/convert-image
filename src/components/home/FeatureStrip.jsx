import { Layers, Copy, ShieldCheck, Zap } from 'lucide-react';
import styles from './FeatureStrip.module.css';

const FEATURES = [
  {
    icon: Layers,
    title: 'Multiple Formats',
    desc: 'JPG, PNG, WEBP, GIF, SVG',
  },
  {
    icon: Copy,
    title: 'Batch Convert',
    desc: 'Convert multiple images',
  },
  {
    icon: ShieldCheck,
    title: 'High Quality',
    desc: 'No quality loss',
  },
  {
    icon: Zap,
    title: 'Fast & Free',
    desc: 'No signup required',
  },
];

export function FeatureStrip() {
  return (
    <section className={styles.section} aria-label="Core features">
      <div className={`container ${styles.container}`}>
        <div className={styles.featureGrid}>
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={styles.featureCard}>
                <div className={styles.iconContainer}>
                  <Icon size={20} className={styles.featureIcon} />
                </div>
                <div className={styles.textContent}>
                  <h3 className={styles.featureTitle}>{item.title}</h3>
                  <p className={styles.featureDesc}>{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeatureStrip;

