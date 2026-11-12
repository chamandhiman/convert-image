import { Upload, Settings, Download, ChevronRight } from 'lucide-react';
import styles from './ConversionSteps.module.css';

const STEPS = [
  {
    step: 1,
    icon: Upload,
    title: 'Upload Image',
    desc: 'Select or drag & drop your image file.',
  },
  {
    step: 2,
    icon: Settings,
    title: 'Choose Format',
    desc: 'Pick the output format (e.g. PNG, JPG, WebP).',
  },
  {
    step: 3,
    icon: Download,
    title: 'Download',
    desc: 'Get your converted image instantly.',
  },
];

export function ConversionSteps() {
  return (
    <section className={styles.section} aria-labelledby="process-heading">
      <div className={`container ${styles.container}`}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.kicker}>SIMPLE PROCESS</span>
          <h2 id="process-heading" className={styles.title}>
            Convert Images in <span className={styles.gradientTitle}>3 Easy Steps</span>
          </h2>
        </div>

        {/* 3 Step Cards with Connecting Arrows */}
        <div className={styles.stepsContainer}>
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const isNotLast = index < STEPS.length - 1;

            return (
              <div key={item.step} className={styles.stepWrapper}>
                <div className={styles.card}>
                  {/* Number Badge */}
                  <div className={styles.numberBadge}>
                    <span>{item.step}</span>
                  </div>

                  {/* Icon Box */}
                  <div className={styles.iconBox}>
                    <Icon size={24} className={styles.stepIcon} />
                  </div>

                  {/* Text Content */}
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDesc}>{item.desc}</p>
                  </div>
                </div>

                {/* Connecting Arrow between cards */}
                {isNotLast && (
                  <div className={styles.connector} aria-hidden="true">
                    <ChevronRight size={22} className={styles.chevronIcon} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ConversionSteps;

