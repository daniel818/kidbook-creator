'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import styles from './purchases.module.css';

export default function PurchasesPage() {
  const router = useRouter();
  const { t } = useTranslation('purchases');
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Purchases Content */}
        <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('header.title')}</h1>
          <p className={styles.subtitle}>{t('header.subtitle')}</p>
        </div>

        <div className={styles.card}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📦</span>
            <p className={styles.emptyText}>{t('empty.title')}</p>
            <p className={styles.emptySubtext}>
              {t('empty.subtitle')}
            </p>
            <button
              className={styles.emptyButton}
              onClick={() => router.push('/create')}
            >
              {t('empty.button')}
            </button>
          </div>
        </div>
      </div>
      </main>
    </>
  );
}
