import { Zap, ShieldCheck, Rocket, Laptop } from 'lucide-react';
import styles from './WhyChooseUs.module.css';

const FEATURES = [
  {
    icon: Zap,
    title: '100% Free',
    desc: 'All tools are completely free to use.',
    iconColor: '#7C3AED',
    bg: '#FAF5FF',
    border: '#E9D5FF',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy First',
    desc: 'Your files are not stored on our servers.',
    iconColor: '#8B5CF6',
    bg: '#FAF5FF',
    border: '#EDE9FE',
  },
  {
    icon: Rocket,
    title: 'Fast & Reliable',
    desc: 'Get results in seconds with high quality.',
    iconColor: '#9333EA',
    bg: '#FAF5FF',
    border: '#F3E8FF',
  },
  {
    icon: Laptop,
    title: 'Works Everywhere',
    desc: 'Use on desktop, tablet or mobile.',
    iconColor: '#2563EB',
    bg: '#EFF6FF',
    border: '#DBEAFE',
  },
];

export function WhyChooseUs() {
  return (
    <section className={styles.section} id="why-choose-us" aria-labelledby="why-heading">
      <div className={`container ${styles.container}`}>
        <div className={styles.layout}>
          {/* Left Column: Title & Description */}
          <div className={styles.leftCol}>
            <span className={styles.kicker}>WHY CHOOSE US</span>
            <h2 id="why-heading" className={styles.title}>
              Why Use <span className={styles.gradientTitle}>Image Convert?</span>
            </h2>
            <p className={styles.desc}>
              A fast, simple, and free way to convert and optimize your images online.
            </p>
          </div>

          {/* Right Column: 4 Features */}
          <div className={styles.featuresRow}>
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={styles.featureItem}>
                  <div
                    className={styles.iconCircle}
                    style={{
                      backgroundColor: item.bg,
                      borderColor: item.border,
                      color: item.iconColor,
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className={styles.featureTitle}>{item.title}</h3>
                  <p className={styles.featureDesc}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;

