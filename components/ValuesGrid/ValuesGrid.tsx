'use client';

import { useTranslation } from 'react-i18next';
import styles from './ValuesGrid.module.css';

export function ValuesGrid() {
  const { t } = useTranslation('about');

  const values = [
    {
      key: 'storytelling',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
    },
    {
      key: 'learning',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
    },
    {
      key: 'innovation',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20"/>
          <path d="M2 12h20"/>
          <path d="m19.07 4.93-14.14 14.14"/>
          <path d="m4.93 4.93 14.14 14.14"/>
        </svg>
      ),
    },
    {
      key: 'wonder',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
    },
  ];

  return (
    <section className={styles.valuesSection}>
      <div className={styles.container}>
        <h2 className={styles.heading}>{t('values.heading')}</h2>
        <div className={styles.grid}>
          {values.map((value) => (
            <div key={value.key} className={styles.valueCard}>
              <div className={styles.iconWrapper}>
                {value.icon}
              </div>
              <h3 className={styles.valueTitle}>
                {t(`values.${value.key}.title`)}
              </h3>
              <p className={styles.valueDescription}>
                {t(`values.${value.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
