import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './HomeFAQ.module.css';

const FAQS = [
  {
    q: 'Is Image Convert completely free to use?',
    a: 'Yes, 100% free with no subscriptions, usage limits, or hidden paywalls. You can convert, edit, and optimize as many images as you need.',
  },
  {
    q: 'Are my images uploaded or stored on your servers?',
    a: 'Never. Image Convert processes all files entirely inside your web browser using HTML5 Canvas, WebAssembly, and client-side memory. Your images never leave your local device.',
  },
  {
    q: 'Can I convert multiple images at the same time (Batch Convert)?',
    a: 'Yes! You can select or drag and drop dozens of images at once. The tool will process them in parallel and give you options to download them individually or as a single ZIP archive.',
  },
  {
    q: 'Which image formats can I convert between?',
    a: 'We support all major formats including JPG/JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, and HEIC. You can convert between any combination with custom quality controls.',
  },
  {
    q: 'Does converting an image reduce its visual quality?',
    a: 'Not unless you want it to. When converting to lossless formats like PNG, quality is 100% preserved. For compressed formats like JPG or WebP, you can customize the quality slider from 1% to 100%.',
  },
  {
    q: 'Does Image Convert work on mobile devices?',
    a: 'Yes. The application is fully responsive and works smoothly on mobile browsers including Safari on iOS, Chrome on Android, and tablet devices.',
  },
];

export function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section className={styles.section} aria-labelledby="faq-heading">
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <span className={styles.kicker}>GOT QUESTIONS?</span>
          <h2 id="faq-heading" className={styles.title}>
            Frequently Asked <span className={styles.gradientTitle}>Questions</span>
          </h2>
          <p className={styles.subtitle}>
            Everything you need to know about our free, private online image conversion suite.
          </p>
        </div>

        <div className={styles.faqList}>
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.q} className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}>
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className={styles.questionText}>{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}
                  />
                </button>
                {isOpen && (
                  <div id={`faq-answer-${idx}`} className={styles.faqAnswer} role="region">
                    <p className={styles.answerText}>{item.a}</p>
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

export default HomeFAQ;

