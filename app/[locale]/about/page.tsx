'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.css';

export default function AboutPage() {
  const router = useRouter();
  const { t } = useTranslation('about');

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
            <h1 className={styles.title}>
              {t('hero.titleStart', 'Made by ')}
              <span className={styles.titleHighlight}>{t('hero.titleHighlight', 'Parents')}</span>
              {t('hero.titleEnd', ', for Kids')}
            </h1>
            <p className={styles.subtitle}>{t('hero.subtitle')}</p>
          </div>
        </section>

        {/* Story Section */}
        <section className={styles.storySection}>
          <div className={styles.container}>
            <h2 className={styles.heading}>{t('story.heading')}</h2>
            <div className={styles.content}>
              <p className={styles.paragraph}>{t('story.paragraph1')}</p>
              <p className={styles.paragraph}>{t('story.paragraph2')}</p>
              <p className={styles.paragraph}>{t('story.paragraph3')}</p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className={styles.valuesSection}>
          <div className={styles.valuesContainer}>
            <h2 className={styles.valuesHeading}>{t('values.heading', 'What Drives Us')}</h2>
            <div className={styles.valuesGrid}>
              <div className={styles.valueCard}>
                <div className={`${styles.valueIcon} ${styles.valueIconLove}`}>
                  <span className="material-symbols-outlined">favorite</span>
                </div>
                <h3 className={styles.valueTitle}>{t('values.love.title', 'Made with Love')}</h3>
                <p className={styles.valueDescription}>{t('values.love.description', 'Every feature is built with the same care we put into bedtime stories for our own kids.')}</p>
              </div>
              <div className={styles.valueCard}>
                <div className={`${styles.valueIcon} ${styles.valueIconImagination}`}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <h3 className={styles.valueTitle}>{t('values.imagination.title', 'Spark Imagination')}</h3>
                <p className={styles.valueDescription}>{t('values.imagination.description', 'We believe stories shape who children become. Every book is a seed of wonder, courage, and kindness.')}</p>
              </div>
              <div className={styles.valueCard}>
                <div className={`${styles.valueIcon} ${styles.valueIconFamily}`}>
                  <span className="material-symbols-outlined">diversity_1</span>
                </div>
                <h3 className={styles.valueTitle}>{t('values.family.title', 'For Every Family')}</h3>
                <p className={styles.valueDescription}>{t('values.family.description', 'Available in multiple languages with stories that celebrate every child, no matter where they come from.')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContainer}>
            <h2 className={styles.ctaHeading}>{t('cta.heading')}</h2>
            <p className={styles.ctaDescription}>{t('cta.description')}</p>
            <div className={styles.buttonGroup}>
              <button
                className={styles.primaryButton}
                onClick={() => router.push('/create')}
              >
                {t('cta.primary')}
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => router.push('/pricing')}
              >
                {t('cta.secondary')}
              </button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className={styles.contactSection}>
          <div className={styles.contactContainer}>
            <h2 className={styles.contactHeading}>{t('contact.heading')}</h2>
            <p className={styles.contactDescription}>{t('contact.description')}</p>
            <a
              href="mailto:support@kidbookcreator.com"
              className={styles.contactButton}
            >
              {t('contact.button')}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
