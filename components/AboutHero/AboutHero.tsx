'use client';

import { useTranslation } from 'react-i18next';
import styles from './AboutHero.module.css';

export function AboutHero() {
  const { t } = useTranslation('about');

  return (
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
  );
}
