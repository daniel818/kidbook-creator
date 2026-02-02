'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import styles from './page.module.css';

const PRICING = {
  USD: { symbol: '$', digital: 15, printed: 45 },
  EUR: { symbol: '€', digital: 14, printed: 42 },
  ILS: { symbol: '₪', digital: 55, printed: 165 }
};

export default function PricingPage() {
  const { t } = useTranslation('pricing');
  const router = useRouter();
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'ILS'>('USD');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as 'USD' | 'EUR' | 'ILS' | null;
    if (savedCurrency) setCurrency(savedCurrency);

    const handleCurrencyChange = (event: CustomEvent<'USD' | 'EUR' | 'ILS'>) => {
      setCurrency(event.detail);
    };

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
  }, []);

  const handleCreateBook = () => router.push('/create');
  const pricing = PRICING[currency];

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroBackground}>
            <div className={`${styles.blob} ${styles.blobLeft}`}></div>
            <div className={`${styles.blob} ${styles.blobRight}`}></div>
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>{t('hero.badge', 'Pricing Plans')}</span>
            <h1 className={styles.heroTitle}>
              {t('subtitle') || 'Choose the perfect package for your magical story'}
            </h1>
            <p className={styles.heroDescription}>
              {t('hero.tagline', 'From digital downloads to heirloom quality hardcover books.')}
            </p>
          </div>
        </header>

        <section className={styles.gridSection}>
          <div className={styles.grid}>
            <div className={`${styles.card} ${styles.cardMagic}`}>
              <div className={styles.iconBadge}>
                <span className="material-symbols-outlined">magic_button</span>
              </div>
              <h3 className={styles.cardTitle}>Magic Wand AI</h3>
              <p className={styles.cardCopy}>
                Every package includes our AI storytelling engine that turns your child's favorite things into a personalized adventure.
              </p>
            </div>

            <div className={`${styles.card} ${styles.cardPopular}`}>
              <div className={styles.popularBadge}>MOST POPULAR</div>
              <div className={styles.popularContent}>
                <div className={styles.popularHeader}>
                  <h3 className={styles.popularTitle}>{t('matrix.printed') || 'Printed'}</h3>
                  <p className={styles.popularSubtitle}>Premium Hardcover Book</p>
                </div>
                <div className={styles.priceRow}>
                  <span className={styles.priceAmount}>{pricing.symbol}{pricing.printed}</span>
                  <span className={styles.priceUnit}>/book</span>
                </div>
                <ul className={styles.featureList}>
                  <li>
                    <span className="material-symbols-outlined">check_circle</span>
                    {t('features.printedFeature1') || 'Professional printing'}
                  </li>
                  <li>
                    <span className="material-symbols-outlined">check_circle</span>
                    {t('features.printedFeature2') || 'Premium paper quality'}
                  </li>
                  <li>
                    <span className="material-symbols-outlined">check_circle</span>
                    {t('features.printedFeature4') || 'Includes digital copy'}
                  </li>
                  <li>
                    <span className="material-symbols-outlined">check_circle</span>
                    {t('features.printedFeature3') || 'Heirloom quality finish'}
                  </li>
                  <li>
                    <span className="material-symbols-outlined">check_circle</span>
                    {t('features.printedFeature5') || 'Shipping to your door'}
                  </li>
                </ul>
                <button className={styles.heroButton} onClick={handleCreateBook}>
                  {t('cta.primary') || 'Start Creating'}
                </button>
              </div>
            </div>

            <div className={`${styles.card} ${styles.cardDigital}`}>
              <h3 className={styles.cardTitle}>{t('matrix.digital') || 'Digital'}</h3>
              <p className={styles.cardSubtitle}>PDF Download</p>
              <div className={styles.digitalPrice}>
                <span className={styles.digitalAmount}>{pricing.symbol}{pricing.digital}</span>
                <span className={styles.digitalUnit}>/book</span>
              </div>
              <ul className={styles.featureListSmall}>
                <li>
                  <span className="material-symbols-outlined">check</span>
                  {t('features.digitalFeature1') || 'Instant download'}
                </li>
                <li>
                  <span className="material-symbols-outlined">check</span>
                  {t('features.digitalFeature2') || 'PDF format'}
                </li>
                <li>
                  <span className="material-symbols-outlined">check</span>
                  {t('features.digitalFeature3') || 'Print at home'}
                </li>
              </ul>
              <button className={styles.secondaryButton} onClick={handleCreateBook}>
                Choose Digital
              </button>
            </div>

            <div className={`${styles.card} ${styles.cardFeatures}`}>
              <div className={styles.featureItem}>
                <span className="material-symbols-outlined">verified_user</span>
                <span>Secure Payment</span>
              </div>
              <div className={styles.featureDivider}></div>
              <div className={styles.featureItem}>
                <span className="material-symbols-outlined">local_shipping</span>
                <span>Fast Delivery</span>
              </div>
              <div className={styles.featureDivider}></div>
              <div className={styles.featureItem}>
                <span className="material-symbols-outlined">heart_check</span>
                <span>Kid Safe AI</span>
              </div>
            </div>

            <div className={`${styles.card} ${styles.cardRating}`}>
              <div className={styles.ratingHeader}>
                <span className="material-symbols-outlined">star</span>
                <span>4.9/5 Rating</span>
              </div>
              <p>Join 10,000+ parents creating magic every month.</p>
            </div>
          </div>

          <div className={styles.disclaimer}>
            * Shipping and taxes calculated at checkout based on your location.
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <div className={styles.ctaEmojiWrap}>
              <span className={styles.ctaEmoji}>🎉</span>
              <span className={styles.ctaPing}></span>
            </div>
            <h2>{t('cta.title') || 'Ready to create your magical story?'}</h2>
            <p>{t('cta.subtitle') || "Start bringing your child's imagination to life today with our easy-to-use editor."}</p>
            <button className={styles.ctaButton} onClick={handleCreateBook}>
              <span className="material-symbols-outlined">auto_stories</span>
              {t('cta.primary') || 'Start Creating Now'}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
