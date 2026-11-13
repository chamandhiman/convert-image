import { Upload, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import styles from './ConversionSteps.module.css';

const STEPS = [
  {
    step: '1',
    icon: Upload,
    title: 'Upload',
    desc: 'Add your images from your computer or drag & drop.',
  },
  {
    step: '2',
    icon: SlidersHorizontal,
    title: 'Choose Format',
    desc: 'Select output format and quality settings.',
  },
  {
    step: '3',
    icon: CheckCircle2,
    title: 'Convert',
    desc: 'Get instant results and download individually or as ZIP.',
  },
];

export function ConversionSteps() {
  return (
    <section className={styles.section} aria-labelledby="steps-heading">
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <span className={styles.kicker}>HOW IT WORKS</span>
          <h2 id="steps-heading" className={styles.title}>
            Convert Images in <span className={styles.gradientTitle}>3 Simple Steps</span>
          </h2>
          <p className={styles.subtitle}>
            Zero wait time. 100% private in-browser image processing with no file uploads.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className={styles.stepCard}>
                <div className={styles.stepTopRow}>
                  <div className={styles.stepNumberBadge}>
                    <span>{item.step}</span>
                  </div>
                  <div className={styles.iconWrap}>
                    <Icon size={20} className={styles.stepIcon} />
                  </div>
                </div>

                <div className={styles.stepBody}>
                  <h3 className={styles.stepTitle}>{item.title}</h3>
                  <p className={styles.stepDesc}>{item.desc}</p>
                </div>

                {idx < STEPS.length - 1 && (
                  <div className={styles.connectorLine} aria-hidden="true" />
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
