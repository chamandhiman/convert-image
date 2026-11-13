import { ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';
import styles from './WhyChooseUs.module.css';

const PILLARS = [
  {
    icon: ShieldCheck,
    title: '100% Client-Side Privacy',
    desc: 'Your photos never leave your device. All conversion and editing processes run locally in your browser sandbox.',
    badge: 'Zero Uploads',
  },
  {
    icon: Zap,
    title: 'Lightning Fast In-Browser Speed',
    desc: 'Instant processing powered by WebAssembly and HTML5 Canvas with no server lag or queue wait times.',
    badge: 'Instant Results',
  },
  {
    icon: Layers,
    title: 'Multi-File Batch Conversion',
    desc: 'Upload multiple files simultaneously, configure target format, and download all converted images individually or as a ZIP.',
    badge: 'Batch Power',
  },
  {
    icon: Sparkles,
    title: 'Free Forever, No Signup',
    desc: 'No account registration, no subscriptions, and no hidden limitations. Enjoy unrestricted image conversion anytime.',
    badge: 'Unrestricted',
  },
];

export function WhyChooseUs() {
  return (
    <section className={styles.section} id="why-choose-us" aria-labelledby="why-heading">
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <span className={styles.kicker}>BUILT FOR PRIVACY & PERFORMANCE</span>
          <h2 id="why-heading" className={styles.title}>
            Why Choose <span className={styles.gradientTitle}>Image Convert?</span>
          </h2>
          <p className={styles.subtitle}>
            A modern, secure and reliable image conversion platform designed for web creators and developers.
          </p>
        </div>

        <div className={styles.pillarsGrid}>
          {PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={styles.pillarCard}>
                <div className={styles.topRow}>
                  <div className={styles.iconContainer}>
                    <Icon size={22} className={styles.pillarIcon} />
                  </div>
                  <span className={styles.pillarBadge}>{item.badge}</span>
                </div>
                <h3 className={styles.pillarTitle}>{item.title}</h3>
                <p className={styles.pillarDesc}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
