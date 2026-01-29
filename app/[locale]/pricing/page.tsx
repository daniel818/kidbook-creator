'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { PricingMatrix } from '@/components/PricingMatrix/PricingMatrix';
import { PricingFAQ } from '@/components/PricingFAQ/PricingFAQ';
import styles from './page.module.css';

export default function PricingPage() {
  const { t } = useTranslation('pricing');
  const router = useRouter();
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'ILS'>('USD');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as 'USD' | 'EUR' | 'ILS' | null;
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }

    const handleCurrencyChange = (event: CustomEvent<'USD' | 'EUR' | 'ILS'>) => {
      setCurrency(event.detail);
    };

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
    };
  }, []);

  const handleCreateBook = () => {
    router.push('/create');
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <div className={styles.floatingShape1}></div>
            <div className={styles.floatingShape2}></div>
            <div className={styles.floatingShape3}></div>
          </div>

          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              {t('subtitle')}
            </h1>

            <p className={styles.heroDescription}>
              {t('hero.description')}
            </p>

            <button className={styles.ctaPrimary} onClick={handleCreateBook}>
              <span className={styles.ctaIcon}>✨</span>
              {t('cta.primary')}
              <span className={styles.ctaArrow}>→</span>
            </button>
          </div>

          {/* Floating Book Illustrations */}
          <div className={styles.floatingBooks}>
            <div className={styles.floatingBook} style={{ '--delay': '0s' } as React.CSSProperties}>
              <div className={styles.bookMini}>📘</div>
            </div>
            <div className={styles.floatingBook} style={{ '--delay': '1s' } as React.CSSProperties}>
              <div className={styles.bookMini}>📗</div>
            </div>
            <div className={styles.floatingBook} style={{ '--delay': '2s' } as React.CSSProperties}>
              <div className={styles.bookMini}>📕</div>
            </div>
          </div>
        </section>

        {/* Pricing Matrix */}
        <PricingMatrix currency={currency} />

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBackground}>
            <div className={styles.ctaShape1}></div>
            <div className={styles.ctaShape2}></div>
          </div>
          <div className={styles.ctaContent}>
            <span className={styles.ctaEmoji}>🎉</span>
            <h2 className={styles.ctaTitle}>{t('cta.title')}</h2>
            <p className={styles.ctaSubtitle}>{t('cta.subtitle')}</p>
            <button className={styles.ctaButton} onClick={handleCreateBook}>
              <span className={styles.ctaButtonIcon}>📖</span>
              {t('cta.primary')}
              <span className={styles.ctaButtonArrow}>→</span>
            </button>
          </div>
        </section>

        {/* FAQ Section */}
        <PricingFAQ />

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>📚</span>
              <span className={styles.footerName}>KidBook Creator</span>
            </div>
            <p className={styles.footerTagline}>
              {t('footer.tagline')}
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
