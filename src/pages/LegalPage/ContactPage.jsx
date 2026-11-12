import { useState } from 'react';
import { Mail, Send, CheckCircle2, HelpCircle, Bug } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/paths';
import styles from './LegalPage.module.css';

export function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'feedback',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    // In-browser mock delivery / success state
    setFormSubmitted(true);
  };

  return (
    <div className={styles.legalPage}>
      <SeoHead
        title="Contact Us & Feedback — Image Convert by WebToolOcean"
        description="Get in touch with the Image Convert team at WebToolOcean. Send us your feedback, bug reports, feature suggestions, or questions."
        canonicalPath={ROUTES.contact}
      />
      <div className="container">
        <header className={styles.legalHeader}>
          <div className={styles.legalBadge}>
            <Mail size={14} style={{ marginRight: '6px' }} /> Support &amp; Community
          </div>
          <h1 className={styles.legalTitle}>Contact Us &amp; Feedback</h1>
          <p className={styles.legalMeta}>We'd love to hear from you. Have a question, suggestion, or bug to report?</p>
        </header>

        <div className={styles.legalCard}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {/* Left Column: Direct Info & Quick FAQ */}
            <div>
              <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: 'none' }}>Direct Channels</h2>
              <p>
                Image Convert is developed and maintained by the <strong>WebToolOcean</strong> engineering team.
                We actively review user feedback to improve tool performance and browser compatibility.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--color-text)' }}>Support Email</strong>
                    <a href="mailto:webtoolocean@gmail.com" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '14px' }}>
                      webtoolocean@gmail.com
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--color-text)' }}>Help &amp; Privacy FAQ</strong>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      All tools process images in your browser; no files are saved on servers.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bug size={18} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--color-text)' }}>Bug Reports &amp; Feature Requests</strong>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      Encountered an issue with WebAssembly or WebGPU? Let us know your browser version.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Feedback Form */}
            <div style={{ background: 'var(--color-bg-subtle)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
              {formSubmitted ? (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', margin: '0 0 8px', color: 'var(--color-text)' }}>Thank You!</h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Your message has been received. Our team will review your feedback and get back to you if needed.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ marginTop: '20px' }}
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', email: '', topic: 'feedback', message: '' });
                    }}
                  >
                    Send Another Note
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', margin: '0 0 4px', color: 'var(--color-text)' }}>Send Us a Message</h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                      Topic
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="feedback">General Feedback</option>
                      <option value="bug">Report a Bug / Tool Error</option>
                      <option value="feature">Suggest a New Feature</option>
                      <option value="privacy">Privacy or Data Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="How can we help or what would you like to see improved?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    icon={<Send size={15} />}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Submit Feedback
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
