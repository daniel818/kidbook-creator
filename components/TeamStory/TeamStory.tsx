'use client';

import { useTranslation } from 'react-i18next';
import styles from './TeamStory.module.css';

export function TeamStory() {
  const { t } = useTranslation('about');

  return (
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
  );
}
