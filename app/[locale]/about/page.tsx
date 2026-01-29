'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
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
            <h1 className={styles.title}>{t('hero.title')}</h1>
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
                onClick={() => router.push('/community')}
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
    </>
  );
}
