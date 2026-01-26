'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/lib/types';
import styles from './BookGrid.module.css';

interface BookGridProps {
  books: Book[];
  onDeleteBook?: (bookId: string, e: React.MouseEvent) => void;
  showAddNew?: boolean;
}

export function BookGrid({ books, onDeleteBook, showAddNew = true }: BookGridProps) {
  const router = useRouter();
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
            {/* 3D Book Object */}
            <div className={styles.book3DContainer}>
              <div className={styles.book3D}>
                {/* Back Cover */}
                <div
                  className={styles.book3DBack}
                  style={{ backgroundColor: themeColor }}
                ></div>

                {/* Pages faces */}
                <div className={styles.bookPagesTop}></div>
                <div className={styles.bookPagesRight}></div>
                <div className={styles.bookPagesBottom}></div>

                {/* Spine */}
                <div
                  className={styles.book3DSpine}
                  style={{
                    backgroundColor: getBookColorSecondary(book.settings.bookTheme)
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
                  <div className={styles.bookTexture}></div>
                  <div className={styles.book3DFrontContent}>
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
              </div>
              <div className={styles.book3DShadow}></div>
            </div>

            {/* Simple Clean Meta (Below Book) */}
            <div className={styles.bookMeta}>
              <h4 className={styles.metaTitle}>{book.settings.title || "Untitled Book"}</h4>
              <p className={styles.metaSubtitle}>For {book.settings.childName}</p>

              <div className={styles.metaActions}>
                {onDeleteBook && (
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => onDeleteBook(book.id, e)}
                    title="Delete book"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Add New Book Card */}
      {showAddNew && (
        <div
          className={`${styles.addNewCard}`}
          onClick={handleCreateNew}
        >
          <div className={styles.addNewContent}>
            <span className={styles.plusIcon}>+</span>
            <span className={styles.addNewText}>Create New Book</span>
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
