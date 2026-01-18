'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import styles from './purchases.module.css';

export default function PurchasesPage() {
  const router = useRouter();
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
          <h1 className={styles.title}>My Purchases</h1>
          <p className={styles.subtitle}>Track your orders and download receipts</p>
        </div>

        <div className={styles.card}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📦</span>
            <p className={styles.emptyText}>No purchases yet</p>
            <p className={styles.emptySubtext}>
              Create a book and order a printed copy to see your purchases here
            </p>
            <button
              className={styles.emptyButton}
              onClick={() => router.push('/create')}
            >
              Create Your First Book
            </button>
          </div>
        </div>
      </div>
      </main>
    </>
  );
}
