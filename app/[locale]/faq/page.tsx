'use client';

import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import FAQList from '@/components/FAQ/FAQList';
import { FAQData } from '@/lib/faq/types';
import styles from './page.module.css';

export default function FAQPage() {
  const { ready, i18n, t } = useTranslation('faq');

  if (!ready) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>Loading...</div>
        </main>
      </>
    );
  }

  const data = i18n.getResourceBundle(i18n.language, 'faq') as FAQData | undefined;

  if (!data) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>Error loading FAQ data</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{data.heading}</h1>
            <p className={styles.heroSubtitle}>{data.meta.description}</p>
          </div>
        </section>

        {/* FAQ Content */}
        <div className={styles.content}>
          <FAQList data={data} />
        </div>
      </main>
    </>
  );
}
