'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const { t, i18n } = useTranslation('footer');

  const handleComingSoon = (e: React.MouseEvent<HTMLAnchorElement>, pageName: string) => {
    e.preventDefault();
    alert(`${pageName} - Coming Soon!\n\nThis page is currently under development and will be available soon.`);
  };

  return (
    <footer className={styles.footer} role="contentinfo">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'KidBook Creator',
            url: 'https://kidbookcreator.com',
            logo: 'https://kidbookcreator.com/logo.png',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              email: 'support@kidbookcreator.com',
              availableLanguage: ['English', 'German', 'Hebrew'],
            },
          }),
        }}
      />

      <div className={styles.container}>
        <nav className={styles.grid} aria-label={t('aria.footerNavigation')}>
          {/* Quick Links Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('sections.quickLinks.title')}</h2>
            <div className={styles.sectionContent}>
              <Link href="/mybooks">{t('sections.quickLinks.myBooks')}</Link>
              <Link href="/create">{t('sections.quickLinks.createStory')}</Link>
              <Link href="/community" onClick={(e) => handleComingSoon(e, 'Community Books')}>{t('sections.quickLinks.community')}</Link>
              <Link href="/pricing">{t('sections.quickLinks.pricing')}</Link>
              <Link href="/faq">{t('sections.quickLinks.faq')}</Link>
              <Link href="/about">{t('sections.quickLinks.about')}</Link>
            </div>
          </div>

          {/* Legal Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('sections.legal.title')}</h2>
            <div className={styles.sectionContent}>
              <Link href="/privacy">{t('sections.legal.privacy')}</Link>
              <Link href="/terms">{t('sections.legal.terms')}</Link>
              <Link href="/privacy#cookies">{t('sections.legal.cookies')}</Link>
              <Link href="/terms#cancellation">{t('sections.legal.refunds')}</Link>
              <Link href="/terms#cancellation">{t('sections.legal.shipping')}</Link>
              <Link href="/about#contact">{t('sections.legal.contact')}</Link>
            </div>
          </div>
        </nav>

        {/* Footer Bottom */}
        <div className={styles.bottom}>
          <div className={styles.bottomContent}>
            <div className={styles.left}>
              <Link href="/" className={styles.logoLink} aria-label="KidBook Creator Home">
                <div className={styles.logo}>
                  <span className={styles.logoIcon}>📚</span>
                  <span className={styles.logoText}>KidBook Creator</span>
                </div>
              </Link>
              <p className={styles.copyright}>
                {t('bottom.copyright', { year: new Date().getFullYear() })}
              </p>
            </div>

            <div className={styles.right}>
              <div className={styles.languages}>
                <button
                  onClick={() => i18n.changeLanguage('en')}
                  className={`${styles.langButton} ${i18n.language === 'en' ? styles.active : ''}`}
                  aria-label="Switch to English"
                >
                  EN
                </button>
                <span className={styles.separator}>|</span>
                <button
                  onClick={() => i18n.changeLanguage('de')}
                  className={`${styles.langButton} ${i18n.language === 'de' ? styles.active : ''}`}
                  aria-label="Auf Deutsch wechseln"
                >
                  DE
                </button>
                <span className={styles.separator}>|</span>
                <button
                  onClick={() => i18n.changeLanguage('he')}
                  className={`${styles.langButton} ${i18n.language === 'he' ? styles.active : ''}`}
                  aria-label="עבור לעברית"
                >
                  HE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
