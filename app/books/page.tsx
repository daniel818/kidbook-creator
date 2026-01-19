'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/lib/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import { BookGrid } from '@/components/BookGrid';
import { ConfirmModal } from '@/components/ConfirmModal';
import styles from './books.module.css';

export default function BooksPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBooks = useCallback(async () => {
    if (authLoading) return;

    setIsLoading(true);

    if (user) {
      try {
        const response = await fetch('/api/books');
        if (response.ok) {
          const data = await response.json();
          setBooks(data);
        } else {
          console.error('Failed to fetch books');
          setBooks([]);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
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

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.icon}>📚</span>
            My Books
          </h1>
          <p className={styles.subtitle}>
            {books.length} {books.length === 1 ? 'book' : 'books'} created
          </p>
        </div>

        {books.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📚</span>
            <h2 className={styles.emptyTitle}>No books yet</h2>
            <p className={styles.emptyText}>
              Create your first personalized children's book
            </p>
            <button
              className={styles.createButton}
              onClick={() => router.push('/create')}
            >
              Create Your First Book
            </button>
          </div>
        ) : (
          <BookGrid 
            books={books} 
            onDeleteBook={handleDeleteBook}
            showAddNew={true}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteBook}
        title="Delete Book"
        message="Are you sure you want to delete this book? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
      </main>
    </>
  );
}
