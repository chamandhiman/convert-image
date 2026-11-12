import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, Sliders, Check, X, ChevronRight, Lock } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import styles from './CookieConsentModal.module.css';

const STORAGE_KEY = 'webtoolocean_cookie_consent';

export function CookieConsentModal() {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          necessary: true,
          analytics: !!parsed.analytics,
          advertising: !!parsed.advertising,
        };
      }
    } catch {}
    return {
      necessary: true,
      analytics: false,
      advertising: false,
    };
  });

  // On mount: sync stored consent to Google Consent Mode v2 if previously configured
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && typeof window.gtag === 'function') {
        const parsed = JSON.parse(stored);
        window.gtag('consent', 'update', {
          analytics_storage: parsed.analytics ? 'granted' : 'denied',
          ad_storage: parsed.advertising ? 'granted' : 'denied',
          ad_user_data: parsed.advertising ? 'granted' : 'denied',
          ad_personalization: parsed.advertising ? 'granted' : 'denied',
        });
      }
    } catch {}
  }, []);

  // Listen for global event to reopen preferences from Footer or Legal pages
  useEffect(() => {
    const handleReopen = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences({
            necessary: true,
            analytics: !!parsed.analytics,
            advertising: !!parsed.advertising,
          });
        }
      } catch {
        // Keep defaults
      }
      setIsCustomizing(true);
      setIsOpen(true);
    };

    window.addEventListener('open-cookie-preferences', handleReopen);
    return () => window.removeEventListener('open-cookie-preferences', handleReopen);
  }, []);

  // Apply consent updates to Google Consent Mode / custom events
  const applyConsent = useCallback((consentData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...consentData,
        timestamp: new Date().toISOString(),
      }));

      // Update Google Consent Mode v2 if present
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: consentData.analytics ? 'granted' : 'denied',
          ad_storage: consentData.advertising ? 'granted' : 'denied',
          ad_user_data: consentData.advertising ? 'granted' : 'denied',
          ad_personalization: consentData.advertising ? 'granted' : 'denied',
        });
      }

      // Dispatch custom DOM event for any tracking scripts to react
      window.dispatchEvent(
        new CustomEvent('cookie-consent-updated', { detail: consentData }),
      );
    } catch (err) {
      console.warn('Could not save cookie preferences:', err);
    }
  }, []);

  const handleAcceptAll = () => {
    const fullConsent = { necessary: true, analytics: true, advertising: true };
    setPreferences(fullConsent);
    applyConsent(fullConsent);
    setIsOpen(false);
    setIsCustomizing(false);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly = { necessary: true, analytics: false, advertising: false };
    setPreferences(essentialOnly);
    applyConsent(essentialOnly);
    setIsOpen(false);
    setIsCustomizing(false);
  };

  const handleSavePreferences = () => {
    applyConsent(preferences);
    setIsOpen(false);
    setIsCustomizing(false);
  };

  if (!isOpen) return null;

  return (
    <aside className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="cookie-heading">
      <div className={styles.modalCard}>
        {/* Header Icon + Title */}
        <div className={styles.cardHeader}>
          <div className={styles.iconCircle}>
            <Cookie size={22} className={styles.cookieIcon} />
          </div>
          <div className={styles.titleWrap}>
            <h2 id="cookie-heading" className={styles.title}>Your Privacy Matters</h2>
            <span className={styles.brandBadge}>Image Convert by WebToolOcean</span>
          </div>
          {isCustomizing && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsCustomizing(false)}
              aria-label="Back to simple view"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal Description */}
        {!isCustomizing ? (
          <>
            <p className={styles.description}>
              We use cookies to improve your experience, understand how our website is used, and support our services. You can choose which cookies you allow. All image conversions happen locally on your device with 100% in-browser privacy.
            </p>

            <div className={styles.legalLinksRow}>
              <Link to={ROUTES.privacy} className={styles.policyLink}>
                Privacy Policy <ChevronRight size={13} />
              </Link>
              <span className={styles.dotDivider}>•</span>
              <Link to={ROUTES.cookies} className={styles.policyLink}>
                Cookie Policy <ChevronRight size={13} />
              </Link>
            </div>

            {/* Main Action Buttons */}
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.btnAcceptAll}
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
              <button
                type="button"
                className={styles.btnReject}
                onClick={handleRejectNonEssential}
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                className={styles.btnCustomize}
                onClick={() => setIsCustomizing(true)}
              >
                <Sliders size={14} />
                <span>Customize Preferences</span>
              </button>
            </div>
          </>
        ) : (
          /* Detailed Category Preferences View */
          <div className={styles.customizingView}>
            <p className={styles.customizingIntro}>
              Manage your cookie preferences below. Necessary cookies cannot be disabled as they are required for basic site security and navigation.
            </p>

            <div className={styles.categoryList}>
              {/* 1. Necessary Cookies */}
              <div className={styles.categoryItem}>
                <div className={styles.categoryText}>
                  <div className={styles.categoryHeader}>
                    <Lock size={15} className={styles.catIconLocked} />
                    <strong className={styles.categoryTitle}>Necessary Cookies</strong>
                    <span className={styles.alwaysActiveBadge}>Always Active</span>
                  </div>
                  <p className={styles.categoryDesc}>
                    Essential for website functionality, security, fraud prevention, and session state. They do not store personally identifiable data.
                  </p>
                </div>
                <div className={styles.toggleWrap}>
                  <input
                    type="checkbox"
                    checked
                    disabled
                    aria-label="Necessary cookies always active"
                    className={styles.toggleInput}
                  />
                  <div className={`${styles.toggleSlider} ${styles.toggleDisabled}`}>
                    <Check size={12} color="#ffffff" />
                  </div>
                </div>
              </div>

              {/* 2. Analytics Cookies */}
              <div className={styles.categoryItem}>
                <div className={styles.categoryText}>
                  <div className={styles.categoryHeader}>
                    <ShieldCheck size={15} className={styles.catIcon} />
                    <strong className={styles.categoryTitle}>Analytics Cookies</strong>
                  </div>
                  <p className={styles.categoryDesc}>
                    Help us understand how visitors interact with Image Convert by collecting anonymous metrics on tool usage and page performance.
                  </p>
                </div>
                <label className={styles.toggleWrap}>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                    }
                    className={styles.toggleInput}
                    aria-label="Toggle analytics cookies"
                  />
                  <div
                    className={`${styles.toggleSlider} ${
                      preferences.analytics ? styles.toggleActive : ''
                    }`}
                  >
                    {preferences.analytics && <Check size={12} color="#ffffff" />}
                  </div>
                </label>
              </div>

              {/* 3. Advertising & Marketing Cookies */}
              <div className={styles.categoryItem}>
                <div className={styles.categoryText}>
                  <div className={styles.categoryHeader}>
                    <Cookie size={15} className={styles.catIcon} />
                    <strong className={styles.categoryTitle}>Advertising Cookies</strong>
                  </div>
                  <p className={styles.categoryDesc}>
                    Used by our advertising partners to show relevant ads tailored to your interests and measure campaign effectiveness.
                  </p>
                </div>
                <label className={styles.toggleWrap}>
                  <input
                    type="checkbox"
                    checked={preferences.advertising}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, advertising: e.target.checked }))
                    }
                    className={styles.toggleInput}
                    aria-label="Toggle advertising cookies"
                  />
                  <div
                    className={`${styles.toggleSlider} ${
                      preferences.advertising ? styles.toggleActive : ''
                    }`}
                  >
                    {preferences.advertising && <Check size={12} color="#ffffff" />}
                  </div>
                </label>
              </div>
            </div>

            {/* Customization Action Buttons */}
            <div className={styles.customActionsRow}>
              <button
                type="button"
                className={styles.btnSecondarySmall}
                onClick={handleRejectNonEssential}
              >
                Reject All
              </button>
              <button
                type="button"
                className={styles.btnSecondarySmall}
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
              <button
                type="button"
                className={styles.btnSavePreferences}
                onClick={handleSavePreferences}
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default CookieConsentModal;
