'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import styles from './purchases.module.css';

interface Order {
  id: string;
  bookTitle: string;
  bookThumbnail?: string;
  bookTheme?: string;
  childName: string;
  format: string;
  size: string;
  quantity: number;
  total: number;
  status: string;
  fulfillmentStatus?: string;
  luluStatus?: string;
  createdAt: string;
  trackingNumber?: string;
}

export default function PurchasesPage() {
  const router = useRouter();
  const { t } = useTranslation('purchases');
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, fulfillment?: string) => {
    // Determine displayed status
    let displayStatus = fulfillment || status;
    let styleClass = styles.orderStatus;

    if (['shipped', 'delivered'].includes(displayStatus)) {
      styleClass += ` ${styles.statusSuccess}`;
      displayStatus = displayStatus === 'shipped' ? 'Shipped 🚚' : 'Delivered 🎉';
    } else if (['SUCCESS', 'CREATED', 'PRINTING'].includes(displayStatus)) {
      styleClass += ` ${styles.statusProcessing}`;
      displayStatus = 'Processing ⚙️';
    } else if (['PENDING', 'processing', 'CREATING_JOB', 'UPLOADING'].includes(displayStatus)) {
      styleClass += ` ${styles.statusProcessing}`;
      displayStatus = 'Processing ⏳';
    } else if (['FAILED', 'cancelled', 'ERROR'].includes(displayStatus)) {
      styleClass += ` ${styles.statusFailed}`;
    }

    return <span className={styleClass}>{displayStatus}</span>;
  };

  const getThemeColor = (theme?: string) => {
    // Basic mapping for fallback colors
    const colors: Record<string, string> = {
      'adventure': '#f97316',
      'fantasy': '#ec4899',
      'animals': '#84cc16',
      'space': '#6366f1',
      'default': '#cbd5e1'
    };
    return colors[theme || 'default'] || colors['default'];
  };

  if (authLoading || (isLoading && !orders.length)) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>{t('header.title') || 'Your Orders'}</h1>
            <p className={styles.subtitle}>{t('header.subtitle') || 'Track your printed books'}</p>
          </div>

          {orders.length === 0 ? (
            <div className={styles.card}>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📦</span>
                <p className={styles.emptyText}>{t('empty.title') || 'No orders yet'}</p>
                <p className={styles.emptySubtext}>
                  {t('empty.subtitle') || 'Create your first custom book to verify tracking!'}
                </p>
                <button
                  className={styles.emptyButton}
                  onClick={() => router.push('/create')}
                >
                  {t('empty.button') || 'Create a Book'}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.orderGrid}>
              {orders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderId}>ORDER #{order.id.slice(0, 8).toUpperCase()}</div>
                    <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>

                  <div className={styles.orderContent}>
                    {order.bookThumbnail ? (
                      <img
                        src={order.bookThumbnail}
                        alt={order.bookTitle}
                        className={styles.bookCoverImage}
                      />
                    ) : (
                      <div
                        className={styles.bookCover}
                        style={{ backgroundColor: getThemeColor(order.bookTheme) }}
                      >
                        📚
                      </div>
                    )}
                    <div className={styles.orderDetails}>
                      <h3 className={styles.bookTitle}>{order.bookTitle}</h3>
                      <div className={styles.bookMeta}>
                        Format: {order.format} • Size: {order.size} • Qty: {order.quantity}
                      </div>
                      {getStatusBadge(order.status, order.fulfillmentStatus)}
                    </div>
                  </div>

                  <div className={styles.orderFooter}>
                    <div className={styles.orderTotal}>
                      ${order.total.toFixed(2)}
                    </div>
                    {order.trackingNumber && (
                      <button className={styles.trackButton}>
                        Track Package
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
