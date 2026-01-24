'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Book } from '@/lib/types';
import styles from './BookGrid.module.css';

interface BookGridProps {
  books: Book[];
  onDeleteBook?: (bookId: string, e: React.MouseEvent) => void;
  showAddNew?: boolean;
}

export function BookGrid({ books, onDeleteBook, showAddNew = true }: BookGridProps) {
  const router = useRouter();
  const { t } = useTranslation('home');
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);

  const handleViewBook = (bookId: string) => {
    setOpeningBookId(bookId);
    setTimeout(() => {
      router.push(`/book/${bookId}`);
    }, 500);
  };

  const handleEditBook = (bookId: string) => {
    router.push(`/create/${bookId}`);
  };

  const handleCreateNew = () => {
    router.push('/create');
  };

  return (
    <div className={styles.booksGrid}>
      {books.map((book, index) => {
        const coverImage = getBookCoverImage(book);
        const themeColor = getBookColor(book.settings.bookTheme);

        return (
          <div
            key={book.id}
            className={`${styles.bookItem} ${openingBookId === book.id ? styles.isOpening : ''}`}
            onClick={() => handleViewBook(book.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* 3D Book Container */}
            <div className={styles.book3DContainer}>
              <div className={styles.book3D}>
                {/* Spine */}
                <div
                  className={styles.book3DSpine}
                  style={{
                    background: `linear-gradient(90deg, ${getBookColorSecondary(book.settings.bookTheme)} 0%, ${themeColor} 100%)`
                  }}
                ></div>

                {/* Front Cover */}
                <div
                  className={styles.book3DFront}
                  style={{
                    background: coverImage
                      ? `url(${coverImage}) center/cover`
                      : `linear-gradient(135deg, ${themeColor} 0%, ${getBookColorSecondary(book.settings.bookTheme)} 100%)`
                  }}
                >
                  {!coverImage && (
                    <>
                      <span className={styles.book3DEmoji}>
                        {getBookEmoji(book.settings.bookType)}
                      </span>
                      <span className={styles.book3DTitle}>
                        {book.settings.title}
                      </span>
                    </>
                  )}
                  <div className={styles.bookCoverOverlay}></div>
                </div>
              </div>
              <div className={styles.book3DShadow}></div>
            </div>

            {/* Book Info */}
            <div className={styles.bookItemInfo}>
              <div className={styles.bookMetaTop}>
                <h3 className={styles.bookCardTitle}>
                  {book.settings.title || `${book.settings.childName}'s Book`}
                </h3>
                <span className={styles.pageCountBadge}>
                  {t('bookCard.pages', { count: book.pages.length })}
                </span>
              </div>

              <p className={styles.bookCardMeta}>
                {t('bookCard.forChild', { childName: book.settings.childName, age: book.settings.childAge })}
              </p>

              <div className={styles.bookItemActions}>
                <span className={`${styles.statusBadge} ${styles[book.status]}`}>
                  {t(`bookCard.status.${book.status}`)}
                </span>
                <div className={styles.actionButtons}>
                  {/* Edit Button Removed - Viewer has its own edit mode */}
                  {onDeleteBook && (
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => onDeleteBook(book.id, e)}
                      aria-label="Delete book"
                      title="Delete book"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add New Book Card */}
      {showAddNew && (
        <div
          className={`${styles.bookCard} ${styles.addNew}`}
          onClick={handleCreateNew}
        >
          <div className={styles.addNewContent}>
            <span className={styles.addIcon}>+</span>
            <span className={styles.addText}>Create New Book</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getBookColor(theme: string): string {
  const colors: Record<string, string> = {
    adventure: '#f97316',
    bedtime: '#6366f1',
    learning: '#10b981',
    fantasy: '#ec4899',
    animals: '#f59e0b',
    custom: '#6366f1'
  };
  return colors[theme] || '#6366f1';
}

function getBookColorSecondary(theme: string): string {
  const colors: Record<string, string> = {
    adventure: '#eab308',
    bedtime: '#8b5cf6',
    learning: '#06b6d4',
    fantasy: '#a855f7',
    animals: '#84cc16',
    custom: '#ec4899'
  };
  return colors[theme] || '#ec4899';
}

function getBookEmoji(type: string): string {
  const emojis: Record<string, string> = {
    board: '📘',
    picture: '🎨',
    story: '📖',
    alphabet: '🔤'
  };
  return emojis[type] || '📚';
}

function getBookCoverImage(book: Book) {
  const coverPage = book.pages[0];
  if (!coverPage) return null;

  if (coverPage.imageElements && coverPage.imageElements.length > 0 && coverPage.imageElements[0].src) {
    return coverPage.imageElements[0].src;
  }
  // @ts-ignore
  if (coverPage.backgroundImage || coverPage.background_image) {
    // @ts-ignore
    return coverPage.backgroundImage || coverPage.background_image;
  }
  return null;
}
