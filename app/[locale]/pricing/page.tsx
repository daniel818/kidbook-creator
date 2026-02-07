'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.css';

const PRICING = {
  USD: { symbol: '$', digital: 15, softcover: 40, hardcover: 45 },
  EUR: { symbol: '€', digital: 14, softcover: 37, hardcover: 42 },
  ILS: { symbol: '₪', digital: 55, softcover: 150, hardcover: 165 }
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
        {/* Hero */}
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

        {/* Pricing Tiers */}
        <section className={styles.pricingSection}>
          <div className={styles.pricingCards}>
            {/* Digital */}
            <div className={styles.tierCard}>
              <div className={styles.tierIcon}>
                <span className="material-symbols-outlined">picture_as_pdf</span>
              </div>
              <h3 className={styles.tierName}>{t('matrix.digital') || 'Digital'}</h3>
              <p className={styles.tierSubtitle}>PDF Download</p>
              <div className={styles.tierPrice}>
                <span className={styles.tierAmount}>{pricing.symbol}{pricing.digital}</span>
                <span className={styles.tierUnit}>/book</span>
              </div>
              <ul className={styles.tierFeatures}>
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
              <button className={styles.tierButton} onClick={handleCreateBook}>
                Choose Digital
              </button>
            </div>

            {/* Softcover */}
            <div className={styles.tierCard}>
              <div className={styles.tierIcon}>
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <h3 className={styles.tierName}>Softcover</h3>
              <p className={styles.tierSubtitle}>Printed Softcover Book</p>
              <div className={styles.tierPrice}>
                <span className={styles.tierAmount}>{pricing.symbol}{pricing.softcover}</span>
                <span className={styles.tierUnit}>/book</span>
              </div>
              <ul className={styles.tierFeatures}>
                <li>
                  <span className="material-symbols-outlined">check</span>
                  {t('features.printedFeature1') || 'Professional printing'}
                </li>
                <li>
                  <span className="material-symbols-outlined">check</span>
                  Quality paper
                </li>
                <li>
                  <span className="material-symbols-outlined">check</span>
                  {t('features.printedFeature4') || 'Includes digital copy'}
                </li>
                <li>
                  <span className="material-symbols-outlined">check</span>
                  {t('features.printedFeature5') || 'Shipping to your door'}
                </li>
              </ul>
              <button className={styles.tierButton} onClick={handleCreateBook}>
                Choose Softcover
              </button>
            </div>

            {/* Hardcover (Featured) */}
            <div className={`${styles.tierCard} ${styles.tierFeatured}`}>
              <div className={styles.featuredBadge}>MOST POPULAR</div>
              <div className={styles.tierIcon}>
                <span className="material-symbols-outlined">auto_stories</span>
              </div>
              <h3 className={styles.tierName}>Hardcover</h3>
              <p className={styles.tierSubtitle}>Premium Hardcover Book</p>
              <div className={styles.tierPrice}>
                <span className={styles.tierAmount}>{pricing.symbol}{pricing.hardcover}</span>
                <span className={styles.tierUnit}>/book</span>
              </div>
              <ul className={styles.tierFeatures}>
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
                  Hardcover binding
                </li>
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  {t('features.printedFeature4') || 'Includes digital copy'}
                </li>
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  {t('features.printedFeature5') || 'Shipping to your door'}
                </li>
              </ul>
              <button className={styles.tierButtonPrimary} onClick={handleCreateBook}>
                {t('cta.primary') || 'Start Creating'}
              </button>
            </div>
          </div>

          <div className={styles.disclaimer}>
            * Shipping and taxes calculated at checkout based on your location.
          </div>
        </section>

        {/* Trust + Social Proof */}
        <section className={styles.trustSection}>
          <div className={styles.trustContent}>
            <div className={styles.trustBadges}>
              <div className={styles.trustBadge}>
                <span className="material-symbols-outlined">verified_user</span>
                <span>Secure Payment</span>
              </div>
              <div className={styles.trustBadge}>
                <span className="material-symbols-outlined">local_shipping</span>
                <span>Fast Delivery</span>
              </div>
              <div className={styles.trustBadge}>
                <span className="material-symbols-outlined">heart_check</span>
                <span>Kid Safe AI</span>
              </div>
            </div>
            <div className={styles.trustDivider}></div>
            <div className={styles.socialProof}>
              <div className={styles.ratingBadge}>
                <span className="material-symbols-outlined">star</span>
                <span className={styles.ratingScore}>4.9/5</span>
              </div>
              <p className={styles.ratingText}>Join 10,000+ parents creating magic every month.</p>
            </div>
          </div>

          <div className={styles.aiHighlight}>
            <div className={styles.aiHighlightIcon}>
              <span className="material-symbols-outlined">magic_button</span>
            </div>
            <div className={styles.aiHighlightText}>
              <strong>Magic Wand</strong>
              <span>Every package includes our storytelling engine that turns your child&apos;s favorite things into a personalized adventure.</span>
            </div>
          </div>
        </section>

        {/* CTA */}
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
      <Footer />
    </>
  );
}
