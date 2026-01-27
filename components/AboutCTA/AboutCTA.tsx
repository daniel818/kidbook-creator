'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import styles from './AboutCTA.module.css';

export function AboutCTA() {
  const router = useRouter();
  const { t } = useTranslation('about');

  return (
    <section className={styles.ctaSection}>
      <div className={styles.container}>
        <h2 className={styles.heading}>{t('cta.heading')}</h2>
        <p className={styles.description}>{t('cta.description')}</p>
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
  );
}
