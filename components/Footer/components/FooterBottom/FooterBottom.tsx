'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import styles from './FooterBottom.module.css';

export default function FooterBottom() {
  const { t, i18n } = useTranslation('footer');
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.left}>
          <Link href="/" className={styles.logoLink} aria-label="KidBook Creator Home">
            <div className={styles.logo}>
              <span className={styles.logoIcon}>📚</span>
              <span className={styles.logoText}>KidBook Creator</span>
            </div>
          </Link>
          <p className={styles.copyright}>
            {t('bottom.copyright', { year: currentYear })}
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
  );
}
