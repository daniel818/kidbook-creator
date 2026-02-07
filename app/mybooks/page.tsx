'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Book } from '@/lib/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import { BookGrid } from '@/components/BookGrid';
import { ConfirmModal } from '@/components/ConfirmModal';
import styles from './mybooks.module.css';

type FilterTab = 'all' | 'draft' | 'preview' | 'ordered';

const FILTER_STATUS_MAP: Record<FilterTab, Book['status'][]> = {
  all: [],
  draft: ['draft', 'completed'],
  preview: ['preview'],
  ordered: ['ordered'],
};

export default function MyBooksPage() {
  const router = useRouter();
  const { t } = useTranslation('mybooks');
  const { user, isLoading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [orderMap, setOrderMap] = useState<Record<string, { status: string; estimatedDelivery?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const loadBooks = useCallback(async () => {
    if (authLoading) return;

    setIsLoading(true);

    if (user) {
      try {
        const [booksRes, ordersRes] = await Promise.all([
          fetch('/api/books'),
          fetch('/api/orders'),
        ]);

        if (booksRes.ok) {
          const data = await booksRes.json();
          setBooks(data);
        } else {
          setBooks([]);
        }

        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          const map: Record<string, { status: string; estimatedDelivery?: string }> = {};
          for (const order of orders) {
            map[order.bookId] = {
              status: order.fulfillmentStatus || order.status,
              estimatedDelivery: order.estimatedDeliveryMin && order.estimatedDeliveryMax
                ? `${order.estimatedDeliveryMin} - ${order.estimatedDeliveryMax}`
                : undefined,
            };
          }
          setOrderMap(map);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setBooks([]);
      }
    } else {
      setBooks([]);
    }

    setIsLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const filteredBooks = useMemo(() => {
    if (activeFilter === 'all') return books;
    const statuses = FILTER_STATUS_MAP[activeFilter];
    return books.filter(b => statuses.includes(b.status));
  }, [books, activeFilter]);

  const filterCounts = useMemo(() => {
    return {
      all: books.length,
      draft: books.filter(b => b.status === 'draft' || b.status === 'completed').length,
      preview: books.filter(b => b.status === 'preview').length,
      ordered: books.filter(b => b.status === 'ordered').length,
    };
  }, [books]);

  const handleDeleteBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookToDelete(bookId);
    setShowDeleteModal(true);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;

    setIsDeleting(true);

    if (user) {
      try {
        const response = await fetch(`/api/books/${bookToDelete}`, { method: 'DELETE' });
        if (response.ok) {
          setBooks(books.filter(b => b.id !== bookToDelete));
        }
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }

    setIsDeleting(false);
    setShowDeleteModal(false);
    setBookToDelete(null);
  };

  if (isLoading || authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filters: FilterTab[] = ['all', 'draft', 'preview', 'ordered'];

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Header */}
          <h1 className={styles.title}>{t('header.title')}</h1>

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            {filters.map((filter) => (
              <button
                key={filter}
                className={`${styles.filterTab} ${activeFilter === filter ? styles.filterTabActive : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {t(`filters.${filter}`, filter.charAt(0).toUpperCase() + filter.slice(1))}
                {filterCounts[filter] > 0 && (
                  <span className={styles.filterCount}>{filterCounts[filter]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Book Grid or Empty State */}
          {filteredBooks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <img src="/media/logo.png" alt="No books" className={styles.emptyIcon} />
              </div>
              <h2 className={styles.emptyTitle}>
                {activeFilter === 'all' ? t('empty.title') : t('empty.filteredTitle', 'No books in this category')}
              </h2>
              <p className={styles.emptyText}>
                {activeFilter === 'all' ? t('empty.subtitle') : t('empty.filteredSubtitle', 'Try a different filter or create a new book')}
              </p>
              {activeFilter === 'all' && (
                <button
                  className={styles.createButton}
                  onClick={() => router.push('/create')}
                >
                  {t('empty.button')}
                </button>
              )}
            </div>
          ) : (
            <BookGrid
              books={filteredBooks}
              onDeleteBook={handleDeleteBook}
              orderMap={orderMap}
              showAddNew={false}
            />
          )}
        </div>

        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteBook}
          title={t('deleteModal.title')}
          message={t('deleteModal.message')}
          confirmText={t('deleteModal.confirmText')}
          isLoading={isDeleting}
        />
      </main>
    </>
  );
}
