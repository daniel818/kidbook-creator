'use client';

import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import styles from './page.module.css';

interface TermsData {
  meta: {
    title: string;
    lastUpdated: string;
  };
  sections: Array<{
    title: string;
    content: string;
  }>;
}

export default function TermsPage() {
  const { ready, i18n } = useTranslation('terms');

  if (!ready) {
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

  const data = i18n.getResourceBundle(i18n.language, 'terms') as TermsData | undefined;

  if (!data) {
    return (
      <>
        <Navbar />
        <main className={styles.legalPage}>
          <div className={styles.container}>
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>Error loading terms data</div>
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
            {data.sections.map((section, index) => {
              const title = section.title.toLowerCase();
              const isCancellationSection = title.includes('cancellation')
                || title.includes('storn')
                || title.includes('refund')
                || title.includes('bittul')
                || title.includes('ביטול');
              const sectionId = isCancellationSection && data.sections.findIndex((candidate) => {
                const candidateTitle = candidate.title.toLowerCase();
                return candidateTitle.includes('cancellation')
                  || candidateTitle.includes('storn')
                  || candidateTitle.includes('refund')
                  || candidateTitle.includes('bittul')
                  || candidateTitle.includes('ביטול');
              }) === index
                ? 'cancellation'
                : undefined;
              return (
                <section key={index} id={sectionId} className={styles.section}>
                  <h2 className={styles.sectionTitle}>{section.title}</h2>
                  <p className={styles.sectionContent}>{section.content}</p>
                </section>
              );
            })}
          </div>

          <footer className={styles.footer}>
            <p>This document is legally binding. Please read it carefully.</p>
          </footer>
        </div>
      </main>
    </>
  );
}
