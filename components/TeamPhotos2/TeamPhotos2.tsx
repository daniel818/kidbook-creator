'use client';

import { useTranslation } from 'react-i18next';
import styles from './TeamPhotos2.module.css';

export function TeamPhotos2() {
  const { t } = useTranslation('about');

  return (
    <section className={styles.photosSection}>
      <div className={styles.container}>
        <div className={styles.photoPlaceholder}>
          <div className={styles.placeholderContent}>
            <svg 
              className={styles.icon}
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className={styles.placeholderText}>{t('images.comingSoon')}</p>
            <p className={styles.placeholderSubtext}>{t('images.placeholder2Alt')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
