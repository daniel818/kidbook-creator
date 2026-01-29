'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import styles from './page.module.css';

interface PrivacyData {
  meta: {
    title: string;
    lastUpdated: string;
  };
  sections: Array<{
    title: string;
    content: string;
  }>;
}

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const [data, setData] = useState<PrivacyData | null>(null);
  const locale = i18n.language || 'en';

  useEffect(() => {
    async function loadPrivacyData() {
      try {
        const privacyData = await import(`@/locales/${locale}/privacy.json`);
        setData(privacyData.default);
      } catch (error) {
        const privacyData = await import('@/locales/en/privacy.json');
        setData(privacyData.default);
      }
    }
    loadPrivacyData();
  }, [locale]);

  if (!data) {
    return (
      <>
        <Navbar />
        <main className={styles.legalPage}>
          <div className={styles.container}>
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>Loading...</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.legalPage}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>{data.meta.title}</h1>
            <p className={styles.meta}>{data.meta.lastUpdated}</p>
          </header>

          <div className={styles.content}>
            {data.sections.map((section, index) => (
              <section key={index} className={styles.section}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <p className={styles.sectionContent}>{section.content}</p>
              </section>
            ))}
          </div>

          <footer className={styles.footer}>
            <p>This document is legally binding. Please read it carefully.</p>
          </footer>
        </div>
      </main>
    </>
  );
}
