'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './NewsletterForm.module.css';

export default function NewsletterForm() {
  const { t } = useTranslation('footer');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setStatus('error');
      setErrorMessage(t('sections.newsletter.required'));
      return;
    }

    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMessage(t('sections.newsletter.invalidEmail'));
      return;
    }

    setStatus('loading');

    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 800);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t('sections.newsletter.title')} ✨</h2>
      <p className={styles.subtitle}>{t('sections.newsletter.subtitle')}</p>

      {status === 'success' ? (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✓</span>
          <div>
            <p className={styles.successTitle}>{t('sections.newsletter.thankYou')}</p>
            <p className={styles.successSubtext}>{t('sections.newsletter.comingSoon')}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') {
                  setStatus('idle');
                  setErrorMessage('');
                }
              }}
              placeholder={t('sections.newsletter.placeholder')}
              className={`${styles.input} ${status === 'error' ? styles.inputError : ''}`}
              aria-label={t('sections.newsletter.placeholder')}
              aria-invalid={status === 'error'}
              aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              className={styles.button}
              disabled={status === 'loading'}
              aria-label={t('sections.newsletter.button')}
            >
              {status === 'loading' ? (
                <span className={styles.loading}>⟳</span>
              ) : (
                t('sections.newsletter.button')
              )}
            </button>
          </div>
          {status === 'error' && errorMessage && (
            <p id="newsletter-error" className={styles.errorMessage} role="alert">
              ⚠ {errorMessage}
            </p>
          )}
        </form>
      )}

      <p className={styles.privacy}>{t('sections.newsletter.privacy')}</p>
    </div>
  );
}
