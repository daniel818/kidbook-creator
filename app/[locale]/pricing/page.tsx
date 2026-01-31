'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { PRICING, type Currency } from '@/lib/pricing/constants';
import styles from './page.module.css';

export default function PricingPage() {
  const { t } = useTranslation('pricing');
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as Currency | null;
    if (savedCurrency) setCurrency(savedCurrency);

    const handleCurrencyChange = (event: CustomEvent<Currency>) => {
      setCurrency(event.detail);
    };

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
  }, []);

  const handleCreateBook = () => router.push('/create');
  const pricing = PRICING[currency];

  const faqItems = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{t('subtitle')}</h1>
            <p className={styles.heroDescription}>{t('hero.description')}</p>
          </div>
        </section>

        {/* Pricing Section */}
        <section className={styles.pricingSection}>

          <div className={styles.pricingGrid}>
            {/* Digital Book Card */}
            <div className={styles.pricingCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{t('matrix.digital')}</h3>
                <p className={styles.cardSubtitle}>PDF Download</p>
              </div>
              <div className={styles.cardPricing}>
                <span className={styles.priceAmount}>{pricing.symbol}{pricing.digital.toFixed(2)}</span>
                <span className={styles.priceLabel}>{t('matrix.perBook')}</span>
              </div>
              <ul className={styles.featureList}>
                <li>{t('features.digitalFeature1')}</li>
                <li>{t('features.digitalFeature2')}</li>
                <li>{t('features.digitalFeature3')}</li>
              </ul>
              <button className={styles.cardButton} onClick={handleCreateBook}>
                {t('cta.primary')}
              </button>
            </div>

            {/* Printed Book Card */}
            <div className={`${styles.pricingCard} ${styles.featured}`}>
              <div className={styles.featuredBadge}>Most Popular</div>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{t('matrix.printed')}</h3>
                <p className={styles.cardSubtitle}>Hardcover Book</p>
              </div>
              <div className={styles.cardPricing}>
                <span className={styles.priceAmount}>{pricing.symbol}{pricing.print.toFixed(2)}</span>
                <span className={styles.priceLabel}>{t('matrix.perBook')}</span>
                <span className={styles.shippingNote}>{t('matrix.plusShipping')}</span>
              </div>
              <ul className={styles.featureList}>
                <li>{t('features.printedFeature1')}</li>
                <li>{t('features.printedFeature2')}</li>
                <li>{t('features.printedFeature3')}</li>
              </ul>
              <button className={`${styles.cardButton} ${styles.primaryButton}`} onClick={handleCreateBook}>
                {t('cta.primary')}
              </button>
            </div>
          </div>

          <div className={styles.disclaimers}>
            <p>* {t('disclaimers.shipping')}</p>
            <p>* {t('disclaimers.tax')}</p>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <span className={styles.ctaEmoji}>🎉</span>
            <h2 className={styles.ctaTitle}>{t('cta.title')}</h2>
            <p className={styles.ctaSubtitle}>{t('cta.subtitle')}</p>
            <button className={styles.ctaButton} onClick={handleCreateBook}>
              <span className={styles.ctaButtonIcon}>📖</span>
              {t('cta.primary')}
            </button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={styles.faqSection}>
          <h2 className={styles.faqTitle}>{t('faq.title')}</h2>
          <div className={styles.faqItems}>
            {faqItems.map((item, index) => (
              <div key={index} className={styles.faqItem}>
                <button
                  className={`${styles.faqQuestion} ${openFaqIndex === index ? styles.open : ''}`}
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <span>{item.question}</span>
                  <span className={styles.faqIcon}>{openFaqIndex === index ? '−' : '+'}</span>
                </button>
                <div className={`${styles.faqAnswer} ${openFaqIndex === index ? styles.visible : ''}`}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
