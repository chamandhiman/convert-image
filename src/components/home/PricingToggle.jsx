import { useState } from 'react';

import styles from './PricingToggle.module.css';

function PricingToggle() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className={styles.toggle} role="group" aria-label="Billing period">
      <button
        type="button"
        className={`${styles.toggleBtn} ${!yearly ? styles.toggleBtnActive : ''}`}
        onClick={() => setYearly(false)}
      >
        Monthly
      </button>
      <button
        type="button"
        className={`${styles.toggleBtn} ${yearly ? styles.toggleBtnActive : ''}`}
        onClick={() => setYearly(true)}
      >
        Yearly <span className={styles.saveBadge}>Save 20%</span>
      </button>
    </div>
  );
}

export default PricingToggle;
